import React from 'react';
import { Home, Compass, Flame, MessageCircle, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';

export const MobileBottomNav: React.FC = () => {
  const { currentUser } = useAuth();
  const { currentRoute, navigate, unreadMessagesCount } = useApp();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-zinc-900/95 backdrop-blur-lg border-t border-zinc-800 px-2 py-1.5 flex items-center justify-around shadow-2xl">
      <button
        id="mobile-nav-home"
        onClick={() => navigate('home')}
        className={`flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition ${
          currentRoute === 'home' ? 'text-pink-400 font-bold' : 'text-zinc-400'
        }`}
      >
        <Home className="w-5 h-5" />
        <span className="text-[10px]">Home</span>
      </button>

      <button
        id="mobile-nav-discover"
        onClick={() => navigate('discover')}
        className={`flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition ${
          currentRoute === 'discover' ? 'text-pink-400 font-bold' : 'text-zinc-400'
        }`}
      >
        <Compass className="w-5 h-5" />
        <span className="text-[10px]">Discover</span>
      </button>

      {/* Main Dating Button */}
      <button
        id="mobile-nav-dating"
        onClick={() => navigate('dating')}
        className="flex flex-col items-center relative -top-3"
      >
        <div className="w-13 h-13 rounded-full bg-gradient-to-tr from-pink-500 via-purple-500 to-blue-500 flex items-center justify-center text-white shadow-lg shadow-pink-500/30 ring-4 ring-zinc-900 active:scale-95 transition">
          <Flame className="w-6 h-6 fill-white" />
        </div>
        <span className="text-[10px] font-bold text-pink-400 mt-0.5">Dating</span>
      </button>

      <button
        id="mobile-nav-messages"
        onClick={() => navigate('messages')}
        className={`flex flex-col items-center gap-1 py-1 px-3 rounded-2xl relative transition ${
          currentRoute === 'messages' ? 'text-pink-400 font-bold' : 'text-zinc-400'
        }`}
      >
        <MessageCircle className="w-5 h-5" />
        {unreadMessagesCount > 0 && (
          <span className="absolute top-0 right-3 bg-pink-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center ring-2 ring-zinc-900">
            {unreadMessagesCount}
          </span>
        )}
        <span className="text-[10px]">Messages</span>
      </button>

      <button
        id="mobile-nav-profile"
        onClick={() => navigate('profile', { username: currentUser.username })}
        className={`flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition ${
          currentRoute === 'profile' ? 'text-pink-400 font-bold' : 'text-zinc-400'
        }`}
      >
        <User className="w-5 h-5" />
        <span className="text-[10px]">Profile</span>
      </button>
    </nav>
  );
};
