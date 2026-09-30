import api from './api';

export const getPinnedMessages = async ({ conversationId, channelId }) => {
  const response = await api.get('/pinned-messages', {
    params: { conversationId, channelId },
  });
  return response.data;
};

export const pinMessage = async (messageId) => {
  const response = await api.post(`/pinned-messages/${messageId}/pin`);
  return response.data;
};

export const unpinMessage = async (messageId) => {
  const response = await api.delete(`/pinned-messages/${messageId}/pin`);
  return response.data;
};
