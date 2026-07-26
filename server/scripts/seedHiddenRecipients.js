const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const connectDB = require('../config/database');
const HiddenRecipient = require('../models/HiddenRecipient');

const HIDDEN_RECIPIENTS = [
  {
    name: 'Zephyrian Kaelthas',
    email: 'zephyrian.kaelthas@proton.me',
    phone: '(302) 555-0192',
    address: { street: '88 Waverly Pl', city: 'Newark', state: 'DE', zipCode: '19711', country: 'USA' },
    bankName: 'JPMorgan Chase Bank',
    accountNumber: '481927365402',
    routingNumber: '021000021',
    transferType: 'bank',
    note: 'Rare beneficiary - bank transfer'
  },
  {
    name: 'Cassiopée Delacroix',
    email: 'cassiopea.delacroix@outlook.fr',
    phone: '(510) 555-0234',
    address: { street: '2000 Broadway', city: 'Oakland', state: 'CA', zipCode: '94612', country: 'USA' },
    bankName: 'Bank of America',
    accountNumber: '739182645093',
    routingNumber: '026009593',
    transferType: 'wire',
    note: 'Rare beneficiary - wire transfer'
  },
  {
    name: 'Thaddeus Blackwood',
    email: 'thaddeus.b@mail.com',
    phone: '(503) 555-0345',
    address: { street: '1122 NW Glisan St', city: 'Portland', state: 'OR', zipCode: '97209', country: 'USA' },
    bankName: 'Wells Fargo Bank',
    accountNumber: '928374651024',
    routingNumber: '121042882',
    transferType: 'local',
    note: 'Rare beneficiary - local transfer'
  },
  {
    name: 'Elowen Pendleton',
    email: 'elowen.pendleton@icloud.com',
    phone: '(602) 555-0456',
    address: { street: '4001 N Central Ave', city: 'Phoenix', state: 'AZ', zipCode: '85012', country: 'USA' },
    bankName: 'Citibank N.A.',
    accountNumber: '564382917403',
    routingNumber: '021000089',
    transferType: 'wire',
    note: 'Rare beneficiary - wire transfer'
  },
  {
    name: 'Orlanthas Voss',
    email: 'orlanthas.v@fastmail.com',
    phone: '(206) 555-0567',
    address: { street: '1500 1st Ave', city: 'Seattle', state: 'WA', zipCode: '98101', country: 'USA' },
    bankName: 'US Bank',
    accountNumber: '102938475612',
    routingNumber: '123456789',
    transferType: 'bank',
    note: 'Rare beneficiary - bank transfer'
  },
  {
    name: 'Ninette Beaumont',
    email: 'ninette.b@yahoo.es',
    phone: '(305) 555-0678',
    address: { street: '900 SW 1st St', city: 'Miami', state: 'FL', zipCode: '33130', country: 'USA' },
    bankName: 'PNC Bank',
    accountNumber: '837465920134',
    routingNumber: '043000096',
    transferType: 'local',
    note: 'Rare beneficiary - local transfer'
  },
  {
    name: 'Peregrin Thistlewaite',
    email: 'peregrin.t@aol.com',
    phone: '(312) 555-0789',
    address: { street: '233 S Wacker Dr', city: 'Chicago', state: 'IL', zipCode: '60606', country: 'USA' },
    bankName: 'Truist Bank',
    accountNumber: '291837465503',
    routingNumber: '061000052',
    transferType: 'wire',
    note: 'Rare beneficiary - wire transfer'
  },
  {
    name: 'Isolde Marchetti',
    email: 'isolde.m@libero.it',
    phone: '(214) 555-0890',
    address: { street: '325 N Saint Paul St', city: 'Dallas', state: 'TX', zipCode: '75201', country: 'USA' },
    bankName: 'Capital One Bank',
    accountNumber: '746591823407',
    routingNumber: '065000090',
    transferType: 'bank',
    note: 'Rare beneficiary - bank transfer'
  },
  {
    name: 'Cosimo Valerius',
    email: 'cosimo.v@poste.it',
    phone: '(719) 555-0901',
    address: { street: '2 S Tejon St', city: 'Colorado Springs', state: 'CO', zipCode: '80903', country: 'USA' },
    bankName: 'First National Bank',
    accountNumber: '358192746510',
    routingNumber: '082000032',
    transferType: 'local',
    note: 'Rare beneficiary - local transfer'
  },
  {
    name: 'Mireille Beauregard',
    email: 'mireille.b@wlan-mail.net',
    phone: '(628) 555-1012',
    address: { street: '465 California St', city: 'San Francisco', state: 'CA', zipCode: '94104', country: 'USA' },
    bankName: 'U.S. Bank',
    accountNumber: '920173846524',
    routingNumber: '123000220',
    transferType: 'wire',
    note: 'Rare beneficiary - wire transfer'
  },
  {
    name: 'Leontius Asher',
    email: 'leontius.asher@yandex.ru',
    phone: '(702) 555-1123',
    address: { street: '3667 S Las Vegas Blvd', city: 'Las Vegas', state: 'NV', zipCode: '89109', country: 'USA' },
    bankName: 'Zions Bank',
    accountNumber: '184736295041',
    routingNumber: '124001544',
    transferType: 'bank',
    note: 'Rare beneficiary - bank transfer'
  },
  {
    name: 'Aurelian Chastain',
    email: 'aurelian.c@gmx.net',
    phone: '(512) 555-1234',
    address: { street: '401 Congress Ave', city: 'Austin', state: 'TX', zipCode: '78701', country: 'USA' },
    bankName: 'Comerica Bank',
    accountNumber: '659284173902',
    routingNumber: '121137522',
    transferType: 'local',
    note: 'Rare beneficiary - local transfer'
  },
  {
    name: 'Ondine Vauquelin',
    email: 'ondine.v@free.fr',
    phone: '(480) 555-1345',
    address: { street: '2200 E Camelback Rd', city: 'Phoenix', state: 'AZ', zipCode: '85016', country: 'USA' },
    bankName: 'Silicon Valley Bank',
    accountNumber: '472918365708',
    routingNumber: '121140399',
    transferType: 'wire',
    note: 'Rare beneficiary - wire transfer'
  },
  {
    name: 'Thierry Amalfitano',
    email: 'thierry.a@orange.fr',
    phone: '(619) 555-1456',
    address: { street: '750 B St', city: 'San Diego', state: 'CA', zipCode: '92101', country: 'USA' },
    bankName: 'BBVA USA',
    accountNumber: '315768492018',
    routingNumber: '113010590',
    transferType: 'bank',
    note: 'Rare beneficiary - bank transfer'
  },
  {
    name: 'Seraphina Duchamps',
    email: 'seraphina.d@laposte.net',
    phone: '(678) 555-1567',
    address: { street: '275 Peachtree St', city: 'Atlanta', state: 'GA', zipCode: '30303', country: 'USA' },
    bankName: 'City National Bank',
    accountNumber: '958374621049',
    routingNumber: '122016005',
    transferType: 'local',
    note: 'Rare beneficiary - local transfer'
  },
  {
    name: 'Balthazar Loeven',
    email: 'balthazar.l@tutanota.de',
    phone: '(614) 555-1678',
    address: { street: '1 Nationwide Blvd', city: 'Columbus', state: 'OH', zipCode: '43215', country: 'USA' },
    bankName: 'Nationwide Bank',
    accountNumber: '603918274635',
    routingNumber: '041000124',
    transferType: 'wire',
    note: 'Rare beneficiary - wire transfer'
  },
  {
    name: 'Gisèle Montreuil',
    email: 'gisele.m@protonmail.com',
    phone: '(216) 555-1789',
    address: { street: '200 Public Square', city: 'Cleveland', state: 'OH', zipCode: '44113', country: 'USA' },
    bankName: 'Union Bank',
    accountNumber: '827364950172',
    routingNumber: '122000496',
    transferType: 'bank',
    note: 'Rare beneficiary - bank transfer'
  },
  {
    name: 'Emeric Landry',
    email: 'emeric.landry@mailfence.com',
    phone: '(503) 555-1890',
    address: { street: '805 SW Broadway', city: 'Portland', state: 'OR', zipCode: '97205', country: 'USA' },
    bankName: 'Banner Bank',
    accountNumber: '174928365704',
    routingNumber: '123000058',
    transferType: 'local',
    note: 'Rare beneficiary - local transfer'
  },
  {
    name: 'Valentina Aldobrandini',
    email: 'valentina.a@alice.it',
    phone: '(480) 555-1901',
    address: { street: '2401 E Camelback Rd', city: 'Phoenix', state: 'AZ', zipCode: '85016', country: 'USA' },
    bankName: 'MidFirst Bank',
    accountNumber: '492836175038',
    routingNumber: '104000016',
    transferType: 'wire',
    note: 'Rare beneficiary - wire transfer'
  },
  {
    name: 'Lysander Whitcomb',
    email: 'lysander.w@mail.ru',
    phone: '(702) 555-2012',
    address: { street: '400 S Maryland Pkwy', city: 'Las Vegas', state: 'NV', zipCode: '89101', country: 'USA' },
    bankName: 'Bank of the West',
    accountNumber: '716293845621',
    routingNumber: '121042111',
    transferType: 'bank',
    note: 'Rare beneficiary - bank transfer'
  }
];

async function seed() {
  try {
    await connectDB();
    console.log('Connected to MongoDB');

    // Clean existing hidden recipients
    await HiddenRecipient.deleteMany({});
    console.log('Cleaned existing hidden recipients');

    const result = await HiddenRecipient.insertMany(HIDDEN_RECIPIENTS, { ordered: true });
    console.log(`Successfully inserted ${result.length} hidden recipients`);

    console.log('\n=== HIDDEN BENEFICIARY LIST (NOT visible in UI) ===');
    result.forEach((r, i) => {
      console.log(`${i + 1}. ${r.name} | ${r.bankName} | Acct: ${r.accountNumber} | Routing: ${r.routingNumber} | ${r.transferType.toUpperCase()} | ${r.address.city}, ${r.address.state}`);
    });

    console.log('\nSeeding completed successfully! These are NOT visible in the beneficiary dropdown or admin panel.');
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  }
}

seed();
