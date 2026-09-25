import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please add a valid email'],
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: [6, 'Password must be at least 6 characters'],
  },
  role: {
    type: String,
    enum: ['candidate', 'admin'],
    default: 'candidate',
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  otp: {
    type: String,
  },
  otpExpires: {
    type: Date,
  },
  otpPurpose: {
    type: String,
    enum: ['registration', 'password_reset'],
  },
  refreshTokenHash: {
    type: String,
  },
  parsedResume: {
    rawText: { type: String },
    skills: [{ type: String }],
    projects: [{
      name: { type: String },
      description: { type: String },
      technologies: [{ type: String }],
    }],
    experience: [{
      role: { type: String },
      company: { type: String },
      duration: { type: String },
      description: { type: String },
    }],
    technologies: [{ type: String }],
    summary: { type: String },
    updatedAt: { type: Date, default: Date.now },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Encypt password using bcrypt before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Compare a plain refresh token against the stored hash
userSchema.methods.matchRefreshToken = async function (token) {
  if (!this.refreshTokenHash) return false;
  return await bcrypt.compare(token, this.refreshTokenHash);
};

const User = mongoose.model('User', userSchema);

export default User;
