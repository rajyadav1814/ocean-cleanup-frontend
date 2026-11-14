import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { authUpdateProfile, authDeleteAccount } from '../../../services/api';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import Select from '../../../components/common/Select';

const DELETE_PHRASE = 'DELETE';

// Attention popup shown before the account is deleted. Typing the phrase is
// required so a stray click can't remove the account.
function DeleteAccountModal({ onConfirm, onCancel, loading, error }) {
  const [phrase, setPhrase] = useState('');
  const canDelete = phrase.trim().toUpperCase() === DELETE_PHRASE && !loading;

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && !loading) onCancel(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [loading, onCancel]);

  return (
    <div
      onClick={() => !loading && onCancel()}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
      }}
    >
      <div
        className="card"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-account-title"
        onClick={e => e.stopPropagation()}
        style={{ width: '100%', maxWidth: '460px', padding: '2rem' }}
      >
        <div style={{
          width: '56px', height: '56px', borderRadius: '50%', marginBottom: '1rem',
          background: 'rgba(239, 68, 68, 0.12)', color: 'var(--danger)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <AlertTriangle size={28} />
        </div>
        <h3 id="delete-account-title" style={{ fontSize: '1.25rem', color: 'var(--text-main)', marginBottom: '0.5rem' }}>
          Delete your account?
        </h3>
        <p className="text-muted" style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>
          This permanently deletes your account and signs you out. You won't be able to recover it.
        </p>
        <ul style={{ fontSize: '0.875rem', color: 'var(--text-muted)', paddingLeft: '1.25rem', marginBottom: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <li>Your profile, login sessions, points and notifications are deleted.</li>
          <li>Your organization memberships and verifier profile are removed.</li>
          <li>Reports you submitted stay on the shared map but are no longer linked to you.</li>
        </ul>

        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem', border: '1px solid rgba(239, 68, 68, 0.2)', fontSize: '0.875rem' }}>
            {error}
          </div>
        )}

        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
          <label htmlFor="delete-confirm">
            Type <strong style={{ color: 'var(--danger)' }}>{DELETE_PHRASE}</strong> to confirm
          </label>
          <input
            id="delete-confirm"
            type="text"
            className="input-field"
            value={phrase}
            onChange={e => setPhrase(e.target.value)}
            placeholder={DELETE_PHRASE}
            autoComplete="off"
            autoFocus
            disabled={loading}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <button type="button" className="secondary" onClick={onCancel} disabled={loading}>
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={!canDelete}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              background: 'var(--danger)', color: '#fff', border: 'none',
              opacity: canDelete ? 1 : 0.5, cursor: canDelete ? 'pointer' : 'not-allowed'
            }}
          >
            <Trash2 size={16} />
            {loading ? 'Deleting…' : 'Delete permanently'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ProfileSettings() {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    jobTitle: user?.jobTitle || '',
    yearsExperience: user?.yearsExperience || '',
    profileImageUrl: user?.profileImageUrl || ''
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const fileInputRef = useRef(null);

  const handleDeleteAccount = async () => {
    setDeleting(true);
    setDeleteError('');
    try {
      const res = await authDeleteAccount();
      if (!res.ok) {
        setDeleteError(res.message || 'Failed to delete account');
        return;
      }
      logout();
      navigate('/', { replace: true, state: { flashMessage: 'Your account has been deleted.', flashDuration: 4000 } });
    } catch (err) {
      setDeleteError('An error occurred while deleting your account.');
    } finally {
      setDeleting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError('Image size must be less than 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, profileImageUrl: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');

    try {
      const res = await authUpdateProfile(formData);
      if (res.ok) {
        setMessage('Profile updated successfully');
        updateUser(res.user);
      } else {
        setError(res.message || 'Failed to update profile');
      }
    } catch (err) {
      setError('An error occurred while saving.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-container" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div className="page-header" style={{ marginBottom: '2rem' }}>
        <h1 className="page-title">Profile Settings</h1>
        <p className="page-subtitle">Manage your personal information and preferences.</p>
      </div>

      <div className="card" style={{ padding: '2.5rem' }}>
        {message && (
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
            {message}
          </div>
        )}
        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

          {/* Avatar Section */}
          <div className="profile-avatar-section">
            <div
              style={{
                width: '100px',
                height: '100px',
                borderRadius: '50%',
                background: formData.profileImageUrl ? `url(${formData.profileImageUrl}) center/cover no-repeat` : 'var(--surface-hover)',
                border: '2px dashed var(--border-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                color: 'var(--text-muted)'
              }}
            >
              {!formData.profileImageUrl && (
                <span style={{ fontSize: '2rem', fontWeight: 600 }}>
                  {user?.displayInitial || 'U'}
                </span>
              )}
            </div>
            <div>
              <h3 style={{ marginBottom: '0.5rem', fontSize: '1rem', color: 'var(--text-main)' }}>Profile Picture</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                Upload a professional photo. Max size 2MB.
              </p>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  type="button"
                  className="secondary"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Upload New
                </button>
                {formData.profileImageUrl && (
                  <button
                    type="button"
                    style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 500 }}
                    onClick={() => setFormData(prev => ({ ...prev, profileImageUrl: '' }))}
                  >
                    Remove
                  </button>
                )}
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageChange}
                accept="image/*"
                style={{ display: 'none' }}
              />
            </div>
          </div>

          <div className="profile-form-grid">
            <div className="form-group">
              <label htmlFor="firstName">First Name</label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                value={formData.firstName}
                onChange={handleChange}
                placeholder="Enter first name"
                className="input-field"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="lastName">Last Name</label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                value={formData.lastName}
                onChange={handleChange}
                placeholder="Enter last name"
                className="input-field"
                required
              />
            </div>
          </div>

          <div className="profile-form-grid">
            <div className="form-group">
              <label htmlFor="jobTitle">Ocean Interest</label>
              <input
                id="jobTitle"
                name="jobTitle"
                type="text"
                value={formData.jobTitle}
                onChange={handleChange}
                placeholder="e.g. Marine biologist, Conservation officer"
                className="input-field"
              />
            </div>
            <div className="form-group">
              <label htmlFor="yearsExperience">Ocean Experience</label>
              <Select
                id="yearsExperience"
                value={formData.yearsExperience}
                onChange={(v) => setFormData(prev => ({ ...prev, yearsExperience: v }))}
                placeholder="Select experience"
                options={['Less than 1 year', '1–2 years', '2–5 years', '5+ years']}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '1rem', borderTop: '1px solid var(--border-light)' }}>
            <button
              type="submit"
              className="primary"
              disabled={saving}
              style={{ minWidth: '140px' }}
            >
              {saving ? 'Saving Changes...' : 'Save Changes'}
            </button>
          </div>

        </form>

        <div className="profile-danger-zone">
          <div className="profile-danger-icon">
            <Trash2 size={28} />
          </div>
          <div className="profile-danger-text">
            <h3>Delete Account</h3>
            <p>Permanently delete your account and all associated data.</p>
            <p className="profile-danger-warning">
              <AlertTriangle size={16} />
              This action cannot be undone.
            </p>
          </div>
          <button
            type="button"
            className="profile-danger-button"
            onClick={() => { setDeleteError(''); setShowDeleteModal(true); }}
          >
            <Trash2 size={16} />
            Delete Account
          </button>
        </div>
      </div>

      {showDeleteModal && (
        <DeleteAccountModal
          onConfirm={handleDeleteAccount}
          onCancel={() => setShowDeleteModal(false)}
          loading={deleting}
          error={deleteError}
        />
      )}
    </div>
  );
}
