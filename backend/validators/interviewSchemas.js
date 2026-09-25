import { z } from 'zod';

// ─── Shared field definitions ────────────────────────────────────────────────

const mongoIdField = z
  .string({ required_error: 'Interview ID is required' })
  .regex(/^[a-f\d]{24}$/i, 'Invalid interview ID format');

// ─── Interview schemas ───────────────────────────────────────────────────────

/**
 * POST /api/interview/resumes
 * Parse PDF resume — expects a base64-encoded file string
 */
export const parseResumeSchema = z.object({
  body: z.object({
    base64File: z
      .string({ required_error: 'File content is required' })
      .min(1, 'File content is required'),
  }),
});

/**
 * POST /api/interview/sessions
 * Start a new interview session
 */
export const startInterviewSchema = z.object({
  body: z.object({
    topic: z
      .string({ required_error: 'Topic is required' })
      .min(1, 'Topic is required'),
    type: z.enum(['topic', 'resume', 'role', 'dsa', 'dbms', 'oops', 'react', 'mern', 'springboot', 'system design']).optional(),
    role: z.string().min(1).optional(),
    company: z.string().min(1).optional(),
    experienceLevel: z.enum(['Fresher', '1-3 years', '3-5 years', 'Senior']).optional(),
    difficulty: z.enum(['Beginner', 'Intermediate', 'Advanced']).optional(),
    duration: z.number().int().min(10).max(120).optional(),
    interviewMode: z.enum(['Theory', 'Coding', 'Mixed']).optional(),
    resumeText: z.string().optional(),
  }),
});

/**
 * POST /api/interview/sessions/:id/answers
 * Submit an answer for an active interview session
 */
export const submitAnswerSchema = z.object({
  params: z.object({
    id: mongoIdField,
  }),
  body: z.object({
    answer: z.string().optional(),
  }),
});

/**
 * GET /api/interview/sessions/:id
 * Get a detailed interview report by session ID
 */
export const getInterviewReportSchema = z.object({
  params: z.object({
    id: mongoIdField,
  }),
});
