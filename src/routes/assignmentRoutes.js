const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  claimDonation,
  markCollected,
  getMyAssignments,
  getAllAssignments,
} = require('../controllers/assignmentController');

router.post('/claim/:donationId', protect, authorize('NGO'), claimDonation);
router.patch('/:id/collect', protect, authorize('NGO'), markCollected);
router.get('/my', protect, authorize('NGO'), getMyAssignments);
router.get('/all', protect, authorize('ADMIN'), getAllAssignments);

module.exports = router;
