import { Profile, DatingPreferences, DatingPreference } from '../types';

export const DEFAULT_DATING_PREFERENCES: DatingPreferences = {
  interested_in: 'EVERYONE',
  age_range: { min: 18, max: 45 },
  max_distance_miles: 50,
  only_verified: false,
  genderPreference: 'EVERYONE',
  ageRange: [18, 45],
  distanceKm: 80,
  relationshipGoals: ['LONG_TERM', 'DATING'],
  verifiedOnly: false
};

export function getDefaultDatingPreferences(userOrPrefs?: Partial<Profile> | Partial<DatingPreferences> | null): DatingPreferences {
  if (!userOrPrefs) return { ...DEFAULT_DATING_PREFERENCES };

  const isProfile = 'dating_preferences' in userOrPrefs || 'email' in userOrPrefs || 'username' in userOrPrefs;
  const existing: Partial<DatingPreferences> | undefined = isProfile
    ? (userOrPrefs as Partial<Profile>).dating_preferences
    : (userOrPrefs as Partial<DatingPreferences>);

  const pref = isProfile ? (userOrPrefs as Partial<Profile>).dating_preference : undefined;

  return {
    ...DEFAULT_DATING_PREFERENCES,
    ...existing,
    interested_in: existing?.interested_in || (pref as DatingPreference) || 'EVERYONE',
    age_range: existing?.age_range || {
      min: existing?.ageRange ? existing.ageRange[0] : 18,
      max: existing?.ageRange ? existing.ageRange[1] : 45
    },
    max_distance_miles: existing?.max_distance_miles || existing?.distanceKm || 50,
    only_verified: existing?.only_verified ?? existing?.verifiedOnly ?? false,
    genderPreference: existing?.genderPreference || (pref as DatingPreference) || 'EVERYONE',
    ageRange: existing?.ageRange || [18, 45],
    distanceKm: existing?.distanceKm || 80,
    relationshipGoals: existing?.relationshipGoals || ['LONG_TERM', 'DATING'],
    verifiedOnly: existing?.verifiedOnly ?? false
  };
}

export function sanitizeProfile(user: any): Profile {
  if (!user) {
    return {
      id: 'fallback-user',
      email: 'member@loveconnect.com',
      username: 'member',
      full_name: 'LoveConnect Member',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
      cover_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
      bio: 'Looking for meaningful connections & authentic moments.',
      age: 25,
      dob: '1999-01-01',
      gender: 'WOMAN',
      dating_preference: 'EVERYONE',
      location: 'San Francisco, CA',
      neighborhood: 'Downtown',
      profession: 'Member',
      education: 'University',
      interests: ['Art', 'Coffee', 'Travel', 'Music'],
      relationship_goal: 'LONG_TERM',
      languages: ['English'],
      height_cm: 170,
      photos: ['https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80'],
      lifestyle: {
        drinking: 'SOCIALLY',
        smoking: 'NEVER',
        workout: 'OFTEN'
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
        readReceipts: true
      },
      created_at: new Date().toISOString()
    };
  }

  const avatar = user.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80';
  const photos = Array.isArray(user.photos) && user.photos.length > 0 ? user.photos : [avatar];
  const interests = Array.isArray(user.interests) ? user.interests : ['Travel', 'Music', 'Foodie'];

  return {
    ...user,
    id: user.id || `user-${Date.now()}`,
    full_name: user.full_name || user.username || 'LoveConnect Member',
    username: user.username || 'member',
    email: user.email || 'user@loveconnect.com',
    avatar_url: avatar,
    photos,
    interests,
    age: typeof user.age === 'number' ? user.age : 24,
    location: user.location || 'San Francisco, CA',
    neighborhood: user.neighborhood || user.location?.split(',')[0] || 'Downtown',
    profession: user.profession || 'Creative Professional',
    bio: user.bio || 'Excited to chat and discover great experiences together.',
    gender: user.gender || 'WOMAN',
    dating_preference: user.dating_preference || 'EVERYONE',
    is_verified: Boolean(user.is_verified),
    is_online: Boolean(user.is_online),
    relationship_goal: user.relationship_goal || 'LONG_TERM',
    privacy: {
      profileVisibility: user.privacy?.profileVisibility || 'PUBLIC',
      whoCanMessageMe: user.privacy?.whoCanMessageMe || 'EVERYONE',
      whoCanConnect: user.privacy?.whoCanConnect || 'EVERYONE',
      datingVisible: user.privacy?.datingVisible ?? true,
      showOnlineStatus: user.privacy?.showOnlineStatus ?? true,
      readReceipts: user.privacy?.readReceipts ?? true
    }
  };
}

export function calculateMatchDetails(userA: Profile, userB: Profile): {
  score: number;
  mutualInterests: string[];
} {
  const safeA = sanitizeProfile(userA);
  const safeB = sanitizeProfile(userB);

  const mutualInterests = safeA.interests.filter(i =>
    safeB.interests.some(other => other.toLowerCase() === i.toLowerCase())
  );

  let score = 72;
  score += Math.min(mutualInterests.length * 6, 20);

  if (safeA.relationship_goal === safeB.relationship_goal) {
    score += 8;
  }

  if (safeA.lifestyle?.workout && safeA.lifestyle.workout === safeB.lifestyle?.workout) {
    score += 3;
  }

  return {
    score: Math.min(99, Math.max(68, score)),
    mutualInterests
  };
}
