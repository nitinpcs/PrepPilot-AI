import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, ArrowLeft, Home } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const NotFoundPage = () => {
  const { user } = useAuth();

  return (
    <div className="error-page-container">
      <div
        style={{
          width: '64px',
          height: '64px',
          borderRadius: '16px',
          background: 'var(--amber-dim)',
          border: '1px solid var(--amber-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--amber)',
          marginBottom: '20px',
        }}
      >
        <Compass size={32} />
      </div>

      <div className="error-glitch-code">404</div>

      <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text)', marginBottom: '8px' }}>
        Signal Lost
      </h1>

      <p
        style={{
          fontSize: '14px',
          color: 'var(--text-3)',
          maxWidth: '420px',
          lineHeight: '1.6',
          marginBottom: '28px',
          fontFamily: 'var(--font-mono)',
        }}
      >
        The requested route <span style={{ color: 'var(--amber)' }}>{window.location.pathname}</span> does not exist or has been relocated in space.
      </p>

      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <Link to={user ? '/dashboard' : '/'} className="btn-primary" style={{ gap: '8px' }}>
          {user ? <Home size={16} /> : <ArrowLeft size={16} />}
          {user ? 'Return to Mission Control' : 'Back to Home'}
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
