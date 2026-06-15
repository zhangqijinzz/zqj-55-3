import { useState, useRef, useCallback, useEffect } from 'react';
import type { VoiceNote } from '../types';
import { generateId, blobToDataUrl } from '../utils/storage';

const MAX_DURATION = 60000;

interface UseVoiceRecorderOptions {
  onRecordingComplete?: (voiceNote: VoiceNote) => void;
  maxDuration?: number;
}

export function useVoiceRecorder(options: UseVoiceRecorderOptions = {}) {
  const { onRecordingComplete, maxDuration = MAX_DURATION } = options;
  
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isPermissionGranted, setIsPermissionGranted] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);
  const timerRef = useRef<number | null>(null);
  const maxDurationTimerRef = useRef<number | null>(null);
  const shouldStopRef = useRef<boolean>(false);
  const isStartingRef = useRef<boolean>(false);

  const clearTimers = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (maxDurationTimerRef.current) {
      clearTimeout(maxDurationTimerRef.current);
      maxDurationTimerRef.current = null;
    }
  }, []);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      setIsPermissionGranted(true);
      setError(null);
      return true;
    } catch (err) {
      setIsPermissionGranted(false);
      setError('无法访问麦克风，请检查权限设置');
      return false;
    }
  }, []);

  const stopRecording = useCallback(() => {
    shouldStopRef.current = true;
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    clearTimers();
  }, [clearTimers]);

  const startRecording = useCallback(async () => {
    if (isStartingRef.current) return;
    
    setError(null);
    shouldStopRef.current = false;
    isStartingRef.current = true;
    
    try {
      if (!streamRef.current) {
        const granted = await requestPermission();
        if (!granted) {
          isStartingRef.current = false;
          return;
        }
      }

      if (shouldStopRef.current) {
        isStartingRef.current = false;
        return;
      }

      const stream = streamRef.current;
      if (!stream) {
        setError('无法获取音频流');
        isStartingRef.current = false;
        return;
      }

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const duration = Date.now() - startTimeRef.current;
        
        if (duration < 300 || blob.size < 100) {
          clearTimers();
          setIsRecording(false);
          return;
        }
        
        try {
          const dataUrl = await blobToDataUrl(blob);
          const voiceNote: VoiceNote = {
            id: generateId(),
            dataUrl,
            duration,
            createdAt: Date.now(),
          };
          onRecordingComplete?.(voiceNote);
        } catch (err) {
          setError('录音处理失败');
        }
        
        clearTimers();
      };

      if (shouldStopRef.current) {
        isStartingRef.current = false;
        return;
      }

      mediaRecorder.start(100);
      startTimeRef.current = Date.now();
      setIsRecording(true);
      setRecordingTime(0);
      isStartingRef.current = false;

      if (shouldStopRef.current) {
        stopRecording();
        return;
      }

      timerRef.current = window.setInterval(() => {
        const elapsed = Date.now() - startTimeRef.current;
        setRecordingTime(elapsed);
      }, 100);

      maxDurationTimerRef.current = window.setTimeout(() => {
        stopRecording();
      }, maxDuration);

    } catch (err) {
      setError('录音启动失败');
      setIsRecording(false);
      isStartingRef.current = false;
      clearTimers();
    }
  }, [requestPermission, maxDuration, onRecordingComplete, clearTimers, stopRecording]);

  const handlePressStart = useCallback(() => {
    startRecording();
  }, [startRecording]);

  const handlePressEnd = useCallback(() => {
    stopRecording();
  }, [stopRecording]);

  useEffect(() => {
    return () => {
      clearTimers();
      stopStream();
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    };
  }, [clearTimers, stopStream]);

  const formatTime = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${String(secs).padStart(2, '0')}`;
  };

  return {
    isRecording,
    recordingTime,
    formattedTime: formatTime(recordingTime),
    isPermissionGranted,
    error,
    maxDuration,
    formattedMaxDuration: formatTime(maxDuration),
    handlePressStart,
    handlePressEnd,
    requestPermission,
    clearError: () => setError(null),
  };
}
