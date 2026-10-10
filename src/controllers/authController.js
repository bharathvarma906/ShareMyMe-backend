const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Helper to generate JWT Token
const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || 'sharemymeal_super_secret_jwt_key_2026',
    {
      expiresIn: process.env.JWT_EXPIRE || '30d',
    }
  );
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const {
      name,
      fullName,
      email,
      password,
      role,
      phone,
      address,
      organizationName,
      registrationNumber,
    } = req.body;

    const userName = name || fullName;

    if (!userName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password',
      });
    }

    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists',
      });
    }

    const validRoles = ['DONOR', 'NGO', 'ADMIN'];
    const userRole =
      role && validRoles.includes(role.toUpperCase())
        ? role.toUpperCase()
        : 'DONOR';

    const user = await User.create({
      name: userName,
      email: email.toLowerCase(),
      password,
      role: userRole,
      phone: phone || '',
      address: address || '',
      organizationName: userRole === 'NGO' ? organizationName || '' : '',
      registrationNumber: userRole === 'NGO' ? registrationNumber || '' : '',
      isApproved: userRole !== 'NGO',
    });

    if (user) {
      const token = generateToken(user._id);

      res.status(201).json({
        success: true,
        message:
          userRole === 'NGO'
            ? 'NGO registration submitted! Account pending admin approval.'
            : 'Account registered successfully!',
        data: {
          _id: user._id,
          name: user.name,
          fullName: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          address: user.address,
          organizationName: user.organizationName,
          registrationNumber: user.registrationNumber,
          isApproved: user.isApproved,
          createdAt: user.createdAt,
          token,
        },
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Invalid user data provided',
      });
    }
  } catch (error) {
    console.error('Registration Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error during registration',
    });
  }
};

// @desc    Authenticate user & return JWT token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password',
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select(
      '+password'
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      data: {
        _id: user._id,
        name: user.name,
        fullName: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        address: user.address,
        organizationName: user.organizationName,
        registrationNumber: user.registrationNumber,
        isApproved: user.isApproved,
        createdAt: user.createdAt,
        token,
      },
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error during login',
    });
  }
};

// @desc    Get logged in user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found',
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('GetMe Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error fetching user profile',
    });
  }
};

// @desc    Get user metrics & all users (Admin only)
// @route   GET /api/auth/admin/users
// @access  Private/Admin
const getUsersForAdmin = async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });

    const totalUsers = users.length;
    const totalDonors = users.filter((u) => u.role === 'DONOR').length;
    const totalNgos = users.filter((u) => u.role === 'NGO').length;
    const pendingNgos = users.filter((u) => u.role === 'NGO' && !u.isApproved).length;

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        totalDonors,
        totalNgos,
        pendingNgos,
      },
      data: users,
    });
  } catch (error) {
    console.error('Admin getUsers Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error fetching admin user list',
    });
  }
};

// @desc    Approve or Reject NGO partner (Admin only)
// @route   PATCH /api/auth/admin/approve-ngo/:id
// @access  Private/Admin
const approveNgoPartner = async (req, res) => {
  try {
    const { approve } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'NGO User not found' });
    }

    if (user.role !== 'NGO') {
      return res.status(400).json({ success: false, message: 'User is not an NGO account' });
    }

    user.isApproved = approve === true;
    await user.save();

    res.status(200).json({
      success: true,
      message: `NGO account ${user.organizationName || user.name} has been ${approve ? 'Approved' : 'Unapproved/Rejected'}.`,
      data: user,
    });
  } catch (error) {
    console.error('Approve NGO Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error approving NGO' });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getMe,
  getUsersForAdmin,
  approveNgoPartner,
};
