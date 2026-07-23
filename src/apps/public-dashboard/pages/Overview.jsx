import { useEffect, useState } from 'react';
import { apiGet } from '../../../services/api';

function StatCard({ label, value, suffix = '', loading, accent }) {
  return (
    <div className="card">
      <div className="stat-label">{label}</div>
      {loading ? (
        <div style={{
          height: '2.5rem', marginTop: '0.5rem',
          background: 'var(--surface-hover)',
          borderRadius: '0.5rem', animation: 'pulse 1.5s ease-in-out infinite'
        }} />
      ) : (
        <div className="stat-value" style={accent ? {} : {
          background: 'none',
          WebkitTextFillColor: 'initial',
          color: 'var(--text-main)'
        }}>
          {typeof value === 'number' ? value.toLocaleString() : value}{suffix}
        </div>
      )}
    </div>
  );
}



export default function Overview() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await apiGet('/api/dashboard/stats');
        if (!cancelled) {
          if (data.ok) setStats(data.stats);
          else setError('Failed to load stats');
        }
      } catch {
        if (!cancelled) setError('Network error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const s = stats || {};

  return (
    <section>
      {/* Header */}
      <div className="card mb-6" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', padding: '1.25rem 1.75rem' }}>
        <div>
          <h3 style={{ marginBottom: '0.25rem' }}>Global Overview</h3>
          <p className="text-muted" style={{ margin: 0 }}>Real-time tracking of worldwide ocean cleanup efforts.</p>
        </div>
        {error && (
          <span style={{ fontSize: '0.8rem', color: '#ef4444', background: 'rgba(239,68,68,0.1)', padding: '0.25rem 0.75rem', borderRadius: '0.5rem' }}>
            {error}
          </span>
        )}
      </div>

      {/* Top stat cards */}
      <div className="content-grid mb-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        <StatCard label="Total Activities"       value={s.totalActivities}   loading={loading} accent />
        <StatCard label="Total Kg Collected"     value={s.totalKgCollected}  loading={loading} accent />
        <StatCard label="Impact Credits Issued"  value={s.impactCredits}     loading={loading} accent />
      </div>



      {/* Community Impact section */}
      <div className="mb-4 mt-6">
        <h3>Community Impact</h3>
        <p className="text-muted">Current campaign and community engagement metrics.</p>
      </div>
      <div className="content-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        <StatCard label="Waste Collected"     value={s.totalKgCollected}  suffix=" kg" loading={loading} />
        <StatCard label="Verified Activities" value={s.approvedActivities}              loading={loading} />
        <StatCard label="Total Volunteers"    value={s.totalVolunteers}                 loading={loading} />
        <StatCard label="Partner Orgs"        value={s.partnerOrgs}                     loading={loading} />
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </section>
  );
}
