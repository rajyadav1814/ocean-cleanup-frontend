import { Navigate, Outlet, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
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
import Overview from '../apps/public-dashboard/pages/Overview';
import ImpactMap from '../apps/public-dashboard/pages/ImpactMap';
import AllActivities from '../apps/public-dashboard/pages/AllActivities';
import VerifierList from '../apps/public-dashboard/pages/VerifierList';
import ContributorsList from '../apps/public-dashboard/pages/ContributorsList';
import Organizations from '../apps/public-dashboard/pages/Organizations';
import Login from '../apps/auth/pages/Login';
import Signup from '../apps/auth/pages/Signup';
import CitizenOverview from '../apps/citizen/pages/CitizenOverview';

function ProtectedRoute({ children, allowedRoles }) {
  const { user, role } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (allowedRoles && !allowedRoles.includes(role)) {
    if (role === 'verifier') return <Navigate to="/verifier/pending" replace />;
    if (role === 'admin') return <Navigate to="/dashboard/overview" replace />;
    if (role === 'citizen') return <Navigate to="/citizen/overview" replace />;
    return <Navigate to="/contributor/overview" replace />;
  }

  return children;
}

function MainLayout({ children }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  return (
    <div className="app-shell">
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

function FlashMessageToast() {
  const location = useLocation();
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);
  const message = location.state?.flashMessage;

  useEffect(() => {
    if (!message) {
      setVisible(false);
      return undefined;
    }

    setVisible(true);
    const timer = window.setTimeout(() => {
      setVisible(false);
      navigate(location.pathname, { replace: true, state: null });
    }, 2200);

    return () => window.clearTimeout(timer);
  }, [message, location.pathname, navigate]);

  if (!message || !visible) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '1rem',
      right: '1rem',
      zIndex: 2000,
      maxWidth: 'min(92vw, 360px)',
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
    if (role === 'admin') return <Navigate to="/dashboard/overview" replace />;
    if (role === 'citizen') return <Navigate to="/citizen/overview" replace />;
    return <Navigate to="/contributor/overview" replace />;
  }

  return (
    <>
      <FlashMessageToast />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        
        <Route path="/" element={
          <ProtectedRoute>
            <MainLayout>
              <Navigate to={
                role === 'verifier' ? '/verifier/pending'
                : role === 'admin' ? '/dashboard/overview'
                : role === 'citizen' ? '/citizen/overview'
                : '/contributor/overview'
              } replace />
            </MainLayout>
          </ProtectedRoute>
        } />

        <Route path="/contributor/overview" element={
          <ProtectedRoute allowedRoles={['contributor', 'admin']}>
            <MainLayout>
              <ContributorOverview />
            </MainLayout>
          </ProtectedRoute>
        } />

        {/* ── Citizen routes ── */}
        <Route path="/citizen/overview" element={
          <ProtectedRoute allowedRoles={['citizen', 'admin']}>
            <MainLayout>
              <CitizenOverview />
            </MainLayout>
          </ProtectedRoute>
        } />
        <Route path="/citizen/submit" element={
          <ProtectedRoute allowedRoles={['citizen', 'admin']}>
            <MainLayout>
              <SubmitActivity />
            </MainLayout>
          </ProtectedRoute>
        } />
        <Route path="/contributor/submit" element={
          <ProtectedRoute allowedRoles={['contributor', 'admin']}>
            <MainLayout>
              <SubmitActivity />
            </MainLayout>
          </ProtectedRoute>
        } />
        <Route path="/contributor/my-activities" element={
          <ProtectedRoute allowedRoles={['contributor', 'admin']}>
            <MainLayout>
              <MyActivities />
            </MainLayout>
          </ProtectedRoute>
        } />
        <Route path="/contributor/my-activities/edit/:id" element={
          <ProtectedRoute allowedRoles={['contributor', 'admin']}>
            <MainLayout>
              <SubmitActivity />
            </MainLayout>
          </ProtectedRoute>
        } />

        <Route path="/contributor/my-impact" element={
          <ProtectedRoute allowedRoles={['contributor', 'admin']}>
            <MainLayout>
              <MyImpact />
            </MainLayout>
          </ProtectedRoute>
        } />

        <Route path="/verifier/pending" element={
          <ProtectedRoute allowedRoles={['verifier', 'admin']}>
            <MainLayout>
              <PendingQueue />
            </MainLayout>
          </ProtectedRoute>
        } />
        <Route path="/verifier/review" element={
          <ProtectedRoute allowedRoles={['verifier', 'admin']}>
            <MainLayout>
              <ActivityReview />
            </MainLayout>
          </ProtectedRoute>
        } />
        <Route path="/verifier/rejected" element={
          <ProtectedRoute allowedRoles={['verifier', 'admin']}>
            <MainLayout>
              <RejectedActivity />
            </MainLayout>
          </ProtectedRoute>
        } />
        <Route path="/verifier/multisig" element={
          <ProtectedRoute allowedRoles={['verifier', 'admin']}>
            <MainLayout>
              <MultisigStatus />
            </MainLayout>
          </ProtectedRoute>
        } />

        <Route path="/dashboard/overview" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <MainLayout>
              <Overview />
            </MainLayout>
          </ProtectedRoute>
        } />
        <Route path="/dashboard/activities" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <MainLayout>
              <AllActivities />
            </MainLayout>
          </ProtectedRoute>
        } />
        <Route path="/dashboard/map" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <MainLayout>
              <ImpactMap />
            </MainLayout>
          </ProtectedRoute>
        } />
        <Route path="/dashboard/verifiers" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <MainLayout>
              <VerifierList />
            </MainLayout>
          </ProtectedRoute>
        } />
        <Route path="/dashboard/contributors" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <MainLayout>
              <ContributorsList />
            </MainLayout>
          </ProtectedRoute>
        } />
        <Route path="/dashboard/organizations" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <MainLayout>
              <Organizations />
            </MainLayout>
          </ProtectedRoute>
        } />
      </Routes>
    </>
  );
}
