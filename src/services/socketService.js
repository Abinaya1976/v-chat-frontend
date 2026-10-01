import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

let socket = null;
let currentToken = null;

/**
 * Initialize or reuse an authenticated Socket.IO connection.
 * Forces a fresh connection if the token has changed (e.g., after logout/login).
 * @param {string} token JWT Authentication token
 */
export const connectSocket = (token) => {
  if (!token) return null;

  // If there's already a connected socket with the SAME token, reuse it
  if (socket && socket.connected && currentToken === token) {
    return socket;
  }

  // Tear down any existing socket before creating a new one
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }

  currentToken = token;

  // Create new socket connection with JWT in handshake auth
  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
  });

  return socket;
};

/**
 * Disconnect and destroy current socket connection
 */
export const disconnectSocket = () => {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
  currentToken = null;
};

// ==================== Direct Conversation Helpers ====================

export const joinConversation = (conversationId) => {
  if (socket && socket.connected && conversationId) {
    socket.emit('conversation:join', { conversationId });
  }
};

export const leaveConversation = (conversationId) => {
  if (socket && socket.connected && conversationId) {
    socket.emit('conversation:leave', { conversationId });
  }
};

export const emitTyping = (conversationId) => {
  if (socket && socket.connected && conversationId) {
    socket.emit('typing', { conversationId });
  }
};

export const emitStopTyping = (conversationId) => {
  if (socket && socket.connected && conversationId) {
    socket.emit('stop_typing', { conversationId });
  }
};

// ==================== Group Channel Helpers ====================

export const joinChannelRoom = (channelId) => {
  if (socket && socket.connected && channelId) {
    socket.emit('channel:join', { channelId });
  }
};

export const leaveChannelRoom = (channelId) => {
  if (socket && socket.connected && channelId) {
    socket.emit('channel:leave', { channelId });
  }
};

export const emitChannelTyping = (channelId) => {
  if (socket && socket.connected && channelId) {
    socket.emit('channel:typing', { channelId });
  }
};

export const emitChannelStopTyping = (channelId) => {
  if (socket && socket.connected && channelId) {
    socket.emit('channel:stop_typing', { channelId });
  }
};

export const joinCompanyRoom = (companyId) => {
  if (socket && socket.connected && companyId) {
    socket.emit('company:join', { companyId });
  }
};

/**
 * Get active socket instance
 */
export const getSocket = () => socket;
