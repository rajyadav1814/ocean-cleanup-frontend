import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Plus } from 'lucide-react';

// Custom-styled dropdown (not a native <select>) so the option list matches
// the app's design instead of the browser's default popup chrome. Includes
// an "Add new organization" option that reveals a text input, creates the
// org via the API, and selects it. Shared between Signup and Submit Activity.
export default function OrganizationSelect({
  id,
  value,
  onChange,
  organizations,
  loading,
  onAddOrganization,
  triggerStyle,
  menuStyle: menuStyleOverride,
  optionHoverBg,
  placeholder = 'Select organization',
}) {
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false);
        setAdding(false);
        setError('');
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  const selectedName = organizations.find((o) => o.orgId === value)?.name;
  const textColor = triggerStyle?.color || 'var(--text-main)';

  const pick = (orgId) => {
    onChange(orgId);
    setOpen(false);
  };

  const confirmAdd = async () => {
    if (!newName.trim()) { setError('Enter an organization name.'); return; }
    setSaving(true);
    setError('');
    try {
      const org = await onAddOrganization(newName);
      onChange(org.orgId);
      setAdding(false);
      setNewName('');
      setOpen(false);
    } catch (err) {
      setError(err.message || 'Failed to add organization.');
    } finally {
      setSaving(false);
    }
  };

  const triggerBaseStyle = {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    width: '100%', boxSizing: 'border-box', cursor: loading ? 'default' : 'pointer',
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
        onClick={() => { if (!loading) setOpen((v) => !v); }}
        disabled={loading}
        style={triggerBaseStyle}
      >
        <span style={{ color: textColor }}>
          {loading ? 'Loading…' : (selectedName || placeholder)}
        </span>
        <ChevronDown size={16} style={{ opacity: 0.6, flexShrink: 0 }} />
      </button>

      {open && (
        <div style={menuStyle}>
          {adding ? (
            <div style={{ padding: '0.35rem' }}>
              <input
                type="text"
                autoFocus
                placeholder="Enter organization name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); confirmAdd(); } }}
                disabled={saving}
                style={{
                  width: '100%', boxSizing: 'border-box', marginBottom: '0.5rem',
                  padding: '.6rem .75rem', borderRadius: '0.5rem',
                  border: '1px solid var(--border-light)', background: 'var(--surface)',
                  color: textColor, fontFamily: 'inherit', fontSize: '.95rem',
                }}
              />
              {error && <p style={{ color: '#e05353', fontSize: '.82rem', margin: '0 0 .5rem' }}>{error}</p>}
              <div style={{ display: 'flex', gap: '.5rem' }}>
                <button type="button" onClick={confirmAdd} disabled={saving} style={{ flex: 1 }}>
                  {saving ? 'Adding…' : 'Add'}
                </button>
                <button type="button" onClick={() => { setAdding(false); setNewName(''); setError(''); }} disabled={saving} style={{ flex: 1 }}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <div style={optionStyle(!value)} onClick={() => pick('')}>
                {placeholder}
              </div>
              {organizations.map((o) => (
                <div key={o.orgId} style={optionStyle(o.orgId === value)} onClick={() => pick(o.orgId)}>
                  {o.name}
                </div>
              ))}
              <div
                style={{ ...optionStyle(false), display: 'flex', alignItems: 'center', gap: '.4rem', color: 'var(--primary)', fontWeight: 500, borderTop: '1px solid var(--border-light)', marginTop: '0.25rem', paddingTop: '0.6rem' }}
                onClick={() => setAdding(true)}
              >
                <Plus size={14} /> Add your organization
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
