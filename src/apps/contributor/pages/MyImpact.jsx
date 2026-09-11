import { useMemo } from 'react';
import { useContributorImpact } from '../../../hooks/useContributorImpact';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import { adaptiveImpactMetrics } from '../eventMeta';

export default function MyImpact() {
  const { impact, loading } = useContributorImpact();

  const cards = useMemo(() => {
    if (!impact) return [];
    return [
      { key: 'contributions', label: 'Contributions', value: impact.contributions ?? 0, unit: '' },
      { key: 'verified', label: 'Verified', value: impact.verifiedEvents ?? 0, unit: '' },
      ...adaptiveImpactMetrics(impact),
    ];
  }, [impact]);

  if (loading) return <LoadingSpinner />;

  return (
    <section>
      <div className="card mb-6" style={{ padding: '1.25rem 1.75rem' }}>
        <h3 style={{ marginBottom: '0.25rem' }}>My Impact</h3>
        <p className="text-muted" style={{ margin: 0 }}>
          These metrics adapt to what you contribute — a cleanup crew, a wildlife
          observer, and a water-quality team each see different numbers here.
        </p>
      </div>
      <div className="content-grid">
        {cards.map((c) => (
          <div className="card" key={c.key}>
            <div className="stat-label">{c.label}</div>
            <div className="stat-value">
              {Number(c.value) || 0}
              {c.unit && <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}> {c.unit}</span>}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
