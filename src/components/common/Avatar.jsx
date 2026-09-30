import { useState, useEffect } from 'react';

import { BotIcon, BellIcon, CalendarIcon } from './Icons';

// Helper to get initials from a person's name
const getInitials = (name) => {
  if (!name) return '?';
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

// Generates a consistent, attractive gradient background based on the name string
const getAvatarColor = (name) => {
  const gradients = [
    'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)',
    'linear-gradient(135deg, #60a5fa 0%, #2563eb 100%)',
    'linear-gradient(135deg, #0ea5e9 0%, #0369a1 100%)',
    'linear-gradient(135deg, #2dd4bf 0%, #0d9488 100%)',
    'linear-gradient(135deg, #38bdf8 0%, #6366f1 100%)',
    'linear-gradient(135deg, #818cf8 0%, #4f46e5 100%)',
  ];
  if (!name) return gradients[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % gradients.length;
  return gradients[index];
};

function Avatar({ name, image, user, size = 'medium', isGroup = false }) {
  const [imgError, setImgError] = useState(false);

  const resolvedName = name || user?.name || '';
  const resolvedImage = image || user?.avatar || '';
  const isBot = user?.isSystemBot || false;
  const botType = user?.botType || 'none';

  useEffect(() => {
    setImgError(false);
  }, [resolvedImage]);

  const initials = isGroup ? '#' : getInitials(resolvedName);
  const background = getAvatarColor(resolvedName);

  let resolvedSrc = !imgError && resolvedImage && !isBot ? (
    resolvedImage.startsWith('/uploads') && import.meta.env.VITE_BACKEND_URL
      ? `${import.meta.env.VITE_BACKEND_URL.replace(/\/$/, '')}${resolvedImage}`
      : resolvedImage
  ) : null;

  if (resolvedSrc && resolvedSrc.includes('/uploads/')) {
    const token = sessionStorage.getItem('chatapp_token');
    if (token && !resolvedSrc.includes('?token=')) {
      resolvedSrc += `?token=${token}`;
    }
  }
  
  const getBotIcon = () => {
    const iconSize = size === 'small' ? 14 : size === 'medium' ? 20 : 28;
    if (botType === 'reminder') return <BellIcon size={iconSize} color="white" />;
    if (botType === 'calendar') return <CalendarIcon size={iconSize} color="white" />;
    return <BotIcon size={iconSize} color="white" />;
  };

  return (
    <div className={`avatar-container avatar-${size}`} title={name}>
      {resolvedSrc ? (
        <img
          src={resolvedSrc}
          alt={name}
          className="avatar-img"
          onError={() => setImgError(true)}
        />
      ) : isBot ? (
        <div className="avatar-initials" style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)' }}>
          {getBotIcon()}
        </div>
      ) : (
        <div className="avatar-initials" style={{ background }}>
          {initials}
        </div>
      )}
    </div>
  );
}

export default Avatar;
