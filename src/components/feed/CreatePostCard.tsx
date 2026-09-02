import React, { useState } from 'react';
import {
  Image as ImageIcon,
  Smile,
  MapPin,
  Globe,
  Users,
  Lock,
  Send,
  Sparkles,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { Avatar } from '../common/Avatar';

export const CreatePostCard: React.FC = () => {
  const { currentUser } = useAuth();
  const { createPost } = useApp();

  const [isExpanded, setIsExpanded] = useState(false);
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [selectedFeeling, setSelectedFeeling] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [privacy, setPrivacy] = useState<'PUBLIC' | 'CONNECTIONS_ONLY' | 'PRIVATE'>('PUBLIC');
  const [showFeelingsPicker, setShowFeelingsPicker] = useState(false);
  const [showLocationInput, setShowLocationInput] = useState(false);
  const [showImageInput, setShowImageInput] = useState(false);

  const feelings = [
    'Feeling Romantic 💖',
    'Excited for dates ✨',
    'Craving comfort food 🍲',
    'Exploring the city 🌆',
    'Coffee vibes ☕',
    'Listening to indie music 🎶',
    'Relaxing in nature 🌿',
    'Grateful & happy 🌸'
  ];

  const samplePostPhotos = [
    'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !imageUrl.trim()) return;

    const media = imageUrl.trim()
      ? [{ url: imageUrl.trim(), type: 'image' as const }]
      : [];

    createPost(
      content.trim(),
      media,
      selectedFeeling || undefined,
      location.trim() || undefined,
      privacy
    );

    // Reset form
    setContent('');
    setImageUrl('');
    setSelectedFeeling('');
    setLocation('');
    setIsExpanded(false);
    setShowImageInput(false);
    setShowFeelingsPicker(false);
    setShowLocationInput(false);
  };

  return (
    <div className="bg-zinc-900 rounded-3xl p-4 sm:p-5 border border-zinc-800 shadow-sm">
      <div className="flex items-start gap-3">
        <Avatar
          src={currentUser.avatar_url}
          name={currentUser.full_name}
          size="md"
          isOnline={currentUser.is_online}
          isVerified={currentUser.is_verified}
        />

        <div className="flex-1 min-w-0">
          <textarea
            id="create-post-textarea"
            rows={isExpanded ? 3 : 2}
            value={content}
            onFocus={() => setIsExpanded(true)}
            onChange={(e) => setContent(e.target.value)}
            placeholder={`What's on your mind, ${currentUser.full_name.split(' ')[0]}?`}
            className="w-full text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 bg-zinc-800/70 hover:bg-zinc-800 focus:bg-zinc-800/90 rounded-2xl p-3 border border-transparent focus:border-pink-500/50 focus:ring-2 focus:ring-pink-500/20 outline-none resize-none transition"
          />

          {/* Tag Badges Preview */}
          {(selectedFeeling || location || imageUrl) && (
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {selectedFeeling && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-pink-500/20 text-pink-300 text-xs font-medium rounded-full border border-pink-500/30">
                  <Smile className="w-3 h-3" />
                  <span>{selectedFeeling}</span>
                  <X
                    className="w-3 h-3 cursor-pointer hover:text-pink-100 ml-1"
                    onClick={() => setSelectedFeeling('')}
                  />
                </span>
              )}
              {location && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-500/20 text-indigo-300 text-xs font-medium rounded-full border border-indigo-500/30">
                  <MapPin className="w-3 h-3" />
                  <span>{location}</span>
                  <X
                    className="w-3 h-3 cursor-pointer hover:text-indigo-100 ml-1"
                    onClick={() => setLocation('')}
                  />
                </span>
              )}
            </div>
          )}

          {/* Expandable Image URL / Picker */}
          {showImageInput && (
            <div className="mt-3 p-3 bg-zinc-800/70 rounded-2xl border border-zinc-750 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-200">Add Photo URL</span>
                <X className="w-4 h-4 text-zinc-400 hover:text-zinc-200 cursor-pointer" onClick={() => setShowImageInput(false)} />
              </div>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="Paste image link (e.g. https://images.unsplash.com/...)"
                className="w-full text-xs bg-zinc-900 rounded-xl border border-zinc-700 text-zinc-100 p-2.5 focus:ring-2 focus:ring-pink-500 outline-none placeholder-zinc-500"
              />
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-zinc-400 font-medium">Quick samples:</span>
                {samplePostPhotos.map((img, idx) => (
                  <img
                    key={idx}
                    src={img}
                    alt="Sample"
                    onClick={() => setImageUrl(img)}
                    className="w-8 h-8 rounded-lg object-cover cursor-pointer hover:scale-105 border border-zinc-700 hover:border-pink-500"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Expandable Location input */}
          {showLocationInput && (
            <div className="mt-2 flex items-center gap-2">
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Where are you? (e.g. San Francisco, Mission Beach)"
                className="flex-1 text-xs bg-zinc-800/70 rounded-xl border border-zinc-750 text-zinc-100 p-2.5 focus:ring-2 focus:ring-pink-500 outline-none placeholder-zinc-500"
              />
              <button
                type="button"
                onClick={() => setShowLocationInput(false)}
                className="p-2 text-zinc-400 hover:text-zinc-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Expandable Feelings picker */}
          {showFeelingsPicker && (
            <div className="mt-2 p-2 bg-zinc-800/90 rounded-2xl border border-zinc-750 grid grid-cols-2 gap-1.5">
              {feelings.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => {
                    setSelectedFeeling(f);
                    setShowFeelingsPicker(false);
                  }}
                  className="text-left text-xs p-2 rounded-xl hover:bg-zinc-700 text-zinc-200 transition"
                >
                  {f}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Action Bar */}
      <div className="mt-3 pt-3 border-t border-zinc-800 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            type="button"
            onClick={() => {
              setIsExpanded(true);
              setShowImageInput(!showImageInput);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-emerald-400 hover:bg-emerald-950/40 transition"
          >
            <ImageIcon className="w-4 h-4" />
            <span className="hidden sm:inline">Photo</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setIsExpanded(true);
              setShowFeelingsPicker(!showFeelingsPicker);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-amber-400 hover:bg-amber-950/40 transition"
          >
            <Smile className="w-4 h-4" />
            <span className="hidden sm:inline">Feeling</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setIsExpanded(true);
              setShowLocationInput(!showLocationInput);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-950/40 transition"
          >
            <MapPin className="w-4 h-4" />
            <span className="hidden sm:inline">Location</span>
          </button>

          {/* Privacy selector */}
          <select
            value={privacy}
            onChange={(e) => setPrivacy(e.target.value as any)}
            className="text-[11px] font-semibold text-zinc-300 bg-zinc-800 border border-zinc-700 rounded-xl px-2.5 py-1.5 outline-none cursor-pointer"
          >
            <option value="PUBLIC">🌍 Public</option>
            <option value="CONNECTIONS_ONLY">👥 Connections</option>
            <option value="PRIVATE">🔒 Only Me</option>
          </select>
        </div>

        <button
          id="submit-post-btn"
          onClick={handleSubmit}
          disabled={!content.trim() && !imageUrl.trim()}
          className="px-5 py-2 rounded-2xl bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 text-white text-xs sm:text-sm font-bold shadow-sm shadow-pink-500/25 hover:opacity-95 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1.5"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Post</span>
        </button>
      </div>
    </div>
  );
};
