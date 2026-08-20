export default function Pagination({ page, pageCount, onPageChange, label }) {
  return (
    <div className="admin-pagination-bar">
      <span className="admin-pagination__count">{label}</span>
      <div className="admin-pagination">
        <button
          type="button"
          className="secondary"
          onClick={() => onPageChange(Math.max(page - 1, 1))}
          disabled={page === 1}
        >
          Previous
        </button>
        <span className="admin-pagination__count">{page} / {pageCount}</span>
        <button
          type="button"
          className="secondary"
          onClick={() => onPageChange(Math.min(page + 1, pageCount))}
          disabled={page === pageCount}
        >
          Next
        </button>
      </div>
    </div>
  );
}
