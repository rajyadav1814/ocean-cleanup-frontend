import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useActivities } from '../../../hooks/useActivities';
import { useAuth } from '../../../context/AuthContext';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import { apiDelete } from '../../../services/api';
import ImageGalleryModal from '../../../components/common/ImageGalleryModal';

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

export default function MyActivities() {
  const { activities, loading, refresh } = useActivities();
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState('');
  const [gallery, setGallery] = useState(null);

  const visibleActivities = activities.filter((activity) => activity.contributorId === user?.id);
  const canModify = (activity) => role === 'contributor' && activity.contributorId === user?.id && activity.status !== 'approved';

  if (loading) return <LoadingSpinner layout="list" />;

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
    <>
      {gallery && (
        <ImageGalleryModal
          images={gallery.images}
          startAt={gallery.startAt}
          alt="Cleanup evidence"
          onClose={() => setGallery(null)}
        />
      )}
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

        {visibleActivities.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
            <p className="text-muted">No activities submitted yet. Start cleaning!</p>
          </div>
        ) : (
          <div className="content-grid">
            {visibleActivities.map((activity) => {
              const isDeleting = deletingId === activity.id;

              return (
                <div key={activity.id} className="card" style={{ padding: 0, overflow: 'hidden', position: 'relative', opacity: isDeleting ? 0.75 : 1 }}>
                  <div style={{ background: 'var(--surface-hover)', height: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', overflow: 'hidden', position: 'relative' }}>
                    {(() => {
                      const urls = Array.isArray(activity.imageGatewayUrl)
                        ? activity.imageGatewayUrl
                        : activity.imageGatewayUrl
                          ? [activity.imageGatewayUrl]
                          : [];
                      const firstUrl = urls[0];
                      return firstUrl ? (
                        <>
                          <img
                            src={firstUrl}
                            alt="Cleanup evidence"
                            onClick={() => setGallery({ images: urls, startAt: 0 })}
                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setGallery({ images: urls, startAt: 0 }); } }}
                            role="button"
                            tabIndex={0}
                            title="Click to view photos"
                            style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'zoom-in' }}
                          />
                          {urls.length > 1 && (
                            <span style={{
                              position: 'absolute', top: '0.4rem', right: '0.4rem',
                              background: 'rgba(0,0,0,0.65)', color: 'white',
                              fontSize: '0.7rem', padding: '0.15rem 0.45rem',
                              borderRadius: '999px', fontWeight: 600, backdropFilter: 'blur(4px)'
                            }}>+{urls.length - 1} more</span>
                          )}
                        </>
                      ) : (
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                          <circle cx="8.5" cy="8.5" r="1.5"></circle>
                          <polyline points="21 15 16 10 5 21"></polyline>
                        </svg>
                      );
                    })()}
                  </div>

                  <div style={{ padding: '1.25rem' }}>
                    <div className="flex-between mb-4" style={{ gap: '0.75rem' }}>
                      <span className={`badge ${activity.status || 'pending'}`} style={{ textTransform: 'capitalize' }}>
                        {activity.status || 'Pending'}
                      </span>
                      <span className="text-muted" style={{ fontSize: '0.85rem' }}>{formatActivityDate(activity.timestamp || Date.now())}</span>
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
                    </div>

                    <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                      {canModify(activity) && (
                        <button
                          type="button"
                          onClick={() => navigate(`/contributor/my-activities/edit/${activity.id}`)}
                          className="secondary"
                          style={{ minWidth: '110px' }}
                        >
                          Edit
                        </button>
                      )}
                      {canModify(activity) && (
                        <button
                          type="button"
                          onClick={() => handleDelete(activity.id)}
                          disabled={isDeleting}
                          className="danger"
                          style={{ minWidth: '110px' }}
                        >
                          {isDeleting ? 'Deleting…' : 'Delete'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}
