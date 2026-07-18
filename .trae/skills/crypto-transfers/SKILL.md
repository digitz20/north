---
name: "crypto-transfers"
description: "Implements crypto wallet withdrawals, deposits, and address validation. Invoke when user asks to add crypto transfer functionality or implement bank/crypto withdrawals."
---

# Crypto Transfer Skill

This skill adds comprehensive crypto and bank transfer capabilities:
- Bank account withdrawals
- Crypto account withdrawals/deposits
- Wallet address validation
- Email notifications for transfers
- Transfer confirmation with QR codes/images

## Usage
1. Create a CryptoTransfers page
2. Add address validation for both bank and crypto addresses
3. Implement email notifications system
4. Add transfer confirmation UI with QR codes
5. Integrate with existing Redux store for transaction history