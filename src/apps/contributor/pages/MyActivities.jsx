import { useActivities } from '../../../hooks/useActivities';
import LoadingSpinner from '../../../components/common/LoadingSpinner';

export default function MyActivities() {
  const { activities, loading } = useActivities();

  if (loading) return <LoadingSpinner />;

  return (
    <section>
      <div className="mb-6">
        <h3>My Activities</h3>
        <p className="text-muted">A record of your environmental impact contributions.</p>
      </div>
      {activities.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p className="text-muted">No activities submitted yet. Start cleaning!</p>
        </div>
      ) : (
        <div className="content-grid">
          {activities.map((activity) => (
            <div key={activity.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>

              {/* Evidence Image */}
              <div style={{ background: 'var(--surface-hover)', height: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', overflow: 'hidden' }}>
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

              <div style={{ padding: '1.25rem' }}>
                <div className="flex-between mb-4">
                  <span className="badge pending">Submitted</span>
                  <span className="text-muted" style={{ fontSize: '0.85rem' }}>{new Date(activity.timestamp || Date.now()).toLocaleDateString()}</span>
                </div>
                <h4 style={{ color: 'var(--primary-hover)' }}>{activity.location}</h4>
                <div className="mt-4" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div className="flex-between">
                    <span className="text-muted">Category:</span>
                    <strong style={{ textTransform: 'capitalize' }}>{activity.category}</strong>
                  </div>
                  <div className="flex-between">
                    <span className="text-muted">Quantity:</span>
                    <strong>{activity.quantity} kg</strong>
                  </div>
                  {activity.imageCid && (
                    <div className="flex-between" style={{ marginTop: '0.25rem' }}>
                      <span className="text-muted">IPFS:</span>
                      <a
                        href={activity.imageGatewayUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ fontSize: '0.75rem', color: 'var(--primary)', wordBreak: 'break-all', maxWidth: '60%', textAlign: 'right' }}
                      >
                        {activity.imageCid.slice(0, 12)}…
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>

          ))}
        </div>
      )}
    </section>
  );
}
