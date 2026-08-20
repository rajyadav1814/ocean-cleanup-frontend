import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useActivities } from '../../../hooks/useActivities';
import { fetchUserLists } from '../../../store/usersSlice';
import AdminPageHeader from '../components/AdminPageHeader';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'approved', label: 'Approved' },
  { key: 'pending', label: 'Pending' },
  { key: 'rejected', label: 'Rejected' },
];

function formatActivityTimestamp(timestamp) {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return '—';

  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();

  let hours = date.getHours();
  const minutes = date.getMinutes();
  const period = hours >= 12 ? 'PM' : 'AM';

  hours = hours % 12;
  if (hours === 0) hours = 12;

  const paddedMinutes = minutes.toString().padStart(2, '0');
  return `${day}-${month}-${year}, ${hours}:${paddedMinutes} ${period}`;
}

const formatUserName = (user) => {
  if (!user) return '—';
  const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
  if (fullName) return fullName;
  if (user.name) return user.name;
  if (user.username) return user.username;
  return user.id || '—';
};

export default function AllActivities() {
  const dispatch = useDispatch();
  const { activities, loading, error, refresh } = useActivities();
  const { contributors, verifiers, admins, citizens, status: usersStatus } = useSelector((state) => state.users);
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  useEffect(() => {
    if (usersStatus === 'idle') {
      dispatch(fetchUserLists());
    }
  }, [dispatch, usersStatus]);

  const counts = useMemo(() => ({
    all: activities.length,
    approved: activities.filter((a) => a.status === 'approved').length,
    pending: activities.filter((a) => a.status === 'pending').length,
    rejected: activities.filter((a) => a.status === 'rejected').length,
  }), [activities]);

  const filtered = useMemo(
    () => filter === 'all' ? activities : activities.filter((a) => (a.status || 'pending') === filter),
    [activities, filter]
  );

  useEffect(() => { setPage(1); }, [filter]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));

  const paged = useMemo(() => {
    const start = (page - 1) * perPage;
    return filtered.slice(start, start + perPage);
  }, [filtered, page, perPage]);

  const allUsers = useMemo(
    () => [...(contributors || []), ...(verifiers || []), ...(admins || []), ...(citizens || [])],
    [contributors, verifiers, admins, citizens]
  );

  return (
    <section>
      <AdminPageHeader title="All activities" subtitle="Every cleanup activity submitted across the platform.">
        <button onClick={refresh} className="secondary">Refresh</button>
      </AdminPageHeader>

      <div className="admin-filters" style={{ marginTop: '1.5rem' }}>
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            className={`admin-filter${filter === f.key ? ' active' : ''}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label} <span className="n">({counts[f.key]})</span>
          </button>
        ))}
      </div>

      <div className="card admin-table-card" style={{ marginTop: '1.25rem' }}>
        {loading ? (
          <div className="admin-skeleton-rows">
            {[1, 2, 3, 4].map((i) => <div key={i} className="admin-skeleton-row" style={{ animationDelay: `${i * 0.1}s` }} />)}
          </div>
        ) : error ? (
          <div style={{ padding: '1rem', color: 'var(--danger)' }}>{error}</div>
        ) : filtered.length === 0 ? (
          <div className="admin-empty">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            No {filter === 'all' ? '' : `${filter} `}activities found.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  {['Sr.', 'Category', 'Location', 'Quantity', 'Contributor', 'Status', 'Submitted At'].map((h) => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paged.map((a, i) => {
                  const contributor = allUsers.find((u) => String(u.id) === String(a.contributorId));
                  const status = String(a.status || 'pending').toLowerCase();
                  return (
                    <tr key={a.id}>
                      <td>{(page - 1) * perPage + i + 1}</td>
                      <td>{a.category}</td>
                      <td className="wrap">{a.location}</td>
                      <td>{a.quantity}</td>
                      <td>{contributor ? formatUserName(contributor) : (a.contributorId || '—')}</td>
                      <td><span className={`badge ${status}`}>{a.status || 'Unknown'}</span></td>
                      <td>{a.timestamp ? formatActivityTimestamp(a.timestamp) : '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {!loading && !error && filtered.length > 0 && (
        <div className="admin-pagination-bar">
          <span className="admin-pagination__count">
            Showing {(total === 0) ? 0 : (page - 1) * perPage + 1} - {Math.min(page * perPage, total)} of {total}
          </span>
          <div className="admin-pagination">
            <select value={perPage} onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1); }} style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}>
              {[5, 10, 20, 50].map((n) => <option key={n} value={n}>{n} / page</option>)}
            </select>
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="secondary">Prev</button>
            <span className="admin-pagination__count">{page} / {totalPages}</span>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="secondary">Next</button>
          </div>
        </div>
      )}
    </section>
  );
}
