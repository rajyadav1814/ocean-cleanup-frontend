import { useState } from 'react';
import { useActivities } from '../../../hooks/useActivities';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import ImageGalleryModal from '../../../components/common/ImageGalleryModal';
import ActivityReviewCard from '../../../components/common/ActivityReviewCard';
import EmptyState from '../../../components/common/EmptyState';

/**
 * Shared verifier list page, parameterized by status. Collapses the
 * previously near-duplicate ActivityReview.jsx / RejectedActivity.jsx pages —
 * those files are now thin wrappers that pass status-specific copy in here.
 */
export default function ActivitiesByStatus({
  status,
  title,
  subtitle,
  emptyMessage,
  badgeLabel,
  badgeBg,
  badgeColor,
  showExtendedFields = true,
}) {
  const { activities, loading } = useActivities();
  const [gallery, setGallery] = useState(null);
  const filteredActivities = activities.filter((activity) => activity.status === status);
  const count = filteredActivities.length;

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
            <h3 style={{ marginBottom: '0.25rem' }}>{title}</h3>
            <p className="text-muted" style={{ margin: 0 }}>{subtitle}</p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.8rem', flexWrap: 'wrap' }}>
            <span style={{ background: badgeBg, color: badgeColor, padding: '0.2rem 0.6rem', borderRadius: '0.5rem', fontWeight: 600 }}>
              {count} {badgeLabel}
            </span>
          </div>
        </div>

        {filteredActivities.length === 0 ? (
          <EmptyState message={emptyMessage} />
        ) : (
          <div className="content-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
            {filteredActivities.map((activity) => (
              <ActivityReviewCard
                key={activity.id}
                activity={activity}
                onImageClick={setGallery}
                reviewMeta
                showExtendedFields={showExtendedFields}
              />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
