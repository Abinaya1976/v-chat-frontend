import React, { useState, useEffect } from 'react';
import { LiveKitRoom, VideoConference, RoomAudioRenderer, useParticipants, useLocalParticipant, useRoomContext } from '@livekit/components-react';
import '@livekit/components-styles';
import '../../styles/livekit.css';
import { useLiveKit } from '../../context/LiveKitContext';
import { VideoCallIcon, PhoneOffIcon, AudioCallIcon, MicIcon, MicOffIcon, UsersIcon } from '../common/Icons';

function LiveKitCallOverlay() {
  const { 
    liveKitToken, 
    isCalling, 
    endCall, 
    incomingLiveKitCall, 
    acceptLiveKitCall, 
    declineLiveKitCall,
    isAudioOnly,
    callContextName
  } = useLiveKit();
  const liveKitUrl = import.meta.env.VITE_LIVEKIT_URL || 'ws://localhost:7880';

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
            {incomingLiveKitCall.audioOnly ? <AudioCallIcon size={18} color="#0ea5e9" /> : <VideoCallIcon size={18} color="#0ea5e9" />}
            {incomingLiveKitCall.inviterName} started a {incomingLiveKitCall.audioOnly ? 'voice' : 'video'} call
          </p>
          <div style={styles.actions}>
            <button onClick={declineLiveKitCall} style={{ ...styles.button, ...styles.rejectButton }}>
              <PhoneOffIcon size={16} style={{ marginRight: '6px' }} />
              Decline
            </button>
            <button onClick={acceptLiveKitCall} style={{ ...styles.button, ...styles.acceptButton }}>
              {incomingLiveKitCall.audioOnly ? <AudioCallIcon size={16} style={{ marginRight: '6px' }} /> : <VideoCallIcon size={16} style={{ marginRight: '6px' }} />}
              Join Call
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!isCalling || !liveKitToken) return null;

  return (
    <div className="livekit-overlay" style={styles.livekitContainer} data-audio-only={isAudioOnly}>
      <LiveKitRoom
        video={!isAudioOnly}
        audio={true}
        token={liveKitToken}
        serverUrl={liveKitUrl}
        connect={true}
        onDisconnected={endCall}
        data-lk-theme="default"
        style={{ height: '100dvh', width: '100vw' }}
      >
        {isAudioOnly ? <CustomAudioConference contextName={callContextName} /> : <VideoConference />}
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
    boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
    maxWidth: '400px',
    width: '90%',
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
    boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
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
    boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
  },
  actions: {
    display: 'flex',
    gap: '15px',
    justifyContent: 'center',
    marginTop: '10px',
  },
  button: {
    padding: '12px 24px',
    borderRadius: '8px',
    border: 'none',
    fontWeight: '600',
    fontSize: '14px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s',
  },
  rejectButton: {
    backgroundColor: '#f1f5f9',
    color: '#64748b',
  },
  acceptButton: {
    backgroundColor: '#0ea5e9',
    color: '#fff',
    boxShadow: '0 4px 10px rgba(14, 165, 233, 0.3)',
  },
};

function CustomAudioConference({ contextName }) {
  const participants = useParticipants();
  const { localParticipant } = useLocalParticipant();
  const room = useRoomContext();
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setDuration((d) => d + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const toggleMute = async () => {
    if (localParticipant) {
      const isEnabled = localParticipant.isMicrophoneEnabled;
      await localParticipant.setMicrophoneEnabled(!isEnabled);
    }
  };

  const endCall = () => {
    room.disconnect();
  };

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#f8fafc',
      color: '#0f172a',
      fontFamily: 'Inter, system-ui, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        padding: '24px 32px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid #e2e8f0',
        backgroundColor: '#ffffff'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ 
            width: '48px', 
            height: '48px', 
            borderRadius: '12px', 
            backgroundColor: '#e0f2fe',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#0ea5e9'
          }}>
            <AudioCallIcon size={24} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>{contextName || 'Voice Call'}</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '14px', marginTop: '4px' }}>
              <span style={{ 
                width: '8px', 
                height: '8px', 
                borderRadius: '50%', 
                backgroundColor: '#10b981',
                display: 'inline-block'
              }}></span>
              {formatTime(duration)}
            </div>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#f1f5f9', padding: '8px 16px', borderRadius: '20px', fontSize: '14px', fontWeight: '500' }}>
          <UsersIcon size={16} color="#64748b" />
          {participants.length} Participant{participants.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Participants Grid */}
      <div style={{
        flex: 1,
        padding: '40px',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '24px',
        justifyContent: 'center',
        alignItems: 'center',
        overflowY: 'auto'
      }}>
        {participants.map((p) => (
          <div key={p.sid} style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
            width: '160px'
          }}>
            <div style={{
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              backgroundColor: p.isMicrophoneEnabled ? '#ffffff' : '#f1f5f9',
              boxShadow: p.isSpeaking ? '0 0 0 4px #10b981, 0 10px 25px rgba(16, 185, 129, 0.2)' : '0 4px 15px rgba(0,0,0,0.05)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '40px',
              color: '#0ea5e9',
              fontWeight: 'bold',
              border: p.isMicrophoneEnabled ? 'none' : '2px solid #e2e8f0',
              transition: 'all 0.2s ease',
              position: 'relative'
            }}>
              {p.name ? p.name[0].toUpperCase() : 'U'}
              {!p.isMicrophoneEnabled && (
                <div style={{
                  position: 'absolute',
                  bottom: '0',
                  right: '0',
                  backgroundColor: '#ef4444',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '3px solid #ffffff'
                }}>
                  <MicOffIcon size={16} color="#ffffff" />
                </div>
              )}
            </div>
            <div style={{
              fontSize: '16px',
              fontWeight: '500',
              color: '#334155',
              textAlign: 'center'
            }}>
              {p.name || 'User'} {p.isLocal && '(You)'}
            </div>
          </div>
        ))}
      </div>

      {/* Controls Footer */}
      <div style={{
        padding: '32px',
        display: 'flex',
        justifyContent: 'center',
        gap: '24px',
        backgroundColor: '#ffffff',
        borderTop: '1px solid #e2e8f0'
      }}>
        <button 
          onClick={toggleMute}
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: localParticipant?.isMicrophoneEnabled ? '#f1f5f9' : '#ef4444',
            color: localParticipant?.isMicrophoneEnabled ? '#334155' : '#ffffff',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 4px 10px rgba(0,0,0,0.05)',
            transition: 'all 0.2s ease'
          }}
          title={localParticipant?.isMicrophoneEnabled ? 'Mute' : 'Unmute'}
        >
          {localParticipant?.isMicrophoneEnabled ? <MicIcon size={28} /> : <MicOffIcon size={28} />}
        </button>
        
        <button 
          onClick={endCall}
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: '#ef4444',
            color: '#ffffff',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 4px 15px rgba(239, 68, 68, 0.3)',
            transition: 'all 0.2s ease'
          }}
          title="End Call"
        >
          <PhoneOffIcon size={28} />
        </button>
      </div>
    </div>
  );
}

export default LiveKitCallOverlay;
