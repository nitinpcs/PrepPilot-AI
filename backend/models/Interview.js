import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  questionText: {
    type: String,
    required: true,
  },
  candidateAnswer: {
    type: String,
    default: '',
  },
  evaluation: {
    type: String,
    default: '',
  },
  score: {
    type: Number,
    min: 0,
    max: 10,
    default: 0,
  },
  domain: { type: String, default: '' },
  difficulty: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'], default: 'Intermediate' },
}, { timestamps: true });

const interviewSchema = new mongoose.Schema({
  candidate: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  topic: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['topic', 'resume', 'role'],
    required: true,
  },
  role: { type: String, default: '' },
  company: { type: String, default: '' },
  companyProfile: { type: mongoose.Schema.Types.Mixed, default: undefined },
  experienceLevel: { type: String, enum: ['Fresher', '1-3 years', '3-5 years', 'Senior'], default: 'Fresher' },
  difficulty: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'], default: 'Intermediate' },
  duration: { type: Number, default: 30 },
  interviewMode: { type: String, enum: ['Theory', 'Coding', 'Mixed'], default: 'Mixed' },
  maxQuestions: { type: Number, default: 10 },
  roleProfile: { type: mongoose.Schema.Types.Mixed, default: undefined },
  resumeText: {
    type: String,
  },
  parsedResume: {
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
  },
  status: {
    type: String,
    enum: ['active', 'completed'],
    default: 'active',
  },
  questions: [questionSchema],
  feedback: {
    overallScore: { type: Number, default: 0 },
    communicationScore: { type: Number, default: 0 },
    technicalScore: { type: Number, default: 0 },
    problemSolvingScore: { type: Number, default: 0 },
    summary: { type: String, default: '' },
    strengths: [{ type: String }],
    weaknesses: [{ type: String }],
    skillScores: [{ skill: String, score: Number }],
    hiringRecommendation: { type: String, default: '' },
    missingSkills: [{ type: String }],
    learningRoadmap: [{ type: String }],
    practiceQuestions: [{ type: String }],
    companyFit: { type: String, default: '' },
    companyFeedback: { type: String, default: '' },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Interview = mongoose.model('Interview', interviewSchema);

export default Interview;
