import { useEffect, useState, useCallback } from 'react';
import { orgApi } from '../../../services/api';

const PAGE_SIZE = 8;

// ── Modal ────────────────────────────────────────────────────────────────────
function OrgModal({ org, onClose, onSaved, allOrgs = [] }) {
  const isEdit = Boolean(org?.orgId);
  const [form, setForm] = useState({
    name: org?.name || '',
    region: org?.region || '',
    country: org?.country || '',
    contactEmail: org?.contactEmail || '',
    parentOrgId: org?.parentOrgId || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('Name is required'); return; }
    setSaving(true);
    setError('');
    try {
      const payload = {
        name: form.name.trim(),
        region: form.region.trim() || null,
        country: form.country.trim() || null,
        contactEmail: form.contactEmail.trim() || null,
        parentOrgId: form.parentOrgId || null,
      };
      const res = isEdit
        ? await orgApi.update(org.orgId, payload)
        : await orgApi.create(payload);
      if (!res.ok) throw new Error(res.error || 'Request failed');
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const fieldStyle = {
    width: '100%', padding: '0.7rem 1rem', borderRadius: '0.625rem',
    border: '1px solid var(--modal-field-border)', background: 'var(--modal-field-bg)',
    color: 'var(--text-main)', outline: 'none', fontSize: '0.9rem',
    boxSizing: 'border-box',
  };
  const labelStyle = {
    fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)',
    textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.3rem',
    display: 'block',
  };

  // Exclude self from parent dropdown
  const parentOptions = allOrgs.filter((o) => !isEdit || o.orgId !== org.orgId);

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 1500,
      background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1rem',
    }}>
      <form onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit} style={{
        width: '100%', maxWidth: '480px', background: 'var(--surface-card)',
        borderRadius: '1rem', border: '1px solid var(--border-light)',
        boxShadow: 'var(--modal-shadow)', padding: '1.75rem',
        display: 'flex', flexDirection: 'column', gap: '1rem', color: 'var(--text-main)',
      }}>
        <h3 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--text-main)' }}>
          {isEdit ? 'Edit Organization' : 'Add Organization'}
        </h3>

        {error && <div style={{
          background: 'rgba(239,68,68,0.12)', color: '#ef4444',
          padding: '0.5rem 0.75rem', borderRadius: '0.5rem', fontSize: '0.85rem',
        }}>{error}</div>}

        <div>
          <label style={labelStyle}>Name *</label>
          <input style={fieldStyle} value={form.name} onChange={set('name')} placeholder="Organization name" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div>
            <label style={labelStyle}>Region</label>
            <input style={fieldStyle} value={form.region} onChange={set('region')} placeholder="e.g. Asia-Pacific" />
          </div>
          <div>
            <label style={labelStyle}>Country</label>
            <input style={fieldStyle} value={form.country} onChange={set('country')} placeholder="e.g. Australia" />
          </div>
        </div>
        <div>
          <label style={labelStyle}>Contact Email</label>
          <input style={fieldStyle} type="email" value={form.contactEmail} onChange={set('contactEmail')} placeholder="org@example.com" />
        </div>
        <div>
          <label style={labelStyle}>Parent Organization</label>
          <select style={{ ...fieldStyle, cursor: 'pointer', appearance: 'auto' }} value={form.parentOrgId} onChange={set('parentOrgId')}>
            <option value="">None (Top-level)</option>
            {parentOptions.map((po) => (
              <option key={po.orgId} value={po.orgId}>{po.name}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
          <button type="button" onClick={onClose} style={{
            padding: '0.65rem 1.25rem', borderRadius: '999px',
            border: '1px solid var(--modal-cancel-border)', background: 'var(--modal-cancel-bg)',
            color: 'var(--text-main)', cursor: 'pointer', fontWeight: 600,
          }}>Cancel</button>
          <button type="submit" disabled={saving} style={{
            padding: '0.65rem 1.5rem', borderRadius: '999px', border: 'none',
            background: 'linear-gradient(135deg, #0ea5e9, #6366f1)',
            color: '#fff', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer',
            opacity: saving ? 0.7 : 1,
          }}>{saving ? 'Saving…' : isEdit ? 'Update' : 'Create'}</button>
        </div>
      </form>
    </div>
  );
}

// ── Delete confirm ───────────────────────────────────────────────────────────
function DeleteConfirm({ org, onClose, onConfirmed }) {
  const [deleting, setDeleting] = useState(false);
  const handleDelete = async () => {
    setDeleting(true);
    try {
      await orgApi.remove(org.orgId);
      onConfirmed();
    } catch { /* */ } finally { setDeleting(false); }
  };
  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 1500,
      background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        width: '100%', maxWidth: '400px', background: 'var(--surface-card)',
        borderRadius: '1rem', border: '1px solid var(--border-light)',
        boxShadow: 'var(--modal-shadow)', padding: '1.75rem',
        textAlign: 'center', color: 'var(--text-main)',
      }}>
        <div style={{
          width: '3rem', height: '3rem', borderRadius: '50%',
          background: 'rgba(239,68,68,0.14)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem',
        }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
        </div>
        <h3 style={{ margin: '0 0 0.5rem', color: 'var(--text-main)' }}>Delete Organization?</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '0 0 1.5rem' }}>
          <strong>{org.name}</strong> will be permanently removed.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
          <button onClick={onClose} style={{
            padding: '0.65rem 1.25rem', borderRadius: '999px',
            border: '1px solid var(--modal-cancel-border)', background: 'var(--modal-cancel-bg)',
            color: 'var(--text-main)', cursor: 'pointer', fontWeight: 600,
          }}>Cancel</button>
          <button onClick={handleDelete} disabled={deleting} style={{
            padding: '0.65rem 1.5rem', borderRadius: '999px', border: 'none',
            background: '#ef4444', color: '#fff', fontWeight: 600,
            cursor: deleting ? 'not-allowed' : 'pointer', opacity: deleting ? 0.7 : 1,
          }}>{deleting ? 'Deleting…' : 'Delete'}</button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function Organizations() {
  const [orgs, setOrgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(null);   // null | 'add' | org object
  const [delTarget, setDelTarget] = useState(null);
  const [toggling, setToggling] = useState({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await orgApi.list();
      if (res.ok) setOrgs(res.organizations);
      else setError(res.error || 'Failed to load');
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = orgs.filter((o) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return o.name.toLowerCase().includes(q)
      || (o.region || '').toLowerCase().includes(q)
      || (o.country || '').toLowerCase().includes(q);
  });

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageOrgs = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => { setPage(1); }, [search, orgs.length]);

  const handleToggle = async (org) => {
    setToggling((p) => ({ ...p, [org.orgId]: true }));
    try {
      const res = await orgApi.setStatus(org.orgId, !org.isActive);
      if (res.ok) setOrgs((prev) => prev.map((o) => o.orgId === org.orgId ? res.organization : o));
    } catch { /* */ }
    finally { setToggling((p) => ({ ...p, [org.orgId]: false })); }
  };

  const onSaved = () => { setModal(null); load(); };
  const onDeleted = () => { setDelTarget(null); load(); };

  return (
    <section>
      {/* Header */}
      <div className="card mb-6" style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        flexWrap: 'wrap', gap: '1rem', padding: '1.25rem 1.75rem',
      }}>
        <div>
          <h3 style={{ marginBottom: '0.25rem' }}>Organizations</h3>
          <p className="text-muted" style={{ margin: 0 }}>Manage partner organizations on the platform.</p>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, region, country"
            style={{
              minWidth: '220px', padding: '0.75rem 1rem', borderRadius: '999px',
              border: '1px solid var(--border-light)', background: 'var(--surface)',
              color: 'var(--text-main)', outline: 'none',
            }} />
          {!loading && (
            <span style={{
              background: 'rgba(16,185,129,0.12)', color: '#10b981',
              border: '1px solid rgba(16,185,129,0.3)', borderRadius: '999px',
              padding: '0.2rem 0.75rem', fontWeight: 600, fontSize: '0.8rem',
            }}>Total: {filtered.length}</span>
          )}
          <button onClick={() => setModal('add')} style={{
            padding: '0.65rem 1.25rem', borderRadius: '999px', border: 'none',
            background: 'linear-gradient(135deg, #0ea5e9, #6366f1)',
            color: '#fff', fontWeight: 600, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '0.4rem',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add Org
          </button>
          {error && <span style={{ fontSize: '0.8rem', color: '#ef4444', background: 'rgba(239,68,68,0.1)', padding: '0.25rem 0.75rem', borderRadius: '0.5rem' }}>{error}</span>}
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', padding: '1rem' }}>
            {[1,2,3,4].map((i) => (
              <div key={i} style={{ height: '3.25rem', borderRadius: '0.625rem', background: 'var(--surface-hover)', animation: 'pulse 1.5s ease-in-out infinite', animationDelay: `${i*0.1}s` }} />
            ))}
          </div>
        ) : pageOrgs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ opacity: 0.35, display: 'block', margin: '0 auto 0.75rem' }}>
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            No organizations found.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem', color: 'var(--text-main)' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                  {['#', 'Name', 'Region', 'Country', 'Email', 'Joined', 'Status', 'Actions'].map((h) => (
                    <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.72rem', letterSpacing: '0.06em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pageOrgs.map((o, idx) => (
                  <tr key={o.orgId}
                    style={{ borderBottom: idx < pageOrgs.length - 1 ? '1px solid var(--border-light)' : 'none', transition: 'background 0.15s' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-hover)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '0.875rem 1rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>{(page-1)*PAGE_SIZE + idx + 1}</td>
                    <td style={{ padding: '0.875rem 1rem', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: '2.1rem', height: '2.1rem', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #0ea5e9)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8rem', flexShrink: 0, color: '#fff' }}>
                          {(o.name?.[0] || '?').toUpperCase()}
                        </div>
                        <span style={{ fontWeight: 500 }}>{o.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: '0.875rem 1rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{o.region || '—'}</td>
                    <td style={{ padding: '0.875rem 1rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{o.country || '—'}</td>
                    <td style={{ padding: '0.875rem 1rem', color: 'var(--text-muted)' }}>{o.contactEmail || '—'}</td>
                    <td style={{ padding: '0.875rem 1rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{o.joinedAt ? new Date(o.joinedAt).toLocaleDateString() : '—'}</td>
                    <td style={{ padding: '0.875rem 0.75rem', whiteSpace: 'nowrap' }}>
                      <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', cursor: toggling[o.orgId] ? 'not-allowed' : 'pointer' }}>
                        <input type="checkbox" checked={o.isActive} disabled={toggling[o.orgId]} onChange={() => handleToggle(o)} style={{ display: 'none' }} />
                        <span style={{ width: '3rem', height: '1.6rem', borderRadius: '999px', position: 'relative', display: 'inline-block', background: o.isActive ? '#16a34a' : '#dc2626', transition: 'background 0.2s ease' }}>
                          <span style={{ position: 'absolute', top: '0.15rem', left: o.isActive ? '1.55rem' : '0.15rem', width: '1.2rem', height: '1.2rem', borderRadius: '50%', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.16)', transition: 'left 0.2s ease' }} />
                        </span>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, minWidth: '3.5rem', color: o.isActive ? '#166534' : '#991b1b' }}>
                          {toggling[o.orgId] ? 'Saving…' : o.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </label>
                    </td>
                    <td style={{ padding: '0.875rem 1rem', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button title="Edit" onClick={() => setModal(o)} style={{ width: '2rem', height: '2rem', borderRadius: '0.5rem', border: '1px solid var(--border-light)', background: 'var(--surface)', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                        <button title="Delete" onClick={() => setDelTarget(o)} style={{ width: '2rem', height: '2rem', borderRadius: '0.5rem', border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 0.75rem' }}>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Showing {pageOrgs.length} of {filtered.length} organizations
        </span>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button type="button" onClick={() => setPage((p) => Math.max(p-1, 1))} disabled={page === 1}
            style={{ borderRadius: '999px', border: '1px solid var(--border-light)', background: 'var(--surface)', color: 'var(--text-main)', padding: '0.6rem 1rem', cursor: page === 1 ? 'not-allowed' : 'pointer' }}>
            Previous
          </button>
          <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{page} / {pageCount}</span>
          <button type="button" onClick={() => setPage((p) => Math.min(p+1, pageCount))} disabled={page === pageCount}
            style={{ borderRadius: '999px', border: '1px solid var(--border-light)', background: 'var(--surface)', color: 'var(--text-main)', padding: '0.6rem 1rem', cursor: page === pageCount ? 'not-allowed' : 'pointer' }}>
            Next
          </button>
        </div>
      </div>

      {/* Modals */}
      {modal && <OrgModal org={modal === 'add' ? null : modal} onClose={() => setModal(null)} onSaved={onSaved} allOrgs={orgs} />}
      {delTarget && <DeleteConfirm org={delTarget} onClose={() => setDelTarget(null)} onConfirmed={onDeleted} />}

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
    </section>
  );
}
