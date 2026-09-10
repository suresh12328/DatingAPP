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
  private currentUserId: string = 'user-suresh';

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      // ONLY ONE ACCOUNT in the entire app: Suresh Bohara
      this.profiles = [...SEED_PROFILES];
      this.currentUserId = 'user-suresh';

      const storedPosts = typeof window !== 'undefined' ? localStorage.getItem('lc_posts') : null;
      const storedStories = typeof window !== 'undefined' ? localStorage.getItem('lc_stories') : null;
      const storedReels = typeof window !== 'undefined' ? localStorage.getItem('lc_reels') : null;
      const storedNotifications = typeof window !== 'undefined' ? localStorage.getItem('lc_notifications') : null;

      this.posts = storedPosts ? JSON.parse(storedPosts) : [...SEED_POSTS];
      this.stories = storedStories ? JSON.parse(storedStories) : [...SEED_STORIES];
      const isLegacyReel = (r: any) => {
        if (!r || !r.id) return true;
        const id = String(r.id);
        const url = String(r.video_url || '');
        return (
          id.startsWith('reel-suresh-') ||
          ['reel-1', 'reel-2', 'reel-3', 'reel-4', 'reel-5'].includes(id) ||
          url.includes('mixkit.co') ||
          url.includes('sarah-reel') ||
          url.includes('daniela-reel') ||
          url.includes('mirela-reel') ||
          url.includes('patricia-reel') ||
          url.includes('jessica-reel') ||
          url.includes('1788763498232-277383')
        );
      };

      const parsedReels = storedReels ? JSON.parse(storedReels) : [];
      this.reels = Array.isArray(parsedReels) ? parsedReels.filter(r => !isLegacyReel(r)) : [];
      if (typeof window !== 'undefined') {
        localStorage.setItem('lc_reels', JSON.stringify(this.reels));
      }
      this.notifications = storedNotifications ? JSON.parse(storedNotifications) : [...SEED_NOTIFICATIONS];

      const suresh = SEED_PROFILES[0];
      this.posts.forEach(p => {
        p.user_id = 'user-suresh';
        p.author = suresh;
        if (p.comments) {
          p.comments.forEach(c => {
            c.user_id = 'user-suresh';
            c.author = suresh;
          });
        }
      });

      this.matches = [];
      this.connections = [];
      this.messages = [];
      this.datingLikes = [];
      this.datingPasses = [];
      this.savedPostIds = [{ user_id: 'user-suresh', post_id: 'post-1' }];
      this.reports = [];
      this.blocks = [];
    } catch {
      this.profiles = [...SEED_PROFILES];
      this.posts = [...SEED_POSTS];
      this.stories = [...SEED_STORIES];
      this.reels = [...SEED_REELS];
      this.matches = [];
      this.connections = [];
      this.notifications = [...SEED_NOTIFICATIONS];
      this.messages = [];
      this.datingLikes = [];
      this.datingPasses = [];
      this.savedPostIds = [{ user_id: 'user-suresh', post_id: 'post-1' }];
      this.reports = [];
      this.blocks = [];
      this.currentUserId = 'user-suresh';
    }
  }

  private generateInitialLikes(): DatingLike[] {
    return [];
  }

  private generateInitialMessages(): Message[] {
    return [];
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
    return [this.getCurrentUser()];
  }

  public getProfileById(_id: string): Profile | undefined {
    return this.getCurrentUser();
  }

  public getProfileByUsername(_username: string): Profile | undefined {
    return this.getCurrentUser();
  }

  public syncProfiles(serverProfiles: Profile[]): void {
    if (!serverProfiles || !serverProfiles.length) return;
    const suresh = serverProfiles.find(p => p.id === 'user-suresh' || p.username === 'suresh_bohara') || serverProfiles[0];
    if (suresh) {
      this.profiles = [{ ...SEED_PROFILES[0], ...suresh, id: 'user-suresh', role: 'ADMIN' }];
      this.saveToStorage();
    }
  }

  public upsertProfile(profile: Profile): Profile {
    if (!profile) return this.getCurrentUser();
    // Enforce role policy: only Suresh can be ADMIN
    const isSuresh = profile.id === 'user-suresh' || (profile.email && profile.email.toLowerCase().trim() === 'bohara.suresh8884@gmail.com');
    const safeProfile = {
      ...profile,
      role: isSuresh ? ('ADMIN' as const) : ('USER' as const)
    };

    const idx = this.profiles.findIndex(p => p.id === safeProfile.id || (safeProfile.email && p.email?.toLowerCase() === safeProfile.email.toLowerCase()));
    if (idx !== -1) {
      this.profiles[idx] = { ...this.profiles[idx], ...safeProfile };
      this.saveToStorage();
      return this.profiles[idx];
    } else {
      this.profiles.unshift(safeProfile);
      this.saveToStorage();
      return safeProfile;
    }
  }

  public updateProfile(id: string, updates: Partial<Profile>): Profile {
    let idx = this.profiles.findIndex(p => p.id === id);
    if (idx === -1 && updates.email) {
      idx = this.profiles.findIndex(p => p.email?.toLowerCase() === updates.email!.toLowerCase());
    }
    if (idx === -1 && updates.username) {
      idx = this.profiles.findIndex(p => p.username?.toLowerCase() === updates.username!.toLowerCase());
    }
    if (idx === -1 && this.currentUserId) {
      idx = this.profiles.findIndex(p => p.id === this.currentUserId);
    }

    if (idx !== -1) {
      const target = this.profiles[idx];
      const isSuresh = target.id === 'user-suresh' || (target.email && target.email.toLowerCase().trim() === 'bohara.suresh8884@gmail.com');
      const safeUpdates = { ...updates };
      if (!isSuresh && (safeUpdates.role === 'ADMIN' || safeUpdates.role === 'MODERATOR')) {
        delete safeUpdates.role;
      }
      this.profiles[idx] = { ...this.profiles[idx], ...safeUpdates };
      // Also update author in posts/comments
      this.posts = this.posts.map(post => {
        if (post.user_id === this.profiles[idx].id) {
          return { ...post, author: this.profiles[idx] };
        }
        return post;
      });
      this.notify();
      return this.profiles[idx];
    }

    // Upsert seamlessly without throwing an error
    const fallbackProfile: Profile = {
      id: id || `user-${Date.now()}`,
      email: (updates as any).email || '',
      username: updates.username || (updates.full_name ? updates.full_name.toLowerCase().replace(/\s+/g, '_') : `user_${id}`),
      full_name: updates.full_name || 'User',
      avatar_url: updates.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
      cover_url: updates.cover_url || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
      bio: updates.bio || '',
      age: updates.age || 24,
      dob: updates.dob || '2000-01-01',
      gender: updates.gender || 'WOMAN',
      dating_preference: updates.dating_preference || 'EVERYONE',
      location: updates.location || 'San Francisco, CA',
      profession: updates.profession || '',
      education: updates.education || '',
      interests: updates.interests || ['Dating', 'Coffee'],
      relationship_goal: updates.relationship_goal || 'LONG_TERM',
      languages: updates.languages || ['English'],
      height_cm: updates.height_cm || 170,
      photos: updates.photos || [updates.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80'],
      lifestyle: updates.lifestyle || { drinking: 'SOCIALLY', smoking: 'NEVER', workout: 'OFTEN' },
      is_verified: updates.is_verified ?? false,
      email_verified: updates.email_verified ?? true,
      is_online: true,
      last_active: 'Just now',
      role: updates.role || 'USER',
      status: updates.status || 'ACTIVE',
      privacy: updates.privacy || {
        profileVisibility: 'PUBLIC',
        whoCanMessageMe: 'EVERYONE',
        whoCanConnect: 'EVERYONE',
        datingVisible: true,
        showOnlineStatus: true,
        readReceipts: true
      },
      created_at: new Date().toISOString(),
      ...updates
    };

    this.profiles.unshift(fallbackProfile);
    this.notify();
    return fallbackProfile;
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
    this.savedPostIds = this.savedPostIds.filter(sp => sp.post_id !== postId);
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
    const aInterests = Array.isArray(userA?.interests) ? userA.interests : [];
    const bInterests = Array.isArray(userB?.interests) ? userB.interests : [];
    // Shared interests bonus
    const sharedInterests = aInterests.filter(i =>
      bInterests.some(bi => bi.toLowerCase() === i.toLowerCase())
    );
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
        if (p.privacy && p.privacy.datingVisible === false) return false;
        if (filters?.minAge && p.age < filters.minAge) return false;
        if (filters?.maxAge && p.age > filters.maxAge) return false;
        if (filters?.gender && filters.gender !== 'ALL' && p.gender !== filters.gender) return false;
        if (filters?.relationshipGoal && filters.relationshipGoal !== 'ALL' && p.relationship_goal !== filters.relationshipGoal) return false;
        const userInterests = p.interests || [];
        if (filters?.interest && !userInterests.some(i => i.toLowerCase().includes(filters.interest!.toLowerCase()))) return false;
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
        m => !m.is_unsent &&
             ((m.sender_id === currentUser.id && m.receiver_id === otherUser.id) ||
              (m.sender_id === otherUser.id && m.receiver_id === currentUser.id) ||
              m.conversation_id === convId)
      ).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

      const lastMessage = convMessages[convMessages.length - 1];
      const unreadCount = convMessages.filter(m => m.receiver_id === currentUser.id && !m.read_at).length;

      conversationMap.set(otherUser.id, {
        id: convId,
        participant_ids: [currentUser.id, otherUser.id],
        other_user: otherUser,
        other_user_id: otherUser.id,
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
        m => !m.is_unsent &&
             ((m.sender_id === currentUser.id && m.receiver_id === otherUser.id) ||
              (m.sender_id === otherUser.id && m.receiver_id === currentUser.id) ||
              m.conversation_id === convId)
      ).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

      const lastMessage = convMessages[convMessages.length - 1];
      const unreadCount = convMessages.filter(m => m.receiver_id === currentUser.id && !m.read_at).length;

      conversationMap.set(otherUser.id, {
        id: convId,
        participant_ids: [currentUser.id, otherUser.id],
        other_user: otherUser,
        other_user_id: otherUser.id,
        is_dating_match: false,
        last_message: lastMessage,
        unread_count: unreadCount,
        updated_at: lastMessage ? lastMessage.created_at : conn.created_at
      });
    });

    // Also include any other user in this.messages
    this.messages.forEach(m => {
      if (m.is_unsent) return;
      const otherId = m.sender_id === currentUser.id ? m.receiver_id : (m.receiver_id === currentUser.id ? m.sender_id : null);
      if (!otherId || otherId === currentUser.id || conversationMap.has(otherId)) return;
      const otherUser = this.profiles.find(p => p.id === otherId);
      if (!otherUser || otherUser.id === currentUser.id) return;
      const convId = m.conversation_id || `conv-${[currentUser.id, otherUser.id].sort().join('-')}`;

      const convMessages = this.messages.filter(
        msg => !msg.is_unsent &&
               ((msg.sender_id === currentUser.id && msg.receiver_id === otherUser.id) ||
                (msg.sender_id === otherUser.id && msg.receiver_id === currentUser.id))
      ).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      const lastMessage = convMessages[convMessages.length - 1];
      const unreadCount = convMessages.filter(msg => msg.receiver_id === currentUser.id && !msg.read_at).length;
      conversationMap.set(otherUser.id, {
        id: convId,
        participant_ids: [currentUser.id, otherUser.id],
        other_user: otherUser,
        other_user_id: otherUser.id,
        is_dating_match: false,
        last_message: lastMessage,
        unread_count: unreadCount,
        updated_at: lastMessage ? lastMessage.created_at : m.created_at
      });
    });

    return Array.from(conversationMap.values()).sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
  }

  public getMessagesForUser(targetId: string): Message[] {
    const currentUser = this.getCurrentUser();
    return this.messages
      .filter(
        m =>
          !m.is_unsent &&
          ((m.sender_id === currentUser.id && m.receiver_id === targetId) ||
           (m.sender_id === targetId && m.receiver_id === currentUser.id))
      )
      .map(m => {
        const sender = this.profiles.find(p => p.id === m.sender_id) || m.sender;
        return { ...m, sender };
      })
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }

  public getMessagesForConversation(convId: string): Message[] {
    const currentUser = this.getCurrentUser();
    const conv = this.getConversations().find(c => c.id === convId);
    const otherId = conv
      ? (conv.participant_ids?.find(id => id !== currentUser.id) ||
         (conv.other_user_id !== currentUser.id ? conv.other_user_id : undefined) ||
         (conv.other_user?.id !== currentUser.id ? conv.other_user?.id : undefined))
      : null;

    return this.messages
      .filter(m => {
        if (m.is_unsent) return false;
        // If we know the other user in this conversation, strictly enforce participant pair
        if (otherId) {
          return (m.sender_id === currentUser.id && m.receiver_id === otherId) ||
                 (m.sender_id === otherId && m.receiver_id === currentUser.id) ||
                 m.conversation_id === convId;
        }
        return m.conversation_id === convId;
      })
      .map(m => {
        const sender = this.profiles.find(p => p.id === m.sender_id) || m.sender;
        return { ...m, sender };
      })
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }

  public sendMessage(receiverId: string, content: string, mediaUrl?: string, replyToId?: string, conversationId?: string): Message {
    const currentUser = this.getCurrentUser();
    let targetReceiver = receiverId;
    if ((!targetReceiver || targetReceiver === currentUser.id) && conversationId) {
      const conv = this.getConversations().find(c => c.id === conversationId);
      if (conv) {
        targetReceiver =
          conv.participant_ids?.find(id => id !== currentUser.id) ||
          (conv.other_user_id !== currentUser.id ? conv.other_user_id : undefined) ||
          (conv.other_user?.id !== currentUser.id ? conv.other_user?.id : '') ||
          '';
      }
    }
    if (!targetReceiver || targetReceiver === currentUser.id) {
      console.warn('Cannot send message to yourself or empty receiver:', targetReceiver);
      targetReceiver = receiverId;
    }
    const convId = conversationId || `conv-${[currentUser.id, targetReceiver].sort().join('-')}`;
    const targetUser = this.profiles.find(p => p.id === targetReceiver);
    const isReceiverOnline = Boolean(targetUser?.is_online);
    const now = new Date().toISOString();

    const newMsg: Message = {
      id: `msg-${Date.now()}`,
      conversation_id: convId,
      sender_id: currentUser.id,
      receiver_id: targetReceiver,
      sender: currentUser,
      content,
      media_url: mediaUrl,
      reply_to_id: replyToId,
      status: isReceiverOnline ? 'delivered' : 'sent',
      delivered_at: isReceiverOnline ? now : undefined,
      is_read: false,
      created_at: now
    };
    this.messages.push(newMsg);

    this.createNotification(
      targetReceiver,
      currentUser.id,
      'NEW_MESSAGE',
      'New Message',
      `${currentUser.full_name}: "${content.slice(0, 35)}..."`,
      '/messages'
    );

    this.notify();
    return newMsg;
  }

  public markMessagesDelivered(receiverId: string, messageIds?: string[]): Message[] {
    const now = new Date().toISOString();
    const updated: Message[] = [];
    this.messages.forEach(m => {
      const matchReceiver = m.receiver_id === receiverId;
      const matchId = !messageIds || messageIds.includes(m.id);
      if (matchReceiver && matchId && m.status === 'sent') {
        m.status = 'delivered';
        m.delivered_at = now;
        updated.push(m);
      }
    });
    if (updated.length > 0) this.notify();
    return updated;
  }

  public markMessagesRead(otherUserId: string, conversationId?: string) {
    const currentUser = this.getCurrentUser();
    let hasUpdated = false;
    const now = new Date().toISOString();
    this.messages.forEach(m => {
      const matchByUsers = (!otherUserId || m.sender_id === otherUserId) && m.receiver_id === currentUser.id;
      const matchByConv = Boolean(conversationId && m.conversation_id === conversationId && m.receiver_id === currentUser.id);
      if ((matchByUsers || matchByConv) && m.status !== 'read') {
        m.status = 'read';
        m.read_at = m.read_at || now;
        m.delivered_at = m.delivered_at || m.read_at;
        m.is_read = true;
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

  public updateMessageContent(messageId: string, newContent: string): boolean {
    const msg = this.messages.find(m => m.id === messageId);
    if (!msg) return false;
    msg.content = newContent;
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

  public saveReel(reelId: string): boolean {
    const reel = this.reels.find(r => r.id === reelId);
    if (!reel) return false;
    reel.saved_by_me = !reel.saved_by_me;
    this.notify();
    return reel.saved_by_me;
  }

  public shareReel(reelId: string): number {
    const reel = this.reels.find(r => r.id === reelId);
    if (!reel) return 0;
    reel.shares_count = (reel.shares_count || 0) + 1;
    this.notify();
    return reel.shares_count;
  }

  public commentReel(reelId: string, content: string): any {
    const reel = this.reels.find(r => r.id === reelId);
    if (!reel) return null;
    const currentUser = this.getCurrentUser();
    reel.comments_count = (reel.comments_count || 0) + 1;
    this.notify();
    return {
      id: `reel-cmt-${Date.now()}`,
      user_id: currentUser.id,
      author: currentUser,
      content,
      created_at: new Date().toISOString(),
      likes_count: 0
    };
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

  public deleteReel(reelId: string): boolean {
    const currentUser = this.getCurrentUser();
    const reel = this.reels.find(r => r.id === reelId);
    if (!reel) return false;
    if (reel.user_id !== currentUser.id && currentUser.role !== 'ADMIN') return false;

    this.reels = this.reels.filter(r => r.id !== reelId);
    this.notify();
    return true;
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
