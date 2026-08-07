import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authSignup, apiGet } from '../../../services/api';

const STEPS = [
  { label: 'Personal details', title: 'Tell us about yourself', description: 'Start with the details we need to set up your BlueMind profile.' },
  { label: 'Access type', title: 'Choose how you’ll participate', description: 'Select the experience that best matches how you want to use BlueMind.' },
  { label: 'Account security', title: 'Secure your account', description: 'Choose the credentials you’ll use to access your workspace.' },
  { label: 'Profile details', title: 'Complete your profile', description: 'A few optional details help make your profile more useful.' },
  { label: 'Profile preview', title: 'Review your profile', description: 'Everything looks ready. Create your account when you’re happy with the details.' }
];

export default function Signup() {
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', username: '', password: '', role: 'citizen',
    organizationId: '', jobTitle: '', experience: '', walletAddress: ''
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
    document.documentElement.setAttribute('data-theme', 'dark');
    return () => {
      const savedTheme = localStorage.getItem('theme') || 'dark';
      document.documentElement.setAttribute('data-theme', savedTheme);
    };
  }, []);

  useEffect(() => {
    apiGet('/api/dashboard/organizations')
      .then((data) => { if (data.ok) setOrganizations(data.organizations || []); })
      .catch(() => {})
      .finally(() => setOrgsLoading(false));
  }, []);

  const set = (field) => (event) => setForm((previous) => ({ ...previous, [field]: event.target.value }));
  const selectedOrganization = organizations.find((organization) => organization.orgId === form.organizationId)?.name || 'Not specified';

  const nextStep = () => {
    if (step === 1 && (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim())) {
      setError('Please complete your name and email address.');
      return;
    }
    if (step === 3 && (!form.username.trim() || !form.password || !form.confirmPassword)) {
      setError('Please choose a username and confirm your password.');
      return;
    }
    if (step === 3 && form.password !== form.confirmPassword) {
      setError('Your passwords do not match.');
      return;
    }
    setError('');
    setStep((current) => Math.min(current + 1, STEPS.length));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (step < STEPS.length) {
      nextStep();
      return;
    }

    setError('');
    setLoading(true);
    try {
      const { experience, confirmPassword, ...payload } = form;
      payload.yearsExperience = experience || null;
      delete payload.experience;
      // Citizens share the established contributor workspace in the current API.
      if (payload.role === 'citizen') payload.role = 'contributor';
      if (!payload.organizationId) delete payload.organizationId;
      const data = await authSignup(payload);
      if (data.ok) {
        navigate('/login', { replace: true, state: { flashMessage: 'Account created successfully' } });
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
    <div className="auth-container">
      <header className="auth-header"><Link to="/" className="brand-wordmark" aria-label="BlueMind home">BLUEMIND</Link></header>

      <div className="signup-flow">
        <div className="signup-progress" aria-label={`Step ${step} of ${STEPS.length}: ${currentStep.label}`}>
          <div className="signup-stepper">{STEPS.map((item, index) => <span key={item.label} className={index < step ? 'is-active' : ''} />)}</div>
          <p>Step {step} of {STEPS.length} <span>—</span> {currentStep.label}</p>
        </div>

        <div className="card auth-card signup-card">
          <div className="signup-panel-heading"><h2>{currentStep.title}</h2><p>{currentStep.description}</p></div>
          {error && <p className="auth-error">{error}</p>}

          <form onSubmit={handleSubmit} className="signup-form">
            {step === 1 && <section className="signup-panel">
              <div className="signup-name-grid">
                <div className="form-group"><label htmlFor="first-name">First name</label><input id="first-name" type="text" placeholder="John" value={form.firstName} onChange={set('firstName')} autoComplete="given-name" required /></div>
                <div className="form-group"><label htmlFor="last-name">Last name</label><input id="last-name" type="text" placeholder="Doe" value={form.lastName} onChange={set('lastName')} autoComplete="family-name" required /></div>
              </div>
              <div className="form-group"><label htmlFor="signup-email">Email address</label><input id="signup-email" type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} autoComplete="email" required /></div>
            </section>}

            {step === 2 && <section className="signup-panel" aria-label="Select your access type">
              <button type="button" className={`signup-role-card ${form.role === 'citizen' ? 'is-selected' : ''}`} onClick={() => setForm((previous) => ({ ...previous, role: 'citizen' }))}><strong>Citizen</strong><span>Explore the map and support BlueMind activities in your community.</span></button>
              <button type="button" className={`signup-role-card ${form.role === 'contributor' ? 'is-selected' : ''}`} onClick={() => setForm((previous) => ({ ...previous, role: 'contributor' }))}><strong>Contributor</strong><span>Log activities and help build BlueMind’s impact map.</span></button>
            </section>}

            {step === 3 && <section className="signup-panel">
              <div className="form-group"><label htmlFor="signup-username">Username</label><input id="signup-username" type="text" placeholder="Choose a username" value={form.username} onChange={set('username')} autoComplete="username" required /></div>
              <div className="form-group"><label htmlFor="signup-password">Choose password</label><div className="password-field"><input id="signup-password" type={showPassword ? 'text' : 'password'} placeholder="Create a password" value={form.password} onChange={set('password')} autoComplete="new-password" required /><button type="button" className="password-visibility" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 3 18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.9 4.2A10.8 10.8 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.1 3.1M6.1 6.1A18.4 18.4 0 0 0 1 12s4 8 11 8a10.8 10.8 0 0 0 5.9-1.7" /></svg> : <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12Z" /><circle cx="12" cy="12" r="3" /></svg>}</button></div></div>
              <div className="form-group"><label htmlFor="confirm-password">Confirm password</label><div className="password-field"><input id="confirm-password" type={showConfirmation ? 'text' : 'password'} placeholder="Confirm your password" value={form.confirmPassword || ''} onChange={set('confirmPassword')} autoComplete="new-password" required /><button type="button" className="password-visibility" onClick={() => setShowConfirmation((visible) => !visible)} aria-label={showConfirmation ? 'Hide password confirmation' : 'Show password confirmation'}>{showConfirmation ? <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 3 18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.9 4.2A10.8 10.8 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.1 3.1M6.1 6.1A18.4 18.4 0 0 0 1 12s4 8 11 8a10.8 10.8 0 0 0 5.9-1.7" /></svg> : <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12Z" /><circle cx="12" cy="12" r="3" /></svg>}</button></div></div>
            </section>}

            {step === 4 && <section className="signup-panel">
              <div className="form-group"><label htmlFor="job-title">Current job title <em>(optional)</em></label><input id="job-title" type="text" placeholder="e.g. Community coordinator" value={form.jobTitle} onChange={set('jobTitle')} /></div>
              <div className="form-group"><label htmlFor="experience">Years of experience <em>(optional)</em></label><select id="experience" value={form.experience} onChange={set('experience')}><option value="">Select experience</option><option value="Less than 1 year">Less than 1 year</option><option value="1–2 years">1–2 years</option><option value="2–5 years">2–5 years</option><option value="5+ years">5+ years</option></select></div>
              <div className="form-group"><label htmlFor="organization">Organization <em>(optional)</em></label><select id="organization" value={form.organizationId} onChange={set('organizationId')} disabled={orgsLoading}><option value="">{orgsLoading ? 'Loading…' : 'Select organization'}</option>{organizations.map((organization) => <option key={organization.orgId} value={organization.orgId}>{organization.name}</option>)}</select></div>
            </section>}

            {step === 5 && <section className="signup-panel">
              <div className="profile-preview">
                <div className="profile-preview-avatar" aria-hidden="true">{`${form.firstName[0] || ''}${form.lastName[0] || ''}` || 'B'}</div>
                <div><strong>{form.firstName} {form.lastName}</strong><span>@{form.username}</span></div>
              </div>
              <div className="signup-review">
                <div><span>Email</span><strong>{form.email}</strong></div>
                <div><span>Job title</span><strong>{form.jobTitle || 'Not specified'}</strong></div>
                <div><span>Experience</span><strong>{form.experience || 'Not specified'}</strong></div>
                <div><span>Organization</span><strong>{selectedOrganization}</strong></div>
              </div>
              <div className="form-group"><label htmlFor="wallet-address">Wallet address <em>(optional)</em></label><input id="wallet-address" type="text" placeholder="addr_test1qz..." value={form.walletAddress} onChange={set('walletAddress')} /></div>
            </section>}

            <div className="signup-actions">
              <button type="button" className="secondary" onClick={() => { setError(''); setStep((current) => Math.max(1, current - 1)); }} disabled={step === 1}>Back</button>
              <button type="submit" disabled={loading}>{loading ? 'Creating account…' : step === STEPS.length ? 'Create account' : 'Continue'}</button>
            </div>
          </form>
          <p className="auth-switch">Already have an account? <Link to="/login">Sign in</Link></p>
        </div>
      </div>
    </div>
  );
}
