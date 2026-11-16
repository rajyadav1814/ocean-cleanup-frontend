import { createContext, useContext, useMemo, useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { TOKEN_KEY, USER_KEY, AUTH_EXPIRED_EVENT, authVerify, authLogout } from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { invalidateActivities } from '../store/activitiesSlice';
import { invalidateContributorStats } from '../store/contributorSlice';
import { invalidateCitizenStats } from '../store/citizenSlice';
import { invalidateEvents } from '../store/eventsSlice';
import { bluemindApi } from '../store/apiSlice';

const AuthContext = createContext(null);

// Read once by the login page to explain why the user was signed out.
export const SESSION_EXPIRED_KEY = 'ocean_session_expired';

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

// The user saved at the last login/verify, so a returning visitor can see
// the app immediately while the token is re-checked in the background.
function readStoredUser() {
  if (!localStorage.getItem(TOKEN_KEY)) return null;
  try {
    const stored = normalizeUser(JSON.parse(localStorage.getItem(USER_KEY)));
    return stored && stored.role && stored.role !== 'admin' ? stored : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const dispatch = useDispatch();
  const [user, setUser] = useState(readStoredUser);
  const [role, setRole] = useState(() => readStoredUser()?.role ?? null);
  // Only block rendering when there's a token but no saved user to show.
  const [loading, setLoading] = useState(() => Boolean(localStorage.getItem(TOKEN_KEY)) && !readStoredUser());

  // These slices cache per-session, keyed only by fetch status — not by user.
  // Without clearing them, switching accounts in the same tab (logout, then
  // login as someone else) leaves the new session reading the previous
  // user's cached stats/activities until a hard refresh.
  const resetCachedData = () => {
    dispatch(invalidateActivities());
    dispatch(invalidateContributorStats());
    dispatch(invalidateCitizenStats());
    dispatch(invalidateEvents());
    dispatch(bluemindApi.util.resetApiState());
  };

  // Re-check the token with the server. The saved user is already on screen,
  // so this runs alongside the page's own requests instead of before them;
  // the backend still checks the token on every request regardless.
  useEffect(() => {
    const clearSession = () => {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      setUser(null);
      setRole(null);
      resetCachedData();
    };

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
            // The server rejected the saved token: tell the login page why.
            if (readStoredUser()) sessionStorage.setItem(SESSION_EXPIRED_KEY, '1');
            clearSession();
          }
        } catch (err) {
          // Server unreachable, not a rejected token: keep a saved session
          // (its requests will fail on their own) rather than sign out.
          console.error('Auth verification failed', err);
          if (!readStoredUser()) clearSession();
        }
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  // Any API call rejected with 401 means the saved token is no longer
  // valid: sign out so ProtectedRoute sends the user back to login.
  useEffect(() => {
    const handleExpired = () => {
      if (!localStorage.getItem(TOKEN_KEY)) return;
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      sessionStorage.setItem(SESSION_EXPIRED_KEY, '1');
      setUser(null);
      setRole(null);
      resetCachedData();
    };
    window.addEventListener(AUTH_EXPIRED_EVENT, handleExpired);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, handleExpired);
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

  const logout = () => {
    const token = localStorage.getItem(TOKEN_KEY);

    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
    setRole(null);
    resetCachedData();

    if (token) {
      authLogout(token).catch((err) => {
        console.error('Logout request failed', err);
      });
    }
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
