import React from 'react';
import { Bookmark } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PostCard } from '../feed/PostCard';
import { EmptyState } from '../common/EmptyState';

export const SavedPostsView: React.FC = () => {
  const { savedPosts, navigate } = useApp();

  return (
    <div className="space-y-4">
      <div className="bg-zinc-900 rounded-3xl p-5 border border-zinc-800 shadow-sm">
        <h2 className="text-lg font-extrabold text-zinc-100 font-heading flex items-center gap-2">
          <Bookmark className="w-5 h-5 text-indigo-400" />
          <span>Saved Posts & Bookmarks</span>
        </h2>
        <p className="text-xs text-zinc-400">
          Revisit thoughtful posts, date recommendations, and inspiring moments you've saved.
        </p>
      </div>

      {savedPosts.length > 0 ? (
        <div className="space-y-4">
          {savedPosts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Bookmark}
          title="No Saved Posts Yet"
          description="Click the bookmark icon on any post in your social feed to save it for later."
          actionText="Browse Social Feed"
          onAction={() => navigate('home')}
        />
      )}
    </div>
  );
};
