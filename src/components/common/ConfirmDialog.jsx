import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Trash2, AlertTriangle } from 'lucide-react';
import useFocusTrap from '../../hooks/useFocusTrap';

// Attention popup for destructive actions (deleting an account, a report).
// Pass `requirePhrase` to make the user type it before the button unlocks,
// for actions where a stray click must not be enough.
export default function ConfirmDialog({
  title,
  description,
  children,
  confirmLabel = 'Delete',
  busyLabel = 'Deleting…',
  requirePhrase,
  onConfirm,
  onCancel,
  loading = false,
  error = '',
}) {
  const [phrase, setPhrase] = useState('');
  const dialogRef = useRef(null);
  useFocusTrap(dialogRef);
  const phraseOk = !requirePhrase || phrase.trim().toUpperCase() === requirePhrase.toUpperCase();
  const canConfirm = phraseOk && !loading;

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && !loading) onCancel(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [loading, onCancel]);

  // Portaled to <body>: page wrappers use backdrop-filter, which would make
  // `position: fixed` relative to the wrapper instead of the viewport.
  return createPortal(
    <div
      onClick={() => !loading && onCancel()}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
      }}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="card"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        onClick={e => e.stopPropagation()}
        style={{ width: '100%', maxWidth: '460px', padding: '2rem' }}
      >
        <div style={{
          width: '56px', height: '56px', borderRadius: '50%', marginBottom: '1rem',
          background: 'rgba(239, 68, 68, 0.12)', color: 'var(--danger)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <AlertTriangle size={28} />
        </div>
        <h3 id="confirm-dialog-title" style={{ fontSize: '1.25rem', color: 'var(--text-main)', marginBottom: '0.5rem' }}>
          {title}
        </h3>
        {description && (
          <p className="text-muted" style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>
            {description}
          </p>
        )}
        {children}

        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem', border: '1px solid rgba(239, 68, 68, 0.2)', fontSize: '0.875rem' }}>
            {error}
          </div>
        )}

        {requirePhrase && (
          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label htmlFor="confirm-dialog-phrase">
              Type <strong style={{ color: 'var(--danger)' }}>{requirePhrase}</strong> to confirm
            </label>
            <input
              id="confirm-dialog-phrase"
              type="text"
              className="input-field"
              value={phrase}
              onChange={e => setPhrase(e.target.value)}
              placeholder={requirePhrase}
              autoComplete="off"
              autoFocus
              disabled={loading}
            />
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <button type="button" className="secondary" onClick={onCancel} disabled={loading} autoFocus={!requirePhrase}>
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={!canConfirm}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              background: 'var(--danger)', color: '#fff', border: 'none',
              opacity: canConfirm ? 1 : 0.5, cursor: canConfirm ? 'pointer' : 'not-allowed'
            }}
          >
            <Trash2 size={16} />
            {loading ? busyLabel : confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
