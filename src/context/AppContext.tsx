import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
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
  activeChatUserId: string | null;
  setActiveChatUserId: (userId: string | null) => void;
  getChatMessages: (userId: string) => Message[];
  sendMessage: (receiverId: string, content: string, mediaUrl?: string, replyToId?: string) => Promise<void>;
  unsendMessage: (messageId: string) => Promise<void>;
  markMessagesRead: (userId: string) => Promise<void>;

  // Reels
  likeReel: (reelId: string) => Promise<void>;
  createReel: (videoUrl: string, caption: string, musicTitle?: string) => Promise<void>;

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

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();

  const [currentRoute, setCurrentRoute] = useState<AppRoute>('home');
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
  const [activeChatUserId, setActiveChatUserId] = useState<string | null>(null);
  const [activeMatchCelebration, setActiveMatchCelebration] = useState<Match | null>(null);
  const [reportModalData, setReportModalData] = useState<{ targetType: Report['target_type']; targetId: string; targetTitle?: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

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
    const interval = setInterval(refreshAllData, 8000); // Polling for real-time messages & notifications
    return () => clearInterval(interval);
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
    store.deletePost(postId);
    setPosts(prev => prev.filter(p => p.id !== postId));
    try {
      await api.deletePost(postId, currentUser.id);
    } catch (err) {
      console.error('Delete post error:', err);
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
  const getChatMessages = (userId: string) => {
    return store.getMessagesForUser(userId);
  };

  const sendMessage = async (receiverId: string, content: string, mediaUrl?: string, replyToId?: string) => {
    store.sendMessage(receiverId, content, mediaUrl, replyToId);
    try {
      await api.sendMessage(currentUser.id, receiverId, content, mediaUrl, replyToId);
      await refreshAllData();
    } catch (err) {
      console.error('Send message error:', err);
    }
  };

  const unsendMessage = async (messageId: string) => {
    store.unsendMessage(messageId);
    try {
      await api.unsendMessage(messageId, currentUser.id);
      await refreshAllData();
    } catch (err) {
      console.error('Unsend message error:', err);
    }
  };

  const markMessagesRead = async (userId: string) => {
    store.markMessagesRead(userId);
    try {
      await api.markMessagesRead(currentUser.id, userId);
      await refreshAllData();
    } catch (err) {
      console.error('Mark read error:', err);
    }
  };

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

  const createReel = async (videoUrl: string, caption: string, musicTitle?: string) => {
    store.createReel(videoUrl, caption, musicTitle);
    try {
      await api.createReel(currentUser.id, videoUrl, caption, musicTitle);
      await refreshAllData();
    } catch (err) {
      console.error('Create reel error:', err);
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
        activeChatUserId,
        setActiveChatUserId,
        getChatMessages,
        sendMessage,
        unsendMessage,
        markMessagesRead,
        likeReel,
        createReel,
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
