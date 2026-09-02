import { Profile, Post, Story, Match, Connection, AppNotification, Reel, Comment } from '../types';

export const SEED_PROFILES: Profile[] = [
  {
    id: 'user-sarah',
    email: 'sarah.miller@loveconnect.com',
    username: 'sarah_m',
    full_name: 'Sarah Miller',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
    cover_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
    bio: 'Art director & sunset chaser. Looking for someone who enjoys gallery hopping, spicy tacos, and spontaneous road trips. 🎨🌮',
    age: 26,
    dob: '1998-05-14',
    gender: 'WOMAN',
    dating_preference: 'MEN',
    location: 'San Francisco, CA',
    neighborhood: 'Herald Square',
    profession: 'Senior Art Director',
    education: 'Rhode Island School of Design',
    interests: ['Contemporary Art', 'Photography', 'Indie Music', 'Hiking', 'Cooking', 'Wine Tasting'],
    relationship_goal: 'LONG_TERM',
    languages: ['English', 'French'],
    height_cm: 168,
    photos: [
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=800&q=80'
    ],
    lifestyle: {
      drinking: 'SOCIALLY',
      smoking: 'NEVER',
      workout: 'OFTEN',
      pets: 'Golden Retriever lover',
      zodiac: 'Taurus'
    },
    is_verified: true,
    is_online: true,
    last_active: 'Just now',
    role: 'USER',
    status: 'ACTIVE',
    privacy: {
      profileVisibility: 'PUBLIC',
      whoCanMessageMe: 'EVERYONE',
      whoCanConnect: 'EVERYONE',
      datingVisible: true,
      showOnlineStatus: true,
      readReceipts: true,
    },
    created_at: '2024-01-15T10:00:00Z'
  },
  {
    id: 'user-david',
    email: 'david.chen@loveconnect.com',
    username: 'david_chen',
    full_name: 'David Chen',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
    cover_url: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1200&q=80',
    bio: 'Software architect & coffee enthusiast. Always exploring new viewpoints, hiking Pacific trails, and finding hidden ramen spots. ☕💻',
    age: 28,
    dob: '1996-03-22',
    gender: 'MAN',
    dating_preference: 'WOMEN',
    location: 'San Francisco, CA',
    neighborhood: 'Mission District',
    profession: 'Lead Software Architect',
    education: 'Stanford University',
    interests: ['Tech & AI', 'Coffee Brewing', 'Rock Climbing', 'Photography', 'Travel', 'Jazz'],
    relationship_goal: 'LONG_TERM',
    languages: ['English', 'Mandarin'],
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
    created_at: '2024-01-10T08:00:00Z'
  },
  {
    id: 'user-jessica',
    email: 'jessica.k@loveconnect.com',
    username: 'jessica_rose',
    full_name: 'Jessica Vance',
    avatar_url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=600&q=80',
    cover_url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
    bio: 'Architectural designer & vintage collector. Searching for authentic conversations and Sunday morning farmers market dates. 🌿🏛️',
    age: 27,
    dob: '1997-09-08',
    gender: 'WOMAN',
    dating_preference: 'MEN',
    location: 'San Francisco, CA',
    neighborhood: 'Rose Hill',
    profession: 'Urban Designer',
    education: 'UC Berkeley',
    interests: ['Architecture', 'Urban Gardening', 'Vinyl Records', 'Yoga', 'Modern Literature'],
    relationship_goal: 'LONG_TERM',
    languages: ['English', 'Spanish'],
    height_cm: 172,
    photos: [
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=800&q=80'
    ],
    lifestyle: {
      drinking: 'SOCIALLY',
      smoking: 'NEVER',
      workout: 'OFTEN',
      pets: 'Dog & Plant mom',
      zodiac: 'Virgo'
    },
    is_verified: true,
    is_online: true,
    last_active: '5m ago',
    role: 'USER',
    status: 'ACTIVE',
    privacy: {
      profileVisibility: 'PUBLIC',
      whoCanMessageMe: 'EVERYONE',
      whoCanConnect: 'EVERYONE',
      datingVisible: true,
      showOnlineStatus: true,
      readReceipts: true,
    },
    created_at: '2024-01-18T14:30:00Z'
  },
  {
    id: 'user-mirela',
    email: 'mirela.b@loveconnect.com',
    username: 'mirela_b',
    full_name: 'Mirela Rossi',
    avatar_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&q=80',
    cover_url: 'https://images.unsplash.com/photo-1470240731273-7821a6eeb6bd?auto=format&fit=crop&w=1200&q=80',
    bio: 'Sommelier & travel journalist. Passionate about Mediterranean food, live acoustic jazz, and deep fireside conversations. 🍷✨',
    age: 29,
    dob: '1995-11-20',
    gender: 'WOMAN',
    dating_preference: 'MEN',
    location: 'New York, NY',
    neighborhood: 'Koreatown',
    profession: 'Travel & Wine Journalist',
    education: 'Columbia University',
    interests: ['Wine Tasting', 'Gastronomy', 'Jazz', 'Italian Cinema', 'Travel Writing'],
    relationship_goal: 'LONG_TERM',
    languages: ['English', 'Italian', 'Spanish'],
    height_cm: 165,
    photos: [
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80'
    ],
    lifestyle: {
      drinking: 'SOCIALLY',
      smoking: 'NEVER',
      workout: 'OFTEN',
      pets: 'None',
      zodiac: 'Scorpio'
    },
    is_verified: true,
    is_online: true,
    last_active: '12m ago',
    role: 'USER',
    status: 'ACTIVE',
    privacy: {
      profileVisibility: 'PUBLIC',
      whoCanMessageMe: 'EVERYONE',
      whoCanConnect: 'EVERYONE',
      datingVisible: true,
      showOnlineStatus: true,
      readReceipts: true,
    },
    created_at: '2024-01-20T11:00:00Z'
  },
  {
    id: 'user-patricia',
    email: 'patricia.h@loveconnect.com',
    username: 'patricia_nomad',
    full_name: 'Patricia Hayes',
    avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=600&q=80',
    cover_url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
    bio: 'Ocean lover & documentary filmmaker. Currently working on marine conservation stories. Let’s catch a sunset paddle. 🌊🎥',
    age: 27,
    dob: '1997-04-12',
    gender: 'WOMAN',
    dating_preference: 'EVERYONE',
    location: 'San Francisco, CA',
    neighborhood: 'NoMad / Marina',
    profession: 'Documentary Filmmaker',
    education: 'USC School of Cinematic Arts',
    interests: ['Surfing', 'Filmmaking', 'Scuba Diving', 'Podcasts', 'Campfires', 'Acoustic Guitar'],
    relationship_goal: 'DATING',
    languages: ['English', 'Portuguese'],
    height_cm: 170,
    photos: [
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80'
    ],
    lifestyle: {
      drinking: 'SOCIALLY',
      smoking: 'NEVER',
      workout: 'DAILY',
      pets: 'Australian Shepherd',
      zodiac: 'Pisces'
    },
    is_verified: true,
    is_online: false,
    last_active: '30m ago',
    role: 'USER',
    status: 'ACTIVE',
    privacy: {
      profileVisibility: 'PUBLIC',
      whoCanMessageMe: 'EVERYONE',
      whoCanConnect: 'EVERYONE',
      datingVisible: true,
      showOnlineStatus: true,
      readReceipts: true,
    },
    created_at: '2024-01-22T09:15:00Z'
  },
  {
    id: 'user-daniela',
    email: 'daniela.chef@loveconnect.com',
    username: 'daniela_cooks',
    full_name: 'Daniela Morales',
    avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&q=80',
    cover_url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80',
    bio: 'Pastry chef & home cook innovator. The fastest way to my heart is a conversation about sourdough hydration and favorite bakery spots. 🥐💛',
    age: 26,
    dob: '1998-08-30',
    gender: 'WOMAN',
    dating_preference: 'MEN',
    location: 'San Francisco, CA',
    neighborhood: 'Kips Bay',
    profession: 'Pastry Chef & Culinary Instructor',
    education: 'Culinary Institute of America',
    interests: ['Cooking', 'Baking', 'Pottery', 'Board Games', 'Farmers Markets', 'Cycling'],
    relationship_goal: 'LONG_TERM',
    languages: ['English', 'Spanish'],
    height_cm: 163,
    photos: [
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80'
    ],
    lifestyle: {
      drinking: 'SOCIALLY',
      smoking: 'NEVER',
      workout: 'SOMETIMES',
      pets: 'Cat',
      zodiac: 'Virgo'
    },
    is_verified: true,
    is_online: true,
    last_active: 'Just now',
    role: 'USER',
    status: 'ACTIVE',
    privacy: {
      profileVisibility: 'PUBLIC',
      whoCanMessageMe: 'EVERYONE',
      whoCanConnect: 'EVERYONE',
      datingVisible: true,
      showOnlineStatus: true,
      readReceipts: true,
    },
    created_at: '2024-01-25T16:00:00Z'
  },
  {
    id: 'user-derek',
    email: 'derek.w@loveconnect.com',
    username: 'derek_w',
    full_name: 'Derek Woods',
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80',
    cover_url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80',
    bio: 'Product designer & backcountry camper. Looking for someone who laughs at terrible puns and loves mountain air. 🏔️🎒',
    age: 29,
    dob: '1995-02-18',
    gender: 'MAN',
    dating_preference: 'WOMEN',
    location: 'Austin, TX',
    neighborhood: 'South Congress',
    profession: 'Principal Product Designer',
    education: 'UT Austin',
    interests: ['Camping', 'Product Design', 'Trail Running', 'Specialty Coffee', 'Vinyl'],
    relationship_goal: 'LONG_TERM',
    languages: ['English', 'German'],
    height_cm: 185,
    photos: [
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=800&q=80'
    ],
    lifestyle: {
      drinking: 'SOCIALLY',
      smoking: 'NEVER',
      workout: 'DAILY',
      pets: 'Border Collie',
      zodiac: 'Aquarius'
    },
    is_verified: true,
    is_online: true,
    last_active: '1h ago',
    role: 'USER',
    status: 'ACTIVE',
    privacy: {
      profileVisibility: 'PUBLIC',
      whoCanMessageMe: 'EVERYONE',
      whoCanConnect: 'EVERYONE',
      datingVisible: true,
      showOnlineStatus: true,
      readReceipts: true,
    },
    created_at: '2024-01-26T12:00:00Z'
  },
  {
    id: 'user-susan',
    email: 'susan.nyc@loveconnect.com',
    username: 'susan_nyc',
    full_name: 'Susan Thorne',
    avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80',
    cover_url: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=1200&q=80',
    bio: 'Biotech researcher by day, live indie concert lover by night. Seeking deep conversations and authentic connection. 🧬🎶',
    age: 28,
    dob: '1996-07-14',
    gender: 'WOMAN',
    dating_preference: 'MEN',
    location: 'New York, NY',
    neighborhood: 'Greenwich Village',
    profession: 'Biotech Senior Scientist',
    education: 'MIT',
    interests: ['Science', 'Live Music', 'Bouldering', 'Podcasts', 'Museums'],
    relationship_goal: 'LONG_TERM',
    languages: ['English', 'German'],
    height_cm: 167,
    photos: [
      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80'
    ],
    lifestyle: {
      drinking: 'SOCIALLY',
      smoking: 'NEVER',
      workout: 'OFTEN',
      pets: 'None',
      zodiac: 'Cancer'
    },
    is_verified: true,
    is_online: false,
    last_active: '2h ago',
    role: 'USER',
    status: 'ACTIVE',
    privacy: {
      profileVisibility: 'PUBLIC',
      whoCanMessageMe: 'EVERYONE',
      whoCanConnect: 'EVERYONE',
      datingVisible: true,
      showOnlineStatus: true,
      readReceipts: true,
    },
    created_at: '2024-02-01T08:00:00Z'
  },
  {
    id: 'user-micheal',
    email: 'micheal.s@loveconnect.com',
    username: 'micheal_sf',
    full_name: 'Micheal Sterling',
    avatar_url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=600&q=80',
    cover_url: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&w=1200&q=80',
    bio: 'Landscape architect, espresso nerd, and vinyl record collector. Tell me your top 3 comfort movies! ☕🌱',
    age: 28,
    dob: '1996-01-19',
    gender: 'MAN',
    dating_preference: 'WOMEN',
    location: 'San Francisco, CA',
    neighborhood: 'Hayes Valley',
    profession: 'Landscape Architect',
    education: 'Cornell University',
    interests: ['Design', 'Botany', 'Cinema', 'Espresso', 'Cycling'],
    relationship_goal: 'LONG_TERM',
    languages: ['English'],
    height_cm: 180,
    photos: [
      'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=800&q=80'
    ],
    lifestyle: {
      drinking: 'SOCIALLY',
      smoking: 'NEVER',
      workout: 'OFTEN',
      pets: 'Corgi',
      zodiac: 'Capricorn'
    },
    is_verified: true,
    is_online: true,
    last_active: 'Just now',
    role: 'USER',
    status: 'ACTIVE',
    privacy: {
      profileVisibility: 'PUBLIC',
      whoCanMessageMe: 'EVERYONE',
      whoCanConnect: 'EVERYONE',
      datingVisible: true,
      showOnlineStatus: true,
      readReceipts: true,
    },
    created_at: '2024-02-02T10:00:00Z'
  },
  {
    id: 'user-emma',
    email: 'emma.hart@loveconnect.com',
    username: 'emma_hart',
    full_name: 'Emma Hart',
    avatar_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&q=80',
    cover_url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80',
    bio: 'Interior stylist and plant fanatic. Creating cozy spaces and cherishing heartfelt conversations over matcha lattes. 🍵🌿',
    age: 25,
    dob: '1999-06-11',
    gender: 'WOMAN',
    dating_preference: 'MEN',
    location: 'San Francisco, CA',
    neighborhood: 'Pacific Heights',
    profession: 'Interior Designer',
    education: 'Parsons School of Design',
    interests: ['Interior Decor', 'Ceramics', 'Matcha', 'Pilates', 'Thrifting'],
    relationship_goal: 'LONG_TERM',
    languages: ['English', 'Japanese'],
    height_cm: 165,
    photos: [
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80'
    ],
    lifestyle: {
      drinking: 'NEVER',
      smoking: 'NEVER',
      workout: 'DAILY',
      pets: '2 Siamese cats',
      zodiac: 'Gemini'
    },
    is_verified: true,
    is_online: true,
    last_active: 'Just now',
    role: 'MODERATOR',
    status: 'ACTIVE',
    privacy: {
      profileVisibility: 'PUBLIC',
      whoCanMessageMe: 'EVERYONE',
      whoCanConnect: 'EVERYONE',
      datingVisible: true,
      showOnlineStatus: true,
      readReceipts: true,
    },
    created_at: '2024-02-03T11:00:00Z'
  }
];

export const SEED_POSTS: Post[] = [
  {
    id: 'post-1',
    user_id: 'user-daniela',
    author: SEED_PROFILES.find(p => p.id === 'user-daniela')!,
    content: "I'm looking for a reliable recipe for a potato casserole with wild mushrooms — I had it while on vacation, and it was phenomenal. There are plenty of recipes on the Internet, but I somehow don't trust them: baking time of 20 minutes for raw ingredients doesn't seem quite right to me... Any home cooks here with tried-and-true secrets? 🍄🥔",
    media: [
      {
        url: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1200&q=80',
        type: 'image'
      }
    ],
    feeling: 'Craving good comfort food 🍲',
    location: 'San Francisco, CA',
    likes_count: 24,
    comments_count: 8,
    shares_count: 3,
    saved_by_me: false,
    liked_by_me: false,
    privacy: 'PUBLIC',
    created_at: '2024-02-18T14:30:00Z',
    comments: [
      {
        id: 'c-1',
        post_id: 'post-1',
        user_id: 'user-sarah',
        author: SEED_PROFILES.find(p => p.id === 'user-sarah')!,
        content: "Parboil the sliced potatoes for 6 minutes before layering with thyme, garlic cream, and chanterelles! Then bake for 45 mins at 375°F until bubbly and golden. Turns out heavenly every single time! ✨",
        created_at: '2024-02-18T15:10:00Z',
        likes_count: 5,
        liked_by_me: true,
        replies: [
          {
            id: 'cr-1',
            comment_id: 'c-1',
            user_id: 'user-daniela',
            author: SEED_PROFILES.find(p => p.id === 'user-daniela')!,
            content: "Sarah, you're an absolute lifesaver! Trying this tonight with fresh rosemary as well! 💛",
            created_at: '2024-02-18T15:25:00Z',
            likes_count: 2,
            liked_by_me: false
          }
        ]
      },
      {
        id: 'c-2',
        post_id: 'post-1',
        user_id: 'user-david',
        author: SEED_PROFILES.find(p => p.id === 'user-david')!,
        content: "Definitely parboil or slice razor thin on a mandoline. Also a touch of gruyère on top makes magic happen.",
        created_at: '2024-02-18T16:00:00Z',
        likes_count: 3,
        liked_by_me: false,
        replies: []
      }
    ]
  },
  {
    id: 'post-2',
    user_id: 'user-sarah',
    author: SEED_PROFILES.find(p => p.id === 'user-sarah')!,
    content: "Golden hour in Marin Headlands never disappoints. Spent the afternoon sketching the coastline and catching the salty breeze. What’s everyone’s favorite weekend escape when the city gets too hectic? 🌅🎨",
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
    likes_count: 42,
    comments_count: 6,
    shares_count: 5,
    saved_by_me: true,
    liked_by_me: true,
    privacy: 'PUBLIC',
    created_at: '2024-02-17T18:45:00Z',
    comments: [
      {
        id: 'c-3',
        post_id: 'post-2',
        user_id: 'user-jessica',
        author: SEED_PROFILES.find(p => p.id === 'user-jessica')!,
        content: "Those colors are breathtaking! Mount Tamalpais above the fog line is my personal sanctuary.",
        created_at: '2024-02-17T19:00:00Z',
        likes_count: 4,
        liked_by_me: false,
        replies: []
      }
    ]
  },
  {
    id: 'post-3',
    user_id: 'user-david',
    author: SEED_PROFILES.find(p => p.id === 'user-david')!,
    content: "Dialed in a fresh natural Ethiopian Yirgacheffe this morning on the pour-over: notes of wild blueberry, jasmine, and bergamot. Brewing coffee has genuinely become my favorite form of meditation. ☕✨",
    media: [
      {
        url: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1200&q=80',
        type: 'image'
      }
    ],
    feeling: 'Energized & focused ☕',
    location: 'San Francisco, CA',
    likes_count: 31,
    comments_count: 4,
    shares_count: 2,
    saved_by_me: false,
    liked_by_me: false,
    privacy: 'PUBLIC',
    created_at: '2024-02-16T09:15:00Z',
    comments: []
  },
  {
    id: 'post-4',
    user_id: 'user-patricia',
    author: SEED_PROFILES.find(p => p.id === 'user-patricia')!,
    content: "Wrapped filming on day 4 of our Monterey Bay kelp forest project! Floating alongside sea otters and harbor seals reminded me why we do what we do. LoveConnect community, let's keep protecting our blue planet. 🌊🐋",
    media: [
      {
        url: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1200&q=80',
        type: 'image'
      }
    ],
    feeling: 'Grateful & ocean-struck 💙',
    location: 'Monterey Bay, CA',
    likes_count: 58,
    comments_count: 11,
    shares_count: 9,
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
    user_id: 'user-sarah',
    author: SEED_PROFILES.find(p => p.id === 'user-sarah')!,
    media_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
    media_type: 'image',
    text_overlay: 'Sunny studio mornings 🎨✨',
    views_count: 64,
    created_at: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    expires_at: new Date(Date.now() + 21 * 3600 * 1000).toISOString(),
    reactions: [
      { user_id: 'user-david', emoji: '❤️' },
      { user_id: 'user-jessica', emoji: '🔥' }
    ]
  },
  {
    id: 'story-2',
    user_id: 'user-mirela',
    author: SEED_PROFILES.find(p => p.id === 'user-mirela')!,
    media_url: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=800&q=80',
    media_type: 'image',
    text_overlay: 'Natural orange wine flight in Brooklyn 🍷',
    views_count: 89,
    created_at: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
    expires_at: new Date(Date.now() + 19 * 3600 * 1000).toISOString(),
    reactions: [
      { user_id: 'user-sarah', emoji: '😍' }
    ]
  },
  {
    id: 'story-3',
    user_id: 'user-jessica',
    author: SEED_PROFILES.find(p => p.id === 'user-jessica')!,
    media_url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80',
    media_type: 'image',
    text_overlay: 'Exploring old Victorian architecture 🌿',
    views_count: 52,
    created_at: new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
    expires_at: new Date(Date.now() + 16 * 3600 * 1000).toISOString(),
    reactions: []
  },
  {
    id: 'story-4',
    user_id: 'user-patricia',
    author: SEED_PROFILES.find(p => p.id === 'user-patricia')!,
    media_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
    media_type: 'image',
    text_overlay: 'Catching sunset sets at Ocean Beach 🏄‍♀️',
    views_count: 110,
    created_at: new Date(Date.now() - 11 * 3600 * 1000).toISOString(),
    expires_at: new Date(Date.now() + 13 * 3600 * 1000).toISOString(),
    reactions: []
  }
];

export const SEED_REELS: Reel[] = [
  {
    id: 'reel-1',
    user_id: 'user-sarah',
    author: SEED_PROFILES.find(p => p.id === 'user-sarah')!,
    video_url: 'https://assets.mixkit.co/videos/preview/mixkit-young-woman-skater-riding-outdoors-42618-large.mp4',
    caption: 'Chasing the Pacific breeze through the Presidio 🛹✨ #SanFrancisco #Vibes #Summer',
    music_title: 'Original Audio — Sarah Miller',
    likes_count: 342,
    comments_count: 28,
    shares_count: 45,
    views_count: 1890,
    liked_by_me: true,
    saved_by_me: false,
    created_at: '2024-02-18T10:00:00Z'
  },
  {
    id: 'reel-2',
    user_id: 'user-daniela',
    author: SEED_PROFILES.find(p => p.id === 'user-daniela')!,
    video_url: 'https://assets.mixkit.co/videos/preview/mixkit-hands-holding-and-breaking-a-croissant-in-half-42866-large.mp4',
    caption: 'That 48-hour lamination crunch! 🥐 Butter layers doing what they do best.',
    music_title: 'Lo-Fi Bakery Beats — Daniela Cooks',
    likes_count: 820,
    comments_count: 94,
    shares_count: 112,
    views_count: 4500,
    liked_by_me: false,
    saved_by_me: true,
    created_at: '2024-02-17T12:00:00Z'
  },
  {
    id: 'reel-3',
    user_id: 'user-patricia',
    author: SEED_PROFILES.find(p => p.id === 'user-patricia')!,
    video_url: 'https://assets.mixkit.co/videos/preview/mixkit-waves-coming-to-the-beach-5016-large.mp4',
    caption: 'Ocean therapy is the best therapy. Take 5 seconds to breathe. 🌊',
    music_title: 'Ocean Tides Ambient — Patricia Hayes',
    likes_count: 512,
    comments_count: 39,
    shares_count: 67,
    views_count: 2800,
    liked_by_me: true,
    saved_by_me: false,
    created_at: '2024-02-16T15:30:00Z'
  }
];

export const SEED_MATCHES: Match[] = [
  {
    id: 'match-1',
    user1_id: 'user-david',
    user2_id: 'user-sarah',
    user1: SEED_PROFILES.find(p => p.id === 'user-david')!,
    user2: SEED_PROFILES.find(p => p.id === 'user-sarah')!,
    created_at: '2024-02-14T18:00:00Z',
    last_message: "Would love to check out that new contemporary gallery opening this Friday!",
    last_message_time: '2h ago',
    unread_count: 1,
    compatibility_score: 96
  },
  {
    id: 'match-2',
    user1_id: 'user-david',
    user2_id: 'user-daniela',
    user1: SEED_PROFILES.find(p => p.id === 'user-david')!,
    user2: SEED_PROFILES.find(p => p.id === 'user-daniela')!,
    created_at: '2024-02-12T14:20:00Z',
    last_message: "That sourdough starter recipe was incredible, thanks David!",
    last_message_time: 'Yesterday',
    unread_count: 0,
    compatibility_score: 88
  }
];

export const SEED_CONNECTIONS: Connection[] = [
  {
    id: 'conn-1',
    requester_id: 'user-micheal',
    receiver_id: 'user-david',
    requester: SEED_PROFILES.find(p => p.id === 'user-micheal')!,
    receiver: SEED_PROFILES.find(p => p.id === 'user-david')!,
    status: 'ACCEPTED',
    created_at: '2024-02-05T10:00:00Z'
  },
  {
    id: 'conn-2',
    requester_id: 'user-derek',
    receiver_id: 'user-david',
    requester: SEED_PROFILES.find(p => p.id === 'user-derek')!,
    receiver: SEED_PROFILES.find(p => p.id === 'user-david')!,
    status: 'ACCEPTED',
    created_at: '2024-02-08T11:30:00Z'
  },
  {
    id: 'conn-3',
    requester_id: 'user-susan',
    receiver_id: 'user-david',
    requester: SEED_PROFILES.find(p => p.id === 'user-susan')!,
    receiver: SEED_PROFILES.find(p => p.id === 'user-david')!,
    status: 'PENDING',
    created_at: '2024-02-18T16:00:00Z'
  }
];

export const SEED_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-1',
    user_id: 'user-david',
    actor_id: 'user-sarah',
    actor: SEED_PROFILES.find(p => p.id === 'user-sarah')!,
    type: 'NEW_MATCH',
    title: "🎉 It's a Match!",
    message: 'You and Sarah Miller liked each other! Start a conversation now.',
    link_route: '/messages',
    is_read: false,
    created_at: '2024-02-18T16:45:00Z'
  },
  {
    id: 'notif-2',
    user_id: 'user-david',
    actor_id: 'user-jessica',
    actor: SEED_PROFILES.find(p => p.id === 'user-jessica')!,
    type: 'DATING_LIKE',
    title: 'New Like on Dating',
    message: 'Jessica Vance liked your dating profile!',
    link_route: '/likes',
    is_read: false,
    created_at: '2024-02-18T15:20:00Z'
  },
  {
    id: 'notif-3',
    user_id: 'user-david',
    actor_id: 'user-daniela',
    actor: SEED_PROFILES.find(p => p.id === 'user-daniela')!,
    type: 'COMMENT_POST',
    title: 'New Comment',
    message: 'Daniela Morales replied to your coffee meditation post.',
    link_route: '/home',
    is_read: true,
    created_at: '2024-02-18T14:10:00Z'
  },
  {
    id: 'notif-4',
    user_id: 'user-david',
    actor_id: 'user-susan',
    actor: SEED_PROFILES.find(p => p.id === 'user-susan')!,
    type: 'CONNECTION_REQUEST',
    title: 'Connection Request',
    message: 'Susan Thorne sent you a social connection request.',
    link_route: '/connections',
    is_read: false,
    created_at: '2024-02-18T16:00:00Z'
  }
];
