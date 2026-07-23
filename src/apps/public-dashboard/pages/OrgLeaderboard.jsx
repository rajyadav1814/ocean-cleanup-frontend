export default function OrgLeaderboard() {
  const mockData = [
    { rank: 1, name: 'OceanBase Foundation', kg: 12500, credits: 45000 },
    { rank: 2, name: 'Coastal Defenders', kg: 9800, credits: 31000 },
    { rank: 3, name: 'Blue Horizon', kg: 6200, credits: 24500 }
  ];

  return (
    <section>
      <div className="mb-6">
        <h3>Organization Leaderboard</h3>
        <p className="text-muted">Top contributing organizations by total impact.</p>
      </div>
      <div className="card" style={{ padding: '0' }}>
        <div className="table-container">
          <table>
            <thead style={{ background: 'rgba(0,0,0,0.2)' }}>
              <tr>
                <th>Rank</th>
                <th>Organization</th>
                <th>Total Collected (kg)</th>
                <th>Impact Credits</th>
              </tr>
            </thead>
            <tbody>
              {mockData.map(org => (
                <tr key={org.rank}>
                  <td style={{ fontWeight: '700', color: 'var(--primary-hover)' }}>{org.rank}</td>
                  <td><strong>{org.name}</strong></td>
                  <td>{org.kg.toLocaleString()}</td>
                  <td>{org.credits.toLocaleString()} <span style={{ color: 'var(--success)' }}>IC</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
