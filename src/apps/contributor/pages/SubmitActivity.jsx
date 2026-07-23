import { useState } from 'react';
import { apiPost } from '../../../services/api';
import LocationPicker from '../../../components/common/LocationPicker';

export default function SubmitActivity() {
  const [form, setForm] = useState({
    location: '', lat: null, lon: null,
    volunteers: '', quantity: '',
    organization: 'Ocean Guardians Network',
    category: 'plastic',
    evidenceHash: 'mock-hash'
  });
  const [status, setStatus] = useState('');
  const [preview, setPreview] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    const payload = {
      organizationId: 'org-1',
      contributorId: 'contrib-1',
      ...form,
      gps: form.lat && form.lon ? `${form.lat}, ${form.lon}` : null,
      timestamp: new Date().toISOString()
    };
    const response = await apiPost('/api/activities', payload);
    setStatus(response.ok ? 'Activity submitted successfully!' : 'Submission failed. Please try again.');
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPreview(URL.createObjectURL(file));
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm(prev => ({ ...prev, evidenceHash: `hash-${file.name}-${Date.now()}`, imageUrl: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  function handleLocationChange({ displayName, lat, lon }) {
    setForm(prev => ({ ...prev, location: displayName, lat, lon }));
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 8rem)' }}>
      <section className="card" style={{ maxWidth: '1040px', width: '100%', margin: '0 auto', padding: '2rem' }}>
        <div className="flex-between mb-4">
          <h3 style={{ margin: 0, fontSize: '1.25rem' }}>Log a cleanup</h3>
        </div>

        <form onSubmit={handleSubmit} style={{ gap: '1.25rem' }}>
          {/* Photo Upload Area */}
          <label style={{
            border: '1px dashed var(--border-light)', borderRadius: 'var(--radius-md)',
            padding: preview ? '0' : '2.5rem 1rem', textAlign: 'center', color: 'var(--text-muted)',
            cursor: 'pointer', background: 'rgba(0,0,0,0.2)', display: 'block', overflow: 'hidden', position: 'relative'
          }}>
            <input type="file" accept="image/*" hidden onChange={handleFileChange} />
            {preview ? (
              <img src={preview} alt="Upload preview" style={{ width: '100%', height: '180px', objectFit: 'cover', display: 'block' }} />
            ) : (
              <>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 0.5rem auto' }}>
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                  <circle cx="12" cy="13" r="4"></circle>
                </svg>
                <div style={{ fontSize: '0.9rem' }}>Take or add photos</div>
              </>
            )}
          </label>

          {/* Location with autocomplete */}
          <div className="form-group">
            <label>Location</label>
            <LocationPicker
              value={form.location}
              onChange={handleLocationChange}
              placeholder="Search a beach, park, coast…"
              required
            />

            {/* Coordinate confirmation */}
            {form.lat && form.lon ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#22c55e', fontSize: '0.82rem', marginTop: '0.35rem' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                GPS: {form.lat.toFixed(5)}, {form.lon.toFixed(5)}
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: '0.35rem' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
                Type to search — select a suggestion to capture GPS
              </div>
            )}
          </div>

          {/* Volunteers & Waste */}
          <div className="form-row">
            <div className="form-group">
              <label>Volunteers</label>
              <input
                type="number"
                min="1"
                placeholder="How many volunteers?"
                value={form.volunteers}
                onChange={(e) => setForm({ ...form, volunteers: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Waste (kg)</label>
              <input
                type="number"
                min="1"
                placeholder="Kg collected"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Notes */}
          <div className="form-group">
            <label>Notes <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span></label>
            <textarea
              rows={2}
              placeholder="Any extra details about this cleanup…"
              value={form.notes || ''}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              style={{ resize: 'vertical' }}
            />
          </div>

          {/* Organization */}
          <div className="form-group">
            <label>Organization</label>
            <select
              value={form.organization}
              onChange={(e) => setForm({ ...form, organization: e.target.value })}
            >
              <option value="Ocean Guardians Network">Ocean Guardians Network</option>
              <option value="Global Cleanup Org">Global Cleanup Org</option>
              <option value="Clean Coasts">Clean Coasts</option>
              <option value="Beach Cleanup Crew">Beach Cleanup Crew</option>
              <option value="Ocean Cleanup Org">Ocean Cleanup Org</option>
            </select>
          </div>

          {/* Submit */}
          <div className="mt-2">
            <button
              type="submit"
              style={{
                width: '100%',
                boxShadow: 'none',
                padding: '1rem',
                borderRadius: 'var(--radius-md)'
              }}
            >
              Submit activity
            </button>
          </div>
        </form>

        {status && (
          <div className={`mt-4 p-4 rounded badge ${status.includes('failed') ? 'rejected' : 'approved'}`} style={{ display: 'block', padding: '1rem', textAlign: 'center' }}>
            {status}
          </div>
        )}
      </section>
    </div>
  );
}
