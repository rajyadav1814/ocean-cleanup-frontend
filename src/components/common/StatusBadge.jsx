// Status pill used across verifier review pages (pending / approved / rejected).
// approved/rejected route through the shared --success / --danger design tokens
// (src/styles.css) since those values (#10b981 / #ef4444) exactly match the
// hardcoded hex used by the 3 local copies this replaces. `pending` intentionally
// keeps its literal #d97706 rather than routing through --warning (#f59e0b) —
// the token is a different shade and swapping it would be a visible color change,
// which is out of scope for this pass (see report / plan deviation note).
const STATUS_CONFIG = {
  pending: { color: '#d97706', bg: 'rgba(217,119,6,0.15)', label: 'Pending' },
  approved: { token: '--success', label: 'Approved' },
  rejected: { token: '--danger', label: 'Rejected' },
};

export default function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status];
  const color = cfg ? (cfg.color || `var(${cfg.token})`) : '#94a3b8';
  const bg = cfg ? (cfg.bg || `color-mix(in srgb, var(${cfg.token}) 15%, transparent)`) : 'rgba(148,163,184,0.15)';
  const label = cfg ? cfg.label : status;

  return (
    <span style={{
      background: bg,
      color,
      padding: '0.25rem 0.75rem',
      borderRadius: '1rem',
      fontSize: '0.75rem',
      fontWeight: 600
    }}>{label}</span>
  );
}
