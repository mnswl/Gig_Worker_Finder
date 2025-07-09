const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { OAuth2Client } = require('google-auth-library');
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Helper to generate JWT
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      role: user.role, emailVerified: user.emailVerified,
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// @route   POST /api/auth/register
// @desc    Register a new user (employer or worker)
// @access  Public
exports.register = async (req, res) => {
  const { firstName, lastName, username, phone, email, password, role } = req.body;
  const name = `${firstName || ''} ${lastName || ''}`.trim();
  if (role === 'admin') {
    return res.status(400).json({ msg: 'Cannot register admin via this route' });
  }
  if (!firstName || !lastName || !password || !role || (!email && !phone)) {
    return res.status(400).json({ msg: 'Please provide all required fields and at least an email or phone' });
  }

  try {
    // Build duplicate-check query only with provided non-empty fields
    const dupQuery = { $or: [] };
    if (email) dupQuery.$or.push({ email });
    if (phone) dupQuery.$or.push({ phone });
    let user = dupQuery.$or.length ? await User.findOne(dupQuery) : null;
    if (user) {
        let conflictField = 'Account';
        if (email && user.email === email) conflictField = 'Email';
        else if (phone && user.phone === phone) conflictField = 'Phone';
        return res.status(400).json({ msg: `${conflictField} already exists` });
      }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Prepare data ensuring we don't store empty strings
    const userData = { name, firstName, lastName, username, role, password: hashedPassword, country: req.body.country, currency: req.body.currency };
    if (email) userData.email = email;
    if (phone) userData.phone = phone;
    if(!req.body.avatar){
        const initials = encodeURIComponent(name.split(' ').map(s=>s[0]).join('').toUpperCase());
        userData.avatar = `https://avatars.dicebear.com/api/initials/${initials}.svg`;
      }
      user = new User(userData);
    await user.save();

    // Return token and user info
    const token = generateToken(user);
    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, emailVerified: user.emailVerified },
    });
  } catch (err) {
    if (err.code === 11000) {
      const dupKey = Object.keys(err.keyValue || {})[0];
      const dupField = dupKey ? dupKey.charAt(0).toUpperCase() + dupKey.slice(1) : 'Field';
      return res.status(400).json({ msg: `${dupField} already exists` });
    }
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// @route   POST /api/auth/login
// @desc    Login user & get token
// @access  Public
// @route   DELETE /api/auth/cancel
// @desc    Cancel registration and delete unverified account
// @access  Private
exports.cancelRegistration = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: 'User not found' });
    if (user.emailVerified || user.phoneVerified) {
      return res.status(400).json({ msg: 'Account already verified, cannot cancel' });
    }
    await user.deleteOne();
    return res.json({ msg: 'Registration cancelled' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// Google OAuth sign-in / sign-up
// @route POST /api/auth/google
// body: { idToken, role? }
exports.googleAuth = async (req, res) => {
  const { idToken, role, country, currency } = req.body;
  if (!idToken) return res.status(400).json({ msg: 'Missing idToken' });
  try {
    // Verify token
    const ticket = await googleClient.verifyIdToken({ idToken, audience: process.env.GOOGLE_CLIENT_ID });
    const payload = ticket.getPayload();
    const email = payload.email;
    if (!email) return res.status(400).json({ msg: 'Email not present in Google account' });

    // Find or create user
    let user = await User.findOne({ email });
    if (!user) {
      const newUserData = {
        email,
        name: payload.name || email,
        firstName: payload.given_name || '',
        lastName: payload.family_name || '',
        avatar: payload.picture || `https://avatars.dicebear.com/api/initials/${encodeURIComponent((payload.name||email).split(' ').map(s=>s[0]).join('').toUpperCase())}.svg`,
        emailVerified: false,
        role: ['worker', 'employer', 'admin'].includes(role) ? role : 'worker',
        // random password (not used) – still required by schema
        password: require('crypto').randomBytes(16).toString('hex'),
        country,
        currency
      };
      user = new User(newUserData);
      await user.save();

      // Auto-send email verification code for new Google sign-ups
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpHash = await bcrypt.hash(otp, 10);
      user.emailCodeHash = otpHash;
      user.emailCodeExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
      await user.save();
      const html = `<p>Your Gig Worker Finder email verification code is <strong>${otp}</strong>. It expires in 10 minutes.</p>`;
      await require('../utils/sendEmail')({
        to: email,
        subject: 'Email Verification Code',
        html,
        text: `Your code is ${otp}`,
      });
    }

    const token = generateToken(user);
    return res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role, emailVerified: user.emailVerified, country: user.country, currency: user.currency } });
  } catch (err) {
    console.error(err);
    return res.status(400).json({ msg: 'Invalid Google token' });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body; // 'email' can be email or phone identifier
  if (!email || !password) {
    return res.status(400).json({ msg: 'Please provide email and password' });
  }

  try {
    const user = await User.findOne({ $or: [ { email }, { phone: email } ] });
    if (!user) return res.status(400).json({ msg: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: 'Invalid credentials' });

    const token = generateToken(user);
    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, emailVerified: user.emailVerified },
    });
  } catch (err) {
    if (err.code === 11000) {
      const dupKey = Object.keys(err.keyValue || {})[0];
      const dupField = dupKey ? dupKey.charAt(0).toUpperCase() + dupKey.slice(1) : 'Field';
      return res.status(400).json({ msg: `${dupField} already exists` });
    }
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};
