import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Sidebar() {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();

  const links = {
    contributor: [
      { to: '/contributor/submit', label: 'Submit Activity' },
      { to: '/contributor/my-activities', label: 'My Activities' },
      { to: '/contributor/my-impact', label: 'My Impact' },
      { to: '/dashboard/overview', label: 'Dashboard' }
    ],
    verifier: [
      { to: '/verifier/pending', label: 'Pending Queue' },
      { to: '/verifier/review', label: 'Activity Review' },
      { to: '/verifier/multisig', label: 'Multisig Status' },
      { to: '/dashboard/overview', label: 'Dashboard' }
    ],
    admin: [
      { to: '/dashboard/overview', label: 'Overview' },
      { to: '/dashboard/leaderboard', label: 'Leaderboard' },
      { to: '/dashboard/map', label: 'Impact Map' },
      { to: '/contributor/submit', label: 'Contributor Workspace' },
      { to: '/verifier/pending', label: 'Verifier Workspace' }
    ]
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <aside className="sidebar flex flex-col justify-between" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <div>
        <h3>
          {role ? role.charAt(0).toUpperCase() + role.slice(1) : ''} Workspace
        </h3>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {links[role]?.map((link) => (
            <NavLink 
              key={link.to} 
              to={link.to}
              className={({ isActive }) => isActive ? "active" : ""}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      </div>
      <div style={{ marginTop: '2rem' }}>
        <div style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>
          Logged in as: <strong>{user.username}</strong>
        </div>
        <button onClick={handleLogout} className="btn btn-outline" style={{ width: '100%', borderColor: 'red', color: 'red' }}>
          Sign Out
        </button>
      </div>
    </aside>
  );
}
