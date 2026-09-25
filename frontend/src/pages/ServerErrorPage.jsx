import React from 'react';
import { Link } from 'react-router-dom';
import { ServerCrash, RefreshCw, Home } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const ServerErrorPage = () => {
  const { user } = useAuth();

  return (
    <div className="error-page-container">
      <div
        style={{
          width: '64px',
          height: '64px',
          borderRadius: '16px',
          background: 'var(--rose-dim)',
          border: '1px solid var(--rose-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--rose)',
          marginBottom: '20px',
        }}
      >
        <ServerCrash size={32} />
      </div>

      <div className="error-glitch-code rose">500</div>

      <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text)', marginBottom: '8px' }}>
        System Anomaly Encountered
      </h1>

      <p
        style={{
          fontSize: '14px',
          color: 'var(--text-3)',
          maxWidth: '440px',
          lineHeight: '1.6',
          marginBottom: '28px',
          fontFamily: 'var(--font-mono)',
        }}
      >
        An internal server error occurred while processing your neural telemetry. Our backend handlers have logged the incident.
      </p>

      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <button
          onClick={() => window.location.reload()}
          className="btn-secondary"
          style={{ gap: '8px' }}
        >
          <RefreshCw size={16} /> Retry Request
        </button>
        <Link to={user ? '/dashboard' : '/'} className="btn-primary" style={{ gap: '8px' }}>
          <Home size={16} /> Return to Safety
        </Link>
      </div>
    </div>
  );
};

export default ServerErrorPage;
