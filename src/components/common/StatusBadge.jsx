export default function StatusBadge({ label, tone = 'info' }) {
  return <span className="card" style={{ display: 'inline-block', padding: '0.25rem 0.6rem', background: tone === 'success' ? '#dcfce7' : tone === 'warning' ? '#fef3c7' : '#dbeafe' }}>{label}</span>;
}
