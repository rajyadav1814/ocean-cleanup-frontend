import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import { useAuth } from '../context/AuthContext';
import SubmitActivity from '../apps/contributor/pages/SubmitActivity';
import MyActivities from '../apps/contributor/pages/MyActivities';
import MyImpact from '../apps/contributor/pages/MyImpact';
import ApprovedActivities from '../apps/contributor/pages/ApprovedActivities';
import RejectedActivities from '../apps/contributor/pages/RejectedActivities';
import ContributorOverview from '../apps/contributor/pages/ContributorOverview';
import PendingQueue from '../apps/verifier/pages/PendingQueue';
import ActivityReview from '../apps/verifier/pages/ActivityReview';
import RejectedActivity from '../apps/verifier/pages/RejectedActivity';
import MultisigStatus from '../apps/verifier/pages/MultisigStatus';
import ImpactMap from '../apps/public-dashboard/pages/ImpactMap';
import Login from '../apps/auth/pages/Login';
import Signup from '../apps/auth/pages/Signup';
import ForgotPassword from '../apps/auth/pages/ForgotPassword';
import CitizenOverview from '../apps/citizen/pages/CitizenOverview';
import LandingPage from '../app/page';
import ProfileSettings from '../apps/profile/pages/ProfileSettings';

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
  const location = useLocation();
  const isCitizenSpace = location.pathname.startsWith('/citizen');
  const isContributorSpace = location.pathname.startsWith('/contributor');

  return (
    <div className={`app-shell${isCitizenSpace ? ' citizen-space-shell' : ''}${isContributorSpace ? ' contributor-space-shell' : ''}`}>
      <Header toggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)} />
      <main className="main-layout">
        <Sidebar isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen} />
        <div className="main-content">
          {children}
        </div>
      </main>
    </div>
  );
}

function PublicLayout({ children }) {
  return (
    <div className="app-shell force-dark" style={{ background: 'var(--bg-gradient)', color: 'var(--text-main)', minHeight: '100vh' }}>
      <Header toggleMobileMenu={() => { }} hideActions={true} />
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 0 }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--surface)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', padding: '2rem' }}>
          {children}
        </div>
      </main>
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
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

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

        <Route path="/map" element={
          <PublicLayout>
            <ImpactMap />
          </PublicLayout>
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
        <Route path="/citizen/submit" element={
          <ProtectedRoute allowedRoles={['citizen']}>
            <MainLayout>
              <SubmitActivity />
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
        <Route path="/contributor/submit" element={
          <ProtectedRoute allowedRoles={['contributor']}>
            <MainLayout>
              <SubmitActivity />
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
      </Routes>
    </>
  );
}
