import { useMemo, useState } from 'react';
import { useActivities } from '../../../hooks/useActivities';
import { useEventSignals } from '../../../hooks/useEventSignals';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import ImageGalleryModal from '../../../components/common/ImageGalleryModal';
import ActivityReviewCard from '../../../components/common/ActivityReviewCard';
import EmptyState from '../../../components/common/EmptyState';

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
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
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
  const pendingActivities = activities.filter((activity) => activity.status === 'pending');

  // spec §20: not every pending report needs the same scrutiny — a report
  // several independent contributors already corroborated is a faster,
  // higher-confidence review than a lone submission, so it's worth
  // surfacing first. sanityFlags (no evidence / no location / unclassified)
  // stay visible on every card regardless of position — they're a "look
  // closer at this one" signal, not a demotion.
  const { signalsByEventId } = useEventSignals(pendingActivities.map((a) => a.environmentalEventId));
  const sortedPendingActivities = useMemo(() => {
    return [...pendingActivities].sort((a, b) => {
      const corrA = signalsByEventId[a.environmentalEventId]?.corroborationCount || 0;
      const corrB = signalsByEventId[b.environmentalEventId]?.corroborationCount || 0;
      if (corrA !== corrB) return corrB - corrA;
      return new Date(b.timestamp) - new Date(a.timestamp);
    });
  }, [pendingActivities, signalsByEventId]);

  // Per-card action state: { [activityId]: 'approving' | 'rejecting' | null }
  const [actionState, setActionState] = useState({});
  // Which activity id has the reject modal open
  const [rejectModal, setRejectModal] = useState(null);
  // Gallery modal: { images: string[], startAt: number } | null
  const [gallery, setGallery] = useState(null);

  if (loading) return <LoadingSpinner layout="list" />;

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
            <h3 style={{ marginBottom: '0.25rem' }}>Review Queue</h3>
            <p className="text-muted" style={{ margin: 0 }}>Review and verify submitted cleanup activities.</p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.8rem', flexWrap: 'wrap' }}>
            <span style={{ background: 'rgba(217,119,6,0.15)', color: '#d97706', padding: '0.2rem 0.6rem', borderRadius: '0.5rem', fontWeight: 600 }}>
              {pendingActivities.length} Pending
            </span>
          </div>
        </div>

        {pendingActivities.length === 0 ? (
          <EmptyState message="No pending activities to review." />
        ) : (
          <div className="content-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
            {sortedPendingActivities.map((activity) => {
              const busy = actionState[activity.id];

              return (
                <ActivityReviewCard
                  key={activity.id}
                  activity={activity}
                  onImageClick={setGallery}
                  showActions
                  busy={busy}
                  onApprove={() => handleApprove(activity.id)}
                  onReject={() => openRejectModal(activity.id)}
                  signal={signalsByEventId[activity.environmentalEventId]}
                />
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}
