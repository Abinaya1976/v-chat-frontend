import api from './api';

// Get platform-level statistics
export const getPlatformStats = async () => {
  const res = await api.get('/super-admin/stats');
  return res.data;
};

// Get all organizations (paginated + searchable)
export const getAllOrganizations = async (params = {}) => {
  const res = await api.get('/super-admin/organizations', { params });
  return res.data;
};

// Get single organization detail
export const getOrganizationDetail = async (id) => {
  const res = await api.get(`/super-admin/organizations/${id}`);
  return res.data;
};

// Activate / Approve an organization with plan and date configuration
export const activateOrganization = async (id, payload = {}) => {
  const res = await api.patch(`/super-admin/organizations/${id}/activate`, payload);
  return res.data;
};

// Reject an organization registration request
export const rejectOrganization = async (id, payload = {}) => {
  const res = await api.patch(`/super-admin/organizations/${id}/reject`, payload);
  return res.data;
};

// Suspend an organization
export const suspendOrganization = async (id) => {
  const res = await api.patch(`/super-admin/organizations/${id}/suspend`);
  return res.data;
};

// Update subscription (plan, status, dates)
export const updateSubscription = async (id, data) => {
  const res = await api.patch(`/super-admin/organizations/${id}/subscription`, data);
  return res.data;
};

// Update feature entitlements
export const updateFeatures = async (id, features) => {
  const res = await api.patch(`/super-admin/organizations/${id}/features`, features);
  return res.data;
};
