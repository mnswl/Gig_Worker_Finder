const Job = require('../models/Job');

// @route   GET /api/admin/jobs
// @desc    List gigs with optional filters
// @access  Admin
exports.getJobs = async (req, res) => {
  try {
    const query = {};
    const { status, employer, featured } = req.query;
    if (status) query.status = status;
    if (employer) query.employer = employer;
    if (featured !== undefined) query.featured = featured === 'true';

    const jobs = await Job.find(query).populate('employer', 'name email');
    res.json(jobs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// Helper to update status
const updateStatus = async (req, res, newStatus) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ msg: 'Job not found' });
    job.status = newStatus;
    await job.save();
    // Notify clients via socket
    const io = req.app.get('io');
    if (io) io.emit('jobUpdated', { jobId: job._id.toString(), job });
    res.json({ msg: `Job ${newStatus}`, job });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.approveJob   = (req, res) => updateStatus(req, res, 'approved');
exports.rejectJob    = (req, res) => updateStatus(req, res, 'rejected');
exports.suspendJob   = (req, res) => updateStatus(req, res, 'suspended');
exports.unsuspendJob = (req, res) => updateStatus(req, res, 'approved');

// Feature toggles
exports.featureJob = async (req, res) => {
  try {
    const job = await Job.findByIdAndUpdate(req.params.id, { featured: true }, { new: true });
    if (!job) return res.status(404).json({ msg: 'Job not found' });
    const io = req.app.get('io');
    if (io) io.emit('jobUpdated', { jobId: job._id.toString(), job });
    res.json({ msg: 'Job featured', job });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.unfeatureJob = async (req, res) => {
  try {
    const job = await Job.findByIdAndUpdate(req.params.id, { featured: false }, { new: true });
    if (!job) return res.status(404).json({ msg: 'Job not found' });
    const io = req.app.get('io');
    if (io) io.emit('jobUpdated', { jobId: job._id.toString(), job });
    res.json({ msg: 'Job unfeatured', job });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// Delete a gig
exports.deleteJob = async (req, res) => {
  try {
    await Job.findByIdAndDelete(req.params.id);
    const io = req.app.get('io');
    if (io) io.emit('jobDeleted', { jobId: req.params.id });
    res.json({ msg: 'Job deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// Bulk actions
exports.bulkAction = async (req, res) => {
  try {
    const { action, ids } = req.body; // action: approve | reject | suspend | delete
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ msg: 'No IDs provided' });
    }
    let update;
    switch (action) {
      case 'approve': update = { status: 'approved' }; break;
      case 'reject':  update = { status: 'rejected' }; break;
      case 'suspend': update = { status: 'suspended' }; break;
      case 'delete':
        await Job.deleteMany({ _id: { $in: ids } });
        return res.json({ msg: 'Jobs deleted' });
      default:
        return res.status(400).json({ msg: 'Invalid action' });
    }
    await Job.updateMany({ _id: { $in: ids } }, update);
    const io = req.app.get('io');
    if(io){
      if(action==='delete') io.emit('bulkJobsDeleted',{ids});
      else io.emit('bulkJobsUpdated',{ids, update});
    }
    res.json({ msg: `Bulk ${action} complete` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};
