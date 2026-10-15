/**
 * One-time repair: fix stuck "pending" transfer transactions whose
 * transfers were already approved/rejected by admin.
 *
 * Background: older Transaction documents were created without a persisted
 * 'reference' field (it wasn't in the schema), so approveTransfer's
 * `Transaction.findOneAndUpdate({ reference: transfer._id })` never matched
 * and the transaction stayed 'pending' forever.
 *
 * Usage:
 *   node scripts/fixStuckTransferTransactions.js          # DRY RUN (no writes)
 *   node scripts/fixStuckTransferTransactions.js --apply  # apply the fixes
 */
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const connectDB = require('../config/database');
const Transfer = require('../models/Transfer');
const Transaction = require('../models/Transaction');

const APPLY = process.argv.includes('--apply');

// Map transfer end-state -> the transaction status it should show
const statusMap = {
  completed: 'completed',
  rejected: 'failed',
  failed: 'failed',
  cancelled: 'failed'
};

const findLinkedTransaction = async (transfer) => {
  // 1) Exact link (works for transactions created after the schema fix)
  let tx = await Transaction.findOne({ reference: transfer._id, status: 'pending' });
  if (tx) return { tx, via: 'reference' };

  // 2) Legacy fallback: same type/amount/sender account, created within
  //    2 minutes of the transfer (they are written in the same request)
  const srcId = transfer.sourceAccount || (transfer.sender && transfer.sender.account);
  const start = new Date(new Date(transfer.createdAt).getTime() - 2 * 60 * 1000);
  const end = new Date(new Date(transfer.createdAt).getTime() + 2 * 60 * 1000);
  tx = await Transaction.findOne({
    type: 'transfer',
    status: 'pending',
    amount: transfer.amount,
    ...(srcId ? { 'sender.account': srcId } : {}),
    createdAt: { $gte: start, $lte: end }
  });
  return tx ? { tx, via: 'legacy-match' } : null;
};

const run = async () => {
  await connectDB();

  const transfers = await Transfer.find({
    status: { $in: ['completed', 'rejected', 'failed', 'cancelled'] }
  }).sort({ createdAt: -1 });

  console.log(`Mode: ${APPLY ? 'APPLY (writes enabled)' : 'DRY RUN (no writes)'}`);
  console.log(`Checking ${transfers.length} already-processed transfers...\n`);

  let fixed = 0;
  let unmatched = 0;

  for (const transfer of transfers) {
    const targetStatus = statusMap[transfer.status];
    if (!targetStatus) continue;

    const match = await findLinkedTransaction(transfer);
    if (!match) {
      unmatched++;
      continue;
    }

    const label =
      `${transfer.transferId || transfer._id} [${transfer.status}] <- tx ` +
      `${match.tx.transactionId} $${match.tx.amount} (via ${match.via})`;

    if (APPLY) {
      match.tx.status = targetStatus;
      if (targetStatus === 'completed') {
        match.tx.completedAt = transfer.completedAt || transfer.processedAt || new Date();
      }
      await match.tx.save();
      console.log('FIXED:   ' + label);
    } else {
      console.log('WOULD FIX: ' + label);
    }
    fixed++;
  }

  console.log(`\nDone. ${APPLY ? 'Fixed' : 'Would fix'}: ${fixed}`);
  console.log(`Processed transfers with no pending transaction found (already consistent): ${unmatched}`);
  await mongoose.disconnect();
  process.exit(0);
};

run().catch((e) => {
  console.error('ERROR:', e.message);
  process.exit(1);
});
