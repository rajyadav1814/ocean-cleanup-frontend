import { useState } from 'react';
import { useActivities } from '../../../hooks/useActivities';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import ImageGalleryModal from '../../../components/common/ImageGalleryModal';
import ActivityListCard from '../../../components/common/ActivityListCard';
import EmptyState from '../../../components/common/EmptyState';

export default function ApprovedActivities() {
  const { activities, loading } = useActivities();
  const [gallery, setGallery] = useState(null);
  const approvedActivities = activities.filter((activity) => activity.status === 'approved');

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
          <h3 style={{ marginBottom: '0.25rem' }}>Approved Activities</h3>
          <p className="text-muted" style={{ margin: 0 }}>Verified cleanup activities that have been approved by a verifier.</p>
        </div>

        {approvedActivities.length === 0 ? (
          <EmptyState message="No approved activities yet. Once a verifier approves your work, it will appear here." />
        ) : (
          <div className="content-grid">
            {approvedActivities.map((activity) => (
              <ActivityListCard key={activity.id} activity={activity} onImageClick={setGallery} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
