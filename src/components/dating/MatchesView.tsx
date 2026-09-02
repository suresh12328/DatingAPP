import React from 'react';
import { HeartHandshake, MessageCircle, MoreVertical, Sparkles, UserX, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { Avatar } from '../common/Avatar';
import { EmptyState } from '../common/EmptyState';

export const MatchesView: React.FC = () => {
  const { currentUser } = useAuth();
  const { matches, unmatch, navigate } = useApp();

  if (matches.length === 0) {
    return (
      <EmptyState
        icon={HeartHandshake}
        title="No Mutual Matches Yet"
        description="Swipe right on profiles in Dating mode! When someone likes you back, they will appear here."
        actionText="Start Swiping Now"
        onAction={() => navigate('dating')}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-zinc-100 font-heading">
            Mutual Matches
          </h2>
          <p className="text-xs text-zinc-400">
            You both liked each other! Start a conversation to break the ice.
          </p>
        </div>
        <span className="px-3 py-1 bg-pink-500/15 border border-pink-500/30 text-pink-400 text-xs font-bold rounded-full">
          {matches.length} {matches.length === 1 ? 'Match' : 'Matches'}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {matches.map((m) => {
          const otherUser = m.user1_id === currentUser.id ? m.user2 : m.user1;
          return (
            <div
              key={m.id}
              className="bg-zinc-900 rounded-3xl p-4 border border-zinc-800 shadow-sm hover:border-zinc-700 transition flex flex-col justify-between"
            >
              <div className="flex items-start gap-3">
                <Avatar
                  src={otherUser.avatar_url}
                  name={otherUser.full_name}
                  size="lg"
                  isOnline={otherUser.is_online}
                  isVerified={otherUser.is_verified}
                  onClick={() => navigate('profile', { username: otherUser.username })}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <h4
                      onClick={() => navigate('profile', { username: otherUser.username })}
                      className="text-sm font-bold text-zinc-100 hover:text-pink-400 transition truncate cursor-pointer"
                    >
                      {otherUser.full_name}, {otherUser.age}
                    </h4>
                  </div>
                  <p className="text-xs text-zinc-400 truncate">
                    {otherUser.profession} · {otherUser.location.split(',')[0]}
                  </p>

                  {/* Compatibility Badge */}
                  <div className="inline-flex items-center gap-1 mt-1.5 px-2.5 py-0.5 rounded-full bg-pink-500/15 border border-pink-500/20 text-pink-400 text-[10px] font-semibold">
                    <Sparkles className="w-3 h-3" />
                    <span>{m.compatibility_score}% Compatibility</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 mt-4 pt-3 border-t border-zinc-800">
                <button
                  id={`chat-match-${otherUser.id}`}
                  onClick={() => navigate('messages', { userId: otherUser.id })}
                  className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-pink-500 via-rose-500 to-indigo-600 text-white text-xs font-semibold hover:opacity-95 shadow-xs shadow-pink-500/20 transition flex items-center justify-center gap-1.5"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  Chat Now
                </button>

                <button
                  onClick={() => navigate('profile', { username: otherUser.username })}
                  className="p-2 rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition"
                  title="View Profile"
                >
                  <User className="w-4 h-4" />
                </button>

                <button
                  onClick={() => {
                    if (confirm(`Are you sure you want to unmatch with ${otherUser.full_name}?`)) {
                      unmatch(m.id);
                    }
                  }}
                  className="p-2 rounded-xl text-zinc-400 hover:text-rose-400 hover:bg-rose-950/30 transition"
                  title="Unmatch"
                >
                  <UserX className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
