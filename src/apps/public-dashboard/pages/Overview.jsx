import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchDashboardStats } from '../../../store/dashboardSlice';
import AdminPageHeader from '../components/AdminPageHeader';

const STAT_ICONS = {
  activities: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" />
    </svg>
  ),
  weight: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="8" /><path d="M12 2v2M12 20v2M2 12h2M20 12h2" />
    </svg>
  ),
  credits: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
  verifier: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  contributor: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
    </svg>
  ),
  org: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  volunteers: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  ),
  check: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  clock: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  x: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  ),
};

function StatCard({ label, value, suffix = '', loading, accent, icon, onClick }) {
  return (
    <div
      className="card"
      onClick={onClick}
      style={onClick ? { cursor: 'pointer' } : {}}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (event) => { if (event.key === 'Enter' || event.key === ' ') { onClick(); } } : undefined}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div className="stat-label">{label}</div>
        {icon && (
          <div style={{
            width: '2.1rem', height: '2.1rem', borderRadius: '0.625rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'color-mix(in srgb, var(--primary) 14%, transparent)',
            color: 'var(--primary-hover)', flexShrink: 0
          }}>
            {icon}
          </div>
        )}
      </div>
      {loading ? (
        <div className="admin-skeleton-row" style={{ height: '2.5rem', marginTop: '0.5rem' }} />
      ) : (
        <div className="stat-value" style={accent ? {} : {
          background: 'none',
          WebkitTextFillColor: 'initial',
          color: 'var(--text-main)'
        }}>
          {typeof value === 'number' ? value.toLocaleString() : value}{suffix}
        </div>
      )}
    </div>
  );
}



export default function Overview() {
  const dispatch = useDispatch();
  const { stats, status, error } = useSelector((state) => state.dashboard);

  const loading = status === 'idle' || status === 'loading';

  // Only fetches once — cached in Redux; no re-fetch on tab switch
  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchDashboardStats());
    }
  }, [dispatch, status]);

  const navigate = useNavigate();
  const s = stats || {};

  return (
    <section>
      <AdminPageHeader
        title="Platform overview"
        subtitle="Real-time tracking of BlueMind cleanup activity worldwide."
      >
        {error && <span className="admin-chip" style={{ color: 'var(--danger)', background: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.25)' }}>{error}</span>}
      </AdminPageHeader>

      {/* Top stat cards */}
      <div className="content-grid mb-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginTop: '1.5rem' }}>
        <StatCard
          label="Total Activities"
          value={s.totalActivities}
          loading={loading}
          accent
          icon={STAT_ICONS.activities}
          onClick={() => navigate('/dashboard/activities')}
        />
        <StatCard label="Total Kg Collected" value={s.totalKgCollected} suffix=" kg" loading={loading} accent icon={STAT_ICONS.weight} />
        <StatCard label="Impact Credits Issued" value={s.impactCredits} loading={loading} accent icon={STAT_ICONS.credits} />
        <StatCard
          label="Total Verifiers"
          value={s.verifierCount}
          loading={loading}
          accent
          icon={STAT_ICONS.verifier}
          onClick={() => navigate('/dashboard/verifiers')}
        />
        <StatCard
          label="Total Contributors"
          value={s.contributorCount}
          loading={loading}
          accent
          icon={STAT_ICONS.contributor}
          onClick={() => navigate('/dashboard/contributors')}
        />
        <StatCard
          label="Total Organizations"
          value={s.partnerOrgs}
          loading={loading}
          accent
          icon={STAT_ICONS.org}
          onClick={() => navigate('/dashboard/organizations')}
        />
      </div>

      {/* Community Impact section */}
      <div className="mb-4 mt-6">
        <h3>Community Impact</h3>
        <p className="text-muted">Current campaign and community engagement metrics.</p>
      </div>
      <div className="content-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        <StatCard label="Total Volunteers" value={s.totalVolunteers} loading={loading} icon={STAT_ICONS.volunteers} />
        <StatCard label="Verified Activities" value={s.approvedActivities} loading={loading} icon={STAT_ICONS.check} />
        <StatCard label="Pending Activities" value={s.pendingActivities} loading={loading} icon={STAT_ICONS.clock} />
        <StatCard label="Rejected Activity" value={s.rejectedActivities} loading={loading} icon={STAT_ICONS.x} />
      </div>
    </section>
  );
}
