import { useMemo, useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ClipboardList, ShieldCheck, CheckCircle2, Recycle, MapPin, TrendingUp, TrendingDown, Bell, AlertCircle, Calendar, ChevronRight, Maximize, Activity, Clock, XCircle, BottleWine, Wrench, Trash2, GlassWater, Leaf, Droplets } from 'lucide-react';
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

function fmtDateTime(ts) {
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return '—';
  const date = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  const time = d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });
  return `${date}, ${time}`;
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

const activityStatusMeta = {
  approved: { bg:'rgba(16,185,129,.12)', color:'var(--success)', label:'Approved', Icon: CheckCircle2 },
  pending:  { bg:'rgba(245,158,11,.12)',  color:'var(--warning)', label:'Pending',  Icon: Clock },
  rejected: { bg:'rgba(239,68,68,.12)',   color:'var(--danger)', label:'Rejected',  Icon: XCircle },
};

// One icon per pollution_waste subject code (spec §7 taxonomy) so an
// impact story reads at a glance as "what kind of waste" rather than
// requiring the label text to carry that on its own.
const wasteCodeMeta = {
  plastic:       { Icon: BottleWine,  bg:'rgba(16,185,129,.12)', color:'var(--success)' },
  metal:         { Icon: Wrench,      bg:'rgba(37,99,235,.12)',  color:'#2563eb' },
  glass:         { Icon: GlassWater,  bg:'rgba(6,182,212,.12)',  color:'#06b6d4' },
  organic:       { Icon: Leaf,        bg:'rgba(101,163,13,.12)', color:'#65a30d' },
  microplastics: { Icon: Droplets,    bg:'rgba(20,184,166,.12)', color:'#14b8a6' },
  mixed_waste:   { Icon: Trash2,      bg:'var(--surface-hover)', color:'var(--text-muted)' },
};
const defaultWasteMeta = { Icon: Trash2, bg:'var(--surface-hover)', color:'var(--text-muted)' };

const StatusPill = ({ status }) => {
  const s = activityStatusMeta[status] || activityStatusMeta.pending;
  const { Icon } = s;
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:'0.3rem', padding:'0.3rem 0.7rem',
      borderRadius:'999px', fontSize:'0.68rem', fontWeight:700,
      background:s.bg, color:s.color, whiteSpace:'nowrap', textTransform:'uppercase', flexShrink:0 }}>
      <Icon size={12} strokeWidth={2.5} />
      {s.label}
    </span>
  );
};

/* ── Injected responsive CSS ── */
const STYLES = `
  .contrib-card { padding: 1.25rem 1.5rem; }
  .contrib-stats { display:grid; grid-template-columns:repeat(auto-fit,minmax(168px,1fr)); gap:1rem; }
  .kpi-card { display:flex; flex-direction:column; gap:.7rem; padding:1.35rem 1.4rem; position:relative; overflow:hidden; }
  .kpi-icon { width:44px; height:44px; border-radius:999px; display:flex; align-items:center; justify-content:center; flex-shrink:0; position:relative; z-index:1; }
  .kpi-label { position:relative; z-index:1; font-size:.7rem; font-weight:700; text-transform:uppercase; letter-spacing:.08em; color:var(--text-muted); }
  .kpi-value-row { position:relative; z-index:1; display:flex; align-items:baseline; gap:.3rem; }
  .kpi-value { font-size:1.85rem; font-weight:800; line-height:1.1; }
  .kpi-value-unit { font-size:.95rem; font-weight:600; color:var(--text-muted); }
  .kpi-sub { position:relative; z-index:1; font-size:.76rem; color:var(--text-muted); margin-top:-.4rem; }
  .kpi-trend { position:relative; z-index:1; align-self:flex-start; display:inline-flex; align-items:center; gap:.3rem; padding:.28rem .6rem; border-radius:999px; font-size:.72rem; font-weight:700; }
  @media(max-width:768px){
    .kpi-card { padding:1.1rem 1.2rem; }
    .kpi-value { font-size:1.55rem; }
  }
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
  .needs-attn-head { display:flex; align-items:flex-start; gap:0.9rem; margin-bottom:0.9rem; }
  .needs-attn-bell {
    position:relative; flex-shrink:0; width:48px; height:48px; border-radius:999px;
    background:rgba(37,99,235,0.1); color:var(--primary); display:flex; align-items:center; justify-content:center;
  }
  .needs-attn-bell::after {
    content:''; position:absolute; top:2px; right:2px; width:10px; height:10px; border-radius:999px;
    background:#ef4444; border:2px solid var(--surface);
  }
  .needs-attn-title-row { display:flex; align-items:center; gap:0.5rem; flex-wrap:wrap; }
  .needs-attn-count {
    display:inline-flex; align-items:center; gap:0.25rem; padding:0.15rem 0.5rem; border-radius:999px;
    background:rgba(239,68,68,0.12); color:#ef4444; font-size:0.72rem; font-weight:700;
  }
  .needs-attn-row {
    display:flex; align-items:center; gap:0.75rem; padding:0.85rem 0; text-decoration:none; color:inherit;
  }
  .needs-attn-icon {
    flex-shrink:0; width:40px; height:40px; border-radius:10px; background:rgba(37,99,235,0.1);
    color:var(--primary); display:flex; align-items:center; justify-content:center;
  }
  .needs-attn-meta { display:flex; align-items:center; gap:0.3rem; flex-wrap:wrap; }
  .needs-attn-pills { display:flex; flex-direction:column; gap:0.35rem; align-items:flex-end; flex-shrink:0; }
  .needs-attn-pill {
    display:inline-flex; align-items:center; gap:0.3rem; padding:0.2rem 0.6rem; border-radius:999px;
    font-size:0.68rem; font-weight:700; text-transform:uppercase; letter-spacing:.02em; white-space:nowrap;
  }
  .needs-attn-divider { width:1px; align-self:stretch; background:var(--border-light); flex-shrink:0; }
  .needs-attn-view {
    flex-shrink:0; display:flex; align-items:center; gap:0.2rem; font-size:0.8rem; font-weight:700;
    color:var(--primary); white-space:nowrap;
  }
  @media(max-width:640px){
    .needs-attn-pills { display:none; }
    .needs-attn-view span { display:none; }
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

const CardHead = ({ title, sub, icon: Icon }) => (
  <>
    <div style={{ display:'flex', alignItems:'center', gap:'0.7rem', marginBottom:'0.2rem' }}>
      {Icon && (
        <div style={{ width:'38px', height:'38px', borderRadius:'11px', flexShrink:0,
          background:'rgba(59,130,246,.12)', color:'#3b82f6',
          display:'flex', alignItems:'center', justifyContent:'center' }}>
          <Icon size={18} strokeWidth={2.25} />
        </div>
      )}
      <h2 style={{ margin:0, fontSize:'0.95rem', fontWeight:700 }}>{title}</h2>
    </div>
    <p style={{ margin:'0 0 1rem', fontSize:'0.78rem', color:'var(--text-muted)', marginLeft: Icon ? 'calc(38px + 0.7rem)' : 0 }}>{sub}</p>
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

/* "↗ 12% vs last month" pill on an impact card — omitted entirely when
   the backend has no prior-30-day baseline to compare against (null),
   rather than showing a fabricated percentage. */
const TrendPill = ({ value, accent, tint }) => {
  if (value === null || value === undefined) return null;
  const up = value >= 0;
  const ArrowIcon = up ? TrendingUp : TrendingDown;
  return (
    <span className="kpi-trend" style={accent ? { background: tint, color: accent } : undefined}>
      <ArrowIcon size={12} strokeWidth={2.75} />
      {Math.abs(value)}% vs last month
    </span>
  );
};

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

  const [mapFullscreen, setMapFullscreen] = useState(false);
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
  // 'reassessed' belongs in Needs Attention, not out of it — the backend
  // only ever moves a report to 'reassessed' when it was closed and then
  // got a fresh independent corroborator (spec §11's "Addressed →
  // Reassessed"), which is exactly a report needing another look, not one
  // that's still resolved.
  const needsAttention = useMemo(() =>
    [...myEvents]
      .filter(e => e.eventState !== 'addressed')
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
  // not the legacy activities aggregate. `trend` is the % change vs. the
  // prior 30-day window (null when the backend has no baseline yet).
  const trends = impact?.trends || {};
  const impactCards = [
    { key:'contributions', label:'Contributions', value: nf(impact?.contributions ?? myActivities.length),
      sub:'Total reports submitted', Icon: ClipboardList, accent:'#2563eb', tint:'rgba(37,99,235,0.12)',
      trend: trends.contributions ?? null },
    { key:'verified', label:'Verified', value: nf(impact?.verifiedEvents ?? 0),
      sub:'Reports verified', Icon: ShieldCheck, accent:'#0d9488', tint:'rgba(13,148,136,0.12)',
      trend: trends.verifiedEvents ?? null },
    { key:'actions', label:'Actions Completed', value: nf(impact?.actionsCompleted ?? 0),
      sub:'Cleanup actions completed', Icon: CheckCircle2, accent:'#d97706', tint:'rgba(217,119,6,0.12)',
      trend: trends.actionsCompleted ?? null },
    { key:'waste', label:'Waste Removed', value: nf(impact?.kgRemoved ?? 0), unit:'kg',
      sub:'Total waste removed', Icon: Recycle, accent:'#2563eb', tint:'rgba(37,99,235,0.12)', featured:true,
      trend: trends.kgRemoved ?? null },
    { key:'locations', label:'Locations Affected', value: nf(impact?.locationsAffected ?? 0),
      sub:'Locations reported', Icon: MapPin, accent:'#7c3aed', tint:'rgba(124,58,237,0.12)',
      trend: trends.locationsAffected ?? null },
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
            Every cleanup you log helps BlueMind track where pollution is concentrating — approved reports get a tamper-evident proof recorded automatically, no wallet or setup needed.
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
            {impactCards.map(({ key, label, value, unit, sub, Icon, accent, tint, trend, featured }) => (
              <Card key={key} className="kpi-card"
                style={{ transition:'border-color .2s,transform .2s,box-shadow .2s', cursor:'default',
                  ...(featured ? {
                    background:`linear-gradient(135deg, ${accent}14, ${accent}26)`,
                    border:`1.5px solid ${accent}59`,
                    boxShadow:`0 10px 26px -16px ${accent}73`,
                  } : {}) }}
                onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-2px)'; if(!featured) e.currentTarget.style.borderColor='var(--border-glow)';}}
                onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)'; if(!featured) e.currentTarget.style.borderColor='var(--border-light)';}}
              >
                <div className="kpi-icon" style={{ background: featured ? accent : tint, color: featured ? '#fff' : accent }}>
                  <Icon size={20} strokeWidth={2.25} />
                </div>
                <div className="kpi-label">{label}</div>
                <div className="kpi-value-row">
                  <span className="kpi-value" style={{ color: accent }}>{value}</span>
                  {unit && <span className="kpi-value-unit">{unit}</span>}
                </div>
                <div className="kpi-sub">{sub}</div>
                <TrendPill value={trend} accent={accent} tint={tint} />
              </Card>
            ))}
          </div>

          {/* ── NEEDS ATTENTION ──
              Environmental events tied to this contributor's reports that
              Blue Mind hasn't marked addressed yet (spec §22). */}
          <Card>
            <div className="needs-attn-head">
              <div className="needs-attn-bell"><Bell size={20} strokeWidth={2.25} /></div>
              <div style={{ flex:1, minWidth:0 }}>
                <div className="needs-attn-title-row">
                  <h2 style={{ margin:0, fontSize:'0.95rem', fontWeight:700 }}>Needs Attention</h2>
                  {needsAttention.length > 0 && (
                    <span className="needs-attn-count">
                      <AlertCircle size={12} strokeWidth={2.5} />{needsAttention.length}
                    </span>
                  )}
                </div>
                <p style={{ margin:'0.2rem 0 0', fontSize:'0.78rem', color:'var(--text-muted)' }}>
                  Open issues from your reports that Blue Mind is still tracking.
                </p>
              </div>
            </div>
            {needsAttention.length === 0 ? (
              <p style={emptyStyle}>Nothing open right now — everything you've reported has been addressed.</p>
            ) : (
              <div style={{ display:'flex', flexDirection:'column' }}>
                {needsAttention.slice(0, 6).map((e, i, arr) => {
                  const stateMeta = eventStateMeta(e.eventState);
                  const verMeta = verificationStateMeta(e.verificationState);
                  const subjectLabel = e.subjects?.map(s => s.label).join(', ') || 'Unclassified';
                  return (
                    <Link key={e.eventId} to={`/contributor/events/${e.eventId}`} className="needs-attn-row"
                      style={{ borderBottom: i < arr.length - 1 ? '1px solid var(--border-light)' : 'none' }}>
                      <div className="needs-attn-icon"><Recycle size={18} strokeWidth={2.25} /></div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontWeight:700, fontSize:'0.86rem' }}>{subjectLabel}</div>
                        <div className="needs-attn-meta" style={{ fontSize:'0.74rem', color:'var(--text-muted)', marginTop:'0.2rem' }}>
                          <MapPin size={12} strokeWidth={2.25} />
                          <span>{e.locationLabel || 'Location unspecified'}</span>
                          <span>·</span>
                          <Calendar size={12} strokeWidth={2.25} />
                          <span>{fmt(e.occurredAt || e.createdAt)}</span>
                        </div>
                      </div>
                      <div className="needs-attn-pills">
                        <span className="needs-attn-pill" style={{ background:`${stateMeta.color}1F`, color:stateMeta.color }}>
                          <ShieldCheck size={12} strokeWidth={2.5} />{stateMeta.label}
                        </span>
                        <span className="needs-attn-pill" style={{ background:verMeta.color, color:'#fff' }}>
                          <CheckCircle2 size={12} strokeWidth={2.5} />{verMeta.label}
                        </span>
                      </div>
                      <div className="needs-attn-divider" />
                      <div className="needs-attn-view">
                        <span>View details</span><ChevronRight size={16} strokeWidth={2.25} />
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </Card>

          {/* ── RECENT ACTIVITY ── */}
          <Card>
            <CardHead icon={Activity} title="Recent Activity" sub="Your latest report updates" />
            <div style={{ display:'flex', flexDirection:'column' }}>
              {recent.map((act, i) => {
                const s = activityStatusMeta[act.status] || activityStatusMeta.pending;
                const { Icon } = s;
                return (
                  <div key={act.id} style={{ display:'flex', gap:'0.7rem', padding:'0.9rem 0',
                    borderBottom: i < recent.length-1 ? '1px solid var(--border-light)' : 'none' }}>
                    <div style={{ width:'38px', height:'38px', borderRadius:'11px', flexShrink:0,
                      background:s.bg, color:s.color,
                      display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <Icon size={18} strokeWidth={2.25} />
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', gap:'0.6rem', alignItems:'flex-start', flexWrap:'nowrap' }}>
                        <span style={{ fontWeight:700, fontSize:'0.86rem', flex:1, wordBreak:'break-word', lineHeight: 1.3 }}>
                          {act.location}
                        </span>
                        <StatusPill status={act.status} />
                      </div>
                      <div style={{ display:'flex', alignItems:'center', flexWrap:'wrap', gap:'0.3rem', fontSize:'0.74rem', color:'var(--text-muted)', marginTop:'0.35rem' }}>
                        <Calendar size={12} />
                        {fmtDateTime(act.timestamp)}
                        <span>· {act.quantity} kg · {act.volunteers} vol.</span>
                      </div>
                      {act.status==='rejected' && act.reviewNote && (
                        <div style={{ marginTop:'0.4rem', fontSize:'0.72rem', color:'#f87171',
                          background:'rgba(239,68,68,.08)', borderRadius:'6px', padding:'0.28rem 0.5rem' }}>
                          {act.reviewNote}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            {myActivities.length > 5 && (
              <button id="view-all-btn" onClick={() => navigate('/contributor/my-activities')}
                style={{ marginTop:'0.9rem', width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:'0.35rem',
                  background:'rgba(59,130,246,.1)', border:'none', borderRadius:'var(--radius-md)',
                  color:'#3b82f6', fontSize:'0.84rem', fontWeight:700, padding:'0.75rem',
                  cursor:'pointer', boxShadow:'none', transition:'background .2s',
                  fontFamily:'var(--font-sans)' }}
                onMouseEnter={e=>{e.currentTarget.style.background='rgba(59,130,246,.18)';}}
                onMouseLeave={e=>{e.currentTarget.style.background='rgba(59,130,246,.1)';}}
              >
                View all activities
                <ChevronRight size={15} strokeWidth={2.5} />
              </button>
            )}
          </Card>

          {/* ── YOUR AREAS ── */}
          <Card>
            <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:'0.75rem' }}>
              <CardHead title="Your Areas" sub="Where your reports and cleanups are located, colored by their current status" />
              <button
                type="button"
                onClick={() => setMapFullscreen(true)}
                style={{
                  flexShrink:0, display:'inline-flex', alignItems:'center', gap:'0.35rem',
                  background:'transparent', border:'1px solid var(--border-light)', borderRadius:'999px',
                  color:'var(--primary)', fontSize:'0.72rem', fontWeight:700, padding:'0.4rem 0.75rem',
                  cursor:'pointer', boxShadow:'none', fontFamily:'var(--font-sans)', whiteSpace:'nowrap',
                  transition:'border-color .2s, background .2s',
                }}
                onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--primary)'; e.currentTarget.style.background='color-mix(in srgb, var(--primary) 8%, transparent)';}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border-light)'; e.currentTarget.style.background='transparent';}}
              >
                <Maximize size={14} strokeWidth={2.5} />
                <span>Fullscreen</span>
              </button>
            </div>
            <MyAreasMap events={myEvents} isFullscreen={mapFullscreen} onExitFullscreen={() => setMapFullscreen(false)} />
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
              <>
                <div style={{ display:'flex', flexDirection:'column' }}>
                  {impactStories.flatMap((e) => {
                    const subjects = e.subjects?.length ? e.subjects : [{ label: 'Issue', code: null }];
                    return subjects.map((s) => ({ event: e, subject: s }));
                  }).map(({ event: e, subject: s }, i, arr) => {
                    const meta = wasteCodeMeta[s.code] || defaultWasteMeta;
                    const { Icon } = meta;
                    return (
                      <Link key={`${e.eventId}-${s.eventSubjectId || s.code}`} to={`/contributor/events/${e.eventId}`}
                        style={{ display:'flex', gap:'0.7rem', alignItems:'center', padding:'0.7rem 0', textDecoration:'none', color:'inherit',
                        borderBottom: i < arr.length - 1 ? '1px solid var(--border-light)' : 'none' }}>
                        <div style={{ width:'38px', height:'38px', borderRadius:'11px', flexShrink:0,
                          background:meta.bg, color:meta.color, display:'flex', alignItems:'center', justifyContent:'center' }}>
                          <Icon size={18} strokeWidth={2} />
                        </div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:'0.86rem', fontWeight:700, color:'var(--text-main)', lineHeight:1.3 }}>
                            {s.label} cleared
                          </div>
                          <div style={{ fontSize:'0.76rem', color:'var(--text-muted)', marginTop:'0.15rem' }}>
                            {e.locationLabel || 'Unknown location'}
                          </div>
                        </div>
                        <CheckCircle2 size={19} strokeWidth={2} color="var(--success)" style={{ flexShrink:0 }} />
                      </Link>
                    );
                  })}
                </div>
              </>
            )}
          </Card>
        </>
      )}

    </section>
  );
}
