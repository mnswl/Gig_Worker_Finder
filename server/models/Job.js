const mongoose = require('mongoose');

const JobSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  location: { type: String, required: true },
  pay: { type: Number, required: true },
  currency: { type: String, required: true, default: 'LKR' },
  type: { type: String, enum: ['full-time', 'part-time', 'freelance', 'gig', 'online'], required: true },
  schedule: { type: String },
  employer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  applicants: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    message: String,
    status: { type: String, enum: ['pending','accepted','rejected','bookmarked'], default: 'pending' },
    appliedAt: { type: Date, default: Date.now }
  }],
  status: { type: String, enum: ['pending','approved','rejected','suspended'], default: 'pending' },
  featured: { type: Boolean, default: false },
  reports: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reason: String,
    createdAt: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Job', JobSchema);
