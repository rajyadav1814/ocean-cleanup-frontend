import ActivitiesByStatus from './ActivitiesByStatus';

export default function RejectedActivity() {
  return (
    <ActivitiesByStatus
      status="rejected"
      title="Rejected Activity"
      subtitle="Rejected cleanup activities."
      emptyMessage="No rejected activities yet."
      badgeLabel="Rejected"
      badgeBg="rgba(239,68,68,0.15)"
      badgeColor="#ef4444"
      showExtendedFields={false}
    />
  );
}
