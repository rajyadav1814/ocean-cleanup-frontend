import { useState, useRef } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { authUpdateProfile } from '../../../services/api';
import LoadingSpinner from '../../../components/common/LoadingSpinner';

export default function ProfileSettings() {
  const { user, updateUser } = useAuth();
  
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
  
  const fileInputRef = useRef(null);

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
          <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border-light)' }}>
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div className="form-group">
              <label htmlFor="jobTitle">Job Title</label>
              <input
                id="jobTitle"
                name="jobTitle"
                type="text"
                value={formData.jobTitle}
                onChange={handleChange}
                placeholder="e.g. Marine Biologist"
                className="input-field"
              />
            </div>
            <div className="form-group">
              <label htmlFor="yearsExperience">Years of Experience</label>
              <input
                id="yearsExperience"
                name="yearsExperience"
                type="text"
                value={formData.yearsExperience}
                onChange={handleChange}
                placeholder="e.g. 5"
                className="input-field"
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
              {saving ? <LoadingSpinner size="sm" color="white" /> : 'Save Changes'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
