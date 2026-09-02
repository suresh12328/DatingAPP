import React, { useState, useRef } from 'react';
import { Plus, ChevronLeft, ChevronRight, Sparkles, Image as ImageIcon, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { Avatar } from '../common/Avatar';
import { StoryViewerModal } from './StoryViewerModal';

export const StoriesBar: React.FC = () => {
  const { currentUser } = useAuth();
  const { stories, createStory, activeStoryIndex, openStoryViewer, closeStoryViewer } = useApp();
  const [isCreatingStory, setIsCreatingStory] = useState(false);
  const [storyImageUrl, setStoryImageUrl] = useState('');
  const [storyText, setStoryText] = useState('');
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -220 : 220;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const handleCreateStory = (e: React.FormEvent) => {
    e.preventDefault();
    if (storyImageUrl.trim()) {
      createStory(storyImageUrl.trim(), 'image', storyText.trim());
      setStoryImageUrl('');
      setStoryText('');
      setIsCreatingStory(false);
    }
  };

  const sampleImages = [
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=800&q=80',
  ];

  return (
    <section className="bg-zinc-900 rounded-3xl p-4 border border-zinc-800 shadow-sm relative">
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
          className="relative w-28 sm:w-32 h-44 sm:h-48 rounded-2xl overflow-hidden shrink-0 cursor-pointer group bg-gradient-to-b from-zinc-800 to-zinc-850 border border-zinc-700/60 flex flex-col justify-between p-2.5 shadow-sm hover:border-zinc-500 transition"
        >
          <div className="w-full h-28 overflow-hidden rounded-xl bg-zinc-800">
            <img
              src={currentUser.avatar_url}
              alt="My Avatar"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover group-hover:scale-105 transition"
            />
          </div>
          <div className="relative z-10 flex flex-col items-center text-center -mt-5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 text-white flex items-center justify-center shadow-md ring-2 ring-zinc-900">
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
            className="relative w-28 sm:w-32 h-44 sm:h-48 rounded-2xl overflow-hidden shrink-0 cursor-pointer group shadow-sm hover:shadow-md transition bg-zinc-950 select-none border border-zinc-800/80 hover:border-zinc-700"
          >
            {/* Story Image */}
            <img
              src={story.media_url}
              alt={story.author.full_name}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover group-hover:scale-105 transition duration-300 brightness-90"
            />

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80" />

            {/* Author Avatar with Ring */}
            <div className="absolute top-2.5 left-2.5 z-10">
              <div
                className={`p-0.5 rounded-full ${
                  story.seen_by_current_user
                    ? 'ring-2 ring-zinc-400/60'
                    : 'bg-gradient-to-tr from-pink-500 via-purple-500 to-blue-500 p-0.5'
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

      {/* Create Story Modal */}
      {isCreatingStory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 rounded-3xl p-6 w-full max-w-md shadow-2xl relative border border-zinc-800 text-zinc-100">
            <button
              onClick={() => setIsCreatingStory(false)}
              className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-zinc-100 rounded-full hover:bg-zinc-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-pink-500/20 text-pink-400 border border-pink-500/30 rounded-2xl">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-100">Create a 24h Story</h3>
                <p className="text-xs text-zinc-400">Share your spontaneous moments with connections</p>
              </div>
            </div>

            <form onSubmit={handleCreateStory} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Photo URL
                </label>
                <input
                  type="url"
                  value={storyImageUrl}
                  onChange={(e) => setStoryImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  required
                  className="w-full text-xs sm:text-sm rounded-2xl border border-zinc-750 bg-zinc-800/80 text-zinc-100 p-3 focus:outline-none focus:ring-2 focus:ring-pink-500 placeholder-zinc-500"
                />
              </div>

              {/* Sample Photo Pickers */}
              <div>
                <span className="text-[11px] font-semibold text-zinc-400 mb-1.5 block">
                  Or pick a photo prompt:
                </span>
                <div className="grid grid-cols-4 gap-2">
                  {sampleImages.map((img, i) => (
                    <img
                      key={i}
                      src={img}
                      alt="Sample"
                      onClick={() => setStoryImageUrl(img)}
                      className={`w-full h-16 object-cover rounded-xl cursor-pointer border-2 transition ${
                        storyImageUrl === img ? 'border-pink-500 scale-95' : 'border-zinc-700/60 hover:border-zinc-500'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Story Caption / Text Sticker (Optional)
                </label>
                <input
                  type="text"
                  value={storyText}
                  onChange={(e) => setStoryText(e.target.value)}
                  placeholder="e.g. Catching waves at sunset! 🏄‍♀️"
                  className="w-full text-xs sm:text-sm rounded-2xl border border-zinc-750 bg-zinc-800/80 text-zinc-100 p-3 focus:outline-none focus:ring-2 focus:ring-pink-500 placeholder-zinc-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreatingStory(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 text-xs font-bold bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl shadow-md shadow-pink-500/20 hover:opacity-95 transition"
                >
                  Share to Story
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};
