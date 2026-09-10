import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  Image as ImageIcon,
  Mic,
  Smile,
  ThumbsUp,
  Send,
  Trash2,
  Check,
  X
} from 'lucide-react';

interface ChatComposerProps {
  onSendMessage: (text: string) => void;
  onSendVoiceNote: (durationStr: string) => void;
  onQuickCamera: () => void;
  onOpenGallery: () => void;
  onSendLike: () => void;
  disabled?: boolean;
  placeholder?: string;
}

const QUICK_EMOJIS = ['❤️', '✨', '🔥', '😍', '🥂', '🌹', '😂', '🥰', '💬', '💋', '🥺', '🎉', '👍', '👋', '💯'];

export const ChatComposer: React.FC<ChatComposerProps> = ({
  onSendMessage,
  onSendVoiceNote,
  onQuickCamera,
  onOpenGallery,
  onSendLike,
  disabled = false,
  placeholder = 'Message'
}) => {
  const [text, setText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<number | null>(null);

  const hasContent = text.trim().length > 0;

  // Voice recording timer
  useEffect(() => {
    if (isRecording) {
      setRecordingTime(0);
      timerRef.current = window.setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleSend = () => {
    if (!hasContent || disabled) return;
    onSendMessage(text.trim());
    setText('');
    setShowEmojiPicker(false);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleEmojiClick = (emoji: string) => {
    setText((prev) => prev + emoji);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleFinishRecording = () => {
    const duration = formatTimer(recordingTime || 1);
    setIsRecording(false);
    onSendVoiceNote(duration);
  };

  const handleCancelRecording = () => {
    setIsRecording(false);
    setRecordingTime(0);
  };

  return (
    <div className="relative px-3 py-2 sm:py-2.5 bg-[#141517] border-t border-zinc-800/80">
      {/* Quick Emojis Bar Popup */}
      {showEmojiPicker && (
        <div className="absolute bottom-full left-2 right-2 mb-2 p-2 bg-[#1f2125] border border-zinc-700/80 rounded-2xl shadow-2xl flex items-center justify-between gap-1 overflow-x-auto z-30 animate-in slide-in-from-bottom-2 duration-150">
          <div className="flex items-center gap-2 overflow-x-auto py-1 px-1">
            {QUICK_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => handleEmojiClick(emoji)}
                className="text-xl p-1.5 hover:scale-125 transition hover:bg-zinc-700/60 rounded-xl"
              >
                {emoji}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setShowEmojiPicker(false)}
            className="p-1.5 text-zinc-400 hover:text-zinc-200 rounded-lg hover:bg-zinc-700/50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {isRecording ? (
        /* Voice Recording Bar */
        <div className="flex items-center gap-2 bg-[#1f2125] border border-blue-500/40 rounded-full px-4 py-2 animate-in fade-in">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
            <span className="text-xs font-mono font-bold text-rose-400">
              {formatTimer(recordingTime)}
            </span>
          </div>

          <div className="flex-1 flex items-center justify-center gap-1 px-3">
            {[35, 75, 50, 90, 60, 40, 75, 95, 55, 70, 45, 80].map((h, i) => (
              <span
                key={i}
                className="w-1 bg-blue-500/80 rounded-full animate-pulse"
                style={{ height: `${h}%`, minHeight: '8px', maxHeight: '20px' }}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={handleCancelRecording}
            className="p-1.5 text-zinc-400 hover:text-rose-400 hover:bg-zinc-700/50 rounded-full transition"
            title="Cancel recording"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleFinishRecording}
            className="px-3.5 py-1.5 bg-[#0084FF] hover:bg-blue-600 text-white rounded-full text-xs font-bold shadow-md active:scale-95 transition flex items-center gap-1"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Send</span>
          </button>
        </div>
      ) : (
        /* Standard Messenger-style Composer matching screenshot */
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* 1. Camera Button (Blue icon) */}
          <button
            type="button"
            id="chat-btn-camera"
            onClick={onQuickCamera}
            disabled={disabled}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-[#0084FF] hover:bg-zinc-800/80 active:scale-90 transition shrink-0"
            title="Take a photo"
          >
            <Camera className="w-5 h-5 sm:w-5.5 sm:h-5.5" />
          </button>

          {/* 2. Gallery / Image Button (Blue icon) */}
          <button
            type="button"
            id="chat-btn-gallery"
            onClick={onOpenGallery}
            disabled={disabled}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-[#0084FF] hover:bg-zinc-800/80 active:scale-90 transition shrink-0"
            title="Choose from gallery"
          >
            <ImageIcon className="w-5 h-5 sm:w-5.5 sm:h-5.5" />
          </button>

          {/* 3. Voice / Microphone Button (Blue icon) */}
          <button
            type="button"
            id="chat-btn-mic"
            onClick={() => setIsRecording(true)}
            disabled={disabled}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-[#0084FF] hover:bg-zinc-800/80 active:scale-90 transition shrink-0"
            title="Record voice note"
          >
            <Mic className="w-5 h-5 sm:w-5.5 sm:h-5.5" />
          </button>

          {/* 4. Message Input Capsule */}
          <div
            id="chat-composer-capsule"
            className="flex-1 flex items-center bg-[#242529] rounded-full px-3 py-1 sm:py-1.5 border border-zinc-750/70 focus-within:border-blue-500/60 transition shadow-inner min-h-[40px]"
          >
            <input
              ref={inputRef}
              type="text"
              id="chat-message-input"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={disabled}
              placeholder={placeholder}
              autoComplete="off"
              className="flex-1 px-1 bg-transparent text-sm text-zinc-100 placeholder-zinc-400 focus:outline-none"
            />

            {/* Emoji Trigger Button */}
            <button
              type="button"
              id="composer-emoji-btn"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-1 text-[#0084FF] hover:text-blue-400 transition focus:outline-none shrink-0"
              title="Insert emoji"
            >
              <Smile className="w-5 h-5" />
            </button>
          </div>

          {/* 5. Right Action Button: Like (Thumbs up) when empty, Send when has content */}
          {hasContent ? (
            <button
              type="button"
              id="composer-send-btn"
              onClick={handleSend}
              disabled={disabled}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-[#0084FF] hover:bg-zinc-800/80 active:scale-90 transition shrink-0"
              title="Send message"
            >
              <Send className="w-5 h-5 sm:w-5.5 sm:h-5.5" />
            </button>
          ) : (
            <button
              type="button"
              id="composer-like-btn"
              onClick={onSendLike}
              disabled={disabled}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-[#0084FF] hover:bg-zinc-800/80 active:scale-90 transition shrink-0"
              title="Send thumbs up"
            >
              <ThumbsUp className="w-5 h-5 sm:w-5.5 sm:h-5.5 fill-[#0084FF]" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};
