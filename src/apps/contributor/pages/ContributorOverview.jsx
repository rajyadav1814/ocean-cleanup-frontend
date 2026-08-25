import { useMemo, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';
import { useActivities } from '../../../hooks/useActivities';
import { useContributorStats } from '../../../hooks/useContributorStats';
import { useContributorInsights } from '../../../hooks/useContributorInsights';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import OceanWaveStrip from '../../../components/common/OceanWaveStrip';
import { contributorApi } from '../../../services/api';

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

const CAT_COLOR = { plastic:'#1d9e75', glass:'#378add', metal:'#7f77dd', organic:'#e8a838', mixed:'#c14f2c', other:'#8299a0' };
const CAT_LABEL = { plastic:'Plastic', glass:'Glass', metal:'Metal', organic:'Organic', mixed:'Mixed', other:'Other' };

const DISPOSAL_COLOR = { landfill:'#8299a0', recycled:'#1d9e75', composted:'#e8a838', 'hazardous facility':'#c14f2c', other:'#7f77dd', 'not specified':'#c8d4dc' };
const DISPOSAL_LABEL = { landfill:'Landfill', recycled:'Recycled', composted:'Composted', 'hazardous facility':'Hazardous facility', other:'Other', 'not specified':'Not specified' };

const WILDLIFE_COLOR = { healthy:'#10b981', injured:'#f59e0b', entangled:'#ef4444', 'not specified':'#c8d4dc' };
const WILDLIFE_LABEL = { healthy:'Healthy', injured:'Injured', entangled:'Entangled', 'not specified':'Condition not noted' };

const DEBRIS_COLOR = {
  cigaretteButts:'#c14f2c', foodWrappers:'#e8a838', bottleCaps:'#378add',
  fishingLine:'#7f77dd', straws:'#1d9e75', bottles:'#8299a0',
};

const TREND_COLOR = {
  improving: { bg:'rgba(29,158,117,.12)', color:'#1d9e75' },
  stable:    { bg:'rgba(130,153,160,.16)', color:'#8299a0' },
  worsening: { bg:'rgba(193,79,44,.12)',  color:'#c14f2c' },
};

const HAZARD_META = {
  medical:   { icon:'🚑', label:'Medical' },
  chemical:  { icon:'☣️', label:'Chemical' },
  unstable:  { icon:'⚠️', label:'Unstable-terrain' },
};

const emptyStyle = { color:'var(--text-muted)', fontSize:'0.84rem', textAlign:'center', padding:'1.25rem 0' };

function cap(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

const Delta = ({ value, unit = '' }) => {
  if (value === 0 || value == null) return <span style={{ color:'var(--text-muted)', fontSize:'0.75rem' }}>Same as last month</span>;
  const pos = value > 0;
  return (
    <span style={{ fontSize:'0.75rem', color: pos ? '#10b981' : '#ef4444' }}>
      {pos ? '▲' : '▼'} {Math.abs(value)}{unit} vs last month
    </span>
  );
};

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
  .contrib-three-col { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:1rem; align-items:stretch; }
  .contrib-pulse-row { display:grid; grid-template-columns:minmax(0,1.7fr) minmax(0,1fr) minmax(0,1fr); gap:1rem; align-items:stretch; }
  .contrib-three-col > .contrib-card,
  .contrib-pulse-row > .contrib-card { height:100%; }
  .contrib-composition-card { display:flex; flex-direction:column; }
  .contrib-composition-insight { margin-top:auto !important; }
  .contrib-community { display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:1rem; }
  .contrib-community-counts { display:flex; gap:2rem; flex-wrap:wrap; }
  .contrib-bar-row { display:flex; align-items:center; gap:.6rem; padding:.4rem 0; }
  .contrib-bar-label { width:92px; flex-shrink:0; font-size:.78rem; color:var(--text-main); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .contrib-bar-track { display:block; flex:1; height:7px; border-radius:5px; background:var(--surface-hover,rgba(130,153,160,.14)); overflow:hidden; }
  .contrib-bar-fill { display:block; height:100%; border-radius:5px; }
  .contrib-bar-val { width:64px; flex-shrink:0; text-align:right; font-size:.72rem; color:var(--text-muted); }
  .contrib-trend-chart { width:100%; height:auto; display:block; overflow:visible; }
  .contrib-chart-labels { display:grid; grid-template-columns:repeat(6,1fr); margin-top:.35rem; color:var(--text-muted); font-size:.68rem; text-align:center; }
  .contrib-status-chart { display:flex; align-items:center; gap:1.2rem; min-height:128px; }
  .contrib-status-donut { width:112px; height:112px; flex:0 0 auto; border-radius:50%; position:relative; }
  .contrib-status-donut::after { content:''; position:absolute; inset:22px; border-radius:50%; background:var(--surface); border:1px solid var(--border-light); }
  .contrib-status-legend { display:flex; flex:1; flex-direction:column; gap:.6rem; }
  .contrib-status-row { display:flex; align-items:center; justify-content:space-between; gap:.75rem; color:var(--text-muted); font-size:.78rem; }
  .contrib-status-row strong { color:var(--text-main); font-size:.85rem; }
  .contrib-status-dot { width:8px; height:8px; border-radius:50%; display:inline-block; margin-right:.45rem; }
  .contrib-hero-actions { display:flex; flex-direction:column; align-items:flex-end; gap:.6rem; }
  .contrib-two-col { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:1rem; align-items:stretch; }
  .contrib-two-col > .contrib-card { height:100%; }
  .contrib-job-badge {
    display:inline-flex; align-items:center; padding:.18rem .55rem; border-radius:999px; font-size:.68rem;
    font-weight:700; background:rgba(46,158,155,.14); color:var(--primary-hover); white-space:nowrap;
    text-transform:uppercase; letter-spacing:.04em;
  }
  .contrib-list-row { display:flex; align-items:center; gap:.6rem; padding:.5rem 0; }
  .contrib-tag {
    display:inline-flex; align-items:center; gap:.3rem; padding:.25rem .65rem; border-radius:999px;
    background:var(--surface-hover); border:1px solid var(--border-light); font-size:.74rem; color:var(--text-main);
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
    .contrib-three-col { grid-template-columns:1fr; }
    .contrib-pulse-row { grid-template-columns:1fr; }
    .contrib-community { flex-direction:column; align-items:flex-start; }
    .contrib-community-counts { gap:1.25rem; }
  }
  @media(max-width:640px){
    .contrib-hero-actions { align-items:flex-start; width:100%; }
  }
  @media(max-width:480px){
    .contrib-card { padding: 1rem; }
    .contrib-stats { grid-template-columns:repeat(2,1fr); gap:0.6rem; }
    .contrib-community-counts { gap:1rem; }
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

const BarRow = ({ label, pct, valueLabel, color }) => (
  <div className="contrib-bar-row">
    <span className="contrib-bar-label" title={label}>{label}</span>
    <span className="contrib-bar-track">
      <span className="contrib-bar-fill" style={{ width:`${pct}%`, background:color }} />
    </span>
    <span className="contrib-bar-val">{valueLabel}</span>
  </div>
);

const CollectionTrendChart = ({ months }) => {
  const max = Math.max(...months.map(({ kg }) => kg), 1);
  const step = 336 / Math.max(months.length - 1, 1);
  const points = months.map(({ kg }, index) => {
    const x = 12 + (index * step);
    const y = 92 - ((kg / max) * 72);
    return `${x},${y}`;
  }).join(' ');
  const area = `12,92 ${points} 348,92`;

  return (
    <>
      <svg className="contrib-trend-chart" viewBox="0 0 360 105" role="img" aria-label="Monthly collection trend">
        {[20, 56, 92].map((y) => <line key={y} x1="12" x2="348" y1={y} y2={y} stroke="var(--border-light)" strokeWidth="1" strokeDasharray="3 4" />)}
        <polygon points={area} fill="rgba(46,158,155,.12)" />
        <polyline points={points} fill="none" stroke="var(--primary)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        {months.map(({ kg }, index) => {
          const x = 12 + (index * step);
          const y = 92 - ((kg / max) * 72);
          return <circle key={index} cx={x} cy={y} r="4" fill="var(--surface)" stroke="var(--primary)" strokeWidth="2"><title>{`${kg} kg`}</title></circle>;
        })}
      </svg>
      <div className="contrib-chart-labels" style={{ gridTemplateColumns: `repeat(${months.length}, 1fr)` }}>
        {months.map(({ label }, index) => <span key={`${label}-${index}`}>{label}</span>)}
      </div>
    </>
  );
};

const StatusChart = ({ items }) => {
  const total = items.reduce((sum, item) => sum + item.count, 0);
  let cursor = 0;
  const segments = items.map((item) => {
    const start = total ? (cursor / total) * 100 : 0;
    cursor += item.count;
    const end = total ? (cursor / total) * 100 : 0;
    return `${item.color} ${start}% ${end}%`;
  });

  return (
    <div className="contrib-status-chart">
      <div className="contrib-status-donut" style={{ background: total ? `conic-gradient(${segments.join(',')})` : 'var(--surface-hover)' }} aria-label={`${total} total activities`} />
      <div className="contrib-status-legend">
        {items.map(({ label, count, color }) => (
          <div key={label} className="contrib-status-row">
            <span><i className="contrib-status-dot" style={{ background:color }} />{label}</span>
            <strong>{count}</strong>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ── Empty state shown to brand-new contributors instead of a wall of zeros ── */
const NoDataYet = ({ onLog }) => (
  <Card>
    <div className="contrib-empty-state">
      <div className="contrib-empty-icon">📋</div>
      <h3 className="contrib-empty-title">Log your first cleanup to unlock your analytics</h3>
      <p className="contrib-empty-sub">
        Once your first activity is approved, this space fills in with your waste totals, composition
        breakdown, collection trend, top locations, and more.
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
  const { insights, loading: insightsLoading } = useContributorInsights();

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

  const approved = useMemo(() =>
    myActivities.filter(a => a.status === 'approved'), [myActivities]);

  const composition = useMemo(() => {
    const tally = {};
    approved.forEach(a => {
      const cat = (a.category||'other').toLowerCase();
      tally[cat] = (tally[cat]||0) + Number(a.quantity||0);
    });
    const total = Object.values(tally).reduce((s,v)=>s+v,0)||1;
    return Object.entries(tally)
      .sort((a,b)=>b[1]-a[1])
      .map(([cat,kg]) => ({ cat, kg, pct: Math.round((kg/total)*100) }));
  }, [approved]);

  const monthlyTrend = useMemo(() => {
    const current = new Date();
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(current.getFullYear(), current.getMonth() - 3 + index, 1);
      const kg = approved.reduce((sum, activity) => {
        const timestamp = new Date(activity.timestamp);
        return timestamp.getFullYear() === date.getFullYear() && timestamp.getMonth() === date.getMonth()
          ? sum + Number(activity.quantity || 0)
          : sum;
      }, 0);
      return { label: date.toLocaleDateString('en-IN', { month: 'short' }), kg };
    });
  }, [approved]);

  const topLocations = insights?.topLocations || [];
  const disposalStats = insights?.disposalStats || [];
  const wildlifeStats = insights?.wildlife || { total: 0, pctOfCleanups: 0, breakdown: [] };

  const siteConditions = insights?.siteConditions || [];
  const hazardCounts = insights?.hazardCounts || {
    medical: { count: 0, lastLocation: null, lastSubmittedAt: null },
    chemical: { count: 0, lastLocation: null, lastSubmittedAt: null },
    unstable: { count: 0, lastLocation: null, lastSubmittedAt: null },
  };
  const debrisBreakdown = insights?.debrisBreakdown || [];
  const pollutionSeverity = insights?.pollutionSeverity || { microplastics: [], bulkItemsLog: [] };
  const habitatObservations = insights?.habitatObservations || { habitatStress: [], speciesSighted: [] };
  const fieldEfficiency = insights?.fieldEfficiency || { totalHours: 0, avgKgPerHour: 0, instruments: [] };
  const dataQuality = insights?.dataQuality || { dualVerifiedCount: 0, followUpCount: 0, followUpList: [] };
  const monitoredSites = insights?.monitoredSites || [];
  const microplasticsTotal = pollutionSeverity.microplastics.reduce((s, x) => s + x.count, 0) || 1;
  const topBrands = insights?.brandFrequency?.topBrands || [];
  const topBrandsMax = topBrands[0]?.count || 1;

  if (actsLoading || statsLoading || insightsLoading) return <LoadingSpinner />;

  const firstName = user?.firstName || user?.displayName?.split(' ')[0] || 'there';

  // New user = hasn't logged any activity at all yet. Show a single "get started"
  // card instead of a dashboard full of zero-value KPIs.
  const isNewUser = myActivities.length === 0;

  const totalKg      = stats?.totalKg        ?? approved.reduce((s,a)=>s+Number(a.quantity||0),0);
  const totalVol     = stats?.totalVolunteers ?? approved.reduce((s,a)=>s+Number(a.volunteers||0),0);
  const approvalRate = stats?.approvalRate    ?? (myActivities.length ? Math.round((myActivities.filter(a=>a.status==='approved').length/myActivities.length)*100) : 0);
  const totalTokens  = stats?.totalTokens     ?? 0;
  const monthKg      = stats?.monthKg         ?? 0;
  const monthVol     = stats?.monthVolunteers ?? 0;
  const kgDelta      = stats ? monthKg - (stats.lastMonthKg||0) : 0;
  const volDelta     = stats ? monthVol - (stats.lastMonthVolunteers||0) : 0;
  const rank         = stats?.rank            ?? null;
  const topPercent   = stats?.topPercent      ?? null;
  const pendingCount  = stats?.pendingActivities  ?? myActivities.filter(a=>a.status==='pending').length;
  const rejectedCount = stats?.rejectedActivities ?? myActivities.filter(a=>a.status==='rejected').length;
  const approvedCount = stats?.approvedActivities ?? approved.length;
  const statusChartItems = [
    { label:'Approved', count:approvedCount, color:'#2E9E9B' },
    { label:'Pending', count:pendingCount, color:'#F8B84E' },
    { label:'Rejected', count:rejectedCount, color:'#EF6A67' },
  ];

  const statCards = [
    { label:'Waste Collected',      value:`${totalKg} kg`, sub:<Delta value={kgDelta} unit=" kg" />, icon:'♻️' },
    { label:'Volunteers Mobilized', value:totalVol,        sub:<Delta value={volDelta} />,            icon:'🤝' },
    { label:'Activities Logged',    value:myActivities.length, sub:`${pendingCount} awaiting review`, icon:'📋' },
    { label:'Approval Rate',        value:`${approvalRate}%`,  sub:`${rejectedCount} rejected`,       icon:'✅', accent: approvalRate>=70?'#10b981':'#f59e0b' },
    { label:'OCEAN Tokens',         value:totalTokens,     sub:'From approved cleanups',              icon:'🪙', accent:'#f59e0b' },
    rank ? { label:'Your Rank', value:`#${rank}`, sub: topPercent ? `Top ${topPercent}% of contributors` : `of ${stats.totalContributors} contributors`, icon:'🏆', accent:'#818cf8' } : null,
  ].filter(Boolean);

  return (
    <section style={{ display:'flex', flexDirection:'column', gap:'1.25rem', paddingBottom:'2rem', fontFamily:'var(--font-sans)' }}>

      <style>{STYLES}</style>

      {/* ── HERO ── */}
      <div className="contributor-hero">
        <OceanWaveStrip />
        <div className="contributor-hero__content">
          <div className="contributor-hero__kicker">
            <span>Contributor Space</span>
            {user?.jobTitle && <span className="contrib-job-badge">{user.jobTitle}</span>}
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
          <button id="hero-log-btn" className="contributor-hero__cta" onClick={() => navigate('/contributor/submit')}>
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
        <NoDataYet onLog={() => navigate('/contributor/submit')} />
      ) : (
        <>
          {/* ── STATS GRID ── */}
          <div className="contrib-stats">
            {statCards.map(({ label, value, sub, icon, accent }) => (
              <Card key={label} style={{ position:'relative', overflow:'hidden',
                transition:'border-color .2s,transform .2s', cursor:'default' }}
                onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--border-glow)';e.currentTarget.style.transform='translateY(-2px)';}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border-light)';e.currentTarget.style.transform='translateY(0)';}}
              >
                <div style={{ position:'absolute', top:'0.75rem', right:'0.75rem', fontSize:'1.6rem', opacity:.22 }}>{icon}</div>
                <div style={{ fontSize:'0.68rem', fontWeight:600, textTransform:'uppercase', letterSpacing:'.08em', color:'var(--text-muted)', marginBottom:'0.35rem' }}>{label}</div>
                <div style={{ fontSize: isMobile ? '1.5rem' : '1.9rem', fontWeight:700, color:accent||'var(--primary-hover)', lineHeight:1.1 }}>{value}</div>
                <div style={{ fontSize:'0.72rem', color:'var(--text-muted)', marginTop:'0.3rem' }}>{sub}</div>
              </Card>
            ))}
          </div>

          {/* ── Composition + Collection Trend + Activity Status ── */}
          <div className="contrib-pulse-row">

            {/* Waste composition */}
            <Card className="contrib-composition-card">
              <CardHead title="Waste Composition" sub={`From your ${approvedCount} approved cleanups — total ${totalKg} kg`} />
              {composition.length === 0 ? (
                <p style={{ color:'var(--text-muted)', fontSize:'0.88rem', textAlign:'center', padding:'1.5rem 0' }}>
                  No approved activities yet.
                </p>
              ) : (
                <>
                  <div style={{ display:'flex', height:'30px', borderRadius:'8px', overflow:'hidden', marginBottom:'0.9rem' }}>
                    {composition.map(({cat, pct}) => (
                      <div key={cat} style={{ width:`${pct}%`, background:CAT_COLOR[cat]||CAT_COLOR.other }}
                        title={`${CAT_LABEL[cat]||cat}: ${pct}%`} />
                    ))}
                  </div>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:'0.7rem' }}>
                    {composition.map(({cat, pct, kg}) => (
                      <div key={cat} style={{ display:'flex', alignItems:'center', gap:'0.35rem', fontSize:'0.8rem', color:'var(--text-muted)' }}>
                        <span style={{ width:'8px', height:'8px', borderRadius:'2px', background:CAT_COLOR[cat]||CAT_COLOR.other, flexShrink:0 }} />
                        {CAT_LABEL[cat]||cat} <strong style={{ color:'var(--text-main)' }}>{pct}%</strong>
                        <span style={{ opacity:.55 }}>({kg} kg)</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
              {composition.length > 0 && (
                <div className="contrib-composition-insight" style={{ marginTop:'0.9rem', background:'color-mix(in srgb, var(--primary) 7%, transparent)', border:'1px solid color-mix(in srgb, var(--primary) 18%, transparent)',
                  borderRadius:'var(--radius-md)', padding:'0.65rem 0.85rem', fontSize:'0.78rem', color:'var(--primary-hover)',
                  display:'flex', gap:'0.6rem', alignItems: 'flex-start' }}>
                  <span style={{ flexShrink: 0 }}>💡</span>
                  <span style={{ lineHeight: 1.4 }}>{composition[0]?.cat === 'plastic'
                    ? 'Plastic dominates your cleanups. Consider tagging bottle caps separately for better data.'
                    : `${CAT_LABEL[composition[0]?.cat]||'Mixed waste'} is your top collected category. Great work!`}</span>
                </div>
              )}
            </Card>

            {/* Collection trend */}
            <Card>
              <CardHead title="Collection Trend" sub="Approved waste collected — 3 months before and after the current month" />
              <CollectionTrendChart months={monthlyTrend} />
            </Card>

            {/* Activity status */}
            <Card>
              <CardHead title="Activity Status" sub={`${myActivities.length} cleanup${myActivities.length !== 1 ? 's' : ''} logged`} />
              <StatusChart items={statusChartItems} />
            </Card>
          </div>

          {/* ── Site Conditions & Hazards + Debris Breakdown ── */}
          <div className="contrib-two-col">

            {/* Site conditions & hazards */}
            <Card>
              <CardHead title="Site Conditions & Hazards" sub="Shoreline and tide combinations across your approved cleanups" />
              {siteConditions.length === 0 ? (
                <p style={emptyStyle}>No approved activities yet.</p>
              ) : (
                <div style={{ display:'flex', flexDirection:'column' }}>
                  {siteConditions.slice(0, 6).map((sc, i, arr) => (
                    <div key={`${sc.shorelineType}-${sc.tideState}`} className="contrib-list-row"
                      style={{ justifyContent:'space-between', borderBottom: i < arr.length - 1 ? '1px solid var(--border-light)' : 'none' }}>
                      <span style={{ fontSize:'0.82rem', color:'var(--text-main)' }}>{sc.shorelineType} · {sc.tideState}</span>
                      <strong style={{ fontSize:'0.78rem', color:'var(--text-muted)', flexShrink:0 }}>{sc.count} visit{sc.count !== 1 ? 's' : ''}</strong>
                    </div>
                  ))}
                </div>
              )}

              {['medical', 'chemical', 'unstable'].filter((type) => hazardCounts[type]?.count > 0).map((type) => (
                <div key={type} style={{ marginTop:'0.7rem', background:'rgba(239,68,68,.08)', border:'1px solid rgba(239,68,68,.2)',
                  borderRadius:'var(--radius-md)', padding:'0.55rem 0.75rem', fontSize:'0.76rem', color:'#b91c1c',
                  display:'flex', gap:'0.55rem', alignItems:'flex-start' }}>
                  <span style={{ flexShrink:0 }}>{HAZARD_META[type].icon}</span>
                  <span style={{ lineHeight:1.4 }}>
                    <strong>{HAZARD_META[type].label}</strong> hazards flagged {hazardCounts[type].count}× — most recently at {hazardCounts[type].lastLocation} ({fmt(hazardCounts[type].lastSubmittedAt)}).
                  </span>
                </div>
              ))}
              {siteConditions.length > 0 && ['medical', 'chemical', 'unstable'].every((type) => !hazardCounts[type]?.count) && (
                <p style={{ marginTop:'0.7rem', fontSize:'0.76rem', color:'var(--text-muted)' }}>No hazards flagged — nice and safe out there.</p>
              )}
            </Card>

            {/* Debris breakdown */}
            <Card>
              <CardHead title="Debris Breakdown" sub="Item-level counts and brand attribution across your approved cleanups" />
              {debrisBreakdown.every((d) => d.total === 0) ? (
                <p style={emptyStyle}>No approved activities yet.</p>
              ) : (
                debrisBreakdown.map((d) => (
                  <BarRow key={d.key} label={d.item} pct={d.pct} valueLabel={`${d.pct}% · ${d.total}`} color={DEBRIS_COLOR[d.key]} />
                ))
              )}

              <div style={{ marginTop:'1rem' }}>
                <div style={{ fontSize:'0.72rem', fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:'0.5rem' }}>
                  Top brands identified
                </div>
                {topBrands.length === 0 ? (
                  <p style={{ ...emptyStyle, padding:'0.5rem 0' }}>No brand data logged yet.</p>
                ) : (
                  topBrands.slice(0, 5).map((b) => (
                    <BarRow key={b.key} label={b.label} pct={Math.round((b.count / topBrandsMax) * 100)} valueLabel={`${b.count}×`} color="#378add" />
                  ))
                )}
              </div>
            </Card>
          </div>

          {/* ── Pollution Severity + Habitat & Species Log ── */}
          <div className="contrib-two-col">

            {/* Pollution severity */}
            <Card>
              <CardHead title="Pollution Severity" sub="Microplastics prevalence and bulk / duplicate-dumping items logged" />
              {pollutionSeverity.microplastics.length === 0 ? (
                <p style={emptyStyle}>No microplastics observations recorded.</p>
              ) : (
                pollutionSeverity.microplastics.map((m) => (
                  <BarRow key={m.key} label={cap(m.key)} pct={Math.round((m.count / microplasticsTotal) * 100)} valueLabel={`${m.count}×`} color="#c14f2c" />
                ))
              )}
              <div style={{ marginTop:'1rem' }}>
                <div style={{ fontSize:'0.72rem', fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:'0.5rem' }}>
                  Bulk / duplicate dumping log
                </div>
                <p style={{ margin:'0 0 0.7rem', fontSize:'0.74rem', color:'var(--text-muted)', lineHeight:1.45 }}>
                  The same item appears more than once, those are separate reports from different submissions rather than a duplicate display.
                </p>
                {pollutionSeverity.bulkItemsLog.length === 0 ? (
                  <p style={{ ...emptyStyle, padding:'0.5rem 0' }}>No bulk items logged.</p>
                ) : (
                  <div style={{ display:'flex', flexDirection:'column' }}>
                    {pollutionSeverity.bulkItemsLog.map((b, i, arr) => (
                      <div key={i} style={{ fontSize:'0.8rem', padding:'0.4rem 0', borderBottom: i < arr.length - 1 ? '1px solid var(--border-light)' : 'none' }}>
                        <span style={{ color:'var(--text-main)', fontWeight:600 }}>{b.items}</span>
                        <span style={{ color:'var(--text-muted)' }}> — {b.location}, {fmt(b.submittedAt)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>

            {/* Habitat & species log */}
            <Card>
              <CardHead title="Habitat & Species Log" sub="Frequency of species sightings and habitat stress notes" />
              <div style={{ fontSize:'0.72rem', fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:'0.4rem' }}>
                Species sighted
              </div>
              {habitatObservations.speciesSighted.length === 0 ? (
                <p style={{ ...emptyStyle, padding:'0.5rem 0', marginBottom:'0.9rem' }}>No species observations recorded.</p>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', marginBottom:'0.9rem' }}>
                  {habitatObservations.speciesSighted.map((s, i, arr) => (
                    <div key={s.key} className="contrib-list-row" style={{ borderBottom: i < arr.length - 1 ? '1px solid var(--border-light)' : 'none' }}>
                      <span style={{ flex:1, fontSize:'0.8rem' }}>{s.label}</span>
                      <strong style={{ fontSize:'0.78rem', color:'var(--text-muted)' }}>{s.count}×</strong>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ fontSize:'0.72rem', fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:'0.4rem' }}>
                Habitat stress notes
              </div>
              {habitatObservations.habitatStress.length === 0 ? (
                <p style={{ ...emptyStyle, padding:'0.5rem 0' }}>No habitat stress notes recorded.</p>
              ) : (
                <div style={{ display:'flex', flexDirection:'column' }}>
                  {habitatObservations.habitatStress.map((h, i, arr) => (
                    <div key={h.key} className="contrib-list-row" style={{ borderBottom: i < arr.length - 1 ? '1px solid var(--border-light)' : 'none' }}>
                      <span style={{ flex:1, fontSize:'0.8rem' }}>{h.label}</span>
                      <strong style={{ fontSize:'0.78rem', color:'var(--text-muted)' }}>{h.count}×</strong>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* ── RECENT ACTIVITIES ── */}
          <Card>
            <CardHead title="Recent Activities" sub={`Your last ${Math.min(5, recent.length)} submissions`} />
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

          {/* ── THREE-COLUMN: Locations + Disposal + Wildlife ── */}
          <div className="contrib-three-col">

            {/* Top locations */}
            <Card>
              <CardHead title="Top Locations" sub="Where your cleanups are concentrated" />
              {topLocations.length === 0 ? (
                <p style={{ color:'var(--text-muted)', fontSize:'0.84rem', textAlign:'center', padding:'1.25rem 0' }}>
                  No approved activities yet.
                </p>
              ) : (
                <div style={{ display:'flex', flexDirection:'column' }}>
                  {topLocations.map((loc, i) => (
                    <div key={loc.location} style={{ display:'flex', alignItems:'center', gap:'0.6rem', padding:'0.55rem 0',
                      borderBottom: i < topLocations.length-1 ? '1px solid var(--border-light)' : 'none' }}>
                      <span style={{ fontSize:'0.72rem', fontWeight:700, color:'var(--text-muted)', width:'16px', flexShrink:0 }}>
                        {String(i+1).padStart(2,'0')}
                      </span>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:'0.82rem', fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }} title={loc.location}>
                          {loc.location}
                        </div>
                        <div style={{ height:'5px', borderRadius:'4px', background:'rgba(130,153,160,.14)', marginTop:'0.3rem', overflow:'hidden' }}>
                          <div style={{ width:`${loc.pct}%`, height:'100%', borderRadius:'4px', background:'var(--primary)' }} />
                        </div>
                      </div>
                      <div style={{ textAlign:'right', flexShrink:0 }}>
                        <div style={{ fontSize:'0.78rem', fontWeight:600, color:'var(--text-main)' }}>{loc.kg} kg</div>
                        <div style={{ fontSize:'0.66rem', color:'var(--text-muted)' }}>{loc.count} log{loc.count!==1?'s':''}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Disposal method */}
            <Card>
              <CardHead title="Disposal Method" sub="Where the waste you collected ended up" />
              {disposalStats.length === 0 ? (
                <p style={{ color:'var(--text-muted)', fontSize:'0.84rem', textAlign:'center', padding:'1.25rem 0' }}>
                  No approved activities yet.
                </p>
              ) : (
                <>
                  {disposalStats.map(({ key, pct, kg }) => (
                    <BarRow
                      key={key}
                      label={DISPOSAL_LABEL[key] || key}
                      pct={pct}
                      valueLabel={`${pct}% · ${kg}kg`}
                      color={DISPOSAL_COLOR[key] || DISPOSAL_COLOR.other}
                    />
                  ))}
                  {disposalStats[0]?.key === 'landfill' && (
                    <div style={{ marginTop:'0.9rem', background:'rgba(245,158,11,.08)', border:'1px solid rgba(245,158,11,.2)',
                      borderRadius:'var(--radius-md)', padding:'0.6rem 0.8rem', fontSize:'0.75rem', color:'#b45309',
                      display:'flex', gap:'0.55rem', alignItems:'flex-start' }}>
                      <span style={{ flexShrink:0 }}>♻️</span>
                      <span style={{ lineHeight:1.4 }}>Most of your waste is going to landfill — flagging recyclable categories separately could redirect more of it.</span>
                    </div>
                  )}
                </>
              )}
            </Card>

            {/* Wildlife impact */}
            <Card>
              <CardHead title="Wildlife & Environmental Impact" sub="Sightings logged alongside your cleanups" />
              <div style={{ display:'flex', alignItems:'baseline', gap:'0.5rem', marginBottom:'0.9rem' }}>
                <span style={{ fontSize:'1.7rem', fontWeight:700, color:'var(--primary-hover)', lineHeight:1 }}>{wildlifeStats.total}</span>
                <span style={{ fontSize:'0.78rem', color:'var(--text-muted)' }}>
                  sighting{wildlifeStats.total!==1?'s':''} across {myActivities.length} cleanup{myActivities.length!==1?'s':''} ({wildlifeStats.pctOfCleanups}%)
                </span>
              </div>
              {wildlifeStats.breakdown.length === 0 ? (
                <p style={{ color:'var(--text-muted)', fontSize:'0.84rem', textAlign:'center', padding:'0.75rem 0' }}>
                  No wildlife sightings logged yet — that's usually a good sign.
                </p>
              ) : (
                <>
                  {wildlifeStats.breakdown.map(({ key, pct, count }) => (
                    <BarRow
                      key={key}
                      label={WILDLIFE_LABEL[key] || key}
                      pct={pct}
                      valueLabel={`${count}x`}
                      color={WILDLIFE_COLOR[key] || WILDLIFE_COLOR['not specified']}
                    />
                  ))}
                  {wildlifeStats.breakdown.some(b => b.key === 'injured' || b.key === 'entangled') && (
                    <div style={{ marginTop:'0.9rem', background:'rgba(239,68,68,.07)', border:'1px solid rgba(239,68,68,.18)',
                      borderRadius:'var(--radius-md)', padding:'0.6rem 0.8rem', fontSize:'0.75rem', color:'#b91c1c',
                      display:'flex', gap:'0.55rem', alignItems:'flex-start' }}>
                      <span style={{ flexShrink:0 }}>🐢</span>
                      <span style={{ lineHeight:1.4 }}>You've reported injured or entangled wildlife — those sightings matter beyond the waste count and help BlueMind flag high-risk sites.</span>
                    </div>
                  )}
                </>
              )}
            </Card>

            {/* Field efficiency & data quality */}
            <Card style={{ gridColumn:'1 / -1' }}>
              <CardHead title="Field Efficiency & Data Quality" sub="How efficiently you work, and how thoroughly your reports are documented" />
              <div style={{ display:'flex', flexWrap:'wrap', gap:'1.75rem' }}>
                <div>
                  <div style={{ fontSize:'0.68rem', fontWeight:600, textTransform:'uppercase', letterSpacing:'.08em', color:'var(--text-muted)' }}>Avg. kg / hour</div>
                  <div style={{ fontSize:'1.5rem', fontWeight:700, color:'var(--primary-hover)' }}>{fieldEfficiency.totalHours > 0 ? fieldEfficiency.avgKgPerHour : '—'}</div>
                </div>
                <div>
                  <div style={{ fontSize:'0.68rem', fontWeight:600, textTransform:'uppercase', letterSpacing:'.08em', color:'var(--text-muted)' }}>Dual-verified</div>
                  <div style={{ fontSize:'1.5rem', fontWeight:700, color:'var(--primary-hover)' }}>{dataQuality.dualVerifiedCount}</div>
                </div>
                <div>
                  <div style={{ fontSize:'0.68rem', fontWeight:600, textTransform:'uppercase', letterSpacing:'.08em', color:'var(--text-muted)' }}>Flagged for follow-up</div>
                  <div style={{ fontSize:'1.5rem', fontWeight:700, color:'var(--primary-hover)' }}>{dataQuality.followUpCount}</div>
                </div>
              </div>

              {fieldEfficiency.instruments.length > 0 && (
                <div style={{ marginTop:'1.1rem' }}>
                  <div style={{ fontSize:'0.72rem', fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:'0.5rem' }}>
                    Instruments / methods used
                  </div>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:'0.5rem' }}>
                    {fieldEfficiency.instruments.map((i) => (
                      <span key={i.key} className="contrib-tag">{i.label} <strong style={{ color:'var(--text-muted)' }}>×{i.count}</strong></span>
                    ))}
                  </div>
                </div>
              )}

              {dataQuality.followUpList.length > 0 && (
                <div style={{ marginTop:'1.1rem' }}>
                  <div style={{ fontSize:'0.72rem', fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:'0.5rem' }}>
                    Needs follow-up
                  </div>
                  <div style={{ display:'flex', flexDirection:'column' }}>
                    {dataQuality.followUpList.map((f, i, arr) => (
                      <div key={i} style={{ fontSize:'0.8rem', padding:'0.35rem 0', borderBottom: i < arr.length - 1 ? '1px solid var(--border-light)' : 'none' }}>
                        {f.location} <span style={{ color:'var(--text-muted)' }}>· {fmt(f.submittedAt)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {fieldEfficiency.totalHours === 0 && dataQuality.dualVerifiedCount === 0 && dataQuality.followUpCount === 0 && fieldEfficiency.instruments.length === 0 && (
                <p style={{ ...emptyStyle, padding:'0.75rem 0 0' }}>No field-efficiency or verification data recorded yet.</p>
              )}
            </Card>
          </div>

          {/* ── SITES YOU MONITOR ──
          <Card>
            <CardHead title="Sites You Monitor" sub="Locations you've returned to more than once, and how they're trending" />
            {monitoredSites.length === 0 ? (
              <p style={emptyStyle}>Visit the same site twice to start tracking its trend here.</p>
            ) : (
              <div style={{ display:'flex', flexDirection:'column' }}>
                {monitoredSites.map((site, i, arr) => (
                  <div key={site.location} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:'0.75rem', padding:'0.6rem 0',
                    borderBottom: i < arr.length - 1 ? '1px solid var(--border-light)' : 'none' }}>
                    <div style={{ minWidth:0 }}>
                      <div style={{ fontSize:'0.85rem', fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{site.location}</div>
                      <div style={{ fontSize:'0.72rem', color:'var(--text-muted)', marginTop:'0.15rem' }}>
                        {site.visitCount} visits · last {fmt(site.lastVisitAt)}{site.cleanedBeforeCount > 0 ? ` · ${site.cleanedBeforeCount} marked pre-cleaned` : ''}
                      </div>
                    </div>
                    <span style={{ flexShrink:0, padding:'0.22rem 0.65rem', borderRadius:'999px', fontSize:'0.68rem', fontWeight:700, textTransform:'uppercase',
                      background:TREND_COLOR[site.trend].bg, color:TREND_COLOR[site.trend].color }}>
                      {site.trend}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card> */}

          {/* ── COMMUNITY STRIP ── */}
          <Card style={{
            background:'linear-gradient(135deg,rgba(61,214,224,.1),rgba(125,231,240,.05)), var(--surface)',
            border:'1px solid rgba(61,214,224,.22)',
          }} className="contrib-community">
            <div style={{ display:'flex', alignItems:'center', gap:'0.9rem' }}>
              <div style={{ width:'40px', height:'40px', borderRadius:'12px', flexShrink:0,
                background:'linear-gradient(135deg,var(--primary),var(--secondary))',
                display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.25rem' }}>⭐</div>
              <div>
                <div style={{ fontWeight:700, fontSize:'0.92rem', color:'var(--text-main)' }}>You're part of the Bluemind community 🌏</div>
                <div style={{ fontSize:'0.77rem', color:'var(--text-muted)', marginTop:'0.15rem' }}>
                  {rank
                    ? `Ranked #${rank} of ${stats?.totalContributors} contributors · Keep going to climb higher!`
                    : 'Submit and get approved to earn your rank among all contributors.'}
                </div>
              </div>
            </div>
            <div className="contrib-community-counts">
              {[['Approved',approvedCount,'#10b981'],['Pending',pendingCount,'#f59e0b'],['Rejected',rejectedCount,'#ef4444']].map(([lbl,val,col])=>(
                <div key={lbl} style={{ textAlign:'center' }}>
                  <div style={{ fontSize:'1.3rem', fontWeight:700, color:col }}>{val}</div>
                  <div style={{ fontSize:'0.7rem', color:'var(--text-muted)' }}>{lbl}</div>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}

    </section>
  );
}
