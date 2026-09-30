import api from './api';

// Fetch all conversations for the authenticated user
export const getConversations = async () => {
  const response = await api.get('/conversations');
  return response.data;
};

// Create or retrieve an existing 1-on-1 conversation with another user
export const createOrGetConversation = async (receiverId) => {
  const response = await api.post('/conversations', { receiverId });
  return response.data;
};

// Get all messages for a specific conversation (with optional pagination params)
export const getMessages = async (conversationId, params = {}) => {
  const response = await api.get(`/conversations/${conversationId}/messages`, {
    params,
  });
  return response.data;
};

// Send a message inside a conversation (supports string content or FormData with attachments)
export const sendMessage = async (conversationId, payload, replyTo = null) => {
  if (payload instanceof FormData) {
    if (replyTo) {
      payload.append('replyTo', replyTo);
    }
    const response = await api.post(`/conversations/${conversationId}/messages`, payload, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }

  const body = {
    content: typeof payload === 'string' ? payload : (payload.content || ''),
    ...(typeof payload === 'object' && payload.poll ? { poll: payload.poll, messageType: 'poll' } : {}),
  };
  if (replyTo) {
    body.replyTo = replyTo;
  }

  const response = await api.post(`/conversations/${conversationId}/messages`, body);
  return response.data;
};

// Edit an existing message
export const editMessage = async (messageId, content) => {
  const response = await api.patch(`/messages/${messageId}`, { content });
  return response.data;
};

// Soft delete a message for everyone
export const deleteMessage = async (messageId) => {
  const response = await api.delete(`/messages/${messageId}`);
  return response.data;
};

// Delete a message for me only
export const deleteMessageForMe = async (messageId) => {
  const response = await api.post(`/messages/${messageId}/delete-for-me`);
  return response.data;
};

// Forward a message to another conversation or channel
export const forwardMessage = async (messageId, targetData) => {
  const response = await api.post(`/messages/${messageId}/forward`, targetData);
  return response.data;
};

// Mark an incoming message as read
export const markMessageAsRead = async (messageId) => {
  const response = await api.patch(`/messages/${messageId}/read`);
  return response.data;
};

export const markMessagesAsRead = async (messageIds) => {
  const response = await api.patch('/messages/read', { messageIds });
  return response.data;
};

export const getMessage = async (messageId) => {
  const response = await api.get(`/messages/${messageId}`);
  return response.data;
};

// Level 15: Add a reaction to a message
export const addReaction = async (messageId, emoji) => {
  const response = await api.post(`/messages/${messageId}/reactions`, { emoji });
  return response.data;
};

// Level 15: Remove a reaction from a message
export const removeReaction = async (messageId, emoji) => {
  const response = await api.delete(`/messages/${messageId}/reactions/${encodeURIComponent(emoji)}`);
  return response.data;
};

// Fetch registered team users for the Contacts directory
export const getTeamUsers = async () => {
  const response = await api.get('/users');
  return response.data;
};
