import React from 'react';
import { Search, Flame, UserPlus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { Avatar } from '../common/Avatar';
import { PostCard } from '../feed/PostCard';
import { EmptyState } from '../common/EmptyState';

export const SearchResultsView: React.FC = () => {
  const { allUsers, currentUser } = useAuth();
  const { routeParams, posts, likeProfile, sendConnectionRequest, navigate } = useApp();

  const query = (routeParams.query || '').trim().toLowerCase();

  const matchingUsers = allUsers.filter(
    (u) =>
      u.id !== currentUser.id &&
      (u.full_name.toLowerCase().includes(query) ||
        u.username.toLowerCase().includes(query) ||
        u.location.toLowerCase().includes(query) ||
        u.interests.some((i) => i.toLowerCase().includes(query)) ||
        (u.profession || '').toLowerCase().includes(query))
  );

  const matchingPosts = posts.filter(
    (p) =>
      p.content.toLowerCase().includes(query) ||
      (p.location && p.location.toLowerCase().includes(query)) ||
      (p.feeling && p.feeling.toLowerCase().includes(query))
  );

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs">
        <h2 className="text-lg font-extrabold text-slate-900 font-heading flex items-center gap-2">
          <Search className="w-5 h-5 text-pink-600" />
          <span>Search Results for "{routeParams.query}"</span>
        </h2>
        <p className="text-xs text-slate-500">
          Found {matchingUsers.length} people and {matchingPosts.length} posts matching your search.
        </p>
      </div>

      {/* Matching People */}
      {matchingUsers.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider px-1">
            People ({matchingUsers.length})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {matchingUsers.map((user) => (
              <div
                key={user.id}
                className="bg-white rounded-3xl p-4 border border-slate-100 shadow-xs flex items-center justify-between gap-3"
              >
                <div
                  onClick={() => navigate('profile', { username: user.username })}
                  className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                >
                  <Avatar
                    src={user.avatar_url}
                    name={user.full_name}
                    size="md"
                    isOnline={user.is_online}
                    isVerified={user.is_verified}
                  />
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                      {user.full_name}, {user.age}
                    </h4>
                    <p className="text-[11px] text-slate-500 truncate">
                      {user.profession} · {user.location.split(',')[0]}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => likeProfile(user.id)}
                    className="p-2 rounded-xl bg-pink-50 hover:bg-pink-100 text-pink-600 transition"
                    title="Dating Like"
                  >
                    <Flame className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => sendConnectionRequest(user.id)}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                    title="Connect"
                  >
                    <UserPlus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Matching Posts */}
      {matchingPosts.length > 0 && (
        <div className="space-y-3 pt-2">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider px-1">
            Feed Posts ({matchingPosts.length})
          </h3>
          <div className="space-y-4">
            {matchingPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </div>
      )}

      {matchingUsers.length === 0 && matchingPosts.length === 0 && (
        <EmptyState
          icon={Search}
          title="No Results Found"
          description={`We couldn't find any people or posts matching "${routeParams.query}". Try searching for popular cities or interests.`}
          actionText="Discover People"
          onAction={() => navigate('discover')}
        />
      )}
    </div>
  );
};
