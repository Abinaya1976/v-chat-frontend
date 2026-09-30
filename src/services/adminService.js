import api from './api';

// 1. Workspace Statistics
export const getWorkspaceStats = async () => {
  const response = await api.get('/admin/stats');
  return response.data;
};

// 2. User Management
export const getAdminUsers = async (params = {}) => {
  const response = await api.get('/admin/users', { params });
  return response.data;
};

export const updateAdminUserRole = async (userId, role) => {
  const response = await api.patch(`/admin/users/${userId}/role`, { role });
  return response.data;
};

export const updateAdminUserStatus = async (userId, status) => {
  const response = await api.patch(`/admin/users/${userId}/status`, { status });
  return response.data;
};

export const updateAdminUserPermissions = async (userId, permissions) => {
  const response = await api.patch(`/admin/users/${userId}/permissions`, { permissions });
  return response.data;
};

export const inviteAdminUser = async (email) => {
  const response = await api.post('/invitations', { email });
  return response.data;
};

// 2B. Invitations Management
export const getAdminInvitations = async (params = {}) => {
  const response = await api.get('/invitations/org', { params });
  return response.data;
};

export const createAdminInvitation = async (email) => {
  const response = await api.post('/invitations', { email });
  return response.data;
};

export const revokeAdminInvitation = async (invitationId) => {
  const response = await api.delete(`/invitations/${invitationId}`);
  return response.data;
};

// Legacy Join Requests (deprecated)
export const getAdminJoinRequests = async (params = {}) => {
  const response = await api.get('/admin/join-requests', { params });
  return response.data;
};

export const approveAdminJoinRequest = async (requestId) => {
  const response = await api.post(`/admin/join-requests/${requestId}/approve`);
  return response.data;
};

export const rejectAdminJoinRequest = async (requestId) => {
  const response = await api.post(`/admin/join-requests/${requestId}/reject`);
  return response.data;
};

// 3. Channel Management
export const getAdminChannels = async (params = {}) => {
  const response = await api.get('/admin/channels', { params });
  return response.data;
};

export const createAdminChannel = async (data) => {
  const response = await api.post('/admin/channels', data);
  return response.data;
};

export const updateAdminChannel = async (channelId, data) => {
  const response = await api.patch(`/admin/channels/${channelId}`, data);
  return response.data;
};

export const deleteAdminChannel = async (channelId) => {
  const response = await api.delete(`/admin/channels/${channelId}`);
  return response.data;
};

export const getAdminChannelMembers = async (channelId) => {
  const response = await api.get(`/admin/channels/${channelId}/members`);
  return response.data;
};

export const addAdminChannelMember = async (channelId, userId) => {
  const response = await api.post(`/admin/channels/${channelId}/members/${userId}`);
  return response.data;
};

export const removeAdminChannelMember = async (channelId, userId) => {
  const response = await api.delete(`/admin/channels/${channelId}/members/${userId}`);
  return response.data;
};

// 4. Message Moderation
export const getAdminMessages = async (params = {}) => {
  const response = await api.get('/admin/messages', { params });
  return response.data;
};

export const deleteAdminMessage = async (messageId) => {
  const response = await api.delete(`/admin/messages/${messageId}`);
  return response.data;
};

// 5. Audit Logging
export const getAdminAuditLogs = async (params = {}) => {
  const response = await api.get('/admin/audit-logs', { params });
  return response.data;
};

// 6. Organization Settings
export const getAdminOrganizationSettings = async () => {
  const response = await api.get('/admin/settings');
  return response.data;
};

export const updateAdminOrganizationSettings = async (settings) => {
  const response = await api.patch('/admin/settings', settings);
  return response.data;
};
