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
import { fileToDataUrl } from '../../../utils/file';

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

// Reuses the app's existing color vocabulary rather than inventing a new
// palette: secondary/success/warning are the same tokens the rest of the
// contributor/citizen shell already draws from, and the violet is the exact
// "action_planned" hue from eventMeta.js (spec state-color vocabulary),
// borrowed here since Tell Blue Mind has no natural home in that trio.
const TILE_THEME = {
  blue:   { accent: 'var(--secondary)' },
  green:  { accent: 'var(--success)' },
  orange: { accent: 'var(--warning)' },
  violet: { accent: '#7f77dd' },
};

const TILE_ICONS = {
  camera: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  ),
  voice: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="2" width="6" height="12" rx="3" />
      <path d="M5 11a7 7 0 0014 0" /><line x1="12" y1="18" x2="12" y2="22" /><line x1="8" y1="22" x2="16" y2="22" />
    </svg>
  ),
  chart: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" y1="21" x2="4" y2="13" /><line x1="10" y1="21" x2="10" y2="7" />
      <line x1="16" y1="21" x2="16" y2="11" /><line x1="22" y1="21" x2="22" y2="3" />
    </svg>
  ),
  upload: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
      <polyline points="7 9 12 4 17 9" /><line x1="12" y1="4" x2="12" y2="15" />
    </svg>
  ),
  type: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="4 7 4 4 20 4 20 7" /><line x1="9" y1="20" x2="15" y2="20" /><line x1="12" y1="4" x2="12" y2="20" />
    </svg>
  ),
};

// A small leaf mark used as a recurring decorative accent (header, banner,
// hero panel) — echoes the "environmental" subject matter without leaning
// on a stock icon set.
const Leaf = ({ size = 16, style, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={style} className={className} aria-hidden="true">
    <path d="M4 20c8-1 14-7 15-15-8 1-14 7-15 15z" />
    <path d="M6.5 17.5C10 14 12.5 11 15 8" />
  </svg>
);

// Every step past the landing tiles carries the color of the tile it came
// from, so the flow reads as one continuous colored thread instead of
// resetting to a neutral default the moment you commit to a path.
const FLOW_ACCENT = {
  photo: 'var(--secondary)', video: 'var(--secondary)',
  voice: '#7f77dd', text: '#7f77dd',
  document: 'var(--warning)', measurement: 'var(--success)',
};
const FLOW_ICON = {
  photo: 'camera', video: 'camera',
  voice: 'voice', text: 'type',
  document: 'upload', measurement: 'chart',
};

const StepCard = ({ accent, icon, title, badge, sub, art, onBack, backDisabled, children }) => (
  <div className="qr-card" style={{ '--tile-accent': accent }}>
    <button type="button" className="qr-back-link" onClick={onBack} disabled={backDisabled}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
      </svg>
      Back
    </button>
    <div className="qr-card-head">
      <span className="qr-step-icon">{TILE_ICONS[icon]}</span>
      <div>
        <h2 className="qr-card-title">
          {title}
          {badge && <span className="qr-card-badge">{badge}</span>}
        </h2>
        {sub && <p className="qr-card-sub">{sub}</p>}
      </div>
      {art && <div className="qr-card-art" aria-hidden="true">{art}</div>}
    </div>
    {art && <div className="qr-card-divider" />}
    <div className="qr-card-body">{children}</div>
  </div>
);

// Bars peak nearest the mic and taper outward on both sides, each animating
// on its own offset so the row reads as one continuous waveform rather than
// bars blinking in lockstep.
const VOICE_BAR_HEIGHTS = [12, 22, 34, 48, 34, 22, 12];
const VoiceBars = ({ reverse }) => (
  <span className="qr-voice-bars">
    {(reverse ? [...VOICE_BAR_HEIGHTS].reverse() : VOICE_BAR_HEIGHTS).map((h, i) => (
      <span key={i} className="qr-voice-bar" style={{ height: `${h}px`, animationDelay: `${i * 0.11}s` }} />
    ))}
  </span>
);

// Faint per-theme motif in the tile's bottom-right corner — a sparkline for
// Measurement, stacked files for Upload, a soundwave for Tell Blue Mind —
// purely decorative (pointer-events none) so it never competes with the
// button's own click target.
const TILE_DECORATION = {
  green: (
    <svg width="70" height="46" viewBox="0 0 70 46" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M2 40l10-6 10 4 12-14 12 2 10-18" />
    </svg>
  ),
  orange: (
    <svg width="60" height="50" viewBox="0 0 60 50" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="6" y="4" width="26" height="32" rx="3" transform="rotate(-8 19 20)" />
      <rect x="24" y="10" width="26" height="32" rx="3" transform="rotate(6 37 26)" />
    </svg>
  ),
  violet: (
    <svg width="64" height="30" viewBox="0 0 64 30" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="2" y1="15" x2="2" y2="15" /><line x1="10" y1="9" x2="10" y2="21" />
      <line x1="18" y1="4" x2="18" y2="26" /><line x1="26" y1="11" x2="26" y2="19" />
      <line x1="34" y1="1" x2="34" y2="29" /><line x1="42" y1="8" x2="42" y2="22" />
      <line x1="50" y1="12" x2="50" y2="18" /><line x1="58" y1="6" x2="58" y2="24" />
    </svg>
  ),
};

const Tile = ({ icon, title, sub, onClick, disabled, theme }) => {
  const accent = TILE_THEME[theme].accent;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="qr-tile"
      style={{ '--tile-accent': accent, opacity: disabled ? 0.5 : 1, cursor: disabled ? 'default' : 'pointer' }}
    >
      {TILE_DECORATION[theme] && <span className="qr-tile-deco" aria-hidden="true">{TILE_DECORATION[theme]}</span>}
      <span className="qr-tile-icon">{TILE_ICONS[icon]}</span>
      <span className="qr-tile-title">{title}</span>
      <span className="qr-tile-underline" aria-hidden="true" />
      <span className="qr-tile-sub">{sub}</span>
      <span className="qr-tile-arrow" aria-hidden="true">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
        </svg>
      </span>
    </button>
  );
};

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
// §19) — the dropdown itself already carries "Individual" as its first,
// always-available option (OrganizationSelect's placeholder row), so there's
// no need for a separate collapsed confirmation line with a "Change" link.
const OrgContextLine = ({ organizationId, organizations, orgsLoading, addOrganization, onChange }) => (
  <div>
    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '0.4rem' }}>
      Organization
    </label>
    <OrganizationSelect
      value={organizationId}
      onChange={onChange}
      organizations={organizations}
      loading={orgsLoading}
      onAddOrganization={addOrganization}
      placeholder="Individual (no organization)"
    />
  </div>
);

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
  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const documentInputRef = useRef(null);

  const [mode, setMode] = useState('landing'); // landing | photo | text-choose | text | voice | video-describe | video | document | measurement-form | confirm
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
  // Split so picked parameters stay expanded at the top with their value/unit
  // fields, while everything else collapses into a dense pick list below.
  const pickedWaterSubjects = waterSubjects.filter((s) => measurementValues[s.code]);
  const unpickedWaterSubjects = waterSubjects.filter((s) => !measurementValues[s.code]);

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
    <section style={{
      display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingBottom: '2rem', fontFamily: 'var(--font-sans)',
      width: '100%', flex: 1
    }}>
      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.35; } }

        .qr-header { position: relative; text-align: left; padding: 0 0.5rem; }
        .qr-header h1 { display: inline-flex; align-items: center; gap: 0.5rem; }
        .qr-header-leaf { color: var(--secondary); opacity: 0.75; }
        .qr-detailed-pill {
          display: inline-flex; align-items: center; gap: 0.4rem;
          position: absolute; top: 0; right: 0;
          background: var(--surface); border: 1px solid var(--border-light);
          border-radius: 999px; padding: 0.5rem 1rem; font-size: 0.8rem; font-weight: 600;
          color: var(--primary); cursor: pointer; font-family: inherit; white-space: nowrap;
          transition: border-color .2s, transform .2s;
        }
        .qr-detailed-pill:hover { border-color: var(--border-glow); transform: translateY(-1px); }

        /* Hero (Photo/Video) — the featured, highest-traffic path gets a
           full-width card with its actions exposed directly, skipping what
           used to be an extra click into a chooser screen. */
        .qr-hero {
          display: flex; gap: 1.75rem; align-items: stretch; overflow: hidden;
          background: color-mix(in srgb, var(--tile-accent) 7%, var(--surface));
          border: 1px solid color-mix(in srgb, var(--tile-accent) 22%, var(--border-light));
          border-radius: var(--radius-lg); padding: 1.75rem;
        }
        .qr-hero-left { flex: 1 1 55%; min-width: 0; display: flex; flex-direction: column; gap: 0.7rem; }
        .qr-hero-title { margin: 0.2rem 0 0; font-size: 1.25rem; font-weight: 700; color: var(--text-main); }
        .qr-hero-sub { margin: 0; font-size: 0.85rem; color: var(--text-muted); line-height: 1.5; max-width: 34ch; }
        .qr-hero-actions { display: flex; flex-wrap: wrap; gap: 0.65rem; margin-top: 0.5rem; }
        .qr-hero-art {
          position: relative; flex: 1 1 40%; min-width: 200px; border-radius: var(--radius-md);
          background: linear-gradient(155deg, color-mix(in srgb, var(--tile-accent) 16%, transparent), color-mix(in srgb, var(--tile-accent) 4%, transparent));
          display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.6rem; padding: 1.5rem;
        }
        .qr-hero-bracket { position: absolute; width: 18px; height: 18px; border: 2px solid var(--tile-accent); opacity: 0.55; }
        .qr-hero-bracket--tl { top: 12px; left: 12px; border-right: none; border-bottom: none; }
        .qr-hero-bracket--tr { top: 12px; right: 12px; border-left: none; border-bottom: none; }
        .qr-hero-bracket--bl { bottom: 12px; left: 12px; border-right: none; border-top: none; }
        .qr-hero-bracket--br { bottom: 12px; right: 12px; border-left: none; border-top: none; }
        .qr-hero-caption { display: flex; align-items: center; gap: 0.35rem; font-size: 0.78rem; font-weight: 600; color: var(--tile-accent); }

        .qr-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); gap: 1.1rem; }

        .qr-tile {
          position: relative; overflow: hidden; display: flex; flex-direction: column; align-items: flex-start;
          gap: 0.35rem; padding: 1.5rem 1.5rem 1.75rem; background: color-mix(in srgb, var(--tile-accent) 8%, var(--surface));
          border: 1px solid color-mix(in srgb, var(--tile-accent) 20%, var(--border-light)); border-radius: var(--radius-lg); text-align: left;
          font-family: var(--font-sans); width: 100%; transition: border-color .2s, transform .2s, box-shadow .2s;
        }
        .qr-tile:not(:disabled):hover {
          border-color: color-mix(in srgb, var(--tile-accent) 55%, var(--border-light));
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
        }
        .qr-tile-deco {
          position: absolute; right: 0.9rem; bottom: 0.9rem; color: var(--tile-accent); opacity: 0.22; pointer-events: none;
        }
        .qr-tile-icon {
          position: relative; width: 44px; height: 44px; border-radius: 999px; flex-shrink: 0; margin-bottom: 0.25rem;
          display: flex; align-items: center; justify-content: center;
          background: color-mix(in srgb, var(--tile-accent) 18%, var(--surface)); color: var(--tile-accent);
        }
        .qr-tile-title { position: relative; font-weight: 700; font-size: 0.98rem; color: var(--text-main); }
        .qr-tile-underline { position: relative; width: 22px; height: 3px; border-radius: 2px; background: var(--tile-accent); margin-bottom: 0.2rem; }
        .qr-tile-sub { position: relative; font-size: 0.8rem; color: var(--text-muted); line-height: 1.45; }
        .qr-tile-arrow {
          position: relative; width: 32px; height: 32px; border-radius: 999px; margin-top: 0.4rem;
          display: flex; align-items: center; justify-content: center;
          background: var(--tile-accent); color: #fff;
        }

        .qr-banner {
          display: flex; align-items: center; justify-content: center; gap: 2rem; flex-wrap: wrap;
          margin-top: auto; padding: 1.5rem 2rem; border-radius: var(--radius-lg); background: var(--surface-hover);
          border: 1px solid var(--border-light);
        }
        .qr-banner-leaf { color: var(--secondary); opacity: 0.5; flex-shrink: 0; }
        .qr-banner-divider { width: 1px; align-self: stretch; background: var(--border-light); }
        .qr-banner-item { display: flex; align-items: center; gap: 0.85rem; font-size: 0.9rem; color: var(--text-muted); }
        .qr-banner-item strong { color: var(--text-main); font-weight: 600; font-size: 0.98rem; }
        .qr-banner-item p { margin: 0.2rem 0 0; }
        .qr-banner-icon {
          width: 42px; height: 42px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; color: #fff;
        }
        .qr-banner-icon svg { width: 20px; height: 20px; }

        @media (max-width: 640px) {
          .qr-header { text-align: left; }
          .qr-detailed-pill { position: static; margin-top: 0.75rem; }
          .qr-grid { grid-template-columns: 1fr; }
          .qr-hero { flex-direction: column; }
          .qr-hero-art { min-height: 160px; }
          .qr-banner { justify-content: flex-start; }
          .qr-banner-divider { display: none; }
        }

        /* Step screens (everything past the landing tiles) — themed per
           flow via the --tile-accent custom property set on .qr-card, so
           the buttons/icon below just reference var(--tile-accent) rather
           than needing the accent threaded through every element. */
        .qr-card {
          background: var(--surface); border: 1px solid var(--border-light); border-radius: var(--radius-lg);
          backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
          padding: 1.6rem 1.75rem; display: flex; flex-direction: column; gap: 1.25rem;
        }
        .qr-card-head { display: flex; align-items: center; gap: 0.85rem; }
        .qr-back-link {
          display: inline-flex; align-items: center; gap: 0.3rem; align-self: flex-start; margin-bottom: -0.4rem;
          background: none; background-image: none; border: none; border-radius: 0; padding: 0; box-shadow: none; filter: none;
          color: var(--text-muted); font-family: inherit;
          font-size: 0.8rem; font-weight: 600; cursor: pointer; transition: color .2s, transform .2s;
        }
        .qr-back-link:hover:not(:disabled) { color: var(--tile-accent); transform: translateX(-2px); box-shadow: none; filter: none; }
        .qr-back-link:active { transform: translateX(-2px); box-shadow: none; }
        .qr-back-link:disabled { opacity: 0.4; cursor: default; }
        .qr-step-icon {
          width: 40px; height: 40px; border-radius: 999px; flex-shrink: 0; display: flex; align-items: center; justify-content: center;
          background: color-mix(in srgb, var(--tile-accent) 16%, transparent); color: var(--tile-accent);
        }
        .qr-card-title { margin: 0; display: inline-flex; align-items: center; gap: 0.5rem; font-size: 1.05rem; font-weight: 700; color: var(--text-main); }
        .qr-card-badge {
          font-size: 0.62rem; font-weight: 700; text-transform: uppercase; letter-spacing: .04em;
          padding: 0.15rem 0.5rem; border-radius: 999px; color: var(--tile-accent);
          background: color-mix(in srgb, var(--tile-accent) 14%, transparent);
          border: 1px solid color-mix(in srgb, var(--tile-accent) 30%, transparent);
        }
        .qr-card-sub { margin: 0.15rem 0 0; font-size: 0.8rem; color: var(--text-muted); line-height: 1.4; }
        .qr-card-art { margin-left: auto; flex-shrink: 0; color: var(--tile-accent); opacity: 0.85; }
        .qr-card-divider { height: 1px; background: var(--border-light); margin: -0.4rem 0 0; }
        .qr-card-body { display: flex; flex-direction: column; gap: 1rem; }

        .qr-section-label {
          display: block; font-size: 0.72rem; font-weight: 700; color: var(--text-muted);
          text-transform: uppercase; letter-spacing: .06em; margin-bottom: 0.6rem;
        }

        /* Measurement parameter picker — checked rows stay full-width with
           their value/unit fields; everything else collapses into a dense
           2-column pick list so a ~15-parameter taxonomy doesn't read as a
           wall of checkboxes (spec §7.2 — provenance is captured once via
           the instrument/informal toggle below, not per parameter). */
        .qr-param-row {
          display: flex; align-items: center; gap: 0.55rem; padding: 0.6rem 0.7rem; border-radius: var(--radius-md);
          background: color-mix(in srgb, var(--tile-accent) 6%, var(--surface-hover));
          border: 1px solid color-mix(in srgb, var(--tile-accent) 18%, var(--border-light));
        }
        .qr-param-checkbox { width: 16px; height: 16px; flex-shrink: 0; accent-color: var(--tile-accent); cursor: pointer; }
        .qr-param-label { flex: 1; font-size: 0.85rem; color: var(--text-main); cursor: pointer; }
        .qr-param-fields { display: flex; gap: 0.6rem; margin: 0.5rem 0 0 1.65rem; }
        .qr-param-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 0.5rem; }
        .qr-param-grid .qr-param-row { background: transparent; border-color: var(--border-light); padding: 0.4rem 0.5rem; }
        .qr-info-dot {
          width: 14px; height: 14px; border-radius: 50%; flex-shrink: 0; display: flex; align-items: center; justify-content: center;
          color: var(--text-muted); opacity: 0.6; cursor: help;
        }

        .qr-select {
          width: 100%; padding: 0.45rem 0.6rem; border-radius: var(--radius-md); border: 1px solid var(--border-light);
          background: var(--surface-hover); color: var(--text-main); font: inherit; font-size: 0.82rem;
          appearance: none; -webkit-appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' fill='none' stroke='%237b8fa1' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
          background-repeat: no-repeat; background-position: right 0.55rem center;
        }

        .qr-radio-group { display: flex; gap: 0.7rem; flex-wrap: wrap; }
        .qr-radio-card {
          display: flex; align-items: center; gap: 0.5rem; flex: 1 1 180px; padding: 0.65rem 0.9rem;
          border-radius: var(--radius-md); border: 1px solid var(--border-light); background: var(--surface-hover);
          font-size: 0.85rem; color: var(--text-main); cursor: pointer; transition: border-color .2s, background .2s;
        }
        .qr-radio-card input { accent-color: var(--tile-accent); flex-shrink: 0; }
        .qr-radio-card--active {
          border-color: color-mix(in srgb, var(--tile-accent) 55%, var(--border-light));
          background: color-mix(in srgb, var(--tile-accent) 10%, var(--surface-hover));
        }

        .qr-notes-wrap { position: relative; }
        .qr-notes-count { position: absolute; right: 0.7rem; bottom: 0.5rem; font-size: 0.68rem; color: var(--text-muted); pointer-events: none; }

        .qr-submit-row { display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap; }
        .qr-secure-note { display: flex; align-items: center; gap: 0.5rem; font-size: 0.76rem; color: var(--text-muted); }
        .qr-secure-note svg { flex-shrink: 0; color: var(--tile-accent); }

        .qr-recording-pill { display: inline-flex; align-items: center; gap: 0.5rem; cursor: default; }
        .qr-recording-dot { width: 9px; height: 9px; border-radius: 2px; background: #fff; animation: pulse 1.2s ease-in-out infinite; }

        .qr-voice-divider { height: 1px; background: var(--border-light); }

        /* Full-bleed "listening" state — a mic centered inside a slowly
           spinning dotted ring, flanked by a waveform that animates per-bar
           so it reads as live audio rather than a static icon. */
        .qr-voice-viz { display: flex; flex-direction: column; align-items: center; gap: 0.4rem; padding: 2rem 1rem 0.5rem; }
        .qr-voice-stage { display: flex; align-items: center; justify-content: center; gap: clamp(1rem, 4vw, 2.5rem); width: 100%; }
        .qr-voice-bars { display: flex; align-items: center; gap: 5px; height: 56px; flex-shrink: 0; }
        .qr-voice-bar {
          width: 4px; min-height: 6px; border-radius: 3px; background: var(--tile-accent);
          transform-origin: center; animation: qr-bar-pulse 1s ease-in-out infinite;
        }
        @keyframes qr-bar-pulse { 0%, 100% { transform: scaleY(0.45); opacity: 0.6; } 50% { transform: scaleY(1); opacity: 1; } }
        .qr-voice-rings { position: relative; width: 130px; height: 130px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .qr-voice-ring-dotted {
          position: absolute; inset: 0; border-radius: 50%;
          border: 2px dotted color-mix(in srgb, var(--tile-accent) 55%, transparent);
          animation: qr-ring-spin 10s linear infinite;
        }
        @keyframes qr-ring-spin { to { transform: rotate(360deg); } }
        .qr-voice-mic {
          position: relative; width: 84px; height: 84px; border-radius: 50%;
          background: color-mix(in srgb, var(--tile-accent) 24%, var(--surface));
          box-shadow: 0 0 0 14px color-mix(in srgb, var(--tile-accent) 9%, transparent);
          display: flex; align-items: center; justify-content: center; color: var(--tile-accent);
        }
        .qr-voice-title { margin: 0.5rem 0 0; font-size: 1.05rem; font-weight: 700; color: var(--tile-accent); text-align: center; }
        .qr-voice-sub { margin: 0.2rem 0 0.4rem; font-size: 0.82rem; color: var(--text-muted); text-align: center; }
        .qr-voice-stop {
          display: inline-flex; align-items: center; gap: 0.5rem; background: var(--surface);
          border: 1px solid rgba(239,68,68,.35); border-radius: 999px; color: #ef4444; font-weight: 700;
          padding: 0.6rem 1.4rem; font-family: inherit; font-size: 0.85rem; cursor: pointer;
          box-shadow: none; transition: background .2s;
        }
        .qr-voice-stop:hover { background: rgba(239,68,68,.08); box-shadow: none; }
        .qr-voice-stop-dot { width: 9px; height: 9px; border-radius: 2px; background: #ef4444; }

        .qr-btn-primary {
          background: var(--tile-accent); border: none; border-radius: 999px; color: #fff; font-weight: 700;
          padding: 0.6rem 1.4rem; cursor: pointer; font-family: inherit; font-size: 0.85rem; transition: transform .15s, opacity .15s;
        }
        .qr-btn-primary:disabled { opacity: 0.55; cursor: default; }
        .qr-btn-primary:not(:disabled):hover { transform: translateY(-1px); }
        .qr-btn-outline {
          background: color-mix(in srgb, var(--tile-accent) 10%, transparent);
          border: 1px solid color-mix(in srgb, var(--tile-accent) 40%, var(--border-light));
          border-radius: 999px; color: var(--tile-accent); font-weight: 700;
          padding: 0.6rem 1.3rem; cursor: pointer; font-family: inherit; font-size: 0.85rem; transition: background .2s;
        }
        .qr-btn-outline:hover { background: color-mix(in srgb, var(--tile-accent) 18%, transparent); }
        .qr-btn-secondary {
          background: transparent; border: 1px solid var(--border-light); border-radius: 999px; color: var(--text-muted);
          padding: 0.6rem 1.4rem; cursor: pointer; font-family: inherit; font-size: 0.85rem; transition: border-color .2s, color .2s;
        }
        .qr-btn-secondary:hover { border-color: var(--border-glow); color: var(--text-main); }

        .qr-warning { font-size: 0.8rem; color: #b45309; background: rgba(245,158,11,.1); border: 1px solid rgba(245,158,11,.25); border-radius: var(--radius-md); padding: 0.6rem 0.8rem; }
        .qr-error { font-size: 0.8rem; color: #ef4444; background: rgba(239,68,68,.08); border-radius: var(--radius-md); padding: 0.55rem 0.7rem; }

        .qr-loading-card {
          display: flex; flex-direction: column; align-items: center; gap: 1rem; padding: 3rem 1.5rem;
          background: var(--surface); border: 1px solid var(--border-light); border-radius: var(--radius-lg);
          backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
        }
        .qr-spinner {
          width: 40px; height: 40px; border-radius: 50%; border: 3px solid color-mix(in srgb, var(--tile-accent) 20%, transparent);
          border-top-color: var(--tile-accent); animation: qr-spin 0.8s linear infinite;
        }
        @keyframes qr-spin { to { transform: rotate(360deg); } }
      `}</style>

      <div className="qr-header">
        <button type="button" className="qr-detailed-pill" onClick={() => navigate(detailedFormPath)}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M6 18l2.5-2.5M15.5 8.5L18 6" />
          </svg>
          Use the detailed form instead
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
          </svg>
        </button>
        <h1 style={{ margin: '0 0 0.4rem', fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-main)' }}>
          What would you like to report? <Leaf size={20} style={{ marginLeft: '0.1rem' }} className="qr-header-leaf" />
        </h1>
        <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-muted)' }}>
          Help us keep our environment clean and healthy. Choose the best way to share what you found.
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

      {mode === 'landing' && documentError && <div className="qr-warning">{documentError}</div>}
      {mode === 'landing' && videoError && <div className="qr-warning">{videoError}</div>}

      {mode === 'landing' && (
        <>
          {/* Photo/Video is the highest-traffic path, so it gets a featured
              hero with its three actions exposed directly — no extra click
              into a chooser screen the way the other tiles still work. */}
          <div className="qr-hero" style={{ '--tile-accent': TILE_THEME.blue.accent }}>
            <div className="qr-hero-left">
              <span className="qr-tile-icon">{TILE_ICONS.camera}</span>
              <h3 className="qr-hero-title">Photo / Video</h3>
              <p className="qr-hero-sub">Take or upload a clear photo or video of what you found.</p>
              <div className="qr-hero-actions">
                <button type="button" className="qr-btn-primary" onClick={() => cameraInputRef.current?.click()}>
                  📷 Take a photo
                </button>
                <button type="button" className="qr-btn-outline" onClick={() => galleryInputRef.current?.click()}>
                  🖼 Choose from gallery
                </button>
                <button type="button" className="qr-btn-outline" onClick={() => videoInputRef.current?.click()}>
                  🎥 Add a video
                </button>
              </div>
            </div>
            <div className="qr-hero-art" aria-hidden="true">
              <span className="qr-hero-bracket qr-hero-bracket--tl" />
              <span className="qr-hero-bracket qr-hero-bracket--tr" />
              <span className="qr-hero-bracket qr-hero-bracket--bl" />
              <span className="qr-hero-bracket qr-hero-bracket--br" />
              <svg width="86" height="60" viewBox="0 0 86 60" fill="none" stroke="var(--secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.7">
                <circle cx="66" cy="14" r="6" />
                <path d="M2 50l20-24 14 14 12-16 24 26" />
              </svg>
              <span className="qr-hero-caption"><Leaf size={13} /> Capture what you found</span>
            </div>
          </div>

          <div className="qr-grid">
            {/* Measurement/Upload are professional-workflow tiles — kept for
                contributors (who also have the full detailed form), left out
                for citizens so their intake stays to the two lightweight
                capture modes rather than dangling stubs that dead-end into
                the same heavy form this page exists to avoid (spec §2). */}
            {!isCitizen && (
              <>
                <Tile icon="chart" theme="green" title="Measurement" sub="Enter a structured environmental measurement." onClick={openMeasurementForm} />
                <Tile icon="upload" theme="orange" title="Upload" sub="Upload an existing report, spreadsheet, or dataset." onClick={() => documentInputRef.current?.click()} />
              </>
            )}
            <Tile icon="voice" theme="violet" title="Tell Blue Mind" sub="Speak or type what happened, in your own words." onClick={() => setMode('text-choose')} />
          </div>
        </>
      )}

      {mode === 'video-describe' && (
        <StepCard accent={FLOW_ACCENT.video} icon="camera" title="Describe this video"
          sub="Blue Mind classifies your description — the clip travels along as evidence."
          onBack={() => { setMode('landing'); setVideoFile(null); setVideoPreviewUrl(null); setRawText(''); }}>
          {videoPreviewUrl && (
            <video src={videoPreviewUrl} controls style={{ maxWidth: '260px', borderRadius: 'var(--radius-md)' }} />
          )}
          <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '-0.4rem' }}>
            Briefly describe what's happening
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
          <div>
            <button type="button" className="qr-btn-primary" onClick={handleVideoDescribeSubmit} disabled={!rawText.trim()}>
              Analyze
            </button>
          </div>
        </StepCard>
      )}

      {mode === 'measurement-form' && (
        <StepCard accent={FLOW_ACCENT.measurement} icon="chart" title="Measurement" badge="Detailed"
          sub="Structured environmental readings, not AI-classified — you pick the parameters directly."
          onBack={() => setMode('landing')}
          art={(
            <svg width="80" height="70" viewBox="0 0 80 70" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M32 6h12M35 6v16l-13 26a6 6 0 005.3 8.8h21.4A6 6 0 0061 48L48 22V6" />
              <line x1="30" y1="42" x2="50" y2="42" />
              <circle cx="68" cy="14" r="2.4" fill="currentColor" stroke="none" />
              <circle cx="73" cy="24" r="1.6" fill="currentColor" stroke="none" />
              <path d="M66 34c0 4-3 5-3 9a3 3 0 006 0c0-4-3-5-3-9z" />
            </svg>
          )}
        >
          <div>
            <label className="qr-section-label">Which measurements are you logging?</label>
            {waterSubjects.length === 0 ? (
              <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)' }}>Loading parameters…</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {pickedWaterSubjects.map((s) => (
                  <div key={s.subjectId}>
                    <div className="qr-param-row">
                      <input type="checkbox" className="qr-param-checkbox" checked
                        onChange={() => toggleParam(s.code)} id={`param-${s.code}`} />
                      <label className="qr-param-label" htmlFor={`param-${s.code}`}>{s.label}</label>
                    </div>
                    <div className="qr-param-fields">
                      <input type="number" step="any" placeholder="Value" value={measurementValues[s.code].value}
                        onChange={(e) => updateParamField(s.code, 'value', e.target.value)}
                        style={{ width: '130px', padding: '0.45rem 0.6rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)',
                          background: 'var(--surface-hover)', color: 'var(--text-main)', font: 'inherit', fontSize: '0.82rem' }} />
                      <select className="qr-select" style={{ width: '100px' }} value={measurementValues[s.code].unit}
                        onChange={(e) => updateParamField(s.code, 'unit', e.target.value)}>
                        <option value={measurementValues[s.code].unit}>{measurementValues[s.code].unit || '—'}</option>
                      </select>
                    </div>
                  </div>
                ))}

                {unpickedWaterSubjects.length > 0 && (
                  <div className="qr-param-grid">
                    {unpickedWaterSubjects.map((s) => (
                      <div key={s.subjectId} className="qr-param-row">
                        <input type="checkbox" className="qr-param-checkbox" checked={false}
                          onChange={() => toggleParam(s.code)} id={`param-${s.code}`} />
                        <label className="qr-param-label" htmlFor={`param-${s.code}`}>{s.label}</label>
                        <span className="qr-info-dot" title={`Log a ${s.label.toLowerCase()} reading`}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="9" /><line x1="12" y1="11" x2="12" y2="16" /><circle cx="12" cy="8" r="0.5" fill="currentColor" />
                          </svg>
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="qr-section-label">How was this measured?</label>
            <div className="qr-radio-group">
              <label className={`qr-radio-card ${measurementSource === 'instrument' ? 'qr-radio-card--active' : ''}`}>
                <input type="radio" name="measurementSource" checked={measurementSource === 'instrument'} onChange={() => setMeasurementSource('instrument')} />
                Instrument reading
              </label>
              <label className={`qr-radio-card ${measurementSource === 'informal' ? 'qr-radio-card--active' : ''}`}>
                <input type="radio" name="measurementSource" checked={measurementSource === 'informal'} onChange={() => setMeasurementSource('informal')} />
                Informal observation
              </label>
            </div>
            {measurementSource === 'instrument' && (
              <input type="text" value={instrumentName} onChange={(e) => setInstrumentName(e.target.value)}
                placeholder="Which instrument? (e.g. YSI multiparameter probe)"
                style={{ marginTop: '0.6rem', width: '100%', padding: '0.55rem 0.7rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)',
                  background: 'var(--surface-hover)', color: 'var(--text-main)', font: 'inherit', fontSize: '0.85rem' }} />
            )}
          </div>

          <div>
            <label className="qr-section-label">Location</label>
            <MapLocationPicker value={location} lat={lat} lon={lon} onChange={handleLocationChange} />
          </div>

          <OrgContextLine
            organizationId={organizationId} organizations={organizations} orgsLoading={orgsLoading}
            addOrganization={addOrganization} onChange={setOrganizationId}
          />

          <div className="qr-notes-wrap">
            <textarea value={measurementNotes} onChange={(e) => setMeasurementNotes(e.target.value.slice(0, 500))}
              placeholder="Any additional notes? (optional)" rows={2} maxLength={500}
              style={{ width: '100%', padding: '0.65rem 0.7rem 1.3rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)',
                background: 'var(--surface-hover)', color: 'var(--text-main)', font: 'inherit', fontSize: '0.85rem', resize: 'vertical' }} />
            <span className="qr-notes-count">{measurementNotes.length} / 500</span>
          </div>

          {measurementError && <div className="qr-error">{measurementError}</div>}

          <div className="qr-submit-row">
            <button type="button" className="qr-btn-primary" onClick={handleMeasurementSubmit} disabled={!canSubmitMeasurement}>
              {measurementSubmitting ? 'Submitting…' : 'Submit measurement'}
            </button>
            <span className="qr-secure-note">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2l8 3v6c0 5-3.4 8.7-8 11-4.6-2.3-8-6-8-11V5z" />
              </svg>
              Your data is secure and used to protect our environment.
            </span>
          </div>
        </StepCard>
      )}

      {mode === 'text-choose' && (
        <StepCard accent={FLOW_ACCENT.text} icon="voice" title="Tell Blue Mind"
          sub="Speak or type what happened, in your own words." onBack={() => setMode('landing')} backDisabled={recording}>
          {recordError && <div className="qr-warning">{recordError}</div>}

          <div style={{ display: 'flex', gap: '0.7rem', flexWrap: 'wrap' }}>
            {recording ? (
              <span className="qr-btn-primary qr-recording-pill">
                <span className="qr-recording-dot" /> Recording… {String(Math.floor(recordSeconds / 60)).padStart(1, '0')}:{String(recordSeconds % 60).padStart(2, '0')}
              </span>
            ) : (
              <button type="button" className="qr-btn-primary" onClick={startRecording}>
                🎤 Record a voice note
              </button>
            )}
            <button type="button" className="qr-btn-outline" onClick={() => setMode('text')} disabled={recording}>
              ✍️ Type a note
            </button>
          </div>

          {recording && (
            <>
              <div className="qr-voice-divider" />
              <div className="qr-voice-viz">
                <div className="qr-voice-stage">
                  <VoiceBars />
                  <span className="qr-voice-rings">
                    <span className="qr-voice-ring-dotted" />
                    <span className="qr-voice-mic">
                      <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="9" y="2" width="6" height="12" rx="3" />
                        <path d="M5 11a7 7 0 0014 0" /><line x1="12" y1="18" x2="12" y2="22" /><line x1="8" y1="22" x2="16" y2="22" />
                      </svg>
                    </span>
                  </span>
                  <VoiceBars reverse />
                </div>
                <p className="qr-voice-title">Blue Mind is listening…</p>
                <p className="qr-voice-sub">Speak clearly and we'll capture the details.</p>
                <button type="button" className="qr-voice-stop" onClick={stopRecording}>
                  <span className="qr-voice-stop-dot" /> Stop recording
                </button>
              </div>
            </>
          )}
        </StepCard>
      )}

      {mode === 'text' && !draft && (
        <StepCard accent={FLOW_ACCENT.text} icon="type" title="Type a note"
          sub="Describe what happened — Blue Mind figures out the rest." onBack={() => setMode('text-choose')}>
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
          <div>
            <button type="button" className="qr-btn-primary" onClick={handleTextSubmit} disabled={!rawText.trim()}>
              Analyze
            </button>
          </div>
        </StepCard>
      )}

      {(mode === 'photo' || mode === 'text' || mode === 'voice' || mode === 'video' || mode === 'document') && inferring && (
        <div className="qr-loading-card" style={{ '--tile-accent': FLOW_ACCENT[mode] || 'var(--primary)' }}>
          {photoDataUrl && <img src={photoDataUrl} alt="Submitted evidence" style={{ maxWidth: '200px', borderRadius: 'var(--radius-md)' }} />}
          <span className="qr-spinner" aria-hidden="true" />
          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            {mode === 'voice' ? 'Blue Mind is analyzing…' : mode === 'document' ? 'Blue Mind is reading this…' : 'Blue Mind is looking at this…'}
          </span>
        </div>
      )}

      {mode === 'confirm' && draft && (
        <StepCard
          accent={FLOW_ACCENT[inputSource] || 'var(--primary)'}
          icon={FLOW_ICON[inputSource] || 'voice'}
          title="Review before you submit"
          sub="Blue Mind's best guess — fix anything that's off before sending it in."
          onBack={() => { setMode('landing'); setDraft(null); setPhotoDataUrl(null); setVideoFile(null); setVideoPreviewUrl(null); setDocumentFile(null); setRawText(''); setInferError(''); setInputSource(null); setCaptureSource(null); setExtraFields({}); }}
        >
          {photoDataUrl && <img src={photoDataUrl} alt="Submitted evidence" style={{ maxWidth: '260px', borderRadius: 'var(--radius-md)' }} />}
          {videoPreviewUrl && <video src={videoPreviewUrl} controls style={{ maxWidth: '260px', borderRadius: 'var(--radius-md)' }} />}

          {inferError && <div className="qr-warning">{inferError}</div>}

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

          {submitError && <div className="qr-error">{submitError}</div>}

          <div style={{ display: 'flex', gap: '0.6rem' }}>
            <button type="button" className="qr-btn-primary" onClick={handleSubmit} disabled={!canSubmit}>
              {submitting ? 'Submitting…' : 'Submit report'}
            </button>
            <button type="button" className="qr-btn-secondary"
              onClick={() => { setMode('landing'); setDraft(null); setPhotoDataUrl(null); setVideoFile(null); setVideoPreviewUrl(null); setDocumentFile(null); setRawText(''); setInferError(''); setInputSource(null); setCaptureSource(null); setExtraFields({}); }}>
              Start over
            </button>
          </div>
        </StepCard>
      )}

      <div className="qr-banner">
        <Leaf size={18} className="qr-banner-leaf" />
        <div className="qr-banner-item">
          <span className="qr-banner-icon" style={{ background: 'var(--primary)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2l8 3v6c0 5-3.4 8.7-8 11-4.6-2.3-8-6-8-11V5z" />
            </svg>
          </span>
          <div>
            <strong>Your report helps build a cleaner, healthier future.</strong>
            <p style={{ margin: 0 }}>All reports are reviewed and used to take real action.</p>
          </div>
        </div>
        <span className="qr-banner-divider" aria-hidden="true" />
        <div className="qr-banner-item">
          <span className="qr-banner-icon" style={{ background: 'var(--secondary)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
            </svg>
          </span>
          <div>
            <strong>Together, we make a difference.</strong>
            <p style={{ margin: 0 }}>Small actions today, big impact tomorrow.</p>
          </div>
        </div>
        <Leaf size={18} className="qr-banner-leaf" />
      </div>
    </section>
  );
}
