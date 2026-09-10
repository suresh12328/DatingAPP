export type UserRole = 'USER' | 'MODERATOR' | 'ADMIN';
export type AccountStatus = 'PENDING_VERIFICATION' | 'ACTIVE' | 'SUSPENDED' | 'LOCKED' | 'DELETED' | 'BANNED';
export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'BANNED';
export type VerificationType = 'EMAIL' | 'PHONE';
export type Gender = 'WOMAN' | 'MAN' | 'NON_BINARY' | 'OTHER';
export type DatingPreference = 'MEN' | 'WOMEN' | 'EVERYONE';
export type RelationshipGoal = 'LONG_TERM' | 'CASUAL' | 'DATING' | 'FRIENDSHIP' | 'MARRIAGE' | 'NOT_SURE';

export interface DatingPreferences {
  ageRange?: [number, number];
  distanceKm?: number;
  genderPreference?: DatingPreference;
  relationshipGoals?: RelationshipGoal[];
  verifiedOnly?: boolean;

  // Modern dating filters format
  interested_in: DatingPreference;
  age_range: { min: number; max: number };
  max_distance_miles: number;
  only_verified: boolean;
}

export interface PrivacySettings {
  profileVisibility: 'PUBLIC' | 'FRIENDS_ONLY' | 'DATING_ONLY' | 'PRIVATE';
  whoCanMessageMe: 'EVERYONE' | 'MATCHES_AND_FRIENDS' | 'FRIENDS_ONLY';
  whoCanConnect: 'EVERYONE' | 'FRIENDS_OF_FRIENDS' | 'NO_ONE';
  datingVisible: boolean;
  showOnlineStatus: boolean;
  showLocation?: boolean;
  readReceipts: boolean;
}

export interface Profile {
  id: string;
  email: string;
  phone?: string;
  password_hash?: string;
  username: string;
  full_name: string;
  avatar_url: string;
  cover_url: string;
  bio: string;
  age: number;
  dob: string;
  gender: Gender;
  sexual_orientation?: string;
  dating_preference: DatingPreference;
  dating_preferences?: DatingPreferences;
  location: string;
  neighborhood?: string;
  profession: string;
  education: string;
  interests: string[];
  relationship_goal: RelationshipGoal;
  looking_for?: string;
  languages: string[];
  height_cm: number;
  height?: string;
  photos: string[];
  zodiac?: string;
  lifestyle: {
    drinking?: 'NEVER' | 'SOCIALLY' | 'FREQUENTLY';
    smoking?: 'NEVER' | 'SOCIALLY' | 'REGULARLY';
    workout?: 'DAILY' | 'OFTEN' | 'SOMETIMES' | 'NEVER';
    pets?: string;
    zodiac?: string;
  };
  is_verified: boolean;
  email_verified?: boolean;
  phone_verified?: boolean;
  is_online: boolean;
  last_active: string;
  role: UserRole;
  status: UserStatus;
  account_status?: AccountStatus;
  privacy: PrivacySettings;
  created_at: string;
  updated_at?: string;
  last_login_at?: string;
  failed_login_attempts?: number;
  locked_until?: string;
}

export interface PostMedia {
  url: string;
  type: 'image' | 'video';
  aspect_ratio?: string;
}

export interface CommentReply {
  id: string;
  comment_id: string;
  user_id: string;
  author: Profile;
  content: string;
  created_at: string;
  likes_count: number;
  liked_by_me?: boolean;
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  author: Profile;
  content: string;
  created_at: string;
  likes_count: number;
  liked_by_me?: boolean;
  replies: CommentReply[];
}

export interface Post {
  id: string;
  user_id: string;
  author: Profile;
  content: string;
  media: PostMedia[];
  feeling?: string;
  location?: string;
  tagged_users?: string[];
  likes_count: number;
  comments_count: number;
  shares_count: number;
  saved_by_me: boolean;
  liked_by_me: boolean;
  privacy: 'PUBLIC' | 'CONNECTIONS_ONLY' | 'PRIVATE';
  created_at: string;
  updated_at?: string;
  comments?: Comment[];
}

export interface StoryReaction {
  user_id: string;
  emoji: string;
}

export interface Story {
  id: string;
  user_id: string;
  author: Profile;
  media_url: string;
  media_type: 'image' | 'video';
  text_overlay?: string;
  views_count: number;
  created_at: string;
  expires_at: string;
  reactions: StoryReaction[];
  seen_by_current_user?: boolean;
}

export interface DatingLike {
  id: string;
  from_user_id: string;
  to_user_id: string;
  is_super_like: boolean;
  created_at: string;
}

export interface Match {
  id: string;
  user1_id: string;
  user2_id: string;
  user1: Profile;
  user2: Profile;
  created_at: string;
  last_message?: string;
  last_message_time?: string;
  unread_count?: number;
  compatibility_score: number;
}

export interface Connection {
  id: string;
  requester_id: string;
  receiver_id: string;
  requester: Profile;
  receiver: Profile;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  created_at: string;
}

export type MessageStatus = 'sent' | 'delivered' | 'read';

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  receiver_id: string;
  sender?: Profile;
  content: string;
  media_url?: string;
  media_type?: 'image' | 'video';
  reply_to_id?: string;
  status?: MessageStatus;
  delivered_at?: string;
  read_at?: string;
  is_read?: boolean;
  is_unsent?: boolean;
  created_at: string;
}

export interface Conversation {
  id: string;
  participant_ids: string[];
  other_user: Profile;
  other_user_id?: string;
  is_dating_match: boolean;
  last_message?: Message;
  unread_count: number;
  updated_at: string;
  is_muted?: boolean;
  muted_by?: string[];
  hidden_for?: string[];
  deleted_by?: string[];
}

export type NotificationType =
  | 'LIKE_POST'
  | 'COMMENT_POST'
  | 'COMMENT_REPLY'
  | 'SHARE_POST'
  | 'DATING_LIKE'
  | 'SUPER_LIKE'
  | 'NEW_MATCH'
  | 'CONNECTION_REQUEST'
  | 'CONNECTION_ACCEPTED'
  | 'NEW_MESSAGE'
  | 'STORY_REACTION'
  | 'STORY_REPLY'
  | 'PROFILE_VIEW'
  | 'SYSTEM';

export interface AppNotification {
  id: string;
  user_id: string;
  actor_id: string;
  actor: Profile;
  type: NotificationType;
  title: string;
  message: string;
  link_route: string;
  is_read: boolean;
  created_at: string;
}

export interface Reel {
  id: string;
  user_id: string;
  author: Profile;
  video_url: string;
  caption: string;
  music_title: string;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  views_count: number;
  liked_by_me: boolean;
  saved_by_me: boolean;
  created_at: string;
}

export type ReportReason =
  | 'FAKE_PROFILE'
  | 'HARASSMENT'
  | 'SPAM'
  | 'SCAM'
  | 'INAPPROPRIATE_CONTENT'
  | 'UNDERAGE'
  | 'OTHER';

export interface Report {
  id: string;
  reporter_id: string;
  reporter: Profile;
  target_type: 'USER' | 'POST' | 'STORY' | 'REEL' | 'MESSAGE';
  target_id: string;
  target_title?: string;
  reason: ReportReason;
  details: string;
  status: 'PENDING' | 'RESOLVED' | 'DISMISSED';
  created_at: string;
}

export interface Block {
  id: string;
  blocker_id: string;
  blocked_id: string;
  created_at: string;
}
