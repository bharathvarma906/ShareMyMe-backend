const Assignment = require('../models/Assignment');
const Donation = require('../models/Donation');
const Notification = require('../models/Notification');

// @desc    NGO claims a donation
// @route   POST /api/assignments/claim/:donationId
// @access  Private/NGO
const claimDonation = async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.donationId);
    if (!donation) return res.status(404).json({ success: false, message: 'Donation not found' });

    if (donation.status !== 'AVAILABLE') {
      return res.status(400).json({ success: false, message: `Donation is not available. Current status: ${donation.status}` });
    }

    if (new Date(donation.expiryTime) <= new Date()) {
      donation.status = 'EXPIRED';
      await donation.save();
      return res.status(400).json({ success: false, message: 'This donation has expired and can no longer be claimed' });
    }

    if (!req.user.isApproved) {
      return res.status(403).json({ success: false, message: 'Your NGO account is pending admin approval. You cannot claim donations yet.' });
    }

    // Create assignment record
    const assignment = await Assignment.create({
      donationId: donation._id,
      donorId: donation.donorId,
      ngoId: req.user._id,
      status: 'CLAIMED',
      claimedAt: new Date(),
    });

    // Update donation status
    donation.status = 'CLAIMED';
    donation.claimedBy = req.user._id;
    donation.claimedAt = new Date();
    await donation.save();

    // Notify the donor
    await Notification.create({
      userId: donation.donorId,
      title: 'Donation Claimed!',
      message: `Your donation "${donation.foodName}" has been claimed by ${req.user.organizationName || req.user.name}. They will collect it soon.`,
      type: 'DONATION_CLAIMED',
      referenceId: donation._id,
    });

    res.status(201).json({ success: true, message: 'Donation claimed successfully!', data: assignment });
  } catch (error) {
    console.error('Claim Donation Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    NGO marks donation as collected
// @route   PATCH /api/assignments/:id/collect
// @access  Private/NGO
const markCollected = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) return res.status(404).json({ success: false, message: 'Assignment not found' });

    if (assignment.ngoId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized for this assignment' });
    }

    if (assignment.status !== 'CLAIMED' && assignment.status !== 'COLLECTING') {
      return res.status(400).json({ success: false, message: `Cannot mark as collected. Current status: ${assignment.status}` });
    }

    assignment.status = 'COLLECTED';
    assignment.collectedAt = new Date();
    assignment.remarks = req.body.remarks || assignment.remarks;
    await assignment.save();

    // Update donation status
    await Donation.findByIdAndUpdate(assignment.donationId, { status: 'COLLECTED' });

    // Notify donor
    await Notification.create({
      userId: assignment.donorId,
      title: 'Food Collected!',
      message: `Your donation has been successfully collected by ${req.user.organizationName || req.user.name}. Thank you for your generosity!`,
      type: 'DONATION_COLLECTED',
      referenceId: assignment.donationId,
    });

    res.status(200).json({ success: true, message: 'Marked as collected!', data: assignment });
  } catch (error) {
    console.error('Mark Collected Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get NGO's claimed/assigned donations
// @route   GET /api/assignments/my
// @access  Private/NGO
const getMyAssignments = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = { ngoId: req.user._id };
    if (status) filter.status = status;

    const assignments = await Assignment.find(filter)
      .populate({ path: 'donationId', populate: { path: 'donorId', select: 'name phone address' } })
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: assignments.length, data: assignments });
  } catch (error) {
    console.error('Get My Assignments Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all assignments (Admin)
// @route   GET /api/assignments/all
// @access  Private/Admin
const getAllAssignments = async (req, res) => {
  try {
    const assignments = await Assignment.find()
      .populate('donationId', 'foodName category quantity status')
      .populate('donorId', 'name email')
      .populate('ngoId', 'name organizationName email')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: assignments.length, data: assignments });
  } catch (error) {
    console.error('Get All Assignments Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  claimDonation,
  markCollected,
  getMyAssignments,
  getAllAssignments,
};
