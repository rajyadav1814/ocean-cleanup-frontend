import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { apiGet, apiPatch, apiPost } from '../../../services/api';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import MapLocationPicker from '../../../components/common/MapLocationPicker';
import OceanWaveStrip from '../../../components/common/OceanWaveStrip';
import OrganizationSelect from '../../../components/common/OrganizationSelect';
import Select from '../../../components/common/Select';
import useOrganizations from '../../../hooks/useOrganizations';
import { invalidateActivities } from '../../../store/activitiesSlice';
import { invalidateDashboard } from '../../../store/dashboardSlice';
import { invalidateContributorStats } from '../../../store/contributorSlice';
import { invalidateCitizenStats } from '../../../store/citizenSlice';

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

const BRAND_PLACEHOLDERS = {
  "Cigarette butts": "e.g. Gold Flake",
  "Food wrappers": "e.g. Lay's",
  "Bottle caps": "e.g. Coca-Cola",
  "Fishing line and nets": "e.g. Rapala",
  "Straws and bags": "e.g. Ziploc",
  "Bottles and containers": "e.g. Bisleri"
};

// Per-step accent color + icon + one-line subtitle, matching the visual
// language of the QuickReport flow (colored tab, icon-in-circle card head,
// pill buttons) — kept separate from `labels` since that array is also
// used for the plain "Step N of M" text above the tabs.
const STEP_META = {
  1: {
    accent: 'var(--secondary)', sub: 'Where and what the shoreline looked like.',
    icon: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></svg>)
  },
  2: {
    accent: 'var(--warning)', sub: 'What you found, tallied by item.',
    icon: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="21" x2="4" y2="13" /><line x1="10" y1="21" x2="10" y2="7" /><line x1="16" y1="21" x2="16" y2="11" /><line x1="22" y1="21" x2="22" y2="3" /></svg>)
  },
  3: {
    accent: '#65a30d', sub: "Anything living, and how it's doing.",
    icon: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 20c8-1 14-7 15-15-8 1-14 7-15 15z" /><path d="M6.5 17.5C10 14 12.5 11 15 8" /></svg>)
  },
  4: {
    accent: '#ef4444', sub: 'Safety notes, plus your photos.',
    icon: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>)
  },
  5: {
    accent: 'var(--primary)', sub: 'Who was there, and for how long.',
    icon: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>)
  },
  6: {
    accent: 'var(--success)', sub: 'Where it went, and a last check before sending.',
    icon: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>)
  },
};

const emptyDebrisLog = () => Object.fromEntries(materials.map((material) => [material, '']));
const emptyBrandLog = () => Object.fromEntries(materials.map((material) => [material, []]));

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

function activityBrandLog(activity) {
  return {
    ...emptyBrandLog(),
    ...(activity.brandsIdentified || {})
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
  const isCitizen = user?.role === 'citizen';
  // Citizens report casual sightings, not full cleanup drives — only collect
  // site conditions, hazards/evidence, and the disposal/review summary.
  const visibleSteps = isCitizen ? [1, 4, 6] : [1, 2, 3, 4, 5, 6];

  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    location: '', lat: null, lon: null,
    shorelineType: 'Sandy beach',
    tideState: 'Low tide',
    cleanedBefore: false,
    surveyLengthM: '',
    surveyAreaSqm: '',
    surveyMethod: 'Not measured',
    debrisSource: 'Unknown',
    debrisLog: emptyDebrisLog(),
    brandLog: emptyBrandLog(),
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

  const { organizations, orgsLoading, addOrganization } = useOrganizations();
  const [status, setStatus] = useState('');
  const [images, setImages] = useState([]);
  const [existingUrls, setExistingUrls] = useState([]);
  const [loadingActivity, setLoadingActivity] = useState(Boolean(activityId));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activityStatus, setActivityStatus] = useState(null);

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
          surveyLengthM: data.activity.surveyLengthM ?? '',
          surveyAreaSqm: data.activity.surveyAreaSqm ?? '',
          surveyMethod: data.activity.surveyMethod || 'Not measured',
          debrisSource: data.activity.debrisSource || 'Unknown',
          debrisLog: activityDebrisLog(data.activity),
          brandLog: activityBrandLog(data.activity),
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

    // Citizens never see the Verification step (team size), so a lone
    // reporter counts as a team of one.
    const volunteers = positiveNumber(form.teamSize) ?? (isCitizen ? 1 : null);
    if (volunteers === null) {
      setStep(5);
      setStatus('Please provide a team size of at least 1 volunteer.');
      return;
    }

    // Drop rows with a blank brand name (e.g. an auto-added row nobody filled
    // in), then drop materials left with no brands — so a debris count with
    // no brands logged sends no brand data at all.
    const brandsIdentified = {};
    Object.entries(form.brandLog).forEach(([material, brands]) => {
      const cleaned = brands
        .filter((b) => b.name && b.name.trim())
        .map((b) => ({ name: b.name.trim(), count: b.count ? Number(b.count) : 0 }));
      if (cleaned.length > 0) brandsIdentified[material] = cleaned;
    });

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
      // spec §18 — only present when MapLocationPicker actually reported
      // them (a device GPS fix), so undefined here just means "not
      // captured", the same as any other optional field.
      locationAccuracy: form.locationAccuracy ?? undefined,
      locationCaptureMethod: form.locationCaptureMethod ?? undefined,
      shorelineType: form.shorelineType,
      tideState: form.tideState,
      cleanedBefore: form.cleanedBefore,
      surveyLengthM: form.surveyLengthM ? Number(form.surveyLengthM) : undefined,
      surveyAreaSqm: form.surveyAreaSqm ? Number(form.surveyAreaSqm) : undefined,
      surveyMethod: form.surveyMethod,
      debrisSource: form.debrisSource,
      debrisCigaretteButts: form.debrisLog['Cigarette butts'] ? Number(form.debrisLog['Cigarette butts']) : undefined,
      debrisFoodWrappers: form.debrisLog['Food wrappers'] ? Number(form.debrisLog['Food wrappers']) : undefined,
      debrisBottleCaps: form.debrisLog['Bottle caps'] ? Number(form.debrisLog['Bottle caps']) : undefined,
      debrisFishingLine: form.debrisLog['Fishing line and nets'] ? Number(form.debrisLog['Fishing line and nets']) : undefined,
      debrisStraws: form.debrisLog['Straws and bags'] ? Number(form.debrisLog['Straws and bags']) : undefined,
      debrisBottles: form.debrisLog['Bottles and containers'] ? Number(form.debrisLog['Bottles and containers']) : undefined,
      brands_identified: brandsIdentified,
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
      dispatch(isCitizen ? invalidateCitizenStats() : invalidateContributorStats());
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

  function handleLocationChange({ displayName, lat, lon, accuracy, captureMethod }) {
    setForm(prev => ({ ...prev, location: displayName, lat, lon, locationAccuracy: accuracy, locationCaptureMethod: captureMethod }));
  }

  function handleDebrisCountChange(material, value) {
    setForm(prev => {
      const countIsPositive = Number(value) > 0;
      const shouldSeedBrandRow = countIsPositive && (prev.brandLog[material]?.length ?? 0) === 0;
      return {
        ...prev,
        debrisLog: { ...prev.debrisLog, [material]: value },
        brandLog: shouldSeedBrandRow
          ? { ...prev.brandLog, [material]: [{ name: '', count: '' }] }
          : prev.brandLog
      };
    });
  }

  function addBrandRow(material) {
    setForm(prev => ({
      ...prev,
      brandLog: { ...prev.brandLog, [material]: [...prev.brandLog[material], { name: '', count: '' }] }
    }));
  }

  function removeBrandRow(material, index) {
    setForm(prev => ({
      ...prev,
      brandLog: { ...prev.brandLog, [material]: prev.brandLog[material].filter((_, i) => i !== index) }
    }));
  }

  function updateBrandRow(material, index, field, value) {
    setForm(prev => ({
      ...prev,
      brandLog: {
        ...prev.brandLog,
        [material]: prev.brandLog[material].map((row, i) => i === index ? { ...row, [field]: value } : row)
      }
    }));
  }

  const handleNext = () => {
    if (step === 1 && !form.location) {
      setStatus("Please provide a location before proceeding.");
      return;
    }
    if (step === 4 && images.length === 0 && existingUrls.length === 0) {
      setStatus("Please attach at least one photo before proceeding.");
      return;
    }
    if (step === 5 && positiveNumber(form.teamSize) === null) {
      setStatus('Please provide a team size of at least 1 volunteer.');
      return;
    }
    setStatus("");
    const idx = visibleSteps.indexOf(step);
    setStep(visibleSteps[idx + 1]);
  };

  const totalImageCount = existingUrls.length + images.length;

  // Data confidence reflects what's actually been filled in on the steps
  // this role sees — required fields (location, weight) plus every optional
  // field that adds real detail to the report. Fields from steps a citizen
  // never sees (debris log, wildlife, verification) aren't counted against
  // them. Brand attribution is carved out as a fixed 20-point slice of the
  // score (contributors only), so logging brands has a guaranteed, visible
  // effect instead of being diluted among the other checks.
  const completenessChecks = [
    Boolean(form.location),
    Boolean(form.quantity),
    totalImageCount > 0,
    Boolean(form.notes),
    ...(isCitizen ? [] : [
      Object.values(form.debrisLog).some((v) => Number(v) > 0),
      Boolean(form.speciesSighted),
      Boolean(form.bulkItems),
      Boolean(form.habitatStress),
      Boolean(form.organizationId),
      Boolean(form.secondVerifier),
      Boolean(form.timeSpent),
    ]),
  ];
  const baseScore = (completenessChecks.filter(Boolean).length / completenessChecks.length) * 100;

  const materialsWithCount = materials.filter((m) => Number(form.debrisLog[m]) > 0);
  const materialsWithBrands = materialsWithCount.filter((m) => (form.brandLog[m] || []).some((b) => b.name && b.name.trim()));
  const brandCompletionRatio = materialsWithCount.length > 0 ? materialsWithBrands.length / materialsWithCount.length : 0;

  const score = isCitizen
    ? Math.round(baseScore)
    : Math.round(baseScore * 0.8 + brandCompletionRatio * 20);

  // Loose calibration guides for the survey inputs, derived from team size
  // where known — never written to form state, just contextual copy.
  const surveyVolunteers = Number(form.teamSize) || 0;
  const surveyLengthHint = surveyVolunteers > 0
    ? `Rough guide: with ${surveyVolunteers} volunteer${surveyVolunteers !== 1 ? 's' : ''}, a typical cleanup covers around ${surveyVolunteers * 15}m of shoreline. Enter your own estimate above.`
    : 'Estimate the length of shoreline you covered — a solo cleanup typically covers 30–50m, a group of 5–10 covers 100–150m.';
  const surveyAreaHint = surveyVolunteers > 0
    ? `Rough guide: with ${surveyVolunteers} volunteer${surveyVolunteers !== 1 ? 's' : ''}, a typical cleanup covers around ${surveyVolunteers * 40}m² of area. Enter your own estimate above.`
    : 'Estimate the area you covered — a solo cleanup typically covers 150–250m², a group of 5–10 covers 600–900m².';

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

  const activeMeta = STEP_META[step];

  return (
    <div style={{ display: 'flex', justifyContent: 'center', minHeight: 'calc(100vh - 8rem)', padding: '1.5rem 0' }}>
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

        /* ── Step tabs (mirrors QuickReport's mode-switcher tiles) ── */
        .sa-tabs { display: grid; grid-template-columns: repeat(${visibleSteps.length}, 1fr); gap: 0.6rem; margin-bottom: 1.25rem; }
        .sa-tab {
          position: relative; display: flex; flex-direction: column; align-items: flex-start; gap: 0.3rem;
          padding: 0.7rem 0.85rem; border-radius: var(--radius-md); text-align: left; font-family: inherit;
          background: color-mix(in srgb, var(--tab-accent) 6%, var(--surface));
          border: 1px solid color-mix(in srgb, var(--tab-accent) 18%, var(--border-light));
          transition: border-color .2s, transform .2s;
        }
        .sa-tab:not(:disabled):hover { transform: translateY(-1px); border-color: color-mix(in srgb, var(--tab-accent) 45%, var(--border-light)); }
        .sa-tab:disabled { cursor: default; }
        .sa-tab--active {
          border-color: color-mix(in srgb, var(--tab-accent) 65%, var(--border-light));
          background: color-mix(in srgb, var(--tab-accent) 12%, var(--surface));
        }
        .sa-tab--active::after {
          content: ''; position: absolute; bottom: -7px; left: 50%; transform: translateX(-50%) rotate(45deg);
          width: 10px; height: 10px; background: color-mix(in srgb, var(--tab-accent) 12%, var(--surface));
          border-right: 1px solid color-mix(in srgb, var(--tab-accent) 65%, var(--border-light));
          border-bottom: 1px solid color-mix(in srgb, var(--tab-accent) 65%, var(--border-light));
        }
        .sa-tab-icon {
          width: 30px; height: 30px; border-radius: 999px; display: flex; align-items: center; justify-content: center;
          background: color-mix(in srgb, var(--tab-accent) 18%, var(--surface)); color: var(--tab-accent);
        }
        .sa-tab-label { font-size: 0.82rem; font-weight: 700; color: var(--text-main); }
        @media (max-width: 720px) {
          .sa-tabs { grid-template-columns: repeat(3, 1fr); }
          .sa-tab-label { font-size: 0.72rem; }
        }

        /* ── Step card frame ── */
        .sa-card {
          background: color-mix(in srgb, var(--tile-accent) 5%, var(--surface));
          border: 1px solid color-mix(in srgb, var(--tile-accent) 22%, var(--border-light));
          border-radius: var(--radius-lg); padding: 1.5rem 1.6rem;
        }
        .sa-card-head { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem; }
        .sa-card-icon {
          width: 38px; height: 38px; border-radius: 999px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          background: color-mix(in srgb, var(--tile-accent) 18%, transparent); color: var(--tile-accent);
        }
        .sa-card-title { margin: 0; font-size: 1.02rem; font-weight: 700; color: var(--text-main); }
        .sa-card-sub { margin: 0.15rem 0 0; font-size: 0.8rem; color: var(--text-muted); }

        /* ── Pill buttons ── */
        .sa-btn-primary {
          background: var(--tile-accent); border: none; border-radius: 999px; color: #fff; font-weight: 700;
          padding: 0.7rem 1.5rem; cursor: pointer; font-family: inherit; font-size: 0.85rem; transition: transform .15s, opacity .15s;
        }
        .sa-btn-primary:disabled { opacity: 0.55; cursor: default; }
        .sa-btn-primary:not(:disabled):hover { transform: translateY(-1px); }
        .sa-btn-secondary {
          background: transparent; border: 1px solid var(--border-light); border-radius: 999px; color: var(--text-muted);
          font-weight: 700; padding: 0.7rem 1.5rem; cursor: pointer; font-family: inherit; font-size: 0.85rem; transition: border-color .2s, color .2s;
        }
        .sa-btn-secondary:hover { border-color: var(--border-glow); color: var(--text-main); }

        /* ── Bottom flow footer (mirrors QuickReport's step-flow banner) ── */
        .sa-flow {
          display: flex; align-items: center; justify-content: center; flex-wrap: wrap; gap: 0.4rem 0.6rem;
          margin-top: 1.25rem; padding: 0.9rem 1.25rem; border-radius: var(--radius-lg);
          background: var(--surface); border: 1px solid var(--border-light);
          font-size: 0.78rem; color: var(--text-muted); text-align: center;
        }
        .sa-flow strong { color: var(--text-main); font-weight: 700; }
      `}</style>
      <div style={{ maxWidth: '880px', width: '100%', margin: '0 auto', padding: '0 1rem' }}>
      <section className="card cleanup-form contributor-form-panel" style={{ width: '100%', padding: '2rem', position: 'relative', overflow: 'hidden' }}>
        <OceanWaveStrip />
        {/* Stepper Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontWeight: 600, fontSize: '18px' }}>{activityId ? 'Edit cleanup activity' : 'Log a cleanup'}</span>
        </div>
        <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
          Step {visibleSteps.indexOf(step) + 1} of {visibleSteps.length} - {labels[step - 1]}
        </div>

        <div className="sa-tabs">
          {visibleSteps.map((s) => {
            const meta = STEP_META[s];
            const isActive = s === step;
            const isPast = visibleSteps.indexOf(s) < visibleSteps.indexOf(step);
            return (
              <button
                key={s}
                type="button"
                className={`sa-tab${isActive ? ' sa-tab--active' : ''}`}
                style={{ '--tab-accent': meta.accent }}
                disabled={!isPast}
                onClick={() => isPast && setStep(s)}
              >
                <span className="sa-tab-icon">{meta.icon}</span>
                <span className="sa-tab-label">{labels[s - 1]}</span>
              </button>
            );
          })}
        </div>

        <div style={{ display: 'flex', gap: '6px', marginBottom: '1.5rem' }}>
          {visibleSteps.map((s, i) => (
            <div key={s} style={{ flex: 1, height: '4px', borderRadius: '2px', background: i <= visibleSteps.indexOf(step) ? 'var(--primary)' : 'var(--border-light)', transition: 'background 0.3s' }}></div>
          ))}
        </div>

        {/* Runs across every step since it reflects fields from the whole form, not just the current screen. */}
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Data confidence</span>
            <span style={{ fontSize: '12px', fontWeight: 700, color: score >= 80 ? 'var(--success)' : 'var(--primary)' }}>{score}%</span>
          </div>
          <div style={{ height: '6px', background: 'var(--surface-hover)', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ height: '100%', background: 'var(--success)', width: `${score}%`, transition: 'width 0.3s ease' }}></div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '6px' }}>
            <span style={{ fontSize: '11px', lineHeight: 1 }}>{score >= 80 ? '✓' : 'ℹ️'}</span>
            <span style={{ fontSize: '11px', color: score >= 80 ? 'var(--success)' : 'var(--text-muted)' }}>
              {score >= 80
                ? 'High confidence — reports like this tend to get approved faster.'
                : 'Reports with 80%+ data confidence tend to get approved faster.'}
            </span>
          </div>
        </div>

        {status && (
          <div className={`mb-4 p-4 rounded badge ${status.includes('failed') || status.includes('Please') ? 'rejected' : 'approved'}`} style={{ display: 'block', padding: '0.75rem', textAlign: 'center', marginBottom: '1rem' }}>
            {status}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

        <div className="sa-card" style={{ '--tile-accent': activeMeta.accent }}>
          <div className="sa-card-head">
            <span className="sa-card-icon">{activeMeta.icon}</span>
            <div>
              <h2 className="sa-card-title">{labels[step - 1]}</h2>
              <p className="sa-card-sub">{activeMeta.sub}</p>
            </div>
          </div>

          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="form-group">
                <label>Location details</label>
                <MapLocationPicker value={form.location} lat={form.lat} lon={form.lon} onChange={handleLocationChange} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Shoreline type</label>
                  <Select
                    value={form.shorelineType}
                    onChange={(v) => setForm({...form, shorelineType: v})}
                    options={['Sandy beach', 'Rocky shore', 'Mangrove', 'Urban outfall', 'Riverbank']}
                  />
                </div>
                <div className="form-group">
                  <label>Tide state</label>
                  <Select
                    value={form.tideState}
                    onChange={(v) => setForm({...form, tideState: v})}
                    options={['Low tide', 'Mid tide', 'High tide']}
                  />
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
              <div className="form-row">
                <div className="form-group">
                  <label>Primary Waste Category</label>
                  <Select
                    value={form.category}
                    onChange={(v) => setForm({...form, category: v})}
                    options={[
                      { value: 'plastic', label: 'Plastic' },
                      { value: 'glass', label: 'Glass' },
                      { value: 'metal', label: 'Metal' },
                      { value: 'organic', label: 'Organic' },
                      { value: 'mixed', label: 'Mixed Waste' },
                      { value: 'other', label: 'Other' },
                    ]}
                  />
                </div>
                <div className="form-group">
                  <label>Microplastics present</label>
                  <Select
                    value={form.microplastics}
                    onChange={(v) => setForm({...form, microplastics: v})}
                    options={['None observed', 'Some', 'Significant amount']}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Debris source</label>
                <Select
                  value={form.debrisSource}
                  onChange={(v) => setForm({...form, debrisSource: v})}
                  options={['Land-based litter', 'Ocean-based (washed up)', 'Fishing-related', 'Unknown']}
                />
              </div>
              <div className="form-group">
                <label style={{ marginBottom: '12px', display: 'block' }}>Debris log, by item count</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {materials.map(m => {
                    const hasCount = Number(form.debrisLog[m]) > 0;
                    const brands = form.brandLog[m] || [];
                    return (
                      <div key={m}>
                        <div className="debris-row" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                          <span style={{ flex: 1, fontSize: '14px', color: 'var(--text-main)' }}>{m}</span>
                          <input type="number" placeholder="0" style={{ width: '80px', padding: '6px 10px', minHeight: '36px' }}
                            value={form.debrisLog[m]} onChange={e => handleDebrisCountChange(m, e.target.value)} />
                        </div>
                        {hasCount && (
                          <div style={{
                            marginTop: '8px', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)',
                            padding: '10px 12px', background: 'var(--surface-hover)'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>Brands identified</span>
                              <span style={{
                                fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em',
                                color: 'var(--text-muted)', background: 'var(--surface)', border: '1px solid var(--border-light)',
                                borderRadius: '999px', padding: '2px 8px'
                              }}>optional</span>
                              <span style={{
                                fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em',
                                color: 'var(--primary)', background: 'rgba(14,165,233,.1)', border: '1px solid rgba(14,165,233,.25)',
                                borderRadius: '999px', padding: '2px 8px'
                              }}>+20% confidence</span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              {brands.map((b, i) => (
                                <div key={i} className="debris-row" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                  <input type="text" placeholder={BRAND_PLACEHOLDERS[m] || 'Brand name'} style={{ flex: 1, padding: '6px 10px', minHeight: '36px' }}
                                    value={b.name} onChange={e => updateBrandRow(m, i, 'name', e.target.value)} />
                                  <input type="number" placeholder="0" style={{ width: '80px', padding: '6px 10px', minHeight: '36px' }}
                                    value={b.count} onChange={e => updateBrandRow(m, i, 'count', e.target.value)} />
                                  <button type="button" onClick={() => removeBrandRow(m, i)} aria-label={`Remove brand row ${i + 1}`}
                                    style={{
                                      background: 'transparent', border: 'none', color: 'var(--text-muted)',
                                      cursor: 'pointer', padding: '4px', boxShadow: 'none', lineHeight: 1
                                    }}>✕</button>
                                </div>
                              ))}
                            </div>
                            <button type="button" onClick={() => addBrandRow(m)} style={{
                              marginTop: '8px', background: 'transparent', border: '1px dashed var(--border-light)',
                              borderRadius: 'var(--radius-md)', color: 'var(--primary)', fontSize: '12px', fontWeight: 600,
                              padding: '6px 10px', cursor: 'pointer', boxShadow: 'none'
                            }}>
                              + Add brand
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
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
                <Select
                  value={form.condition}
                  onChange={(v) => setForm({...form, condition: v})}
                  options={['Healthy', 'Injured', 'Entangled', 'Deceased', 'Not applicable']}
                />
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
                  <OrganizationSelect
                    value={form.organizationId}
                    onChange={(orgId) => setForm({ ...form, organizationId: orgId })}
                    organizations={organizations}
                    loading={orgsLoading}
                    onAddOrganization={addOrganization}
                    placeholder="Select an organization"
                  />
                </div>
                <div className="form-group">
                  <label>Measurement instrument</label>
                  <Select
                    value={form.instrument}
                    onChange={(v) => setForm({...form, instrument: v})}
                    options={['Field scale', 'Estimated by volume', 'Lab-calibrated scale']}
                  />
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
              <div className="form-group" style={{ marginBottom: 0 }}>
                <div className="form-row">
                  <div className="form-group">
                    <label>Survey length (m)</label>
                    <input type="number" placeholder="e.g. 100" value={form.surveyLengthM} onChange={e => setForm({...form, surveyLengthM: e.target.value})} />
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                      {surveyLengthHint}
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Survey area (m²)</label>
                    <input type="number" placeholder="e.g. 500" value={form.surveyAreaSqm} onChange={e => setForm({...form, surveyAreaSqm: e.target.value})} />
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                      {surveyAreaHint}
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.75rem' }}>
                  Fill whichever matches how you measured your survey area.
                </div>
              </div>
              <div className="form-group">
                <label>Survey method</label>
                <Select
                  value={form.surveyMethod}
                  onChange={(v) => setForm({...form, surveyMethod: v})}
                  options={['Linear transect', 'Grid area', 'Full site cleanup', 'Not measured']}
                />
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
                <input type="number" placeholder="e.g., 18" value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Disposal method</label>
                <Select
                  value={form.disposalMethod}
                  onChange={(v) => setForm({...form, disposalMethod: v})}
                  options={['Recycled', 'Landfill', 'Hazardous waste service']}
                />
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
            </div>
          )}

        </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', marginTop: '1rem' }}>
            {visibleSteps.indexOf(step) > 0 ? (
              <button
                type="button"
                className="sa-btn-secondary"
                onClick={() => setStep(visibleSteps[visibleSteps.indexOf(step) - 1])}
                style={{ flex: 1 }}
              >
                Back
              </button>
            ) : <div style={{ flex: 1 }}></div>}

            {visibleSteps.indexOf(step) < visibleSteps.length - 1 ? (
              <button
                type="button"
                className="sa-btn-primary"
                onClick={handleNext}
                disabled={step === 4 && totalImageCount === 0}
                style={{ flex: 1, '--tile-accent': activeMeta.accent }}
              >
                Next
              </button>
            ) : (
              <button
                type="submit"
                className="sa-btn-primary"
                disabled={isSubmitting}
                style={{ flex: 1, '--tile-accent': activeMeta.accent
                }}
              >
                {isSubmitting ? 'Saving…' : activityId ? 'Update activity' : 'Submit activity'}
              </button>
            )}
          </div>
        </form>
      </section>

      <div className="sa-flow">
        <span>Fill it in</span>
        <span aria-hidden="true">→</span>
        <span><strong>Data confidence</strong> tracks live</span>
        <span aria-hidden="true">→</span>
        <span>Submit</span>
        <span aria-hidden="true">→</span>
        <span>A verifier reviews it</span>
        <span aria-hidden="true">→</span>
        <span><strong>Approved</strong></span>
      </div>
      </div>
    </div>
  );
}
