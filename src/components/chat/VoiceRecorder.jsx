import { useState, useRef, useEffect } from 'react';
import { MicIcon, StopIcon, TrashIcon, SendIcon, PlayIcon, PauseIcon } from '../common/Icons';

function VoiceRecorder({ onSend, onCancel, disabled }) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [permissionError, setPermissionError] = useState('');
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const audioRef = useRef(null);

  // Stop recording cleanly
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerRef.current);
    }
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
        const type = recorder.mimeType || 'audio/webm';
        const blob = new Blob(audioChunksRef.current, { type });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setIsRecording(true);
      setRecordingTime(0);

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
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  useEffect(() => {
    // Start recording immediately when component mounts
    startRecording();

    return () => {
      stopRecording();
      if (audioUrl) URL.revokeObjectURL(audioUrl);
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
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
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
    <div className="voice-recorder-container">
      {!audioBlob ? (
        // Recording state
        <div className="recording-state">
          <div className="recording-indicator">
            <div className="recording-dot blink"></div>
            <span className="recording-time">{formatTime(recordingTime)}</span>
          </div>
          <div className="recording-actions">
            <button type="button" onClick={handleCancel} className="btn-icon cancel-btn" disabled={disabled} title="Cancel">
              <TrashIcon size={20} color="#ef4444" />
            </button>
            <button type="button" onClick={stopRecording} className="btn-icon stop-btn" disabled={disabled} title="Stop & Preview">
              <StopIcon size={20} color="#f59e0b" />
            </button>
          </div>
        </div>
      ) : (
        // Preview state
        <div className="preview-state">
          <button type="button" onClick={togglePlay} className="btn-icon play-btn" disabled={disabled}>
            {isPlaying ? <PauseIcon size={20} /> : <PlayIcon size={20} />}
          </button>
          <span className="recording-time">{formatTime(recordingTime)}</span>
          <audio 
            ref={audioRef} 
            src={audioUrl} 
            onEnded={() => setIsPlaying(false)} 
            onPause={() => setIsPlaying(false)}
            onPlay={() => setIsPlaying(true)}
            style={{ display: 'none' }} 
          />
          <div className="recording-actions">
            <button type="button" onClick={handleCancel} className="btn-icon cancel-btn" disabled={disabled} title="Delete">
              <TrashIcon size={20} color="#ef4444" />
            </button>
            <button type="button" onClick={handleSend} className="btn-icon send-btn" disabled={disabled} title="Send">
              <SendIcon size={20} color="#10b981" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default VoiceRecorder;
