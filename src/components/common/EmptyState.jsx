// Shared "nothing here yet" card used by list/review pages.
export default function EmptyState({ message }) {
  return (
    <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
      <p className="text-muted">{message}</p>
    </div>
  );
}
