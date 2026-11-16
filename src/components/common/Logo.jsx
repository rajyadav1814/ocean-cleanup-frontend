export default function Logo({ className = '' }) {
  return (
    <div className={`flex items-center ${className}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '2rem' }}>
      <h1 className="brand-wordmark">Bluemind</h1>
    </div>
  );
}
