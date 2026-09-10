import React, { useState } from 'react';
import {
  Heart,
  X,
  Star,
  MapPin,
  Briefcase,
  GraduationCap,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Info,
  ShieldCheck,
  User,
  Flame
} from 'lucide-react';
import { Profile } from '../../types';
import { sanitizeProfile } from '../../lib/datingUtils';

interface DatingCardProps {
  profile: Profile;
  compatibilityScore?: number;
  mutualInterests?: string[];
  onLike: () => void;
  onPass: () => void;
  onSuperLike: () => void;
  onViewProfile?: () => void;
}

export const DatingCard: React.FC<DatingCardProps> = ({
  profile: rawProfile,
  compatibilityScore = 88,
  mutualInterests = [],
  onLike,
  onPass,
  onSuperLike,
  onViewProfile
}) => {
  const profile = sanitizeProfile(rawProfile);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [showFullDetails, setShowFullDetails] = useState(false);
  const [imageError, setImageError] = useState(false);

  const photos = profile.photos && profile.photos.length > 0
    ? profile.photos
    : [profile.avatar_url];

  const handleNextPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (photoIndex < photos.length - 1) {
      setPhotoIndex(p => p + 1);
    } else {
      setPhotoIndex(0);
    }
  };

  const handlePrevPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (photoIndex > 0) {
      setPhotoIndex(p => p - 1);
    } else {
      setPhotoIndex(photos.length - 1);
    }
  };

  const currentPhotoSrc = imageError
    ? profile.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80'
    : photos[photoIndex] || profile.avatar_url;

  return (
    <div
      id={`dating-card-${profile.id}`}
      className="relative w-full max-w-md mx-auto h-[600px] sm:h-[640px] rounded-3xl overflow-hidden shadow-2xl bg-zinc-900 select-none flex flex-col justify-between border border-zinc-800 transition-all"
    >
      {/* Background Image & Overlay */}
      <div className="absolute inset-0 bg-zinc-950">
        <img
          src={currentPhotoSrc}
          alt={profile.full_name}
          referrerPolicy="no-referrer"
          onError={() => setImageError(true)}
          className="w-full h-full object-cover transition-all duration-300"
        />
        {/* Cinematic gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-black/25 to-black/60 pointer-events-none" />
      </div>

      {/* Top Bar: Progress indicators & Badges */}
      <div className="relative z-20 p-4 space-y-2.5">
        {/* Photo segmented progress bars */}
        {photos.length > 1 && (
          <div className="flex items-center gap-1.5 w-full">
            {photos.map((_, idx) => (
              <div
                key={idx}
                className={`h-1.5 flex-1 rounded-full transition-all duration-200 ${
                  idx === photoIndex ? 'bg-white shadow-sm' : 'bg-white/30'
                }`}
              />
            ))}
          </div>
        )}

        <div className="flex items-center justify-between gap-2">
          {/* Status & Verification Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            {profile.is_online && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/85 backdrop-blur-md text-white text-[11px] font-bold shadow-sm">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                <span>Active now</span>
              </span>
            )}
            {profile.is_verified && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-500/85 backdrop-blur-md text-white text-[11px] font-bold shadow-sm">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Verified</span>
              </span>
            )}
            {/* Compatibility percentage badge */}
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-500/90 backdrop-blur-md text-white text-[11px] font-extrabold shadow-sm border border-pink-400/40">
              <Sparkles className="w-3.5 h-3.5 fill-white text-white" />
              <span>{compatibilityScore}% Match</span>
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {onViewProfile && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onViewProfile();
                }}
                className="p-2 rounded-full bg-black/40 backdrop-blur-md text-white/90 hover:text-white hover:bg-black/60 transition"
                title="View Full Profile"
              >
                <User className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowFullDetails(!showFullDetails);
              }}
              className="p-2 rounded-full bg-black/40 backdrop-blur-md text-white/90 hover:text-white hover:bg-black/60 transition"
              title="Toggle Profile Details"
            >
              <Info className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Tap Zones for Left/Right photo pagination */}
      <div className="absolute inset-x-0 top-16 bottom-40 z-10 flex">
        <div
          onClick={handlePrevPhoto}
          className="w-1/2 h-full cursor-pointer flex items-center pl-3 opacity-0 hover:opacity-100 transition"
          title="Previous Photo"
        >
          <div className="p-2 rounded-full bg-black/40 text-white backdrop-blur-sm shadow-md">
            <ChevronLeft className="w-5 h-5" />
          </div>
        </div>
        <div
          onClick={handleNextPhoto}
          className="w-1/2 h-full cursor-pointer flex items-center justify-end pr-3 opacity-0 hover:opacity-100 transition"
          title="Next Photo"
        >
          <div className="p-2 rounded-full bg-black/40 text-white backdrop-blur-sm shadow-md">
            <ChevronRight className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Bottom Profile Information & Actions */}
      <div className="relative z-20 p-5 text-white space-y-3 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-transparent pt-6">
        {/* Name, Age & Location */}
        <div>
          <div className="flex items-baseline gap-2 flex-wrap">
            <h2 className="text-2xl sm:text-3xl font-extrabold font-heading tracking-tight drop-shadow-md">
              {profile.full_name}
            </h2>
            <span className="text-2xl font-light opacity-90 drop-shadow-md">
              {profile.age}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs text-zinc-200 mt-1 drop-shadow-sm flex-wrap">
            <div className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-pink-400" />
              <span>{profile.neighborhood || profile.location || 'San Francisco, CA'}</span>
            </div>
            {profile.profession && (
              <div className="flex items-center gap-1">
                <Briefcase className="w-3.5 h-3.5 text-indigo-400" />
                <span>{profile.profession}</span>
              </div>
            )}
          </div>
        </div>

        {/* Bio */}
        <p className={`text-xs sm:text-sm text-zinc-200/90 leading-relaxed drop-shadow-sm ${showFullDetails ? '' : 'line-clamp-2'}`}>
          {profile.bio || "Looking to make meaningful connections & explore together."}
        </p>

        {/* Interests Pills (Highlights mutual interests) */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {profile.interests.slice(0, showFullDetails ? profile.interests.length : 4).map((interest) => {
            const isMutual = mutualInterests.some(m => m.toLowerCase() === interest.toLowerCase());
            return (
              <span
                key={interest}
                className={`px-2.5 py-1 rounded-full text-[11px] font-medium shadow-xs backdrop-blur-md ${
                  isMutual
                    ? 'bg-gradient-to-r from-pink-500/80 to-rose-500/80 text-white font-bold border border-pink-400/50'
                    : 'bg-white/20 text-white'
                }`}
              >
                {interest}
              </span>
            );
          })}
          {profile.interests.length > 4 && !showFullDetails && (
            <span className="px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-md text-[11px] text-white/80">
              +{profile.interests.length - 4} more
            </span>
          )}
        </div>

        {/* Expanded Info */}
        {showFullDetails && (
          <div className="pt-2 border-t border-white/20 grid grid-cols-2 gap-2 text-xs text-zinc-200">
            {profile.zodiac && (
              <div>
                <span className="text-white/60 text-[10px] block uppercase">Zodiac</span>
                <span className="font-semibold">{profile.zodiac}</span>
              </div>
            )}
            {profile.height && (
              <div>
                <span className="text-white/60 text-[10px] block uppercase">Height</span>
                <span className="font-semibold">{profile.height}</span>
              </div>
            )}
            {profile.relationship_goal && (
              <div className="col-span-2">
                <span className="text-white/60 text-[10px] block uppercase">Looking For</span>
                <span className="font-semibold capitalize">{profile.relationship_goal.toLowerCase().replace('_', ' ')}</span>
              </div>
            )}
          </div>
        )}

        {/* Interaction Action Buttons */}
        <div className="flex items-center justify-center gap-4 sm:gap-5 pt-2">
          {/* Pass Button */}
          <button
            id={`dating-pass-btn-${profile.id}`}
            onClick={onPass}
            className="w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-zinc-900/90 backdrop-blur-md text-rose-400 hover:text-rose-300 hover:bg-zinc-800 border border-zinc-700/80 flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition"
            title="Pass (Left Arrow)"
          >
            <X className="w-6 h-6 sm:w-7 sm:h-7" />
          </button>

          {/* Super Like Button */}
          <button
            id={`dating-superlike-btn-${profile.id}`}
            onClick={onSuperLike}
            className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-zinc-900/90 backdrop-blur-md text-indigo-400 hover:text-indigo-300 hover:bg-zinc-800 border border-zinc-700/80 flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition"
            title="Super Like (Up Arrow)"
          >
            <Star className="w-5 h-5 sm:w-6 sm:h-6 fill-indigo-400" />
          </button>

          {/* Like Button */}
          <button
            id={`dating-like-btn-${profile.id}`}
            onClick={onLike}
            className="w-15 h-15 sm:w-16 sm:h-16 rounded-full bg-gradient-to-tr from-pink-500 via-rose-500 to-pink-600 text-white flex items-center justify-center shadow-xl shadow-pink-500/40 hover:scale-110 active:scale-95 transition ring-4 ring-white/20"
            title="Like (Right Arrow)"
          >
            <Heart className="w-7 h-7 sm:w-8 sm:h-8 fill-white" />
          </button>

          {/* View Profile Button */}
          {onViewProfile && (
            <button
              id={`dating-view-profile-btn-${profile.id}`}
              onClick={onViewProfile}
              className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-zinc-900/90 backdrop-blur-md text-zinc-300 hover:text-white hover:bg-zinc-800 border border-zinc-700/80 flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition"
              title="View Full Profile"
            >
              <User className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
