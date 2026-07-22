import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import { useAuth } from '../context/AuthContext';
import SubmitActivity from '../apps/contributor/pages/SubmitActivity';
import MyActivities from '../apps/contributor/pages/MyActivities';
import MyImpact from '../apps/contributor/pages/MyImpact';
import PendingQueue from '../apps/verifier/pages/PendingQueue';
import ActivityReview from '../apps/verifier/pages/ActivityReview';
import MultisigStatus from '../apps/verifier/pages/MultisigStatus';
import Overview from '../apps/public-dashboard/pages/Overview';
import OrgLeaderboard from '../apps/public-dashboard/pages/OrgLeaderboard';
import ImpactMap from '../apps/public-dashboard/pages/ImpactMap';
import Login from '../apps/auth/pages/Login';
import Signup from '../apps/auth/pages/Signup';

function ProtectedRoute({ children, allowedRoles }) {
  const { user, role } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (allowedRoles && !allowedRoles.includes(role)) {
    // If not allowed, send to their default route
    if (role === 'verifier') return <Navigate to="/verifier/pending" replace />;
    if (role === 'admin') return <Navigate to="/dashboard/overview" replace />;
    return <Navigate to="/contributor/submit" replace />;
  }

  return children;
}

function MainLayout({ children }) {
  return (
    <div className="app-shell">
      <Header />
      <main className="grid" style={{ gridTemplateColumns: '240px 1fr' }}>
        <Sidebar />
        {children}
      </main>
    </div>
  );
}

export default function AppRouter() {
  const { user, role } = useAuth();
  const location = useLocation();

  // If user is already logged in, they shouldn't see login/signup
  if (user && (location.pathname === '/login' || location.pathname === '/signup')) {
    if (role === 'verifier') return <Navigate to="/verifier/pending" replace />;
    if (role === 'admin') return <Navigate to="/dashboard/overview" replace />;
    return <Navigate to="/contributor/submit" replace />;
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      
      <Route path="/" element={
        <ProtectedRoute>
          <MainLayout>
            <Navigate to={role === 'verifier' ? '/verifier/pending' : role === 'admin' ? '/dashboard/overview' : '/contributor/submit'} replace />
          </MainLayout>
        </ProtectedRoute>
      } />

      {/* Contributor Routes */}
      <Route path="/contributor/*" element={
        <ProtectedRoute allowedRoles={['contributor', 'admin']}>
          <MainLayout>
            <Routes>
              <Route path="submit" element={<SubmitActivity />} />
              <Route path="my-activities" element={<MyActivities />} />
              <Route path="my-impact" element={<MyImpact />} />
            </Routes>
          </MainLayout>
        </ProtectedRoute>
      } />

      {/* Verifier Routes */}
      <Route path="/verifier/*" element={
        <ProtectedRoute allowedRoles={['verifier', 'admin']}>
          <MainLayout>
            <Routes>
              <Route path="pending" element={<PendingQueue />} />
              <Route path="review" element={<ActivityReview />} />
              <Route path="multisig" element={<MultisigStatus />} />
            </Routes>
          </MainLayout>
        </ProtectedRoute>
      } />

      {/* Dashboard Routes - Public/Admin */}
      <Route path="/dashboard/*" element={
        <ProtectedRoute allowedRoles={['admin', 'contributor', 'verifier']}>
          <MainLayout>
            <Routes>
              <Route path="overview" element={<Overview />} />
              <Route path="leaderboard" element={<OrgLeaderboard />} />
              <Route path="map" element={<ImpactMap />} />
            </Routes>
          </MainLayout>
        </ProtectedRoute>
      } />
    </Routes>
  );
}
