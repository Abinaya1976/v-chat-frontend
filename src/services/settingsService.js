import api from './api';

export const getUserSettings = async () => {
  const response = await api.get('/users/profile');
  return response.data?.user?.settings || {};
};

export const updateUserSettings = async (settingsPayload) => {
  const response = await api.put('/users/settings', settingsPayload);
  return response.data;
};

export const registerFCMToken = async (fcmToken) => {
  const response = await api.post('/users/fcm-token', { fcmToken });
  return response.data;
};
