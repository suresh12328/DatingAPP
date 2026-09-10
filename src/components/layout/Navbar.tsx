import React, { useState, useRef, useEffect } from 'react';
import {
  Heart,
  Search,
  Home,
  Compass,
  Film,
  Flame,
  MessageCircle,
  Bell,
  Sliders,
  ShieldCheck,
  LogOut,
  ShieldAlert,
  ChevronDown,
  User,
  Mail
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { Avatar } from '../common/Avatar';

export const Navbar: React.FC = () => {
  const { currentUser, allUsers, logout } = useAuth();
  const isAdmin = true;
  const {
    currentRoute,
    navigate,
    unreadNotifsCount,
    unreadMessagesCount,
    notifications,
    markNotificationRead,
    searchQuery,
    setSearchQuery
  } = useApp();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotifsOpen, setIsNotifsOpen] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notifMenuRef = useRef<HTMLDivElement>(null);

  // Close popups on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
      if (notifMenuRef.current && !notifMenuRef.current.contains(event.target as Node)) {
        setIsNotifsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchResults = allUsers
    .filter(
      (u) =>
        u.id !== currentUser.id &&
        (u.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
          u.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
          u.interests.some((i) => i.toLowerCase().includes(searchQuery.toLowerCase())))
    )
    .slice(0, 5);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setIsSearchOpen(false);
      navigate('search', { query: searchQuery.trim() });
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-zinc-900/80 backdrop-blur-md border-b border-zinc-800 shadow-sm">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Logo & Search */}
        <div className="flex items-center gap-3 sm:gap-5 flex-1 max-w-md">
          <button
            id="navbar-brand-logo"
            onClick={() => navigate('home')}
            className="flex items-center gap-2.5 shrink-0 group focus:outline-none"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-500 via-purple-500 to-blue-500 flex items-center justify-center text-white shadow-md shadow-pink-500/25 group-hover:scale-105 transition">
              <Heart className="w-5 h-5 fill-white" />
            </div>
            <div className="hidden lg:block text-left leading-tight">
              <span className="font-extrabold text-xl tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 font-heading">
                LoveConnect
              </span>
              <span className="block text-[10px] text-zinc-500 font-medium tracking-wide">
                Connect. Share. Meet.
              </span>
            </div>
          </button>

          {/* Search input with live suggestion popover */}
          <div ref={searchRef} className="relative flex-1">
            <form onSubmit={handleSearchSubmit} className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                id="navbar-search-input"
                type="text"
                value={searchQuery}
                onFocus={() => setIsSearchOpen(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsSearchOpen(true);
                }}
                placeholder="Search people, city, interests..."
                className="w-full bg-zinc-800/90 hover:bg-zinc-800 focus:bg-zinc-800 text-zinc-100 placeholder-zinc-500 text-xs sm:text-sm rounded-full py-2.5 pl-10 pr-4 border border-zinc-700/60 focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition outline-none"
              />
            </form>

            {/* Live Autocomplete Dropdown */}
            {isSearchOpen && searchQuery.trim().length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-800 p-2 z-50 animate-in fade-in slide-in-from-top-1">
                <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider px-3 py-1.5">
                  Suggested People & Matches
                </div>
                {searchResults.length > 0 ? (
                  searchResults.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => {
                        setIsSearchOpen(false);
                        navigate('profile', { username: user.username });
                      }}
                      className="w-full flex items-center gap-3 p-2 hover:bg-zinc-800/80 rounded-xl text-left transition"
                    >
                      <Avatar src={user.avatar_url} name={user.full_name} size="sm" isOnline={user.is_online} isVerified={user.is_verified} />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs sm:text-sm font-semibold text-zinc-100 flex items-center gap-1.5">
                          <span>{user.full_name}</span>
                          <span className="text-zinc-400 font-normal">· {user.age} yo</span>
                        </div>
                        <div className="text-[11px] text-zinc-400 truncate">
                          {user.location} · {user.profession}
                        </div>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="p-3 text-center text-xs text-zinc-500">
                    No users matching "{searchQuery}"
                  </div>
                )}
                <button
                  onClick={() => {
                    setIsSearchOpen(false);
                    navigate('search', { query: searchQuery });
                  }}
                  className="w-full mt-1 pt-2 border-t border-zinc-800 text-center text-xs font-semibold text-pink-400 hover:text-pink-300 py-1"
                >
                  See all results for "{searchQuery}"
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Center: Main App Tabs (Desktop & Tablet) */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2">
          <button
            id="nav-tab-home"
            onClick={() => navigate('home')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs lg:text-sm font-semibold transition ${
              currentRoute === 'home'
                ? 'bg-zinc-800 text-white'
                : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60'
            }`}
          >
            <Home className="w-4 h-4" />
            <span className="hidden xl:inline">Home</span>
          </button>

          <button
            id="nav-tab-discover"
            onClick={() => navigate('discover')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs lg:text-sm font-semibold transition ${
              currentRoute === 'discover'
                ? 'bg-zinc-800 text-white'
                : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span className="hidden xl:inline">Discover</span>
          </button>

          <button
            id="nav-tab-reels"
            onClick={() => navigate('reels')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs lg:text-sm font-semibold transition ${
              currentRoute === 'reels'
                ? 'bg-zinc-800 text-white'
                : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60'
            }`}
          >
            <Film className="w-4 h-4" />
            <span className="hidden xl:inline">Reels</span>
          </button>

          <button
            id="nav-tab-dating"
            onClick={() => navigate('dating')}
            className={`relative flex items-center gap-2 px-4 py-2 rounded-2xl text-xs lg:text-sm font-bold transition shadow-xs ${
              currentRoute === 'dating' || currentRoute === 'likes' || currentRoute === 'matches'
                ? 'bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 text-white shadow-pink-500/20'
                : 'bg-pink-500/10 text-pink-400 hover:bg-pink-500/20 border border-pink-500/20'
            }`}
          >
            <Flame className="w-4 h-4" />
            <span>Dating</span>
            <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping absolute -top-0.5 -right-0.5" />
          </button>
        </nav>

        {/* Right: Actions, Notifications, Profile */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Gmail Button (Admin Only: Suresh Bohara) */}
          {isAdmin && (
            <button
              id="navbar-gmail-btn"
              onClick={() => navigate('gmail')}
              className={`relative p-2.5 rounded-2xl border transition ${
                currentRoute === 'gmail'
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  : 'bg-zinc-800 hover:bg-zinc-750 text-zinc-300 hover:text-white border-zinc-700/50'
              }`}
              title="Gmail Workspace"
            >
              <Mail className="w-5 h-5" />
            </button>
          )}

          {/* Messages Button */}
          <button
            id="navbar-messages-btn"
            onClick={() => navigate('messages')}
            className="relative p-2.5 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700/50 transition"
            title="Messages"
          >
            <MessageCircle className="w-5 h-5" />
            {unreadMessagesCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center ring-2 ring-zinc-900 animate-pulse">
                {unreadMessagesCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          <div ref={notifMenuRef} className="relative">
            <button
              id="navbar-notifications-btn"
              onClick={() => setIsNotifsOpen(!isNotifsOpen)}
              className="relative p-2.5 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700/50 transition"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadNotifsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-gradient-to-r from-pink-500 to-purple-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center ring-2 ring-zinc-900">
                  {unreadNotifsCount}
                </span>
              )}
            </button>

            {isNotifsOpen && (
              <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-800 p-3 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800">
                  <div className="font-bold text-sm text-zinc-100 flex items-center gap-2">
                    <Bell className="w-4 h-4 text-pink-500" />
                    <span>Notifications</span>
                    {unreadNotifsCount > 0 && (
                      <span className="bg-pink-500/20 text-pink-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-pink-500/30">
                        {unreadNotifsCount} new
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setIsNotifsOpen(false);
                      navigate('notifications');
                    }}
                    className="text-xs font-semibold text-pink-400 hover:text-pink-300"
                  >
                    View All
                  </button>
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-zinc-800/60 py-1">
                  {notifications.slice(0, 5).map((n) => (
                    <div
                      key={n.id}
                      onClick={() => {
                        markNotificationRead(n.id);
                        setIsNotifsOpen(false);
                        navigate(n.link_route.replace('/', '') as any);
                      }}
                      className={`p-3 rounded-2xl flex items-start gap-3 cursor-pointer transition ${
                        !n.is_read ? 'bg-pink-500/10 hover:bg-pink-500/20' : 'hover:bg-zinc-800/60'
                      }`}
                    >
                      <Avatar src={n.actor.avatar_url} name={n.actor.full_name} size="sm" />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-zinc-100">{n.title}</div>
                        <p className="text-xs text-zinc-400 line-clamp-2 mt-0.5">{n.message}</p>
                      </div>
                      {!n.is_read && <span className="w-2 h-2 rounded-full bg-pink-500 shrink-0 mt-1" />}
                    </div>
                  ))}
                  {notifications.length === 0 && (
                    <div className="py-6 text-center text-xs text-zinc-500">
                      No notifications yet
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Avatar & Dropdown */}
          <div ref={userMenuRef} className="relative">
            <button
              id="navbar-user-menu-btn"
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-2 p-1 pl-1.5 pr-2.5 rounded-full bg-zinc-800 hover:bg-zinc-750 border border-zinc-700/50 transition focus:outline-none"
            >
              <Avatar
                src={currentUser.avatar_url}
                name={currentUser.full_name}
                size="sm"
                isOnline={currentUser.is_online}
                isVerified={currentUser.is_verified}
              />
              <span className="hidden sm:inline text-xs font-bold text-zinc-200 max-w-[90px] truncate">
                {currentUser.full_name.split(' ')[0]}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
            </button>

            {isUserMenuOpen && (
              <div className="absolute right-0 mt-3 w-72 bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-800 p-2.5 z-50 animate-in fade-in slide-in-from-top-2">
                {/* Profile Header */}
                <div className="p-3 bg-zinc-800/80 border border-zinc-700/50 rounded-2xl mb-2 flex items-center gap-3">
                  <Avatar src={currentUser.avatar_url} name="Suresh Bohara" size="md" isVerified={true} />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-bold text-zinc-100 truncate flex items-center gap-1">
                      <span>Suresh Bohara</span>
                    </div>
                    <div className="text-xs text-zinc-400 truncate">@suresh_bohara</div>
                    <div className="text-[10px] font-bold text-pink-400 uppercase mt-0.5 tracking-wider">
                      ROLE: ADMIN
                    </div>
                  </div>
                </div>

                {/* Menu items */}
                <div className="space-y-0.5">
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      navigate('profile', { username: currentUser.username });
                    }}
                    className="w-full flex items-center gap-2.5 p-2.5 rounded-xl text-xs font-semibold text-zinc-300 hover:bg-zinc-800 transition"
                  >
                    <User className="w-4 h-4 text-zinc-400" />
                    <span>My Profile</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      navigate('safety');
                    }}
                    className="w-full flex items-center gap-2.5 p-2.5 rounded-xl text-xs font-semibold text-zinc-300 hover:bg-zinc-800 transition"
                  >
                    <ShieldCheck className="w-4 h-4 text-zinc-400" />
                    <span>Safety & Privacy Center</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      navigate('settings');
                    }}
                    className="w-full flex items-center gap-2.5 p-2.5 rounded-xl text-xs font-semibold text-zinc-300 hover:bg-zinc-800 transition"
                  >
                    <Sliders className="w-4 h-4 text-zinc-400" />
                    <span>Account Settings</span>
                  </button>

                  {/* Admin Dashboard */}
                  {isAdmin ? (
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        navigate('admin');
                      }}
                      className="w-full flex items-center gap-2.5 p-2.5 rounded-xl text-xs font-bold text-amber-400 hover:bg-amber-950/40 border border-amber-500/20 transition"
                    >
                      <ShieldAlert className="w-4 h-4 text-amber-400" />
                      <span>Admin & Moderation Panel</span>
                    </button>
                  ) : null}

                  <div className="h-px bg-zinc-800 my-1" />

                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-2.5 p-2.5 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-950/40 transition"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
