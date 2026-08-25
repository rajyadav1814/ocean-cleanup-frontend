import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';

// Generic custom-styled dropdown — replaces native <select> so the option
// list matches the app's design instead of the browser's default popup.
// `options` accepts either strings or { value, label } objects.
// `triggerStyle`/`menuStyle` let a page override colors to match a local
// theme (e.g. a page with its own dark palette instead of the app-wide one).
export default function Select({ id, value, onChange, options, placeholder = 'Select…', disabled = false, triggerStyle, menuStyle: menuStyleOverride, optionHoverBg }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
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
    border: '1px solid var(--border-light)', background: 'var(--surface)',
    fontFamily: 'inherit', fontSize: '1rem', color: 'var(--text-main)',
    ...triggerStyle,
  };

  const menuStyle = {
    position: 'absolute', top: 'calc(100% + 0.4rem)', left: 0, right: 0, zIndex: 20,
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

      {open && (
        <div style={menuStyle}>
          {normalized.map((o) => (
            <div key={o.value} style={optionStyle(o.value === value)} onClick={() => pick(o.value)}>
              {o.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
