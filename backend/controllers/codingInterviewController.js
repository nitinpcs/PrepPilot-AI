import { evaluateCodingSubmission } from '../services/groqService.js';
import { DOMAINS, LANGUAGES, runCodingSubmission, selectCodingProblem } from '../services/codingInterviewService.js';
import CodingInterviewSession from '../models/CodingInterviewSession.js';

const sessions = new Map();
const getSession = async (userId, sessionId = 'default') => {
  const key = `${userId}:${sessionId}`;
  if (!sessions.has(key)) {
    const stored = await CodingInterviewSession.findOne({ candidate: userId, sessionId }).lean();
    sessions.set(key, { history: stored?.history || [], attempts: {}, startedAt: Date.now() });
  }
  return sessions.get(key);
};
const persistSession = (userId, sessionId, session) => CodingInterviewSession.findOneAndUpdate(
  { candidate: userId, sessionId }, { $set: { history: session.history } }, { upsert: true, new: true, setDefaultsOnInsert: true }
);

const publicProblem = (problem) => ({ ...problem, hiddenTestCases: undefined, starterCode: undefined });
const languagePayload = (problem) => Object.entries(LANGUAGES).map(([id, config]) => ({ id, label: config.label, monaco: config.monaco, starter: problem.starterCode[id] || '' }));

export const getCodingProblem = async (req, res, next) => {
  try {
    const session = await getSession(req.user.id, req.query.sessionId);
    const selected = await selectCodingProblem({ ...req.query, history: session.history });
    session.currentProblemId = selected.problem.id;
    res.json({ success: true, problem: publicProblem(selected.problem), languages: languagePayload(selected.problem), domains: DOMAINS, adaptive: { recommendedDifficulty: selected.recommendedDifficulty, remaining: selected.remaining } });
  } catch (error) { next(error); }
};

export const runCode = async (req, res, next) => {
  try {
    const result = await runCodingSubmission({ ...req.body, problemId: req.body.problemId, includeHidden: false });
    res.json({ success: true, ...result, problem: undefined });
  } catch (error) { next(error); }
};

export const evaluateCode = async (req, res, next) => {
  try {
    const session = await getSession(req.user.id, req.body.sessionId);
    const result = await runCodingSubmission({ ...req.body, includeHidden: true });
    const feedback = await evaluateCodingSubmission({ problem: result.problem, language: LANGUAGES[req.body.language].label, code: req.body.code, result });
    const elapsedSeconds = Math.max(0, Math.round((Date.now() - session.startedAt) / 1000));
    const attempts = (session.attempts[result.problem.id] || 0) + 1;
    session.attempts[result.problem.id] = attempts;
    session.history.push({ problemId: result.problem.id, title: result.problem.title, topic: result.problem.topic, difficulty: result.problem.difficulty, submitted: true, timeTakenSeconds: elapsedSeconds, attempts, passedTests: result.passedCount, totalTests: result.totalCount, complexity: feedback.complexity, feedback: feedback.summary, score: feedback.score, submittedAt: new Date().toISOString() });
    await persistSession(req.user.id, req.body.sessionId || 'default', session);
    res.json({ success: true, ...result, problem: undefined, feedback, history: session.history, interviewerRemarks: feedback.interviewerRemarks || feedback.summary });
  } catch (error) { next(error); }
};

export const getCodingHistory = async (req, res, next) => {
  try { res.json({ success: true, history: (await getSession(req.user.id, req.query.sessionId)).history }); } catch (error) { next(error); }
};
