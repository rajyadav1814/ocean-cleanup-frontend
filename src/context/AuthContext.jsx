import { createContext, useContext, useMemo, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const res = await fetch('http://localhost:3001/api/auth/verify', {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          const data = await res.json();
          if (data.ok && data.user) {
            setUser(data.user);
            setRole(data.user.role);
          } else {
            localStorage.removeItem('token');
          }
        } catch (err) {
          console.error('Auth verification failed', err);
          localStorage.removeItem('token');
        }
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  const login = (userData, token) => {
    localStorage.setItem('token', token);
    setUser(userData);
    setRole(userData.role);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setRole(null);
  };

  const value = useMemo(() => ({ user, role, login, logout, loading }), [user, role, loading]);

  if (loading) {
    return <div style={{ color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading...</div>;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
