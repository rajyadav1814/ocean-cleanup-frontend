import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useAuth } from '../../../context/AuthContext';
import { apiPost, apiPostForm, aiApi, eventApi } from '../../../services/api';
import MapLocationPicker from '../../../components/common/MapLocationPicker';
import OrganizationSelect from '../../../components/common/OrganizationSelect';
import useOrganizations from '../../../hooks/useOrganizations';
import { invalidateActivities } from '../../../store/activitiesSlice';
import { invalidateDashboard } from '../../../store/dashboardSlice';
import { invalidateContributorStats } from '../../../store/contributorSlice';
import { invalidateCitizenStats } from '../../../store/citizenSlice';
import { invalidateEvents } from '../../../store/eventsSlice';

// pollution_waste subject codes that map cleanly onto the legacy activities
// table's fixed `category` column (plastic/glass/metal/organic/mixed/other,
// spec §18/§26 note this column should eventually go away in favor of the
// subjects table — until then, every submission still needs some value here).
const DIRECT_CATEGORY_CODES = new Set(['plastic', 'glass', 'metal']);

function mapToLegacyCategory(subjects) {
  const topPollution = subjects.find((s) => s.family === 'pollution_waste');
  if (!topPollution) return 'other';
  if (DIRECT_CATEGORY_CODES.has(topPollution.code)) return topPollution.code;
  if (topPollution.code === 'mixed_waste' || topPollution.code === 'microplastics') return 'mixed';
  return 'other';
}

const MISSING_FIELD_META = {
  species:       { label: 'Which species, if known?', placeholder: 'e.g. Green sea turtle' },
  action_taken:  { label: 'What action was taken, if any?', placeholder: 'e.g. Freed the turtle, left the net for a proper cleanup crew' },
  hazard:        { label: 'Any hazard to note?', placeholder: 'e.g. Sharp metal edges' },
};

// Typical unit per water-family subject code (spec §7.2) — a starting
// default the contributor can still overwrite, not a hard rule.
const WATER_UNIT_BY_CODE = {
  temperature: '°C', turbidity_clarity: 'NTU', salinity: 'ppt', ph: '',
  dissolved_oxygen: 'mg/L', nutrients: 'mg/L', conductivity: 'µS/cm',
  depth: 'm', suspended_material: 'mg/L', microbial_indicators: 'CFU/100mL',
  chlorophyll: 'µg/L', color: '', contaminants: '', water_other: ''
};

// Videos travel as multipart (see handleSubmit) rather than base64-in-JSON,
// so they aren't bound by the JSON body limit — this is just a sanity cap
// so a huge file doesn't get read fully into memory (multer memoryStorage)
// and silently hang the request.
const MAX_VIDEO_BYTES = 100 * 1024 * 1024; // 100MB

// Documents/datasets go through text extraction (spec §16), which is
// cheap enough that base64-in-JSON is fine here, unlike video — a real
// report or CSV is rarely more than a few hundred KB.
const MAX_DOCUMENT_BYTES = 8 * 1024 * 1024; // 8MB
const SUPPORTED_DOCUMENT_MIME_TYPES = new Set(['application/pdf', 'text/plain', 'text/csv']);

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const Tile = ({ icon, title, sub, onClick, disabled }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    style={{
      display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.5rem',
      padding: '1.4rem', background: 'var(--surface)', border: '1px solid var(--border-light)',
      borderRadius: 'var(--radius-lg)', cursor: disabled ? 'default' : 'pointer', textAlign: 'left',
      fontFamily: 'var(--font-sans)', opacity: disabled ? 0.55 : 1, transition: 'border-color .2s, transform .2s',
      width: '100%'
    }}
    onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.borderColor = 'var(--border-glow)'; }}
    onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-light)'; }}
  >
    {Array.isArray(icon) ? (
      <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
        {icon.map((i, idx) => <span key={idx} style={{ fontSize: '1.5rem' }}>{i}</span>)}
      </span>
    ) : (
      <span style={{ fontSize: '1.8rem' }}>{icon}</span>
    )}
    <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)' }}>{title}</span>
    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>{sub}</span>
  </button>
);

const SubjectChip = ({ subject, onRemove }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.3rem 0.7rem',
    borderRadius: '999px', background: 'color-mix(in srgb, var(--primary) 10%, transparent)',
    border: '1px solid color-mix(in srgb, var(--primary) 25%, transparent)', fontSize: '0.8rem', color: 'var(--primary-hover)'
  }}>
    {subject.label}
    <span style={{ fontSize: '0.68rem', opacity: 0.7 }}>{Math.round((subject.confidence ?? 0) * 100)}%</span>
    <button type="button" onClick={onRemove} aria-label={`Remove ${subject.label}`}
      style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0, fontSize: '0.85rem', lineHeight: 1 }}>
      ✕
    </button>
  </span>
);

// Org context defaults silently from the contributor's own profile (spec
// §19) — this is just a quiet confirmation line with an escape hatch,
// not a required field to fill in on every submission.
const OrgContextLine = ({ organizationId, organizations, orgsLoading, addOrganization, onChange, open, onToggle }) => {
  const orgName = organizations.find((o) => o.orgId === organizationId)?.name;
  if (!open) {
    return (
      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
        {orgName ? <>Submitting on behalf of <strong style={{ color: 'var(--text-main)' }}>{orgName}</strong></> : 'Submitting as an individual, no organization attached'}
        {' '}<button type="button" onClick={onToggle}
          style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: 0, font: 'inherit', textDecoration: 'underline' }}>
          Change
        </button>
      </div>
    );
  }
  return (
    <div>
      <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '0.4rem' }}>
        Organization
      </label>
      <OrganizationSelect
        value={organizationId}
        onChange={(orgId) => { onChange(orgId); onToggle(); }}
        organizations={organizations}
        loading={orgsLoading}
        onAddOrganization={addOrganization}
        placeholder="No organization (individual)"
      />
    </div>
  );
};

export default function QuickReport() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useAuth();
  const isCitizen = user?.role === 'citizen';
  const detailedFormPath = isCitizen ? '/citizen/submit' : '/contributor/submit';
  const overviewPath = isCitizen ? '/citizen/overview' : '/contributor/overview';
  // Org context comes from the contributor's own profile by default (spec
  // §19: "ask again only when context actually changes") — organizations
  // aren't a citizen concept, matching the old detailed form's step 5,
  // which citizens never saw either.
  const { organizations, orgsLoading, addOrganization } = useOrganizations();
  const [organizationId, setOrganizationId] = useState(user?.organizationId || '');
  const [orgPickerOpen, setOrgPickerOpen] = useState(false);
  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const documentInputRef = useRef(null);

  const [mode, setMode] = useState('landing'); // landing | photo-choose | photo | text-choose | text | voice | video-describe | confirm
  // `mode` is a transient step in the flow and gets overwritten to
  // 'confirm' once a draft is ready — inputSource persists alongside the
  // draft so the confirm screen can still tell a voice note from typed
  // text from a photo (or a video).
  const [inputSource, setInputSource] = useState(null); // photo | text | voice | video
  const [captureSource, setCaptureSource] = useState(null);
  const [photoDataUrl, setPhotoDataUrl] = useState(null);
  const [videoFile, setVideoFile] = useState(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState(null);
  const [videoError, setVideoError] = useState('');
  const [documentFile, setDocumentFile] = useState(null);
  const [documentMediaType, setDocumentMediaType] = useState('document'); // document | dataset
  const [documentError, setDocumentError] = useState('');
  const [rawText, setRawText] = useState('');
  const [inferring, setInferring] = useState(false);
  const [inferError, setInferError] = useState('');
  const [draft, setDraft] = useState(null);
  const [quantity, setQuantity] = useState('');
  const [location, setLocation] = useState('');
  const [lat, setLat] = useState(null);
  const [lon, setLon] = useState(null);
  const [extraFields, setExtraFields] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [recording, setRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [recordError, setRecordError] = useState('');
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordTimerRef = useRef(null);
  const mountedRef = useRef(true);

  // Measurement intake (spec §7.2) — structured readings, not AI-classified;
  // the contributor picks parameters directly and states how each was
  // taken, so provenance (instrument vs. informal) is known up front
  // instead of inferred.
  const [waterSubjects, setWaterSubjects] = useState([]);
  const [measurementValues, setMeasurementValues] = useState({}); // { [code]: { value, unit } }
  const [measurementSource, setMeasurementSource] = useState('instrument'); // instrument | informal
  const [instrumentName, setInstrumentName] = useState('');
  const [measurementNotes, setMeasurementNotes] = useState('');
  const [measurementSubmitting, setMeasurementSubmitting] = useState(false);
  const [measurementError, setMeasurementError] = useState('');

  // If the contributor navigates away mid-recording, stop the mic track
  // and clear the timer rather than leaving them running in the background.
  // onstop still fires (releasing the mic) — mountedRef just stops it from
  // touching state or firing an inference call after unmount.
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      clearInterval(recordTimerRef.current);
      if (mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  // Revoke the previous object URL whenever the video changes (or on
  // unmount) so selecting a new clip doesn't leak the old blob URL.
  useEffect(() => {
    return () => { if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl); };
  }, [videoPreviewUrl]);

  function handleLocationChange({ displayName, lat: newLat, lon: newLon }) {
    setLocation(displayName);
    setLat(newLat);
    setLon(newLon);
  }

  async function runInference({ imageBase64, audioBase64, documentBase64, text, sourceOverride }) {
    setInferring(true);
    setInferError('');
    setInputSource(sourceOverride || (imageBase64 ? 'photo' : audioBase64 ? 'voice' : 'text'));
    try {
      const res = await aiApi.infer({ imageBase64, audioBase64, documentBase64, text });
      if (!res.ok) {
        setInferError(res.error || "Blue Mind couldn't classify this automatically — you can still describe it manually below.");
        setDraft({ subjects: [], description: '', quantityEstimateKg: null, missingFields: [] });
      } else {
        setDraft(res.inference);
        if (res.inference.quantityEstimateKg != null) setQuantity(String(res.inference.quantityEstimateKg));
        // Voice notes and documents come back with the text Blue Mind
        // actually classified (a transcript, or extracted document text)
        // instead of the contributor having typed rawText directly —
        // surface it the same way so it's reviewable/editable and gets
        // sent along on submit either way.
        if (audioBase64 && typeof res.inference.transcript === 'string') setRawText(res.inference.transcript);
        if (documentBase64 && typeof res.inference.extractedText === 'string') setRawText(res.inference.extractedText);
      }
    } catch {
      setInferError("Couldn't reach Blue Mind's classifier — check your connection. You can still describe it manually below.");
      setDraft({ subjects: [], description: '', quantityEstimateKg: null, missingFields: [] });
    } finally {
      setInferring(false);
      setMode('confirm');
    }
  }

  async function handlePhotoSelected(e, source) {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await fileToDataUrl(file);
    setPhotoDataUrl(dataUrl);
    setCaptureSource(source);
    setMode('photo');
    runInference({ imageBase64: dataUrl });
  }

  function handleTextSubmit() {
    if (!rawText.trim()) return;
    setMode('text');
    runInference({ text: rawText.trim() });
  }

  // Video can't be sent to the vision classifier the way a still photo
  // can, so picking a video routes into a required short description
  // instead — that text is what actually gets classified, with the clip
  // itself carried along as separate video evidence (spec §13: evidence
  // items are independent, not one thing standing in for another).
  function handleVideoSelected(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_VIDEO_BYTES) {
      setVideoError(`That video is too large (max ${Math.round(MAX_VIDEO_BYTES / (1024 * 1024))}MB). Try a shorter clip.`);
      return;
    }
    setVideoError('');
    setVideoFile(file);
    setVideoPreviewUrl(URL.createObjectURL(file));
    setMode('video-describe');
  }

  function handleVideoDescribeSubmit() {
    if (!rawText.trim()) return;
    setMode('video');
    runInference({ text: rawText.trim(), sourceOverride: 'video' });
  }

  // Documents/datasets: extract text server-side, classify the extracted
  // text the same way a typed note would be (spec §16), and keep the
  // original file as separate evidence rather than discarding it once
  // it's been read (spec §13).
  async function handleDocumentSelected(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_DOCUMENT_BYTES) {
      setDocumentError(`That file is too large (max ${Math.round(MAX_DOCUMENT_BYTES / (1024 * 1024))}MB).`);
      return;
    }
    if (!SUPPORTED_DOCUMENT_MIME_TYPES.has(file.type)) {
      setDocumentError('Unsupported file type — try a PDF, CSV, or plain text file.');
      return;
    }
    setDocumentError('');
    setDocumentFile(file);
    setDocumentMediaType(file.type === 'text/csv' ? 'dataset' : 'document');
    const dataUrl = await fileToDataUrl(file);
    setMode('document');
    runInference({ documentBase64: dataUrl, sourceOverride: 'document' });
  }

  function openMeasurementForm() {
    setMode('measurement-form');
    if (waterSubjects.length === 0) {
      eventApi.listSubjects('water').then((res) => { if (res.ok) setWaterSubjects(res.subjects); });
    }
  }

  function toggleParam(code) {
    setMeasurementValues((prev) => {
      const next = { ...prev };
      if (next[code]) {
        delete next[code];
      } else {
        next[code] = { value: '', unit: WATER_UNIT_BY_CODE[code] ?? '' };
      }
      return next;
    });
  }

  function updateParamField(code, field, value) {
    setMeasurementValues((prev) => ({ ...prev, [code]: { ...prev[code], [field]: value } }));
  }

  const measurementSubjects = Object.entries(measurementValues)
    .filter(([, v]) => v.value !== '' && !Number.isNaN(Number(v.value)));
  const canSubmitMeasurement = measurementSubjects.length > 0 && location
    && (measurementSource !== 'instrument' || instrumentName.trim()) && !measurementSubmitting;

  async function handleMeasurementSubmit() {
    if (!canSubmitMeasurement) return;
    setMeasurementSubmitting(true);
    setMeasurementError('');

    const subjects = measurementSubjects.map(([code, v]) => ({
      family: 'water',
      code,
      source: measurementSource === 'instrument' ? 'system_captured' : 'user_provided',
      attributes: { value: Number(v.value), unit: v.unit || '' }
    }));

    const payload = {
      category: 'other',
      location,
      quantity: 0,
      volunteers: 1,
      lat, lon,
      gps: lat != null && lon != null ? `${lat}, ${lon}` : null,
      notes: measurementNotes || undefined,
      instrument: measurementSource === 'instrument' ? instrumentName.trim() : undefined,
      aiSubjects: JSON.stringify(subjects),
      intakeMethod: 'measurement',
      organizationId: organizationId || undefined
    };

    try {
      const res = await apiPost('/api/activities', payload);
      if (!res.ok) {
        setMeasurementError(res.error || res.message || 'Submission failed. Please try again.');
        return;
      }
      dispatch(invalidateActivities());
      dispatch(invalidateDashboard());
      dispatch(isCitizen ? invalidateCitizenStats() : invalidateContributorStats());
      dispatch(invalidateEvents());
      navigate(overviewPath, { replace: true, state: { flashMessage: 'Measurement submitted.' } });
    } catch {
      setMeasurementError('Submission failed. Check your connection and try again.');
    } finally {
      setMeasurementSubmitting(false);
    }
  }

  const RECORDING_MIME_CANDIDATES = ['audio/webm', 'audio/mp4', 'audio/ogg'];

  async function startRecording() {
    setRecordError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = RECORDING_MIME_CANDIDATES.find((t) => window.MediaRecorder?.isTypeSupported?.(t));
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        clearInterval(recordTimerRef.current);
        if (!mountedRef.current) return;
        setRecording(false);
        const blob = new Blob(audioChunksRef.current, { type: mimeType || 'audio/webm' });
        const dataUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
        if (!mountedRef.current) return;
        setMode('voice');
        runInference({ audioBase64: dataUrl });
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setRecording(true);
      setRecordSeconds(0);
      recordTimerRef.current = setInterval(() => setRecordSeconds((s) => s + 1), 1000);
    } catch {
      setRecordError("Couldn't access your microphone — check your browser's permission for this site.");
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
  }

  function removeSubject(index) {
    setDraft((d) => ({ ...d, subjects: d.subjects.filter((_, i) => i !== index) }));
  }

  function updateExtraField(key, value) {
    setExtraFields((f) => ({ ...f, [key]: value }));
  }

  const canSubmit = draft && location && quantity !== '' && Number(quantity) >= 0 && !submitting;

  async function handleSubmit() {
    if (!canSubmit) return;
    setSubmitting(true);
    setSubmitError('');

    const subjects = draft.subjects;
    const noteParts = [draft.description, extraFields.action_taken, extraFields.hazard].filter(Boolean);

    const aiSubjectsJson = JSON.stringify(subjects.map((s) => ({ family: s.family, code: s.code, confidence: s.confidence })));
    const intakeMethod = (inputSource === 'photo' || inputSource === 'video') ? 'photo_video'
      : inputSource === 'document' ? 'upload' : 'tell_blue_mind';

    const payload = {
      category: mapToLegacyCategory(subjects),
      location,
      quantity: Number(quantity),
      volunteers: 1,
      lat, lon,
      gps: lat != null && lon != null ? `${lat}, ${lon}` : null,
      notes: noteParts.join(' — '),
      speciesSighted: extraFields.species || undefined,
      hazardsMedical: false,
      hazardsChemical: false,
      hazardsUnstable: Boolean(extraFields.hazard),
      aiSubjects: aiSubjectsJson,
      rawText: rawText || undefined,
      intakeMethod,
      captureSource: captureSource || undefined,
      organizationId: organizationId || undefined
    };
    if (photoDataUrl) payload.imageUrls = JSON.stringify([photoDataUrl]);

    // A video or document attachment travels as multipart (matching the
    // field name the /api/activities route's multer middleware expects)
    // instead of JSON+base64 — see the MAX_VIDEO_BYTES comment above for why.
    const attachedFile = videoFile || documentFile;
    const attachedMediaType = videoFile ? 'video' : documentFile ? documentMediaType : null;

    try {
      let res;
      if (attachedFile) {
        const form = new FormData();
        Object.entries(payload).forEach(([key, value]) => {
          if (value !== undefined && value !== null) form.append(key, value);
        });
        form.append('mediaType', attachedMediaType);
        form.append('images', attachedFile);
        res = await apiPostForm('/api/activities', form);
      } else {
        res = await apiPost('/api/activities', payload);
      }

      if (!res.ok) {
        setSubmitError(res.error || res.message || 'Submission failed. Please try again.');
        return;
      }
      dispatch(invalidateActivities());
      dispatch(invalidateDashboard());
      dispatch(isCitizen ? invalidateCitizenStats() : invalidateContributorStats());
      dispatch(invalidateEvents());
      navigate(overviewPath, { replace: true, state: { flashMessage: 'Report submitted.' } });
    } catch {
      setSubmitError('Submission failed. Check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingBottom: '2rem', fontFamily: 'var(--font-sans)', maxWidth: '640px' }}>
      <style>{'@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.35; } }'}</style>
      <div>
        <h1 style={{ margin: '0 0 0.3rem', fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-main)' }}>What would you like to report?</h1>
        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Show or tell Blue Mind what you found — it figures out the rest.
          {' '}<button type="button" onClick={() => navigate(detailedFormPath)}
            style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: 0, font: 'inherit', textDecoration: 'underline' }}>
            Use the detailed form instead
          </button>
        </p>
      </div>

      <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }}
        onChange={(e) => handlePhotoSelected(e, 'camera')} />
      <input ref={galleryInputRef} type="file" accept="image/*" style={{ display: 'none' }}
        onChange={(e) => handlePhotoSelected(e, 'gallery')} />
      <input ref={videoInputRef} type="file" accept="video/*" style={{ display: 'none' }}
        onChange={handleVideoSelected} />
      <input ref={documentInputRef} type="file" accept=".pdf,.txt,.csv,application/pdf,text/plain,text/csv" style={{ display: 'none' }}
        onChange={handleDocumentSelected} />

      {mode === 'landing' && documentError && (
        <div style={{ fontSize: '0.8rem', color: '#b45309', background: 'rgba(245,158,11,.1)', border: '1px solid rgba(245,158,11,.25)', borderRadius: 'var(--radius-md)', padding: '0.6rem 0.8rem' }}>
          {documentError}
        </div>
      )}

      {mode === 'landing' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          <Tile icon="📷" title="Photo / Video" sub="Take or upload a photo of what you found." onClick={() => setMode('photo-choose')} />
          <Tile icon={['🎤', '📝']} title="Tell Blue Mind" sub="Speak or type what happened, in your own words." onClick={() => setMode('text-choose')} />
          {/* Measurement/Upload are professional-workflow tiles — kept for
              contributors (who also have the full detailed form), left out
              for citizens so their intake stays to the two lightweight
              capture modes rather than dangling stubs that dead-end into
              the same heavy form this page exists to avoid (spec §2). */}
          {!isCitizen && (
            <>
              <Tile icon="📊" title="Measurement" sub="Enter a structured environmental measurement." onClick={openMeasurementForm} />
              <Tile icon="📁" title="Upload" sub="Upload an existing report, spreadsheet, or dataset." onClick={() => documentInputRef.current?.click()} />
            </>
          )}
        </div>
      )}

      {mode === 'photo-choose' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
          {videoError && (
            <div style={{ fontSize: '0.8rem', color: '#b45309', background: 'rgba(245,158,11,.1)', border: '1px solid rgba(245,158,11,.25)', borderRadius: 'var(--radius-md)', padding: '0.6rem 0.8rem' }}>
              {videoError}
            </div>
          )}
          <div style={{ display: 'flex', gap: '0.7rem', flexWrap: 'wrap' }}>
            <button type="button" onClick={() => cameraInputRef.current?.click()}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--primary)', border: 'none',
                borderRadius: '999px', color: '#fff', fontWeight: 700, padding: '0.6rem 1.3rem', cursor: 'pointer', font: 'inherit', fontSize: '0.85rem' }}>
              📷 Take a photo
            </button>
            <button type="button" onClick={() => galleryInputRef.current?.click()}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'transparent', border: '1px solid var(--border-light)',
                borderRadius: '999px', color: 'var(--text-main)', fontWeight: 700, padding: '0.6rem 1.3rem', cursor: 'pointer', font: 'inherit', fontSize: '0.85rem' }}>
              🖼 Choose from gallery
            </button>
            <button type="button" onClick={() => videoInputRef.current?.click()}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'transparent', border: '1px solid var(--border-light)',
                borderRadius: '999px', color: 'var(--text-main)', fontWeight: 700, padding: '0.6rem 1.3rem', cursor: 'pointer', font: 'inherit', fontSize: '0.85rem' }}>
              🎥 Add a video
            </button>
          </div>
          <button type="button" onClick={() => setMode('landing')}
            style={{ alignSelf: 'flex-start', background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.82rem', cursor: 'pointer', padding: 0 }}>
            ← Back
          </button>
        </div>
      )}

      {mode === 'video-describe' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
          {videoPreviewUrl && (
            <video src={videoPreviewUrl} controls style={{ maxWidth: '260px', borderRadius: 'var(--radius-md)' }} />
          )}
          <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.06em' }}>
            Briefly describe what's happening in this video
          </label>
          <textarea
            autoFocus
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder="e.g. Removing a tangled fishing net from the reef near the marina."
            rows={3}
            style={{
              padding: '0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)',
              background: 'var(--surface-hover)', color: 'var(--text-main)', font: 'inherit', fontSize: '0.88rem', resize: 'vertical'
            }}
          />
          <div style={{ display: 'flex', gap: '0.6rem' }}>
            <button type="button" onClick={handleVideoDescribeSubmit} disabled={!rawText.trim()}
              style={{ background: 'var(--primary)', border: 'none', borderRadius: '999px', color: '#fff', fontWeight: 700,
                padding: '0.55rem 1.3rem', cursor: rawText.trim() ? 'pointer' : 'default', opacity: rawText.trim() ? 1 : 0.6, font: 'inherit', fontSize: '0.85rem' }}>
              Analyze
            </button>
            <button type="button" onClick={() => { setMode('photo-choose'); setVideoFile(null); setVideoPreviewUrl(null); setRawText(''); }}
              style={{ background: 'transparent', border: '1px solid var(--border-light)', borderRadius: '999px', color: 'var(--text-muted)',
                padding: '0.55rem 1.3rem', cursor: 'pointer', font: 'inherit', fontSize: '0.85rem' }}>
              Back
            </button>
          </div>
        </div>
      )}

      {mode === 'measurement-form' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '0.5rem' }}>
              Which measurements are you logging?
            </label>
            {waterSubjects.length === 0 ? (
              <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)' }}>Loading parameters…</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {waterSubjects.map((s) => {
                  const checked = Boolean(measurementValues[s.code]);
                  return (
                    <div key={s.subjectId}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-main)', cursor: 'pointer' }}>
                        <input type="checkbox" checked={checked} onChange={() => toggleParam(s.code)} />
                        {s.label}
                      </label>
                      {checked && (
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.35rem', marginLeft: '1.6rem' }}>
                          <input type="number" step="any" placeholder="Value" value={measurementValues[s.code].value}
                            onChange={(e) => updateParamField(s.code, 'value', e.target.value)}
                            style={{ width: '110px', padding: '0.45rem 0.6rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)',
                              background: 'var(--surface-hover)', color: 'var(--text-main)', font: 'inherit', fontSize: '0.82rem' }} />
                          <input type="text" placeholder="Unit" value={measurementValues[s.code].unit}
                            onChange={(e) => updateParamField(s.code, 'unit', e.target.value)}
                            style={{ width: '90px', padding: '0.45rem 0.6rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)',
                              background: 'var(--surface-hover)', color: 'var(--text-main)', font: 'inherit', fontSize: '0.82rem' }} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '0.5rem' }}>
              How was this measured?
            </label>
            <div style={{ display: 'flex', gap: '0.7rem', flexWrap: 'wrap' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                <input type="radio" name="measurementSource" checked={measurementSource === 'instrument'} onChange={() => setMeasurementSource('instrument')} />
                Instrument reading
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                <input type="radio" name="measurementSource" checked={measurementSource === 'informal'} onChange={() => setMeasurementSource('informal')} />
                Informal observation
              </label>
            </div>
            {measurementSource === 'instrument' && (
              <input type="text" value={instrumentName} onChange={(e) => setInstrumentName(e.target.value)}
                placeholder="Which instrument? (e.g. YSI multiparameter probe)"
                style={{ marginTop: '0.5rem', width: '100%', padding: '0.55rem 0.7rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)',
                  background: 'var(--surface-hover)', color: 'var(--text-main)', font: 'inherit', fontSize: '0.85rem' }} />
            )}
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '0.4rem' }}>
              Location
            </label>
            <MapLocationPicker value={location} lat={lat} lon={lon} onChange={handleLocationChange} />
          </div>

          <OrgContextLine
            organizationId={organizationId} organizations={organizations} orgsLoading={orgsLoading}
            addOrganization={addOrganization} onChange={setOrganizationId}
            open={orgPickerOpen} onToggle={() => setOrgPickerOpen((o) => !o)}
          />

          <textarea value={measurementNotes} onChange={(e) => setMeasurementNotes(e.target.value)}
            placeholder="Any additional notes? (optional)" rows={2}
            style={{ padding: '0.65rem 0.7rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)',
              background: 'var(--surface-hover)', color: 'var(--text-main)', font: 'inherit', fontSize: '0.85rem', resize: 'vertical' }} />

          {measurementError && (
            <div style={{ fontSize: '0.8rem', color: '#ef4444', background: 'rgba(239,68,68,.08)', borderRadius: 'var(--radius-md)', padding: '0.55rem 0.7rem' }}>
              {measurementError}
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.6rem' }}>
            <button type="button" onClick={handleMeasurementSubmit} disabled={!canSubmitMeasurement}
              style={{ background: 'var(--primary)', border: 'none', borderRadius: '999px', color: '#fff', fontWeight: 700,
                padding: '0.6rem 1.4rem', cursor: canSubmitMeasurement ? 'pointer' : 'default', opacity: canSubmitMeasurement ? 1 : 0.6, font: 'inherit', fontSize: '0.85rem' }}>
              {measurementSubmitting ? 'Submitting…' : 'Submit measurement'}
            </button>
            <button type="button" onClick={() => setMode('landing')}
              style={{ background: 'transparent', border: '1px solid var(--border-light)', borderRadius: '999px', color: 'var(--text-muted)',
                padding: '0.6rem 1.4rem', cursor: 'pointer', font: 'inherit', fontSize: '0.85rem' }}>
              Back
            </button>
          </div>
        </div>
      )}

      {mode === 'text-choose' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
          {recordError && (
            <div style={{ fontSize: '0.8rem', color: '#b45309', background: 'rgba(245,158,11,.1)', border: '1px solid rgba(245,158,11,.25)', borderRadius: 'var(--radius-md)', padding: '0.6rem 0.8rem' }}>
              {recordError}
            </div>
          )}

          {recording ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: 'var(--text-main)' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444', animation: 'pulse 1.2s ease-in-out infinite' }} />
                Recording… {String(Math.floor(recordSeconds / 60)).padStart(1, '0')}:{String(recordSeconds % 60).padStart(2, '0')}
              </span>
              <button type="button" onClick={stopRecording}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#ef4444', border: 'none',
                  borderRadius: '999px', color: '#fff', fontWeight: 700, padding: '0.55rem 1.2rem', cursor: 'pointer', font: 'inherit', fontSize: '0.85rem' }}>
                ⏹ Stop
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '0.7rem', flexWrap: 'wrap' }}>
              <button type="button" onClick={startRecording}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--primary)', border: 'none',
                  borderRadius: '999px', color: '#fff', fontWeight: 700, padding: '0.6rem 1.3rem', cursor: 'pointer', font: 'inherit', fontSize: '0.85rem' }}>
                🎤 Record a voice note
              </button>
              <button type="button" onClick={() => setMode('text')}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'transparent', border: '1px solid var(--border-light)',
                  borderRadius: '999px', color: 'var(--text-main)', fontWeight: 700, padding: '0.6rem 1.3rem', cursor: 'pointer', font: 'inherit', fontSize: '0.85rem' }}>
                ✍️ Type a note
              </button>
            </div>
          )}

          {!recording && (
            <button type="button" onClick={() => setMode('landing')}
              style={{ alignSelf: 'flex-start', background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.82rem', cursor: 'pointer', padding: 0 }}>
              ← Back
            </button>
          )}
        </div>
      )}

      {mode === 'text' && !draft && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
          <textarea
            autoFocus
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder="e.g. Found an abandoned fishing net on the north side of the reef, a turtle was tangled in it — we freed it and removed about 40kg of net."
            rows={5}
            style={{
              padding: '0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)',
              background: 'var(--surface-hover)', color: 'var(--text-main)', font: 'inherit', fontSize: '0.88rem', resize: 'vertical'
            }}
          />
          <div style={{ display: 'flex', gap: '0.6rem' }}>
            <button type="button" onClick={handleTextSubmit} disabled={!rawText.trim()}
              style={{ background: 'var(--primary)', border: 'none', borderRadius: '999px', color: '#fff', fontWeight: 700,
                padding: '0.55rem 1.3rem', cursor: rawText.trim() ? 'pointer' : 'default', opacity: rawText.trim() ? 1 : 0.6, font: 'inherit', fontSize: '0.85rem' }}>
              Analyze
            </button>
            <button type="button" onClick={() => setMode('text-choose')}
              style={{ background: 'transparent', border: '1px solid var(--border-light)', borderRadius: '999px', color: 'var(--text-muted)',
                padding: '0.55rem 1.3rem', cursor: 'pointer', font: 'inherit', fontSize: '0.85rem' }}>
              Back
            </button>
          </div>
        </div>
      )}

      {(mode === 'photo' || mode === 'text' || mode === 'voice' || mode === 'video' || mode === 'document') && inferring && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.8rem', padding: '2.5rem 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          {photoDataUrl && <img src={photoDataUrl} alt="Submitted evidence" style={{ maxWidth: '200px', borderRadius: 'var(--radius-md)' }} />}
          <span>
            {mode === 'voice' ? 'Blue Mind is listening…' : mode === 'document' ? 'Blue Mind is reading this…' : 'Blue Mind is looking at this…'}
          </span>
        </div>
      )}

      {mode === 'confirm' && draft && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          {photoDataUrl && <img src={photoDataUrl} alt="Submitted evidence" style={{ maxWidth: '260px', borderRadius: 'var(--radius-md)' }} />}
          {videoPreviewUrl && <video src={videoPreviewUrl} controls style={{ maxWidth: '260px', borderRadius: 'var(--radius-md)' }} />}

          {inferError && (
            <div style={{ fontSize: '0.8rem', color: '#b45309', background: 'rgba(245,158,11,.1)', border: '1px solid rgba(245,158,11,.25)', borderRadius: 'var(--radius-md)', padding: '0.6rem 0.8rem' }}>
              {inferError}
            </div>
          )}

          {draft.subjects.length > 0 && (
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '0.5rem' }}>
                We think this is
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {draft.subjects.map((s, i) => <SubjectChip key={`${s.family}-${s.code}`} subject={s} onRemove={() => removeSubject(i)} />)}
              </div>
            </div>
          )}

          {draft.description && (
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-main)', fontStyle: 'italic' }}>&ldquo;{draft.description}&rdquo;</p>
          )}

          {rawText && (
            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '0.4rem' }}>
                {inputSource === 'voice' ? 'What Blue Mind heard' : inputSource === 'document' ? 'Text extracted from your document' : 'Your report'}
              </label>
              <textarea
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                rows={3}
                style={{ width: '100%', padding: '0.7rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)',
                  background: 'var(--surface-hover)', color: 'var(--text-main)', font: 'inherit', fontSize: '0.85rem', resize: 'vertical' }}
              />
              {inputSource === 'voice' && (
                <p style={{ margin: '0.35rem 0 0', fontSize: '0.72rem', color: 'var(--text-muted)' }}>Fix anything Blue Mind heard wrong before submitting.</p>
              )}
              {inputSource === 'document' && (
                <p style={{ margin: '0.35rem 0 0', fontSize: '0.72rem', color: 'var(--text-muted)' }}>This is what Blue Mind read from your file — edit if anything's off.</p>
              )}
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '0.4rem' }}>
              Location
            </label>
            <MapLocationPicker value={location} lat={lat} lon={lon} onChange={handleLocationChange} />
          </div>

          {!isCitizen && (
            <OrgContextLine
              organizationId={organizationId} organizations={organizations} orgsLoading={orgsLoading}
              addOrganization={addOrganization} onChange={setOrganizationId}
              open={orgPickerOpen} onToggle={() => setOrgPickerOpen((o) => !o)}
            />
          )}

          <div>
            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '0.4rem' }}>
              Estimated weight (kg)
            </label>
            <input
              type="number" min="0" step="0.5" value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="0"
              style={{ width: '140px', padding: '0.55rem 0.7rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)',
                background: 'var(--surface-hover)', color: 'var(--text-main)', font: 'inherit', fontSize: '0.88rem' }}
            />
          </div>

          {draft.missingFields.filter((f) => MISSING_FIELD_META[f]).map((field) => (
            <div key={field}>
              <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '0.4rem' }}>
                {MISSING_FIELD_META[field].label}
              </label>
              <input
                type="text" value={extraFields[field] || ''} placeholder={MISSING_FIELD_META[field].placeholder}
                onChange={(e) => updateExtraField(field, e.target.value)}
                style={{ width: '100%', padding: '0.55rem 0.7rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)',
                  background: 'var(--surface-hover)', color: 'var(--text-main)', font: 'inherit', fontSize: '0.88rem' }}
              />
            </div>
          ))}

          {submitError && (
            <div style={{ fontSize: '0.8rem', color: '#ef4444', background: 'rgba(239,68,68,.08)', borderRadius: 'var(--radius-md)', padding: '0.55rem 0.7rem' }}>
              {submitError}
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.6rem' }}>
            <button type="button" onClick={handleSubmit} disabled={!canSubmit}
              style={{ background: 'var(--primary)', border: 'none', borderRadius: '999px', color: '#fff', fontWeight: 700,
                padding: '0.6rem 1.4rem', cursor: canSubmit ? 'pointer' : 'default', opacity: canSubmit ? 1 : 0.6, font: 'inherit', fontSize: '0.85rem' }}>
              {submitting ? 'Submitting…' : 'Submit report'}
            </button>
            <button type="button" onClick={() => { setMode('landing'); setDraft(null); setPhotoDataUrl(null); setVideoFile(null); setVideoPreviewUrl(null); setDocumentFile(null); setRawText(''); setInferError(''); setInputSource(null); setCaptureSource(null); setExtraFields({}); }}
              style={{ background: 'transparent', border: '1px solid var(--border-light)', borderRadius: '999px', color: 'var(--text-muted)',
                padding: '0.6rem 1.4rem', cursor: 'pointer', font: 'inherit', fontSize: '0.85rem' }}>
              Start over
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
