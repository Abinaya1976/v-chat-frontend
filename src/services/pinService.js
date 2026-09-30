import api from './api';

/**
 * Pin a chat or channel (Max 10 total combined)
 * @param {Object} params
 * @param {string} params.itemId
 * @param {'chat'|'channel'} params.itemType
 */
export const pinItem = async ({ itemId, itemType }) => {
  const response = await api.post('/users/pin-item', { itemId, itemType });
  return response.data;
};

/**
 * Unpin a chat or channel
 * @param {Object} params
 * @param {string} params.itemId
 * @param {'chat'|'channel'} [params.itemType]
 */
export const unpinItem = async ({ itemId, itemType }) => {
  const response = await api.post('/users/unpin-item', { itemId, itemType });
  return response.data;
};
