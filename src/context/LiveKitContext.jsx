import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';

const LiveKitContext = createContext();

export const useLiveKit = () => useContext(LiveKitContext);

export const LiveKitProvider = ({ children }) => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [liveKitToken, setLiveKitToken] = useState(null);
  const [liveKitRoomName, setLiveKitRoomName] = useState(null);
  const [isCalling, setIsCalling] = useState(false);
  const [isAudioOnly, setIsAudioOnly] = useState(false);
  const [incomingLiveKitCall, setIncomingLiveKitCall] = useState(null);
  const [callStartTime, setCallStartTime] = useState(0);

  const startCall = async ({ roomName, participantName, conversationId, channelId, audioOnly = false }) => {
    try {
      const { data } = await api.post('/livekit/token', {
        roomName,
        participantName,
        conversationId,
        channelId
      });
      if (data.success && data.token) {
        setLiveKitToken(data.token);
        setLiveKitRoomName(roomName);
        setIsAudioOnly(audioOnly);
        setIsCalling(true);
        setCallStartTime(Date.now());
      }
    } catch (error) {
      console.error('Error starting LiveKit call:', error);
      alert('Could not start video call. Please try again.');
    }
  };

  const joinCall = startCall;

  const endCall = () => {
    if (isCalling && Date.now() - callStartTime < 3000) {
      alert('Could not establish connection to the LiveKit Server.\n\nPlease ensure your LiveKit development server is running locally at ws://localhost:7880, or configure VITE_LIVEKIT_URL in your .env file.');
    }
    setLiveKitToken(null);
    setLiveKitRoomName(null);
    setIsCalling(false);
    setIsAudioOnly(false);
  };

  useEffect(() => {
    const handleJoinLiveKitCall = (e) => {
      const { roomId, channelId, conversationId, isInitiating, contextName, audioOnly } = e.detail;
      if (user) {
        if (isInitiating && socket) {
          if (channelId) {
            socket.emit('livekit:start_channel_call', {
              channelId,
              roomId,
              contextName,
              audioOnly
            });
          } else if (conversationId) {
            socket.emit('livekit:start_group_call', {
              conversationId,
              roomId,
              contextName,
              audioOnly
            });
          }
        }
        joinCall({
          roomName: roomId,
          participantName: user.name || 'User',
          channelId,
          conversationId,
          audioOnly
        });
      }
    };
    
    window.addEventListener('join-livekit-call', handleJoinLiveKitCall);
    return () => window.removeEventListener('join-livekit-call', handleJoinLiveKitCall);
  }, [user, socket]);

  useEffect(() => {
    if (!socket) return;
    const handleIncomingInvite = (data) => {
      setIncomingLiveKitCall(data);
    };
    socket.on('livekit:incoming_invite', handleIncomingInvite);
    return () => socket.off('livekit:incoming_invite', handleIncomingInvite);
  }, [socket]);

  const acceptLiveKitCall = () => {
    if (incomingLiveKitCall && user) {
      joinCall({
        roomName: incomingLiveKitCall.roomId,
        participantName: user.name || 'User',
        channelId: incomingLiveKitCall.channelId,
        conversationId: incomingLiveKitCall.conversationId,
        audioOnly: incomingLiveKitCall.audioOnly
      });
      if (socket) {
        socket.emit('livekit:accept', {
          inviterId: incomingLiveKitCall.inviterId,
          roomId: incomingLiveKitCall.roomId
        });
      }
      setIncomingLiveKitCall(null);
    }
  };

  const declineLiveKitCall = () => {
    if (incomingLiveKitCall && socket) {
      socket.emit('livekit:decline', {
        inviterId: incomingLiveKitCall.inviterId,
        roomId: incomingLiveKitCall.roomId
      });
    }
    setIncomingLiveKitCall(null);
  };

  return (
    <LiveKitContext.Provider value={{ 
      liveKitToken, 
      liveKitRoomName, 
      isCalling, 
      isAudioOnly,
      incomingLiveKitCall,
      startCall, 
      joinCall, 
      endCall,
      acceptLiveKitCall,
      declineLiveKitCall
    }}>
      {children}
    </LiveKitContext.Provider>
  );
};
