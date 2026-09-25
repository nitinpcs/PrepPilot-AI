import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';
import LandingPage from '../pages/LandingPage';
import AuthPage from '../pages/AuthPage';
import DashboardPage from '../pages/DashboardPage';
import InterviewPage from '../pages/InterviewPage';
import CodingInterviewPage from '../pages/CodingInterviewPage';
import FeedbackReportPage from '../pages/FeedbackReportPage';
import ProfilePage from '../pages/ProfilePage';
import ResetPasswordPage from '../pages/ResetPasswordPage';
import NotFoundPage from '../pages/NotFoundPage';
import ServerErrorPage from '../pages/ServerErrorPage';
import UnauthorizedPage from '../pages/UnauthorizedPage';
import { Hexagon, AlertTriangle, X } from 'lucide-react';
import Skeleton from '../components/Skeleton';

// Branded loading screen component
const AppLoadingScreen = ({ label = 'Initializing Copilot...' }) => {
  return (
    <div className="global-loader-screen">
      <div className="splash-card glass-panel">
        <div className="splash-logo-wrap">
          <Hexagon size={36} className="splash-hex" strokeWidth={1.5} />
          <span className="splash-logo-text">COPILOT<span className="splash-logo-dot">.AI</span></span>
        </div>
        <Skeleton width="180px" height="4px" borderRadius="2px" />
        <p className="splash-label">{label}</p>
      </div>
    </div>
  );
};

// Guard for protected dashboards and session paths
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <AppLoadingScreen label="Verifying session credentials..." />;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return children;
};

// Guard for login/signup page (redirect to dashboard if logged in)
const AuthRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <AppLoadingScreen label="Checking authentication state..." />;
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Session Expired Floating Banner
const SessionExpiredBanner = () => {
  const { sessionExpired, clearSessionExpired } = useAuth();

  if (!sessionExpired) return null;

  return (
    <div className="session-expired-banner">
      <div className="seb-content">
        <AlertTriangle size={16} className="seb-icon" />
        <span>Your session has expired. Please sign in again.</span>
      </div>
      <div className="seb-actions">
        <Link to="/auth" className="btn-primary seb-btn" onClick={clearSessionExpired}>
          Sign In
        </Link>
        <button onClick={clearSessionExpired} className="seb-close" title="Dismiss">
          <X size={14} />
        </button>
      </div>
    </div>
  );
};

function AppContent() {
  return (
    <Router>
      <Navbar />
      <SessionExpiredBanner />
      <main className="app-main-content">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          
          {/* Guest Only Routes */}
          <Route path="/auth" element={
            <AuthRoute>
              <AuthPage />
            </AuthRoute>
          } />

          <Route path="/reset-password" element={
            <AuthRoute>
              <ResetPasswordPage />
            </AuthRoute>
          } />
          
          {/* Protected Student Routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          } />

          <Route path="/interview/:id" element={
            <ProtectedRoute>
              <InterviewPage />
            </ProtectedRoute>
          } />

          <Route path="/coding-interview" element={
            <ProtectedRoute>
              <CodingInterviewPage />
            </ProtectedRoute>
          } />

          <Route path="/report/:id" element={
            <ProtectedRoute>
              <FeedbackReportPage />
            </ProtectedRoute>
          } />

          <Route path="/profile" element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } />

          {/* Explicit Error Routes */}
          <Route path="/401" element={<UnauthorizedPage />} />
          <Route path="/403" element={<UnauthorizedPage />} />
          <Route path="/500" element={<ServerErrorPage />} />
          <Route path="/404" element={<NotFoundPage />} />

          {/* Catch-all 404 Route */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>

      <style>{`
        .global-loader-screen {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: var(--bg);
          padding: 24px;
        }
        .splash-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          padding: 36px 48px;
          border-radius: 16px;
          border: 1px solid var(--amber-border);
          background: rgba(13, 17, 23, 0.9);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5);
        }
        .splash-logo-wrap {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .splash-hex {
          color: var(--amber);
          filter: drop-shadow(0 0 8px var(--amber));
        }
        .splash-logo-text {
          font-family: var(--font-mono);
          font-size: 16px;
          font-weight: 700;
          color: var(--text);
          letter-spacing: 0.12em;
        }
        .splash-logo-dot { color: var(--amber); }
        .splash-label {
          font-size: 12px;
          color: var(--text-3);
          font-family: var(--font-mono);
        }
        .app-main-content {
          min-height: calc(100vh - 52px);
          padding-top: 52px;
        }
        /* Session Expired Banner */
        .session-expired-banner {
          position: fixed;
          top: 64px;
          right: 24px;
          z-index: 1100;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 12px 18px;
          border-radius: 10px;
          background: var(--surface-2);
          border: 1px solid var(--amber-border);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
          animation: slideDown 0.3s var(--ease-spring);
        }
        @keyframes slideDown {
          from { transform: translateY(-16px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .seb-content {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 13px;
          color: var(--text);
        }
        .seb-icon { color: var(--amber); flex-shrink: 0; }
        .seb-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .seb-btn {
          padding: 5px 12px !important;
          font-size: 12px !important;
        }
        .seb-close {
          background: transparent;
          border: none;
          color: var(--text-3);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 4px;
          border-radius: 4px;
          transition: var(--t);
        }
        .seb-close:hover {
          color: var(--text);
          background: rgba(255, 255, 255, 0.06);
        }
      `}</style>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
