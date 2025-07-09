const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// @route   POST /api/auth/register-admin
// @desc    Register a new admin (requires ADMIN_SECRET env var)
// @access  Public (requires secret in body)
// Helper to generate JWT
const generateToken = (user) => {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

exports.registerAdmin = async (req, res) => {
  const { firstName, lastName, username, email, phone, password, adminSecret } = req.body;

  if (adminSecret !== process.env.ADMIN_SECRET) {
    return res.status(403).json({ msg: 'Invalid admin secret' });
  }
  if (!firstName || !lastName || !password || (!email && !phone)) {
    return res.status(400).json({ msg: 'Please provide all required fields and at least an email or phone' });
  }
  try {
    // duplicate check
    const dupQuery = { $or: [] };
    if (email) dupQuery.$or.push({ email });
    if (phone) dupQuery.$or.push({ phone });
    let existing = dupQuery.$or.length ? await User.findOne(dupQuery) : null;
    if (existing) {
      return res.status(400).json({ msg: 'Email or phone already exists' });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const name = `${firstName} ${lastName}`.trim();
    const user = await User.create({
      firstName,
      lastName,
      username,
      email,
      phone,
      password: hashedPassword,
      role: 'admin',
      name,
    });
    const token = generateToken(user);
    res.status(201).json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};
