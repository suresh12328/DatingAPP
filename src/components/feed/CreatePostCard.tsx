import React, { useState, useRef } from 'react';
import {
  Image as ImageIcon,
  Video as VideoIcon,
  Smile,
  MapPin,
  Send,
  X,
  UploadCloud,
  AlertCircle,
  Play,
  Loader2,
  Navigation
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { Avatar } from '../common/Avatar';
import {
  uploadMediaFile,
  validateMediaFile,
  reverseGeocode,
  UploadStage
} from '../../lib/uploadService';

interface SelectedMediaItem {
  id: string;
  file: File;
  previewUrl: string;
  type: 'image' | 'video';
  uploadProgress: number;
  stage: UploadStage;
}

export const CreatePostCard: React.FC = () => {
  const { currentUser } = useAuth();
  const { createPost } = useApp();

  const [isExpanded, setIsExpanded] = useState(false);
  const [content, setContent] = useState('');
  const [selectedFeeling, setSelectedFeeling] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [privacy, setPrivacy] = useState<'PUBLIC' | 'CONNECTIONS_ONLY' | 'PRIVATE'>('PUBLIC');

  // Interactive panels
  const [showFeelingsPicker, setShowFeelingsPicker] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // File Inputs
  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // Selected media queue
  const [selectedMedia, setSelectedMedia] = useState<SelectedMediaItem[]>([]);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [overallProgress, setOverallProgress] = useState(0);

  const feelings = [
    'Feeling Romantic 💖',
    'Excited for dates ✨',
    'Craving comfort food 🍲',
    'Exploring the city 🌆',
    'Coffee vibes ☕',
    'Listening to indie music 🎶',
    'Relaxing in nature 🌿',
    'Grateful & happy 🌸',
    'Feeling adventurous 🚀',
    'Ready for the weekend 🎉'
  ];

  // Handle Photo selection from device
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setGeneralError(null);
    const newItems: SelectedMediaItem[] = [];

    // Check if user already has a video attached (posts can have multiple photos OR a video)
    const hasVideo = selectedMedia.some((m) => m.type === 'video');
    if (hasVideo) {
      setGeneralError('You cannot mix videos and photos in a single post. Remove the video first.');
      return;
    }

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const validation = validateMediaFile(file, ['image']);
      if (!validation.valid) {
        setGeneralError(validation.error || `File ${file.name} is invalid.`);
        continue;
      }

      newItems.push({
        id: `${Date.now()}-${i}-${Math.random().toString(36).substring(2, 7)}`,
        file,
        previewUrl: URL.createObjectURL(file),
        type: 'image',
        uploadProgress: 0,
        stage: 'idle'
      });
    }

    if (newItems.length > 0) {
      setSelectedMedia((prev) => [...prev, ...newItems]);
      setIsExpanded(true);
    }

    if (photoInputRef.current) photoInputRef.current.value = '';
  };

  // Handle Video selection from device
  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setGeneralError(null);
    const validation = validateMediaFile(file, ['video']);
    if (!validation.valid) {
      setGeneralError(validation.error || 'Invalid video file.');
      return;
    }

    // Clean up previous image object URLs if replacing
    selectedMedia.forEach((m) => URL.revokeObjectURL(m.previewUrl));

    const newItem: SelectedMediaItem = {
      id: `${Date.now()}-video`,
      file,
      previewUrl: URL.createObjectURL(file),
      type: 'video',
      uploadProgress: 0,
      stage: 'idle'
    };

    setSelectedMedia([newItem]);
    setIsExpanded(true);

    if (videoInputRef.current) videoInputRef.current.value = '';
  };

  // Remove individual media item
  const handleRemoveMedia = (id: string) => {
    setSelectedMedia((prev) => {
      const target = prev.find((m) => m.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((m) => m.id !== id);
    });
  };

  // Clear all media
  const handleClearAllMedia = () => {
    selectedMedia.forEach((m) => URL.revokeObjectURL(m.previewUrl));
    setSelectedMedia([]);
  };

  // Live Location detector using browser Geolocation + reverse geocoding
  const handleDetectLocation = () => {
    setLocationError(null);
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const geo = await reverseGeocode(latitude, longitude);
          setLocation(geo.label || `${geo.city}, ${geo.country}`);
          setIsLocating(false);
          setIsExpanded(true);
        } catch (err: any) {
          setLocationError('Unable to identify location name.');
          setIsLocating(false);
        }
      },
      (err) => {
        setIsLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          setLocationError('Location permission denied. Please allow location access in your browser.');
        } else {
          setLocationError('Unable to retrieve location. Please try again.');
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  // Submit Post with real uploads
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && selectedMedia.length === 0) return;

    setIsSubmitting(true);
    setGeneralError(null);
    setOverallProgress(5);

    try {
      const uploadedMediaResults: { url: string; type: 'image' | 'video' }[] = [];

      // Upload each attached media file sequentially with live progress
      for (let i = 0; i < selectedMedia.length; i++) {
        const item = selectedMedia[i];
        const res = await uploadMediaFile(item.file, 'posts', currentUser.id, {
          onProgress: (percent, stage) => {
            setSelectedMedia((prev) =>
              prev.map((m) => (m.id === item.id ? { ...m, uploadProgress: percent, stage } : m))
            );
            const overall = Math.round(((i + percent / 100) / selectedMedia.length) * 90);
            setOverallProgress(overall);
          }
        });

        uploadedMediaResults.push({
          url: res.url,
          type: res.type
        });
      }

      setOverallProgress(95);

      // Create post via context
      await createPost(
        content.trim(),
        uploadedMediaResults,
        selectedFeeling || undefined,
        location.trim() || undefined,
        privacy
      );

      // Clean up object URLs
      selectedMedia.forEach((m) => URL.revokeObjectURL(m.previewUrl));

      // Reset form
      setContent('');
      setSelectedMedia([]);
      setSelectedFeeling('');
      setLocation('');
      setIsExpanded(false);
      setShowFeelingsPicker(false);
      setIsSubmitting(false);
      setOverallProgress(0);
    } catch (err: any) {
      console.error('Submit post error:', err);
      setGeneralError(err.message || 'Failed to upload media and share post. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-zinc-900 rounded-3xl p-4 sm:p-5 border border-zinc-800 shadow-sm transition">
      {/* Hidden File Inputs */}
      <input
        ref={photoInputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,image/*"
        className="hidden"
        onChange={handlePhotoSelect}
      />
      <input
        ref={videoInputRef}
        type="file"
        accept="video/mp4,video/webm,video/quicktime,video/*"
        className="hidden"
        onChange={handleVideoSelect}
      />

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
            disabled={isSubmitting}
            placeholder={`What's on your mind, ${currentUser.full_name.split(' ')[0]}?`}
            className="w-full text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 bg-zinc-800/70 hover:bg-zinc-800 focus:bg-zinc-800/90 rounded-2xl p-3 border border-transparent focus:border-pink-500/50 focus:ring-2 focus:ring-pink-500/20 outline-none resize-none transition"
          />

          {/* Badges Preview: Feeling & Live Location */}
          {(selectedFeeling || location) && (
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
                  <MapPin className="w-3 h-3 text-indigo-400" />
                  <span>{location}</span>
                  <X
                    className="w-3 h-3 cursor-pointer hover:text-indigo-100 ml-1"
                    onClick={() => setLocation('')}
                  />
                </span>
              )}
            </div>
          )}

          {/* Location error message */}
          {locationError && (
            <div className="mt-2 text-xs text-rose-400 flex items-center gap-1.5 bg-rose-950/30 p-2 rounded-xl border border-rose-900/40">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{locationError}</span>
            </div>
          )}

          {/* General upload/post error */}
          {generalError && (
            <div className="mt-2 text-xs text-rose-400 flex items-center gap-1.5 bg-rose-950/30 p-2 rounded-xl border border-rose-900/40">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{generalError}</span>
            </div>
          )}

          {/* =======================================================
              MEDIA PREVIEW GALLERY (BEFORE POSTING)
              ======================================================= */}
          {selectedMedia.length > 0 && (
            <div className="mt-3 p-3 bg-zinc-800/60 rounded-2xl border border-zinc-750 space-y-2">
              <div className="flex items-center justify-between text-xs text-zinc-300">
                <span className="font-semibold">
                  Attached Media ({selectedMedia.length} {selectedMedia[0]?.type === 'video' ? 'video' : 'photo(s)'})
                </span>
                <button
                  type="button"
                  onClick={handleClearAllMedia}
                  className="text-xs text-zinc-400 hover:text-rose-400 transition"
                >
                  Clear All
                </button>
              </div>

              {/* Photos grid or single video preview */}
              {selectedMedia[0]?.type === 'video' ? (
                <div className="relative rounded-xl overflow-hidden bg-black aspect-video max-h-60 border border-zinc-700">
                  <video
                    src={selectedMedia[0].previewUrl}
                    controls
                    playsInline
                    className="w-full h-full object-contain"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveMedia(selectedMedia[0].id)}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 hover:bg-rose-600 text-white transition"
                    title="Remove Video"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className={`grid gap-2 ${
                  selectedMedia.length === 1
                    ? 'grid-cols-1 max-w-sm'
                    : selectedMedia.length === 2
                    ? 'grid-cols-2'
                    : 'grid-cols-3'
                }`}>
                  {selectedMedia.map((item, idx) => (
                    <div
                      key={item.id}
                      className="group relative aspect-square rounded-xl overflow-hidden bg-zinc-900 border border-zinc-700/80 shadow-xs"
                    >
                      <img
                        src={item.previewUrl}
                        alt="Selected photo"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveMedia(item.id)}
                        className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/70 hover:bg-rose-600 text-white transition shadow-md opacity-90 group-hover:opacity-100"
                        title="Remove Photo"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                      <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/60 text-[9px] font-mono text-zinc-300">
                        # {idx + 1}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Real upload progress bar during post submission */}
              {isSubmitting && (
                <div className="pt-2 space-y-1">
                  <div className="flex justify-between text-[11px] text-zinc-300">
                    <span className="flex items-center gap-1.5">
                      <UploadCloud className="w-3.5 h-3.5 text-pink-400 animate-pulse" />
                      <span>Uploading media files...</span>
                    </span>
                    <span className="font-bold font-mono">{overallProgress}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-pink-500 to-rose-500 transition-all duration-150"
                      style={{ width: `${overallProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Expandable Feelings picker */}
          {showFeelingsPicker && (
            <div className="mt-2 p-2 bg-zinc-800/95 rounded-2xl border border-zinc-750 grid grid-cols-2 gap-1.5 shadow-xl">
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

      {/* Action Bar: Photo, Video, Feeling, Location, Privacy, Post */}
      <div className="mt-3 pt-3 border-t border-zinc-800 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Photo Button */}
          <button
            type="button"
            id="post-photo-btn"
            onClick={() => photoInputRef.current?.click()}
            disabled={isSubmitting}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-emerald-400 hover:bg-emerald-950/40 transition disabled:opacity-40"
          >
            <ImageIcon className="w-4 h-4" />
            <span className="hidden sm:inline">Photo</span>
          </button>

          {/* Video Button */}
          <button
            type="button"
            id="post-video-btn"
            onClick={() => videoInputRef.current?.click()}
            disabled={isSubmitting}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-purple-400 hover:bg-purple-950/40 transition disabled:opacity-40"
          >
            <VideoIcon className="w-4 h-4" />
            <span className="hidden sm:inline">Video</span>
          </button>

          {/* Feeling Button */}
          <button
            type="button"
            onClick={() => {
              setIsExpanded(true);
              setShowFeelingsPicker(!showFeelingsPicker);
            }}
            disabled={isSubmitting}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-amber-400 hover:bg-amber-950/40 transition disabled:opacity-40"
          >
            <Smile className="w-4 h-4" />
            <span className="hidden sm:inline">Feeling</span>
          </button>

          {/* Location Button (Live Device Geolocation) */}
          <button
            type="button"
            id="post-location-btn"
            onClick={handleDetectLocation}
            disabled={isSubmitting || isLocating}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-950/40 transition disabled:opacity-40"
            title="Detect current location"
          >
            {isLocating ? (
              <Loader2 className="w-4 h-4 animate-spin text-rose-400" />
            ) : (
              <MapPin className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">
              {isLocating ? 'Locating...' : 'Location'}
            </span>
          </button>

          {/* Privacy Selector */}
          <select
            value={privacy}
            onChange={(e) => setPrivacy(e.target.value as any)}
            disabled={isSubmitting}
            className="text-[11px] font-semibold text-zinc-300 bg-zinc-800 border border-zinc-700 rounded-xl px-2.5 py-1.5 outline-none cursor-pointer hover:border-zinc-600 transition"
          >
            <option value="PUBLIC">🌍 Public</option>
            <option value="CONNECTIONS_ONLY">👥 Connections</option>
            <option value="PRIVATE">🔒 Only Me</option>
          </select>
        </div>

        {/* Submit Post Button */}
        <button
          id="submit-post-btn"
          onClick={handleSubmit}
          disabled={isSubmitting || (!content.trim() && selectedMedia.length === 0)}
          className="px-5 py-2 rounded-2xl bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 text-white text-xs sm:text-sm font-bold shadow-sm shadow-pink-500/25 hover:opacity-95 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1.5"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Posting...</span>
            </>
          ) : (
            <>
              <Send className="w-3.5 h-3.5" />
              <span>Post</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
