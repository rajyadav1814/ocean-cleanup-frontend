import { useState } from 'react';
import { apiPost } from '../../../services/api';

export default function SubmitActivity() {
  const [form, setForm] = useState({ location: '', volunteers: '', quantity: '', organization: 'Ocean Guardians Network', category: 'plastic', evidenceHash: 'mock-hash' });
  const [status, setStatus] = useState('');

  const [preview, setPreview] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    const payload = {
      organizationId: 'org-1',
      contributorId: 'contrib-1',
      ...form,
      timestamp: new Date().toISOString()
    };
    const response = await apiPost('/api/activities', payload);
    setStatus(response.ok ? 'Activity submitted' : 'Submission failed');
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

        {/* Location */}
        <div className="form-group">
          <label>Location</label>
          <input 
            placeholder="Zuma Beach, CA" 
            value={form.location} 
            onChange={(e) => setForm({ ...form, location: e.target.value })} 
            required 
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--primary)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
            GPS Captured Automatically
          </div>
        </div>

        {/* Volunteers & Waste */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="form-group">
            <label>Volunteers</label>
            <input 
              type="number" 
              placeholder="23" 
              value={form.volunteers} 
              onChange={(e) => setForm({ ...form, volunteers: e.target.value })} 
            />
          </div>
          <div className="form-group">
            <label>Waste (kg)</label>
            <input 
              type="number" 
              min="1" 
              placeholder="47" 
              value={form.quantity} 
              onChange={(e) => setForm({ ...form, quantity: e.target.value })} 
              required 
            />
          </div>
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

        {/* Submit Button */}
        <div className="mt-2">
          <button 
            type="submit" 
            style={{ 
              width: '100%', 
              background: '#ffffff', 
              color: '#000000', 
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
