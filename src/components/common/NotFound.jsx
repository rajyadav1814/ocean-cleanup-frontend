import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// Shown for any URL no route matches — mistyped links, old bookmarks, or
// pages that have since been removed — instead of a blank screen.
export default function NotFound() {
  const { user, role } = useAuth();
  const location = useLocation();

  const homePath = !user ? '/'
    : role === 'verifier' ? '/verifier/pending'
      : role === 'citizen' ? '/citizen/overview'
        : '/contributor/overview';

  return (
    <div style={{ minHeight: user ? '60vh' : '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
      <div className="card" style={{ maxWidth: '28rem', width: '100%', textAlign: 'center', padding: '2.5rem 1.75rem' }}>
        <p style={{ margin: 0, fontSize: '3.25rem', fontWeight: 700, lineHeight: 1, color: 'var(--primary)', letterSpacing: '-0.02em' }}>404</p>
        <h2 style={{ margin: '1rem 0 0.5rem' }}>This page drifted off</h2>
        <p className="text-muted" style={{ margin: '0 0 0.4rem' }}>
          We couldn't find a page at this address. It may have moved, or the link may be mistyped.
        </p>
        <p className="text-muted" style={{ margin: '0 0 1.75rem', fontSize: '0.78rem', wordBreak: 'break-all' }}>
          <code>{location.pathname}</code>
        </p>
        <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to={homePath} className="bm-button" style={{ padding: '0.7rem 1.3rem', fontWeight: 600, textDecoration: 'none' }}>
            {user ? 'Go to my overview' : 'Back to home'}
          </Link>
          {!user && (
            <Link to="/login" className="bm-button" style={{ padding: '0.7rem 1.3rem', fontWeight: 600, textDecoration: 'none' }}>
              Sign in
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
