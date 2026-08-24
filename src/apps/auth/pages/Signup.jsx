import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, ArrowRight, ArrowLeft, User, Mail, Lock, Briefcase, Building2, CheckCircle2 } from 'lucide-react';
import { authSignup, authCheckEmail, apiGet } from '../../../services/api';

const STEPS = [
  { label: 'Personal details',  title: <>Tell us <span className="serif">about yourself.</span></>,           description: 'Start with the basics.' },
  { label: 'Access type',       title: <>Choose how you'll <span className="serif">participate.</span></>,    description: 'Select the role that best fits you.' },
  { label: 'Account security',  title: <>Secure <span className="serif">your account.</span></>,              description: "Pick credentials you'll remember." },
  { label: 'Profile details',   title: <>Complete <span className="serif">your profile.</span></>,            description: 'Optional — helps others find you.' },
  { label: 'Review',            title: <>Review <span className="serif">your profile.</span></>,              description: "Everything looks good? Let's go." },
];

const TOKENS = `
  @import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600&family=Instrument+Serif:ital@0;1&display=swap');

  .bm-signup {
    --navy:       #071B33;
    --ocean:      #0A4F83;
    --marine:     #14669E;
    --cobalt:     #0B82C9;
    --sky:        #7FC3E8;
    --sky-2:      #A9D8F0;
    --teal:       #2E9E9B;
    --teal-light: #6FC9C4;
    --on-dark:    #F2F7FA;
    --on-dark-2:  rgba(233,242,247,.68);
    --on-dark-3:  rgba(233,242,247,.46);
    --line-dark:  rgba(160,210,240,.18);
    --font-sans:  'Instrument Sans', ui-sans-serif, system-ui, -apple-system, sans-serif;
    --font-serif: 'Instrument Serif', ui-serif, Georgia, serif;

    position: fixed;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: clamp(1.5rem, 4vw, 3rem) 1.25rem;
    font-family: var(--font-sans);
    color: var(--on-dark);
    background:
      radial-gradient(90% 60% at 78% 6%,  #17587F 0%, transparent 58%),
      radial-gradient(95% 70% at 10% 100%, #0A4F83 0%, transparent 62%),
      linear-gradient(172deg, #05192E 0%, #072744 44%, #08395F 100%);
    overflow: hidden auto;
  }

  /* reset */
  .bm-signup *, .bm-signup *::before, .bm-signup *::after { box-sizing: border-box; }
  .bm-signup form  { display: block; gap: unset; text-align: unset; }
  .bm-signup label { all: unset; }
  .bm-signup input, .bm-signup select {
    all: unset;
    box-sizing: border-box;
    font-family: var(--font-sans);
  }

  /* grid bg */
  .bm-signup__grid {
    position: fixed; inset: -10%; z-index: 0; pointer-events: none;
    background-image:
      linear-gradient(rgba(255,255,255,.04) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,.04) 1px, transparent 1px);
    background-size: 70px 70px;
    mask-image: radial-gradient(65% 55% at 50% 40%, #000 0%, transparent 75%);
    -webkit-mask-image: radial-gradient(65% 55% at 50% 40%, #000 0%, transparent 75%);
  }
  .bm-signup__signal { position: fixed; width: 5px; height: 5px; border-radius: 50%; background: var(--sky); box-shadow: 0 0 9px 1px rgba(127,195,232,.45); animation: bmsigPulse 5.5s ease infinite; }
  @keyframes bmsigPulse { 0%,100% { opacity: .18; } 50% { opacity: .8; } }

  /* card */
  .bm-signup__card {
    position: relative; z-index: 2;
    width: 100%; max-width: 600px;
    border: 1px solid var(--line-dark); border-radius: 16px;
    background: linear-gradient(180deg, rgba(255,255,255,.055), rgba(255,255,255,.02));
    backdrop-filter: blur(18px) saturate(1.3);
    padding: clamp(1.75rem, 3vw, 2.5rem);
    box-shadow: 0 40px 80px -30px rgba(3,12,22,.65);
  }

  /* logo */
  .bm-signup__logo { display: inline-flex; align-items: center; gap: .55rem; font-size: .95rem; font-weight: 600; letter-spacing: -.02em; color: var(--on-dark); margin-bottom: 1.5rem; text-decoration: none; }

  /* stepper */
  .bm-signup__stepper { display: flex; gap: .4rem; margin-bottom: 1.4rem; }
  .bm-signup__step-dot {
    flex: 1; height: 3px; border-radius: 99px;
    background: var(--line-dark);
    transition: background .3s ease;
  }
  .bm-signup__step-dot.active { background: var(--teal-light); }

  .bm-signup__step-label { font-size: .75rem; color: var(--on-dark-3); letter-spacing: .06em; text-transform: uppercase; margin-bottom: .3rem; }
  .bm-signup__card h2 { margin: 0 0 .25rem; font-size: clamp(1.4rem, 1.2rem + 1vw, 1.7rem); font-weight: 500; letter-spacing: -.03em; color: #fff; line-height: 1.15; }
  .bm-signup__card h2 .serif { font-family: var(--font-serif); font-style: italic; font-weight: 400; color: #fff; }
  .bm-signup__desc { font-size: .88rem; color: var(--on-dark-2); margin: 0 0 1.4rem; }

  /* error */
  .bm-signup__error {
    margin-bottom: 1rem; padding: .65rem .9rem; border-radius: 8px;
    background: rgba(239,68,68,.12); border: 1px solid rgba(239,68,68,.25);
    color: #fca5a5; font-size: .85rem; line-height: 1.4;
  }

  /* fields */
  .bm-signup__field { position: relative; margin-bottom: 1rem; }
  .bm-signup__field label { display: block; font-size: .8rem; font-weight: 500; color: var(--on-dark-2); margin-bottom: .4rem; letter-spacing: .01em; }
  .bm-signup__field label em { font-style: normal; color: var(--on-dark-3); font-weight: 400; }
  .bm-signup__field input,
  .bm-signup__field select {
    display: block; width: 100%;
    padding: .8rem .95rem .8rem 2.5rem;
    border-radius: 10px;
    background: rgba(4,18,31,.55) !important;
    border: 1px solid var(--line-dark) !important;
    color: var(--on-dark) !important;
    font-size: .9rem; font-family: var(--font-sans);
    transition: border-color .2s ease, background .2s ease;
    min-height: unset !important;
  }
  .bm-signup__field input::placeholder { color: var(--on-dark-3) !important; }
  .bm-signup__field input:-webkit-autofill,
  .bm-signup__field input:-webkit-autofill:hover,
  .bm-signup__field input:-webkit-autofill:focus,
  .bm-signup__field input:-webkit-autofill:active {
    -webkit-box-shadow: 0 0 0 30px #061727 inset !important;
    -webkit-text-fill-color: var(--on-dark) !important;
    transition: background-color 5000s ease-in-out 0s;
  }
  .bm-signup__field select option { background: #0d1e2f; color: var(--on-dark); }
  .bm-signup__field input:focus,
  .bm-signup__field select:focus {
    outline: none !important;
    border-color: var(--cobalt) !important;
    background: rgba(4,18,31,.75) !important;
    box-shadow: 0 0 0 3px rgba(11,130,201,.18) !important;
  }
  .bm-signup__field--no-icon input,
  .bm-signup__field--no-icon select { padding-left: .95rem; }

  .bm-signup__field-icon { position: absolute; left: .85rem; bottom: .85rem; color: var(--on-dark-3); pointer-events: none; }

  /* two-col grid */
  .bm-signup__grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 0 .85rem; }

  /* role cards */
  .bm-signup__roles { display: flex; flex-direction: column; gap: .7rem; margin-bottom: 1rem; }
  button.bm-signup__role {
    display: flex; flex-direction: column; align-items: flex-start; gap: .3rem;
    width: 100%; padding: 1rem 1.1rem; border-radius: 12px; cursor: pointer;
    border: 1.5px solid var(--line-dark);
    background: rgba(4,18,31,.45);
    text-align: left; transition: border-color .2s, background .2s;
    font-family: var(--font-sans);
  }
  button.bm-signup__role:hover { border-color: rgba(127,195,232,.4); background: rgba(4,18,31,.6); }
  button.bm-signup__role.selected { border-color: var(--teal-light); background: rgba(46,158,155,.1); }
  button.bm-signup__role strong { font-size: .95rem; color: #fff; font-weight: 600; }
  button.bm-signup__role span { font-size: .82rem; color: var(--on-dark-2); line-height: 1.45; }

  /* review */
  .bm-signup__avatar {
    width: 3.25rem; height: 3.25rem; border-radius: 50%; flex-shrink: 0;
    background: linear-gradient(135deg, var(--teal-light), var(--teal));
    display: flex; align-items: center; justify-content: center;
    font-size: 1.1rem; font-weight: 700; color: #04121F;
  }
  .bm-signup__preview { display: flex; align-items: center; gap: .9rem; margin-bottom: 1.25rem; }
  .bm-signup__preview strong { display: block; font-size: 1rem; color: #fff; }
  .bm-signup__preview span { font-size: .85rem; color: var(--on-dark-3); }
  .bm-signup__review { border-top: 1px solid var(--line-dark); }
  .bm-signup__review-row {
    display: flex; justify-content: space-between; align-items: center;
    padding: .65rem 0; border-bottom: 1px solid var(--line-dark);
    font-size: .86rem;
  }
  .bm-signup__review-row span { color: var(--on-dark-3); }
  .bm-signup__review-row strong { color: var(--on-dark); }

  /* actions */
  .bm-signup__actions { display: flex; gap: .75rem; margin-top: 1.4rem; }
  button.bm-signup__back {
    flex-shrink: 0; padding: .8rem 1.2rem; border-radius: 999px;
    border: 1px solid var(--line-dark); background: transparent; cursor: pointer;
    color: var(--on-dark-2); font-family: var(--font-sans); font-size: .85rem;
    display: flex; align-items: center; gap: .4rem;
    transition: border-color .2s, color .2s;
  }
  button.bm-signup__back:hover { border-color: var(--sky); color: var(--on-dark); }
  button.bm-signup__back:disabled { opacity: .35; cursor: not-allowed; }

  button.bm-signup__next {
    flex: 1; padding: .85rem 1.5rem; border-radius: 999px;
    border: none; cursor: pointer;
    background: linear-gradient(135deg, var(--teal-light), var(--teal));
    color: #04121F; font-family: var(--font-sans); font-size: .88rem;
    font-weight: 600; letter-spacing: .05em; text-transform: uppercase;
    display: flex; align-items: center; justify-content: center; gap: .5rem;
    box-shadow: 0 14px 28px -10px rgba(46,158,155,.5);
    transition: transform .2s ease, box-shadow .2s ease, opacity .2s;
    line-height: 1;
  }
  button.bm-signup__next:hover { transform: translateY(-1px); box-shadow: 0 18px 32px -10px rgba(46,158,155,.6); }
  button.bm-signup__next:disabled { opacity: .65; cursor: not-allowed; }

  /* spinner */
  .bm-signup__spinner {
    width: 15px; height: 15px; border: 2px solid rgba(4,18,31,.3); border-top-color: #04121F;
    border-radius: 50%; animation: bmspin .65s linear infinite; flex-shrink: 0;
  }
  @keyframes bmspin { to { transform: rotate(360deg); } }

  /* foot */
  .bm-signup__foot { text-align: center; font-size: .86rem; color: var(--on-dark-2); margin-top: 1.1rem; }
  .bm-signup__foot a { color: var(--sky-2); font-weight: 500; text-decoration: none; }
  .bm-signup__foot a:hover { color: #fff; }

  @media (max-width: 480px) {
    .bm-signup__grid2 { grid-template-columns: 1fr; }
    .bm-signup__actions { flex-direction: column; }
    button.bm-signup__back { width: 100%; justify-content: center; }
  }
  @media (prefers-reduced-motion: reduce) {
    .bm-signup__signal, .bm-signup__spinner { animation: none; }
  }
`;

function Logo() {
  return (
    <Link to="/" className="bm-signup__logo" aria-label="BlueMind home">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="9.25" stroke="currentColor" strokeWidth="1.4" />
        <path d="M2.9 9.6h18.2M2.9 14.4h18.2" stroke="currentColor" strokeWidth="1.1" opacity=".55" />
        <path d="M12 2.75c2.6 2.6 3.9 5.7 3.9 9.25S14.6 18.65 12 21.25c-2.6-2.6-3.9-5.7-3.9-9.25S9.4 5.35 12 2.75Z" stroke="currentColor" strokeWidth="1.1" opacity=".55" />
      </svg>
      Bluemind
    </Link>
  );
}

const eyeToggleStyle = (isAbsolute = true) => ({
  position: isAbsolute ? 'absolute' : 'static',
  right: '.7rem', bottom: '.75rem',
  background: 'none', border: 'none',
  color: 'rgba(233,242,247,.46)',
  cursor: 'pointer', padding: '.25rem',
  display: 'grid', placeItems: 'center',
  lineHeight: 0,
});

export default function Signup() {
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', username: '',
    password: '', role: 'citizen', organizationId: '',
    jobTitle: '', experience: '', walletAddress: '',
  });
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [organizations, setOrganizations] = useState([]);
  const [orgsLoading, setOrgsLoading] = useState(true);
  const navigate = useNavigate();
  const currentStep = STEPS[step - 1];

  useEffect(() => {
    apiGet('/api/dashboard/organizations')
      .then((data) => { if (data.ok) setOrganizations(data.organizations || []); })
      .catch(() => {})
      .finally(() => setOrgsLoading(false));
  }, []);

  const set = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const selectedOrganization = organizations.find((o) => o.orgId === form.organizationId)?.name || 'Not specified';

  const nextStep = async () => {
    if (step === 1 && (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim())) {
      setError('Please complete your name and email address.'); return;
    }
    if (step === 1) {
      setError('');
      setLoading(true);
      try {
        const data = await authCheckEmail(form.email.trim());
        if (!data.ok) {
          setError(data.message || 'Unable to check email availability.');
          return;
        }
        if (!data.available) {
          setError('Email already exists');
          return;
        }
      } catch {
        setError('Unable to check email availability. Please try again.');
        return;
      } finally {
        setLoading(false);
      }
    }
    if (step === 3 && (!form.username.trim() || !form.password || !form.confirmPassword)) {
      setError('Please choose a username and confirm your password.'); return;
    }
    if (step === 3 && form.password !== form.confirmPassword) {
      setError('Your passwords do not match.'); return;
    }
    setError('');
    setStep((s) => Math.min(s + 1, STEPS.length));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (step < STEPS.length) { await nextStep(); return; }
    setError(''); setLoading(true);
    try {
      const { confirmPassword, experience, ...payload } = form;
      payload.yearsExperience = experience || null;
      if (!payload.organizationId) delete payload.organizationId;
      const data = await authSignup(payload);
      if (data.ok) {
        navigate('/login', {
          replace: true,
          state: {
            flashMessage: 'Account created! A verification email has been sent — please check your inbox (or spam folder) to verify your account.',
            flashDuration: 6000,
          },
        });
      } else {
        setError(data.message || 'Signup failed');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bm-signup">
      <style>{TOKENS}</style>
      <div className="bm-signup__grid" aria-hidden="true" />
      <span className="bm-signup__signal" style={{ left: '8%',  top: '15%' }} aria-hidden="true" />
      <span className="bm-signup__signal" style={{ left: '88%', top: '70%', animationDelay: '2.1s' }} aria-hidden="true" />
      <span className="bm-signup__signal" style={{ left: '82%', top: '18%', animationDelay: '3.8s' }} aria-hidden="true" />

      <div className="bm-signup__card">
        <Logo />

        {/* stepper dots */}
        <div className="bm-signup__stepper" aria-label={`Step ${step} of ${STEPS.length}`}>
          {STEPS.map((s, i) => (
            <div key={s.label} className={`bm-signup__step-dot${i < step ? ' active' : ''}`} />
          ))}
        </div>

        <p className="bm-signup__step-label">Step {step} of {STEPS.length} — {currentStep.label}</p>
        <h2>{currentStep.title}</h2>
        <p className="bm-signup__desc">{currentStep.description}</p>

        {error && <div className="bm-signup__error">{error}</div>}

        <form onSubmit={handleSubmit}>
          {/* ── Step 1: Personal details ── */}
          {step === 1 && (
            <div>
              <div className="bm-signup__grid2">
                <div className="bm-signup__field">
                  <label htmlFor="su-first">First name</label>
                  <div style={{ position: 'relative' }}>
                    <User size={15} className="bm-signup__field-icon" />
                    <input id="su-first" type="text" placeholder="John" value={form.firstName} onChange={set('firstName')} autoComplete="given-name" required />
                  </div>
                </div>
                <div className="bm-signup__field">
                  <label htmlFor="su-last">Last name</label>
                  <div style={{ position: 'relative' }}>
                    <User size={15} className="bm-signup__field-icon" />
                    <input id="su-last" type="text" placeholder="Doe" value={form.lastName} onChange={set('lastName')} autoComplete="family-name" required />
                  </div>
                </div>
              </div>
              <div className="bm-signup__field">
                <label htmlFor="su-email">Email address</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={15} className="bm-signup__field-icon" />
                  <input id="su-email" type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} autoComplete="email" required />
                </div>
              </div>
            </div>
          )}

          {/* ── Step 2: Role selection ── */}
          {step === 2 && (
            <div className="bm-signup__roles">
              <button
                type="button"
                className={`bm-signup__role${form.role === 'citizen' ? ' selected' : ''}`}
                onClick={() => setForm((p) => ({ ...p, role: 'citizen' }))}
              >
                <strong>Citizen</strong>
                <span>Explore the map and support BlueMind activities in your community.</span>
              </button>
              <button
                type="button"
                className={`bm-signup__role${form.role === 'contributor' ? ' selected' : ''}`}
                onClick={() => setForm((p) => ({ ...p, role: 'contributor' }))}
              >
                <strong>Contributor</strong>
                <span>Log activities and help build BlueMind's impact map.</span>
              </button>
            </div>
          )}

          {/* ── Step 3: Security ── */}
          {step === 3 && (
            <div>
              <div className="bm-signup__field">
                <label htmlFor="su-username">Username</label>
                <div style={{ position: 'relative' }}>
                  <User size={15} className="bm-signup__field-icon" />
                  <input id="su-username" type="text" placeholder="Choose a username" value={form.username} onChange={set('username')} autoComplete="username" required />
                </div>
              </div>
              <div className="bm-signup__field">
                <label htmlFor="su-password">Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={15} className="bm-signup__field-icon" />
                  <input id="su-password" type={showPassword ? 'text' : 'password'} placeholder="Create a password" value={form.password} onChange={set('password')} autoComplete="new-password" required />
                  <button type="button" style={eyeToggleStyle()} onClick={() => setShowPassword((v) => !v)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              <div className="bm-signup__field">
                <label htmlFor="su-confirm">Confirm password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={15} className="bm-signup__field-icon" />
                  <input id="su-confirm" type={showConfirmation ? 'text' : 'password'} placeholder="Confirm your password" value={form.confirmPassword || ''} onChange={set('confirmPassword')} autoComplete="new-password" required />
                  <button type="button" style={eyeToggleStyle()} onClick={() => setShowConfirmation((v) => !v)} aria-label={showConfirmation ? 'Hide confirm' : 'Show confirm'}>
                    {showConfirmation ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Step 4: Profile details ── */}
          {step === 4 && (
            <div>
              <div className="bm-signup__field">
                <label htmlFor="su-job">Current job title <em>(optional)</em></label>
                <div style={{ position: 'relative' }}>
                  <Briefcase size={15} className="bm-signup__field-icon" />
                  <input id="su-job" type="text" placeholder="e.g. Community coordinator" value={form.jobTitle} onChange={set('jobTitle')} />
                </div>
              </div>
              <div className="bm-signup__field bm-signup__field--no-icon">
                <label htmlFor="su-experience">Years of experience <em>(optional)</em></label>
                <select id="su-experience" value={form.experience} onChange={set('experience')}>
                  <option value="">Select experience</option>
                  <option value="Less than 1 year">Less than 1 year</option>
                  <option value="1–2 years">1–2 years</option>
                  <option value="2–5 years">2–5 years</option>
                  <option value="5+ years">5+ years</option>
                </select>
              </div>
              <div className="bm-signup__field bm-signup__field--no-icon">
                <label htmlFor="su-org">Organization <em>(optional)</em></label>
                <div style={{ position: 'relative' }}>
                  <Building2 size={15} className="bm-signup__field-icon" style={{ bottom: '.85rem' }} />
                  <select id="su-org" value={form.organizationId} onChange={set('organizationId')} disabled={orgsLoading} style={{ paddingLeft: '2.5rem' }}>
                    <option value="">{orgsLoading ? 'Loading…' : 'Select organization'}</option>
                    {organizations.map((o) => (
                      <option key={o.orgId} value={o.orgId}>{o.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* ── Step 5: Review ── */}
          {step === 5 && (
            <div>
              <div className="bm-signup__preview">
                <div className="bm-signup__avatar">
                  {`${form.firstName[0] || ''}${form.lastName[0] || ''}` || 'B'}
                </div>
                <div>
                  <strong>{form.firstName} {form.lastName}</strong>
                  <span>@{form.username}</span>
                </div>
              </div>
              <div className="bm-signup__review">
                {[
                  ['Email', form.email],
                  ['Role', form.role.charAt(0).toUpperCase() + form.role.slice(1)],
                  ['Job title', form.jobTitle || 'Not specified'],
                  ['Experience', form.experience || 'Not specified'],
                  ['Organization', selectedOrganization],
                ].map(([label, value]) => (
                  <div className="bm-signup__review-row" key={label}>
                    <span>{label}</span>
                    <strong>{value}</strong>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Actions ── */}
          <div className="bm-signup__actions">
            <button
              type="button"
              className="bm-signup__back"
              onClick={() => { setError(''); setStep((s) => Math.max(1, s - 1)); }}
              disabled={step === 1}
            >
              <ArrowLeft size={14} /> Back
            </button>
            <button type="submit" className="bm-signup__next" disabled={loading}>
              {loading ? (
                <><span className="bm-signup__spinner" /> {step === 1 ? 'Checking email…' : 'Creating…'}</>
              ) : step === STEPS.length ? (
                <><CheckCircle2 size={15} /> Create account</>
              ) : (
                <>Continue <ArrowRight size={14} /></>
              )}
            </button>
          </div>
        </form>

        <p className="bm-signup__foot">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
