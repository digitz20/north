const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const connectDB = require('../config/database');

const BENEFICIARIES = [
  {
    name: 'Sarah Mitchell',
    email: 'sarah.mitchell@email.com',
    phone: '(212) 555-0147',
    address: { street: '128 Madison Ave', city: 'New York', state: 'NY', zipCode: '10016', country: 'USA' },
    bankName: 'JPMorgan Chase Bank',
    accountNumber: '421456783902',
    routingNumber: '021000021',
    relationship: 'family',
    isFavorite: true,
    transferType: 'same-bank',
    note: 'Local same-bank transfer'
  },
  {
    name: 'James Rodriguez',
    email: 'james.rodriguez@email.com',
    phone: '(305) 555-0198',
    address: { street: '450 Brickell Ave', city: 'Miami', state: 'FL', zipCode: '33131', country: 'USA' },
    bankName: 'Bank of America',
    accountNumber: '893341005621',
    routingNumber: '026009593',
    relationship: 'business',
    isFavorite: false,
    transferType: 'external',
    note: 'Wire transfer'
  },
  {
    name: 'Emily Chen',
    email: 'emily.chen@email.com',
    phone: '(628) 555-0163',
    address: { street: '77 Beale St', city: 'San Francisco', state: 'CA', zipCode: '94105', country: 'USA' },
    bankName: 'Wells Fargo Bank',
    accountNumber: '552190034478',
    routingNumber: '121042882',
    relationship: 'friend',
    isFavorite: true,
    transferType: 'same-bank',
    note: 'Local same-bank transfer'
  },
  {
    name: 'Michael Thompson',
    email: 'm.thompson@email.com',
    phone: '(312) 555-0284',
    address: { street: '225 N Michigan Ave', city: 'Chicago', state: 'IL', zipCode: '60601', country: 'USA' },
    bankName: 'Citibank N.A.',
    accountNumber: '334567891045',
    routingNumber: '021000089',
    relationship: 'business',
    isFavorite: false,
    transferType: 'external',
    note: 'Wire transfer'
  },
  {
    name: 'Jessica Williams',
    email: 'jess.williams@email.com',
    phone: '(214) 555-0339',
    address: { street: '1200 Main St', city: 'Dallas', state: 'TX', zipCode: '75202', country: 'USA' },
    bankName: 'US Bank',
    accountNumber: '778892345610',
    routingNumber: '123456789',
    relationship: 'family',
    isFavorite: true,
    transferType: 'internal',
    note: 'Internal NorthCrest transfer'
  },
  {
    name: 'David Kim',
    email: 'david.kim@email.com',
    phone: '(206) 555-0471',
    address: { street: '600 4th Ave', city: 'Seattle', state: 'WA', zipCode: '98104', country: 'USA' },
    bankName: 'PNC Bank',
    accountNumber: '991234567823',
    routingNumber: '043000096',
    relationship: 'friend',
    isFavorite: false,
    transferType: 'external',
    note: 'Wire transfer'
  },
  {
    name: 'Amanda Foster',
    email: 'amanda.foster@email.com',
    phone: '(678) 555-0582',
    address: { street: '1100 Peachtree St', city: 'Atlanta', state: 'GA', zipCode: '30309', country: 'USA' },
    bankName: 'Truist Bank',
    accountNumber: '445567892134',
    routingNumber: '061000052',
    relationship: 'other',
    isFavorite: false,
    transferType: 'same-bank',
    note: 'Local same-bank transfer'
  },
  {
    name: 'Robert Hayes',
    email: 'r.hayes@email.com',
    phone: '(602) 555-0619',
    address: { street: '200 W Washington St', city: 'Phoenix', state: 'AZ', zipCode: '85003', country: 'USA' },
    bankName: 'Capital One Bank',
    accountNumber: '667890123456',
    routingNumber: '065000090',
    relationship: 'business',
    isFavorite: true,
    transferType: 'external',
    note: 'Wire transfer'
  },
  {
    name: 'Maria Gonzalez',
    email: 'maria.gonzalez@email.com',
    phone: '(719) 555-0723',
    address: { street: '15 N Tejon St', city: 'Colorado Springs', state: 'CO', zipCode: '80903', country: 'USA' },
    bankName: 'First National Bank',
    accountNumber: '223456789012',
    routingNumber: '082000032',
    relationship: 'family',
    isFavorite: true,
    transferType: 'internal',
    note: 'Internal NorthCrest transfer'
  },
  {
    name: 'Kevin O\'Brien',
    email: 'k.obrien@email.com',
    phone: '(503) 555-0834',
    address: { street: '1000 SW Broadway', city: 'Portland', state: 'OR', zipCode: '97205', country: 'USA' },
    bankName: 'U.S. Bank',
    accountNumber: '334567890123',
    routingNumber: '123000220',
    relationship: 'friend',
    isFavorite: false,
    transferType: 'same-bank',
    note: 'Local same-bank transfer'
  },
  {
    name: 'Laura Bennett',
    email: 'laura.bennett@email.com',
    phone: '(702) 555-0945',
    address: { street: '300 S 4th St', city: 'Las Vegas', state: 'NV', zipCode: '89101', country: 'USA' },
    bankName: 'Zions Bank',
    accountNumber: '880123456789',
    routingNumber: '124001544',
    relationship: 'business',
    isFavorite: false,
    transferType: 'external',
    note: 'Wire transfer'
  },
  {
    name: 'Daniel Carter',
    email: 'daniel.carter@email.com',
    phone: '(719) 555-1056',
    address: { street: '90 S Cascade Ave', city: 'Colorado Springs', state: 'CO', zipCode: '80903', country: 'USA' },
    bankName: 'Comerica Bank',
    accountNumber: '112233445566',
    routingNumber: '121137522',
    relationship: 'other',
    isFavorite: false,
    transferType: 'same-bank',
    note: 'Local same-bank transfer'
  },
  {
    name: 'Priya Patel',
    email: 'priya.patel@email.com',
    phone: '(650) 555-1167',
    address: { street: '555 University Ave', city: 'Palo Alto', state: 'CA', zipCode: '94301', country: 'USA' },
    bankName: 'Silicon Valley Bank',
    accountNumber: '998877665544',
    routingNumber: '121140399',
    relationship: 'business',
    isFavorite: true,
    transferType: 'external',
    note: 'Wire transfer'
  },
  {
    name: 'Thomas Wright',
    email: 'tom.wright@email.com',
    phone: '(512) 555-1278',
    address: { street: '200 Congress Ave', city: 'Austin', state: 'TX', zipCode: '78701', country: 'USA' },
    bankName: 'BBVA USA',
    accountNumber: '665544332211',
    routingNumber: '113010590',
    relationship: 'family',
    isFavorite: false,
    transferType: 'internal',
    note: 'Internal NorthCrest transfer'
  },
  {
    name: 'Olivia Martinez',
    email: 'olivia.martinez@email.com',
    phone: '(305) 555-1389',
    address: { street: '800 Brickell Ave', city: 'Miami', state: 'FL', zipCode: '33131', country: 'USA' },
    bankName: 'City National Bank',
    accountNumber: '443322110055',
    routingNumber: '122016005',
    relationship: 'friend',
    isFavorite: true,
    transferType: 'same-bank',
    note: 'Local same-bank transfer'
  },
  {
    name: 'Brian Adams',
    email: 'b.adams@email.com',
    phone: '(614) 555-1490',
    address: { street: '1 Nationwide Blvd', city: 'Columbus', state: 'OH', zipCode: '43215', country: 'USA' },
    bankName: 'Nationwide Bank',
    accountNumber: '778899001122',
    routingNumber: '041000124',
    relationship: 'business',
    isFavorite: false,
    transferType: 'external',
    note: 'Wire transfer'
  },
  {
    name: 'Sophia Nguyen',
    email: 'sophia.nguyen@email.com',
    phone: '(619) 555-1501',
    address: { street: '401 B St', city: 'San Diego', state: 'CA', zipCode: '92101', country: 'USA' },
    bankName: 'Union Bank',
    accountNumber: '556677889900',
    routingNumber: '122000496',
    relationship: 'other',
    isFavorite: false,
    transferType: 'same-bank',
    note: 'Local same-bank transfer'
  },
  {
    name: 'Christopher Lee',
    email: 'chris.lee@email.com',
    phone: '(206) 555-1612',
    address: { street: '1500 4th Ave', city: 'Seattle', state: 'WA', zipCode: '98101', country: 'USA' },
    bankName: 'Banner Bank',
    accountNumber: '223344556677',
    routingNumber: '123000058',
    relationship: 'friend',
    isFavorite: true,
    transferType: 'external',
    note: 'Wire transfer'
  },
  {
    name: 'Rachel Moore',
    email: 'rachel.moore@email.com',
    phone: '(480) 555-1723',
    address: { street: '2200 N Central Ave', city: 'Phoenix', state: 'AZ', zipCode: '85004', country: 'USA' },
    bankName: 'MidFirst Bank',
    accountNumber: '889900112233',
    routingNumber: '104000016',
    relationship: 'family',
    isFavorite: false,
    transferType: 'internal',
    note: 'Internal NorthCrest transfer'
  },
  {
    name: 'Andrew Taylor',
    email: 'a.taylor@email.com',
    phone: '(503) 555-1834',
    address: { street: '505 SW Morrison St', city: 'Portland', state: 'OR', zipCode: '97204', country: 'USA' },
    bankName: 'Columbia State Bank',
    accountNumber: '112258639741',
    routingNumber: '123170652',
    relationship: 'business',
    isFavorite: true,
    transferType: 'same-bank',
    note: 'Local same-bank transfer'
  },
  {
    name: 'Nicole Brown',
    email: 'nicole.brown@email.com',
    phone: '(702) 555-1945',
    address: { street: '400 S Maryland Pkwy', city: 'Las Vegas', state: 'NV', zipCode: '89101', country: 'USA' },
    bankName: 'Bank of the West',
    accountNumber: '665542187309',
    routingNumber: '121042111',
    relationship: 'other',
    isFavorite: false,
    transferType: 'external',
    note: 'Wire transfer'
  }
];

async function seed() {
  try {
    await connectDB();
    console.log('Connected to MongoDB');

    const Beneficiary = mongoose.models.Beneficiary || require('../models/Beneficiary');
    const Account = mongoose.models.Account || require('../models/Account');
    const User = mongoose.models.User || require('../models/User');

    // Use Alaekeka Ebuka as the owner of all seed beneficiaries
    const owner = await User.findOne({ email: 'alaekekaebuka200@gmail.com' });
    if (!owner) {
      console.error('Owner user not found. Please ensure the user exists.');
      process.exit(1);
    }
    console.log('Using owner user:', owner.firstName, owner.lastName, owner._id);

    // Find existing accounts for internal beneficiary linking
    const allAccounts = await Account.find({}).populate('user', 'firstName lastName email').lean();
    console.log('Existing accounts:', allAccounts.length);

    // Build internal beneficiary entries using real internal accounts
    const internalAccountMap = new Map();
    for (const acc of allAccounts) {
      if (acc.user && acc.user._id.toString() !== owner._id.toString()) {
        const key = acc.user._id.toString();
        if (!internalAccountMap.has(key)) {
          internalAccountMap.set(key, acc);
        }
      }
    }
    console.log('Internal accounts available for linking:', internalAccountMap.size);

    const beneficiariesToInsert = [];
    const usedAccountKeys = new Set();

    for (const b of BENEFICIARIES) {
      const isInternal = b.transferType === 'internal';
      const recipient = isInternal ? [...internalAccountMap.values()].find(acc => !usedAccountKeys.has(acc.user._id.toString())) || [...internalAccountMap.values()][0] : null;

      if (isInternal && recipient) {
        usedAccountKeys.add(recipient.user._id.toString());
      }

      const beneficiaryData = {
        user: owner._id,
        name: b.name,
        email: b.email,
        phone: b.phone,
        bankName: b.bankName,
        accountNumber: b.accountNumber,
        routingNumber: b.routingNumber,
        relationship: b.relationship,
        isFavorite: b.isFavorite,
        isInternal: isInternal && !!recipient,
        verificationMethod: isInternal ? 'instant' : 'manual',
        isVerified: isInternal && !!recipient
      };

      if (isInternal && recipient) {
        beneficiaryData.internalUser = recipient.user._id;
        beneficiaryData.internalAccount = recipient._id;
      }

      beneficiariesToInsert.push(beneficiaryData);
    }

    const result = await Beneficiary.insertMany(beneficiariesToInsert, { ordered: true });
    console.log(`Successfully inserted ${result.length} beneficiaries`);

    console.log('\n=== BENEFICIARY SUMMARY ===');
    result.forEach((b, i) => {
      console.log(`${i + 1}. ${b.name} | ${b.bankName} | Acct: ${b.accountNumber} | Routing: ${b.routingNumber} | Type: ${b.isInternal ? 'INTERNAL' : 'EXTERNAL'} | Verified: ${b.isVerified}`);
    });

    console.log('\nSeeding completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  }
}

seed();
