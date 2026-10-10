const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  createDonation,
  getAvailableDonations,
  getMyDonations,
  getAllDonations,
  getDonationById,
  cancelDonation,
} = require('../controllers/donationController');

router.post('/', protect, authorize('DONOR'), createDonation);
router.get('/available', protect, authorize('NGO'), getAvailableDonations);
router.get('/my', protect, authorize('DONOR'), getMyDonations);
router.get('/all', protect, authorize('ADMIN'), getAllDonations);
router.get('/:id', protect, getDonationById);
router.patch('/:id/cancel', protect, authorize('DONOR'), cancelDonation);

module.exports = router;
