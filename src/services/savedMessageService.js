import api from './api';

export const getSavedMessages = async (params = {}) => {
  const response = await api.get('/saved-messages', { params });
  return response.data;
};

export const saveMessage = async (messageId) => {
  const response = await api.post(`/saved-messages/${messageId}/save`);
  return response.data;
};

export const unsaveMessage = async (messageId) => {
  const response = await api.delete(`/saved-messages/${messageId}/save`);
  return response.data;
};
