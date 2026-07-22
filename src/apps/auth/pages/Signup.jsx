import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import Logo from '../../../components/common/Logo';

export default function Signup() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('contributor');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const res = await fetch('http://localhost:3001/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ firstName, lastName, email, username, password, role })
      });

      const data = await res.json();

      if (data.ok) {
        login(data.user, data.token);
        if (data.user.role === 'verifier') navigate('/verifier/pending');
        else if (data.user.role === 'admin') navigate('/dashboard/overview');
        else navigate('/contributor/submit');
      } else {
        setError(data.message || 'Signup failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    }
  };

  return (
    <div className="auth-container" style={{ flexDirection: 'column' }}>
      <Logo />
      <div className="card glass auth-card">
        <h2 className="text-xl font-bold mb-4 gradient-text" style={{ textAlign: 'center' }}>Create Account</h2>
        {error && <div className="error-message" style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}
        <form onSubmit={handleSubmit} className="auth-form" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="text-sm text-secondary mb-2 block">First Name</label>
              <input
                type="text"
                className="input-field w-full"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="text-sm text-secondary mb-2 block">Last Name</label>
              <input
                type="text"
                className="input-field w-full"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="form-group">
            <label className="text-sm text-secondary mb-2 block">Email</label>
            <input
              type="email"
              className="input-field w-full"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label className="text-sm text-secondary mb-2 block">Username</label>
            <input
              type="text"
              className="input-field w-full"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label className="text-sm text-secondary mb-2 block">Password</label>
            <input
              type="password"
              className="input-field w-full"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label className="text-sm text-secondary mb-2 block">Role</label>
            <select
              className="input-field w-full"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="contributor">Contributor</option>
              <option value="verifier">Verifier</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <button type="submit" className="btn btn-primary w-full mt-4">
            Sign Up
          </button>
        </form>
        <div className="mt-4 text-center text-sm text-secondary">
          Already have an account? <Link to="/login" className="text-primary hover:underline">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
