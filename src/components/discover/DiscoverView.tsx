import React, { useState } from 'react';
import {
  Compass,
  Search,
  MapPin,
  Heart,
  UserPlus,
  Sparkles,
  ShieldCheck,
  Flame,
  Filter
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { Avatar } from '../common/Avatar';

export const DiscoverView: React.FC = () => {
  const { currentUser, allUsers } = useAuth();
  const { likeProfile, sendConnectionRequest, navigate } = useApp();

  const [selectedCity, setSelectedCity] = useState<string>('ALL');
  const [selectedGender, setSelectedGender] = useState<string>('ALL');
  const [searchFilter, setSearchFilter] = useState('');

  const cities = ['ALL', 'San Francisco', 'New York', 'Austin', 'Los Angeles'];

  const filteredUsers = allUsers.filter((user) => {
    if (user.id === currentUser.id) return false;

    // City filter
    if (selectedCity !== 'ALL' && !user.location.toLowerCase().includes(selectedCity.toLowerCase())) {
      return false;
    }

    // Gender filter
    if (selectedGender !== 'ALL' && user.gender !== selectedGender) {
      return false;
    }

    // Search query
    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase();
      const matchName = user.full_name.toLowerCase().includes(q);
      const matchInterests = user.interests.some((i) => i.toLowerCase().includes(q));
      const matchProfession = (user.profession || '').toLowerCase().includes(q);
      if (!matchName && !matchInterests && !matchProfession) return false;
    }

    return true;
  });

  return (
    <div className="space-y-4">
      {/* Top Header Card */}
      <div className="bg-zinc-900 rounded-3xl p-5 border border-zinc-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 className="text-xl font-extrabold text-zinc-100 font-heading flex items-center gap-2">
              <Compass className="w-5 h-5 text-pink-400" />
              <span>Discover People & Matches</span>
            </h2>
            <p className="text-xs text-zinc-400">
              Explore authentic members by city, shared interests, and lifestyles.
            </p>
          </div>
          <span className="px-3 py-1 bg-pink-500/10 border border-pink-500/20 text-pink-400 text-xs font-bold rounded-full">
            {filteredUsers.length} members found
          </span>
        </div>

        {/* Search & City Filter Row */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search by interests (e.g. Hiking, Coffee, AI, Yoga)..."
              className="w-full text-xs sm:text-sm bg-zinc-800 rounded-2xl py-2.5 pl-10 pr-4 border border-zinc-700 focus:bg-zinc-800 focus:border-pink-500/50 focus:ring-2 focus:ring-pink-500/20 text-zinc-100 placeholder-zinc-500 outline-none transition"
            />
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto no-scrollbar">
            {cities.map((city) => (
              <button
                key={city}
                onClick={() => setSelectedCity(city)}
                className={`px-3 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap transition ${
                  selectedCity === city
                    ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-sm'
                    : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-750 border border-zinc-750'
                }`}
              >
                {city === 'ALL' ? '🌍 All Cities' : city}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid of User Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {filteredUsers.map((user) => (
          <div
            key={user.id}
            id={`discover-card-${user.id}`}
            className="bg-zinc-900 rounded-3xl overflow-hidden border border-zinc-800 shadow-sm hover:border-zinc-700 transition flex flex-col justify-between group"
          >
            {/* Top Photo */}
            <div
              onClick={() => navigate('profile', { username: user.username })}
              className="relative h-56 bg-zinc-950 cursor-pointer overflow-hidden"
            >
              <img
                src={user.avatar_url}
                alt={user.full_name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/90 via-zinc-950/20 to-transparent" />

              {/* Status Badges */}
              <div className="absolute top-3 left-3 flex items-center gap-1.5">
                {user.is_online && (
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/85 backdrop-blur-md text-white text-[10px] font-bold">
                    Online
                  </span>
                )}
                {user.is_verified && (
                  <span className="p-1 rounded-full bg-blue-500 text-white shadow-xs">
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </span>
                )}
              </div>

              {/* Bottom Photo Details */}
              <div className="absolute bottom-3 left-3 right-3 text-white">
                <div className="text-lg font-extrabold drop-shadow-sm flex items-center gap-1.5">
                  <span>{user.full_name}</span>
                  <span className="text-sm font-normal text-white/90">· {user.age} yo</span>
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
                {user.bio || 'Excited to make genuine friends & romantic connections.'}
              </p>

              {/* Interests */}
              <div className="flex flex-wrap gap-1">
                {user.interests.slice(0, 3).map((i) => (
                  <span
                    key={i}
                    className="px-2.5 py-0.5 rounded-full bg-zinc-800 text-[11px] font-medium text-zinc-300 border border-zinc-700/50"
                  >
                    {i}
                  </span>
                ))}
              </div>

              {/* Interaction Buttons */}
              <div className="flex items-center gap-2 pt-2 border-t border-zinc-800">
                <button
                  id={`discover-like-${user.id}`}
                  onClick={() => likeProfile(user.id)}
                  className="flex-1 py-2.5 px-3 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 text-white text-xs font-bold shadow-xs hover:opacity-95 transition flex items-center justify-center gap-1.5"
                >
                  <Flame className="w-3.5 h-3.5" />
                  <span>Dating Like</span>
                </button>

                <button
                  id={`discover-connect-${user.id}`}
                  onClick={() => sendConnectionRequest(user.id)}
                  className="p-2.5 rounded-2xl bg-zinc-800 hover:bg-zinc-750 text-zinc-300 transition border border-zinc-700/50"
                  title="Add Connection"
                >
                  <UserPlus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
