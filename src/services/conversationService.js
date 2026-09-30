import api from './api';

export const markConversationAsRead = async (conversationId) => {
  const response = await api.patch(`/conversations/${conversationId}/read`);
  return response.data;
};

export const updateConversationSetting = async (conversationId, settings) => {
  const response = await api.patch(`/conversations/${conversationId}/settings`, settings);
  return response.data;
};
