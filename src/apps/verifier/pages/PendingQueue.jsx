import { useActivities } from '../../../hooks/useActivities';
import LoadingSpinner from '../../../components/common/LoadingSpinner';

export default function PendingQueue() {
  const { activities, loading } = useActivities();

  if (loading) return <LoadingSpinner />;

  return (
    <section>
      <div className="mb-6">
        <h3>Pending Queue</h3>
        <p className="text-muted">Review and verify submitted cleanup activities.</p>
      </div>

      {activities.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p className="text-muted">No pending activities to review.</p>
        </div>
      ) : (
        <div className="content-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
          {activities.map((activity) => (
            <div key={activity.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>

              {/* Image Display */}
              <div style={{ background: 'var(--surface-hover)', height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', overflow: 'hidden' }}>
                {(activity.imageGatewayUrl || activity.imageUrl) ? (
                  <img
                    src={activity.imageGatewayUrl || activity.imageUrl}
                    alt="Cleanup evidence"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <circle cx="8.5" cy="8.5" r="1.5"></circle>
                    <polyline points="21 15 16 10 5 21"></polyline>
                  </svg>
                )}
              </div>

              {/* Card Content */}
              <div style={{ padding: '1.5rem' }}>
                <div className="flex-between mb-4">
                  <h4 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.1rem' }}>{activity.location || 'Zuma Beach cleanup'}</h4>
                  <span style={{
                    background: 'rgba(217, 119, 6, 0.15)',
                    color: '#d97706',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '1rem',
                    fontSize: '0.75rem',
                    fontWeight: '600'
                  }}>Pending</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                  <div className="flex-between">
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18"></path><path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16"></path><path d="M9 21v-4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v4"></path><path d="M9 7h6"></path><path d="M9 11h6"></path></svg>
                      Organization
                    </span>
                    <strong style={{ color: 'var(--text-main)', fontWeight: '500' }}>{activity.organization || 'Ocean Guardians'}</strong>
                  </div>

                  <div className="flex-between">
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                      GPS
                    </span>
                    <strong style={{ color: 'var(--text-main)', fontWeight: '500' }}>{activity.gps || '34.0259, -118.8231'}</strong>
                  </div>

                  <div className="flex-between">
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                      Volunteers
                    </span>
                    <strong style={{ color: 'var(--text-main)', fontWeight: '500' }}>{activity.volunteers || '23'}</strong>
                  </div>

                  <div className="flex-between">
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 7h-4V5c0-1.1-.9-2-2-2h-4c-1.1 0-2 .9-2 2v2H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2z"></path><path d="M12 12v6"></path><path d="M9 15h6"></path></svg>
                      Waste
                    </span>
                    <strong style={{ color: 'var(--text-main)', fontWeight: '500' }}>{activity.quantity || '47'} kg</strong>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-6 flex-between gap-4">
                  <button className="success" style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    Approve
                  </button>
                  <button className="secondary" style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
