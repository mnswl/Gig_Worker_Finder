const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const isAdmin = require('../middleware/admin');
const { getUsers, deleteUser } = require('../controllers/adminController');
const {
  getJobs,
  approveJob,
  rejectJob,
  suspendJob,
  unsuspendJob,
  featureJob,
  unfeatureJob,
  deleteJob: deleteJobAdmin,
  bulkAction
} = require('../controllers/adminJobController');

router.use(protect, isAdmin);

router.get('/users', getUsers);
router.delete('/users/:id', deleteUser);

// Job (gig) admin routes
router.get('/jobs', getJobs);
router.put('/jobs/:id/approve', approveJob);
router.put('/jobs/:id/reject', rejectJob);
router.put('/jobs/:id/suspend', suspendJob);
router.put('/jobs/:id/unsuspend', unsuspendJob);
router.put('/jobs/:id/feature', featureJob);
router.put('/jobs/:id/unfeature', unfeatureJob);
router.delete('/jobs/:id', deleteJobAdmin);
router.post('/jobs/bulk', bulkAction);

module.exports = router;
