import { createContext, useContext, useMemo, useState, useEffect } from 'react';
import { TOKEN_KEY, USER_KEY, authVerify, authLogout } from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';

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

  const logout = async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      try {
        await authLogout(token);
      } catch (err) {
        console.error('Logout request failed', err);
      }
    }

    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
    setRole(null);
  };

  const updateUser = (newUserData) => {
    const normalizedUser = normalizeUser(newUserData);
    localStorage.setItem(USER_KEY, JSON.stringify(normalizedUser));
    setUser(normalizedUser);
  };

  const value = useMemo(() => ({ user, role, login, logout, updateUser, loading }), [user, role, loading]);

  if (loading) {
    return (
      <div style={{ height: '100vh', background: 'var(--bg)', paddingTop: '10vh' }}>
        <LoadingSpinner fullscreen={true} />
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
