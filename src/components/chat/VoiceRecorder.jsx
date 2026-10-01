import { useState, useRef, useEffect } from 'react';
import { MicIcon, StopIcon, TrashIcon, SendIcon, PlayIcon, PauseIcon } from '../common/Icons';

function VoiceRecorder({ onSend, onCancel, disabled }) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  
  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  
  const [permissionError, setPermissionError] = useState('');
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const audioRef = useRef(null);

  // Stop recording cleanly
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setPlaybackTime(0);
    setIsPlaying(false);
  };

  // Start recording
  const startRecording = async () => {
    setPermissionError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const options = { mimeType: 'audio/webm;codecs=opus' };
      const recorder = new MediaRecorder(stream, MediaRecorder.isTypeSupported(options.mimeType) ? options : {});
      
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        // Force audio/webm so Chrome doesn't default to video/webm for audio-only streams
        const type = 'audio/webm';
        const file = new File(audioChunksRef.current, `voice-message-${Date.now()}.webm`, { type });
        setAudioBlob(file);
        const url = URL.createObjectURL(file);
        setAudioUrl(url);
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      setPlaybackTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);

    } catch (err) {
      console.error('Mic permission denied or error:', err);
      setPermissionError('Microphone access denied. Please allow microphone permissions.');
    }
  };

  // Format time (MM:SS)
  const formatTime = (seconds) => {
    const validSeconds = Math.floor(seconds || 0);
    const m = Math.floor(validSeconds / 60).toString().padStart(2, '0');
    const s = (validSeconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const audioUrlRef = useRef(null);
  useEffect(() => {
    audioUrlRef.current = audioUrl;
  }, [audioUrl]);

  useEffect(() => {
    // Start recording immediately when component mounts
    startRecording();

    return () => {
      stopRecording();
      if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
      if (mediaRecorderRef.current?.stream) {
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSend = () => {
    if (audioBlob) {
      // Pass the audio blob back to the parent
      onSend(audioBlob);
    }
  };

  const handleCancel = () => {
    stopRecording();
    onCancel();
  };

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(e => console.error("Playback error:", e));
      }
    }
  };
  
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setPlaybackTime(audioRef.current.currentTime);
    }
  };
  
  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      let duration = audioRef.current.duration;
      if (duration === Infinity || isNaN(duration)) {
        // Fallback to recordingTime if browser can't parse webm duration
        duration = recordingTime;
      }
      setAudioDuration(duration);
    }
  };
  
  const handleEnded = () => {
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      setPlaybackTime(0);
    }
  };

  if (permissionError) {
    return (
      <div className="voice-recorder-error">
        <span className="error-text">⚠️ {permissionError}</span>
        <button type="button" onClick={handleCancel} className="btn-cancel-voice">Close</button>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '8px 16px',
      backgroundColor: '#f8fafc',
      borderRadius: '24px',
      border: '1px solid #e2e8f0',
      width: '100%',
      boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)',
      transition: 'all 0.3s ease'
    }}>
      {!audioBlob ? (
        // Recording state
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: '#ef4444',
              animation: 'pulse 1.5s infinite ease-in-out'
            }}></div>
            <style>
              {`
                @keyframes pulse {
                  0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
                  70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(239, 68, 68, 0); }
                  100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
                }
              `}
            </style>
            <span style={{ fontWeight: '600', color: '#ef4444', fontSize: '14px', fontFamily: 'monospace' }}>
              {formatTime(recordingTime)}
            </span>
            <span style={{ fontSize: '13px', color: '#64748b', marginLeft: '4px' }}>Recording...</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button 
              type="button" 
              onClick={handleCancel} 
              disabled={disabled} 
              title="Cancel"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: '36px', height: '36px', borderRadius: '50%', border: 'none',
                backgroundColor: '#fee2e2', color: '#ef4444', cursor: 'pointer', transition: 'background 0.2s'
              }}
            >
              <TrashIcon size={18} />
            </button>
            <button 
              type="button" 
              onClick={stopRecording} 
              disabled={disabled} 
              title="Stop & Preview"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: '36px', height: '36px', borderRadius: '50%', border: 'none',
                backgroundColor: '#fef3c7', color: '#f59e0b', cursor: 'pointer', transition: 'background 0.2s'
              }}
            >
              <StopIcon size={18} />
            </button>
          </div>
        </div>
      ) : (
        // Preview state
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button 
              type="button" 
              onClick={togglePlay} 
              disabled={disabled}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: '36px', height: '36px', borderRadius: '50%', border: 'none',
                backgroundColor: '#e0f2fe', color: '#0ea5e9', cursor: 'pointer', transition: 'background 0.2s'
              }}
            >
              {isPlaying ? <PauseIcon size={18} /> : <PlayIcon size={18} />}
            </button>
            
            {/* Simple audio wave visualization fake */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '3px', height: '24px' }}>
              {[1,2,3,4,5,6,7,8,9,10].map(i => (
                <div key={i} style={{
                  width: '3px', 
                  backgroundColor: isPlaying ? '#0ea5e9' : '#cbd5e1', 
                  borderRadius: '2px',
                  height: isPlaying ? `${Math.max(4, Math.random() * 20)}px` : '4px',
                  transition: 'height 0.1s'
                }}></div>
              ))}
            </div>

            <span style={{ fontWeight: '500', color: '#334155', fontSize: '14px', fontFamily: 'monospace' }}>
              {formatTime(playbackTime)} / {formatTime(audioDuration > 0 ? audioDuration : recordingTime)}
            </span>
          </div>
          
          <audio 
            ref={audioRef} 
            src={audioUrl} 
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={handleEnded}
            onPause={() => setIsPlaying(false)}
            onPlay={() => setIsPlaying(true)}
            onTimeUpdate={handleTimeUpdate}
            style={{ display: 'none' }} 
          />
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button 
              type="button" 
              onClick={handleCancel} 
              disabled={disabled} 
              title="Delete"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: '36px', height: '36px', borderRadius: '50%', border: 'none',
                backgroundColor: '#f1f5f9', color: '#64748b', cursor: 'pointer', transition: 'background 0.2s'
              }}
            >
              <TrashIcon size={18} />
            </button>
            <button 
              type="button" 
              onClick={handleSend} 
              disabled={disabled} 
              title="Send"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: '36px', height: '36px', borderRadius: '50%', border: 'none',
                backgroundColor: '#10b981', color: '#ffffff', cursor: 'pointer', transition: 'background 0.2s',
                boxShadow: '0 2px 6px rgba(16, 185, 129, 0.4)'
              }}
            >
              <SendIcon size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default VoiceRecorder;
