import React, { useState, useRef, useMemo } from 'react';
import {
  MapPin,
  Briefcase,
  GraduationCap,
  Heart,
  MessageCircle,
  UserPlus,
  UserCheck,
  Edit3,
  ShieldCheck,
  Sparkles,
  Camera,
  Image as ImageIcon,
  Video,
  X,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Play,
  Maximize2,
  Trash2,
  ZoomIn,
  FileSpreadsheet
} from 'lucide-react';
import { Profile } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { Avatar } from '../common/Avatar';
import { PostCard } from '../feed/PostCard';
import { MediaViewer, MediaViewerItem } from '../common/MediaViewer';
import { GoogleSheetsSyncModal } from '../sheets/GoogleSheetsSyncModal';
import {
  uploadMediaFile,
  validateMediaFile,
  UploadStage
} from '../../lib/uploadService';

interface ProfileViewProps {
  username?: string;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ username }) => {
  const { currentUser, allUsers, updateProfile } = useAuth();
  const {
    posts,
    reels,
    connections,
    sendConnectionRequest,
    likeProfile,
    openReportModal,
    navigate
  } = useApp();

  const [isEditing, setIsEditing] = useState(false);
  const [isSheetsModalOpen, setIsSheetsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'posts' | 'photos' | 'about'>('posts');
  const [mediaFilter, setMediaFilter] = useState<'all' | 'photos' | 'videos'>('all');

  // Media viewer state
  const [mediaViewerOpen, setMediaViewerOpen] = useState(false);
  const [mediaViewerIndex, setMediaViewerIndex] = useState(0);

  // Edit form state
  const [fullName, setFullName] = useState(currentUser.full_name);
  const [bio, setBio] = useState(currentUser.bio);
  const [location, setLocation] = useState(currentUser.location);
  const [profession, setProfession] = useState(currentUser.profession || '');
  const [avatarUrl, setAvatarUrl] = useState(currentUser.avatar_url);
  const [coverUrl, setCoverUrl] = useState(currentUser.cover_url || '');

  // File upload state for Avatar
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarZoom, setAvatarZoom] = useState<number>(1);
  const [avatarProgress, setAvatarProgress] = useState<number>(0);
  const [avatarStage, setAvatarStage] = useState<UploadStage>('idle');
  const [avatarError, setAvatarError] = useState<string | null>(null);

  // File upload state for Cover
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [coverZoom, setCoverZoom] = useState<number>(1);
  const [coverProgress, setCoverProgress] = useState<number>(0);
  const [coverStage, setCoverStage] = useState<UploadStage>('idle');
  const [coverError, setCoverError] = useState<string | null>(null);

  // Global saving state
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Target user profile
  const targetUser: Profile = (username
    ? allUsers.find((u) => u.username === username)
    : currentUser) || currentUser;

  const isMe = targetUser.id === currentUser.id;
  const isAdmin = currentUser.role === 'ADMIN' && (currentUser.id === 'user-suresh' || currentUser.email?.toLowerCase() === 'bohara.suresh8884@gmail.com');
  const userPosts = posts.filter((p) => p.user_id === targetUser.id);

  // Connection status with target user
  const connection = connections.find(
    (c) =>
      (c.requester_id === currentUser.id && c.receiver_id === targetUser.id) ||
      (c.requester_id === targetUser.id && c.receiver_id === currentUser.id)
  );

  // Compile user gallery media (Profile Photo, Cover, Post Photos, Post Videos)
  const galleryItems = useMemo<MediaViewerItem[]>(() => {
    const items: MediaViewerItem[] = [];

    // Profile photo
    if (targetUser.avatar_url) {
      items.push({
        url: targetUser.avatar_url,
        type: 'image',
        title: `${targetUser.full_name}'s Profile Photo`,
        authorName: targetUser.full_name,
        authorAvatar: targetUser.avatar_url
      });
    }

    // Cover photo
    if (targetUser.cover_url) {
      items.push({
        url: targetUser.cover_url,
        type: 'image',
        title: `${targetUser.full_name}'s Cover Photo`,
        authorName: targetUser.full_name,
        authorAvatar: targetUser.avatar_url
      });
    }

    // Post media
    userPosts.forEach((post) => {
      if (post.media && Array.isArray(post.media)) {
        post.media.forEach((m) => {
          items.push({
            url: m.url,
            type: m.type === 'video' ? 'video' : 'image',
            title: post.content ? post.content.slice(0, 50) : undefined,
            caption: post.content,
            authorName: targetUser.full_name,
            authorAvatar: targetUser.avatar_url,
            createdAt: post.created_at
          });
        });
      }
    });

    // Custom user photos list if separate
    if (targetUser.photos && Array.isArray(targetUser.photos)) {
      targetUser.photos.forEach((photoUrl) => {
        if (!items.some((i) => i.url === photoUrl)) {
          items.push({
            url: photoUrl,
            type: 'image',
            title: 'Uploaded Photo',
            authorName: targetUser.full_name,
            authorAvatar: targetUser.avatar_url
          });
        }
      });
    }

    // User Reels / Videos
    const userReels = reels.filter((r) => r.user_id === targetUser.id);
    userReels.forEach((reel) => {
      items.push({
        url: reel.video_url,
        type: 'video',
        title: reel.caption ? reel.caption.slice(0, 50) : `${targetUser.full_name}'s Video`,
        caption: reel.caption,
        authorName: targetUser.full_name,
        authorAvatar: targetUser.avatar_url,
        createdAt: reel.created_at
      });
    });

    return items;
  }, [targetUser, userPosts, reels]);

  // Filtered gallery items
  const filteredGalleryItems = useMemo(() => {
    if (mediaFilter === 'photos') return galleryItems.filter((i) => i.type === 'image');
    if (mediaFilter === 'videos') return galleryItems.filter((i) => i.type === 'video');
    return galleryItems;
  }, [galleryItems, mediaFilter]);

  const openViewerForGalleryItem = (index: number) => {
    setMediaViewerIndex(index);
    setMediaViewerOpen(true);
  };

  // Avatar selection handler
  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarError(null);
    const validation = validateMediaFile(file, ['image']);
    if (!validation.valid) {
      setAvatarError(validation.error || 'Invalid image file.');
      return;
    }

    setAvatarFile(file);
    const objectUrl = URL.createObjectURL(file);
    setAvatarPreview(objectUrl);
    setAvatarZoom(1);
    setAvatarStage('idle');
  };

  const cancelAvatarSelection = () => {
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    setAvatarFile(null);
    setAvatarPreview(null);
    setAvatarError(null);
    setAvatarStage('idle');
    if (avatarInputRef.current) avatarInputRef.current.value = '';
  };

  // Cover selection handler
  const handleCoverSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCoverError(null);
    const validation = validateMediaFile(file, ['image']);
    if (!validation.valid) {
      setCoverError(validation.error || 'Invalid cover image.');
      return;
    }

    setCoverFile(file);
    const objectUrl = URL.createObjectURL(file);
    setCoverPreview(objectUrl);
    setCoverZoom(1);
    setCoverStage('idle');
  };

  const cancelCoverSelection = () => {
    if (coverPreview) URL.revokeObjectURL(coverPreview);
    setCoverFile(null);
    setCoverPreview(null);
    setCoverError(null);
    setCoverStage('idle');
    if (coverInputRef.current) coverInputRef.current.value = '';
  };

  const handleRemoveCover = () => {
    cancelCoverSelection();
    setCoverUrl('');
  };

  // Open edit modal and sync fields
  const handleOpenEdit = () => {
    setFullName(currentUser.full_name);
    setBio(currentUser.bio || '');
    setLocation(currentUser.location || '');
    setProfession(currentUser.profession || '');
    setAvatarUrl(currentUser.avatar_url);
    setCoverUrl(currentUser.cover_url || '');
    cancelAvatarSelection();
    cancelCoverSelection();
    setSaveError(null);
    setIsEditing(true);
  };

  // Submit Profile Changes
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveError(null);

    let finalAvatarUrl = avatarUrl;
    let finalCoverUrl = coverUrl;

    try {
      // 1. Upload Avatar if new file was selected
      if (avatarFile) {
        setAvatarStage('uploading');
        const res = await uploadMediaFile(avatarFile, 'avatars', currentUser.id, {
          onProgress: (percent, stage) => {
            setAvatarProgress(percent);
            setAvatarStage(stage);
          }
        });
        finalAvatarUrl = res.url;
        setAvatarUrl(res.url);
      }

      // 2. Upload Cover if new file was selected
      if (coverFile) {
        setCoverStage('uploading');
        const res = await uploadMediaFile(coverFile, 'covers', currentUser.id, {
          onProgress: (percent, stage) => {
            setCoverProgress(percent);
            setCoverStage(stage);
          }
        });
        finalCoverUrl = res.url;
        setCoverUrl(res.url);
      }

      // 3. Save profile updates
      await updateProfile({
        full_name: fullName.trim(),
        bio: bio.trim(),
        location: location.trim(),
        profession: profession.trim(),
        avatar_url: finalAvatarUrl,
        cover_url: finalCoverUrl
      });

      setIsSaving(false);
      setIsEditing(false);
      cancelAvatarSelection();
      cancelCoverSelection();
    } catch (err: any) {
      console.error('Save profile error:', err);
      setIsSaving(false);
      setSaveError(err.message || 'Failed to upload image and update profile. Please try again.');
    }
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
              className="w-full h-full object-cover cursor-pointer"
              onClick={() => {
                const coverIdx = galleryItems.findIndex((i) => i.url === targetUser.cover_url);
                if (coverIdx !== -1) openViewerForGalleryItem(coverIdx);
              }}
            />
          )}
          {isMe && (
            <button
              onClick={handleOpenEdit}
              className="absolute top-4 right-4 px-3 py-1.5 rounded-2xl bg-black/60 backdrop-blur-md text-white text-xs font-semibold hover:bg-black/80 border border-white/20 transition flex items-center gap-1.5 shadow-lg"
            >
              <Camera className="w-3.5 h-3.5 text-pink-400" />
              <span>Change Cover</span>
            </button>
          )}
        </div>

        {/* Profile Info Row */}
        <div className="px-5 sm:px-8 pb-6 pt-0">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 -mt-16 sm:-mt-20 mb-4">
            <div className="relative">
              <div
                className="ring-4 ring-zinc-900 rounded-full bg-zinc-900 shadow-xl overflow-hidden cursor-pointer group"
                onClick={() => {
                  const avatarIdx = galleryItems.findIndex((i) => i.url === targetUser.avatar_url);
                  if (avatarIdx !== -1) openViewerForGalleryItem(avatarIdx);
                }}
              >
                <Avatar
                  src={targetUser.avatar_url}
                  name={targetUser.full_name}
                  size="2xl"
                  isOnline={targetUser.is_online}
                  isVerified={targetUser.is_verified}
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 rounded-full flex items-center justify-center transition">
                  <Maximize2 className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            {/* Profile Action Buttons */}
            <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
              {isMe ? (
                <>
                  {isAdmin && (
                    <button
                      id="sync-sheets-profile-btn"
                      onClick={() => setIsSheetsModalOpen(true)}
                      className="w-full sm:w-auto px-4 py-2 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30 transition flex items-center justify-center gap-2 shadow-sm"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      <span>Sync Google Sheets</span>
                    </button>
                  )}

                  <button
                    id="edit-profile-btn"
                    onClick={handleOpenEdit}
                    className="w-full sm:w-auto px-5 py-2 rounded-2xl bg-zinc-800 hover:bg-zinc-750 text-zinc-100 text-xs font-bold border border-zinc-700 transition flex items-center justify-center gap-2 shadow-sm"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-pink-400" />
                    <span>Edit Profile</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => likeProfile(targetUser.id, false)}
                    className="px-4 py-2 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 text-white text-xs font-bold shadow-md shadow-pink-500/20 hover:opacity-95 transition flex items-center gap-1.5"
                  >
                    <Heart className="w-3.5 h-3.5 fill-white" />
                    <span>Like</span>
                  </button>

                  <button
                    onClick={() => navigate('messages', { userId: targetUser.id })}
                    className="px-4 py-2 rounded-2xl bg-zinc-800 hover:bg-zinc-750 text-zinc-100 text-xs font-bold border border-zinc-700 transition flex items-center gap-1.5"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-pink-400" />
                    <span>Message</span>
                  </button>

                  <button
                    onClick={() => sendConnectionRequest(targetUser.id)}
                    className="px-4 py-2 rounded-2xl bg-zinc-800 hover:bg-zinc-750 text-zinc-100 text-xs font-bold border border-zinc-700 transition flex items-center gap-1.5"
                  >
                    {connection?.status === 'ACCEPTED' ? (
                      <>
                        <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Connected</span>
                      </>
                    ) : connection?.status === 'PENDING' ? (
                      <>
                        <UserCheck className="w-3.5 h-3.5 text-amber-400" />
                        <span>Requested</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Connect</span>
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* User Bio & Identity Details */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-black text-zinc-100 font-heading">
                {targetUser.full_name}, {targetUser.age}
              </h2>
              {targetUser.is_verified && (
                <span className="flex items-center gap-1 text-[11px] font-bold text-pink-400 bg-pink-500/10 px-2.5 py-0.5 rounded-full border border-pink-500/20">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Verified</span>
                </span>
              )}
            </div>

            <p className="text-xs text-zinc-400">
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
            Photos & Media ({galleryItems.length})
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

      {/* Tab Content: Photos & Media Gallery */}
      {activeTab === 'photos' && (
        <div className="bg-zinc-900 rounded-3xl p-5 border border-zinc-800 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-zinc-100 font-heading">
                Media Gallery
              </h3>
              <p className="text-xs text-zinc-400">
                Uploaded photos, covers, and video moments
              </p>
            </div>

            {/* Media category filter buttons */}
            <div className="flex items-center gap-1.5 bg-zinc-800/80 p-1 rounded-2xl border border-zinc-750 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setMediaFilter('all')}
                className={`px-3 py-1 rounded-xl text-xs font-semibold transition ${
                  mediaFilter === 'all'
                    ? 'bg-pink-600 text-white shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                All ({galleryItems.length})
              </button>
              <button
                type="button"
                onClick={() => setMediaFilter('photos')}
                className={`px-3 py-1 rounded-xl text-xs font-semibold transition flex items-center gap-1 ${
                  mediaFilter === 'photos'
                    ? 'bg-pink-600 text-white shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Photos</span>
              </button>
              <button
                type="button"
                onClick={() => setMediaFilter('videos')}
                className={`px-3 py-1 rounded-xl text-xs font-semibold transition flex items-center gap-1 ${
                  mediaFilter === 'videos'
                    ? 'bg-pink-600 text-white shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Video className="w-3.5 h-3.5" />
                <span>Videos</span>
              </button>
            </div>
          </div>

          {filteredGalleryItems.length === 0 ? (
            <div className="py-12 text-center text-zinc-500 text-xs">
              No {mediaFilter === 'all' ? 'media' : mediaFilter} found for {targetUser.full_name}.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
              {filteredGalleryItems.map((item, idx) => {
                const originalIndex = galleryItems.findIndex((i) => i.url === item.url);
                return (
                  <div
                    key={idx}
                    onClick={() => openViewerForGalleryItem(originalIndex >= 0 ? originalIndex : idx)}
                    className="group relative aspect-square rounded-2xl overflow-hidden bg-zinc-950 border border-zinc-800 cursor-pointer shadow-sm hover:border-pink-500/50 transition duration-200"
                  >
                    {item.type === 'video' ? (
                      <div className="w-full h-full relative bg-zinc-950 flex items-center justify-center">
                        <video
                          src={item.url}
                          preload="metadata"
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <div className="w-10 h-10 rounded-full bg-pink-600/90 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition">
                            <Play className="w-5 h-5 fill-white ml-0.5" />
                          </div>
                        </div>
                        <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/70 text-[10px] font-bold text-white uppercase tracking-wider backdrop-blur-xs flex items-center gap-1">
                          <Video className="w-3 h-3 text-pink-400" />
                          Video
                        </span>
                      </div>
                    ) : (
                      <>
                        <img
                          src={item.url}
                          alt={item.title || 'Media thumbnail'}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition flex items-end p-2.5">
                          <span className="text-white text-xs font-semibold truncate">
                            {item.title || 'View Photo'}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
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

      {/* Media Lightbox Viewer Modal */}
      <MediaViewer
        isOpen={mediaViewerOpen}
        onClose={() => setMediaViewerOpen(false)}
        items={galleryItems}
        initialIndex={mediaViewerIndex}
      />

      {/* Real-World Edit Profile Modal with Device File Uploads */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="bg-zinc-900 rounded-3xl p-6 w-full max-w-xl shadow-2xl border border-zinc-800 max-h-[92vh] overflow-y-auto text-zinc-100">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-zinc-800">
              <div>
                <h3 className="text-lg font-bold text-zinc-100 font-heading">
                  Edit Your Profile
                </h3>
                <p className="text-xs text-zinc-400">
                  Update your photos and personal details directly from your device
                </p>
              </div>
              <button
                type="button"
                onClick={() => !isSaving && setIsEditing(false)}
                disabled={isSaving}
                className="p-2 text-zinc-400 hover:text-zinc-100 rounded-full hover:bg-zinc-800 transition disabled:opacity-40"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {saveError && (
              <div className="mb-4 p-3 rounded-2xl bg-rose-950/40 border border-rose-800/50 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{saveError}</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-6">
              {/* =======================================================
                  1. PROFILE PHOTO SECTION (REAL DEVICE FILE UPLOAD)
                  ======================================================= */}
              <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-zinc-200 uppercase tracking-wider">
                    Profile Photo
                  </label>
                  <span className="text-[10px] text-zinc-400">JPG, PNG, WEBP (Max 15MB)</span>
                </div>

                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/*"
                  className="hidden"
                  onChange={handleAvatarSelect}
                />

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {/* Avatar Preview Box */}
                  <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-pink-500 shadow-md bg-zinc-900 shrink-0">
                    <img
                      src={avatarPreview || avatarUrl}
                      alt="Profile preview"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover transition duration-150"
                      style={{ transform: `scale(${avatarZoom})` }}
                    />
                    {avatarFile && (
                      <div className="absolute top-1 right-1 bg-pink-500 text-white p-0.5 rounded-full shadow-xs">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>

                  {/* Actions & Zoom Slider */}
                  <div className="flex-1 w-full space-y-2 text-center sm:text-left">
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                      <button
                        type="button"
                        id="change-profile-photo-btn"
                        onClick={() => avatarInputRef.current?.click()}
                        className="px-4 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-pink-600/20"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>{avatarFile ? 'Choose Different Photo' : 'Change Photo'}</span>
                      </button>

                      {avatarFile && (
                        <button
                          type="button"
                          onClick={cancelAvatarSelection}
                          className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition"
                        >
                          Cancel Selection
                        </button>
                      )}
                    </div>

                    {/* Positioning / Zoom slider if photo is selected */}
                    {avatarFile && (
                      <div className="pt-2 flex items-center gap-2">
                        <ZoomIn className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                        <span className="text-[11px] text-zinc-400 shrink-0">Crop Framing:</span>
                        <input
                          type="range"
                          min="1"
                          max="2"
                          step="0.05"
                          value={avatarZoom}
                          onChange={(e) => setAvatarZoom(parseFloat(e.target.value))}
                          className="w-32 accent-pink-500 cursor-pointer h-1.5 bg-zinc-700 rounded-lg"
                        />
                        <span className="text-[10px] text-zinc-400 font-mono">
                          {Math.round(avatarZoom * 100)}%
                        </span>
                      </div>
                    )}

                    {avatarError && (
                      <p className="text-[11px] text-rose-400 flex items-center gap-1 justify-center sm:justify-start">
                        <AlertCircle className="w-3.5 h-3.5" />
                        {avatarError}
                      </p>
                    )}

                    {/* Upload progress state indicator */}
                    {avatarStage === 'uploading' && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] text-zinc-300">
                          <span>Uploading photo...</span>
                          <span className="font-bold">{avatarProgress}%</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-pink-500 to-rose-500 transition-all duration-150"
                            style={{ width: `${avatarProgress}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* =======================================================
                  2. COVER PHOTO SECTION (REAL DEVICE FILE UPLOAD)
                  ======================================================= */}
              <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-zinc-200 uppercase tracking-wider">
                    Cover Photo
                  </label>
                  <span className="text-[10px] text-zinc-400">JPG, PNG, WEBP (Max 15MB)</span>
                </div>

                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/*"
                  className="hidden"
                  onChange={handleCoverSelect}
                />

                {/* Cover Preview Banner */}
                <div className="relative h-28 sm:h-36 rounded-2xl overflow-hidden bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-indigo-500/20 border border-zinc-800">
                  {coverPreview || coverUrl ? (
                    <img
                      src={coverPreview || coverUrl}
                      alt="Cover preview"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover transition duration-150"
                      style={{ transform: `scale(${coverZoom})` }}
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-zinc-500 gap-1">
                      <ImageIcon className="w-6 h-6 opacity-60" />
                      <span className="text-xs">No cover image set</span>
                    </div>
                  )}

                  {coverFile && (
                    <div className="absolute top-2 right-2 bg-pink-500 text-white px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 shadow-md">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Ready to upload</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      id="change-cover-photo-btn"
                      onClick={() => coverInputRef.current?.click()}
                      className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-750 text-zinc-100 text-xs font-bold border border-zinc-700 transition flex items-center gap-1.5"
                    >
                      <Camera className="w-3.5 h-3.5 text-pink-400" />
                      <span>{coverPreview || coverUrl ? 'Change Cover' : 'Upload Cover'}</span>
                    </button>

                    {(coverPreview || coverUrl) && (
                      <button
                        type="button"
                        id="remove-cover-photo-btn"
                        onClick={handleRemoveCover}
                        className="px-3 py-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 text-xs font-semibold border border-rose-800/40 transition flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove Cover</span>
                      </button>
                    )}
                  </div>

                  {coverFile && (
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-zinc-400">Framing:</span>
                      <input
                        type="range"
                        min="1"
                        max="2"
                        step="0.05"
                        value={coverZoom}
                        onChange={(e) => setCoverZoom(parseFloat(e.target.value))}
                        className="w-24 accent-pink-500 cursor-pointer h-1.5 bg-zinc-700 rounded-lg"
                      />
                    </div>
                  )}
                </div>

                {coverError && (
                  <p className="text-[11px] text-rose-400 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {coverError}
                  </p>
                )}

                {coverStage === 'uploading' && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-zinc-300">
                      <span>Uploading cover...</span>
                      <span className="font-bold">{coverProgress}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-pink-500 to-rose-500 transition-all duration-150"
                        style={{ width: `${coverProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* =======================================================
                  3. PROFILE TEXT DETAILS (NAME, BIO, LOCATION, PROFESSION)
                  ======================================================= */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full text-xs sm:text-sm p-3 rounded-2xl border border-zinc-700 bg-zinc-800 text-zinc-100 outline-none focus:ring-2 focus:ring-pink-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Bio / About You
                  </label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={3}
                    className="w-full text-xs sm:text-sm p-3 rounded-2xl border border-zinc-700 bg-zinc-800 text-zinc-100 outline-none focus:ring-2 focus:ring-pink-500"
                    placeholder="Tell your matches what makes you unique..."
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">
                      City / Location
                    </label>
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full text-xs p-3 rounded-2xl border border-zinc-700 bg-zinc-800 text-zinc-100 outline-none focus:ring-2 focus:ring-pink-500"
                      placeholder="e.g. San Francisco, CA"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">
                      Profession
                    </label>
                    <input
                      type="text"
                      value={profession}
                      onChange={(e) => setProfession(e.target.value)}
                      className="w-full text-xs p-3 rounded-2xl border border-zinc-700 bg-zinc-800 text-zinc-100 outline-none focus:ring-2 focus:ring-pink-500"
                      placeholder="e.g. Architect, Designer, Chef"
                    />
                  </div>
                </div>
              </div>

              {/* Modal Footer Controls */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => !isSaving && setIsEditing(false)}
                  disabled={isSaving}
                  className="px-4 py-2.5 text-xs font-semibold text-zinc-400 hover:text-zinc-200 rounded-xl transition disabled:opacity-40"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="save-profile-btn"
                  disabled={isSaving || !fullName.trim()}
                  className="px-6 py-2.5 text-xs font-bold bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl shadow-md shadow-pink-500/25 hover:opacity-95 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <UploadCloud className="w-4 h-4 animate-spin" />
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <span>Save Changes</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Google Sheets Sync Modal (Admin only) */}
      {isAdmin && (
        <GoogleSheetsSyncModal
          isOpen={isSheetsModalOpen}
          onClose={() => setIsSheetsModalOpen(false)}
        />
      )}
    </div>
  );
};
