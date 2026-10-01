import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import {
  connectSocket,
  disconnectSocket,
  joinCompanyRoom,
  joinConversation,
  leaveConversation,
  emitTyping,
  emitStopTyping,
  joinChannelRoom,
  leaveChannelRoom,
  emitChannelTyping,
  emitChannelStopTyping,
} from '../services/socketService';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { token, user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUserIds, setOnlineUserIds] = useState(new Set());
  const [lastSeenByUserId, setLastSeenByUserId] = useState({});

  useEffect(() => {
    if (!token || !user) {
      disconnectSocket();
      setSocket(null);
      setIsConnected(false);
      setOnlineUserIds(new Set());
      return;
    }

    const socketInstance = connectSocket(token);
    setSocket(socketInstance);

    const onConnect = () => {
      console.log('Socket connected to server');
      setIsConnected(true);
    };

    const onDisconnect = (reason) => {
      console.log('Socket disconnected:', reason);
      setIsConnected(false);
    };

    const onUsersOnline = ({ onlineUserIds = [] }) => {
      setOnlineUserIds(new Set(onlineUserIds));
    };

    const onUserOnline = ({ userId }) => {
      setOnlineUserIds((prev) => {
        const next = new Set(prev);
        next.add(userId);
        return next;
      });
    };

    const onUserOffline = ({ userId, lastSeenAt }) => {
      setOnlineUserIds((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
      if (userId && lastSeenAt) setLastSeenByUserId((prev) => ({ ...prev, [userId]: lastSeenAt }));
    };

    socketInstance.on('connect', onConnect);
    socketInstance.on('disconnect', onDisconnect);
    socketInstance.on('users:online', onUsersOnline);
    socketInstance.on('user:online', onUserOnline);
    socketInstance.on('user:offline', onUserOffline);

    // Initial check if already connected
    if (socketInstance.connected) {
      setIsConnected(true);
    }

    return () => {
      socketInstance.off('connect', onConnect);
      socketInstance.off('disconnect', onDisconnect);
      socketInstance.off('users:online', onUsersOnline);
      socketInstance.off('user:online', onUserOnline);
      socketInstance.off('user:offline', onUserOffline);
      disconnectSocket();
      setSocket(null);
      setIsConnected(false);
    };
  }, [token, user]);

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        onlineUserIds,
        lastSeenByUserId,
        joinCompanyRoom,
        joinConversation,
        leaveConversation,
        emitTyping,
        emitStopTyping,
        joinChannelRoom,
        leaveChannelRoom,
        emitChannelTyping,
        emitChannelStopTyping,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    return {
      socket: null,
      isConnected: false,
      onlineUserIds: new Set(),
      lastSeenByUserId: {},
      joinCompanyRoom: () => {},
      joinConversation: () => {},
      leaveConversation: () => {},
      emitTyping: () => {},
      emitStopTyping: () => {},
      joinChannelRoom: () => {},
      leaveChannelRoom: () => {},
      emitChannelTyping: () => {},
      emitChannelStopTyping: () => {},
    };
  }
  return context;
};
