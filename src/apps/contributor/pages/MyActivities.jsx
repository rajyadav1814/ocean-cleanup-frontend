import { useActivities } from '../../../hooks/useActivities';
import LoadingSpinner from '../../../components/common/LoadingSpinner';

export default function MyActivities() {
  const { activities, loading } = useActivities();

  if (loading) return <LoadingSpinner />;

  return (
    <section>
      <div className="mb-6">
        <h3>My Activities</h3>
        <p className="text-muted">A record of your environmental impact contributions.</p>
      </div>
      {activities.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p className="text-muted">No activities submitted yet. Start cleaning!</p>
        </div>
      ) : (
        <div className="content-grid">
          {activities.map((activity) => (
            <div key={activity.id} className="card">
              <div className="flex-between mb-4">
                <span className="badge pending">Submitted</span>
                <span className="text-muted" style={{ fontSize: '0.85rem' }}>{new Date(activity.timestamp || Date.now()).toLocaleDateString()}</span>
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
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
