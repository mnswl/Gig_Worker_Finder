const express = require('express');
const router = express.Router();
const { register, login, cancelRegistration } = require('../controllers/authController');
const { registerAdmin } = require('../controllers/adminAuthController');
const { sendPhoneCode, verifyPhoneCode, sendEmailCode, verifyEmailCode } = require('../controllers/otpController');
const { protect } = require('../middleware/auth');
const User = require('../models/User');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Multer setup for avatar uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dest = path.join(__dirname, '..', 'uploads', 'avatars');
    fs.mkdirSync(dest, { recursive: true });
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// Register routes
router.post('/register', register);
// Admin register (needs secret)
router.post('/register-admin', registerAdmin);

// Login route
router.post('/login', login);

// Google OAuth login/signup
router.post('/google', require('../controllers/authController').googleAuth);

// Phone OTP
router.post('/phone-code', sendPhoneCode);
router.post('/verify-phone', verifyPhoneCode);
// Email verification
router.post('/email-code', sendEmailCode);
router.post('/verify-email', verifyEmailCode);

// Cancel registration and delete unverified account
router.delete('/cancel', protect, cancelRegistration);

// Upload avatar
router.post('/avatar', protect, upload.single('avatar'), async (req, res) => {
  try {
    let avatarUrl;
    if (req.file) {
      avatarUrl = `${req.protocol}://${req.get('host')}/uploads/avatars/${req.file.filename}`;
    } else if (req.body.url) {
      avatarUrl = req.body.url;
    } else {
      return res.status(400).json({ msg: 'No avatar provided' });
    }
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { avatar: avatarUrl },
      { new: true, select: '-password' }
    );
    return res.json({ id: user._id, username: user.username, firstName: user.firstName, lastName: user.lastName, name: user.name, email: user.email, role: user.role, avatar: user.avatar, phone: user.phone, phoneVerified: user.phoneVerified, emailVerified: user.emailVerified, country: user.country, currency: user.currency, resume: user.resume });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ msg: 'Server error' });
  }
});

// Update current user profile
router.patch('/me', protect, async (req, res) => {
  try {
    const { username, firstName, lastName, email, phone, country, currency } = req.body;
    const updates = {};
    if (username !== undefined) updates.username = username;
    if (firstName !== undefined) updates.firstName = firstName;
    if (lastName !== undefined) updates.lastName = lastName;
    if (email !== undefined) updates.email = email;
    if (phone !== undefined) updates.phone = phone;
    if (country !== undefined) updates.country = country;
    if (currency !== undefined) updates.currency = currency;
    if (firstName || lastName) updates.name = `${firstName || ''} ${lastName || ''}`.trim();

    const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true, select: '-password' });
    res.json({
      id: user._id,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      phone: user.phone,
      phoneVerified: user.phoneVerified,
      emailVerified: user.emailVerified,
      country: user.country,
      currency: user.currency,
      resume: user.resume,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Delete account
router.delete('/me', protect, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.user.id);
    // TODO: cascade delete related data if needed (jobs, messages, etc.)
    res.json({ msg: 'Account deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Get current user
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ msg: 'User not found' });
    res.json({ id: user._id, username: user.username, firstName: user.firstName, lastName: user.lastName, name: user.name, email: user.email, role: user.role, avatar: user.avatar, phone: user.phone, phoneVerified: user.phoneVerified, emailVerified: user.emailVerified, country: user.country, currency: user.currency, resume: user.resume });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Test endpoint
router.get('/test', (req, res) => {
  res.json({ message: 'Auth route working!' });
});

module.exports = router;
