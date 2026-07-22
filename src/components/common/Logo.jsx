export default function Logo({ className = '' }) {
  return (
    <div className={`flex items-center gap-2 ${className}`} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center', marginBottom: '2rem' }}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="32"
        height="32"
        viewBox="0 0 24 24"
        fill="none"
        stroke="var(--primary-hover)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
      </svg>
      <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.025em', display: 'flex', gap: '0.25rem' }}>
        <span style={{ color: 'var(--primary)' }}>Ocean</span>
        <span style={{ color: 'var(--secondary)' }}>Cleanup</span>
      </h1>
    </div>
  );
}
