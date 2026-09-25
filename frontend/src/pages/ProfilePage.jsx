import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  User, Mail, Calendar, Award, AlertCircle, TrendingUp, TrendingDown,
  ChevronRight, Loader, Filter, Target, Zap
} from 'lucide-react';
import Skeleton, { SkeletonText } from '../components/Skeleton';

const SKILL_KEYS = [
  { name: 'DSA', key: 'dsa' },
  { name: 'DBMS', key: 'dbms' },
  { name: 'OOPs', key: 'oops' },
  { name: 'React', key: 'react' },
  { name: 'MERN', key: 'mern' },
  { name: 'Spring', key: 'springboot' },
  { name: 'Sys Design', key: 'systemDesign' },
];

const ProfilePage = () => {
  const { user, getHeaders, apiUrl } = useAuth();
  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const [histRes, statsRes] = await Promise.all([
          fetch(`${apiUrl}/api/interview/history`, { headers: getHeaders() }),
          fetch(`${apiUrl}/api/interview/stats`, { headers: getHeaders() }),
        ]);
        const histData = await histRes.json();
        const statsData = await statsRes.json();
        if (histData.success) setHistory(histData.interviews);
        if (statsData.success) setStats(statsData.stats);
      } catch {
        setError('Connection failure retrieving analytics');
      } finally {
        setLoading(false);
      }
    };
    fetchProfileData();
  }, []);

  const filteredHistory = useMemo(() => {
    if (filter === 'completed') return history.filter((h) => h.status === 'completed');
    if (filter === 'active') return history.filter((h) => h.status !== 'completed');
    return history;
  }, [history, filter]);

  const renderTimeline = (scoreHistory) => {
    if (!scoreHistory?.length) {
      return <p className="chart-empty">Complete interviews to see your score timeline.</p>;
    }
    const w = 480;
    const h = 160;
    const pad = { l: 36, r: 16, t: 20, b: 28 };
    const innerW = w - pad.l - pad.r;
    const innerH = h - pad.t - pad.b;
    const pts = scoreHistory.map((p, i) => ({
      x: pad.l + (scoreHistory.length === 1 ? innerW / 2 : (i / (scoreHistory.length - 1)) * innerW),
      y: pad.t + ((100 - p.score) / 100) * innerH,
      ...p,
    }));
    let line = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) line += ` L ${pts[i].x} ${pts[i].y}`;
    const area = `${line} L ${pts[pts.length - 1].x} ${pad.t + innerH} L ${pts[0].x} ${pad.t + innerH} Z`;

    return (
      <svg viewBox={`0 0 ${w} ${h}`} className="timeline-svg">
        {[0, 25, 50, 75, 100].map((lvl) => {
          const y = pad.t + ((100 - lvl) / 100) * innerH;
          return (
            <g key={lvl}>
              <line x1={pad.l} y1={y} x2={w - pad.r} y2={y} stroke="rgba(255,255,255,0.05)" />
              <text x={pad.l - 6} y={y + 3} fill="var(--text-muted)" fontSize="9" textAnchor="end">{lvl}</text>
            </g>
          );
        })}
        <path d={area} fill="url(#timelineGrad)" opacity="0.35" />
        <path d={line} fill="none" stroke="#22d3ee" strokeWidth="2.5" strokeLinecap="round" />
        {pts.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="4" fill="#6366f1" stroke="#fff" strokeWidth="1.5" />
            <text x={p.x} y={p.y - 8} fill="#fff" fontSize="9" textAnchor="middle" fontWeight="700">{p.score}%</text>
          </g>
        ))}
        <defs>
          <linearGradient id="timelineGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>
        </defs>
      </svg>
    );
  };

  const renderHexRadar = (skills) => {
    if (!skills) return null;
    return (
      <div className="hex-radar">
        {SKILL_KEYS.map(({ name, key }) => {
          const score = skills[key] || 0;
          const intensity = Math.min(100, Math.max(0, score)) / 100;
          return (
            <div key={key} className="hex-cell" title={`${name}: ${score}%`}>
              <div
                className="hex-shape"
                style={{
                  background: `linear-gradient(135deg, rgba(99,102,241,${0.15 + intensity * 0.5}), rgba(34,211,238,${0.1 + intensity * 0.35}))`,
                  borderColor: `rgba(99,102,241,${0.2 + intensity * 0.5})`,
                }}
              >
                <span className="hex-score-num">{score}</span>
              </div>
              <span className="hex-label">{name}</span>
            </div>
          );
        })}
      </div>
    );
  };

  const kpis = stats
    ? [
        { label: 'Total Interviews', value: stats.totalInterviews, icon: Award, sub: 'Sessions completed' },
        { label: 'Average Score', value: `${stats.averageScore}%`, icon: Target, sub: 'Overall performance' },
        { label: 'Peak Score', value: `${stats.highestScore || stats.averageScore}%`, icon: Zap, sub: 'Personal record' },
        {
          label: 'Improvement Trend',
          value: stats.improvementTrend?.value || '0%',
          icon: stats.improvementTrend?.direction === 'down' ? TrendingUp : TrendingUp,
          sub: stats.improvementTrend?.direction === 'up' ? 'Upward momentum' : stats.improvementTrend?.direction === 'down' ? 'Needs focus' : 'Consistent baseline',
          highlight: stats.improvementTrend?.direction,
        },
      ]
    : [];

  return (
    <div className="analytics-hub">
      <header className="hub-banner glass-panel">
        <div className="hub-avatar"><User size={32} /></div>
        <div style={{ flex: 1 }}>
          <h1>{user?.name}</h1>
          <div className="hub-meta">
            <span><Mail size={14} /> {user?.email}</span>
            <span><Calendar size={14} /> Candidate profile</span>
            <span style={{ color: 'var(--amber)', fontWeight: 600 }}><Award size={14} /> Analytics Dashboard</span>
          </div>
        </div>
      </header>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* KPI Skeletons */}
          <div className="kpi-grid">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="kpi-card glass-panel">
                <Skeleton width="24px" height="24px" borderRadius="6px" />
                <Skeleton width="80px" height="28px" style={{ marginTop: '8px' }} />
                <Skeleton width="100px" height="12px" />
              </div>
            ))}
          </div>

          {/* Charts Skeletons */}
          <div className="charts-grid">
            <div className="chart-panel glass-panel" style={{ height: '220px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <Skeleton width="140px" height="18px" />
              <Skeleton width="100%" height="130px" borderRadius="10px" />
            </div>
            <div className="chart-panel glass-panel" style={{ height: '220px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <Skeleton width="140px" height="18px" />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginTop: '10px' }}>
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} width="100%" height="60px" borderRadius="8px" />
                ))}
              </div>
            </div>
          </div>

          {/* Table Skeleton */}
          <div className="sessions-table-wrap glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <Skeleton width="160px" height="20px" />
            <SkeletonText lines={4} gap="12px" />
          </div>
        </div>
      ) : error ? (
        <div className="hub-error">{error}</div>
      ) : history.length === 0 ? (
        <div className="hub-empty glass-panel">
          <AlertCircle size={40} />
          <h2>No interview history yet</h2>
          <p>Complete a session to unlock KPIs, timeline, skill hex map, and session table.</p>
          <Link to="/dashboard" className="btn-primary">Start practicing</Link>
        </div>
      ) : (
        <>
          <div className="kpi-grid">
            {kpis.map(({ label, value, icon: Icon, sub, highlight }) => (
              <div key={label} className="kpi-card glass-panel">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Icon size={20} className="kpi-icon" />
                  {highlight && (
                    <span className={`badge ${highlight === 'up' ? 'badge-success' : highlight === 'down' ? 'badge-warning' : ''}`} style={{ fontSize: '10px' }}>
                      {highlight === 'up' ? '▲ Improving' : highlight === 'down' ? '▼ Declining' : 'Stable'}
                    </span>
                  )}
                </div>
                <strong>{value}</strong>
                <span>{label}</span>
                {sub && <small style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '2px' }}>{sub}</small>}
              </div>
            ))}
          </div>

          <div className="charts-grid">
            <div className="chart-panel glass-panel">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h2>Score Improvement Trend</h2>
                <span style={{ fontSize: '11px', color: 'var(--amber)', fontFamily: 'var(--font-mono)' }}>
                  Chronological Progress
                </span>
              </div>
              {renderTimeline(stats?.scoreHistory)}
            </div>
            <div className="chart-panel glass-panel">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h2>Skill-Wise Mastery</h2>
                <span style={{ fontSize: '11px', color: 'var(--cyan-bright)', fontFamily: 'var(--font-mono)' }}>
                  Domain Matrix
                </span>
              </div>
              {renderHexRadar(stats?.skillsBreakdown)}
            </div>
          </div>

          <div className="traits-strip">
            <div className="trait-pill glass-panel">
              <h3>Top strengths</h3>
              <div className="pill-row">
                {(stats?.strengths || []).slice(0, 6).map((s) => (
                  <span key={s} className="pill good">{s}</span>
                ))}
              </div>
            </div>
            <div className="trait-pill glass-panel">
              <h3>Focus areas</h3>
              <div className="pill-row">
                {(stats?.weaknesses || []).slice(0, 6).map((w) => (
                  <span key={w} className="pill warn">{w}</span>
                ))}
              </div>
            </div>
          </div>

          <section className="sessions-table-wrap glass-panel">
            <div className="table-head">
              <h2>Session history</h2>
              <div className="filter-tabs">
                <Filter size={14} />
                {['all', 'completed', 'active'].map((f) => (
                  <button
                    key={f}
                    type="button"
                    className={filter === f ? 'active' : ''}
                    onClick={() => setFilter(f)}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
            <div className="table-scroll">
              <table className="sessions-table">
                <thead>
                  <tr>
                    <th>Topic</th>
                    <th>Type</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Score</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {filteredHistory.map((row) => (
                    <tr key={row._id}>
                      <td>{row.topic}</td>
                      <td>{row.type === 'resume' ? 'Resume' : 'Topic'}</td>
                      <td>{new Date(row.createdAt).toLocaleDateString()}</td>
                      <td>
                        <span className={`status-chip ${row.status}`}>{row.status}</span>
                      </td>
                      <td>
                        {row.feedback?.overallScore != null ? `${row.feedback.overallScore}%` : '—'}
                      </td>
                      <td>
                        <Link
                          to={row.status === 'completed' ? `/report/${row._id}` : `/interview/${row._id}`}
                          className="row-link"
                        >
                          Open <ChevronRight size={14} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredHistory.length === 0 && (
                <p className="table-empty">No sessions match this filter.</p>
              )}
            </div>
          </section>
        </>
      )}

      <style>{`
        .analytics-hub {
          max-width: 1100px;
          margin: 0 auto;
          padding: 88px 20px 48px;
        }
        .hub-banner {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 22px;
          margin-bottom: 20px;
        }
        .hub-avatar {
          width: 56px;
          height: 56px;
          border-radius: 14px;
          background: linear-gradient(135deg, var(--primary), var(--accent));
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
        }
        .hub-banner h1 { font-size: 24px; color: #fff; }
        .hub-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 14px;
          margin-top: 6px;
          font-size: 13px;
          color: var(--text-secondary);
        }
        .hub-meta span { display: flex; align-items: center; gap: 6px; }
        .hub-loading, .hub-empty {
          text-align: center;
          padding: 48px 24px;
          color: var(--text-secondary);
        }
        .hub-empty h2 { color: #fff; margin: 12px 0 8px; }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
          margin-bottom: 20px;
        }
        @media (max-width: 768px) { .kpi-grid { grid-template-columns: repeat(2, 1fr); } }
        .kpi-card {
          padding: 18px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .kpi-icon { color: var(--accent); }
        .kpi-card strong { font-size: 26px; color: #fff; }
        .kpi-card span { font-size: 12px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
        .charts-grid {
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          gap: 16px;
          margin-bottom: 20px;
        }
        @media (max-width: 900px) { .charts-grid { grid-template-columns: 1fr; } }
        .chart-panel { padding: 20px; }
        .chart-panel h2 { font-size: 16px; color: #fff; margin-bottom: 14px; }
        .timeline-svg { width: 100%; height: auto; display: block; }
        .chart-empty { font-size: 13px; color: var(--text-muted); padding: 24px 0; }
        .hex-radar {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
        }
        @media (max-width: 600px) { .hex-radar { grid-template-columns: repeat(2, 1fr); } }
        .hex-cell { display: flex; flex-direction: column; align-items: center; gap: 6px; }
        .hex-shape {
          width: 56px;
          height: 64px;
          clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
          border: 1px solid;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .hex-score-num { font-size: 14px; font-weight: 800; color: #fff; }
        .hex-label { font-size: 10px; color: var(--text-muted); text-align: center; }
        .traits-strip {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
          margin-bottom: 20px;
        }
        @media (max-width: 768px) { .traits-strip { grid-template-columns: 1fr; } }
        .trait-pill { padding: 16px; }
        .trait-pill h3 { font-size: 14px; color: #fff; margin-bottom: 10px; }
        .pill-row { display: flex; flex-wrap: wrap; gap: 8px; }
        .pill {
          font-size: 11px;
          padding: 6px 10px;
          border-radius: 999px;
          border: 1px solid var(--border-glass);
        }
        .pill.good { background: rgba(16,185,129,0.1); color: #6ee7b7; }
        .pill.warn { background: rgba(245,158,11,0.1); color: #fcd34d; }
        .sessions-table-wrap { padding: 0; overflow: hidden; }
        .table-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 18px 20px;
          border-bottom: 1px solid var(--border-glass);
          flex-wrap: wrap;
          gap: 12px;
        }
        .table-head h2 { font-size: 16px; color: #fff; }
        .filter-tabs {
          display: flex;
          align-items: center;
          gap: 6px;
          color: var(--text-muted);
        }
        .filter-tabs button {
          font-size: 12px;
          padding: 6px 12px;
          border-radius: 999px;
          border: 1px solid var(--border-glass);
          background: transparent;
          color: var(--text-secondary);
          text-transform: capitalize;
        }
        .filter-tabs button.active {
          background: rgba(99,102,241,0.2);
          border-color: var(--primary);
          color: #fff;
        }
        .table-scroll { overflow-x: auto; }
        .sessions-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }
        .sessions-table th {
          text-align: left;
          padding: 12px 16px;
          color: var(--text-muted);
          font-weight: 600;
          text-transform: uppercase;
          font-size: 10px;
          letter-spacing: 0.06em;
        }
        .sessions-table td {
          padding: 14px 16px;
          border-top: 1px solid rgba(255,255,255,0.04);
          color: var(--text-secondary);
        }
        .sessions-table td:first-child { color: #fff; font-weight: 500; }
        .status-chip {
          font-size: 11px;
          padding: 4px 8px;
          border-radius: 6px;
          text-transform: capitalize;
        }
        .status-chip.completed { background: rgba(16,185,129,0.15); color: #6ee7b7; }
        .status-chip.active { background: rgba(245,158,11,0.15); color: #fcd34d; }
        .row-link {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          color: var(--accent);
          font-weight: 600;
        }
        .table-empty { padding: 24px; text-align: center; color: var(--text-muted); }
      `}</style>
    </div>
  );
};

export default ProfilePage;
