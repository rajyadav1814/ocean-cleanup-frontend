import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import WalletConnectButton from '../wallet/WalletConnectButton';

function getDisplayName(user) {
  return user?.displayName
    || [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim()
    || user?.username
    || user?.role
    || 'User';
}

function getDisplayInitial(user) {
  return (user?.displayInitial || getDisplayName(user) || 'U').trim().charAt(0).toUpperCase();
}

export default function Header({ toggleMobileMenu }) {
  const { user, role, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = () => {
    setShowLogoutConfirm(false);
    logout();
    navigate('/login');
  };

  const LogoutModal = () => {
    if (!showLogoutConfirm) return null;
    return createPortal(
      <div style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        animation: 'fadeIn 0.2s ease',
        fontFamily: 'var(--font-sans)'
      }}>
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border-light)',
          borderRadius: 'var(--radius-lg)',
          padding: '2.5rem',
          maxWidth: '400px',
          width: '90%',
          boxShadow: 'var(--shadow-lg), 0 0 40px var(--border-glow)',
          textAlign: 'center',
          animation: 'slideUp 0.3s ease'
        }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '50%',
            background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1.5rem auto'
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
          </div>
          <h3 style={{ marginBottom: '1rem', color: 'var(--text-main)', fontSize: '1.5rem', fontWeight: 700 }}>Sign Out</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '2.5rem', fontSize: '1rem', lineHeight: '1.5' }}>
            Are you sure you want to sign out? You will need to sign back in to access your workspace.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button
              onClick={() => setShowLogoutConfirm(false)}
              className="secondary"
              style={{ flex: 1, padding: '0.875rem', borderRadius: 'var(--radius-md)' }}
            >
              Cancel
            </button>
            <button
              onClick={handleLogout}
              className="danger"
              style={{ flex: 1, padding: '0.875rem', borderRadius: 'var(--radius-md)' }}
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>,
      document.body
    );
  };

  return (
    <header className="topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <h2 className="logo">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--primary-hover)' }}>
            <path d="M2 12h4l2-9 5 18 3-9h6" />
          </svg>
          Ocean Cleanup
        </h2>
      </div>
      <div className="nav-links">
        <button className="secondary" onClick={toggleTheme} aria-label="Toggle Theme" style={{ padding: '0.5rem', borderRadius: '50%' }}>
          {theme === 'dark' ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
        </button>
        <WalletConnectButton />

        {user && (
          <div ref={profileRef} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              style={{
                width: '36px', height: '36px', borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
                color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: 0, border: '2px solid var(--border-glow)', cursor: 'pointer',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                {getDisplayInitial(user)}
              </span>
            </button>

            {profileOpen && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 14px)', right: 0,
                width: '220px', background: 'var(--surface)',
                border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-lg), 0 0 20px rgba(0,0,0,0.2)', overflow: 'hidden', zIndex: 100
              }}>
                <div style={{ padding: '0.85rem 1rem', borderBottom: '1px solid var(--border-light)', background: 'var(--surface-hover)' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {getDisplayName(user)}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'capitalize', marginTop: '4px' }}>
                    {role || user?.role || 'Unknown'} Workspace
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', padding: '0.5rem 0' }}>
                  <button
                    onClick={() => { setProfileOpen(false); /* navigate('/profile') if available */ }}
                    style={{
                      background: 'none', color: 'var(--text-main)', border: 'none', boxShadow: 'none',
                      padding: '0.65rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem',
                      justifyContent: 'flex-start', fontSize: '0.85rem', cursor: 'pointer', borderRadius: 0,
                      width: '100%'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-hover)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'none'}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                    Profile Settings
                  </button>
                  <button
                    onClick={() => { setProfileOpen(false); setShowLogoutConfirm(true); }}
                    style={{
                      background: 'none', color: 'var(--danger)', border: 'none', boxShadow: 'none',
                      padding: '0.65rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem',
                      justifyContent: 'flex-start', fontSize: '0.85rem', cursor: 'pointer', borderRadius: 0,
                      width: '100%'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'none'}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <button className="mobile-menu-btn secondary" onClick={toggleMobileMenu} aria-label="Menu" style={{ padding: '0.5rem', borderRadius: 'var(--radius-md)' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
      </div>
      <LogoutModal />
    </header>
  );
}
