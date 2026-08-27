import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { notificationApi } from '../../services/api';

function fmtTime(ts) {
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

// spec §22-23: "reward closure, not data entry" — the notification this
// bell surfaces (created by notifyEventClosure on the backend) is the "I
// contributed something → something happened → Blue Mind showed me the
// outcome" loop, not a generic inbox. Shared by every role via Header.jsx;
// the backend already scopes results to the caller's own role/id.
export default function NotificationBell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const ref = useRef(null);

  const overviewPath = user?.role === 'citizen' ? '/citizen/overview'
    : user?.role === 'verifier' ? '/verifier/pending'
    : '/contributor/overview';
  const eventPath = user?.role === 'citizen' ? '/citizen/events' : '/contributor/events';

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    notificationApi.list().then((data) => {
      if (!cancelled && data.ok) {
        setNotifications(data.notifications || []);
        setLoaded(true);
      }
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [user]);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  if (!user) return null;

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  async function handleItemClick(n) {
    if (!n.isRead) {
      setNotifications((prev) => prev.map((item) => item.id === n.id ? { ...item, isRead: true } : item));
      notificationApi.markRead(n.id).catch(() => {});
    }
    setOpen(false);
    const eventId = n.payload?.eventId;
    navigate(eventId ? `${eventPath}/${eventId}` : overviewPath);
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
        style={{
          position: 'relative', padding: '0.5rem', borderRadius: '50%',
          background: 'transparent', border: 'none', color: 'var(--text-main)', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: '2px', right: '2px', minWidth: '16px', height: '16px', borderRadius: '999px',
            background: '#ef4444', color: '#fff', fontSize: '0.62rem', fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px',
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 12px)', right: 0, width: '320px', maxHeight: '420px', overflowY: 'auto',
          background: 'var(--surface)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-lg), 0 0 20px rgba(0,0,0,0.2)', zIndex: 100,
        }}>
          <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-light)', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)' }}>
            Notifications
          </div>
          {!loaded ? (
            <div style={{ padding: '1.5rem 1rem', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Loading…</div>
          ) : notifications.length === 0 ? (
            <div style={{ padding: '1.5rem 1rem', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Nothing yet — you'll hear here when something you reported changes.
            </div>
          ) : (
            notifications.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => handleItemClick(n)}
                style={{
                  display: 'block', width: '100%', textAlign: 'left', padding: '0.75rem 1rem',
                  background: n.isRead ? 'transparent' : 'color-mix(in srgb, var(--primary) 6%, transparent)',
                  border: 'none', borderBottom: '1px solid var(--border-light)', cursor: 'pointer', font: 'inherit',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                  {!n.isRead && <span style={{ width: '6px', height: '6px', borderRadius: '999px', background: 'var(--primary)', marginTop: '6px', flexShrink: 0 }} />}
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)' }}>{n.title}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>{n.message}</div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '4px' }}>{fmtTime(n.createdAt)}</div>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
