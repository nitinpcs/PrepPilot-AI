import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, Lock, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const UnauthorizedPage = () => {
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
        <Lock size={32} />
      </div>

      <div className="error-glitch-code">401</div>

      <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text)', marginBottom: '8px' }}>
        Access Restricted
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
        {user
          ? 'You do not have authorization to view this resource or session.'
          : 'Authentication token required to access this endpoint.'}
      </p>

      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
        {user ? (
          <Link to="/dashboard" className="btn-primary" style={{ gap: '8px' }}>
            <ShieldAlert size={16} /> Return to Dashboard
          </Link>
        ) : (
          <Link to="/auth" className="btn-primary" style={{ gap: '8px' }}>
            Sign In to Continue <ArrowRight size={16} />
          </Link>
        )}
      </div>
    </div>
  );
};

export default UnauthorizedPage;
