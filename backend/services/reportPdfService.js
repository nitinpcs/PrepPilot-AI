import PDFDocument from 'pdfkit';

const COLORS = { navy: '#0F172A', cyan: '#0891B2', slate: '#475569', light: '#E2E8F0', green: '#047857', amber: '#B45309', red: '#B91C1C' };
const text = (value, fallback = 'Not recorded') => String(value || fallback).replace(/[\u2013\u2014]/g, '-');
const scoreColor = (score) => (score >= 7 ? COLORS.green : score >= 5 ? COLORS.amber : COLORS.red);

const roadmap = (feedback) => {
  const items = [];
  if (feedback.technicalScore < 7) items.push('Strengthen core technical concepts through targeted drills and concise explanations.');
  if (feedback.problemSolvingScore < 7) items.push('Practice a structured approach: clarify assumptions, state the solution, then discuss trade-offs.');
  if (feedback.communicationScore < 7) items.push('Use a clear response structure: definition, approach, example, complexity, and trade-offs.');
  (feedback.weaknesses || []).slice(0, 2).forEach((item) => items.push(`Address: ${text(item)}.`));
  return (items.length ? items : ['Maintain progress with harder questions and explicit trade-off discussion.']).slice(0, 4);
};

const section = (doc, title) => {
  doc.moveDown(0.9).fontSize(15).font('Helvetica-Bold').fillColor(COLORS.navy).text(title);
  doc.moveTo(48, doc.y + 6).lineTo(548, doc.y + 6).strokeColor(COLORS.light).stroke();
  doc.moveDown(0.8);
};

export const buildInterviewReportPdf = ({ interview, candidate }) => new Promise((resolve, reject) => {
  const doc = new PDFDocument({ size: 'A4', margin: 48, bufferPages: true, info: { Title: `${text(interview.topic)} Interview Report`, Author: 'AI Interview Copilot' } });
  const chunks = [];
  doc.on('data', (chunk) => chunks.push(chunk));
  doc.on('end', () => resolve(Buffer.concat(chunks)));
  doc.on('error', reject);

  const feedback = interview.feedback || {};
  doc.rect(0, 0, 595, 145).fill(COLORS.navy);
  doc.fontSize(11).font('Helvetica-Bold').fillColor('#67E8F9').text('AI INTERVIEW COPILOT', 48, 42);
  doc.fontSize(24).fillColor('#FFFFFF').text('Interview Performance Report', 48, 62);
  doc.fontSize(10).font('Helvetica').fillColor('#CBD5E1').text(`${text(interview.topic)} | ${interview.type === 'resume' ? 'Resume-Based' : 'Theory'} Interview`, 48, 98);
  doc.roundedRect(438, 46, 105, 64, 10).fill('#164E63');
  doc.fontSize(9).fillColor('#BAE6FD').text('OVERALL SCORE', 446, 58, { width: 90, align: 'center' });
  doc.fontSize(27).font('Helvetica-Bold').fillColor('#FFFFFF').text(`${Number(feedback.overallScore || 0)}%`, 446, 74, { width: 90, align: 'center' });
  doc.y = 170;

  section(doc, 'Candidate Details');
  const details = [['Candidate', text(candidate?.name)], ['Email', text(candidate?.email)], ['Interview date', new Date(interview.createdAt).toLocaleDateString('en-IN', { dateStyle: 'long' })], ['Interview type', interview.type === 'role' ? 'Role-Based' : interview.type === 'resume' ? 'Resume-Based' : 'Theory-Based'], ['Company', text(interview.company, 'Not selected')], ['Role / topic', text(interview.role || interview.topic)], ['Experience level', text(interview.experienceLevel)], ['Format', text(interview.interviewMode)], ['Questions completed', String(interview.questions?.length || 0)]];
  for (let index = 0; index < details.length; index += 2) {
    const rowY = doc.y;
    details.slice(index, index + 2).forEach(([label, value], side) => {
      const x = side ? 300 : 48;
      doc.fontSize(8).font('Helvetica-Bold').fillColor(COLORS.slate).text(label.toUpperCase(), x, rowY);
      doc.fontSize(10).font('Helvetica').fillColor(COLORS.navy).text(value, x, rowY + 12, { width: 210 });
    });
    doc.y = rowY;
    doc.moveDown(2.3);
  }

  section(doc, 'Skill-Wise Scores');
  [['Technical', feedback.technicalScore], ['Problem Solving', feedback.problemSolvingScore], ['Communication', feedback.communicationScore]].forEach(([label, rawScore]) => {
    const score = Number(rawScore || 0);
    doc.fontSize(10).font('Helvetica-Bold').fillColor(COLORS.navy).text(label, 48, doc.y, { continued: true });
    doc.font('Helvetica').fillColor(scoreColor(score)).text(`  ${score}/10`, { align: 'right' });
    const y = doc.y + 7;
    doc.roundedRect(48, y, 500, 8, 4).fill(COLORS.light);
    doc.roundedRect(48, y, Math.max(0, Math.min(500, score * 50)), 8, 4).fill(scoreColor(score));
    doc.moveDown(1.7);
  });

  section(doc, 'Interview Summary');
  doc.fontSize(10).font('Helvetica').fillColor(COLORS.slate).text(text(feedback.summary), { lineGap: 4 });
  if (feedback.hiringRecommendation) {
    section(doc, 'Hiring Recommendation');
    doc.fontSize(13).font('Helvetica-Bold').fillColor(COLORS.cyan).text(text(feedback.hiringRecommendation));
  }
  if (feedback.companyFit || feedback.companyFeedback) {
    section(doc, 'Company Interview Assessment');
    if (feedback.companyFit) doc.fontSize(10).font('Helvetica-Bold').fillColor(COLORS.navy).text(`Fit: ${text(feedback.companyFit)}`, { lineGap: 3 });
    if (feedback.companyFeedback) doc.moveDown(0.3).fontSize(10).font('Helvetica').fillColor(COLORS.slate).text(text(feedback.companyFeedback), { lineGap: 3 });
  }
  if (feedback.skillScores?.length) {
    section(doc, 'Role Skill Scores');
    feedback.skillScores.forEach((item) => doc.fontSize(10).font('Helvetica').fillColor(COLORS.slate).text(`${text(item.skill)}: ${Number(item.score || 0)}%`));
  }
  section(doc, 'Strengths');
  (feedback.strengths?.length ? feedback.strengths : ['No specific strengths were recorded for this session.']).forEach((item) => doc.fillColor(COLORS.green).fontSize(11).text('•', { continued: true }).fillColor(COLORS.slate).fontSize(10).text(`  ${text(item)}`, { lineGap: 3 }));
  section(doc, 'Development Areas');
  (feedback.weaknesses?.length ? feedback.weaknesses : ['No major development areas were flagged.']).forEach((item) => doc.fillColor(COLORS.amber).fontSize(11).text('•', { continued: true }).fillColor(COLORS.slate).fontSize(10).text(`  ${text(item)}`, { lineGap: 3 }));
  section(doc, 'Improvement Roadmap');
  (feedback.learningRoadmap?.length ? feedback.learningRoadmap : roadmap(feedback)).forEach((item, index) => {
    doc.roundedRect(48, doc.y, 20, 20, 10).fill(COLORS.cyan);
    doc.fontSize(9).font('Helvetica-Bold').fillColor('#FFFFFF').text(String(index + 1), 48, doc.y + 5, { width: 20, align: 'center' });
    doc.fontSize(10).font('Helvetica').fillColor(COLORS.slate).text(item, 80, doc.y - 14, { width: 468, lineGap: 3 });
    doc.moveDown(1.5);
  });
  if (feedback.practiceQuestions?.length) {
    section(doc, 'Suggested Practice Questions');
    feedback.practiceQuestions.forEach((item) => doc.fontSize(10).font('Helvetica').fillColor(COLORS.slate).text(`• ${text(item)}`, { lineGap: 3 }));
  }

  doc.addPage();
  doc.fontSize(20).font('Helvetica-Bold').fillColor(COLORS.navy).text('Question Summary');
  doc.fontSize(10).font('Helvetica').fillColor(COLORS.slate).text('A question-by-question record of your responses and interviewer feedback.');
  doc.moveDown(1);
  (interview.questions || []).forEach((question, index) => {
    if (doc.y > 650) doc.addPage();
    const score = Number(question.score || 0);
    const startY = doc.y;
    doc.roundedRect(48, startY, 500, 27, 5).fill('#F1F5F9');
    doc.fontSize(10).font('Helvetica-Bold').fillColor(COLORS.navy).text(`Question ${index + 1}`, 60, startY + 8);
    doc.fontSize(10).fillColor(scoreColor(score)).text(`${score}/10`, 478, startY + 8, { width: 58, align: 'right' });
    doc.y = startY + 38;
    doc.fontSize(10).font('Helvetica-Bold').fillColor(COLORS.navy).text(text(question.questionText), { lineGap: 3 });
    doc.moveDown(0.4).fontSize(8).font('Helvetica-Bold').fillColor(COLORS.slate).text('CANDIDATE RESPONSE');
    doc.fontSize(9).font('Helvetica').fillColor(COLORS.slate).text(text(question.candidateAnswer, 'No response recorded.'), { lineGap: 3 });
    doc.moveDown(0.4).fontSize(8).font('Helvetica-Bold').fillColor(COLORS.cyan).text('INTERVIEWER FEEDBACK');
    doc.fontSize(9).font('Helvetica').fillColor(COLORS.slate).text(text(question.evaluation, 'No detailed feedback recorded.'), { lineGap: 3 });
    doc.moveDown(1.1);
  });

  const pages = doc.bufferedPageRange();
  for (let page = 0; page < pages.count; page += 1) {
    doc.switchToPage(page);
    doc.fontSize(8).fillColor(COLORS.slate).text(`AI Interview Copilot | Confidential candidate report | Page ${page + 1}`, 48, 792, { width: 500, align: 'center' });
  }
  doc.end();
});
