const User = require('../models/User');
const Job = require('../models/Job');

// @route   GET /api/admin/users
// @desc    Get all users
// @access  Admin
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// @route   DELETE /api/admin/users/:id
// @desc    Delete a user
// @access  Admin
exports.deleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ msg: 'User deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};
