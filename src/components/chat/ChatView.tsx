import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Image as ImageIcon,
  Smile,
  MoreVertical,
  Check,
  CheckCheck,
  ShieldAlert,
  UserX,
  Phone,
  Video,
  ArrowLeft,
  Sparkles,
  Search,
  Trash2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { Avatar } from '../common/Avatar';
import { EmptyState } from '../common/EmptyState';
import { MessageCircle } from 'lucide-react';

export const ChatView: React.FC = () => {
  const { currentUser, allUsers } = useAuth();
  const {
    conversations,
    activeChatUserId,
    setActiveChatUserId,
    getChatMessages,
    sendMessage,
    unsendMessage,
    markMessagesRead,
    openReportModal,
    blockUser,
    navigate
  } = useApp();

  const [messageInput, setMessageInput] = useState('');
  const [photoInputUrl, setPhotoInputUrl] = useState('');
  const [showPhotoInput, setShowPhotoInput] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showOptions, setShowOptions] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // If no active chat, default to first conversation if available
  useEffect(() => {
    if (!activeChatUserId && conversations.length > 0) {
      setActiveChatUserId(conversations[0].other_user_id);
    }
  }, [conversations, activeChatUserId]);

  const activeUser = allUsers.find((u) => u.id === activeChatUserId);
  const messages = activeChatUserId ? getChatMessages(activeChatUserId) : [];

  useEffect(() => {
    if (activeChatUserId) {
      markMessagesRead(activeChatUserId);
    }
  }, [activeChatUserId, messages.length]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeChatUserId) return;
    if (!messageInput.trim() && !photoInputUrl.trim()) return;

    sendMessage(
      activeChatUserId,
      messageInput.trim(),
      photoInputUrl.trim() || undefined
    );

    setMessageInput('');
    setPhotoInputUrl('');
    setShowPhotoInput(false);
  };

  const icebreakers = [
    "What's your absolute favorite weekend spot in the city? ☕",
    "Hey! Loving your vibe & profile photos! ✨",
    "Coffee, cocktails, or tacos on a first date? 🌮",
    "What's the best concert or trip you've been on recently? ✈️"
  ];

  const filteredConversations = conversations.filter((c) =>
    c.other_user.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-zinc-900 rounded-3xl border border-zinc-800 shadow-sm overflow-hidden h-[calc(100vh-8.5rem)] flex flex-col md:flex-row">
      {/* Left Column: Conversations List */}
      <div
        className={`w-full md:w-80 border-r border-zinc-800 flex flex-col ${
          activeChatUserId ? 'hidden md:flex' : 'flex'
        }`}
      >
        {/* Search header */}
        <div className="p-4 border-b border-zinc-800 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-zinc-100 font-heading">
              Messages
            </h3>
            <span className="text-xs text-pink-400 font-semibold">
              {conversations.length} chats
            </span>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="w-full text-xs bg-zinc-800/80 rounded-2xl py-2 pl-9 pr-3 border border-zinc-700/60 focus:bg-zinc-800 focus:border-pink-500/50 focus:ring-2 focus:ring-pink-500/20 text-zinc-100 placeholder-zinc-500 outline-none transition"
            />
          </div>
        </div>

        {/* Conversations list */}
        <div className="flex-1 overflow-y-auto divide-y divide-zinc-800/60">
          {filteredConversations.length > 0 ? (
            filteredConversations.map((conv) => {
              const isActive = conv.other_user_id === activeChatUserId;
              return (
                <div
                  key={conv.id}
                  id={`conversation-item-${conv.other_user_id}`}
                  onClick={() => setActiveChatUserId(conv.other_user_id)}
                  className={`p-3.5 flex items-center gap-3 cursor-pointer transition ${
                    isActive
                      ? 'bg-zinc-800/90 border-l-4 border-pink-500'
                      : 'hover:bg-zinc-800/40'
                  }`}
                >
                  <Avatar
                    src={conv.other_user.avatar_url}
                    name={conv.other_user.full_name}
                    size="md"
                    isOnline={conv.other_user.is_online}
                    isVerified={conv.other_user.is_verified}
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs sm:text-sm font-bold text-zinc-100 truncate">
                        {conv.other_user.full_name}
                      </h4>
                      <span className="text-[10px] text-zinc-500">
                        {conv.last_message
                          ? new Date(conv.last_message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : ''}
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs text-zinc-400 truncate max-w-[150px]">
                        {conv.last_message ? conv.last_message.content : 'Started a match!'}
                      </p>
                      {conv.unread_count > 0 && (
                        <span className="w-5 h-5 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-zinc-900">
                          {conv.unread_count}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center text-xs text-zinc-500">
              No conversations found
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Active Conversation */}
      <div
        className={`flex-1 flex flex-col bg-zinc-950 ${
          !activeChatUserId ? 'hidden md:flex' : 'flex'
        }`}
      >
        {activeUser ? (
          <>
            {/* Header */}
            <div className="p-3.5 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Back on mobile */}
                <button
                  onClick={() => setActiveChatUserId(null)}
                  className="md:hidden p-1.5 text-zinc-400 hover:text-zinc-100 rounded-lg hover:bg-zinc-800"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>

                <Avatar
                  src={activeUser.avatar_url}
                  name={activeUser.full_name}
                  size="md"
                  isOnline={activeUser.is_online}
                  isVerified={activeUser.is_verified}
                  onClick={() => navigate('profile', { username: activeUser.username })}
                />

                <div>
                  <div className="flex items-center gap-1.5">
                    <h4
                      onClick={() => navigate('profile', { username: activeUser.username })}
                      className="text-sm font-bold text-zinc-100 hover:text-pink-400 transition cursor-pointer"
                    >
                      {activeUser.full_name}
                    </h4>
                    <span className="text-xs text-zinc-500">· {activeUser.age}</span>
                  </div>
                  <div className="text-[11px] text-zinc-400">
                    {activeUser.is_online ? (
                      <span className="text-emerald-400 font-medium">Online now</span>
                    ) : (
                      <span>Active recently</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions & More options */}
              <div className="relative flex items-center gap-1">
                <button
                  onClick={() => navigate('profile', { username: activeUser.username })}
                  className="px-3 py-1.5 text-xs font-semibold text-pink-400 hover:bg-pink-500/10 rounded-xl transition"
                >
                  View Profile
                </button>

                <div className="relative">
                  <button
                    onClick={() => setShowOptions(!showOptions)}
                    className="p-2 text-zinc-400 hover:text-zinc-100 rounded-full hover:bg-zinc-800 transition"
                  >
                    <MoreVertical className="w-5 h-5" />
                  </button>

                  {showOptions && (
                    <div className="absolute right-0 mt-1 w-44 bg-zinc-900 rounded-2xl shadow-xl border border-zinc-750 p-1.5 z-30 animate-in fade-in">
                      <button
                        onClick={() => {
                          setShowOptions(false);
                          if (confirm(`Block ${activeUser.full_name}?`)) {
                            blockUser(activeUser.id);
                            setActiveChatUserId(null);
                          }
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-zinc-200 hover:bg-zinc-800 rounded-xl transition"
                      >
                        <UserX className="w-3.5 h-3.5" />
                        Block User
                      </button>

                      <button
                        onClick={() => {
                          setShowOptions(false);
                          openReportModal('USER', activeUser.id, activeUser.full_name);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-950/40 rounded-xl transition"
                      >
                        <ShieldAlert className="w-3.5 h-3.5" />
                        Report User
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Messages Stream */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-zinc-950">
              {/* Top Match Sparkle Reminder */}
              <div className="py-4 text-center">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-400 text-[11px] font-semibold">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>You are connected on LoveConnect</span>
                </div>
              </div>

              {/* Messages Bubbles */}
              {messages.map((msg) => {
                const isMine = msg.sender_id === currentUser.id;
                return (
                  <div
                    key={msg.id}
                    id={`chat-msg-${msg.id}`}
                    className={`flex items-end gap-2 group ${isMine ? 'justify-end' : 'justify-start'}`}
                  >
                    {!isMine && (
                      <Avatar
                        src={activeUser.avatar_url}
                        name={activeUser.full_name}
                        size="xs"
                      />
                    )}

                    <div className="relative max-w-[78%] sm:max-w-md">
                      <div
                        className={`p-3.5 rounded-3xl text-xs sm:text-sm leading-relaxed shadow-xs ${
                          isMine
                            ? 'bg-gradient-to-r from-pink-500 via-rose-500 to-indigo-600 text-white rounded-br-xs'
                            : 'bg-zinc-900 text-zinc-100 border border-zinc-800 rounded-bl-xs'
                        }`}
                      >
                        {/* Photo attachment */}
                        {msg.media_url && (
                          <div className="rounded-2xl overflow-hidden mb-2 max-h-56">
                            <img
                              src={msg.media_url}
                              alt="Attachment"
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      </div>

                      {/* Timestamp & Read Receipts */}
                      <div
                        className={`flex items-center gap-1 text-[10px] mt-1 px-1 ${
                          isMine ? 'justify-end text-zinc-500' : 'text-zinc-500'
                        }`}
                      >
                        <span>
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {isMine && (
                          <span>
                            {msg.is_read ? (
                              <CheckCheck className="w-3 h-3 text-pink-400 inline" />
                            ) : (
                              <Check className="w-3 h-3 text-zinc-500 inline" />
                            )}
                          </span>
                        )}
                        {/* Unsend button */}
                        {isMine && (
                          <button
                            onClick={() => unsendMessage(msg.id)}
                            className="opacity-0 group-hover:opacity-100 hover:text-rose-400 transition ml-1"
                            title="Unsend message"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              <div ref={messagesEndRef} />
            </div>

            {/* Icebreaker Prompts Pill Row */}
            {messages.length < 3 && (
              <div className="px-4 py-2 bg-zinc-900 border-t border-zinc-800 flex items-center gap-2 overflow-x-auto no-scrollbar">
                <span className="text-[10px] font-bold text-pink-400 uppercase shrink-0">
                  Icebreakers:
                </span>
                {icebreakers.map((ice, i) => (
                  <button
                    key={i}
                    onClick={() => setMessageInput(ice)}
                    className="px-3 py-1 rounded-full bg-zinc-800 hover:bg-zinc-750 text-zinc-300 hover:text-pink-400 text-[11px] whitespace-nowrap shrink-0 transition border border-zinc-700/50"
                  >
                    {ice}
                  </button>
                ))}
              </div>
            )}

            {/* Photo URL Input Bar */}
            {showPhotoInput && (
              <div className="p-3 bg-zinc-900 border-t border-zinc-800 flex items-center gap-2">
                <input
                  type="url"
                  value={photoInputUrl}
                  onChange={(e) => setPhotoInputUrl(e.target.value)}
                  placeholder="Paste photo link to send..."
                  className="flex-1 text-xs bg-zinc-800 text-zinc-100 rounded-xl p-2 border border-zinc-700 focus:ring-2 focus:ring-pink-500 outline-none placeholder-zinc-500"
                />
                <button
                  onClick={() => setShowPhotoInput(false)}
                  className="text-xs text-zinc-400 hover:text-zinc-200 px-2"
                >
                  Cancel
                </button>
              </div>
            )}

            {/* Message Input Box */}
            <form
              onSubmit={handleSend}
              className="p-3.5 bg-zinc-900 border-t border-zinc-800 flex items-center gap-2"
            >
              <button
                type="button"
                onClick={() => setShowPhotoInput(!showPhotoInput)}
                className="p-2 text-zinc-400 hover:text-pink-400 hover:bg-zinc-800 rounded-xl transition"
                title="Attach photo"
              >
                <ImageIcon className="w-5 h-5" />
              </button>

              <input
                id="chat-message-input"
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder={`Type a message to ${activeUser.full_name.split(' ')[0]}...`}
                className="flex-1 text-xs sm:text-sm bg-zinc-800 text-zinc-100 placeholder-zinc-500 rounded-2xl py-2.5 px-4 border border-zinc-700/70 focus:bg-zinc-800 focus:border-pink-500/50 focus:ring-2 focus:ring-pink-500/20 outline-none transition"
              />

              <button
                id="send-chat-message-btn"
                type="submit"
                disabled={!messageInput.trim() && !photoInputUrl.trim()}
                className="p-2.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-2xl shadow-md shadow-pink-500/20 hover:opacity-95 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </>
        ) : (
          <EmptyState
            icon={MessageCircle}
            title="Your Messages"
            description="Select a conversation from the left or match with someone to start chatting!"
            actionText="Go to Dating"
            onAction={() => navigate('dating')}
            className="m-auto"
          />
        )}
      </div>
    </div>
  );
};
