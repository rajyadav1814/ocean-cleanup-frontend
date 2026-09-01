import { useMemo, useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';
import { useCitizenStats, useCitizenLeaderboard, useCitizenFeed } from '../../../hooks/useCitizen';
import { useEvents } from '../../../hooks/useEvents';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import SubmitActivity from '../../contributor/pages/SubmitActivity';
import MyAreasMap from '../../contributor/components/MyAreasMap';
import { eventStateMeta, verificationStateMeta } from '../../contributor/eventMeta';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bell, AlertCircle, Recycle, MapPin, Calendar, ShieldCheck, CheckCircle2, ChevronRight,
  BottleWine, Wrench, Trash2, GlassWater, Leaf, Droplets, FileText, Trophy, Award, Users,
  Weight, Medal, Waves, Shell, Flame, Anchor, Maximize, Send,
  Megaphone, BarChart3, Shield,
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
     into the rest of the application.
     --surface used to be a near-invisible 5.5% white wash — glassmorphism
     that read fine over a plain dark gradient, but over the animated reef
     behind the space now it left every stat and panel nearly see-through.
     Solid, like the light theme's own --surface always was, so business
     content stays readable and the water only shows in the gaps. */
  [data-theme="dark"] .co-root,
  .force-dark .co-root {
    --primary: #6FC9C4;
    --primary-hover: #A9D8F0;
    --secondary: #0B82C9;
    --warning: #F8B84E;
    --success: #6FC9C4;

    --surface: rgba(8, 24, 42, 0.93);
    --surface-hover: rgba(255, 255, 255, 0.08);
    --border-light: rgba(160,210,240,.24);
    --border-glow: #7FC3E8;

    --text-main: #F2F7FA;
    --text-muted: rgba(233,242,247,.74);
  }

  [data-theme="dark"] .co-stat,
  [data-theme="dark"] .co-panel,
  .force-dark .co-stat,
  .force-dark .co-panel {
    box-shadow: 0 24px 48px -30px rgba(3,12,22,.65);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
  }

  [data-theme="dark"] .co-badge.earned,
  .force-dark .co-badge.earned { background: rgba(46,158,155,.12); }

  /* Chrome (colors/shape/font/hover) comes from the shared .co-cta rule in
     styles.css — same button as the contributor space and My Activities.
     Still used by the empty-state CTA below; the hero itself now uses the
     .bm-hero__btn system shared with the Contributor Space. */
  .co-cta { cursor: pointer; flex-shrink: 0; margin-bottom: 2.75rem; }

  /* stat strip */
  .co-stats {
    display: grid; grid-template-columns: repeat(4,1fr);
    gap: 1rem; margin-bottom: 1.4rem;
  }
  .co-stat {
    position: relative; overflow: hidden; min-height: 246px;
    /* Content is centred on the card's axis: the illustrations are
       symmetrical, with the scene rising from both bottom corners, so a
       left-aligned block reads off-balance against them. */
    display: flex; flex-direction: column; align-items: center; text-align: center;
    background: var(--surface); border: 1px solid var(--border-light);
    border-radius: var(--radius-lg); padding: 1.6rem 1.6rem 1.75rem;
    box-shadow: 0 1px 2px rgba(10,30,50,.04);
    transition: border-color 0.2s, transform 0.2s;
  }
  .co-stat:hover { border-color: var(--border-glow); transform: translateY(-2px); }
  /* Each card's artwork is a painted illustration from /public/citizen
     (kpi-1..4), sized to cover the card and anchored to its foot so the
     scene sits below the copy the way the source art is composed. The PNGs
     are cropped to the artwork itself, so the image can run edge to edge
     under the card's own radius. */
  .co-stat-art { position: absolute; inset: 0; z-index: 0; pointer-events: none; overflow: hidden; border-radius: inherit; }
  .co-stat-art img { display: block; width: 100%; height: 100%; object-fit: cover; object-position: center bottom; }
  [data-theme="dark"] .co-stat-art, .force-dark .co-stat-art { opacity: .42; }
  .co-stat-top { position: relative; z-index: 1; display: flex; flex-direction: column; align-items: center; gap: 0.7rem; }
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
    font-size: 2rem; font-weight: 700; color: var(--stat-accent, var(--primary));
    margin-top: 0.15rem; line-height: 1; letter-spacing: -0.02em;
    font-family: var(--font-display);
  }
  .co-stat-value-unit { font-size: 1rem; font-weight: 600; color: var(--text-muted); margin-left: 0.25rem; }
  .co-stat-desc {
    position: relative; z-index: 1;
    display: flex; align-items: center; justify-content: center; gap: 0.4rem;
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

  /* map fullscreen toggle */
  .co-map-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 0.75rem; }
  .co-map-fs-btn {
    flex-shrink: 0; display: inline-flex; align-items: center; gap: 0.35rem;
    background: transparent; border: 1px solid var(--border-light); border-radius: 999px;
    color: var(--primary); font-size: 0.72rem; font-weight: 700; padding: 0.4rem 0.75rem;
    cursor: pointer; box-shadow: none !important; font-family: var(--font-sans); white-space: nowrap;
    transition: border-color .2s, background .2s;
  }
  .co-map-fs-btn:hover { border-color: var(--primary); background: rgba(46,158,155,0.08); }

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
  }
  @media (max-width: 520px) {
    .co-badges { grid-template-columns: repeat(2,1fr); }
    .co-stat   { padding: 1.25rem 1.3rem 1.4rem; min-height: 196px; }
    .co-stat-value { font-size: 1.6rem; }
    .co-panel  { padding: 1.2rem; }
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

  /* ── Community hero ──
     Glass, not solid — the reef behind the whole space stays visible
     through it, same treatment as the Contributor Space hero. */
  .bm-hero {
    position:relative; overflow:hidden; background:var(--bm-hero-surface, var(--surface));
    backdrop-filter:blur(2px); -webkit-backdrop-filter:blur(2px);
    border:1px solid var(--border-light); border-radius:20px;
    box-shadow:0 1px 2px rgba(10,30,50,.04), 0 22px 44px -38px rgba(10,30,50,.45);
    margin-bottom: 1.4rem;
  }
  .bm-hero__main { position:relative; padding:1.55rem 1.9rem 1.9rem; min-height:334px; }
  /* The hero artwork is a photograph (public/hero-light.png and its night
     counterpart), full-bleed across the card and faded out to the left by
     the mask so the greeting, copy and buttons sit on flat card surface. */
  .bm-hero__scene {
    position:absolute; inset:0; z-index:0; pointer-events:none;
    -webkit-mask-image:linear-gradient(to right, transparent 0%, transparent 24%, rgba(0,0,0,.42) 44%, #000 68%);
    mask-image:linear-gradient(to right, transparent 0%, transparent 24%, rgba(0,0,0,.42) 44%, #000 68%);
  }
  .bm-hero__scene img { display:block; width:100%; height:100%; object-fit:cover; object-position:70% center; }

  .bm-hero__top { position:relative; z-index:2; display:flex; align-items:center; justify-content:space-between; gap:1rem; }
  .bm-hero__brand { display:flex; align-items:center; gap:.85rem; min-width:0; flex:1 1 auto; flex-wrap:wrap; }
  .bm-hero__brand-id { display:flex; align-items:center; gap:.85rem; min-width:0; }
  .bm-hero__logo {
    width:48px; height:48px; flex-shrink:0; border-radius:999px; display:grid; place-items:center;
    background:color-mix(in srgb, var(--secondary) 14%, transparent); color:var(--secondary);
  }
  .bm-hero__brand-name {
    font-size:.8rem; font-weight:700; letter-spacing:.14em; text-transform:uppercase;
    color:var(--primary-hover); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
  }
  .bm-hero__member {
    display:inline-flex; align-items:center; gap:.4rem; padding:.45rem .8rem; border-radius:999px;
    background:color-mix(in srgb, var(--success) 16%, transparent); color:var(--success); font-size:.68rem; font-weight:700; letter-spacing:.1em;
    text-transform:uppercase; white-space:nowrap;
  }
  .bm-hero__job {
    display:inline-flex; align-items:center; padding:.45rem .8rem; border-radius:999px;
    background:var(--surface-hover); color:var(--text-muted); font-size:.68rem; font-weight:700;
    letter-spacing:.08em; text-transform:uppercase; white-space:nowrap;
    max-width:200px; overflow:hidden; text-overflow:ellipsis;
  }

  .bm-hero__account { position:relative; flex-shrink:0; }
  .bm-hero__logout {
    display:inline-flex; align-items:center; gap:.6rem; height:50px; padding:0 1.35rem;
    border-radius:999px; border:1px solid var(--border-light); background:var(--surface);
    color:var(--text-main); font-family:var(--font-sans); font-size:.72rem; font-weight:700;
    letter-spacing:.12em; text-transform:uppercase; white-space:nowrap; cursor:pointer;
    box-shadow:0 1px 2px rgba(10,30,50,.05); transition:border-color .2s, box-shadow .2s;
  }
  .bm-hero__logout:hover { border-color:var(--border-glow); box-shadow:0 10px 22px -14px rgba(10,30,50,.5); }
  .bm-hero__logout .bm-hero__lead-ico { color:var(--primary); }
  .bm-hero__logout .bm-hero__caret { color:var(--text-muted); transition:transform .2s; }
  .bm-hero__logout[aria-expanded="true"] .bm-hero__caret { transform:rotate(180deg); }
  .bm-hero__menu {
    position:absolute; top:calc(100% + .5rem); right:0; z-index:30; width:212px; overflow:hidden;
    background:var(--surface); border:1px solid var(--border-light); border-radius:12px;
    box-shadow:0 24px 44px -22px rgba(10,30,50,.5);
  }
  .bm-hero__menu-head { padding:.75rem .9rem; background:var(--surface-hover); border-bottom:1px solid var(--border-light); }
  .bm-hero__menu-name { font-size:.82rem; font-weight:700; color:var(--text-main); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .bm-hero__menu-role { margin-top:.15rem; font-size:.72rem; color:var(--text-muted); text-transform:capitalize; }
  .bm-hero__menu button {
    display:flex; align-items:center; gap:.65rem; width:100%; padding:.7rem .9rem;
    background:none; border:none; border-radius:0; box-shadow:none; cursor:pointer; text-align:left;
    font-family:var(--font-sans); font-size:.82rem; font-weight:600; color:var(--text-main);
  }
  .bm-hero__menu button:hover { background:var(--surface-hover); }
  .bm-hero__menu button.is-danger { color:var(--danger); }
  .bm-hero__menu button.is-danger:hover { background:color-mix(in srgb, var(--danger) 10%, transparent); }

  .bm-hero__body { position:relative; z-index:2; max-width:712px; margin-top:1.9rem; }
  .bm-hero__title {
    margin:0; color:var(--text-main); font-family:var(--font-display);
    font-size:clamp(1.8rem, 3.05vw, 2.52rem); font-weight:600; line-height:1.18; letter-spacing:-.032em;
  }
  .bm-hero__title span { color:var(--primary); }
  .bm-hero__sub {
    max-width:480px; margin:1.2rem 0 0; color:var(--text-muted);
    font-size:.97rem; line-height:1.62;
  }
  .bm-hero__actions { display:flex; flex-wrap:wrap; gap:.8rem; margin-top:1.8rem; }
  .bm-hero__btn {
    display:inline-flex; align-items:center; gap:.65rem; height:52px; padding:0 1.65rem;
    border:1px solid transparent; border-radius:999px; cursor:pointer; white-space:nowrap;
    font-family:var(--font-sans); font-size:.74rem; font-weight:700; letter-spacing:.12em; text-transform:uppercase;
    transition:transform .18s, box-shadow .2s, border-color .2s, background .2s;
  }
  .bm-hero__btn--primary {
    background:linear-gradient(135deg,#2C948B,#12665F); color:#FFFFFF;
    box-shadow:0 20px 32px -20px rgba(18,102,95,.9);
  }
  .bm-hero__btn--primary:hover { background:linear-gradient(135deg,#35A79D,#17796F); transform:translateY(-1px); }
  .bm-hero__btn--ghost {
    background:var(--surface); border-color:var(--border-light); color:var(--text-main);
    box-shadow:0 1px 2px rgba(10,30,50,.05);
  }
  .bm-hero__btn--ghost:hover { border-color:var(--border-glow); transform:translateY(-1px); }
  .bm-hero__btn--ghost .bm-hero__lead-ico { color:var(--primary); }

  @media(max-width:1080px){
    /* Narrower card: pull the fade further right so the copy column keeps
       the same clear run of flat surface it has on a wide screen. */
    .bm-hero__scene {
      -webkit-mask-image:linear-gradient(to right, transparent 0%, transparent 22%, rgba(0,0,0,.4) 46%, #000 72%);
      mask-image:linear-gradient(to right, transparent 0%, transparent 22%, rgba(0,0,0,.4) 46%, #000 72%);
    }
  }
  @media(max-width:860px){
    .bm-hero__main { padding:1.3rem 1.4rem 1.6rem; min-height:0; }
    /* Stacked layout — the photo goes behind the whole card, dimmed, with
       no fade, since there is no side-by-side column left to protect. */
    .bm-hero__scene {
      opacity:.22; -webkit-mask-image:none; mask-image:none;
    }
    .bm-hero__body { max-width:none; }
  }

  @media(max-width:640px){
    .bm-hero__logo { width:42px; height:42px; }
    .bm-hero__brand-name { font-size:.66rem; letter-spacing:.1em; }
    .bm-hero__logout { height:42px; padding:0 .85rem; font-size:.64rem; letter-spacing:.08em; gap:.45rem; }
    .bm-hero__sub { font-size:.9rem; }
    .bm-hero__actions { gap:.6rem; }
    .bm-hero__btn { flex:1 1 100%; justify-content:center; height:48px; }
  }
  /* Below this the wordmark would truncate mid-word, so the mark carries
     the brand on its own. */
  @media(max-width:560px){
    .bm-hero__brand-name { display:none; }
    .bm-hero__brand { gap:.6rem; }
    .bm-hero__member { padding:.4rem .65rem; font-size:.64rem; letter-spacing:.08em; }
  }

  /* ── Both themes ──
     The hero's glass fill already carries both themes (see --bm-hero-surface
     above); the primary button is the one thing that still needs a nudge —
     the light theme's deeper teal goes muddy against the reef. */
  .bm-hero__btn--primary {
    background:linear-gradient(135deg,#28A79C,#12786F);
    box-shadow:0 20px 34px -20px rgba(20,140,128,.85);
  }
  .bm-hero__btn--primary:hover { background:linear-gradient(135deg,#31BBAE,#178C81); }

  /* ── Dark theme ── */
  [data-theme="dark"] .bm-hero__logo {
    background:color-mix(in srgb, var(--primary) 15%, transparent); color:var(--primary);
    border:1px solid color-mix(in srgb, var(--primary) 26%, transparent);
  }
  /* The hero's own card background is glass in both themes (it lets the
     reef swim through), so a piece of chrome sitting on it is really
     sitting on the night hero photograph's sky/sea — a mid-toned blue, not a
     solid dark surface. --primary-hover / --text-muted were tuned for
     high contrast against a solid dark card and read as barely-there here.
     Pinned to a light, halo'd/frosted treatment instead. */
  [data-theme="dark"] .bm-hero__brand-name {
    color:#F2FBFF; text-shadow:0 1px 3px rgba(3,20,38,.7), 0 1px 10px rgba(3,20,38,.6);
  }
  [data-theme="dark"] .bm-hero__job {
    background:rgba(4,20,38,.55); color:#EDF7FD; border:1px solid rgba(160,210,240,.28);
    backdrop-filter:blur(8px); -webkit-backdrop-filter:blur(8px);
  }
  [data-theme="dark"] .bm-hero__btn--ghost {
    background:transparent; border-color:color-mix(in srgb, var(--primary) 50%, transparent); color:var(--primary);
  }
  [data-theme="dark"] .bm-hero__btn--ghost:hover {
    border-color:var(--primary); background:color-mix(in srgb, var(--primary) 10%, transparent);
  }
  [data-theme="dark"] .bm-hero__logout:hover,
  [data-theme="dark"] .bm-hero__btn--ghost:hover { box-shadow:0 10px 26px -16px rgba(0,0,0,.6); }

  /* ── Community values ──
     Standalone card beneath the hero, matching the Contributor Space —
     was fused to the hero's own surface as a bottom strip, split out so it
     reads as its own info card instead of trailing off the hero's rounded
     corners. */
  .contrib-values {
    display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:1.35rem 1.9rem;
    padding:1.4rem 1.6rem;
  }
  .contrib-value { display:flex; align-items:flex-start; gap:.85rem; min-width:0; }
  .contrib-value-icon { width:42px; height:42px; flex-shrink:0; border-radius:999px; display:grid; place-items:center; }
  .contrib-value-title { margin:0; font-size:.87rem; font-weight:700; color:var(--text-main); }
  .contrib-value-copy { min-width:0; max-width:166px; }
  .contrib-value-text { margin:.22rem 0 0; font-size:.78rem; line-height:1.5; color:var(--text-muted); }

  @media(max-width:1080px){
    .contrib-values { grid-template-columns:repeat(2,minmax(0,1fr)); }
  }
  @media(max-width:640px){
    .contrib-values { grid-template-columns:1fr; gap:1rem; padding:1.15rem 1.25rem; }
    .contrib-value-copy { max-width:none; }
  }

  [data-theme="dark"] .contrib-value-icon {
    border:1px solid color-mix(in srgb, currentColor 30%, transparent);
  }
  [data-theme="dark"] .contrib-value:not(:first-child) {
    border-left:1px solid var(--border-light); margin-left:-.95rem; padding-left:.95rem;
  }
  @media(max-width:640px){
    [data-theme="dark"] .contrib-value:not(:first-child) { border-left:none; margin-left:0; padding-left:0; }
  }
`;

/* Brand mark shown in the hero's community bar — mirrors the one on the
   Contributor Space so both spaces read as the same product. */
const BlueMindMark = () => (
  <svg width="26" height="26" viewBox="0 0 32 32" fill="none" aria-hidden="true">
    <path d="M16 3.6 27 9.6v12.8L16 28.4 5 22.4V9.6z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" opacity=".38" />
    <path d="M9.5 14.4c1.7-1.9 3.4-1.9 5.1 0s3.4 1.9 5.1 0 3.4-1.9 5.1 0" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" fill="none" transform="translate(-3.6 0)" />
    <path d="M9.5 19c1.7-1.9 3.4-1.9 5.1 0s3.4 1.9 5.1 0 3.4-1.9 5.1 0" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" fill="none" transform="translate(-3.6 0)" opacity=".55" />
  </svg>
);

// Tints are alpha-blended (not flat hex) so they read as a soft wash over
// whichever surface sits behind them instead of a flat light patch that
// would stand out against a dark card.
const HERO_VALUES = [
  { key:'awareness', title:'Raise Awareness', text:'Your reports help spread environmental awareness.',
    Icon: Megaphone, color:'#3B82F6', tint:'rgba(59,130,246,0.14)' },
  { key:'impact', title:'Drive Impact', text:'Data you share helps drive real-world action.',
    Icon: BarChart3, color:'#22A06B', tint:'rgba(34,160,107,0.14)' },
  { key:'trust', title:'Build Trust', text:'Verified reports create tamper-proof records.',
    Icon: Shield, color:'#7C5CD6', tint:'rgba(124,92,214,0.14)' },
  { key:'protect', title:'Protect Together', text:'Small actions today for a better tomorrow.',
    Icon: Leaf, color:'#CE9A2E', tint:'rgba(206,154,46,0.16)' },
];

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
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const navigate = useNavigate();
  const { stats, loading: sL } = useCitizenStats();
  const { leaderboard, myRow, loading: lL } = useCitizenLeaderboard();
  const { feed, loading: fL } = useCitizenFeed(24);
  const { events: myEvents, loading: eL } = useEvents(user?.id);
  const [tab, setTab] = useState('overview');
  const [toast, setToast] = useState('');
  const [mapFullscreen, setMapFullscreen] = useState(false);

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
  // activity rather than "what happened because of me." 'reassessed'
  // belongs here, not excluded from it — it's a closed report that got a
  // fresh corroborator and is being looked at again (spec §11), the
  // opposite of settled.
  const needsAttention = [...myEvents]
    .filter((e) => e.eventState !== 'addressed')
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const impactStories = [...myEvents]
    .filter((e) => e.eventState === 'addressed')
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    .slice(0, 6);

  return (
    <div className="co-root">
      <style>{STYLES}</style>

      {toast && <div className="co-toast">{toast}</div>}

      {/* ── Hero ── same Blue Mind hero used on the Contributor Space, so
          both spaces read as one product. Citizen has no export/report
          endpoint, so the hero carries a single CTA instead of the pair. */}
      <div className="bm-hero">
        <div className="bm-hero__main">
          <div className="bm-hero__scene" aria-hidden="true">
            <img src={isLight ? '/hero-light.png' : '/hero-dark.png'} alt="" loading="eager" decoding="async" />
          </div>

          <div className="bm-hero__top">
            <div className="bm-hero__brand">
              <span className="bm-hero__brand-name">BlueMind Community</span>
              {user?.jobTitle && <span className="bm-hero__job" title={user.jobTitle}>{user.jobTitle}</span>}
            </div>
          </div>

          <div className="bm-hero__body">
            <h1 className="bm-hero__title">
              Hi {firstName}, <span role="img" aria-label="waving hand">👋</span><br />
              Thank you for being part of <span>BlueMind.</span>
            </h1>
            <p className="bm-hero__sub">
              Every activity you submit helps us understand pollution patterns,
              raise awareness, and build a cleaner, healthier planet together.
            </p>
            <div className="bm-hero__actions">
              <button
                id="citizen-submit-hero"
                type="button"
                className="bm-hero__btn bm-hero__btn--primary"
                onClick={() => navigate('/citizen/quick-report')}
              >
                <Send size={16} strokeWidth={2.25} />
                Submit Activity
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* ── COMMUNITY VALUES ── standalone info card, below the hero ── */}
      <div className="co-panel contrib-values" style={{ marginBottom: '1.4rem' }}>
        {HERO_VALUES.map(({ key, title, text, Icon, color, tint }) => (
          <div key={key} className="contrib-value">
            <span className="contrib-value-icon" style={{ background: tint, color }}>
              <Icon size={19} strokeWidth={2.25} />
            </span>
            <div className="contrib-value-copy">
              <h3 className="contrib-value-title">{title}</h3>
              <p className="contrib-value-text">{text}</p>
            </div>
          </div>
        ))}
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
            key: 'reports', art: '/citizen/kpi-1.png', label: 'Reports', Icon: FileText, accent: 'var(--primary)', tint: 'rgba(46,158,155,.14)',
            value: s.totalReports || 0, unit: '',
            DescIcon: Calendar, sub: `since ${sinceLabel}`,
          },
          {
            key: 'waste', art: '/citizen/kpi-2.png', label: 'Waste logged', Icon: Trash2, accent: '#22c55e', tint: 'rgba(34,197,94,.14)',
            value: Number(s.totalKg || 0).toFixed(1), unit: 'kg',
            DescIcon: ShieldCheck, sub: 'verified + pending',
          },
          {
            key: 'badges', art: '/citizen/kpi-3.png', label: 'Badges earned', Icon: Award, accent: 'var(--warning)', tint: 'rgba(198,130,30,.14)',
            value: `${earned.length} / ${badges.length || 8}`, unit: '',
            DescIcon: MapPin, sub: badges.find(b => !b.earned)?.title || 'All earned!',
          },
          {
            key: 'rank', art: '/citizen/kpi-4.png', label: 'City rank', Icon: Trophy, accent: 'var(--secondary)', tint: 'rgba(20,102,158,.14)',
            value: s.cityRank ? `#${s.cityRank}` : '—', unit: '',
            DescIcon: Users, sub: lbRows.length ? `of ${lbRows.length} citizens` : 'not ranked yet',
          },
        ].map(({ key, label, Icon, accent, tint, value, unit, DescIcon, sub, art }) => (
          <div key={key} className="co-stat" style={{ '--stat-accent': accent, '--stat-tint': tint }}>
            <div className="co-stat-art" aria-hidden="true">
              <img src={art} alt="" loading="lazy" decoding="async" />
            </div>
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
        <div className="co-map-head">
          <div>
            <div className="co-panel-kicker">Your Areas</div>
            <div className="co-panel-title">Where you've reported</div>
            <div className="co-panel-desc">Colored by what's happening with each report.</div>
          </div>
          <button type="button" className="co-map-fs-btn" onClick={() => setMapFullscreen(true)}>
            <Maximize size={14} strokeWidth={2.5} />
            <span>Fullscreen</span>
          </button>
        </div>
        <MyAreasMap events={myEvents} isFullscreen={mapFullscreen} onExitFullscreen={() => setMapFullscreen(false)} />
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
