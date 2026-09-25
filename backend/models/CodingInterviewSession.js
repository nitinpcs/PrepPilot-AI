import mongoose from 'mongoose';

const submissionSchema = new mongoose.Schema({
  problemId: { type: String, required: true },
  title: String,
  topic: String,
  difficulty: String,
  timeTakenSeconds: Number,
  attempts: Number,
  passedTests: Number,
  totalTests: Number,
  complexity: String,
  feedback: String,
  score: Number,
  submittedAt: Date,
}, { _id: false });

const codingInterviewSessionSchema = new mongoose.Schema({
  candidate: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  sessionId: { type: String, required: true },
  history: { type: [submissionSchema], default: [] },
}, { timestamps: true });

codingInterviewSessionSchema.index({ candidate: 1, sessionId: 1 }, { unique: true });

export default mongoose.model('CodingInterviewSession', codingInterviewSessionSchema);
