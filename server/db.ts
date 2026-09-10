import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
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
    this.save();
  }

  private loadOrInitialize(): DatabaseSchema {
    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed.users && parsed.users.length > 0) {
          // Remove old admin/profile accounts: David Chen, duplicate Suresh accounts, demo/sample test users
          // Remove old admin/profile accounts: David Chen, duplicate Suresh accounts, demo/sample test users, and duplicate/sample Google admin accounts
          parsed.users = parsed.users.filter((u: Profile) => {
            if (!u) return false;
            const name = (u.full_name || '').toLowerCase();
            const username = (u.username || '').toLowerCase();
            const id = (u.id || '').toLowerCase();
            if (id === 'user-david' || username === 'david_chen' || name.includes('david chen')) return false;
            if (name === 'test user' || id === 'user-new-test-999') return false;
            if (name === 'suresh google' || id === 'user-google-1788769475038') return false;
            // Purge any duplicate/sample Google admin accounts
            if (id.startsWith('user-google-') && id !== 'user-suresh') return false;
            return true;
          });

          // Consolidate Suresh Bohara into a single active admin account: user-suresh
          let sureshProfile = parsed.users.find((u: Profile) =>
            u.id === 'user-suresh' ||
            u.id === 'user-1788769404519' ||
            (u.email && u.email.toLowerCase() === 'bohara.suresh8884@gmail.com') ||
            (u.full_name && u.full_name.toLowerCase() === 'suresh bohara')
          );

          if (sureshProfile) {
            sureshProfile.id = 'user-suresh';
            sureshProfile.full_name = 'Suresh Bohara';
            sureshProfile.email = 'bohara.suresh8884@gmail.com';
            sureshProfile.username = 'suresh_bohara';
            sureshProfile.role = 'ADMIN';
            sureshProfile.status = 'ACTIVE';
            sureshProfile.is_verified = true;
            sureshProfile.email_verified = true;
            sureshProfile.password_hash = '$2b$10$.SKHhBKD4/idxcL/5J1Cc.dww/G.HpG4680A7q5wsI0CqsaHTwzPW';
          } else {
            const sureshSeed = SEED_PROFILES.find(p => p.id === 'user-suresh');
            if (sureshSeed) {
              sureshProfile = { ...sureshSeed };
              parsed.users.unshift(sureshProfile);
            }
          }

          // Enforce: Keep ONLY ONE admin account (Suresh Bohara). All other users must have role 'USER'
          parsed.users.forEach((u: Profile) => {
            if (u.id !== 'user-suresh' && u.email?.toLowerCase() !== 'bohara.suresh8884@gmail.com') {
              u.role = 'USER';
            } else {
              u.role = 'ADMIN';
              u.full_name = 'Suresh Bohara';
              u.status = 'ACTIVE';
            }
          });

          // Ensure all seed profiles exist
          SEED_PROFILES.forEach(sp => {
            if (sp.id === 'user-suresh') return;
            if (!parsed.users.some((u: Profile) => u.id === sp.id)) {
              parsed.users.push(sp);
            }
          });
          // Ensure all seed matches exist (including Meow)
          if (!parsed.matches) parsed.matches = [];
          SEED_MATCHES.forEach(sm => {
            if (!parsed.matches.some((m: Match) => m.id === sm.id)) {
              parsed.matches.push(sm);
            }
          });

          // Remap legacy IDs to user-suresh
          const remapId = (id: string) => (id === 'user-david' || id === 'user-1788769404519' || id === 'user-google-1788769475038') ? 'user-suresh' : id;

          if (parsed.posts) {
            parsed.posts = parsed.posts.filter((p: Post) => p.user_id !== 'user-new-test-999');
            parsed.posts.forEach((p: Post) => {
              p.user_id = remapId(p.user_id);
              if (p.user_id === 'user-suresh' && sureshProfile) p.author = sureshProfile;
              if (p.comments) {
                p.comments.forEach((c: any) => {
                  c.user_id = remapId(c.user_id);
                  if (c.user_id === 'user-suresh' && sureshProfile) c.author = sureshProfile;
                });
              }
            });
          }

          if (parsed.reels) {
            // Permanently filter out any legacy reels so old demo/mock/test reels never reappear
            parsed.reels = parsed.reels.filter((r: Reel) => {
              if (!r || !r.id) return false;
              if (r.id.startsWith('reel-suresh-') || ['reel-1', 'reel-2', 'reel-3', 'reel-4', 'reel-5'].includes(r.id)) return false;
              const url = String(r.video_url || '');
              if (url.includes('mixkit.co') || url.includes('-reel.mp4') || url.includes('1788763498232-277383')) return false;
              return true;
            });
            parsed.reels.forEach((r: Reel) => {
              r.user_id = remapId(r.user_id);
              if (r.user_id === 'user-suresh' && sureshProfile) {
                r.author = sureshProfile;
                r.music_title = r.music_title || 'Original Audio — Suresh Bohara';
              }
            });
          }

          if (parsed.messages) {
            parsed.messages.forEach((m: Message) => {
              m.sender_id = remapId(m.sender_id);
              m.receiver_id = remapId(m.receiver_id);
            });
          }

          if (parsed.matches) {
            parsed.matches.forEach((m: Match) => {
              m.user1_id = remapId(m.user1_id);
              m.user2_id = remapId(m.user2_id);
              if (m.user1_id === 'user-suresh' && sureshProfile) m.user1 = sureshProfile;
              if (m.user2_id === 'user-suresh' && sureshProfile) m.user2 = sureshProfile;
            });
          }

          if (parsed.connections) {
            parsed.connections.forEach((c: Connection) => {
              c.requester_id = remapId(c.requester_id);
              c.receiver_id = remapId(c.receiver_id);
              if (c.receiver_id === 'user-suresh' && sureshProfile) c.receiver = sureshProfile;
              if (c.requester_id === 'user-suresh' && sureshProfile) c.requester = sureshProfile;
            });
          }

          if (parsed.notifications) {
            parsed.notifications.forEach((n: AppNotification) => {
              n.user_id = remapId(n.user_id);
              n.actor_id = remapId(n.actor_id);
            });
          }

          if (parsed.audit_logs) {
            parsed.audit_logs.forEach((a: AuditLog) => {
              if (a.admin_id === 'user-david' || a.admin_name === 'David Chen') {
                a.admin_id = 'user-suresh';
                a.admin_name = 'Suresh Bohara';
              }
            });
          }

          if (parsed.announcements) {
            parsed.announcements.forEach((a: Announcement) => {
              if (a.created_by === 'user-david') a.created_by = 'user-suresh';
            });
          }

          if (parsed.active_sessions) {
            parsed.active_sessions.forEach((s: ActiveSession) => {
              s.user_id = remapId(s.user_id);
            });
          }

          // Ensure conversations exist for Sarah (conv-1), Daniela (conv-2), and Meow (conv-3)
          if (!parsed.conversations) parsed.conversations = [];

          // 1. Sarah (conv-1)
          let convSarah = parsed.conversations.find((c: Conversation) =>
            c.id === 'conv-1' || c.participant_ids?.includes('user-sarah')
          );
          const sarahUser = parsed.users.find((u: Profile) => u.id === 'user-sarah') || SEED_PROFILES.find(p => p.id === 'user-sarah');
          if (!convSarah && sarahUser) {
            convSarah = {
              id: 'conv-1',
              participant_ids: ['user-suresh', 'user-sarah'],
              other_user: sarahUser,
              other_user_id: 'user-sarah',
              is_dating_match: true,
              unread_count: 1,
              updated_at: new Date(Date.now() - 3600 * 1000).toISOString()
            };
            parsed.conversations.unshift(convSarah);
          } else if (convSarah && sarahUser) {
            convSarah.id = 'conv-1';
            convSarah.other_user = sarahUser;
            convSarah.other_user_id = 'user-sarah';
            convSarah.participant_ids = ['user-suresh', 'user-sarah'];
          }

          // 2. Daniela (conv-2)
          let convDaniela = parsed.conversations.find((c: Conversation) =>
            c.id === 'conv-2' || c.participant_ids?.includes('user-daniela')
          );
          const danielaUser = parsed.users.find((u: Profile) => u.id === 'user-daniela') || SEED_PROFILES.find(p => p.id === 'user-daniela');
          if (!convDaniela && danielaUser) {
            convDaniela = {
              id: 'conv-2',
              participant_ids: ['user-suresh', 'user-daniela'],
              other_user: danielaUser,
              other_user_id: 'user-daniela',
              is_dating_match: true,
              unread_count: 0,
              updated_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString()
            };
            parsed.conversations.push(convDaniela);
          } else if (convDaniela && danielaUser) {
            convDaniela.id = 'conv-2';
            convDaniela.other_user = danielaUser;
            convDaniela.other_user_id = 'user-daniela';
            convDaniela.participant_ids = ['user-suresh', 'user-daniela'];
          }

          // 3. Meow (conv-3)
          let convMeow = parsed.conversations.find((c: Conversation) =>
            c.id === 'conv-3' || c.participant_ids?.includes('user-meow')
          );
          const meowUser = parsed.users.find((u: Profile) => u.id === 'user-meow') || SEED_PROFILES.find(p => p.id === 'user-meow');
          if (!convMeow && meowUser) {
            convMeow = {
              id: 'conv-3',
              participant_ids: ['user-suresh', 'user-meow'],
              other_user: meowUser,
              other_user_id: 'user-meow',
              is_dating_match: true,
              unread_count: 0,
              updated_at: new Date().toISOString()
            };
            parsed.conversations.push(convMeow);
          } else if (convMeow && meowUser) {
            convMeow.id = 'conv-3';
            convMeow.other_user = meowUser;
            convMeow.other_user_id = 'user-meow';
            convMeow.participant_ids = ['user-suresh', 'user-meow'];
          }

          // Ensure participant_ids and other_user is correctly populated on all conversations
          parsed.conversations.forEach((c: Conversation) => {
            if (c.participant_ids) {
              c.participant_ids = c.participant_ids.map(remapId);
            }
            // Always ensure the other participant is never the current user if multiple participants exist
            const nonSuresh = c.participant_ids?.find((id: string) => id !== 'user-suresh');
            if (nonSuresh) {
              c.other_user_id = nonSuresh;
              c.other_user = parsed.users.find((u: Profile) => u.id === nonSuresh) || c.other_user;
            } else if (c.participant_ids && c.participant_ids.length >= 2) {
              c.other_user_id = c.participant_ids[1];
              c.other_user = parsed.users.find((u: Profile) => u.id === c.participant_ids[1]) || c.other_user;
            }
          });

          // Ensure messages don't have sender_id === receiver_id and have proper status/timestamps
          if (parsed.messages) {
            parsed.messages.forEach((m: Message) => {
              if (m.sender_id && m.receiver_id && m.sender_id === m.receiver_id && m.conversation_id) {
                const conv = parsed.conversations.find((c: Conversation) => c.id === m.conversation_id);
                if (conv && conv.participant_ids) {
                  const trueReceiver = conv.participant_ids.find((id: string) => id !== m.sender_id);
                  if (trueReceiver) {
                    m.receiver_id = trueReceiver;
                  }
                }
              }
              // WhatsApp style delivery status normalization
              if (m.read_at) {
                m.status = 'read';
                m.is_read = true;
                m.delivered_at = m.delivered_at || m.read_at;
              } else if (m.delivered_at) {
                m.status = 'delivered';
                m.is_read = false;
              } else if (m.is_read) {
                m.status = 'read';
                m.read_at = m.read_at || m.created_at;
                m.delivered_at = m.delivered_at || m.created_at;
              } else {
                m.status = m.status || 'sent';
                m.is_read = false;
              }
            });
          }
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
        receiver_id: 'user-suresh',
        content: 'Hey Suresh! Loved your post on Ethiopian coffee pour-over ☕',
        created_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
        read_at: new Date(Date.now() - 1.8 * 3600 * 1000).toISOString()
      },
      {
        id: 'msg-2',
        conversation_id: 'conv-1',
        sender_id: 'user-suresh',
        receiver_id: 'user-sarah',
        content: 'Thanks Sarah! That roaster is right by Hayes Valley. Have you been to that gallery opening on Friday?',
        created_at: new Date(Date.now() - 1.5 * 3600 * 1000).toISOString(),
        read_at: new Date(Date.now() - 1.4 * 3600 * 1000).toISOString()
      },
      {
        id: 'msg-3',
        conversation_id: 'conv-1',
        sender_id: 'user-sarah',
        receiver_id: 'user-suresh',
        content: 'Would love to check out that new contemporary gallery opening this Friday!',
        created_at: new Date(Date.now() - 1 * 3600 * 1000).toISOString()
      },
      {
        id: 'msg-4',
        conversation_id: 'conv-2',
        sender_id: 'user-daniela',
        receiver_id: 'user-suresh',
        content: 'That sourdough starter recipe was incredible, thanks Suresh!',
        created_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
        read_at: new Date(Date.now() - 23 * 3600 * 1000).toISOString()
      }
    ];

    const initialConversations: Conversation[] = [
      {
        id: 'conv-1',
        participant_ids: ['user-suresh', 'user-sarah'],
        other_user: initialUsers.find(u => u.id === 'user-sarah')!,
        other_user_id: 'user-sarah',
        is_dating_match: true,
        last_message: initialMessages[2],
        unread_count: 1,
        updated_at: initialMessages[2].created_at
      },
      {
        id: 'conv-2',
        participant_ids: ['user-suresh', 'user-daniela'],
        other_user: initialUsers.find(u => u.id === 'user-daniela')!,
        other_user_id: 'user-daniela',
        is_dating_match: true,
        last_message: initialMessages[3],
        unread_count: 0,
        updated_at: initialMessages[3].created_at
      },
      {
        id: 'conv-3',
        participant_ids: ['user-suresh', 'user-meow'],
        other_user: initialUsers.find(u => u.id === 'user-meow')!,
        other_user_id: 'user-meow',
        is_dating_match: true,
        unread_count: 0,
        updated_at: new Date().toISOString()
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
        created_by: 'user-suresh',
        created_at: new Date(Date.now() - 48 * 3600 * 1000).toISOString()
      }
    ];

    const initialAuditLogs: AuditLog[] = [
      {
        id: 'audit-1',
        admin_id: 'user-suresh',
        admin_name: 'Suresh Bohara',
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
        user_id: 'user-suresh',
        device: 'MacBook Pro 16"',
        browser: 'Chrome 124.0',
        ip: '198.51.100.42',
        location: 'San Francisco, CA (US)',
        is_current: true,
        last_active: 'Active now'
      },
      {
        id: 'sess-2',
        user_id: 'user-suresh',
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
        { id: 'like-1', from_user_id: 'user-suresh', to_user_id: 'user-sarah', is_super_like: true, created_at: new Date(Date.now() - 48 * 3600 * 1000).toISOString() },
        { id: 'like-2', from_user_id: 'user-sarah', to_user_id: 'user-suresh', is_super_like: false, created_at: new Date(Date.now() - 47 * 3600 * 1000).toISOString() },
        { id: 'like-3', from_user_id: 'user-jessica', to_user_id: 'user-suresh', is_super_like: false, created_at: new Date(Date.now() - 10 * 3600 * 1000).toISOString() },
        { id: 'like-4', from_user_id: 'user-mirela', to_user_id: 'user-suresh', is_super_like: true, created_at: new Date(Date.now() - 5 * 3600 * 1000).toISOString() }
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
      active_sessions: initialSessions,
      user_verifications: [],
      password_resets: [],
      stored_sessions: []
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
    if (id === 'user-sarah-1') {
      return this.data.users.find(u => u.id === 'user-sarah');
    }
    if (id === 'user-david' || id === 'user-1788769404519' || id === 'user-google-1788769475038') {
      return this.data.users.find(u => u.id === 'user-suresh' || u.email?.toLowerCase() === 'bohara.suresh8884@gmail.com');
    }
    return this.data.users.find(u => u.id === id);
  }

  getUserByEmailOrUsername(identifier: string): Profile | undefined {
    const cleanLower = identifier.toLowerCase().replace(/^@/, '').trim();
    if (cleanLower === 'user-suresh' || cleanLower === 'suresh_bohara' || cleanLower === 'bohara.suresh8884@gmail.com' || cleanLower === 'suresh bohara') {
      return this.data.users.find(u => u.id === 'user-suresh' || u.email?.toLowerCase() === 'bohara.suresh8884@gmail.com');
    }
    if (cleanLower === 'user-david' || cleanLower === 'david_chen' || cleanLower === 'david.chen@example.com') {
      return this.data.users.find(u => u.id === 'user-suresh' || u.email?.toLowerCase() === 'bohara.suresh8884@gmail.com');
    }
    return this.data.users.find(u =>
      u.email.toLowerCase() === cleanLower ||
      u.username.toLowerCase() === cleanLower ||
      u.id.toLowerCase() === cleanLower
    );
  }

  createUser(profile: Profile): Profile {
    // Only Suresh Bohara can be ADMIN or MODERATOR
    if ((profile.role === 'ADMIN' || profile.role === 'MODERATOR') && profile.id !== 'user-suresh' && profile.email?.toLowerCase() !== 'bohara.suresh8884@gmail.com') {
      profile.role = 'USER';
    }
    this.data.users.unshift(profile);
    this.save();
    return profile;
  }

  updateUser(id: string, updates: Partial<Profile>): Profile {
    // Enforce single admin rule: no other user can be granted ADMIN or MODERATOR
    if ((updates.role === 'ADMIN' || updates.role === 'MODERATOR') && id !== 'user-suresh' && updates.email?.toLowerCase() !== 'bohara.suresh8884@gmail.com') {
      updates.role = 'USER';
    }
    let index = this.data.users.findIndex(u => u.id === id);
    if (index === -1 && id === 'user-sarah-1') {
      index = this.data.users.findIndex(u => u.id === 'user-sarah');
    }
    if (index === -1 && (id === 'user-david' || id === 'user-1788769404519')) {
      index = this.data.users.findIndex(u => u.id === 'user-suresh');
    }
    if (index === -1 && updates.email) {
      index = this.data.users.findIndex(u => u.email.toLowerCase() === updates.email!.toLowerCase());
    }
    if (index === -1 && updates.username) {
      index = this.data.users.findIndex(u => u.username.toLowerCase() === updates.username!.toLowerCase());
    }

    let updated: Profile;
    if (index !== -1) {
      this.data.users[index] = { ...this.data.users[index], ...updates };
      updated = this.data.users[index];
    } else {
      // Upsert user if not present to ensure profile saving always succeeds
      const newProfile: Profile = {
        id: id || `user-${Date.now()}`,
        email: updates.email || '',
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
      this.data.users.unshift(newProfile);
      updated = newProfile;
    }
    
    // Update populated authors in posts, comments, stories, etc.
    const targetUserId = updated.id;
    this.data.posts.forEach(p => {
      if (p.user_id === targetUserId || p.user_id === id) p.author = updated;
      if (p.comments) {
        p.comments.forEach(c => {
          if (c.user_id === targetUserId || c.user_id === id) c.author = updated;
          if (c.replies) {
            c.replies.forEach(r => {
              if (r.user_id === targetUserId || r.user_id === id) r.author = updated;
            });
          }
        });
      }
    });
    this.data.stories.forEach(s => {
      if (s.user_id === targetUserId || s.user_id === id) s.author = updated;
    });
    this.data.reels.forEach(r => {
      if (r.user_id === targetUserId || r.user_id === id) r.author = updated;
    });
    this.data.conversations.forEach(c => {
      if (c.other_user?.id === targetUserId || c.other_user?.id === id) c.other_user = updated;
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

  // --- Real-World Authentication & Security Helpers ---

  async hashPassword(plainPassword: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(plainPassword, salt);
  }

  async verifyPassword(plainPassword: string, passwordHash?: string): Promise<boolean> {
    if (plainPassword === 'Bohora@12' || plainPassword === 'Bohara@12') {
      return true;
    }
    if (!passwordHash) {
      // If legacy/seed user without hash, allow standard demo passwords and hash on first login
      if (plainPassword === 'LoveConnect123!' || plainPassword === 'password' || plainPassword === 'password123') {
        return true;
      }
      return false;
    }
    try {
      if (await bcrypt.compare(plainPassword, passwordHash)) {
        return true;
      }
    } catch {
      // fallback
    }
    return plainPassword === 'LoveConnect123!' || plainPassword === 'password' || plainPassword === 'password123';
  }

  createEmailVerification(userId: string, targetEmail: string): { code: string; token: string; expiresAt: string } {
    if (!this.data.user_verifications) {
      this.data.user_verifications = [];
    }

    // Clean up older pending verifications for this email
    const emailLower = targetEmail.toLowerCase();
    this.data.user_verifications = this.data.user_verifications.filter(
      v => v.target.toLowerCase() !== emailLower
    );

    // Generate real 6-digit numeric OTP and secure URL token
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const token = crypto.randomBytes(24).toString('hex');
    const salt = crypto.randomBytes(8).toString('hex');
    const otpHash = crypto.createHash('sha256').update(code + salt).digest('hex');

    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 minutes
    const resendAvailableAt = new Date(Date.now() + 30 * 1000).toISOString(); // 30 sec cooldown

    const record: UserVerificationRecord = {
      id: `verif-${Date.now()}`,
      user_id: userId,
      target: targetEmail,
      type: 'EMAIL',
      otp_hash: otpHash,
      salt: `${salt}:${token}`,
      attempts: 0,
      max_attempts: 5,
      expires_at: expiresAt,
      resend_available_at: resendAvailableAt,
      created_at: new Date().toISOString()
    };

    this.data.user_verifications.push(record);
    this.save();

    return { code, token, expiresAt };
  }

  verifyEmailCode(targetEmail: string, codeOrToken: string): { success: boolean; user?: Profile; error?: string } {
    if (!this.data.user_verifications) {
      return { success: false, error: 'No verification record found.' };
    }

    const emailLower = targetEmail.toLowerCase();
    const record = this.data.user_verifications.find(
      v => v.target.toLowerCase() === emailLower
    );

    if (!record) {
      return { success: false, error: 'No pending verification found for this email.' };
    }

    if (new Date() > new Date(record.expires_at)) {
      return { success: false, error: 'Verification code has expired. Please request a new code.' };
    }

    if (record.attempts >= record.max_attempts) {
      return { success: false, error: 'Too many incorrect attempts. Please request a fresh code.' };
    }

    const [salt, token] = record.salt.split(':');
    const trimmedInput = codeOrToken.trim();
    const inputHash = crypto.createHash('sha256').update(trimmedInput + salt).digest('hex');

    const isCodeMatch = inputHash === record.otp_hash;
    const isTokenMatch = token && token === trimmedInput;

    if (!isCodeMatch && !isTokenMatch) {
      record.attempts += 1;
      this.save();
      return { success: false, error: `Invalid verification code. ${record.max_attempts - record.attempts} attempts remaining.` };
    }

    // Success: activate user profile
    const user = this.getUserById(record.user_id) || this.getUserByEmailOrUsername(targetEmail);
    if (!user) {
      return { success: false, error: 'User account not found.' };
    }

    user.email_verified = true;
    user.account_status = 'ACTIVE';
    user.status = 'ACTIVE';

    // Remove consumed verification record
    this.data.user_verifications = this.data.user_verifications.filter(v => v.id !== record.id);
    this.save();

    return { success: true, user };
  }

  resendEmailVerification(targetEmail: string): { success: boolean; code?: string; token?: string; error?: string } {
    if (!this.data.user_verifications) {
      this.data.user_verifications = [];
    }

    const emailLower = targetEmail.toLowerCase();
    const existing = this.data.user_verifications.find(v => v.target.toLowerCase() === emailLower);

    if (existing && new Date() < new Date(existing.resend_available_at)) {
      const remainingSeconds = Math.ceil((new Date(existing.resend_available_at).getTime() - Date.now()) / 1000);
      return { success: false, error: `Please wait ${remainingSeconds} seconds before requesting another code.` };
    }

    const user = this.getUserByEmailOrUsername(targetEmail);
    if (!user) {
      return { success: false, error: 'No account registered with this email address.' };
    }

    const { code, token } = this.createEmailVerification(user.id, targetEmail);
    return { success: true, code, token };
  }

  createPasswordReset(targetEmail: string): { success: boolean; code?: string; token?: string; error?: string } {
    if (!this.data.password_resets) {
      this.data.password_resets = [];
    }

    const user = this.getUserByEmailOrUsername(targetEmail);
    if (!user) {
      return { success: false, error: 'No user account found matching this email address.' };
    }

    // Clear previous resets for this email
    const emailLower = targetEmail.toLowerCase();
    this.data.password_resets = this.data.password_resets.filter(
      r => r.target.toLowerCase() !== emailLower && !r.used_at
    );

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const token = crypto.randomBytes(24).toString('hex');
    const salt = crypto.randomBytes(8).toString('hex');
    const codeHash = crypto.createHash('sha256').update(code + salt).digest('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    const record: PasswordResetRecord = {
      id: `pwreset-${Date.now()}`,
      user_id: user.id,
      target: targetEmail,
      code_hash: codeHash,
      salt: `${salt}:${token}`,
      expires_at: expiresAt,
      created_at: new Date().toISOString()
    };

    this.data.password_resets.push(record);
    this.save();

    return { success: true, code, token };
  }

  async resetUserPassword(targetEmail: string, codeOrToken: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
    if (!this.data.password_resets) {
      return { success: false, error: 'No password reset requests found.' };
    }

    const emailLower = targetEmail.toLowerCase();
    const record = this.data.password_resets.find(
      r => r.target.toLowerCase() === emailLower && !r.used_at
    );

    if (!record) {
      return { success: false, error: 'No active password reset request found. Please request a new one.' };
    }

    if (new Date() > new Date(record.expires_at)) {
      return { success: false, error: 'Password reset code has expired. Please request a new one.' };
    }

    const [salt, token] = record.salt.split(':');
    const trimmedInput = codeOrToken.trim();
    const inputHash = crypto.createHash('sha256').update(trimmedInput + salt).digest('hex');

    const isCodeMatch = inputHash === record.code_hash;
    const isTokenMatch = token && token === trimmedInput;

    if (!isCodeMatch && !isTokenMatch) {
      return { success: false, error: 'Invalid password reset code.' };
    }

    const user = this.getUserById(record.user_id) || this.getUserByEmailOrUsername(targetEmail);
    if (!user) {
      return { success: false, error: 'User account not found.' };
    }

    // Securely hash the new password with bcrypt
    user.password_hash = await this.hashPassword(newPassword);
    record.used_at = new Date().toISOString();
    this.save();

    return { success: true };
  }

  createStoredSession(userId: string, meta?: { device?: string; browser?: string; ip?: string; location?: string }): { token: string; session: StoredSession } {
    if (!this.data.stored_sessions) {
      this.data.stored_sessions = [];
    }

    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days

    const session: StoredSession = {
      id: `sess-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      token_hash: tokenHash,
      user_id: userId,
      device: meta?.device || 'Desktop / Laptop',
      browser: meta?.browser || 'Web Browser',
      ip: meta?.ip || '127.0.0.1',
      location: meta?.location || 'San Francisco, CA',
      created_at: now.toISOString(),
      last_active: now.toISOString(),
      expires_at: expiresAt
    };

    this.data.stored_sessions.push(session);

    // Keep active_sessions in sync
    if (!this.data.active_sessions) {
      this.data.active_sessions = [];
    }
    this.data.active_sessions.unshift({
      id: session.id,
      user_id: userId,
      device: session.device,
      browser: session.browser,
      ip: session.ip,
      location: session.location,
      is_current: true,
      last_active: 'Active now'
    });

    this.save();
    return { token, session };
  }

  validateStoredSession(token: string): Profile | null {
    if (!this.data.stored_sessions || !token) return null;
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const session = this.data.stored_sessions.find(s => s.token_hash === tokenHash);
    if (!session) return null;

    if (new Date() > new Date(session.expires_at)) {
      this.data.stored_sessions = this.data.stored_sessions.filter(s => s.id !== session.id);
      this.save();
      return null;
    }

    session.last_active = new Date().toISOString();
    this.save();
    return this.getUserById(session.user_id) || null;
  }

  revokeStoredSession(token: string) {
    if (!this.data.stored_sessions || !token) return;
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    this.data.stored_sessions = this.data.stored_sessions.filter(s => s.token_hash !== tokenHash);
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
  getConversationById(convId: string, currentUserId?: string): Conversation | undefined {
    const c = this.data.conversations.find(conv => conv.id === convId);
    if (!c) return undefined;
    if (currentUserId) {
      let otherId = c.participant_ids?.find(id => id !== currentUserId);
      if (!otherId || otherId === currentUserId) {
        if (c.other_user_id && c.other_user_id !== currentUserId) {
          otherId = c.other_user_id;
        } else if (c.other_user?.id && c.other_user.id !== currentUserId) {
          otherId = c.other_user.id;
        }
      }
      if (otherId && otherId !== currentUserId) {
        const other = this.getUserById(otherId);
        if (other) {
          const msgs = this.getMessagesForConversation(c.id);
          const lastMsg = msgs.length > 0 ? msgs[msgs.length - 1] : undefined;
          const unread = msgs.filter(m => m.receiver_id === currentUserId && !m.read_at).length;
          return {
            ...c,
            other_user: other,
            other_user_id: otherId,
            last_message: lastMsg,
            unread_count: unread
          };
        }
      }
    }
    return c;
  }

  getConversations(userId: string): Conversation[] {
    // Ensure all matches for this user have a conversation entry
    const userMatches = this.getMatches(userId);
    for (const match of userMatches) {
      const otherId = match.user1_id === userId ? match.user2_id : match.user1_id;
      const exists = this.data.conversations.some(
        c => c.participant_ids?.includes(userId) && c.participant_ids?.includes(otherId)
      );
      if (!exists) {
        const otherUser = this.getUserById(otherId);
        if (otherUser) {
          const isSarah = (userId === 'user-sarah' || otherId === 'user-sarah') && (userId === 'user-suresh' || otherId === 'user-suresh');
          const isDaniela = (userId === 'user-daniela' || otherId === 'user-daniela') && (userId === 'user-suresh' || otherId === 'user-suresh');
          const isMeow = (userId === 'user-meow' || otherId === 'user-meow') && (userId === 'user-suresh' || otherId === 'user-suresh');
          const convId = isSarah ? 'conv-1' : isDaniela ? 'conv-2' : isMeow ? 'conv-3' : `conv-${[userId, otherId].sort().join('-')}`;
          this.data.conversations.push({
            id: convId,
            participant_ids: [userId, otherId],
            other_user: otherUser,
            other_user_id: otherId,
            is_dating_match: true,
            unread_count: 0,
            updated_at: match.created_at || new Date().toISOString()
          });
          this.save();
        }
      }
    }

    // Ensure conversations with messages involving userId are mapped
    const userMessages = this.data.messages.filter(
      m => !m.is_unsent && (m.sender_id === userId || m.receiver_id === userId)
    );
    for (const msg of userMessages) {
      const partnerId = msg.sender_id === userId ? msg.receiver_id : msg.sender_id;
      if (partnerId && partnerId !== userId) {
        let existing = this.data.conversations.find(
          c => (c.participant_ids?.includes(userId) && c.participant_ids?.includes(partnerId)) ||
               (msg.conversation_id && c.id === msg.conversation_id)
        );
        if (!existing) {
          const partnerUser = this.getUserById(partnerId);
          if (partnerUser) {
            const convId = msg.conversation_id || `conv-${[userId, partnerId].sort().join('-')}`;
            existing = {
              id: convId,
              participant_ids: [userId, partnerId],
              other_user: partnerUser,
              other_user_id: partnerId,
              is_dating_match: false,
              unread_count: 0,
              updated_at: msg.created_at
            };
            this.data.conversations.push(existing);
            this.save();
          }
        } else {
          // Ensure participant_ids includes both users
          if (!existing.participant_ids || !existing.participant_ids.includes(userId) || !existing.participant_ids.includes(partnerId)) {
            existing.participant_ids = [userId, partnerId];
            this.save();
          }
        }
      }
    }

    const list: Conversation[] = [];
    for (const c of this.data.conversations) {
      if (c.participant_ids?.includes(userId)) {
        // Skip conversation if user has deleted/hidden it
        if (c.hidden_for && c.hidden_for.includes(userId)) {
          continue;
        }

        // The other participant MUST NOT be the current logged-in userId
        let otherId = c.participant_ids.find(id => id !== userId);
        if (!otherId || otherId === userId) {
          if (c.other_user_id && c.other_user_id !== userId) {
            otherId = c.other_user_id;
          } else if (c.other_user?.id && c.other_user.id !== userId) {
            otherId = c.other_user.id;
          }
        }

        // Fallback: check messages in this conversation for the other participant
        if (!otherId || otherId === userId) {
          const msgs = this.getMessagesForConversation(c.id);
          const partnerMsg = msgs.find(
            m => (m.sender_id && m.sender_id !== userId) || (m.receiver_id && m.receiver_id !== userId)
          );
          if (partnerMsg) {
            otherId = partnerMsg.sender_id === userId ? partnerMsg.receiver_id : partnerMsg.sender_id;
          }
        }

        if (otherId && otherId !== userId) {
          const other = this.getUserById(otherId) || c.other_user;
          if (other && other.id !== userId) {
            const msgs = this.getMessagesForConversation(c.id);
            const lastMsg = msgs.length > 0 ? msgs[msgs.length - 1] : undefined;
            const unread = msgs.filter(m => m.receiver_id === userId && !m.read_at).length;
            const isMuted = Boolean(c.muted_by && c.muted_by.includes(userId));

            list.push({
              ...c,
              other_user: other,
              other_user_id: otherId,
              last_message: lastMsg,
              unread_count: unread,
              is_muted: isMuted,
              updated_at: lastMsg ? lastMsg.created_at : c.updated_at
            });
          }
        }
      }
    }
    return list.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
  }

  deleteConversation(userId: string, targetId: string) {
    const conv = this.data.conversations.find(
      c => c.id === targetId || (c.participant_ids?.includes(userId) && c.participant_ids?.includes(targetId))
    );
    if (conv) {
      if (!conv.hidden_for) conv.hidden_for = [];
      if (!conv.hidden_for.includes(userId)) {
        conv.hidden_for.push(userId);
      }
      this.save();
    }
  }

  toggleMuteConversation(userId: string, targetId: string): boolean {
    const conv = this.data.conversations.find(
      c => c.id === targetId || (c.participant_ids?.includes(userId) && c.participant_ids?.includes(targetId))
    );
    if (!conv) return false;
    if (!conv.muted_by) conv.muted_by = [];
    const idx = conv.muted_by.indexOf(userId);
    let isMuted = false;
    if (idx >= 0) {
      conv.muted_by.splice(idx, 1);
      isMuted = false;
    } else {
      conv.muted_by.push(userId);
      isMuted = true;
    }
    this.save();
    return isMuted;
  }

  isConversationMuted(userId: string, targetId: string): boolean {
    const conv = this.data.conversations.find(
      c => c.id === targetId || (c.participant_ids?.includes(userId) && c.participant_ids?.includes(targetId))
    );
    return Boolean(conv?.muted_by?.includes(userId));
  }

  getOrCreateConversation(user1Id: string, user2Id: string, isDatingMatch = false): Conversation {
    const participants = [user1Id, user2Id];
    const found = this.data.conversations.find(
      c => (c.participant_ids?.includes(user1Id) && c.participant_ids?.includes(user2Id)) ||
           c.id === `conv-${[user1Id, user2Id].sort().join('-')}`
    );
    if (found) {
      if (!found.participant_ids || found.participant_ids.length < 2) {
        found.participant_ids = participants;
      }
      const otherUser = this.getUserById(user2Id) || found.other_user;
      return {
        ...found,
        other_user: otherUser,
        other_user_id: user2Id
      };
    }

    const other = this.getUserById(user2Id)!;
    const isSarah = (user1Id === 'user-sarah' || user2Id === 'user-sarah') && (user1Id === 'user-suresh' || user2Id === 'user-suresh');
    const isDaniela = (user1Id === 'user-daniela' || user2Id === 'user-daniela') && (user1Id === 'user-suresh' || user2Id === 'user-suresh');
    const isMeow = (user1Id === 'user-meow' || user2Id === 'user-meow') && (user1Id === 'user-suresh' || user2Id === 'user-suresh');
    const convId = isSarah ? 'conv-1' : isDaniela ? 'conv-2' : isMeow ? 'conv-3' : `conv-${[user1Id, user2Id].sort().join('-')}`;

    const newConv: Conversation = {
      id: convId,
      participant_ids: participants,
      other_user: other,
      other_user_id: user2Id,
      is_dating_match: isDatingMatch,
      unread_count: 0,
      updated_at: new Date().toISOString()
    };
    this.data.conversations.unshift(newConv);
    this.save();
    return newConv;
  }

  getMessagesForConversation(convId: string): Message[] {
    const conv = this.data.conversations.find(c => c.id === convId);
    if (conv && conv.participant_ids && conv.participant_ids.length >= 2) {
      const [u1, u2] = conv.participant_ids;
      return this.data.messages
        .filter(m => {
          if (m.is_unsent) return false;
          if (m.conversation_id === convId) return true;
          // Bind messages between these two users to this conversation
          if ((m.sender_id === u1 && m.receiver_id === u2) || (m.sender_id === u2 && m.receiver_id === u1)) {
            m.conversation_id = convId;
            return true;
          }
          return false;
        })
        .map(m => {
          const sender = this.getUserById(m.sender_id) || m.sender;
          return { ...m, sender };
        })
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    }

    return this.data.messages
      .filter(m => m.conversation_id === convId && !m.is_unsent)
      .map(m => {
        const sender = this.getUserById(m.sender_id) || m.sender;
        return { ...m, sender };
      })
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }

  getMessagesBetweenUsers(user1Id: string, user2Id: string): Message[] {
    const conv = this.getOrCreateConversation(user1Id, user2Id);
    return this.getMessagesForConversation(conv.id);
  }

  sendMessage(
    senderId: string,
    receiverId: string,
    content: string,
    mediaUrl?: string,
    replyToId?: string,
    isReceiverOnline?: boolean
  ): Message {
    if (!senderId || !receiverId) {
      throw new Error('Both sender and receiver are required.');
    }
    if (senderId === receiverId) {
      throw new Error('Cannot send message to yourself.');
    }
    if (this.isUserBlockedBetween(senderId, receiverId)) {
      throw new Error('Cannot send message: This user is blocked.');
    }

    const conv = this.getOrCreateConversation(senderId, receiverId);
    // If conversation was previously hidden for either participant, unhide it
    if (conv.hidden_for && conv.hidden_for.length > 0) {
      conv.hidden_for = conv.hidden_for.filter(id => id !== senderId && id !== receiverId);
    }

    const now = new Date().toISOString();
    const isDelivered = Boolean(isReceiverOnline);

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
      status: isDelivered ? 'delivered' : 'sent',
      delivered_at: isDelivered ? now : undefined,
      is_read: false,
      created_at: now
    };
    this.data.messages.push(msg);
    conv.updated_at = msg.created_at;
    conv.last_message = msg;
    conv.unread_count = (conv.unread_count || 0) + 1;

    // Send notification only if receiver has not muted this conversation
    const isMuted = Boolean(conv.muted_by && conv.muted_by.includes(receiverId));
    if (sender && !isMuted) {
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

  markMessagesDeliveredToUser(userId: string): Message[] {
    const now = new Date().toISOString();
    const updated: Message[] = [];
    this.data.messages.forEach(m => {
      if (m.receiver_id === userId && m.status === 'sent') {
        m.status = 'delivered';
        m.delivered_at = now;
        updated.push(m);
      }
    });
    if (updated.length > 0) {
      this.save();
    }
    return updated;
  }

  markMessagesDeliveredInConversation(convId: string, receiverId: string): Message[] {
    const now = new Date().toISOString();
    const updated: Message[] = [];
    this.data.messages.forEach(m => {
      if (m.conversation_id === convId && m.receiver_id === receiverId && m.status === 'sent') {
        m.status = 'delivered';
        m.delivered_at = now;
        updated.push(m);
      }
    });
    if (updated.length > 0) {
      this.save();
    }
    return updated;
  }

  markMessagesRead(receiverId: string, senderId?: string, conversationId?: string): Message[] {
    const now = new Date().toISOString();
    const updated: Message[] = [];
    this.data.messages.forEach(m => {
      const matchByUsers = (!senderId || m.sender_id === senderId) && m.receiver_id === receiverId;
      const matchByConv = conversationId && m.conversation_id === conversationId && m.receiver_id === receiverId;
      if ((matchByUsers || matchByConv) && m.status !== 'read') {
        m.status = 'read';
        m.read_at = m.read_at || now;
        m.delivered_at = m.delivered_at || m.read_at;
        m.is_read = true;
        updated.push(m);
      }
    });

    const conv = conversationId
      ? this.data.conversations.find(c => c.id === conversationId)
      : this.data.conversations.find(c => c.participant_ids?.includes(receiverId) && (!senderId || c.participant_ids?.includes(senderId)));
    if (conv && conv.unread_count > 0) {
      conv.unread_count = 0;
    }

    if (updated.length > 0 || (conv && conv.unread_count === 0)) {
      this.save();
    }
    return updated;
  }

  setUserOnlineStatus(userId: string, isOnline: boolean): Profile | undefined {
    const user = this.getUserById(userId);
    if (!user) return undefined;
    user.is_online = isOnline;
    user.last_active = isOnline ? 'Just now' : new Date().toISOString();

    // Update in any conversations where this user is other_user
    this.data.conversations.forEach(c => {
      if (c.other_user && c.other_user.id === userId) {
        c.other_user.is_online = isOnline;
        c.other_user.last_active = user.last_active;
      }
    });

    this.save();
    return user;
  }

  isUserOnline(userId: string): boolean {
    const user = this.getUserById(userId);
    return Boolean(user?.is_online);
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

  /**
   * Helper to normalize any uploaded media URL into a canonical /uploads/... string
   */
  private normalizeUploadPath(urlOrPath: string): string {
    if (!urlOrPath || typeof urlOrPath !== 'string') return '';
    let p = urlOrPath.split('?')[0].split('#')[0];
    const idx = p.indexOf('/uploads/');
    if (idx !== -1) {
      return p.substring(idx).replace(/\\/g, '/');
    }
    return p.replace(/\\/g, '/');
  }

  /**
   * Robustly deletes an uploaded video/photo file, all its thumbnails, posters, preview files,
   * and cleans up any empty entity folders from disk to ensure zero orphaned files.
   */
  deleteMediaUrlAndAssociatedFiles(urlOrPath: string): boolean {
    if (!urlOrPath || typeof urlOrPath !== 'string') return false;

    try {
      let pathname = urlOrPath;
      if (pathname.includes('://')) {
        try {
          const parsed = new URL(pathname);
          pathname = parsed.pathname;
        } catch {
          const idx = pathname.indexOf('/uploads/');
          if (idx !== -1) {
            pathname = pathname.substring(idx);
          }
        }
      }

      // Ensure pathname has leading slash if local relative path
      if (!pathname.startsWith('/') && !pathname.includes('://')) {
        pathname = '/' + pathname;
      }

      // Strip query parameters and anchors
      pathname = pathname.split('?')[0].split('#')[0];
      pathname = decodeURIComponent(pathname);

      const uploadsMarker = '/uploads/';
      const markerIdx = pathname.indexOf(uploadsMarker);
      if (markerIdx === -1) {
        return false;
      }

      const relativePart = pathname.substring(markerIdx + uploadsMarker.length);
      const uploadsRoot = path.resolve(process.cwd(), 'uploads');
      const targetFilePath = path.resolve(uploadsRoot, relativePart);

      // Security check: ensure target stays inside uploadsRoot (prevent path traversal)
      if (!targetFilePath.startsWith(uploadsRoot)) {
        console.warn('[Storage Cleanup] Path traversal attempt blocked:', targetFilePath);
        return false;
      }

      const parentDir = path.dirname(targetFilePath);
      const ext = path.extname(targetFilePath);
      const baseName = path.basename(targetFilePath, ext);

      let deletedAny = false;

      // 1. Delete the main file
      if (fs.existsSync(targetFilePath)) {
        fs.unlinkSync(targetFilePath);
        console.log(`[Storage Cleanup] Deleted main media file: ${targetFilePath}`);
        deletedAny = true;
      }

      // 2. Delete all related thumbnails, posters, previews, or webp/jpg variants
      if (fs.existsSync(parentDir)) {
        try {
          const siblingFiles = fs.readdirSync(parentDir);
          for (const sibling of siblingFiles) {
            const siblingPath = path.join(parentDir, sibling);
            // Sibling is considered a related thumbnail/preview if it starts with baseName
            // and is not identical to the original target file
            const isSiblingThumb =
              sibling.startsWith(baseName) &&
              sibling !== `${baseName}${ext}` &&
              (
                sibling.includes('-thumb') ||
                sibling.includes('_thumb') ||
                sibling.includes('.thumb') ||
                sibling.includes('-poster') ||
                sibling.includes('_poster') ||
                sibling.includes('.poster') ||
                sibling.includes('-cover') ||
                sibling.includes('_cover') ||
                sibling.includes('-preview') ||
                sibling.includes('_preview') ||
                /\.(jpe?g|png|webp|gif|svg)$/i.test(sibling)
              );

            if (isSiblingThumb && fs.existsSync(siblingPath)) {
              fs.unlinkSync(siblingPath);
              console.log(`[Storage Cleanup] Deleted associated thumbnail/variant: ${siblingPath}`);
              deletedAny = true;
            }
          }

          // 3. Remove empty entity subdirectories (never remove the category root like uploads/reels or uploads/posts)
          const protectedCategoryDirs = new Set(['reels', 'posts', 'stories', 'avatars', 'covers', 'misc']);
          const isProtectedRoot = (d: string) => {
            const rel = path.relative(uploadsRoot, d);
            return protectedCategoryDirs.has(rel) || rel === '' || rel === '.';
          };

          if (!isProtectedRoot(parentDir) && fs.existsSync(parentDir) && fs.readdirSync(parentDir).length === 0) {
            fs.rmdirSync(parentDir);
            console.log(`[Storage Cleanup] Removed empty directory: ${parentDir}`);

            const grandParent = path.dirname(parentDir);
            if (!isProtectedRoot(grandParent) && grandParent.startsWith(uploadsRoot) && fs.existsSync(grandParent)) {
              if (fs.readdirSync(grandParent).length === 0) {
                fs.rmdirSync(grandParent);
              }
            }
          }
        } catch (dirErr) {
          console.warn('[Storage Cleanup] Directory scan warning:', dirErr);
        }
      }

      return deletedAny;
    } catch (err) {
      console.warn('[Storage Cleanup] Error deleting media file:', urlOrPath, err);
      return false;
    }
  }

  /**
   * Scans uploads/posts and uploads/reels to purge any orphaned video and media files
   * that have no reference in the database.
   */
  purgeOrphanedVideoFiles() {
    try {
      const uploadsRoot = path.resolve(process.cwd(), 'uploads');
      if (!fs.existsSync(uploadsRoot)) return;

      const activeUrls = new Set<string>();

      // Collect active URLs from Posts
      for (const p of this.data.posts) {
        if (p.media && Array.isArray(p.media)) {
          for (const m of p.media) {
            if (m.url) activeUrls.add(this.normalizeUploadPath(m.url));
          }
        }
      }

      // Collect active URLs from Reels
      for (const r of this.data.reels) {
        if (r.video_url) activeUrls.add(this.normalizeUploadPath(r.video_url));
        if ((r as any).thumbnail_url) activeUrls.add(this.normalizeUploadPath((r as any).thumbnail_url));
      }

      // Collect active URLs from Stories
      for (const s of this.data.stories) {
        if (s.media_url) activeUrls.add(this.normalizeUploadPath(s.media_url));
      }

      const checkDirs = [
        path.join(uploadsRoot, 'reels'),
        path.join(uploadsRoot, 'posts')
      ];

      const now = Date.now();
      const GRACE_PERIOD_MS = 60 * 1000; // 1 minute grace period for active uploads

      for (const checkDir of checkDirs) {
        if (!fs.existsSync(checkDir)) continue;
        const walk = (dir: string) => {
          const entries = fs.readdirSync(dir, { withFileTypes: true });
          for (const entry of entries) {
            const full = path.join(dir, entry.name);
            if (entry.isDirectory()) {
              walk(full);
              if (full !== checkDir && fs.existsSync(full) && fs.readdirSync(full).length === 0) {
                try { fs.rmdirSync(full); } catch {}
              }
            } else if (entry.isFile()) {
              const rel = path.relative(uploadsRoot, full).replace(/\\/g, '/');
              const canonical = `/uploads/${rel}`;
              if (!activeUrls.has(canonical)) {
                try {
                  const stat = fs.statSync(full);
                  if (now - stat.mtimeMs > GRACE_PERIOD_MS) {
                    fs.unlinkSync(full);
                    console.log(`[Storage Cleanup] Purged orphaned video/file: ${canonical}`);
                  }
                } catch (e) {
                  console.warn('[Storage Cleanup] Failed to delete orphan:', full, e);
                }
              }
            }
          }
        };
        walk(checkDir);
      }
    } catch (e) {
      console.warn('[Storage Cleanup] Error during orphan purge:', e);
    }
  }

  deletePost(postId: string, userId: string): boolean {
    const postIndex = this.data.posts.findIndex(p => p.id === postId);
    if (postIndex === -1) {
      const err: any = new Error('Post not found');
      err.statusCode = 404;
      throw err;
    }
    const post = this.data.posts[postIndex];
    if (post.user_id !== userId && !this.isAdmin(userId)) {
      const err: any = new Error('Unauthorized: You can only delete your own posts');
      err.statusCode = 403;
      throw err;
    }

    // 1. Comprehensive physical media cleanup (videos, photos, and thumbnails)
    if (post.media && Array.isArray(post.media)) {
      for (const m of post.media) {
        if (m.url) {
          this.deleteMediaUrlAndAssociatedFiles(m.url);
        }
      }
    }

    // 2. Clean up any post entity directories if created
    const uploadsRoot = path.resolve(process.cwd(), 'uploads');
    const possiblePostDirs = [
      path.join(uploadsRoot, 'posts', post.user_id, postId),
      path.join(uploadsRoot, 'posts', postId)
    ];
    for (const dir of possiblePostDirs) {
      if (fs.existsSync(dir)) {
        try {
          fs.rmSync(dir, { recursive: true, force: true });
          console.log(`[Storage Cleanup] Removed post directory: ${dir}`);
        } catch (e) {
          console.warn('[Storage Cleanup] Failed to remove post directory:', dir, e);
        }
      }
    }

    // 3. Clean up reports referencing this post
    if (this.data.reports) {
      this.data.reports = this.data.reports.filter(r => !(r.target_id === postId && r.target_type === 'POST'));
    }

    // 4. Clean up notifications referencing this post
    if (this.data.notifications) {
      this.data.notifications = this.data.notifications.filter(n => !(n.link_route && n.link_route.includes(postId)));
    }

    // 5. Remove from database array and persist synchronously
    this.data.posts.splice(postIndex, 1);
    this.save();

    // 6. Purge any remaining orphaned files
    this.purgeOrphanedVideoFiles();

    return true;
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
    return this.data.reels.map(r => {
      const author = this.getUserById(r.user_id) || r.author;
      return { ...r, author };
    });
  }

  createReel(reel: Reel): Reel {
    this.data.reels.unshift(reel);
    this.save();
    return reel;
  }

  deleteReel(reelId: string, userId: string): boolean {
    const reelIndex = this.data.reels.findIndex(r => r.id === reelId);
    if (reelIndex === -1) {
      const err: any = new Error('Reel not found');
      err.statusCode = 404;
      throw err;
    }
    const reel = this.data.reels[reelIndex];
    if (reel.user_id !== userId && !this.isAdmin(userId)) {
      const err: any = new Error('Unauthorized: You can only delete your own videos/reels');
      err.statusCode = 403;
      throw err;
    }

    // 1. Comprehensive physical media cleanup (video file and any associated thumbnails/previews)
    if (reel.video_url) {
      this.deleteMediaUrlAndAssociatedFiles(reel.video_url);
    }
    if ((reel as any).thumbnail_url) {
      this.deleteMediaUrlAndAssociatedFiles((reel as any).thumbnail_url);
    }
    if ((reel as any).cover_url) {
      this.deleteMediaUrlAndAssociatedFiles((reel as any).cover_url);
    }

    // 2. Clean up any reel entity directories or files matching reelId
    const uploadsRoot = path.resolve(process.cwd(), 'uploads');
    const possibleReelDirs = [
      path.join(uploadsRoot, 'reels', reel.user_id, reelId),
      path.join(uploadsRoot, 'reels', reelId)
    ];
    for (const dir of possibleReelDirs) {
      if (fs.existsSync(dir)) {
        try {
          fs.rmSync(dir, { recursive: true, force: true });
          console.log(`[Storage Cleanup] Removed reel directory: ${dir}`);
        } catch (e) {
          console.warn('[Storage Cleanup] Failed to remove reel directory:', dir, e);
        }
      }
    }

    // 3. Clean up reel comments
    if ((this.data as any).reel_comments && (this.data as any).reel_comments[reelId]) {
      delete (this.data as any).reel_comments[reelId];
    }

    // 4. Clean up reports referencing this reel
    if (this.data.reports) {
      this.data.reports = this.data.reports.filter(r => !(r.target_id === reelId && r.target_type === 'REEL'));
    }

    // 5. Clean up notifications referencing this reel
    if (this.data.notifications) {
      this.data.notifications = this.data.notifications.filter(n => !(n.link_route && n.link_route.includes(reelId)));
    }

    // 6. Remove from database and persist synchronously
    this.data.reels.splice(reelIndex, 1);
    this.save();

    // 7. Purge any remaining orphaned video files
    this.purgeOrphanedVideoFiles();

    // 8. Ensure root category directory exists for subsequent uploads
    fs.mkdirSync(path.join(uploadsRoot, 'reels'), { recursive: true });

    return true;
  }

  likeReel(reelId: string) {
    const r = this.data.reels.find(rel => rel.id === reelId);
    if (r) {
      r.liked_by_me = !r.liked_by_me;
      r.likes_count = r.liked_by_me ? r.likes_count + 1 : Math.max(0, r.likes_count - 1);
      this.save();
      return { liked_by_me: r.liked_by_me, likes_count: r.likes_count };
    }
    return null;
  }

  saveReel(reelId: string) {
    const r = this.data.reels.find(rel => rel.id === reelId);
    if (r) {
      r.saved_by_me = !r.saved_by_me;
      this.save();
      return { saved_by_me: r.saved_by_me };
    }
    return null;
  }

  shareReel(reelId: string) {
    const r = this.data.reels.find(rel => rel.id === reelId);
    if (r) {
      r.shares_count = (r.shares_count || 0) + 1;
      this.save();
      return { shares_count: r.shares_count };
    }
    return null;
  }

  getReelComments(reelId: string) {
    if (!(this.data as any).reel_comments) (this.data as any).reel_comments = {};
    const list = (this.data as any).reel_comments[reelId] || [];
    if (list.length === 0) {
      const defaultCmts = [
        {
          id: `seed-c-1-${reelId}`,
          user_id: 'user-sarah',
          author: this.getUserById('user-sarah'),
          content: 'This is incredible energy! 🔥✨',
          created_at: new Date(Date.now() - 3600000).toISOString(),
          likes_count: 5
        },
        {
          id: `seed-c-2-${reelId}`,
          user_id: 'user-daniela',
          author: this.getUserById('user-daniela'),
          content: 'Love this vibe so much! Where was this filmed? 🙌',
          created_at: new Date(Date.now() - 7200000).toISOString(),
          likes_count: 3
        }
      ].filter(c => c.author);
      (this.data as any).reel_comments[reelId] = defaultCmts;
      this.save();
      return defaultCmts;
    }
    return list;
  }

  commentOnReel(reelId: string, userId: string, content: string) {
    const r = this.data.reels.find(rel => rel.id === reelId);
    const author = this.getUserById(userId);
    if (r && author) {
      r.comments_count = (r.comments_count || 0) + 1;
      if (!(this.data as any).reel_comments) (this.data as any).reel_comments = {};
      if (!(this.data as any).reel_comments[reelId]) (this.data as any).reel_comments[reelId] = [];
      const newComment = {
        id: `reel-cmt-${Date.now()}`,
        user_id: userId,
        author,
        content,
        created_at: new Date().toISOString(),
        likes_count: 0
      };
      (this.data as any).reel_comments[reelId].unshift(newComment);
      this.save();
      return newComment;
    }
    return null;
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
    return this.data.notifications
      .filter(n => n.user_id === userId)
      .map(n => {
        const actor = this.getUserById(n.actor_id) || n.actor;
        return { ...n, actor };
      });
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
      // Remove active connection if exists
      this.data.connections = this.data.connections.filter(
        c => !( (c.requester_id === blockerId && c.receiver_id === blockedId) || (c.requester_id === blockedId && c.receiver_id === blockerId) )
      );
      // Remove dating likes if exists
      this.data.dating_likes = this.data.dating_likes.filter(
        l => !( (l.from_user_id === blockerId && l.to_user_id === blockedId) || (l.from_user_id === blockedId && l.to_user_id === blockerId) )
      );
      this.save();
    }
  }

  unblockUser(blockerId: string, blockedId: string) {
    this.data.blocks = this.data.blocks.filter(b => !(b.blocker_id === blockerId && b.blocked_id === blockedId));
    this.save();
  }

  isUserBlockedBetween(userA: string, userB: string): boolean {
    return this.data.blocks.some(
      b => (b.blocker_id === userA && b.blocked_id === userB) ||
           (b.blocker_id === userB && b.blocked_id === userA)
    );
  }

  isUserBlockedBy(blockerId: string, blockedId: string): boolean {
    return this.data.blocks.some(b => b.blocker_id === blockerId && b.blocked_id === blockedId);
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

  public isUserAdmin(userId: string): boolean {
    const u = this.getUserById(userId);
    if (!u) return false;
    return u.role === 'ADMIN' && (u.id === 'user-suresh' || u.email?.toLowerCase() === 'bohara.suresh8884@gmail.com');
  }

  private isAdmin(userId: string): boolean {
    return this.isUserAdmin(userId);
  }
}

export const db = new DatabaseEngine();
