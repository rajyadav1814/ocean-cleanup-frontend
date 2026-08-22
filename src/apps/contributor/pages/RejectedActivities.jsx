import { useState } from 'react';
import { useActivities } from '../../../hooks/useActivities';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import ImageGalleryModal from '../../../components/common/ImageGalleryModal';
import ActivityListCard from '../../../components/common/ActivityListCard';
import EmptyState from '../../../components/common/EmptyState';

export default function RejectedActivities() {
  const { activities, loading } = useActivities();
  const [gallery, setGallery] = useState(null);
  const rejectedActivities = activities.filter((activity) => activity.status === 'rejected');

  if (loading) return <LoadingSpinner layout="list" />;

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
        <h3 style={{ marginBottom: '0.25rem' }}>Rejected Activities</h3>
        <p className="text-muted" style={{ margin: 0 }}>Cleanup activities that were reviewed and rejected by a verifier.</p>
      </div>

      {rejectedActivities.length === 0 ? (
        <EmptyState message="No rejected activities yet. If a verifier rejects an activity, it will show up here." />
      ) : (
        <div className="content-grid">
          {rejectedActivities.map((activity) => (
            <ActivityListCard key={activity.id} activity={activity} onImageClick={setGallery} />
          ))}
        </div>
      )}
    </section>
    </>
  );
}
