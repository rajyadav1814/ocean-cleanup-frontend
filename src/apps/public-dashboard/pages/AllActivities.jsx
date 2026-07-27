import React from 'react';
import { useActivities } from '../../../hooks/useActivities';

const statusStyles = {
  approved: {
    backgroundColor: 'rgba(16,185,129,0.12)',
    color: '#10b981',
  },
  rejected: {
    backgroundColor: 'rgba(239,68,68,0.12)',
    color: '#ef4444',
  },
  pending: {
    backgroundColor: 'rgba(245,158,11,0.12)',
    color: '#f59e0b',
  },
  default: {
    backgroundColor: 'rgba(148,163,184,0.12)',
    color: '#64748b',
  },
};

const getStatusStyle = (status) => {
  return statusStyles[String(status).toLowerCase()] || statusStyles.default;
};

export default function AllActivities() {
  const { activities, loading, error, refresh } = useActivities();

  return (
    <section>
      <div className="card mb-6" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', padding: '1.25rem 1.75rem' }}>
        <div>
          <h3 style={{ marginBottom: '0.25rem' }}>All Activities</h3>
          <p className="text-muted" style={{ margin: 0 }}>All submitted activities on the platform.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button onClick={refresh} className="secondary">Refresh</button>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div style={{ padding: '1rem' }}>Loading activities…</div>
        ) : error ? (
          <div style={{ padding: '1rem', color: '#ef4444' }}>{error}</div>
        ) : activities.length === 0 ? (
          <div style={{ padding: '1rem' }} className="text-muted">No activities found.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                  {['Sr.', 'Category', 'Location', 'Quantity', 'Contributor', 'Status', 'Submitted At'].map((h) => (
                    <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {activities.map((a, i) => (
                  <tr key={a.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                    <td style={{ padding: '0.75rem 1rem' }}>{i + 1}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>{a.category}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>{a.location}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>{a.quantity}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>{a.contributorId || '—'}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minWidth: '82px',
                        padding: '0.35rem 0.65rem',
                        borderRadius: '999px',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        letterSpacing: '0.01em',
                        textTransform: 'capitalize',
                        ...getStatusStyle(a.status),
                      }}>
                        {a.status || 'Unknown'}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>{a.timestamp ? new Date(a.timestamp).toLocaleString() : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
