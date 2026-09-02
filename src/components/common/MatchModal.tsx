import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Send, Sparkles, X, MessageCircle } from 'lucide-react';
import { Match, Profile } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';

interface MatchModalProps {
  match: Match | null;
  onClose: () => void;
}

export const MatchModal: React.FC<MatchModalProps> = ({ match, onClose }) => {
  const { currentUser } = useAuth();
  const { navigate, sendMessage } = useApp();
  const [quickMessage, setQuickMessage] = useState('');

  if (!match) return null;

  const otherUser: Profile = match.user1_id === currentUser.id ? match.user2 : match.user1;

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const textToSend = quickMessage.trim() || `Hey ${otherUser.full_name.split(' ')[0]}! Excited we matched! 👋✨`;
    sendMessage(otherUser.id, textToSend);
    onClose();
    navigate('messages', { userId: otherUser.id });
  };

  const handleOpenChat = () => {
    onClose();
    navigate('messages', { userId: otherUser.id });
  };

  return (
    <AnimatePresence>
      <div
        id="match-modal-backdrop"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-lg bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white rounded-3xl p-8 border border-pink-500/30 shadow-2xl overflow-hidden text-center"
        >
          {/* Ambient Glows */}
          <div className="absolute -top-20 -left-20 w-52 h-52 bg-pink-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -right-20 w-52 h-52 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

          {/* Close button */}
          <button
            id="close-match-modal-btn"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-white/5 hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Celebration Header */}
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles className="w-6 h-6 text-pink-400 animate-pulse" />
            <span className="text-pink-400 font-semibold tracking-wider text-sm uppercase">Connection Sparked</span>
            <Sparkles className="w-6 h-6 text-pink-400 animate-pulse" />
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-rose-300 to-indigo-300 font-heading mb-2">
            It's a Match!
          </h2>
          <p className="text-slate-300 text-sm mb-8">
            You and <span className="font-semibold text-white">{otherUser.full_name}</span> liked each other
          </p>

          {/* Overlapping Avatars */}
          <div className="relative flex items-center justify-center my-6">
            <div className="relative -mr-5 z-10">
              <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full ring-4 ring-pink-500 shadow-xl overflow-hidden bg-slate-800">
                <img
                  src={currentUser.avatar_url}
                  alt={currentUser.full_name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            <div className="z-20 w-12 h-12 rounded-full bg-gradient-to-tr from-pink-500 to-rose-600 flex items-center justify-center shadow-lg ring-4 ring-slate-900 -mx-3">
              <Heart className="w-6 h-6 text-white fill-white animate-bounce" />
            </div>

            <div className="relative -ml-5 z-10">
              <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full ring-4 ring-indigo-500 shadow-xl overflow-hidden bg-slate-800">
                <img
                  src={otherUser.avatar_url}
                  alt={otherUser.full_name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>

          {/* Compatibility badge */}
          <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-300 text-xs font-medium mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{match.compatibility_score}% Compatibility Match</span>
          </div>

          {/* Quick Message Box */}
          <form onSubmit={handleSendMessage} className="space-y-3 mb-6">
            <div className="relative">
              <input
                id="match-quick-message-input"
                type="text"
                value={quickMessage}
                onChange={(e) => setQuickMessage(e.target.value)}
                placeholder={`Say something nice to ${otherUser.full_name.split(' ')[0]}...`}
                className="w-full bg-slate-800/80 border border-slate-700 text-white placeholder-slate-400 text-sm rounded-2xl py-3.5 pl-4 pr-12 focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
              <button
                id="match-send-message-btn"
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl hover:opacity-95 transition"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              id="match-open-chat-btn"
              onClick={handleOpenChat}
              className="flex-1 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-pink-500 via-rose-500 to-indigo-600 text-white font-semibold text-sm hover:opacity-95 transition shadow-lg shadow-pink-500/25 flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-4 h-4" />
              Open Conversation
            </button>
            <button
              id="match-keep-swiping-btn"
              onClick={onClose}
              className="py-3.5 px-6 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold text-sm transition"
            >
              Keep Swiping
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
