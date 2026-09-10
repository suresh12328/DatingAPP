import React from 'react';
import {
  Home,
  Compass,
  Flame,
  HeartHandshake,
  Heart,
  MessageCircle,
  Users,
  Film,
  Bookmark,
  ShieldCheck,
  Sliders,
  ShieldAlert,
  HelpCircle,
  LogOut,
  Sparkles,
  Mail
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp, AppRoute } from '../../context/AppContext';
import { Avatar } from '../common/Avatar';

export const LeftSidebar: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const isAdmin = currentUser.role === 'ADMIN' && (currentUser.id === 'user-suresh' || currentUser.email?.toLowerCase() === 'bohara.suresh8884@gmail.com');
  const {
    currentRoute,
    navigate,
    matches,
    unreadMessagesCount,
    unreadNotifsCount
  } = useApp();

  const navItems: {
    id: string;
    route: AppRoute;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number | string;
    color?: string;
  }[] = [
    { id: 'sb-home', route: 'home', label: 'Social Feed', icon: Home },
    { id: 'sb-discover', route: 'discover', label: 'Discover People', icon: Compass },
    { id: 'sb-dating', route: 'dating', label: 'Dating Mode', icon: Flame, color: 'text-rose-500' },
    { id: 'sb-matches', route: 'matches', label: 'Mutual Matches', icon: HeartHandshake, badge: matches.length > 0 ? matches.length : undefined },
    { id: 'sb-likes', route: 'likes', label: 'Likes You', icon: Heart, color: 'text-pink-500' },
    { id: 'sb-messages', route: 'messages', label: 'Messages', icon: MessageCircle, badge: unreadMessagesCount > 0 ? unreadMessagesCount : undefined },
    ...(isAdmin ? [{ id: 'sb-gmail', route: 'gmail' as AppRoute, label: 'Gmail Workspace', icon: Mail, color: 'text-rose-400' }] : []),
    { id: 'sb-friends', route: 'connections', label: 'Friends & Connections', icon: Users },
    { id: 'sb-reels', route: 'reels', label: 'Reels & Videos', icon: Film },
    { id: 'sb-saved', route: 'saved', label: 'Saved Posts', icon: Bookmark },
    { id: 'sb-safety', route: 'safety', label: 'Safety & Privacy', icon: ShieldCheck },
    { id: 'sb-help', route: 'help', label: 'Help & Support', icon: HelpCircle },
    { id: 'sb-settings', route: 'settings', label: 'Settings', icon: Sliders },
  ];

  return (
    <aside className="w-64 shrink-0 hidden md:block py-4 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto no-scrollbar space-y-4">
      {/* Profile Card Summary */}
      <div
        id="sidebar-profile-card"
        onClick={() => navigate('profile', { username: currentUser.username })}
        className="p-3.5 bg-zinc-900 rounded-3xl border border-zinc-800 shadow-sm hover:border-zinc-700 transition cursor-pointer group"
      >
        <div className="flex items-center gap-3">
          <Avatar
            src={currentUser.avatar_url}
            name={currentUser.full_name}
            size="md"
            isOnline={currentUser.is_online}
            isVerified={currentUser.is_verified}
          />
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-bold text-zinc-100 group-hover:text-pink-400 transition truncate flex items-center gap-1">
              <span>{currentUser.full_name}</span>
            </h4>
            <p className="text-xs text-zinc-400 truncate">
              {currentUser.age} yo · {currentUser.location.split(',')[0]}
            </p>
          </div>
        </div>

        <div className="mt-3 pt-2.5 border-t border-zinc-800 flex items-center justify-between text-[11px] text-zinc-400 font-medium">
          <span className="flex items-center gap-1 text-pink-400">
            <Sparkles className="w-3 h-3" />
            <span>Active Dating</span>
          </span>
          <span className="hover:text-pink-400 underline">View Profile</span>
        </div>
      </div>

      {/* Main Navigation List */}
      <div className="bg-zinc-900 rounded-3xl border border-zinc-800 p-2 shadow-sm space-y-0.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentRoute === item.route;
          return (
            <button
              key={item.id}
              id={item.id}
              onClick={() => navigate(item.route)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold transition ${
                isActive
                  ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-sm shadow-pink-500/20'
                  : 'text-zinc-400 hover:bg-zinc-800/80 hover:text-zinc-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 ${
                    isActive ? 'text-white' : item.color || 'text-zinc-400'
                  }`}
                />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-pink-500/20 text-pink-400 border border-pink-500/30'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        {/* Admin Dashboard link (Admin Only: Suresh Bohara) */}
        {isAdmin && (
          <button
            id="sidebar-admin-link"
            onClick={() => navigate('admin')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition ${
              currentRoute === 'admin'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'text-amber-400 hover:bg-amber-950/40'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Admin Center</span>
          </button>
        )}

        <div className="h-px bg-zinc-800 my-1.5" />

        <button
          id="sidebar-logout-btn"
          onClick={logout}
          className="w-full flex items-center gap-3 px-3.5 py-2 rounded-2xl text-xs font-semibold text-rose-400 hover:bg-rose-950/40 transition"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* LoveConnect Safety & Privacy Seal */}
      <div className="p-4 bg-zinc-900/60 rounded-3xl border border-zinc-800 text-zinc-400 text-xs">
        <div className="flex items-center gap-2 font-bold text-zinc-200 mb-1">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Verified & Encrypted</span>
        </div>
        <p className="text-[11px] text-zinc-400 leading-relaxed">
          18+ Age Verified Dating. Your real-time conversations & location privacy are protected.
        </p>
      </div>
    </aside>
  );
};
