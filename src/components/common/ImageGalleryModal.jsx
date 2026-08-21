import { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from '../../context/ThemeContext';

/**
 * ImageGalleryModal — theme-aware full-screen gallery
 *
 * Props:
 *   images   – string[]   Array of image URLs
 *   startAt  – number     Index to open on (default 0)
 *   alt      – string     Base alt text
 *   onClose  – () => void Called when the modal should close
 */
export default function ImageGalleryModal({ images = [], startAt = 0, alt = 'Image', onClose }) {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const [current, setCurrent] = useState(startAt);
  const total = images.length;

  const prev = useCallback(() => setCurrent((c) => (c - 1 + total) % total), [total]);
  const next = useCallback(() => setCurrent((c) => (c + 1) % total), [total]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose, prev, next]);

  if (!total) return null;

  // ─── Theme tokens ──────────────────────────────────────────────────────────
  const t = isLight ? {
    backdrop:      'rgba(241, 245, 249, 0.82)',
    btnBg:         'rgba(255, 255, 255, 0.92)',
    btnBorder:     'rgba(0, 0, 0, 0.12)',
    btnColor:      '#0f172a',
    btnHoverBg:    'rgba(2, 132, 199, 0.15)',
    pillBg:        'rgba(255,255,255,0.85)',
    pillColor:     '#0f172a',
    thumbBorder:   'rgba(0,0,0,0.12)',
    thumbActiveBorder: '#0284c7',
    dotInactive:   'rgba(0,0,0,0.2)',
    dotActive:     '#0284c7',
    counterBg:     'rgba(255,255,255,0.82)',
    counterColor:  '#0f172a',
    accentGlow:    'rgba(2,132,199,0.35)',
  } : {
    backdrop:      'rgba(2, 6, 23, 0.88)',
    btnBg:         'rgba(15, 23, 42, 0.78)',
    btnBorder:     'rgba(255,255,255,0.15)',
    btnColor:      'white',
    btnHoverBg:    'rgba(14,165,233,0.35)',
    pillBg:        'rgba(0,0,0,0.65)',
    pillColor:     'white',
    thumbBorder:   'rgba(255,255,255,0.1)',
    thumbActiveBorder: '#0ea5e9',
    dotInactive:   'rgba(255,255,255,0.25)',
    dotActive:     '#0ea5e9',
    counterBg:     'rgba(0,0,0,0.55)',
    counterColor:  'white',
    accentGlow:    'rgba(14,165,233,0.35)',
  };
  // ──────────────────────────────────────────────────────────────────────────

  return createPortal(
    <div
      role="presentation"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1100,
        background: t.backdrop,
        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        overflowY: 'auto',
        padding: 'clamp(1rem, 5vw, 3rem) 1rem 1rem',
        transition: 'background 0.25s ease'
      }}
    >
      {/* Dialog box */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Image gallery"
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative',
          width: 'min(96vw, 1100px)',
          margin: 'auto 0',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.75rem'
        }}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close gallery"
          style={{
            position: 'absolute',
            top: '-0.25rem',
            right: '-0.25rem',
            zIndex: 2,
            width: 'clamp(1.9rem, 5vw, 2.25rem)',
            height: 'clamp(1.9rem, 5vw, 2.25rem)',
            borderRadius: '999px',
            background: t.btnBg,
            color: t.btnColor,
            border: `1px solid ${t.btnBorder}`,
            display: 'grid',
            placeItems: 'center',
            padding: 0,
            cursor: 'pointer',
            backdropFilter: 'blur(8px)',
            boxShadow: isLight ? '0 2px 8px rgba(0,0,0,0.12)' : 'none',
            transition: 'background 0.15s'
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Image — no frame, floats on backdrop */}
        <div style={{ position: 'relative', width: '100%' }}>
          <img
            key={current}
            src={images[current]}
            alt={`${alt} ${current + 1} of ${total}`}
            style={{
              display: 'block',
              width: '100%',
              maxHeight: '82vh',
              objectFit: 'contain',
              animation: 'galleryFadeIn 0.18s ease',
              borderRadius: '0.5rem',
              userSelect: 'none'
            }}
          />

          {/* Left arrow */}
          {total > 1 && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); prev(); }}
              aria-label="Previous image"
              style={{
                position: 'absolute',
                left: '0.6rem',
                top: '50%',
                transform: 'translateY(-50%)',
                width: 'clamp(2rem, 6vw, 2.5rem)',
                height: 'clamp(2rem, 6vw, 2.5rem)',
                borderRadius: '999px',
                background: t.btnBg,
                border: `1px solid ${t.btnBorder}`,
                color: t.btnColor,
                display: 'grid',
                placeItems: 'center',
                padding: 0,
                cursor: 'pointer',
                backdropFilter: 'blur(6px)',
                boxShadow: isLight ? '0 2px 8px rgba(0,0,0,0.12)' : 'none',
                transition: 'background 0.15s, transform 0.15s'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = t.accentGlow; e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = t.btnBg; e.currentTarget.style.transform = 'translateY(-50%) scale(1)'; }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
          )}

          {/* Right arrow */}
          {total > 1 && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); next(); }}
              aria-label="Next image"
              style={{
                position: 'absolute',
                right: '0.6rem',
                top: '50%',
                transform: 'translateY(-50%)',
                width: 'clamp(2rem, 6vw, 2.5rem)',
                height: 'clamp(2rem, 6vw, 2.5rem)',
                borderRadius: '999px',
                background: t.btnBg,
                border: `1px solid ${t.btnBorder}`,
                color: t.btnColor,
                display: 'grid',
                placeItems: 'center',
                padding: 0,
                cursor: 'pointer',
                backdropFilter: 'blur(6px)',
                boxShadow: isLight ? '0 2px 8px rgba(0,0,0,0.12)' : 'none',
                transition: 'background 0.15s, transform 0.15s'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = t.accentGlow; e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = t.btnBg; e.currentTarget.style.transform = 'translateY(-50%) scale(1)'; }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          )}

          {/* Counter badge */}
          {total > 1 && (
            <div style={{
              position: 'absolute',
              top: '0.6rem',
              left: '50%',
              transform: 'translateX(-50%)',
              background: t.counterBg,
              color: t.counterColor,
              fontSize: '0.75rem',
              fontWeight: 600,
              padding: '0.2rem 0.65rem',
              borderRadius: '999px',
              backdropFilter: 'blur(6px)',
              whiteSpace: 'nowrap',
              border: isLight ? `1px solid ${t.btnBorder}` : 'none'
            }}>
              {current + 1} / {total}
            </div>
          )}
        </div>

        {/* Dot indicators */}
        {total > 1 && (
          <div style={{
            display: 'flex',
            gap: '0.45rem',
            alignItems: 'center',
            padding: '0.25rem 0'
          }}>
            {images.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={(e) => { e.stopPropagation(); setCurrent(i); }}
                aria-label={`Go to image ${i + 1}`}
                style={{
                  width: i === current ? '1.5rem' : '0.5rem',
                  height: '0.5rem',
                  borderRadius: '999px',
                  background: i === current ? t.dotActive : t.dotInactive,
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  transition: 'width 0.2s ease, background 0.2s ease'
                }}
              />
            ))}
          </div>
        )}

        {/* Thumbnail strip */}
        {total > 1 && (
          <div style={{
            display: 'flex',
            gap: '0.4rem',
            overflowX: 'auto',
            maxWidth: '100%',
            padding: '0.1rem 0.1rem 0.4rem'
          }}>
            {images.map((url, i) => (
              <button
                key={i}
                type="button"
                onClick={(e) => { e.stopPropagation(); setCurrent(i); }}
                aria-label={`Thumbnail ${i + 1}`}
                style={{
                  flexShrink: 0,
                  width: 'clamp(2.5rem, 8vw, 3.5rem)',
                  height: 'clamp(2.5rem, 8vw, 3.5rem)',
                  borderRadius: '0.4rem',
                  overflow: 'hidden',
                  border: i === current
                    ? `2px solid ${t.thumbActiveBorder}`
                    : `2px solid ${t.thumbBorder}`,
                  padding: 0,
                  cursor: 'pointer',
                  opacity: i === current ? 1 : 0.55,
                  transition: 'opacity 0.2s, border-color 0.2s',
                  background: t.imgBg,
                  boxShadow: isLight && i === current ? `0 0 0 3px ${t.accentGlow}` : 'none'
                }}
              >
                <img
                  src={url}
                  alt={`Thumbnail ${i + 1}`}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              </button>
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes galleryFadeIn {
          from { opacity: 0; transform: scale(0.97); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>,
    document.body
  );
}
