import { useMemo, useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ClipboardList, ShieldCheck, CheckCircle2, Recycle, MapPin, TrendingUp, TrendingDown, Bell, AlertCircle, Calendar, ChevronRight, Maximize, Activity, Clock, XCircle, BottleWine, Wrench, Trash2, GlassWater, Leaf, Droplets, Send, FileText, LogOut, ChevronDown, Users, Megaphone, BarChart3, Shield, UserCog } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';
import { useActivities } from '../../../hooks/useActivities';
import { useContributorStats } from '../../../hooks/useContributorStats';
import { useContributorImpact } from '../../../hooks/useContributorImpact';
import { useEvents } from '../../../hooks/useEvents';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import { contributorApi } from '../../../services/api';
import { eventStateMeta, verificationStateMeta } from '../eventMeta';
import MyAreasMap from '../components/MyAreasMap';
import CoastScene from '../components/CoastScene';
import CoastSceneNight from '../components/CoastSceneNight';

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
  /* The headline number of the row — a solid slab of ocean with a swell
     breaking across its foot, so it reads as the card you look at first. */
  .kpi-card--featured { color:#FFFFFF; }
  .kpi-card--featured .kpi-label { color:rgba(255,255,255,.8); }
  .kpi-card--featured .kpi-sub { color:rgba(255,255,255,.72); }
  .kpi-card--featured .kpi-value-unit { color:rgba(255,255,255,.82); }
  .kpi-card--featured .kpi-icon { background:rgba(255,255,255,.2); border:1px solid rgba(255,255,255,.32); color:#FFFFFF; }
  .kpi-card--featured .kpi-trend { background:rgba(255,255,255,.2); color:#FFFFFF; }
  .kpi-swell { position:absolute; left:0; right:0; bottom:0; height:56px; z-index:0; pointer-events:none; }
  .kpi-swell svg { display:block; width:100%; height:100%; }
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

  /* ── Community hero ── */
  .bm-hero {
    /* Glass, not solid — the one card meant to be looked through so the
       reef's motion stays visible behind the beach artwork and the text. */
    position:relative; overflow:hidden; background:var(--bm-hero-surface, var(--surface));
    backdrop-filter:blur(2px); -webkit-backdrop-filter:blur(2px);
    border:1px solid var(--border-light); border-radius:20px;
    box-shadow:0 1px 2px rgba(10,30,50,.04), 0 22px 44px -38px rgba(10,30,50,.45);
  }
  .bm-hero__main { position:relative; padding:1.55rem 1.9rem 1.9rem; min-height:334px; }
  .bm-hero__scene {
    position:absolute; inset:0 0 0 auto; width:min(56%,690px); z-index:0; pointer-events:none;
    -webkit-mask-image:linear-gradient(to right, transparent 0%, rgba(0,0,0,.35) 32%, #000 62%);
    mask-image:linear-gradient(to right, transparent 0%, rgba(0,0,0,.35) 32%, #000 62%);
  }
  .bm-hero__scene svg { display:block; width:100%; height:100%; }

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
    background:var(--surface-solid); border:1px solid var(--border-light); border-radius:12px;
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
    .bm-hero__scene { width:50%; }
  }
  @media(max-width:860px){
    .bm-hero__main { padding:1.3rem 1.4rem 1.6rem; min-height:0; }
    .bm-hero__scene { width:100%; opacity:.24; }
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

  /* ── Community values ──
     Standalone card beneath the hero — was fused to the hero's own surface
     as a bottom strip, split out so it reads as its own info card instead
     of trailing off the hero's rounded corners. */
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

  /* ── Dark theme ──
     The artwork swaps to the night scene in JSX; these rules carry the
     chrome across with it. Placed after the breakpoints above so they win
     on every width. */
  [data-theme="dark"] .bm-hero__logo {
    background:color-mix(in srgb, var(--primary) 15%, transparent); color:var(--primary);
    border:1px solid color-mix(in srgb, var(--primary) 26%, transparent);
  }
  /* The hero's own card background is glass in both themes now (it lets
     the reef swim through), so a piece of chrome sitting on it is really
     sitting on CoastSceneNight's night sky/sea — a mid-toned blue, not a
     solid dark surface. --primary-hover / --text-muted were tuned for
     high contrast against a solid dark card and read as barely-there here.
     Pinned to a light, halo'd/frosted treatment instead, same idea as
     .contrib-on-water below the hero. */
  [data-theme="dark"] .bm-hero__brand-name {
    color:#F2FBFF; text-shadow:0 1px 3px rgba(3,20,38,.7), 0 1px 10px rgba(3,20,38,.6);
  }
  [data-theme="dark"] .bm-hero__job {
    background:rgba(4,20,38,.55); color:#EDF7FD; border:1px solid rgba(160,210,240,.28);
    backdrop-filter:blur(8px); -webkit-backdrop-filter:blur(8px);
  }
  [data-theme="dark"] .bm-hero__btn--primary {
    background:linear-gradient(135deg,#0F7168,#18A294);
    box-shadow:0 20px 34px -20px rgba(24,162,148,.75);
  }
  [data-theme="dark"] .bm-hero__btn--primary:hover { background:linear-gradient(135deg,#13847A,#1EB7A6); }
  [data-theme="dark"] .bm-hero__btn--ghost {
    background:transparent; border-color:color-mix(in srgb, var(--primary) 50%, transparent); color:var(--primary);
  }
  [data-theme="dark"] .bm-hero__btn--ghost:hover {
    border-color:var(--primary); background:color-mix(in srgb, var(--primary) 10%, transparent);
  }
  [data-theme="dark"] .bm-hero__logout:hover,
  [data-theme="dark"] .bm-hero__btn--ghost:hover { box-shadow:0 10px 26px -16px rgba(0,0,0,.6); }
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

/* Brand mark shown in the hero's community bar. */
const BlueMindMark = () => (
  <svg width="26" height="26" viewBox="0 0 32 32" fill="none" aria-hidden="true">
    <path d="M16 3.6 27 9.6v12.8L16 28.4 5 22.4V9.6z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" opacity=".38" />
    <path d="M9.5 14.4c1.7-1.9 3.4-1.9 5.1 0s3.4 1.9 5.1 0 3.4-1.9 5.1 0" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" fill="none" transform="translate(-3.6 0)" />
    <path d="M9.5 19c1.7-1.9 3.4-1.9 5.1 0s3.4 1.9 5.1 0 3.4-1.9 5.1 0" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" fill="none" transform="translate(-3.6 0)" opacity=".55" />
  </svg>
);

/* The four reasons a contributor's report matters, shown as a strip along
   the foot of the hero card. */
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
    <div style={{ fontSize:'0.72rem', fontWeight:700, color:'var(--bm-loose-text, var(--text-muted))', textTransform:'uppercase', letterSpacing:'.06em' }}>
      {children}
    </div>
    {hint && <p style={{ margin:'0.15rem 0 0.6rem', fontSize:'0.74rem', color:'var(--bm-loose-text, var(--text-muted))', lineHeight:1.4 }}>{hint}</p>}
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
  const { user, role, logout } = useAuth();
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const navigate = useNavigate();

  const { activities, loading: actsLoading } = useActivities();
  const { stats, loading: statsLoading } = useContributorStats();
  const { impact, loading: impactLoading } = useContributorImpact();
  const { events: myEvents, loading: eventsLoading } = useEvents(user?.id);

  const [mapFullscreen, setMapFullscreen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [exportRange, setExportRange] = useState(defaultExportRange);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState('');

  // Close the hero's account menu on any click outside it.
  useEffect(() => {
    if (!accountOpen) return undefined;
    function onDocClick(e) {
      if (accountRef.current && !accountRef.current.contains(e.target)) setAccountOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [accountOpen]);

  function handleLogout() {
    setAccountOpen(false);
    logout();
    navigate('/login');
  }

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
      <div className="bm-hero">
        <div className="bm-hero__main">
          <div className="bm-hero__scene">{isLight ? <CoastScene /> : <CoastSceneNight />}</div>

          <div className="bm-hero__top">
            <div className="bm-hero__brand">
              <span className="bm-hero__brand-name">BlueMind Community</span>

              {user?.jobTitle && <span className="bm-hero__job" title={user.jobTitle}>{user.jobTitle}</span>}
            </div>

          </div>

          <div className="bm-hero__body">
            <h1 className="bm-hero__title">
              Hi {firstName},<br />
              thank you for being part of <span>Bluemind.</span>
            </h1>
            <p className="bm-hero__sub">
              Every activity you submit helps us understand pollution patterns,
              raise awareness, and build a cleaner, healthier planet together.
            </p>
            <div className="bm-hero__actions">
              <button
                id="hero-log-btn"
                type="button"
                className="bm-hero__btn bm-hero__btn--primary"
                onClick={() => navigate('/contributor/quick-report')}
              >
                <Send size={16} strokeWidth={2.25} />
                Submit Activity
              </button>
              <button
                id="export-report-btn"
                type="button"
                className="bm-hero__btn bm-hero__btn--ghost"
                onClick={() => setExportOpen((o) => !o)}
              >
                <FileText size={16} strokeWidth={2.25} className="bm-hero__lead-ico" />
                Export Report
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* ── COMMUNITY VALUES ── standalone info card, below the hero ── */}
      <Card className="contrib-values">
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
      </Card>

      {/* ── EXPORT FIELD REPORT PANEL ── */}
      {exportOpen && (
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
          <div className="contrib-on-water" style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'0.4rem' }}>
            <SectionLabel style={{ marginBottom:0 }}>Your Impact</SectionLabel>
            {rank && (
              <span style={{ fontSize:'0.74rem', color:'var(--bm-loose-text, var(--text-muted))' }}>
                Rank #{rank}{topPercent ? ` · Top ${topPercent}%` : ''} · {nf(totalTokens)} OCEAN tokens
              </span>
            )}
          </div>
          <div className="contrib-stats">
            {impactCards.map(({ key, label, value, unit, sub, Icon, accent, tint, trend, featured }) => (
              <Card key={key} className={`kpi-card${featured ? ' kpi-card--featured' : ''}`}
                style={{ transition:'border-color .2s,transform .2s,box-shadow .2s', cursor:'default',
                  ...(featured ? {
                    /* Glass like its neighbours, but tinted hard enough to
                       stay the one card the eye lands on first. */
                    background:'linear-gradient(150deg, rgba(47,143,214,.86) 0%, rgba(29,111,191,.88) 46%, rgba(20,83,155,.9) 100%)',
                    border:'1.5px solid rgba(255,255,255,.3)',
                    boxShadow:'0 18px 36px -22px rgba(20,83,155,.95)',
                  } : {}) }}
                onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-2px)'; if(!featured) e.currentTarget.style.borderColor='var(--border-glow)';}}
                onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)'; if(!featured) e.currentTarget.style.borderColor='var(--border-light)';}}
              >
                {featured && (
                  <div className="kpi-swell" aria-hidden="true">
                    <svg viewBox="0 0 240 56" preserveAspectRatio="none">
                      <path d="M0 30c34-16 66-16 100 0s66 16 100 0 40-10 40-10v36H0z" fill="#FFFFFF" opacity=".1" />
                      <path d="M0 40c34-16 66-16 100 0s66 16 100 0 40-8 40-8v24H0z" fill="#FFFFFF" opacity=".14" />
                      <path d="M0 34c34-16 66-16 100 0s66 16 100 0 40-10 40-10" fill="none" stroke="#FFFFFF" strokeWidth="1.5" opacity=".3" />
                    </svg>
                  </div>
                )}
                <div className="kpi-icon" style={featured ? undefined : { background: tint, color: accent }}>
                  <Icon size={20} strokeWidth={2.25} />
                </div>
                <div className="kpi-label">{label}</div>
                <div className="kpi-value-row">
                  <span className="kpi-value" style={{ color: featured ? '#FFFFFF' : accent }}>{value}</span>
                  {unit && <span className="kpi-value-unit">{unit}</span>}
                </div>
                <div className="kpi-sub">{sub}</div>
                <TrendPill value={trend} accent={featured ? null : accent} tint={tint} />
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
