const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: { type: String, unique: true, sparse: true },
  firstName: { type: String },
  lastName: { type: String },
  name: { type: String, required: true },
  email: { type: String, unique: true, sparse: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['employer', 'worker', 'admin'], required: true },
  avatar: { type: String },
  country: { type: String },
  currency: { type: String },
  phone: { type: String, match: /^\+?[0-9]{7,15}$/, unique: true, sparse: true },
  phoneVerified: { type: Boolean, default: false },
  resume: { type: String },
  bookmarks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Job' }],
  emailVerified: { type: Boolean, default: false },
  emailCodeHash: { type: String },
  emailCodeExpires: { type: Date },
  phoneCodeHash: { type: String },
  phoneCodeExpires: { type: Date },
  createdAt: { type: Date, default: Date.now },
  // If user never verifies email or phone within 24h, account auto-deletes via TTL
  unverifiedExpires: { type: Date, default: () => Date.now() + 24*60*60*1000 },
});

// TTL index: document removed once unverifiedExpires date passes
UserSchema.index({ unverifiedExpires: 1 }, { expireAfterSeconds: 0 });

// Reset verification flags if email or phone is modified
UserSchema.pre('save', function(next) {
  if (this.isModified('email')) {
    this.emailVerified = false;
    this.emailCodeHash = undefined;
    this.emailCodeExpires = undefined;
  }
  if (this.isModified('phone')) {
    this.phoneVerified = false;
    this.phoneCodeHash = undefined;
    this.phoneCodeExpires = undefined;
  }
  next();
});

// Same logic for findOneAndUpdate / findByIdAndUpdate
UserSchema.pre('findOneAndUpdate', function(next) {
  const update = this.getUpdate();
  if (!update) return next();
  // handle both direct set and $set
  const email = update.email || (update.$set && update.$set.email);
  const phone = update.phone || (update.$set && update.$set.phone);
  if (email !== undefined) {
    this.setUpdate({
      ...update,
      $set: { ...(update.$set || {}), emailVerified: false, emailCodeHash: undefined, emailCodeExpires: undefined }
    });
  }
  if (phone !== undefined) {
    this.setUpdate({
      ...this.getUpdate(),
      $set: { ...(this.getUpdate().$set || {}), phoneVerified: false, phoneCodeHash: undefined, phoneCodeExpires: undefined }
    });
  }
  next();
});

module.exports = mongoose.model('User', UserSchema);
