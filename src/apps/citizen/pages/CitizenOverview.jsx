import { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useCitizenStats, useCitizenLeaderboard, useCitizenFeed } from '../../../hooks/useCitizen';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import SubmitActivity from '../../contributor/pages/SubmitActivity';
import { Link } from 'react-router-dom';

/* ── helpers ── */
function timeAgo(ts) {
  const diff = (Date.now() - new Date(ts)) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}
function memberSince(ts) {
  if (!ts) return 'recently';
  return new Date(ts).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
}
function getFeedStatus(item) {
  const value = String(item.status || item.verificationStatus || item.activityStatus || 'pending')
    .trim()
    .toLowerCase();

  if (['approved', 'verified', 'complete', 'completed'].includes(value)) {
    return { label: 'Verified', variant: 'verified' };
  }
  if (['rejected', 'declined', 'failed'].includes(value)) {
    return { label: 'Rejected', variant: 'rejected' };
  }
  if (value === 'pending' || value === 'in_review' || value === 'under_review') {
    return { label: 'Pending', variant: 'pending' };
  }

  return {
    label: value.replace(/[_-]/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()),
    variant: 'pending',
  };
}

/* ── injected styles ──
   Bluemind ocean theme: Instrument Sans / Instrument Serif italic, the
   navy → ocean → teal ramp, glass card containers, wave motif. All the
   original --primary / --surface / --border-light etc. tokens are kept
   (nothing downstream had to change) — they're just redefined locally
   to the brand palette, scoped to .co-root so the rest of the app is
   untouched. */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600&family=Instrument+Serif:ital@0;1&display=swap');

  .co-root {
    --font-sans: 'Instrument Sans', ui-sans-serif, system-ui, -apple-system, sans-serif;
    --font-display: 'Instrument Sans', ui-sans-serif, system-ui, -apple-system, sans-serif;
    --font-mono: 'Instrument Sans', ui-sans-serif, system-ui, -apple-system, sans-serif;
    --font-serif: 'Instrument Serif', ui-serif, Georgia, serif;

    --primary: #2E9E9B;
    --primary-hover: #24827F;
    --secondary: #14669E;
    --warning: #C6821E;
    --success: #2E9E9B;

    --surface: #FFFFFF;
    --surface-hover: #F4F9FC;
    --border-light: #E4EDF4;
    --border-glow: #7FC3E8;

    --text-main: #0A1E30;
    --text-muted: #7B8FA1;

    --radius-lg: 14px;
    --radius-md: 10px;

    font-family: var(--font-sans);
    position: relative;
  }

  /* Keep Citizen Space on the same midnight-ocean system as Login and
     Signup. These variables intentionally live beneath the page root so
     the dashboard can still offer its light theme without leaking styles
     into the rest of the application. */
  [data-theme="dark"] .co-root,
  .force-dark .co-root {
    --primary: #6FC9C4;
    --primary-hover: #A9D8F0;
    --secondary: #0B82C9;
    --warning: #F8B84E;
    --success: #6FC9C4;

    --surface: linear-gradient(180deg, rgba(255,255,255,.055), rgba(255,255,255,.02));
    --surface-hover: rgba(255,255,255,.055);
    --border-light: rgba(160,210,240,.18);
    --border-glow: #7FC3E8;

    --text-main: #F2F7FA;
    --text-muted: rgba(233,242,247,.68);
  }

  [data-theme="dark"] .co-hero,
  [data-theme="dark"] .co-stat,
  [data-theme="dark"] .co-panel,
  .force-dark .co-hero,
  .force-dark .co-stat,
  .force-dark .co-panel {
    box-shadow: 0 24px 48px -30px rgba(3,12,22,.65);
    backdrop-filter: blur(18px) saturate(1.3);
    -webkit-backdrop-filter: blur(18px) saturate(1.3);
  }

  [data-theme="dark"] .co-hero-wave { opacity: .72; }
  [data-theme="dark"] .co-badge.earned,
  .force-dark .co-badge.earned { background: rgba(46,158,155,.12); }

  /* wave signature strip */
  .co-wavebar { position: absolute !important; left: 0; bottom: 0; width: 100%; height: 80px; overflow: hidden; background: var(--surface-hover); z-index: 0 !important; pointer-events: none; }
  .co-wavebar svg { position: absolute; left: 0; bottom: -1px; width: 200%; max-width: none; height: 100px; }
  .co-wavebar .l1 { fill: var(--primary); opacity: .18; animation: coWaveL 32s linear infinite; }
  .co-wavebar .l2 { fill: var(--secondary); opacity: .14; animation: coWaveR 44s linear infinite; }
  .co-wavebar .l3 { fill: var(--border-glow); opacity: .16; animation: coWaveL 20s linear infinite; }
  @keyframes coWaveL { from { transform: translateX(0); } to { transform: translateX(-50%); } }
  @keyframes coWaveR { from { transform: translateX(-50%); } to { transform: translateX(0); } }
  @media (prefers-reduced-motion: reduce) {
    .co-wavebar .l1, .co-wavebar .l2, .co-wavebar .l3 { animation: none; }
  }

  /* hero */
  .co-hero {
    position: relative; overflow: hidden;
    display: flex; align-items: flex-end;
    justify-content: space-between; gap: 2rem; flex-wrap: wrap;
    background: var(--surface);
    border: 1px solid var(--border-light);
    border-radius: var(--radius-lg);
    padding: 2rem 2.2rem;
    margin-bottom: 1.4rem;
    box-shadow: 0 1px 2px rgba(10,30,50,.04);
  }
  .co-hero > * { position: relative; z-index: 1; }
  .co-hero-wave { position: absolute; right: -3%; bottom: -22%; width: min(42%, 340px); opacity: .5; pointer-events: none; z-index: 0; }
  .co-eyebrow {
    font-size: 0.62rem; letter-spacing: 0.24em; text-transform: uppercase;
    color: var(--primary); margin-bottom: 0.8rem; opacity: 0.85;
    font-family: var(--font-mono); font-weight: 500;
  }
  .co-hero-kicker { display: flex; align-items: center; gap: 0.8rem; }
  .co-hero-kicker .co-eyebrow { margin-bottom: 0.8rem; }
  .co-heading-wave {
    width: 124px; height: 34px; margin-bottom: 0.8rem; overflow: visible;
    color: var(--border-glow); opacity: .72;
  }
  .co-heading-wave path { fill: none; stroke: currentColor; stroke-linecap: round; }
  .co-heading-wave .wave-1 { stroke-width: 1.15; opacity: .8; }
  .co-heading-wave .wave-2 { stroke: var(--primary); stroke-width: 1.35; opacity: .6; }
  .co-heading-wave .wave-3 { stroke-width: 1; opacity: .48; }
  .co-h1 {
    font-size: 1.9rem; font-weight: 500; line-height: 1.25;
    color: var(--text-main); margin: 0; max-width: 540px;
    font-family: var(--font-display); letter-spacing: -.028em;
  }
  .co-h1 em { font-style: italic; font-family: var(--font-serif); font-weight: 400; color: var(--primary); }
  .co-hero-sub {
    font-size: 0.88rem; color: var(--text-muted);
    margin-top: 0.7rem; max-width: 460px; line-height: 1.7;
  }
  /* Chrome (colors/shape/font/hover) comes from the shared .co-cta rule in
     styles.css — same button as the contributor space and My Activities.
     Only page-specific spacing is set here. */
  .co-cta { cursor: pointer; flex-shrink: 0; margin-bottom: 2.75rem; }

  /* stat strip */
  .co-stats {
    display: grid; grid-template-columns: repeat(4,1fr);
    gap: 1rem; margin-bottom: 1.4rem;
  }
  .co-stat {
    background: var(--surface); border: 1px solid var(--border-light);
    border-radius: var(--radius-lg); padding: 1.4rem 1.6rem;
    box-shadow: 0 1px 2px rgba(10,30,50,.04);
    transition: border-color 0.2s, transform 0.2s;
  }
  .co-stat:hover { border-color: var(--border-glow); transform: translateY(-2px); }
  .co-stat-label {
    font-size: 0.62rem; letter-spacing: 0.16em; text-transform: uppercase;
    color: var(--text-muted); font-family: var(--font-mono); font-weight: 600;
  }
  .co-stat-value {
    font-size: 1.8rem; font-weight: 500; color: var(--primary);
    margin-top: 0.4rem; line-height: 1; letter-spacing: -0.02em;
    font-family: var(--font-display);
  }
  .co-stat-value.amber { color: var(--warning); }
  .co-stat-desc { font-size: 0.72rem; color: var(--text-muted); margin-top: 0.3rem; font-family: var(--font-mono); }

  /* tabs */
  .co-tabs {
    display: flex; gap: 4px; background: var(--surface);
    border: 1px solid var(--border-light); border-radius: var(--radius-lg);
    padding: 5px; margin-bottom: 1.4rem;
  }
  .co-tab {
    flex: 1; border: none !important; border-radius: var(--radius-md) !important;
    padding: 0.6rem 1.2rem; font-size: 0.85rem; font-weight: 600; cursor: pointer;
    transition: all 0.2s;
    box-shadow: none !important; transform: none !important; filter: none !important;
    font-family: var(--font-sans);
  }
  .co-tab.active {
    background: linear-gradient(135deg, var(--primary), var(--secondary)) !important;
    color: #fff !important;
    box-shadow: 0 0 16px rgba(46,158,155,0.22) !important;
  }
  .co-tab:not(.active) {
    background: transparent !important; color: var(--text-muted) !important;
  }
  .co-tab:not(.active):hover { background: rgba(46,158,155,0.06) !important; color: var(--text-main) !important; }

  /* main grid */
  .co-grid { display: grid; grid-template-columns: 1.65fr 1fr; gap: 1.2rem; }
  .co-right { display: flex; flex-direction: column; gap: 1.2rem; }

  /* panel */
  .co-panel {
    background: var(--surface); border: 1px solid var(--border-light);
    border-radius: var(--radius-lg); padding: 1.6rem 1.8rem;
    box-shadow: 0 1px 2px rgba(10,30,50,.04);
  }
  .co-panel-kicker {
    font-size: 0.58rem; letter-spacing: 0.22em; text-transform: uppercase;
    color: var(--primary); opacity: 0.8; font-family: var(--font-mono); font-weight: 600;
  }
  .co-panel-title { font-size: 1.1rem; font-weight: 500; color: var(--text-main); margin-top: 0.3rem; font-family: var(--font-display); letter-spacing: -.015em; }
  .co-panel-desc  { font-size: 0.76rem; color: var(--text-muted); margin-top: 0.2rem; margin-bottom: 1.2rem; }

  /* feed */
  .co-feed-row { display: flex; gap: 1rem; padding: 0.9rem 0; border-bottom: 1px solid var(--border-light); }
  .co-feed-row:last-child { border-bottom: none; padding-bottom: 0; }
  .co-feed-time { font-size: 0.62rem; color: var(--text-muted); width: 52px; flex-shrink: 0; padding-top: 2px; line-height: 1.4; font-family: var(--font-mono); }
  .co-feed-text { font-size: 0.84rem; color: var(--text-main); line-height: 1.5; font-family: var(--font-sans); }
  .co-feed-text b { font-weight: 600; color: var(--primary-hover); }
  .co-feed-meta { display: flex; align-items: center; gap: 0.6rem; margin-top: 0.35rem; font-size: 0.65rem; color: var(--text-muted); flex-wrap: wrap; font-family: var(--font-mono); }
  .co-pill {
    font-size: 0.6rem; font-weight: 700; letter-spacing: 0.06em;
    text-transform: uppercase; padding: 0.15rem 0.55rem;
    border-radius: 20px; border: none;
    box-shadow: none !important; transform: none !important; filter: none !important;
    background: transparent !important; font-family: var(--font-mono);
  }
  .co-pill.pending  { background: rgba(198,130,30,0.14) !important; color: var(--warning) !important; }
  .co-pill.verified { background: rgba(46,158,155,0.14) !important; color: var(--success) !important; }
  .co-pill.rejected { background: rgba(239,68,68,0.14) !important; color: #EF4444 !important; }

  /* badges */
  .co-badges { display: grid; grid-template-columns: repeat(4,1fr); gap: 8px; }
  .co-badge {
    background: var(--surface-hover); border: 1px solid var(--border-light);
    border-radius: var(--radius-md); padding: 0.9rem 0.5rem; text-align: center;
    transition: border-color 0.2s, transform 0.2s;
  }
  .co-badge.earned { border-color: rgba(46,158,155,0.32); background: rgba(46,158,155,0.06); }
  .co-badge.earned:hover { transform: translateY(-2px); border-color: var(--border-glow); }
  .co-badge-icon {
    width: 36px; height: 36px; border-radius: 50%; margin: 0 auto 0.5rem;
    display: flex; align-items: center; justify-content: center; font-size: 0.75rem;
    border: 1px solid var(--border-light); color: var(--text-muted); background: var(--surface);
  }
  .co-badge.earned .co-badge-icon { border-color: var(--border-glow); color: var(--primary); box-shadow: 0 0 10px rgba(46,158,155,0.16); }
  .co-badge-name  { font-size: 0.68rem; font-weight: 600; color: var(--text-main); line-height: 1.3; font-family: var(--font-sans); }
  .co-badge-status { font-size: 0.58rem; color: var(--text-muted); margin-top: 0.2rem; text-transform: uppercase; letter-spacing: 0.06em; font-family: var(--font-mono); }
  .co-badge.earned .co-badge-status { color: var(--primary); opacity: 0.8; }

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
  .co-lb-row.me .co-lb-av { background: rgba(46,158,155,0.14); border-color: var(--border-glow); color: var(--primary); }
  .co-lb-name { flex: 1; font-size: 0.82rem; color: var(--text-main); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .co-lb-row.me .co-lb-name { color: var(--primary-hover); font-weight: 600; }
  .co-lb-count { font-size: 0.7rem; color: var(--text-muted); flex-shrink: 0; font-family: var(--font-mono); }

  /* toast */
  .co-toast {
    position: fixed; top: 1rem; right: 1rem; z-index: 2000;
    background: rgba(10,42,71,0.95); border: 1px solid rgba(46,158,155,0.35);
    color: #fff; padding: 0.8rem 1rem; border-radius: var(--radius-md);
    font-weight: 600; font-size: 0.88rem; backdrop-filter: blur(10px);
    box-shadow: 0 16px 40px rgba(4,18,31,0.3);
    font-family: var(--font-sans);
  }

  /* responsive */
  @media (max-width: 900px) {
    .co-grid  { grid-template-columns: 1fr; }
    .co-stats { grid-template-columns: repeat(2,1fr); }
    .co-h1    { font-size: 1.5rem; }
  }
  @media (max-width: 520px) {
    .co-heading-wave { width: 92px; }
    .co-badges { grid-template-columns: repeat(2,1fr); }
    .co-stat   { padding: 1rem 1.1rem; }
    .co-stat-value { font-size: 1.4rem; }
    .co-panel  { padding: 1.2rem; }
    .co-hero   { padding: 1.4rem; }
    .co-cta    { align-self: flex-start; margin-bottom: 2.4rem; }
  }

  /* empty state — brand-new citizens instead of a wall of zeros */
  .co-empty-state {
    display: flex; flex-direction: column; align-items: center; text-align: center;
    padding: 3.5rem 1.5rem; gap: 1rem;
  }
  .co-empty-icon {
    width: 64px; height: 64px; border-radius: 18px;
    background: linear-gradient(135deg, rgba(46,158,155,.16), rgba(125,231,240,.10));
    display: flex; align-items: center; justify-content: center; font-size: 1.8rem;
  }
  .co-empty-title { margin: 0; font-size: 1.05rem; font-weight: 700; color: var(--text-main); font-family: var(--font-display); }
  .co-empty-sub { margin: 0; font-size: 0.85rem; color: var(--text-muted); line-height: 1.5; max-width: 420px; }
`;

/* ── Empty state shown to brand-new citizens instead of a wall of zeros ── */
const NoDataYet = () => (
  <div className="co-panel">
    <div className="co-empty-state">
      <div className="co-empty-icon">📋</div>
      <h3 className="co-empty-title">Submit your first report to unlock your activity feed</h3>
      <p className="co-empty-sub">
        Once your first report is logged, this space fills in with the community feed, your badges,
        and where you rank among nearby citizens.
      </p>
      <Link to="/citizen/submit" id="citizen-submit-empty" className="co-cta" style={{ alignSelf: 'center', marginBottom: 0, marginTop: '0.4rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
        <span>Submit a report</span><span aria-hidden="true">→</span>
      </Link>
    </div>
  </div>
);

export default function CitizenOverview() {
  const { user } = useAuth();
  const { stats, loading: sL } = useCitizenStats();
  const { leaderboard, myRow, loading: lL } = useCitizenLeaderboard();
  const { feed, loading: fL } = useCitizenFeed(6);
  const [tab, setTab] = useState('overview');
  const [toast, setToast] = useState('');

  if (sL || lL || fL) return <LoadingSpinner />;

  const s = stats || {};
  const badges = s.badges || [];
  const earned = badges.filter(b => b.earned);
  const lbRows = leaderboard || [];
  const allRows = [...lbRows, ...(myRow && !lbRows.some(r => r.isMe) ? [myRow] : [])];

  const firstName = user?.firstName || user?.displayName?.split(' ')[0] || 'there';
  const sinceLabel = memberSince(s.memberSince);
  const isNewUser = (s.totalReports || 0) === 0;

  return (
    <div className="co-root">
      <style>{STYLES}</style>

      {toast && <div className="co-toast">{toast}</div>}

      {/* ── Hero ── */}
      <div className="co-hero">
        {/* ── wave signature strip ── */}
        <div className="co-wavebar" aria-hidden="true">
          <svg className="l1" viewBox="0 0 2400 120" preserveAspectRatio="none">
            <path d="M0,50 Q300,20 600,50 T1200,50 T1800,50 T2400,50 L2400,120 L0,120 Z" />
          </svg>
          <svg className="l2" viewBox="0 0 2400 120" preserveAspectRatio="none">
            <path d="M0,66 Q300,90 600,66 T1200,66 T1800,66 T2400,66 L2400,120 L0,120 Z" />
          </svg>
          <svg className="l3" viewBox="0 0 2400 120" preserveAspectRatio="none">
            <path d="M0,80 Q150,96 300,80 T600,80 T900,80 T1200,80 T1500,80 T1800,80 T2100,80 T2400,80 L2400,120 L0,120 Z" />
          </svg>
        </div>

        <svg className="co-hero-wave" viewBox="0 0 400 200" fill="none" aria-hidden="true">
          <path d="M0,150 Q50,110 100,150 T200,150 T300,150 T400,150" stroke="var(--primary)" strokeWidth="2" opacity=".5" />
          <path d="M0,175 Q50,140 100,175 T200,175 T300,175 T400,175" stroke="var(--secondary)" strokeWidth="2" opacity=".35" />
          <path d="M0,125 Q50,90 100,125 T200,125 T300,125 T400,125" stroke="var(--border-glow)" strokeWidth="2" opacity=".4" />
        </svg>
        <div>
          <div className="co-hero-kicker">
            <div className="co-eyebrow">Citizen Space</div>
            <svg className="co-heading-wave" viewBox="0 0 136 38" aria-hidden="true">
              <path className="wave-1" d="M1 12c13-11 27-11 40 0s27 11 40 0 27-11 40 0" />
              <path className="wave-2" d="M12 20c13-11 27-11 40 0s27 11 40 0 27-11 40 0" />
              <path className="wave-3" d="M1 28c13-11 27-11 40 0s27 11 40 0 27-11 40 0" />
            </svg>
          </div>
          <h1 className="co-h1">
            Hi {firstName} — the coast is{' '}
            <em>a little cleaner</em> because you showed up.
          </h1>
          <p className="co-hero-sub">
            {s.totalReports || 0} report{s.totalReports !== 1 ? 's' : ''} logged since {sinceLabel}.
            Every entry feeds the community map BlueMind uses to track where pollution is concentrating.
          </p>
        </div>
        <Link to="/citizen/submit" id="citizen-submit-hero" className="co-cta">
          <span>Submit a report</span><span aria-hidden="true">→</span>
        </Link>
      </div>

      {isNewUser ? (
        /* ── NEW USER: single friendly call-to-action instead of a wall of zero stats ── */
        <NoDataYet />
      ) : (
        <>
      {/* ── Stat strip ── */}
      <div className="co-stats">
        {[
          { label: 'Reports', value: s.totalReports || 0, sub: `since ${sinceLabel}`, cls: '' },
          { label: 'Waste logged', value: `${Number(s.totalKg || 0).toFixed(1)} kg`, sub: 'verified + pending', cls: '' },
          { label: 'Badges earned', value: `${earned.length} / ${badges.length || 8}`, sub: badges.find(b => !b.earned)?.title || 'All earned!', cls: 'amber' },
          { label: 'City rank', value: s.cityRank ? `#${s.cityRank}` : '—', sub: lbRows.length ? `of ${lbRows.length} citizens` : 'not ranked yet', cls: '' },
        ].map(({ label, value, sub, cls }) => (
          <div key={label} className="co-stat">
            <div className="co-stat-label">{label}</div>
            <div className={`co-stat-value${cls ? ` ${cls}` : ''}`}>{value}</div>
            <div className="co-stat-desc">{sub}</div>
          </div>
        ))}
      </div>
      {/* ══ Overview tab ══ */}
      {tab === 'overview' && (
        <div className="co-grid">

          {/* ── Feed (left) ── */}
          <div className="co-panel">
            <div className="co-panel-kicker">Community Feed</div>
            <div className="co-panel-title">Latest reports</div>
            <div className="co-panel-desc">Real-time submissions from citizens near you.</div>

            {feed.length === 0 && (
              <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-muted)', fontSize: '0.84rem' }}>
                No reports yet — be the first!
              </div>
            )}

            {feed.slice(0, 6).map((item, i) => {
              const name = `${item.firstName || ''} ${item.lastName?.[0] ? item.lastName[0] + '.' : ''}`.trim();
              const status = getFeedStatus(item);
              return (
                <div key={item.id || i} className="co-feed-row">
                  <div className="co-feed-time">{timeAgo(item.submittedAt)}</div>
                  <div>
                    <div className="co-feed-text">
                      <b>{name}</b> logged a cleanup at {item.location}
                    </div>
                    <div className="co-feed-meta">
                      {item.quantity > 0 && <span>{item.quantity} kg</span>}
                      {item.volunteers > 0 && <span>· {item.volunteers} vol.</span>}
                      <span className={`co-pill ${status.variant}`}>{status.label}</span>
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
                  ? <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '1.5rem 0', color: 'var(--text-muted)', fontSize: '0.8rem' }}>No badges yet.</div>
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
                <div style={{ textAlign: 'center', padding: '1.5rem 0', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                  No citizens yet.
                </div>
              )}

              {allRows.map((r, i) => {
                const name = r.isMe ? 'You' : `${r.firstName || ''} ${r.lastName?.[0] ? r.lastName[0] + '.' : ''}`.trim();
                return (
                  <div key={r.userId || i} className={`co-lb-row${r.isMe ? ' me' : ''}`}>
                    <div className="co-lb-rank">{String(r.rank).padStart(2, '0')}</div>
                    <div className="co-lb-av">{r.initials || name[0]}</div>
                    <div className="co-lb-name">{name}</div>
                    <div className="co-lb-count">{r.weekReports} report{r.weekReports !== 1 ? 's' : ''}</div>
                  </div>
                );
              })}
            </div>

          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
}
