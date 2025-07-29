const Job = require('../models/Job');

// @route   POST /api/jobs
// @desc    Employer create a new job
// @access  Private (Employer)
const { improveDescription } = require('../services/ai/descriptionHelper');

exports.createJob = async (req, res) => {
  const { title, description, location, pay, currency, type, schedule } = req.body;
  if (!title || !description || !location || !pay || !type || !currency) {
    return res.status(400).json({ msg: 'Please provide required fields' });
  }
  try {
    // Optionally call AI for copy improvements (non-blocking)
    let aiSuggestion = null;
    try {
      aiSuggestion = await improveDescription({ title, description, location, schedule, type });
    } catch (e) { /* ignore AI errors */ }

        const job = await Job.create({
      title,
      description,
      location,
      pay,
      currency,
      type,
      schedule,
      employer: req.user.id,
      status: 'approved', // Auto-approve all new jobs
    });
    // broadcast new job to all connected clients
    const io = req.app.get('io');
    if (io) {
      io.emit('newJob', { job });
    }
    // send AI suggestion (if any) along with job so frontend can display helper UI
    res.status(201).json({ job, aiSuggestion });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// @route   GET /api/jobs
// @desc    Get all jobs (optionally filter)
// @access  Private (All roles)
exports.getJobs = async (req, res) => {
  const { location, type } = req.query;
  const filterBase = {};
  if (location) filterBase.location = location;
  if (type) filterBase.type = type;

  let finalFilter = { ...filterBase };
  if (req.user.role === 'worker') {
    finalFilter.status = 'approved';
  } else if (req.user.role === 'employer') {
    finalFilter = {
      ...filterBase,
      $or: [ { status: 'approved' }, { employer: req.user.id } ]
    };
  } // admin sees all
  try {
    const jobs = await Job.find(finalFilter).populate('employer', 'name email phone');
    res.json(jobs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// @route   GET /api/jobs/me
// @desc    Employer: get my posted jobs
// @access  Private (Employer)
exports.getMyJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ employer: req.user.id });
    res.json(jobs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// @route   PUT /api/jobs/:id
// @desc    Employer update job
// @access  Private (Employer owns job)
exports.updateJob = async (req, res) => {
  try {
    let job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ msg: 'Job not found' });
    if (job.employer.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Not authorized' });
    }
    job = await Job.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.json(job);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// @route   DELETE /api/jobs/:id
// @desc    Employer delete job
// @access  Private (Employer owns job)
exports.deleteJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ msg: 'Job not found' });
    if (job.employer.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Not authorized' });
    }
    await Job.findByIdAndDelete(req.params.id);
    // Notify connected clients
    const io = req.app.get('io');
    if (io) io.emit('jobDeleted', { jobId: job._id.toString(), jobTitle: job.title });
    res.json({ msg: 'Job removed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// @route   POST /api/jobs/:id/apply
// @desc    Worker apply to job (optional message)
// @access  Private (Worker)
exports.applyJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ msg: 'Job not found' });

    const already = job.applicants.some(a => (a.user?.toString?.() || a.user) === req.user.id);
    if (already) return res.status(400).json({ msg: 'Already applied' });

    const message = req.body.message || '';

    job.applicants.push({ user: req.user.id, message });
    await job.save();

    // Socket notifications
    const io = req.app.get('io');
    if (io) {
      // to applicant's other tabs
      io.to(req.user.id).emit('jobApplied', {
        job: {
          _id: job._id,
          title: job.title,
          location: job.location,
          type: job.type,
          createdAt: job.createdAt,
          applicants: job.applicants
        }
      });
      // to employer about new applicant
      io.to(job.employer.toString()).emit('newApplicant', {
        jobId: job._id.toString(),
        jobTitle: job.title,
        applicantId: req.user.id,
        message
      });
    }
    res.json({ msg: 'Applied successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// @route   GET /api/jobs/:id/applicants
// @desc    Employer view applicants list
// @access  Private (Employer owns job)
exports.getApplicants = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id).populate('applicants.user','name email role resume');
    if (!job) return res.status(404).json({ msg: 'Job not found' });
    if (job.employer.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Not authorized' });
    }
    res.json(job.applicants);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// @route   POST /api/jobs/:id/unapply
// @desc    Worker withdraw application
// @access  Private (Worker)
exports.unapplyJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ msg: 'Job not found' });
    const exists = job.applicants.some(a => (a.user?.toString?.()||a.user)===req.user.id);
    if(!exists) return res.status(400).json({ msg: 'Not applied to this job' });
    job.applicants = job.applicants.filter(a => (a.user?.toString?.()||a.user)!==req.user.id);
    await job.save();
    res.json({ msg: 'Application withdrawn' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// @route   PUT /api/jobs/:jobId/applicants/:appId
// @desc    Employer update applicant status (accepted/rejected/bookmarked)
// @access  Private (Employer owns job)
exports.updateApplicantStatus = async (req, res) => {
  const { status } = req.body;
  if (!['accepted','rejected','bookmarked'].includes(status)) {
    return res.status(400).json({ msg: 'Invalid status' });
  }
  try {
    const job = await Job.findById(req.params.jobId);
    if (!job) return res.status(404).json({ msg: 'Job not found' });
    if (job.employer.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Not authorized' });
    }
    const applicant = job.applicants.id(req.params.appId);
    if (!applicant) return res.status(404).json({ msg: 'Applicant not found' });
    applicant.status = status;
    if (req.body.message) applicant.responseMessage = req.body.message;
    await job.save();

    // notify worker via Socket.IO
    const io = req.app.get('io');
    if (io) {
      io.to(applicant.user.toString()).emit('applicationStatus', {
        jobId: job._id.toString(),
        jobTitle: job.title,
        status,
        message: req.body.message || ''
      });
    }
    res.json({ msg: 'Status updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};
