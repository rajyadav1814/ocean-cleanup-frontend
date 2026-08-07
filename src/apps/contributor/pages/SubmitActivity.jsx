import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { apiGet, apiPatch, apiPost } from '../../../services/api';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import MapLocationPicker from '../../../components/common/MapLocationPicker';
import { invalidateActivities } from '../../../store/activitiesSlice';
import { invalidateDashboard } from '../../../store/dashboardSlice';

export default function SubmitActivity() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id: activityId } = useParams();
  const { user } = useAuth();
  const [form, setForm] = useState({
    location: '', lat: null, lon: null,
    volunteers: '', quantity: '',
    organizationId: '',
    category: 'plastic',
    evidenceHash: 'mock-hash',
    notes: ''
  });
  const [organizations, setOrganizations] = useState([]);
  const [orgsLoading, setOrgsLoading] = useState(true);
  const [status, setStatus] = useState('');
  // images: array of { objectUrl, dataUrl } for new local files
  const [images, setImages] = useState([]);
  // existingUrls: array of gateway URLs loaded from edit mode
  const [existingUrls, setExistingUrls] = useState([]);
  const [loadingActivity, setLoadingActivity] = useState(Boolean(activityId));

  useEffect(() => {
    let isMounted = true;

    apiGet('/api/dashboard/organizations')
      .then((data) => {
        if (isMounted && data.ok) {
          setOrganizations(data.organizations || []);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setOrgsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!activityId) return;

    let isMounted = true;

    const loadActivity = async () => {
      setLoadingActivity(true);
      setStatus('');

      try {
        const data = await apiGet(`/api/activities/${activityId}`);
        if (!isMounted) return;

        if (!data.ok || !data.activity) {
          setStatus('Failed to load activity for editing.');
          return;
        }

        if (data.activity.status === 'approved') {
          setStatus('Approved activities cannot be edited.');
          return;
        }

        setForm((prev) => ({
          ...prev,
          location: data.activity.location || '',
          lat: data.activity.lat,
          lon: data.activity.lon,
          volunteers: data.activity.volunteers || '',
          quantity: data.activity.quantity || '',
          organizationId: data.activity.organizationId || '',
          category: data.activity.category || 'plastic',
          evidenceHash: data.activity.evidenceHash || 'mock-hash',
          notes: data.activity.notes || ''
        }));

        // Load existing images (array from backend)
        const urls = Array.isArray(data.activity.imageGatewayUrl)
          ? data.activity.imageGatewayUrl
          : data.activity.imageGatewayUrl
            ? [data.activity.imageGatewayUrl]
            : [];
        setExistingUrls(urls);
      } catch (err) {
        setStatus('Failed to load activity for editing.');
      } finally {
        if (isMounted) setLoadingActivity(false);
      }
    };

    loadActivity();

    return () => {
      isMounted = false;
    };
  }, [activityId, user]);

  async function handleSubmit(e) {
    e.preventDefault();

    const payload = {
      organizationId: form.organizationId || null,
      contributorId: user?.id || null,
      category: form.category,
      location: form.location,
      quantity: form.quantity,
      volunteers: form.volunteers,
      evidenceHash: form.evidenceHash,
      notes: form.notes,
      lat: form.lat,
      lon: form.lon,
      gps: form.lat && form.lon ? `${form.lat}, ${form.lon}` : null,
      timestamp: new Date().toISOString()
    };

    // If there are newly-selected images, send them as a JSON array of base64 strings
    if (images.length > 0) {
      payload.imageUrls = JSON.stringify(images.map((img) => img.dataUrl));
    }

    const response = activityId
      ? await apiPatch(`/api/activities/${activityId}`, payload)
      : await apiPost('/api/activities', payload);

    if (response.ok) {
      dispatch(invalidateActivities());
      dispatch(invalidateDashboard());
      setStatus(activityId ? 'Activity updated successfully!' : 'Activity submitted successfully!');
      const dest = user?.role === 'citizen' ? '/citizen/overview' : '/contributor/my-activities';
      setTimeout(() => navigate(dest, { replace: true }), 250);
    } else {
      setStatus(activityId ? 'Update failed. Please try again.' : 'Submission failed. Please try again.');
    }
  }

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    files.forEach((file) => {
      const objectUrl = URL.createObjectURL(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImages((prev) => [
          ...prev,
          { objectUrl, dataUrl: reader.result, name: file.name }
        ]);
      };
      reader.readAsDataURL(file);
    });

    // Reset the input so the same file can be selected again if removed
    e.target.value = '';
  };

  const removeNewImage = (index) => {
    setImages((prev) => {
      URL.revokeObjectURL(prev[index].objectUrl);
      return prev.filter((_, i) => i !== index);
    });
  };

  const removeExistingImage = (index) => {
    setExistingUrls((prev) => prev.filter((_, i) => i !== index));
  };

  function handleLocationChange({ displayName, lat, lon }) {
    setForm(prev => ({ ...prev, location: displayName, lat, lon }));
  }

  const totalImageCount = existingUrls.length + images.length;

  if (loadingActivity) {
    return <LoadingSpinner layout="form" />;
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 8rem)' }}>
      <section className="card" style={{ maxWidth: '1040px', width: '100%', margin: '0 auto', padding: '2rem' }}>
        <div className="flex-between mb-4">
          <h3 style={{ margin: 0, fontSize: '1.25rem' }}>{activityId ? 'Edit cleanup activity' : 'Log a cleanup'}</h3>
        </div>

        <form onSubmit={handleSubmit} style={{ gap: '1.25rem' }}>
          {/* Photo Upload Area */}
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              {/* Camera Button */}
              <label style={{
                border: '1px dashed var(--border-light)', borderRadius: 'var(--radius-md)',
                padding: '1.25rem 0.5rem', textAlign: 'center', color: 'var(--text-muted)',
                cursor: 'pointer', background: 'rgba(12, 109, 236, 0.08)', display: 'flex',
                flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                transition: 'background 0.2s'
              }}>
                <input type="file" accept="image/*" capture="environment" multiple hidden onChange={handleFileChange} />
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                  <circle cx="12" cy="13" r="4"></circle>
                </svg>
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Open Camera</span>
              </label>

              {/* Gallery Button */}
              <label style={{
                border: '1px dashed var(--border-light)', borderRadius: 'var(--radius-md)',
                padding: '1.25rem 0.5rem', textAlign: 'center', color: 'var(--text-muted)',
                cursor: 'pointer', background: 'rgba(12, 109, 236, 0.08)', display: 'flex',
                flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                transition: 'background 0.2s'
              }}>
                <input type="file" accept="image/*" multiple hidden onChange={handleFileChange} />
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <circle cx="8.5" cy="8.5" r="1.5"></circle>
                  <polyline points="21 15 16 10 5 21"></polyline>
                </svg>
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Gallery Upload</span>
              </label>
            </div>
            
            {/* Display total items count if any */}
            {totalImageCount > 0 && (
              <div style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600, textAlign: 'center' }}>
                {totalImageCount} photo{totalImageCount !== 1 ? 's' : ''} added
              </div>
            )}

            {/* Image Preview Grid */}
            {totalImageCount > 0 && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
                gap: '0.6rem',
                marginTop: '0.75rem'
              }}>
                {/* Existing images (edit mode) */}
                {existingUrls.map((url, idx) => (
                  <div key={`existing-${idx}`} style={{ position: 'relative', borderRadius: 'var(--radius-sm)', overflow: 'hidden', aspectRatio: '1', background: 'var(--surface-hover)' }}>
                    <img
                      src={url}
                      alt={`Existing image ${idx + 1}`}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    />
                    <button
                      type="button"
                      onClick={() => removeExistingImage(idx)}
                      aria-label="Remove image"
                      style={{
                        position: 'absolute', top: '0.25rem', right: '0.25rem',
                        width: '1.5rem', height: '1.5rem', borderRadius: '999px',
                        background: 'rgba(15,23,42,0.82)', border: '1px solid rgba(255,255,255,0.2)',
                        color: 'white', display: 'grid', placeItems: 'center',
                        padding: 0, cursor: 'pointer', lineHeight: 1
                      }}
                    >
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                    <div style={{
                      position: 'absolute', bottom: 0, left: 0, right: 0,
                      background: 'rgba(0,0,0,0.55)', color: '#0ea5e9',
                      fontSize: '0.6rem', padding: '0.15rem 0.3rem', textAlign: 'center', fontWeight: 600
                    }}>IPFS</div>
                  </div>
                ))}

                {/* New local images */}
                {images.map((img, idx) => (
                  <div key={`new-${idx}`} style={{ position: 'relative', borderRadius: 'var(--radius-sm)', overflow: 'hidden', aspectRatio: '1', background: 'var(--surface-hover)' }}>
                    <img
                      src={img.objectUrl}
                      alt={img.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    />
                    <button
                      type="button"
                      onClick={() => removeNewImage(idx)}
                      aria-label="Remove image"
                      style={{
                        position: 'absolute', top: '0.25rem', right: '0.25rem',
                        width: '1.5rem', height: '1.5rem', borderRadius: '999px',
                        background: 'rgba(15,23,42,0.82)', border: '1px solid rgba(255,255,255,0.2)',
                        color: 'white', display: 'grid', placeItems: 'center',
                        padding: 0, cursor: 'pointer', lineHeight: 1
                      }}
                    >
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                    <div style={{
                      position: 'absolute', bottom: 0, left: 0, right: 0,
                      background: 'rgba(0,0,0,0.55)', color: '#94a3b8',
                      fontSize: '0.6rem', padding: '0.15rem 0.3rem',
                      textAlign: 'center', fontWeight: 500,
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                    }}>{img.name}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Map Location Picker */}
          <div className="form-group">
            <label>Location details</label>
            <MapLocationPicker
              value={form.location}
              lat={form.lat}
              lon={form.lon}
              onChange={handleLocationChange}
            />
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
        <div className="form-row">
          <div className="form-group">
            <label>Organization</label>
            <select
              value={form.organizationId}
              onChange={(e) => setForm({ ...form, organizationId: e.target.value })}
              disabled={orgsLoading}
            >
              <option value="">
                {orgsLoading ? 'Loading organizations…' : 'Select an organization'}
              </option>
              {organizations.map((org) => (
                <option key={org.orgId} value={org.orgId}>
                  {org.name}
                </option>
              ))}
            </select>
          </div>

          {/* Category */}
          <div className="form-group">
            <label>Category</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              required
            >
              <option value="plastic">Plastic</option>
              <option value="glass">Glass</option>
              <option value="metal">Metal</option>
              <option value="organic">Organic</option>
              <option value="mixed">Mixed Waste</option>
              <option value="other">Other</option>
            </select>
          </div>
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
              {activityId ? 'Update activity' : 'Submit activity'}
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
