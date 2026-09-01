/* ─────────────────────────────────────────────────────────────────────────
   ReefScene — the living underwater artwork behind the Contributor Space
   hero (and, at low opacity, behind the whole space shell).

   Drawn inline as SVG rather than shipped as a photo so it stays crisp at
   any size, weighs nothing, and can actually *move*: the turtle and the
   fish swim across the scene, seaweed sways, light rays sweep, and bubbles
   rise. All motion is CSS keyframes on nested <g> wrappers — one wrapper
   per axis of movement, because an element's `transform` presentation
   attribute is overridden by a CSS `transform`, so travel, bob, and the
   static place/scale/flip each need their own layer.

   Purely decorative — hidden from assistive tech, and every animation is
   dropped under `prefers-reduced-motion`.
   ───────────────────────────────────────────────────────────────────────── */

const CSS = `
/* Travel paths. Fish enter well off one edge and leave off the other so
   they never pop into existence mid-water. */
@keyframes bmReefSwimL { from { transform: translateX(1900px); } to { transform: translateX(-380px); } }
@keyframes bmReefSwimR { from { transform: translateX(-380px); } to { transform: translateX(1900px); } }
/* Vertical drift laid over the travel, so nothing crosses on a flat line. */
@keyframes bmReefBob { 0%,100% { transform: translateY(-14px); } 50% { transform: translateY(16px); } }
@keyframes bmReefBobFar { 0%,100% { transform: translateY(-7px); } 50% { transform: translateY(8px); } }
/* Body/tail articulation. */
@keyframes bmReefTail { 0%,100% { transform: rotate(13deg); } 50% { transform: rotate(-13deg); } }
@keyframes bmReefFin  { 0%,100% { transform: rotate(-9deg); } 50% { transform: rotate(9deg); } }
@keyframes bmReefFlipperF { 0%,100% { transform: rotate(-20deg); } 50% { transform: rotate(17deg); } }
@keyframes bmReefFlipperB { 0%,100% { transform: rotate(9deg); } 50% { transform: rotate(-8deg); } }
@keyframes bmReefGlide { 0%,100% { transform: translateY(-9px) rotate(-2.2deg); } 50% { transform: translateY(10px) rotate(2.2deg); } }
/* Plants anchored at the seabed, hinging from their base. */
@keyframes bmReefSway { 0%,100% { transform: rotate(-5.5deg); } 50% { transform: rotate(5.5deg); } }
@keyframes bmReefSwayS { 0%,100% { transform: rotate(3.5deg); } 50% { transform: rotate(-3.5deg); } }
/* Octopus arms and jellyfish tentacles hang from a body above them, so they
   hinge at the top rather than the bottom the plants use. */
@keyframes bmReefHang  { 0%,100% { transform: rotate(-7deg); } 50% { transform: rotate(7deg); } }
@keyframes bmReefHangS { 0%,100% { transform: rotate(4.5deg); } 50% { transform: rotate(-4.5deg); } }
/* A jellyfish's bell contracting to push itself along. */
@keyframes bmReefPulse { 0%,100% { transform: scaleY(1) scaleX(1); } 45% { transform: scaleY(.78) scaleX(1.1); } }
/* The slow rise and fall of an octopus's mantle at rest. */
@keyframes bmReefBreathe { 0%,100% { transform: scale(1); } 50% { transform: scale(.94); } }
/* Sunlight through a moving surface. */
@keyframes bmReefRay { 0%,100% { opacity:.16; transform: translateX(-26px) scaleX(.9); } 50% { opacity:.5; transform: translateX(26px) scaleX(1.12); } }
@keyframes bmReefCaustic { from { transform: translateX(0); } to { transform: translateX(-400px); } }
/* Bubbles rise, wobble, and fade near the surface. */
@keyframes bmReefBubble {
  0%   { transform: translateY(0) translateX(0); opacity: 0; }
  12%  { opacity: .55; }
  50%  { transform: translateY(-330px) translateX(22px); opacity: .5; }
  100% { transform: translateY(-660px) translateX(-14px); opacity: 0; }
}
@keyframes bmReefMote { 0%,100% { transform: translate(0,0); opacity:.18; } 50% { transform: translate(14px,-22px); opacity:.5; } }

.bm-reef { display:block; width:100%; height:100%; }
.bm-reef__travel-l { animation: bmReefSwimL linear infinite; }
.bm-reef__travel-r { animation: bmReefSwimR linear infinite; }
.bm-reef__bob      { animation: bmReefBob 6.5s ease-in-out infinite; }
.bm-reef__bob--far { animation: bmReefBobFar 5s ease-in-out infinite; }
.bm-reef__glide    { animation: bmReefGlide 9s ease-in-out infinite; transform-box: fill-box; transform-origin: center; }
.bm-reef__tail     { animation: bmReefTail .52s ease-in-out infinite; transform-box: fill-box; transform-origin: right center; }
.bm-reef__fin      { animation: bmReefFin 1.1s ease-in-out infinite; transform-box: fill-box; transform-origin: top center; }
.bm-reef__flip-f   { animation: bmReefFlipperF 2.6s ease-in-out infinite; transform-box: fill-box; transform-origin: right center; }
.bm-reef__flip-b   { animation: bmReefFlipperB 2.6s ease-in-out infinite; transform-box: fill-box; transform-origin: right center; }
.bm-reef__sway     { animation: bmReefSway 6s ease-in-out infinite; transform-box: fill-box; transform-origin: bottom center; }
.bm-reef__sway--s  { animation: bmReefSwayS 4.4s ease-in-out infinite; transform-box: fill-box; transform-origin: bottom center; }
.bm-reef__hang     { animation: bmReefHang 3.2s ease-in-out infinite; transform-box: fill-box; transform-origin: top center; }
.bm-reef__hang--s  { animation: bmReefHangS 2.5s ease-in-out infinite; transform-box: fill-box; transform-origin: top center; }
.bm-reef__pulse    { animation: bmReefPulse 2.6s ease-in-out infinite; transform-box: fill-box; transform-origin: center top; }
.bm-reef__breathe  { animation: bmReefBreathe 4.4s ease-in-out infinite; transform-box: fill-box; transform-origin: center; }
.bm-reef__ray      { animation: bmReefRay 11s ease-in-out infinite; transform-box: fill-box; transform-origin: top center; }
.bm-reef__caustic  { animation: bmReefCaustic 26s linear infinite; }
.bm-reef__bubble   { animation: bmReefBubble linear infinite; }
.bm-reef__mote     { animation: bmReefMote ease-in-out infinite; }

@media (prefers-reduced-motion: reduce) {
  .bm-reef * { animation: none !important; }
}
`;

/* ── Fish ──────────────────────────────────────────────────────────────────
   Facing convention: every animal below is drawn head-left — eye at negative
   x, tail at positive x. So a swimmer on `bm-reef__travel-l` keeps a positive
   x scale, and one on `bm-reef__travel-r` must negate it. Get the pair wrong
   and the animal moons across the scene tail-first. */

/* Clownfish: orange body, three white bands with dark piping, wagging tail. */
const Clownfish = ({ tail = '.42s' }) => (
  <g>
    <g className="bm-reef__tail" style={{ animationDuration: tail }}>
      <path d="M30 0c14-11 26-15 34-13-5 8-5 18 0 27-8 2-20-3-34-14z" fill="#E8721F" />
      <path d="M32 0c11-8 20-11 26-10-4 6-4 13 0 20-6 1-15-2-26-10z" fill="#F79441" opacity=".85" />
    </g>
    <path d="M-34 0c0-15 14-25 32-25 12 0 22 5 30 12 4 4 6 9 6 13s-2 9-6 13c-8 7-18 12-30 12-18 0-32-10-32-25z" fill="#F4801E" />
    <path d="M-34 0c0-15 14-25 32-25 6 0 12 1 17 4-9 12-9 30 0 42-5 3-11 4-17 4-18 0-32-10-32-25z" fill="#FF9A3D" opacity=".55" />
    {/* Bands */}
    <path d="M-20-22c6 14 6 30 0 44-4-2-7-4-10-7 4-10 4-20 0-30 3-3 6-5 10-7z" fill="#FFF6EC" />
    <path d="M4-24c5 15 5 33 0 48l-8-2c5-14 5-30 0-44z" fill="#FFF6EC" />
    <path d="M25-19c4 12 4 26 0 38l-6-3c4-11 4-21 0-32z" fill="#FFF6EC" opacity=".92" />
    {/* Fins */}
    <g className="bm-reef__fin">
      <path d="M-6-24c8-9 18-12 24-8-4 5-6 10-6 15z" fill="#E8721F" />
    </g>
    <path d="M-4 20c7 8 15 11 21 8-4-4-6-8-6-13z" fill="#E8721F" />
    {/* Eye */}
    <circle cx="-20" cy="-5" r="6" fill="#FFFFFF" />
    <circle cx="-21" cy="-5" r="3.4" fill="#12222E" />
    <circle cx="-22.6" cy="-6.6" r="1.2" fill="#FFFFFF" />
  </g>
);

/* Blue tang: deep disc body, lemon tail, dark tail-bar. */
const BlueTang = () => (
  <g>
    <g className="bm-reef__tail" style={{ animationDuration: '.62s' }}>
      <path d="M28 0c15-13 28-18 36-16-6 10-6 22 0 32-8 2-21-3-36-16z" fill="#F5C93E" />
    </g>
    <path d="M-38 0c0-20 17-33 36-33 13 0 24 6 30 15 3 5 5 12 5 18s-2 13-5 18c-6 9-17 15-30 15-19 0-36-13-36-33z" fill="#2472C8" />
    <path d="M-38 0c0-20 17-33 36-33 5 0 10 1 14 2-10 18-10 44 0 62-4 1-9 2-14 2-19 0-36-13-36-33z" fill="#3B93E0" opacity=".6" />
    <path d="M8-28c4 4 7 10 8 17-9-2-16-8-19-16 3-1 7-1 11-1z" fill="#101E33" opacity=".55" />
    <path d="M20-14c6 5 9 9 12 14-3 5-6 9-12 14-3-9-3-19 0-28z" fill="#131F2E" opacity=".7" />
    <g className="bm-reef__fin"><path d="M-8-31c10-10 21-13 27-9-5 6-8 12-8 18z" fill="#1C63B2" /></g>
    <path d="M-6 26c9 9 19 12 25 9-5-5-8-10-8-16z" fill="#1C63B2" />
    <circle cx="-24" cy="-7" r="5.6" fill="#F3FAFF" />
    <circle cx="-25" cy="-7" r="3.2" fill="#0D1B26" />
    <circle cx="-26.4" cy="-8.4" r="1.1" fill="#FFFFFF" />
  </g>
);

/* Yellow tang: the small schooling fish that fill the mid-water. */
const YellowTang = () => (
  <g>
    <g className="bm-reef__tail" style={{ animationDuration: '.38s' }}>
      <path d="M20 0c10-9 19-12 25-11-4 7-4 15 0 22-6 1-15-2-25-11z" fill="#E9A81B" />
    </g>
    <path d="M-26 0c0-14 12-23 25-23 9 0 17 4 21 10 2 4 3 8 3 13s-1 9-3 13c-4 6-12 10-21 10-13 0-25-9-25-23z" fill="#F7C324" />
    <path d="M-26 0c0-14 12-23 25-23 3 0 6 0 9 1-7 13-7 31 0 44-3 1-6 1-9 1-13 0-25-9-25-23z" fill="#FFD95C" opacity=".65" />
    <g className="bm-reef__fin"><path d="M-6-21c7-7 15-9 19-6-4 4-6 8-6 12z" fill="#E9A81B" /></g>
    <path d="M-5 18c6 6 13 8 17 6-3-3-5-7-5-11z" fill="#E9A81B" />
    <circle cx="-16" cy="-5" r="4" fill="#FFFDF4" />
    <circle cx="-17" cy="-5" r="2.3" fill="#2A1D06" />
  </g>
);

/* Green sea turtle, side-on. Carapace built from a scute grid so it reads
   as a shell rather than a blob, and all four flippers stroke on their own
   phase. */
const Turtle = () => (
  <g>
    {/* Rear flippers (behind the shell) */}
    <g className="bm-reef__flip-b" style={{ animationDelay: '-.8s' }}>
      <path d="M52 18c22 2 38 12 46 28-16 6-33 2-50-12z" fill="#3E7B58" />
    </g>
    <g className="bm-reef__flip-b" style={{ animationDelay: '-1.9s' }}>
      <path d="M48-14c22-6 40-2 52 12-14 10-32 11-52 2z" fill="#356B4C" />
    </g>

    {/* Head + neck */}
    <path d="M-74 6c-14-4-24-14-24-25 0-13 13-23 29-23 12 0 22 5 28 13l-6 30z" fill="#4C8C64" />
    <path d="M-74 6c-14-4-24-14-24-25 0-8 5-15 13-19 6 12 8 30 4 44z" fill="#5C9F73" opacity=".7" />
    <g fill="#C7DBA9" opacity=".65">
      <circle cx="-84" cy="-30" r="3.4" /><circle cx="-74" cy="-34" r="3" />
      <circle cx="-64" cy="-30" r="2.6" /><circle cx="-88" cy="-19" r="2.6" />
    </g>
    <circle cx="-80" cy="-24" r="6" fill="#F4FAF2" />
    <circle cx="-81.5" cy="-24" r="3.6" fill="#14251B" />
    <circle cx="-83" cy="-25.8" r="1.3" fill="#FFFFFF" />

    {/* Carapace */}
    <ellipse cx="0" cy="0" rx="78" ry="54" fill="#3C7A57" />
    <ellipse cx="-6" cy="-6" rx="70" ry="46" fill="#57996E" />
    <ellipse cx="-14" cy="-14" rx="52" ry="30" fill="#6BAE7F" opacity=".55" />
    {/* Scutes */}
    <g fill="none" stroke="#2C5C42" strokeWidth="2.4" opacity=".55">
      <path d="M-46-22c10-10 24-15 40-15s32 6 42 16" />
      <path d="M-52 2c12 8 28 12 46 12s34-5 46-14" />
      <path d="M-20-37v74M16-38v72M-50-8h96" />
    </g>
    <g fill="#7CBF8E" opacity=".38">
      <path d="M-18-32h32c-2 8-2 16 0 24h-32c2-8 2-16 0-24z" />
      <path d="M20-30h24c-2 8-2 15 0 22H20c2-7 2-15 0-22z" />
    </g>
    {/* Rim highlight */}
    <path d="M-70-16c8-24 34-40 70-40 26 0 50 10 62 26" stroke="#A9D9B4" strokeWidth="4" fill="none" opacity=".35" strokeLinecap="round" />

    {/* Front flippers (over the shell) */}
    <g className="bm-reef__flip-f">
      <path d="M-42-22c-16-26-42-40-72-38 6 22 26 42 58 52z" fill="#4C8C64" />
      <path d="M-46-24c-14-20-34-31-56-31 5 16 20 31 43 40z" fill="#5EA075" opacity=".7" />
    </g>
    <g className="bm-reef__flip-f" style={{ animationDelay: '-1.3s' }}>
      <path d="M-40 24c-14 24-36 38-64 38 4-22 22-40 50-50z" fill="#3E7B58" />
    </g>
  </g>
);

/* Octopus: stationary on the seabed rather than swimming, so it reads as a
   different kind of animal, not just a slower fish. Drawn mantle-up, arms
   hanging below — the scene positions it sitting among the coral. Each arm
   hinges independently at the mantle so they never move in lock-step. */
const Octopus = () => (
  <g>
    <g className="bm-reef__hang" style={{ animationDuration: '3.4s' }}>
      <path d="M-24-4c-14 22-16 44-8 66" stroke="#6B4485" strokeWidth="9" strokeLinecap="round" fill="none" />
    </g>
    <g className="bm-reef__hang--s" style={{ animationDuration: '2.6s', animationDelay: '-.6s' }}>
      <path d="M-14-2c-8 26-6 50 4 70" stroke="#71488C" strokeWidth="9" strokeLinecap="round" fill="none" />
    </g>
    <g className="bm-reef__hang" style={{ animationDuration: '3s', animationDelay: '-1.3s' }}>
      <path d="M-4 0c-2 28 2 52 10 72" stroke="#6B4485" strokeWidth="9" strokeLinecap="round" fill="none" />
    </g>
    <g className="bm-reef__hang--s" style={{ animationDuration: '2.8s', animationDelay: '-1.9s' }}>
      <path d="M6 0c2 28 8 50 18 68" stroke="#71488C" strokeWidth="9" strokeLinecap="round" fill="none" />
    </g>
    <g className="bm-reef__hang" style={{ animationDuration: '3.2s', animationDelay: '-.4s' }}>
      <path d="M16-2c8 24 14 46 26 62" stroke="#6B4485" strokeWidth="9" strokeLinecap="round" fill="none" />
    </g>
    <g className="bm-reef__hang--s" style={{ animationDuration: '2.4s', animationDelay: '-2.4s' }}>
      <path d="M26-4c14 20 22 40 36 54" stroke="#71488C" strokeWidth="9" strokeLinecap="round" fill="none" />
    </g>
    {/* Mantle, breathing gently at rest */}
    <g className="bm-reef__breathe">
      <ellipse cx="0" cy="-28" rx="36" ry="32" fill="#8E5FA8" />
      <ellipse cx="-8" cy="-36" rx="24" ry="20" fill="#A576BE" opacity=".55" />
      <circle cx="14" cy="-16" r="3.4" fill="#5E3B76" opacity=".5" />
      <circle cx="-4" cy="-10" r="2.6" fill="#5E3B76" opacity=".4" />
      <circle cx="-18" cy="-20" r="2.8" fill="#5E3B76" opacity=".4" />
      <circle cx="-14" cy="-32" r="7" fill="#F4EAFB" />
      <circle cx="-15" cy="-32" r="4" fill="#241830" />
      <circle cx="-16.6" cy="-33.6" r="1.4" fill="#FFFFFF" />
      <circle cx="12" cy="-32" r="7" fill="#F4EAFB" />
      <circle cx="11" cy="-32" r="4" fill="#241830" />
      <circle cx="9.4" cy="-33.6" r="1.4" fill="#FFFFFF" />
    </g>
  </g>
);

/* Jellyfish: drifts rather than swims — no travel-and-bank like the fish,
   just a slow rise on its own bell-pulse. A second, different movement
   language in the water column alongside "fish that swim" and "octopus
   that sits". */
const Jellyfish = ({ hue = '#FFAEDB', hue2 = '#FF8AC8' }) => (
  <g>
    <g className="bm-reef__pulse">
      <path d="M-28 2c-2-20 10-34 28-34s30 14 28 34c-6-5-11-5-16 0-6-6-12-6-18 0-6-6-12-6-18 0-4-4-4-4-4 0z" fill={hue} opacity=".82" />
      <path d="M-28 2c5 5 12 8 28 8s23-3 28-8" fill="none" stroke={hue2} strokeWidth="2" opacity=".55" />
    </g>
    <g className="bm-reef__hang" style={{ animationDuration: '2.2s' }}>
      <path d="M-16 6c-4 22-1 42 5 60" stroke={hue2} strokeWidth="2.4" strokeLinecap="round" fill="none" opacity=".6" />
    </g>
    <g className="bm-reef__hang--s" style={{ animationDuration: '1.8s', animationDelay: '-.7s' }}>
      <path d="M0 8c1 24 5 44 12 62" stroke={hue2} strokeWidth="2.4" strokeLinecap="round" fill="none" opacity=".6" />
    </g>
    <g className="bm-reef__hang" style={{ animationDuration: '2s', animationDelay: '-1.2s' }}>
      <path d="M16 6c5 22 4 42-1 60" stroke={hue2} strokeWidth="2.4" strokeLinecap="round" fill="none" opacity=".6" />
    </g>
  </g>
);

/* ── Scene ─────────────────────────────────────────────────────────────── */

/* Two distinct underwater palettes, not one image dimmed or brightened.
   The dark palette is a genuine deep-water dive — it sits naturally behind
   a dark UI. Reusing it for light mode (just adding a pale wash on top, as
   the veil used to) still leaves a near-black seabed swimming behind white
   cards, which reads as heavy rather than oceanic. The light palette is a
   separate, sunlit shallow-water scene — bright cyan surface easing into a
   saturated teal at depth, so it stays airy against a white shell instead
   of fighting it, while the seabed strip behind loose text (see
   `.contrib-on-water` in styles.css) stays dark enough for white type. */
const PALETTE = {
  dark: {
    water: ['#5FC6EC', '#31A0D8', '#1477B7', '#0C5089', '#062E52'],
    ray: ['#DFF6FF', '#BFEAFF'],
    reefFar: ['#0E5C8C', '#093C63'],
    reefMid: ['#12729B', '#0A4468'],
    sand: ['#3FA0B8', '#1B6A8C'],
    sun: '#EAFBFF',
    depth: ['#062E52', '#04203C'],
    depthOpacity: '.72',
  },
  light: {
    water: ['#D9F8FF', '#8FE7F5', '#4FCBE0', '#22A0C4', '#0F7C9E'],
    ray: ['#FFFBE8', '#FFF3C2'],
    reefFar: ['#6BE0D0', '#2FA8B0'],
    reefMid: ['#4FCBC0', '#1F9AA0'],
    sand: ['#FCEFC7', '#E6C98C'],
    sun: '#FFFDF0',
    depth: ['#0F7C9E', '#0B5E7A'],
    depthOpacity: '.32',
  },
};

export default function ReefScene({ className = '', variant = 'hero', theme = 'dark' }) {
  const ambient = variant === 'ambient';
  const p = PALETTE[theme] || PALETTE.dark;
  return (
    <>
      <style>{CSS}</style>
      <svg
        className={`bm-reef ${className}`}
        viewBox="0 0 1600 640"
        /* The ambient copy is cropped to a whole page's height, so it is
           anchored to the seabed — otherwise the reef falls off the bottom
           of the crop and the backdrop is nothing but open blue. */
        preserveAspectRatio={ambient ? 'xMidYMax slice' : 'xMidYMid slice'}
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          {/* Open water, lit from the surface down into the deep. */}
          <linearGradient id="bmrWater" x1="0" y1="0" x2="0.12" y2="1">
            <stop offset="0%"   stopColor={p.water[0]} />
            <stop offset="18%"  stopColor={p.water[1]} />
            <stop offset="42%"  stopColor={p.water[2]} />
            <stop offset="70%"  stopColor={p.water[3]} />
            <stop offset="100%" stopColor={p.water[4]} />
          </linearGradient>
          <linearGradient id="bmrRay" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={p.ray[0]} stopOpacity=".75" />
            <stop offset="55%"  stopColor={p.ray[1]} stopOpacity=".22" />
            <stop offset="100%" stopColor={p.ray[1]} stopOpacity="0" />
          </linearGradient>
          <linearGradient id="bmrReefFar" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={p.reefFar[0]} />
            <stop offset="100%" stopColor={p.reefFar[1]} />
          </linearGradient>
          <linearGradient id="bmrReefMid" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={p.reefMid[0]} />
            <stop offset="100%" stopColor={p.reefMid[1]} />
          </linearGradient>
          <linearGradient id="bmrSand" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={p.sand[0]} />
            <stop offset="100%" stopColor={p.sand[1]} />
          </linearGradient>
          <radialGradient id="bmrSun" cx="0.62" cy="-0.05" r="0.75">
            <stop offset="0%" stopColor={p.sun} stopOpacity=".55" />
            <stop offset="100%" stopColor={p.sun} stopOpacity="0" />
          </radialGradient>
          <linearGradient id="bmrDepth" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={p.depth[0]} stopOpacity="0" />
            <stop offset="100%" stopColor={p.depth[1]} stopOpacity={p.depthOpacity} />
          </linearGradient>
        </defs>

        <g>
          {/* ── Water column ── */}
          <rect x="0" y="0" width="1600" height="640" fill="url(#bmrWater)" />
          <rect x="0" y="0" width="1600" height="640" fill="url(#bmrSun)" />

          {/* ── Surface: the underside of the swell, sliding sideways ── */}
          <g className="bm-reef__caustic">
            <path
              d="M-400 34c60-22 120-22 180 0s120 22 180 0 120-22 180 0 120 22 180 0 120-22 180 0 120 22 180 0 120-22 180 0 120 22 180 0 120-22 180 0 120 22 180 0v-70h-2000z"
              fill="#8FE0F6" opacity=".38"
            />
            <path
              d="M-400 58c60-20 120-20 180 0s120 20 180 0 120-20 180 0 120 20 180 0 120-20 180 0 120 20 180 0 120-20 180 0 120 20 180 0 120-20 180 0 120 20 180 0v-24c-60 20-120 20-180 0s-120-20-180 0-120 20-180 0-120-20-180 0-120 20-180 0-120-20-180 0-120 20-180 0-120-20-180 0-120 20-180 0-120-20-180 0z"
              fill="#D6F4FF" opacity=".3"
            />
          </g>

          {/* ── Shafts of sunlight ── */}
          <g style={{ mixBlendMode: 'screen' }}>
            {[
              { x: 210, w: 92,  s: 13, d: 460, dur: '13s',   delay: '0s' },
              { x: 430, w: 150, s: 9,  d: 560, dur: '17s',   delay: '-4s' },
              { x: 700, w: 76,  s: 15, d: 420, dur: '11s',   delay: '-2s' },
              { x: 900, w: 190, s: 7,  d: 600, dur: '19s',   delay: '-9s' },
              { x: 1180, w: 110, s: 12, d: 520, dur: '15s',  delay: '-6s' },
              { x: 1400, w: 140, s: 10, d: 470, dur: '21s',  delay: '-3s' },
            ].map((r) => (
              <g key={r.x} className="bm-reef__ray" style={{ animationDuration: r.dur, animationDelay: r.delay }}>
                <path
                  d={`M${r.x} 0h${r.w}l${r.s * 4} ${r.d}h-${r.w + r.s * 2}z`}
                  fill="url(#bmrRay)"
                />
              </g>
            ))}
          </g>

          {/* ── Far reef, hazed back by the water between it and us ── */}
          <g opacity=".55">
            <path d="M0 470c90-38 150-16 216-44 62-26 118-8 176-34 54-24 110-4 168-30 60-27 122-6 186-34 60-26 124-8 188-32 58-22 118-6 176-28 56-22 110-4 166-26 44-17 90-8 124-22v420H0z" fill="url(#bmrReefFar)" />
          </g>

          {/* ── Drifting plankton ── */}
          <g fill="#DFF6FF">
            {[
              [120, 180, 2.4, '7s', '0s'], [340, 120, 1.8, '9s', '-2s'], [560, 250, 2.6, '8s', '-5s'],
              [780, 150, 2, '10s', '-1s'], [980, 300, 2.2, '7.5s', '-4s'], [1220, 190, 2.8, '11s', '-6s'],
              [1420, 260, 1.9, '8.5s', '-3s'], [240, 360, 2.1, '9.5s', '-7s'], [1080, 100, 1.7, '12s', '-8s'],
              [660, 420, 2.4, '10.5s', '-2.5s'], [1520, 120, 2, '9s', '-5.5s'], [430, 470, 2.3, '11.5s', '-1.5s'],
            ].map(([cx, cy, r, dur, delay]) => (
              <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={r} className="bm-reef__mote"
                style={{ animationDuration: dur, animationDelay: delay }} />
            ))}
          </g>

          {/* ── Distant school, small and quick ── */}
          {[
            { y: 210, s: 0.38, dur: '26s', delay: '-4s', dir: 'l' },
            { y: 244, s: 0.34, dur: '28s', delay: '-6s', dir: 'l' },
            { y: 158, s: 0.32, dur: '32s', delay: '-9s', dir: 'l' },
          ].map((f, i) => (
            <g key={`far-${i}`} className="bm-reef__travel-l" style={{ animationDuration: f.dur, animationDelay: f.delay }} opacity=".72">
              <g className="bm-reef__bob--far" style={{ animationDelay: `-${i}s` }}>
                <g transform={`translate(0 ${f.y}) scale(${f.s})`}><YellowTang /></g>
              </g>
            </g>
          ))}

          {/* ── Mid reef ── */}
          <path d="M0 540c80-30 140-6 210-32 66-24 126 4 192-24 62-26 128 2 196-26 64-26 132 4 200-24 62-26 130 2 198-26 60-25 128 4 196-24 52-21 106 0 158-18v214H0z" fill="url(#bmrReefMid)" />

          {/* ── THE TURTLE ── the slow, unhurried anchor of the scene. Big
              enough to read as the subject rather than one more fish, and on
              a long enough cycle that a crossing is an event. The ambient
              copy crops to a whole viewport's height, which scales the
              artwork up by roughly a third — scaled back down here to
              compensate, so the turtle stays proportionate to everything
              else rather than looming over it. */}
          <g className="bm-reef__travel-r" style={{ animationDuration: '58s', animationDelay: '-24s' }}>
            <g className="bm-reef__bob" style={{ animationDuration: '13s' }}>
              <g className="bm-reef__glide" style={{ animationDuration: '11s' }}>
                <g transform={`translate(0 250) scale(${ambient ? -1.4 : -1.85} ${ambient ? 1.4 : 1.85})`}><Turtle /></g>
              </g>
            </g>
          </g>

          {/* ── Blue tangs crossing the other way ── */}
          <g className="bm-reef__travel-r" style={{ animationDuration: '38s', animationDelay: '-19s' }}>
            <g className="bm-reef__bob" style={{ animationDuration: '7.5s' }}>
              <g transform="translate(0 388) scale(-.8 .8)"><BlueTang /></g>
            </g>
          </g>
          <g className="bm-reef__travel-r" style={{ animationDuration: '44s', animationDelay: '-27s' }}>
            <g className="bm-reef__bob" style={{ animationDuration: '9s', animationDelay: '-2s' }}>
              <g transform="translate(0 176) scale(-.62 .62)"><BlueTang /></g>
            </g>
          </g>

          {/* ── Seabed and its planting ── */}
          <path d="M0 600c140-26 260-4 400-22 132-17 250 10 384-10 128-19 246 8 378-12 118-18 226 6 342-10 34-5 66-3 96 2v92H0z" fill="url(#bmrSand)" />

          {/* Sea fans and weed, hinged at the seabed */}
          <g>
            {[
              { x: 90,  h: 1.15, hue: '#1E8F86', d: '6.5s',  delay: '0s' },
              { x: 175, h: .85,  hue: '#2AA79A', d: '5.2s',  delay: '-1.4s' },
              { x: 505, h: 1.0,  hue: '#1E8F86', d: '7.2s',  delay: '-3s' },
              { x: 585, h: .7,   hue: '#33B7A6', d: '4.8s',  delay: '-2.2s' },
              { x: 1015, h: 1.05, hue: '#1E8F86', d: '6.9s', delay: '-4.1s' },
              { x: 1105, h: .8,  hue: '#2AA79A', d: '5.6s',  delay: '-.7s' },
              { x: 1430, h: .95, hue: '#26A196', d: '6.2s',  delay: '-2.8s' },
            ].map((w) => (
              <g key={w.x} className="bm-reef__sway" style={{ animationDuration: w.d, animationDelay: w.delay }}>
                <g transform={`translate(${w.x} 640) scale(${w.h})`}>
                  <path d="M0 0c-14-40-8-78 12-114 18-32 22-62 10-90" stroke={w.hue} strokeWidth="11" strokeLinecap="round" fill="none" opacity=".9" />
                  <path d="M22 0c-10-34-2-66 16-96 16-27 20-52 12-74" stroke={w.hue} strokeWidth="8" strokeLinecap="round" fill="none" opacity=".7" />
                  <path d="M-20 0c-12-30-6-58 10-84 14-23 18-44 12-62" stroke={w.hue} strokeWidth="7" strokeLinecap="round" fill="none" opacity=".6" />
                </g>
              </g>
            ))}
          </g>

          {/* Coral bank: heads of varying size and hue packed along the foot
              of the scene so the seabed reads as a living reef rather than a
              row of identical bumps. */}
          <g>
            {[
              { x: 120,  s: .78, y: 622, c: '#C9628C', c2: '#E894B4' },
              { x: 300,  s: 1.05, y: 620, c: '#E0705E', c2: '#F5A18B' },
              { x: 470,  s: .62, y: 626, c: '#B8639E', c2: '#DC96C3' },
              { x: 620,  s: .9,  y: 618, c: '#E8894A', c2: '#FAB77E' },
              { x: 790,  s: .72, y: 624, c: '#D9628F', c2: '#F398B8' },
              { x: 960,  s: 1.0, y: 616, c: '#DE6E5C', c2: '#F49E88' },
              { x: 1130, s: .66, y: 626, c: '#C96A9E', c2: '#E7A0C6' },
              { x: 1290, s: .95, y: 618, c: '#E8894A', c2: '#F8B67C' },
              { x: 1470, s: .8,  y: 622, c: '#CC6690', c2: '#EC9CBB' },
            ].map((c) => (
              <g key={c.x} transform={`translate(${c.x} ${c.y}) scale(${c.s})`}>
                {/* Mound */}
                <path d="M-74 24c-5-30 8-53 30-61 7-23 28-35 49-27 19-23 52-17 61 11 25 4 39 25 31 48 6 10 6 19 2 29z" fill={c.c} />
                <path d="M-48 24c-2-21 6-38 22-44 4-16 19-25 33-21 13-16 37-14 45 6 17 1 27 16 22 33z" fill={c.c2} opacity=".6" />
                {/* Staghorn branches */}
                <g stroke={c.c2} strokeWidth="7" strokeLinecap="round" fill="none" opacity=".85">
                  <path d="M-34 24c-3-19 1-33 11-42" /><path d="M-24 -4c-8-6-12-14-11-24" />
                  <path d="M2 24c0-23 5-39 16-51" /><path d="M18 -20c-9-8-13-18-11-30" />
                  <path d="M44 24c2-18 9-30 20-39" /><path d="M64 -13c-9-5-14-13-13-23" />
                </g>
                {/* Brain-coral ridging on the mound */}
                <g stroke={c.c} strokeWidth="3" fill="none" opacity=".45">
                  <path d="M-56 8c14-8 30-10 46-6" /><path d="M-44 -8c12-7 26-9 40-5" />
                </g>
              </g>
            ))}
          </g>

          {/* Anemone tufts, on a faster, shorter sway than the weed */}
          <g>
            {[
              { x: 220, c: '#7FD8C8', s: 1 }, { x: 420, c: '#8FE0D0', s: .8 },
              { x: 700, c: '#79D2C2', s: 1.1 }, { x: 900, c: '#8FE0D0', s: .9 },
              { x: 1200, c: '#7FD8C8', s: 1 }, { x: 1380, c: '#86DBCB', s: .75 },
            ].map((a) => (
              <g key={a.x} className="bm-reef__sway--s" style={{ animationDelay: `-${a.x % 5}s` }}>
                <g transform={`translate(${a.x} 634) scale(${a.s})`}>
                  <g stroke={a.c} strokeWidth="5" strokeLinecap="round" fill="none" opacity=".85">
                    <path d="M0 0c-8-18-6-32 4-44" /><path d="M12 0c-2-20 2-34 12-44" />
                    <path d="M-12 0c-10-16-10-30-2-42" /><path d="M24 0c2-16 8-28 18-36" />
                    <path d="M-24 0c-12-14-14-26-8-38" /><path d="M6 0c2-22 0-36-6-48" />
                  </g>
                </g>
              </g>
            ))}
          </g>

          {/* ── Clownfish, closest to the glass ── */}
          <g className="bm-reef__travel-r" style={{ animationDuration: '31s', animationDelay: '-5s' }}>
            <g className="bm-reef__bob" style={{ animationDuration: '6s' }}>
              <g transform="translate(0 300) scale(-1.05 1.05)"><Clownfish tail=".4s" /></g>
            </g>
          </g>
          <g className="bm-reef__travel-r" style={{ animationDuration: '29s', animationDelay: '-20s' }}>
            <g className="bm-reef__bob" style={{ animationDuration: '5.4s', animationDelay: '-3s' }}>
              <g transform="translate(0 262) scale(-.68 .68)"><Clownfish tail=".36s" /></g>
            </g>
          </g>
          {/* ── Yellow tang, near depth, heading left ── */}
          <g className="bm-reef__travel-l" style={{ animationDuration: '36s', animationDelay: '-15s' }}>
            <g className="bm-reef__bob" style={{ animationDuration: '7.2s' }}>
              <g transform="translate(0 452) scale(.95)"><YellowTang /></g>
            </g>
          </g>

          {/* ── Octopus, perched among the coral rather than swimming ── */}
          <g className="bm-reef__breathe" style={{ animationDelay: '-2s' }}>
            <g transform="translate(870 560) scale(1.05)"><Octopus /></g>
          </g>

          {/* ── Jellyfish, drifting on their own slow rise ── */}
          <g className="bm-reef__travel-l" style={{ animationDuration: '86s', animationDelay: '-30s' }}>
            <g className="bm-reef__bob--far" style={{ animationDuration: '8s' }}>
              <g transform="translate(0 150) scale(.85)"><Jellyfish /></g>
            </g>
          </g>
          <g className="bm-reef__travel-r" style={{ animationDuration: '96s', animationDelay: '-52s' }}>
            <g className="bm-reef__bob--far" style={{ animationDuration: '9.5s', animationDelay: '-3s' }}>
              <g transform="translate(0 340) scale(.62)"><Jellyfish hue="#C7B8FF" hue2="#A896F2" /></g>
            </g>
          </g>

          {/* ── Bubble columns rising off the reef ── */}
          <g fill="none" stroke="#E6F9FF" strokeWidth="1.6">
            {[
              [140, 620, 7, '9s', '0s'], [152, 620, 4, '11s', '-3s'], [131, 620, 5, '13s', '-6s'],
              [640, 610, 6, '10s', '-1.5s'], [652, 610, 3.5, '12s', '-5s'], [628, 610, 5, '14s', '-8s'],
              [1160, 616, 8, '9.5s', '-2.5s'], [1174, 616, 4.5, '12.5s', '-7s'], [1146, 616, 5.5, '15s', '-4s'],
              [1500, 606, 6, '11s', '-9s'], [1512, 606, 3.5, '13.5s', '-2s'],
            ].map(([cx, cy, r, dur, delay], i) => (
              <circle key={i} cx={cx} cy={cy} r={r} className="bm-reef__bubble"
                fill="rgba(230,249,255,.18)"
                style={{ animationDuration: dur, animationDelay: delay }} />
            ))}
          </g>

          {/* Soft vignette so the corners settle back and the middle of the
              water stays the brightest part of the frame. */}
          <rect x="0" y="440" width="1600" height="200" fill="url(#bmrDepth)" opacity=".55" />
        </g>
      </svg>
    </>
  );
}
