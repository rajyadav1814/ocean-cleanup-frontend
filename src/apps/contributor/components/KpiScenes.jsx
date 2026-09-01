/*  Painted scene backgrounds for the "Your Impact" KPI row.
 *
 *  Each card carries its own habitat — reef, turtle, cleaned beach, open
 *  ocean, lighthouse coast — drawn as inline SVG so the art scales with the
 *  card, costs no network round-trip, and can be tinted per theme. The art
 *  is anchored to the bottom-right and faded out toward the top-left by the
 *  `.kpi-art` mask in ContributorOverview's stylesheet, which is what keeps
 *  the label, value and trend pill fully legible on top of it.
 */

const SCENE_PROPS = {
  viewBox: '0 0 260 150',
  preserveAspectRatio: 'xMaxYMax slice',
  'aria-hidden': true,
  focusable: 'false',
};

/* ── CONTRIBUTIONS — a coral garden with a school of reef fish ── */
export const ReefScene = () => (
  <svg {...SCENE_PROPS}>
    <defs>
      <linearGradient id="kpi-reef-water" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#e2f1ff" />
        <stop offset="100%" stopColor="#b7d9f4" />
      </linearGradient>
      <linearGradient id="kpi-reef-sand" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#f0e3c8" />
        <stop offset="100%" stopColor="#dcc9a4" />
      </linearGradient>
      <linearGradient id="kpi-reef-fan" x1="0" y1="1" x2="0" y2="0">
        <stop offset="0%" stopColor="#e88ea6" />
        <stop offset="100%" stopColor="#f6b7c5" />
      </linearGradient>
      <linearGradient id="kpi-reef-stag" x1="0" y1="1" x2="0" y2="0">
        <stop offset="0%" stopColor="#e2884f" />
        <stop offset="100%" stopColor="#f7bb87" />
      </linearGradient>
    </defs>

    <rect width="260" height="150" fill="url(#kpi-reef-water)" opacity=".5" />

    {/* a school of fish, all one silhouette so they read as a group */}
    <g opacity=".5" fill="#5f9fcd">
      <g transform="translate(150 30)">
        <path d="M0 0c7-6 17-6 22 0-5 6-15 6-22 0z" />
        <path d="M0 0l-8-5v10z" />
      </g>
      <g transform="translate(186 46) scale(.78)">
        <path d="M0 0c7-6 17-6 22 0-5 6-15 6-22 0z" />
        <path d="M0 0l-8-5v10z" />
      </g>
      <g transform="translate(214 24) scale(.62)">
        <path d="M0 0c7-6 17-6 22 0-5 6-15 6-22 0z" />
        <path d="M0 0l-8-5v10z" />
      </g>
    </g>

    {/* reef shelf */}
    <path d="M96 140c26-8 44-3 70-9s48-17 94-7v28H96z" fill="url(#kpi-reef-sand)" opacity=".9" />

    {/* sea fan — a solid blade with radiating ribs, not loose noodles */}
    <g transform="translate(148 128)" opacity=".8">
      <path d="M0 0c-16-4-24-18-21-32 3-13 15-21 27-19s20 14 18 28C22-9 13-2 0 0z" fill="url(#kpi-reef-fan)" opacity=".75" />
      <g stroke="#ffffff" strokeWidth="1.2" opacity=".45" fill="none" strokeLinecap="round">
        <path d="M2 -2c-4-11-4-22-1-31M2 -2c-9-8-13-18-13-27M2 -2c6-10 9-20 9-29" />
      </g>
      <path d="M0 2c-1-6 0-11 2-14" stroke="#d1748d" strokeWidth="3.5" fill="none" strokeLinecap="round" />
    </g>

    {/* staghorn coral — asymmetric branching, thinning toward the tips */}
    <g transform="translate(196 134)" opacity=".85" fill="none" strokeLinecap="round" stroke="url(#kpi-reef-stag)">
      <path d="M0 0c-1-9 0-15 2-20" strokeWidth="6.5" />
      <path d="M1 -13c-5-3-9-8-10-14" strokeWidth="5" />
      <path d="M2 -18c5-2 9-7 11-13" strokeWidth="5" />
      <path d="M-9 -27c-1-6-4-10-8-13" strokeWidth="3.6" />
      <path d="M-8 -26c3-4 4-9 4-14" strokeWidth="3.4" />
      <path d="M13 -31c1-6 1-11 0-15" strokeWidth="3.6" />
      <path d="M12 -30c4-3 8-4 12-4" strokeWidth="3.2" />
      <path d="M2 -20c0-7 2-12 5-16" strokeWidth="4.2" />
    </g>

    {/* brain coral — a dome with contour grooves */}
    <g transform="translate(232 138)" opacity=".8">
      <path d="M-17 4a17 14 0 0 1 34 0z" fill="#f2c79c" />
      <g stroke="#dda877" strokeWidth="1.4" fill="none" opacity=".85">
        <path d="M-11 4c0-6 5-9 11-9s11 3 11 9" />
      </g>
    </g>

    {/* tube sponges */}
    <g transform="translate(170 136)" opacity=".65">
      <path d="M-4 2v-16a4 4 0 0 1 8 0V2z" fill="#e8a5b8" />
      <path d="M6 2v-11a3.5 3.5 0 0 1 7 0V2z" fill="#efb9c8" />
    </g>

    {/* seagrass tufts, drawn as tapered blades */}
    <g fill="#6fbb9c" opacity=".75">
      <path d="M118 136c-6-10-6-20-2-27 1 9 3 18 6 27z" />
      <path d="M126 136c-2-11 1-20 6-26-1 9-2 18-2 26z" />
      <path d="M134 136c2-9 6-16 12-19-4 6-7 12-8 19z" />
    </g>

    {/* bubbles */}
    <g fill="#ffffff" opacity=".45">
      <circle cx="228" cy="62" r="2.4" /><circle cx="238" cy="48" r="1.5" /><circle cx="170" cy="18" r="1.8" />
    </g>
  </svg>
);

/* ── VERIFIED — a sea turtle gliding through seagrass ── */
export const TurtleScene = () => (
  <svg {...SCENE_PROPS}>
    <defs>
      <linearGradient id="kpi-turtle-water" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#e0f2ec" />
        <stop offset="100%" stopColor="#b2d9cf" />
      </linearGradient>
      <linearGradient id="kpi-turtle-shell" x1="0.2" y1="0" x2="0.8" y2="1">
        <stop offset="0%" stopColor="#6d9d88" />
        <stop offset="100%" stopColor="#3d6a5a" />
      </linearGradient>
      <linearGradient id="kpi-turtle-limb" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#5c8b78" />
        <stop offset="100%" stopColor="#40705f" />
      </linearGradient>
    </defs>

    <rect width="260" height="150" fill="url(#kpi-turtle-water)" opacity=".5" />

    {/* light shafts */}
    <g fill="#ffffff" opacity=".16">
      <path d="M150 0l22 0-40 150-16 0z" />
      <path d="M198 0l12 0-26 150-9 0z" />
    </g>

    {/* seagrass meadow — tapered blades, tallest at the back */}
    <g fill="#6fb99e" opacity=".6">
      <path d="M126 150c-9-26-8-46 0-60 0 21 3 41 8 60z" />
      <path d="M142 150c-6-22-4-38 3-50-2 17-1 33 3 50z" />
      <path d="M232 150c-8-24-7-42 1-55 0 19 2 37 7 55z" />
      <path d="M248 150c-5-19-3-34 3-45-2 15-1 30 2 45z" />
    </g>

    {/* turtle, gliding down-right */}
    <g transform="translate(176 62) rotate(10)" opacity=".95">
      {/* far front flipper, behind the shell */}
      <path d="M6 -8c11-13 25-19 31-15 6 4 0 16-14 23-6 3-13 2-17-2z" fill="#33604f" opacity=".8" />
      {/* rear flipper */}
      <path d="M-27 11c-11 1-20 8-18 14 2 6 11 6 19 1 5-3 7-9 6-14z" fill="url(#kpi-turtle-limb)" />

      {/* carapace */}
      <path d="M-30 4c0-16 13-27 30-27s30 11 30 27c0 15-13 26-30 26S-30 19-30 4z" fill="url(#kpi-turtle-shell)" />
      {/* marginal scutes ring */}
      <path d="M-30 4c0-16 13-27 30-27s30 11 30 27c0 15-13 26-30 26S-30 19-30 4z"
            fill="none" stroke="#8fbcaa" strokeWidth="1.4" opacity=".5" />
      <path d="M-23 4c0-12 10-20 23-20s23 8 23 20c0 11-10 19-23 19S-23 15-23 4z"
            fill="none" stroke="#8fbcaa" strokeWidth="1.4" opacity=".5" />
      {/* vertebral + costal scutes */}
      <g stroke="#8fbcaa" strokeWidth="1.3" opacity=".45" fill="none">
        <path d="M-8 -15v38M8 -15v38M-23 -2h46M-30 4h7M53 4h-7" />
      </g>
      {/* highlight along the top of the shell */}
      <path d="M-22 -6c4-9 12-14 22-14" stroke="#a9cfbf" strokeWidth="2.6" fill="none" strokeLinecap="round" opacity=".45" />

      {/* near front flipper, sweeping forward over the shell line */}
      <path d="M13 0c13-12 30-16 36-10 6 6-5 18-21 24-8 3-14 1-16-5-1-3-1-6 1-9z" fill="url(#kpi-turtle-limb)" />
      <path d="M22 3c8-5 17-9 24-10" stroke="#8fbcaa" strokeWidth="1.3" fill="none" opacity=".4" strokeLinecap="round" />

      {/* rear near flipper */}
      <path d="M3 27c6 10 6 21 0 24-6 2-12-7-13-17-1-4 1-7 4-8z" fill="#33604f" opacity=".9" />

      {/* head and neck */}
      <path d="M27 -14c8-8 19-9 24-3 5 6 1 15-8 18-8 3-16 0-19-6z" fill="url(#kpi-turtle-limb)" />
      <circle cx="44" cy="-12" r="2.1" fill="#22463a" />
      <path d="M52 -10c2 0 3 1 3 2" stroke="#22463a" strokeWidth="1.3" fill="none" strokeLinecap="round" />
    </g>

    {/* bubbles trailing the turtle */}
    <g fill="#ffffff" opacity=".45">
      <circle cx="230" cy="36" r="2.6" /><circle cx="242" cy="22" r="1.6" /><circle cx="220" cy="20" r="1.2" />
    </g>
  </svg>
);

/* ── ACTIONS COMPLETED — collected waste bagged on a cleaned shoreline ── */
export const BeachScene = () => (
  <svg {...SCENE_PROPS}>
    <defs>
      <linearGradient id="kpi-beach-sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#fde8cf" />
        <stop offset="100%" stopColor="#fbd9be" />
      </linearGradient>
      <linearGradient id="kpi-beach-sand" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#f2dcb8" />
        <stop offset="100%" stopColor="#e4c79b" />
      </linearGradient>
      <linearGradient id="kpi-beach-bag" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#4a5560" />
        <stop offset="100%" stopColor="#2b333c" />
      </linearGradient>
    </defs>

    <rect width="260" height="150" fill="url(#kpi-beach-sky)" opacity=".6" />

    {/* headland */}
    <path d="M132 84c14-14 28-16 42-8s24 6 38-4 32-8 48 6v20H132z" fill="#dcb894" opacity=".55" />

    {/* sea */}
    <path d="M96 96h164v18H96z" fill="#9dc6da" opacity=".6" />
    <path d="M96 110c22-6 40 6 62 0s42-8 62-2 26 4 40 0v10H96z" fill="#7fb3cd" opacity=".55" />

    {/* foam line */}
    <path d="M96 116c24-4 42 5 64 1s44-6 62-1 22 3 38 0" stroke="#ffffff" strokeWidth="3" fill="none" opacity=".7" strokeLinecap="round" />

    {/* sand */}
    <path d="M96 120c26-3 44 4 66 2s46-5 66-1 20 3 32 1v28H96z" fill="url(#kpi-beach-sand)" opacity=".9" />

    {/* bags */}
    <g opacity=".92">
      <path d="M186 146c-9 0-14-5-13-13 1-9 6-16 13-19l4-3 5 3c7 3 12 10 12 19 0 8-5 13-14 13z" fill="url(#kpi-beach-bag)" />
      <path d="M186 111c2-4 8-4 10 0-3 2-7 2-10 0z" fill="#38424c" />
      <path d="M192 118c-4 5-6 13-5 22" stroke="#6d7883" strokeWidth="1.6" fill="none" opacity=".6" />

      <path d="M216 148c-8 0-12-5-11-12 1-8 5-14 11-16l4-3 4 3c6 3 10 9 10 16 0 7-4 12-12 12z" fill="url(#kpi-beach-bag)" />
      <path d="M216 118c2-3 7-3 9 0-3 2-6 2-9 0z" fill="#38424c" />
    </g>

    {/* driftwood + pebbles */}
    <g opacity=".45">
      <path d="M142 140c8-3 16-2 22 1" stroke="#b9925f" strokeWidth="3" fill="none" strokeLinecap="round" />
      <circle cx="128" cy="132" r="2.4" fill="#c9ab84" />
      <circle cx="248" cy="136" r="3" fill="#c9ab84" />
    </g>
  </svg>
);

/* ── WASTE REMOVED (featured) — a bottle lifted out of the water column ── */
export const OceanScene = () => (
  <svg {...SCENE_PROPS}>
    <defs>
      <linearGradient id="kpi-ocean-deep" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#3f9ad6" stopOpacity=".55" />
        <stop offset="100%" stopColor="#0d4d86" stopOpacity=".65" />
      </linearGradient>
      <linearGradient id="kpi-ocean-bottle" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#ffffff" stopOpacity=".85" />
        <stop offset="55%" stopColor="#cfeaf7" stopOpacity=".55" />
        <stop offset="100%" stopColor="#ffffff" stopOpacity=".3" />
      </linearGradient>
    </defs>

    <rect width="260" height="150" fill="url(#kpi-ocean-deep)" />

    {/* light shafts from the surface */}
    <g fill="#ffffff" opacity=".07">
      <path d="M136 0h26l-30 150h-18z" />
      <path d="M186 0h14l-20 150h-10z" />
      <path d="M226 0h20l-22 150h-14z" />
    </g>

    {/* drifting bubbles */}
    <g fill="#ffffff" opacity=".38">
      <circle cx="142" cy="44" r="3" /><circle cx="152" cy="26" r="1.8" />
      <circle cx="238" cy="58" r="2.4" /><circle cx="228" cy="38" r="1.5" />
      <circle cx="196" cy="18" r="1.8" />
    </g>

    {/* plastic bottle drifting */}
    <g transform="translate(196 78) rotate(14)" opacity=".92">
      <rect x="-13" y="-16" width="26" height="52" rx="9" fill="url(#kpi-ocean-bottle)" />
      <path d="M-6 -16v-9c0-3 2-5 6-5s6 2 6 5v9z" fill="#ffffff" opacity=".55" />
      <rect x="-8" y="-33" width="16" height="7" rx="2.5" fill="#bfe4f5" opacity=".8" />
      <rect x="-13" y="0" width="26" height="15" fill="#ffffff" opacity=".22" />
      <path d="M-7 -8v34" stroke="#ffffff" strokeWidth="2" opacity=".45" strokeLinecap="round" />
    </g>

    {/* swell across the foot of the card */}
    <path d="M0 118c36-16 70-16 106 0s70 16 106 0 48-10 48-10v42H0z" fill="#ffffff" opacity=".1" />
    <path d="M0 128c36-16 70-16 106 0s70 16 106 0 48-8 48-8v30H0z" fill="#ffffff" opacity=".14" />
    <path d="M0 122c36-16 70-16 106 0s70 16 106 0 48-10 48-10" fill="none" stroke="#ffffff" strokeWidth="1.5" opacity=".3" />
  </svg>
);

/* ── LOCATIONS AFFECTED — a lighthouse marking the mapped coastline ── */
export const LighthouseScene = () => (
  <svg {...SCENE_PROPS}>
    <defs>
      <linearGradient id="kpi-light-sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#e6e6fb" />
        <stop offset="100%" stopColor="#cfd8f6" />
      </linearGradient>
      <linearGradient id="kpi-light-rock" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#8d8fae" />
        <stop offset="100%" stopColor="#5f6285" />
      </linearGradient>
    </defs>

    <rect width="260" height="150" fill="url(#kpi-light-sky)" opacity=".6" />

    {/* beam */}
    <path d="M204 44l-72 12 72 12z" fill="#fde8b0" opacity=".45" />

    {/* lighthouse */}
    <g opacity=".95">
      <path d="M198 118l4-56h14l4 56z" fill="#f4f5fb" />
      <path d="M202 78h16M201 92h18M200 106h20" stroke="#c3538c" strokeWidth="4" opacity=".55" />
      <rect x="200" y="55" width="18" height="8" rx="2" fill="#6a6f95" />
      <rect x="203" y="45" width="12" height="11" rx="2" fill="#fbdf9a" />
      <path d="M203 45l6-8 6 8z" fill="#6a6f95" />
      <circle cx="209" cy="50" r="2.6" fill="#fff3cd" />
    </g>

    {/* headland */}
    <path d="M164 150c6-24 20-36 44-36s38 12 46 36z" fill="url(#kpi-light-rock)" opacity=".75" />
    <path d="M182 150c8-14 18-20 30-20" stroke="#a4a7c4" strokeWidth="2.5" fill="none" opacity=".5" />

    {/* sea */}
    <path d="M0 128c30-8 54 4 84-2s52-10 82-4v28H0z" fill="#8fa8dd" opacity=".55" />
    <path d="M0 136c30-7 54 4 84-2s52-8 82-3" stroke="#ffffff" strokeWidth="2.5" fill="none" opacity=".55" strokeLinecap="round" />

    {/* map pins dotting the coast */}
    <g opacity=".5" fill="#7c6ad6">
      <path d="M118 112c0-4 3-7 7-7s7 3 7 7c0 5-7 12-7 12s-7-7-7-12z" />
      <circle cx="125" cy="112" r="2.4" fill="#ffffff" />
      <path d="M152 100c0-3 2-5 5-5s5 2 5 5c0 4-5 9-5 9s-5-5-5-9z" />
      <circle cx="157" cy="100" r="1.8" fill="#ffffff" />
    </g>

    {/* gulls */}
    <g stroke="#8a8fb5" strokeWidth="1.8" fill="none" opacity=".5" strokeLinecap="round">
      <path d="M140 34c3-4 6-4 8 0M150 26c2-3 5-3 7 0" />
    </g>
  </svg>
);

export const KPI_SCENES = {
  contributions: ReefScene,
  verified: TurtleScene,
  actions: BeachScene,
  waste: OceanScene,
  locations: LighthouseScene,
};

export default KPI_SCENES;
