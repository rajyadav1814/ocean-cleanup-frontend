import { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useCitizenStats, useCitizenLeaderboard, useCitizenFeed } from '../../../hooks/useCitizen';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import SubmitActivity from '../../contributor/pages/SubmitActivity';

/* ── helpers ── */
function timeAgo(ts) {
  const diff = (Date.now() - new Date(ts)) / 1000;
  if (diff < 60)    return 'just now';
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}
function memberSince(ts) {
  if (!ts) return 'recently';
  return new Date(ts).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
}

/* ── injected styles ── */
const STYLES = `
  .co-root { font-family: var(--font-sans); }

  /* hero */
  .co-hero {
    display: flex; align-items: flex-end;
    justify-content: space-between; gap: 2rem; flex-wrap: wrap;
    background: var(--surface);
    border: 1px solid var(--border-light);
    border-radius: var(--radius-lg);
    padding: 2rem 2.2rem;
    margin-bottom: 1.4rem;
    backdrop-filter: blur(16px);
  }
  .co-eyebrow {
    font-size: 0.62rem; letter-spacing: 0.24em; text-transform: uppercase;
    color: var(--primary); margin-bottom: 0.8rem; opacity: 0.8;
    font-family: var(--font-mono);
  }
  .co-h1 {
    font-size: 1.9rem; font-weight: 600; line-height: 1.2;
    color: var(--text-main); margin: 0; max-width: 540px;
    font-family: var(--font-display);
  }
  .co-h1 em { font-style: normal; color: var(--primary); }
  .co-hero-sub {
    font-size: 0.88rem; color: var(--text-muted);
    margin-top: 0.7rem; max-width: 460px; line-height: 1.7;
  }
  .co-cta {
    background: transparent !important;
    border: 1px solid var(--border-glow) !important;
    border-radius: var(--radius-md) !important;
    color: var(--primary) !important;
    font-size: 0.78rem !important; font-weight: 500 !important;
    letter-spacing: 0.14em !important; text-transform: uppercase !important;
    padding: 0.75rem 1.6rem !important;
    cursor: pointer; white-space: nowrap; flex-shrink: 0; align-self: flex-end;
    box-shadow: none !important; transform: none !important; filter: none !important;
    transition: background 0.2s, box-shadow 0.2s !important;
    font-family: var(--font-mono) !important;
  }
  .co-cta:hover {
    background: rgba(61,214,224,0.08) !important;
    box-shadow: 0 0 20px rgba(61,214,224,0.2) !important;
    border-color: var(--primary) !important;
    transform: none !important; filter: none !important;
  }

  /* stat strip */
  .co-stats {
    display: grid; grid-template-columns: repeat(4,1fr);
    gap: 1rem; margin-bottom: 1.4rem;
  }
  .co-stat {
    background: var(--surface); border: 1px solid var(--border-light);
    border-radius: var(--radius-lg); padding: 1.4rem 1.6rem;
    backdrop-filter: blur(16px); transition: border-color 0.2s, transform 0.2s;
  }
  .co-stat:hover { border-color: var(--border-glow); transform: translateY(-2px); }
  .co-stat-label {
    font-size: 0.62rem; letter-spacing: 0.16em; text-transform: uppercase;
    color: var(--text-muted); font-family: var(--font-mono);
  }
  .co-stat-value {
    font-size: 1.8rem; font-weight: 700; color: var(--primary);
    margin-top: 0.4rem; line-height: 1; letter-spacing: -0.01em;
    font-family: var(--font-display);
  }
  .co-stat-value.amber { color: var(--warning); }
  .co-stat-desc { font-size: 0.72rem; color: var(--text-muted); margin-top: 0.3rem; font-family: var(--font-mono); }

  /* tabs */
  .co-tabs {
    display: flex; gap: 4px; background: var(--surface);
    border: 1px solid var(--border-light); border-radius: var(--radius-lg);
    padding: 5px; margin-bottom: 1.4rem; backdrop-filter: blur(16px);
  }
  .co-tab {
    flex: 1; border: none !important; border-radius: var(--radius-md) !important;
    padding: 0.6rem 1.2rem; font-size: 0.85rem; font-weight: 600; cursor: pointer;
    transition: all 0.2s;
    box-shadow: none !important; transform: none !important; filter: none !important;
  }
  .co-tab.active {
    background: linear-gradient(135deg, var(--primary), var(--secondary)) !important;
    color: #fff !important;
    box-shadow: 0 0 16px rgba(61,214,224,0.25) !important;
  }
  .co-tab:not(.active) {
    background: transparent !important; color: var(--text-muted) !important;
  }
  .co-tab:not(.active):hover { background: rgba(61,214,224,0.06) !important; color: var(--text-main) !important; }

  /* main grid */
  .co-grid { display: grid; grid-template-columns: 1.65fr 1fr; gap: 1.2rem; }
  .co-right { display: flex; flex-direction: column; gap: 1.2rem; }

  /* panel */
  .co-panel {
    background: var(--surface); border: 1px solid var(--border-light);
    border-radius: var(--radius-lg); padding: 1.6rem 1.8rem;
    backdrop-filter: blur(16px);
  }
  .co-panel-kicker {
    font-size: 0.58rem; letter-spacing: 0.22em; text-transform: uppercase;
    color: var(--primary); opacity: 0.75; font-family: var(--font-mono);
  }
  .co-panel-title { font-size: 1.1rem; font-weight: 700; color: var(--text-main); margin-top: 0.3rem; font-family: var(--font-display); }
  .co-panel-desc  { font-size: 0.76rem; color: var(--text-muted); margin-top: 0.2rem; margin-bottom: 1.2rem; }

  /* feed */
  .co-feed-row { display: flex; gap: 1rem; padding: 0.9rem 0; border-bottom: 1px solid var(--border-light); }
  .co-feed-row:last-child { border-bottom: none; padding-bottom: 0; }
  .co-feed-time { font-size: 0.62rem; color: var(--text-muted); width: 52px; flex-shrink: 0; padding-top: 2px; line-height: 1.4; font-family: var(--font-mono); }
  .co-feed-text { font-size: 0.84rem; color: var(--text-main); line-height: 1.5; font-family: var(--font-sans); }
  .co-feed-text b { font-weight: 600; color: var(--primary-hover); }
  .co-feed-meta { display: flex; align-items: center; gap: 0.6rem; margin-top: 0.35rem; font-size: 0.65rem; color: var(--text-muted); flex-wrap: wrap; font-family: var(--font-mono); }
  .co-pill {
    font-size: 0.6rem; font-weight: 600; letter-spacing: 0.06em;
    text-transform: uppercase; padding: 0.15rem 0.55rem;
    border-radius: 20px; border: none;
    box-shadow: none !important; transform: none !important; filter: none !important;
    background: transparent !important; font-family: var(--font-mono);
  }
  .co-pill.pending  { background: rgba(245,158,11,0.14) !important; color: var(--warning) !important; }
  .co-pill.verified { background: rgba(16,185,129,0.14) !important; color: var(--success) !important; }

  /* badges */
  .co-badges { display: grid; grid-template-columns: repeat(4,1fr); gap: 8px; }
  .co-badge {
    background: var(--surface-hover); border: 1px solid var(--border-light);
    border-radius: var(--radius-md); padding: 0.9rem 0.5rem; text-align: center;
    transition: border-color 0.2s, transform 0.2s;
  }
  .co-badge.earned { border-color: rgba(61,214,224,0.3); background: rgba(61,214,224,0.05); }
  .co-badge.earned:hover { transform: translateY(-2px); border-color: var(--border-glow); }
  .co-badge-icon {
    width: 36px; height: 36px; border-radius: 50%; margin: 0 auto 0.5rem;
    display: flex; align-items: center; justify-content: center; font-size: 0.75rem;
    border: 1px solid var(--border-light); color: var(--text-muted);
  }
  .co-badge.earned .co-badge-icon { border-color: var(--border-glow); color: var(--primary); box-shadow: 0 0 10px rgba(61,214,224,0.18); }
  .co-badge-name  { font-size: 0.68rem; font-weight: 600; color: var(--text-main); line-height: 1.3; font-family: var(--font-sans); }
  .co-badge-status { font-size: 0.58rem; color: var(--text-muted); margin-top: 0.2rem; text-transform: uppercase; letter-spacing: 0.06em; font-family: var(--font-mono); }
  .co-badge.earned .co-badge-status { color: var(--primary); opacity: 0.75; }

  /* leaderboard */
  .co-lb-row { display: flex; align-items: center; gap: 0.75rem; padding: 0.7rem 0; border-bottom: 1px solid var(--border-light); }
  .co-lb-row:last-child { border-bottom: none; }
  .co-lb-rank { font-size: 0.72rem; font-weight: 700; width: 20px; flex-shrink: 0; color: var(--text-muted); font-family: var(--font-mono); }
  .co-lb-row.me .co-lb-rank { color: var(--primary); }
  .co-lb-av {
    width: 28px; height: 28px; border-radius: 50%; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    font-size: 10px; font-weight: 700;
    background: var(--surface-hover); border: 1px solid var(--border-light); color: var(--text-muted);
    font-family: var(--font-mono);
  }
  .co-lb-row.me .co-lb-av { background: rgba(61,214,224,0.12); border-color: var(--border-glow); color: var(--primary); }
  .co-lb-name { flex: 1; font-size: 0.82rem; color: var(--text-main); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .co-lb-row.me .co-lb-name { color: var(--primary-hover); font-weight: 600; }
  .co-lb-count { font-size: 0.7rem; color: var(--text-muted); flex-shrink: 0; font-family: var(--font-mono); }

  /* toast */
  .co-toast {
    position: fixed; top: 1rem; right: 1rem; z-index: 2000;
    background: rgba(15,110,120,0.95); border: 1px solid rgba(61,214,224,0.3);
    color: #fff; padding: 0.8rem 1rem; border-radius: var(--radius-md);
    font-weight: 600; font-size: 0.88rem; backdrop-filter: blur(10px);
    box-shadow: 0 16px 40px rgba(0,0,0,0.3);
  }

  /* responsive */
  @media (max-width: 900px) {
    .co-grid  { grid-template-columns: 1fr; }
    .co-stats { grid-template-columns: repeat(2,1fr); }
    .co-h1    { font-size: 1.5rem; }
  }
  @media (max-width: 520px) {
    .co-badges { grid-template-columns: repeat(2,1fr); }
    .co-stat   { padding: 1rem 1.1rem; }
    .co-stat-value { font-size: 1.4rem; }
    .co-panel  { padding: 1.2rem; }
    .co-hero   { padding: 1.4rem; }
  }
`;

export default function CitizenOverview() {
  const { user }  = useAuth();
  const { stats,  loading: sL } = useCitizenStats();
  const { leaderboard, myRow, loading: lL } = useCitizenLeaderboard();
  const { feed,  loading: fL } = useCitizenFeed(6);
  const [tab, setTab]   = useState('overview');
  const [toast, setToast] = useState('');

  if (sL || lL || fL) return <LoadingSpinner />;

  const s      = stats  || {};
  const badges = s.badges || [];
  const earned = badges.filter(b => b.earned);
  const lbRows = leaderboard || [];
  const allRows = [...lbRows, ...(myRow && !lbRows.some(r => r.isMe) ? [myRow] : [])];

  const firstName  = user?.firstName || user?.displayName?.split(' ')[0] || 'there';
  const sinceLabel = memberSince(s.memberSince);

  return (
    <div className="co-root">
      <style>{STYLES}</style>

      {toast && <div className="co-toast">{toast}</div>}

      {/* ── Hero ── */}
      <div className="co-hero">
        <div>
          <div className="co-eyebrow">Citizen Space</div>
          <h1 className="co-h1">
            Hi {firstName} — the coast is{' '}
            <em>a little cleaner</em> because you showed up.
          </h1>
          <p className="co-hero-sub">
            {s.totalReports || 0} report{s.totalReports !== 1 ? 's' : ''} logged since {sinceLabel}.
            Every entry feeds the community map BlueMind uses to track where pollution is concentrating.
          </p>
        </div>
        <button id="citizen-submit-hero" className="co-cta" onClick={() => setTab('submit')}>
          Submit a report →
        </button>
      </div>

      {/* ── Stat strip ── */}
      <div className="co-stats">
        {[
          { label: 'Reports',      value: s.totalReports || 0,          sub: `since ${sinceLabel}`,        cls: '' },
          { label: 'Waste logged', value: `${Number(s.totalKg||0).toFixed(1)} kg`, sub: 'verified + pending', cls: '' },
          { label: 'Badges earned',value: `${earned.length} / ${badges.length||8}`, sub: badges.find(b=>!b.earned)?.title||'All earned!', cls: 'amber' },
          { label: 'City rank',    value: s.cityRank ? `#${s.cityRank}` : '—', sub: lbRows.length ? `of ${lbRows.length} citizens` : 'not ranked yet', cls: '' },
        ].map(({ label, value, sub, cls }) => (
          <div key={label} className="co-stat">
            <div className="co-stat-label">{label}</div>
            <div className={`co-stat-value${cls ? ` ${cls}` : ''}`}>{value}</div>
            <div className="co-stat-desc">{sub}</div>
          </div>
        ))}
      </div>

      {/* ── Tabs ── */}
      <div className="co-tabs">
        {[
          { id: 'overview', label: '🌊 My Space' },
          { id: 'submit',   label: '+ Submit Activity' },
        ].map(t => (
          <button
            key={t.id}
            id={`citizen-tab-${t.id}`}
            className={`co-tab${tab === t.id ? ' active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ══ Submit tab ══ */}
      {tab === 'submit' && <SubmitActivity />}

      {/* ══ Overview tab ══ */}
      {tab === 'overview' && (
        <div className="co-grid">

          {/* ── Feed (left) ── */}
          <div className="co-panel">
            <div className="co-panel-kicker">Community Feed</div>
            <div className="co-panel-title">Latest reports</div>
            <div className="co-panel-desc">Real-time submissions from citizens near you.</div>

            {feed.length === 0 && (
              <div style={{ textAlign:'center', padding:'2rem 0', color:'var(--text-muted)', fontSize:'0.84rem' }}>
                No reports yet — be the first!
              </div>
            )}

            {feed.slice(0, 6).map((item, i) => {
              const name = `${item.firstName||''} ${item.lastName?.[0] ? item.lastName[0]+'.' : ''}`.trim();
              return (
                <div key={item.id||i} className="co-feed-row">
                  <div className="co-feed-time">{timeAgo(item.submittedAt)}</div>
                  <div>
                    <div className="co-feed-text">
                      <b>{name}</b> logged a cleanup at {item.location}
                    </div>
                    <div className="co-feed-meta">
                      {item.quantity   > 0 && <span>{item.quantity} kg</span>}
                      {item.volunteers > 0 && <span>· {item.volunteers} vol.</span>}
                      {item.status === 'pending'  && <span className="co-pill pending">Pending</span>}
                      {item.status === 'approved' && <span className="co-pill verified">Verified</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Right column ── */}
          <div className="co-right">

            {/* Badges */}
            <div className="co-panel">
              <div className="co-panel-kicker">Milestones</div>
              <div className="co-panel-title">Your badges</div>
              <div className="co-panel-desc">Earned by reporting and hitting streaks.</div>
              <div className="co-badges">
                {badges.length === 0
                  ? <div style={{ gridColumn:'1/-1', textAlign:'center', padding:'1.5rem 0', color:'var(--text-muted)', fontSize:'0.8rem' }}>No badges yet.</div>
                  : badges.map(b => (
                    <div key={b.id} className={`co-badge${b.earned ? ' earned' : ''}`}>
                      <div className="co-badge-icon">{b.icon || b.title?.[0] || '?'}</div>
                      <div className="co-badge-name">{b.title}</div>
                      <div className="co-badge-status">{b.earned ? 'Earned' : (b.progressLabel || 'Locked')}</div>
                    </div>
                  ))
                }
              </div>
            </div>

            {/* Leaderboard */}
            <div className="co-panel">
              <div className="co-panel-kicker">This Week</div>
              <div className="co-panel-title">Leaders</div>
              <div className="co-panel-desc">Ranked by verified reports.</div>

              {allRows.length === 0 && (
                <div style={{ textAlign:'center', padding:'1.5rem 0', color:'var(--text-muted)', fontSize:'0.8rem' }}>
                  No citizens yet.
                </div>
              )}

              {allRows.map((r, i) => {
                const name = r.isMe ? 'You' : `${r.firstName||''} ${r.lastName?.[0] ? r.lastName[0]+'.' : ''}`.trim();
                return (
                  <div key={r.userId||i} className={`co-lb-row${r.isMe ? ' me' : ''}`}>
                    <div className="co-lb-rank">{String(r.rank).padStart(2,'0')}</div>
                    <div className="co-lb-av">{r.initials || name[0]}</div>
                    <div className="co-lb-name">{name}</div>
                    <div className="co-lb-count">{r.weekReports} report{r.weekReports!==1?'s':''}</div>
                  </div>
                );
              })}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
