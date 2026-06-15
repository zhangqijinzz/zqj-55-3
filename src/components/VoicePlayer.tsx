import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause } from 'lucide-react';
import type { VoiceNote } from '../types';

interface VoicePlayerProps {
  voiceNote: VoiceNote;
  variant?: 'default' | 'compact';
}

export default function VoicePlayer({ voiceNote, variant = 'default' }: VoicePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const duration = voiceNote.duration;

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime * 1000);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
    };
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(err => {
        console.error('Playback failed:', err);
      });
    }
  };

  const formatTime = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${String(secs).padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  if (variant === 'compact') {
    return (
      <button
        onClick={togglePlay}
        className="flex items-center gap-2 px-3 py-1.5 bg-lavender-100 hover:bg-lavender-200 rounded-full transition-colors"
      >
        <div className="w-6 h-6 bg-lavender-500 rounded-full flex items-center justify-center text-white">
          {isPlaying ? <Pause size={12} /> : <Play size={12} />}
        </div>
        <span className="text-xs font-medium text-lavender-700">
          {formatTime(duration)}
        </span>
        <audio ref={audioRef} src={voiceNote.dataUrl} preload="metadata" />
      </button>
    );
  }

  return (
    <div className="bg-lavender-50 rounded-2xl p-5 border border-lavender-200">
      <div className="flex items-center gap-4">
        <motion.button
          onClick={togglePlay}
          whileTap={{ scale: 0.95 }}
          className={`w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg transition-all ${
            isPlaying
              ? 'bg-gradient-to-br from-lavender-400 to-lavender-600'
              : 'bg-gradient-to-br from-lavender-400 to-lavender-600 hover:shadow-xl'
          }`}
        >
          {isPlaying ? (
            <Pause size={24} fill="white" />
          ) : (
            <Play size={24} fill="white" className="ml-1" />
          )}
        </motion.button>

        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              🎙️ 语音备注
            </span>
            <span className="text-sm text-gray-500">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className="h-2 bg-lavender-200 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-lavender-400 to-lavender-600 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.1 }}
            />
          </div>
        </div>
      </div>

      <audio ref={audioRef} src={voiceNote.dataUrl} preload="metadata" />
    </div>
  );
}
