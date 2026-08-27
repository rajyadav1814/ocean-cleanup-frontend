import { useEffect, useState } from "react";
import {
  Droplets,
  MapPinned,
  Recycle,
  Trophy,
  ArrowRight,
  Waves,
} from "lucide-react";
import Chatbot from "../components/common/Chatbot";

/* ---------------------------------------------------------------------
   BLUEMIND — DASHBOARD LANDING
   Same token system as the marketing site: Instrument Sans / Instrument
   Serif italic, the navy → ocean → teal depth ramp, and the editorial
   numbered-row + wave-divider language used throughout bluemind.si.
   --------------------------------------------------------------------- */

const TOKENS = `
  @import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600&family=Instrument+Serif:ital@0;1&display=swap');

  .bm {
    --font-sans: 'Instrument Sans', ui-sans-serif, system-ui, -apple-system, sans-serif;
    --font-serif: 'Instrument Serif', ui-serif, Georgia, serif;

    --midnight: #04121F;
    --navy: #071B33;
    --ocean: #0A4F83;
    --marine: #14669E;
    --cobalt: #0B82C9;
    --blue-deep: #0E5280;
    --sky: #7FC3E8;
    --sky-2: #A9D8F0;
    --pale: #DFF4FF;
    --ice: #F2F9FD;

    --teal: #2E9E9B;
    --teal-light: #6FC9C4;

    --ink: #0A1E30;
    --ink-2: #3C566E;

    --on-dark: #F2F7FA;
    --on-dark-2: rgba(233,242,247,.68);
    --on-dark-3: rgba(233,242,247,.46);
    --line-dark: rgba(160,210,240,.16);

    font-family: var(--font-sans);
    color: var(--on-dark);
    background: linear-gradient(180deg, #05192E 0%, #072744 46%, #0A4F83 100%);
    position: relative;
    overflow: hidden;
    min-height: 100%;
  }

  .bm * { box-sizing: border-box; }
  .bm a { text-decoration: none; color: inherit; }

  .bm .serif { font-family: var(--font-serif); font-style: italic; font-weight: 400; color: var(--sky-2); }

  .bm .wrap { max-width: 1120px; margin-inline: auto; padding-inline: clamp(1.25rem, 4vw, 3rem); position: relative; z-index: 2; }

  .bm .eyebrow {
    display: inline-flex; align-items: center; gap: .55rem;
    font-size: .72rem; font-weight: 500; letter-spacing: .16em; text-transform: uppercase;
    color: var(--on-dark-3); margin-bottom: 1.25rem;
  }
  .bm .eyebrow .num { color: var(--sky); }
  .bm .eyebrow .dot { width: 5px; height: 5px; border-radius: 50%; background: var(--teal); }

  .bm h1, .bm h2, .bm h3 { font-weight: 500; letter-spacing: -.028em; line-height: 1.08; margin: 0; }
  .bm h2 { font-size: clamp(1.9rem, 1.4rem + 2vw, 2.75rem); }
  .bm h3 { font-size: 1.05rem; letter-spacing: -.012em; }

  .bm .lead { font-size: clamp(1.05rem, 1rem + .3vw, 1.2rem); line-height: 1.6; color: var(--on-dark-2); max-width: 46rem; }
  .bm .body { color: var(--on-dark-2); line-height: 1.65; max-width: 46rem; }
  .bm .small { font-size: .84rem; color: var(--on-dark-3); line-height: 1.55; }

  .bm .btn {
    display: inline-flex; align-items: center; gap: .55rem;
    padding: .85rem 1.5rem; border-radius: 100px; font-size: .74rem; font-weight: 600;
    letter-spacing: .1em; text-transform: uppercase; cursor: pointer; border: 1px solid transparent;
    transition: transform .2s ease, background .2s ease, border-color .2s ease;
  }
  .bm .btn--primary { background: linear-gradient(135deg, var(--teal-light), var(--teal)); color: #04121F; box-shadow: 0 18px 36px -12px rgba(46,158,155,.55); }
  .bm .btn--primary:hover { transform: translateY(-1px); }
  .bm .btn--ghost { background: rgba(255,255,255,.05); border-color: var(--line-dark); color: var(--on-dark); backdrop-filter: blur(8px); }
  .bm .btn--ghost:hover { background: rgba(255,255,255,.1); border-color: rgba(255,255,255,.3); }
  .bm .btn .arrow { transition: transform .25s cubic-bezier(.16,1,.3,1); }
  .bm .btn:hover .arrow { transform: translateX(3px); }

  /* --- hero --- */
  .bm-hero { position: relative; padding: clamp(4.5rem,6vw,6.5rem) 0 clamp(6rem,9vw,8rem); }
  .bm-hero__grid {
    position: absolute; inset: -10% -10% 0 -10%; z-index: 0;
    background-image: linear-gradient(rgba(255,255,255,.045) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.045) 1px, transparent 1px);
    background-size: 64px 64px;
    mask-image: radial-gradient(85% 65% at 72% 30%, #000 0%, transparent 72%);
    -webkit-mask-image: radial-gradient(85% 65% at 72% 30%, #000 0%, transparent 72%);
  }
  .bm-hero__tag { display: inline-flex; align-items: center; gap: .5rem; padding: .4rem .85rem; border: 1px solid var(--line-dark); border-radius: 100px; font-size: .72rem; font-weight: 500; letter-spacing: .12em; text-transform: uppercase; color: var(--on-dark-2); }
  .bm-hero__tag .dot { width: 5px; height: 5px; border-radius: 50%; background: var(--teal); }
  .bm-hero h1 { max-width: 16ch; margin-top: 1.6rem; font-size: clamp(2.4rem, 1.6rem + 3.6vw, 4rem); }
  .bm-hero__sub { margin-top: 1.5rem; }
  .bm-hero__actions { margin-top: 2.2rem; display: flex; flex-wrap: wrap; gap: .75rem; }

  .bm-figures {
    margin-top: clamp(3rem,5vw,4.5rem); padding-top: 1.75rem; border-top: 1px solid var(--line-dark);
    display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: clamp(1.25rem,3vw,2.5rem);
  }
  .bm-figures__n { font-family: var(--font-serif); font-style: normal; font-size: clamp(2rem,1.5rem+1.8vw,2.9rem); line-height: 1; letter-spacing: -.02em; margin-bottom: .5rem; background: linear-gradient(135deg, var(--sky-2) 10%, var(--teal-light) 100%); -webkit-background-clip: text; background-clip: text; color: transparent; }
  .bm-figures p { font-size: .92rem; color: var(--on-dark-2); max-width: 24ch; line-height: 1.5; }

  /* --- wave divider --- */
  .bm-wave { position: absolute; bottom: -1px; left: 0; width: 100%; height: clamp(90px, 12vw, 160px); z-index: 1; overflow: hidden; }
  .bm-wave svg { position: absolute; left: 0; bottom: 0; width: 200%; max-width: none; height: 100%; }
  .bm-wave .l1 { fill: rgba(127,195,232,.22); animation: bmWaveL 40s linear infinite; }
  .bm-wave .l2 { fill: rgba(46,158,155,.4); animation: bmWaveR 58s linear infinite; }
  .bm-wave .l3 { fill: var(--ocean); animation: bmWaveL 26s linear infinite; }
  .bm-wave .l4 { fill: var(--w4, #F2F9FD); animation: bmWaveR 32s linear infinite; }
  @keyframes bmWaveL { from { transform: translateX(0); } to { transform: translateX(-50%); } }
  @keyframes bmWaveR { from { transform: translateX(-50%); } to { transform: translateX(0); } }

  /* --- light section (why / rows) --- */
  .bm-why { background: linear-gradient(180deg, var(--ice) 0%, #E2EEF7 100%); color: var(--ink); padding-block: clamp(4rem,6vw,6rem); }
  .bm-why .eyebrow { color: var(--ink-2); }
  .bm-why .eyebrow .num { color: var(--marine); }
  .bm-why h2 { color: var(--ink); }
  .bm-why .lead, .bm-why .body { color: var(--ink-2); }

  .bm-rows { border-top: 1px solid #C8DAE7; margin-top: 2.5rem; }
  .bm-row { display: grid; grid-template-columns: 3.25rem minmax(0,1fr); gap: 0 1.5rem; padding-block: 1.6rem; border-bottom: 1px solid #C8DAE7; transition: background .25s ease; }
  .bm-row:hover { background: linear-gradient(90deg, rgba(11,130,201,.07), transparent 70%); }
  .bm-row__n { font-size: .78rem; font-weight: 500; letter-spacing: .08em; color: var(--marine); padding-top: .25rem; }
  .bm-row__body h3 { color: var(--ink); margin-bottom: .4rem; }
  .bm-row__body p { color: var(--ink-2); font-size: .95rem; max-width: 52ch; line-height: 1.55; margin: 0; }

  /* --- features / product duo --- */
  .bm-features { padding-block: clamp(4rem,6vw,6rem); position: relative; }
  .bm-features__grid { display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 1.1rem; margin-top: clamp(2.5rem,4vw,3.5rem); }
  .bm-panel { border: 1px solid var(--line-dark); border-radius: 12px; background: rgba(255,255,255,.035); padding: clamp(1.5rem,2vw,2rem); backdrop-filter: blur(6px); }
  .bm-panel__icon { display: grid; place-items: center; width: 2.6rem; height: 2.6rem; border-radius: 9px; background: rgba(46,158,155,.16); color: var(--teal-light); margin-bottom: 1.1rem; }
  .bm-panel h3 { margin-bottom: .5rem; }
  .bm-panel p { color: var(--on-dark-2); font-size: .92rem; line-height: 1.55; margin: 0; }

  /* --- CTA --- */
  .bm-cta { padding-bottom: clamp(4.5rem,7vw,6.5rem); }
  .bm-cta__panel { border: 1px solid var(--line-dark); border-radius: 16px; background: radial-gradient(120% 100% at 100% 0%, rgba(11,130,201,.18), transparent 60%), rgba(255,255,255,.03); padding: clamp(2rem,4vw,3rem); display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 1.75rem; }
  .bm-cta__panel h2 { max-width: 20ch; }

  .bm-signal { position: absolute; width: 5px; height: 5px; border-radius: 50%; background: var(--sky); box-shadow: 0 0 9px 1px rgba(127,195,232,.45); animation: bmPulse 5.5s ease infinite; }
  @keyframes bmPulse { 0%,100% { opacity: .2; } 50% { opacity: .85; } }

  .bm-in { opacity: 0; transform: translateY(14px); transition: opacity .6s cubic-bezier(.16,1,.3,1), transform .6s cubic-bezier(.16,1,.3,1); }
  .bm-in.show { opacity: 1; transform: none; }

  @media (max-width: 860px) {
    .bm-figures, .bm-features__grid { grid-template-columns: minmax(0,1fr); }
    .bm-row { grid-template-columns: minmax(0,1fr); gap: .5rem; }
  }

  @media (prefers-reduced-motion: reduce) {
    .bm-wave .l1, .bm-wave .l2, .bm-wave .l3, .bm-signal { animation: none; }
    .bm-in { opacity: 1; transform: none; }
  }
`;

function Wave({ topColor = "#F2F9FD" }) {
  return (
    <div className="bm-wave" aria-hidden="true">
      <svg className="l1" viewBox="0 0 2400 200" preserveAspectRatio="none">
        <path d="M0,74 Q300,44 600,74 T1200,74 T1800,74 T2400,74 L2400,200 L0,200 Z" />
      </svg>
      <svg className="l2" viewBox="0 0 2400 200" preserveAspectRatio="none">
        <path d="M0,102 Q150,120 300,102 T600,102 T900,102 T1200,102 T1500,102 T1800,102 T2100,102 T2400,102 L2400,200 L0,200 Z" />
      </svg>
      <svg className="l3" viewBox="0 0 2400 200" preserveAspectRatio="none">
        <path d="M0,122 Q300,148 600,122 T1200,122 T1800,122 T2400,122 L2400,200 L0,200 Z" />
      </svg>
      <svg className="l4" style={{ "--w4": topColor }} viewBox="0 0 2400 200" preserveAspectRatio="none">
        <path fill="var(--w4)" d="M0,146 Q300,172 600,146 T1200,146 T1800,146 T2400,146 L2400,200 L0,200 Z" />
      </svg>
    </div>
  );
}

function Reveal({ children, delay = 0, as: Tag = "div", ...rest }) {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setShown(true), 60 + delay);
    return () => clearTimeout(t);
  }, [delay]);
  return (
    <Tag className={`bm-in${shown ? " show" : ""}`} {...rest}>
      {children}
    </Tag>
  );
}

export default function DashboardLanding() {
  return (
    <div className="bm">
      <style>{TOKENS}</style>
      <Chatbot />

      {/* ================= HERO ================= */}
      <section className="bm-hero">
        <div className="bm-hero__grid" aria-hidden="true" />
        <span className="bm-signal" style={{ left: "88%", top: "14%" }} aria-hidden="true" />
        <span className="bm-signal" style={{ left: "93%", top: "58%", animationDelay: "2s" }} aria-hidden="true" />

        <div className="wrap">
          <Reveal as="span" className="bm-hero__tag" style={{ display: "inline-flex" }}>
            <span className="dot" aria-hidden="true" />
            Community dashboard
          </Reveal>

          <Reveal delay={70}>
            <h1>
              Every report, mapped, <span className="serif">measured, and moving.</span>
            </h1>
          </Reveal>

          <Reveal delay={130}>
            <p className="lead bm-hero__sub">
              Your dashboard for the litter you've logged and the dataset it feeds &mdash; photo reports, hotspots,
              and eco score, all in one place, in the same intelligence layer that powers Bluemind.
            </p>
          </Reveal>

          <Reveal delay={190} as="div" className="bm-hero__actions">
            <a className="btn btn--primary" href="/login">
              Start contributing <ArrowRight className="arrow" size={16} />
            </a>
            <a className="btn btn--ghost" href="https://forecast.bluemind.si/" target="_blank" rel="noopener noreferrer">
              Explore the map ↗
            </a>
          </Reveal>

          <Reveal delay={240} as="div" className="bm-figures">
            <div>
              <div className="bm-figures__n">8M t</div>
              <p>Plastic entering the ocean each year &mdash; the scale this dataset is built against.</p>
            </div>
            <div>
              <div className="bm-figures__n">1 photo</div>
              <p>Is all it takes to turn a piece of litter into a data point.</p>
            </div>
            <div>
              <div className="bm-figures__n">100%</div>
              <p>Open, community-owned &mdash; every report is visible on the shared map.</p>
            </div>
          </Reveal>
        </div>

        <Wave topColor="#F2F9FD" />
      </section>

      {/* ================= WHY ================= */}
      <section className="bm-why">
        <div className="wrap">
          <Reveal as="span" className="eyebrow" style={{ display: "inline-flex" }}>
            <span className="num">01</span>Why it works this way
          </Reveal>
          <Reveal delay={60}>
            <h2>
              Pollution is invisible <span className="serif" style={{ color: "var(--ocean)" }}>until it's measured.</span>
            </h2>
          </Reveal>
          <Reveal delay={110}>
            <p className="lead" style={{ marginTop: "1.1rem" }}>
              Most litter is never recorded, so cleanups happen blind and researchers lack ground-truth data. Your
              dashboard turns every report you file into part of a global sensing network.
            </p>
          </Reveal>

          <div className="bm-rows">
            <Reveal as="div" className="bm-row" delay={0}>
              <div className="bm-row__n">01</div>
              <div className="bm-row__body">
                <h3>Document</h3>
                <p>Snap a photo of any litter. It's identified by type, material, and likely environmental impact in seconds.</p>
              </div>
            </Reveal>
            <Reveal as="div" className="bm-row" delay={60}>
              <div className="bm-row__n">02</div>
              <div className="bm-row__body">
                <h3>Build the dataset</h3>
                <p>Each geotagged report joins an open map that NGOs, cities, and scientists can act on directly.</p>
              </div>
            </Reveal>
            <Reveal as="div" className="bm-row" delay={120}>
              <div className="bm-row__n">03</div>
              <div className="bm-row__body">
                <h3>Get rewarded</h3>
                <p>Earn Bronze to Platinum badges, build streaks, and grow your Eco Score with every report you file.</p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ================= FEATURES ================= */}
      <section className="bm-features">
        <div className="wrap">
          <Reveal as="span" className="eyebrow" style={{ display: "inline-flex" }}>
            <span className="num">02</span>On your dashboard
          </Reveal>
          <Reveal delay={60}>
            <h2>
              Three views into <span className="serif">what you've found.</span>
            </h2>
          </Reveal>

          <div className="bm-features__grid">
            <Reveal as="div" className="bm-panel" delay={0}>
              <span className="bm-panel__icon"><MapPinned size={20} /></span>
              <h3>Your reports</h3>
              <p>Every photo you've logged, plotted on the shared map with its type, material, and status.</p>
            </Reveal>
            <Reveal as="div" className="bm-panel" delay={70}>
              <span className="bm-panel__icon"><Recycle size={20} /></span>
              <h3>The shared dataset</h3>
              <p>See how your reports connect to hotspots, recurring waste types, and cleanup priorities nearby.</p>
            </Reveal>
            <Reveal as="div" className="bm-panel" delay={140}>
              <span className="bm-panel__icon"><Trophy size={20} /></span>
              <h3>Eco score &amp; badges</h3>
              <p>Track your streak, your badge tier, and how your contribution compares over time.</p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ================= CTA ================= */}
      <section className="bm-cta">
        <div className="wrap">
          <Reveal>
            <div className="bm-cta__panel">
              <div>
                <span className="eyebrow" style={{ display: "inline-flex", marginBottom: ".6rem" }}>
                  <Waves size={14} style={{ marginRight: 4 }} /> Ready when you are
                </span>
                <h2>File your next report and watch the map move.</h2>
              </div>
              <a className="btn btn--primary" href="/login">
                Log a report <ArrowRight className="arrow" size={16} />
              </a>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}