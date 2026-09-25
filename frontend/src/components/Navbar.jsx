import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, User as UserIcon, LayoutDashboard, Hexagon } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/auth');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="cmd-bar">
      <div className="cmd-bar-inner">
        <Link to="/" className="cmd-logo">
          <Hexagon size={18} className="cmd-logo-hex" strokeWidth={1.5} />
          <span className="cmd-logo-text">COPILOT<span className="cmd-logo-dot">.AI</span></span>
        </Link>

        {user ? (
          <nav className="cmd-nav">
            <Link
              to="/dashboard"
              className={`cmd-nav-item ${isActive('/dashboard') ? 'cmd-nav-active' : ''}`}
              id="nav-dashboard"
            >
              <LayoutDashboard size={14} />
              <span>/dashboard</span>
            </Link>
            <Link
              to="/profile"
              className={`cmd-nav-item ${isActive('/profile') ? 'cmd-nav-active' : ''}`}
              id="nav-profile"
            >
              <UserIcon size={14} />
              <span>/profile</span>
            </Link>

            <div className="cmd-divider" />

            <div className="cmd-user-tag">
              <span className="cmd-user-dot" />
              <span className="cmd-user-name">{user.name.split(' ')[0]}</span>
            </div>

            <button onClick={handleLogout} className="cmd-logout-btn" title="Sign Out" id="btn-logout">
              <LogOut size={14} />
            </button>
          </nav>
        ) : (
          <nav className="cmd-nav">
            {location.pathname !== '/auth' && (
              <Link to="/auth" className="btn-primary" style={{ padding: '7px 16px', fontSize: '13px' }} id="btn-signin">
                Sign In →
              </Link>
            )}
          </nav>
        )}
      </div>

      <style>{`
        .cmd-bar {
          position: fixed; top: 0; left: 0; width: 100%; z-index: 1000;
          height: 52px;
          background: rgba(8, 11, 18, 0.85);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          border-bottom: 1px solid var(--border);
        }
        .cmd-bar-inner {
          max-width: 1280px; height: 100%;
          margin: 0 auto; padding: 0 24px;
          display: flex; align-items: center; justify-content: space-between;
        }
        .cmd-logo {
          display: flex; align-items: center; gap: 9px;
          text-decoration: none;
        }
        .cmd-logo-hex {
          color: var(--amber);
          transition: var(--t);
        }
        .cmd-logo:hover .cmd-logo-hex {
          filter: drop-shadow(0 0 6px var(--amber));
        }
        .cmd-logo-text {
          font-family: var(--font-mono);
          font-size: 13px;
          font-weight: 700;
          color: var(--text);
          letter-spacing: 0.12em;
        }
        .cmd-logo-dot { color: var(--amber); }

        .cmd-nav {
          display: flex; align-items: center; gap: 4px;
        }
        .cmd-nav-item {
          display: flex; align-items: center; gap: 6px;
          padding: 5px 12px; border-radius: 6px;
          font-size: 12px; font-weight: 500;
          color: var(--text-3);
          font-family: var(--font-mono);
          transition: var(--t);
          text-decoration: none;
          border: 1px solid transparent;
        }
        .cmd-nav-item:hover {
          color: var(--text-2);
          background: var(--surface-2);
          border-color: var(--border);
        }
        .cmd-nav-active {
          color: var(--amber) !important;
          background: var(--amber-dim) !important;
          border-color: var(--amber-border) !important;
        }
        .cmd-divider {
          width: 1px; height: 20px;
          background: var(--border-2);
          margin: 0 8px;
        }
        .cmd-user-tag {
          display: flex; align-items: center; gap: 7px;
          padding: 4px 10px; border-radius: 6px;
          background: var(--surface-2);
          border: 1px solid var(--border);
        }
        .cmd-user-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: var(--emerald);
          box-shadow: 0 0 6px var(--emerald);
          animation: pulse-cyan 2.5s ease-in-out infinite;
        }
        .cmd-user-name {
          font-size: 12px; font-weight: 600;
          color: var(--text-2); font-family: var(--font-mono);
        }
        .cmd-logout-btn {
          display: flex; align-items: center; justify-content: center;
          width: 32px; height: 32px; border-radius: 6px;
          color: var(--text-3);
          transition: var(--t);
          border: 1px solid transparent;
        }
        .cmd-logout-btn:hover {
          color: var(--rose);
          background: var(--rose-dim);
          border-color: var(--rose-border);
        }

        @media (max-width: 600px) {
          .cmd-nav-item span { display: none; }
          .cmd-user-name { display: none; }
        }
      `}</style>
    </header>
  );
};

export default Navbar;
