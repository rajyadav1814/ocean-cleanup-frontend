import { useState } from 'react';
import { useActivities } from '../../../hooks/useActivities';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import { apiDelete } from '../../../services/api';

export default function MyActivities() {
  const { activities, loading, refresh } = useActivities();
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState('');

  if (loading) return <LoadingSpinner />;

  async function handleDelete(activityId) {
    const confirmed = window.confirm('Delete this activity? This cannot be undone.');
    if (!confirmed) return;

    setDeletingId(activityId);
    setError('');

    try {
      const response = await apiDelete(`/api/activities/${activityId}`);
      if (!response.ok) {
        setError(response.error || response.message || 'Failed to delete activity');
        return;
      }

      await refresh();
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section>
      <div className="card mb-6" style={{ padding: '1.25rem 1.75rem' }}>
        <h3 style={{ marginBottom: '0.25rem' }}>My Activities</h3>
        <p className="text-muted" style={{ margin: 0 }}>A record of your environmental impact contributions.</p>
      </div>

      {error && (
        <div className="card mb-6" style={{ padding: '0.9rem 1.1rem', border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)', color: '#f87171' }}>
          {error}
        </div>
      )}

      {activities.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p className="text-muted">No activities submitted yet. Start cleaning!</p>
        </div>
      ) : (
        <div className="content-grid">
          {activities.map((activity) => {
            const isDeleting = deletingId === activity.id;

            return (
              <div key={activity.id} className="card" style={{ padding: 0, overflow: 'hidden', position: 'relative', opacity: isDeleting ? 0.75 : 1 }}>
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

                  <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      onClick={() => handleDelete(activity.id)}
                      disabled={isDeleting}
                      className="danger"
                      style={{ minWidth: '110px' }}
                    >
                      {isDeleting ? 'Deleting…' : 'Delete'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
