import api from './api';

/**
 * Fetch all private notes for logged-in user with optional search or tag filter
 * @param {Object} params - { search, q, tag }
 */
export const getNotes = async (params = {}) => {
  const response = await api.get('/notes', { params });
  return response.data;
};

/**
 * Fetch single private note by ID
 * @param {string} noteId
 */
export const getNoteById = async (noteId) => {
  const response = await api.get(`/notes/${noteId}`);
  return response.data;
};

/**
 * Create a new private note
 * @param {Object} payload - { title, content, tags }
 */
export const createNote = async (payload) => {
  const response = await api.post('/notes', payload);
  return response.data;
};

/**
 * Update an existing private note
 * @param {string} noteId
 * @param {Object} payload - { title, content, tags }
 */
export const updateNote = async (noteId, payload) => {
  const response = await api.put(`/notes/${noteId}`, payload);
  return response.data;
};

/**
 * Delete a private note
 * @param {string} noteId
 */
export const deleteNote = async (noteId) => {
  const response = await api.delete(`/notes/${noteId}`);
  return response.data;
};
