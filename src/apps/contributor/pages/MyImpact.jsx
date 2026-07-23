export default function MyImpact() {
  return (
    <section>
      <div className="card mb-6" style={{ padding: '1.25rem 1.75rem' }}>
        <h3 style={{ marginBottom: '0.25rem' }}>My Impact</h3>
        <p className="text-muted" style={{ margin: 0 }}>Your total environmental contribution.</p>
      </div>
      <div className="content-grid">
        <div className="card">
          <div className="stat-label">Total Impact Credits</div>
          <div className="stat-value">0 <span style={{fontSize: '1rem', color: 'var(--text-muted)'}}>IC</span></div>
        </div>
        <div className="card">
          <div className="stat-label">Total Weight Collected</div>
          <div className="stat-value">0 <span style={{fontSize: '1rem', color: 'var(--text-muted)'}}>kg</span></div>
        </div>
      </div>
    </section>
  );
}
