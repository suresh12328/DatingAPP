import React from 'react';
import { Heart, X, Sparkles, MapPin } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { store } from '../../lib/storage';
import { Avatar } from '../common/Avatar';
import { EmptyState } from '../common/EmptyState';

export const LikesYouView: React.FC = () => {
  const { currentUser } = useAuth();
  const { likeProfile, passProfile, navigate } = useApp();

  const likesReceived = store.getLikesReceived();

  if (likesReceived.length === 0) {
    return (
      <EmptyState
        icon={Heart}
        title="No Incoming Likes Yet"
        description="When other members swipe right or Super Like your profile, they will show up here for you to match with!"
        actionText="Boost Profile / Explore"
        onAction={() => navigate('dating')}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-zinc-100 font-heading">
            People Who Liked You
          </h2>
          <p className="text-xs text-zinc-400">
            Like them back to instantly create a mutual match!
          </p>
        </div>
        <span className="px-3 py-1 bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-bold rounded-full">
          {likesReceived.length} {likesReceived.length === 1 ? 'Person' : 'People'}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {likesReceived.map((user) => {
          return (
            <div
              key={user.id}
              className="bg-zinc-900 rounded-3xl overflow-hidden border border-zinc-800 shadow-sm hover:border-zinc-700 transition flex flex-col justify-between"
            >
              {/* Photo Banner with SuperLike Badge if applicable */}
              <div className="relative h-48 bg-zinc-950">
                <img
                  src={user.avatar_url}
                  alt={user.full_name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-black/30" />

                {user.is_super_like && (
                  <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center gap-1 shadow-md">
                    <Sparkles className="w-3 h-3" />
                    <span>Super Liked You</span>
                  </div>
                )}

                <div className="absolute bottom-3 left-3 text-white">
                  <div className="text-base font-bold drop-shadow-sm">
                    {user.full_name}, {user.age}
                  </div>
                  <div className="text-xs text-zinc-300 flex items-center gap-1 drop-shadow-sm">
                    <MapPin className="w-3 h-3 text-pink-400" />
                    <span>{user.neighborhood || user.location.split(',')[0]}</span>
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                <p className="text-xs text-zinc-300 line-clamp-2">
                  {user.bio || 'Excited to chat and connect!'}
                </p>

                <div className="flex flex-wrap gap-1">
                  {user.interests.slice(0, 3).map((i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded-full bg-zinc-800 border border-zinc-700 text-[10px] font-medium text-zinc-300"
                    >
                      {i}
                    </span>
                  ))}
                </div>

                {/* Match Action */}
                <div className="flex items-center gap-2 pt-2 border-t border-zinc-800">
                  <button
                    id={`pass-like-${user.id}`}
                    onClick={() => passProfile(user.id)}
                    className="p-2.5 rounded-2xl bg-zinc-800 hover:bg-zinc-750 text-zinc-400 hover:text-zinc-200 transition border border-zinc-700/60"
                    title="Pass"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  <button
                    id={`match-like-back-${user.id}`}
                    onClick={() => likeProfile(user.id)}
                    className="flex-1 py-2.5 px-4 rounded-2xl bg-gradient-to-r from-pink-500 via-rose-500 to-indigo-600 text-white text-xs font-bold shadow-md shadow-pink-500/20 hover:opacity-95 transition flex items-center justify-center gap-1.5"
                  >
                    <Heart className="w-4 h-4 fill-white" />
                    <span>Like Back & Match</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
