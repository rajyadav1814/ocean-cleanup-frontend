export default function MyImpact() {
  return (
    <section>
      <div className="mb-6">
        <h3>My Impact</h3>
        <p className="text-muted">Your total environmental contribution.</p>
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
