import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronLeft, ChevronRight, Heart, Send, Sparkles } from 'lucide-react';
import { Story } from '../../types';
import { useApp } from '../../context/AppContext';
import { Avatar } from '../common/Avatar';

interface StoryViewerModalProps {
  stories: Story[];
  initialIndex: number;
  onClose: () => void;
}

export const StoryViewerModal: React.FC<StoryViewerModalProps> = ({
  stories,
  initialIndex,
  onClose
}) => {
  const { markStorySeen, reactToStory, sendMessage, navigate } = useApp();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [replyText, setReplyText] = useState('');

  const currentStory = stories[currentIndex];

  useEffect(() => {
    if (currentStory) {
      markStorySeen(currentStory.id);
    }
  }, [currentIndex]);

  // Automatic progress timer (5 seconds per story)
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          if (currentIndex < stories.length - 1) {
            setCurrentIndex((c) => c + 1);
            return 0;
          } else {
            onClose();
            return 100;
          }
        }
        return prev + 2; // updates every 100ms => 5000ms total
      });
    }, 100);

    return () => clearInterval(interval);
  }, [currentIndex, isPaused, stories.length]);

  const handleNext = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex((c) => c + 1);
      setProgress(0);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((c) => c - 1);
      setProgress(0);
    }
  };

  const handleEmojiReaction = (emoji: string) => {
    if (currentStory) {
      reactToStory(currentStory.id, emoji);
    }
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (replyText.trim() && currentStory) {
      sendMessage(
        currentStory.user_id,
        `Replied to your story: "${replyText.trim()}"`
      );
      setReplyText('');
      onClose();
      navigate('messages', { userId: currentStory.user_id });
    }
  };

  if (!currentStory) return null;

  return (
    <div
      id="story-viewer-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-2 sm:p-4"
    >
      <div className="relative w-full max-w-sm h-[85vh] sm:h-[80vh] max-h-[750px] bg-zinc-950 rounded-3xl overflow-hidden shadow-2xl border border-zinc-800 flex flex-col justify-between select-none">
        {/* Progress Bars */}
        <div className="absolute top-3 left-3 right-3 z-30 flex items-center gap-1.5">
          {stories.map((story, i) => (
            <div key={story.id} className="flex-1 h-1 rounded-full bg-white/30 overflow-hidden">
              <div
                className="h-full bg-white transition-all duration-100"
                style={{
                  width:
                    i === currentIndex
                      ? `${progress}%`
                      : i < currentIndex
                      ? '100%'
                      : '0%'
                }}
              />
            </div>
          ))}
        </div>

        {/* Top Story Header */}
        <div className="absolute top-6 left-3 right-3 z-30 flex items-center justify-between text-white">
          <div className="flex items-center gap-2.5">
            <Avatar
              src={currentStory.author.avatar_url}
              name={currentStory.author.full_name}
              size="sm"
            />
            <div>
              <div className="text-xs font-bold truncate">
                {currentStory.author.full_name}
              </div>
              <div className="text-[10px] text-white/70">
                {currentStory.author.location.split(',')[0]}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white rounded-full bg-black/30 hover:bg-black/50 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Media Container (Press to pause) */}
        <div
          className="relative flex-1 w-full h-full flex items-center justify-center cursor-pointer overflow-hidden bg-black"
          onMouseDown={() => setIsPaused(true)}
          onMouseUp={() => setIsPaused(false)}
          onTouchStart={() => setIsPaused(true)}
          onTouchEnd={() => setIsPaused(false)}
        >
          {currentStory.media_type === 'video' || /\.(mp4|webm|mov)$/i.test(currentStory.media_url) ? (
            <video
              src={currentStory.media_url}
              autoPlay
              playsInline
              loop
              muted={false}
              className="w-full h-full object-cover"
            />
          ) : (
            <img
              src={currentStory.media_url}
              alt="Story"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          )}

          {/* Text Overlay Sticker if present */}
          {currentStory.text_overlay && (
            <div className="absolute bottom-28 left-4 right-4 z-20">
              <div className="inline-block bg-black/60 backdrop-blur-md text-white text-sm font-semibold px-4 py-2 rounded-2xl shadow-lg">
                {currentStory.text_overlay}
              </div>
            </div>
          )}

          {/* Nav arrows */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handlePrev();
            }}
            disabled={currentIndex === 0}
            className={`absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 text-white z-30 transition ${
              currentIndex === 0 ? 'opacity-0 pointer-events-none' : 'hover:bg-black/60'
            }`}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 text-white z-30 hover:bg-black/60 transition"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Bottom Reaction & Message Bar */}
        <div className="absolute bottom-3 left-3 right-3 z-30 space-y-2">
          {/* Quick emoji reactions */}
          <div className="flex items-center justify-center gap-3">
            {['❤️', '😍', '🔥', '👏', '🥂', '✨'].map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleEmojiReaction(emoji)}
                className="text-xl hover:scale-125 active:scale-95 transition bg-black/30 p-1.5 rounded-full"
              >
                {emoji}
              </button>
            ))}
          </div>

          <form onSubmit={handleSendReply} className="flex items-center gap-2">
            <input
              type="text"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder={`Send message to ${currentStory.author.full_name.split(' ')[0]}...`}
              className="flex-1 bg-white/20 backdrop-blur-md text-white placeholder-white/70 text-xs rounded-full py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-pink-400"
            />
            <button
              type="submit"
              className="p-2.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-full hover:opacity-90 shadow-md transition"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
