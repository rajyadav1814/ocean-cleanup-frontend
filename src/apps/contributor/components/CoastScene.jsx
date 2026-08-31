/* Flat-vector coastal scene used as the artwork in the Contributor Space
   hero. Drawn inline (rather than shipped as a raster) so it stays crisp on
   any display and picks up the same teal/green palette as the rest of the
   space. Purely decorative — hidden from assistive tech. */
export default function CoastScene({ className = '' }) {
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
        <linearGradient id="bmcsSky" x1="0" y1="0" x2="0.35" y2="1">
          <stop offset="0%" stopColor="#EDF6FC" />
          <stop offset="100%" stopColor="#FAFDFE" />
        </linearGradient>
        <linearGradient id="bmcsSeaDeep" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3FB6C4" />
          <stop offset="55%" stopColor="#4FC4CB" />
          <stop offset="100%" stopColor="#6BD5D2" />
        </linearGradient>
        <linearGradient id="bmcsSeaShallow" x1="0.1" y1="0" x2="0.6" y2="1">
          <stop offset="0%" stopColor="#7FDEDA" />
          <stop offset="100%" stopColor="#B7EFE4" />
        </linearGradient>
        <linearGradient id="bmcsSand" x1="0.2" y1="0" x2="0.6" y2="1">
          <stop offset="0%" stopColor="#F9EDD3" />
          <stop offset="100%" stopColor="#EFDCB4" />
        </linearGradient>
        <linearGradient id="bmcsHillFar" x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0%" stopColor="#A7D7C6" />
          <stop offset="100%" stopColor="#83C3AE" />
        </linearGradient>
        <linearGradient id="bmcsHillMid" x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0%" stopColor="#74C093" />
          <stop offset="100%" stopColor="#4FA37F" />
        </linearGradient>
        <linearGradient id="bmcsHillNear" x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0%" stopColor="#5DB77F" />
          <stop offset="100%" stopColor="#33875F" />
        </linearGradient>
      </defs>

      <g>
        {/* ── Sky ── */}
        <rect x="0" y="0" width="620" height="200" fill="url(#bmcsSky)" />

        {/* ── Clouds ── */}
        <g fill="#FFFFFF" opacity="0.92">
          <path d="M356 74c0-11 9-20 20-20 4 0 8 1 11 3 4-9 13-15 23-15 13 0 24 10 25 23 8 1 14 8 14 16 0 9-7 16-16 16h-70c-9 0-16-6-16-14 0-4 3-8 9-9z" />
          <path d="M470 44c0-8 7-15 15-15 3 0 6 1 9 3 3-7 10-12 18-12 11 0 19 8 20 18 6 1 11 6 11 12 0 7-6 12-13 12h-52c-6 0-11-4-11-10 0-3 1-7 3-8z" />
        </g>
        <g fill="#DEEEF7" opacity="0.75">
          <ellipse cx="556" cy="98" rx="62" ry="15" />
          <ellipse cx="404" cy="116" rx="48" ry="11" />
        </g>

        {/* ── Birds ── clustered where the mask is fully opaque, clear of
            the hero's account button (top-right) and the hill line. */}
        <g stroke="#2C6C86" strokeLinecap="round" fill="none" opacity="0.85">
          <path d="M398 88c6-8 12-8 17-1 5-7 11-7 17 1" strokeWidth="2.4" />
          <path d="M436 72c5-6 10-6 14-1 4-5 9-5 14 1" strokeWidth="2.1" />
          <path d="M416 106c4-5 8-5 11-1 3-4 7-4 11 1" strokeWidth="1.9" />
        </g>

        {/* ── Headland: three ridges receding into haze ── */}
        <path d="M286 173c52-5 84-30 132-45 54-17 108-40 202-64v109H286z" fill="url(#bmcsHillFar)" opacity="0.9" />
        <path d="M322 174c50-4 86-23 132-36 52-14 100-28 166-46v82H322z" fill="url(#bmcsHillMid)" />
        <path d="M362 175c46-2 82-14 126-23 46-10 84-19 132-31v54H362z" fill="url(#bmcsHillNear)" />
        {/* Sunlit crest picked out on the near ridge */}
        <path d="M404 168c40-5 74-14 110-22 38-8 68-15 106-25v10c-40 10-74 18-112 26-34 7-68 14-104 18z" fill="#7FCB99" opacity="0.55" />
        {/* Tree line where the headland drops to the shore */}
        <g fill="#2F7F5C" opacity="0.9">
          <ellipse cx="392" cy="176" rx="18" ry="9" />
          <ellipse cx="434" cy="171" rx="24" ry="10" />
          <ellipse cx="486" cy="165" rx="28" ry="11" />
          <ellipse cx="546" cy="158" rx="30" ry="12" />
          <ellipse cx="602" cy="150" rx="26" ry="12" />
        </g>

        {/* ── Open water ── */}
        <path d="M0 170h620v78L0 316z" fill="url(#bmcsSeaDeep)" />
        {/* Light streaks catching the sun */}
        <g fill="#FFFFFF" opacity="0.28">
          <rect x="24" y="188" width="150" height="4" rx="2" />
          <rect x="206" y="204" width="104" height="4" rx="2" />
          <rect x="66" y="224" width="128" height="5" rx="2.5" />
          <rect x="286" y="182" width="76" height="3" rx="1.5" />
        </g>

        {/* ── Shallows sweeping up to the shore ── */}
        <path d="M0 274c112-6 214-26 316-56 96-28 190-44 304-52v72c-104 12-198 30-292 58-100 30-206 46-328 52z" fill="url(#bmcsSeaShallow)" />
        {/* Surf line */}
        <path d="M0 316c122-6 228-22 328-52 94-28 188-46 292-58" stroke="#FFFFFF" strokeWidth="7" strokeLinecap="round" fill="none" opacity="0.85" />
        <path d="M0 330c124-6 232-22 334-53 96-29 186-46 286-57" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.5" />

        {/* ── Beach ── */}
        <path d="M0 332c124-6 232-22 334-53 96-29 186-46 286-57v150H0z" fill="url(#bmcsSand)" />
        <path d="M156 344c96-12 182-32 264-58 54-17 108-30 166-38" stroke="#E4CB9E" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.55" />

        {/* ── Foreground planting in the bottom-right corner ── */}
        <g fill="#3E9E6E" transform="translate(112 20) scale(0.82)">
          <path d="M620 260c-26 4-46 18-58 38 20 6 40 2 58-12z" />
          <path d="M594 296c-24 2-44 14-58 32 20 8 42 6 60-8z" opacity="0.9" />
        </g>
        <g stroke="#2F8760" strokeWidth="5" strokeLinecap="round" fill="none" transform="translate(112 20) scale(0.82)">
          <path d="M540 372c-4-24 4-44 24-58" />
          <path d="M566 372c2-26 14-44 36-54" />
          <path d="M514 372c-8-18-6-34 6-48" />
        </g>
        <g fill="#57B87F" transform="translate(112 20) scale(0.82)">
          <ellipse cx="524" cy="322" rx="16" ry="8" transform="rotate(-32 524 322)" />
          <ellipse cx="562" cy="308" rx="18" ry="8" transform="rotate(-24 562 308)" />
          <ellipse cx="600" cy="292" rx="18" ry="8" transform="rotate(-18 600 292)" />
        </g>
      </g>
    </svg>
  );
}
