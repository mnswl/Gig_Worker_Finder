const User = require('../models/User');

// @desc    Get single user by id (public minimal info)
// @route   GET /api/users/:id
// @access  Private (authenticated)
// Get user by id
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password -phoneCodeHash -phoneCodeExpires');
    if (!user) return res.status(404).json({ msg: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// @desc Upload or replace resume (PDF/DOC/DOCX)
// @route POST /api/users/me/resume
// @access Private (Worker)
// Bookmark endpoints
exports.getBookmarks = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('bookmarks', 'title location pay currency type employer createdAt');
    res.json(user.bookmarks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.addBookmark = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user.id, { $addToSet: { bookmarks: req.params.jobId } });
    res.json({ msg: 'Bookmarked' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.removeBookmark = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user.id, { $pull: { bookmarks: req.params.jobId } });
    res.json({ msg: 'Removed bookmark' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.uploadResume = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ msg: 'No file uploaded' });
  }
  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { resume: `/uploads/resumes/${req.file.filename}` },
      { new: true }
    ).select('-password');
    res.json({ msg: 'Resume uploaded', resume: user.resume });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};
