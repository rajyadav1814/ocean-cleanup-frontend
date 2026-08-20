import { useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useActivities } from '../../../hooks/useActivities';
import { useAuth } from '../../../context/AuthContext';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import { apiDelete } from '../../../services/api';
import ImageGalleryModal from '../../../components/common/ImageGalleryModal';
import { invalidateContributorStats } from '../../../store/contributorSlice';
import { invalidateCitizenStats } from '../../../store/citizenSlice';

function formatActivityDate(timestamp) {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return '—';

  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const period = hours >= 12 ? 'PM' : 'AM';

  hours = hours % 12 || 12;
  const paddedMinutes = minutes.toString().padStart(2, '0');

  return `${day}-${month}-${year}, ${hours}:${paddedMinutes} ${period}`;
}

const CAT_ICON = { plastic: '🧴', glass: '🍾', metal: '🥫', organic: '🍂', mixed: '🗑️', other: '📦' };

const STATUS_META = {
  approved: { bg: 'rgba(6,32,26,.82)', color: '#34d399', label: 'Approved' },
  pending:  { bg: 'rgba(38,26,4,.82)', color: '#fbbf24', label: 'Pending' },
  rejected: { bg: 'rgba(38,10,10,.82)', color: '#f87171', label: 'Rejected' },
};

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'approved', label: 'Approved' },
  { key: 'pending', label: 'Pending' },
  { key: 'rejected', label: 'Rejected' },
];

/* ── injected styles — same token system as ContributorOverview / CitizenOverview ── */
const STYLES = `
  .ma-root { font-family: var(--font-sans); }

  .ma-hero {
    display: flex; align-items: flex-end; justify-content: space-between; gap: 1.5rem; flex-wrap: wrap;
    background: var(--surface); border: 1px solid var(--border-light); border-radius: var(--radius-lg);
    padding: 1.75rem 2rem; backdrop-filter: blur(16px);
  }
  .ma-eyebrow { font-size: .62rem; letter-spacing: .24em; text-transform: uppercase; color: var(--primary); opacity: .85; font-family: var(--font-mono); margin-bottom: .55rem; }
  .ma-title { margin: 0; font-size: 1.55rem; font-weight: 600; letter-spacing: -.02em; color: var(--text-main); font-family: var(--font-display); }
  .ma-title em { font-style: italic; font-family: var(--font-serif); font-weight: 400; color: var(--primary); }
  .ma-sub { margin: .5rem 0 0; font-size: .85rem; color: var(--text-muted); max-width: 46ch; line-height: 1.6; }
  /* Chrome (colors/shape/font/hover) comes from the shared .ma-cta rule in
     styles.css — same button as the contributor and citizen hero CTAs. */
  .ma-cta { cursor: pointer; }

  .ma-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap; margin-top: 1.1rem; }
  .ma-filters { display: flex; gap: 4px; background: var(--surface); border: 1px solid var(--border-light); border-radius: var(--radius-lg); padding: 5px; }
  .ma-filter { border: none; background: transparent; border-radius: var(--radius-md); padding: .5rem 1rem; font-size: .8rem; font-weight: 600; color: var(--text-muted); cursor: pointer; display: flex; align-items: center; gap: .4rem; transition: all .2s ease; font-family: var(--font-sans); }
  .ma-filter.active { background: linear-gradient(135deg, var(--primary), var(--secondary)); color: #fff; box-shadow: 0 0 16px rgba(46,158,155,.22); }
  .ma-filter:not(.active):hover { background: rgba(46,158,155,.06); color: var(--text-main); }
  .ma-filter .n { font-size: .68rem; opacity: .75; }
  .ma-count { font-size: .78rem; color: var(--text-muted); font-family: var(--font-mono); }

  .ma-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem; margin-top: 1.25rem; }

  .ma-card {
    border: 1px solid var(--border-light); border-radius: var(--radius-lg); background: var(--surface);
    overflow: hidden; position: relative; backdrop-filter: blur(16px);
    transition: border-color .2s ease, transform .2s ease, box-shadow .2s ease;
    /* Skip layout/paint work for cards scrolled out of view — the big win
       for a grid that can grow to dozens of blurred cards. */
    content-visibility: auto;
    contain-intrinsic-size: 0 380px;
  }
  .ma-card:hover { border-color: var(--border-glow); transform: translateY(-3px); box-shadow: 0 20px 40px -24px rgba(4,18,31,.35); }

  .ma-media { position: relative; height: 172px; background: var(--surface-hover); overflow: hidden; }
  .ma-media img { width: 100%; height: 100%; object-fit: cover; cursor: zoom-in; transition: transform .35s ease; }
  .ma-card:hover .ma-media img { transform: scale(1.035); }
  .ma-media__placeholder { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: var(--text-muted); }
  /* Solid backgrounds instead of nested backdrop-filter — stacking a blur
     inside an already-blurred card multiplies compositing cost per card. */
  .ma-media__more { position: absolute; bottom: .5rem; right: .5rem; background: rgba(4,18,31,.82); color: #fff; font-size: .68rem; font-weight: 700; padding: .18rem .5rem; border-radius: 999px; }
  .ma-media__badge { position: absolute; top: .6rem; left: .6rem; padding: .22rem .65rem; border-radius: 999px; font-size: .66rem; font-weight: 700; text-transform: uppercase; letter-spacing: .04em; }
  .ma-media__date { position: absolute; top: .6rem; right: .6rem; background: rgba(4,18,31,.72); color: #fff; font-size: .66rem; font-weight: 600; padding: .22rem .6rem; border-radius: 999px; font-family: var(--font-mono); }

  .ma-body { padding: 1.1rem 1.2rem 1.25rem; }
  .ma-loc { margin: 0; font-size: .96rem; font-weight: 700; color: var(--primary-hover); line-height: 1.35; }

  .ma-chips { display: flex; flex-wrap: wrap; gap: .45rem; margin-top: .7rem; }
  .ma-chip {
    display: inline-flex; align-items: center; gap: .35rem; padding: .3rem .6rem; border-radius: 999px;
    background: var(--surface-hover); border: 1px solid var(--border-light); font-size: .74rem; color: var(--text-main); font-weight: 500;
  }
  .ma-chip strong { font-weight: 700; }

  .ma-actions { margin-top: 1.1rem; display: flex; justify-content: flex-end; gap: .55rem; }
  .ma-btn {
    flex: none; min-width: 96px; padding: .5rem .9rem; border-radius: var(--radius-md); font-size: .78rem; font-weight: 600;
    cursor: pointer; text-align: center; transition: background .2s ease, border-color .2s ease, opacity .2s ease;
    font-family: var(--font-sans);
  }
  .ma-btn--edit { background: transparent; border: 1px solid var(--border-glow); color: var(--primary); }
  .ma-btn--edit:hover { background: rgba(46,158,155,.08); }
  .ma-btn--delete { background: transparent; border: 1px solid rgba(239,68,68,.35); color: #ef4444; }
  .ma-btn--delete:hover { background: rgba(239,68,68,.08); }
  .ma-btn:disabled { opacity: .6; cursor: default; }

  .ma-empty {
    text-align: center; padding: 3.5rem 2rem; border: 1px dashed var(--border-light); border-radius: var(--radius-lg);
    background: var(--surface); margin-top: 1.25rem;
  }
  .ma-empty__icon { font-size: 1.8rem; margin-bottom: .75rem; opacity: .7; }
  .ma-empty p { margin: 0; color: var(--text-muted); font-size: .9rem; }
  .ma-empty .ma-cta { margin-top: 1.1rem; }

  .ma-error {
    padding: .9rem 1.1rem; border: 1px solid rgba(239,68,68,.3); background: rgba(239,68,68,.08);
    color: #f87171; border-radius: var(--radius-lg); font-size: .86rem; margin-top: 1.1rem;
  }

  @media (max-width: 640px) {
    .ma-hero { padding: 1.35rem 1.4rem; align-items: flex-start; }
    .ma-toolbar { flex-direction: column; align-items: flex-start; }
    .ma-grid { grid-template-columns: 1fr; }
  }
`;

export default function MyActivities() {
  const dispatch = useDispatch();
  const { activities, loading, refresh } = useActivities();
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState('');
  const [gallery, setGallery] = useState(null);
  const [filter, setFilter] = useState('all');

  const visibleActivities = useMemo(
    () => activities.filter((activity) => activity.contributorId === user?.id),
    [activities, user]
  );

  const counts = useMemo(() => ({
    all: visibleActivities.length,
    approved: visibleActivities.filter((a) => a.status === 'approved').length,
    pending: visibleActivities.filter((a) => a.status === 'pending').length,
    rejected: visibleActivities.filter((a) => a.status === 'rejected').length,
  }), [visibleActivities]);

  const filtered = useMemo(
    () => filter === 'all' ? visibleActivities : visibleActivities.filter((a) => (a.status || 'pending') === filter),
    [visibleActivities, filter]
  );

  const canModify = (activity) => (role === 'contributor' || role === 'citizen') && activity.contributorId === user?.id && activity.status !== 'approved';

  if (loading) return <LoadingSpinner layout="list" />;

  async function handleDelete(activityId) {
    const confirmed = window.confirm('Delete this activity? This cannot be undone.');
    if (!confirmed) return;

    setDeletingId(activityId);
    setError('');

    try {
      const response = await apiDelete(`/api/activities/${activityId}`);
      if (!response.ok) {
        setError(response.error || response.message || 'Failed to delete activity');
        return;
      }

      await refresh();
      dispatch(role === 'citizen' ? invalidateCitizenStats() : invalidateContributorStats());
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="ma-root">
      <style>{STYLES}</style>

      {gallery && (
        <ImageGalleryModal
          images={gallery.images}
          startAt={gallery.startAt}
          alt="Cleanup evidence"
          onClose={() => setGallery(null)}
        />
      )}

      <section>
        {/* ── HERO ── */}
        <div className="ma-hero">
          <div>
            <div className="ma-eyebrow">Your Record</div>
            <h1 className="ma-title">My <em>activities.</em></h1>
            <p className="ma-sub">Every cleanup you've logged, in one place — a running record of your environmental impact contributions.</p>
          </div>
          <button type="button" className="ma-cta" onClick={() => navigate(`/${role}/submit`)}>
            Log a cleanup <span aria-hidden="true">→</span>
          </button>
        </div>

        {/* ── FILTER TOOLBAR ── */}
        {visibleActivities.length > 0 && (
          <div className="ma-toolbar">
            <div className="ma-filters">
              {FILTERS.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  className={`ma-filter${filter === f.key ? ' active' : ''}`}
                  onClick={() => setFilter(f.key)}
                >
                  {f.label} <span className="n">({counts[f.key]})</span>
                </button>
              ))}
            </div>
            <span className="ma-count">Showing {filtered.length} of {visibleActivities.length}</span>
          </div>
        )}

        {error && <div className="ma-error">{error}</div>}

        {/* ── GRID / EMPTY STATE ── */}
        {visibleActivities.length === 0 ? (
          <div className="ma-empty">
            <div className="ma-empty__icon">🌊</div>
            <p>No activities submitted yet. Start cleaning!</p>
            <button type="button" className="ma-cta" onClick={() => navigate(`/${role}/submit`)}>
              Log your first cleanup <span aria-hidden="true">→</span>
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="ma-empty">
            <div className="ma-empty__icon">🔎</div>
            <p>No {filter} activities to show.</p>
          </div>
        ) : (
          <div className="ma-grid">
            {filtered.map((activity) => {
              const isDeleting = deletingId === activity.id;
              const status = activity.status || 'pending';
              const meta = STATUS_META[status] || STATUS_META.pending;

              const urls = Array.isArray(activity.imageGatewayUrl)
                ? activity.imageGatewayUrl
                : activity.imageGatewayUrl
                  ? [activity.imageGatewayUrl]
                  : [];
              const firstUrl = urls[0];

              return (
                <div key={activity.id} className="ma-card" style={{ opacity: isDeleting ? 0.65 : 1 }}>
                  <div className="ma-media">
                    <span className="ma-media__badge" style={{ background: meta.bg, color: meta.color }}>
                      {meta.label}
                    </span>
                    <span className="ma-media__date">{formatActivityDate(activity.timestamp || Date.now())}</span>

                    {firstUrl ? (
                      <>
                        <img
                          src={firstUrl}
                          alt="Cleanup evidence"
                          loading="lazy"
                          decoding="async"
                          onClick={() => setGallery({ images: urls, startAt: 0 })}
                          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setGallery({ images: urls, startAt: 0 }); } }}
                          role="button"
                          tabIndex={0}
                          title="Click to view photos"
                        />
                        {urls.length > 1 && <span className="ma-media__more">+{urls.length - 1} more</span>}
                      </>
                    ) : (
                      <div className="ma-media__placeholder">
                        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                          <circle cx="8.5" cy="8.5" r="1.5"></circle>
                          <polyline points="21 15 16 10 5 21"></polyline>
                        </svg>
                      </div>
                    )}
                  </div>

                  <div className="ma-body">
                    <h4 className="ma-loc">{activity.location}</h4>

                    <div className="ma-chips">
                      <span className="ma-chip">
                        {CAT_ICON[(activity.category || '').toLowerCase()] || '📦'}
                        <strong style={{ textTransform: 'capitalize' }}>{activity.category || 'Other'}</strong>
                      </span>
                      <span className="ma-chip">
                        ⚖️ <strong>{activity.quantity} kg</strong>
                      </span>
                      {activity.volunteers > 0 && (
                        <span className="ma-chip">
                          🤝 <strong>{activity.volunteers}</strong> vol.
                        </span>
                      )}
                    </div>

                    {status === 'rejected' && activity.reviewNote && (
                      <div style={{ marginTop: '.7rem', fontSize: '.74rem', color: '#f87171', background: 'rgba(239,68,68,.08)', borderRadius: '6px', padding: '.4rem .6rem', lineHeight: 1.4 }}>
                        {activity.reviewNote}
                      </div>
                    )}

                    {canModify(activity) && (
                      <div className="ma-actions">
                        <button
                          type="button"
                          className="ma-btn ma-btn--edit"
                          onClick={() => navigate(`/${role}/my-activities/edit/${activity.id}`)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="ma-btn ma-btn--delete"
                          onClick={() => handleDelete(activity.id)}
                          disabled={isDeleting}
                        >
                          {isDeleting ? 'Deleting…' : 'Delete'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}