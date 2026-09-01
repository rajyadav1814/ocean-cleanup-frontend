import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown } from 'lucide-react';

// Generic custom-styled dropdown — replaces native <select> so the option
// list matches the app's design instead of the browser's default popup.
// The menu is rendered into a portal (document.body) and positioned via
// getBoundingClientRect so it isn't clipped by an ancestor's overflow:hidden
// (e.g. cards that clip decorative background elements).
// `options` accepts either strings or { value, label } objects.
// `triggerStyle`/`menuStyle` let a page override colors to match a local
// theme (e.g. a page with its own dark palette instead of the app-wide one).
export default function Select({ id, value, onChange, options, placeholder = 'Select…', disabled = false, triggerStyle, menuStyle: menuStyleOverride, optionHoverBg }) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState(null);
  const rootRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e) => {
      if (
        rootRef.current && !rootRef.current.contains(e.target) &&
        menuRef.current && !menuRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  useLayoutEffect(() => {
    if (!open) return;
    const updateCoords = () => {
      const rect = rootRef.current?.getBoundingClientRect();
      if (rect) setCoords({ top: rect.bottom + 6, left: rect.left, width: rect.width });
    };
    updateCoords();
    window.addEventListener('scroll', updateCoords, true);
    window.addEventListener('resize', updateCoords);
    return () => {
      window.removeEventListener('scroll', updateCoords, true);
      window.removeEventListener('resize', updateCoords);
    };
  }, [open]);

  const normalized = options.map((o) => (typeof o === 'string' ? { value: o, label: o } : o));
  const selected = normalized.find((o) => o.value === value);
  const textColor = triggerStyle?.color || 'var(--text-main)';

  const pick = (val) => {
    onChange(val);
    setOpen(false);
  };

  const triggerBaseStyle = {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    width: '100%', boxSizing: 'border-box', cursor: disabled ? 'default' : 'pointer',
    padding: '1rem 1.25rem', borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border-light)', background: 'var(--surface-solid)',
    fontFamily: 'inherit', fontSize: '1rem', color: 'var(--text-main)',
    ...triggerStyle,
  };

  const menuStyle = {
    position: 'fixed', top: coords?.top ?? 0, left: coords?.left ?? 0, width: coords?.width ?? 0, zIndex: 1000,
    background: 'var(--surface-card, var(--surface))', border: '1px solid var(--border-light)',
    borderRadius: 'var(--radius-md)', boxShadow: '0 12px 28px rgba(0,0,0,0.18)',
    padding: '0.35rem', maxHeight: '260px', overflowY: 'auto',
    ...menuStyleOverride,
  };

  const optionStyle = (active) => ({
    padding: '0.6rem 0.75rem', borderRadius: '0.5rem', fontSize: '0.95rem',
    color: textColor, cursor: 'pointer',
    background: active ? (optionHoverBg || 'var(--surface-hover)') : 'transparent',
  });

  return (
    <div ref={rootRef} style={{ position: 'relative' }}>
      <button
        type="button"
        id={id}
        onClick={() => { if (!disabled) setOpen((v) => !v); }}
        disabled={disabled}
        style={triggerBaseStyle}
      >
        <span style={{ color: textColor }}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown size={16} style={{ opacity: 0.6, flexShrink: 0 }} />
      </button>

      {open && coords && createPortal(
        <div ref={menuRef} style={menuStyle}>
          {normalized.map((o) => (
            <div key={o.value} style={optionStyle(o.value === value)} onClick={() => pick(o.value)}>
              {o.label}
            </div>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
}
