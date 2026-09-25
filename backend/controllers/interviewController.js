import pdf from 'pdf-parse';
import Interview from '../models/Interview.js';
import User from '../models/User.js';
import { NotFoundError } from '../errors/ApiError.js';
import { buildInterviewReportPdf } from '../services/reportPdfService.js';
import { getRoleProfile, listRoleProfiles } from '../config/roleProfiles.js';
import { getCompanyProfile, listCompanyProfiles } from '../config/companyProfiles.js';
import {
  generateNextQuestion,
  evaluateCandidateAnswer,
  compileInterviewFeedback,
  extractStructuredResume
} from '../services/groqService.js';

const MAX_QUESTIONS = 10;

export const getRoleProfiles = (req, res) => res.status(200).json({ success: true, roles: listRoleProfiles() });
export const getCompanyProfiles = (req, res) => res.status(200).json({ success: true, companies: listCompanyProfiles() });

// @desc    Parse PDF resume once to extract text + structured JSON (skills, projects, experience, tech)
// @route   POST /api/interview/resumes
// @access  Private
export const parseResume = async (req, res, next) => {
  const { base64File } = req.body;

  try {
    const matches = base64File.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.*)$/);
    
    let buffer;
    if (matches && matches.length === 3) {
      buffer = Buffer.from(matches[2], 'base64');
    } else {
      buffer = Buffer.from(base64File, 'base64');
    }

    const pdfData = await pdf(buffer);
    const rawText = pdfData.text || '';

    // Extract structured data via AI once
    const structuredData = await extractStructuredResume(rawText);

    // Save to user model
    const user = await User.findById(req.user._id);
    user.parsedResume = {
      rawText,
      ...structuredData,
      updatedAt: new Date(),
    };
    await user.save();

    res.status(200).json({
      success: true,
      text: rawText,
      parsedResume: user.parsedResume,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get stored parsed resume for logged in user
// @route   GET /api/interview/resumes/me
// @access  Private
export const getUserResume = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('parsedResume');
    res.status(200).json({
      success: true,
      parsedResume: user.parsedResume || null,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Start a new interview
// @route   POST /api/interview/sessions
// @access  Private
export const startInterview = async (req, res, next) => {
  const { topic, type, resumeText, role, company, experienceLevel = 'Fresher', difficulty = 'Intermediate', duration = 30, interviewMode = 'Mixed' } = req.body;

  try {
    // If there is any active interview, mark it as completed or delete it
    await Interview.deleteMany({ candidate: req.user._id, status: 'active' });

    const roleProfile = role ? getRoleProfile(role) : null;
    if (role && !roleProfile) {
      return res.status(400).json({ success: false, message: `Unsupported role: ${role}` });
    }
    const companyProfile = company ? getCompanyProfile(company) : null;
    if (company && !companyProfile) {
      return res.status(400).json({ success: false, message: `Unsupported company: ${company}` });
    }

    const sessionType = role ? 'role' : (type === 'resume' ? 'resume' : 'topic');
    const questionCount = Math.max(4, Math.min(20, Math.round(duration / 3)));
    // Role sessions may use a parsed resume to tailor questions without making it a required input.
    const user = await User.findById(req.user._id);
    const parsedResumeData = (sessionType === 'resume' || sessionType === 'role') ? (user.parsedResume || undefined) : undefined;

    const interview = new Interview({
      candidate: req.user._id,
      topic: role || topic,
      type: sessionType,
      role: role || '',
      roleProfile,
      company: company || '',
      companyProfile,
      experienceLevel,
      difficulty,
      duration,
      interviewMode,
      maxQuestions: questionCount,
      resumeText: (sessionType === 'resume' || sessionType === 'role') ? (resumeText || user.parsedResume?.rawText) : undefined,
      parsedResume: parsedResumeData,
      status: 'active',
      questions: [],
    });

    // Generate first question
    const firstQuestionText = await generateNextQuestion(interview);
    
    interview.questions.push({
      questionText: firstQuestionText,
    });

    await interview.save();

    res.status(200).json({
      success: true,
      interviewId: interview._id,
      topic: interview.topic,
      type: interview.type,
      role: interview.role,
      company: interview.company,
      question: firstQuestionText,
      questionIndex: 0,
      totalQuestions: interview.maxQuestions || MAX_QUESTIONS,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Submit answer and get next question or final feedback
// @route   POST /api/interview/answer
// @access  Private
export const submitAnswer = async (req, res, next) => {
  const { id } = req.params;
  const { answer } = req.body;

  try {
    const interview = await Interview.findOne({
      _id: id,
      candidate: req.user._id,
      status: 'active',
    });

    if (!interview) throw new NotFoundError('Active interview session not found');

    const currentQuestionIndex = interview.questions.length - 1;
    const currentQuestion = interview.questions[currentQuestionIndex];

    // Update current question with the candidate's answer
    currentQuestion.candidateAnswer = answer || 'No response';

    // Evaluate current answer
    const evaluationResult = await evaluateCandidateAnswer(currentQuestion.questionText, currentQuestion.candidateAnswer, interview);
    currentQuestion.evaluation = evaluationResult.evaluation;
    currentQuestion.score = evaluationResult.score;

    // Check if interview is completed
    if (interview.questions.length >= (interview.maxQuestions || MAX_QUESTIONS)) {
      // End interview and compile feedback
      interview.status = 'completed';
      
      const finalFeedback = await compileInterviewFeedback(interview);
      interview.feedback = {
        overallScore: finalFeedback.overallScore,
        communicationScore: finalFeedback.communicationScore,
        technicalScore: finalFeedback.technicalScore,
        problemSolvingScore: finalFeedback.problemSolvingScore,
        summary: finalFeedback.summary,
        strengths: finalFeedback.strengths,
        weaknesses: finalFeedback.weaknesses,
        skillScores: finalFeedback.skillScores,
        hiringRecommendation: finalFeedback.hiringRecommendation,
        missingSkills: finalFeedback.missingSkills,
        learningRoadmap: finalFeedback.learningRoadmap,
        practiceQuestions: finalFeedback.practiceQuestions,
        companyFit: finalFeedback.companyFit,
        companyFeedback: finalFeedback.companyFeedback,
      };

      await interview.save();

      return res.status(200).json({
        success: true,
        status: 'completed',
        feedback: interview.feedback,
        questions: interview.questions,
      });
    } else {
      // Generate next question
      const nextQuestionText = await generateNextQuestion(interview);
      
      interview.questions.push({
        questionText: nextQuestionText,
      });

      await interview.save();

      res.status(200).json({
        success: true,
        status: 'active',
        evaluation: currentQuestion.evaluation,
        score: currentQuestion.score,
        nextQuestion: nextQuestionText,
        questionIndex: interview.questions.length - 1,
        totalQuestions: interview.maxQuestions || MAX_QUESTIONS,
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get candidate interview stats for profile chart
// @route   GET /api/interview/stats
// @access  Private
export const getInterviewStats = async (req, res, next) => {
  try {
    const interviews = await Interview.find({
      candidate: req.user._id,
      status: 'completed',
    }).sort({ createdAt: 1 });

    if (interviews.length === 0) {
      return res.status(200).json({
        success: true,
        stats: {
          totalInterviews: 0,
          averageScore: 0,
          highestScore: 0,
          improvementTrend: { value: '0%', direction: 'stable', diff: 0 },
          strengths: [],
          weaknesses: [],
          scoreHistory: [],
          recentInterviews: [],
          skillsBreakdown: {
            dsa: 0,
            dbms: 0,
            oops: 0,
            react: 0,
            mern: 0,
            springboot: 0,
            systemDesign: 0,
          }
        }
      });
    }

    let totalScoreSum = 0;
    let highestScore = 0;
    const strengthsCount = {};
    const weaknessesCount = {};
    const topicScores = {
      dsa: [], dbms: [], oops: [], react: [], mern: [], springboot: [], 'system design': [], resume: []
    };

    const scoreHistory = interviews.map((int) => {
      const score = int.feedback.overallScore;
      totalScoreSum += score;
      if (score > highestScore) highestScore = score;

      // Track strengths and weaknesses
      int.feedback.strengths?.forEach(s => {
        strengthsCount[s] = (strengthsCount[s] || 0) + 1;
      });
      int.feedback.weaknesses?.forEach(w => {
        weaknessesCount[w] = (weaknessesCount[w] || 0) + 1;
      });

      // Track topic scores
      const normalizedTopic = int.topic.toLowerCase();
      if (topicScores[normalizedTopic]) {
        topicScores[normalizedTopic].push(score);
      } else {
        topicScores[normalizedTopic] = [score];
      }

      return {
        id: int._id,
        date: int.createdAt.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        score,
        topic: int.topic,
        type: int.type,
      };
    });

    // Calculate Improvement Trend (compare first half vs second half or first 3 vs last 3)
    let trendDirection = 'stable';
    let trendDiff = 0;

    if (interviews.length >= 2) {
      const half = Math.floor(interviews.length / 2);
      const earlySlice = interviews.slice(0, Math.max(1, half));
      const recentSlice = interviews.slice(-Math.max(1, half));

      const earlyAvg = earlySlice.reduce((a, b) => a + b.feedback.overallScore, 0) / earlySlice.length;
      const recentAvg = recentSlice.reduce((a, b) => a + b.feedback.overallScore, 0) / recentSlice.length;

      trendDiff = Math.round(recentAvg - earlyAvg);
      if (trendDiff > 0) trendDirection = 'up';
      else if (trendDiff < 0) trendDirection = 'down';
    }

    const improvementTrend = {
      value: `${trendDiff >= 0 ? '+' : ''}${trendDiff}%`,
      direction: trendDirection,
      diff: trendDiff,
    };

    // Get unique strengths and weaknesses sorted by frequency
    const strengths = Object.keys(strengthsCount).sort((a, b) => strengthsCount[b] - strengthsCount[a]).slice(0, 6);
    const weaknesses = Object.keys(weaknessesCount).sort((a, b) => weaknessesCount[b] - weaknessesCount[a]).slice(0, 6);

    // Compute averages per topic for the skill radar-map
    const getAvg = (arr) => arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;
    
    const skillsBreakdown = {
      dsa: getAvg(topicScores['dsa'] || []),
      dbms: getAvg(topicScores['dbms'] || []),
      oops: getAvg(topicScores['oops'] || []),
      react: getAvg(topicScores['react'] || []),
      mern: getAvg(topicScores['mern'] || []),
      springboot: getAvg(topicScores['springboot'] || []),
      systemDesign: getAvg(topicScores['system design'] || []),
    };

    const recentInterviews = scoreHistory.slice(-5).reverse();

    res.status(200).json({
      success: true,
      stats: {
        totalInterviews: interviews.length,
        averageScore: Math.round(totalScoreSum / interviews.length),
        highestScore,
        improvementTrend,
        strengths,
        weaknesses,
        scoreHistory,
        recentInterviews,
        skillsBreakdown,
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get candidate interview history
// @route   GET /api/interview/history
// @access  Private
export const getInterviewHistory = async (req, res, next) => {
  try {
    const interviews = await Interview.find({ candidate: req.user._id })
      .sort({ createdAt: -1 })
      .select('topic type status feedback createdAt');

    res.status(200).json({
      success: true,
      interviews,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get detailed interview report by ID
// @route   GET /api/interview/:id
// @access  Private
export const getInterviewReport = async (req, res, next) => {
  try {
    const interview = await Interview.findOne({
      _id: req.params.id,
      candidate: req.user._id,
    });

    if (!interview) throw new NotFoundError('Interview report not found');

    res.status(200).json({
      success: true,
      interview,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Download a completed interview report as PDF
// @route   GET /api/interview/sessions/:id/report.pdf
// @access  Private
export const downloadInterviewReportPdf = async (req, res, next) => {
  try {
    const interview = await Interview.findOne({ _id: req.params.id, candidate: req.user._id }).populate('candidate', 'name email');
    if (!interview) throw new NotFoundError('Interview report not found');
    if (interview.status !== 'completed') throw new NotFoundError('A PDF report is available after the interview is completed');

    const pdfBuffer = await buildInterviewReportPdf({ interview, candidate: interview.candidate });
    const filename = `interview-report-${String(interview.topic).replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'session'}.pdf`;
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': pdfBuffer.length,
      'Cache-Control': 'no-store',
    });
    res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
};
