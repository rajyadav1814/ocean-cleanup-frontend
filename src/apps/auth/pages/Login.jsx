import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { authLogin } from '../../../services/api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
    return () => {
      const savedTheme = localStorage.getItem('theme') || 'dark';
      document.documentElement.setAttribute('data-theme', savedTheme);
    };
  }, []);

  const getRedirectPath = (role) => {
    if (role === 'verifier') return '/verifier/pending';
    if (role === 'admin') return '/dashboard/overview';
    return '/contributor/submit';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await authLogin(email, password);
      if (data.ok) {
        login(data.user, data.token);
        navigate(getRedirectPath(data.user.role), {
          replace: true,
          state: { flashMessage: 'Login successful' }
        });
      } else {
        setError(data.message || 'Invalid credentials');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <header className="auth-header">
        <Link to="/" className="brand-wordmark" aria-label="BlueMind home">BLUEMIND</Link>
      </header>
      <div className="card auth-card" style={{ textAlign: 'left' }}>
        <div className="auth-form-intro">
          <h2>Welcome back</h2>
          <p className="auth-subtitle">Sign in to keep mapping.</p>
        </div>

        {error && (
          <p className="auth-error">{error}</p>
        )}

        <form onSubmit={handleSubmit} className="auth-email-form">
          <div className="form-group">
            <label htmlFor="login-email">Email</label>
            <input
              id="login-email"
              type="text"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              style={{ width: '100%' }}
            />
          </div>

          <div className="form-group">
            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              style={{ width: '100%' }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              marginTop: '0.25rem',
              padding: '0.9rem',
              background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
              color: 'white',
              fontWeight: 600,
              fontSize: '1rem',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '0.5rem',
              opacity: loading ? 0.75 : 1,
              transition: 'opacity 0.2s, transform 0.2s',
              boxShadow: 'var(--shadow-glow)'
            }}
          >
            {loading && (
              <div style={{
                width: '16px', height: '16px',
                border: '2px solid rgba(255,255,255,0.35)',
                borderTopColor: 'white',
                borderRadius: '50%',
                animation: 'spin 0.7s linear infinite'
              }} />
            )}
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <div className="auth-divider" aria-hidden="true"><span />or<span /></div>

        <p className="auth-switch">
          New here?{' '}
          <Link to="/signup" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
