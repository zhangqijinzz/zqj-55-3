import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Trash2 } from 'lucide-react';
import { useVoiceRecorder } from '../hooks/useVoiceRecorder';
import type { VoiceNote } from '../types';

interface VoiceRecorderProps {
  onRecordingComplete: (voiceNote: VoiceNote) => void;
  existingVoiceNote?: VoiceNote;
  onDelete?: () => void;
}

export default function VoiceRecorder({ onRecordingComplete, existingVoiceNote, onDelete }: VoiceRecorderProps) {
  const [showTip, setShowTip] = useState(!existingVoiceNote);
  
  const {
    isRecording,
    formattedTime,
    formattedMaxDuration,
    error,
    handlePressStart,
    handlePressEnd,
  } = useVoiceRecorder({
    onRecordingComplete: (voiceNote) => {
      onRecordingComplete(voiceNote);
      setShowTip(false);
    },
  });

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="w-full">
      {error && (
      <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 text-center">
        {error}
      </div>
    )}

    {existingVoiceNote && !isRecording && (
      <div className="bg-lavender-50 rounded-2xl p-4 border border-lavender-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-lavender-200 rounded-full flex items-center justify-center">
            <span className="text-xl">🎙️</span>
          </div>
          <div>
            <p className="font-medium text-gray-800">已录制语音备注</p>
            <p className="text-sm text-gray-500">
              时长 {formatDuration(existingVoiceNote.duration)}
            </p>
          </div>
        </div>
        {onDelete && (
          <button
            onClick={onDelete}
            className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center text-red-500 hover:bg-red-200 transition-colors"
          >
            <Trash2 size={18} />
          </button>
        )}
      </div>
      <p className="text-xs text-gray-400 mt-3 text-center">
        按住下方按钮可重新录制
      </p>
    </div>
  )}

      <div className="mt-4 flex flex-col items-center">
        <AnimatePresence mode="wait">
          {isRecording ? (
            <motion.div
              key="recording"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="flex flex-col items-center"
            >
              <div className="relative">
                <motion.div
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="absolute inset-0 bg-red-400 rounded-full opacity-30"
                  style={{ width: 100, height: 100, margin: -8 }}
                />
                <motion.div
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5, delay: 0.2 }}
                  className="absolute inset-0 bg-red-400 rounded-full opacity-20"
                  style={{ width: 84, height: 84, margin: 0 }}
                />
                <button
                  onMouseUp={handlePressEnd}
                  onMouseLeave={handlePressEnd}
                  onTouchEnd={handlePressEnd}
                  onTouchCancel={handlePressEnd}
                  className="relative w-16 h-16 bg-red-500 rounded-full flex items-center justify-center text-white shadow-lg z-10"
                >
                  <Mic size={28} fill="white" />
                </button>
              </div>
              <div className="mt-4 text-center">
                <p className="text-lg font-bold text-red-500">{formattedTime}</p>
                <p className="text-xs text-gray-400">松开结束 · 最长 {formattedMaxDuration}</p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="idle"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="flex flex-col items-center"
            >
              <button
                onMouseDown={handlePressStart}
                onTouchStart={handlePressStart}
                className="w-20 h-20 bg-gradient-to-br from-lavender-400 to-lavender-600 rounded-full flex items-center justify-center text-white shadow-lg hover:shadow-xl transition-all btn-bounce active:scale-95"
              >
                <Mic size={32} />
              </button>
              {showTip && (
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-3 text-sm text-gray-500"
                >
                  按住说话，松开结束
                </motion.p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
