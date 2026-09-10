import React from 'react';
import { History, Heart, Star, Sparkles, MessageCircle, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { store } from '../../lib/storage';
import { EmptyState } from '../common/EmptyState';
import { Avatar } from '../common/Avatar';
import { sanitizeProfile } from '../../lib/datingUtils';

export const MatchHistoryView: React.FC = () => {
  const { currentUser } = useAuth();
  const { navigate } = useApp();

  const myLikes = (store.getMyLikes() || []).filter(Boolean);

  if (myLikes.length === 0) {
    return (
      <EmptyState
        icon={History}
        title="No Swipe History Yet"
        description="Profiles you like or super like in Dating mode will appear here so you can track your connections."
        actionText="Start Exploring Profiles"
        onAction={() => navigate('dating')}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-zinc-100 font-heading">
            Match & Like History
          </h2>
          <p className="text-xs text-zinc-400">
            Keep track of people you've liked and mutual matches you've formed
          </p>
        </div>
        <span className="px-3 py-1 bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs font-bold rounded-full">
          {myLikes.length} Total
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {myLikes.map((item) => {
          if (!item) return null;
          const user = sanitizeProfile(item);
          const isSuperLike = Boolean(item.is_super_like);
          const isMatch = Boolean(item.is_match);

          return (
            <div
              key={user.id}
              className="bg-zinc-900 rounded-3xl p-4 border border-zinc-800 shadow-sm hover:border-zinc-700 transition flex flex-col justify-between"
            >
              <div className="flex items-start gap-3.5">
                <Avatar
                  src={user.avatar_url}
                  name={user.full_name}
                  size="lg"
                  isOnline={user.is_online}
                  isVerified={user.is_verified}
                  onClick={() => navigate('profile', { username: user.username })}
                />

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <h4
                      onClick={() => navigate('profile', { username: user.username })}
                      className="text-sm font-bold text-zinc-100 hover:text-pink-400 transition truncate cursor-pointer"
                    >
                      {user.full_name}, {user.age}
                    </h4>

                    {isMatch ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30 shrink-0">
                        <Sparkles className="w-2.5 h-2.5" />
                        Matched
                      </span>
                    ) : isSuperLike ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 text-[10px] font-bold border border-indigo-500/30 shrink-0">
                        <Star className="w-2.5 h-2.5 fill-indigo-400" />
                        Super Liked
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-400 text-[10px] font-bold border border-pink-500/30 shrink-0">
                        <Heart className="w-2.5 h-2.5 fill-pink-400" />
                        Liked
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-zinc-400 truncate mt-0.5">
                    {user.profession} · {user.neighborhood || (user.location ? user.location.split(',')[0] : 'Nearby')}
                  </p>

                  <div className="flex flex-wrap gap-1 mt-2">
                    {(user.interests || []).slice(0, 2).map((i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-full bg-zinc-800 text-[10px] text-zinc-400"
                      >
                        {i}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-4 pt-3 border-t border-zinc-800">
                {isMatch ? (
                  <button
                    onClick={() => navigate('messages', { userId: user.id })}
                    className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white text-xs font-bold hover:opacity-95 transition flex items-center justify-center gap-1.5 shadow-xs shadow-pink-500/20"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    Open Chat
                  </button>
                ) : (
                  <div className="flex-1 text-[11px] text-zinc-500 font-medium">
                    Awaiting mutual like
                  </div>
                )}

                <button
                  onClick={() => navigate('profile', { username: user.username })}
                  className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-750 text-zinc-300 hover:text-white text-xs font-semibold transition border border-zinc-700/60 flex items-center gap-1"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Profile</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
