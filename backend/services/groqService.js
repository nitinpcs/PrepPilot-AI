import Groq from 'groq-sdk';
import dotenv from 'dotenv';

dotenv.config();

const GROQ_MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';

const STRICT_RUBRIC = `
STRICT EVALUATION POLICY (mandatory):
- Be honest, calibrated, and conservative. Do not inflate scores to be polite.
- Score 0-2: empty, off-topic, factually wrong, or "No response"/timeout answers.
- Score 3-4: major gaps, buzzwords without explanation, or only surface-level hints.
- Score 5-6: partially correct but missing key details, examples, or trade-offs.
- Score 7-8: solid, mostly correct answers with reasonable depth.
- Score 9-10: only for precise, complete answers with trade-offs, edge cases, and depth.
- Penalize hand-waving, missing complexity analysis, and incorrect terminology.
- Feedback must name specific gaps; avoid generic praise like "good job" without evidence.
`;

const getGroqClient = () => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('GROQ_API_KEY is not defined. Groq API is required for interview questions.');
  }
  return new Groq({ apiKey });
};

const chatCompletion = async (messages, { json = false, temperature = 0.4 } = {}) => {
  const groq = getGroqClient();
  const candidateModels = [
    ...(process.env.GROQ_MODEL ? [process.env.GROQ_MODEL] : []),
    'openai/gpt-oss-120b',
    'openai/gpt-oss-20b',
    'qwen/qwen3.8-27b',
    'llama-3.3-70b-versatile',
    'llama-3.1-8b-instant',
  ];

  const modelsToTry = [...new Set(candidateModels)];
  let lastError = null;

  for (const model of modelsToTry) {
    try {
      const completion = await groq.chat.completions.create({
        model,
        messages,
        temperature,
        ...(json ? { response_format: { type: 'json_object' } } : {}),
      });

      const text = completion.choices?.[0]?.message?.content;
      if (!text) {
        throw new Error(`Empty response from Groq API using model ${model}`);
      }
      return text.trim();
    } catch (error) {
      const isModelNotFound =
        error?.status === 404 ||
        error?.code === 'model_not_found' ||
        (error?.message && (error.message.includes('does not exist') || error.message.includes('model_not_found')));

      if (isModelNotFound) {
        console.warn(`Groq model "${model}" not found or inactive. Trying fallback model...`);
        lastError = error;
        continue;
      }
      throw error;
    }
  }

  throw lastError || new Error('No active Groq models succeeded.');
};

const parseJsonResponse = (responseText) => {
  const cleanJSONText = responseText.replace(/```json|```/g, '').trim();
  return JSON.parse(cleanJSONText);
};

const isWeakAnswer = (answer) => {
  const trimmed = (answer || '').trim().toLowerCase();
  if (!trimmed) return true;
  if (trimmed.includes('no response') || trimmed.includes('timeout')) return true;
  if (trimmed.length < 15) return true;
  return false;
};

/** Extracts structured JSON from raw resume text (skills, projects, experience, technologies, summary) */
export const extractStructuredResume = async (rawText) => {
  if (!rawText || rawText.trim().length < 20) {
    return {
      skills: [],
      projects: [],
      experience: [],
      technologies: [],
      summary: 'Short or unparseable document text.',
    };
  }

  try {
    const prompt = `You are an expert ATS (Applicant Tracking System) parser.
Extract structured technical profile information from the following raw resume text.

Resume Text:
"""
${rawText.slice(0, 10000)}
"""

Return JSON only in this exact shape:
{
  "skills": ["string"],
  "technologies": ["string"],
  "projects": [
    {
      "name": "string",
      "description": "string",
      "technologies": ["string"]
    }
  ],
  "experience": [
    {
      "role": "string",
      "company": "string",
      "duration": "string",
      "description": "string"
    }
  ],
  "summary": "string (2 sentence professional summary)"
}`;

    const responseText = await chatCompletion(
      [{ role: 'user', content: prompt }],
      { json: true, temperature: 0.1 }
    );
    const parsed = parseJsonResponse(responseText);

    return {
      skills: Array.isArray(parsed.skills) ? parsed.skills : [],
      technologies: Array.isArray(parsed.technologies) ? parsed.technologies : [],
      projects: Array.isArray(parsed.projects) ? parsed.projects : [],
      experience: Array.isArray(parsed.experience) ? parsed.experience : [],
      summary: parsed.summary || 'Professional candidate profile.',
    };
  } catch (error) {
    console.error('Error extracting structured resume via Groq API:', error);
    return {
      skills: [],
      technologies: [],
      projects: [],
      experience: [],
      summary: 'Parsed resume text stored.',
    };
  }
};

/** Generates the first or next domain-specific interview question */
export const generateNextQuestion = async (interview) => {
  const { topic, type, resumeText, parsedResume, questions, role, roleProfile, company, companyProfile, experienceLevel, difficulty, interviewMode } = interview;

  try {
    let resumeDetailsContext = '';
    if (type === 'resume' || type === 'role') {
      if (parsedResume && (parsedResume.skills?.length || parsedResume.projects?.length || parsedResume.experience?.length)) {
        resumeDetailsContext = `Candidate Structured Profile:
- Skills: ${parsedResume.skills?.join(', ') || 'N/A'}
- Technologies: ${parsedResume.technologies?.join(', ') || 'N/A'}
- Projects: ${parsedResume.projects?.map(p => `${p.name} (${p.technologies?.join(', ') || 'tech'}): ${p.description}`).join('; ') || 'N/A'}
- Experience: ${parsedResume.experience?.map(e => `${e.role} at ${e.company} (${e.duration})`).join('; ') || 'N/A'}
- Summary: ${parsedResume.summary || ''}`;
      } else if (resumeText) {
        resumeDetailsContext = `Raw Resume Text:\n"""\n${resumeText.slice(0, 4000)}\n"""`;
      }
    }

    const profileContext = roleProfile ? `\nRole: ${role}\nRequired domains: ${roleProfile.requiredDomains?.join(', ')}\nSkill weights: ${JSON.stringify(roleProfile.skillWeights)}\nDifficulty progression: ${JSON.stringify(roleProfile.difficultyProgression)}\nInterview strategy: ${roleProfile.interviewStrategy}\nFollow-up strategy: ${roleProfile.followUpStrategy}\nCandidate experience: ${experienceLevel}\nSelected difficulty: ${difficulty}\nInterview mode: ${interviewMode}` : '';
    const companyContext = companyProfile ? `\nTarget company: ${company}\nInterview rounds to simulate: ${companyProfile.interviewRounds?.join(' → ')}\nPreferred topics: ${companyProfile.preferredTopics?.join(', ')}\nCompany question difficulty: ${companyProfile.questionDifficulty}\nInterview style: ${companyProfile.interviewStyle}\nCoding vs theory ratio: ${companyProfile.codingTheoryRatio?.coding}% coding / ${companyProfile.codingTheoryRatio?.theory}% theory\nBehavioral emphasis: ${companyProfile.behavioralEmphasis}\nEvaluation criteria: ${companyProfile.evaluationCriteria?.join(', ')}\nCompany follow-up strategy: ${companyProfile.followUpStrategy}` : '';
    const systemContext = `You are a strict Senior Technical Interviewer conducting a realistic screening.
The interview topic is: ${topic}.
The interview type is: ${type === 'resume' ? 'Resume-Based' : type === 'role' ? 'Role-Based' : 'Topic-Based'}.
${profileContext}
${companyContext}
${resumeDetailsContext ? `${resumeDetailsContext}\n` : ''}

CRITICAL RULES:
- Ask exactly ONE question. No markdown, no fluff — question text only.
- Do not repeat topics or questions.
- For role interviews, cover configured domains in proportion to their weights and tailor to the resume when available.
- When a company is selected, simulate its documented configuration—not real confidential company questions. Match the company’s style, topic priorities, coding/theory balance, and behavioral emphasis.
- If type is 'resume', ask specific technical questions targeting the candidate's actual projects, listed technologies, or role experience.
- For Coding mode, favor implementation, debugging, complexity, and design questions. For Theory mode, favor concepts and trade-offs. For Mixed, alternate intentionally.
- Use prior Q/A and scores: if the candidate scored low, probe fundamentals; if high, increase difficulty.
- Progressively increase difficulty across the session.
- Questions must feel like a real interview, not a random quiz list.`;

    const chatHistory = questions.map((q) => {
      return `Interviewer: ${q.questionText}\nCandidate: ${q.candidateAnswer || '(no answer)'}\n[Score: ${q.score ?? 'unrated'}/10]\n`;
    }).join('\n');

    const prompt = `${systemContext}

Conversation so far:
${chatHistory || 'No questions yet. Start with a tailored initial question.'}

Next question:`;

    return await chatCompletion([{ role: 'user', content: prompt }], { temperature: 0.6 });
  } catch (error) {
    console.error('Error generating question from Groq API:', error);
    throw error;
  }
};

/** Evaluates a single candidate answer (strict) */
export const evaluateCandidateAnswer = async (questionText, candidateAnswer, interview = {}) => {
  if (isWeakAnswer(candidateAnswer)) {
    return {
      score: 0,
      evaluation:
        'No substantive answer was provided. The response did not demonstrate understanding of the question. Revisit core concepts and practice structured, detailed explanations.',
    };
  }

  try {
    const prompt = `${STRICT_RUBRIC}

You are grading one technical interview answer for permanent history. Be strict and specific.

Role context: ${interview.role || interview.topic || 'General technical'}; experience level: ${interview.experienceLevel || 'Fresher'}; selected difficulty: ${interview.difficulty || 'Intermediate'}.
Company context: ${interview.company ? `${interview.company}; criteria: ${(interview.companyProfile?.evaluationCriteria || []).join(', ')}` : 'No company selected'}.

Question: "${questionText}"
Candidate's Answer: "${candidateAnswer}"

Return JSON only:
{
  "score": number (0-10 integer),
  "evaluation": string (2-4 sentences, direct critique citing what was wrong or missing)
}`;

    const responseText = await chatCompletion(
      [{ role: 'user', content: prompt }],
      { json: true, temperature: 0.2 }
    );
    const data = parseJsonResponse(responseText);
    const score = Math.min(10, Math.max(0, Math.round(Number(data.score) || 0)));

    return {
      score,
      evaluation: data.evaluation || 'Answer recorded with limited technical depth.',
    };
  } catch (error) {
    console.error('Error evaluating answer via Groq API:', error);
    return {
      score: 3,
      evaluation:
        'Could not fully evaluate this answer automatically. Based on available content, the response appears incomplete or lacks sufficient technical detail for a strong score.',
    };
  }
};

/** Provides code-review feedback for the separate coding interview track. */
export const evaluateCodingSubmission = async ({ problem, language, code, result }) => {
  const fallback = {
    score: Math.round((result.passedCount / result.totalCount) * 10),
    summary: `${result.passedCount} of ${result.totalCount} visible tests passed.`,
    strengths: result.passedCount ? ['Produces correct output for at least some test cases'] : [],
    issues: result.stderr ? ['The submission produced a runtime or compilation error.'] : ['Review edge cases and the required return format.'],
    recommendations: ['Explain the algorithm, its time complexity, and its space complexity before submitting.'],
    complexity: 'Unable to determine automatically.',
    readability: ['Review naming, decomposition, and comments before the next submission.'],
    betterApproach: 'Start from the target complexity and choose a data structure that removes repeated work.',
    interviewerRemarks: 'Discuss the algorithm and its trade-offs before moving to the next question.',
  };

  try {
    const prompt = `You are a senior engineer reviewing a coding-interview submission. Be concise, strict, and practical.\n\nProblem: ${problem.title}\n${problem.prompt}\n\nLanguage: ${language}\nVisible test result: ${result.passedCount}/${result.totalCount} passed\nRuntime stderr: ${result.stderr || '(none)'}\n\nCode:\n\`\`\`\n${code.slice(0, 12000)}\n\`\`\`\n\nReturn JSON only:\n{\n  "score": number (0-10),\n  "summary": string,\n  "strengths": ["string"],\n  "issues": ["string"],\n  "recommendations": ["string"],\n  "complexity": "string"\n}`;
    const responseText = await chatCompletion([{ role: 'user', content: prompt }], { json: true, temperature: 0.2 });
    const data = parseJsonResponse(responseText);
    return {
      score: Math.min(10, Math.max(0, Math.round(Number(data.score) || fallback.score))),
      summary: data.summary || fallback.summary,
      strengths: Array.isArray(data.strengths) ? data.strengths : fallback.strengths,
      issues: Array.isArray(data.issues) ? data.issues : fallback.issues,
      recommendations: Array.isArray(data.recommendations) ? data.recommendations : fallback.recommendations,
      complexity: data.complexity || fallback.complexity,
      readability: Array.isArray(data.readability) ? data.readability : fallback.readability,
      betterApproach: data.betterApproach || fallback.betterApproach,
      interviewerRemarks: data.interviewerRemarks || fallback.interviewerRemarks,
    };
  } catch (error) {
    console.error('Error evaluating coding submission via Groq API:', error);
    return fallback;
  }
};

/** Compiles the final aggregate interview scorecard (strict) */
export const compileInterviewFeedback = async (interview) => {
  const { topic, type, questions, role, roleProfile, company, companyProfile, experienceLevel } = interview;

  const answered = questions.filter((q) => q.candidateAnswer != null);
  const avgQuestionScore =
    answered.length > 0
      ? answered.reduce((sum, q) => sum + (Number(q.score) || 0), 0) / answered.length
      : 0;
  const honestOverall = Math.round((avgQuestionScore / 10) * 100);

  try {
    const chatHistory = questions.map((q, idx) => {
      return `Q${idx + 1}: ${q.questionText}\nAnswer: ${q.candidateAnswer || '(none)'}\nPer-question score: ${q.score ?? 0}/10\nFeedback: ${q.evaluation || 'N/A'}\n`;
    }).join('\n');

    const prompt = `${STRICT_RUBRIC}

You are compiling a final honest scorecard stored in the candidate's permanent interview history.
Do not inflate scores. The mathematical average of per-question scores is approximately ${honestOverall}/100 — your overallScore should stay within ±8 points of that unless strongly justified.

Interview Topic: ${topic}
Interview Type: ${type}
Role: ${role || 'Not configured'}
Experience level: ${experienceLevel || 'Not configured'}
Role domains and weights: ${roleProfile ? JSON.stringify({ domains: roleProfile.requiredDomains, weights: roleProfile.skillWeights, rubric: roleProfile.evaluationRubric }) : 'Use session topics'}
Company: ${company || 'Not configured'}
Company evaluation profile: ${companyProfile ? JSON.stringify({ criteria: companyProfile.evaluationCriteria, style: companyProfile.interviewStyle, behavioralEmphasis: companyProfile.behavioralEmphasis }) : 'Not configured'}

Full session:
${chatHistory}

Return JSON only:
{
  "overallScore": number (0-100),
  "communicationScore": number (1-10),
  "technicalScore": number (1-10),
  "problemSolvingScore": number (1-10),
  "summary": string (3-4 sentences, honest and constructive),
  "strengths": ["string"] (only evidence-backed strengths from answers),
  "weaknesses": ["string"] (specific gaps to fix),
  "skillScores": [{ "skill": "string", "score": number (0-100) }],
  "hiringRecommendation": "Strong Hire | Hire | Lean No Hire | No Hire",
  "missingSkills": ["string"],
  "learningRoadmap": ["string"] (3-5 concrete next steps),
  "practiceQuestions": ["string"] (3 role-specific questions),
  "companyFit": "string (concise assessment against the selected company criteria)",
  "companyFeedback": "string (2-3 sentences with company-style, evidence-based feedback)"
}`;

    const responseText = await chatCompletion(
      [{ role: 'user', content: prompt }],
      { json: true, temperature: 0.25 }
    );
    const data = parseJsonResponse(responseText);

    return {
      overallScore: Math.min(100, Math.max(0, Math.round(Number(data.overallScore) ?? honestOverall))),
      communicationScore: Math.min(10, Math.max(1, Math.round(Number(data.communicationScore) || 5))),
      technicalScore: Math.min(10, Math.max(1, Math.round(Number(data.technicalScore) || 5))),
      problemSolvingScore: Math.min(10, Math.max(1, Math.round(Number(data.problemSolvingScore) || 5))),
      summary: data.summary || 'Session completed. Review per-question feedback for targeted improvement.',
      strengths: Array.isArray(data.strengths) ? data.strengths : [],
      weaknesses: Array.isArray(data.weaknesses) ? data.weaknesses : [],
      skillScores: Array.isArray(data.skillScores) ? data.skillScores.map((item) => ({ skill: item.skill || 'General', score: Math.min(100, Math.max(0, Math.round(Number(item.score) || 0))) })) : [],
      hiringRecommendation: data.hiringRecommendation || (honestOverall >= 75 ? 'Hire' : honestOverall >= 55 ? 'Lean No Hire' : 'No Hire'),
      missingSkills: Array.isArray(data.missingSkills) ? data.missingSkills : [],
      learningRoadmap: Array.isArray(data.learningRoadmap) ? data.learningRoadmap : [],
      practiceQuestions: Array.isArray(data.practiceQuestions) ? data.practiceQuestions : [],
      companyFit: data.companyFit || '',
      companyFeedback: data.companyFeedback || '',
    };
  } catch (error) {
    console.error('Error compiling final feedback via Groq API:', error);
    return {
      overallScore: honestOverall,
      communicationScore: Math.max(1, Math.round(avgQuestionScore)),
      technicalScore: Math.max(1, Math.round(avgQuestionScore)),
      problemSolvingScore: Math.max(1, Math.round(avgQuestionScore)),
      summary:
        'Interview completed. Scores reflect average performance across answers. Focus on depth, accuracy, and explicit trade-offs in future sessions.',
      strengths: avgQuestionScore >= 7 ? ['Demonstrated baseline familiarity on some questions'] : [],
      skillScores: [],
      hiringRecommendation: honestOverall >= 70 ? 'Hire' : 'No Hire',
      missingSkills: [],
      learningRoadmap: ['Review the weakest interview domains.', 'Practice explaining trade-offs with concrete examples.'],
      practiceQuestions: [],
      companyFit: company ? 'Company-specific fit could not be fully assessed; review the session evidence and target criteria.' : '',
      companyFeedback: company ? `Practice the selected ${company} interview style with structured, evidence-based answers.` : '',
      weaknesses: ['Insufficient depth or accuracy on multiple responses — review fundamentals and practice structured answers'],
    };
  }
};
