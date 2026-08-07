import { useState } from 'react';
import { useActivities } from '../../../hooks/useActivities';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import ImageGalleryModal from '../../../components/common/ImageGalleryModal';

function formatReviewDate(timestamp) {
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

function StatusBadge({ status }) {
  const cfg = {
    pending: { bg: 'rgba(217,119,6,0.15)', color: '#d97706', label: 'Pending' },
    approved: { bg: 'rgba(16,185,129,0.15)', color: '#10b981', label: 'Approved' },
    rejected: { bg: 'rgba(239,68,68,0.15)', color: '#ef4444', label: 'Rejected' }
  }[status] || { bg: 'rgba(148,163,184,0.15)', color: '#94a3b8', label: status };

  return (
    <span style={{
      background: cfg.bg,
      color: cfg.color,
      padding: '0.25rem 0.75rem',
      borderRadius: '1rem',
      fontSize: '0.75rem',
      fontWeight: 600
    }}>{cfg.label}</span>
  );
}


export default function RejectedActivity() {
  const { activities, loading } = useActivities();
  const [gallery, setGallery] = useState(null);
  const reviewedActivities = activities.filter((activity) => activity.status === 'rejected');
  const rejectedCount = reviewedActivities.length;

  if (loading) return <LoadingSpinner layout="form" />;

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
        <div className="card mb-6" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', padding: '1.25rem 1.75rem' }}>
          <div>
            <h3 style={{ marginBottom: '0.25rem' }}>Rejected Activity</h3>
            <p className="text-muted" style={{ margin: 0 }}>Rejected cleanup activities.</p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.8rem', flexWrap: 'wrap' }}>
            <span style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', padding: '0.2rem 0.6rem', borderRadius: '0.5rem', fontWeight: 600 }}>
              {rejectedCount} Rejected
            </span>
          </div>
        </div>

        {reviewedActivities.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
            <p className="text-muted">No rejected activities yet.</p>
          </div>
        ) : (
          <div className="content-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
            {reviewedActivities.map((activity) => (
              <div key={activity.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ background: 'var(--surface-hover)', height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', overflow: 'hidden', position: 'relative' }}>
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
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              setGallery({ images: urls, startAt: 0 });
                            }
                          }}
                          role="button"
                          tabIndex={0}
                          title="Click to view photos"
                          style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'zoom-in' }}
                        />
                        {urls.length > 1 && (
                          <span style={{
                            position: 'absolute', top: '0.4rem', left: '0.4rem',
                            background: 'rgba(0,0,0,0.65)', color: 'white',
                            fontSize: '0.7rem', padding: '0.15rem 0.45rem',
                            borderRadius: '999px', fontWeight: 600, backdropFilter: 'blur(4px)'
                          }}>{urls.length} photos</span>
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

                  {Array.isArray(activity.imageCid) && activity.imageCid.length > 0 && (
                    <a
                      href={activity.imageGatewayUrl[0]}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        position: 'absolute',
                        bottom: '0.5rem',
                        right: '0.5rem',
                        background: 'rgba(0,0,0,0.6)',
                        color: '#0ea5e9',
                        fontSize: '0.7rem',
                        padding: '0.2rem 0.5rem',
                        borderRadius: '0.375rem',
                        backdropFilter: 'blur(4px)',
                        textDecoration: 'none',
                        fontWeight: 600
                      }}
                    >
                      IPFS ↗
                    </a>
                  )}
                </div>

                <div style={{ padding: '1.5rem' }}>
                  <div className="flex-between mb-4">
                    <h4 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1rem', flex: 1, marginRight: '0.5rem' }}>
                      {activity.location || 'Unknown location'}
                    </h4>
                    <StatusBadge status={activity.status} />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                    <div className="flex-between">
                      <span>Category</span>
                      <strong style={{ color: 'var(--text-main)', textTransform: 'capitalize' }}>{activity.category}</strong>
                    </div>
                    <div className="flex-between">
                      <span>Waste collected</span>
                      <strong style={{ color: 'var(--text-main)' }}>{activity.quantity} kg</strong>
                    </div>
                    {activity.gps && (
                      <div className="flex-between">
                        <span>GPS</span>
                        <strong style={{ color: 'var(--text-main)', fontSize: '0.8rem' }}>{activity.gps}</strong>
                      </div>
                    )}
                    <div className="flex-between">
                      <span>Volunteers</span>
                      <strong style={{ color: 'var(--text-main)' }}>
                        {activity.volunteers != null && activity.volunteers !== 0 ? activity.volunteers : '—'}
                      </strong>
                    </div>
                    <div className="flex-between">
                      <span>Submitted</span>
                      <strong style={{ color: 'var(--text-main)' }}>{activity.timestamp ? formatReviewDate(activity.timestamp) : '—'}</strong>
                    </div>

                    {activity.status === 'rejected' && activity.reviewNote && (
                      <div style={{
                        marginTop: '0.25rem',
                        padding: '0.5rem 0.75rem',
                        background: 'rgba(239,68,68,0.1)',
                        borderRadius: '0.5rem',
                        borderLeft: '3px solid #ef4444',
                        fontSize: '0.8rem',
                        color: '#f87171'
                      }}>
                        <strong>Reason: </strong>{activity.reviewNote}
                      </div>
                    )}

                    {activity.status === 'approved' && activity.reviewedAt && (
                      <div style={{
                        marginTop: '0.25rem',
                        padding: '0.5rem 0.75rem',
                        background: 'rgba(16,185,129,0.1)',
                        borderRadius: '0.5rem',
                        borderLeft: '3px solid #10b981',
                        fontSize: '0.8rem',
                        color: '#10b981'
                      }}>
                        Approved on {formatReviewDate(activity.reviewedAt)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
