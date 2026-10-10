const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  getMe,
  getUsersForAdmin,
  approveNgoPartner,
} = require('../controllers/authController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Public endpoints
router.post('/register', registerUser);
router.post('/login', loginUser);

// Protected user endpoint
router.get('/me', protect, getMe);

// Protected Admin endpoints
router.get('/admin/users', protect, authorize('ADMIN'), getUsersForAdmin);
router.patch('/admin/approve-ngo/:id', protect, authorize('ADMIN'), approveNgoPartner);

module.exports = router;
