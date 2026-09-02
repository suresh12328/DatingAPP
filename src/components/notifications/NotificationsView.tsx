import React from 'react';
import { Bell, CheckCheck, Heart, MessageCircle, UserPlus, Flame, Sparkles } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Avatar } from '../common/Avatar';
import { EmptyState } from '../common/EmptyState';

export const NotificationsView: React.FC = () => {
  const {
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
    navigate
  } = useApp();

  const getIcon = (type: string) => {
    switch (type) {
      case 'MATCH':
        return <Heart className="w-4 h-4 text-pink-600 fill-pink-600" />;
      case 'LIKE':
        return <Flame className="w-4 h-4 text-rose-500" />;
      case 'COMMENT':
        return <MessageCircle className="w-4 h-4 text-indigo-500" />;
      case 'CONNECTION_REQUEST':
      case 'CONNECTION_ACCEPT':
        return <UserPlus className="w-4 h-4 text-emerald-500" />;
      default:
        return <Sparkles className="w-4 h-4 text-amber-500" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-zinc-900 rounded-3xl p-5 border border-zinc-800 shadow-sm flex items-center justify-between">
        <div>
          <h2 className="text-lg font-extrabold text-zinc-100 font-heading flex items-center gap-2">
            <Bell className="w-5 h-5 text-pink-400" />
            <span>Notifications</span>
          </h2>
          <p className="text-xs text-zinc-400">
            Keep track of your dating matches, comments, and connection activities.
          </p>
        </div>

        {notifications.length > 0 && (
          <button
            onClick={markAllNotificationsRead}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-pink-500/10 hover:bg-pink-500/20 text-pink-400 text-xs font-bold transition border border-pink-500/20"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>Mark all as read</span>
          </button>
        )}
      </div>

      {/* Notifications list */}
      <div className="bg-zinc-900 rounded-3xl border border-zinc-800 divide-y divide-zinc-800/60 overflow-hidden shadow-sm">
        {notifications.map((n) => (
          <div
            key={n.id}
            onClick={() => {
              markNotificationRead(n.id);
              navigate(n.link_route.replace('/', '') as any);
            }}
            className={`p-4 flex items-start gap-3.5 cursor-pointer transition ${
              !n.is_read ? 'bg-zinc-800/60 hover:bg-zinc-800/90' : 'hover:bg-zinc-800/40'
            }`}
          >
            <div className="relative">
              <Avatar
                src={n.actor.avatar_url}
                name={n.actor.full_name}
                size="md"
                isVerified={n.actor.is_verified}
              />
              <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-zinc-900 shadow-xs border border-zinc-800">
                {getIcon(n.type)}
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="text-xs sm:text-sm font-bold text-zinc-100">
                  {n.title}
                </h4>
                <span className="text-[10px] text-zinc-500">
                  {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">{n.message}</p>
            </div>

            {!n.is_read && (
              <span className="w-2.5 h-2.5 rounded-full bg-pink-500 shrink-0 mt-1" />
            )}
          </div>
        ))}

        {notifications.length === 0 && (
          <EmptyState
            icon={Bell}
            title="All Caught Up!"
            description="You have no unread notifications right now."
          />
        )}
      </div>
    </div>
  );
};
