import React from 'react';
import { Radio } from 'lucide-react';
import { Profile } from '../../types';
import { useApp } from '../../context/AppContext';
import { Avatar } from '../common/Avatar';
import { sanitizeProfile } from '../../lib/datingUtils';

interface RecentlyActiveBarProps {
  users: Profile[];
  onSelectCandidate?: (user: Profile) => void;
}

export const RecentlyActiveBar: React.FC<RecentlyActiveBarProps> = ({
  users,
  onSelectCandidate
}) => {
  const { navigate } = useApp();

  const activeUsers = React.useMemo(() => {
    return users
      .filter(u => u.is_online || (u.last_active && u.last_active.toLowerCase().includes('now')))
      .slice(0, 10);
  }, [users]);

  if (activeUsers.length === 0) return null;

  return (
    <div className="bg-zinc-900/80 rounded-3xl p-3 sm:p-4 border border-zinc-800">
      <div className="flex items-center gap-2 mb-2.5 px-1">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
        </span>
        <span className="text-xs font-bold text-zinc-200">
          Recently Active Nearby
        </span>
      </div>

      <div className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-none">
        {activeUsers.map((rawUser) => {
          const user = sanitizeProfile(rawUser);
          return (
            <button
              key={user.id}
              onClick={() => {
                if (onSelectCandidate) {
                  onSelectCandidate(user);
                } else {
                  navigate('profile', { username: user.username });
                }
              }}
              className="flex flex-col items-center gap-1 shrink-0 group focus:outline-none"
            >
              <div className="relative p-0.5 rounded-full ring-2 ring-emerald-500/40 group-hover:ring-pink-500 transition">
                <Avatar
                  src={user.avatar_url}
                  name={user.full_name}
                  size="md"
                  isOnline={true}
                  isVerified={user.is_verified}
                />
              </div>
              <span className="text-[11px] font-medium text-zinc-300 group-hover:text-pink-400 max-w-[64px] truncate transition">
                {user.full_name.split(' ')[0]}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
