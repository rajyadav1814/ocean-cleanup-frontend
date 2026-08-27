import { useMemo, useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useCitizenStats, useCitizenLeaderboard, useCitizenFeed } from '../../../hooks/useCitizen';
import { useEvents } from '../../../hooks/useEvents';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import SubmitActivity from '../../contributor/pages/SubmitActivity';
import MyAreasMap from '../../contributor/components/MyAreasMap';
import { eventStateMeta, verificationStateMeta } from '../../contributor/eventMeta';
import { Link } from 'react-router-dom';
import {
  Bell, AlertCircle, Recycle, MapPin, Calendar, ShieldCheck, CheckCircle2, ChevronRight,
  BottleWine, Wrench, Trash2, GlassWater, Leaf, Droplets, FileText, Trophy, Award, Users,
  Weight, Medal, Waves, Shell, Flame, Anchor,
} from 'lucide-react';

// Classic gold/silver/bronze for the top 3 leaderboard spots; ranks 4+
// fall back to a plain numeral (handled where this is read).
const RANK_MEDAL_COLORS = { 1: '#D4AF37', 2: '#A8A9AD', 3: '#CD7F32' };

// Per-title icon + accent for citizen badges — matched against the known
// milestone names the backend hands back (spec's badge catalog). Falls
// back to a generic Award for any title outside this set.
// Accents are concrete hex (not CSS var refs) because the badge tint is
// built by appending an alpha suffix to this string — var(--x) can't
// take one.
const BADGE_ICON_RULES = [
  { test: /first report/i,  Icon: Medal,  accent: '#6366f1' },
  { test: /tide guardian/i, Icon: Waves,  accent: '#2E9E9B' },
  { test: /spot mapper/i,   Icon: MapPin, accent: '#ef4444' },
  { test: /reef defender/i, Icon: Shell,  accent: '#f97316' },
  { test: /streak/i,        Icon: Flame,  accent: '#f97316' },
  { test: /top \d+/i,       Icon: Trophy, accent: '#C6821E' },
  { test: /harbor hero/i,   Icon: Anchor, accent: '#14669E' },
  { test: /crew leader/i,   Icon: Users,  accent: '#14669E' },
];
function badgeMeta(badge) {
  const rule = BADGE_ICON_RULES.find((r) => r.test.test(badge.title || ''));
  return rule || { Icon: Award, accent: '#2E9E9B' };
}

// One icon per pollution_waste subject code (spec §7 taxonomy) so an
// impact story reads at a glance as "what kind of waste" rather than
// requiring the label text to carry that on its own. Mirrors the
// contributor-space mapping in ContributorOverview.jsx.
const wasteCodeMeta = {
  plastic:       { Icon: BottleWine, bg: 'rgba(46,158,155,.14)', color: 'var(--success)' },
  metal:         { Icon: Wrench,     bg: 'rgba(20,102,158,.14)', color: 'var(--secondary)' },
  glass:         { Icon: GlassWater, bg: 'rgba(127,195,232,.18)', color: 'var(--border-glow)' },
  organic:       { Icon: Leaf,       bg: 'rgba(101,163,13,.14)', color: '#65a30d' },
  microplastics: { Icon: Droplets,   bg: 'rgba(46,158,155,.14)', color: 'var(--primary)' },
  mixed_waste:   { Icon: Trash2,     bg: 'var(--surface-hover)', color: 'var(--text-muted)' },
};
const defaultWasteMeta = { Icon: Trash2, bg: 'var(--surface-hover)', color: 'var(--text-muted)' };

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
function fmt(ts) {
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
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
    position: relative; overflow: hidden;
    background: var(--surface); border: 1px solid var(--border-light);
    border-radius: var(--radius-lg); padding: 1.4rem 1.6rem 1.3rem;
    box-shadow: 0 1px 2px rgba(10,30,50,.04);
    transition: border-color 0.2s, transform 0.2s;
  }
  .co-stat:hover { border-color: var(--border-glow); transform: translateY(-2px); }
  .co-stat-top { display: flex; align-items: center; gap: 0.9rem; }
  .co-stat-icon {
    flex-shrink: 0; width: 46px; height: 46px; border-radius: 999px;
    display: flex; align-items: center; justify-content: center;
    background: var(--stat-tint, rgba(46,158,155,.14)); color: var(--stat-accent, var(--primary));
  }
  .co-stat-label {
    font-size: 0.66rem; letter-spacing: 0.12em; text-transform: uppercase;
    color: var(--text-muted); font-family: var(--font-mono); font-weight: 700;
  }
  .co-stat-value {
    font-size: 1.7rem; font-weight: 700; color: var(--stat-accent, var(--primary));
    margin-top: 0.15rem; line-height: 1; letter-spacing: -0.02em;
    font-family: var(--font-display);
  }
  .co-stat-value-unit { font-size: 1rem; font-weight: 600; color: var(--text-muted); margin-left: 0.25rem; }
  .co-stat-desc {
    display: flex; align-items: center; gap: 0.4rem;
    font-size: 0.76rem; color: var(--text-muted); font-family: var(--font-sans);
    margin-top: 0.9rem;
  }

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

  /* panel header row: optional leading icon, kicker/title/desc block, optional trailing action */
  .co-panel-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; margin-bottom: 0; }
  .co-panel-head-left { display: flex; align-items: flex-start; gap: 0.85rem; flex: 1; min-width: 0; }
  .co-panel-icon {
    flex-shrink: 0; width: 40px; height: 40px; border-radius: 999px;
    background: rgba(46,158,155,0.14); color: var(--primary);
    display: flex; align-items: center; justify-content: center;
  }
  .co-title-row { display: flex; align-items: center; gap: 0.55rem; flex-wrap: wrap; }
  .co-live-pill {
    display: inline-flex; align-items: center; gap: 0.3rem; padding: 0.14rem 0.5rem 0.14rem 0.4rem;
    border-radius: 999px; background: rgba(46,158,155,0.14); color: var(--primary);
    font-size: 0.62rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em;
    font-family: var(--font-mono);
  }
  .co-live-pill::before {
    content: ''; width: 6px; height: 6px; border-radius: 999px; background: var(--primary);
    animation: coLivePulse 1.8s ease-in-out infinite;
  }
  @keyframes coLivePulse { 0%,100% { opacity: 1; } 50% { opacity: 0.35; } }

  /* feed */
  .co-feed-row { display: flex; gap: 0.9rem; padding: 0.9rem 0; border-bottom: 1px solid var(--border-light); align-items: center; }
  .co-feed-row:last-child { border-bottom: none; padding-bottom: 0; }
  .co-feed-time { font-size: 0.62rem; color: var(--text-muted); width: 44px; flex-shrink: 0; line-height: 1.4; font-family: var(--font-mono); text-align: right; }
  .co-feed-dot { width: 7px; height: 7px; border-radius: 999px; background: var(--primary); flex-shrink: 0; }
  .co-feed-av {
    width: 36px; height: 36px; border-radius: 999px; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    font-size: 0.7rem; font-weight: 700; color: var(--primary-hover);
    background: rgba(46,158,155,0.14); font-family: var(--font-mono);
  }
  .co-feed-body { flex: 1; min-width: 0; }
  .co-feed-text { font-size: 0.84rem; color: var(--text-main); line-height: 1.5; font-family: var(--font-sans); }
  .co-feed-text b { font-weight: 600; color: var(--text-main); }
  .co-feed-meta { display: flex; align-items: center; gap: 0.6rem; margin-top: 0.35rem; font-size: 0.65rem; color: var(--text-muted); flex-wrap: wrap; font-family: var(--font-mono); }
  .co-feed-meta span { display: inline-flex; align-items: center; gap: 0.25rem; }
  .co-feed-chevron { flex-shrink: 0; color: var(--text-muted); }
  .co-feed-footer {
    display: flex; align-items: center; justify-content: space-between; gap: 1rem;
    margin-top: 0.4rem; padding-top: 0.9rem; border-top: 1px solid var(--border-light);
    font-size: 0.78rem;
  }
  .co-feed-footer-count { color: var(--text-muted); }
  .co-feed-footer-link { display: inline-flex; align-items: center; gap: 0.25rem; color: var(--primary); font-weight: 700; text-decoration: none; }
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
  /* Event-state pills (Needs Attention / Impact Stories) need an
     arbitrary color per state, not just the fixed pending/verified/
     rejected set above — set inline via style, this just keeps the
     shared pill shape/type in sync with the rest of the page. */
  .co-state-pill {
    font-size: 0.6rem; font-weight: 700; letter-spacing: 0.06em;
    text-transform: uppercase; padding: 0.15rem 0.55rem;
    border-radius: 20px; white-space: nowrap; font-family: var(--font-mono);
  }
  .co-related-row {
    display: flex; align-items: center; justify-content: space-between; gap: 0.6rem;
    padding: 0.85rem 0; border-bottom: 1px solid var(--border-light);
    text-decoration: none; color: inherit;
  }
  .co-related-row:last-child { border-bottom: none; padding-bottom: 0; }
  .co-related-row:hover .co-feed-text { color: var(--primary-hover); }
  .co-story-icon {
    width: 38px; height: 38px; border-radius: 11px; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    background: rgba(46,158,155,0.14); color: var(--primary);
  }
  .co-see-all {
    display: block; margin-top: 0.4rem; padding-top: 0.9rem; border-top: 1px solid var(--border-light);
    text-align: center; font-size: 0.82rem; font-weight: 700; color: var(--primary); text-decoration: none;
  }

  /* Needs Attention — mirrors the contributor-space .needs-attn-* design */
  .co-needs-attn-head { display:flex; align-items:flex-start; gap:0.9rem; margin-bottom:0.9rem; }
  .co-needs-attn-bell {
    position:relative; flex-shrink:0; width:48px; height:48px; border-radius:999px;
    background:rgba(46,158,155,0.12); color:var(--primary); display:flex; align-items:center; justify-content:center;
  }
  .co-needs-attn-bell::after {
    content:''; position:absolute; top:2px; right:2px; width:10px; height:10px; border-radius:999px;
    background:#ef4444; border:2px solid var(--surface);
  }
  .co-needs-attn-title-row { display:flex; align-items:center; gap:0.5rem; flex-wrap:wrap; }
  .co-needs-attn-count {
    display:inline-flex; align-items:center; gap:0.25rem; padding:0.15rem 0.5rem; border-radius:999px;
    background:rgba(239,68,68,0.12); color:#ef4444; font-size:0.72rem; font-weight:700;
  }
  .co-needs-attn-row {
    display:flex; align-items:center; gap:0.75rem; padding:0.85rem 0; text-decoration:none; color:inherit;
  }
  .co-needs-attn-icon {
    flex-shrink:0; width:40px; height:40px; border-radius:10px; background:rgba(46,158,155,0.12);
    color:var(--primary); display:flex; align-items:center; justify-content:center;
  }
  .co-needs-attn-meta { display:flex; align-items:center; gap:0.3rem; flex-wrap:wrap; }
  .co-needs-attn-pills { display:flex; flex-direction:column; gap:0.35rem; align-items:flex-end; flex-shrink:0; }
  .co-needs-attn-pill {
    display:inline-flex; align-items:center; gap:0.3rem; padding:0.2rem 0.6rem; border-radius:999px;
    font-size:0.68rem; font-weight:700; text-transform:uppercase; letter-spacing:.02em; white-space:nowrap;
  }
  .co-needs-attn-divider { width:1px; align-self:stretch; background:var(--border-light); flex-shrink:0; }
  .co-needs-attn-view {
    flex-shrink:0; display:flex; align-items:center; gap:0.2rem; font-size:0.8rem; font-weight:700;
    color:var(--primary); white-space:nowrap;
  }
  @media(max-width:640px){
    .co-needs-attn-pills { display:none; }
    .co-needs-attn-view span { display:none; }
  }

  /* badges */
  .co-badges { display: grid; grid-template-columns: repeat(4,1fr); gap: 0.7rem; margin-top: 1.2rem; }
  .co-badge {
    background: var(--surface-hover); border: 1px solid var(--border-light);
    border-radius: var(--radius-md); padding: 1rem 0.6rem; text-align: center;
    transition: border-color 0.2s, transform 0.2s;
  }
  .co-badge.earned { border-color: rgba(46,158,155,0.28); background: rgba(46,158,155,0.06); }
  .co-badge.earned:hover { transform: translateY(-2px); border-color: var(--border-glow); }
  .co-badge-icon {
    width: 40px; height: 40px; border-radius: 50%; margin: 0 auto 0.6rem;
    display: flex; align-items: center; justify-content: center;
    background: var(--badge-tint, var(--surface)); color: var(--badge-accent, var(--text-muted));
    opacity: 0.45;
  }
  .co-badge.earned .co-badge-icon { opacity: 1; box-shadow: 0 0 0 1px var(--badge-accent, var(--border-glow)) inset; }
  .co-badge-name  { font-size: 0.7rem; font-weight: 600; color: var(--text-main); line-height: 1.3; font-family: var(--font-sans); }
  .co-badge-status { font-size: 0.62rem; color: var(--text-muted); margin-top: 0.25rem; font-family: var(--font-mono); }
  .co-badge.earned .co-badge-status { color: var(--primary); font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; }

  /* leaderboard */
  .co-lb-row { display: flex; align-items: center; gap: 0.7rem; padding: 0.7rem 0; border-bottom: 1px solid var(--border-light); }
  .co-lb-row:last-child { border-bottom: none; padding-bottom: 0; }
  .co-lb-row.me { background: rgba(46,158,155,0.06); margin: 0 -0.5rem; padding: 0.7rem 0.5rem; border-radius: var(--radius-md); border-bottom-color: transparent; }
  .co-lb-rank {
    width: 22px; height: 22px; flex-shrink: 0; display: flex; align-items: center; justify-content: center;
    color: var(--lb-medal-color, var(--text-muted));
  }
  .co-lb-rank-num { font-size: 0.72rem; font-weight: 700; color: var(--text-muted); font-family: var(--font-mono); }
  .co-lb-row.me .co-lb-rank-num { color: var(--primary); }
  .co-lb-av {
    width: 30px; height: 30px; border-radius: 50%; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    font-size: 10px; font-weight: 700;
    background: var(--surface-hover); border: 1px solid var(--border-light); color: var(--text-muted);
    font-family: var(--font-mono);
  }
  .co-lb-row.me .co-lb-av { background: rgba(46,158,155,0.18); border-color: var(--border-glow); color: var(--primary); }
  .co-lb-name { flex: 1; font-size: 0.82rem; color: var(--text-main); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .co-lb-row.me .co-lb-name { color: var(--primary-hover); font-weight: 600; }
  .co-lb-count { font-size: 0.72rem; color: var(--text-muted); flex-shrink: 0; font-family: var(--font-sans); }

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
      <Link to="/citizen/quick-report" id="citizen-submit-empty" className="co-cta" style={{ alignSelf: 'center', marginBottom: 0, marginTop: '0.4rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
        <span>Submit a report</span><span aria-hidden="true">→</span>
      </Link>
    </div>
  </div>
);

export default function CitizenOverview() {
  const { user } = useAuth();
  const { stats, loading: sL } = useCitizenStats();
  const { leaderboard, myRow, loading: lL } = useCitizenLeaderboard();
  const { feed, loading: fL } = useCitizenFeed(24);
  const { events: myEvents, loading: eL } = useEvents(user?.id);
  const [tab, setTab] = useState('overview');
  const [toast, setToast] = useState('');

  if (sL || lL || fL || eL) return <LoadingSpinner />;

  const s = stats || {};
  const badges = s.badges || [];
  const earned = badges.filter(b => b.earned);
  const lbRows = leaderboard || [];
  const allRows = [...lbRows, ...(myRow && !lbRows.some(r => r.isMe) ? [myRow] : [])];

  const firstName = user?.firstName || user?.displayName?.split(' ')[0] || 'there';
  const sinceLabel = memberSince(s.memberSince);
  const isNewUser = (s.totalReports || 0) === 0;

  // Environmental events tied to this citizen's own reports (spec §22) —
  // what's still open vs. what changed as a result of reporting it,
  // separate from the community feed above, which shows everyone's
  // activity rather than "what happened because of me."
  const needsAttention = [...myEvents]
    .filter((e) => e.eventState !== 'addressed' && e.eventState !== 'reassessed')
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const impactStories = [...myEvents]
    .filter((e) => e.eventState === 'addressed')
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    .slice(0, 6);

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
        <Link to="/citizen/quick-report" id="citizen-submit-hero" className="co-cta">
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
          {
            key: 'reports', label: 'Reports', Icon: FileText, accent: 'var(--primary)', tint: 'rgba(46,158,155,.14)',
            value: s.totalReports || 0, unit: '',
            DescIcon: Calendar, sub: `since ${sinceLabel}`,
          },
          {
            key: 'waste', label: 'Waste logged', Icon: Trash2, accent: '#22c55e', tint: 'rgba(34,197,94,.14)',
            value: Number(s.totalKg || 0).toFixed(1), unit: 'kg',
            DescIcon: ShieldCheck, sub: 'verified + pending',
          },
          {
            key: 'badges', label: 'Badges earned', Icon: Award, accent: 'var(--warning)', tint: 'rgba(198,130,30,.14)',
            value: `${earned.length} / ${badges.length || 8}`, unit: '',
            DescIcon: MapPin, sub: badges.find(b => !b.earned)?.title || 'All earned!',
          },
          {
            key: 'rank', label: 'City rank', Icon: Trophy, accent: 'var(--secondary)', tint: 'rgba(20,102,158,.14)',
            value: s.cityRank ? `#${s.cityRank}` : '—', unit: '',
            DescIcon: Users, sub: lbRows.length ? `of ${lbRows.length} citizens` : 'not ranked yet',
          },
        ].map(({ key, label, Icon, accent, tint, value, unit, DescIcon, sub }) => (
          <div key={key} className="co-stat" style={{ '--stat-accent': accent, '--stat-tint': tint }}>
            <div className="co-stat-top">
              <div className="co-stat-icon"><Icon size={20} strokeWidth={2} /></div>
              <div>
                <div className="co-stat-label">{label}</div>
                <div className="co-stat-value">{value}{unit && <span className="co-stat-value-unit">{unit}</span>}</div>
              </div>
            </div>
            <div className="co-stat-desc"><DescIcon size={13} strokeWidth={2.25} />{sub}</div>
          </div>
        ))}
      </div>

      {/* ── Needs Attention + Impact Stories ──
          Environmental-event view of this citizen's own reports (spec
          §22): what's still open, and what changed as a result of
          reporting it — the "something you reported changed" loop the
          community feed and badges don't otherwise close. */}
      <div className="co-grid" style={{ marginBottom: '1.2rem' }}>
        <div className="co-panel">
          <div className="co-needs-attn-head">
            <div className="co-needs-attn-bell"><Bell size={20} strokeWidth={2.25} /></div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="co-needs-attn-title-row">
                <div className="co-panel-title" style={{ marginTop: 0 }}>Needs Attention</div>
                {needsAttention.length > 0 && (
                  <span className="co-needs-attn-count">
                    <AlertCircle size={12} strokeWidth={2.5} />{needsAttention.length}
                  </span>
                )}
              </div>
              <div className="co-panel-desc" style={{ marginBottom: 0 }}>Open issues from your own reports.</div>
            </div>
          </div>
          {needsAttention.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '1.5rem 0', color: 'var(--text-muted)', fontSize: '0.84rem' }}>
              Nothing open right now — everything you've reported has been addressed.
            </div>
          ) : (
            needsAttention.slice(0, 5).map((e, i, arr) => {
              const stateMeta = eventStateMeta(e.eventState);
              const verMeta = verificationStateMeta(e.verificationState);
              const subjectLabel = e.subjects?.map((s2) => s2.label).join(', ') || 'Unclassified';
              return (
                <Link key={e.eventId} to={`/citizen/events/${e.eventId}`} className="co-needs-attn-row"
                  style={{ borderBottom: i < arr.length - 1 ? '1px solid var(--border-light)' : 'none' }}>
                  <div className="co-needs-attn-icon"><Recycle size={18} strokeWidth={2.25} /></div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.86rem', color: 'var(--text-main)' }}>{subjectLabel}</div>
                    <div className="co-needs-attn-meta" style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                      <MapPin size={12} strokeWidth={2.25} />
                      <span>{e.locationLabel || 'Location unspecified'}</span>
                      <span>·</span>
                      <Calendar size={12} strokeWidth={2.25} />
                      <span>{fmt(e.occurredAt || e.createdAt)}</span>
                    </div>
                  </div>
                  <div className="co-needs-attn-pills">
                    <span className="co-needs-attn-pill" style={{ background: `${stateMeta.color}22`, color: stateMeta.color }}>
                      <ShieldCheck size={12} strokeWidth={2.5} />{stateMeta.label}
                    </span>
                    <span className="co-needs-attn-pill" style={{ background: verMeta.color, color: '#fff' }}>
                      <CheckCircle2 size={12} strokeWidth={2.5} />{verMeta.label}
                    </span>
                  </div>
                  <div className="co-needs-attn-divider" />
                  <div className="co-needs-attn-view">
                    <span>View details</span><ChevronRight size={16} strokeWidth={2.25} />
                  </div>
                </Link>
              );
            })
          )}
        </div>

        <div className="co-panel">
          <div className="co-panel-title">Impact Stories</div>
          <div className="co-panel-desc">What happened after you reported it.</div>
          {impactStories.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '1.5rem 0', color: 'var(--text-muted)', fontSize: '0.84rem' }}>
              No resolved reports yet — check back once one of yours is addressed.
            </div>
          ) : (
            <>
              {impactStories.flatMap((e) => {
                const subjects = e.subjects?.length ? e.subjects : [{ label: 'Issue', code: null }];
                return subjects.map((s2) => ({ event: e, subject: s2 }));
              }).map(({ event: e, subject: s2 }, i, arr) => {
                const meta = wasteCodeMeta[s2.code] || defaultWasteMeta;
                const { Icon } = meta;
                return (
                  <Link key={`${e.eventId}-${s2.eventSubjectId || s2.code}`} to={`/citizen/events/${e.eventId}`}
                    className="co-related-row" style={{ borderBottom: i < arr.length - 1 ? '1px solid var(--border-light)' : 'none' }}>
                    <div className="co-story-icon" style={{ background: meta.bg, color: meta.color }}>
                      <Icon size={18} strokeWidth={2} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="co-feed-text" style={{ fontWeight: 600 }}>{s2.label} cleared</div>
                      <div className="co-feed-meta">{e.locationLabel || 'Unknown location'}</div>
                    </div>
                    <CheckCircle2 size={19} strokeWidth={2} color="var(--success)" style={{ flexShrink: 0 }} />
                  </Link>
                );
              })}
            </>
          )}
        </div>
      </div>

      {/* ── Your Areas ── */}
      <div className="co-panel" style={{ marginBottom: '1.2rem' }}>
        <div className="co-panel-kicker">Your Areas</div>
        <div className="co-panel-title">Where you've reported</div>
        <div className="co-panel-desc">Colored by what's happening with each report.</div>
        <MyAreasMap events={myEvents} />
      </div>

      {/* ══ Overview tab ══ */}
      {tab === 'overview' && (
        <div className="co-grid">

          {/* ── Feed (left) ── */}
          <div className="co-panel">
            <div className="co-panel-head">
              <div className="co-panel-head-left">
                <div className="co-panel-icon"><Users size={18} strokeWidth={2.25} /></div>
                <div style={{ minWidth: 0 }}>
                  <div className="co-panel-kicker">Community Feed</div>
                  <div className="co-title-row" style={{ marginTop: '0.3rem' }}>
                    <div className="co-panel-title" style={{ margin: 0 }}>Latest reports</div>
                    <span className="co-live-pill">Live</span>
                  </div>
                  <div className="co-panel-desc" style={{ marginBottom: 0 }}>Real-time submissions from citizens near you.</div>
                </div>
              </div>
            </div>

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
                  <div className="co-feed-dot" />
                  <div className="co-feed-av">{(item.firstName?.[0] || '') + (item.lastName?.[0] || '')}</div>
                  <div className="co-feed-body">
                    <div className="co-feed-text">
                      <b>{name}</b> logged a cleanup at {item.location}
                    </div>
                    <div className="co-feed-meta">
                      {item.quantity > 0 && <span><Weight size={11} />{item.quantity} kg</span>}
                      {item.volunteers > 0 && <span><Users size={11} />{item.volunteers} vol.</span>}
                      <span className={`co-pill ${status.variant}`}>{status.label}</span>
                    </div>
                  </div>
                  <ChevronRight size={16} className="co-feed-chevron" />
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
                  : badges.map(b => {
                    const { Icon, accent } = badgeMeta(b);
                    return (
                      <div key={b.id} className={`co-badge${b.earned ? ' earned' : ''}`} style={{ '--badge-accent': accent, '--badge-tint': `${accent}1f` }}>
                        <div className="co-badge-icon"><Icon size={18} strokeWidth={2} /></div>
                        <div className="co-badge-name">{b.title}</div>
                        <div className="co-badge-status">{b.earned ? 'Earned' : (b.progressLabel || 'Locked')}</div>
                      </div>
                    );
                  })
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

              <div style={{ marginTop: '1.2rem' }}>
                {allRows.slice(0, 6).map((r, i) => {
                  const name = r.isMe ? 'You' : `${r.firstName || ''} ${r.lastName?.[0] ? r.lastName[0] + '.' : ''}`.trim();
                  const medalColor = RANK_MEDAL_COLORS[r.rank];
                  return (
                    <div key={r.userId || i} className={`co-lb-row${r.isMe ? ' me' : ''}`}>
                      <div className="co-lb-rank" style={medalColor ? { '--lb-medal-color': medalColor } : undefined}>
                        {medalColor
                          ? <Medal size={18} strokeWidth={2} fill={medalColor} fillOpacity={0.18} />
                          : <span className="co-lb-rank-num">{String(r.rank).padStart(2, '0')}</span>}
                      </div>
                      <div className="co-lb-av">{r.initials || name[0]}</div>
                      <div className="co-lb-name">{name}</div>
                      <div className="co-lb-count">{r.weekReports} report{r.weekReports !== 1 ? 's' : ''}</div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
}
