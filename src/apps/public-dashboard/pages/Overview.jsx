export default function Overview() {
  return (
    <section>
      <div className="mb-6">
        <h3>Global Overview</h3>
        <p className="text-muted">Real-time tracking of worldwide ocean cleanup efforts.</p>
      </div>
      <div className="content-grid mb-6">
        <div className="card">
          <div className="stat-label">Total Activities</div>
          <div className="stat-value">1,248</div>
        </div>
        <div className="card">
          <div className="stat-label">Total Kg Collected</div>
          <div className="stat-value">45,290</div>
        </div>
        <div className="card">
          <div className="stat-label">Impact Credits Distributed</div>
          <div className="stat-value">312,000</div>
        </div>
      </div>

      <div className="mb-6 mt-6">
        <h3>Community Impact</h3>
        <p className="text-muted">Current campaign and community engagement metrics.</p>
      </div>
      <div className="content-grid">
        <div className="card">
          <div className="stat-label" style={{ textTransform: 'none' }}>Waste collected</div>
          <div className="stat-value">4,820 kg</div>
        </div>
        <div className="card">
          <div className="stat-label" style={{ textTransform: 'none' }}>Verified activities</div>
          <div className="stat-value" style={{ background: 'none', WebkitTextFillColor: 'initial', color: '#f8fafc' }}>312</div>
        </div>
        <div className="card">
          <div className="stat-label" style={{ textTransform: 'none' }}>Volunteers</div>
          <div className="stat-value" style={{ background: 'none', WebkitTextFillColor: 'initial', color: '#f8fafc' }}>1,540</div>
        </div>
        <div className="card">
          <div className="stat-label" style={{ textTransform: 'none' }}>Partner orgs</div>
          <div className="stat-value" style={{ background: 'none', WebkitTextFillColor: 'initial', color: '#f8fafc' }}>18</div>
        </div>
      </div>
    </section>
  );
}
