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
  )
};

import { useState } from 'react';
export default function Sidebar({ isMobileMenuOpen, setIsMobileMenuOpen }) {
  const { user, role } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const links = {
    contributor: [
      { to: '/contributor/submit', label: 'Submit Activity', icon: 'zap' },
      { to: '/contributor/my-activities', label: 'My Activities', icon: 'dashboard' },
      { to: '/contributor/my-impact', label: 'My Impact', icon: 'user' }
    ],
    verifier: [
      { to: '/verifier/pending', label: 'Pending Queue', icon: 'dashboard' },
      { to: '/verifier/review', label: 'Activity Review', icon: 'check' },
      { to: '/verifier/multisig', label: 'Multisig Status', icon: 'shield' }
    ],
    admin: [
      { to: '/dashboard/overview', label: 'Overview', icon: 'dashboard' },
      { to: '/dashboard/activities', label: 'All Activities', icon: 'check' },
      { to: '/dashboard/verifiers', label: 'Verifier List', icon: 'verifierList' },
      { to: '/dashboard/contributors', label: 'Contributors List', icon: 'contributorList' },
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
          width: isCollapsed ? '80px' : '260px',
          padding: isCollapsed ? '1.5rem 0.5rem' : '1.5rem 1.25rem'
        }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: isCollapsed ? 'center' : 'space-between', marginBottom: '2.5rem' }}>
        {!isCollapsed && (
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)', whiteSpace: 'nowrap' }}>
            WORK SPACE
          </h2>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          style={{
            width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'var(--surface-hover)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffffff',
            border: '1px solid var(--border-light)', cursor: 'pointer', flexShrink: 0, padding: 0, transition: 'all 0.3s',
            boxShadow: 'none'
          }}
        >
          {ICONS.dashboard}
        </button>
      </div>

      {/* Navigation */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1 }}>
        {links[role]?.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            title={isCollapsed ? link.label : undefined}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              justifyContent: isCollapsed ? 'center' : 'flex-start',
              gap: '1rem',
              padding: isCollapsed ? '0.75rem 0' : '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: '0.9rem',
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
                <div style={{ color: isActive ? 'var(--primary-hover)' : 'var(--text-muted)', flexShrink: 0 }}>
                  {ICONS[link.icon]}
                </div>
                {!isCollapsed && <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{link.label}</span>}
              </>
            )}
          </NavLink>
        ))}
      </nav>
      </aside>
    </>
  );
}
