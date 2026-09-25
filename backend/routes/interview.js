import express from 'express';
import { protect } from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import {
  parseResumeSchema,
  startInterviewSchema,
  submitAnswerSchema,
  getInterviewReportSchema,
} from '../validators/interviewSchemas.js';
import {
  parseResume,
  getRoleProfiles,
  getCompanyProfiles,
  getUserResume,
  startInterview,
  submitAnswer,
  getInterviewStats,
  getInterviewHistory,
  getInterviewReport,
  downloadInterviewReportPdf,
} from '../controllers/interviewController.js';

const router = express.Router();

// @desc    Parse PDF resume to extract text & structured JSON once
// @route   POST /api/interview/resumes
// @access  Private
router.post('/resumes', protect, validate(parseResumeSchema), parseResume);

// @desc    Get stored parsed resume for candidate
// @route   GET /api/interview/resumes/me
// @access  Private
router.get('/resumes/me', protect, getUserResume);

// @desc    List configuration-driven role profiles for the interview setup UI
router.get('/roles', protect, getRoleProfiles);
router.get('/companies', protect, getCompanyProfiles);

// @desc    Start a new interview session
// @route   POST /api/interview/sessions
// @access  Private
router.post('/sessions', protect, validate(startInterviewSchema), startInterview);

// @desc    Submit answer for a specific interview session
// @route   POST /api/interview/sessions/:id/answers
// @access  Private
router.post('/sessions/:id/answers', protect, validate(submitAnswerSchema), submitAnswer);

// @desc    Get candidate interview stats for profile chart
// @route   GET /api/interview/stats
// @access  Private
router.get('/stats', protect, getInterviewStats);

// @desc    Get candidate interview history
// @route   GET /api/interview/history
// @access  Private
router.get('/history', protect, getInterviewHistory);

// @desc    Download completed interview report as PDF
// @route   GET /api/interview/sessions/:id/report.pdf
// @access  Private
router.get('/sessions/:id/report.pdf', protect, validate(getInterviewReportSchema), downloadInterviewReportPdf);

// @desc    Get detailed interview report by session ID
// @route   GET /api/interview/sessions/:id
// @access  Private
router.get('/sessions/:id', protect, validate(getInterviewReportSchema), getInterviewReport);

export default router;
