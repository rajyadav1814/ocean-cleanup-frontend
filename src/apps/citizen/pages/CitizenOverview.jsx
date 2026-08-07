import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useCitizenStats, useCitizenLeaderboard, useCitizenFeed } from '../../../hooks/useCitizen';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import SubmitActivity from '../../contributor/pages/SubmitActivity';

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

/* ── Avatar ── */
function Avatar({ initials, size = 40, bg = 'var(--surface-hover)', color = 'var(--text-muted)' }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', background: bg,
      color, display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.35, fontWeight: 700, flexShrink: 0,
      fontFamily: 'var(--font-sans)',
    }}>{initials}</div>
  );
}

/* ── Badge tile ── */
function BadgeTile({ badge }) {
  const earned = badge.earned;
  return (
    <div style={{
      border: `1px solid ${earned ? 'rgba(184,134,43,.38)' : 'var(--border-light)'}`,
      borderRadius: 11, padding: '12px 8px', textAlign: 'center',
      opacity: earned ? 1 : 0.42,
      background: earned ? 'rgba(184,134,43,.06)' : 'transparent',
      transition: 'transform .2s, box-shadow .2s',
    }}
      onMouseEnter={e => { if (earned) { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(184,134,43,.15)'; } }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
    >
      <div style={{
        width: 40, height: 40, borderRadius: '50%', margin: '0 auto 6px',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
        background: earned ? 'rgba(184,134,43,.15)' : 'var(--surface-hover)',
      }}>{badge.icon}</div>
      <div style={{ fontSize: 11, fontWeight: 700, lineHeight: 1.3, color: 'var(--text-main)', fontFamily: 'var(--font-sans)' }}>{badge.title}</div>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2, fontFamily: 'var(--font-sans)' }}>
        {earned ? 'Earned' : badge.progressLabel}
      </div>
    </div>
  );
}

/* ── Progress bar ── */
function ProgressBar({ pct }) {
  return (
    <div style={{ height: 10, background: 'var(--surface-hover)', borderRadius: 20, overflow: 'hidden' }}>
      <div style={{
        height: '100%', width: `${Math.max(0, Math.min(100, pct))}%`,
        background: 'var(--primary)', borderRadius: 20, transition: 'width .7s ease',
      }} />
    </div>
  );
}

/* ── CSS injected for media-query classes ── */
const STYLES = `
  .citizen-tabs { display:flex; gap:4px; background:var(--surface); border:1px solid var(--border-light); border-radius:12px; padding:5px; width:100%; }
  .citizen-tab-btn { flex:1; border:none; border-radius:9px; padding:9px 16px; font-family:var(--font-sans); font-size:0.88rem; font-weight:600; cursor:pointer; transition:all .2s; white-space:nowrap; }
  .citizen-stats { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; }
  .citizen-badges-lb { display:grid; grid-template-columns:1.35fr 1fr; gap:14px; align-items:start; }
  .citizen-badges-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:10px; }
  @media(max-width:1024px) {
    .citizen-badges-grid { grid-template-columns:repeat(4,1fr); }
  }
  @media(max-width:768px) {
    .citizen-stats { grid-template-columns:repeat(2,1fr); gap:10px; }
    .citizen-badges-lb { grid-template-columns:1fr; }
    .citizen-badges-grid { grid-template-columns:repeat(4,1fr); gap:8px; }
  }
  @media(max-width:480px) {
    .citizen-stats { grid-template-columns:repeat(2,1fr); gap:8px; }
    .citizen-badges-grid { grid-template-columns:repeat(4,1fr); gap:6px; }
    .citizen-tabs { gap:3px; padding:4px; }
    .citizen-tab-btn { font-size:0.82rem; padding:8px 10px; }
  }
`;

/* ══════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════ */
export default function CitizenOverview() {
  const { user } = useAuth();
  const { stats, loading: sL, refresh } = useCitizenStats();
  const { leaderboard, myRow, loading: lL } = useCitizenLeaderboard();
  const { feed, loading: fL } = useCitizenFeed(5);
  const [tab, setTab] = useState('overview');
  const [toast, setToast] = useState('');
  const w = useWindowWidth();

  const isMobile = w < 640;
  const isTablet = w < 1024;

  const firstName = user?.firstName || user?.displayName?.split(' ')[0] || 'there';
  const initials  = `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`.toUpperCase() || 'C';

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(''), 3000); }

  if (sL || lL || fL) return <LoadingSpinner />;

  const s      = stats || {};
  const tier   = s.tier || { label: '🌱 Newcomer' };
  const badges = s.badges || [];
  const earned = badges.filter(b => b.earned);

  const lbRows    = leaderboard;
  const showMyRow = myRow && !lbRows.some(r => r.isMe);

  const card = {
    background: 'var(--surface)', border: '1px solid var(--border-light)',
    borderRadius: 12, padding: isMobile ? '16px' : '20px 22px',
    fontFamily: 'var(--font-sans)',
  };
  const cardTitle = { margin: '0 0 3px', fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', fontFamily: 'var(--font-sans)' };
  const cardSub   = { fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0 0 12px', fontFamily: 'var(--font-sans)' };

  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: '1rem', paddingBottom: '2.5rem', fontFamily: 'var(--font-sans)' }}>

      {/* ── Injected CSS ── */}
      <style>{STYLES}</style>

      {/* ── Toast ── */}
      {toast && (
        <div style={{
          position: 'fixed', top: '1rem', right: '1rem', zIndex: 2000,
          left: isMobile ? '1rem' : 'auto',
          background: 'rgba(15,110,120,.95)', border: '1px solid rgba(61,214,224,.3)',
          color: '#fff', padding: '0.85rem 1.1rem', borderRadius: 12,
          fontWeight: 600, fontSize: '0.88rem', fontFamily: 'var(--font-sans)',
          boxShadow: '0 16px 40px rgba(0,0,0,.3)', backdropFilter: 'blur(10px)',
        }}>{toast}</div>
      )}

      {/* ── HERO ── */}
      <div style={{
        background: 'linear-gradient(135deg,#0a4d54 0%,#0f6e78 100%)',
        borderRadius: 16,
        padding: isMobile ? '18px 16px' : '24px 28px',
        color: '#eef6f5',
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        justifyContent: 'space-between',
        alignItems: isMobile ? 'flex-start' : 'center',
        gap: isMobile ? 14 : 20,
        boxShadow: '0 8px 32px rgba(10,77,84,.35)',
        fontFamily: 'var(--font-sans)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: isMobile ? 48 : 60, height: isMobile ? 48 : 60,
            borderRadius: '50%', background: 'rgba(255,255,255,.14)', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: isMobile ? 18 : 22, fontWeight: 700, color: '#eef6f5',
          }}>{initials}</div>
          <div>
            <div style={{ fontSize: 11, opacity: .7, marginBottom: 3, fontFamily: 'var(--font-sans)', letterSpacing: '.06em', textTransform: 'uppercase', fontWeight: 600 }}>
              🌊 Citizen Space
            </div>
            <h1 style={{ margin: '0 0 3px', fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: isMobile ? '1rem' : '1.2rem', color: '#eef6f5', lineHeight: 1.3 }}>
              Hi {firstName}, thanks for keeping the coast clean
            </h1>
            <p style={{ margin: 0, fontSize: '0.8rem', opacity: .75 }}>
              {s.totalReports || 0} reports · member since {memberSince(s.memberSince)}
            </p>
            <span style={{
              display: 'inline-block', marginTop: 7,
              background: 'rgba(255,255,255,.16)', padding: '3px 10px',
              borderRadius: 20, fontSize: '0.68rem', fontWeight: 700, letterSpacing: '.04em',
            }}>{tier.label}</span>
          </div>
        </div>
        <button id="citizen-submit-hero" onClick={() => setTab('submit')} style={{
          background: '#eef6f5', color: '#0a4d54', border: 'none',
          padding: isMobile ? '10px 0' : '11px 22px',
          width: isMobile ? '100%' : 'auto',
          borderRadius: 10, fontSize: '0.88rem', fontWeight: 700,
          cursor: 'pointer', fontFamily: 'var(--font-sans)',
          boxShadow: '0 4px 14px rgba(0,0,0,.15)', transition: 'transform .2s, box-shadow .2s',
        }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,.22)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(0,0,0,.15)'; }}
        >+ Submit a Report</button>
      </div>

      {/* ── TAB BAR ── */}
      <div className="citizen-tabs">
        {[
          { id: 'overview', label: '🌊 My Space' },
          { id: 'submit',   label: '+ Submit Activity' },
        ].map(t => (
          <button
            key={t.id}
            id={`citizen-tab-${t.id}`}
            className="citizen-tab-btn"
            onClick={() => setTab(t.id)}
            style={{
              background: tab === t.id
                ? 'linear-gradient(135deg, var(--primary), var(--secondary))'
                : 'transparent',
              color: tab === t.id ? '#fff' : 'var(--text-muted)',
              boxShadow: tab === t.id ? '0 0 16px rgba(14,165,233,.3)' : 'none',
            }}
          >{t.label}</button>
        ))}
      </div>

      {/* ══ SUBMIT TAB ══ */}
      {tab === 'submit' && <SubmitActivity />}

      {/* ══ OVERVIEW TAB ══ */}
      {tab === 'overview' && (
        <>
          {/* ── PROGRESS BAR ── */}
          {tier.next && (
            <div style={card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10, gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  {Math.max(0, (s.nextAt || 0) - (s.totalReports || 0))} more report{Math.max(0, (s.nextAt || 0) - (s.totalReports || 0)) !== 1 ? 's' : ''} to unlock "{tier.next}"
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{s.progressLabel}</span>
              </div>
              <ProgressBar pct={s.progressPct || 0} />
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 8 }}>
                Unlocking <strong style={{ color: 'var(--text-main)' }}>{tier.next}</strong> earns a featured spot on the community map and a profile badge.
              </div>
            </div>
          )}

          {/* ── STATS STRIP ── */}
          <div className="citizen-stats">
            {[
              { v: s.totalReports || 0,                    k: 'Reports' },
              { v: `${Number(s.totalKg || 0).toFixed(1)} kg`, k: 'Waste logged' },
              { v: earned.length,                           k: 'Badges earned' },
              { v: s.cityRank ? `#${s.cityRank}` : '—',    k: 'City rank' },
            ].map(({ v, k }) => (
              <div key={k} style={{
                ...card, textAlign: 'center', padding: isMobile ? '14px 10px' : '16px',
                transition: 'transform .2s, border-color .2s',
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = 'var(--border-glow)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'var(--border-light)'; }}
              >
                <div style={{ fontSize: isMobile ? '1.3rem' : '1.5rem', fontWeight: 700, color: 'var(--primary-hover)' }}>{v}</div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 3 }}>{k}</div>
              </div>
            ))}
          </div>

          {/* ── BADGES + LEADERBOARD ── */}
          <div className="citizen-badges-lb">

            {/* Badges */}
            <div style={card}>
              <h2 style={cardTitle}>Your badges</h2>
              <p style={cardSub}>Earn by submitting reports and hitting milestones</p>
              <div className="citizen-badges-grid">
                {badges.map(b => <BadgeTile key={b.id} badge={b} />)}
              </div>
            </div>

            {/* Leaderboard */}
            <div style={card}>
              <h2 style={cardTitle}>This week's leaders</h2>
              <p style={cardSub}>All citizens ranked by reports</p>
              <div style={{ display: 'flex', flexDirection: 'column', maxHeight: isTablet ? 'none' : 360, overflowY: isTablet ? 'visible' : 'auto' }}>
                {lbRows.length === 0 && (
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>
                    No citizens yet.
                  </div>
                )}
                {[...lbRows, ...(showMyRow ? [myRow] : [])].map((r, i, arr) => (
                  <div key={r.userId || i} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 0',
                    borderBottom: i < arr.length - 1 ? '1px solid var(--border-light)' : 'none',
                    background: r.isMe ? 'rgba(14,165,233,.04)' : 'transparent',
                    borderRadius: r.isMe ? 8 : 0,
                    paddingLeft: r.isMe ? 6 : 0,
                    paddingRight: r.isMe ? 6 : 0,
                  }}>
                    <span style={{ width: 20, fontSize: '0.8rem', fontWeight: 700, textAlign: 'center', flexShrink: 0, color: r.rank <= 3 ? 'var(--primary)' : 'var(--text-muted)' }}>
                      {r.rank <= 3 ? ['🥇','🥈','🥉'][r.rank - 1] : r.rank}
                    </span>
                    <Avatar
                      initials={r.initials} size={28}
                      bg={r.isMe ? 'rgba(14,165,233,.18)' : 'var(--surface-hover)'}
                      color={r.isMe ? 'var(--primary-hover)' : 'var(--text-muted)'}
                    />
                    <span style={{ flex: 1, fontSize: '0.82rem', fontWeight: 600, color: r.isMe ? 'var(--primary-hover)' : 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {r.isMe ? 'You' : `${r.firstName} ${r.lastName?.[0] || ''}.`}
                    </span>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: r.weekReports > 0 ? 'var(--primary-hover)' : 'var(--text-muted)' }}>{r.weekReports}</div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>reports</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── COMMUNITY FEED ── */}
          <div style={card}>
            <h2 style={cardTitle}>Community feed</h2>
            <p style={cardSub}>Latest 5 reports from citizens</p>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {feed.length === 0 && (
                <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                  No reports yet — be the first!
                </div>
              )}
              {feed.slice(0, 5).map((item, i) => (
                <div key={item.id} style={{
                  display: 'flex', gap: 10, padding: '12px 0',
                  borderBottom: i < Math.min(feed.length, 5) - 1 ? '1px solid var(--border-light)' : 'none',
                }}>
                  <Avatar initials={item.initials} size={isMobile ? 32 : 38} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-main)', lineHeight: 1.4 }}>
                      <strong style={{ fontWeight: 700 }}>{item.firstName} {item.lastName?.[0] ? `${item.lastName[0]}.` : ''}</strong>
                      {' '}logged a cleanup at{' '}
                      <strong style={{ fontWeight: 600, wordBreak: 'break-word' }}>{item.location}</strong>
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 3, display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
                      {item.quantity > 0 && <span>{item.quantity} kg</span>}
                      {item.volunteers > 0 && <span>· {item.volunteers} vol.</span>}
                      <span>· {timeAgo(item.submittedAt)}</span>
                      {item.status === 'pending' && (
                        <span style={{ background: 'rgba(245,158,11,.12)', color: '#f59e0b', padding: '1px 6px', borderRadius: 20, fontWeight: 700, fontSize: '0.65rem' }}>Pending</span>
                      )}
                      {item.status === 'approved' && (
                        <span style={{ background: 'rgba(16,185,129,.12)', color: '#10b981', padding: '1px 6px', borderRadius: 20, fontWeight: 700, fontSize: '0.65rem' }}>Approved</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── SUBMIT CTA ── */}
          <div style={{
            ...card, padding: isMobile ? '18px 16px' : '22px 28px',
            background: 'linear-gradient(135deg, rgba(14,165,233,.07), rgba(61,214,224,.04))',
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            alignItems: isMobile ? 'stretch' : 'center',
            justifyContent: 'space-between',
            gap: 14,
          }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)' }}>Ready to log a cleanup? 🌊</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4 }}>
                Every report is verified and counts toward your badges and city rank.
              </div>
            </div>
            <button id="citizen-cta-submit" onClick={() => setTab('submit')} style={{
              background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
              color: '#fff', border: 'none',
              padding: isMobile ? '12px 0' : '11px 22px',
              width: isMobile ? '100%' : 'auto',
              borderRadius: 10, fontSize: '0.88rem', fontWeight: 700, cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
              boxShadow: '0 0 20px rgba(14,165,233,.25)', transition: 'transform .2s, box-shadow .2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 0 32px rgba(14,165,233,.45)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 0 20px rgba(14,165,233,.25)'; }}
            >+ Submit a Report</button>
          </div>
        </>
      )}
    </section>
  );
}
