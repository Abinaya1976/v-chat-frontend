import api from './api';

// Fetch all channels accessible to the user
export const getChannels = async () => {
  const response = await api.get('/channels');
  return response.data;
};

// Fetch channel details by ID
export const getChannel = async (channelId) => {
  const response = await api.get(`/channels/${channelId}`);
  return response.data;
};

// Create a new channel
export const createChannel = async ({ name, description, isPrivate = false, isAdminOnly = false }) => {
  const response = await api.post('/channels', {
    name,
    description,
    isPrivate,
    isAdminOnly,
  });
  return response.data;
};

// Join a public channel
export const joinChannel = async (channelId) => {
  const response = await api.post(`/channels/${channelId}/join`);
  return response.data;
};

// Leave a channel
export const leaveChannel = async (channelId) => {
  const response = await api.post(`/channels/${channelId}/leave`);
  return response.data;
};

// Add members to a channel
export const addChannelMembers = async (channelId, userIds) => {
  const payload = Array.isArray(userIds) ? { userIds } : { userIds: [userIds] };
  const response = await api.post(`/channels/${channelId}/members`, payload);
  return response.data;
};

// Promote a channel member to Channel Admin
export const promoteChannelAdmin = async (channelId, userId) => {
  const response = await api.post(`/channels/${channelId}/admins`, { userId });
  return response.data;
};

// Update channel details (name, description, isAdminOnly)
export const updateChannel = async (channelId, { name, description, isAdminOnly }) => {
  const response = await api.put(`/channels/${channelId}`, { name, description, isAdminOnly });
  return response.data;
};

export const updateChannelSetting = async (channelId, settings) => {
  const response = await api.patch(`/channels/${channelId}/settings`, settings);
  return response.data;
};

// Get message history for a channel (with optional pagination params)
export const getChannelMessages = async (channelId, params = {}) => {
  const response = await api.get(`/channels/${channelId}/messages`, {
    params,
  });
  return response.data;
};

// Send a message inside a channel (supports string content or FormData with attachments)
export const sendChannelMessage = async (channelId, payload, replyTo = null) => {
  if (payload instanceof FormData) {
    if (replyTo) {
      payload.append('replyTo', replyTo);
    }
    const response = await api.post(`/channels/${channelId}/messages`, payload, {
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

  const response = await api.post(`/channels/${channelId}/messages`, body);
  return response.data;
};

// Get organization settings for channel creation policies
export const getOrganizationSettings = async () => {
  const response = await api.get('/channels/settings/organization');
  return response.data;
};
