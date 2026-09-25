import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  FileText, Upload, Play, Cpu,
  Terminal, Database, Code2, GitFork, Server, Layers,
  Calendar, ExternalLink, Zap, Clock, Braces
} from 'lucide-react';

import Skeleton from '../components/Skeleton';

const DashboardPage = () => {
  const { getHeaders, apiUrl } = useAuth();
  const navigate = useNavigate();

  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeText, setResumeText] = useState('');
  const [parsedResume, setParsedResume] = useState(null);
  const [parsing, setParsing] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');
  const [roles, setRoles] = useState([]);
  const [role, setRole] = useState('');
  const [companies, setCompanies] = useState([]);
  const [company, setCompany] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('Fresher');
  const [difficulty, setDifficulty] = useState('Intermediate');
  const [duration, setDuration] = useState(30);
  const [interviewMode, setInterviewMode] = useState('Mixed');

  const fetchHistory = async () => {
    try {
      const res = await fetch(`${apiUrl}/api/interview/history`, { headers: getHeaders() });
      const data = await res.json();
      if (data.success) setHistory(data.interviews);
    } catch (err) {
      console.error('Error fetching history:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const fetchStoredResume = async () => {
    try {
      const res = await fetch(`${apiUrl}/api/interview/resumes/me`, { headers: getHeaders() });
      const data = await res.json();
      if (data.success && data.parsedResume) {
        setParsedResume(data.parsedResume);
        if (data.parsedResume.rawText) {
          setResumeText(data.parsedResume.rawText);
        }
      }
    } catch (err) {
      console.error('Error fetching stored resume:', err);
    } finally {
    }
  };

  useEffect(() => {
    fetchHistory();
    fetchStoredResume();
    fetch(`${apiUrl}/api/interview/roles`, { headers: getHeaders() })
      .then((res) => res.json())
      .then((data) => { if (data.success) { setRoles(data.roles); setRole(data.roles[0]?.name || ''); } })
      .catch(() => setError('Could not load role configurations.'));
    fetch(`${apiUrl}/api/interview/companies`, { headers: getHeaders() })
      .then((res) => res.json())
      .then((data) => { if (data.success) { setCompanies(data.companies); setCompany(data.companies[0]?.name || ''); } })
      .catch(() => setError('Could not load company configurations.'));
  }, []);

  const handleResumeChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.type !== 'application/pdf') { setError('Please upload a PDF file only.'); return; }

    setError('');
    setResumeFile(file);
    setParsing(true);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64File = event.target.result;
      try {
        const res = await fetch(`${apiUrl}/api/interview/resumes`, {
          method: 'POST', headers: getHeaders(), body: JSON.stringify({ base64File }),
        });
        const data = await res.json();
        if (data.success) {
          setResumeText(data.text);
          if (data.parsedResume) {
            setParsedResume(data.parsedResume);
          }
        }
        else setError(data.message || 'Failed to parse resume');
      } catch (err) {
        setError('Connection error parsing resume PDF');
      } finally {
        setParsing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const startInterview = async (topic, type = 'topic', options = {}) => {
    setError('');
    setStarting(true);
    try {
      const body = { topic, type, resumeText: type === 'resume' ? resumeText : undefined, ...options };
      const res = await fetch(`${apiUrl}/api/interview/sessions`, {
        method: 'POST', headers: getHeaders(), body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        navigate(`/interview/${data.interviewId}`, {
          state: { firstQuestion: data.question, topic: data.topic, type: data.type, totalQuestions: data.totalQuestions }
        });
      } else {
        setError(data.message || 'Failed to start interview');
      }
    } catch (err) {
      setError('Connection error starting interview session');
    } finally {
      setStarting(false);
    }
  };

  const completedSessions = history.filter(h => h.status === 'completed' && h.feedback);
  const avgScore = completedSessions.length > 0
    ? Math.round(completedSessions.reduce((a, b) => a + b.feedback.overallScore, 0) / completedSessions.length)
    : null;
  const lastSession = history[0];

  return (
    <div className="dash-root">

      {/* ── Header ── */}
      <div className="dash-header">
        <div>
          <h1 className="dash-title">
            Mission Control<span className="dash-title-blink">_</span>
          </h1>
          <p className="dash-subtitle">
            Select a domain to begin · {history.length} session{history.length !== 1 ? 's' : ''} on record
          </p>
        </div>

        {/* KPI mini-row */}
        <div className="dash-kpis">
          <div className="dash-kpi">
            <span className="dash-kpi-val">{history.length}</span>
            <span className="dash-kpi-label">Sessions</span>
          </div>
          {avgScore !== null && (
            <div className="dash-kpi">
              <span className="dash-kpi-val">{avgScore}%</span>
              <span className="dash-kpi-label">Avg Score</span>
            </div>
          )}
          {lastSession && (
            <div className="dash-kpi">
              <span className="dash-kpi-val">{new Date(lastSession.createdAt).toLocaleDateString()}</span>
              <span className="dash-kpi-label">Last Session</span>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="alert-banner error-banner" style={{ marginBottom: '20px' }}>
          <span>{error}</span>
        </div>
      )}

      {/* ── Subject Cards ── */}
      <div className="dash-section-label">
        <Zap size={13} />
        <span>Role-based interview</span>
      </div>

      <div className="role-setup glass-panel">
        <div className="role-setup-head"><div><h2>Build a realistic interview</h2><p>Role configuration drives domain coverage, scoring, follow-ups, and adaptive difficulty.</p></div><span className="badge badge-success">{roles.length} roles</span></div>
        <div className="role-fields">
          <label>Target company<select value={company} onChange={(e) => setCompany(e.target.value)} disabled={!companies.length || starting}>{companies.map((item) => <option key={item.name} value={item.name}>{item.name}</option>)}</select></label>
          <label>Target role<select value={role} onChange={(e) => setRole(e.target.value)} disabled={!roles.length || starting}>{roles.map((item) => <option key={item.name} value={item.name}>{item.name}</option>)}</select></label>
          <label>Experience<select value={experienceLevel} onChange={(e) => setExperienceLevel(e.target.value)}><option>Fresher</option><option>1-3 years</option><option>3-5 years</option><option>Senior</option></select></label>
          <label>Difficulty<select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select></label>
          <label>Duration<select value={duration} onChange={(e) => setDuration(Number(e.target.value))}><option value={20}>20 min</option><option value={30}>30 min</option><option value={45}>45 min</option><option value={60}>60 min</option></select></label>
          <label>Format<select value={interviewMode} onChange={(e) => setInterviewMode(e.target.value)}><option>Theory</option><option>Coding</option><option>Mixed</option></select></label>
        </div>
        {roles.find((item) => item.name === role) && <div className="role-domains"><strong>Domains:</strong> {roles.find((item) => item.name === role).requiredDomains.join(' · ')}</div>}
        {companies.find((item) => item.name === company) && <div className="company-summary"><strong>{company} simulation:</strong> {companies.find((item) => item.name === company).interviewStyle} · {companies.find((item) => item.name === company).codingTheoryRatio.coding}% coding · {companies.find((item) => item.name === company).behavioralEmphasis} behavioral emphasis</div>}
        <button className="btn-primary role-start" onClick={() => startInterview(role, 'role', { role, company, experienceLevel, difficulty, duration, interviewMode, resumeText })} disabled={starting || !role || !company}>{starting ? 'Preparing interview...' : 'Start company interview'} <Play size={14} fill="currentColor" /></button>
      </div>

      <button className="coding-round-card glass-panel" onClick={() => navigate('/coding-interview')}>
        <div className="coding-round-icon"><Braces size={22} /></div>
        <div><span className="dash-section-label">New interview track</span><h2>Live Coding Interview</h2><p>Use Monaco, choose JavaScript, Python, or Java, run visible tests, and get an AI code review.</p></div>
        <span className="coding-round-arrow">Open coding round →</span>
      </button>

      {/* ── Bottom Row: Resume + History ── */}
      <div className="dash-bottom-row">

        {/* Resume Upload Panel */}
        <div className="dash-resume-panel glass-panel">
          <div className="drp-header">
            <div className="drp-icon">
              <Cpu size={20} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 className="drp-title">Resume-Based Screening</h2>
                {parsedResume && <span className="badge badge-success" style={{ fontSize: '10px' }}>Parsed &amp; Cached</span>}
              </div>
              <p className="drp-sub">AI parses your CV once to extract skills, projects &amp; technologies for personalized questions</p>
            </div>
          </div>

          {parsedResume ? (
            <div className="drp-parsed-card" style={{ background: 'rgba(0,0,0,0.25)', borderRadius: '10px', padding: '16px', marginBottom: '18px', border: '1px solid var(--border)' }}>
              <p style={{ fontSize: '13px', color: 'var(--text)', marginBottom: '10px', lineHeight: '1.4' }}>
                <strong>Summary:</strong> {parsedResume.summary || 'Profile stored.'}
              </p>
              
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
                {(parsedResume.skills || []).slice(0, 6).map((s, i) => (
                  <span key={i} style={{ fontSize: '11px', background: 'var(--amber-dim)', color: 'var(--amber)', border: '1px solid var(--amber-border)', padding: '2px 8px', borderRadius: '4px' }}>
                    {s}
                  </span>
                ))}
                {(parsedResume.technologies || []).slice(0, 6).map((t, i) => (
                  <span key={i} style={{ fontSize: '11px', background: 'var(--cyan-dim)', color: 'var(--cyan-bright)', border: '1px solid var(--cyan-border)', padding: '2px 8px', borderRadius: '4px' }}>
                    {t}
                  </span>
                ))}
              </div>

              {parsedResume.projects?.length > 0 && (
                <p style={{ fontSize: '11px', color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
                  {parsedResume.projects.length} project{parsedResume.projects.length > 1 ? 's' : ''} extracted: {parsedResume.projects.map(p => p.name).filter(Boolean).join(', ')}
                </p>
              )}
            </div>
          ) : null}

          <div className="drp-actions">
            <label className="drp-upload-zone" htmlFor="resume-upload-input">
              <input
                id="resume-upload-input"
                type="file"
                accept=".pdf"
                onChange={handleResumeChange}
                style={{ display: 'none' }}
                disabled={parsing || starting}
              />
              {parsing ? (
                <div className="drp-state">
                  <div className="drp-spinner" />
                  <span>Extracting skills &amp; experience...</span>
                </div>
              ) : resumeFile ? (
                <div className="drp-state drp-loaded">
                  <FileText size={18} />
                  <span>{resumeFile.name}</span>
                  <span className="badge badge-success">Parsed</span>
                </div>
              ) : (
                <div className="drp-state">
                  <Upload size={18} />
                  <span>{parsedResume ? 'Upload Updated CV' : 'Click to upload PDF'}</span>
                </div>
              )}
            </label>

            {(parsedResume || resumeText) && (
              <button
                className="btn-primary drp-start-btn"
                onClick={() => startInterview('Resume-Based', 'resume')}
                disabled={starting || parsing}
                id="btn-start-resume-interview"
              >
                {starting ? 'Starting...' : 'Start Interview'}
                <Play size={14} fill="currentColor" />
              </button>
            )}
          </div>
        </div>

        {/* Recent History */}
        <div className="dash-history-panel glass-panel">
          <h2 className="dhp-title">
            <Clock size={14} />
            Recent Sessions
          </h2>

          {historyLoading ? (
            <div className="dhp-list" style={{ gap: '14px', paddingTop: '4px' }}>
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                    <Skeleton width="60%" height="14px" />
                    <Skeleton width="40%" height="10px" />
                  </div>
                  <Skeleton width="40px" height="18px" borderRadius="4px" />
                </div>
              ))}
            </div>
          ) : history.length === 0 ? (
            <div className="dhp-empty">
              <Calendar size={28} />
              <p>No sessions yet. Start your first interview!</p>
            </div>
          ) : (
            <div className="dhp-list">
              {history.slice(0, 6).map((int) => (
                <div key={int._id} className="dhp-row">
                  <div className="dhp-row-info">
                    <span className="dhp-topic">{int.topic}</span>
                    <span className="dhp-meta">
                      {int.type === 'resume' ? 'Resume' : 'Topic'} · {new Date(int.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="dhp-row-right">
                    {int.status === 'completed' && int.feedback ? (
                      <>
                        <span className="dhp-score">{int.feedback.overallScore}%</span>
                        <Link to={`/report/${int._id}`} className="dhp-link" title="View Report">
                          <ExternalLink size={12} />
                        </Link>
                      </>
                    ) : (
                      <span className="badge badge-warning">Active</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        .dash-root {
          max-width: 1200px; margin: 0 auto;
          padding: 72px 24px 60px;
        }

        /* Header */
        .dash-header {
          display: flex; justify-content: space-between; align-items: flex-start;
          margin-bottom: 36px; flex-wrap: wrap; gap: 20px;
        }
        .dash-title {
          font-size: clamp(24px, 3.5vw, 36px); font-weight: 700;
          color: var(--text); letter-spacing: -0.03em; margin-bottom: 6px;
        }
        .dash-title-blink { color: var(--amber); animation: blink 1.1s step-end infinite; }
        .dash-subtitle { font-size: 13px; color: var(--text-3); font-family: var(--font-mono); }

        .dash-kpis { display: flex; gap: 24px; align-items: center; flex-wrap: wrap; }
        .dash-kpi {
          display: flex; flex-direction: column; align-items: flex-end; gap: 2px;
          padding: 10px 16px; background: var(--surface);
          border: 1px solid var(--border); border-radius: 8px;
        }
        .dash-kpi-val { font-family: var(--font-mono); font-size: 18px; font-weight: 700; color: var(--amber); }
        .dash-kpi-label { font-size: 10px; color: var(--text-3); text-transform: uppercase; letter-spacing: 0.06em; font-family: var(--font-mono); }

        /* Section label */
        .dash-section-label {
          display: flex; align-items: center; gap: 6px;
          font-size: 11px; font-weight: 700; color: var(--text-3);
          text-transform: uppercase; letter-spacing: 0.09em; font-family: var(--font-mono);
          margin-bottom: 14px;
        }

        /* Subject Cards Grid */
        .dash-subjects-grid {
          display: grid; grid-template-columns: repeat(3, 1fr);
          gap: 14px; margin-bottom: 28px;
        }
        .role-setup { padding: 24px; margin-bottom: 28px; border-color: var(--cyan-border); }
        .role-setup-head { display: flex; justify-content: space-between; gap: 16px; align-items: flex-start; margin-bottom: 20px; }
        .role-setup h2 { color: var(--text); font-size: 18px; margin-bottom: 5px; } .role-setup p, .role-domains { color: var(--text-3); font-size: 12px; line-height: 1.5; }
        .role-fields { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
        .role-fields label { display: flex; flex-direction: column; gap: 6px; color: var(--text-3); font: 700 10px var(--font-mono); text-transform: uppercase; }
        .role-fields select { width: 100%; border: 1px solid var(--border); border-radius: 7px; background: var(--surface-2); color: var(--text); padding: 10px; font: 12px var(--font-body); }
        .role-domains { margin-top: 16px; padding: 10px 12px; border-left: 2px solid var(--cyan-bright); background: var(--cyan-dim); } .role-domains strong { color: var(--cyan-bright); }
        .company-summary { margin-top: 10px; padding: 10px 12px; border-left: 2px solid var(--amber); background: var(--amber-dim); color: var(--text-3); font-size: 12px; line-height: 1.5; } .company-summary strong { color: var(--amber); }
        .role-start { margin-top: 16px; display: inline-flex; gap: 8px; align-items: center; }
        .coding-round-card { width: 100%; display: flex; align-items: center; gap: 16px; text-align: left; padding: 20px 22px; margin: -8px 0 28px; border: 1px solid var(--cyan-border); background: linear-gradient(90deg, var(--cyan-dim), var(--surface)); cursor: pointer; transition: var(--t); }
        .coding-round-card:hover { transform: translateY(-2px); border-color: var(--cyan-bright); } .coding-round-icon { width: 44px; height: 44px; display: grid; place-items: center; flex: 0 0 auto; color: var(--cyan-bright); border: 1px solid var(--cyan-border); border-radius: 9px; background: rgba(0,0,0,.15); } .coding-round-card .dash-section-label { margin: 0 0 5px; } .coding-round-card h2 { color: var(--text); font-size: 16px; margin-bottom: 3px; } .coding-round-card p { color: var(--text-3); font-size: 12px; line-height: 1.4; } .coding-round-arrow { margin-left: auto; flex: 0 0 auto; color: var(--cyan-bright); font: 700 11px var(--font-mono); }
        .dash-subject-card {
          background: var(--surface); border: 1px solid var(--border);
          border-radius: 12px; padding: 22px;
          display: flex; flex-direction: column; gap: 10px; text-align: left;
          cursor: pointer; transition: var(--t);
          position: relative; overflow: hidden;
        }
        .dash-subject-card::before {
          content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px;
          background: linear-gradient(90deg, transparent, var(--card-color), transparent);
          opacity: 0; transition: opacity 0.3s ease;
        }
        .dash-subject-card:hover {
          border-color: var(--card-border);
          background: var(--surface-2);
          transform: translateY(-2px);
          box-shadow: 0 8px 30px rgba(0,0,0,0.3);
        }
        .dash-subject-card:hover::before { opacity: 1; }
        .dash-subject-card:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

        .dsc-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
        .dsc-icon-wrap {
          width: 36px; height: 36px; border-radius: 8px;
          background: var(--card-dim); color: var(--card-color);
          border: 1px solid var(--card-border);
          display: flex; align-items: center; justify-content: center;
        }
        .dsc-arrow { font-size: 14px; color: var(--text-4); transition: var(--t); }
        .dash-subject-card:hover .dsc-arrow { color: var(--card-color); transform: translateX(4px); }
        .dsc-name { font-size: 15px; font-weight: 700; color: var(--text); font-family: var(--font-heading); }
        .dsc-desc { font-size: 12px; color: var(--text-3); line-height: 1.5; }

        /* Bottom Row */
        .dash-bottom-row {
          display: grid; grid-template-columns: 1fr 340px; gap: 20px; align-items: start;
        }

        /* Resume Panel */
        .dash-resume-panel { padding: 26px; }
        .drp-header { display: flex; gap: 16px; align-items: flex-start; margin-bottom: 22px; }
        .drp-icon {
          width: 44px; height: 44px; border-radius: 10px; flex-shrink: 0;
          background: var(--amber-dim); color: var(--amber); border: 1px solid var(--amber-border);
          display: flex; align-items: center; justify-content: center;
        }
        .drp-title { font-size: 16px; font-weight: 700; color: var(--text); margin-bottom: 4px; }
        .drp-sub { font-size: 12px; color: var(--text-3); line-height: 1.5; }

        .drp-actions { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
        .drp-upload-zone {
          flex-grow: 1; min-width: 200px;
          border: 1px dashed var(--border-2); border-radius: 8px;
          padding: 16px 20px; cursor: pointer; transition: var(--t);
        }
        .drp-upload-zone:hover { border-color: var(--amber-border); background: var(--amber-dim); }
        .drp-state {
          display: flex; align-items: center; gap: 10px;
          font-size: 13px; font-weight: 500; color: var(--text-2);
        }
        .drp-state.drp-loaded { color: var(--text); }
        .drp-spinner {
          width: 16px; height: 16px; border-radius: 50%;
          border: 2px solid transparent; border-top-color: var(--amber);
          animation: spin 0.7s linear infinite;
        }
        .drp-start-btn { flex-shrink: 0; }

        /* History Panel */
        .dash-history-panel { padding: 22px; }
        .dhp-title {
          display: flex; align-items: center; gap: 7px;
          font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em;
          color: var(--text-3); font-family: var(--font-mono);
          margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid var(--border);
        }
        .dhp-empty {
          text-align: center; padding: 32px 12px; color: var(--text-3);
          display: flex; flex-direction: column; align-items: center; gap: 10px;
          font-size: 12px;
        }
        .dhp-list { display: flex; flex-direction: column; gap: 0; }
        .dhp-row {
          display: flex; justify-content: space-between; align-items: center;
          padding: 10px 0; border-bottom: 1px solid var(--border);
          gap: 8px;
        }
        .dhp-row:last-child { border-bottom: none; }
        .dhp-row-info { display: flex; flex-direction: column; gap: 2px; flex-grow: 1; min-width: 0; }
        .dhp-topic {
          font-size: 12px; font-weight: 600; color: var(--text);
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .dhp-meta { font-size: 10px; color: var(--text-3); font-family: var(--font-mono); }
        .dhp-row-right { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
        .dhp-score {
          font-family: var(--font-mono); font-size: 12px; font-weight: 700; color: var(--amber);
        }
        .dhp-link {
          display: flex; align-items: center; justify-content: center;
          width: 24px; height: 24px; border-radius: 4px;
          color: var(--text-3); transition: var(--t);
          border: 1px solid var(--border);
        }
        .dhp-link:hover { color: var(--cyan-bright); border-color: var(--cyan-border); background: var(--cyan-dim); }

        @media (max-width: 900px) {
          .dash-subjects-grid { grid-template-columns: repeat(2, 1fr); }
          .role-fields { grid-template-columns: repeat(2, 1fr); }
          .dash-bottom-row    { grid-template-columns: 1fr; }
        }
        @media (max-width: 560px) {
          .dash-subjects-grid { grid-template-columns: 1fr; }
          .role-fields { grid-template-columns: 1fr; }
          .dash-header { flex-direction: column; }
          .coding-round-card { align-items: flex-start; flex-wrap: wrap; } .coding-round-arrow { margin-left: 60px; }
        }
      `}</style>
    </div>
  );
};

export default DashboardPage;
