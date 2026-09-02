import React, { useState } from 'react';
import { Users, UserPlus, Check, X, MessageCircle, UserX } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { Avatar } from '../common/Avatar';
import { EmptyState } from '../common/EmptyState';

export const ConnectionsView: React.FC = () => {
  const { currentUser, allUsers } = useAuth();
  const {
    connections,
    acceptConnection,
    rejectConnection,
    removeConnection,
    sendConnectionRequest,
    navigate
  } = useApp();

  const [activeTab, setActiveTab] = useState<'all' | 'requests' | 'suggestions'>('all');

  const acceptedConnections = connections.filter((c) => c.status === 'ACCEPTED');
  const pendingRequests = connections.filter(
    (c) => c.receiver_id === currentUser.id && c.status === 'PENDING'
  );

  const existingConnectedIds = new Set([
    currentUser.id,
    ...connections.map((c) => (c.requester_id === currentUser.id ? c.receiver_id : c.requester_id))
  ]);

  const suggestions = allUsers.filter((u) => !existingConnectedIds.has(u.id));

  return (
    <div className="space-y-4">
      {/* Header Tabs */}
      <div className="bg-zinc-900 rounded-3xl p-4 border border-zinc-800 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition ${
              activeTab === 'all'
                ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-sm'
                : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-750 border border-zinc-750'
            }`}
          >
            My Friends ({acceptedConnections.length})
          </button>

          <button
            onClick={() => setActiveTab('requests')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition ${
              activeTab === 'requests'
                ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-sm'
                : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-750 border border-zinc-750'
            }`}
          >
            Requests ({pendingRequests.length})
          </button>

          <button
            onClick={() => setActiveTab('suggestions')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition ${
              activeTab === 'suggestions'
                ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-sm'
                : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-750 border border-zinc-750'
            }`}
          >
            Find Friends ({suggestions.length})
          </button>
        </div>
      </div>

      {/* Tab: Requests */}
      {activeTab === 'requests' && (
        <div className="space-y-3">
          {pendingRequests.length > 0 ? (
            pendingRequests.map((req) => (
              <div
                key={req.id}
                className="bg-zinc-900 rounded-3xl p-4 border border-zinc-800 flex items-center justify-between gap-3 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <Avatar
                    src={req.requester.avatar_url}
                    name={req.requester.full_name}
                    size="md"
                    isVerified={req.requester.is_verified}
                  />
                  <div>
                    <h4 className="text-sm font-bold text-zinc-100">
                      {req.requester.full_name}
                    </h4>
                    <p className="text-xs text-zinc-400">
                      {req.requester.profession} · {req.requester.location}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => acceptConnection(req.id)}
                    className="px-4 py-2 rounded-xl bg-pink-600 text-white text-xs font-bold hover:bg-pink-500 transition flex items-center gap-1 shadow-sm"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Accept
                  </button>
                  <button
                    onClick={() => rejectConnection(req.id)}
                    className="p-2 rounded-xl bg-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-750 transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <EmptyState
              icon={Users}
              title="No Pending Friend Requests"
              description="You have responded to all your received connection requests."
            />
          )}
        </div>
      )}

      {/* Tab: All Friends */}
      {activeTab === 'all' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {acceptedConnections.length > 0 ? (
            acceptedConnections.map((c) => {
              const friend = c.requester_id === currentUser.id ? c.receiver : c.requester;
              return (
                <div
                  key={c.id}
                  className="bg-zinc-900 rounded-3xl p-4 border border-zinc-800 shadow-sm flex items-center justify-between gap-3"
                >
                  <div
                    onClick={() => navigate('profile', { username: friend.username })}
                    className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                  >
                    <Avatar
                      src={friend.avatar_url}
                      name={friend.full_name}
                      size="md"
                      isOnline={friend.is_online}
                      isVerified={friend.is_verified}
                    />
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs sm:text-sm font-bold text-zinc-100 truncate">
                        {friend.full_name}
                      </h4>
                      <p className="text-[11px] text-zinc-400 truncate">
                        {friend.location.split(',')[0]}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => navigate('messages', { userId: friend.id })}
                      className="p-2 bg-pink-500/10 hover:bg-pink-500/20 text-pink-400 rounded-xl transition border border-pink-500/20"
                      title="Message"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Remove connection with ${friend.full_name}?`)) {
                          removeConnection(c.id);
                        }
                      }}
                      className="p-2 text-zinc-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-xl transition"
                      title="Remove Connection"
                    >
                      <UserX className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-2">
              <EmptyState
                icon={Users}
                title="No Connections Yet"
                description="Connect with people to share posts, stories, and build lasting friendships."
                actionText="Discover People"
                onAction={() => setActiveTab('suggestions')}
              />
            </div>
          )}
        </div>
      )}

      {/* Tab: Suggestions */}
      {activeTab === 'suggestions' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {suggestions.map((u) => (
            <div
              key={u.id}
              className="bg-zinc-900 rounded-3xl p-4 border border-zinc-800 shadow-sm flex items-center justify-between gap-3"
            >
              <div
                onClick={() => navigate('profile', { username: u.username })}
                className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
              >
                <Avatar
                  src={u.avatar_url}
                  name={u.full_name}
                  size="md"
                  isOnline={u.is_online}
                  isVerified={u.is_verified}
                />
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs sm:text-sm font-bold text-zinc-100 truncate">
                    {u.full_name}
                  </h4>
                  <p className="text-[11px] text-zinc-400 truncate">
                    {u.profession} · {u.location.split(',')[0]}
                  </p>
                </div>
              </div>

              <button
                onClick={() => sendConnectionRequest(u.id)}
                className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-pink-600 hover:text-white text-zinc-300 text-xs font-bold transition flex items-center gap-1 border border-zinc-750"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Connect</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
