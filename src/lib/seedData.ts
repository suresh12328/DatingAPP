import { Profile, Post, Story, Reel, Match, Connection, AppNotification } from '../types';

export const SEED_PROFILES: Profile[] = [
  {
    id: 'user-suresh',
    email: 'bohara.suresh8884@gmail.com',
    username: 'suresh_bohara',
    full_name: 'Suresh Bohara',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
    cover_url: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1200&q=80',
    bio: 'Lead Platform Administrator & System Architect. Ensuring a safe, authentic dating community on LoveConnect. ☕💻',
    age: 28,
    dob: '1996-03-22',
    gender: 'MAN',
    dating_preference: 'WOMEN',
    location: 'San Francisco, CA',
    neighborhood: 'Mission District',
    profession: 'Lead System Administrator & Architect',
    education: 'Stanford University',
    interests: ['Tech & AI', 'Coffee Brewing', 'Rock Climbing', 'Photography', 'Travel', 'Cybersecurity'],
    relationship_goal: 'LONG_TERM',
    languages: ['English', 'Nepali', 'Hindi'],
    height_cm: 182,
    photos: [
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=800&q=80'
    ],
    lifestyle: {
      drinking: 'SOCIALLY',
      smoking: 'NEVER',
      workout: 'DAILY',
      pets: '1 rescue cat named Mochi',
      zodiac: 'Aries'
    },
    is_verified: true,
    email_verified: true,
    account_status: 'ACTIVE',
    is_online: true,
    last_active: 'Just now',
    role: 'ADMIN',
    status: 'ACTIVE',
    privacy: {
      profileVisibility: 'PUBLIC',
      whoCanMessageMe: 'EVERYONE',
      whoCanConnect: 'EVERYONE',
      datingVisible: true,
      showOnlineStatus: true,
      readReceipts: true,
    },
    created_at: '2024-01-10T08:00:00Z',
    password_hash: '$2b$10$.SKHhBKD4/idxcL/5J1Cc.dww/G.HpG4680A7q5wsI0CqsaHTwzPW'
  }
];

export const SEED_POSTS: Post[] = [
  {
    id: 'post-1',
    user_id: 'user-suresh',
    author: SEED_PROFILES[0],
    content: "Dialed in a fresh natural Ethiopian Yirgacheffe this morning on the pour-over: notes of wild blueberry, jasmine, and bergamot. Brewing coffee has genuinely become my favorite form of morning meditation. What roasters are everyone loving right now? ☕✨",
    media: [
      {
        url: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1200&q=80',
        type: 'image'
      }
    ],
    feeling: 'Energized & focused ☕',
    location: 'Mission District, San Francisco, CA',
    likes_count: 48,
    comments_count: 6,
    shares_count: 4,
    saved_by_me: false,
    liked_by_me: true,
    privacy: 'PUBLIC',
    created_at: '2024-02-18T14:30:00Z',
    comments: [
      {
        id: 'c-1',
        post_id: 'post-1',
        user_id: 'user-suresh',
        author: SEED_PROFILES[0],
        content: "Pro-tip: 202°F water temp and a 1:16 ratio brings out maximum floral brightness on this lot! 🌸",
        created_at: '2024-02-18T15:10:00Z',
        likes_count: 8,
        liked_by_me: true,
        replies: []
      }
    ]
  },
  {
    id: 'post-2',
    user_id: 'user-suresh',
    author: SEED_PROFILES[0],
    content: "Golden hour in Marin Headlands never disappoints. Spent the afternoon scouting coastal trail angles and catching the Pacific breeze. Always remember to take time off screens and recharge out in nature. 🌅📷",
    media: [
      {
        url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
        type: 'image'
      },
      {
        url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
        type: 'image'
      }
    ],
    feeling: 'Peaceful & inspired ✨',
    location: 'Marin Headlands, CA',
    likes_count: 65,
    comments_count: 5,
    shares_count: 7,
    saved_by_me: true,
    liked_by_me: true,
    privacy: 'PUBLIC',
    created_at: '2024-02-17T18:45:00Z',
    comments: []
  },
  {
    id: 'post-3',
    user_id: 'user-suresh',
    author: SEED_PROFILES[0],
    content: "Completed our infrastructure upgrade today on LoveConnect! Faster image pipelines, global real-time synchronization, and airtight account protection. Built with passion for everyone connecting here. 💻🛡️",
    media: [
      {
        url: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80',
        type: 'image'
      }
    ],
    feeling: 'Productive & grateful 🚀',
    location: 'San Francisco, CA',
    likes_count: 92,
    comments_count: 12,
    shares_count: 15,
    saved_by_me: false,
    liked_by_me: true,
    privacy: 'PUBLIC',
    created_at: '2024-02-16T09:15:00Z',
    comments: []
  },
  {
    id: 'post-4',
    user_id: 'user-suresh',
    author: SEED_PROFILES[0],
    content: "Weekend bouldering session in Castle Rock! Pushed through a tricky V6 problem after days of projecting. Tenacity in climbing always mirrors problem-solving in software architecture. 🧗‍♂️🏔️",
    media: [
      {
        url: 'https://images.unsplash.com/photo-1522163182402-834f871fd851?auto=format&fit=crop&w=1200&q=80',
        type: 'image'
      }
    ],
    feeling: 'Stoked & energized 💪',
    location: 'Castle Rock State Park, CA',
    likes_count: 74,
    comments_count: 8,
    shares_count: 6,
    saved_by_me: false,
    liked_by_me: true,
    privacy: 'PUBLIC',
    created_at: '2024-02-15T20:10:00Z',
    comments: []
  }
];

export const SEED_STORIES: Story[] = [
  {
    id: 'story-1',
    user_id: 'user-suresh',
    author: SEED_PROFILES[0],
    media_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80',
    media_type: 'image',
    text_overlay: 'Sunny SF morning ☀️☕',
    views_count: 84,
    created_at: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    expires_at: new Date(Date.now() + 21 * 3600 * 1000).toISOString(),
    reactions: [
      { user_id: 'user-suresh', emoji: '❤️' }
    ]
  },
  {
    id: 'story-2',
    user_id: 'user-suresh',
    author: SEED_PROFILES[0],
    media_url: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=800&q=80',
    media_type: 'image',
    text_overlay: 'High elevation summit views 🏔️',
    views_count: 112,
    created_at: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
    expires_at: new Date(Date.now() + 18 * 3600 * 1000).toISOString(),
    reactions: [
      { user_id: 'user-suresh', emoji: '🔥' }
    ]
  }
];

export const SEED_REELS: Reel[] = [];

export const SEED_MATCHES: Match[] = [];

export const SEED_CONNECTIONS: Connection[] = [];

export const SEED_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-1',
    user_id: 'user-suresh',
    actor_id: 'user-suresh',
    actor: SEED_PROFILES[0],
    type: 'SYSTEM',
    title: '🛡️ Administrator Access Granted',
    message: 'Welcome Suresh Bohara. Your administrator privileges and security controls are active.',
    link_route: '/admin',
    is_read: true,
    created_at: '2024-02-18T16:45:00Z'
  },
  {
    id: 'notif-2',
    user_id: 'user-suresh',
    actor_id: 'user-suresh',
    actor: SEED_PROFILES[0],
    type: 'SYSTEM',
    title: 'System Health Optimal',
    message: 'All security protocols, database integrity checks, and media storage are operational.',
    link_route: '/admin',
    is_read: true,
    created_at: '2024-02-18T15:20:00Z'
  }
];
