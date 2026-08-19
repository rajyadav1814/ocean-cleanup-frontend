import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { apiGet, apiPatch, apiPost } from '../../../services/api';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import MapLocationPicker from '../../../components/common/MapLocationPicker';
import { invalidateActivities } from '../../../store/activitiesSlice';
import { invalidateDashboard } from '../../../store/dashboardSlice';

const labels = [
  "Site conditions",
  "Debris log",
  "Wildlife and habitat",
  "Hazards and evidence",
  "Verification",
  "Disposal and review"
];

const materials = [
  "Cigarette butts",
  "Food wrappers",
  "Bottle caps",
  "Fishing line and nets",
  "Straws and bags",
  "Bottles and containers"
];

const emptyDebrisLog = () => Object.fromEntries(materials.map((material) => [material, '']));

function asImageUrls(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value !== 'string' || !value) return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [value];
  } catch {
    return [value];
  }
}

function activityDebrisLog(activity) {
  return {
    ...emptyDebrisLog(),
    ...(activity.debrisLog || {}),
    'Cigarette butts': activity.debrisCigaretteButts ?? activity.debrisLog?.['Cigarette butts'] ?? '',
    'Food wrappers': activity.debrisFoodWrappers ?? activity.debrisLog?.['Food wrappers'] ?? '',
    'Bottle caps': activity.debrisBottleCaps ?? activity.debrisLog?.['Bottle caps'] ?? '',
    'Fishing line and nets': activity.debrisFishingLine ?? activity.debrisLog?.['Fishing line and nets'] ?? '',
    'Straws and bags': activity.debrisStraws ?? activity.debrisLog?.['Straws and bags'] ?? '',
    'Bottles and containers': activity.debrisBottles ?? activity.debrisLog?.['Bottles and containers'] ?? ''
  };
}

function positiveNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
}

export default function SubmitActivity() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id: activityId } = useParams();
  const { user } = useAuth();

  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    location: '', lat: null, lon: null,
    shorelineType: 'Sandy beach',
    tideState: 'Low tide',
    cleanedBefore: false,
    debrisLog: emptyDebrisLog(),
    microplastics: 'None observed',
    bulkItems: '',
    speciesSighted: '',
    condition: 'Healthy',
    habitatStress: '',
    hazards: {
      medical: false,
      chemical: false,
      unstable: false
    },
    instrument: 'Field scale',
    teamSize: '',
    timeSpent: '',
    secondVerifier: '',
    quantity: '', // kg
    disposalMethod: 'Recycled',
    followUp: false,
    organizationId: '',
    category: 'plastic',
    evidenceHash: 'mock-hash',
    notes: ''
  });

  const [organizations, setOrganizations] = useState([]);
  const [orgsLoading, setOrgsLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [images, setImages] = useState([]);
  const [existingUrls, setExistingUrls] = useState([]);
  const [loadingActivity, setLoadingActivity] = useState(Boolean(activityId));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activityStatus, setActivityStatus] = useState(null);

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
    return () => { isMounted = false; };
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
        setActivityStatus(data.activity.status || 'pending');
        if (data.activity.status === 'approved') {
          setStatus('Approved activities cannot be edited.');
          return;
        }
        setForm((prev) => ({
          ...prev,
          location: data.activity.location || '',
          lat: data.activity.lat,
          lon: data.activity.lon,
          teamSize: data.activity.volunteers ?? data.activity.teamSize ?? '',
          quantity: data.activity.quantity || '',
          organizationId: data.activity.organizationId || '',
          category: data.activity.category || 'plastic',
          evidenceHash: data.activity.evidenceHash || 'mock-hash',
          notes: data.activity.notes || '',
          shorelineType: data.activity.shorelineType || 'Sandy beach',
          tideState: data.activity.tideState || 'Low tide',
          cleanedBefore: data.activity.cleanedBefore || false,
          debrisLog: activityDebrisLog(data.activity),
          microplastics: data.activity.microplastics || 'None observed',
          bulkItems: data.activity.bulkItems || '',
          speciesSighted: data.activity.speciesSighted || '',
          condition: data.activity.condition || 'Healthy',
          habitatStress: data.activity.habitatStress || '',
          hazards: {
            medical: data.activity.hazards?.medical ?? data.activity.hazardsMedical ?? false,
            chemical: data.activity.hazards?.chemical ?? data.activity.hazardsChemical ?? false,
            unstable: data.activity.hazards?.unstable ?? data.activity.hazardsUnstable ?? false
          },
          instrument: data.activity.instrument || 'Field scale',
          timeSpent: data.activity.timeSpent || '',
          secondVerifier: data.activity.secondVerifier || '',
          disposalMethod: data.activity.disposalMethod || 'Recycled',
          followUp: data.activity.followUp || false
        }));
        const urls = asImageUrls(data.activity.imageGatewayUrl || data.activity.imageUrls);
        setExistingUrls(urls);
      } catch (err) {
        setStatus('Failed to load activity for editing.');
      } finally {
        if (isMounted) setLoadingActivity(false);
      }
    };
    loadActivity();
    return () => { isMounted = false; };
  }, [activityId, user]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (isSubmitting || activityStatus === 'approved') return;

    const volunteers = positiveNumber(form.teamSize);
    if (volunteers === null) {
      setStep(5);
      setStatus('Please provide a team size of at least 1 volunteer.');
      return;
    }

    setIsSubmitting(true);
    setStatus('');
    const payload = {
      organizationId: form.organizationId || null,
      contributorId: user?.id || null,
      category: form.category,
      location: form.location,
      quantity: form.quantity,
      volunteers,
      evidenceHash: form.evidenceHash,
      notes: form.notes,
      lat: form.lat,
      lon: form.lon,
      gps: form.lat !== null && form.lat !== '' && form.lon !== null && form.lon !== '' && Number.isFinite(Number(form.lat)) && Number.isFinite(Number(form.lon)) ? `${form.lat}, ${form.lon}` : null,
      shorelineType: form.shorelineType,
      tideState: form.tideState,
      cleanedBefore: form.cleanedBefore,
      debrisCigaretteButts: form.debrisLog['Cigarette butts'] ? Number(form.debrisLog['Cigarette butts']) : undefined,
      debrisFoodWrappers: form.debrisLog['Food wrappers'] ? Number(form.debrisLog['Food wrappers']) : undefined,
      debrisBottleCaps: form.debrisLog['Bottle caps'] ? Number(form.debrisLog['Bottle caps']) : undefined,
      debrisFishingLine: form.debrisLog['Fishing line and nets'] ? Number(form.debrisLog['Fishing line and nets']) : undefined,
      debrisStraws: form.debrisLog['Straws and bags'] ? Number(form.debrisLog['Straws and bags']) : undefined,
      debrisBottles: form.debrisLog['Bottles and containers'] ? Number(form.debrisLog['Bottles and containers']) : undefined,
      microplastics: form.microplastics,
      bulkItems: form.bulkItems,
      speciesSighted: form.speciesSighted,
      condition: form.condition,
      habitatStress: form.habitatStress,
      hazardsMedical: form.hazards.medical,
      hazardsChemical: form.hazards.chemical,
      hazardsUnstable: form.hazards.unstable,
      instrument: form.instrument,
      timeSpent: form.timeSpent ? Number(form.timeSpent) : undefined,
      secondVerifier: form.secondVerifier,
      disposalMethod: form.disposalMethod,
      followUp: form.followUp
    };

    // Send the complete final image list. This preserves existing evidence, and
    // makes a removed preview a persisted removal rather than a UI-only change.
    if (activityId || images.length > 0) {
      payload.imageUrls = JSON.stringify([
        ...existingUrls,
        ...images.map((img) => img.dataUrl)
      ]);
    }

    try {
      const response = activityId
        ? await apiPatch(`/api/activities/${activityId}`, payload)
        : await apiPost('/api/activities', payload);

      if (!response.ok) {
        setStatus(response.error || response.message || (activityId ? 'Update failed. Please try again.' : 'Submission failed. Please try again.'));
        return;
      }

      dispatch(invalidateActivities());
      dispatch(invalidateDashboard());
      const dest = user?.role === 'citizen' ? '/citizen/overview' : '/contributor/my-activities';
      navigate(dest, {
        replace: true,
        state: { flashMessage: activityId ? 'Cleanup activity updated.' : 'Cleanup activity submitted.' }
      });
    } catch {
      setStatus(activityId ? 'Update failed. Check your connection and try again.' : 'Submission failed. Check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    files.forEach((file) => {
      const objectUrl = URL.createObjectURL(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImages((prev) => [...prev, { objectUrl, dataUrl: reader.result, name: file.name }]);
      };
      reader.readAsDataURL(file);
    });
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

  const handleNext = () => {
    if (step === 1 && !form.location) {
      setStatus("Please provide a location before proceeding.");
      return;
    }
    if (step === 4) {
      const anyHazard = Object.values(form.hazards).some(v => v);
      if (anyHazard && images.length === 0 && existingUrls.length === 0) {
        setStatus("Please attach a hazard photo.");
        return;
      }
    }
    if (step === 5 && positiveNumber(form.teamSize) === null) {
      setStatus('Please provide a team size of at least 1 volunteer.');
      return;
    }
    setStatus("");
    setStep(s => s + 1);
  };

  const totalImageCount = existingUrls.length + images.length;
  let score = 25;
  if (form.location) score += 10;
  if (form.quantity) score += 10;
  score += totalImageCount * 8;
  score = Math.min(100, score);

  if (loadingActivity) {
    return <LoadingSpinner layout="form" />;
  }

  if (activityId && activityStatus === 'approved') {
    return (
      <section className="card" style={{ maxWidth: '640px', margin: '2rem auto', padding: '2rem', textAlign: 'center' }}>
        <h3>Approved cleanup activity</h3>
        <p className="text-muted">Approved activities are locked to preserve their verified record.</p>
        <button type="button" className="secondary" onClick={() => navigate(user?.role === 'citizen' ? '/citizen/my-activities' : '/contributor/my-activities')}>Back to my activities</button>
      </section>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 8rem)' }}>
      <style>{`
        .cleanup-form input[type="checkbox"] {
          width: 1.15rem;
          height: 1.15rem;
          padding: 0;
          margin: 0;
          border-radius: 4px;
          cursor: pointer;
          accent-color: var(--primary);
          appearance: auto;
        }
        .cleanup-form select {
          width: 100%;
          appearance: none;
          background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
          background-repeat: no-repeat;
          background-position: right 1rem center;
          background-size: 1.2em;
          padding-right: 2.5rem;
        }
        .cleanup-form input[type="number"],
        .cleanup-form input[type="text"] {
          width: 100%;
        }
        .cleanup-form .debris-row input[type="number"] {
          width: 80px;
        }
      `}</style>
      <section className="card cleanup-form" style={{ maxWidth: '640px', width: '100%', margin: '0 auto', padding: '2rem' }}>
        {/* Stepper Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontWeight: 600, fontSize: '18px' }}>{activityId ? 'Edit cleanup activity' : 'Log a cleanup'}</span>
        </div>
        <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
          Step {step} of 6 - {labels[step - 1]}
        </div>
        <div style={{ display: 'flex', gap: '6px', marginBottom: '1.5rem' }}>
          {labels.map((_, i) => (
            <div key={i} style={{ flex: 1, height: '4px', borderRadius: '2px', background: i + 1 <= step ? 'var(--primary)' : 'var(--border-light)', transition: 'background 0.3s' }}></div>
          ))}
        </div>

        {status && (
          <div className={`mb-4 p-4 rounded badge ${status.includes('failed') || status.includes('Please') ? 'rejected' : 'approved'}`} style={{ display: 'block', padding: '0.75rem', textAlign: 'center', marginBottom: '1rem' }}>
            {status}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="form-group">
                <label>Location details</label>
                <MapLocationPicker value={form.location} lat={form.lat} lon={form.lon} onChange={handleLocationChange} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Shoreline type</label>
                  <select value={form.shorelineType} onChange={e => setForm({...form, shorelineType: e.target.value})}>
                    <option>Sandy beach</option><option>Rocky shore</option><option>Mangrove</option>
                    <option>Urban outfall</option><option>Riverbank</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Tide state</label>
                  <select value={form.tideState} onChange={e => setForm({...form, tideState: e.target.value})}>
                    <option>Low tide</option><option>Mid tide</option><option>High tide</option>
                  </select>
                </div>
              </div>
              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input type="checkbox" id="cleanedBefore" checked={form.cleanedBefore} onChange={e => setForm({...form, cleanedBefore: e.target.checked})} style={{ margin: 0 }} />
                <label htmlFor="cleanedBefore" style={{ marginBottom: 0, fontWeight: 400 }}>This site has been cleaned before</label>
              </div>
            </div>
          )}

          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="form-group">
                <label>Primary Waste Category</label>
                <select value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                  <option value="plastic">Plastic</option>
                  <option value="glass">Glass</option>
                  <option value="metal">Metal</option>
                  <option value="organic">Organic</option>
                  <option value="mixed">Mixed Waste</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label style={{ marginBottom: '12px', display: 'block' }}>Debris log, by item count</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {materials.map(m => (
                    <div key={m} className="debris-row" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <span style={{ flex: 1, fontSize: '14px', color: 'var(--text-main)' }}>{m}</span>
                      <input type="number" placeholder="0" style={{ width: '80px', padding: '6px 10px', minHeight: '36px' }} 
                        value={form.debrisLog[m]} onChange={e => setForm({...form, debrisLog: {...form.debrisLog, [m]: e.target.value}})} />
                    </div>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label>Microplastics present</label>
                <select value={form.microplastics} onChange={e => setForm({...form, microplastics: e.target.value})}>
                  <option>None observed</option><option>Some</option><option>Significant amount</option>
                </select>
              </div>
            </div>
          )}

          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="form-group">
                <label>Notable or bulk items</label>
                <input type="text" placeholder="Fridge, tires, drums, illegal dumping" value={form.bulkItems} onChange={e => setForm({...form, bulkItems: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Species sighted</label>
                <input type="text" placeholder="Green sea turtle, count 2" value={form.speciesSighted} onChange={e => setForm({...form, speciesSighted: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Condition</label>
                <select value={form.condition} onChange={e => setForm({...form, condition: e.target.value})}>
                  <option>Healthy</option><option>Injured</option><option>Entangled</option><option>Deceased</option><option value="Not applicable">Not applicable</option>
                </select>
              </div>
              <div className="form-group">
                <label>Habitat stress signs</label>
                <input type="text" placeholder="Bleached coral, trampled dune vegetation" value={form.habitatStress} onChange={e => setForm({...form, habitatStress: e.target.value})} />
              </div>
            </div>
          )}

          {step === 4 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="form-group">
                <label style={{ marginBottom: '10px', display: 'block' }}>Hazards observed</label>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                  <label style={{ fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 400 }}>
                    <input type="checkbox" checked={form.hazards.medical} onChange={e => setForm({...form, hazards: {...form.hazards, medical: e.target.checked}})} style={{ margin: 0 }} /> Medical or sharps waste
                  </label>
                  <label style={{ fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 400 }}>
                    <input type="checkbox" checked={form.hazards.chemical} onChange={e => setForm({...form, hazards: {...form.hazards, chemical: e.target.checked}})} style={{ margin: 0 }} /> Chemical container
                  </label>
                  <label style={{ fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 400 }}>
                    <input type="checkbox" checked={form.hazards.unstable} onChange={e => setForm({...form, hazards: {...form.hazards, unstable: e.target.checked}})} style={{ margin: 0 }} /> Unstable structure
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label>Photos (Wide site, Hazards, Before & After)</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.5rem' }}>
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

                {totalImageCount > 0 && (
                  <div style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600, textAlign: 'center' }}>
                    {totalImageCount} photo{totalImageCount !== 1 ? 's' : ''} added
                  </div>
                )}

                {totalImageCount > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '0.6rem', marginTop: '0.75rem' }}>
                    {existingUrls.map((url, idx) => (
                      <div key={`existing-${idx}`} style={{ position: 'relative', borderRadius: 'var(--radius-sm)', overflow: 'hidden', aspectRatio: '1', background: 'var(--surface-hover)' }}>
                        <img src={url} alt={`Existing image ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                        <button type="button" onClick={() => removeExistingImage(idx)} style={{ position: 'absolute', top: '0.25rem', right: '0.25rem', width: '1.5rem', height: '1.5rem', borderRadius: '999px', background: 'rgba(15,23,42,0.82)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', display: 'grid', placeItems: 'center', padding: 0, cursor: 'pointer', lineHeight: 1 }}>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                        </button>
                      </div>
                    ))}
                    {images.map((img, idx) => (
                      <div key={`new-${idx}`} style={{ position: 'relative', borderRadius: 'var(--radius-sm)', overflow: 'hidden', aspectRatio: '1', background: 'var(--surface-hover)' }}>
                        <img src={img.objectUrl} alt={img.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                        <button type="button" onClick={() => removeNewImage(idx)} style={{ position: 'absolute', top: '0.25rem', right: '0.25rem', width: '1.5rem', height: '1.5rem', borderRadius: '999px', background: 'rgba(15,23,42,0.82)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', display: 'grid', placeItems: 'center', padding: 0, cursor: 'pointer', lineHeight: 1 }}>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 5 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="form-row">
                <div className="form-group">
                  <label>Organization</label>
                  <select value={form.organizationId} onChange={(e) => setForm({ ...form, organizationId: e.target.value })} disabled={orgsLoading}>
                    <option value="">{orgsLoading ? 'Loading organizations…' : 'Select an organization'}</option>
                    {organizations.map((org) => <option key={org.orgId} value={org.orgId}>{org.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Measurement instrument</label>
                  <select value={form.instrument} onChange={e => setForm({...form, instrument: e.target.value})}>
                    <option>Field scale</option><option>Estimated by volume</option><option>Lab-calibrated scale</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Team size (Volunteers)</label>
                  <input type="number" min="1" step="1" placeholder="6" value={form.teamSize} onChange={e => setForm({...form, teamSize: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>Time spent (min)</label>
                  <input type="number" placeholder="90" value={form.timeSpent} onChange={e => setForm({...form, timeSpent: e.target.value})} />
                </div>
              </div>
              <div className="form-group">
                <label>Second verifier (optional)</label>
                <input type="text" placeholder="Name or email of co-signer" value={form.secondVerifier} onChange={e => setForm({...form, secondVerifier: e.target.value})} />
              </div>
            </div>
          )}

          {step === 6 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="form-group">
                <label>Total weight collected (kg)</label>
                <input type="number" placeholder="18" value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Disposal method</label>
                <select value={form.disposalMethod} onChange={e => setForm({...form, disposalMethod: e.target.value})}>
                  <option>Recycled</option><option>Landfill</option><option>Hazardous waste service</option>
                </select>
              </div>
              <div className="form-group">
                <label>Notes <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span></label>
                <textarea rows={2} placeholder="Any extra details about this cleanup…" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} style={{ resize: 'vertical' }} />
              </div>
              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input type="checkbox" id="followUp" checked={form.followUp} onChange={e => setForm({...form, followUp: e.target.checked})} style={{ margin: 0 }} />
                <label htmlFor="followUp" style={{ marginBottom: 0, fontWeight: 400 }}>This site needs follow-up</label>
              </div>
              
              <div style={{ background: 'var(--surface-hover)', borderRadius: 'var(--radius-md)', padding: '16px', border: '1px solid var(--border-light)' }}>
                <table style={{ width: '100%', fontSize: '14px' }}>
                  <tbody>
                    <tr><td style={{ color: 'var(--text-secondary)', padding: '6px 0' }}>Location</td><td style={{ textAlign: 'right', fontWeight: 500 }}>{form.location || 'Not set'}</td></tr>
                    <tr><td style={{ color: 'var(--text-secondary)', padding: '6px 0' }}>Weight</td><td style={{ textAlign: 'right', fontWeight: 500 }}>{form.quantity ? `${form.quantity} kg` : '0 kg'}</td></tr>
                    <tr><td style={{ color: 'var(--text-secondary)', padding: '6px 0' }}>Photos attached</td><td style={{ textAlign: 'right', fontWeight: 500 }}>{totalImageCount}</td></tr>
                  </tbody>
                </table>
              </div>

              <div className="form-group">
                <label style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px', display: 'block' }}>Data completeness</label>
                <div style={{ height: '6px', background: 'var(--surface-hover)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: 'var(--success)', width: `${score}%`, transition: 'width 0.3s ease' }}></div>
                </div>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', marginTop: '1rem' }}>
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: '1px solid var(--border-light)',
                  color: 'var(--text-main)',
                  padding: '0.85rem',
                  borderRadius: 'var(--radius-md)'
                }}
              >
                Back
              </button>
            ) : <div style={{ flex: 1 }}></div>}
            
            {step < 6 ? (
              <button
                type="button"
                onClick={handleNext}
                style={{
                  flex: 1,
                  background: 'var(--primary)',
                  color: 'white',
                  padding: '0.85rem',
                  borderRadius: 'var(--radius-md)',
                  border: 'none'
                }}
              >
                Next
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  flex: 1,
                  background: 'var(--primary)',
                  color: 'white',
                  padding: '0.85rem',
                  borderRadius: 'var(--radius-md)',
                  border: 'none'
                }}
              >
                {isSubmitting ? 'Saving…' : activityId ? 'Update activity' : 'Submit activity'}
              </button>
            )}
          </div>
        </form>
      </section>
    </div>
  );
}
