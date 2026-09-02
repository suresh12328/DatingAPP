import fs from 'fs';
import path from 'path';
import {
  Profile,
  Post,
  Story,
  Reel,
  Match,
  Connection,
  AppNotification,
  Conversation,
  Message,
  Report,
  Block,
  ReportReason,
  UserRole,
  UserStatus
} from '../src/types';
import {
  SEED_PROFILES,
  SEED_POSTS,
  SEED_STORIES,
  SEED_REELS,
  SEED_MATCHES,
  SEED_CONNECTIONS,
  SEED_NOTIFICATIONS
} from '../src/lib/seedData';

export interface VerificationRequest {
  id: string;
  user_id: string;
  user?: Profile;
  selfie_url: string;
  id_document_url?: string;
  notes?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  submitted_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
}

export interface SupportTicket {
  id: string;
  user_id: string;
  user?: Profile;
  subject: string;
  category: 'MATCHING' | 'ACCOUNT' | 'BILLING' | 'SAFETY' | 'BUG' | 'OTHER';
  message: string;
  attachment_url?: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
  created_at: string;
  admin_reply?: string;
}

export interface Announcement {
  id: string;
  title: string;
  message: string;
  type: 'INFO' | 'MAINTENANCE' | 'FEATURE' | 'ALERT';
  created_by: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  admin_id: string;
  admin_name: string;
  action: string;
  target_type: 'USER' | 'REPORT' | 'VERIFICATION' | 'POST' | 'SYSTEM';
  target_id: string;
  details: string;
  created_at: string;
}

export interface ActiveSession {
  id: string;
  user_id: string;
  device: string;
  browser: string;
  ip: string;
  location: string;
  is_current: boolean;
  last_active: string;
}

export interface UserVerificationRecord {
  id: string;
  user_id: string;
  target: string;
  type: 'EMAIL' | 'PHONE';
  otp_hash: string;
  salt: string;
  attempts: number;
  max_attempts: number;
  expires_at: string;
  resend_available_at: string;
  created_at: string;
}

export interface PasswordResetRecord {
  id: string;
  user_id: string;
  target: string;
  code_hash: string;
  salt: string;
  expires_at: string;
  used_at?: string;
  created_at: string;
}

export interface StoredSession {
  id: string;
  token_hash: string;
  user_id: string;
  device: string;
  browser: string;
  ip: string;
  location: string;
  created_at: string;
  last_active: string;
  expires_at: string;
}

interface DatabaseSchema {
  users: Profile[];
  posts: Post[];
  stories: Story[];
  reels: Reel[];
  matches: Match[];
  connections: Connection[];
  conversations: Conversation[];
  messages: Message[];
  notifications: AppNotification[];
  reports: Report[];
  blocks: Block[];
  dating_likes: { id: string; from_user_id: string; to_user_id: string; is_super_like: boolean; created_at: string }[];
  dating_passes: { id: string; from_user_id: string; to_user_id: string; created_at: string }[];
  verification_requests: VerificationRequest[];
  support_tickets: SupportTicket[];
  announcements: Announcement[];
  audit_logs: AuditLog[];
  active_sessions: ActiveSession[];
  user_verifications: UserVerificationRecord[];
  password_resets: PasswordResetRecord[];
  stored_sessions: StoredSession[];
}

const DB_FILE = path.join(process.cwd(), '.db_loveconnect.json');

class DatabaseEngine {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.loadOrInitialize();
  }

  private loadOrInitialize(): DatabaseSchema {
    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed.users && parsed.users.length > 0) {
          return parsed;
        }
      } catch (err) {
        console.warn('Failed to parse database file, reinitializing with seed data:', err);
      }
    }

    const initialUsers = JSON.parse(JSON.stringify(SEED_PROFILES)) as Profile[];
    const initialPosts = JSON.parse(JSON.stringify(SEED_POSTS)) as Post[];
    const initialStories = JSON.parse(JSON.stringify(SEED_STORIES)) as Story[];
    const initialReels = JSON.parse(JSON.stringify(SEED_REELS)) as Reel[];
    const initialMatches = JSON.parse(JSON.stringify(SEED_MATCHES)) as Match[];
    const initialConnections = JSON.parse(JSON.stringify(SEED_CONNECTIONS)) as Connection[];
    const initialNotifs = JSON.parse(JSON.stringify(SEED_NOTIFICATIONS)) as AppNotification[];

    const initialMessages: Message[] = [
      {
        id: 'msg-1',
        conversation_id: 'conv-1',
        sender_id: 'user-sarah',
        receiver_id: 'user-david',
        content: 'Hey David! Loved your post on Ethiopian coffee pour-over ☕',
        created_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
        read_at: new Date(Date.now() - 1.8 * 3600 * 1000).toISOString()
      },
      {
        id: 'msg-2',
        conversation_id: 'conv-1',
        sender_id: 'user-david',
        receiver_id: 'user-sarah',
        content: 'Thanks Sarah! That roaster is right by Hayes Valley. Have you been to that gallery opening on Friday?',
        created_at: new Date(Date.now() - 1.5 * 3600 * 1000).toISOString(),
        read_at: new Date(Date.now() - 1.4 * 3600 * 1000).toISOString()
      },
      {
        id: 'msg-3',
        conversation_id: 'conv-1',
        sender_id: 'user-sarah',
        receiver_id: 'user-david',
        content: 'Would love to check out that new contemporary gallery opening this Friday!',
        created_at: new Date(Date.now() - 1 * 3600 * 1000).toISOString()
      },
      {
        id: 'msg-4',
        conversation_id: 'conv-2',
        sender_id: 'user-daniela',
        receiver_id: 'user-david',
        content: 'That sourdough starter recipe was incredible, thanks David!',
        created_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
        read_at: new Date(Date.now() - 23 * 3600 * 1000).toISOString()
      }
    ];

    const initialConversations: Conversation[] = [
      {
        id: 'conv-1',
        participant_ids: ['user-david', 'user-sarah'],
        other_user: initialUsers.find(u => u.id === 'user-sarah')!,
        is_dating_match: true,
        last_message: initialMessages[2],
        unread_count: 1,
        updated_at: initialMessages[2].created_at
      },
      {
        id: 'conv-2',
        participant_ids: ['user-david', 'user-daniela'],
        other_user: initialUsers.find(u => u.id === 'user-daniela')!,
        is_dating_match: true,
        last_message: initialMessages[3],
        unread_count: 0,
        updated_at: initialMessages[3].created_at
      }
    ];

    const initialReports: Report[] = [
      {
        id: 'rep-1',
        reporter_id: 'user-sarah',
        reporter: initialUsers.find(u => u.id === 'user-sarah')!,
        target_type: 'USER',
        target_id: 'user-derek',
        target_title: 'Derek Woods',
        reason: 'SPAM',
        details: 'Sent unsolicited crypto links in bio',
        status: 'PENDING',
        created_at: new Date(Date.now() - 12 * 3600 * 1000).toISOString()
      }
    ];

    const initialVerifications: VerificationRequest[] = [
      {
        id: 'ver-1',
        user_id: 'user-patricia',
        user: initialUsers.find(u => u.id === 'user-patricia')!,
        selfie_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=600&q=80',
        id_document_url: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=600&q=80',
        notes: 'Passport verified with live selfie capture matching profile photo.',
        status: 'PENDING',
        submitted_at: new Date(Date.now() - 6 * 3600 * 1000).toISOString()
      }
    ];

    const initialAnnouncements: Announcement[] = [
      {
        id: 'ann-1',
        title: '🎉 Welcome to LoveConnect 2.0',
        message: 'Experience our new verified dating algorithm, real-time messaging, and enhanced safety filters!',
        type: 'FEATURE',
        created_by: 'user-david',
        created_at: new Date(Date.now() - 48 * 3600 * 1000).toISOString()
      }
    ];

    const initialAuditLogs: AuditLog[] = [
      {
        id: 'audit-1',
        admin_id: 'user-david',
        admin_name: 'David Chen',
        action: 'VERIFY_USER',
        target_type: 'USER',
        target_id: 'user-sarah',
        details: 'Approved 18+ identity verification for Sarah Miller',
        created_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString()
      }
    ];

    const initialSessions: ActiveSession[] = [
      {
        id: 'sess-1',
        user_id: 'user-david',
        device: 'MacBook Pro 16"',
        browser: 'Chrome 124.0',
        ip: '198.51.100.42',
        location: 'San Francisco, CA (US)',
        is_current: true,
        last_active: 'Active now'
      },
      {
        id: 'sess-2',
        user_id: 'user-david',
        device: 'iPhone 15 Pro',
        browser: 'Mobile Safari',
        ip: '198.51.100.89',
        location: 'San Francisco, CA (US)',
        is_current: false,
        last_active: '2 hours ago'
      }
    ];

    const schema: DatabaseSchema = {
      users: initialUsers,
      posts: initialPosts,
      stories: initialStories,
      reels: initialReels,
      matches: initialMatches,
      connections: initialConnections,
      conversations: initialConversations,
      messages: initialMessages,
      notifications: initialNotifs,
      reports: initialReports,
      blocks: [],
      dating_likes: [
        { id: 'like-1', from_user_id: 'user-david', to_user_id: 'user-sarah', is_super_like: true, created_at: new Date(Date.now() - 48 * 3600 * 1000).toISOString() },
        { id: 'like-2', from_user_id: 'user-sarah', to_user_id: 'user-david', is_super_like: false, created_at: new Date(Date.now() - 47 * 3600 * 1000).toISOString() },
        { id: 'like-3', from_user_id: 'user-jessica', to_user_id: 'user-david', is_super_like: false, created_at: new Date(Date.now() - 10 * 3600 * 1000).toISOString() },
        { id: 'like-4', from_user_id: 'user-mirela', to_user_id: 'user-david', is_super_like: true, created_at: new Date(Date.now() - 5 * 3600 * 1000).toISOString() }
      ],
      dating_passes: [],
      verification_requests: initialVerifications,
      support_tickets: [
        {
          id: 'tick-1',
          user_id: 'user-sarah',
          subject: 'Question regarding photo reordering',
          category: 'ACCOUNT',
          message: 'Is it possible to set my third photo as the primary card preview?',
          status: 'OPEN',
          created_at: new Date(Date.now() - 8 * 3600 * 1000).toISOString()
        }
      ],
      announcements: initialAnnouncements,
      audit_logs: initialAuditLogs,
      active_sessions: initialSessions
    };

    this.save(schema);
    return schema;
  }

  private save(data?: DatabaseSchema) {
    const toSave = data || this.data;
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(toSave, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to write database file:', err);
    }
  }

  // --- Users & Auth ---
  getAllUsers(): Profile[] {
    return this.data.users;
  }

  getUserById(id: string): Profile | undefined {
    return this.data.users.find(u => u.id === id);
  }

  getUserByEmailOrUsername(identifier: string): Profile | undefined {
    const lower = identifier.toLowerCase();
    return this.data.users.find(u => u.email.toLowerCase() === lower || u.username.toLowerCase() === lower);
  }

  createUser(profile: Profile): Profile {
    this.data.users.unshift(profile);
    this.save();
    return profile;
  }

  updateUser(id: string, updates: Partial<Profile>): Profile {
    const index = this.data.users.findIndex(u => u.id === id);
    if (index === -1) throw new Error('User not found');
    this.data.users[index] = { ...this.data.users[index], ...updates };
    
    // Update populated authors in posts, comments, stories, etc.
    const updated = this.data.users[index];
    this.data.posts.forEach(p => {
      if (p.user_id === id) p.author = updated;
      if (p.comments) {
        p.comments.forEach(c => {
          if (c.user_id === id) c.author = updated;
          if (c.replies) {
            c.replies.forEach(r => {
              if (r.user_id === id) r.author = updated;
            });
          }
        });
      }
    });
    this.data.stories.forEach(s => {
      if (s.user_id === id) s.author = updated;
    });
    this.data.reels.forEach(r => {
      if (r.user_id === id) r.author = updated;
    });
    this.data.conversations.forEach(c => {
      if (c.other_user.id === id) c.other_user = updated;
    });

    this.save();
    return updated;
  }

  deleteUser(id: string) {
    this.data.users = this.data.users.filter(u => u.id !== id);
    this.data.posts = this.data.posts.filter(p => p.user_id !== id);
    this.data.stories = this.data.stories.filter(s => s.user_id !== id);
    this.data.reels = this.data.reels.filter(r => r.user_id !== id);
    this.data.matches = this.data.matches.filter(m => m.user1_id !== id && m.user2_id !== id);
    this.data.connections = this.data.connections.filter(c => c.requester_id !== id && c.receiver_id !== id);
    this.data.dating_likes = this.data.dating_likes.filter(l => l.from_user_id !== id && l.to_user_id !== id);
    this.data.notifications = this.data.notifications.filter(n => n.user_id !== id);
    this.save();
  }

  // --- Dating & Matches ---
  getDatingLikes(userId: string) {
    return this.data.dating_likes.filter(l => l.to_user_id === userId);
  }

  getLikesSent(userId: string) {
    return this.data.dating_likes.filter(l => l.from_user_id === userId);
  }

  likeProfile(fromUserId: string, toUserId: string, isSuperLike = false): { isMatch: boolean; match?: Match } {
    if (fromUserId === toUserId) return { isMatch: false };

    // Check if already liked
    const existing = this.data.dating_likes.find(l => l.from_user_id === fromUserId && l.to_user_id === toUserId);
    if (!existing) {
      this.data.dating_likes.push({
        id: `like-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        from_user_id: fromUserId,
        to_user_id: toUserId,
        is_super_like: isSuperLike,
        created_at: new Date().toISOString()
      });
    }

    // Remove from passes if present
    this.data.dating_passes = this.data.dating_passes.filter(p => !(p.from_user_id === fromUserId && p.to_user_id === toUserId));

    const fromUser = this.getUserById(fromUserId);
    const toUser = this.getUserById(toUserId);

    // Send notification
    if (toUser && fromUser) {
      this.createNotification({
        id: `notif-${Date.now()}`,
        user_id: toUserId,
        actor_id: fromUserId,
        actor: fromUser,
        type: isSuperLike ? 'SUPER_LIKE' : 'DATING_LIKE',
        title: isSuperLike ? '⭐ New Super Like!' : '💖 New Dating Like',
        message: `${fromUser.full_name} ${isSuperLike ? 'super-liked' : 'liked'} your dating profile!`,
        link_route: '/likes',
        is_read: false,
        created_at: new Date().toISOString()
      });
    }

    // Check if mutual like exists
    const mutualLike = this.data.dating_likes.find(l => l.from_user_id === toUserId && l.to_user_id === fromUserId);
    if (mutualLike && fromUser && toUser) {
      // Check if match already exists
      const existingMatch = this.data.matches.find(
        m => (m.user1_id === fromUserId && m.user2_id === toUserId) || (m.user1_id === toUserId && m.user2_id === fromUserId)
      );

      if (!existingMatch) {
        // Calculate dynamic compatibility score
        const commonInterests = fromUser.interests.filter(i => toUser.interests.includes(i)).length;
        const goalBonus = fromUser.relationship_goal === toUser.relationship_goal ? 25 : 10;
        const score = Math.min(99, Math.max(75, 60 + commonInterests * 8 + goalBonus));

        const newMatch: Match = {
          id: `match-${Date.now()}`,
          user1_id: fromUserId,
          user2_id: toUserId,
          user1: fromUser,
          user2: toUser,
          created_at: new Date().toISOString(),
          compatibility_score: score,
          unread_count: 0
        };
        this.data.matches.unshift(newMatch);

        // Notify both
        this.createNotification({
          id: `notif-${Date.now()}-1`,
          user_id: toUserId,
          actor_id: fromUserId,
          actor: fromUser,
          type: 'NEW_MATCH',
          title: "🎉 It's a Match!",
          message: `You and ${fromUser.full_name} matched! Say hello!`,
          link_route: '/messages',
          is_read: false,
          created_at: new Date().toISOString()
        });

        this.createNotification({
          id: `notif-${Date.now()}-2`,
          user_id: fromUserId,
          actor_id: toUserId,
          actor: toUser,
          type: 'NEW_MATCH',
          title: "🎉 It's a Match!",
          message: `You and ${toUser.full_name} matched! Say hello!`,
          link_route: '/messages',
          is_read: false,
          created_at: new Date().toISOString()
        });

        // Ensure conversation exists
        this.getOrCreateConversation(fromUserId, toUserId, true);
        this.save();
        return { isMatch: true, match: newMatch };
      }
    }

    this.save();
    return { isMatch: false };
  }

  passProfile(fromUserId: string, toUserId: string) {
    this.data.dating_passes = this.data.dating_passes.filter(p => !(p.from_user_id === fromUserId && p.to_user_id === toUserId));
    this.data.dating_passes.push({
      id: `pass-${Date.now()}`,
      from_user_id: fromUserId,
      to_user_id: toUserId,
      created_at: new Date().toISOString()
    });
    this.save();
  }

  undoLastAction(fromUserId: string): { undoneUserId?: string } {
    const lastPass = [...this.data.dating_passes].reverse().find(p => p.from_user_id === fromUserId);
    if (lastPass) {
      this.data.dating_passes = this.data.dating_passes.filter(p => p.id !== lastPass.id);
      this.save();
      return { undoneUserId: lastPass.to_user_id };
    }
    const lastLike = [...this.data.dating_likes].reverse().find(l => l.from_user_id === fromUserId);
    if (lastLike) {
      this.data.dating_likes = this.data.dating_likes.filter(l => l.id !== lastLike.id);
      this.save();
      return { undoneUserId: lastLike.to_user_id };
    }
    return {};
  }

  getMatches(userId: string): Match[] {
    return this.data.matches.filter(m => m.user1_id === userId || m.user2_id === userId);
  }

  unmatch(matchId: string) {
    this.data.matches = this.data.matches.filter(m => m.id !== matchId);
    this.save();
  }

  // --- Conversations & Messages ---
  getConversations(userId: string): Conversation[] {
    const list: Conversation[] = [];
    for (const c of this.data.conversations) {
      if (c.participant_ids.includes(userId)) {
        const otherId = c.participant_ids.find(id => id !== userId);
        if (otherId) {
          const other = this.getUserById(otherId);
          if (other) {
            const msgs = this.getMessagesForConversation(c.id);
            const lastMsg = msgs[msgs.length - 1];
            const unread = msgs.filter(m => m.receiver_id === userId && !m.read_at).length;
            list.push({
              ...c,
              other_user: other,
              last_message: lastMsg,
              unread_count: unread,
              updated_at: lastMsg ? lastMsg.created_at : c.updated_at
            });
          }
        }
      }
    }
    return list.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
  }

  getOrCreateConversation(user1Id: string, user2Id: string, isDatingMatch = false): Conversation {
    const found = this.data.conversations.find(
      c => c.participant_ids.includes(user1Id) && c.participant_ids.includes(user2Id)
    );
    if (found) return found;

    const other = this.getUserById(user2Id)!;
    const newConv: Conversation = {
      id: `conv-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      participant_ids: [user1Id, user2Id],
      other_user: other,
      is_dating_match: isDatingMatch,
      unread_count: 0,
      updated_at: new Date().toISOString()
    };
    this.data.conversations.unshift(newConv);
    this.save();
    return newConv;
  }

  getMessagesForConversation(convId: string): Message[] {
    return this.data.messages.filter(m => m.conversation_id === convId && !m.is_unsent);
  }

  getMessagesBetweenUsers(user1Id: string, user2Id: string): Message[] {
    const conv = this.getOrCreateConversation(user1Id, user2Id);
    return this.getMessagesForConversation(conv.id);
  }

  sendMessage(senderId: string, receiverId: string, content: string, mediaUrl?: string, replyToId?: string): Message {
    const conv = this.getOrCreateConversation(senderId, receiverId);
    const sender = this.getUserById(senderId);
    const msg: Message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      conversation_id: conv.id,
      sender_id: senderId,
      receiver_id: receiverId,
      sender,
      content,
      media_url: mediaUrl,
      media_type: mediaUrl ? 'image' : undefined,
      reply_to_id: replyToId,
      created_at: new Date().toISOString()
    };
    this.data.messages.push(msg);
    conv.updated_at = msg.created_at;

    // Send notification
    if (sender) {
      this.createNotification({
        id: `notif-${Date.now()}`,
        user_id: receiverId,
        actor_id: senderId,
        actor: sender,
        type: 'NEW_MESSAGE',
        title: `Message from ${sender.full_name}`,
        message: content.length > 60 ? `${content.slice(0, 57)}...` : content,
        link_route: `/messages`,
        is_read: false,
        created_at: new Date().toISOString()
      });
    }

    this.save();
    return msg;
  }

  markMessagesRead(receiverId: string, senderId: string) {
    let changed = false;
    this.data.messages.forEach(m => {
      if (m.receiver_id === receiverId && m.sender_id === senderId && !m.read_at) {
        m.read_at = new Date().toISOString();
        changed = true;
      }
    });
    if (changed) this.save();
  }

  unsendMessage(messageId: string, userId: string) {
    const msg = this.data.messages.find(m => m.id === messageId);
    if (msg && msg.sender_id === userId) {
      msg.is_unsent = true;
      this.save();
    }
  }

  // --- Posts & Feed ---
  getPosts(currentUserId?: string): Post[] {
    const blockedIds = currentUserId ? this.getBlockedUserIds(currentUserId) : [];
    return this.data.posts.filter(p => !blockedIds.includes(p.user_id));
  }

  getPostById(postId: string): Post | undefined {
    return this.data.posts.find(p => p.id === postId);
  }

  createPost(post: Post): Post {
    this.data.posts.unshift(post);
    this.save();
    return post;
  }

  toggleLikePost(postId: string, userId: string): boolean {
    const post = this.getPostById(postId);
    if (!post) return false;
    post.liked_by_me = !post.liked_by_me;
    post.likes_count = post.liked_by_me ? post.likes_count + 1 : Math.max(0, post.likes_count - 1);
    
    if (post.liked_by_me && post.user_id !== userId) {
      const user = this.getUserById(userId);
      if (user) {
        this.createNotification({
          id: `notif-${Date.now()}`,
          user_id: post.user_id,
          actor_id: userId,
          actor: user,
          type: 'LIKE_POST',
          title: 'Post Liked',
          message: `${user.full_name} liked your post.`,
          link_route: '/home',
          is_read: false,
          created_at: new Date().toISOString()
        });
      }
    }
    this.save();
    return post.liked_by_me;
  }

  toggleSavePost(postId: string): boolean {
    const post = this.getPostById(postId);
    if (!post) return false;
    post.saved_by_me = !post.saved_by_me;
    this.save();
    return post.saved_by_me;
  }

  addComment(postId: string, userId: string, content: string) {
    const post = this.getPostById(postId);
    if (!post) return;
    const author = this.getUserById(userId);
    if (!author) return;

    if (!post.comments) post.comments = [];
    const newComment = {
      id: `comm-${Date.now()}`,
      post_id: postId,
      user_id: userId,
      author,
      content,
      created_at: new Date().toISOString(),
      likes_count: 0,
      liked_by_me: false,
      replies: []
    };
    post.comments.push(newComment);
    post.comments_count = (post.comments_count || 0) + 1;

    if (post.user_id !== userId) {
      this.createNotification({
        id: `notif-${Date.now()}`,
        user_id: post.user_id,
        actor_id: userId,
        actor: author,
        type: 'COMMENT_POST',
        title: 'New Comment',
        message: `${author.full_name} commented: "${content.slice(0, 40)}${content.length > 40 ? '...' : ''}"`,
        link_route: '/home',
        is_read: false,
        created_at: new Date().toISOString()
      });
    }

    this.save();
    return newComment;
  }

  addCommentReply(postId: string, commentId: string, userId: string, content: string) {
    const post = this.getPostById(postId);
    if (!post || !post.comments) return;
    const comment = post.comments.find(c => c.id === commentId);
    if (!comment) return;
    const author = this.getUserById(userId);
    if (!author) return;

    if (!comment.replies) comment.replies = [];
    const newReply = {
      id: `reply-${Date.now()}`,
      comment_id: commentId,
      user_id: userId,
      author,
      content,
      created_at: new Date().toISOString(),
      likes_count: 0,
      liked_by_me: false
    };
    comment.replies.push(newReply);
    post.comments_count = (post.comments_count || 0) + 1;
    this.save();
    return newReply;
  }

  deletePost(postId: string, userId: string) {
    this.data.posts = this.data.posts.filter(p => !(p.id === postId && (p.user_id === userId || this.isAdmin(userId))));
    this.save();
  }

  editPost(postId: string, userId: string, newContent: string) {
    const post = this.getPostById(postId);
    if (post && (post.user_id === userId || this.isAdmin(userId))) {
      post.content = newContent;
      post.updated_at = new Date().toISOString();
      this.save();
    }
  }

  // --- Stories ---
  getStories(): Story[] {
    return this.data.stories;
  }

  createStory(story: Story): Story {
    this.data.stories.unshift(story);
    this.save();
    return story;
  }

  markStorySeen(storyId: string) {
    const s = this.data.stories.find(st => st.id === storyId);
    if (s) {
      s.views_count = (s.views_count || 0) + 1;
      s.seen_by_current_user = true;
      this.save();
    }
  }

  reactToStory(storyId: string, userId: string, emoji: string) {
    const s = this.data.stories.find(st => st.id === storyId);
    if (s) {
      if (!s.reactions) s.reactions = [];
      s.reactions.push({ user_id: userId, emoji });
      this.save();
    }
  }

  // --- Reels ---
  getReels(): Reel[] {
    return this.data.reels;
  }

  createReel(reel: Reel): Reel {
    this.data.reels.unshift(reel);
    this.save();
    return reel;
  }

  likeReel(reelId: string) {
    const r = this.data.reels.find(rel => rel.id === reelId);
    if (r) {
      r.liked_by_me = !r.liked_by_me;
      r.likes_count = r.liked_by_me ? r.likes_count + 1 : Math.max(0, r.likes_count - 1);
      this.save();
    }
  }

  // --- Connections ---
  getConnections(userId: string): Connection[] {
    return this.data.connections.filter(c => c.requester_id === userId || c.receiver_id === userId);
  }

  sendConnectionRequest(requesterId: string, receiverId: string): Connection {
    const existing = this.data.connections.find(
      c => (c.requester_id === requesterId && c.receiver_id === receiverId) ||
           (c.requester_id === receiverId && c.receiver_id === requesterId)
    );
    if (existing) return existing;

    const requester = this.getUserById(requesterId)!;
    const receiver = this.getUserById(receiverId)!;
    const newConn: Connection = {
      id: `conn-${Date.now()}`,
      requester_id: requesterId,
      receiver_id: receiverId,
      requester,
      receiver,
      status: 'PENDING',
      created_at: new Date().toISOString()
    };
    this.data.connections.unshift(newConn);

    this.createNotification({
      id: `notif-${Date.now()}`,
      user_id: receiverId,
      actor_id: requesterId,
      actor: requester,
      type: 'CONNECTION_REQUEST',
      title: 'Connection Request',
      message: `${requester.full_name} sent you a connection request.`,
      link_route: '/connections',
      is_read: false,
      created_at: new Date().toISOString()
    });

    this.save();
    return newConn;
  }

  acceptConnection(connectionId: string, userId: string) {
    const conn = this.data.connections.find(c => c.id === connectionId && c.receiver_id === userId);
    if (conn) {
      conn.status = 'ACCEPTED';
      const receiver = this.getUserById(userId);
      if (receiver) {
        this.createNotification({
          id: `notif-${Date.now()}`,
          user_id: conn.requester_id,
          actor_id: userId,
          actor: receiver,
          type: 'CONNECTION_ACCEPTED',
          title: 'Connection Accepted',
          message: `${receiver.full_name} accepted your connection request!`,
          link_route: '/connections',
          is_read: false,
          created_at: new Date().toISOString()
        });
      }
      this.save();
    }
  }

  rejectConnection(connectionId: string, userId: string) {
    const conn = this.data.connections.find(c => c.id === connectionId && c.receiver_id === userId);
    if (conn) {
      conn.status = 'REJECTED';
      this.save();
    }
  }

  removeConnection(connectionId: string) {
    this.data.connections = this.data.connections.filter(c => c.id !== connectionId);
    this.save();
  }

  // --- Notifications ---
  getNotifications(userId: string): AppNotification[] {
    return this.data.notifications.filter(n => n.user_id === userId);
  }

  createNotification(notif: AppNotification) {
    this.data.notifications.unshift(notif);
    this.save();
  }

  markNotificationRead(notifId: string, userId: string) {
    const n = this.data.notifications.find(not => not.id === notifId && not.user_id === userId);
    if (n) {
      n.is_read = true;
      this.save();
    }
  }

  markAllNotificationsRead(userId: string) {
    this.data.notifications.forEach(n => {
      if (n.user_id === userId) n.is_read = true;
    });
    this.save();
  }

  deleteNotification(notifId: string, userId: string) {
    this.data.notifications = this.data.notifications.filter(n => !(n.id === notifId && n.user_id === userId));
    this.save();
  }

  // --- Safety, Reports & Blocks ---
  getReports(): Report[] {
    return this.data.reports;
  }

  createReport(report: Report): Report {
    this.data.reports.unshift(report);
    this.save();
    return report;
  }

  resolveReport(reportId: string, adminId: string, actionTaken: string) {
    const rep = this.data.reports.find(r => r.id === reportId);
    if (rep) {
      rep.status = 'RESOLVED';
      const admin = this.getUserById(adminId);
      this.logAudit({
        id: `audit-${Date.now()}`,
        admin_id: adminId,
        admin_name: admin ? admin.full_name : 'Admin',
        action: 'RESOLVE_REPORT',
        target_type: 'REPORT',
        target_id: reportId,
        details: `Resolved report on ${rep.target_type} ${rep.target_id}. Action: ${actionTaken}`,
        created_at: new Date().toISOString()
      });
      this.save();
    }
  }

  dismissReport(reportId: string, adminId: string) {
    const rep = this.data.reports.find(r => r.id === reportId);
    if (rep) {
      rep.status = 'DISMISSED';
      this.save();
    }
  }

  blockUser(blockerId: string, blockedId: string) {
    if (blockerId === blockedId) return;
    const existing = this.data.blocks.find(b => b.blocker_id === blockerId && b.blocked_id === blockedId);
    if (!existing) {
      this.data.blocks.push({
        id: `blk-${Date.now()}`,
        blocker_id: blockerId,
        blocked_id: blockedId,
        created_at: new Date().toISOString()
      });
      // Remove active match if exists
      this.data.matches = this.data.matches.filter(
        m => !( (m.user1_id === blockerId && m.user2_id === blockedId) || (m.user1_id === blockedId && m.user2_id === blockerId) )
      );
      this.save();
    }
  }

  unblockUser(blockerId: string, blockedId: string) {
    this.data.blocks = this.data.blocks.filter(b => !(b.blocker_id === blockerId && b.blocked_id === blockedId));
    this.save();
  }

  getBlockedUsers(blockerId: string): Profile[] {
    const ids = this.data.blocks.filter(b => b.blocker_id === blockerId).map(b => b.blocked_id);
    return this.data.users.filter(u => ids.includes(u.id));
  }

  getBlockedUserIds(userId: string): string[] {
    return this.data.blocks
      .filter(b => b.blocker_id === userId || b.blocked_id === userId)
      .map(b => (b.blocker_id === userId ? b.blocked_id : b.blocker_id));
  }

  // --- Verifications ---
  getVerificationRequests(): VerificationRequest[] {
    return this.data.verification_requests.map(v => ({
      ...v,
      user: this.getUserById(v.user_id)
    }));
  }

  submitVerificationRequest(userId: string, selfieUrl: string, idDocumentUrl?: string, notes?: string): VerificationRequest {
    const req: VerificationRequest = {
      id: `ver-${Date.now()}`,
      user_id: userId,
      user: this.getUserById(userId),
      selfie_url: selfieUrl,
      id_document_url: idDocumentUrl,
      notes,
      status: 'PENDING',
      submitted_at: new Date().toISOString()
    };
    this.data.verification_requests.unshift(req);
    this.save();
    return req;
  }

  reviewVerificationRequest(requestId: string, adminId: string, status: 'APPROVED' | 'REJECTED', notes?: string) {
    const req = this.data.verification_requests.find(v => v.id === requestId);
    if (req) {
      req.status = status;
      req.reviewed_at = new Date().toISOString();
      req.reviewed_by = adminId;
      if (notes) req.notes = notes;

      const targetUser = this.getUserById(req.user_id);
      if (targetUser) {
        if (status === 'APPROVED') {
          targetUser.is_verified = true;
          this.createNotification({
            id: `notif-${Date.now()}`,
            user_id: targetUser.id,
            actor_id: adminId,
            actor: this.getUserById(adminId) || targetUser,
            type: 'PROFILE_VIEW',
            title: '🎉 Profile Verified!',
            message: 'Your identity and age (18+) have been verified. You now display the blue verified badge!',
            link_route: '/profile',
            is_read: false,
            created_at: new Date().toISOString()
          });
        }
      }

      const admin = this.getUserById(adminId);
      this.logAudit({
        id: `audit-${Date.now()}`,
        admin_id: adminId,
        admin_name: admin ? admin.full_name : 'Admin',
        action: status === 'APPROVED' ? 'APPROVE_VERIFICATION' : 'REJECT_VERIFICATION',
        target_type: 'VERIFICATION',
        target_id: requestId,
        details: `${status === 'APPROVED' ? 'Approved' : 'Rejected'} verification for user ${req.user_id}`,
        created_at: new Date().toISOString()
      });

      this.save();
    }
  }

  // --- Support Tickets ---
  getSupportTickets(userId?: string): SupportTicket[] {
    const list = userId ? this.data.support_tickets.filter(t => t.user_id === userId) : this.data.support_tickets;
    return list.map(t => ({
      ...t,
      user: this.getUserById(t.user_id)
    }));
  }

  createSupportTicket(ticket: SupportTicket): SupportTicket {
    this.data.support_tickets.unshift(ticket);
    this.save();
    return ticket;
  }

  // --- Announcements ---
  getAnnouncements(): Announcement[] {
    return this.data.announcements;
  }

  createAnnouncement(ann: Announcement): Announcement {
    this.data.announcements.unshift(ann);
    // Broadcast notification to all active users
    const admin = this.getUserById(ann.created_by);
    this.data.users.forEach(u => {
      this.createNotification({
        id: `notif-ann-${Date.now()}-${u.id.slice(0, 4)}`,
        user_id: u.id,
        actor_id: ann.created_by,
        actor: admin || u,
        type: 'PROFILE_VIEW',
        title: `📢 ${ann.title}`,
        message: ann.message,
        link_route: '/home',
        is_read: false,
        created_at: new Date().toISOString()
      });
    });
    this.save();
    return ann;
  }

  // --- Audit Logs ---
  getAuditLogs(): AuditLog[] {
    return this.data.audit_logs;
  }

  logAudit(log: AuditLog) {
    this.data.audit_logs.unshift(log);
    this.save();
  }

  // --- Active Sessions ---
  getSessions(userId: string): ActiveSession[] {
    return this.data.active_sessions.filter(s => s.user_id === userId);
  }

  revokeSession(sessionId: string, userId: string) {
    this.data.active_sessions = this.data.active_sessions.filter(s => !(s.id === sessionId && s.user_id === userId));
    this.save();
  }

  private isAdmin(userId: string): boolean {
    const u = this.getUserById(userId);
    return u?.role === 'ADMIN' || u?.role === 'MODERATOR';
  }
}

export const db = new DatabaseEngine();
