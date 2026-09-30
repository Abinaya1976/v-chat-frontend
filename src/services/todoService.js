import api from './api';

/**
 * Fetch To-Dos with view, status, priority, search, sort, and context filters
 * @param {Object} params - { view: 'all'|'my', status, priority, search, sort, conversationId, channelId }
 */
export const getTodos = async (params = {}) => {
  const response = await api.get('/todos', { params });
  return response.data;
};

/**
 * Fetch a single To-Do by ID
 * @param {string} todoId
 */
export const getTodoById = async (todoId) => {
  const response = await api.get(`/todos/${todoId}`);
  return response.data;
};

/**
 * Create a new To-Do
 * @param {Object} payload - { title, description, assignedTo, priority, dueDate, conversationId, channelId, sourceMessageId }
 */
export const createTodo = async (payload) => {
  const response = await api.post('/todos', payload);
  return response.data;
};

/**
 * Update an existing To-Do
 * @param {string} todoId
 * @param {Object} payload - { title, description, assignedTo, priority, dueDate }
 */
export const updateTodo = async (todoId, payload) => {
  const response = await api.patch(`/todos/${todoId}`, payload);
  return response.data;
};

/**
 * Toggle To-Do status (pending <-> completed)
 * @param {string} todoId
 */
export const toggleTodoStatus = async (todoId) => {
  const response = await api.patch(`/todos/${todoId}/status`);
  return response.data;
};

/**
 * Delete a To-Do (Soft deletion)
 * @param {string} todoId
 */
export const deleteTodo = async (todoId) => {
  const response = await api.delete(`/todos/${todoId}`);
  return response.data;
};
