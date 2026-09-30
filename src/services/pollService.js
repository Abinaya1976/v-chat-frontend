import api from './api';

// Vote or change vote on a poll
export const votePoll = async (messageId, optionIndex) => {
  const response = await api.post(`/messages/${messageId}/poll/vote`, { optionIndex });
  return response.data;
};

// Remove/unvote vote on a poll
export const unvotePoll = async (messageId) => {
  const response = await api.post(`/messages/${messageId}/poll/vote`, { optionIndex: null, action: 'unvote' });
  return response.data;
};

// Check if a poll is expired
export const isPollExpired = (expiresAt, isClosed = false) => {
  if (isClosed) return true;
  if (!expiresAt) return false;
  return new Date().getTime() > new Date(expiresAt).getTime();
};

// Format human-friendly remaining time for a poll
export const formatPollRemainingTime = (expiresAt, isClosed = false) => {
  if (isClosed) return 'Poll closed';
  if (!expiresAt) return 'No expiry date';

  const now = new Date().getTime();
  const exp = new Date(expiresAt).getTime();
  const diffMs = exp - now;

  if (diffMs <= 0) {
    return 'Poll expired';
  }

  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays >= 1) {
    const remHours = diffHours % 24;
    return `Poll expires in ${diffDays} day${diffDays > 1 ? 's' : ''}${remHours > 0 ? ` ${remHours} hr${remHours > 1 ? 's' : ''}` : ''}`;
  }

  if (diffHours >= 1) {
    const remMins = diffMinutes % 60;
    return `Poll expires in ${diffHours} hour${diffHours > 1 ? 's' : ''}${remMins > 0 ? ` ${remMins} min${remMins > 1 ? 's' : ''}` : ''}`;
  }

  if (diffMinutes >= 1) {
    return `Poll expires in ${diffMinutes} minute${diffMinutes > 1 ? 's' : ''}`;
  }

  return 'Poll expires in less than a minute';
};
