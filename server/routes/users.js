const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getUserById, uploadResume, getBookmarks, addBookmark, removeBookmark } = require('../controllers/userController');
const upload = require('../middleware/upload');

// Bookmarks
router.get('/me/bookmarks', protect, getBookmarks);
router.put('/me/bookmarks/:jobId', protect, addBookmark);
router.delete('/me/bookmarks/:jobId', protect, removeBookmark);

// Upload resume
router.post('/me/resume', protect, upload.single('resume'), uploadResume);

// GET /api/users/:id
router.get('/:id', protect, getUserById);

module.exports = router;
