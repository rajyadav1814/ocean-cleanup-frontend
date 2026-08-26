import { createContext, useContext, useMemo, useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { TOKEN_KEY, USER_KEY, authVerify, authLogout } from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { invalidateActivities } from '../store/activitiesSlice';
import { invalidateDashboard } from '../store/dashboardSlice';
import { invalidateContributorStats } from '../store/contributorSlice';
import { invalidateCitizenStats } from '../store/citizenSlice';
import { invalidateEvents } from '../store/eventsSlice';

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
  const dispatch = useDispatch();
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  // These slices cache per-session, keyed only by fetch status — not by user.
  // Without clearing them, switching accounts in the same tab (logout, then
  // login as someone else) leaves the new session reading the previous
  // user's cached stats/activities until a hard refresh.
  const resetCachedData = () => {
    dispatch(invalidateActivities());
    dispatch(invalidateDashboard());
    dispatch(invalidateContributorStats());
    dispatch(invalidateCitizenStats());
    dispatch(invalidateEvents());
  };

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem(TOKEN_KEY);
      if (token) {
        try {
          const data = await authVerify(token);
          if (data.ok && data.user && data.user.role !== 'admin') {
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

  // Admin accounts belong to the separate admin app — this app must never
  // grant them a session, even if credentials are valid.
  const login = (userData, token) => {
    if (userData?.role === 'admin') return false;

    const normalizedUser = normalizeUser(userData);
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(normalizedUser));
    setUser(normalizedUser);
    setRole(normalizedUser.role);
    resetCachedData();
    return true;
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
    resetCachedData();
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
