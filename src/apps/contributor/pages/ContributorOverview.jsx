import { useMemo, useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';
import { useActivities } from '../../../hooks/useActivities';
import { useContributorStats } from '../../../hooks/useContributorStats';
import { useContributorImpact } from '../../../hooks/useContributorImpact';
import { useEvents } from '../../../hooks/useEvents';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import OceanWaveStrip from '../../../components/common/OceanWaveStrip';
import { contributorApi } from '../../../services/api';
import { eventStateMeta, verificationStateMeta } from '../eventMeta';
import MyAreasMap from '../components/MyAreasMap';

/* ── Responsive hook ── */
function useWindowWidth() {
  const [width, setWidth] = useState(window.innerWidth);
  useEffect(() => {
    const fn = () => setWidth(window.innerWidth);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);
  return width;
}

function fmt(ts) {
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function toDateInputValue(date) {
  return date.toISOString().slice(0, 10);
}

function defaultExportRange() {
  const to = new Date();
  const from = new Date();
  from.setMonth(from.getMonth() - 6);
  return { from: toDateInputValue(from), to: toDateInputValue(to) };
}

const emptyStyle = { color:'var(--text-muted)', fontSize:'0.84rem', textAlign:'center', padding:'1.25rem 0' };

const StatePill = ({ label, color }) => (
  <span style={{ padding:'0.18rem 0.55rem', borderRadius:'999px', fontSize:'0.64rem', fontWeight:700,
    background:`${color}1F`, color, whiteSpace:'nowrap', textTransform:'uppercase', flexShrink:0 }}>
    {label}
  </span>
);

const StatusPill = ({ status }) => {
  const m = {
    approved: { bg:'rgba(16,185,129,.12)', color:'var(--success)', label:'Approved' },
    pending:  { bg:'rgba(245,158,11,.12)',  color:'var(--warning)', label:'Pending' },
    rejected: { bg:'rgba(239,68,68,.12)',   color:'var(--danger)', label:'Rejected' },
  };
  const s = m[status] || m.pending;
  return (
    <span style={{ padding:'0.18rem 0.55rem', borderRadius:'999px', fontSize:'0.68rem', fontWeight:700,
      background:s.bg, color:s.color, whiteSpace:'nowrap', textTransform:'uppercase', flexShrink:0 }}>
      {s.label}
    </span>
  );
};

/* ── Injected responsive CSS ── */
const STYLES = `
  .contrib-card { padding: 1.25rem 1.5rem; }
  .contrib-stats { display:grid; grid-template-columns:repeat(auto-fit,minmax(150px,1fr)); gap:1rem; }
  .contrib-hero-actions { display:flex; flex-direction:column; align-items:flex-end; gap:.6rem; }
  .contrib-two-col { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:1rem; align-items:stretch; }
  .contrib-two-col > .contrib-card { height:100%; }
  .contrib-job-badge {
    display:inline-flex; align-items:center; padding:.18rem .55rem; border-radius:999px; font-size:.68rem;
    font-weight:700; background:rgba(46,158,155,.14); color:var(--primary-hover); white-space:nowrap;
    text-transform:uppercase; letter-spacing:.04em; max-width:220px; overflow:hidden; text-overflow:ellipsis;
  }
  @media(max-width:768px){
    .contrib-two-col { grid-template-columns:1fr; }
  }
  .contrib-export-panel { max-width:640px; }
  .contrib-export-head { display:flex; align-items:flex-start; justify-content:space-between; gap:1rem; margin-bottom:1.1rem; }
  .contrib-export-title { margin:0; font-size:.92rem; font-weight:700; color:var(--text-main); }
  .contrib-export-sub { margin:.3rem 0 0; font-size:.78rem; color:var(--text-muted); line-height:1.5; }
  .contrib-export-close {
    flex-shrink:0; width:26px; height:26px; padding:0; border-radius:999px; display:grid; place-items:center;
    background:transparent; border:1px solid var(--border-light); color:var(--text-muted); box-shadow:none;
    font-size:.85rem; line-height:1; cursor:pointer; transition:border-color .2s, color .2s;
  }
  .contrib-export-close:hover { border-color:var(--border-glow); color:var(--text-main); }
  .contrib-export-row { display:flex; flex-wrap:wrap; align-items:flex-end; gap:.9rem; }
  .contrib-export-field { display:flex; flex-direction:column; gap:.35rem; }
  .contrib-export-label { font-size:.66rem; font-weight:700; text-transform:uppercase; letter-spacing:.07em; color:var(--text-muted); }
  .contrib-export-input {
    height:40px; padding:0 .7rem; border-radius:var(--radius-md); border:1px solid var(--border-light);
    background:var(--surface-hover); color:var(--text-main); font-family:var(--font-sans); font-size:.82rem;
    box-shadow:none; transition:border-color .2s, background .2s;
  }
  .contrib-export-error { margin-top:.85rem; font-size:.78rem; color:#ef4444; background:rgba(239,68,68,.08); border-radius:6px; padding:.5rem .7rem; }
  @media(max-width:640px){
    .contrib-export-panel { max-width:none; }
    .contrib-export-row { align-items:stretch; }
    .contrib-export-field { flex:1 1 140px; }
  }
  @media(max-width:768px){
    .contrib-card { padding: 1.15rem 1.25rem; }
    .contrib-stats { grid-template-columns:repeat(2,1fr); gap:0.75rem; }
  }
  @media(max-width:640px){
    .contrib-hero-actions { align-items:flex-start; width:100%; }
  }
  @media(max-width:480px){
    .contrib-card { padding: 1rem; }
    .contrib-stats { grid-template-columns:repeat(2,1fr); gap:0.6rem; }
  }
  .contrib-empty-state {
    display:flex; flex-direction:column; align-items:center; text-align:center;
    padding: 3.5rem 1.5rem; gap:1rem;
  }
  .contrib-empty-icon {
    width:64px; height:64px; border-radius:18px;
    background:linear-gradient(135deg,rgba(46,158,155,.16),rgba(125,231,240,.10));
    display:flex; align-items:center; justify-content:center; font-size:1.8rem;
  }
  .contrib-empty-title { margin:0; font-size:1.05rem; font-weight:700; color:var(--text-main); }
  .contrib-empty-sub {
    margin:0; font-size:0.85rem; color:var(--text-muted); line-height:1.5; max-width:420px;
  }
`;

const Card = ({ children, style, className = '' }) => (
  <div className={`contrib-card ${className}`} style={{
    background:'var(--surface)', border:'1px solid var(--border-light)',
    borderRadius:'var(--radius-lg)', backdropFilter:'blur(16px)',
    fontFamily:'var(--font-sans)', ...style }}>
    {children}
  </div>
);

const CardHead = ({ title, sub }) => (
  <>
    <h2 style={{ margin:'0 0 .2rem', fontSize:'0.95rem', fontWeight:700 }}>{title}</h2>
    <p style={{ margin:'0 0 1rem', fontSize:'0.78rem', color:'var(--text-muted)' }}>{sub}</p>
  </>
);

/* Small uppercase sub-heading used inside a Card, with an optional one-line
   explainer right under it. Kept as one component so every section's label
   style stays in sync instead of being copy-pasted inline per card. */
const SectionLabel = ({ children, hint, style }) => (
  <div style={{ marginBottom: hint ? '0.2rem' : '0.5rem', ...style }}>
    <div style={{ fontSize:'0.72rem', fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'.06em' }}>
      {children}
    </div>
    {hint && <p style={{ margin:'0.15rem 0 0.6rem', fontSize:'0.74rem', color:'var(--text-muted)', lineHeight:1.4 }}>{hint}</p>}
  </div>
);

/* Formats numbers with thousands separators for readability at scale. */
const nf = (n) => Number(n || 0).toLocaleString('en-IN');

/* ── Empty state shown to brand-new contributors instead of a wall of zeros ── */
const NoDataYet = ({ onLog }) => (
  <Card>
    <div className="contrib-empty-state">
      <div className="contrib-empty-icon">📋</div>
      <h3 className="contrib-empty-title">Log your first cleanup to see your impact</h3>
      <p className="contrib-empty-sub">
        Once you submit a report, this space fills in with your impact numbers, what's still
        being tracked, and what changed as a result.
      </p>
      <button
        type="button"
        onClick={onLog}
        style={{
          background:'var(--primary)', border:'none', borderRadius:'999px',
          color:'#fff', fontSize:'0.8rem', fontWeight:700, letterSpacing:'.03em',
          padding:'0.6rem 1.3rem', cursor:'pointer', boxShadow:'none',
          fontFamily:'var(--font-sans)', display:'inline-flex', alignItems:'center', gap:'0.4rem',
          marginTop:'0.4rem',
        }}
      >
        <span>Log a cleanup</span><span aria-hidden="true">→</span>
      </button>
    </div>
  </Card>
);

export default function ContributorOverview() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const navigate = useNavigate();
  const w = useWindowWidth();
  const isMobile = w < 640;

  const { activities, loading: actsLoading } = useActivities();
  const { stats, loading: statsLoading } = useContributorStats();
  const { impact, loading: impactLoading } = useContributorImpact();
  const { events: myEvents, loading: eventsLoading } = useEvents(user?.id);

  const [exportOpen, setExportOpen] = useState(false);
  const [exportRange, setExportRange] = useState(defaultExportRange);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState('');

  async function handleExport() {
    setExporting(true);
    setExportError('');
    try {
      await contributorApi.exportReport(exportRange.from, exportRange.to);
      setExportOpen(false);
    } catch (err) {
      setExportError(err.message || 'Failed to generate report');
    } finally {
      setExporting(false);
    }
  }

  const myActivities = useMemo(() =>
    activities.filter(a => a.contributorId === user?.id), [activities, user]);

  const recent = useMemo(() =>
    [...myActivities].sort((a,b) => new Date(b.timestamp)-new Date(a.timestamp)).slice(0,5),
    [myActivities]);

  // Needs Attention / Impact Stories read the environmental-event model,
  // not the legacy activity status — event_state and verification_state
  // are the vocabulary the spec actually asks for (§11-12), and myEvents
  // is already scoped to this contributor server-side via useEvents(user.id).
  const needsAttention = useMemo(() =>
    [...myEvents]
      .filter(e => e.eventState !== 'addressed' && e.eventState !== 'reassessed')
      .sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [myEvents]);

  const impactStories = useMemo(() =>
    [...myEvents]
      .filter(e => e.eventState === 'addressed')
      .sort((a,b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      .slice(0, 6),
    [myEvents]);

  if (actsLoading || statsLoading || impactLoading || eventsLoading) return <LoadingSpinner />;

  const firstName = user?.firstName || user?.displayName?.split(' ')[0] || 'there';

  // New user = hasn't logged any activity at all yet. Show a single "get started"
  // card instead of a dashboard full of zero-value KPIs.
  const isNewUser = myActivities.length === 0;

  const totalTokens = stats?.totalTokens ?? 0;
  const rank         = stats?.rank        ?? null;
  const topPercent   = stats?.topPercent  ?? null;

  // The five numbers the spec's own "Your Impact" example calls out
  // (spec §22) — sourced from the event model via /api/contributor/impact,
  // not the legacy activities aggregate.
  const impactCards = [
    { label:'Contributions',       value: nf(impact?.contributions ?? myActivities.length),  icon:'📋' },
    { label:'Verified',            value: nf(impact?.verifiedEvents ?? 0),                    icon:'🛡️' },
    { label:'Actions Completed',   value: nf(impact?.actionsCompleted ?? 0), icon:'✅', accent:'#10b981' },
    { label:'Waste Removed',       value: `${nf(impact?.kgRemoved ?? 0)} kg`,                 icon:'♻️' },
    { label:'Locations Affected',  value: nf(impact?.locationsAffected ?? 0),                 icon:'📍' },
  ];

  return (
    <section style={{ display:'flex', flexDirection:'column', gap:'1.25rem', paddingBottom:'2rem', fontFamily:'var(--font-sans)' }}>

      <style>{STYLES}</style>

      {/* ── HERO ── */}
      <div className="contributor-hero">
        <OceanWaveStrip />
        <div className="contributor-hero__content">
          <div className="contributor-hero__kicker">
            <span>Contributor Space</span>
            {user?.jobTitle && <span className="contrib-job-badge" title={user.jobTitle}>{user.jobTitle}</span>}
            <svg className="contributor-hero__mark" viewBox="0 0 136 38" aria-hidden="true">
              <path className="wave-1" d="M1 12c13-11 27-11 40 0s27 11 40 0 27-11 40 0" />
              <path className="wave-2" d="M12 20c13-11 27-11 40 0s27 11 40 0 27-11 40 0" />
              <path className="wave-3" d="M1 28c13-11 27-11 40 0s27 11 40 0 27-11 40 0" />
            </svg>
          </div>
          <h1 className="contributor-hero__title" style={{ fontSize: isMobile ? '1.65rem' : undefined }}>
            Hi {firstName} — the coast is <em>a little cleaner</em><br />because you showed up.
          </h1>
          <p className="contributor-hero__sub">
            Every cleanup you log is verified on-chain and helps BlueMind track where pollution is concentrating.
          </p>
          {!isNewUser && (
            <button
              id="export-report-btn"
              type="button"
              onClick={() => setExportOpen((o) => !o)}
              style={{
                background:'transparent', border:'1px solid var(--border-light)', borderRadius:'999px',
                color:'var(--primary)', fontSize:'0.72rem', fontWeight:700, letterSpacing:'.08em',
                textTransform:'uppercase', padding:'0.5rem 1rem', cursor:'pointer', boxShadow:'none',
                fontFamily:'var(--font-sans)', whiteSpace:'nowrap', transition:'border-color .2s, background .2s',
                marginTop: isMobile ? '0.75rem' : '0.5rem'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.background = 'color-mix(in srgb, var(--primary) 8%, transparent)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-light)'; e.currentTarget.style.background = 'transparent'; }}
            >
              Export field report
            </button>
          )}
        </div>
        <div className="contrib-hero-actions">
          <button id="hero-log-btn" className="contributor-hero__cta" onClick={() => navigate('/contributor/quick-report')}>
            <span>Log a cleanup</span><span aria-hidden="true">→</span>
          </button>
        </div>
      </div>

      {/* ── EXPORT FIELD REPORT PANEL ── */}
      {exportOpen && !isNewUser && (
        <Card className="contrib-export-panel">
          <div className="contrib-export-head">
            <div>
              <h3 className="contrib-export-title">Export field report</h3>
              <p className="contrib-export-sub">Download a PDF summary of your approved cleanups for a date range.</p>
            </div>
            <button
              type="button"
              className="contrib-export-close"
              aria-label="Close export panel"
              onClick={() => { setExportOpen(false); setExportError(''); }}
            >
              ✕
            </button>
          </div>

          <div className="contrib-export-row">
            <div className="contrib-export-field">
              <label htmlFor="export-from" className="contrib-export-label">From</label>
              <input
                id="export-from"
                type="date"
                className="contrib-export-input"
                value={exportRange.from}
                max={exportRange.to}
                onChange={(e) => setExportRange((r) => ({ ...r, from: e.target.value }))}
                style={{ colorScheme: isLight ? 'light' : 'dark' }}
              />
            </div>
            <div className="contrib-export-field">
              <label htmlFor="export-to" className="contrib-export-label">To</label>
              <input
                id="export-to"
                type="date"
                className="contrib-export-input"
                value={exportRange.to}
                min={exportRange.from}
                max={toDateInputValue(new Date())}
                onChange={(e) => setExportRange((r) => ({ ...r, to: e.target.value }))}
                style={{ colorScheme: isLight ? 'light' : 'dark' }}
              />
            </div>
            <button type="button" className="ma-cta" disabled={exporting} onClick={handleExport} style={{ opacity: exporting ? 0.7 : 1, cursor: exporting ? 'default' : 'pointer' }}>
              <span>{exporting ? 'Generating…' : 'Download PDF'}</span><span aria-hidden="true">{exporting ? '⏳' : '↓'}</span>
            </button>
          </div>

          {exportError && <div className="contrib-export-error">{exportError}</div>}
        </Card>
      )}

      {isNewUser ? (
        /* ── NEW USER: single friendly call-to-action instead of a wall of zero KPIs ── */
        <NoDataYet onLog={() => navigate('/contributor/quick-report')} />
      ) : (
        <>
          {/* ── YOUR IMPACT ── */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'0.4rem' }}>
            <SectionLabel style={{ marginBottom:0 }}>Your Impact</SectionLabel>
            {rank && (
              <span style={{ fontSize:'0.74rem', color:'var(--text-muted)' }}>
                Rank #{rank}{topPercent ? ` · Top ${topPercent}%` : ''} · {nf(totalTokens)} OCEAN tokens
              </span>
            )}
          </div>
          <div className="contrib-stats">
            {impactCards.map(({ label, value, icon, accent }) => (
              <Card key={label} style={{ position:'relative', overflow:'hidden',
                transition:'border-color .2s,transform .2s', cursor:'default' }}
                onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--border-glow)';e.currentTarget.style.transform='translateY(-2px)';}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border-light)';e.currentTarget.style.transform='translateY(0)';}}
              >
                <div style={{ position:'absolute', top:'0.75rem', right:'0.75rem', fontSize:'1.6rem', opacity:.22 }}>{icon}</div>
                <div style={{ fontSize:'0.68rem', fontWeight:600, textTransform:'uppercase', letterSpacing:'.08em', color:'var(--text-muted)', marginBottom:'0.35rem' }}>{label}</div>
                <div style={{ fontSize: isMobile ? '1.5rem' : '1.9rem', fontWeight:700, color:accent||'var(--primary-hover)', lineHeight:1.1 }}>{value}</div>
              </Card>
            ))}
          </div>

          {/* ── NEEDS ATTENTION ──
              Environmental events tied to this contributor's reports that
              Blue Mind hasn't marked addressed yet (spec §22). */}
          <Card>
            <CardHead title="Needs Attention" sub="Open issues from your reports that Blue Mind is still tracking" />
            {needsAttention.length === 0 ? (
              <p style={emptyStyle}>Nothing open right now — everything you've reported has been addressed.</p>
            ) : (
              <div style={{ display:'flex', flexDirection:'column' }}>
                {needsAttention.slice(0, 6).map((e, i, arr) => {
                  const stateMeta = eventStateMeta(e.eventState);
                  const verMeta = verificationStateMeta(e.verificationState);
                  const subjectLabel = e.subjects?.map(s => s.label).join(', ') || 'Unclassified';
                  return (
                    <Link key={e.eventId} to={`/contributor/events/${e.eventId}`}
                      style={{ display:'flex', gap:'0.6rem', padding:'0.7rem 0', textDecoration:'none', color:'inherit',
                      borderBottom: i < arr.length - 1 ? '1px solid var(--border-light)' : 'none' }}>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontWeight:600, fontSize:'0.83rem' }}>{subjectLabel}</div>
                        <div style={{ fontSize:'0.72rem', color:'var(--text-muted)', marginTop:'0.15rem' }}>
                          {e.locationLabel || 'Location unspecified'} · {fmt(e.occurredAt || e.createdAt)}
                        </div>
                      </div>
                      <div style={{ display:'flex', flexDirection:'column', gap:'0.3rem', alignItems:'flex-end', flexShrink:0 }}>
                        <StatePill label={stateMeta.label} color={stateMeta.color} />
                        <StatePill label={verMeta.label} color={verMeta.color} />
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </Card>

          {/* ── RECENT ACTIVITY ── */}
          <Card>
            <CardHead title="Recent Activity" sub={`Your last ${Math.min(5, recent.length)} submissions`} />
            <div style={{ display:'flex', flexDirection:'column' }}>
              {recent.map((act, i) => (
                <div key={act.id} style={{ display:'flex', gap:'0.6rem', padding:'0.75rem 0',
                  borderBottom: i < recent.length-1 ? '1px solid var(--border-light)' : 'none' }}>
                  <div style={{ width:'34px', height:'34px', borderRadius:'9px', flexShrink:0,
                    background: act.status==='approved'?'rgba(16,185,129,.12)':act.status==='rejected'?'rgba(239,68,68,.12)':'rgba(245,158,11,.12)',
                    display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.88rem' }}>
                    {act.status==='approved'?'✓':act.status==='rejected'?'✕':'⧗'}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', gap:'0.4rem', alignItems:'flex-start', flexWrap:'nowrap' }}>
                      <span style={{ fontWeight:600, fontSize:'0.83rem', flex:1, wordBreak:'break-word', lineHeight: 1.3 }}>
                        {act.location}
                      </span>
                      <StatusPill status={act.status} />
                    </div>
                    <div style={{ fontSize:'0.72rem', color:'var(--text-muted)', marginTop:'0.15rem' }}>
                      {fmt(act.timestamp)} · {act.quantity} kg · {act.volunteers} vol.
                    </div>
                    {act.status==='rejected' && act.reviewNote && (
                      <div style={{ marginTop:'0.3rem', fontSize:'0.72rem', color:'#f87171',
                        background:'rgba(239,68,68,.08)', borderRadius:'6px', padding:'0.28rem 0.5rem' }}>
                        {act.reviewNote}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {myActivities.length > 5 && (
              <button id="view-all-btn" onClick={() => navigate('/contributor/my-activities')}
                style={{ marginTop:'0.75rem', width:'100%', background:'transparent',
                  border:'1px solid var(--border-light)', borderRadius:'var(--radius-md)',
                  color:'var(--primary)', fontSize:'0.82rem', fontWeight:600, padding:'0.5rem',
                  cursor:'pointer', boxShadow:'none', transition:'border-color .2s,background .2s',
                  fontFamily:'var(--font-sans)' }}
                onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--primary)';e.currentTarget.style.background='color-mix(in srgb, var(--primary) 8%, transparent)';}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border-light)';e.currentTarget.style.background='transparent';}}
              >
                View all {myActivities.length} activities →
              </button>
            )}
          </Card>

          {/* ── YOUR AREAS ── */}
          <Card>
            <CardHead title="Your Areas" sub="Where your reports and cleanups are located, colored by their current status" />
            <MyAreasMap events={myEvents} />
          </Card>

          {/* ── IMPACT STORIES ──
              "The debris you reported on June 12 was removed on June 16"
              (spec §22-23) — the closure loop the rest of the dashboard
              doesn't otherwise show. */}
          <Card>
            <CardHead title="Impact Stories" sub="What happened after you reported it" />
            {impactStories.length === 0 ? (
              <p style={emptyStyle}>No resolved reports yet — check back once one of your reports is addressed.</p>
            ) : (
              <div style={{ display:'flex', flexDirection:'column' }}>
                {impactStories.map((e, i, arr) => {
                  const subjectLabel = e.subjects?.map(s => s.label).join(', ') || 'issue';
                  return (
                    <Link key={e.eventId} to={`/contributor/events/${e.eventId}`}
                      style={{ display:'flex', gap:'0.6rem', padding:'0.7rem 0', textDecoration:'none', color:'inherit',
                      borderBottom: i < arr.length - 1 ? '1px solid var(--border-light)' : 'none' }}>
                      <div style={{ width:'34px', height:'34px', borderRadius:'9px', flexShrink:0,
                        background:'rgba(16,185,129,.12)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.9rem' }}>✓</div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:'0.83rem', color:'var(--text-main)', lineHeight:1.4 }}>
                          The <strong>{subjectLabel}</strong> you reported at {e.locationLabel || 'this location'} has been addressed.
                        </div>
                        <div style={{ fontSize:'0.72rem', color:'var(--text-muted)', marginTop:'0.2rem' }}>{fmt(e.updatedAt)}</div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </Card>
        </>
      )}

    </section>
  );
}
