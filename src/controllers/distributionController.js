const DistributionLog = require('../models/DistributionLog');
const Assignment = require('../models/Assignment');
const Donation = require('../models/Donation');
const Notification = require('../models/Notification');

// @desc    NGO logs a distribution event after collecting food
// @route   POST /api/distribution
// @access  Private/NGO
const logDistribution = async (req, res) => {
  try {
    const { assignmentId, quantityDistributed, peopleServed, location, remarks, distributionDate } = req.body;

    if (!assignmentId || !quantityDistributed || !peopleServed || !location) {
      return res.status(400).json({ success: false, message: 'Please provide assignmentId, quantityDistributed, peopleServed, and location' });
    }

    const assignment = await Assignment.findById(assignmentId).populate('donationId');
    if (!assignment) return res.status(404).json({ success: false, message: 'Assignment not found' });

    if (assignment.ngoId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized for this assignment' });
    }

    if (assignment.status !== 'COLLECTED') {
      return res.status(400).json({ success: false, message: `Food must be collected before distribution. Current status: ${assignment.status}` });
    }

    // Create distribution log
    const log = await DistributionLog.create({
      donationId: assignment.donationId._id,
      assignmentId: assignment._id,
      ngoId: req.user._id,
      quantityDistributed,
      peopleServed,
      distributionDate: distributionDate || Date.now(),
      location,
      remarks: remarks || '',
    });

    // Update assignment and donation status
    assignment.status = 'DISTRIBUTED';
    assignment.distributedAt = new Date();
    await assignment.save();

    await Donation.findByIdAndUpdate(assignment.donationId._id, { status: 'DISTRIBUTED' });

    // Notify donor about successful distribution
    await Notification.create({
      userId: assignment.donorId,
      title: 'Your Food Was Distributed!',
      message: `${req.user.organizationName || req.user.name} distributed your donation "${assignment.donationId.foodName}" to ${peopleServed} people at ${location}. Thank you!`,
      type: 'DONATION_DISTRIBUTED',
      referenceId: assignment.donationId._id,
    });

    res.status(201).json({ success: true, message: 'Distribution logged successfully!', data: log });
  } catch (error) {
    console.error('Log Distribution Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get distribution logs for an NGO
// @route   GET /api/distribution/my
// @access  Private/NGO
const getMyDistributions = async (req, res) => {
  try {
    const logs = await DistributionLog.find({ ngoId: req.user._id })
      .populate('donationId', 'foodName category quantity')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: logs.length, data: logs });
  } catch (error) {
    console.error('Get My Distributions Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all distribution logs (Admin)
// @route   GET /api/distribution/all
// @access  Private/Admin
const getAllDistributions = async (req, res) => {
  try {
    const logs = await DistributionLog.find()
      .populate('donationId', 'foodName category quantity')
      .populate('ngoId', 'name organizationName')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: logs.length, data: logs });
  } catch (error) {
    console.error('Get All Distributions Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  logDistribution,
  getMyDistributions,
  getAllDistributions,
};
