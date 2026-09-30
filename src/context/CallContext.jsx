import { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { useSocket } from './SocketContext';

const CallContext = createContext(null);

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export const CallProvider = ({ children }) => {
  const { socket } = useSocket();
  const [callState, setCallState] = useState('idle'); // 'idle', 'ringing', 'in-call', 'calling'
  const [incomingCall, setIncomingCall] = useState(null); // { callerId, callerName, callerAvatar, callType }
  const [remoteUser, setRemoteUser] = useState(null); // { id, name, avatar }
  const [callType, setCallType] = useState('audio'); // 'audio', 'video'
  
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  const peerConnection = useRef(null);
  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);

  // Reset all call state and stop tracks
  const resetCall = useCallback(() => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop());
      screenStreamRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }
    setLocalStream(null);
    setRemoteStream(null);
    setCallState('idle');
    setIncomingCall(null);
    setRemoteUser(null);
    setIsAudioMuted(false);
    setIsVideoMuted(false);
    setIsScreenSharing(false);
  }, []);

  const getMediaStream = async (type) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: type === 'video',
      });
      localStreamRef.current = stream;
      setLocalStream(stream);
      return stream;
    } catch (err) {
      console.error('Error accessing media devices:', err);
      alert('Could not access camera/microphone. Please check permissions.');
      return null;
    }
  };

  const createPeerConnection = (targetId) => {
    const pc = new RTCPeerConnection(ICE_SERVERS);

    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('call:ice-candidate', {
          targetId,
          candidate: event.candidate,
        });
      }
    };

    pc.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
    };

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current);
      });
    }

    peerConnection.current = pc;
    return pc;
  };

  const initiateCall = async (targetUser, type = 'audio', conversationId = null) => {
    if (callState !== 'idle') return;
    setRemoteUser(targetUser);
    setCallType(type);
    setCallState('calling');

    const stream = await getMediaStream(type);
    if (!stream) {
      resetCall();
      return;
    }

    if (socket) {
      socket.emit('call:request', {
        receiverId: targetUser.id || targetUser._id,
        callType: type,
        conversationId: conversationId || targetUser.conversationId || null,
      });
    }
  };

  const acceptCall = async () => {
    if (!incomingCall) return;
    const { callerId, callType: type, callerName, callerAvatar, conversationId } = incomingCall;
    
    setRemoteUser({ id: callerId, name: callerName, avatar: callerAvatar });
    setCallType(type);
    setCallState('in-call');

    const stream = await getMediaStream(type);
    if (!stream) {
      rejectCall();
      return;
    }

    if (socket) {
      socket.emit('call:accept', { callerId, conversationId });
    }
    setIncomingCall(null);
  };

  const rejectCall = () => {
    if (incomingCall && socket) {
      socket.emit('call:reject', {
        callerId: incomingCall.callerId,
        conversationId: incomingCall.conversationId,
        callType: incomingCall.callType,
      });
    }
    resetCall();
  };

  const endCall = () => {
    if (remoteUser && socket) {
      socket.emit('call:end', {
        targetId: remoteUser.id || remoteUser._id,
        callType,
      });
    }
    resetCall();
  };

  const toggleAudio = () => {
    const stream = localStreamRef.current || localStream;
    if (stream) {
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    const stream = localStreamRef.current || localStream;
    if (stream) {
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        const nextEnabled = !videoTrack.enabled;
        videoTrack.enabled = nextEnabled;
        setIsVideoMuted(!nextEnabled);
      }
    }
  };

  const stopScreenShare = useCallback(async () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop());
      screenStreamRef.current = null;
    }

    const cameraTrack = localStreamRef.current?.getVideoTracks()[0];
    if (peerConnection.current && cameraTrack) {
      try {
        const senders = peerConnection.current.getSenders();
        const videoSender = senders.find(
          (s) => s.track?.kind === 'video' || s.track === null
        );
        if (videoSender) {
          await videoSender.replaceTrack(cameraTrack);
        }
      } catch (err) {
        console.error('Error restoring camera track on stop screen share:', err);
      }
    }

    if (localStreamRef.current) {
      setLocalStream(localStreamRef.current);
    }
    setIsScreenSharing(false);
  }, []);

  const startScreenShare = async () => {
    if (callType !== 'video' || callState !== 'in-call') return;
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const screenTrack = screenStream.getVideoTracks()[0];
      if (!screenTrack) return;

      screenStreamRef.current = screenStream;

      if (peerConnection.current) {
        const senders = peerConnection.current.getSenders();
        const videoSender = senders.find(
          (s) => s.track?.kind === 'video' || s.track === null
        );
        if (videoSender) {
          await videoSender.replaceTrack(screenTrack);
        }
      }

      screenTrack.onended = () => {
        stopScreenShare();
      };

      const audioTrack = localStreamRef.current?.getAudioTracks()[0];
      const previewStream = new MediaStream([
        screenTrack,
        ...(audioTrack ? [audioTrack] : []),
      ]);
      setLocalStream(previewStream);
      setIsScreenSharing(true);
    } catch (err) {
      console.warn('Screen sharing cancelled or failed:', err);
    }
  };

  // Socket Listeners
  useEffect(() => {
    if (!socket) return;

    const handleIncoming = (data) => {
      if (callState !== 'idle') {
        // Already in a call, automatically reject (busy)
        socket.emit('call:reject', { callerId: data.callerId });
        return;
      }
      setIncomingCall(data);
      setCallState('ringing');
    };

    const handleAccepted = async (data) => {
      // Receiver accepted the call, caller needs to create offer
      if (callState !== 'calling' && callState !== 'in-call') return;
      setCallState('in-call');
      
      const targetId = data.receiverId;
      const pc = createPeerConnection(targetId);
      
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit('call:offer', { targetId, offer });
      } catch (err) {
        console.error('Error creating offer:', err);
      }
    };

    const handleRejected = () => {
      resetCall();
      alert('Call was rejected or user is busy.');
    };

    const handleOffer = async (data) => {
      if (callState !== 'in-call') return;
      const targetId = data.senderId;
      const pc = createPeerConnection(targetId);
      
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit('call:answer', { targetId, answer });
      } catch (err) {
        console.error('Error handling offer:', err);
      }
    };

    const handleAnswer = async (data) => {
      if (peerConnection.current) {
        try {
          await peerConnection.current.setRemoteDescription(new RTCSessionDescription(data.answer));
        } catch (err) {
          console.error('Error handling answer:', err);
        }
      }
    };

    const handleIceCandidate = async (data) => {
      if (peerConnection.current && data.candidate) {
        try {
          await peerConnection.current.addIceCandidate(new RTCIceCandidate(data.candidate));
        } catch (err) {
          console.error('Error adding ice candidate:', err);
        }
      }
    };

    const handleEnded = () => {
      resetCall();
    };

    socket.on('call:incoming', handleIncoming);
    socket.on('call:accepted', handleAccepted);
    socket.on('call:rejected', handleRejected);
    socket.on('call:offer', handleOffer);
    socket.on('call:answer', handleAnswer);
    socket.on('call:ice-candidate', handleIceCandidate);
    socket.on('call:ended', handleEnded);

    return () => {
      socket.off('call:incoming', handleIncoming);
      socket.off('call:accepted', handleAccepted);
      socket.off('call:rejected', handleRejected);
      socket.off('call:offer', handleOffer);
      socket.off('call:answer', handleAnswer);
      socket.off('call:ice-candidate', handleIceCandidate);
      socket.off('call:ended', handleEnded);
    };
  }, [socket, callState, resetCall]);

  return (
    <CallContext.Provider
      value={{
        callState,
        incomingCall,
        remoteUser,
        callType,
        localStream,
        remoteStream,
        isAudioMuted,
        isVideoMuted,
        isScreenSharing,
        startScreenShare,
        stopScreenShare,
        initiateCall,
        acceptCall,
        rejectCall,
        endCall,
        toggleAudio,
        toggleVideo,
      }}
    >
      {children}
    </CallContext.Provider>
  );
};

export const useCall = () => {
  const context = useContext(CallContext);
  if (!context) {
    return {
      callState: 'idle',
      incomingCall: null,
      remoteUser: null,
      callType: 'audio',
      localStream: null,
      remoteStream: null,
      isAudioMuted: false,
      isVideoMuted: false,
      isScreenSharing: false,
      startScreenShare: async () => {},
      stopScreenShare: async () => {},
      initiateCall: () => {},
      acceptCall: () => {},
      rejectCall: () => {},
      endCall: () => {},
      toggleAudio: () => {},
      toggleVideo: () => {},
    };
  }
  return context;
};
