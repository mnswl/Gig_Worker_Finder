const bcrypt = require('bcryptjs');
const User = require('../models/User');
const sendSMS = require('../utils/sendSMS');

// helper generate code
const generateCode = () => Math.floor(100000 + Math.random() * 900000).toString();

// POST /api/auth/phone-code
exports.sendPhoneCode = async (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ msg: 'Phone is required' });
  try {
    const user = await User.findOne({ phone });
    if (!user) return res.status(404).json({ msg: 'User not found' });
    const code = generateCode();
    const hash = await bcrypt.hash(code, 10);
    user.phoneCodeHash = hash;
    user.phoneCodeExpires = Date.now() + 10 * 60 * 1000; // 10 min
    await user.save();
    await sendSMS(phone, `Your Gig Worker Finder verification code is ${code}`);
    res.json({ msg: 'OTP sent' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// EMAIL VERIFICATION

// POST /api/auth/email-code
exports.sendEmailCode = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ msg: 'Email is required' });
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ msg: 'User not found' });
    const code = generateCode();
    const hash = await bcrypt.hash(code, 10);
    user.emailCodeHash = hash;
    user.emailCodeExpires = Date.now() + 10 * 60 * 1000;
    await user.save();
    const html = `<p>Your Gig Worker Finder email verification code is <strong>${code}</strong>. It expires in 10 minutes.</p>`;
    await require('../utils/sendEmail')({ to: email, subject: 'Email Verification Code', html, text: `Your code is ${code}` });
    return res.json({ msg: 'Code sent' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ msg: 'Server error' });
  }
};

// POST /api/auth/verify-email
exports.verifyEmailCode = async (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) return res.status(400).json({ msg: 'Email and code required' });
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ msg: 'User not found' });
    if (!user.emailCodeExpires || Date.now() > user.emailCodeExpires) {
      return res.status(400).json({ msg: 'Code expired' });
    }
    const match = await bcrypt.compare(code, user.emailCodeHash || '');
    if (!match) return res.status(400).json({ msg: 'Invalid code' });
    user.emailVerified = true;
    user.unverifiedExpires = undefined;
    user.emailCodeHash = undefined;
    user.emailCodeExpires = undefined;
    await user.save();
    return res.json({ msg: 'Email verified' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ msg: 'Server error' });
  }
};

// POST /api/auth/verify-phone
exports.verifyPhoneCode = async (req, res) => {
  const { phone, code } = req.body;
  if (!phone || !code) return res.status(400).json({ msg: 'Phone and code required' });
  try {
    const user = await User.findOne({ phone });
    if (!user) return res.status(404).json({ msg: 'User not found' });
    if (!user.phoneCodeExpires || Date.now() > user.phoneCodeExpires) {
      return res.status(400).json({ msg: 'Code expired' });
    }
    const match = await bcrypt.compare(code, user.phoneCodeHash || '');
    if (!match) return res.status(400).json({ msg: 'Invalid code' });
    user.phoneVerified = true;
    user.unverifiedExpires = undefined;
    user.phoneCodeHash = undefined;
    user.phoneCodeExpires = undefined;
    await user.save();
    res.json({ msg: 'Phone verified' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};
