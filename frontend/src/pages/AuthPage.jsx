import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { User, Mail, Lock, ShieldAlert, ArrowRight, Loader, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { OTP_VALIDITY_SECONDS } from '../constants/otp.js';

const AuthPage = () => {
  const { login, register, verifyOtp, resendOtp, forgotPassword, verifyResetOtp } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [otp, setOtp] = useState('');
  const [otpTimer, setOtpTimer] = useState(0);
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [devModeNotice, setDevModeNotice] = useState(false);

  const resetAlerts = () => {
    setError('');
    setSuccess('');
    setDevModeNotice(false);
  };

  const switchMode = (nextMode) => {
    setMode(nextMode);
    resetAlerts();
    setOtp('');
    setOtpTimer(0);
    setShowPassword(false);
  };

  useEffect(() => {
    if (!['verify', 'verify-reset'].includes(mode)) {
      setOtpTimer(0);
      return;
    }
    if (otpTimer <= 0) return;

    const interval = setInterval(() => {
      setOtpTimer((prev) => {
        if (prev <= 1) {
          setError('OTP has expired. Please request a new code.');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [otpTimer, mode]);

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    resetAlerts();
    setLoading(true);

    try {
      const data = await register(name, email, password);
      setMode('verify');
      setOtp('');
      setOtpTimer(OTP_VALIDITY_SECONDS);
      setSuccess('Registration successful! OTP verification code has been sent.');
      if (data.developerMode) setDevModeNotice(true);
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    resetAlerts();
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      if (err.needsVerification) {
        setError(err.message);
        setMode('verify');
        setOtp('');
        setOtpTimer(OTP_VALIDITY_SECONDS);
      } else {
        setError(err.message || 'Login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    resetAlerts();
    setLoading(true);

    try {
      await verifyOtp(email, otp);
      setSuccess('Verification successful! Logging in...');
      setTimeout(() => navigate('/dashboard'), 1000);
    } catch (err) {
      setError(err.message || 'OTP Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    resetAlerts();
    setLoading(true);

    try {
      const data = await forgotPassword(email);
      setMode('verify-reset');
      setOtp('');
      setOtpTimer(OTP_VALIDITY_SECONDS);
      setSuccess('Password reset OTP sent to your email.');
      if (data.developerMode) setDevModeNotice(true);
    } catch (err) {
      if (err.needsVerification) {
        setError(err.message);
        setMode('verify');
        setOtp('');
        setOtpTimer(OTP_VALIDITY_SECONDS);
      } else {
        setError(err.message || 'Failed to send reset OTP');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyResetSubmit = async (e) => {
    e.preventDefault();
    resetAlerts();
    setLoading(true);

    try {
      const data = await verifyResetOtp(email, otp);
      navigate('/reset-password', {
        state: { resetToken: data.resetToken, email: data.email },
      });
    } catch (err) {
      setError(err.message || 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async (purpose) => {
    if (!email) {
      setError('Email is required to resend OTP');
      return;
    }

    resetAlerts();
    setResendLoading(true);

    try {
      const data = await resendOtp(email, purpose);
      setSuccess('A new OTP has been sent to your email.');
      if (data.developerMode) setDevModeNotice(true);
      setOtp('');
      setOtpTimer(OTP_VALIDITY_SECONDS);
    } catch (err) {
      setError(err.message || 'Failed to resend OTP');
    } finally {
      setResendLoading(false);
    }
  };

  const verifyTitle = mode === 'verify-reset' ? 'Verify Reset OTP' : 'Verify Email';
  const verifySubtitle = mode === 'verify-reset'
    ? 'Enter the OTP sent to reset your password (valid 30 seconds) for'
    : 'We sent a 6-digit OTP (valid 30 seconds) to';

  return (
    <div className="auth-container">
      <div className="auth-glow"></div>
      <div className="auth-card glass-panel">

        {['login', 'register'].includes(mode) && (
          <div className="auth-tabs">
            <button
              className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
              onClick={() => switchMode('login')}
            >
              Sign In
            </button>
            <button
              className={`auth-tab ${mode === 'register' ? 'active' : ''}`}
              onClick={() => switchMode('register')}
            >
              Sign Up
            </button>
          </div>
        )}

        {['verify', 'verify-reset'].includes(mode) && (
          <div className="auth-verify-header">
            <h2 className="auth-verify-title">{verifyTitle}</h2>
            <p className="auth-verify-subtitle">
              {verifySubtitle} <strong>{email}</strong>
            </p>
          </div>
        )}

        {mode === 'forgot' && (
          <div className="auth-verify-header">
            <h2 className="auth-verify-title">Forgot Password</h2>
            <p className="auth-verify-subtitle">Enter your email to receive a password reset OTP</p>
          </div>
        )}

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

        {devModeNotice && (
          <div className="auth-alert auth-alert-warning">
            <ShieldAlert size={18} />
            <span><strong>[Local Developer Mode]:</strong> SMTP mailer is offline. Look in your backend terminal output to copy the generated OTP!</span>
          </div>
        )}

        {mode === 'login' && (
          <form onSubmit={handleLoginSubmit} className="auth-form">
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div className="input-with-icon">
                <Mail size={18} className="input-icon" />
                <input
                  type="email"
                  className="form-input"
                  placeholder="name@domain.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="input-with-icon">
                <Lock size={18} className="input-icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  placeholder="••••••••"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ paddingRight: '48px' }}
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="auth-forgot-row">
              <button
                type="button"
                className="btn-link"
                onClick={() => switchMode('forgot')}
              >
                Forgot password?
              </button>
            </div>

            <button type="submit" className="btn-primary auth-submit-btn" disabled={loading}>
              {loading ? <Loader className="animate-spin" size={18} /> : <>Sign In <ArrowRight size={18} /></>}
            </button>
          </form>
        )}

        {mode === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="auth-form">
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <div className="input-with-icon">
                <User size={18} className="input-icon" />
                <input
                  type="text"
                  className="form-input"
                  placeholder="John Doe"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div className="input-with-icon">
                <Mail size={18} className="input-icon" />
                <input
                  type="email"
                  className="form-input"
                  placeholder="name@domain.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="input-with-icon">
                <Lock size={18} className="input-icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  placeholder="At least 6 characters"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ paddingRight: '48px' }}
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn-primary auth-submit-btn" disabled={loading}>
              {loading ? <Loader className="animate-spin" size={18} /> : <>Create Account <ArrowRight size={18} /></>}
            </button>
          </form>
        )}

        {mode === 'forgot' && (
          <form onSubmit={handleForgotSubmit} className="auth-form">
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div className="input-with-icon">
                <Mail size={18} className="input-icon" />
                <input
                  type="email"
                  className="form-input"
                  placeholder="name@domain.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <button type="submit" className="btn-primary auth-submit-btn" disabled={loading}>
              {loading ? <Loader className="animate-spin" size={18} /> : <>Send Reset OTP <ArrowRight size={18} /></>}
            </button>

            <button
              type="button"
              className="btn-link auth-back-link"
              onClick={() => switchMode('login')}
            >
              Back to Sign In
            </button>
          </form>
        )}

        {mode === 'verify' && (
          <form onSubmit={handleVerifySubmit} className="auth-form">
            <div className="form-group">
              <label className="form-label">Enter One-Time Password (OTP)</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <input
                  type="text"
                  className="form-input otp-input"
                  placeholder="000000"
                  maxLength={6}
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  disabled={otpTimer === 0}
                  style={{ flex: 1 }}
                />
                <div style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: otpTimer > 8 ? '#818cf8' : '#f87171',
                  padding: '10px 14px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-glass)',
                  background: 'rgba(255, 255, 255, 0.05)',
                  minWidth: '55px',
                  textAlign: 'center'
                }}>
                  {otpTimer}s
                </div>
              </div>
            </div>

            <button type="submit" className="btn-primary auth-submit-btn" disabled={loading || otpTimer === 0}>
              {loading ? <Loader className="animate-spin" size={18} /> : <>Verify & Access <ArrowRight size={18} /></>}
            </button>

            <button
              type="button"
              className="btn-link auth-back-link"
              onClick={() => handleResendOtp('registration')}
              disabled={resendLoading}
            >
              {resendLoading ? 'Resending OTP...' : 'Resend OTP'}
            </button>

            <button
              type="button"
              className="btn-link auth-back-link"
              onClick={() => switchMode('login')}
            >
              Back to Sign In
            </button>
          </form>
        )}

        {mode === 'verify-reset' && (
          <form onSubmit={handleVerifyResetSubmit} className="auth-form">
            <div className="form-group">
              <label className="form-label">Enter Reset OTP</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <input
                  type="text"
                  className="form-input otp-input"
                  placeholder="000000"
                  maxLength={6}
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  disabled={otpTimer === 0}
                  style={{ flex: 1 }}
                />
                <div style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: otpTimer > 8 ? '#818cf8' : '#f87171',
                  padding: '10px 14px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-glass)',
                  background: 'rgba(255, 255, 255, 0.05)',
                  minWidth: '55px',
                  textAlign: 'center'
                }}>
                  {otpTimer}s
                </div>
              </div>
            </div>

            <button type="submit" className="btn-primary auth-submit-btn" disabled={loading || otpTimer === 0}>
              {loading ? <Loader className="animate-spin" size={18} /> : <>Verify OTP <ArrowRight size={18} /></>}
            </button>

            <button
              type="button"
              className="btn-link auth-back-link"
              onClick={() => handleResendOtp('password_reset')}
              disabled={resendLoading}
            >
              {resendLoading ? 'Resending OTP...' : 'Resend OTP'}
            </button>

            <button
              type="button"
              className="btn-link auth-back-link"
              onClick={() => switchMode('login')}
            >
              Back to Sign In
            </button>
          </form>
        )}

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
        .auth-tabs {
          display: flex;
          border-bottom: 1px solid var(--border-glass);
          margin-bottom: 30px;
        }
        .auth-tab {
          flex: 1;
          padding: 12px;
          text-align: center;
          font-family: var(--font-heading);
          font-weight: 600;
          font-size: 16px;
          color: var(--text-secondary);
          transition: var(--transition-smooth);
          border-bottom: 2px solid transparent;
        }
        .auth-tab:hover, .auth-tab.active {
          color: white;
        }
        .auth-tab.active {
          border-color: var(--primary);
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
        .auth-alert-warning {
          background: rgba(245, 158, 11, 0.1);
          border: 1px solid rgba(245, 158, 11, 0.2);
          color: #fde047;
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
        .otp-input {
          text-align: center;
          font-size: 28px;
          letter-spacing: 12px;
          font-weight: bold;
          font-family: monospace;
          padding-left: 12px;
        }
        .auth-submit-btn {
          width: 100%;
          margin-top: 10px;
          justify-content: center;
        }
        .auth-forgot-row {
          display: flex;
          justify-content: flex-end;
          margin-top: -4px;
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

export default AuthPage;
