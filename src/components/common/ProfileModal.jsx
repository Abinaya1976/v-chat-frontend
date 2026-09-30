import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../common/Avatar';

function ProfileModal({ isOpen, onClose }) {
  const { user, updateProfile } = useAuth();

  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [title, setTitle] = useState('');
  const [phone, setPhone] = useState('');
  const [avatar, setAvatar] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const fileInputRef = useRef(null);

  // Initialize data when modal opens or user updates
  useEffect(() => {
    if (isOpen && user) {
      setName(user.name || '');
      setBio(user.bio || '');
      setTitle(user.title || '');
      setPhone(user.phone || '');
      setAvatar(user.avatar || '');
      setPreviewUrl(user.avatar || '');
      setSelectedFile(null);
      setError(null);
      setSuccess(false);
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file (PNG, JPG, WebP, etc.)');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('Image file size must be less than 5MB');
        return;
      }
      setSelectedFile(file);
      setError(null);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleRemoveAvatar = () => {
    setSelectedFile(null);
    setPreviewUrl('');
    setAvatar('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      let result;
      if (selectedFile) {
        const formData = new FormData();
        formData.append('name', name.trim());
        formData.append('bio', bio.trim());
        formData.append('title', title.trim());
        formData.append('phone', phone.trim());
        formData.append('avatar', selectedFile);
        result = await updateProfile(formData);
      } else {
        result = await updateProfile({
          name: name.trim(),
          bio: bio.trim(),
          title: title.trim(),
          phone: phone.trim(),
          avatar: previewUrl ? avatar : '',
        });
      }

      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          onClose();
        }, 800);
      } else {
        setError(result.error || result.message || 'Failed to update profile');
      }
    } catch (err) {
      setError(err.message || 'Server error updating profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="modal-content profile-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="modal-title-row">
            <h3>Profile Details</h3>
          </div>
          <button
            type="button"
            className="btn-modal-close"
            onClick={onClose}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="profile-modal-form">
          <div className="profile-modal-body">
            {error && <div className="alert alert-error">{error}</div>}
            {success && <div className="alert alert-success">Profile updated successfully!</div>}

            {/* Avatar Section */}
            <div className="profile-avatar-section">
              <div className="profile-avatar-preview-wrap">
                <Avatar
                  name={name || user?.name || 'User'}
                  image={previewUrl}
                  size="large"
                />
              </div>

              <div className="profile-avatar-controls">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  style={{ display: 'none' }}
                  id="profile-avatar-input"
                />
                <label
                  htmlFor="profile-avatar-input"
                  className="btn-secondary-sm"
                  style={{ cursor: 'pointer' }}
                >
                  📷 Change Picture
                </label>
                {(previewUrl || avatar) && (
                  <button
                    type="button"
                    className="btn-text-danger-sm"
                    onClick={handleRemoveAvatar}
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>

            {/* Full Name */}
            <div className="form-group">
              <label htmlFor="profile-name" className="form-label">
                Full Name <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                id="profile-name"
                type="text"
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                required
              />
            </div>

            {/* Job Title / Position */}
            <div className="form-group">
              <label htmlFor="profile-title" className="form-label">
                Job Title / Position
              </label>
              <input
                id="profile-title"
                type="text"
                className="form-input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Software Engineer, Designer, Product Manager"
              />
            </div>

            {/* Email Address (Read-only for security) */}
            <div className="form-group">
              <label htmlFor="profile-email" className="form-label">
                Email Address
              </label>
              <input
                id="profile-email"
                type="email"
                className="form-input"
                value={user?.email || ''}
                disabled
                style={{ opacity: 0.7, cursor: 'not-allowed', background: 'var(--hover-bg)' }}
              />
            </div>

            {/* Bio / About */}
            <div className="form-group">
              <label htmlFor="profile-bio" className="form-label">
                Bio / About Me
              </label>
              <textarea
                id="profile-bio"
                className="form-input form-textarea"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell your team about yourself..."
                rows={3}
                style={{ resize: 'vertical' }}
              />
            </div>

            {/* Phone Number */}
            <div className="form-group">
              <label htmlFor="profile-phone" className="form-label">
                Phone Number
              </label>
              <input
                id="profile-phone"
                type="tel"
                className="form-input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 000-0000"
              />
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn-cancel"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading || success}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ProfileModal;
