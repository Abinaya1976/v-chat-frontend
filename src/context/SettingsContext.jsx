import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';
import { updateUserSettings } from '../services/settingsService';

const DEFAULT_SETTINGS = {
  notifications: {
    messages: true,
    mentions: true,
    sound: true,
  },
  appearance: {
    theme: 'light', // 'light' | 'dark' | 'system'
  },
  privacy: {
    onlineStatus: true,
    lastSeen: true,
    readReceipts: true,
  },
  chat: {
    enterToSend: true,
  },
};

const SettingsContext = createContext(null);

export const SettingsProvider = ({ children }) => {
  const { user, updateUser } = useAuth();
  const { socket } = useSocket();

  const [settings, setSettings] = useState(() => {
    return user?.settings || DEFAULT_SETTINGS;
  });
  const [saving, setSaving] = useState(false);

  // Sync state when user object loads or changes
  useEffect(() => {
    if (user?.settings) {
      setSettings((prev) => ({
        notifications: { ...DEFAULT_SETTINGS.notifications, ...user.settings.notifications },
        appearance: { ...DEFAULT_SETTINGS.appearance, ...user.settings.appearance },
        privacy: { ...DEFAULT_SETTINGS.privacy, ...user.settings.privacy },
        chat: { ...DEFAULT_SETTINGS.chat, ...user.settings.chat },
      }));
    }
  }, [user]);

  // Apply Theme (Light / Dark / System)
  useEffect(() => {
    const theme = settings.appearance?.theme || 'light';
    const root = document.documentElement;

    if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        root.classList.add('dark-theme');
      } else {
        root.classList.remove('dark-theme');
      }

      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e) => {
        if (settings.appearance?.theme === 'system') {
          if (e.matches) {
            root.classList.add('dark-theme');
          } else {
            root.classList.remove('dark-theme');
          }
        }
      };
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else if (theme === 'dark') {
      root.classList.add('dark-theme');
    } else {
      root.classList.remove('dark-theme');
    }
  }, [settings.appearance?.theme]);

  // Listen for real-time settings update from other tabs or server
  useEffect(() => {
    if (!socket) return;

    const handleSettingsUpdated = ({ settings: newSettings }) => {
      if (newSettings) {
        setSettings((prev) => ({
          notifications: { ...prev.notifications, ...newSettings.notifications },
          appearance: { ...prev.appearance, ...newSettings.appearance },
          privacy: { ...prev.privacy, ...newSettings.privacy },
          chat: { ...prev.chat, ...newSettings.chat },
        }));
      }
    };

    socket.on('user:settings_updated', handleSettingsUpdated);
    return () => {
      socket.off('user:settings_updated', handleSettingsUpdated);
    };
  }, [socket]);

  // Play notification sound helper
  const playNotificationSound = useCallback(() => {
    if (settings.notifications?.sound) {
      try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
        osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.08); // A5
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.3);
      } catch (err) {
        console.warn('Audio notification playback:', err);
      }
    }
  }, [settings.notifications?.sound]);

  // Update specific section
  const updateSettingsSection = async (sectionKey, newSectionValues) => {
    const updatedSettings = {
      ...settings,
      [sectionKey]: {
        ...settings[sectionKey],
        ...newSectionValues,
      },
    };

    // Optimistic UI update
    setSettings(updatedSettings);

    try {
      setSaving(true);
      const res = await updateUserSettings({ [sectionKey]: newSectionValues });
      if (res.success && res.user) {
        updateUser(res.user);
      }
    } catch (err) {
      console.error('Failed to save settings to database:', err);
      // Revert if error
      if (user?.settings) {
        setSettings(user.settings);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        saving,
        updateSettingsSection,
        playNotificationSound,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
