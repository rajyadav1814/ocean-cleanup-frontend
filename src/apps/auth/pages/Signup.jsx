import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import Logo from '../../../components/common/Logo';
import { authSignup } from '../../../services/api';

export default function Signup() {
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', username: '', password: '', role: 'contributor' });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await authSignup(form);
      if (data.ok) {
        login(data.user, data.token);
        if (data.user.role === 'verifier') navigate('/verifier/pending');
        else if (data.user.role === 'admin') navigate('/dashboard/overview');
        else navigate('/contributor/submit');
      } else {
        setError(data.message || 'Signup failed');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  return (
    <div className="auth-container" style={{ flexDirection: 'column', gap: '1.5rem' }}>
      <Logo />
      <div className="card auth-card" style={{ textAlign: 'left' }}>
        <h2 className="gradient-text" style={{ textAlign: 'center', fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.35rem' }}>
          Create Account
        </h2>
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '2rem' }}>
          Join the ocean cleanup movement
        </p>

        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 'var(--radius-md)', padding: '0.75rem 1rem',
            color: '#f87171', fontSize: '0.875rem', marginBottom: '1.25rem',
            display: 'flex', alignItems: 'center', gap: '0.5rem'
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-muted)' }}>First Name</label>
              <input type="text" placeholder="John" value={form.firstName} onChange={set('firstName')} required style={{ width: '100%' }} />
            </div>
            <div className="form-group">
              <label style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-muted)' }}>Last Name</label>
              <input type="text" placeholder="Doe" value={form.lastName} onChange={set('lastName')} required style={{ width: '100%' }} />
            </div>
          </div>

          <div className="form-group">
            <label style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-muted)' }}>Email</label>
            <input type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} required autoComplete="email" style={{ width: '100%' }} />
          </div>

          <div className="form-group">
            <label style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-muted)' }}>Username</label>
            <input type="text" placeholder="Choose a username" value={form.username} onChange={set('username')} required autoComplete="username" style={{ width: '100%' }} />
          </div>

          <div className="form-group">
            <label style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-muted)' }}>Password</label>
            <div style={{ position: 'relative', width: '100%' }}>
              <input
                type={showPass ? 'text' : 'password'}
                placeholder="Create a password"
                value={form.password}
                onChange={set('password')}
                required
                autoComplete="new-password"
                style={{ width: '100%', paddingRight: '3rem' }}
              />
              <button
                type="button"
                onClick={() => setShowPass(v => !v)}
                style={{
                  position: 'absolute', right: '0.875rem', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)',
                  padding: '0.25rem', display: 'flex', alignItems: 'center', boxShadow: 'none'
                }}
                tabIndex={-1}
              >
                {showPass ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-muted)' }}>Role</label>
            <select value={form.role} onChange={set('role')} style={{ width: '100%' }}>
              <option value="contributor">Contributor</option>
              <option value="verifier">Verifier</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', marginTop: '0.25rem', padding: '0.9rem',
              background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
              color: 'white', fontWeight: 600, fontSize: '1rem',
              borderRadius: 'var(--radius-md)', border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem',
              opacity: loading ? 0.75 : 1, boxShadow: 'var(--shadow-glow)'
            }}
          >
            {loading && (
              <div style={{
                width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.35)',
                borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite'
              }} />
            )}
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <p style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
