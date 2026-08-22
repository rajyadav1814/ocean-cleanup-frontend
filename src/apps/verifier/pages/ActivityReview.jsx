import ActivitiesByStatus from './ActivitiesByStatus';

export default function ActivityReview() {
  return (
    <ActivitiesByStatus
      status="approved"
      title="Approved Activities"
      subtitle="Approved cleanup activities."
      emptyMessage="No approved activities yet."
      badgeLabel="Approved"
      badgeBg="rgba(16,185,129,0.15)"
      badgeColor="#10b981"
      showExtendedFields
    />
  );
}
