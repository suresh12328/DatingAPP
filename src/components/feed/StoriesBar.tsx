import React, { useState, useRef } from 'react';
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Image as ImageIcon,
  Video as VideoIcon,
  X,
  MapPin,
  Globe,
  Users,
  UploadCloud,
  AlertCircle,
  Play,
  Loader2,
  Trash2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { Avatar } from '../common/Avatar';
import { StoryViewerModal } from './StoryViewerModal';
import {
  uploadMediaFile,
  validateMediaFile,
  reverseGeocode,
  UploadStage
} from '../../lib/uploadService';

export const StoriesBar: React.FC = () => {
  const { currentUser } = useAuth();
  const { stories, createStory, activeStoryIndex, openStoryViewer, closeStoryViewer } = useApp();

  const [isCreatingStory, setIsCreatingStory] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // File Inputs
  const storyPhotoInputRef = useRef<HTMLInputElement>(null);
  const storyVideoInputRef = useRef<HTMLInputElement>(null);

  // Story Creation State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [storyCaption, setStoryCaption] = useState('');
  const [storyLocation, setStoryLocation] = useState('');
  const [storyAudience, setStoryAudience] = useState<'PUBLIC' | 'CONNECTIONS_ONLY'>('PUBLIC');

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStage, setUploadStage] = useState<UploadStage>('idle');
  const [storyError, setStoryError] = useState<string | null>(null);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -220 : 220;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Handle Photo selection from device
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setStoryError(null);
    const validation = validateMediaFile(file, ['image']);
    if (!validation.valid) {
      setStoryError(validation.error || 'Invalid photo format.');
      return;
    }

    if (previewUrl) URL.revokeObjectURL(previewUrl);

    setSelectedFile(file);
    setMediaType('image');
    setPreviewUrl(URL.createObjectURL(file));
    if (storyPhotoInputRef.current) storyPhotoInputRef.current.value = '';
  };

  // Handle Video selection from device
  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setStoryError(null);
    const validation = validateMediaFile(file, ['video']);
    if (!validation.valid) {
      setStoryError(validation.error || 'Invalid video format.');
      return;
    }

    if (previewUrl) URL.revokeObjectURL(previewUrl);

    setSelectedFile(file);
    setMediaType('video');
    setPreviewUrl(URL.createObjectURL(file));
    if (storyVideoInputRef.current) storyVideoInputRef.current.value = '';
  };

  const handleClearSelected = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(null);
    setPreviewUrl(null);
    setStoryError(null);
    setUploadProgress(0);
    setUploadStage('idle');
  };

  // Detect location for story
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setStoryError('Geolocation is not supported by your browser.');
      return;
    }

    setIsDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const geo = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
          setStoryLocation(geo.label || `${geo.city}, ${geo.country}`);
          setIsDetectingLocation(false);
        } catch {
          setIsDetectingLocation(false);
        }
      },
      () => {
        setIsDetectingLocation(false);
        setStoryError('Location permission denied or unavailable.');
      },
      { timeout: 8000 }
    );
  };

  // Reset modal state
  const handleCloseModal = () => {
    if (isUploading) return;
    handleClearSelected();
    setStoryCaption('');
    setStoryLocation('');
    setIsCreatingStory(false);
  };

  // Submit Story with real device upload
  const handleCreateStorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setStoryError('Please select a photo or video for your story.');
      return;
    }

    setIsUploading(true);
    setStoryError(null);
    setUploadProgress(10);
    setUploadStage('uploading');

    try {
      // 1. Real upload to backend/storage
      const res = await uploadMediaFile(selectedFile, 'stories', currentUser.id, {
        onProgress: (percent, stage) => {
          setUploadProgress(percent);
          setUploadStage(stage);
        }
      });

      // 2. Build text sticker / location overlay
      let fullText = storyCaption.trim();
      if (storyLocation.trim()) {
        fullText = fullText ? `${fullText} • 📍 ${storyLocation.trim()}` : `📍 ${storyLocation.trim()}`;
      }

      // 3. Create story in store/database
      await createStory(res.url, res.type, fullText || undefined);

      // 4. Close and clean up
      handleClearSelected();
      setStoryCaption('');
      setStoryLocation('');
      setIsUploading(false);
      setIsCreatingStory(false);
    } catch (err: any) {
      console.error('Story upload error:', err);
      setStoryError(err.message || 'Failed to upload story. Please try again.');
      setIsUploading(false);
    }
  };

  return (
    <section className="bg-zinc-900 rounded-3xl p-4 border border-zinc-800 shadow-sm relative">
      {/* Hidden file inputs */}
      <input
        ref={storyPhotoInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/*"
        className="hidden"
        onChange={handlePhotoSelect}
      />
      <input
        ref={storyVideoInputRef}
        type="file"
        accept="video/mp4,video/webm,video/quicktime,video/*"
        className="hidden"
        onChange={handleVideoSelect}
      />

      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <h3 className="text-sm font-bold text-zinc-100 font-heading">
            Online in your neighbourhood
          </h3>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => scroll('left')}
            className="p-1.5 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition"
            title="Previous"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="p-1.5 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition"
            title="Next"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Stories Scroll Container */}
      <div
        ref={scrollContainerRef}
        className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-1 pt-1"
      >
        {/* Create Story Card */}
        <div
          id="create-story-card"
          onClick={() => setIsCreatingStory(true)}
          className="relative w-28 sm:w-32 h-44 sm:h-48 rounded-2xl overflow-hidden shrink-0 cursor-pointer group bg-gradient-to-b from-zinc-800 to-zinc-850 border border-zinc-700/60 flex flex-col justify-between p-2.5 shadow-sm hover:border-pink-500/60 transition"
        >
          <div className="w-full h-28 overflow-hidden rounded-xl bg-zinc-800">
            <img
              src={currentUser.avatar_url}
              alt="My Avatar"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
            />
          </div>
          <div className="relative z-10 flex flex-col items-center text-center -mt-5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 text-white flex items-center justify-center shadow-md ring-2 ring-zinc-900 group-hover:scale-110 transition">
              <Plus className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-bold text-zinc-200 mt-1">Create Story</span>
          </div>
        </div>

        {/* Stories from Users */}
        {stories.map((story, idx) => (
          <div
            key={story.id}
            id={`story-card-${story.id}`}
            onClick={() => openStoryViewer(idx)}
            className="relative w-28 sm:w-32 h-44 sm:h-48 rounded-2xl overflow-hidden shrink-0 cursor-pointer group shadow-sm hover:shadow-md transition bg-zinc-950 select-none border border-zinc-800/80 hover:border-pink-500/50"
          >
            {/* Story Thumbnail / Video Indicator */}
            {story.media_type === 'video' || /\.(mp4|webm|mov)$/i.test(story.media_url) ? (
              <div className="w-full h-full relative bg-zinc-950">
                <video
                  src={story.media_url}
                  preload="metadata"
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300 brightness-90"
                />
                <div className="absolute top-2.5 right-2.5 z-20 p-1 rounded-md bg-black/60 text-white">
                  <Play className="w-3 h-3 fill-white" />
                </div>
              </div>
            ) : (
              <img
                src={story.media_url}
                alt={story.author.full_name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition duration-300 brightness-90"
              />
            )}

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80" />

            {/* Author Avatar with Ring */}
            <div className="absolute top-2.5 left-2.5 z-10">
              <div
                className={`p-0.5 rounded-full ${
                  story.seen_by_current_user
                    ? 'ring-2 ring-zinc-400/60'
                    : 'bg-gradient-to-tr from-pink-500 via-purple-500 to-blue-500 p-0.5 shadow-xs'
                }`}
              >
                <Avatar src={story.author.avatar_url} name={story.author.full_name} size="xs" />
              </div>
            </div>

            {/* Bottom info */}
            <div className="absolute bottom-2.5 left-2.5 right-2.5 z-10">
              <div className="text-zinc-100 text-xs font-bold truncate drop-shadow-sm">
                {story.author.full_name.split(' ')[0]}
              </div>
              <div className="text-[10px] text-zinc-300/80 truncate drop-shadow-sm">
                {story.author.age} yo · {story.author.neighborhood || story.author.location.split(',')[0]}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Story Viewer Fullscreen Modal */}
      {activeStoryIndex !== null && (
        <StoryViewerModal
          stories={stories}
          initialIndex={activeStoryIndex}
          onClose={closeStoryViewer}
        />
      )}

      {/* Real-World Create Story Modal */}
      {isCreatingStory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="bg-zinc-900 rounded-3xl p-6 w-full max-w-md shadow-2xl relative border border-zinc-800 text-zinc-100 max-h-[92vh] overflow-y-auto">
            <button
              onClick={handleCloseModal}
              disabled={isUploading}
              className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-zinc-100 rounded-full hover:bg-zinc-800 transition disabled:opacity-40"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-4">
              <div className="p-2 bg-pink-500/20 text-pink-400 border border-pink-500/30 rounded-2xl">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-100">Create a 24h Story</h3>
                <p className="text-xs text-zinc-400">Upload a spontaneous photo or short video clip</p>
              </div>
            </div>

            {storyError && (
              <div className="mb-4 p-3 rounded-2xl bg-rose-950/40 border border-rose-800/50 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{storyError}</span>
              </div>
            )}

            <form onSubmit={handleCreateStorySubmit} className="space-y-4">
              {/* Media Selection / Live Device Picker */}
              {!previewUrl ? (
                <div className="p-5 rounded-2xl bg-zinc-950/60 border-2 border-dashed border-zinc-750 text-center space-y-3">
                  <span className="text-xs font-semibold text-zinc-300 block">
                    Select media from your device
                  </span>

                  <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto">
                    <button
                      type="button"
                      id="story-upload-photo-btn"
                      onClick={() => storyPhotoInputRef.current?.click()}
                      className="p-4 rounded-2xl bg-zinc-800/90 hover:bg-zinc-750 border border-zinc-700 hover:border-pink-500 text-zinc-200 transition flex flex-col items-center gap-2"
                    >
                      <ImageIcon className="w-6 h-6 text-emerald-400" />
                      <span className="text-xs font-bold">Photo</span>
                      <span className="text-[10px] text-zinc-400">JPG, PNG, WEBP</span>
                    </button>

                    <button
                      type="button"
                      id="story-upload-video-btn"
                      onClick={() => storyVideoInputRef.current?.click()}
                      className="p-4 rounded-2xl bg-zinc-800/90 hover:bg-zinc-750 border border-zinc-700 hover:border-pink-500 text-zinc-200 transition flex flex-col items-center gap-2"
                    >
                      <VideoIcon className="w-6 h-6 text-purple-400" />
                      <span className="text-xs font-bold">Video</span>
                      <span className="text-[10px] text-zinc-400">MP4, WEBM, MOV</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Selected Media Preview (9:16 Portrait Box) */
                <div className="relative aspect-[9/14] max-h-[380px] w-full rounded-2xl overflow-hidden bg-black border border-zinc-750 mx-auto shadow-xl flex items-center justify-center">
                  {mediaType === 'video' ? (
                    <video
                      src={previewUrl}
                      controls
                      playsInline
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <img
                      src={previewUrl}
                      alt="Story preview"
                      className="w-full h-full object-cover"
                    />
                  )}

                  {/* Top Buttons: Remove & Change */}
                  <div className="absolute top-3 right-3 flex items-center gap-2 z-20">
                    <button
                      type="button"
                      onClick={handleClearSelected}
                      disabled={isUploading}
                      className="p-2 rounded-full bg-black/70 hover:bg-rose-600 text-white transition shadow-md"
                      title="Remove media"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Story Text Sticker Live Preview */}
                  {storyCaption && (
                    <div className="absolute bottom-6 left-3 right-3 z-20 pointer-events-none">
                      <div className="inline-block bg-black/60 backdrop-blur-md text-white text-xs font-semibold px-3 py-1.5 rounded-xl shadow-lg">
                        {storyCaption}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Story Caption Input */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Story Caption / Text Sticker (Optional)
                </label>
                <input
                  type="text"
                  value={storyCaption}
                  onChange={(e) => setStoryCaption(e.target.value)}
                  disabled={isUploading}
                  placeholder="e.g. Catching waves at sunset! 🏄‍♀️"
                  className="w-full text-xs sm:text-sm rounded-2xl border border-zinc-750 bg-zinc-800/80 text-zinc-100 p-3 focus:outline-none focus:ring-2 focus:ring-pink-500 placeholder-zinc-500"
                />
              </div>

              {/* Location Tag Attachment */}
              <div className="flex items-center gap-2">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={storyLocation}
                    onChange={(e) => setStoryLocation(e.target.value)}
                    disabled={isUploading}
                    placeholder="Add location tag (e.g. Santa Monica Pier)"
                    className="w-full text-xs rounded-2xl border border-zinc-750 bg-zinc-800/80 text-zinc-100 pl-8 pr-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-pink-500 placeholder-zinc-500"
                  />
                  <MapPin className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
                <button
                  type="button"
                  onClick={handleDetectLocation}
                  disabled={isUploading || isDetectingLocation}
                  className="px-3 py-2.5 rounded-2xl bg-zinc-800 hover:bg-zinc-750 border border-zinc-700 text-xs font-semibold text-rose-400 transition shrink-0"
                  title="Detect live location"
                >
                  {isDetectingLocation ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Detect'}
                </button>
              </div>

              {/* Audience Selector */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-zinc-800/50 border border-zinc-750">
                <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-pink-400" />
                  Audience
                </span>
                <select
                  value={storyAudience}
                  onChange={(e) => setStoryAudience(e.target.value as any)}
                  disabled={isUploading}
                  className="text-xs font-semibold text-zinc-200 bg-zinc-800 border border-zinc-700 rounded-xl px-2.5 py-1 outline-none"
                >
                  <option value="PUBLIC">Public</option>
                  <option value="CONNECTIONS_ONLY">Connections Only</option>
                </select>
              </div>

              {/* Upload progress indicator */}
              {isUploading && (
                <div className="space-y-1 pt-1">
                  <div className="flex justify-between text-[11px] text-zinc-300">
                    <span className="flex items-center gap-1.5">
                      <UploadCloud className="w-3.5 h-3.5 text-pink-400 animate-pulse" />
                      <span>Uploading {mediaType}...</span>
                    </span>
                    <span className="font-bold font-mono">{uploadProgress}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-pink-500 to-rose-500 transition-all duration-150"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={isUploading}
                  className="px-4 py-2.5 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 rounded-xl transition disabled:opacity-40"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="submit-story-btn"
                  disabled={isUploading || !selectedFile}
                  className="px-6 py-2.5 text-xs font-bold bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl shadow-md shadow-pink-500/20 hover:opacity-95 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Uploading Story...</span>
                    </>
                  ) : (
                    <span>Share to Story</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};
