const Donation = require('../models/Donation');
const Notification = require('../models/Notification');
const User = require('../models/User');

// @desc    Create a new food donation
// @route   POST /api/donations
// @access  Private/Donor
const createDonation = async (req, res) => {
  try {
    const { foodName, category, quantity, unit, description, preparationDate, expiryTime, pickupAddress, pickupCity } = req.body;

    if (!foodName || !quantity || !expiryTime || !pickupAddress) {
      return res.status(400).json({ success: false, message: 'Please provide foodName, quantity, expiryTime, and pickupAddress' });
    }

    if (new Date(expiryTime) <= new Date()) {
      return res.status(400).json({ success: false, message: 'Expiry time must be in the future' });
    }

    const donation = await Donation.create({
      donorId: req.user._id,
      foodName,
      category: category || 'OTHER',
      quantity,
      unit: unit || 'MEALS',
      description: description || '',
      preparationDate: preparationDate || Date.now(),
      expiryTime,
      pickupAddress,
      pickupCity: pickupCity || '',
      status: 'AVAILABLE',
    });

    // Notify all approved NGOs about new donation
    const approvedNgos = await User.find({ role: 'NGO', isApproved: true });
    const notifications = approvedNgos.map((ngo) => ({
      userId: ngo._id,
      title: 'New Donation Available',
      message: `${req.user.name} posted "${foodName}" (${quantity} ${unit || 'MEALS'}) near ${pickupAddress}. Claim before it expires!`,
      type: 'NEW_DONATION',
      referenceId: donation._id,
    }));
    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }

    res.status(201).json({ success: true, message: 'Donation published successfully!', data: donation });
  } catch (error) {
    console.error('Create Donation Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error creating donation' });
  }
};

// @desc    Get all available donations (for NGO browsing)
// @route   GET /api/donations/available
// @access  Private/NGO
const getAvailableDonations = async (req, res) => {
  try {
    const { search, category, city } = req.query;
    const filter = { status: 'AVAILABLE', expiryTime: { $gt: new Date() } };

    if (search) filter.foodName = { $regex: search, $options: 'i' };
    if (category) filter.category = category;
    if (city) filter.pickupCity = { $regex: city, $options: 'i' };

    const donations = await Donation.find(filter)
      .populate('donorId', 'name phone address')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: donations.length, data: donations });
  } catch (error) {
    console.error('Get Available Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get donations created by the logged-in donor
// @route   GET /api/donations/my
// @access  Private/Donor
const getMyDonations = async (req, res) => {
  try {
    const donations = await Donation.find({ donorId: req.user._id })
      .populate('claimedBy', 'name organizationName phone')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: donations.length, data: donations });
  } catch (error) {
    console.error('Get My Donations Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all donations (Admin)
// @route   GET /api/donations/all
// @access  Private/Admin
const getAllDonations = async (req, res) => {
  try {
    const donations = await Donation.find()
      .populate('donorId', 'name email phone')
      .populate('claimedBy', 'name organizationName')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: donations.length, data: donations });
  } catch (error) {
    console.error('Get All Donations Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get a single donation by ID
// @route   GET /api/donations/:id
// @access  Private
const getDonationById = async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id)
      .populate('donorId', 'name email phone address')
      .populate('claimedBy', 'name organizationName phone');

    if (!donation) {
      return res.status(404).json({ success: false, message: 'Donation not found' });
    }

    res.status(200).json({ success: true, data: donation });
  } catch (error) {
    console.error('Get Donation By ID Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Cancel a donation (Donor only, own donations)
// @route   PATCH /api/donations/:id/cancel
// @access  Private/Donor
const cancelDonation = async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id);
    if (!donation) return res.status(404).json({ success: false, message: 'Donation not found' });

    if (donation.donorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'You can only cancel your own donations' });
    }

    if (['COLLECTED', 'DISTRIBUTED'].includes(donation.status)) {
      return res.status(400).json({ success: false, message: 'Cannot cancel a donation that has already been collected or distributed' });
    }

    donation.status = 'CANCELLED';
    await donation.save();

    res.status(200).json({ success: true, message: 'Donation has been cancelled', data: donation });
  } catch (error) {
    console.error('Cancel Donation Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createDonation,
  getAvailableDonations,
  getMyDonations,
  getAllDonations,
  getDonationById,
  cancelDonation,
};
