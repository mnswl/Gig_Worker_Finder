const User = require('../models/User');

// Ensure user has verified at least one contact method (email or phone)
exports.requireContactVerified = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('emailVerified phoneVerified');
    if (!user) return res.status(401).json({ msg: 'User not found' });

    if (!user.emailVerified && !user.phoneVerified) {
      return res.status(403).json({ msg: 'Please verify your email or phone before performing this action' });
    }
    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};
