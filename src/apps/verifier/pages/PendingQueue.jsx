import { useState } from 'react';
import { useActivities } from '../../../hooks/useActivities';
import LoadingSpinner from '../../../components/common/LoadingSpinner';

// Status badge component
function StatusBadge({ status }) {
  const cfg = {
    pending:  { bg: 'rgba(217,119,6,0.15)',   color: '#d97706', label: 'Pending' },
    approved: { bg: 'rgba(16,185,129,0.15)',  color: '#10b981', label: 'Approved' },
    rejected: { bg: 'rgba(239,68,68,0.15)',   color: '#ef4444', label: 'Rejected' }
  }[status] || { bg: 'rgba(148,163,184,0.15)', color: '#94a3b8', label: status };

  return (
    <span style={{
      background: cfg.bg, color: cfg.color,
      padding: '0.25rem 0.75rem', borderRadius: '1rem',
      fontSize: '0.75rem', fontWeight: 600
    }}>{cfg.label}</span>
  );
}

// Reject-note modal
function RejectModal({ onConfirm, onCancel, loading }) {
  const [note, setNote] = useState('');
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
    }}>
      <div className="card" style={{ width: '100%', maxWidth: '420px', padding: '2rem' }}
        onClick={e => e.stopPropagation()}>
        <h4 style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          Reject Activity
        </h4>
        <p className="text-muted" style={{ fontSize: '0.875rem', marginBottom: '1.25rem' }}>
          Optionally provide a reason for rejection.
        </p>
        <div className="form-group" style={{ marginBottom: '1.25rem' }}>
          <label>Rejection Reason (optional)</label>
          <textarea
            rows={3}
            placeholder="e.g. Insufficient evidence, photo unclear…"
            value={note}
            onChange={e => setNote(e.target.value)}
            style={{ width: '100%', resize: 'vertical' }}
          />
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={() => onConfirm(note)}
            disabled={loading}
            className="danger"
            style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
          >
            {loading && <div style={{ width: '13px', height: '13px', border: '2px solid rgba(255,255,255,0.4)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />}
            Confirm Reject
          </button>
          <button className="secondary" onClick={onCancel} disabled={loading} style={{ flex: 1 }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PendingQueue() {
  const { activities, loading, reviewActivity } = useActivities();

  // Per-card action state: { [activityId]: 'approving' | 'rejecting' | null }
  const [actionState, setActionState] = useState({});
  // Which activity id has the reject modal open
  const [rejectModal, setRejectModal] = useState(null);

  if (loading) return <LoadingSpinner />;

  async function handleApprove(id) {
    setActionState(s => ({ ...s, [id]: 'approving' }));
    try {
      await reviewActivity(id, 'approved');
    } finally {
      setActionState(s => ({ ...s, [id]: null }));
    }
  }

  function openRejectModal(id) {
    setRejectModal(id);
  }

  async function handleRejectConfirm(note) {
    const id = rejectModal;
    setActionState(s => ({ ...s, [id]: 'rejecting' }));
    try {
      await reviewActivity(id, 'rejected', note);
    } finally {
      setActionState(s => ({ ...s, [id]: null }));
      setRejectModal(null);
    }
  }

  return (
    <>
      {rejectModal && (
        <RejectModal
          onConfirm={handleRejectConfirm}
          onCancel={() => setRejectModal(null)}
          loading={actionState[rejectModal] === 'rejecting'}
        />
      )}

      <section>
        <div className="mb-6" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3>Review Queue</h3>
            <p className="text-muted">Review and verify submitted cleanup activities.</p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.8rem' }}>
            <span style={{ background: 'rgba(217,119,6,0.15)', color: '#d97706', padding: '0.2rem 0.6rem', borderRadius: '0.5rem', fontWeight: 600 }}>
              {activities.filter(a => a.status === 'pending').length} Pending
            </span>
            <span style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', padding: '0.2rem 0.6rem', borderRadius: '0.5rem', fontWeight: 600 }}>
              {activities.filter(a => a.status === 'approved').length} Approved
            </span>
            <span style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', padding: '0.2rem 0.6rem', borderRadius: '0.5rem', fontWeight: 600 }}>
              {activities.filter(a => a.status === 'rejected').length} Rejected
            </span>
          </div>
        </div>

        {activities.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
            <p className="text-muted">No activities to review.</p>
          </div>
        ) : (
          <div className="content-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
            {activities.map((activity) => {
              const busy = actionState[activity.id];
              const isResolved = activity.status === 'approved' || activity.status === 'rejected';

              return (
                <div key={activity.id} className="card" style={{ padding: 0, overflow: 'hidden', opacity: busy ? 0.8 : 1, transition: 'opacity 0.2s' }}>

                  {/* Evidence Image */}
                  <div style={{ background: 'var(--surface-hover)', height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', overflow: 'hidden', position: 'relative' }}>
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

                    {/* IPFS badge overlay */}
                    {activity.imageCid && (
                      <a
                        href={activity.imageGatewayUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          position: 'absolute', bottom: '0.5rem', right: '0.5rem',
                          background: 'rgba(0,0,0,0.6)', color: '#0ea5e9',
                          fontSize: '0.7rem', padding: '0.2rem 0.5rem',
                          borderRadius: '0.375rem', backdropFilter: 'blur(4px)',
                          textDecoration: 'none', fontWeight: 600
                        }}
                      >
                        IPFS ↗
                      </a>
                    )}
                  </div>

                  {/* Card body */}
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
                        <strong style={{ color: 'var(--text-main)' }}>{new Date(activity.timestamp).toLocaleDateString()}</strong>
                      </div>

                      {/* Show rejection reason if rejected */}
                      {activity.status === 'rejected' && activity.reviewNote && (
                        <div style={{
                          marginTop: '0.25rem', padding: '0.5rem 0.75rem',
                          background: 'rgba(239,68,68,0.1)', borderRadius: '0.5rem',
                          borderLeft: '3px solid #ef4444', fontSize: '0.8rem', color: '#f87171'
                        }}>
                          <strong>Reason: </strong>{activity.reviewNote}
                        </div>
                      )}

                      {/* Show approval time if approved */}
                      {activity.status === 'approved' && activity.reviewedAt && (
                        <div style={{
                          marginTop: '0.25rem', padding: '0.5rem 0.75rem',
                          background: 'rgba(16,185,129,0.1)', borderRadius: '0.5rem',
                          borderLeft: '3px solid #10b981', fontSize: '0.8rem', color: '#10b981'
                        }}>
                          Approved on {new Date(activity.reviewedAt).toLocaleString()}
                        </div>
                      )}
                    </div>

                    {/* Action Buttons — only show for pending */}
                    {!isResolved && (
                      <div className="mt-6" style={{ display: 'flex', gap: '0.75rem' }}>
                        <button
                          className="success"
                          disabled={!!busy}
                          onClick={() => handleApprove(activity.id)}
                          style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', padding: '0.65rem' }}
                        >
                          {busy === 'approving' ? (
                            <div style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.4)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                          ) : (
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12"/>
                            </svg>
                          )}
                          {busy === 'approving' ? 'Approving…' : 'Approve'}
                        </button>
                        <button
                          className="danger"
                          disabled={!!busy}
                          onClick={() => openRejectModal(activity.id)}
                          style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', padding: '0.65rem' }}
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                          </svg>
                          Reject
                        </button>
                      </div>
                    )}
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
