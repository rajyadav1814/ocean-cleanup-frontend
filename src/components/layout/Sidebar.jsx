import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Sidebar() {
  const { role } = useAuth();

  const links = {
    contributor: [
      { to: '/contributor/submit', label: 'Submit Activity' },
      { to: '/contributor/my-activities', label: 'My Activities' },
      { to: '/contributor/my-impact', label: 'My Impact' }
    ],
    verifier: [
      { to: '/verifier/pending', label: 'Pending Queue' },
      { to: '/verifier/review', label: 'Activity Review' },
      { to: '/verifier/multisig', label: 'Multisig Status' }
    ],
    public: [
      { to: '/dashboard/overview', label: 'Overview' },
      { to: '/dashboard/leaderboard', label: 'Leaderboard' },
      { to: '/dashboard/map', label: 'Impact Map' }
    ]
  };

  return (
    <aside className="sidebar">
      <h3>
        {role.charAt(0).toUpperCase() + role.slice(1)} Workspace
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
    </aside>
  );
}
