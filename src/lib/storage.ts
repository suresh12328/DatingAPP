import {
  Profile,
  Post,
  Story,
  Match,
  Connection,
  AppNotification,
  Reel,
  Message,
  Conversation,
  DatingLike,
  Report,
  Block,
  Comment,
  CommentReply
} from '../types';
import {
  SEED_PROFILES,
  SEED_POSTS,
  SEED_STORIES,
  SEED_REELS,
  SEED_MATCHES,
  SEED_CONNECTIONS,
  SEED_NOTIFICATIONS
} from './seedData';

type Listener = () => void;

class ReactiveStore {
  private listeners: Set<Listener> = new Set();
  private matchListeners: Set<(match: Match) => void> = new Set();

  private profiles: Profile[] = [];
  private posts: Post[] = [];
  private stories: Story[] = [];
  private reels: Reel[] = [];
  private matches: Match[] = [];
  private connections: Connection[] = [];
  private notifications: AppNotification[] = [];
  private messages: Message[] = [];
  private datingLikes: DatingLike[] = [];
  private datingPasses: { from_user_id: string; to_user_id: string }[] = [];
  private savedPostIds: { user_id: string; post_id: string }[] = [];
  private reports: Report[] = [];
  private blocks: Block[] = [];
  private currentUserId: string = 'user-david';

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const storedProfiles = localStorage.getItem('lc_profiles');
      const storedPosts = localStorage.getItem('lc_posts');
      const storedStories = localStorage.getItem('lc_stories');
      const storedReels = localStorage.getItem('lc_reels');
      const storedMatches = localStorage.getItem('lc_matches');
      const storedConnections = localStorage.getItem('lc_connections');
      const storedNotifications = localStorage.getItem('lc_notifications');
      const storedMessages = localStorage.getItem('lc_messages');
      const storedLikes = localStorage.getItem('lc_dating_likes');
      const storedPasses = localStorage.getItem('lc_dating_passes');
      const storedSaved = localStorage.getItem('lc_saved_posts');
      const storedReports = localStorage.getItem('lc_reports');
      const storedBlocks = localStorage.getItem('lc_blocks');
      const storedCurrentUser = localStorage.getItem('lc_current_user_id');

      this.profiles = storedProfiles ? JSON.parse(storedProfiles) : [...SEED_PROFILES];
      this.posts = storedPosts ? JSON.parse(storedPosts) : [...SEED_POSTS];
      this.stories = storedStories ? JSON.parse(storedStories) : [...SEED_STORIES];
      this.reels = storedReels ? JSON.parse(storedReels) : [...SEED_REELS];
      this.matches = storedMatches ? JSON.parse(storedMatches) : [...SEED_MATCHES];
      this.connections = storedConnections ? JSON.parse(storedConnections) : [...SEED_CONNECTIONS];
      this.notifications = storedNotifications ? JSON.parse(storedNotifications) : [...SEED_NOTIFICATIONS];
      this.messages = storedMessages ? JSON.parse(storedMessages) : this.generateInitialMessages();
      this.datingLikes = storedLikes ? JSON.parse(storedLikes) : this.generateInitialLikes();
      this.datingPasses = storedPasses ? JSON.parse(storedPasses) : [];
      this.savedPostIds = storedSaved ? JSON.parse(storedSaved) : [{ user_id: 'user-david', post_id: 'post-2' }];
      this.reports = storedReports ? JSON.parse(storedReports) : [];
      this.blocks = storedBlocks ? JSON.parse(storedBlocks) : [];
      this.currentUserId = storedCurrentUser || 'user-david';
    } catch {
      this.profiles = [...SEED_PROFILES];
      this.posts = [...SEED_POSTS];
      this.stories = [...SEED_STORIES];
      this.reels = [...SEED_REELS];
      this.matches = [...SEED_MATCHES];
      this.connections = [...SEED_CONNECTIONS];
      this.notifications = [...SEED_NOTIFICATIONS];
      this.messages = this.generateInitialMessages();
      this.datingLikes = this.generateInitialLikes();
      this.datingPasses = [];
      this.savedPostIds = [{ user_id: 'user-david', post_id: 'post-2' }];
      this.reports = [];
      this.blocks = [];
      this.currentUserId = 'user-david';
    }
  }

  private generateInitialLikes(): DatingLike[] {
    return [
      {
        id: 'like-1',
        from_user_id: 'user-sarah',
        to_user_id: 'user-david',
        is_super_like: false,
        created_at: '2024-02-14T17:00:00Z'
      },
      {
        id: 'like-2',
        from_user_id: 'user-david',
        to_user_id: 'user-sarah',
        is_super_like: true,
        created_at: '2024-02-14T18:00:00Z'
      },
      {
        id: 'like-3',
        from_user_id: 'user-jessica',
        to_user_id: 'user-david',
        is_super_like: false,
        created_at: '2024-02-18T15:00:00Z'
      },
      {
        id: 'like-4',
        from_user_id: 'user-mirela',
        to_user_id: 'user-david',
        is_super_like: true,
        created_at: '2024-02-18T11:00:00Z'
      },
      {
        id: 'like-5',
        from_user_id: 'user-daniela',
        to_user_id: 'user-david',
        is_super_like: false,
        created_at: '2024-02-12T14:00:00Z'
      },
      {
        id: 'like-6',
        from_user_id: 'user-david',
        to_user_id: 'user-daniela',
        is_super_like: false,
        created_at: '2024-02-12T14:20:00Z'
      }
    ];
  }

  private generateInitialMessages(): Message[] {
    return [
      {
        id: 'msg-1',
        conversation_id: 'conv-david-sarah',
        sender_id: 'user-david',
        receiver_id: 'user-sarah',
        content: "Hey Sarah! Loved your art director bio. Have you been to the SFMOMA photography wing recently? 🎨",
        created_at: '2024-02-14T18:15:00Z',
        read_at: '2024-02-14T18:20:00Z'
      },
      {
        id: 'msg-2',
        conversation_id: 'conv-david-sarah',
        sender_id: 'user-sarah',
        receiver_id: 'user-david',
        content: "Hey David! Yes, I was actually there two weeks ago for the modernist collection. It was mesmerizing!",
        created_at: '2024-02-14T18:45:00Z',
        read_at: '2024-02-14T18:50:00Z'
      },
      {
        id: 'msg-3',
        conversation_id: 'conv-david-sarah',
        sender_id: 'user-sarah',
        receiver_id: 'user-david',
        content: "Would love to check out that new contemporary gallery opening this Friday!",
        created_at: '2024-02-18T14:30:00Z'
      }
    ];
  }

  private saveToStorage() {
    try {
      localStorage.setItem('lc_profiles', JSON.stringify(this.profiles));
      localStorage.setItem('lc_posts', JSON.stringify(this.posts));
      localStorage.setItem('lc_stories', JSON.stringify(this.stories));
      localStorage.setItem('lc_reels', JSON.stringify(this.reels));
      localStorage.setItem('lc_matches', JSON.stringify(this.matches));
      localStorage.setItem('lc_connections', JSON.stringify(this.connections));
      localStorage.setItem('lc_notifications', JSON.stringify(this.notifications));
      localStorage.setItem('lc_messages', JSON.stringify(this.messages));
      localStorage.setItem('lc_dating_likes', JSON.stringify(this.datingLikes));
      localStorage.setItem('lc_dating_passes', JSON.stringify(this.datingPasses));
      localStorage.setItem('lc_saved_posts', JSON.stringify(this.savedPostIds));
      localStorage.setItem('lc_reports', JSON.stringify(this.reports));
      localStorage.setItem('lc_blocks', JSON.stringify(this.blocks));
      localStorage.setItem('lc_current_user_id', this.currentUserId);
    } catch {
      // Storage quota or privacy sandbox fallback
    }
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public onMatch(listener: (match: Match) => void): () => void {
    this.matchListeners.add(listener);
    return () => this.matchListeners.delete(listener);
  }

  private notify() {
    this.saveToStorage();
    this.listeners.forEach(cb => cb());
  }

  // --- Current User Management ---
  public getCurrentUserId(): string {
    return this.currentUserId;
  }

  public setCurrentUserId(id: string) {
    this.currentUserId = id;
    this.notify();
  }

  public getCurrentUser(): Profile {
    const user = this.profiles.find(p => p.id === this.currentUserId);
    if (user) return user;
    return this.profiles[0] || SEED_PROFILES[0];
  }

  public getAllProfiles(): Profile[] {
    return [...this.profiles];
  }

  public getProfileById(id: string): Profile | undefined {
    return this.profiles.find(p => p.id === id);
  }

  public getProfileByUsername(username: string): Profile | undefined {
    return this.profiles.find(p => p.username.toLowerCase() === username.toLowerCase());
  }

  public updateProfile(id: string, updates: Partial<Profile>): Profile {
    const idx = this.profiles.findIndex(p => p.id === id);
    if (idx !== -1) {
      this.profiles[idx] = { ...this.profiles[idx], ...updates };
      // Also update author in posts/comments
      this.posts = this.posts.map(post => {
        if (post.user_id === id) {
          return { ...post, author: this.profiles[idx] };
        }
        return post;
      });
      this.notify();
      return this.profiles[idx];
    }
    throw new Error('Profile not found');
  }

  public createProfile(profileData: Omit<Profile, 'id' | 'created_at' | 'is_online' | 'last_active' | 'status' | 'role' | 'privacy'>): Profile {
    const newProfile: Profile = {
      ...profileData,
      id: `user-${Date.now()}`,
      created_at: new Date().toISOString(),
      is_online: true,
      last_active: 'Just now',
      status: 'ACTIVE',
      role: 'USER',
      privacy: {
        profileVisibility: 'PUBLIC',
        whoCanMessageMe: 'EVERYONE',
        whoCanConnect: 'EVERYONE',
        datingVisible: true,
        showOnlineStatus: true,
        readReceipts: true
      }
    };
    this.profiles.unshift(newProfile);
    this.currentUserId = newProfile.id;
    this.notify();
    return newProfile;
  }

  // --- Posts & Feed Management ---
  public getPosts(): Post[] {
    const currentUser = this.getCurrentUser();
    const blockedIds = this.blocks
      .filter(b => b.blocker_id === currentUser.id || b.blocked_id === currentUser.id)
      .map(b => (b.blocker_id === currentUser.id ? b.blocked_id : b.blocker_id));

    return this.posts
      .filter(p => !blockedIds.includes(p.user_id))
      .map(post => {
        const author = this.profiles.find(u => u.id === post.user_id) || post.author;
        const saved = this.savedPostIds.some(s => s.user_id === currentUser.id && s.post_id === post.id);
        return {
          ...post,
          author,
          saved_by_me: saved
        };
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public createPost(content: string, media: { url: string; type: 'image' | 'video' }[] = [], feeling?: string, location?: string, privacy: 'PUBLIC' | 'CONNECTIONS_ONLY' | 'PRIVATE' = 'PUBLIC'): Post {
    const currentUser = this.getCurrentUser();
    const newPost: Post = {
      id: `post-${Date.now()}`,
      user_id: currentUser.id,
      author: currentUser,
      content,
      media,
      feeling,
      location,
      likes_count: 0,
      comments_count: 0,
      shares_count: 0,
      saved_by_me: false,
      liked_by_me: false,
      privacy,
      created_at: new Date().toISOString(),
      comments: []
    };
    this.posts.unshift(newPost);
    this.notify();
    return newPost;
  }

  public likePost(postId: string): boolean {
    const currentUser = this.getCurrentUser();
    const post = this.posts.find(p => p.id === postId);
    if (!post) return false;

    post.liked_by_me = !post.liked_by_me;
    post.likes_count += post.liked_by_me ? 1 : -1;

    if (post.liked_by_me && post.user_id !== currentUser.id) {
      this.createNotification(
        post.user_id,
        currentUser.id,
        'LIKE_POST',
        'Liked your post',
        `${currentUser.full_name} liked your post.`,
        `/post/${post.id}`
      );
    }

    this.notify();
    return post.liked_by_me;
  }

  public addComment(postId: string, content: string): Comment | null {
    const currentUser = this.getCurrentUser();
    const post = this.posts.find(p => p.id === postId);
    if (!post) return null;

    const newComment: Comment = {
      id: `c-${Date.now()}`,
      post_id: postId,
      user_id: currentUser.id,
      author: currentUser,
      content,
      created_at: new Date().toISOString(),
      likes_count: 0,
      liked_by_me: false,
      replies: []
    };

    if (!post.comments) post.comments = [];
    post.comments.push(newComment);
    post.comments_count = (post.comments_count || 0) + 1;

    if (post.user_id !== currentUser.id) {
      this.createNotification(
        post.user_id,
        currentUser.id,
        'COMMENT_POST',
        'Commented on your post',
        `${currentUser.full_name} commented: "${content.slice(0, 40)}..."`,
        `/post/${post.id}`
      );
    }

    this.notify();
    return newComment;
  }

  public addCommentReply(postId: string, commentId: string, content: string): CommentReply | null {
    const currentUser = this.getCurrentUser();
    const post = this.posts.find(p => p.id === postId);
    if (!post || !post.comments) return null;

    const comment = post.comments.find(c => c.id === commentId);
    if (!comment) return null;

    const reply: CommentReply = {
      id: `cr-${Date.now()}`,
      comment_id: commentId,
      user_id: currentUser.id,
      author: currentUser,
      content,
      created_at: new Date().toISOString(),
      likes_count: 0,
      liked_by_me: false
    };

    if (!comment.replies) comment.replies = [];
    comment.replies.push(reply);
    post.comments_count = (post.comments_count || 0) + 1;

    if (comment.user_id !== currentUser.id) {
      this.createNotification(
        comment.user_id,
        currentUser.id,
        'COMMENT_REPLY',
        'Replied to your comment',
        `${currentUser.full_name} replied: "${content.slice(0, 40)}..."`,
        `/post/${post.id}`
      );
    }

    this.notify();
    return reply;
  }

  public deletePost(postId: string): boolean {
    const currentUser = this.getCurrentUser();
    const post = this.posts.find(p => p.id === postId);
    if (!post) return false;
    if (post.user_id !== currentUser.id && currentUser.role !== 'ADMIN') return false;

    this.posts = this.posts.filter(p => p.id !== postId);
    this.notify();
    return true;
  }

  public editPost(postId: string, newContent: string): boolean {
    const currentUser = this.getCurrentUser();
    const post = this.posts.find(p => p.id === postId);
    if (!post || post.user_id !== currentUser.id) return false;

    post.content = newContent;
    post.updated_at = new Date().toISOString();
    this.notify();
    return true;
  }

  public toggleSavePost(postId: string): boolean {
    const currentUser = this.getCurrentUser();
    const existingIdx = this.savedPostIds.findIndex(s => s.user_id === currentUser.id && s.post_id === postId);
    let isSaved = false;
    if (existingIdx !== -1) {
      this.savedPostIds.splice(existingIdx, 1);
      isSaved = false;
    } else {
      this.savedPostIds.push({ user_id: currentUser.id, post_id: postId });
      isSaved = true;
    }
    this.notify();
    return isSaved;
  }

  public getSavedPosts(): Post[] {
    const currentUser = this.getCurrentUser();
    const mySavedIds = this.savedPostIds.filter(s => s.user_id === currentUser.id).map(s => s.post_id);
    return this.posts.filter(p => mySavedIds.includes(p.id));
  }

  // --- Stories ---
  public getStories(): Story[] {
    const currentUser = this.getCurrentUser();
    return this.stories.map(story => {
      const author = this.profiles.find(p => p.id === story.user_id) || story.author;
      return {
        ...story,
        author,
        seen_by_current_user: story.seen_by_current_user || story.user_id === currentUser.id
      };
    });
  }

  public createStory(mediaUrl: string, mediaType: 'image' | 'video' = 'image', textOverlay?: string): Story {
    const currentUser = this.getCurrentUser();
    const newStory: Story = {
      id: `story-${Date.now()}`,
      user_id: currentUser.id,
      author: currentUser,
      media_url: mediaUrl,
      media_type: mediaType,
      text_overlay: textOverlay,
      views_count: 1,
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      reactions: [],
      seen_by_current_user: true
    };
    this.stories.unshift(newStory);
    this.notify();
    return newStory;
  }

  public markStorySeen(storyId: string) {
    const story = this.stories.find(s => s.id === storyId);
    if (story) {
      story.seen_by_current_user = true;
      story.views_count = (story.views_count || 0) + 1;
      this.notify();
    }
  }

  public reactToStory(storyId: string, emoji: string) {
    const currentUser = this.getCurrentUser();
    const story = this.stories.find(s => s.id === storyId);
    if (!story) return;

    if (!story.reactions) story.reactions = [];
    story.reactions.push({ user_id: currentUser.id, emoji });

    if (story.user_id !== currentUser.id) {
      this.createNotification(
        story.user_id,
        currentUser.id,
        'STORY_REACTION',
        'Reacted to your story',
        `${currentUser.full_name} reacted with ${emoji} to your story.`,
        `/stories`
      );
    }
    this.notify();
  }

  // --- Dating Engine & Match Logic ---
  public calculateCompatibility(userA: Profile, userB: Profile): number {
    let score = 70;
    // Shared interests bonus
    const sharedInterests = userA.interests.filter(i => userB.interests.includes(i));
    score += sharedInterests.length * 6;

    // Relationship goal alignment
    if (userA.relationship_goal === userB.relationship_goal) {
      score += 10;
    }

    // Lifestyle matching
    if (userA.lifestyle?.workout === userB.lifestyle?.workout) score += 4;
    if (userA.lifestyle?.drinking === userB.lifestyle?.drinking) score += 4;

    return Math.min(score, 99);
  }

  public getRecommendedDatingProfiles(filters?: {
    minAge?: number;
    maxAge?: number;
    gender?: string;
    relationshipGoal?: string;
    interest?: string;
  }): (Profile & { compatibility_score: number; has_liked_me?: boolean })[] {
    const currentUser = this.getCurrentUser();
    const passedIds = this.datingPasses
      .filter(p => p.from_user_id === currentUser.id)
      .map(p => p.to_user_id);
    const likedIds = this.datingLikes
      .filter(l => l.from_user_id === currentUser.id)
      .map(l => l.to_user_id);
    const blockedIds = this.blocks
      .filter(b => b.blocker_id === currentUser.id || b.blocked_id === currentUser.id)
      .map(b => (b.blocker_id === currentUser.id ? b.blocked_id : b.blocker_id));

    // Exclude current user, passed, liked, and blocked
    const excludedIds = new Set([currentUser.id, ...passedIds, ...likedIds, ...blockedIds]);

    return this.profiles
      .filter(p => {
        if (excludedIds.has(p.id)) return false;
        if (!p.privacy.datingVisible) return false;
        if (filters?.minAge && p.age < filters.minAge) return false;
        if (filters?.maxAge && p.age > filters.maxAge) return false;
        if (filters?.gender && filters.gender !== 'ALL' && p.gender !== filters.gender) return false;
        if (filters?.relationshipGoal && filters.relationshipGoal !== 'ALL' && p.relationship_goal !== filters.relationshipGoal) return false;
        if (filters?.interest && !p.interests.some(i => i.toLowerCase().includes(filters.interest!.toLowerCase()))) return false;
        return true;
      })
      .map(profile => {
        const hasLikedMe = this.datingLikes.some(l => l.from_user_id === profile.id && l.to_user_id === currentUser.id);
        const compatibility_score = this.calculateCompatibility(currentUser, profile);
        return {
          ...profile,
          compatibility_score,
          has_liked_me: hasLikedMe
        };
      })
      .sort((a, b) => b.compatibility_score - a.compatibility_score);
  }

  public getLikesYouProfiles(): (Profile & { is_super_like: boolean; created_at: string; compatibility_score: number })[] {
    const currentUser = this.getCurrentUser();
    const likesReceived = this.datingLikes.filter(l => l.to_user_id === currentUser.id);
    const alreadyMatchedIds = this.matches
      .filter(m => m.user1_id === currentUser.id || m.user2_id === currentUser.id)
      .map(m => (m.user1_id === currentUser.id ? m.user2_id : m.user1_id));

    const result: (Profile & { is_super_like: boolean; created_at: string; compatibility_score: number })[] = [];

    likesReceived.forEach(like => {
      if (alreadyMatchedIds.includes(like.from_user_id)) return;
      const profile = this.profiles.find(p => p.id === like.from_user_id);
      if (profile) {
        result.push({
          ...profile,
          is_super_like: like.is_super_like,
          created_at: like.created_at,
          compatibility_score: this.calculateCompatibility(currentUser, profile)
        });
      }
    });

    return result;
  }

  public getMyLikes(): (Profile & { is_super_like: boolean; created_at: string; is_match: boolean })[] {
    const currentUser = this.getCurrentUser();
    const likesGiven = this.datingLikes.filter(l => l.from_user_id === currentUser.id);
    const matchedIds = this.matches
      .filter(m => m.user1_id === currentUser.id || m.user2_id === currentUser.id)
      .map(m => (m.user1_id === currentUser.id ? m.user2_id : m.user1_id));

    return likesGiven
      .map(like => {
        const profile = this.profiles.find(p => p.id === like.to_user_id);
        if (!profile) return null;
        return {
          ...profile,
          is_super_like: like.is_super_like,
          created_at: like.created_at,
          is_match: matchedIds.includes(profile.id)
        };
      })
      .filter(Boolean) as (Profile & { is_super_like: boolean; created_at: string; is_match: boolean })[];
  }

  public likeProfile(toUserId: string, isSuperLike: boolean = false): { isMatch: boolean; match?: Match } {
    const currentUser = this.getCurrentUser();
    if (currentUser.id === toUserId) return { isMatch: false };

    // Record like
    const existingLike = this.datingLikes.find(l => l.from_user_id === currentUser.id && l.to_user_id === toUserId);
    if (!existingLike) {
      this.datingLikes.push({
        id: `like-${Date.now()}`,
        from_user_id: currentUser.id,
        to_user_id: toUserId,
        is_super_like: isSuperLike,
        created_at: new Date().toISOString()
      });
    }

    // Check if toUserId liked currentUser
    const reciprocalLike = this.datingLikes.find(l => l.from_user_id === toUserId && l.to_user_id === currentUser.id);
    const targetProfile = this.profiles.find(p => p.id === toUserId);

    if (reciprocalLike && targetProfile) {
      // Create Match!
      const existingMatch = this.matches.find(
        m => (m.user1_id === currentUser.id && m.user2_id === toUserId) ||
             (m.user1_id === toUserId && m.user2_id === currentUser.id)
      );

      if (!existingMatch) {
        const newMatch: Match = {
          id: `match-${Date.now()}`,
          user1_id: currentUser.id,
          user2_id: toUserId,
          user1: currentUser,
          user2: targetProfile,
          created_at: new Date().toISOString(),
          compatibility_score: this.calculateCompatibility(currentUser, targetProfile),
          last_message: "You both liked each other! Say hello! 👋",
          last_message_time: 'Just now',
          unread_count: 0
        };
        this.matches.unshift(newMatch);

        // Notify both
        this.createNotification(
          toUserId,
          currentUser.id,
          'NEW_MATCH',
          "🎉 It's a Match!",
          `You and ${currentUser.full_name} matched! Start a conversation now.`,
          '/messages'
        );
        this.createNotification(
          currentUser.id,
          toUserId,
          'NEW_MATCH',
          "🎉 It's a Match!",
          `You and ${targetProfile.full_name} matched! Start a conversation now.`,
          '/messages'
        );

        this.notify();
        this.matchListeners.forEach(cb => cb(newMatch));
        return { isMatch: true, match: newMatch };
      }
    } else if (targetProfile) {
      // Send like notification
      this.createNotification(
        toUserId,
        currentUser.id,
        isSuperLike ? 'SUPER_LIKE' : 'DATING_LIKE',
        isSuperLike ? '⭐ Super Liked you!' : 'New Like',
        `${currentUser.full_name} liked your dating profile!`,
        '/likes'
      );
    }

    this.notify();
    return { isMatch: false };
  }

  public passProfile(toUserId: string) {
    const currentUser = this.getCurrentUser();
    this.datingPasses.push({
      from_user_id: currentUser.id,
      to_user_id: toUserId
    });
    this.notify();
  }

  public getMatches(): Match[] {
    const currentUser = this.getCurrentUser();
    return this.matches
      .filter(m => m.user1_id === currentUser.id || m.user2_id === currentUser.id)
      .map(m => {
        const user1 = this.profiles.find(p => p.id === m.user1_id) || m.user1;
        const user2 = this.profiles.find(p => p.id === m.user2_id) || m.user2;
        return { ...m, user1, user2 };
      });
  }

  public unmatch(matchId: string) {
    this.matches = this.matches.filter(m => m.id !== matchId);
    this.notify();
  }

  // --- Connections (Friends / Social) ---
  public getConnections(): Connection[] {
    const currentUser = this.getCurrentUser();
    return this.connections
      .filter(c => c.requester_id === currentUser.id || c.receiver_id === currentUser.id)
      .map(c => {
        const requester = this.profiles.find(p => p.id === c.requester_id) || c.requester;
        const receiver = this.profiles.find(p => p.id === c.receiver_id) || c.receiver;
        return { ...c, requester, receiver };
      });
  }

  public sendConnectionRequest(targetUserId: string): Connection {
    const currentUser = this.getCurrentUser();
    const existing = this.connections.find(
      c => (c.requester_id === currentUser.id && c.receiver_id === targetUserId) ||
           (c.requester_id === targetUserId && c.receiver_id === currentUser.id)
    );
    if (existing) return existing;

    const targetUser = this.profiles.find(p => p.id === targetUserId)!;
    const newConn: Connection = {
      id: `conn-${Date.now()}`,
      requester_id: currentUser.id,
      receiver_id: targetUserId,
      requester: currentUser,
      receiver: targetUser,
      status: 'PENDING',
      created_at: new Date().toISOString()
    };
    this.connections.push(newConn);

    this.createNotification(
      targetUserId,
      currentUser.id,
      'CONNECTION_REQUEST',
      'Connection Request',
      `${currentUser.full_name} sent you a social connection request.`,
      '/connections'
    );

    this.notify();
    return newConn;
  }

  public acceptConnection(connectionId: string) {
    const currentUser = this.getCurrentUser();
    const conn = this.connections.find(c => c.id === connectionId);
    if (conn) {
      conn.status = 'ACCEPTED';
      this.createNotification(
        conn.requester_id,
        currentUser.id,
        'CONNECTION_ACCEPTED',
        'Connection Accepted',
        `${currentUser.full_name} accepted your connection request!`,
        `/profile/${currentUser.username}`
      );
      this.notify();
    }
  }

  public rejectConnection(connectionId: string) {
    this.connections = this.connections.filter(c => c.id !== connectionId);
    this.notify();
  }

  public removeConnection(connectionId: string) {
    this.connections = this.connections.filter(c => c.id !== connectionId);
    this.notify();
  }

  // --- Real-time Chat & Messaging ---
  public getConversations(): Conversation[] {
    const currentUser = this.getCurrentUser();
    const userMatches = this.getMatches();
    const userAcceptedConns = this.getConnections().filter(c => c.status === 'ACCEPTED');

    const conversationMap = new Map<string, Conversation>();

    // Matches conversations
    userMatches.forEach(match => {
      const otherUser = match.user1_id === currentUser.id ? match.user2 : match.user1;
      const convId = `conv-${[currentUser.id, otherUser.id].sort().join('-')}`;
      const convMessages = this.messages.filter(
        m => (m.sender_id === currentUser.id && m.receiver_id === otherUser.id) ||
             (m.sender_id === otherUser.id && m.receiver_id === currentUser.id)
      ).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

      const lastMessage = convMessages[convMessages.length - 1];
      const unreadCount = convMessages.filter(m => m.receiver_id === currentUser.id && !m.read_at).length;

      conversationMap.set(otherUser.id, {
        id: convId,
        participant_ids: [currentUser.id, otherUser.id],
        other_user: otherUser,
        is_dating_match: true,
        last_message: lastMessage,
        unread_count: unreadCount,
        updated_at: lastMessage ? lastMessage.created_at : match.created_at
      });
    });

    // Social connection conversations
    userAcceptedConns.forEach(conn => {
      const otherUser = conn.requester_id === currentUser.id ? conn.receiver : conn.requester;
      if (conversationMap.has(otherUser.id)) return; // already in matches

      const convId = `conv-${[currentUser.id, otherUser.id].sort().join('-')}`;
      const convMessages = this.messages.filter(
        m => (m.sender_id === currentUser.id && m.receiver_id === otherUser.id) ||
             (m.sender_id === otherUser.id && m.receiver_id === currentUser.id)
      ).sort((a, b) => new Date(a.created_at).getTime() - new Date(a.created_at).getTime());

      const lastMessage = convMessages[convMessages.length - 1];
      const unreadCount = convMessages.filter(m => m.receiver_id === currentUser.id && !m.read_at).length;

      conversationMap.set(otherUser.id, {
        id: convId,
        participant_ids: [currentUser.id, otherUser.id],
        other_user: otherUser,
        is_dating_match: false,
        last_message: lastMessage,
        unread_count: unreadCount,
        updated_at: lastMessage ? lastMessage.created_at : conn.created_at
      });
    });

    return Array.from(conversationMap.values()).sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
  }

  public getMessagesForUser(otherUserId: string): Message[] {
    const currentUser = this.getCurrentUser();
    return this.messages
      .filter(
        m => (m.sender_id === currentUser.id && m.receiver_id === otherUserId) ||
             (m.sender_id === otherUserId && m.receiver_id === currentUser.id)
      )
      .map(m => {
        const sender = this.profiles.find(p => p.id === m.sender_id);
        return { ...m, sender };
      })
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }

  public sendMessage(receiverId: string, content: string, mediaUrl?: string, replyToId?: string): Message {
    const currentUser = this.getCurrentUser();
    const convId = `conv-${[currentUser.id, receiverId].sort().join('-')}`;
    const newMsg: Message = {
      id: `msg-${Date.now()}`,
      conversation_id: convId,
      sender_id: currentUser.id,
      receiver_id: receiverId,
      sender: currentUser,
      content,
      media_url: mediaUrl,
      reply_to_id: replyToId,
      created_at: new Date().toISOString()
    };
    this.messages.push(newMsg);

    this.createNotification(
      receiverId,
      currentUser.id,
      'NEW_MESSAGE',
      'New Message',
      `${currentUser.full_name}: "${content.slice(0, 35)}..."`,
      '/messages'
    );

    this.notify();
    return newMsg;
  }

  public markMessagesRead(otherUserId: string) {
    const currentUser = this.getCurrentUser();
    let hasUpdated = false;
    this.messages.forEach(m => {
      if (m.sender_id === otherUserId && m.receiver_id === currentUser.id && !m.read_at) {
        m.read_at = new Date().toISOString();
        hasUpdated = true;
      }
    });
    if (hasUpdated) this.notify();
  }

  public unsendMessage(messageId: string): boolean {
    const currentUser = this.getCurrentUser();
    const msg = this.messages.find(m => m.id === messageId);
    if (!msg || msg.sender_id !== currentUser.id) return false;
    msg.is_unsent = true;
    msg.content = 'This message was unsent';
    msg.media_url = undefined;
    this.notify();
    return true;
  }

  // --- Notifications ---
  public getNotifications(): AppNotification[] {
    const currentUser = this.getCurrentUser();
    return this.notifications
      .filter(n => n.user_id === currentUser.id)
      .map(n => {
        const actor = this.profiles.find(p => p.id === n.actor_id) || n.actor;
        return { ...n, actor };
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public createNotification(
    userId: string,
    actorId: string,
    type: AppNotification['type'],
    title: string,
    message: string,
    linkRoute: string
  ) {
    const actor = this.profiles.find(p => p.id === actorId);
    if (!actor) return;
    const notif: AppNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      user_id: userId,
      actor_id: actorId,
      actor,
      type,
      title,
      message,
      link_route: linkRoute,
      is_read: false,
      created_at: new Date().toISOString()
    };
    this.notifications.unshift(notif);
    this.notify();
  }

  public markNotificationRead(id: string) {
    const notif = this.notifications.find(n => n.id === id);
    if (notif) {
      notif.is_read = true;
      this.notify();
    }
  }

  public markAllNotificationsRead() {
    const currentUser = this.getCurrentUser();
    this.notifications.forEach(n => {
      if (n.user_id === currentUser.id) n.is_read = true;
    });
    this.notify();
  }

  // --- Reels / Short Videos ---
  public getReels(): Reel[] {
    const currentUser = this.getCurrentUser();
    return this.reels.map(reel => {
      const author = this.profiles.find(p => p.id === reel.user_id) || reel.author;
      return { ...reel, author };
    });
  }

  public likeReel(reelId: string): boolean {
    const reel = this.reels.find(r => r.id === reelId);
    if (!reel) return false;
    reel.liked_by_me = !reel.liked_by_me;
    reel.likes_count += reel.liked_by_me ? 1 : -1;
    this.notify();
    return reel.liked_by_me;
  }

  public createReel(videoUrl: string, caption: string, musicTitle: string = 'Original Audio'): Reel {
    const currentUser = this.getCurrentUser();
    const newReel: Reel = {
      id: `reel-${Date.now()}`,
      user_id: currentUser.id,
      author: currentUser,
      video_url: videoUrl,
      caption,
      music_title: musicTitle,
      likes_count: 0,
      comments_count: 0,
      shares_count: 0,
      views_count: 1,
      liked_by_me: false,
      saved_by_me: false,
      created_at: new Date().toISOString()
    };
    this.reels.unshift(newReel);
    this.notify();
    return newReel;
  }

  // --- Safety, Reports & Blocks ---
  public reportContent(
    targetType: Report['target_type'],
    targetId: string,
    reason: Report['reason'],
    details: string,
    targetTitle?: string
  ): Report {
    const currentUser = this.getCurrentUser();
    const newReport: Report = {
      id: `rep-${Date.now()}`,
      reporter_id: currentUser.id,
      reporter: currentUser,
      target_type: targetType,
      target_id: targetId,
      target_title: targetTitle,
      reason,
      details,
      status: 'PENDING',
      created_at: new Date().toISOString()
    };
    this.reports.unshift(newReport);
    this.notify();
    return newReport;
  }

  public getLikesReceived() {
    return this.getLikesYouProfiles();
  }

  public resolveReport(reportId: string) {
    this.updateReportStatus(reportId, 'RESOLVED');
  }

  public getReports(): Report[] {
    return [...this.reports];
  }

  public updateReportStatus(reportId: string, status: Report['status']) {
    const report = this.reports.find(r => r.id === reportId);
    if (report) {
      report.status = status;
      this.notify();
    }
  }

  public blockUser(targetUserId: string): Block {
    const currentUser = this.getCurrentUser();
    const existing = this.blocks.find(b => b.blocker_id === currentUser.id && b.blocked_id === targetUserId);
    if (existing) return existing;

    const newBlock: Block = {
      id: `block-${Date.now()}`,
      blocker_id: currentUser.id,
      blocked_id: targetUserId,
      created_at: new Date().toISOString()
    };
    this.blocks.push(newBlock);
    this.notify();
    return newBlock;
  }

  public unblockUser(targetUserId: string) {
    const currentUser = this.getCurrentUser();
    this.blocks = this.blocks.filter(b => !(b.blocker_id === currentUser.id && b.blocked_id === targetUserId));
    this.notify();
  }

  public getBlockedUsers(): Profile[] {
    const currentUser = this.getCurrentUser();
    const blockedIds = this.blocks.filter(b => b.blocker_id === currentUser.id).map(b => b.blocked_id);
    return this.profiles.filter(p => blockedIds.includes(p.id));
  }

  // --- Admin Moderation ---
  public setProfileStatus(userId: string, status: Profile['status']) {
    const profile = this.profiles.find(p => p.id === userId);
    if (profile) {
      profile.status = status;
      this.notify();
    }
  }

  public setProfileRole(userId: string, role: Profile['role']) {
    const profile = this.profiles.find(p => p.id === userId);
    if (profile) {
      profile.role = role;
      this.notify();
    }
  }

  public deleteUser(userId: string) {
    this.profiles = this.profiles.filter(p => p.id !== userId);
    this.posts = this.posts.filter(p => p.user_id !== userId);
    this.matches = this.matches.filter(m => m.user1_id !== userId && m.user2_id !== userId);
    this.notify();
  }
}

export const store = new ReactiveStore();
