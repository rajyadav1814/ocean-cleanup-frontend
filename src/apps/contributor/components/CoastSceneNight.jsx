/* Night-time counterpart to CoastScene, used when the Contributor Space is
   on the dark theme. It keeps the daytime scene's geometry — same viewBox,
   same headland/shoreline/beach curves — so the hero's wave divider and the
   left-hand dissolve line up identically whichever version is on screen.
   Only the lighting changes: moonlit sky, silhouetted headland, a glitter
   path on the water and surf catching the moon. Purely decorative. */
export default function CoastSceneNight({ className = '' }) {
  return (
    <svg
      className={className}
      viewBox="0 0 620 372"
      preserveAspectRatio="xMaxYMid slice"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id="bmcsnSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#07182A" />
          <stop offset="55%" stopColor="#0E2A40" />
          <stop offset="100%" stopColor="#17415D" />
        </linearGradient>
        <radialGradient id="bmcsnMoonGlow">
          <stop offset="0%" stopColor="#D8ECFF" stopOpacity=".5" />
          <stop offset="40%" stopColor="#8FC0E8" stopOpacity=".15" />
          <stop offset="100%" stopColor="#8FC0E8" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="bmcsnSea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#17425F" />
          <stop offset="40%" stopColor="#0E2C43" />
          <stop offset="100%" stopColor="#091E30" />
        </linearGradient>
        <radialGradient id="bmcsnMoonPool">
          <stop offset="0%" stopColor="#CFE6FF" stopOpacity=".22" />
          <stop offset="60%" stopColor="#CFE6FF" stopOpacity=".07" />
          <stop offset="100%" stopColor="#CFE6FF" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="bmcsnSand" x1="0.3" y1="0" x2="0.6" y2="1">
          <stop offset="0%" stopColor="#4C4B41" />
          <stop offset="100%" stopColor="#282A28" />
        </linearGradient>
      </defs>

      <g>
        {/* ── Sky ── */}
        <rect x="0" y="0" width="620" height="200" fill="url(#bmcsnSky)" />

        {/* ── Stars ── kept clear of the headland silhouette so none of them
            appear to sit on the hillside. */}
        <g fill="#DCEBFA">
          <circle cx="196" cy="40" r="1" opacity=".45" />
          <circle cx="206" cy="96" r=".9" opacity=".35" />
          <circle cx="228" cy="124" r=".9" opacity=".4" />
          <circle cx="252" cy="56" r=".8" opacity=".35" />
          <circle cx="268" cy="22" r="1.1" opacity=".5" />
          <circle cx="288" cy="86" r="1" opacity=".4" />
          <circle cx="312" cy="18" r="1.2" opacity=".7" />
          <circle cx="318" cy="116" r=".9" opacity=".4" />
          <circle cx="338" cy="54" r="1" opacity=".55" />
          <circle cx="356" cy="20" r="1.1" opacity=".6" />
          <circle cx="362" cy="98" r=".9" opacity=".45" />
          <circle cx="386" cy="28" r="1.3" opacity=".8" />
          <circle cx="398" cy="66" r=".9" opacity=".5" />
          <circle cx="416" cy="16" r="1" opacity=".55" />
          <circle cx="428" cy="104" r=".9" opacity=".4" />
          <circle cx="440" cy="44" r="1.2" opacity=".7" />
          <circle cx="452" cy="86" r=".8" opacity=".4" />
          <circle cx="486" cy="22" r="1.1" opacity=".65" />
          <circle cx="498" cy="54" r=".9" opacity=".5" />
          <circle cx="512" cy="12" r="1.3" opacity=".75" />
          <circle cx="526" cy="38" r="1" opacity=".55" />
          <circle cx="544" cy="20" r="1.1" opacity=".6" />
          <circle cx="552" cy="58" r=".85" opacity=".4" />
          <circle cx="568" cy="14" r="1.2" opacity=".7" />
          <circle cx="582" cy="42" r=".9" opacity=".5" />
          <circle cx="598" cy="10" r="1" opacity=".55" />
          <circle cx="612" cy="32" r=".85" opacity=".45" />
        </g>

        {/* ── Moon ── */}
        <circle cx="466" cy="116" r="92" fill="url(#bmcsnMoonGlow)" />
        <circle cx="466" cy="116" r="12" fill="#EAF4FF" />
        <circle cx="466" cy="116" r="12" fill="none" stroke="#FFFFFF" strokeWidth="1.4" opacity=".5" />

        {/* ── Birds ── silhouetted against the moonlit sky. */}
        <g stroke="#05101B" strokeLinecap="round" fill="none" opacity="0.9">
          <path d="M386 118c6-8 12-8 17-1 5-7 11-7 17 1" strokeWidth="2.4" />
          <path d="M420 100c5-6 10-6 14-1 4-5 9-5 14 1" strokeWidth="2.1" />
          <path d="M400 140c4-5 8-5 11-1 3-4 7-4 11 1" strokeWidth="1.9" />
        </g>

        {/* ── Headland ── same ridges as the day scene, read as silhouettes. */}
        <path d="M286 186c52-4 84-22 132-33 54-13 108-28 202-46v96H286z" fill="#153B54" />
        <path d="M322 188c50-3 86-17 132-27 52-11 100-21 166-35v90H322z" fill="#0F2C41" />
        <path d="M362 190c46-2 82-11 126-18 46-8 84-15 132-24v72H362z" fill="#0A1F2F" />
        {/* Moonlit rim along the ridge facing the moon */}
        <path d="M286 186c52-4 84-22 132-33 54-13 108-28 202-46" stroke="#7FB8DA" strokeWidth="1.5" fill="none" opacity=".3" />
        <path d="M362 190c46-2 82-11 126-18 46-8 84-15 132-24" stroke="#6FA8CC" strokeWidth="1.2" fill="none" opacity=".2" />
        {/* Tree line where the headland drops to the shore */}
        <g fill="#07161F" opacity="0.85">
          <ellipse cx="516" cy="168" rx="22" ry="8" />
          <ellipse cx="556" cy="160" rx="24" ry="9" />
          <ellipse cx="600" cy="151" rx="22" ry="9" />
        </g>

        {/* ── Sea ── */}
        <path d="M0 170h620v202H0z" fill="url(#bmcsnSea)" />

        {/* ── Moon path on the water ── a widening column of light with
            glitter broken across it. */}
        <ellipse cx="466" cy="200" rx="42" ry="34" fill="url(#bmcsnMoonPool)" />
        <g fill="#DCEEFF">
          <rect x="462" y="174" width="9" height="1.6" rx=".8" opacity=".45" />
          <rect x="465" y="181" width="6" height="1.6" rx=".8" opacity=".3" />
          <rect x="458" y="188" width="15" height="1.8" rx=".9" opacity=".38" />
          <rect x="466" y="195" width="8" height="1.8" rx=".9" opacity=".24" />
          <rect x="455" y="203" width="19" height="1.8" rx=".9" opacity=".3" />
          <rect x="464" y="211" width="11" height="2" rx="1" opacity=".2" />
          <rect x="452" y="219" width="23" height="2" rx="1" opacity=".24" />
          <rect x="463" y="228" width="13" height="2" rx="1" opacity=".16" />
        </g>

        {/* ── Surf ── the shoreline curve of the day scene, lit by the moon. */}
        <g stroke="#CFE6F5" fill="none" strokeLinecap="round">
          <path d="M0 286c118-6 220-18 316-44 90-24 180-40 304-52" strokeWidth="1.6" opacity=".14" />
          <path d="M0 300c120-6 224-20 322-48 92-26 184-42 298-54" strokeWidth="2.2" opacity=".24" />
          <path d="M0 316c122-6 228-22 328-52 94-28 188-46 292-58" strokeWidth="4.5" opacity=".55" />
          <path d="M0 330c124-6 232-22 334-53 96-29 186-46 286-57" strokeWidth="3" opacity=".8" />
        </g>

        {/* ── Beach ── */}
        <path d="M0 332c124-6 232-22 334-53 96-29 186-46 286-57v150H0z" fill="url(#bmcsnSand)" />
        {/* Damp sand still holding the light at the water's edge */}
        <path d="M0 338c124-6 232-22 334-53 96-29 186-46 286-57" stroke="#9FB6C4" strokeWidth="7" fill="none" opacity=".2" />
        <path d="M156 350c96-12 182-32 264-58 54-17 108-30 166-38" stroke="#1C1A16" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity=".35" />

        {/* ── Foreground planting ── near-black silhouettes with a few
            leaves catching the moon. */}
        <g fill="#08181A" transform="translate(112 20) scale(0.82)">
          <path d="M620 260c-26 4-46 18-58 38 20 6 40 2 58-12z" />
          <path d="M594 296c-24 2-44 14-58 32 20 8 42 6 60-8z" opacity="0.9" />
        </g>
        <g stroke="#0A1C18" strokeWidth="5" strokeLinecap="round" fill="none" transform="translate(112 20) scale(0.82)">
          <path d="M540 372c-4-24 4-44 24-58" />
          <path d="M566 372c2-26 14-44 36-54" />
          <path d="M514 372c-8-18-6-34 6-48" />
        </g>
        <g fill="#3D5A33" transform="translate(112 20) scale(0.82)">
          <ellipse cx="524" cy="322" rx="16" ry="8" transform="rotate(-32 524 322)" />
          <ellipse cx="562" cy="308" rx="18" ry="8" transform="rotate(-24 562 308)" />
          <ellipse cx="600" cy="292" rx="18" ry="8" transform="rotate(-18 600 292)" />
        </g>
        <g fill="#6D8A4C" opacity=".7" transform="translate(112 20) scale(0.82)">
          <ellipse cx="530" cy="316" rx="9" ry="4" transform="rotate(-32 530 316)" />
          <ellipse cx="568" cy="302" rx="10" ry="4" transform="rotate(-24 568 302)" />
          <ellipse cx="606" cy="286" rx="10" ry="4" transform="rotate(-18 606 286)" />
        </g>
      </g>
    </svg>
  );
}
