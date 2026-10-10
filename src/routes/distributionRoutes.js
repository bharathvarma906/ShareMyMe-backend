const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  logDistribution,
  getMyDistributions,
  getAllDistributions,
} = require('../controllers/distributionController');

router.post('/', protect, authorize('NGO'), logDistribution);
router.get('/my', protect, authorize('NGO'), getMyDistributions);
router.get('/all', protect, authorize('ADMIN'), getAllDistributions);

module.exports = router;
