import { useActivities } from '../../../hooks/useActivities';
import LoadingSpinner from '../../../components/common/LoadingSpinner';

function formatActivityDate(timestamp) {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return '—';

  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const period = hours >= 12 ? 'PM' : 'AM';

  hours = hours % 12 || 12;
  const paddedMinutes = minutes.toString().padStart(2, '0');

  return `${day}-${month}-${year}, ${hours}:${paddedMinutes} ${period}`;
}

export default function ApprovedActivities() {
  const { activities, loading } = useActivities();
  const approvedActivities = activities.filter((activity) => activity.status === 'approved');

  if (loading) return <LoadingSpinner />;

  return (
    <section>
      <div className="card mb-6" style={{ padding: '1.25rem 1.75rem' }}>
        <h3 style={{ marginBottom: '0.25rem' }}>Approved Activities</h3>
        <p className="text-muted" style={{ margin: 0 }}>Verified cleanup activities that have been approved by a verifier.</p>
      </div>

      {approvedActivities.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p className="text-muted">No approved activities yet. Once a verifier approves your work, it will appear here.</p>
        </div>
      ) : (
        <div className="content-grid">
          {approvedActivities.map((activity) => (
            <div key={activity.id} className="card" style={{ padding: 0, overflow: 'hidden', position: 'relative' }}>
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
                <div className="flex-between mb-4" style={{ gap: '0.75rem' }}>
                  <span className="badge approved">Approved</span>
                  <span className="text-muted" style={{ fontSize: '0.85rem' }}>{formatActivityDate(activity.reviewedAt || activity.timestamp || Date.now())}</span>
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
