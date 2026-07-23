import { createContext, useContext, useMemo, useState, useEffect } from 'react';
import { TOKEN_KEY, USER_KEY, authVerify } from '../services/api';

const AuthContext = createContext(null);

function buildDisplayName(userData) {
  return userData?.displayName
    || [userData?.firstName, userData?.lastName].filter(Boolean).join(' ').trim()
    || userData?.username
    || userData?.role
    || 'User';
}

function normalizeUser(userData) {
  if (!userData) return null;

  const displayName = buildDisplayName(userData);
  const displayInitial = (userData.displayInitial || displayName || 'U').trim().charAt(0).toUpperCase();

  return {
    ...userData,
    displayName,
    displayInitial
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem(TOKEN_KEY);
      if (token) {
        try {
          const data = await authVerify(token);
          if (data.ok && data.user) {
            const normalizedUser = normalizeUser(data.user);
            setUser(normalizedUser);
            setRole(normalizedUser.role);
            localStorage.setItem(USER_KEY, JSON.stringify(normalizedUser));
          } else {
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(USER_KEY);
          }
        } catch (err) {
          console.error('Auth verification failed', err);
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(USER_KEY);
        }
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  const login = (userData, token) => {
    const normalizedUser = normalizeUser(userData);
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(normalizedUser));
    setUser(normalizedUser);
    setRole(normalizedUser.role);
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
    setRole(null);
  };

  const value = useMemo(() => ({ user, role, login, logout, loading }), [user, role, loading]);

  if (loading) {
    return (
      <div style={{
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        height: '100vh', background: 'var(--bg)', flexDirection: 'column', gap: '1rem'
      }}>
        <div style={{
          width: '36px', height: '36px', border: '3px solid var(--border-light)',
          borderTopColor: 'var(--primary)', borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }} />
        <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Restoring session…</span>
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
