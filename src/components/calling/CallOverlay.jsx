import React, { useEffect, useRef } from 'react';
import { useCall } from '../../context/CallContext';
import {
  AudioCallIcon,
  VideoCallIcon,
  PhoneOffIcon,
  MicIcon,
  MicOffIcon,
  VideoOffIcon,
} from '../common/Icons';

const CallOverlay = () => {
  const {
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
    acceptCall,
    rejectCall,
    endCall,
    toggleAudio,
    toggleVideo,
  } = useCall();

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      if (localVideoRef.current.srcObject !== localStream) {
        localVideoRef.current.srcObject = localStream;
      }
      localVideoRef.current.play().catch(() => {});
    }
  }, [localStream, callState, isVideoMuted]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      if (remoteVideoRef.current.srcObject !== remoteStream) {
        remoteVideoRef.current.srcObject = remoteStream;
      }
      remoteVideoRef.current.play().catch(() => {});
    }
  }, [remoteStream, callState]);

  if (callState === 'idle') return null;

  return (
    <div style={styles.overlay}>
      {callState === 'ringing' && incomingCall && (
        <div style={styles.modal}>
          <div style={styles.avatarContainer}>
            {incomingCall.callerAvatar ? (
              <img src={incomingCall.callerAvatar} alt="avatar" style={styles.avatar} />
            ) : (
              <div style={styles.avatarPlaceholder}>{incomingCall.callerName[0]}</div>
            )}
          </div>
          <h2 style={{ margin: '10px 0' }}>{incomingCall.callerName} is calling</h2>
          <p style={{ color: '#666', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            {incomingCall.callType === 'video' ? (
              <VideoCallIcon size={18} color="#0ea5e9" />
            ) : (
              <AudioCallIcon size={18} color="#0ea5e9" />
            )}
            Incoming {incomingCall.callType} call...
          </p>
          <div style={styles.actions}>
            <button onClick={rejectCall} style={{ ...styles.button, ...styles.rejectButton }}>
              <PhoneOffIcon size={16} style={{ marginRight: '6px' }} />
              Decline
            </button>
            <button onClick={acceptCall} style={{ ...styles.button, ...styles.acceptButton }}>
              {incomingCall.callType === 'video' ? (
                <VideoCallIcon size={16} style={{ marginRight: '6px' }} />
              ) : (
                <AudioCallIcon size={16} style={{ marginRight: '6px' }} />
              )}
              Accept
            </button>
          </div>
        </div>
      )}

      {(callState === 'calling' || callState === 'in-call') && remoteUser && (
        <div style={styles.callInterface}>
          <div style={styles.videoContainer}>
            {/* Screen Sharing State Badge */}
            {isScreenSharing && (
              <div style={styles.screenShareBadge}>
                🖥️ You are sharing your screen
              </div>
            )}

            {/* Remote Video / Status */}
            {callState === 'calling' ? (
              <div style={{ ...styles.statusText, display: 'flex', alignItems: 'center', gap: '10px' }}>
                {callType === 'video' ? (
                  <VideoCallIcon size={24} color="#38bdf8" />
                ) : (
                  <AudioCallIcon size={24} color="#38bdf8" />
                )}
                Calling {remoteUser.name}...
              </div>
            ) : (
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                style={{ ...styles.remoteVideo, display: callType === 'video' ? 'block' : 'none' }}
              />
            )}
            
            {callType === 'audio' && callState === 'in-call' && (
              <div style={{ ...styles.statusText, display: 'flex', alignItems: 'center', gap: '10px' }}>
                <AudioCallIcon size={24} color="#38bdf8" />
                In call with {remoteUser.name}
              </div>
            )}

            {/* Local Video Mini View */}
            {callType === 'video' && (
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                style={{
                  ...styles.localVideo,
                  display: isVideoMuted ? 'none' : 'block',
                }}
              />
            )}
          </div>

          {/* Call Controls */}
          <div style={styles.controls}>
            <button onClick={toggleAudio} style={{ ...styles.controlButton, background: isAudioMuted ? '#ef4444' : '#334155' }}>
              {isAudioMuted ? <MicOffIcon size={16} style={{ marginRight: '6px' }} /> : <MicIcon size={16} style={{ marginRight: '6px' }} />}
              {isAudioMuted ? 'Unmute' : 'Mute'}
            </button>
            {callType === 'video' && (
              <>
                <button onClick={toggleVideo} style={{ ...styles.controlButton, background: isVideoMuted ? '#ef4444' : '#334155' }}>
                  {isVideoMuted ? <VideoOffIcon size={16} style={{ marginRight: '6px' }} /> : <VideoCallIcon size={16} style={{ marginRight: '6px' }} />}
                  {isVideoMuted ? 'Turn Camera On' : 'Turn Camera Off'}
                </button>
                <button
                  onClick={isScreenSharing ? stopScreenShare : startScreenShare}
                  style={{
                    ...styles.controlButton,
                    background: isScreenSharing ? '#0284c7' : '#334155',
                  }}
                >
                  {isScreenSharing ? 'Stop Sharing' : 'Share Screen'}
                </button>
              </>
            )}
            <button onClick={endCall} style={{ ...styles.controlButton, background: '#ef4444' }}>
              <PhoneOffIcon size={16} style={{ marginRight: '6px' }} />
              End Call
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    zIndex: 9999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modal: {
    backgroundColor: '#fff',
    padding: '30px',
    borderRadius: '16px',
    textAlign: 'center',
    minWidth: '300px',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  },
  avatarContainer: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '15px',
  },
  avatar: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    objectFit: 'cover',
  },
  avatarPlaceholder: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    backgroundColor: '#0ea5e9',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '32px',
    fontWeight: 'bold',
  },
  actions: {
    display: 'flex',
    gap: '15px',
    justifyContent: 'center',
  },
  button: {
    padding: '10px 20px',
    borderRadius: '8px',
    border: 'none',
    fontWeight: '600',
    cursor: 'pointer',
    fontSize: '14px',
    color: '#fff',
  },
  rejectButton: {
    backgroundColor: '#ef4444',
  },
  acceptButton: {
    backgroundColor: '#10b981',
  },
  callInterface: {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  videoContainer: {
    flex: 1,
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
  },
  remoteVideo: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  localVideo: {
    position: 'absolute',
    bottom: '20px',
    right: '20px',
    width: '160px',
    height: '120px',
    objectFit: 'cover',
    borderRadius: '8px',
    border: '2px solid rgba(255, 255, 255, 0.2)',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    zIndex: 10,
  },
  statusText: {
    color: '#fff',
    fontSize: '24px',
    fontWeight: '500',
  },
  controls: {
    position: 'absolute',
    bottom: '40px',
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    gap: '15px',
    justifyContent: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.9)',
    padding: '15px 25px',
    borderRadius: '16px',
    zIndex: 10,
  },
  controlButton: {
    padding: '12px 24px',
    borderRadius: '8px',
    border: 'none',
    color: '#fff',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  screenShareBadge: {
    position: 'absolute',
    top: '20px',
    left: '20px',
    backgroundColor: 'rgba(2, 132, 199, 0.9)',
    color: '#fff',
    padding: '8px 16px',
    borderRadius: '20px',
    fontSize: '13px',
    fontWeight: '600',
    zIndex: 10,
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  },
};

export default CallOverlay;
