const express = require('express');
const router = express.Router();
const {
  createJob,
  getJobs,
  getMyJobs,
  updateJob,
  deleteJob,
  applyJob,
  unapplyJob,
  getApplicants,
  updateApplicantStatus,
} = require('../controllers/jobController');
const { protect, authorize } = require('../middleware/auth');
const { requireContactVerified } = require('../middleware/verify');

// Public/protected routes
router.get('/', protect, getJobs);

// Employer routes
router.post('/', protect, requireContactVerified, authorize('employer'), createJob);
router.get('/me', protect, authorize('employer'), getMyJobs);
router.put('/:id', protect, requireContactVerified, authorize('employer'), updateJob);
router.delete('/:id', protect, requireContactVerified, authorize('employer'), deleteJob);
router.get('/:id/applicants', protect, authorize('employer'), getApplicants);
// Update applicant status
router.put('/:jobId/applicants/:appId', protect, authorize('employer'), updateApplicantStatus);

// Worker apply route
router.post('/:id/apply', protect, requireContactVerified, authorize('worker'), applyJob);
// withdraw
router.post('/:id/unapply', protect, requireContactVerified, authorize('worker'), unapplyJob);

// Test endpoint
router.get('/test', (req, res) => {
  res.json({ message: 'Jobs route working!' });
});

module.exports = router;
