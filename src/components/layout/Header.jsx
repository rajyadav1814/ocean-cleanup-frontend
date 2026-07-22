import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import WalletConnectButton from '../wallet/WalletConnectButton';

export default function Header() {
  const { role, setRole } = useAuth();

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
        <select value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="contributor">Contributor</option>
          <option value="verifier">Verifier</option>
          <option value="public">Public</option>
        </select>
        <WalletConnectButton />
      </div>
    </header>
  );
}
