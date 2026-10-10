const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Donation = require('../models/Donation');
const Assignment = require('../models/Assignment');
const DistributionLog = require('../models/DistributionLog');
const Notification = require('../models/Notification');

dotenv.config();
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/sharemymeal';

const seedDatabase = async () => {
  try {
    console.log(`📡 Connecting to MongoDB: ${MONGO_URI}`);
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected!\n');

    // ─── 1. USERS ──────────────────────────────────────────────
    console.log('👤 Seeding users...');
    const userSeed = [
      { name: 'Grand Palace Hotel',     email: 'donor@sharemymeal.com', password: 'password123', role: 'DONOR', phone: '9876543210', address: 'Road No. 12, Banjara Hills, Hyderabad' },
      { name: 'Sunset Restaurant',      email: 'donor2@sharemymeal.com', password: 'password123', role: 'DONOR', phone: '9876543211', address: 'Jubilee Hills, Hyderabad' },
      { name: 'Food For All Foundation', email: 'ngo@sharemymeal.com', password: 'password123', role: 'NGO', phone: '9123456789', address: 'Secunderabad, Hyderabad', organizationName: 'Food For All Foundation', registrationNumber: 'NGO-HYD-2024-001', isApproved: true },
      { name: 'Hope Relief Society',    email: 'ngo2@sharemymeal.com', password: 'password123', role: 'NGO', phone: '9123456790', address: 'Kukatpally, Hyderabad', organizationName: 'Hope Relief Society', registrationNumber: 'NGO-HYD-2024-002', isApproved: false },
      { name: 'System Admin',           email: 'admin@sharemymeal.com', password: 'password123', role: 'ADMIN', phone: '9000000000', address: 'Admin HQ, Hyderabad', isApproved: true },
    ];

    const createdUsers = {};
    for (const u of userSeed) {
      let user = await User.findOne({ email: u.email });
      if (!user) {
        // For NGO, set isApproved before schema default kicks in
        const data = { ...u };
        if (u.role === 'NGO') data.isApproved = u.isApproved !== undefined ? u.isApproved : false;
        user = await User.create(data);
        console.log(`  ✅ Created: ${u.email} [${u.role}]`);
      } else {
        console.log(`  ℹ️  Exists: ${u.email} [${u.role}]`);
      }
      createdUsers[u.email] = user;
    }

    // Force-update isApproved for NGO seed (in case it already existed)
    for (const u of userSeed) {
      if (u.role === 'NGO' && u.isApproved !== undefined) {
        await User.findOneAndUpdate({ email: u.email }, { isApproved: u.isApproved });
      }
    }

    const donor1 = createdUsers['donor@sharemymeal.com'];
    const donor2 = createdUsers['donor2@sharemymeal.com'];
    const ngo1   = createdUsers['ngo@sharemymeal.com'];

    // ─── 2. DONATIONS ──────────────────────────────────────────
    console.log('\n🍲 Seeding donations...');
    const now = new Date();
    const inHours = (h) => new Date(now.getTime() + h * 3600 * 1000);
    const daysAgo  = (d) => new Date(now.getTime() - d * 86400 * 1000);

    const donationSeed = [
      { donorId: donor1._id, foodName: 'Vegetable Biryani Trays', category: 'RICE', quantity: 50, unit: 'MEALS', description: 'Freshly made veg biryani with raita', expiryTime: inHours(4), pickupAddress: 'Road No. 12, Banjara Hills', pickupCity: 'Hyderabad', status: 'AVAILABLE' },
      { donorId: donor1._id, foodName: 'Paneer Butter Masala + Roti', category: 'CURRY', quantity: 30, unit: 'MEALS', description: 'Event leftovers, sealed containers', expiryTime: inHours(3), pickupAddress: 'Road No. 12, Banjara Hills', pickupCity: 'Hyderabad', status: 'AVAILABLE' },
      { donorId: donor2._id, foodName: 'Assorted Bakery Items', category: 'BAKERY', quantity: 80, unit: 'PACKETS', description: 'Bread loaves, pastries, muffins', expiryTime: inHours(6), pickupAddress: 'Jubilee Hills Rd, Hyderabad', pickupCity: 'Hyderabad', status: 'CLAIMED', claimedBy: ngo1._id, claimedAt: new Date() },
      { donorId: donor1._id, foodName: 'Mixed Fruit Boxes', category: 'FRUITS', quantity: 20, unit: 'BOXES', description: 'Fresh seasonal fruits', expiryTime: inHours(8), pickupAddress: 'Road No. 12, Banjara Hills', pickupCity: 'Hyderabad', status: 'AVAILABLE' },
      { donorId: donor2._id, foodName: 'White Rice & Dal Meals', category: 'RICE', quantity: 100, unit: 'MEALS', description: 'Packed in sealed foil containers', expiryTime: daysAgo(1), pickupAddress: 'Jubilee Hills', pickupCity: 'Hyderabad', status: 'DISTRIBUTED', claimedBy: ngo1._id, claimedAt: daysAgo(2) },
    ];

    const createdDonations = [];
    const existingDonations = await Donation.find({ donorId: { $in: [donor1._id, donor2._id] } }).limit(1);

    if (existingDonations.length === 0) {
      for (const d of donationSeed) {
        const donation = await Donation.create(d);
        createdDonations.push(donation);
        console.log(`  ✅ Created donation: ${d.foodName} [${d.status}]`);
      }
    } else {
      console.log('  ℹ️  Donations already exist, skipping');
      createdDonations.push(...await Donation.find({ donorId: { $in: [donor1._id, donor2._id] } }));
    }

    // ─── 3. ASSIGNMENTS ────────────────────────────────────────
    console.log('\n📋 Seeding assignments...');
    const existingAssign = await Assignment.find({ ngoId: ngo1._id }).limit(1);

    let assignment1 = null;
    if (existingAssign.length === 0) {
      const claimedDonation = createdDonations.find(d => d.status === 'CLAIMED');
      const distDonation    = createdDonations.find(d => d.status === 'DISTRIBUTED');

      if (claimedDonation) {
        assignment1 = await Assignment.create({ donationId: claimedDonation._id, donorId: claimedDonation.donorId, ngoId: ngo1._id, status: 'CLAIMED', claimedAt: new Date() });
        console.log(`  ✅ Assignment created: CLAIMED`);
      }
      if (distDonation) {
        const a2 = await Assignment.create({ donationId: distDonation._id, donorId: distDonation.donorId, ngoId: ngo1._id, status: 'DISTRIBUTED', claimedAt: daysAgo(2), collectedAt: daysAgo(1), distributedAt: new Date() });
        console.log(`  ✅ Assignment created: DISTRIBUTED`);

        // ─── 4. DISTRIBUTION LOGS ────────────────────────────────
        console.log('\n📦 Seeding distribution logs...');
        const existingLogs = await DistributionLog.find({ ngoId: ngo1._id }).limit(1);
        if (existingLogs.length === 0) {
          await DistributionLog.create({
            donationId: distDonation._id, assignmentId: a2._id, ngoId: ngo1._id,
            quantityDistributed: 95, peopleServed: 95,
            distributionDate: new Date(), location: 'Community Center, Secunderabad',
            remarks: 'Distributed smoothly. Families very grateful.',
          });
          console.log(`  ✅ Distribution log created`);
        } else {
          console.log('  ℹ️  Distribution logs already exist, skipping');
        }
      }
    } else {
      console.log('  ℹ️  Assignments already exist, skipping');
      assignment1 = existingAssign[0];
    }

    // ─── 5. NOTIFICATIONS ──────────────────────────────────────
    console.log('\n🔔 Seeding notifications...');
    const existingNotif = await Notification.find({ userId: donor1._id }).limit(1);
    if (existingNotif.length === 0) {
      const notifSeed = [
        { userId: donor1._id, title: 'Donation Claimed!', message: 'Food For All Foundation claimed your "Assorted Bakery Items" donation. They will collect it shortly.', type: 'DONATION_CLAIMED', isRead: false },
        { userId: donor1._id, title: 'Donation Distributed!', message: 'Your "White Rice & Dal Meals" was distributed to 95 people at Community Center, Secunderabad.', type: 'DONATION_DISTRIBUTED', isRead: true },
        { userId: ngo1._id,  title: 'New Donation Available!', message: 'Grand Palace Hotel posted "Vegetable Biryani Trays" (50 Meals) near Banjara Hills. Claim before it expires!', type: 'NEW_DONATION', isRead: false },
        { userId: ngo1._id,  title: 'New Donation Available!', message: 'Sunset Restaurant posted "Mixed Fruit Boxes" (20 Boxes) near Jubilee Hills.', type: 'NEW_DONATION', isRead: false },
      ];
      await Notification.insertMany(notifSeed);
      console.log(`  ✅ ${notifSeed.length} notifications created`);
    } else {
      console.log('  ℹ️  Notifications already exist, skipping');
    }

    // ─── Summary ───────────────────────────────────────────────
    console.log('\n════════════════════════════════════════');
    console.log('🎉 Database seeded successfully!');
    console.log('Database   : sharemymeal (mongodb://localhost:27017)');
    console.log('Collections: users, donations, assignments, distributionlogs, notifications');
    console.log('\n📧 Test Accounts (password: password123):');
    console.log('   DONOR → donor@sharemymeal.com');
    console.log('   NGO   → ngo@sharemymeal.com  (Approved)');
    console.log('   NGO   → ngo2@sharemymeal.com (Pending Admin Approval)');
    console.log('   ADMIN → admin@sharemymeal.com');
    console.log('════════════════════════════════════════\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error.message);
    process.exit(1);
  }
};

seedDatabase();
