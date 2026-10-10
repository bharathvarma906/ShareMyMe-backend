const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { getAnalytics } = require('../controllers/analyticsController');

router.get('/', protect, authorize('ADMIN'), getAnalytics);

module.exports = router;
