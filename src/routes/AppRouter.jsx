import { Navigate, Route, Routes } from 'react-router-dom';
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

export default function AppRouter() {
  const { role } = useAuth();

  return (
    <div className="app-shell">
      <Header />
      <main className="grid" style={{ gridTemplateColumns: '240px 1fr' }}>
        <Sidebar />
        <Routes>
          <Route path="/" element={<Navigate to={role === 'verifier' ? '/verifier/pending' : role === 'public' ? '/dashboard/overview' : '/contributor/submit'} replace />} />
          <Route path="/contributor/submit" element={<SubmitActivity />} />
          <Route path="/contributor/my-activities" element={<MyActivities />} />
          <Route path="/contributor/my-impact" element={<MyImpact />} />
          <Route path="/verifier/pending" element={<PendingQueue />} />
          <Route path="/verifier/review" element={<ActivityReview />} />
          <Route path="/verifier/multisig" element={<MultisigStatus />} />
          <Route path="/dashboard/overview" element={<Overview />} />
          <Route path="/dashboard/leaderboard" element={<OrgLeaderboard />} />
          <Route path="/dashboard/map" element={<ImpactMap />} />
        </Routes>
      </main>
    </div>
  );
}
