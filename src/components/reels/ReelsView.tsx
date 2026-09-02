import React, { useState } from 'react';
import {
  Film,
  Heart,
  MessageCircle,
  Share2,
  Music,
  Plus,
  X,
  Sparkles,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { Avatar } from '../common/Avatar';

export const ReelsView: React.FC = () => {
  const { currentUser } = useAuth();
  const { reels, likeReel, createReel, navigate } = useApp();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isCreatingReel, setIsCreatingReel] = useState(false);
  const [reelVideoUrl, setReelVideoUrl] = useState('');
  const [reelCaption, setReelCaption] = useState('');
  const [reelMusic, setReelMusic] = useState('');

  const currentReel = reels[currentIndex];

  const handleNext = () => {
    if (currentIndex < reels.length - 1) {
      setCurrentIndex((c) => c + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((c) => c - 1);
    }
  };

  const handleCreateReel = (e: React.FormEvent) => {
    e.preventDefault();
    if (reelVideoUrl.trim() && reelCaption.trim()) {
      createReel(
        reelVideoUrl.trim(),
        reelCaption.trim(),
        reelMusic.trim() || undefined
      );
      setReelVideoUrl('');
      setReelCaption('');
      setReelMusic('');
      setIsCreatingReel(false);
    }
  };

  const sampleVideos = [
    'https://assets.mixkit.co/videos/preview/mixkit-young-woman-skater-moving-forward-42795-large.mp4',
    'https://assets.mixkit.co/videos/preview/mixkit-hands-holding-a-cup-of-coffee-41656-large.mp4',
    'https://assets.mixkit.co/videos/preview/mixkit-girl-walking-on-a-wooden-bridge-by-the-sea-41221-large.mp4'
  ];

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* Top Bar with Create Reel */}
      <div className="w-full max-w-md bg-zinc-900 rounded-3xl p-4 border border-zinc-800 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <Film className="w-5 h-5 text-pink-400" />
          <h2 className="text-sm font-bold text-zinc-100 font-heading">
            LoveConnect Reels
          </h2>
        </div>

        <button
          onClick={() => setIsCreatingReel(true)}
          className="px-4 py-2 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 text-white text-xs font-bold shadow-xs hover:opacity-95 transition flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Upload Reel</span>
        </button>
      </div>

      {/* Main Reel Screen */}
      {currentReel && (
        <div className="relative w-full max-w-sm h-[640px] sm:h-[680px] bg-zinc-950 rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between select-none border border-zinc-800">
          {/* Video element */}
          <video
            src={currentReel.video_url}
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          />

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/85 pointer-events-none" />

          {/* Top nav */}
          <div className="relative z-20 p-4 flex items-center justify-between text-white">
            <span className="text-xs font-bold tracking-wider uppercase bg-black/50 px-3 py-1 rounded-full backdrop-blur-xs border border-white/10">
              Reel {currentIndex + 1} of {reels.length}
            </span>
          </div>

          {/* Right Floating Actions */}
          <div className="absolute right-3 bottom-20 z-20 flex flex-col items-center gap-4 text-white">
            <button
              onClick={() => likeReel(currentReel.id)}
              className="flex flex-col items-center gap-1 group"
            >
              <div
                className={`p-3 rounded-full backdrop-blur-md transition ${
                  currentReel.liked_by_me
                    ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/40'
                    : 'bg-black/50 hover:bg-black/70 text-white border border-white/10'
                }`}
              >
                <Heart
                  className={`w-6 h-6 ${currentReel.liked_by_me ? 'fill-white' : ''}`}
                />
              </div>
              <span className="text-[11px] font-bold drop-shadow-md">
                {currentReel.likes_count}
              </span>
            </button>

            <button className="flex flex-col items-center gap-1 group">
              <div className="p-3 rounded-full bg-black/50 hover:bg-black/70 border border-white/10 backdrop-blur-md transition">
                <MessageCircle className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-bold drop-shadow-md">
                {currentReel.comments_count}
              </span>
            </button>

            <button
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
              }}
              className="flex flex-col items-center gap-1 group"
            >
              <div className="p-3 rounded-full bg-black/50 hover:bg-black/70 border border-white/10 backdrop-blur-md transition">
                <Share2 className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-bold drop-shadow-md">Share</span>
            </button>
          </div>

          {/* Bottom Info Row */}
          <div className="relative z-20 p-5 text-white space-y-2 max-w-[80%]">
            <div
              onClick={() => navigate('profile', { username: currentReel.author.username })}
              className="flex items-center gap-2.5 cursor-pointer"
            >
              <Avatar
                src={currentReel.author.avatar_url}
                name={currentReel.author.full_name}
                size="sm"
                isVerified={currentReel.author.is_verified}
              />
              <span className="text-sm font-bold drop-shadow-md hover:underline">
                {currentReel.author.full_name}
              </span>
            </div>

            <p className="text-xs text-white/90 drop-shadow-md line-clamp-2">
              {currentReel.caption}
            </p>

            {currentReel.music_title && (
              <div className="flex items-center gap-2 text-[11px] text-white/80 drop-shadow-md">
                <Music className="w-3.5 h-3.5 animate-spin" />
                <span className="truncate">{currentReel.music_title}</span>
              </div>
            )}
          </div>

          {/* Up & Down arrows */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-2">
            <button
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className={`p-2 rounded-full bg-black/50 text-white border border-white/10 backdrop-blur-xs transition ${
                currentIndex === 0 ? 'opacity-30' : 'hover:bg-black/80'
              }`}
            >
              <ChevronUp className="w-5 h-5" />
            </button>
            <button
              onClick={handleNext}
              disabled={currentIndex === reels.length - 1}
              className={`p-2 rounded-full bg-black/50 text-white border border-white/10 backdrop-blur-xs transition ${
                currentIndex === reels.length - 1 ? 'opacity-30' : 'hover:bg-black/80'
              }`}
            >
              <ChevronDown className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Upload Reel Modal */}
      {isCreatingReel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 rounded-3xl p-6 w-full max-w-md shadow-2xl border border-zinc-800 text-zinc-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-zinc-100">Upload Video Reel</h3>
              <button onClick={() => setIsCreatingReel(false)}>
                <X className="w-5 h-5 text-zinc-400 hover:text-zinc-100" />
              </button>
            </div>

            <form onSubmit={handleCreateReel} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Video URL (mp4)
                </label>
                <input
                  type="url"
                  value={reelVideoUrl}
                  onChange={(e) => setReelVideoUrl(e.target.value)}
                  placeholder="https://...mp4"
                  required
                  className="w-full text-xs p-3 rounded-2xl border border-zinc-700 bg-zinc-800 text-zinc-100 outline-none focus:ring-2 focus:ring-pink-500 placeholder-zinc-500"
                />
              </div>

              {/* Sample video shortcuts */}
              <div>
                <span className="text-[10px] text-zinc-400 font-semibold block mb-1">
                  Or pick a royalty-free sample:
                </span>
                <div className="flex flex-col gap-1">
                  {sampleVideos.map((vid, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setReelVideoUrl(vid)}
                      className="text-left text-xs p-2 rounded-xl bg-zinc-800 hover:bg-zinc-750 text-zinc-300 hover:text-pink-400 truncate border border-zinc-750"
                    >
                      Sample #{idx + 1}: {vid.split('/').pop()}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">Caption</label>
                <input
                  type="text"
                  value={reelCaption}
                  onChange={(e) => setReelCaption(e.target.value)}
                  placeholder="Tell people what's happening..."
                  required
                  className="w-full text-xs p-3 rounded-2xl border border-zinc-700 bg-zinc-800 text-zinc-100 outline-none focus:ring-2 focus:ring-pink-500 placeholder-zinc-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Music / Sound Track Title
                </label>
                <input
                  type="text"
                  value={reelMusic}
                  onChange={(e) => setReelMusic(e.target.value)}
                  placeholder="e.g. Original Audio - Summer Vibes"
                  className="w-full text-xs p-3 rounded-2xl border border-zinc-700 bg-zinc-800 text-zinc-100 outline-none focus:ring-2 focus:ring-pink-500 placeholder-zinc-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreatingReel(false)}
                  className="px-4 py-2.5 text-xs text-zinc-400 hover:text-zinc-200 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 text-xs font-bold bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl shadow-md shadow-pink-500/20"
                >
                  Publish Reel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
