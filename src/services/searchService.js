import api from './api';

/**
 * Unified global search across messages, files, channels, and people
 * @param {string} query - Keyword query
 * @param {string} type - 'all' | 'messages' | 'files' | 'channels' | 'users'
 * @param {number} page - Page index (default 1)
 * @param {number} limit - Items per category (default 20)
 */
export const searchAll = async (query, type = 'all', page = 1, limit = 20) => {
  const response = await api.get('/search', {
    params: {
      q: query,
      type,
      page,
      limit,
    },
  });
  return response.data;
};

/**
 * Advanced message search with filters
 * @param {Object} params - { q, messageType, channelId, conversationId, senderId, page, limit }
 */
export const searchMessages = async (params = {}) => {
  const response = await api.get('/search/messages', {
    params,
  });
  return response.data;
};
