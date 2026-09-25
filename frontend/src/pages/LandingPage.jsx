import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const TERMINAL_LINES = [
  { role: 'system', text: '> Session initialized. Topic: System Design' },
  { role: 'ai',     text: 'Explain how you would design a URL shortener at scale.' },
  { role: 'user',   text: 'I would start with a hash function... consistent hashing for distribution...' },
  { role: 'ai',     text: 'Good. What happens when a hash collision occurs?' },
  { role: 'user',   text: 'We can use a counter or append a suffix to ensure uniqueness.' },
  { role: 'eval',   text: '✓ Score: 8/10 — Strong foundation. Mention CAP theorem next time.' },
];

const LandingPage = () => {
  const { user } = useAuth();
  const termRef = useRef(null);

  useEffect(() => {
    // Animate terminal lines in sequentially
    const items = termRef.current?.querySelectorAll('.term-line');
    if (!items) return;
    items.forEach((el, i) => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(6px)';
      setTimeout(() => {
        el.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
        el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
      }, 600 + i * 420);
    });
  }, []);

  const FEATURES = [
    {
      id: 'f1', size: 'large',
      label: 'Adaptive Questions',
      desc: 'AI adapts every follow-up question based on your previous answers — not a static question bank.',
      stat: '10 Q/session',
      accent: 'amber',
      icon: '⬡',
    },
    {
      id: 'f2', size: 'normal',
      label: 'Voice Dictation',
      desc: 'Answer naturally via speech. Web Speech API transcribes in real-time.',
      stat: 'Speech-to-Text',
      accent: 'cyan',
      icon: '◎',
    },
    {
      id: 'f3', size: 'normal',
      label: 'Instant Scoring',
      desc: 'Every answer is evaluated by Groq LLM and scored on technical depth, clarity, and correctness.',
      stat: 'Groq LLM',
      accent: 'emerald',
      icon: '◈',
    },
    {
      id: 'f4', size: 'normal',
      label: 'Resume-Based Mode',
      desc: 'Upload your CV. AI crafts contextual questions around your actual experience and projects.',
      stat: 'PDF Parsing',
      accent: 'violet',
      icon: '▣',
    },
    {
      id: 'f5', size: 'normal',
      label: 'Skill Analytics',
      desc: 'Track score trends, skill radar maps, and your top conceptual strengths and gaps over time.',
      stat: 'Full Dashboard',
      accent: 'rose',
      icon: '◆',
    },
  ];

  return (
    <div className="lp-root">
      {/* ── Hero ── */}
      <section className="lp-hero">
        <div className="lp-hero-bg">
          <div className="lp-hero-orb lp-orb-1" />
          <div className="lp-hero-orb lp-orb-2" />
        </div>

        <div className="lp-hero-inner">
          {/* Left: Text */}
          <div className="lp-hero-text">
            <div className="lp-eyebrow">
              <span className="lp-eyebrow-pulse" />
              <span>Neural Interview Engine · Powered by Groq LLM</span>
            </div>
            <h1 className="lp-headline">
              <span className="lp-headline-line">MASTER THE</span>
              <span className="lp-headline-line lp-headline-accent">TECHNICAL</span>
              <span className="lp-headline-line">INTERVIEW.</span>
            </h1>
            <p className="lp-subtext">
              Adaptive AI questions. Real-time speech input. Instant expert scoring.
              Six domains — DSA, DBMS, OOPs, System Design, MERN, Spring Boot — plus resume-based sessions.
            </p>
            <div className="lp-ctas">
              {user ? (
                <Link to="/dashboard" className="btn-primary lp-btn-main" id="hero-cta-dashboard">
                  Go to Dashboard <span>→</span>
                </Link>
              ) : (
                <>
                  <Link to="/auth" className="btn-primary lp-btn-main" id="hero-cta-start">
                    Begin Session <span>→</span>
                  </Link>
                  <a href="#features" className="btn-ghost lp-btn-ghost" id="hero-cta-features">
                    See Features ↓
                  </a>
                </>
              )}
            </div>

            {/* Stats strip */}
            <div className="lp-stats">
              {[
                { val: '10',   label: 'Questions / Session' },
                { val: '6+',   label: 'Domains' },
                { val: '4',    label: 'Score Metrics' },
                { val: '100%', label: 'Free to Use' },
              ].map((s) => (
                <div key={s.label} className="lp-stat">
                  <span className="lp-stat-val">{s.val}</span>
                  <span className="lp-stat-label">{s.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Terminal mock */}
          <div className="lp-terminal" ref={termRef} aria-label="Terminal demo">
            <div className="lp-term-topbar">
              <span className="lp-term-dot lp-dot-r" />
              <span className="lp-term-dot lp-dot-y" />
              <span className="lp-term-dot lp-dot-g" />
              <span className="lp-term-title">copilot — interview session</span>
            </div>
            <div className="lp-term-body">
              {TERMINAL_LINES.map((line, i) => (
                <div key={i} className={`term-line term-${line.role}`}>
                  <span className="term-prefix">
                    {line.role === 'ai'   ? 'AI ›' :
                     line.role === 'user' ? 'YOU ›' :
                     line.role === 'eval' ? 'EVAL ›' : ''}
                  </span>
                  <span className="term-text">{line.text}</span>
                </div>
              ))}
              <div className="term-cursor" />
            </div>
          </div>
        </div>
      </section>

      {/* ── Bento Features ── */}
      <section className="lp-features" id="features">
        <div className="lp-features-header">
          <span className="lp-section-eyebrow">Platform Features</span>
          <h2 className="lp-section-title">Everything you need to get hired.</h2>
          <p className="lp-section-sub">
            A complete interview training system engineered for software engineers targeting top-tier companies.
          </p>
        </div>

        <div className="lp-bento">
          {FEATURES.map((f) => (
            <div key={f.id} className={`lp-bento-cell lp-accent-${f.accent} ${f.size === 'large' ? 'lp-bento-large' : ''}`}>
              <div className="lp-cell-top">
                <span className="lp-cell-icon">{f.icon}</span>
                <span className="lp-cell-stat">{f.stat}</span>
              </div>
              <h3 className="lp-cell-title">{f.label}</h3>
              <p className="lp-cell-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer CTA ── */}
      <section className="lp-footer-cta">
        <h2 className="lp-footer-title">Ready to level up?</h2>
        <p className="lp-footer-sub">Create a free account. Start practicing in 60 seconds.</p>
        <Link to={user ? '/dashboard' : '/auth'} className="btn-primary" id="footer-cta">
          {user ? 'Open Dashboard' : 'Get Started — Free'} →
        </Link>
        <div className="lp-footer-tagline">No credit card. No BS.</div>
      </section>

      <style>{`
        /* Root */
        .lp-root { padding-top: 52px; overflow-x: hidden; }

        /* Hero */
        .lp-hero {
          min-height: calc(100vh - 52px);
          display: flex; align-items: center;
          position: relative; padding: 60px 24px;
        }
        .lp-hero-bg { position: absolute; inset: 0; pointer-events: none; overflow: hidden; }
        .lp-hero-orb {
          position: absolute; border-radius: 50%;
          filter: blur(80px); opacity: 0.12;
        }
        .lp-orb-1 {
          width: 500px; height: 500px;
          background: var(--amber); top: 10%; left: -10%;
        }
        .lp-orb-2 {
          width: 400px; height: 400px;
          background: var(--cyan); bottom: 5%; right: -8%;
        }

        .lp-hero-inner {
          max-width: 1280px; margin: 0 auto; width: 100%;
          display: grid; grid-template-columns: 1fr 1fr;
          gap: 60px; align-items: center; position: relative; z-index: 2;
        }

        .lp-eyebrow {
          display: inline-flex; align-items: center; gap: 8px;
          font-size: 11px; font-weight: 600; color: var(--text-3);
          font-family: var(--font-mono); letter-spacing: 0.08em;
          text-transform: uppercase; margin-bottom: 28px;
        }
        .lp-eyebrow-pulse {
          width: 7px; height: 7px; border-radius: 50%;
          background: var(--emerald); animation: pulse-cyan 2s infinite;
          box-shadow: 0 0 6px var(--emerald);
        }

        .lp-headline {
          display: flex; flex-direction: column;
          font-size: clamp(42px, 6vw, 78px);
          font-weight: 700; line-height: 0.96;
          letter-spacing: -0.04em; margin-bottom: 24px;
          font-family: var(--font-heading);
        }
        .lp-headline-line { color: var(--text); }
        .lp-headline-accent {
          background: linear-gradient(90deg, var(--amber), var(--amber-bright));
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .lp-subtext {
          font-size: 15px; color: var(--text-2); line-height: 1.75;
          max-width: 520px; margin-bottom: 36px;
        }
        .lp-ctas { display: flex; align-items: center; gap: 12px; margin-bottom: 44px; }
        .lp-btn-main { padding: 12px 26px; font-size: 15px; }
        .lp-btn-ghost { padding: 12px 20px; font-size: 14px; }

        .lp-stats {
          display: flex; gap: 32px; flex-wrap: wrap;
        }
        .lp-stat { display: flex; flex-direction: column; gap: 3px; }
        .lp-stat-val {
          font-family: var(--font-mono); font-size: 22px;
          font-weight: 700; color: var(--text);
        }
        .lp-stat-label {
          font-size: 11px; color: var(--text-3);
          text-transform: uppercase; letter-spacing: 0.06em;
          font-family: var(--font-mono);
        }

        /* Terminal mock */
        .lp-terminal {
          background: var(--surface); border: 1px solid var(--border-2);
          border-radius: 12px; overflow: hidden;
          box-shadow: 0 24px 80px rgba(0,0,0,0.5);
        }
        .lp-term-topbar {
          display: flex; align-items: center; gap: 7px;
          padding: 12px 16px;
          background: var(--surface-2); border-bottom: 1px solid var(--border);
        }
        .lp-term-dot {
          width: 10px; height: 10px; border-radius: 50%;
        }
        .lp-dot-r { background: #ff5f57; }
        .lp-dot-y { background: #ffbd2e; }
        .lp-dot-g { background: #28c940; }
        .lp-term-title {
          font-family: var(--font-mono); font-size: 11px;
          color: var(--text-3); margin-left: 8px;
        }
        .lp-term-body {
          padding: 20px; display: flex; flex-direction: column; gap: 14px;
          min-height: 340px;
        }
        .term-line { display: flex; gap: 10px; align-items: flex-start; }
        .term-prefix {
          font-family: var(--font-mono); font-size: 10px;
          font-weight: 700; letter-spacing: 0.05em;
          min-width: 40px; margin-top: 1px;
        }
        .term-text { font-family: var(--font-mono); font-size: 12px; line-height: 1.6; color: var(--text-2); }
        .term-system .term-prefix { color: var(--text-3); }
        .term-system .term-text { color: var(--text-3); }
        .term-ai .term-prefix { color: var(--amber); }
        .term-ai .term-text { color: var(--text); }
        .term-user .term-prefix { color: var(--cyan-bright); }
        .term-user .term-text { color: var(--text-2); }
        .term-eval .term-prefix { color: var(--emerald); }
        .term-eval .term-text { color: var(--emerald); font-weight: 600; }
        .term-cursor {
          width: 8px; height: 14px; background: var(--amber);
          border-radius: 1px; animation: blink 1.1s step-end infinite;
          margin-top: 2px;
        }

        /* Features */
        .lp-features {
          max-width: 1280px; margin: 0 auto;
          padding: 80px 24px;
        }
        .lp-features-header { text-align: center; margin-bottom: 52px; }
        .lp-section-eyebrow {
          display: inline-block; font-family: var(--font-mono); font-size: 11px;
          font-weight: 700; text-transform: uppercase; letter-spacing: 0.09em;
          color: var(--amber); margin-bottom: 14px;
        }
        .lp-section-title {
          font-size: clamp(28px, 4vw, 44px); font-weight: 700;
          color: var(--text); margin-bottom: 14px; letter-spacing: -0.03em;
        }
        .lp-section-sub { font-size: 15px; color: var(--text-2); max-width: 560px; margin: 0 auto; line-height: 1.7; }

        /* Bento grid */
        .lp-bento {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          grid-template-rows: auto auto;
          gap: 16px;
        }
        .lp-bento-large { grid-column: span 2; }

        .lp-bento-cell {
          background: var(--surface); border: 1px solid var(--border);
          border-radius: 12px; padding: 28px;
          display: flex; flex-direction: column; gap: 10px;
          transition: var(--t); position: relative; overflow: hidden;
        }
        .lp-bento-cell::before {
          content: ''; position: absolute; top: 0; left: 0; right: 0;
          height: 1px;
          transition: var(--t);
        }
        .lp-bento-cell:hover { border-color: var(--border-2); transform: translateY(-2px); }

        .lp-accent-amber::before { background: linear-gradient(90deg, transparent, var(--amber), transparent); }
        .lp-accent-cyan::before   { background: linear-gradient(90deg, transparent, var(--cyan), transparent); }
        .lp-accent-emerald::before{ background: linear-gradient(90deg, transparent, var(--emerald), transparent); }
        .lp-accent-violet::before { background: linear-gradient(90deg, transparent, #8b5cf6, transparent); }
        .lp-accent-rose::before   { background: linear-gradient(90deg, transparent, var(--rose), transparent); }

        .lp-cell-top {
          display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px;
        }
        .lp-cell-icon { font-size: 22px; line-height: 1; }
        .lp-accent-amber .lp-cell-icon { color: var(--amber); }
        .lp-accent-cyan   .lp-cell-icon { color: var(--cyan-bright); }
        .lp-accent-emerald .lp-cell-icon { color: var(--emerald); }
        .lp-accent-violet  .lp-cell-icon { color: #a78bfa; }
        .lp-accent-rose    .lp-cell-icon { color: var(--rose); }

        .lp-cell-stat {
          font-family: var(--font-mono); font-size: 10px; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.07em; color: var(--text-3);
          border: 1px solid var(--border); padding: 3px 8px; border-radius: 4px;
        }
        .lp-cell-title { font-size: 17px; font-weight: 700; color: var(--text); }
        .lp-cell-desc  { font-size: 13px; color: var(--text-2); line-height: 1.65; }

        /* Footer CTA */
        .lp-footer-cta {
          text-align: center; padding: 80px 24px 100px;
          border-top: 1px solid var(--border);
          display: flex; flex-direction: column; align-items: center; gap: 16px;
        }
        .lp-footer-title { font-size: clamp(26px, 4vw, 44px); font-weight: 700; color: var(--text); letter-spacing: -0.03em; }
        .lp-footer-sub   { font-size: 15px; color: var(--text-2); }
        .lp-footer-cta .btn-primary { padding: 14px 30px; font-size: 15px; }
        .lp-footer-tagline {
          font-family: var(--font-mono); font-size: 11px;
          color: var(--text-3); margin-top: 8px;
        }

        @media (max-width: 900px) {
          .lp-hero-inner { grid-template-columns: 1fr; gap: 48px; }
          .lp-terminal { max-width: 100%; }
          .lp-bento { grid-template-columns: 1fr 1fr; }
          .lp-bento-large { grid-column: span 2; }
        }
        @media (max-width: 600px) {
          .lp-bento { grid-template-columns: 1fr; }
          .lp-bento-large { grid-column: span 1; }
          .lp-ctas { flex-direction: column; align-items: flex-start; }
          .lp-stats { gap: 20px; }
        }
      `}</style>
    </div>
  );
};

export default LandingPage;
