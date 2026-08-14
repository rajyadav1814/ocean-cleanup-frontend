import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ICONS = {
  dashboard: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
    </svg>
  ),
  user: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  zap: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
  map: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
      <line x1="8" y1="2" x2="8" y2="18" />
      <line x1="16" y1="6" x2="16" y2="22" />
    </svg>
  ),
  check: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  shield: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  plus: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  verifierList: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <polyline points="9 12 11 14 15 10" />
    </svg>
  ),
  contributorList: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  citizenList: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
      <path d="M9 12l1.5 4 1.5-2 1.5 2 1.5-4" />
    </svg>
  ),
  org: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  x: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  list: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  ),
  chevronLeft: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  )
};

import { useState, useEffect } from 'react';
export default function Sidebar({ isMobileMenuOpen, setIsMobileMenuOpen }) {
  const { user, role } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth < 768;

  const getWorkspaceLabel = (roleName) => {
    switch (roleName) {
      case 'admin': return 'Admin Space';
      case 'contributor': return 'Contributor Space';
      case 'verifier': return 'Verifier Space';
      case 'citizen': return 'Citizen Space';
      default: return 'Workspace';
    }
  };

  const links = {
    contributor: [
      { to: '/contributor/overview', label: 'Overview', icon: 'dashboard' },
      { to: '/contributor/submit', label: 'Submit Activity', icon: 'plus' },
      { to: '/contributor/my-activities', label: 'My Activities', icon: 'list' },
    ],
    citizen: [
      { to: '/citizen/overview', label: 'My Space', icon: 'dashboard' },
      { to: '/citizen/submit', label: 'Submit Activity', icon: 'plus' },
      { to: '/citizen/my-activities', label: 'My Activities', icon: 'list' },
    ],
    verifier: [
      { to: '/verifier/pending', label: 'Pending Activities', icon: 'dashboard' },
      { to: '/verifier/review', label: 'Approved Activities', icon: 'check' },
      { to: '/verifier/rejected', label: 'Rejected Activities', icon: 'x' },
      { to: '/verifier/multisig', label: 'Multisig Status', icon: 'shield' }
    ],
    admin: [
      { to: '/dashboard/overview', label: 'Overview', icon: 'dashboard' },
      { to: '/dashboard/activities', label: 'All Activities', icon: 'check' },
      { to: '/dashboard/verifiers', label: 'Verifier List', icon: 'verifierList' },
      { to: '/dashboard/contributors', label: 'Contributors List', icon: 'contributorList' },
      { to: '/dashboard/citizens', label: 'Citizens List', icon: 'citizenList' },
      { to: '/dashboard/organizations', label: 'Organizations', icon: 'org' },
      { to: '/dashboard/map', label: 'Impact Map', icon: 'map' },
      { to: '/contributor/submit', label: 'Contributor Workspace', icon: 'user' },
      { to: '/verifier/pending', label: 'Verifier Workspace', icon: 'check' }
    ]
  };

  if (!user) return null;



  return (
    <>
      <div
        className={`sidebar-overlay ${isMobileMenuOpen ? 'mobile-open' : ''}`}
        onClick={() => setIsMobileMenuOpen(false)}
      />
      <aside
        className={`sidebar-container ${isMobileMenuOpen ? 'mobile-open' : ''}`}
        style={{
          width: isCollapsed ? '80px' : (isMobile ? '260px' : '310px'),
          padding: isCollapsed ? '1rem 0.5rem' : (isMobile ? '1.25rem 1rem' : '1.5rem 1.25rem')
        }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: isCollapsed ? 'center' : 'space-between', marginBottom: isMobile ? '1.5rem' : '2.5rem' }}>
          {!isCollapsed && (
            <h2 style={{ margin: 0, fontSize: isMobile ? '0.9rem' : '1.2rem', fontWeight: 700, color: 'var(--text-main)', whiteSpace: 'nowrap', fontFamily: 'var(--font-display)', letterSpacing: '-0.01em' }}>
              {getWorkspaceLabel(role)}
            </h2>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            style={{
              width: isMobile ? '32px' : '36px', height: isMobile ? '32px' : '36px', borderRadius: '50%', backgroundColor: 'var(--surface-hover)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffffff',
              border: '1px solid var(--border-light)', cursor: 'pointer', flexShrink: 0, padding: 0, transition: 'all 0.3s',
              boxShadow: 'none'
            }}
          >
            <div style={{ transform: `scale(${isMobile ? 0.65 : 0.75}) rotate(${isCollapsed ? 180 : 0}deg)`, display: 'flex', transition: 'transform 0.3s ease' }}>
              {ICONS.chevronLeft}
            </div>
          </button>
        </div>

        {/* Navigation */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1 }}>
          {links[role]?.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={() => { if (isMobile) setIsMobileMenuOpen(false); }}
              title={isCollapsed ? link.label : undefined}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                justifyContent: isCollapsed ? 'center' : 'flex-start',
                gap: isMobile ? '0.75rem' : '1rem',
                padding: isCollapsed ? '0.75rem 0' : (isMobile ? '0.6rem 0.75rem' : '0.75rem 1rem'),
                borderRadius: 'var(--radius-md)',
                textDecoration: 'none',
                fontWeight: 500,
                fontSize: isMobile ? '0.92rem' : '0.98rem',
                fontFamily: 'var(--font-sans)',
                transition: 'all 0.2s',
                backgroundColor: isActive ? 'rgba(14, 165, 233, 0.15)' : 'transparent',
                color: isActive ? 'var(--primary-hover)' : 'var(--text-muted)',
                border: isActive ? '1px solid var(--border-glow)' : '1px solid transparent',
                boxShadow: isActive ? 'inset 0 0 20px rgba(14, 165, 233, 0.05)' : 'none',
                whiteSpace: 'nowrap',
                width: '100%',
                boxSizing: 'border-box',
                aspectRatio: isCollapsed && isActive ? '1' : 'auto'
              })}
            >
              {({ isActive }) => (
                <>
                  <div style={{ color: isActive ? 'var(--primary-hover)' : 'var(--text-muted)', flexShrink: 0, transform: isMobile ? 'scale(0.9)' : 'none', display: 'flex' }}>
                    {ICONS[link.icon]}
                  </div>
                  {!isCollapsed && <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', fontSize: isMobile ? '0.92rem' : '0.98rem', fontFamily: 'var(--font-sans)' }}>{link.label}</span>}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Community rank mini-card */}
        {(role === 'contributor' || role === 'citizen') && !isCollapsed && (
          <div style={{
            marginTop: 'auto',
            paddingTop: '1.25rem',
            borderTop: '1px solid var(--border-light)',
          }}>
            <div style={{
              background: 'linear-gradient(135deg, rgba(14,165,233,0.15) 0%, rgba(61,214,224,0.1) 100%)',
              border: '1px solid var(--border-glow)',
              borderRadius: 'var(--radius-md)',
              padding: '1rem 1.1rem',
            }}>
              <div style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.18em', color: 'var(--text-muted)', fontWeight: 400, fontFamily: 'var(--font-mono)' }}>Your impact</div>
              <div style={{ fontSize: '1.35rem', fontWeight: 600, color: 'var(--primary-hover)', margin: '0.25rem 0 0.15rem', fontFamily: 'var(--font-display)', letterSpacing: '-0.01em' }}>🌊 Active</div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontFamily: 'var(--font-sans)', lineHeight: 1.5 }}>Keep logging — every kg counts!</div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
