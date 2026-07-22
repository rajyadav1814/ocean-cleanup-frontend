export default function ActivityReview() {
  return (
    <section>
      <div className="mb-6">
        <h3>Activity Review</h3>
        <p className="text-muted">Detailed review panel for specific activities.</p>
      </div>
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center', justifyContent: 'center', padding: '3rem' }}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-muted)' }}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
        <p className="text-muted">Select an activity from the Pending Queue to begin review.</p>
      </div>
    </section>
  );
}
