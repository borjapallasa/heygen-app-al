"use client";
import { useState, useRef, useEffect } from "react";

/**
 * RecorderOverlay - Audio recording component
 * Compatible with original AvatarGroupBubbles component
 */
export default function RecorderOverlay({ onClose, onSave }) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const streamRef = useRef(null);
  const savedRef = useRef(false);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      // Only revoke URL if not saved (i.e., user cancelled)
      if (audioUrl && !savedRef.current) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);

        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (err) {
      alert("Failed to access microphone: " + err.message);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const handleSave = () => {
    if (audioBlob && audioUrl) {
      savedRef.current = true; // Mark as saved to prevent URL revocation
      const item = {
        url: audioUrl,
        blob: audioBlob,
        name: `Recording ${new Date().toLocaleString()}`,
        duration: recordingTime
      };
      onSave(item);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Record Audio</h2>

        <div className="flex flex-col items-center p-8 bg-gray-50 rounded-lg mb-6">
          <div className="text-4xl font-mono font-bold text-gray-900 mb-4">
            {formatTime(recordingTime)}
          </div>

          {isRecording && (
            <div className="flex items-center gap-2 mb-4">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-600">Recording...</span>
            </div>
          )}

          <div className="flex gap-3">
            {!isRecording && !audioUrl && (
              <button
                onClick={startRecording}
                className="px-6 py-3 bg-red-600 text-white rounded-full hover:bg-red-700"
              >
                Start Recording
              </button>
            )}

            {isRecording && (
              <button
                onClick={stopRecording}
                className="px-6 py-3 bg-gray-600 text-white rounded-full hover:bg-gray-700"
              >
                Stop
              </button>
            )}
          </div>
        </div>

        {audioUrl && (
          <div className="mb-4">
            <p className="text-sm font-medium mb-2">Preview:</p>
            <audio controls className="w-full">
              <source src={audioUrl} type="audio/webm" />
            </audio>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!audioBlob}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Save Recording
          </button>
        </div>
      </div>
    </div>
  );
}
