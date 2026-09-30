import api from './api';

// Admin: Create employee invitation
export const createInvitation = async (email) => {
  const response = await api.post('/invitations', { email });
  return response.data;
};

// Admin: Get all invitations for current organization
export const getOrgInvitations = async (params = {}) => {
  const response = await api.get('/invitations/org', { params });
  return response.data;
};

// Admin: Revoke pending invitation
export const revokeInvitation = async (invitationId) => {
  const response = await api.delete(`/invitations/${invitationId}`);
  return response.data;
};

// User: Get all pending invitations matching current user email
export const getMyInvitations = async () => {
  const response = await api.get('/invitations/my');
  return response.data;
};

// User: Accept an invitation
export const acceptInvitation = async (invitationId) => {
  const response = await api.post(`/invitations/${invitationId}/accept`);
  return response.data;
};

// User: Decline an invitation
export const declineInvitation = async (invitationId) => {
  const response = await api.post(`/invitations/${invitationId}/decline`);
  return response.data;
};

// Public: Validate invitation token from Brevo email link
export const validateInvitationToken = async (token) => {
  const response = await api.get(`/invitations/validate-token/${token}`);
  return response.data;
};

// User: Accept invitation by token
export const acceptInvitationByToken = async (token) => {
  const response = await api.post('/invitations/accept-by-token', { token });
  return response.data;
};

