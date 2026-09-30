import React from 'react';
import { LiveKitRoom, VideoConference, RoomAudioRenderer } from '@livekit/components-react';
import '@livekit/components-styles';
import '../../styles/livekit.css';
import { useLiveKit } from '../../context/LiveKitContext';
import { VideoCallIcon, PhoneOffIcon } from '../common/Icons';

function LiveKitCallOverlay() {
  const { 
    liveKitToken, 
    isCalling, 
    endCall, 
    incomingLiveKitCall, 
    acceptLiveKitCall, 
    declineLiveKitCall 
  } = useLiveKit();
  const liveKitUrl = import.meta.env.VITE_LIVEKIT_URL || 'ws://localhost:7880';

  // If there's an incoming call and we're not currently in a LiveKit call
  if (incomingLiveKitCall && !isCalling) {
    return (
      <div style={styles.overlay}>
        <div style={styles.modal}>
          <div style={styles.avatarContainer}>
            {incomingLiveKitCall.inviterAvatar ? (
              <img src={incomingLiveKitCall.inviterAvatar} alt="avatar" style={styles.avatar} />
            ) : (
              <div style={styles.avatarPlaceholder}>{(incomingLiveKitCall.inviterName || 'U')[0]}</div>
            )}
          </div>
          <h2 style={{ margin: '10px 0' }}>Group Call in {incomingLiveKitCall.contextName}</h2>
          <p style={{ color: '#666', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <VideoCallIcon size={18} color="#0ea5e9" />
            {incomingLiveKitCall.inviterName} started a video call
          </p>
          <div style={styles.actions}>
            <button onClick={declineLiveKitCall} style={{ ...styles.button, ...styles.rejectButton }}>
              <PhoneOffIcon size={16} style={{ marginRight: '6px' }} />
              Decline
            </button>
            <button onClick={acceptLiveKitCall} style={{ ...styles.button, ...styles.acceptButton }}>
              <VideoCallIcon size={16} style={{ marginRight: '6px' }} />
              Join Call
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!isCalling || !liveKitToken) return null;

  return (
    <div className="livekit-overlay" style={styles.livekitContainer}>
      <LiveKitRoom
        video={true}
        audio={true}
        token={liveKitToken}
        serverUrl={liveKitUrl}
        connect={true}
        onDisconnected={endCall}
        data-lk-theme="default"
        style={{ height: '100dvh', width: '100vw' }}
      >
        <VideoConference />
        <RoomAudioRenderer />
      </LiveKitRoom>
    </div>
  );
}

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
  livekitContainer: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9998,
    backgroundColor: '#000',
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
    display: 'flex',
    alignItems: 'center',
  },
  rejectButton: {
    backgroundColor: '#ef4444',
  },
  acceptButton: {
    backgroundColor: '#10b981',
  },
};

export default LiveKitCallOverlay;
