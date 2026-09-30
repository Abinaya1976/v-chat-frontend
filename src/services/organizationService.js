import api from './api';

// Create a new company/organization
export const createOrganization = async (data) => {
  const response = await api.post('/organizations', data);
  return response.data;
};

// Get all organizations the current user belongs to
export const getMyOrganizations = async () => {
  const response = await api.get('/organizations/my');
  return response.data;
};

// Switch active organization
export const switchOrganization = async (orgId) => {
  const response = await api.post(`/organizations/${orgId}/switch`);
  return response.data;
};

