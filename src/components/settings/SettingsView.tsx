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
  Check,
  FileSpreadsheet,
  ArrowRightLeft,
  Sparkles,
  Mail
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { GoogleSheetsSyncModal } from '../sheets/GoogleSheetsSyncModal';
import { isGoogleConnected, getGoogleUser } from '../../services/googleSheetsService';

export const SettingsView: React.FC = () => {
  const { currentUser, updateProfile, logout } = useAuth();
  const { navigate } = useApp();
  const [datingVisible, setDatingVisible] = useState(currentUser.privacy.datingVisible);
  const [showOnline, setShowOnline] = useState(currentUser.privacy.showOnlineStatus);
  const [showLocation, setShowLocation] = useState(currentUser.privacy.showLocation ?? true);
  const [isSaved, setIsSaved] = useState(false);
  const [isSheetsModalOpen, setIsSheetsModalOpen] = useState(false);

  const isAdmin = currentUser.role === 'ADMIN' && (currentUser.id === 'user-suresh' || currentUser.email?.toLowerCase() === 'bohara.suresh8884@gmail.com');
  const googleConnected = isAdmin && isGoogleConnected();
  const googleUser = isAdmin ? getGoogleUser() : null;

  const handleSavePrivacy = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      privacy: {
        ...currentUser.privacy,
        datingVisible,
        showOnlineStatus: showOnline,
        showLocation,
        profileVisibility: 'PUBLIC'
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

      {/* Google Workspace Integrations (Admin Only: Suresh Bohara) */}
      {isAdmin && (
        <>
          {/* Google Sheets Data Source Integration */}
          <div className="bg-zinc-900 rounded-3xl p-5 border border-zinc-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                    <span>Google Sheets Integration</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                      {googleConnected ? 'Connected' : 'Workspace Ready'}
                    </span>
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    Use Google Sheets as a data source to sync profile data and contact info
                  </p>
                </div>
              </div>

              <button
                type="button"
                id="open-google-sheets-sync-btn"
                onClick={() => setIsSheetsModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-zinc-950 text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-emerald-500/15"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
                <span>Manage & Sync</span>
              </button>
            </div>

            <div className="p-3.5 bg-zinc-800/60 rounded-2xl border border-zinc-750 flex items-center justify-between">
              <div className="text-xs text-zinc-300">
                {googleConnected && googleUser ? (
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    Connected as <strong className="text-emerald-300">{googleUser.email}</strong>
                  </span>
                ) : (
                  <span>Connect with Google to read and update your spreadsheets in real-time.</span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setIsSheetsModalOpen(true)}
                className="text-xs font-bold text-emerald-400 hover:underline"
              >
                Open Sync Dashboard →
              </button>
            </div>
          </div>

          {/* Gmail Workspace Integration */}
          <div className="bg-zinc-900 rounded-3xl p-5 border border-zinc-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                    <span>Gmail Workspace</span>
                    <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] font-bold">
                      {googleConnected ? 'Connected' : 'Workspace Ready'}
                    </span>
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    Access your Gmail inbox, compose messages, and email your dating matches
                  </p>
                </div>
              </div>

              <button
                type="button"
                id="open-gmail-workspace-btn"
                onClick={() => navigate('gmail')}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 hover:opacity-90 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-pink-500/20"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Open Gmail Inbox</span>
              </button>
            </div>

            <div className="p-3.5 bg-zinc-800/60 rounded-2xl border border-zinc-750 flex items-center justify-between">
              <div className="text-xs text-zinc-300">
                {googleConnected && googleUser ? (
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    Connected as <strong className="text-rose-300">{googleUser.email}</strong>
                  </span>
                ) : (
                  <span>Link your Google account to read, draft, and send emails directly.</span>
                )}
              </div>
              <button
                type="button"
                onClick={() => navigate('gmail')}
                className="text-xs font-bold text-rose-400 hover:underline"
              >
                Go to Mailbox →
              </button>
            </div>
          </div>
        </>
      )}

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

      {/* Google Sheets Sync Modal */}
      {isAdmin && (
        <GoogleSheetsSyncModal
          isOpen={isSheetsModalOpen}
          onClose={() => setIsSheetsModalOpen(false)}
        />
      )}
    </div>
  );
};
