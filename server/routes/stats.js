const express = require('express');
const router = express.Router();

const Job = require('../models/Job');
const User = require('../models/User');

// @route   GET /api/stats
// @desc    Return counts for jobs, freelancers, and clients (employers)
// @access  Public
router.get('/', async (req, res) => {
  try {
    const [jobsCount, freelancersCount, clientsCount] = await Promise.all([
      Job.countDocuments(),
      User.countDocuments({ role: 'worker' }),
      User.countDocuments({ role: 'employer' })
    ]);

    res.json({ jobs: jobsCount, freelancers: freelancersCount, clients: clientsCount });
  } catch (err) {
    console.error('Stats route error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
