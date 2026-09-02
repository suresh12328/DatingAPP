import React, { useState } from 'react';
import { motion } from 'motion/react';
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
  Flame
} from 'lucide-react';
import { Profile } from '../../types';

interface DatingCardProps {
  profile: Profile;
  onLike: () => void;
  onPass: () => void;
  onSuperLike: () => void;
  onViewProfile?: () => void;
}

export const DatingCard: React.FC<DatingCardProps> = ({
  profile,
  onLike,
  onPass,
  onSuperLike,
  onViewProfile
}) => {
  const [photoIndex, setPhotoIndex] = useState(0);
  const [showFullDetails, setShowFullDetails] = useState(false);

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

  return (
    <div
      id={`dating-card-${profile.id}`}
      className="relative w-full max-w-md mx-auto h-[620px] sm:h-[650px] rounded-3xl overflow-hidden shadow-2xl bg-slate-900 select-none flex flex-col justify-between border border-slate-800"
    >
      {/* Background Image */}
      <div className="absolute inset-0 bg-slate-950">
        <img
          src={photos[photoIndex]}
          alt={profile.full_name}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover transition-all duration-300"
        />
        {/* Gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-black/20 to-black/60 pointer-events-none" />
      </div>

      {/* Top Bar: Photo indicator pills & Online / Verified badges */}
      <div className="relative z-20 p-4 space-y-2">
        {/* Photo segmented progress bars */}
        {photos.length > 1 && (
          <div className="flex items-center gap-1.5 w-full">
            {photos.map((_, idx) => (
              <div
                key={idx}
                className={`h-1 flex-1 rounded-full transition-all duration-200 ${
                  idx === photoIndex ? 'bg-white shadow-xs' : 'bg-white/35'
                }`}
              />
            ))}
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {profile.is_online && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/80 backdrop-blur-md text-white text-[11px] font-semibold">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                <span>Active now</span>
              </span>
            )}
            {profile.is_verified && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-500/80 backdrop-blur-md text-white text-[11px] font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Verified</span>
              </span>
            )}
          </div>

          <button
            onClick={() => setShowFullDetails(!showFullDetails)}
            className="p-2 rounded-full bg-black/40 backdrop-blur-md text-white/90 hover:text-white transition"
            title="Details"
          >
            <Info className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Tap Zones for Left/Right photo pagination */}
      <div className="absolute inset-x-0 top-16 bottom-36 z-10 flex">
        <div
          onClick={handlePrevPhoto}
          className="w-1/2 h-full cursor-pointer flex items-center pl-2 opacity-0 hover:opacity-100 transition"
        >
          <div className="p-2 rounded-full bg-black/30 text-white backdrop-blur-xs">
            <ChevronLeft className="w-5 h-5" />
          </div>
        </div>
        <div
          onClick={handleNextPhoto}
          className="w-1/2 h-full cursor-pointer flex items-center justify-end pr-2 opacity-0 hover:opacity-100 transition"
        >
          <div className="p-2 rounded-full bg-black/30 text-white backdrop-blur-xs">
            <ChevronRight className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Bottom Profile Information */}
      <div className="relative z-20 p-5 sm:p-6 text-white space-y-3">
        {/* Name & Age */}
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-2xl sm:text-3xl font-extrabold font-heading tracking-tight drop-shadow-md">
              {profile.full_name}
            </h2>
            <span className="text-2xl font-light opacity-90 drop-shadow-md">
              {profile.age}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-200 mt-1 drop-shadow-sm flex-wrap">
            <div className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-pink-400" />
              <span>{profile.neighborhood || profile.location}</span>
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
        <p className={`text-xs sm:text-sm text-slate-200/90 leading-relaxed drop-shadow-sm ${showFullDetails ? '' : 'line-clamp-2'}`}>
          {profile.bio || "Looking to make meaningful connections & explore the city."}
        </p>

        {/* Interests Pills */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {profile.interests.slice(0, showFullDetails ? profile.interests.length : 4).map((interest) => (
            <span
              key={interest}
              className="px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-md text-[11px] font-medium text-white shadow-2xs"
            >
              {interest}
            </span>
          ))}
          {profile.interests.length > 4 && !showFullDetails && (
            <span className="px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-md text-[11px] text-white/80">
              +{profile.interests.length - 4} more
            </span>
          )}
        </div>

        {/* Expanded Info: Height, Zodiac, Looking For */}
        {showFullDetails && (
          <div className="pt-2 border-t border-white/20 grid grid-cols-2 gap-2 text-xs text-slate-200">
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
            {profile.looking_for && (
              <div className="col-span-2">
                <span className="text-white/60 text-[10px] block uppercase">Looking For</span>
                <span className="font-semibold">{profile.looking_for}</span>
              </div>
            )}
          </div>
        )}

        {/* Interaction Action Buttons */}
        <div className="flex items-center justify-center gap-5 pt-3">
          {/* Pass Button */}
          <button
            id={`dating-pass-btn-${profile.id}`}
            onClick={onPass}
            className="w-14 h-14 rounded-full bg-slate-900/80 backdrop-blur-md text-rose-400 hover:text-rose-500 hover:bg-white border border-slate-700/60 flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition"
            title="Pass"
          >
            <X className="w-7 h-7" />
          </button>

          {/* Super Like Button */}
          <button
            id={`dating-superlike-btn-${profile.id}`}
            onClick={onSuperLike}
            className="w-12 h-12 rounded-full bg-slate-900/80 backdrop-blur-md text-indigo-400 hover:text-indigo-500 hover:bg-white border border-slate-700/60 flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition"
            title="Super Like"
          >
            <Star className="w-6 h-6 fill-indigo-400" />
          </button>

          {/* Like Button */}
          <button
            id={`dating-like-btn-${profile.id}`}
            onClick={onLike}
            className="w-16 h-16 rounded-full bg-gradient-to-tr from-pink-500 via-rose-500 to-pink-600 text-white flex items-center justify-center shadow-xl shadow-pink-500/40 hover:scale-110 active:scale-95 transition ring-4 ring-white/20"
            title="Like"
          >
            <Heart className="w-8 h-8 fill-white" />
          </button>
        </div>
      </div>
    </div>
  );
};
