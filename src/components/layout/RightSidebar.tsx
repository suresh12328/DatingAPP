import React from 'react';
import {
  Sparkles,
  Users,
  Flame,
  Check,
  X,
  MessageCircle,
  MapPin,
  Cake,
  TrendingUp
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { Avatar } from '../common/Avatar';

export const RightSidebar: React.FC = () => {
  const { currentUser, allUsers } = useAuth();
  const {
    connections,
    acceptConnection,
    rejectConnection,
    navigate,
    likeProfile
  } = useApp();

  const pendingRequests = connections.filter(
    (c) => c.receiver_id === currentUser.id && c.status === 'PENDING'
  );

  const onlineUsers = allUsers.filter(
    (u) => u.id !== currentUser.id && u.is_online
  );

  const recentlyJoined = allUsers
    .filter((u) => u.id !== currentUser.id)
    .slice(0, 6);

  const suggestedMatches = allUsers
    .filter(
      (u) =>
        u.id !== currentUser.id &&
        u.privacy.datingVisible &&
        (currentUser.dating_preference === 'EVERYONE' ||
          (currentUser.dating_preference === 'WOMEN' && u.gender === 'WOMAN') ||
          (currentUser.dating_preference === 'MEN' && u.gender === 'MAN'))
    )
    .slice(0, 3);

  return (
    <aside className="w-80 shrink-0 hidden lg:block py-4 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto no-scrollbar space-y-4">
      {/* Pending Connection Requests */}
      {pendingRequests.length > 0 && (
        <div className="bg-zinc-900 rounded-3xl border border-zinc-800 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-pink-500" />
              <span>Connection Requests</span>
            </h4>
            <span className="bg-pink-500/20 text-pink-400 border border-pink-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
              {pendingRequests.length}
            </span>
          </div>

          <div className="space-y-3">
            {pendingRequests.map((req) => (
              <div key={req.id} className="p-2.5 bg-zinc-800/60 border border-zinc-800 rounded-2xl">
                <div className="flex items-center gap-2.5 mb-2.5">
                  <Avatar
                    src={req.requester.avatar_url}
                    name={req.requester.full_name}
                    size="sm"
                    isVerified={req.requester.is_verified}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-zinc-100 truncate">
                      {req.requester.full_name}
                    </div>
                    <div className="text-[11px] text-zinc-400 truncate">
                      {req.requester.profession} · {req.requester.location.split(',')[0]}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    id={`accept-req-${req.id}`}
                    onClick={() => acceptConnection(req.id)}
                    className="flex-1 py-1.5 px-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl text-xs font-semibold hover:opacity-95 transition flex items-center justify-center gap-1 shadow-xs"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Accept
                  </button>
                  <button
                    id={`reject-req-${req.id}`}
                    onClick={() => rejectConnection(req.id)}
                    className="py-1.5 px-3 bg-zinc-800 text-zinc-300 hover:text-white rounded-xl text-xs font-semibold hover:bg-zinc-700 transition flex items-center justify-center border border-zinc-700/60"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Suggested Matches Mini-Carousel / Showcase */}
      <div className="bg-zinc-900 rounded-3xl border border-zinc-800 p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-rose-500" />
            <span>Suggested Matches</span>
          </h4>
          <button
            onClick={() => navigate('dating')}
            className="text-xs font-semibold text-pink-400 hover:text-pink-300"
          >
            Explore
          </button>
        </div>

        <div className="space-y-3">
          {suggestedMatches.map((matchUser) => (
            <div
              key={matchUser.id}
              className="p-3 bg-zinc-800/40 rounded-2xl border border-zinc-800 hover:border-zinc-700 flex items-center justify-between gap-2.5 group transition"
            >
              <div
                onClick={() => navigate('profile', { username: matchUser.username })}
                className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer"
              >
                <Avatar
                  src={matchUser.avatar_url}
                  name={matchUser.full_name}
                  size="md"
                  isOnline={matchUser.is_online}
                  isVerified={matchUser.is_verified}
                />
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-zinc-100 truncate group-hover:text-pink-400 transition">
                    {matchUser.full_name}, {matchUser.age}
                  </div>
                  <div className="text-[11px] text-zinc-400 truncate flex items-center gap-1">
                    <MapPin className="w-2.5 h-2.5" />
                    <span>{matchUser.location.split(',')[0]}</span>
                  </div>
                </div>
              </div>

              <button
                id={`right-sidebar-like-${matchUser.id}`}
                onClick={() => likeProfile(matchUser.id)}
                className="p-2 rounded-xl bg-zinc-800 hover:bg-pink-500 text-pink-400 hover:text-white shadow-xs border border-zinc-700 hover:border-pink-500 transition shrink-0"
                title="Send Like"
              >
                <Flame className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Birthday & Dating Milestones Reminder */}
      <div className="p-3.5 bg-amber-950/20 rounded-3xl border border-amber-500/20 flex items-start gap-3 text-zinc-300">
        <div className="p-2 bg-amber-500 text-white rounded-2xl shadow-xs shrink-0">
          <Cake className="w-4 h-4" />
        </div>
        <div className="text-xs">
          <div className="font-bold text-zinc-100">Birthday Highlight</div>
          <p className="text-[11px] text-zinc-400 mt-0.5">
            <span className="font-semibold text-zinc-200">Mirela Rossi</span> has a birthday coming up this week. Send her a warm greeting! 🎂
          </p>
        </div>
      </div>

      {/* Online in Your City / Active Friends */}
      <div className="bg-zinc-900 rounded-3xl border border-zinc-800 p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Online Members</span>
          </h4>
          <span className="text-[11px] font-semibold text-zinc-500">
            {onlineUsers.length} active
          </span>
        </div>

        <div className="space-y-1">
          {onlineUsers.map((user) => (
            <div
              key={user.id}
              onClick={() => navigate('messages', { userId: user.id })}
              className="w-full flex items-center justify-between p-2 rounded-2xl hover:bg-zinc-800/70 cursor-pointer transition"
            >
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <Avatar
                  src={user.avatar_url}
                  name={user.full_name}
                  size="sm"
                  isOnline={true}
                  isVerified={user.is_verified}
                />
                <div className="min-w-0 flex-1 text-left">
                  <div className="text-xs font-bold text-zinc-100 truncate">
                    {user.full_name}
                  </div>
                  <div className="text-[10px] text-zinc-400 truncate">
                    {user.neighborhood || user.location.split(',')[0]}
                  </div>
                </div>
              </div>

              <button
                className="p-1.5 text-zinc-400 hover:text-pink-400 rounded-lg hover:bg-zinc-800 transition"
                title="Send Message"
              >
                <MessageCircle className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Popular Dating Communities */}
      <div className="bg-zinc-900 rounded-3xl border border-zinc-800 p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
            <span>Popular Hubs</span>
          </h4>
        </div>

        <div className="space-y-2 text-xs text-zinc-300">
          <div className="flex items-center justify-between p-2 rounded-xl bg-zinc-800/60 hover:bg-zinc-800 transition cursor-pointer border border-zinc-800/80">
            <span className="font-semibold text-zinc-200">San Francisco, CA</span>
            <span className="text-[11px] text-pink-400 font-bold">12,492 active</span>
          </div>
          <div className="flex items-center justify-between p-2 rounded-xl bg-zinc-800/60 hover:bg-zinc-800 transition cursor-pointer border border-zinc-800/80">
            <span className="font-semibold text-zinc-200">New York, NY</span>
            <span className="text-[11px] text-pink-400 font-bold">18,284 active</span>
          </div>
          <div className="flex items-center justify-between p-2 rounded-xl bg-zinc-800/60 hover:bg-zinc-800 transition cursor-pointer border border-zinc-800/80">
            <span className="font-semibold text-zinc-200">Austin, TX</span>
            <span className="text-[11px] text-pink-400 font-bold">8,730 active</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
