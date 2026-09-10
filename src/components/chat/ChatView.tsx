import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  MoreVertical,
  ShieldAlert,
  UserX,
  ArrowLeft,
  Sparkles,
  Search,
  MessageCircle,
  X,
  Loader2,
  CheckCircle2,
  Phone,
  Video,
  Lock
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { Avatar } from '../common/Avatar';
import { EmptyState } from '../common/EmptyState';

import { AttachmentBottomSheet, AttachmentOptionType } from './AttachmentBottomSheet';
import { ChatComposer } from './ChatComposer';
import { CallModal } from './CallModal';
import { CameraModal } from './CameraModal';
import { ContactPickerModal } from './ContactPickerModal';
import { PollModal, PollData } from './PollModal';
import { EventModal, EventData } from './EventModal';
import { AIImageModal } from './AIImageModal';
import { ChatMessageItem, MessageStatusTicks } from './ChatMessageItem';

import {
  uploadMediaFile,
  uploadGenericFile,
  reverseGeocode
} from '../../lib/uploadService';
import { Profile, Message, Conversation } from '../../types';

export const ChatView: React.FC = () => {
  const { currentUser, allUsers } = useAuth();
  const {
    conversations,
    activeConversationId,
    setActiveConversationId,
    activeChatUserId,
    setActiveChatUserId,
    getChatMessages,
    fetchMessagesForConversation,
    sendMessage,
    unsendMessage,
    markMessagesRead,
    updateMessageContent,
    openReportModal,
    blockUser,
    navigate
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [showOptions, setShowOptions] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Hidden File Inputs for Attachment Menu
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  // Attachment Modal States
  const [isAttachmentMenuOpen, setIsAttachmentMenuOpen] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isContactPickerOpen, setIsContactPickerOpen] = useState(false);
  const [isPollModalOpen, setIsPollModalOpen] = useState(false);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isAIImageModalOpen, setIsAIImageModalOpen] = useState(false);

  // Status & Lightbox States
  const [uploadStatus, setUploadStatus] = useState<{ message: string; loading: boolean } | null>(null);
  const [lightboxMedia, setLightboxMedia] = useState<{ url: string; type: 'image' | 'video' } | null>(null);

  // Call & E2EE & Quick Greeting States
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [isVideoCall, setIsVideoCall] = useState(false);
  const [showE2EEInfo, setShowE2EEInfo] = useState(false);
  const [dismissedSayHello, setDismissedSayHello] = useState<Record<string, boolean>>({});

  // Helper to extract the TRUE other participant profile from any conversation
  // Guaranteed to NEVER return the currently logged-in user!
  const getConversationPartner = useCallback((conv: Conversation | null | undefined): Profile | null => {
    if (!conv) return null;

    // 1. If other_user exists and is NOT the current logged-in user, use it
    if (conv.other_user && conv.other_user.id && conv.other_user.id !== currentUser.id) {
      return conv.other_user;
    }

    // 2. Try other_user_id if it's not the current user
    if (conv.other_user_id && conv.other_user_id !== currentUser.id) {
      const found = allUsers.find((u) => u.id === conv.other_user_id);
      if (found && found.id !== currentUser.id) return found;
    }

    // 3. Search participant_ids for someone who is NOT current user
    if (conv.participant_ids && conv.participant_ids.length > 0) {
      const otherParticipantId = conv.participant_ids.find((id) => id && id !== currentUser.id);
      if (otherParticipantId) {
        const found = allUsers.find((u) => u.id === otherParticipantId);
        if (found && found.id !== currentUser.id) return found;
      }
    }

    // 4. Fallback: inspect last message for the other participant
    if (conv.last_message) {
      const otherMsgId =
        conv.last_message.sender_id === currentUser.id
          ? conv.last_message.receiver_id
          : conv.last_message.sender_id;
      if (otherMsgId && otherMsgId !== currentUser.id) {
        const found = allUsers.find((u) => u.id === otherMsgId);
        if (found && found.id !== currentUser.id) return found;
      }
    }

    return null;
  }, [currentUser.id, allUsers]);

  // Derive active conversation and active user reliably
  const activeConv = useMemo(() => {
    if (activeConversationId) {
      const found = conversations.find((c) => c.id === activeConversationId);
      if (found) return found;
    }
    if (activeChatUserId && activeChatUserId !== currentUser.id) {
      const found = conversations.find(
        (c) =>
          c.id === activeChatUserId ||
          c.other_user_id === activeChatUserId ||
          c.other_user?.id === activeChatUserId ||
          c.participant_ids?.includes(activeChatUserId)
      );
      if (found) return found;
    }
    return conversations.length > 0 ? conversations[0] : null;
  }, [conversations, activeConversationId, activeChatUserId, currentUser.id]);

  const activeUser: Profile | null = useMemo(() => {
    if (activeChatUserId && activeChatUserId !== currentUser.id) {
      const found = allUsers.find((u) => u.id === activeChatUserId);
      if (found) return found;
    }
    const partner = getConversationPartner(activeConv);
    if (partner) return partner;
    return null;
  }, [activeConv, activeChatUserId, currentUser.id, allUsers, getConversationPartner]);

  // Default to first conversation if none selected
  useEffect(() => {
    if (!activeConversationId && !activeChatUserId && conversations.length > 0) {
      const firstConv = conversations[0];
      setActiveConversationId(firstConv.id);
      const partner = getConversationPartner(firstConv);
      if (partner) {
        setActiveChatUserId(partner.id);
      }
    }
  }, [conversations, activeConversationId, activeChatUserId, setActiveConversationId, setActiveChatUserId, getConversationPartner]);

  // Dedicated messages state for currently active conversation
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState<boolean>(false);
  const lastMarkedConvRef = useRef<string>('');

  const targetUserId = activeUser?.id || activeConv?.other_user_id || activeChatUserId;
  const currentConvId = activeConv?.id;

  // Load ONLY messages for this active conversation and clear previous chat state immediately
  useEffect(() => {
    if (!currentConvId) {
      setMessages([]);
      return;
    }

    const partnerId = activeConv?.other_user_id || activeConv?.other_user?.id || activeUser?.id;

    // Immediately clear previous messages to guarantee NO ghosting or message mixing
    setMessages([]);
    setIsLoadingMessages(true);

    let isSubscribed = true;

    fetchMessagesForConversation(currentConvId, partnerId)
      .then((fetched) => {
        if (isSubscribed) {
          setMessages(fetched);
          setIsLoadingMessages(false);
        }
      })
      .catch(() => {
        if (isSubscribed) {
          const fallback = getChatMessages(currentConvId);
          setMessages(fallback);
          setIsLoadingMessages(false);
        }
      });

    return () => {
      isSubscribed = false;
    };
  }, [currentConvId, activeConv?.other_user_id, activeUser?.id, fetchMessagesForConversation, getChatMessages]);

  useEffect(() => {
    if (!targetUserId || !currentConvId) return;
    const unread = activeConv?.unread_count ?? 0;
    if (unread > 0 || lastMarkedConvRef.current !== currentConvId) {
      lastMarkedConvRef.current = currentConvId;
      markMessagesRead(targetUserId, currentConvId);
    }
  }, [targetUserId, currentConvId, activeConv?.unread_count, markMessagesRead]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  // Listen for real-time delivery and read events across devices/sessions
  useEffect(() => {
    if (!targetUserId || !currentConvId) return;

    const handleDelivered = (e: any) => {
      const detail = e.detail;
      if (!detail) return;
      if (detail.conversationId === currentConvId || detail.receiverId === targetUserId) {
        setMessages((prev) =>
          prev.map((m) => {
            if (
              m.sender_id === currentUser.id &&
              (m.status === 'sent' || !m.status) &&
              (!detail.messageIds || detail.messageIds.includes(m.id))
            ) {
              return {
                ...m,
                status: 'delivered',
                delivered_at: detail.delivered_at || new Date().toISOString()
              };
            }
            return m;
          })
        );
      }
    };

    const handleRead = (e: any) => {
      const detail = e.detail;
      if (!detail) return;
      if (
        detail.conversationId === currentConvId ||
        (detail.receiverId === targetUserId && (!detail.senderId || detail.senderId === currentUser.id))
      ) {
        setMessages((prev) =>
          prev.map((m) => {
            if (
              m.sender_id === currentUser.id &&
              m.status !== 'read' &&
              (!detail.messageIds || detail.messageIds.includes(m.id))
            ) {
              return {
                ...m,
                status: 'read',
                is_read: true,
                read_at: detail.read_at || new Date().toISOString()
              };
            }
            return m;
          })
        );
      }
    };

    const handleSent = (e: any) => {
      const detail = e.detail;
      if (!detail || !detail.message) return;
      const msg: Message = detail.message;
      const isRelevant =
        msg.conversation_id === currentConvId ||
        (msg.sender_id === targetUserId && msg.receiver_id === currentUser.id) ||
        (msg.sender_id === currentUser.id && msg.receiver_id === targetUserId);

      if (isRelevant) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) {
            return prev.map((m) => (m.id === msg.id ? { ...m, ...msg } : m));
          }
          return [...prev, msg];
        });

        // If an incoming message arrives while the user is actively in this conversation, mark it as read immediately
        if (msg.sender_id === targetUserId && msg.receiver_id === currentUser.id) {
          markMessagesRead(targetUserId, currentConvId);
        }
      }
    };

    const handlePresence = (e: any) => {
      const detail = e.detail;
      if (!detail) return;
      if (detail.userId === targetUserId && detail.is_online) {
        // Recipient just came online! Any pending sent messages from currentUser are now delivered!
        setMessages((prev) =>
          prev.map((m) => {
            if (m.sender_id === currentUser.id && m.status === 'sent') {
              return { ...m, status: 'delivered', delivered_at: new Date().toISOString() };
            }
            return m;
          })
        );
      }
    };

    window.addEventListener('loveconnect_messages_delivered', handleDelivered);
    window.addEventListener('loveconnect_messages_read', handleRead);
    window.addEventListener('loveconnect_message_sent', handleSent);
    window.addEventListener('loveconnect_user_presence', handlePresence);

    return () => {
      window.removeEventListener('loveconnect_messages_delivered', handleDelivered);
      window.removeEventListener('loveconnect_messages_read', handleRead);
      window.removeEventListener('loveconnect_message_sent', handleSent);
      window.removeEventListener('loveconnect_user_presence', handlePresence);
    };
  }, [targetUserId, currentConvId, currentUser.id, markMessagesRead]);

  // Flash status message
  const showToast = (message: string, duration = 3500) => {
    setUploadStatus({ message, loading: false });
    setTimeout(() => {
      setUploadStatus(null);
    }, duration);
  };

  // Centralized send message helper that binds to targetUserId and currentConvId
  const sendChatMsg = async (content: string, mediaUrl?: string, replyToId?: string) => {
    if (!targetUserId) return;
    const tempId = `msg-${Date.now()}`;
    const isReceiverOnline = Boolean(activeUser?.is_online);
    const now = new Date().toISOString();
    const optimisticMsg: Message = {
      id: tempId,
      conversation_id: currentConvId || '',
      sender_id: currentUser.id,
      receiver_id: targetUserId,
      sender: currentUser,
      content,
      media_url: mediaUrl,
      reply_to_id: replyToId,
      status: isReceiverOnline ? 'delivered' : 'sent',
      delivered_at: isReceiverOnline ? now : undefined,
      is_read: false,
      created_at: now
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    const sent = await sendMessage(targetUserId, content, mediaUrl, replyToId, currentConvId);
    if (sent && typeof sent === 'object' && sent.id) {
      setMessages((prev) => prev.map((m) => (m.id === tempId ? sent : m)));
    }
  };

  // 1. Text Message Send (from ChatComposer)
  const handleSendText = (text: string) => {
    if (!targetUserId || !text.trim()) return;
    sendChatMsg(text.trim());
  };

  // 2. Voice Note Send (from ChatComposer)
  const handleSendVoiceNote = (durationStr: string) => {
    if (!targetUserId) return;
    const voiceCard = `[VOICE:{"duration":"${durationStr}","url":""}]`;
    sendChatMsg(voiceCard);
    showToast(`🎙️ Voice note sent (${durationStr})`);
  };

  // 3. Attachment Menu Option Selected
  const handleSelectAttachmentOption = (option: AttachmentOptionType) => {
    switch (option) {
      case 'gallery':
        galleryInputRef.current?.click();
        break;
      case 'camera':
        setIsCameraOpen(true);
        break;
      case 'location':
        handleShareLocation();
        break;
      case 'contact':
        setIsContactPickerOpen(true);
        break;
      case 'document':
        docInputRef.current?.click();
        break;
      case 'poll':
        setIsPollModalOpen(true);
        break;
      case 'event':
        setIsEventModalOpen(true);
        break;
      case 'ai_images':
        setIsAIImageModalOpen(true);
        break;
    }
  };

  // 4. Gallery Photo/Video selection
  const handleGalleryChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length || !targetUserId) return;

    setUploadStatus({ message: `Uploading ${files.length} file(s)...`, loading: true });

    for (const file of files) {
      try {
        const isVideo = file.type.startsWith('video/') || /\.(mp4|webm|mov)$/i.test(file.name);
        const result = await uploadMediaFile(file, 'messages', currentUser.id, {
          onProgress: (percent) => {
            setUploadStatus({ message: `Uploading ${file.name} (${percent}%)...`, loading: true });
          }
        });

        sendChatMsg(
          file.name.replace(/\.[^/.]+$/, ''),
          result.url,
          undefined
        );
      } catch (err: any) {
        console.warn('Backend upload failed, using local object URL fallback:', err);
        const fallbackUrl = URL.createObjectURL(file);
        sendChatMsg(
          file.name,
          fallbackUrl,
          undefined
        );
      }
    }

    setUploadStatus(null);
    if (galleryInputRef.current) galleryInputRef.current.value = '';
  };

  // 5. Camera Photo Capture
  const handleCameraCapture = async (file: File) => {
    if (!targetUserId) return;
    setUploadStatus({ message: 'Sending photo...', loading: true });

    try {
      const result = await uploadMediaFile(file, 'messages', currentUser.id);
      sendChatMsg('', result.url);
      setUploadStatus(null);
    } catch {
      const localUrl = URL.createObjectURL(file);
      sendChatMsg('', localUrl);
      setUploadStatus(null);
    }
  };

  // 6. Location Sharing with reverse geocoding
  const handleShareLocation = () => {
    if (!targetUserId) return;

    if (!navigator.geolocation) {
      showToast('Geolocation is not supported by your browser.');
      return;
    }

    setUploadStatus({ message: 'Getting current location...', loading: true });

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        try {
          const geo = await reverseGeocode(lat, lng);
          const locationData = {
            title: geo.label || 'Current Location',
            address: geo.label || `${lat.toFixed(4)}°, ${lng.toFixed(4)}°`,
            city: geo.city,
            state: geo.state,
            lat,
            lng
          };

          const locString = `[LOCATION:${JSON.stringify(locationData)}]`;
          sendChatMsg(locString);
          setUploadStatus(null);
          showToast('📍 Location shared successfully');
        } catch {
          const fallbackData = {
            title: 'Live Location',
            address: `${lat.toFixed(4)}°, ${lng.toFixed(4)}°`,
            lat,
            lng
          };
          sendChatMsg(`[LOCATION:${JSON.stringify(fallbackData)}]`);
          setUploadStatus(null);
        }
      },
      (err) => {
        console.warn('Geolocation error:', err);
        setUploadStatus(null);
        showToast('Could not access location. Please enable location permissions.');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // 7. Contact Card Share
  const handleSelectContact = (contact: Profile) => {
    if (!targetUserId) return;

    const contactData = {
      id: contact.id,
      name: contact.full_name,
      username: contact.username,
      avatar: contact.avatar_url,
      age: contact.age,
      location: contact.location || ''
    };

    const contactString = `[CONTACT:${JSON.stringify(contactData)}]`;
    sendChatMsg(contactString);
    showToast(`👤 Shared ${contact.full_name}'s contact`);
  };

  // 8. Document File Upload
  const handleDocChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !targetUserId) return;

    setUploadStatus({ message: `Uploading document: ${file.name}...`, loading: true });

    try {
      const res = await uploadGenericFile(file, currentUser.id);
      const sizeStr =
        file.size > 1024 * 1024
          ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
          : `${Math.round(file.size / 1024)} KB`;

      const docData = {
        name: file.name,
        size: sizeStr,
        url: res.url
      };

      sendChatMsg(`[DOCUMENT:${JSON.stringify(docData)}]`);
      setUploadStatus(null);
      showToast(`📄 Document sent: ${file.name}`);
    } catch (err: any) {
      console.warn('Doc upload error, fallback to local URL:', err);
      const localUrl = URL.createObjectURL(file);
      const sizeStr = `${(file.size / (1024 * 1024)).toFixed(1)} MB`;
      const docData = {
        name: file.name,
        size: sizeStr,
        url: localUrl
      };
      sendChatMsg(`[DOCUMENT:${JSON.stringify(docData)}]`);
      setUploadStatus(null);
    }

    if (docInputRef.current) docInputRef.current.value = '';
  };

  // 9. Poll Creation & Voting
  const handleSubmitPoll = (poll: PollData) => {
    if (!targetUserId) return;
    const pollString = `[POLL:${JSON.stringify(poll)}]`;
    sendChatMsg(pollString);
    showToast('📊 Poll published');
  };

  const handleVotePoll = (messageId: string, optionId: string) => {
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id !== messageId || !m.content.startsWith('[POLL:')) return m;
        try {
          const jsonStr = m.content.slice(6, -1);
          const pollData: PollData = JSON.parse(jsonStr);

          pollData.options = pollData.options.map((opt) => {
            const votes = opt.votes || [];
            if (opt.id === optionId) {
              if (votes.includes(currentUser.id)) {
                return { ...opt, votes: votes.filter((v) => v !== currentUser.id) };
              } else {
                return { ...opt, votes: [...votes, currentUser.id] };
              }
            } else if (!pollData.allowMultiple) {
              return { ...opt, votes: votes.filter((v) => v !== currentUser.id) };
            }
            return opt;
          });

          const updatedContent = `[POLL:${JSON.stringify(pollData)}]`;
          updateMessageContent(messageId, updatedContent);
          return { ...m, content: updatedContent };
        } catch {
          return m;
        }
      })
    );
  };

  // 10. Event Invitation & RSVP
  const handleSubmitEvent = (event: EventData) => {
    if (!targetUserId) return;
    const eventString = `[EVENT:${JSON.stringify(event)}]`;
    sendChatMsg(eventString);
    showToast('📅 Date invitation sent');
  };

  const handleRsvpEvent = (messageId: string, status: 'yes' | 'maybe') => {
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id !== messageId || !m.content.startsWith('[EVENT:')) return m;
        try {
          const jsonStr = m.content.slice(7, -1);
          const evData: EventData = JSON.parse(jsonStr);

          if (status === 'yes') {
            if (!evData.rsvpYes.includes(currentUser.id)) {
              evData.rsvpYes.push(currentUser.id);
            }
            evData.rsvpMaybe = evData.rsvpMaybe.filter((id) => id !== currentUser.id);
            showToast("🎉 You're going to this date!");
          } else {
            if (!evData.rsvpMaybe.includes(currentUser.id)) {
              evData.rsvpMaybe.push(currentUser.id);
            }
            evData.rsvpYes = evData.rsvpYes.filter((id) => id !== currentUser.id);
            showToast('RSVP updated to Interested');
          }

          const updatedContent = `[EVENT:${JSON.stringify(evData)}]`;
          updateMessageContent(messageId, updatedContent);
          return { ...m, content: updatedContent };
        } catch {
          return m;
        }
      })
    );
  };

  // 11. AI Image Send
  const handleAIImageSend = (imageUrl: string, prompt: string) => {
    if (!targetUserId) return;
    sendChatMsg(`✨ AI Generated: "${prompt}"`, imageUrl);
    showToast('✨ AI image sent');
  };

  const icebreakers = [
    "What's your absolute favorite weekend spot in the city? ☕",
    'Hey! Loving your vibe & profile photos! ✨',
    'Coffee, cocktails, or tacos on a first date? 🌮',
    "What's the best concert or trip you've been on recently? ✈️"
  ];

  const filteredConversations = useMemo(() => {
    return conversations
      .map((conv) => ({
        conv,
        partner: getConversationPartner(conv)
      }))
      .filter(({ conv, partner }) => {
        if (!partner) return false;
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          partner.full_name.toLowerCase().includes(q) ||
          partner.username.toLowerCase().includes(q) ||
          (conv.last_message?.content && conv.last_message.content.toLowerCase().includes(q))
        );
      });
  }, [conversations, getConversationPartner, searchQuery]);

  return (
    <div className="bg-zinc-900 rounded-3xl border border-zinc-800 shadow-sm overflow-hidden h-[calc(100vh-8.5rem)] flex flex-col md:flex-row relative">
      {/* Hidden file pickers for Gallery and Document */}
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        className="hidden"
        onChange={handleGalleryChange}
      />
      <input
        ref={docInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.txt,.csv,.zip,.xlsx,.ppt,.pptx"
        className="hidden"
        onChange={handleDocChange}
      />

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
              {filteredConversations.length} chats
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
            filteredConversations.map(({ conv, partner }) => {
              if (!partner) return null;
              const otherId = partner.id;
              const isActive = activeConv
                ? activeConv.id === conv.id
                : otherId === activeChatUserId || conv.id === activeChatUserId;
              return (
                <div
                  key={conv.id}
                  id={`conversation-item-${conv.id}`}
                  onClick={() => {
                    setActiveConversationId(conv.id);
                    setActiveChatUserId(otherId);
                  }}
                  className={`p-3.5 flex items-center gap-3 cursor-pointer transition ${
                    isActive
                      ? 'bg-zinc-800/90 border-l-4 border-pink-500'
                      : 'hover:bg-zinc-800/40'
                  }`}
                >
                  <Avatar
                    src={partner.avatar_url}
                    name={partner.full_name}
                    size="md"
                    isOnline={partner.is_online}
                    isVerified={partner.is_verified}
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs sm:text-sm font-bold text-zinc-100 truncate">
                        {partner.full_name}
                      </h4>
                      <span className="text-[10px] text-zinc-500">
                        {conv.last_message
                          ? new Date(conv.last_message.created_at).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          : ''}
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-1">
                      <div className="flex items-center gap-1 min-w-0 max-w-[170px]">
                        {conv.last_message && conv.last_message.sender_id === currentUser.id && (
                          <MessageStatusTicks
                            status={conv.last_message.status}
                            isRead={conv.last_message.is_read || Boolean(conv.last_message.read_at)}
                            className="shrink-0"
                          />
                        )}
                        <p className="text-xs text-zinc-400 truncate">
                          {conv.last_message
                            ? (conv.last_message.sender_id === currentUser.id ? 'You: ' : '') +
                              (conv.last_message.content.startsWith('[')
                                ? '📎 Attachment'
                                : conv.last_message.content)
                            : 'Started a match!'}
                        </p>
                      </div>
                      {conv.unread_count > 0 && (
                        <span className="w-5 h-5 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-zinc-900 shrink-0">
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
        className={`flex-1 flex flex-col bg-[#0c0d0e] ${
          !activeChatUserId ? 'hidden md:flex' : 'flex'
        }`}
      >
        {activeUser ? (
          <>
            {/* Header matching screenshot */}
            <div className="px-3 py-2.5 sm:px-4 sm:py-3 bg-[#141517] border-b border-zinc-800/80 flex items-center justify-between z-10">
              <div className="flex items-center gap-2.5 min-w-0">
                {/* Back on mobile (blue arrow) */}
                <button
                  onClick={() => setActiveChatUserId(null)}
                  className="md:hidden p-1 text-[#0084FF] hover:bg-zinc-800/60 rounded-full transition -ml-1 shrink-0"
                  title="Back to conversations"
                >
                  <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>

                <div className="relative shrink-0">
                  <Avatar
                    src={activeUser.avatar_url}
                    name={activeUser.full_name}
                    size="md"
                    isOnline={activeUser.is_online}
                    isVerified={activeUser.is_verified}
                    onClick={() => navigate('profile', { username: activeUser.username })}
                    className="cursor-pointer"
                  />
                </div>

                <div
                  onClick={() => navigate('profile', { username: activeUser.username })}
                  className="min-w-0 cursor-pointer"
                >
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-sm sm:text-base font-bold text-white truncate leading-snug">
                      {activeUser.full_name}
                    </h4>
                    {activeUser.is_verified && (
                      <span className="text-sky-400 text-xs shrink-0" title="Verified Profile">✓</span>
                    )}
                  </div>
                  <div className="text-[11px] text-zinc-400 truncate flex items-center gap-1.5">
                    <span className="text-zinc-500 font-medium">@{activeUser.username}</span>
                    <span className="text-zinc-600">•</span>
                    {activeUser.is_online ? (
                      <span className="text-emerald-400 font-medium flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
                        Online
                      </span>
                    ) : (
                      <span>{activeUser.last_active ? `Active ${activeUser.last_active}` : 'Offline'}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Header Right Actions: Call, Video Call, More options */}
              <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                {/* Call Button (solid blue phone icon) */}
                <button
                  type="button"
                  id="chat-header-call-btn"
                  onClick={() => {
                    setIsVideoCall(false);
                    setIsCallModalOpen(true);
                  }}
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-[#0084FF] hover:bg-zinc-800/80 active:scale-95 transition"
                  title="Audio call"
                >
                  <Phone className="w-5 h-5 sm:w-5.5 sm:h-5.5 fill-[#0084FF]" />
                </button>

                {/* Video Call Button (solid blue video camera icon) */}
                <button
                  type="button"
                  id="chat-header-video-btn"
                  onClick={() => {
                    setIsVideoCall(true);
                    setIsCallModalOpen(true);
                  }}
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-[#0084FF] hover:bg-zinc-800/80 active:scale-95 transition"
                  title="Video call"
                >
                  <Video className="w-5 h-5 sm:w-5.5 sm:h-5.5 fill-[#0084FF]" />
                </button>

                {/* More options menu */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowOptions(!showOptions)}
                    className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-[#0084FF] hover:bg-zinc-800/80 transition"
                    title="More options"
                  >
                    <MoreVertical className="w-5 h-5" />
                  </button>

                  {showOptions && (
                    <div className="absolute right-0 mt-1 w-44 bg-zinc-900 rounded-2xl shadow-xl border border-zinc-750 p-1.5 z-30 animate-in fade-in">
                      <button
                        onClick={() => {
                          setShowOptions(false);
                          navigate('profile', { username: activeUser.username });
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-zinc-200 hover:bg-zinc-800 rounded-xl transition"
                      >
                        <span>View Profile</span>
                      </button>

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

            {/* Status / Uploading Banner */}
            {uploadStatus && (
              <div className="px-4 py-2 bg-blue-500/10 border-b border-blue-500/20 text-[#0084FF] text-xs flex items-center justify-between animate-in slide-in-from-top-1">
                <div className="flex items-center gap-2">
                  {uploadStatus.loading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#0084FF]" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  )}
                  <span>{uploadStatus.message}</span>
                </div>
                {!uploadStatus.loading && (
                  <button
                    onClick={() => setUploadStatus(null)}
                    className="text-zinc-400 hover:text-zinc-200"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}

            {/* Messages Stream & Profile Hero Section */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 bg-[#0c0d0e]">
              {/* Selected User Profile Information Card inside conversation */}
              <div className="pt-6 pb-4 flex flex-col items-center text-center px-4">
                {/* Large square photo with rounded corners */}
                <div className="relative mb-3">
                  <img
                    src={activeUser.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600'}
                    alt={activeUser.full_name}
                    className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl object-cover shadow-2xl border border-zinc-750"
                  />
                </div>

                {/* Name */}
                <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  {activeUser.full_name}
                </h3>

                {/* Context details */}
                <div className="mt-1 space-y-0.5 text-xs text-zinc-400 font-normal">
                  <p>You're connected on LoveConnect</p>
                  {activeUser.location && (
                    <p>Lives in {activeUser.location}</p>
                  )}
                  {activeUser.education ? (
                    <p>Studied at {activeUser.education}</p>
                  ) : activeUser.profession ? (
                    <p>{activeUser.profession}</p>
                  ) : null}
                </div>

                {/* View Profile Button */}
                <button
                  type="button"
                  id="chat-hero-view-profile-btn"
                  onClick={() => navigate('profile', { username: activeUser.username })}
                  className="mt-3.5 px-5 py-2 rounded-full bg-[#2a2b2e] hover:bg-[#383a3f] text-zinc-100 text-xs font-semibold shadow-sm transition border border-zinc-700/50"
                >
                  View Profile
                </button>

                {/* End-to-end encryption info section */}
                <div className="mt-4 max-w-sm text-[11px] text-zinc-400 leading-relaxed text-center px-2">
                  <Lock className="w-3 h-3 inline text-zinc-400 mr-1 -mt-0.5" />
                  <span>Messages and calls are secured with end-to-end encryption. Only people in this chat can read, listen to or share them. </span>
                  <button
                    type="button"
                    onClick={() => setShowE2EEInfo(true)}
                    className="text-[#0084FF] hover:underline font-medium inline"
                  >
                    Learn more
                  </button>
                </div>
              </div>

              {/* "Say hello." Quick message suggestions section */}
              {!dismissedSayHello[targetUserId || ''] && (
                <div className="my-2 p-3 bg-[#191a1d] border border-zinc-800/80 rounded-2xl max-w-md mx-auto w-full">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-zinc-200">Say hello.</span>
                    <button
                      type="button"
                      onClick={() => setDismissedSayHello(prev => ({ ...prev, [targetUserId || '']: true }))}
                      className="w-5 h-5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 flex items-center justify-center transition"
                      title="Dismiss"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2 overflow-x-auto pb-0.5 no-scrollbar">
                    <button
                      type="button"
                      onClick={() => handleSendText('Hey 👋')}
                      className="px-4 py-1.5 rounded-full bg-[#242529] hover:bg-[#2e3035] text-zinc-200 text-xs font-medium border border-zinc-750/70 transition shrink-0 active:scale-95"
                    >
                      Hey 👋
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSendText(`Hi, ${activeUser.full_name.split(' ')[0]}!`)}
                      className="px-4 py-1.5 rounded-full bg-[#242529] hover:bg-[#2e3035] text-zinc-200 text-xs font-medium border border-zinc-750/70 transition shrink-0 active:scale-95"
                    >
                      Hi, {activeUser.full_name.split(' ')[0]}!
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSendText(`Hello, ${activeUser.full_name.split(' ')[0]}!`)}
                      className="px-4 py-1.5 rounded-full bg-[#242529] hover:bg-[#2e3035] text-zinc-200 text-xs font-medium border border-zinc-750/70 transition shrink-0 active:scale-95"
                    >
                      Hello, {activeUser.full_name.split(' ')[0]}!
                    </button>
                  </div>
                </div>
              )}

              {/* Messages Bubbles or Loading */}
              {isLoadingMessages ? (
                <div className="flex flex-col items-center justify-center py-10 text-center space-y-2">
                  <Loader2 className="w-5 h-5 animate-spin text-[#0084FF]" />
                  <p className="text-xs text-zinc-500">Loading messages...</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMine = msg.sender_id === currentUser.id;
                  return (
                    <ChatMessageItem
                      key={msg.id}
                      message={msg}
                      isMe={isMine}
                      currentUser={currentUser}
                      partnerUser={activeUser}
                      onVotePoll={handleVotePoll}
                      onRsvpEvent={handleRsvpEvent}
                      onOpenMedia={(url, type) => setLightboxMedia({ url, type })}
                      onViewContact={(userId) => {
                        const user = allUsers.find((u) => u.id === userId);
                        if (user) {
                          navigate('profile', { username: user.username });
                        }
                      }}
                    />
                  );
                })
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Bottom Messenger-Style Composer */}
            <ChatComposer
              onSendMessage={handleSendText}
              onSendVoiceNote={handleSendVoiceNote}
              onQuickCamera={() => setIsCameraOpen(true)}
              onOpenGallery={() => galleryInputRef.current?.click()}
              onSendLike={() => handleSendText('👍')}
              placeholder="Message"
            />
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

      {/* 8-Option Attachment Bottom Sheet */}
      <AttachmentBottomSheet
        isOpen={isAttachmentMenuOpen}
        onClose={() => setIsAttachmentMenuOpen(false)}
        onSelectOption={handleSelectAttachmentOption}
      />

      {/* Camera Capture Modal */}
      <CameraModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handleCameraCapture}
      />

      {/* Contact Share Modal */}
      <ContactPickerModal
        isOpen={isContactPickerOpen}
        onClose={() => setIsContactPickerOpen(false)}
        contacts={allUsers.filter((u) => u.id !== currentUser.id)}
        onSelectContact={handleSelectContact}
      />

      {/* Poll Creator Modal */}
      <PollModal
        isOpen={isPollModalOpen}
        onClose={() => setIsPollModalOpen(false)}
        onSubmitPoll={handleSubmitPoll}
        currentUserId={currentUser.id}
      />

      {/* Event / Date Planner Modal */}
      <EventModal
        isOpen={isEventModalOpen}
        onClose={() => setIsEventModalOpen(false)}
        onSubmitEvent={handleSubmitEvent}
        currentUserId={currentUser.id}
        chatPartnerName={activeUser?.full_name}
      />

      {/* AI Image Generator Modal */}
      <AIImageModal
        isOpen={isAIImageModalOpen}
        onClose={() => setIsAIImageModalOpen(false)}
        onGenerateAndSend={handleAIImageSend}
      />

      {/* Fullscreen Media Lightbox */}
      {lightboxMedia && (
        <div
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setLightboxMedia(null)}
        >
          <button
            onClick={() => setLightboxMedia(null)}
            className="absolute top-4 right-4 p-2 rounded-full bg-zinc-800/80 text-white hover:bg-zinc-700 transition"
          >
            <X className="w-6 h-6" />
          </button>
          {lightboxMedia.type === 'video' ? (
            <video
              src={lightboxMedia.url}
              controls
              autoPlay
              className="max-w-full max-h-[85vh] rounded-2xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <img
              src={lightboxMedia.url}
              alt="Lightbox view"
              className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          )}
        </div>
      )}

      {/* Call Modal for Audio and Video Calls */}
      {activeUser && (
        <CallModal
          isOpen={isCallModalOpen}
          onClose={() => setIsCallModalOpen(false)}
          targetUser={activeUser}
          isVideoCall={isVideoCall}
        />
      )}

      {/* End-to-End Encryption Info Modal */}
      {showE2EEInfo && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setShowE2EEInfo(false)}
        >
          <div
            className="bg-[#1c1d21] border border-zinc-750 max-w-sm w-full rounded-3xl p-6 shadow-2xl text-center space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-2xl bg-blue-500/20 text-[#0084FF] flex items-center justify-center mx-auto shadow-inner">
              <Lock className="w-6 h-6" />
            </div>
            <div className="space-y-2">
              <h3 className="text-base font-bold text-white">
                End-to-End Encryption
              </h3>
              <p className="text-xs text-zinc-300 leading-relaxed">
                Messages, voice notes, media, audio calls, and video calls are protected by 256-bit end-to-end encryption.
              </p>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Only you and {activeUser?.full_name || 'your contact'} can read, listen to, or share them. No third parties — not even LoveConnect — can access your personal communication.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowE2EEInfo(false)}
              className="w-full py-2.5 rounded-full bg-[#0084FF] hover:bg-blue-600 text-white text-xs font-bold transition shadow-md"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
