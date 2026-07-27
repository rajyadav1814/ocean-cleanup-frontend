import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUserLists, toggleUserActiveStatus } from '../../../store/usersSlice';

function UserTable({ users, loading, emptyLabel, onToggleActive, actionState }) {
  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', padding: '1rem' }}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} style={{
            height: '3.25rem', borderRadius: '0.625rem',
            background: 'var(--surface-hover)',
            animation: 'pulse 1.5s ease-in-out infinite',
            animationDelay: `${i * 0.1}s`
          }} />
        ))}
      </div>
    );
  }

  if (!users || users.length === 0) {
    return (
      <div style={{
        textAlign: 'center', padding: '3rem 1rem',
        color: 'var(--text-muted)', fontSize: '0.9rem'
      }}>
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
          style={{ opacity: 0.35, marginBottom: '0.75rem', display: 'block', margin: '0 auto 0.75rem' }}>
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
        {emptyLabel}
      </div>
    );
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{
        width: '100%', borderCollapse: 'collapse',
        fontSize: '0.875rem', color: 'var(--text-main)'
      }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
            {['Sr. No.', 'Name', 'User Name', 'Email', 'Joining Date', 'Status', 'Action'].map((h) => (
              <th key={h} style={{
                padding: '0.75rem 1rem', textAlign: 'left',
                color: 'var(--text-muted)', fontWeight: 600,
                fontSize: '0.72rem', letterSpacing: '0.06em',
                textTransform: 'uppercase', whiteSpace: 'nowrap'
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {users.map((u, idx) => (
            <tr
              key={u.id}
              style={{
                borderBottom: idx < users.length - 1 ? '1px solid var(--border-light)' : 'none',
                transition: 'background 0.15s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-hover)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <td style={{ padding: '0.875rem 1rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                {idx + 1}
              </td>
              <td style={{ padding: '0.875rem 1rem', whiteSpace: 'nowrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{
                    width: '2.1rem', height: '2.1rem', borderRadius: '50%',
                    background: 'linear-gradient(135deg, #10b981, #3b82f6)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, fontSize: '0.8rem', flexShrink: 0, color: '#fff'
                  }}>
                    {(u.firstName?.[0] || '?').toUpperCase()}
                  </div>
                  <span style={{ fontWeight: 500 }}>
                    {u.firstName} {u.lastName}
                  </span>
                </div>
              </td>
              <td style={{ padding: '0.875rem 1rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                {u.username}
              </td>
              <td style={{ padding: '0.875rem 1rem', color: 'var(--text-muted)' }}>
                {u.email}
              </td>
              <td style={{ padding: '0.875rem 1rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
              </td>
              <td style={{ padding: '0.875rem 0.75rem', whiteSpace: 'nowrap' }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  minWidth: '4.5rem', borderRadius: '999px', padding: '0.35rem 0.75rem',
                  fontSize: '0.75rem', fontWeight: 600,
                  background: u.active ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                  color: u.active ? '#166534' : '#991b1b'
                }}>
                  {u.active ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td style={{ padding: '0.875rem 1rem', whiteSpace: 'nowrap' }}>
                <label
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.65rem',
                    cursor: actionState[u.id] ? 'not-allowed' : 'pointer'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={u.active}
                    disabled={actionState[u.id]}
                    onChange={() => onToggleActive?.(u)}
                    style={{ display: 'none' }}
                  />
                  <span style={{
                    width: '3rem',
                    height: '1.6rem',
                    borderRadius: '999px',
                    position: 'relative',
                    display: 'inline-block',
                    background: u.active ? '#16a34a' : '#dc2626',
                    transition: 'background 0.2s ease'
                  }}>
                    <span style={{
                      position: 'absolute',
                      top: '0.15rem',
                      left: u.active ? '1.55rem' : '0.15rem',
                      width: '1.2rem',
                      height: '1.2rem',
                      borderRadius: '50%',
                      background: '#fff',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.16)',
                      transition: 'left 0.2s ease'
                    }} />
                  </span>
                  <span style={{
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: u.active ? '#166534' : '#991b1b'
                  }}>
                    {actionState[u.id] ? 'Saving…' : u.active}
                  </span>
                </label>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function ContributorsList() {
  const dispatch = useDispatch();
  const { contributors, status, error } = useSelector((state) => state.users);
  const [actionState, setActionState] = useState({});
  const loading = status === 'idle' || status === 'loading';

  useEffect(() => {
    if (status === 'idle') dispatch(fetchUserLists());
  }, [dispatch, status]);

  const handleToggleActive = async (user) => {
    setActionState((prev) => ({ ...prev, [user.id]: true }));
    try {
      await dispatch(toggleUserActiveStatus({ id: user.id, active: !user.active })).unwrap();
    } catch (err) {
      console.error('Failed to update user status:', err);
    } finally {
      setActionState((prev) => ({ ...prev, [user.id]: false }));
    }
  };

  return (
    <section>
      {/* Header */}
      <div className="card mb-6" style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        flexWrap: 'wrap', gap: '1rem', padding: '1.25rem 1.75rem'
      }}>
        <div>
          <h3 style={{ marginBottom: '0.25rem' }}>Contributors List</h3>
          <p className="text-muted" style={{ margin: 0 }}>
            All registered contributors on the platform.
          </p>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          fontSize: '0.85rem', color: 'var(--text-muted)'
        }}>
          {!loading && (
            <span style={{
              background: 'rgba(16,185,129,0.12)', color: '#10b981',
              border: '1px solid rgba(16,185,129,0.3)', borderRadius: '999px',
              padding: '0.2rem 0.75rem', fontWeight: 600, fontSize: '0.8rem'
            }}>
              {contributors.length} total
            </span>
          )}
          {error && (
            <span style={{
              fontSize: '0.8rem', color: '#ef4444',
              background: 'rgba(239,68,68,0.1)',
              padding: '0.25rem 0.75rem', borderRadius: '0.5rem'
            }}>{error}</span>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <UserTable
          users={contributors}
          loading={loading}
          emptyLabel="No contributors registered yet."
          onToggleActive={handleToggleActive}
          actionState={actionState}
        />
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </section>
  );
}
