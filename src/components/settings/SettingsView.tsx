import React, { useState } from 'react';
import {
  Sliders,
  Shield,
  Eye,
  Bell,
  Heart,
  User,
  LogOut,
  Save,
  Check
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';

export const SettingsView: React.FC = () => {
  const { currentUser, updateProfile, logout } = useAuth();
  const [datingVisible, setDatingVisible] = useState(currentUser.privacy.datingVisible);
  const [showOnline, setShowOnline] = useState(currentUser.privacy.showOnlineStatus);
  const [showLocation, setShowLocation] = useState(currentUser.privacy.showLocation);
  const [isSaved, setIsSaved] = useState(false);

  const handleSavePrivacy = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      privacy: {
        datingVisible,
        showOnlineStatus: showOnline,
        showLocation,
        profileVisibility: 'EVERYONE'
      }
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="space-y-4">
      <div className="bg-zinc-900 rounded-3xl p-5 border border-zinc-800 shadow-sm">
        <h2 className="text-lg font-extrabold text-zinc-100 font-heading flex items-center gap-2">
          <Sliders className="w-5 h-5 text-pink-400" />
          <span>Account & Privacy Settings</span>
        </h2>
        <p className="text-xs text-zinc-400">
          Control your dating visibility, privacy options, and security settings.
        </p>
      </div>

      <form onSubmit={handleSavePrivacy} className="space-y-4">
        {/* Privacy & Visibility Settings */}
        <div className="bg-zinc-900 rounded-3xl p-5 border border-zinc-800 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
            <Eye className="w-4 h-4 text-indigo-400" />
            <span>Discovery & Profile Visibility</span>
          </h3>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3.5 bg-zinc-800/70 border border-zinc-750 rounded-2xl">
              <div>
                <div className="text-xs font-bold text-zinc-100">
                  Dating Mode Active
                </div>
                <div className="text-[11px] text-zinc-400">
                  Allow other singles to discover and like your dating card
                </div>
              </div>
              <input
                type="checkbox"
                checked={datingVisible}
                onChange={(e) => setDatingVisible(e.target.checked)}
                className="w-5 h-5 text-pink-500 rounded-md accent-pink-500 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 bg-zinc-800/70 border border-zinc-750 rounded-2xl">
              <div>
                <div className="text-xs font-bold text-zinc-100">
                  Show Online Status
                </div>
                <div className="text-[11px] text-zinc-400">
                  Display a green active indicator when you are in the app
                </div>
              </div>
              <input
                type="checkbox"
                checked={showOnline}
                onChange={(e) => setShowOnline(e.target.checked)}
                className="w-5 h-5 text-pink-500 rounded-md accent-pink-500 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 bg-zinc-800/70 border border-zinc-750 rounded-2xl">
              <div>
                <div className="text-xs font-bold text-zinc-100">
                  Show Neighborhood Location
                </div>
                <div className="text-[11px] text-zinc-400">
                  Display approximate city & neighborhood on your profile
                </div>
              </div>
              <input
                type="checkbox"
                checked={showLocation}
                onChange={(e) => setShowLocation(e.target.checked)}
                className="w-5 h-5 text-pink-500 rounded-md accent-pink-500 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Save button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 text-white text-xs font-bold shadow-md shadow-pink-500/20 hover:opacity-95 transition flex items-center gap-2"
          >
            {isSaved ? (
              <>
                <Check className="w-4 h-4" />
                <span>Saved Successfully!</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Privacy Preferences</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Account actions */}
      <div className="bg-zinc-900 rounded-3xl p-5 border border-zinc-800 shadow-sm space-y-3">
        <h3 className="text-sm font-bold text-zinc-100">Account Actions</h3>
        <div className="flex items-center justify-between pt-1">
          <div className="text-xs text-zinc-400">
            Sign out of your active session on this device
          </div>
          <button
            onClick={logout}
            className="px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-bold transition flex items-center gap-1.5 border border-rose-500/20"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};
