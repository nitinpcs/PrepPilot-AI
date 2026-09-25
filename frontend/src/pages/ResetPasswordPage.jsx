import React, { useState } from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Lock, ShieldAlert, ArrowRight, Loader, CheckCircle, Eye, EyeOff } from 'lucide-react';

const ResetPasswordPage = () => {
  const { resetPassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const resetToken = location.state?.resetToken;
  const email = location.state?.email;

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!resetToken) {
    return <Navigate to="/auth" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      await resetPassword(resetToken, newPassword);
      setSuccess('Password updated successfully. Redirecting to sign in...');
      setTimeout(() => navigate('/auth'), 2000);
    } catch (err) {
      setError(err.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-glow"></div>
      <div className="auth-card glass-panel">
        <div className="auth-verify-header">
          <h2 className="auth-verify-title">Change Password</h2>
          <p className="auth-verify-subtitle">
            Set a new password for <strong>{email}</strong>
          </p>
        </div>

        {error && (
          <div className="auth-alert auth-alert-danger">
            <ShieldAlert size={18} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="auth-alert auth-alert-success">
            <CheckCircle size={18} />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label">New Password</label>
            <div className="input-with-icon">
              <Lock size={18} className="input-icon" />
              <input
                type={showNewPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="At least 6 characters"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                style={{ paddingRight: '48px' }}
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowNewPassword(!showNewPassword)}
                aria-label={showNewPassword ? 'Hide password' : 'Show password'}
              >
                {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <div className="input-with-icon">
              <Lock size={18} className="input-icon" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="Re-enter new password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                style={{ paddingRight: '48px' }}
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" className="btn-primary auth-submit-btn" disabled={loading}>
            {loading ? <Loader className="animate-spin" size={18} /> : <>Update Password <ArrowRight size={18} /></>}
          </button>

          <button
            type="button"
            className="btn-link auth-back-link"
            onClick={() => navigate('/auth')}
          >
            Back to Sign In
          </button>
        </form>
      </div>

      <style>{`
        .auth-container {
          padding-top: 70px;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          padding: 80px 24px;
        }
        .auth-glow {
          position: absolute;
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, rgba(99, 102, 241, 0.1) 0%, transparent 70%);
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          pointer-events: none;
        }
        .auth-card {
          width: 100%;
          max-width: 450px;
          padding: 40px;
          position: relative;
          z-index: 10;
        }
        .auth-verify-header {
          text-align: center;
          margin-bottom: 30px;
        }
        .auth-verify-title {
          font-size: 24px;
          font-weight: 700;
          color: white;
          margin-bottom: 8px;
        }
        .auth-verify-subtitle {
          font-size: 14px;
          color: var(--text-secondary);
        }
        .auth-alert {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 14px;
          border-radius: 8px;
          font-size: 14px;
          margin-bottom: 24px;
          line-height: 1.5;
        }
        .auth-alert-danger {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.2);
          color: #fca5a5;
        }
        .auth-alert-success {
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.2);
          color: #a7f3d0;
        }
        .input-with-icon {
          position: relative;
          width: 100%;
        }
        .input-icon {
          position: absolute;
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-muted);
        }
        .input-with-icon .form-input {
          padding-left: 48px;
        }
        .password-toggle-btn {
          position: absolute;
          right: 16px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-muted);
          background: none;
          border: none;
          padding: 0;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: var(--transition-smooth);
        }
        .password-toggle-btn:hover {
          color: white;
        }
        .auth-submit-btn {
          width: 100%;
          margin-top: 10px;
          justify-content: center;
        }
        .auth-back-link {
          margin-top: 16px;
          color: var(--text-muted);
          font-size: 13px;
          text-align: center;
          display: block;
          width: 100%;
        }
        .btn-link:hover {
          color: white !important;
          text-decoration: underline;
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default ResetPasswordPage;
