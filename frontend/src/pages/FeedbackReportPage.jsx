import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  ShieldAlert, LayoutDashboard, Loader, Download, Share2, Sparkles
} from 'lucide-react';
import Skeleton, { SkeletonText } from '../components/Skeleton';

const scoreTier = (score) => {
  if (score >= 8) return 'tier-green';
  if (score >= 5) return 'tier-amber';
  return 'tier-red';
};

const FeedbackReportPage = () => {
  const { id } = useParams();
  const { getHeaders, apiUrl } = useAuth();
  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tagAnim, setTagAnim] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState('');

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const res = await fetch(`${apiUrl}/api/interview/sessions/${id}`, { headers: getHeaders() });
        const data = await res.json();
        if (data.success) setInterview(data.interview);
        else setError(data.message || 'Report not found');
      } catch {
        setError('Connection failure retrieving scorecard');
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [id]);

  useEffect(() => {
    if (interview) {
      const t = setTimeout(() => setTagAnim(true), 200);
      return () => clearTimeout(t);
    }
  }, [interview]);

  const handleDownload = async () => {
    if (!interview) return;
    setDownloading(true);
    setDownloadError('');
    try {
      const response = await fetch(`${apiUrl}/api/interview/sessions/${id}/report.pdf`, { headers: getHeaders() });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || 'Could not generate PDF report');
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `interview-report-${id}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch (downloadError) {
      setDownloadError(downloadError.message || 'Could not download PDF report');
    } finally {
      setDownloading(false);
    }
    return;
    const { topic, feedback, questions } = interview;
    const lines = [
      `AI Interview Copilot — ${topic} Debrief`,
      `Overall: ${feedback.overallScore}%`,
      '',
      feedback.summary,
      '',
      '--- Questions ---',
      ...questions.map((q, i) =>
        `Q${i + 1} (${q.score}/10): ${q.questionText}\nAnswer: ${q.candidateAnswer}\nFeedback: ${q.evaluation}\n`
      ),
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `interview-report-${id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleShare = async () => {
    if (!interview || !navigator.share) {
      handleDownload();
      return;
    }
    try {
      await navigator.share({
        title: `${interview.topic} Interview Report`,
        text: `Score: ${interview.feedback.overallScore}% — ${interview.feedback.summary}`,
      });
    } catch {
      /* user cancelled */
    }
  };

  if (loading) {
    return (
      <div className="debrief">
        {/* Header Skeleton */}
        <div className="debrief-header glass-panel" style={{ minHeight: '140px' }}>
          <Skeleton width="120px" height="120px" borderRadius="16px" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
            <Skeleton width="100px" height="14px" />
            <Skeleton width="60%" height="28px" />
            <Skeleton width="40%" height="14px" />
          </div>
        </div>

        {/* Metrics Bar Skeleton */}
        <div className="metrics-scroll" style={{ marginTop: '20px' }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="metric-card glass-panel" style={{ width: '220px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <Skeleton width="80px" height="12px" />
              <Skeleton width="120px" height="32px" />
              <Skeleton width="100%" height="4px" />
            </div>
          ))}
        </div>

        {/* Summary Block Skeleton */}
        <div className="summary-block glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '20px' }}>
          <Skeleton width="200px" height="20px" />
          <SkeletonText lines={3} />
        </div>

        {/* Audit Cards Skeleton */}
        <div className="audit-list" style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="audit-card glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Skeleton width="80px" height="14px" />
                <Skeleton width="40px" height="14px" />
              </div>
              <Skeleton width="85%" height="18px" />
              <SkeletonText lines={2} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !interview) {
    return (
      <div className="debrief-loading">
        <ShieldAlert size={48} color="var(--error)" />
        <p>{error || 'Report unavailable'}</p>
        <Link to="/dashboard" className="btn-secondary">Dashboard</Link>
      </div>
    );
  }

  const { topic, type, company, questions, feedback, createdAt } = interview;
  const metrics = [
    { label: 'Technical', value: feedback.technicalScore, max: 10 },
    { label: 'Problem Solving', value: feedback.problemSolvingScore, max: 10 },
    { label: 'Communication', value: feedback.communicationScore, max: 10 },
    { label: 'Overall', value: feedback.overallScore, max: 100, suffix: '%' },
  ];

  return (
    <div className="debrief">
      {downloadError && <div className="alert-banner error-banner" style={{ marginBottom: '16px' }}>{downloadError}</div>}
      <header className="debrief-header glass-panel">
        <div className="hex-score-wrap">
          <div className="hex-grid-bg" />
          <div className="hex-score">
            <span className="hex-value">{feedback.overallScore}</span>
            <span className="hex-unit">%</span>
          </div>
        </div>
        <div className="debrief-meta">
          <span className="debrief-badge">Session debrief</span>
          <h1>{topic}</h1>
          <p>
            {new Date(createdAt).toLocaleDateString(undefined, { dateStyle: 'long' })} ·{' '}
            {type === 'resume' ? 'Resume-Based' : type === 'role' ? 'Role-Based' : 'Topic-Based'}{company ? ` · ${company}` : ''}
          </p>
        </div>
        <div className="debrief-actions">
          <button type="button" className="btn-secondary" onClick={handleShare}>
            <Share2 size={16} /> Share
          </button>
          <button type="button" className="btn-primary" onClick={handleDownload} disabled={downloading}>
            <Download size={16} /> {downloading ? 'Preparing PDF...' : 'Download PDF'}
          </button>
          <Link to="/dashboard" className="btn-secondary">
            <LayoutDashboard size={16} /> Dashboard
          </Link>
        </div>
      </header>

      <div className="metrics-scroll">
        {metrics.map((m) => (
          <div key={m.label} className="metric-card glass-panel">
            <span className="metric-label">{m.label}</span>
            <strong className="metric-value">
              {m.value}
              <small>{m.suffix || ` / ${m.max}`}</small>
            </strong>
            <div className="metric-bar">
              <div
                style={{
                  width: `${(m.value / m.max) * 100}%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>

      <section className="summary-block glass-panel">
        <h2><Sparkles size={18} /> Interviewer summary</h2>
        <p>{feedback.summary}</p>
      </section>

      <div className="tags-row">
        <div className="tags-col glass-panel">
          <h3>Strengths</h3>
          <div className="tag-cloud">
            {(feedback.strengths || []).map((s, i) => (
              <span
                key={s}
                className={`tag tag-good ${tagAnim ? 'tag-in' : ''}`}
                style={{ animationDelay: `${i * 80}ms` }}
              >
                {s}
              </span>
            ))}
            {!feedback.strengths?.length && <span className="tag tag-muted">None recorded this session</span>}
          </div>
        </div>
        <div className="tags-col glass-panel">
          <h3>Gaps to address</h3>
          <div className="tag-cloud">
            {(feedback.weaknesses || []).map((w, i) => (
              <span
                key={w}
                className={`tag tag-warn ${tagAnim ? 'tag-in' : ''}`}
                style={{ animationDelay: `${i * 80}ms` }}
              >
                {w}
              </span>
            ))}
            {!feedback.weaknesses?.length && <span className="tag tag-muted">No major gaps flagged</span>}
          </div>
        </div>
      </div>

      {(feedback.hiringRecommendation || feedback.skillScores?.length || feedback.learningRoadmap?.length || feedback.practiceQuestions?.length) && (
        <section className="role-report-grid">
          <article className="glass-panel role-report-card"><h3>Hiring recommendation</h3><strong className="recommendation">{feedback.hiringRecommendation || 'Pending'}</strong><h4>Missing skills</h4><p>{feedback.missingSkills?.length ? feedback.missingSkills.join(' · ') : 'No major missing skills identified.'}</p></article>
          <article className="glass-panel role-report-card"><h3>Skill-wise scores</h3>{feedback.skillScores?.length ? feedback.skillScores.map((item) => <div className="skill-score" key={item.skill}><span>{item.skill}</span><strong>{item.score}%</strong></div>) : <p>Skill-level scoring is available for role-based sessions.</p>}</article>
          <article className="glass-panel role-report-card"><h3>Learning roadmap</h3><ol>{(feedback.learningRoadmap || []).map((item) => <li key={item}>{item}</li>)}</ol><h4>Practice next</h4><ol>{(feedback.practiceQuestions || []).map((item) => <li key={item}>{item}</li>)}</ol></article>
        </section>
      )}

      {company && (feedback.companyFit || feedback.companyFeedback) && <section className="company-feedback glass-panel"><h2>{company} interview simulation</h2>{feedback.companyFit && <p><strong>Fit:</strong> {feedback.companyFit}</p>}{feedback.companyFeedback && <p>{feedback.companyFeedback}</p>}</section>}

      <section className="audit-section">
        <h2>Q&amp;A audit</h2>
        <div className="audit-list">
          {questions.map((q, idx) => (
            <article key={q._id || idx} className={`audit-card glass-panel ${scoreTier(q.score)}`}>
              <header>
                <span>Question {idx + 1}</span>
                <strong>{q.score ?? 0}/10</strong>
              </header>
              <p className="q-text">{q.questionText}</p>
              <p className="a-text"><em>Your answer:</em> {q.candidateAnswer || 'No response'}</p>
              <p className="e-text">{q.evaluation}</p>
            </article>
          ))}
        </div>
      </section>

      <style>{`
        .debrief {
          max-width: 1100px;
          margin: 0 auto;
          padding: 88px 20px 48px;
        }
        .debrief-loading, .spin {
          min-height: 60vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 16px;
          color: var(--text-secondary);
        }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .debrief-header {
          display: grid;
          grid-template-columns: auto 1fr auto;
          gap: 24px;
          align-items: center;
          padding: 24px;
          margin-bottom: 20px;
        }
        @media (max-width: 900px) {
          .debrief-header { grid-template-columns: 1fr; text-align: center; }
          .debrief-actions { justify-content: center; flex-wrap: wrap; }
        }
        .hex-score-wrap {
          position: relative;
          width: 120px;
          height: 120px;
        }
        .hex-grid-bg {
          position: absolute;
          inset: -20px;
          background-image:
            linear-gradient(30deg, rgba(99,102,241,0.08) 12%, transparent 12.5%, transparent 87%, rgba(99,102,241,0.08) 87.5%),
            linear-gradient(150deg, rgba(99,102,241,0.08) 12%, transparent 12.5%, transparent 87%, rgba(99,102,241,0.08) 87.5%);
          background-size: 24px 42px;
          opacity: 0.6;
        }
        .hex-score {
          width: 100%;
          height: 100%;
          clip-path: polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%);
          background: linear-gradient(135deg, rgba(99,102,241,0.35), rgba(34,211,238,0.2));
          border: 1px solid rgba(255,255,255,0.12);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }
        .hex-value { font-size: 36px; font-weight: 800; color: #fff; line-height: 1; }
        .hex-unit { font-size: 14px; color: var(--text-secondary); }
        .debrief-meta h1 { font-size: 26px; color: #fff; margin: 6px 0; }
        .debrief-meta p { font-size: 14px; color: var(--text-secondary); }
        .debrief-badge {
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--accent);
        }
        .debrief-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          justify-content: flex-end;
        }
        .metrics-scroll {
          display: flex;
          gap: 14px;
          overflow-x: auto;
          padding-bottom: 8px;
          margin-bottom: 20px;
          scroll-snap-type: x mandatory;
        }
        .metric-card {
          min-width: 200px;
          flex: 0 0 auto;
          scroll-snap-align: start;
          padding: 18px;
        }
        .metric-label { font-size: 12px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.06em; }
        .metric-value { display: block; font-size: 28px; color: #fff; margin: 8px 0; }
        .metric-value small { font-size: 14px; color: var(--text-secondary); font-weight: 500; }
        .metric-bar {
          height: 4px;
          background: rgba(255,255,255,0.06);
          border-radius: 2px;
          overflow: hidden;
        }
        .metric-bar div {
          height: 100%;
          background: linear-gradient(90deg, var(--primary), var(--accent));
        }
        .summary-block { padding: 22px; margin-bottom: 20px; }
        .company-feedback { padding: 20px; margin-bottom: 28px; border-color: var(--amber-border); } .company-feedback h2 { color: var(--amber); font-size: 16px; margin-bottom: 10px; } .company-feedback p { color: var(--text-secondary); font-size: 14px; line-height: 1.6; margin-top: 8px; }
        .summary-block h2 {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 18px;
          color: #fff;
          margin-bottom: 12px;
        }
        .summary-block p { color: var(--text-secondary); line-height: 1.65; }
        .tags-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 28px;
        }
        @media (max-width: 768px) { .tags-row { grid-template-columns: 1fr; } }
        .tags-col { padding: 20px; }
        .tags-col h3 { font-size: 15px; color: #fff; margin-bottom: 14px; }
        .role-report-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 28px; } .role-report-card { padding: 20px; } .role-report-card h3 { color: #fff; font-size: 15px; margin-bottom: 12px; } .role-report-card h4 { margin: 16px 0 7px; color: var(--text); font-size: 12px; } .role-report-card p, .role-report-card li { color: var(--text-secondary); font-size: 13px; line-height: 1.55; } .role-report-card ol { padding-left: 18px; } .recommendation { color: var(--cyan-bright); font-size: 20px; } .skill-score { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid var(--border); color: var(--text-secondary); font-size: 13px; } .skill-score strong { color: var(--text); }
        @media (max-width: 900px) { .role-report-grid { grid-template-columns: 1fr; } }
        .tag-cloud { display: flex; flex-wrap: wrap; gap: 8px; }
        .tag {
          font-size: 12px;
          padding: 8px 12px;
          border-radius: 999px;
          border: 1px solid var(--border-glass);
          opacity: 0;
          transform: translateY(8px);
        }
        .tag-in {
          animation: tagPop 0.45s ease forwards;
        }
        @keyframes tagPop {
          to { opacity: 1; transform: translateY(0); }
        }
        .tag-good { background: rgba(16,185,129,0.12); color: #6ee7b7; border-color: rgba(16,185,129,0.25); }
        .tag-warn { background: rgba(245,158,11,0.12); color: #fcd34d; border-color: rgba(245,158,11,0.25); }
        .tag-muted { background: rgba(255,255,255,0.04); color: var(--text-muted); opacity: 1; transform: none; }
        .audit-section h2 { font-size: 20px; color: #fff; margin-bottom: 16px; }
        .audit-list { display: flex; flex-direction: column; gap: 14px; }
        .audit-card {
          padding: 18px 18px 18px 22px;
          border-left: 4px solid transparent;
        }
        .audit-card.tier-green { border-left-color: #10b981; }
        .audit-card.tier-amber { border-left-color: #f59e0b; }
        .audit-card.tier-red { border-left-color: #ef4444; }
        .audit-card header {
          display: flex;
          justify-content: space-between;
          font-size: 13px;
          color: var(--text-muted);
          margin-bottom: 10px;
        }
        .audit-card header strong { color: #fff; }
        .q-text { color: #fff; font-weight: 600; margin-bottom: 10px; line-height: 1.5; }
        .a-text { font-size: 14px; color: var(--text-secondary); margin-bottom: 8px; line-height: 1.5; }
        .e-text { font-size: 13px; color: var(--accent); line-height: 1.5; }
      `}</style>
    </div>
  );
};

export default FeedbackReportPage;
