import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { lazy, Suspense, useEffect, useState } from 'react';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Header from '../components/layout/Header';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import Chatbot from '../components/common/Chatbot';

// The pages a signed-out visitor lands on are part of the main bundle, so
// opening or reloading them never waits on a chunk (and never flashes the
// in-app loading skeleton).
import Login from '../apps/auth/pages/Login';
import Signup from '../apps/auth/pages/Signup';
import ForgotPassword from '../apps/auth/pages/ForgotPassword';
import LandingPage from '../app/page';

// Every in-app page loads as its own chunk the first time it is visited, so
// the initial download is the app shell rather than every screen at once.
const SubmitActivity = lazy(() => import('../apps/contributor/pages/SubmitActivity'));
const QuickReport = lazy(() => import('../apps/contributor/pages/QuickReport'));
const EventDetail = lazy(() => import('../apps/contributor/pages/EventDetail'));
const MyActivities = lazy(() => import('../apps/contributor/pages/MyActivities'));
const MyImpact = lazy(() => import('../apps/contributor/pages/MyImpact'));
const ContributorOverview = lazy(() => import('../apps/contributor/pages/ContributorOverview'));
const PendingQueue = lazy(() => import('../apps/verifier/pages/PendingQueue'));
const ActivityReview = lazy(() => import('../apps/verifier/pages/ActivityReview'));
const RejectedActivity = lazy(() => import('../apps/verifier/pages/RejectedActivity'));
const MultisigStatus = lazy(() => import('../apps/verifier/pages/MultisigStatus'));
const CitizenOverview = lazy(() => import('../apps/citizen/pages/CitizenOverview'));
const ProfileSettings = lazy(() => import('../apps/profile/pages/ProfileSettings'));
const NotFound = lazy(() => import('../components/common/NotFound'));

function ProtectedRoute({ children, allowedRoles }) {
  const { user, role } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    if (role === 'verifier') return <Navigate to="/verifier/pending" replace />;
    if (role === 'citizen') return <Navigate to="/citizen/overview" replace />;
    return <Navigate to="/contributor/overview" replace />;
  }

  return children;
}

function MainLayout({ children }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { theme } = useTheme();
  const location = useLocation();
  const isCitizenSpace = location.pathname.startsWith('/citizen');
  const isContributorSpace = location.pathname.startsWith('/contributor');
  const isVerifierSpace = location.pathname.startsWith('/verifier');

  return (
    <div className={`app-shell${isCitizenSpace ? ' citizen-space-shell' : ''}${isContributorSpace ? ' contributor-space-shell' : ''}${isVerifierSpace ? ' verifier-space-shell' : ''}`}>
      {/* Animated reef held behind the whole space so the page reads as one
          continuous body of water rather than a flat background. Fixed, so
          it stays put while the content scrolls over it. Its own palette
          follows the theme — a deep-water dive at night, sunlit shallows in
          the day — rather than reusing one dark image under a light wash,
          which read as a slab of midnight ocean under a white UI.
          Contributor and Citizen Space share the same Bluemind hero and
          card system, so both get the same living backdrop behind them. */}
      {/* {(isContributorSpace || isCitizenSpace) && (
        <div className="space-reef" aria-hidden="true"><ReefScene variant="ambient" theme={theme} /></div>
      )} */}
      <Header toggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)} />
      <main className="main-layout">
        <div className="main-content">
          {/* Header and nav stay on screen while the page's chunk loads. */}
          <Suspense fallback={<LoadingSpinner />}>{children}</Suspense>
        </div>
      </main>
      {(isCitizenSpace || isContributorSpace) && <Chatbot />}
    </div>
  );
}

function LandingLayout({ children }) {
  return (
    <div className="app-shell force-dark" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#05192E' }}>
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 0 }}>
        {children}
      </main>
    </div>
  );
}

function FlashMessageToast() {
  const location = useLocation();
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);
  const message = location.state?.flashMessage;
  const duration = location.state?.flashDuration || 2200;

  useEffect(() => {
    if (!message) {
      setVisible(false);
      return undefined;
    }

    setVisible(true);
    const timer = window.setTimeout(() => {
      setVisible(false);
      navigate(location.pathname, { replace: true, state: null });
    }, duration);

    return () => window.clearTimeout(timer);
  }, [message, duration, location.pathname, navigate]);

  if (!message || !visible) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '1rem',
      right: '1rem',
      zIndex: 2000,
      maxWidth: 'min(92vw, 400px)',
      padding: '0.9rem 1rem',
      borderRadius: 'var(--radius-md)',
      background: 'rgba(15, 118, 110, 0.92)',
      border: '1px solid rgba(45, 212, 191, 0.35)',
      color: 'white',
      boxShadow: '0 16px 40px rgba(0, 0, 0, 0.25)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      gap: '0.65rem',
      animation: 'toastIn 180ms ease-out'
    }} role="status" aria-live="polite">
      <div style={{
        width: '1.3rem',
        height: '1.3rem',
        borderRadius: '999px',
        background: 'rgba(255,255,255,0.16)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
      }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 6 9 17l-5-5" />
        </svg>
      </div>
      <span style={{ fontSize: '0.95rem', fontWeight: 600 }}>{message}</span>
    </div>
  );
}

export default function AppRouter() {
  const { user, role } = useAuth();
  const location = useLocation();

  if (user && (location.pathname === '/login' || location.pathname === '/signup')) {
    if (role === 'verifier') return <Navigate to="/verifier/pending" replace />;
    if (role === 'citizen') return <Navigate to="/citizen/overview" replace />;
    return <Navigate to="/contributor/overview" replace />;
  }

  return (
    <>
      <FlashMessageToast />
      {/* Only reached by pages outside the app layout (e.g. the signed-out
          404); a plain backdrop, not the dashboard skeleton. */}
      <Suspense fallback={<div style={{ minHeight: '100vh', background: '#05192E' }} />}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        {/* The public impact map page was removed; send old links home. */}
        <Route path="/map" element={<Navigate to="/" replace />} />

        <Route path="/" element={
          user ? (
            <ProtectedRoute>
              <MainLayout>
                <Navigate to={
                  role === 'verifier' ? '/verifier/pending'
                    : role === 'citizen' ? '/citizen/overview'
                      : '/contributor/overview'
                } replace />
              </MainLayout>
            </ProtectedRoute>
          ) : (
            <LandingLayout>
              <LandingPage />
            </LandingLayout>
          )
        } />

        <Route path="/contributor/overview" element={
          <ProtectedRoute allowedRoles={['contributor']}>
            <MainLayout>
              <ContributorOverview />
            </MainLayout>
          </ProtectedRoute>
        } />

        <Route path="/profile" element={
          <ProtectedRoute>
            <MainLayout>
              <ProfileSettings />
            </MainLayout>
          </ProtectedRoute>
        } />

        {/* ── Citizen routes ── */}
        <Route path="/citizen/overview" element={
          <ProtectedRoute allowedRoles={['citizen']}>
            <MainLayout>
              <CitizenOverview />
            </MainLayout>
          </ProtectedRoute>
        } />
        {/* Legacy fresh-submission route — retired per spec §1/§17 (no
            category picker before a new contribution). Only the edit route
            below still renders SubmitActivity, for correcting a record that
            already exists. */}
        <Route path="/citizen/submit" element={<Navigate to="/citizen/quick-report" replace />} />
        <Route path="/citizen/quick-report" element={
          <ProtectedRoute allowedRoles={['citizen']}>
            <MainLayout>
              <QuickReport />
            </MainLayout>
          </ProtectedRoute>
        } />
        <Route path="/citizen/events/:id" element={
          <ProtectedRoute allowedRoles={['citizen']}>
            <MainLayout>
              <EventDetail />
            </MainLayout>
          </ProtectedRoute>
        } />
        <Route path="/citizen/my-activities" element={
          <ProtectedRoute allowedRoles={['citizen']}>
            <MainLayout>
              <MyActivities />
            </MainLayout>
          </ProtectedRoute>
        } />
        <Route path="/citizen/my-activities/edit/:id" element={
          <ProtectedRoute allowedRoles={['citizen']}>
            <MainLayout>
              <SubmitActivity />
            </MainLayout>
          </ProtectedRoute>
        } />
        {/* Legacy fresh-submission route — retired per spec §1/§17 (no
            category picker before a new contribution). Only the edit route
            below still renders SubmitActivity, for correcting a record that
            already exists. */}
        <Route path="/contributor/submit" element={<Navigate to="/contributor/quick-report" replace />} />
        <Route path="/contributor/quick-report" element={
          <ProtectedRoute allowedRoles={['contributor']}>
            <MainLayout>
              <QuickReport />
            </MainLayout>
          </ProtectedRoute>
        } />
        <Route path="/contributor/events/:id" element={
          <ProtectedRoute allowedRoles={['contributor', 'verifier', 'admin']}>
            <MainLayout>
              <EventDetail />
            </MainLayout>
          </ProtectedRoute>
        } />
        <Route path="/contributor/my-activities" element={
          <ProtectedRoute allowedRoles={['contributor']}>
            <MainLayout>
              <MyActivities />
            </MainLayout>
          </ProtectedRoute>
        } />
        <Route path="/contributor/my-activities/edit/:id" element={
          <ProtectedRoute allowedRoles={['contributor']}>
            <MainLayout>
              <SubmitActivity />
            </MainLayout>
          </ProtectedRoute>
        } />

        <Route path="/contributor/my-impact" element={
          <ProtectedRoute allowedRoles={['contributor']}>
            <MainLayout>
              <MyImpact />
            </MainLayout>
          </ProtectedRoute>
        } />

        <Route path="/verifier/pending" element={
          <ProtectedRoute allowedRoles={['verifier']}>
            <MainLayout>
              <PendingQueue />
            </MainLayout>
          </ProtectedRoute>
        } />
        <Route path="/verifier/review" element={
          <ProtectedRoute allowedRoles={['verifier']}>
            <MainLayout>
              <ActivityReview />
            </MainLayout>
          </ProtectedRoute>
        } />
        <Route path="/verifier/rejected" element={
          <ProtectedRoute allowedRoles={['verifier']}>
            <MainLayout>
              <RejectedActivity />
            </MainLayout>
          </ProtectedRoute>
        } />
        <Route path="/verifier/multisig" element={
          <ProtectedRoute allowedRoles={['verifier']}>
            <MainLayout>
              <MultisigStatus />
            </MainLayout>
          </ProtectedRoute>
        } />

        {/* Bare space roots have no page of their own; "/" routes each
            role to its overview. */}
        <Route path="/citizen" element={<Navigate to="/" replace />} />
        <Route path="/contributor" element={<Navigate to="/" replace />} />
        <Route path="/verifier" element={<Navigate to="/" replace />} />

        {/* Anything else: a 404 page instead of a blank screen. Signed-in
            users keep the app header and nav around it. */}
        <Route path="*" element={
          user ? (
            <MainLayout>
              <NotFound />
            </MainLayout>
          ) : (
            <LandingLayout>
              <NotFound />
            </LandingLayout>
          )
        } />
      </Routes>
      </Suspense>
    </>
  );
}
