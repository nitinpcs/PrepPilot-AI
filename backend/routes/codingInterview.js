import express from 'express';
import { protect } from '../middleware/auth.js';
import { getCodingProblem, runCode, evaluateCode, getCodingHistory } from '../controllers/codingInterviewController.js';

const router = express.Router();

router.get('/problem', protect, getCodingProblem);
router.get('/history', protect, getCodingHistory);
router.post('/run', protect, runCode);
router.post('/evaluate', protect, evaluateCode);

export default router;
