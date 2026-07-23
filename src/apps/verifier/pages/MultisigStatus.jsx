export default function MultisigStatus() {
  return (
    <section>
      <div className="card mb-6" style={{ padding: '1.25rem 1.75rem' }}>
        <h3 style={{ marginBottom: '0.25rem' }}>Multisig Status</h3>
        <p className="text-muted" style={{ margin: 0 }}>Monitor multi-signature approvals for large distributions.</p>
      </div>
      <div className="card">
        <div className="flex-between mb-4">
          <h4>Batch Distribution #1042</h4>
          <span className="badge pending">Awaiting Signatures</span>
        </div>
        <div className="mt-4">
          <div className="flex-between mb-2">
            <span className="text-muted">Progress</span>
            <strong>1 / 3 Signers</strong>
          </div>
          <div style={{ height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ width: '33%', height: '100%', background: 'var(--warning)', borderRadius: '4px' }}></div>
          </div>
        </div>
      </div>
    </section>
  );
}
