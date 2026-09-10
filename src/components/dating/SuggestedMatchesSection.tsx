import React from 'react';
import { Sparkles, Heart, User, MapPin } from 'lucide-react';
import { Profile } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { Avatar } from '../common/Avatar';
import { sanitizeProfile, calculateMatchDetails } from '../../lib/datingUtils';

interface SuggestedMatchesSectionProps {
  candidates: Profile[];
  onSelectCandidate?: (candidate: Profile) => void;
}

export const SuggestedMatchesSection: React.FC<SuggestedMatchesSectionProps> = ({
  candidates,
  onSelectCandidate
}) => {
  const { currentUser } = useAuth();
  const { likeProfile, navigate } = useApp();

  const suggestedProfiles = React.useMemo(() => {
    if (!currentUser || !candidates) return [];

    return candidates
      .map(candidate => {
        const safeCandidate = sanitizeProfile(candidate);
        const { score, mutualInterests } = calculateMatchDetails(currentUser, safeCandidate);
        return {
          profile: safeCandidate,
          score,
          mutualInterests
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 6);
  }, [candidates, currentUser]);

  if (suggestedProfiles.length === 0) return null;

  return (
    <div className="bg-zinc-900/80 rounded-3xl p-4 sm:p-5 border border-zinc-800 space-y-3.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-pink-500/15 text-pink-400 border border-pink-500/20">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-100 font-heading">
              Suggested High Matches
            </h3>
            <p className="text-[11px] text-zinc-400">
              Curated by shared interests and dating preferences
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {suggestedProfiles.map(({ profile, score, mutualInterests }) => (
          <div
            key={profile.id}
            className="bg-zinc-850 hover:bg-zinc-800/90 rounded-2xl p-3 border border-zinc-750/80 transition flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-start gap-2.5">
                <Avatar
                  src={profile.avatar_url}
                  name={profile.full_name}
                  size="md"
                  isOnline={profile.is_online}
                  isVerified={profile.is_verified}
                  onClick={() => {
                    if (onSelectCandidate) onSelectCandidate(profile);
                    else navigate('profile', { username: profile.username });
                  }}
                />

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <h4
                      onClick={() => {
                        if (onSelectCandidate) onSelectCandidate(profile);
                        else navigate('profile', { username: profile.username });
                      }}
                      className="text-xs font-bold text-zinc-100 hover:text-pink-400 transition truncate cursor-pointer"
                    >
                      {profile.full_name}, {profile.age}
                    </h4>
                    <span className="text-[10px] font-extrabold text-pink-400 bg-pink-500/15 px-2 py-0.5 rounded-full border border-pink-500/20 shrink-0">
                      {score}%
                    </span>
                  </div>

                  <div className="text-[11px] text-zinc-400 truncate flex items-center gap-1 mt-0.5">
                    <MapPin className="w-2.5 h-2.5 text-pink-400" />
                    <span>{profile.neighborhood || (profile.location ? profile.location.split(',')[0] : 'Nearby')}</span>
                  </div>
                </div>
              </div>

              {/* Mutual interests tag */}
              {mutualInterests.length > 0 && (
                <div className="mt-2 text-[10px] text-pink-300/90 bg-pink-950/30 px-2 py-1 rounded-lg border border-pink-900/30 truncate">
                  Mutual: <span className="font-semibold text-pink-200">{mutualInterests.slice(0, 2).join(', ')}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-1.5 mt-3 pt-2.5 border-t border-zinc-750">
              <button
                onClick={() => {
                  if (onSelectCandidate) onSelectCandidate(profile);
                  else navigate('profile', { username: profile.username });
                }}
                className="flex-1 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-[11px] font-semibold transition border border-zinc-700/60 flex items-center justify-center gap-1"
              >
                <User className="w-3 h-3" />
                <span>View</span>
              </button>

              <button
                id={`suggested-like-${profile.id}`}
                onClick={() => likeProfile(profile.id)}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white text-[11px] font-bold shadow-xs hover:opacity-95 transition flex items-center justify-center gap-1"
                title="Like this profile"
              >
                <Heart className="w-3 h-3 fill-white" />
                <span>Like</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
