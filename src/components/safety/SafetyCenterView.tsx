import React from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Lock,
  Eye,
  AlertTriangle,
  UserX,
  PhoneCall,
  HeartHandshake
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { Avatar } from '../common/Avatar';

export const SafetyCenterView: React.FC = () => {
  const { currentUser } = useAuth();
  const { blockedUsers, unblockUser } = useApp();

  const safetyGuidelines = [
    {
      title: 'Mandatory 18+ Age Verification',
      desc: 'LoveConnect strictly prohibits anyone under the age of 18 from creating an account or accessing dating features. All accounts undergo verification protocols.',
      icon: ShieldCheck,
      color: 'text-emerald-600 bg-emerald-50'
    },
    {
      title: 'First Date Safety: Meet in Public',
      desc: 'Always arrange initial meetings in well-lit public places like coffee shops or restaurants. Never share your private home address on first encounters.',
      icon: HeartHandshake,
      color: 'text-pink-600 bg-pink-50'
    },
    {
      title: 'Financial Scam Protection',
      desc: 'Never send money, wire transfers, or cryptocurrency to anyone you meet online. Report any user asking for financial assistance immediately.',
      icon: AlertTriangle,
      color: 'text-amber-600 bg-amber-50'
    },
    {
      title: 'Location & Privacy Controls',
      desc: 'We only show city and approximate neighborhood level distances to protect your exact GPS coordinates and residence.',
      icon: Lock,
      color: 'text-indigo-600 bg-indigo-50'
    }
  ];

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-pink-600 via-rose-600 to-indigo-700 rounded-3xl p-6 text-white shadow-md">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-md">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold font-heading">
              LoveConnect Safety & Trust Center
            </h1>
            <p className="text-xs sm:text-sm text-white/80">
              Your safety, privacy, and authentic connections are our #1 priority.
            </p>
          </div>
        </div>
      </div>

      {/* Safety Rules Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {safetyGuidelines.map((guide, idx) => {
          const Icon = guide.icon;
          return (
            <div
              key={idx}
              className="bg-zinc-900 rounded-3xl p-5 border border-zinc-800 shadow-sm space-y-2"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-zinc-800 border border-zinc-750">
                  <Icon className="w-5 h-5 text-pink-400" />
                </div>
                <h3 className="text-sm font-bold text-zinc-100">{guide.title}</h3>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed pl-1">
                {guide.desc}
              </p>
            </div>
          );
        })}
      </div>

      {/* Blocked Users Section */}
      <div className="bg-zinc-900 rounded-3xl p-5 border border-zinc-800 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserX className="w-5 h-5 text-rose-400" />
            <h3 className="text-sm font-bold text-zinc-100">
              Blocked Accounts ({blockedUsers.length})
            </h3>
          </div>
          <span className="text-xs text-zinc-500">
            Blocked members cannot message or view your profile
          </span>
        </div>

        {blockedUsers.length > 0 ? (
          <div className="divide-y divide-zinc-800">
            {blockedUsers.map((user) => (
              <div
                key={user.id}
                className="py-3 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <Avatar src={user.avatar_url} name={user.full_name} size="sm" />
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-zinc-100">
                      {user.full_name}
                    </h4>
                    <p className="text-[11px] text-zinc-400">@{user.username}</p>
                  </div>
                </div>

                <button
                  onClick={() => unblockUser(user.id)}
                  className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-750 text-zinc-200 text-xs font-semibold transition border border-zinc-700/60"
                >
                  Unblock
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-zinc-500 py-3 text-center">
            You have not blocked any users.
          </p>
        )}
      </div>

      {/* Emergency Resources */}
      <div className="bg-rose-950/30 rounded-3xl p-5 border border-rose-800/40 space-y-2 text-rose-200">
        <div className="flex items-center gap-2 font-bold text-sm text-rose-300">
          <PhoneCall className="w-4 h-4 text-rose-400" />
          <span>Need Immediate Help or Emergency Assistance?</span>
        </div>
        <p className="text-xs text-rose-300/80 leading-relaxed">
          If you are ever in immediate physical danger, please contact your local emergency services (e.g. 911 in the US or 112 in Europe). You can also report safety threats through our confidential reporting system.
        </p>
      </div>
    </div>
  );
};
