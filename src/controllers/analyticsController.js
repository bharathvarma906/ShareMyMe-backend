const Donation = require('../models/Donation');
const Assignment = require('../models/Assignment');
const DistributionLog = require('../models/DistributionLog');
const User = require('../models/User');

// @desc    Get full analytics dashboard data
// @route   GET /api/analytics
// @access  Private/Admin
const getAnalytics = async (req, res) => {
  try {
    // User stats
    const totalUsers = await User.countDocuments();
    const totalDonors = await User.countDocuments({ role: 'DONOR' });
    const totalNgos = await User.countDocuments({ role: 'NGO' });
    const pendingNgos = await User.countDocuments({ role: 'NGO', isApproved: false });
    const approvedNgos = await User.countDocuments({ role: 'NGO', isApproved: true });

    // Donation stats
    const totalDonations = await Donation.countDocuments();
    const availableDonations = await Donation.countDocuments({ status: 'AVAILABLE' });
    const claimedDonations = await Donation.countDocuments({ status: 'CLAIMED' });
    const collectedDonations = await Donation.countDocuments({ status: 'COLLECTED' });
    const distributedDonations = await Donation.countDocuments({ status: 'DISTRIBUTED' });
    const expiredDonations = await Donation.countDocuments({ status: 'EXPIRED' });
    const cancelledDonations = await Donation.countDocuments({ status: 'CANCELLED' });

    // Aggregate total meals donated
    const mealsAgg = await Donation.aggregate([
      { $group: { _id: null, totalMeals: { $sum: '$quantity' } } }
    ]);
    const totalMealsDonated = mealsAgg.length > 0 ? mealsAgg[0].totalMeals : 0;

    // Distribution stats
    const distributionAgg = await DistributionLog.aggregate([
      {
        $group: {
          _id: null,
          totalDistributed: { $sum: '$quantityDistributed' },
          totalPeopleServed: { $sum: '$peopleServed' },
          totalLogs: { $sum: 1 },
        },
      },
    ]);
    const distStats = distributionAgg.length > 0 ? distributionAgg[0] : { totalDistributed: 0, totalPeopleServed: 0, totalLogs: 0 };

    // Donations per month (last 12 months)
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const donationsPerMonth = await Donation.aggregate([
      { $match: { createdAt: { $gte: twelveMonthsAgo } } },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          count: { $sum: 1 },
          meals: { $sum: '$quantity' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    // Distribution per month
    const distributionPerMonth = await DistributionLog.aggregate([
      { $match: { createdAt: { $gte: twelveMonthsAgo } } },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          count: { $sum: 1 },
          peopleServed: { $sum: '$peopleServed' },
          distributed: { $sum: '$quantityDistributed' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    // Donations by category
    const donationsByCategory = await Donation.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 }, totalMeals: { $sum: '$quantity' } } },
      { $sort: { count: -1 } },
    ]);

    // Top donors
    const topDonors = await Donation.aggregate([
      { $group: { _id: '$donorId', donationCount: { $sum: 1 }, totalMeals: { $sum: '$quantity' } } },
      { $sort: { totalMeals: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'donor',
        },
      },
      { $unwind: '$donor' },
      {
        $project: {
          donorName: '$donor.name',
          donorEmail: '$donor.email',
          donationCount: 1,
          totalMeals: 1,
        },
      },
    ]);

    // Top NGOs by people served
    const topNgos = await DistributionLog.aggregate([
      { $group: { _id: '$ngoId', distributionCount: { $sum: 1 }, totalServed: { $sum: '$peopleServed' } } },
      { $sort: { totalServed: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'ngo',
        },
      },
      { $unwind: '$ngo' },
      {
        $project: {
          ngoName: '$ngo.organizationName',
          ngoEmail: '$ngo.email',
          distributionCount: 1,
          totalServed: 1,
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        users: { totalUsers, totalDonors, totalNgos, pendingNgos, approvedNgos },
        donations: {
          totalDonations, availableDonations, claimedDonations, collectedDonations,
          distributedDonations, expiredDonations, cancelledDonations, totalMealsDonated,
        },
        distribution: distStats,
        charts: { donationsPerMonth, distributionPerMonth, donationsByCategory },
        leaderboard: { topDonors, topNgos },
      },
    });
  } catch (error) {
    console.error('Analytics Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getAnalytics };
