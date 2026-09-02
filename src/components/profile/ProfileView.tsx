import React, { useState } from 'react';
import {
  MapPin,
  Briefcase,
  GraduationCap,
  Calendar,
  Heart,
  MessageCircle,
  UserPlus,
  UserCheck,
  Edit3,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  Camera,
  Image as ImageIcon
} from 'lucide-react';
import { Profile } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { Avatar } from '../common/Avatar';
import { PostCard } from '../feed/PostCard';

interface ProfileViewProps {
  username?: string;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ username }) => {
  const { currentUser, allUsers, updateProfile } = useAuth();
  const {
    posts,
    connections,
    sendConnectionRequest,
    likeProfile,
    openReportModal,
    navigate
  } = useApp();

  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<'posts' | 'photos' | 'about'>('posts');

  // Edit form state
  const [fullName, setFullName] = useState(currentUser.full_name);
  const [bio, setBio] = useState(currentUser.bio);
  const [location, setLocation] = useState(currentUser.location);
  const [profession, setProfession] = useState(currentUser.profession || '');
  const [avatarUrl, setAvatarUrl] = useState(currentUser.avatar_url);
  const [coverUrl, setCoverUrl] = useState(currentUser.cover_url || '');

  // Target user profile
  const targetUser: Profile = (username
    ? allUsers.find((u) => u.username === username)
    : currentUser) || currentUser;

  const isMe = targetUser.id === currentUser.id;
  const userPosts = posts.filter((p) => p.user_id === targetUser.id);

  // Connection status with target user
  const connection = connections.find(
    (c) =>
      (c.requester_id === currentUser.id && c.receiver_id === targetUser.id) ||
      (c.requester_id === targetUser.id && c.receiver_id === currentUser.id)
  );

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      full_name: fullName,
      bio,
      location,
      profession,
      avatar_url: avatarUrl,
      cover_url: coverUrl
    });
    setIsEditing(false);
  };

  return (
    <div className="space-y-4">
      {/* Profile Header Banner Card */}
      <div className="bg-zinc-900 rounded-3xl overflow-hidden border border-zinc-800 shadow-sm">
        {/* Cover Photo */}
        <div className="relative h-44 sm:h-56 bg-gradient-to-r from-pink-500 via-rose-500 to-indigo-600">
          {targetUser.cover_url && (
            <img
              src={targetUser.cover_url}
              alt="Cover"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          )}
          {isMe && (
            <button
              onClick={() => setIsEditing(true)}
              className="absolute top-4 right-4 px-3 py-1.5 rounded-2xl bg-black/50 backdrop-blur-md text-white text-xs font-semibold hover:bg-black/70 border border-white/10 transition flex items-center gap-1.5"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Change Cover</span>
            </button>
          )}
        </div>

        {/* Profile Info Row */}
        <div className="px-5 sm:px-8 pb-6 pt-0">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 -mt-16 sm:-mt-20 mb-4">
            <div className="relative">
              <div className="ring-4 ring-zinc-900 rounded-full bg-zinc-900 shadow-xl overflow-hidden">
                <Avatar
                  src={targetUser.avatar_url}
                  name={targetUser.full_name}
                  size="2xl"
                  isOnline={targetUser.is_online}
                  isVerified={targetUser.is_verified}
                />
              </div>
            </div>

            {/* Profile Action Buttons */}
            <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
              {isMe ? (
                <button
                  id="edit-my-profile-btn"
                  onClick={() => setIsEditing(true)}
                  className="flex-1 sm:flex-none px-5 py-2.5 rounded-2xl bg-zinc-800 hover:bg-zinc-750 text-zinc-200 text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 border border-zinc-700/60"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Edit Profile</span>
                </button>
              ) : (
                <>
                  <button
                    id={`profile-like-btn-${targetUser.id}`}
                    onClick={() => likeProfile(targetUser.id)}
                    className="flex-1 sm:flex-none px-5 py-2.5 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 text-white text-xs sm:text-sm font-bold shadow-md shadow-pink-500/20 hover:opacity-95 transition flex items-center justify-center gap-2"
                  >
                    <Heart className="w-4 h-4 fill-white" />
                    <span>Dating Like</span>
                  </button>

                  <button
                    id={`profile-message-btn-${targetUser.id}`}
                    onClick={() => navigate('messages', { userId: targetUser.id })}
                    className="flex-1 sm:flex-none px-4 py-2.5 rounded-2xl bg-zinc-800 hover:bg-zinc-750 text-zinc-200 text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 border border-zinc-700/60"
                  >
                    <MessageCircle className="w-4 h-4 text-pink-400" />
                    <span>Message</span>
                  </button>

                  <button
                    id={`profile-connect-btn-${targetUser.id}`}
                    onClick={() => {
                      if (!connection) sendConnectionRequest(targetUser.id);
                    }}
                    className="p-2.5 rounded-2xl bg-zinc-800 hover:bg-zinc-750 text-zinc-300 transition border border-zinc-700/60"
                    title={
                      connection?.status === 'ACCEPTED'
                        ? 'Connected'
                        : connection?.status === 'PENDING'
                        ? 'Request Pending'
                        : 'Add Connection'
                    }
                  >
                    {connection?.status === 'ACCEPTED' ? (
                      <UserCheck className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <UserPlus className="w-5 h-5" />
                    )}
                  </button>

                  <button
                    onClick={() => openReportModal('USER', targetUser.id, targetUser.full_name)}
                    className="p-2.5 rounded-2xl bg-zinc-800 hover:bg-rose-950/40 text-zinc-400 hover:text-rose-400 transition border border-zinc-700/60"
                    title="Report user"
                  >
                    <ShieldAlert className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* User Bio Details */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold text-zinc-100 font-heading">
                {targetUser.full_name}
              </h1>
              <span className="text-xl text-zinc-500 font-light">
                {targetUser.age}
              </span>
              {targetUser.is_verified && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Verified</span>
                </span>
              )}
            </div>

            <p className="text-xs sm:text-sm text-zinc-400 font-medium">
              @{targetUser.username} · {targetUser.gender.toLowerCase()} · {targetUser.sexual_orientation || 'Straight'}
            </p>

            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed max-w-2xl pt-1">
              {targetUser.bio || 'Living life with purpose, adventure, and warmth.'}
            </p>

            {/* Quick Badges */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-400 pt-2">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-pink-400" />
                <span>{targetUser.neighborhood || targetUser.location}</span>
              </div>
              {targetUser.profession && (
                <div className="flex items-center gap-1.5">
                  <Briefcase className="w-4 h-4 text-indigo-400" />
                  <span>{targetUser.profession}</span>
                </div>
              )}
              {targetUser.education && (
                <div className="flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-emerald-400" />
                  <span>{targetUser.education}</span>
                </div>
              )}
              {targetUser.zodiac && (
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>{targetUser.zodiac}</span>
                </div>
              )}
            </div>

            {/* Interests Tags */}
            <div className="flex flex-wrap gap-1.5 pt-3">
              {targetUser.interests.map((interest) => (
                <span
                  key={interest}
                  className="px-3 py-1 rounded-full bg-zinc-800 text-pink-400 text-xs font-semibold border border-zinc-700/60"
                >
                  {interest}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-6 px-6 border-t border-zinc-800 text-xs sm:text-sm font-bold">
          <button
            onClick={() => setActiveTab('posts')}
            className={`py-3 border-b-2 transition ${
              activeTab === 'posts'
                ? 'border-pink-500 text-pink-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Posts ({userPosts.length})
          </button>
          <button
            onClick={() => setActiveTab('photos')}
            className={`py-3 border-b-2 transition ${
              activeTab === 'photos'
                ? 'border-pink-500 text-pink-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Photos ({(targetUser.photos || []).length})
          </button>
          <button
            onClick={() => setActiveTab('about')}
            className={`py-3 border-b-2 transition ${
              activeTab === 'about'
                ? 'border-pink-500 text-pink-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Dating & Lifestyle
          </button>
        </div>
      </div>

      {/* Tab Content: Posts */}
      {activeTab === 'posts' && (
        <div className="space-y-4">
          {userPosts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
          {userPosts.length === 0 && (
            <div className="bg-zinc-900 rounded-3xl p-8 text-center text-xs text-zinc-500 border border-zinc-800">
              No posts shared by {targetUser.full_name} yet.
            </div>
          )}
        </div>
      )}

      {/* Tab Content: Photos Gallery */}
      {activeTab === 'photos' && (
        <div className="bg-zinc-900 rounded-3xl p-5 border border-zinc-800 shadow-sm">
          <h3 className="text-sm font-bold text-zinc-100 mb-3">Photo Gallery</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {(targetUser.photos || [targetUser.avatar_url]).map((photo, i) => (
              <div key={i} className="aspect-square rounded-2xl overflow-hidden bg-zinc-950 border border-zinc-800">
                <img
                  src={photo}
                  alt="Gallery item"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover hover:scale-105 transition"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab Content: Dating & Lifestyle Info */}
      {activeTab === 'about' && (
        <div className="bg-zinc-900 rounded-3xl p-6 border border-zinc-800 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-wider">
            Dating & Relationship Goals
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 bg-zinc-800/80 rounded-2xl border border-zinc-750">
              <span className="text-zinc-400 block mb-1">Looking For</span>
              <span className="font-bold text-zinc-100 text-sm">
                {targetUser.looking_for || 'Long-term relationship'}
              </span>
            </div>
            <div className="p-3.5 bg-zinc-800/80 rounded-2xl border border-zinc-750">
              <span className="text-zinc-400 block mb-1">Interested In</span>
              <span className="font-bold text-zinc-100 text-sm">
                {targetUser.dating_preference}
              </span>
            </div>
            <div className="p-3.5 bg-zinc-800/80 rounded-2xl border border-zinc-750">
              <span className="text-zinc-400 block mb-1">Height</span>
              <span className="font-bold text-zinc-100 text-sm">
                {targetUser.height || '5 ft 8 in (173 cm)'}
              </span>
            </div>
            <div className="p-3.5 bg-zinc-800/80 rounded-2xl border border-zinc-750">
              <span className="text-zinc-400 block mb-1">Lifestyle & Vibe</span>
              <span className="font-bold text-zinc-100 text-sm">
                Coffee lover, foodie & active weekend explorer
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 rounded-3xl p-6 w-full max-w-lg shadow-2xl border border-zinc-800 max-h-[90vh] overflow-y-auto text-zinc-100">
            <h3 className="text-lg font-bold text-zinc-100 font-heading mb-4">
              Edit Your Profile
            </h3>
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full text-xs sm:text-sm p-3 rounded-2xl border border-zinc-700 bg-zinc-800 text-zinc-100 outline-none focus:ring-2 focus:ring-pink-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">Bio / About You</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  className="w-full text-xs sm:text-sm p-3 rounded-2xl border border-zinc-700 bg-zinc-800 text-zinc-100 outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">City / Location</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full text-xs p-3 rounded-2xl border border-zinc-700 bg-zinc-800 text-zinc-100 outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">Profession</label>
                  <input
                    type="text"
                    value={profession}
                    onChange={(e) => setProfession(e.target.value)}
                    className="w-full text-xs p-3 rounded-2xl border border-zinc-700 bg-zinc-800 text-zinc-100 outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">Avatar Photo URL</label>
                <input
                  type="url"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  className="w-full text-xs p-3 rounded-2xl border border-zinc-700 bg-zinc-800 text-zinc-100 outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">Cover Image URL</label>
                <input
                  type="url"
                  value={coverUrl}
                  onChange={(e) => setCoverUrl(e.target.value)}
                  className="w-full text-xs p-3 rounded-2xl border border-zinc-700 bg-zinc-800 text-zinc-100 outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-zinc-400 hover:text-zinc-200 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 text-xs font-bold bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl shadow-md shadow-pink-500/20"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
