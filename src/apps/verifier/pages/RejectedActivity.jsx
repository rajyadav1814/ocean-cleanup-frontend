import { useEffect, useState } from 'react';
import { useActivities } from '../../../hooks/useActivities';
import LoadingSpinner from '../../../components/common/LoadingSpinner';

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

function ImagePreviewModal({ src, alt, onClose }) {
  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [onClose]);

  return (
    <div
      role="presentation"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1100,
        background: 'rgba(2, 6, 23, 0.82)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Image preview"
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative',
          width: 'min(96vw, 1100px)',
          maxHeight: '92vh',
          borderRadius: '1rem',
          overflow: 'hidden',
          border: '1px solid rgba(255,255,255,0.12)',
          boxShadow: '0 30px 80px rgba(0,0,0,0.55), 0 0 0 1px rgba(14,165,233,0.15)'
        }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close image preview"
          style={{
            position: 'absolute',
            top: '0.75rem',
            right: '0.75rem',
            zIndex: 1,
            width: '2.25rem',
            height: '2.25rem',
            borderRadius: '999px',
            background: 'rgba(15, 23, 42, 0.75)',
            color: 'white',
            border: '1px solid rgba(255,255,255,0.12)',
            display: 'grid',
            placeItems: 'center',
            padding: 0
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <img
          src={src}
          alt={alt}
          style={{
            display: 'block',
            width: '100%',
            maxHeight: '92vh',
            objectFit: 'contain',
            background: '#020617'
          }}
        />
      </div>
    </div>
  );
}

export default function RejectedActivity() {
  const { activities, loading } = useActivities();
  const [previewImage, setPreviewImage] = useState(null);
  const reviewedActivities = activities.filter((activity) => activity.status === 'rejected');
  const rejectedCount = reviewedActivities.length;

  if (loading) return <LoadingSpinner />;

  return (
    <>
      {previewImage && (
        <ImagePreviewModal
          src={previewImage.src}
          alt={previewImage.alt}
          onClose={() => setPreviewImage(null)}
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
                  {(activity.imageGatewayUrl || activity.imageUrl) ? (
                    <img
                      src={activity.imageGatewayUrl || activity.imageUrl}
                      alt="Cleanup evidence"
                      onClick={() => setPreviewImage({
                        src: activity.imageGatewayUrl || activity.imageUrl,
                        alt: 'Cleanup evidence for ' + (activity.location || 'this activity')
                      })}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setPreviewImage({
                            src: activity.imageGatewayUrl || activity.imageUrl,
                            alt: 'Cleanup evidence for ' + (activity.location || 'this activity')
                          });
                        }
                      }}
                      role="button"
                      tabIndex={0}
                      title="Click to zoom"
                      style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'zoom-in' }}
                    />
                  ) : (
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                      <circle cx="8.5" cy="8.5" r="1.5"></circle>
                      <polyline points="21 15 16 10 5 21"></polyline>
                    </svg>
                  )}

                  {activity.imageCid && (
                    <a
                      href={activity.imageGatewayUrl}
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
