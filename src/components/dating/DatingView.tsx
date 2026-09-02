import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Flame,
  HeartHandshake,
  Heart,
  Sliders,
  RotateCcw,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { DatingPreferences, Profile } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { store } from '../../lib/storage';
import { DatingCard } from './DatingCard';
import { DatingFiltersModal } from './DatingFiltersModal';
import { MatchesView } from './MatchesView';
import { LikesYouView } from './LikesYouView';
import { EmptyState } from '../common/EmptyState';

export const DatingView: React.FC = () => {
  const { currentUser, allUsers } = useAuth();
  const {
    currentRoute,
    navigate,
    matches,
    likeProfile,
    passProfile
  } = useApp();

  const [activeTab, setActiveTab] = useState<'cards' | 'matches' | 'likes'>(
    currentRoute === 'matches' ? 'matches' : currentRoute === 'likes' ? 'likes' : 'cards'
  );

  const [filters, setFilters] = useState<DatingPreferences>(currentUser.dating_preferences);
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [deckIndex, setDeckIndex] = useState(0);

  // Filter candidates matching user preference
  const candidates = useMemo(() => {
    return allUsers.filter((u) => {
      if (u.id === currentUser.id) return false;
      if (!u.privacy.datingVisible) return false;

      // Gender filter
      if (filters.interested_in === 'WOMEN' && u.gender !== 'WOMAN') return false;
      if (filters.interested_in === 'MEN' && u.gender !== 'MAN') return false;

      // Age filter
      if (u.age < filters.age_range.min || u.age > filters.age_range.max) return false;

      // Verified filter
      if (filters.only_verified && !u.is_verified) return false;

      return true;
    });
  }, [allUsers, currentUser.id, filters]);

  const currentCandidate: Profile | undefined = candidates[deckIndex % Math.max(candidates.length, 1)];

  const handleLike = () => {
    if (currentCandidate) {
      likeProfile(currentCandidate.id, false);
      setDeckIndex((prev) => prev + 1);
    }
  };

  const handleSuperLike = () => {
    if (currentCandidate) {
      likeProfile(currentCandidate.id, true);
      setDeckIndex((prev) => prev + 1);
    }
  };

  const handlePass = () => {
    if (currentCandidate) {
      passProfile(currentCandidate.id);
      setDeckIndex((prev) => prev + 1);
    }
  };

  const handleResetDeck = () => {
    setDeckIndex(0);
  };

  return (
    <div className="space-y-4">
      {/* Top Header & Sub-Nav Bar */}
      <div className="bg-zinc-900 rounded-3xl p-3 sm:p-4 border border-zinc-800 shadow-sm flex flex-wrap items-center justify-between gap-3">
        {/* Subtabs */}
        <div className="flex items-center gap-1.5 p-1 bg-zinc-800 rounded-2xl">
          <button
            id="dating-tab-discover"
            onClick={() => setActiveTab('cards')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'cards'
                ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-xs'
                : 'text-zinc-400 hover:text-zinc-100'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Discover</span>
          </button>

          <button
            id="dating-tab-matches"
            onClick={() => setActiveTab('matches')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'matches'
                ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-xs'
                : 'text-zinc-400 hover:text-zinc-100'
            }`}
          >
            <HeartHandshake className="w-3.5 h-3.5" />
            <span>Matches</span>
            {matches.length > 0 && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  activeTab === 'matches' ? 'bg-white/20 text-white' : 'bg-pink-500/20 text-pink-400 border border-pink-500/30'
                }`}
              >
                {matches.length}
              </span>
            )}
          </button>

          <button
            id="dating-tab-likes"
            onClick={() => setActiveTab('likes')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'likes'
                ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-xs'
                : 'text-zinc-400 hover:text-zinc-100'
            }`}
          >
            <Heart className="w-3.5 h-3.5" />
            <span>Likes You</span>
          </button>
        </div>

        {/* Filter Toggle */}
        <button
          id="dating-open-filters-btn"
          onClick={() => setShowFiltersModal(true)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-zinc-800 hover:bg-zinc-750 text-zinc-200 text-xs font-semibold transition border border-zinc-700/60"
        >
          <Sliders className="w-3.5 h-3.5 text-pink-400" />
          <span>Filters</span>
        </button>
      </div>

      {/* Main Content Area */}
      {activeTab === 'matches' && <MatchesView />}
      {activeTab === 'likes' && <LikesYouView />}

      {activeTab === 'cards' && (
        <div className="flex flex-col items-center">
          {candidates.length > 0 && currentCandidate ? (
            <AnimatePresence mode="wait">
              <motion.div
                key={currentCandidate.id + deckIndex}
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -10 }}
                transition={{ duration: 0.2 }}
                className="w-full flex justify-center"
              >
                <DatingCard
                  profile={currentCandidate}
                  onLike={handleLike}
                  onPass={handlePass}
                  onSuperLike={handleSuperLike}
                  onViewProfile={() => navigate('profile', { username: currentCandidate.username })}
                />
              </motion.div>
            </AnimatePresence>
          ) : (
            <EmptyState
              icon={Sparkles}
              title="You've seen all nearby matches!"
              description="Expand your age or distance preferences to meet more incredible people in your area."
              actionText="Adjust Filter Preferences"
              onAction={() => setShowFiltersModal(true)}
            />
          )}

          {/* Restart Deck Button */}
          {candidates.length > 0 && (
            <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
              <button
                onClick={handleResetDeck}
                className="flex items-center gap-1.5 hover:text-slate-600 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Review profiles again</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Dating Filters Modal */}
      {showFiltersModal && (
        <DatingFiltersModal
          initialFilters={filters}
          onApply={(newFilters) => {
            setFilters(newFilters);
            setDeckIndex(0);
          }}
          onClose={() => setShowFiltersModal(false)}
        />
      )}
    </div>
  );
};
