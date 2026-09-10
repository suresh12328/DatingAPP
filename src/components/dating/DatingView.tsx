import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Flame,
  HeartHandshake,
  Heart,
  Sliders,
  RotateCcw,
  Sparkles,
  History,
  Undo2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { DatingPreferences, Profile } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { store } from '../../lib/storage';
import { DatingCard } from './DatingCard';
import { DatingFiltersModal } from './DatingFiltersModal';
import { MatchesView } from './MatchesView';
import { LikesYouView } from './LikesYouView';
import { MatchHistoryView } from './MatchHistoryView';
import { SuggestedMatchesSection } from './SuggestedMatchesSection';
import { RecentlyActiveBar } from './RecentlyActiveBar';
import { EmptyState } from '../common/EmptyState';
import { ErrorBoundary } from '../common/ErrorBoundary';
import {
  getDefaultDatingPreferences,
  sanitizeProfile,
  calculateMatchDetails,
  DEFAULT_DATING_PREFERENCES
} from '../../lib/datingUtils';

export const DatingViewContent: React.FC = () => {
  const { currentUser, allUsers } = useAuth();
  const {
    currentRoute,
    navigate,
    matches,
    likeProfile,
    passProfile,
    undoDatingAction
  } = useApp();

  const [activeTab, setActiveTab] = useState<'cards' | 'suggested' | 'matches' | 'likes' | 'history'>(() => {
    if (currentRoute === 'matches') return 'matches';
    if (currentRoute === 'likes') return 'likes';
    return 'cards';
  });

  const [filters, setFilters] = useState<DatingPreferences>(() =>
    getDefaultDatingPreferences(currentUser?.dating_preferences)
  );
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [deckIndex, setDeckIndex] = useState(0);
  const [canUndo, setCanUndo] = useState(false);

  // Sync tab if outer route changed to 'matches' or 'likes'
  useEffect(() => {
    if (currentRoute === 'matches') setActiveTab('matches');
    else if (currentRoute === 'likes') setActiveTab('likes');
  }, [currentRoute]);

  // Safe candidates filtering
  const candidates = useMemo(() => {
    if (!allUsers || allUsers.length === 0 || !currentUser) return [];

    const safeFilters = filters || getDefaultDatingPreferences(currentUser.dating_preferences);

    return allUsers.filter((u) => {
      if (!u || u.id === currentUser.id) return false;
      if (u.privacy && u.privacy.datingVisible === false) return false;

      // Gender filter
      if (safeFilters.interested_in === 'WOMEN' && u.gender !== 'WOMAN') return false;
      if (safeFilters.interested_in === 'MEN' && u.gender !== 'MAN') return false;

      // Age filter
      const minAge = safeFilters.age_range?.min ?? 18;
      const maxAge = safeFilters.age_range?.max ?? 70;
      if (typeof u.age === 'number' && (u.age < minAge || u.age > maxAge)) return false;

      // Verified filter
      if (safeFilters.only_verified && !u.is_verified) return false;

      return true;
    });
  }, [allUsers, currentUser, filters]);

  // Current candidate profile safely resolved
  const currentCandidate: Profile | undefined = useMemo(() => {
    if (!candidates || candidates.length === 0) return undefined;
    const safeIdx = Math.abs(deckIndex) % candidates.length;
    return sanitizeProfile(candidates[safeIdx]);
  }, [candidates, deckIndex]);

  // Match details calculation
  const currentMatchDetails = useMemo(() => {
    if (!currentUser || !currentCandidate) {
      return { score: 88, mutualInterests: [] };
    }
    return calculateMatchDetails(currentUser, currentCandidate);
  }, [currentUser, currentCandidate]);

  const handleLike = useCallback(() => {
    if (currentCandidate) {
      likeProfile(currentCandidate.id, false);
      setDeckIndex((prev) => prev + 1);
      setCanUndo(true);
    }
  }, [currentCandidate, likeProfile]);

  const handleSuperLike = useCallback(() => {
    if (currentCandidate) {
      likeProfile(currentCandidate.id, true);
      setDeckIndex((prev) => prev + 1);
      setCanUndo(true);
    }
  }, [currentCandidate, likeProfile]);

  const handlePass = useCallback(() => {
    if (currentCandidate) {
      passProfile(currentCandidate.id);
      setDeckIndex((prev) => prev + 1);
      setCanUndo(true);
    }
  }, [currentCandidate, passProfile]);

  const handleUndo = useCallback(async () => {
    if (canUndo) {
      await undoDatingAction();
      setDeckIndex((prev) => Math.max(0, prev - 1));
      setCanUndo(false);
    }
  }, [canUndo, undoDatingAction]);

  const handleResetDeck = () => {
    setDeckIndex(0);
  };

  const handleResetFilters = () => {
    setFilters(DEFAULT_DATING_PREFERENCES);
    setDeckIndex(0);
  };

  // Keyboard navigation shortcuts
  useEffect(() => {
    if (activeTab !== 'cards') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePass();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleLike();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        handleSuperLike();
      } else if (e.key === 'z' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handleUndo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, handlePass, handleLike, handleSuperLike, handleUndo]);

  const likesReceivedCount = useMemo(() => {
    try {
      return store.getLikesReceived()?.length || 0;
    } catch {
      return 0;
    }
  }, []);

  return (
    <div className="space-y-4">
      {/* Dating Header */}
      <div className="bg-zinc-900 rounded-3xl p-4 sm:p-5 border border-zinc-800 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-500 via-rose-500 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-pink-500/20">
              <Flame className="w-5 h-5 fill-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-black text-zinc-100 font-heading">
                  LoveConnect Dating
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-pink-500/15 text-pink-400 text-[10px] font-bold border border-pink-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-pulse" />
                  Dating Mode Active
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Authentic dating with real-time match compatibility
              </p>
            </div>
          </div>

          {/* Quick Action controls */}
          <div className="flex items-center gap-2">
            {canUndo && (
              <button
                onClick={handleUndo}
                className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-zinc-800 hover:bg-zinc-750 text-zinc-300 hover:text-white text-xs font-semibold border border-zinc-700/60 transition"
                title="Undo last swipe"
              >
                <Undo2 className="w-3.5 h-3.5 text-pink-400" />
                <span className="hidden sm:inline">Undo</span>
              </button>
            )}

            <button
              id="dating-open-filters-btn"
              onClick={() => setShowFiltersModal(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-zinc-800 hover:bg-zinc-750 text-zinc-200 text-xs font-semibold transition border border-zinc-700/60 shadow-xs"
            >
              <Sliders className="w-3.5 h-3.5 text-pink-400" />
              <span>Filters</span>
              {filters.only_verified && (
                <span className="w-2 h-2 rounded-full bg-pink-500" />
              )}
            </button>
          </div>
        </div>

        {/* Sub-Navigation Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-zinc-800/90 rounded-2xl overflow-x-auto scrollbar-none">
          <button
            id="dating-tab-discover"
            onClick={() => setActiveTab('cards')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === 'cards'
                ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-xs'
                : 'text-zinc-400 hover:text-zinc-100'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Discover</span>
          </button>

          <button
            id="dating-tab-suggested"
            onClick={() => setActiveTab('suggested')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === 'suggested'
                ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-xs'
                : 'text-zinc-400 hover:text-zinc-100'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Suggested</span>
          </button>

          <button
            id="dating-tab-matches"
            onClick={() => setActiveTab('matches')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === 'matches'
                ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-xs'
                : 'text-zinc-400 hover:text-zinc-100'
            }`}
          >
            <HeartHandshake className="w-3.5 h-3.5" />
            <span>Mutual Matches</span>
            {matches.length > 0 && (
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-extrabold ${
                  activeTab === 'matches'
                    ? 'bg-white/20 text-white'
                    : 'bg-pink-500/20 text-pink-400 border border-pink-500/30'
                }`}
              >
                {matches.length}
              </span>
            )}
          </button>

          <button
            id="dating-tab-likes"
            onClick={() => setActiveTab('likes')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === 'likes'
                ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-xs'
                : 'text-zinc-400 hover:text-zinc-100'
            }`}
          >
            <Heart className="w-3.5 h-3.5" />
            <span>Likes You</span>
            {likesReceivedCount > 0 && (
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-extrabold ${
                  activeTab === 'likes'
                    ? 'bg-white/20 text-white'
                    : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                }`}
              >
                {likesReceivedCount}
              </span>
            )}
          </button>

          <button
            id="dating-tab-history"
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === 'history'
                ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-xs'
                : 'text-zinc-400 hover:text-zinc-100'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Match History</span>
          </button>
        </div>
      </div>

      {/* Recently Active People Carousel */}
      <RecentlyActiveBar
        users={allUsers}
        onSelectCandidate={(profile) => {
          const idx = candidates.findIndex(c => c.id === profile.id);
          if (idx !== -1) {
            setDeckIndex(idx);
            setActiveTab('cards');
          } else {
            navigate('profile', { username: profile.username });
          }
        }}
      />

      {/* Active Tab Views */}
      {activeTab === 'matches' && <MatchesView />}
      {activeTab === 'likes' && <LikesYouView />}
      {activeTab === 'history' && <MatchHistoryView />}

      {activeTab === 'suggested' && (
        <SuggestedMatchesSection
          candidates={candidates}
          onSelectCandidate={(profile) => {
            const idx = candidates.findIndex(c => c.id === profile.id);
            if (idx !== -1) {
              setDeckIndex(idx);
              setActiveTab('cards');
            } else {
              navigate('profile', { username: profile.username });
            }
          }}
        />
      )}

      {activeTab === 'cards' && (
        <div className="space-y-6">
          <div className="flex flex-col items-center">
            {candidates.length > 0 && currentCandidate ? (
              <div className="w-full max-w-md">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentCandidate.id + deckIndex}
                    initial={{ opacity: 0, scale: 0.96, y: 12 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.92, y: -12 }}
                    transition={{ duration: 0.2 }}
                    className="w-full flex justify-center"
                  >
                    <DatingCard
                      profile={currentCandidate}
                      compatibilityScore={currentMatchDetails.score}
                      mutualInterests={currentMatchDetails.mutualInterests}
                      onLike={handleLike}
                      onPass={handlePass}
                      onSuperLike={handleSuperLike}
                      onViewProfile={() => navigate('profile', { username: currentCandidate.username })}
                    />
                  </motion.div>
                </AnimatePresence>

                {/* Card controls helper */}
                <div className="mt-3 flex items-center justify-between text-[11px] text-zinc-500 px-3">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={handleResetDeck}
                      className="flex items-center gap-1 hover:text-zinc-300 transition"
                      title="Start deck over"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Restart deck</span>
                    </button>
                  </div>

                  <div className="hidden sm:block">
                    Keyboard: ← Pass · ↑ Super Like · → Like
                  </div>

                  <div>
                    Profile {((deckIndex % candidates.length) + 1)} of {candidates.length}
                  </div>
                </div>
              </div>
            ) : (
              <div className="w-full">
                <EmptyState
                  icon={Sparkles}
                  title="You've seen all nearby matches!"
                  description="We couldn't find more members matching your current age, distance, or verification filters. Expand your preferences to discover more people!"
                  actionText="Reset Filters to Default"
                  onAction={handleResetFilters}
                />
              </div>
            )}
          </div>

          {/* Suggested matches section below the swipe deck */}
          <SuggestedMatchesSection
            candidates={candidates}
            onSelectCandidate={(profile) => {
              const idx = candidates.findIndex(c => c.id === profile.id);
              if (idx !== -1) {
                setDeckIndex(idx);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              } else {
                navigate('profile', { username: profile.username });
              }
            }}
          />
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

export const DatingView: React.FC = () => {
  return (
    <ErrorBoundary
      fallbackTitle="Dating Mode Recovery"
      fallbackMessage="We encountered an issue preparing the dating deck. Click below to refresh your match deck."
    >
      <DatingViewContent />
    </ErrorBoundary>
  );
};
