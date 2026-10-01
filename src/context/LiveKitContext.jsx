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
  const [callContextName, setCallContextName] = useState('');
  
  const incomingCallRef = React.useRef(null);
  useEffect(() => {
    incomingCallRef.current = incomingLiveKitCall;
  }, [incomingLiveKitCall]);

  const startCall = async ({ roomName, participantName, conversationId, channelId, audioOnly = false, contextName = '' }) => {
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
        setCallContextName(contextName);
        setIsCalling(true);
      }
    } catch (error) {
      console.error('Error starting LiveKit call:', error);
      alert('Could not start video call. Please try again.');
    }
  };

  const joinCall = startCall;

  const endCall = () => {
    if (socket && liveKitRoomName) {
      socket.emit('livekit:leave_call', { roomId: liveKitRoomName });
    }
    setLiveKitToken(null);
    setLiveKitRoomName(null);
    setIsCalling(false);
    setIsAudioOnly(false);
  };

  useEffect(() => {
    if (!socket) return;
    const handleIncomingInvite = (data) => {
      setIncomingLiveKitCall(data);
    };
    const handleCallEnded = (data) => {
      setIncomingLiveKitCall((prev) => {
        if (prev && prev.roomId === data.roomId) {
          return null; // clear it if the call ended!
        }
        return prev;
      });
    };
    socket.on('livekit:incoming_invite', handleIncomingInvite);
    socket.on('livekit:call_ended', handleCallEnded);

    return () => {
      socket.off('livekit:incoming_invite', handleIncomingInvite);
      socket.off('livekit:call_ended', handleCallEnded);
    };
  }, [socket]);

  const acceptLiveKitCall = () => {
    if (incomingLiveKitCall && user) {
      joinCall({
        roomName: incomingLiveKitCall.roomId,
        participantName: user.name || 'User',
        channelId: incomingLiveKitCall.channelId,
        conversationId: incomingLiveKitCall.conversationId,
        audioOnly: incomingLiveKitCall.audioOnly,
        contextName: incomingLiveKitCall.contextName
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

  useEffect(() => {
    const handleJoinLiveKitCall = (e) => {
      let { roomId, channelId, conversationId, isInitiating, contextName, audioOnly } = e.detail;

      if (incomingCallRef.current && incomingCallRef.current.roomId === roomId) {
        audioOnly = incomingCallRef.current.audioOnly;
        isInitiating = false;
        setIncomingLiveKitCall(null);
      }

      if (user) {
        const joinWithState = (authoritativeAudioOnly) => {
          joinCall({
            roomName: roomId,
            participantName: user.name || 'User',
            channelId,
            conversationId,
            audioOnly: authoritativeAudioOnly,
            contextName
          });
        };

        if (isInitiating && socket) {
          let callbackFired = false;
          const fallbackTimeout = setTimeout(() => {
            if (!callbackFired) joinWithState(audioOnly);
          }, 1000);

          if (channelId) {
            socket.emit('livekit:start_channel_call', {
              channelId,
              roomId,
              contextName,
              audioOnly
            }, (response) => {
              callbackFired = true;
              clearTimeout(fallbackTimeout);
              joinWithState(response && response.audioOnly !== undefined ? response.audioOnly : audioOnly);
            });
          } else if (conversationId) {
            socket.emit('livekit:start_group_call', {
              conversationId,
              roomId,
              contextName,
              audioOnly
            }, (response) => {
              callbackFired = true;
              clearTimeout(fallbackTimeout);
              joinWithState(response && response.audioOnly !== undefined ? response.audioOnly : audioOnly);
            });
          }
        } else {
          joinWithState(audioOnly);
        }
      }
    };

    window.addEventListener('join-livekit-call', handleJoinLiveKitCall);
    return () => window.removeEventListener('join-livekit-call', handleJoinLiveKitCall);
  }, [user, socket]);

  return (
    <LiveKitContext.Provider value={{ 
      liveKitToken, 
      liveKitRoomName, 
      isCalling, 
      isAudioOnly,
      callContextName,
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
