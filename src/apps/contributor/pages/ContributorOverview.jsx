import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useActivities } from '../../../hooks/useActivities';
import { useContributorStats } from '../../../hooks/useContributorStats';
import LoadingSpinner from '../../../components/common/LoadingSpinner';

function fmt(ts) {
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

const CAT_COLOR = { plastic:'#1d9e75', glass:'#378add', metal:'#7f77dd', organic:'#e8a838', mixed:'#c14f2c', other:'#8299a0' };
const CAT_LABEL = { plastic:'Plastic', glass:'Glass', metal:'Metal', organic:'Organic', mixed:'Mixed', other:'Other' };

const Delta = ({ value, unit = '' }) => {
  if (value === 0 || value == null) return <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>Same as last month</span>;
  const pos = value > 0;
  return (
    <span style={{ fontSize: '0.78rem', color: pos ? '#10b981' : '#ef4444' }}>
      {pos ? '▲' : '▼'} {Math.abs(value)}{unit} vs last month
    </span>
  );
};

const StatusPill = ({ status }) => {
  const m = {
    approved: { bg:'rgba(16,185,129,.12)', color:'#10b981', label:'Approved' },
    pending:  { bg:'rgba(245,158,11,.12)',  color:'#f59e0b', label:'Pending' },
    rejected: { bg:'rgba(239,68,68,.12)',   color:'#ef4444', label:'Rejected' },
  };
  const s = m[status] || m.pending;
  return (
    <span style={{ padding:'0.2rem 0.6rem', borderRadius:'999px', fontSize:'0.72rem', fontWeight:700,
      background: s.bg, color: s.color, whiteSpace:'nowrap', textTransform:'uppercase' }}>
      {s.label}
    </span>
  );
};

const Card = ({ children, style }) => (
  <div style={{ background:'var(--surface)', border:'1px solid var(--border-light)',
    borderRadius:'var(--radius-lg)', padding:'1.5rem', backdropFilter:'blur(16px)', ...style }}>
    {children}
  </div>
);

export default function ContributorOverview() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { activities, loading: actsLoading } = useActivities();
  const { stats, loading: statsLoading } = useContributorStats();

  const myActivities = useMemo(() =>
    activities.filter(a => a.contributorId === user?.id), [activities, user]);

  const recent = useMemo(() =>
    [...myActivities].sort((a,b) => new Date(b.timestamp)-new Date(a.timestamp)).slice(0,5),
    [myActivities]);

  const composition = useMemo(() => {
    const approved = myActivities.filter(a => a.status === 'approved');
    const tally = {};
    approved.forEach(a => {
      const cat = (a.category||'other').toLowerCase();
      tally[cat] = (tally[cat]||0) + Number(a.quantity||0);
    });
    const total = Object.values(tally).reduce((s,v)=>s+v,0)||1;
    return Object.entries(tally)
      .sort((a,b)=>b[1]-a[1])
      .map(([cat,kg]) => ({ cat, kg, pct: Math.round((kg/total)*100) }));
  }, [myActivities]);

  if (actsLoading || statsLoading) return <LoadingSpinner />;

  const firstName = user?.firstName || user?.displayName?.split(' ')[0] || 'there';

  // Use API stats when available, fall back to client-side counts
  const totalKg        = stats?.totalKg        ?? myActivities.filter(a=>a.status==='approved').reduce((s,a)=>s+Number(a.quantity||0),0);
  const totalVol       = stats?.totalVolunteers ?? myActivities.filter(a=>a.status==='approved').reduce((s,a)=>s+Number(a.volunteers||0),0);
  const approvalRate   = stats?.approvalRate    ?? (myActivities.length ? Math.round((myActivities.filter(a=>a.status==='approved').length/myActivities.length)*100) : 0);
  const totalTokens    = stats?.totalTokens     ?? 0;
  const monthKg        = stats?.monthKg         ?? 0;
  const monthVol       = stats?.monthVolunteers  ?? 0;
  const kgDelta        = stats ? monthKg - (stats.lastMonthKg||0) : 0;
  const volDelta       = stats ? monthVol - (stats.lastMonthVolunteers||0) : 0;
  const rank           = stats?.rank            ?? null;
  const topPercent     = stats?.topPercent      ?? null;
  const pendingCount   = stats?.pendingActivities   ?? myActivities.filter(a=>a.status==='pending').length;
  const rejectedCount  = stats?.rejectedActivities  ?? myActivities.filter(a=>a.status==='rejected').length;
  const approvedCount  = stats?.approvedActivities  ?? myActivities.filter(a=>a.status==='approved').length;

  const statCards = [
    { label:'Waste Collected', value:`${totalKg} kg`, sub: <Delta value={kgDelta} unit=" kg" />, icon:'♻️' },
    { label:'Volunteers Mobilized', value:totalVol, sub: <Delta value={volDelta} />, icon:'🤝' },
    { label:'Activities Logged', value:myActivities.length, sub:`${pendingCount} awaiting review`, icon:'📋' },
    { label:'Approval Rate', value:`${approvalRate}%`, sub:`${rejectedCount} rejected`, icon:'✅', accent: approvalRate>=70?'#10b981':'#f59e0b' },
    { label:'OCEAN Tokens', value:totalTokens, sub:'Earned from approved cleanups', icon:'🪙', accent:'#f59e0b' },
    rank ? { label:'Your Rank', value:`#${rank}`, sub: topPercent ? `Top ${topPercent}% of contributors` : `of ${stats.totalContributors} contributors`, icon:'🏆', accent:'#818cf8' } : null,
  ].filter(Boolean);

  return (
    <section style={{ display:'flex', flexDirection:'column', gap:'1.5rem', paddingBottom:'2rem' }}>

      {/* Hero */}
      <div style={{ background:'linear-gradient(135deg,rgba(14,165,233,.12),rgba(61,214,224,.08))',
        border:'1px solid var(--border-glow)', borderRadius:'var(--radius-lg)', padding:'1.75rem 2rem',
        display:'flex', alignItems:'center', justifyContent:'space-between', gap:'1rem', flexWrap:'wrap' }}>
        <div>
          <div style={{ fontSize:'0.75rem', fontWeight:600, textTransform:'uppercase', letterSpacing:'.1em',
            color:'var(--text-muted)', marginBottom:'0.35rem' }}>🌊 Contributor Space</div>
          <h1 style={{ fontSize:'1.75rem', fontWeight:700, margin:0, color:'var(--text-main)' }}>
            Welcome back, {firstName}!
          </h1>
          <p style={{ margin:'0.4rem 0 0', color:'var(--text-muted)', fontSize:'0.93rem' }}>
            Every cleanup you log is verified on-chain. Here's your real-time impact.
          </p>
        </div>
        <button id="hero-log-btn" onClick={() => navigate('/contributor/submit')}
          style={{ background:'linear-gradient(135deg,var(--primary),var(--secondary))', color:'#fff',
            border:'none', borderRadius:'var(--radius-md)', padding:'0.8rem 1.5rem',
            fontWeight:700, fontSize:'0.95rem', cursor:'pointer', boxShadow:'0 0 24px rgba(61,214,224,.25)',
            transition:'transform .2s,box-shadow .2s', whiteSpace:'nowrap' }}
          onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow='0 0 32px rgba(61,214,224,.45)';}}
          onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow='0 0 24px rgba(61,214,224,.25)';}}
        >
          + Log a Cleanup
        </button>
      </div>

      {/* Stats grid */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:'1rem' }}>
        {statCards.map(({ label, value, sub, icon, accent }) => (
          <Card key={label} style={{ position:'relative', overflow:'hidden',
            transition:'border-color .2s,transform .2s', cursor:'default' }}
            onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--border-glow)';e.currentTarget.style.transform='translateY(-2px)';}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border-light)';e.currentTarget.style.transform='translateY(0)';}}
          >
            <div style={{ position:'absolute', top:'1rem', right:'1rem', fontSize:'1.8rem', opacity:.25 }}>{icon}</div>
            <div style={{ fontSize:'0.75rem', fontWeight:600, textTransform:'uppercase', letterSpacing:'.08em', color:'var(--text-muted)', marginBottom:'0.4rem' }}>{label}</div>
            <div style={{ fontSize:'1.9rem', fontWeight:700, color: accent||'var(--primary-hover)', lineHeight:1.1 }}>{value}</div>
            <div style={{ fontSize:'0.78rem', color:'var(--text-muted)', marginTop:'0.35rem' }}>{sub}</div>
          </Card>
        ))}
      </div>

      {/* Two-column */}
      <div style={{ display:'grid', gridTemplateColumns:'minmax(0,1.4fr) minmax(0,1fr)', gap:'1rem', alignItems:'start' }}>

        {/* Waste composition */}
        <Card>
          <h2 style={{ margin:'0 0 .2rem', fontSize:'1rem', fontWeight:700 }}>Waste Composition</h2>
          <p style={{ margin:'0 0 1.2rem', fontSize:'0.8rem', color:'var(--text-muted)' }}>
            From your {approvedCount} approved cleanups — total {totalKg} kg
          </p>
          {composition.length === 0 ? (
            <p style={{ color:'var(--text-muted)', fontSize:'0.9rem', textAlign:'center', padding:'1.5rem 0' }}>
              No approved activities yet.
            </p>
          ) : (
            <>
              <div style={{ display:'flex', height:'34px', borderRadius:'8px', overflow:'hidden', marginBottom:'1rem' }}>
                {composition.map(({cat, pct}) => (
                  <div key={cat} style={{ width:`${pct}%`, background: CAT_COLOR[cat]||CAT_COLOR.other }} title={`${CAT_LABEL[cat]||cat}: ${pct}%`} />
                ))}
              </div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:'0.85rem' }}>
                {composition.map(({cat, pct, kg}) => (
                  <div key={cat} style={{ display:'flex', alignItems:'center', gap:'0.4rem', fontSize:'0.82rem', color:'var(--text-muted)' }}>
                    <span style={{ width:'9px', height:'9px', borderRadius:'2px', background: CAT_COLOR[cat]||CAT_COLOR.other, flexShrink:0 }} />
                    {CAT_LABEL[cat]||cat} <strong style={{ color:'var(--text-main)' }}>{pct}%</strong>
                    <span style={{ opacity:.55 }}>({kg} kg)</span>
                  </div>
                ))}
              </div>
            </>
          )}
          {composition.length > 0 && (
            <div style={{ marginTop:'1rem', background:'rgba(14,165,233,.07)', border:'1px solid rgba(14,165,233,.18)',
              borderRadius:'var(--radius-md)', padding:'0.7rem 0.9rem', fontSize:'0.8rem', color:'var(--primary-hover)',
              display:'flex', gap:'0.5rem' }}>
              <span>💡</span>
              <span>{composition[0]?.cat === 'plastic'
                ? 'Plastic dominates your cleanups. Consider tagging bottle caps separately for better data.'
                : `${CAT_LABEL[composition[0]?.cat]||'Mixed waste'} is your top collected category. Great work!`}</span>
            </div>
          )}
        </Card>

        {/* Recent activity */}
        <Card>
          <h2 style={{ margin:'0 0 .2rem', fontSize:'1rem', fontWeight:700 }}>Recent Activities</h2>
          <p style={{ margin:'0 0 1.2rem', fontSize:'0.8rem', color:'var(--text-muted)' }}>
            Your last {Math.min(5, recent.length)} submissions
          </p>
          {recent.length === 0 ? (
            <p style={{ textAlign:'center', padding:'2rem 0', color:'var(--text-muted)', fontSize:'0.9rem' }}>
              No activities yet.{' '}
              <button id="start-btn" onClick={() => navigate('/contributor/submit')}
                style={{ background:'none', color:'var(--primary)', border:'none', cursor:'pointer',
                  padding:0, fontWeight:600, fontSize:'0.9rem', boxShadow:'none' }}>
                Log your first →
              </button>
            </p>
          ) : (
            <div style={{ display:'flex', flexDirection:'column' }}>
              {recent.map((act, i) => (
                <div key={act.id} style={{ display:'flex', gap:'0.65rem', padding:'0.8rem 0',
                  borderBottom: i < recent.length-1 ? '1px solid var(--border-light)' : 'none' }}>
                  <div style={{ width:'36px', height:'36px', borderRadius:'9px', flexShrink:0,
                    background: act.status==='approved'?'rgba(16,185,129,.12)':act.status==='rejected'?'rgba(239,68,68,.12)':'rgba(245,158,11,.12)',
                    display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.9rem' }}>
                    {act.status==='approved'?'✓':act.status==='rejected'?'✕':'⧗'}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', gap:'0.5rem', alignItems:'flex-start' }}>
                      <span style={{ fontWeight:600, fontSize:'0.86rem', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                        {act.location}
                      </span>
                      <StatusPill status={act.status} />
                    </div>
                    <div style={{ fontSize:'0.76rem', color:'var(--text-muted)', marginTop:'0.15rem' }}>
                      {fmt(act.timestamp)} · {act.quantity} kg · {act.volunteers} vol.
                    </div>
                    {act.status==='rejected' && act.reviewNote && (
                      <div style={{ marginTop:'0.35rem', fontSize:'0.75rem', color:'#f87171',
                        background:'rgba(239,68,68,.08)', borderRadius:'6px', padding:'0.3rem 0.5rem' }}>
                        {act.reviewNote}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          {myActivities.length > 5 && (
            <button id="view-all-btn" onClick={() => navigate('/contributor/my-activities')}
              style={{ marginTop:'0.75rem', width:'100%', background:'transparent',
                border:'1px solid var(--border-light)', borderRadius:'var(--radius-md)',
                color:'var(--primary)', fontSize:'0.84rem', fontWeight:600, padding:'0.55rem',
                cursor:'pointer', boxShadow:'none', transition:'border-color .2s,background .2s' }}
              onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--border-glow)';e.currentTarget.style.background='rgba(14,165,233,.06)';}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border-light)';e.currentTarget.style.background='transparent';}}
            >
              View all {myActivities.length} activities →
            </button>
          )}
        </Card>
      </div>

      {/* Community strip */}
      <Card style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'1rem',
        background:'linear-gradient(135deg,rgba(61,214,224,.07),rgba(125,231,240,.04))' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'1rem' }}>
          <div style={{ width:'44px', height:'44px', borderRadius:'12px', flexShrink:0,
            background:'linear-gradient(135deg,var(--primary),var(--secondary))',
            display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.4rem' }}>⭐</div>
          <div>
            <div style={{ fontWeight:700, fontSize:'0.95rem' }}>You're part of the Bluemind community 🌏</div>
            <div style={{ fontSize:'0.8rem', color:'var(--text-muted)', marginTop:'0.15rem' }}>
              {rank
                ? `Ranked #${rank} of ${stats?.totalContributors} contributors · Keep going to climb higher!`
                : 'Submit and get approved to earn your rank among all contributors.'}
            </div>
          </div>
        </div>
        <div style={{ display:'flex', gap:'2rem', flexWrap:'wrap' }}>
          {[['Approved',approvedCount,'#10b981'],['Pending',pendingCount,'#f59e0b'],['Rejected',rejectedCount,'#ef4444']].map(([lbl,val,col])=>(
            <div key={lbl} style={{ textAlign:'center' }}>
              <div style={{ fontSize:'1.4rem', fontWeight:700, color:col }}>{val}</div>
              <div style={{ fontSize:'0.75rem', color:'var(--text-muted)' }}>{lbl}</div>
            </div>
          ))}
        </div>
      </Card>

    </section>
  );
}
