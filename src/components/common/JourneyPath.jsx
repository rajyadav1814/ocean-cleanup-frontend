import { Fragment } from 'react';
import { Send, ShieldCheck, Recycle, CheckCircle2 } from 'lucide-react';

/* "Where your report goes" — the 4-step pipeline every report moves
   through, shown as a connected node rail. Mirrors the BlueMind redesign's
   journey diagram: numbered/iconed circles on a gradient rail, each
   carrying a live count. Counts are derived from data the dashboards
   already fetch (environmental_events for the current user) — no separate
   endpoint. */
const STEPS = [
  { key: 'spotted',   label: 'You spot it',        sub: 'Reports you’ve sent in',  Icon: Send },
  { key: 'checking',  label: 'We check it',         sub: 'Being reviewed and corroborated', Icon: ShieldCheck },
  { key: 'dispatched', label: 'A crew goes out',    sub: 'Cleanup or follow-up underway', Icon: Recycle },
  { key: 'resolved',  label: 'You see the result',  sub: 'Closed and reported back to you', Icon: CheckCircle2 },
];

const STYLES = `
  .jp-path { display:flex; align-items:flex-start; gap:0; margin-top:0.5rem; }
  .jp-step { flex:1; display:flex; flex-direction:column; align-items:center; text-align:center; gap:0.6rem; position:relative; min-width:0; }
  .jp-rail {
    flex:1; height:2px; margin-top:26px; align-self:flex-start;
    background:linear-gradient(90deg, var(--primary), var(--secondary));
    opacity:0.4; min-width:24px;
  }
  .jp-node {
    width:52px; height:52px; border-radius:999px; flex-shrink:0;
    display:flex; align-items:center; justify-content:center;
    background:linear-gradient(135deg, var(--primary), var(--secondary));
    color:#fff; box-shadow:0 10px 24px -12px color-mix(in srgb, var(--secondary) 70%, transparent);
    position:relative;
  }
  .jp-count {
    position:absolute; top:-6px; right:-6px; min-width:20px; height:20px; padding:0 5px;
    border-radius:999px; background:var(--surface); border:1.5px solid var(--border-light);
    color:var(--text-main); font-size:0.66rem; font-weight:800; font-family:var(--font-sans, inherit);
    display:flex; align-items:center; justify-content:center;
  }
  .jp-label { font-size:0.8rem; font-weight:700; color:var(--text-main); line-height:1.25; }
  .jp-sub { font-size:0.7rem; color:var(--text-muted); line-height:1.35; max-width:14ch; }
  @media (max-width:860px) {
    .jp-path { flex-direction:column; align-items:stretch; gap:0.9rem; }
    .jp-step { flex-direction:row; text-align:left; align-items:center; }
    .jp-sub { max-width:none; }
    .jp-rail { width:2px; height:22px; flex:none; margin:0 0 0 25px; align-self:flex-start; }
  }
`;

export default function JourneyPath({ counts = {} }) {
  return (
    <div className="jp-path">
      <style>{STYLES}</style>
      {STEPS.map(({ key, label, sub, Icon }, i) => (
        <Fragment key={key}>
          <div className="jp-step">
            <div className="jp-node">
              <Icon size={20} strokeWidth={2.25} />
              <span className="jp-count">{counts[key] ?? 0}</span>
            </div>
            <div>
              <div className="jp-label">{label}</div>
              <div className="jp-sub">{sub}</div>
            </div>
          </div>
          {i < STEPS.length - 1 && <div className="jp-rail" />}
        </Fragment>
      ))}
    </div>
  );
}
