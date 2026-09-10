import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  Post,
  Story,
  Reel,
  Match,
  Connection,
  AppNotification,
  Conversation,
  Message,
  Profile,
  Report,
  ReportReason
} from '../types';
import { api } from '../lib/api';
import { store } from '../lib/storage';
import { useAuth } from './AuthContext';

export type AppRoute =
  | 'home'
  | 'discover'
  | 'dating'
  | 'likes'
  | 'matches'
  | 'messages'
  | 'notifications'
  | 'friends'
  | 'connections'
  | 'reels'
  | 'stories'
  | 'saved'
  | 'settings'
  | 'safety'
  | 'admin'
  | 'profile'
  | 'post'
  | 'search'
  | 'gmail'
  | 'help';

interface AppContextType {
  currentRoute: AppRoute;
  navigate: (route: AppRoute, params?: { username?: string; postId?: string; userId?: string; query?: string }) => void;
  routeParams: { username?: string; postId?: string; userId?: string; query?: string };
  
  // Data
  posts: Post[];
  stories: Story[];
  reels: Reel[];
  matches: Match[];
  connections: Connection[];
  conversations: Conversation[];
  notifications: AppNotification[];
  savedPosts: Post[];
  blockedUsers: Profile[];
  reports: Report[];
  unreadNotifsCount: number;
  unreadMessagesCount: number;
  isLoadingData: boolean;

  // Actions
  refreshAllData: () => Promise<void>;
  createPost: (content: string, media?: { url: string; type: 'image' | 'video' }[], feeling?: string, location?: string, privacy?: 'PUBLIC' | 'CONNECTIONS_ONLY' | 'PRIVATE') => Promise<void>;
  likePost: (postId: string) => Promise<void>;
  addComment: (postId: string, content: string) => Promise<void>;
  addCommentReply: (postId: string, commentId: string, content: string) => Promise<void>;
  deletePost: (postId: string) => Promise<void>;
  editPost: (postId: string, newContent: string) => Promise<void>;
  toggleSavePost: (postId: string) => Promise<void>;

  // Stories
  createStory: (mediaUrl: string, mediaType?: 'image' | 'video', textOverlay?: string) => Promise<void>;
  markStorySeen: (storyId: string) => Promise<void>;
  reactToStory: (storyId: string, emoji: string) => Promise<void>;
  activeStoryIndex: number | null;
  openStoryViewer: (index: number) => void;
  closeStoryViewer: () => void;

  // Dating & Match
  likeProfile: (toUserId: string, isSuperLike?: boolean) => Promise<{ isMatch: boolean; match?: Match }>;
  passProfile: (toUserId: string) => Promise<void>;
  undoDatingAction: () => Promise<void>;
  unmatch: (matchId: string) => Promise<void>;
  activeMatchCelebration: Match | null;
  dismissMatchCelebration: () => void;

  // Connections
  sendConnectionRequest: (userId: string) => Promise<void>;
  acceptConnection: (connectionId: string) => Promise<void>;
  rejectConnection: (connectionId: string) => Promise<void>;
  removeConnection: (connectionId: string) => Promise<void>;

  // Chat
  activeConversationId: string | null;
  setActiveConversationId: (convId: string | null) => void;
  activeChatUserId: string | null;
  setActiveChatUserId: (userId: string | null) => void;
  getChatMessages: (userIdOrConvId: string) => Message[];
  fetchMessagesForConversation: (convId: string, otherUserId?: string) => Promise<Message[]>;
  sendMessage: (receiverId: string, content: string, mediaUrl?: string, replyToId?: string, conversationId?: string) => Promise<Message | void>;
  unsendMessage: (messageId: string) => Promise<void>;
  markMessagesRead: (userId: string, conversationId?: string) => Promise<void>;
  updateMessageContent: (messageId: string, newContent: string) => void;

  // Reels
  likeReel: (reelId: string) => Promise<void>;
  saveReel: (reelId: string) => Promise<void>;
  shareReel: (reelId: string) => Promise<void>;
  commentReel: (reelId: string, content: string) => Promise<any>;
  createReel: (videoUrl: string, caption: string, musicTitle?: string) => Promise<void>;
  deleteReel: (reelId: string) => Promise<void>;

  // Toast
  toast: { message: string; type: 'success' | 'error' | 'info'; id: number } | null;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;

  // Notifications
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;

  // Moderation & Safety
  reportModalData: { targetType: Report['target_type']; targetId: string; targetTitle?: string } | null;
  openReportModal: (targetType: Report['target_type'], targetId: string, targetTitle?: string) => void;
  closeReportModal: () => void;
  submitReport: (reason: ReportReason, details: string) => Promise<void>;
  blockUser: (userId: string) => Promise<void>;
  unblockUser: (userId: string) => Promise<void>;

  // Search
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const getRouteFromUrl = (): AppRoute => {
  if (typeof window === 'undefined') return 'home';
  const path = window.location.pathname.replace(/^\/+|\/+$/g, '').toLowerCase();
  const validRoutes: AppRoute[] = [
    'home', 'discover', 'dating', 'matches', 'likes', 'messages',
    'connections', 'friends', 'reels', 'saved', 'notifications',
    'safety', 'help', 'admin', 'settings', 'profile', 'search'
  ];
  if (validRoutes.includes(path as AppRoute)) {
    return path as AppRoute;
  }
  return 'home';
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();

  const [currentRoute, setCurrentRoute] = useState<AppRoute>(() => getRouteFromUrl());
  const [routeParams, setRouteParams] = useState<{ username?: string; postId?: string; userId?: string; query?: string }>({});

  const [posts, setPosts] = useState<Post[]>(store.getPosts());
  const [stories, setStories] = useState<Story[]>(store.getStories());
  const [reels, setReels] = useState<Reel[]>(store.getReels());
  const [matches, setMatches] = useState<Match[]>(store.getMatches());
  const [connections, setConnections] = useState<Connection[]>(store.getConnections());
  const [conversations, setConversations] = useState<Conversation[]>(store.getConversations());
  const [notifications, setNotifications] = useState<AppNotification[]>(store.getNotifications());
  const [savedPosts, setSavedPosts] = useState<Post[]>(store.getSavedPosts());
  const [blockedUsers, setBlockedUsers] = useState<Profile[]>(store.getBlockedUsers());
  const [reports, setReports] = useState<Report[]>(store.getReports());
  const [isLoadingData, setIsLoadingData] = useState<boolean>(false);

  const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [activeChatUserId, setActiveChatUserId] = useState<string | null>(null);
  const [activeMatchCelebration, setActiveMatchCelebration] = useState<Match | null>(null);
  const [reportModalData, setReportModalData] = useState<{ targetType: Report['target_type']; targetId: string; targetTitle?: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info'; id: number } | null>(null);
  const syncChannelRef = useRef<BroadcastChannel | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now();
    setToast({ message, type, id });
    setTimeout(() => {
      setToast(prev => (prev?.id === id ? null : prev));
    }, 3200);
  }, []);

  const refreshAllData = useCallback(async () => {
    if (!currentUser?.id) return;
    try {
      const [
        fetchedPosts,
        fetchedStories,
        fetchedReels,
        fetchedMatches,
        fetchedConns,
        fetchedConvs,
        fetchedNotifs,
        fetchedBlocks
      ] = await Promise.all([
        api.getPosts(currentUser.id),
        api.getStories(),
        api.getReels(),
        api.getMatches(currentUser.id),
        api.getConnections(currentUser.id),
        api.getConversations(currentUser.id),
        api.getNotifications(currentUser.id),
        api.getBlockedUsers(currentUser.id)
      ]);

      if (fetchedPosts) {
        setPosts(fetchedPosts);
        setSavedPosts(fetchedPosts.filter(p => p.saved_by_me));
      }
      if (fetchedStories) setStories(fetchedStories);
      if (fetchedReels) setReels(fetchedReels);
      if (fetchedMatches) setMatches(fetchedMatches);
      if (fetchedConns) setConnections(fetchedConns);
      if (fetchedConvs) setConversations(fetchedConvs);
      if (fetchedNotifs) setNotifications(fetchedNotifs);
      if (fetchedBlocks) setBlockedUsers(fetchedBlocks);
    } catch {
      // Fallback to local storage store
      setPosts(store.getPosts());
      setStories(store.getStories());
      setReels(store.getReels());
      setMatches(store.getMatches());
      setConnections(store.getConnections());
      setConversations(store.getConversations());
      setNotifications(store.getNotifications());
      setSavedPosts(store.getSavedPosts());
      setBlockedUsers(store.getBlockedUsers());
      setReports(store.getReports());
    }
  }, [currentUser?.id]);

  useEffect(() => {
    refreshAllData();
    // Fast polling fallback for background multi-device sync
    const interval = setInterval(refreshAllData, 4000);

    // 1. Real-time Server-Sent Events (SSE) for instant cross-device updates (phone, laptop, tablet)
    let es: EventSource | null = null;
    let reconnectTimer: any = null;

    const setupSSE = () => {
      try {
        const uid = currentUser?.id || 'user-suresh';
        es = new EventSource(`/api/sync/events?userId=${encodeURIComponent(uid)}`);
        es.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'POST_DELETED' && data.id) {
              setPosts(prev => prev.filter(p => p.id !== data.id));
              setSavedPosts(prev => prev.filter(p => p.id !== data.id));
              store.deletePost(data.id);
              refreshAllData();
            } else if (data.type === 'REEL_DELETED' && data.id) {
              setReels(prev => prev.filter(r => r.id !== data.id));
              store.deleteReel(data.id);
              refreshAllData();
            } else if (data.type === 'POST_CREATED' || data.type === 'REEL_CREATED') {
              refreshAllData();
            } else if (data.type === 'MESSAGES_DELIVERED') {
              store.markMessagesDelivered(data.receiverId, data.messageIds);
              window.dispatchEvent(new CustomEvent('loveconnect_messages_delivered', { detail: data }));
            } else if (data.type === 'MESSAGES_READ') {
              store.markMessagesRead(data.receiverId, data.conversationId);
              setConversations(store.getConversations());
              window.dispatchEvent(new CustomEvent('loveconnect_messages_read', { detail: data }));
            } else if (data.type === 'MESSAGE_SENT') {
              window.dispatchEvent(new CustomEvent('loveconnect_message_sent', { detail: data }));
              setConversations(store.getConversations());
              refreshAllData();
            } else if (data.type === 'USER_PRESENCE') {
              store.updateProfile(data.userId, { is_online: data.is_online });
              window.dispatchEvent(new CustomEvent('loveconnect_user_presence', { detail: data }));
            }
          } catch {}
        };

        es.onerror = () => {
          es?.close();
          reconnectTimer = setTimeout(setupSSE, 3500);
        };
      } catch (err) {
        console.warn('SSE connection init error:', err);
      }
    };

    setupSSE();

    // 2. BroadcastChannel for instant cross-window sync during multi-device testing
    let channel: BroadcastChannel | null = null;
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        channel = new BroadcastChannel('loveconnect_sync_channel');
        syncChannelRef.current = channel;
        channel.onmessage = (e) => {
          const data = e.data;
          if (data?.type === 'POST_DELETED' && data.id) {
            setPosts(prev => prev.filter(p => p.id !== data.id));
            setSavedPosts(prev => prev.filter(p => p.id !== data.id));
            store.deletePost(data.id);
            refreshAllData();
          } else if (data?.type === 'REEL_DELETED' && data.id) {
            setReels(prev => prev.filter(r => r.id !== data.id));
            store.deleteReel(data.id);
            refreshAllData();
          } else if (data?.type === 'REFRESH_ALL') {
            refreshAllData();
          } else if (data?.type === 'MESSAGES_DELIVERED') {
            store.markMessagesDelivered(data.receiverId, data.messageIds);
            window.dispatchEvent(new CustomEvent('loveconnect_messages_delivered', { detail: data }));
          } else if (data?.type === 'MESSAGES_READ') {
            store.markMessagesRead(data.receiverId, data.conversationId);
            setConversations(store.getConversations());
            window.dispatchEvent(new CustomEvent('loveconnect_messages_read', { detail: data }));
          } else if (data?.type === 'MESSAGE_SENT') {
            window.dispatchEvent(new CustomEvent('loveconnect_message_sent', { detail: data }));
            setConversations(store.getConversations());
          } else if (data?.type === 'USER_PRESENCE') {
            store.updateProfile(data.userId, { is_online: data.is_online });
            window.dispatchEvent(new CustomEvent('loveconnect_user_presence', { detail: data }));
          }
        };
      } catch {}
    }

    // 3. Mobile screen wake-up / browser tab focus listener
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        refreshAllData();
      }
    };
    const handleFocus = () => {
      refreshAllData();
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleFocus);

    const unsub = store.subscribe(() => {
      setConversations(store.getConversations());
      setNotifications(store.getNotifications());
      setMatches(store.getMatches());
      setConnections(store.getConnections());
    });

    const handlePopState = () => {
      setCurrentRoute(getRouteFromUrl());
    };
    window.addEventListener('popstate', handlePopState);

    return () => {
      clearInterval(interval);
      clearTimeout(reconnectTimer);
      es?.close();
      channel?.close();
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleFocus);
      unsub();
      window.removeEventListener('popstate', handlePopState);
    };
  }, [refreshAllData]);

  const navigate = (
    route: AppRoute,
    params: { username?: string; postId?: string; userId?: string; query?: string } = {}
  ) => {
    setCurrentRoute(route);
    setRouteParams(params);
    if (params.userId && route === 'messages') {
      setActiveChatUserId(params.userId);
    }
    const targetPath = route === 'home' ? '/' : `/${route}`;
    if (typeof window !== 'undefined' && window.location.pathname !== targetPath) {
      window.history.pushState({}, '', targetPath);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const unreadNotifsCount = useMemo(() => {
    return notifications.filter(n => !n.is_read).length;
  }, [notifications]);

  const unreadMessagesCount = useMemo(() => {
    return conversations.reduce((acc, conv) => acc + (conv.unread_count || 0), 0);
  }, [conversations]);

  // Feed Actions
  const createPost = async (content: string, media?: { url: string; type: 'image' | 'video' }[], feeling?: string, location?: string, privacy?: 'PUBLIC' | 'CONNECTIONS_ONLY' | 'PRIVATE') => {
    store.createPost(content, media, feeling, location, privacy);
    try {
      await api.createPost(currentUser.id, content, media, feeling, location, privacy);
      await refreshAllData();
    } catch (err) {
      console.error('Create post error:', err);
    }
  };

  const likePost = async (postId: string) => {
    store.likePost(postId);
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        const liked = !p.liked_by_me;
        return { ...p, liked_by_me: liked, likes_count: liked ? p.likes_count + 1 : Math.max(0, p.likes_count - 1) };
      }
      return p;
    }));
    try {
      await api.toggleLikePost(postId, currentUser.id);
    } catch (err) {
      console.error('Like post error:', err);
    }
  };

  const addComment = async (postId: string, content: string) => {
    store.addComment(postId, content);
    try {
      await api.addComment(postId, currentUser.id, content);
      await refreshAllData();
    } catch (err) {
      console.error('Add comment error:', err);
    }
  };

  const addCommentReply = async (postId: string, commentId: string, content: string) => {
    store.addCommentReply(postId, commentId, content);
    try {
      await api.addCommentReply(postId, commentId, currentUser.id, content);
      await refreshAllData();
    } catch (err) {
      console.error('Add comment reply error:', err);
    }
  };

  const deletePost = async (postId: string) => {
    try {
      // 1. Delete globally on the backend database & storage
      await api.deletePost(postId, currentUser.id);

      // 2. Remove from local memory state & store
      store.deletePost(postId);
      setPosts(prev => prev.filter(p => p.id !== postId));
      setSavedPosts(prev => prev.filter(p => p.id !== postId));

      // 3. Broadcast to other open windows/tabs on the device
      syncChannelRef.current?.postMessage({ type: 'POST_DELETED', id: postId });

      // 4. Refresh/reload from server to synchronize latest data
      await refreshAllData();

      // 5. Explicitly verify with the server that the post no longer exists
      const latestPosts = await api.getPosts(currentUser.id);
      if (latestPosts && latestPosts.some(p => p.id === postId)) {
        throw new Error('Global deletion verification failed: post still present on server.');
      }
    } catch (err) {
      console.error('Delete post error:', err);
      // Revert if failed
      setPosts(store.getPosts());
      setSavedPosts(store.getSavedPosts());
      throw err;
    }
  };

  const editPost = async (postId: string, newContent: string) => {
    store.editPost(postId, newContent);
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, content: newContent } : p));
    try {
      await api.editPost(postId, currentUser.id, newContent);
    } catch (err) {
      console.error('Edit post error:', err);
    }
  };

  const toggleSavePost = async (postId: string) => {
    store.toggleSavePost(postId);
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, saved_by_me: !p.saved_by_me } : p));
    try {
      await api.toggleSavePost(postId);
    } catch (err) {
      console.error('Toggle save post error:', err);
    }
  };

  // Stories
  const createStory = async (mediaUrl: string, mediaType: 'image' | 'video' = 'image', textOverlay?: string) => {
    store.createStory(mediaUrl, mediaType, textOverlay);
    try {
      await api.createStory(currentUser.id, mediaUrl, mediaType, textOverlay);
      await refreshAllData();
    } catch (err) {
      console.error('Create story error:', err);
    }
  };

  const markStorySeen = async (storyId: string) => {
    store.markStorySeen(storyId);
    setStories(prev => prev.map(s => s.id === storyId ? { ...s, seen_by_current_user: true } : s));
    try {
      await api.markStorySeen(storyId);
    } catch (err) {
      console.error('Mark story seen error:', err);
    }
  };

  const reactToStory = async (storyId: string, emoji: string) => {
    store.reactToStory(storyId, emoji);
    try {
      await api.reactToStory(storyId, currentUser.id, emoji);
    } catch (err) {
      console.error('React to story error:', err);
    }
  };

  const openStoryViewer = (index: number) => {
    setActiveStoryIndex(index);
  };

  const closeStoryViewer = () => {
    setActiveStoryIndex(null);
  };

  // Dating
  const likeProfile = async (toUserId: string, isSuperLike = false) => {
    const localRes = store.likeProfile(toUserId, isSuperLike);
    try {
      const serverRes = await api.likeProfile(currentUser.id, toUserId, isSuperLike);
      const res = serverRes || localRes;
      if (res.isMatch && res.match) {
        setActiveMatchCelebration(res.match);
        try {
          confetti({
            particleCount: 120,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#ec4899', '#f43f5e', '#a855f7', '#6366f1', '#fb7185']
          });
        } catch {
          // Confetti fallback
        }
      }
      await refreshAllData();
      return res;
    } catch {
      if (localRes.isMatch && localRes.match) {
        setActiveMatchCelebration(localRes.match);
      }
      return localRes;
    }
  };

  const passProfile = async (toUserId: string) => {
    store.passProfile(toUserId);
    try {
      await api.passProfile(currentUser.id, toUserId);
    } catch (err) {
      console.error('Pass profile error:', err);
    }
  };

  const undoDatingAction = async () => {
    try {
      await api.undoLastAction(currentUser.id);
      await refreshAllData();
    } catch (err) {
      console.error('Undo dating action error:', err);
    }
  };

  const unmatch = async (matchId: string) => {
    store.unmatch(matchId);
    setMatches(prev => prev.filter(m => m.id !== matchId));
    try {
      await api.unmatch(matchId);
      await refreshAllData();
    } catch (err) {
      console.error('Unmatch error:', err);
    }
  };

  const dismissMatchCelebration = () => {
    setActiveMatchCelebration(null);
  };

  // Connections
  const sendConnectionRequest = async (userId: string) => {
    store.sendConnectionRequest(userId);
    try {
      await api.sendConnectionRequest(currentUser.id, userId);
      await refreshAllData();
    } catch (err) {
      console.error('Send connection error:', err);
    }
  };

  const acceptConnection = async (connectionId: string) => {
    store.acceptConnection(connectionId);
    try {
      await api.acceptConnection(connectionId, currentUser.id);
      await refreshAllData();
    } catch (err) {
      console.error('Accept connection error:', err);
    }
  };

  const rejectConnection = async (connectionId: string) => {
    store.rejectConnection(connectionId);
    try {
      await api.rejectConnection(connectionId, currentUser.id);
      await refreshAllData();
    } catch (err) {
      console.error('Reject connection error:', err);
    }
  };

  const removeConnection = async (connectionId: string) => {
    store.removeConnection(connectionId);
    try {
      await api.removeConnection(connectionId);
      await refreshAllData();
    } catch (err) {
      console.error('Remove connection error:', err);
    }
  };

  // Chat
  const getChatMessages = useCallback((userIdOrConvId: string) => {
    if (userIdOrConvId.startsWith('conv-')) {
      return store.getMessagesForConversation(userIdOrConvId);
    }
    return store.getMessagesForUser(userIdOrConvId);
  }, []);

  const fetchMessagesForConversation = useCallback(async (convId: string, otherUserId?: string): Promise<Message[]> => {
    try {
      if (convId) {
        const msgs = await api.getMessagesByConversation(convId, currentUser?.id);
        if (msgs && Array.isArray(msgs)) return msgs;
      }
      if (otherUserId && currentUser?.id) {
        const msgs = await api.getMessages(otherUserId, currentUser.id);
        if (msgs && Array.isArray(msgs)) return msgs;
      }
      return [];
    } catch {
      if (convId) return store.getMessagesForConversation(convId);
      if (otherUserId) return store.getMessagesForUser(otherUserId);
      return [];
    }
  }, [currentUser?.id]);

  const sendMessage = useCallback(async (receiverId: string, content: string, mediaUrl?: string, replyToId?: string, conversationId?: string) => {
    let targetReceiver = receiverId;
    if ((!targetReceiver || targetReceiver === currentUser?.id) && conversationId) {
      const conv = conversations.find(c => c.id === conversationId);
      if (conv) {
        targetReceiver =
          conv.participant_ids?.find(id => id !== currentUser?.id) ||
          (conv.other_user_id !== currentUser?.id ? conv.other_user_id : undefined) ||
          (conv.other_user?.id !== currentUser?.id ? conv.other_user?.id : '') ||
          '';
      }
    }
    const localMsg = store.sendMessage(targetReceiver, content, mediaUrl, replyToId, conversationId);
    setConversations(store.getConversations());
    try {
      const sent = await api.sendMessage(currentUser.id, targetReceiver, content, mediaUrl, replyToId, conversationId || localMsg.conversation_id);
      const updatedConvs = await api.getConversations(currentUser.id);
      if (updatedConvs && updatedConvs.length > 0) {
        setConversations(updatedConvs);
      }
      return sent;
    } catch (err) {
      console.error('Send message error:', err);
      return localMsg;
    }
  }, [currentUser?.id, conversations]);

  const unsendMessage = useCallback(async (messageId: string) => {
    store.unsendMessage(messageId);
    try {
      await api.unsendMessage(messageId, currentUser.id);
      await refreshAllData();
    } catch (err) {
      console.error('Unsend message error:', err);
    }
  }, [currentUser?.id, refreshAllData]);

  const markMessagesRead = useCallback(async (userId: string, conversationId?: string) => {
    store.markMessagesRead(userId, conversationId);
    setConversations(prev => {
      let changed = false;
      const updated = prev.map(c => {
        const matches = c.id === conversationId || c.other_user_id === userId || c.other_user?.id === userId;
        if (matches && (c.unread_count || 0) > 0) {
          changed = true;
          return { ...c, unread_count: 0 };
        }
        return c;
      });
      return changed ? updated : prev;
    });
    try {
      if (currentUser?.id) {
        await api.markMessagesRead(currentUser.id, userId, conversationId);
      }
    } catch (err) {
      console.warn('Mark read error (handled safely):', err);
    }
  }, [currentUser?.id]);

  const updateMessageContent = useCallback((messageId: string, newContent: string) => {
    store.updateMessageContent(messageId, newContent);
    setConversations(store.getConversations());
  }, []);

  // Reels
  const likeReel = async (reelId: string) => {
    store.likeReel(reelId);
    setReels(prev => prev.map(r => r.id === reelId ? { ...r, liked_by_me: !r.liked_by_me, likes_count: !r.liked_by_me ? r.likes_count + 1 : Math.max(0, r.likes_count - 1) } : r));
    try {
      await api.likeReel(reelId);
    } catch (err) {
      console.error('Like reel error:', err);
    }
  };

  const saveReel = async (reelId: string) => {
    store.saveReel(reelId);
    setReels(prev => prev.map(r => r.id === reelId ? { ...r, saved_by_me: !r.saved_by_me } : r));
    try {
      await api.saveReel(reelId);
    } catch (err) {
      console.error('Save reel error:', err);
    }
  };

  const shareReel = async (reelId: string) => {
    store.shareReel(reelId);
    setReels(prev => prev.map(r => r.id === reelId ? { ...r, shares_count: (r.shares_count || 0) + 1 } : r));
    try {
      await api.shareReel(reelId);
    } catch (err) {
      console.error('Share reel error:', err);
    }
  };

  const commentReel = async (reelId: string, content: string) => {
    const localCmt = store.commentReel(reelId, content);
    setReels(prev => prev.map(r => r.id === reelId ? { ...r, comments_count: (r.comments_count || 0) + 1 } : r));
    try {
      return await api.commentOnReel(reelId, currentUser.id, content);
    } catch (err) {
      console.error('Comment reel error:', err);
      return localCmt;
    }
  };

  const createReel = async (videoUrl: string, caption: string, musicTitle?: string) => {
    store.createReel(videoUrl, caption, musicTitle);
    try {
      await api.createReel(currentUser.id, videoUrl, caption, musicTitle);
      await refreshAllData();
    } catch (err) {
      console.error('Create reel error:', err);
    }
  };

  const deleteReel = async (reelId: string) => {
    try {
      // 1. Delete globally on backend database & physical storage
      await api.deleteReel(reelId, currentUser.id);

      // 2. Remove from local memory state & store
      store.deleteReel(reelId);
      setReels(prev => prev.filter(r => r.id !== reelId));

      // 3. Broadcast to other open windows/tabs on the device
      syncChannelRef.current?.postMessage({ type: 'REEL_DELETED', id: reelId });

      // 4. Refresh/reload from server to synchronize latest data
      await refreshAllData();

      // 5. Explicitly verify with server that the reel/video no longer exists
      const latestReels = await api.getReels();
      if (latestReels && latestReels.some(r => r.id === reelId)) {
        throw new Error('Global deletion verification failed: reel still present on server.');
      }
    } catch (err) {
      console.error('Delete reel error:', err);
      // Revert if failed
      setReels(store.getReels());
      throw err;
    }
  };

  // Notifications
  const markNotificationRead = async (id: string) => {
    store.markNotificationRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    try {
      await api.markNotificationRead(id, currentUser.id);
    } catch (err) {
      console.error('Mark notification read error:', err);
    }
  };

  const markAllNotificationsRead = async () => {
    store.markAllNotificationsRead();
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    try {
      await api.markAllNotificationsRead(currentUser.id);
    } catch (err) {
      console.error('Mark all read error:', err);
    }
  };

  const deleteNotification = async (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    try {
      await api.deleteNotification(id, currentUser.id);
    } catch (err) {
      console.error('Delete notification error:', err);
    }
  };

  // Moderation
  const openReportModal = (targetType: Report['target_type'], targetId: string, targetTitle?: string) => {
    setReportModalData({ targetType, targetId, targetTitle });
  };

  const closeReportModal = () => {
    setReportModalData(null);
  };

  const submitReport = async (reason: ReportReason, details: string) => {
    if (reportModalData) {
      store.reportContent(reportModalData.targetType, reportModalData.targetId, reason, details, reportModalData.targetTitle);
      try {
        await api.reportContent(currentUser.id, reportModalData.targetType, reportModalData.targetId, reason, details, reportModalData.targetTitle);
      } catch (err) {
        console.error('Submit report error:', err);
      }
      closeReportModal();
    }
  };

  const blockUser = async (userId: string) => {
    store.blockUser(userId);
    try {
      await api.blockUser(currentUser.id, userId);
      await refreshAllData();
    } catch (err) {
      console.error('Block user error:', err);
    }
  };

  const unblockUser = async (userId: string) => {
    store.unblockUser(userId);
    setBlockedUsers(prev => prev.filter(u => u.id !== userId));
    try {
      await api.unblockUser(currentUser.id, userId);
      await refreshAllData();
    } catch (err) {
      console.error('Unblock user error:', err);
    }
  };

  return (
    <AppContext.Provider
      value={{
        currentRoute,
        navigate,
        routeParams,
        posts,
        stories,
        reels,
        matches,
        connections,
        conversations,
        notifications,
        savedPosts,
        blockedUsers,
        reports,
        unreadNotifsCount,
        unreadMessagesCount,
        isLoadingData,
        refreshAllData,
        createPost,
        likePost,
        addComment,
        addCommentReply,
        deletePost,
        editPost,
        toggleSavePost,
        createStory,
        markStorySeen,
        reactToStory,
        activeStoryIndex,
        openStoryViewer,
        closeStoryViewer,
        likeProfile,
        passProfile,
        undoDatingAction,
        unmatch,
        activeMatchCelebration,
        dismissMatchCelebration,
        sendConnectionRequest,
        acceptConnection,
        rejectConnection,
        removeConnection,
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
        likeReel,
        saveReel,
        shareReel,
        commentReel,
        createReel,
        deleteReel,
        toast,
        showToast,
        markNotificationRead,
        markAllNotificationsRead,
        deleteNotification,
        reportModalData,
        openReportModal,
        closeReportModal,
        submitReport,
        blockUser,
        unblockUser,
        searchQuery,
        setSearchQuery
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
