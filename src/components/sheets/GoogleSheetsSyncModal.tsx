import React, { useState, useEffect, useCallback } from 'react';
import {
  FileSpreadsheet,
  X,
  RefreshCw,
  ExternalLink,
  PlusCircle,
  DownloadCloud,
  UploadCloud,
  Users,
  CheckCircle2,
  AlertCircle,
  Check,
  ChevronRight,
  ShieldCheck,
  FolderOpen,
  ArrowRightLeft,
  Sparkles,
  Link2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { GoogleSignInButton } from './GoogleSignInButton';
import {
  isGoogleConnected,
  getGoogleUser,
  signInWithGoogle,
  signOutGoogle,
  onGoogleAuthStateChanged,
  listUserSpreadsheets,
  createLoveConnectSpreadsheet,
  previewSyncFromSpreadsheet,
  applySyncFieldsToProfile,
  pushAppProfileToSpreadsheet,
  extractSpreadsheetId
} from '../../services/googleSheetsService';
import { GoogleUser, GoogleDriveFile, SyncPreviewResult, SheetProfileSyncField } from '../../types/sheets';

interface GoogleSheetsSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GoogleSheetsSyncModal: React.FC<GoogleSheetsSyncModalProps> = ({
  isOpen,
  onClose
}) => {
  const { currentUser, allUsers, updateProfile } = useAuth();
  const { connections } = useApp();

  // Google Auth State
  const [googleUser, setGoogleUser] = useState<GoogleUser | null>(getGoogleUser());
  const [isConnected, setIsConnected] = useState<boolean>(isGoogleConnected());
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Spreadsheets State
  const [driveFiles, setDriveFiles] = useState<GoogleDriveFile[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [selectedSpreadsheetId, setSelectedSpreadsheetId] = useState<string>('');
  const [customSheetUrl, setCustomSheetUrl] = useState<string>('');
  const [activeSpreadsheetTitle, setActiveSpreadsheetTitle] = useState<string>('');

  // Active Tab
  const [activeTab, setActiveTab] = useState<'setup' | 'import' | 'export' | 'contacts'>('setup');

  // Sync Preview State
  const [previewData, setPreviewData] = useState<SyncPreviewResult | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [isSyncingProfile, setIsSyncingProfile] = useState(false);
  const [isPushingToSheet, setIsPushingToSheet] = useState(false);
  const [isCreatingNewSheet, setIsCreatingNewSheet] = useState(false);

  // Confirmation Modals for Destructive/Mutating Operations
  const [showConfirmImportModal, setShowConfirmImportModal] = useState(false);
  const [showConfirmExportModal, setShowConfirmExportModal] = useState(false);

  // Status Alerts
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Listen to Google Auth changes
  useEffect(() => {
    const unsubscribe = onGoogleAuthStateChanged((user, token) => {
      setGoogleUser(user);
      setIsConnected(Boolean(user && token));
    });
    return unsubscribe;
  }, []);

  const showToast = (type: 'success' | 'error' | 'info', text: string) => {
    setStatusMessage({ type, text });
    setTimeout(() => {
      setStatusMessage(null);
    }, 4500);
  };

  // Load User's Google Drive Spreadsheets
  const loadDriveSpreadsheets = useCallback(async () => {
    if (!isConnected) return;
    setIsLoadingFiles(true);
    try {
      const files = await listUserSpreadsheets();
      setDriveFiles(files);
      if (files.length > 0 && !selectedSpreadsheetId) {
        // Auto-select LoveConnect sheet if present, or first sheet
        const lcSheet = files.find((f) => /loveconnect/i.test(f.name));
        const target = lcSheet || files[0];
        setSelectedSpreadsheetId(target.id);
        setActiveSpreadsheetTitle(target.name);
      }
    } catch (err: any) {
      console.error('Failed to load drive files:', err);
      showToast('error', err.message || 'Could not load spreadsheets from Drive.');
    } finally {
      setIsLoadingFiles(false);
    }
  }, [isConnected, selectedSpreadsheetId]);

  useEffect(() => {
    if (isConnected && isOpen) {
      loadDriveSpreadsheets();
    }
  }, [isConnected, isOpen, loadDriveSpreadsheets]);

  // Handle Google Sign In
  const handleGoogleSignIn = async () => {
    setIsAuthenticating(true);
    try {
      const { user } = await signInWithGoogle();
      showToast('success', `Connected as ${user.displayName || user.email}!`);
      loadDriveSpreadsheets();
    } catch (err: any) {
      console.error('Google Sign In failed:', err);
      showToast('error', err.message || 'Google sign-in failed. Please try again.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  // Handle Google Sign Out
  const handleGoogleSignOut = async () => {
    try {
      await signOutGoogle();
      setDriveFiles([]);
      setSelectedSpreadsheetId('');
      setActiveSpreadsheetTitle('');
      setPreviewData(null);
      showToast('info', 'Disconnected Google account.');
    } catch (err: any) {
      console.error('Sign out error:', err);
    }
  };

  // 1-Click Create New Sheet in Google Drive
  const handleCreateNewSheet = async () => {
    if (!isConnected) {
      showToast('error', 'Please connect your Google account first.');
      return;
    }
    setIsCreatingNewSheet(true);
    try {
      const { spreadsheetId } = await createLoveConnectSpreadsheet(
        currentUser,
        connections,
        allUsers
      );
      setSelectedSpreadsheetId(spreadsheetId);
      setActiveSpreadsheetTitle(`LoveConnect - ${currentUser.full_name} Data & Contacts`);
      await loadDriveSpreadsheets();
      showToast('success', 'Created LoveConnect spreadsheet in your Google Drive!');
      setActiveTab('import');
      handleFetchPreview(spreadsheetId);
    } catch (err: any) {
      console.error('Create sheet error:', err);
      showToast('error', err.message || 'Failed to create spreadsheet.');
    } finally {
      setIsCreatingNewSheet(false);
    }
  };

  // Fetch Preview Comparison from Spreadsheet
  const handleFetchPreview = async (sheetIdToUse?: string) => {
    const id = sheetIdToUse || selectedSpreadsheetId || extractSpreadsheetId(customSheetUrl);
    if (!id) {
      showToast('error', 'Please select or enter a Google Sheet URL / ID.');
      return;
    }

    setIsLoadingPreview(true);
    try {
      const preview = await previewSyncFromSpreadsheet(id, currentUser);
      setPreviewData(preview);
      setSelectedSpreadsheetId(preview.spreadsheetId);
      setActiveSpreadsheetTitle(preview.spreadsheetTitle);
      showToast('info', `Analyzed "${preview.spreadsheetTitle}". Found ${preview.fields.length} profile fields.`);
    } catch (err: any) {
      console.error('Preview error:', err);
      showToast('error', err.message || 'Could not parse spreadsheet data.');
    } finally {
      setIsLoadingPreview(false);
    }
  };

  // Toggle field selection in preview
  const handleToggleField = (fieldKey: string) => {
    if (!previewData) return;
    setPreviewData({
      ...previewData,
      fields: previewData.fields.map((f) =>
        f.key === fieldKey ? { ...f, selected: !f.selected } : f
      )
    });
  };

  // Select all / Deselect all
  const handleSelectAllFields = (select: boolean) => {
    if (!previewData) return;
    setPreviewData({
      ...previewData,
      fields: previewData.fields.map((f) => ({ ...f, selected: select }))
    });
  };

  // Execute Profile Sync (Import from Sheet)
  const handleExecuteImport = async () => {
    if (!previewData) return;
    const selectedFields = previewData.fields.filter((f) => f.selected);
    if (selectedFields.length === 0) {
      showToast('info', 'No fields selected to update.');
      setShowConfirmImportModal(false);
      return;
    }

    setIsSyncingProfile(true);
    setShowConfirmImportModal(false);

    try {
      const updates = applySyncFieldsToProfile(currentUser, selectedFields);
      await updateProfile(updates);
      showToast('success', `Successfully updated ${selectedFields.length} profile fields from Google Sheet!`);
      // Refresh preview to reflect new updated values
      await handleFetchPreview(previewData.spreadsheetId);
    } catch (err: any) {
      console.error('Profile update failed:', err);
      showToast('error', err.message || 'Failed to update profile.');
    } finally {
      setIsSyncingProfile(false);
    }
  };

  // Execute Export (Push App Profile & Contacts to Sheet)
  const handleExecuteExport = async () => {
    const id = selectedSpreadsheetId || extractSpreadsheetId(customSheetUrl);
    if (!id) {
      showToast('error', 'Please select a spreadsheet first.');
      setShowConfirmExportModal(false);
      return;
    }

    setIsPushingToSheet(true);
    setShowConfirmExportModal(false);

    try {
      await pushAppProfileToSpreadsheet(id, currentUser, connections, allUsers);
      showToast('success', 'Profile data and contacts pushed to Google Sheet successfully!');
    } catch (err: any) {
      console.error('Export failed:', err);
      showToast('error', err.message || 'Failed to push data to Google Sheet.');
    } finally {
      setIsPushingToSheet(false);
    }
  };

  const isAdmin = currentUser.role === 'ADMIN' && (currentUser.id === 'user-suresh' || currentUser.email?.toLowerCase() === 'bohara.suresh8884@gmail.com');
  if (!isOpen || !isAdmin) return null;

  const currentSheetUrl = selectedSpreadsheetId
    ? `https://docs.google.com/spreadsheets/d/${selectedSpreadsheetId}/edit`
    : customSheetUrl.startsWith('http')
    ? customSheetUrl
    : '';

  const selectedFieldsCount = previewData?.fields.filter((f) => f.selected).length || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-zinc-900 border border-zinc-750 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-inner">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-extrabold text-zinc-100 font-heading">
                  Google Sheets Data Sync
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                  Workspace Live
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Sync your profile information and contacts directly with Google Sheets.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Toast / Alert */}
        {statusMessage && (
          <div
            className={`px-4 py-2.5 text-xs font-semibold flex items-center justify-between transition ${
              statusMessage.type === 'success'
                ? 'bg-emerald-500/20 text-emerald-200 border-b border-emerald-500/30'
                : statusMessage.type === 'error'
                ? 'bg-rose-500/20 text-rose-200 border-b border-rose-500/30'
                : 'bg-indigo-500/20 text-indigo-200 border-b border-indigo-500/30'
            }`}
          >
            <div className="flex items-center gap-2">
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400" />
              )}
              <span>{statusMessage.text}</span>
            </div>
            <button onClick={() => setStatusMessage(null)} className="text-xs hover:opacity-80">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Google Account Bar */}
        <div className="px-4 py-3 bg-zinc-950/80 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            {isConnected && googleUser ? (
              <>
                {googleUser.photoURL ? (
                  <img
                    src={googleUser.photoURL}
                    alt={googleUser.displayName || 'Google'}
                    className="w-7 h-7 rounded-full ring-2 ring-emerald-500/50"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-emerald-500 text-white text-xs font-bold flex items-center justify-center">
                    {(googleUser.displayName || googleUser.email || 'G')[0]}
                  </div>
                )}
                <div>
                  <div className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                    <span>{googleUser.displayName || 'Google User'}</span>
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <div className="text-[11px] text-zinc-500">{googleUser.email}</div>
                </div>
              </>
            ) : (
              <div className="text-xs text-zinc-400">
                Connect your Google account to read, create, and sync spreadsheets with your profile.
              </div>
            )}
          </div>

          <div>
            {isConnected ? (
              <button
                onClick={handleGoogleSignOut}
                className="px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-xl transition"
              >
                Disconnect Google
              </button>
            ) : (
              <GoogleSignInButton
                onClick={handleGoogleSignIn}
                loading={isAuthenticating}
                text="Connect with Google"
              />
            )}
          </div>
        </div>

        {/* Tabs Bar */}
        <div className="flex border-b border-zinc-800 bg-zinc-900/50 px-4 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('setup')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition whitespace-nowrap ${
              activeTab === 'setup'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <FolderOpen className="w-4 h-4" />
            <span>Select Sheet</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('import');
              if (!previewData && selectedSpreadsheetId) {
                handleFetchPreview(selectedSpreadsheetId);
              }
            }}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition whitespace-nowrap ${
              activeTab === 'import'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <DownloadCloud className="w-4 h-4" />
            <span>Sync to Profile (Import)</span>
            {previewData && (
              <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px]">
                {previewData.fields.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('export')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition whitespace-nowrap ${
              activeTab === 'export'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <UploadCloud className="w-4 h-4" />
            <span>Export to Sheet (Backup)</span>
          </button>

          <button
            onClick={() => setActiveTab('contacts')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition whitespace-nowrap ${
              activeTab === 'contacts'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Contacts & Connections</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {!isConnected ? (
            <div className="py-12 px-4 text-center max-w-md mx-auto space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto">
                <FileSpreadsheet className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-base font-bold text-zinc-100 mb-1">
                  Google Workspace Authentication Required
                </h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  To sync profile data and contact information directly with Google Sheets, connect your Google account with Sheets and Drive permissions.
                </p>
              </div>
              <GoogleSignInButton
                onClick={handleGoogleSignIn}
                loading={isAuthenticating}
                className="w-full"
              />
            </div>
          ) : (
            <>
              {/* TAB 1: SETUP & SELECT SHEET */}
              {activeTab === 'setup' && (
                <div className="space-y-5">
                  {/* Quick Action: 1-Click Create */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-emerald-950/40 via-zinc-800/60 to-zinc-900 border border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-emerald-400" />
                        <h4 className="text-sm font-bold text-zinc-100">
                          Create Formatted LoveConnect Sheet
                        </h4>
                      </div>
                      <p className="text-xs text-zinc-400 max-w-lg">
                        Automatically creates a Google Sheet in your Drive pre-configured with two formatted tabs: <strong>Profile Data</strong> and <strong>Contacts & Connections</strong>.
                      </p>
                    </div>

                    <button
                      onClick={handleCreateNewSheet}
                      disabled={isCreatingNewSheet}
                      className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-zinc-950 text-xs font-bold transition flex items-center gap-2 shrink-0 shadow-md shadow-emerald-500/20 disabled:opacity-60"
                    >
                      {isCreatingNewSheet ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <PlusCircle className="w-4 h-4" />
                      )}
                      <span>{isCreatingNewSheet ? 'Creating Sheet...' : 'Create New Sheet in Drive'}</span>
                    </button>
                  </div>

                  {/* Pick Existing from Drive */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-zinc-800/40 border border-zinc-750 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-zinc-100 flex items-center gap-2">
                        <FolderOpen className="w-4 h-4 text-emerald-400" />
                        <span>Choose from Your Google Drive Spreadsheets</span>
                      </h4>
                      <button
                        onClick={loadDriveSpreadsheets}
                        disabled={isLoadingFiles}
                        className="text-xs text-emerald-400 hover:underline flex items-center gap-1"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isLoadingFiles ? 'animate-spin' : ''}`} />
                        <span>Refresh list</span>
                      </button>
                    </div>

                    {isLoadingFiles ? (
                      <div className="py-6 text-center text-xs text-zinc-400 flex items-center justify-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                        <span>Scanning Google Drive for spreadsheets...</span>
                      </div>
                    ) : driveFiles.length > 0 ? (
                      <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                        {driveFiles.map((file) => {
                          const isSelected = file.id === selectedSpreadsheetId;
                          return (
                            <div
                              key={file.id}
                              onClick={() => {
                                setSelectedSpreadsheetId(file.id);
                                setActiveSpreadsheetTitle(file.name);
                              }}
                              className={`p-3 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition ${
                                isSelected
                                  ? 'bg-emerald-500/10 border-emerald-500/40 text-zinc-100'
                                  : 'bg-zinc-850 hover:bg-zinc-800 border-zinc-750 text-zinc-300'
                              }`}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <FileSpreadsheet className={`w-4 h-4 shrink-0 ${isSelected ? 'text-emerald-400' : 'text-zinc-500'}`} />
                                <div className="min-w-0">
                                  <div className="text-xs font-bold truncate">{file.name}</div>
                                  <div className="text-[10px] text-zinc-500">
                                    Modified {new Date(file.modifiedTime).toLocaleDateString()}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                {file.webViewLink && (
                                  <a
                                    href={file.webViewLink}
                                    target="_blank"
                                    rel="noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="p-1.5 text-zinc-400 hover:text-emerald-400 hover:bg-zinc-800 rounded-lg transition"
                                    title="Open in Google Sheets"
                                  >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                  </a>
                                )}
                                <div
                                  className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                                    isSelected
                                      ? 'bg-emerald-500 border-emerald-500 text-zinc-950'
                                      : 'border-zinc-600'
                                  }`}
                                >
                                  {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="py-4 text-center text-xs text-zinc-400">
                        No Google Spreadsheets found in your Drive yet. Create a new one above!
                      </div>
                    )}
                  </div>

                  {/* Manual URL / ID input */}
                  <div className="p-4 rounded-2xl bg-zinc-800/40 border border-zinc-750 space-y-2">
                    <label className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                      <Link2 className="w-3.5 h-3.5 text-zinc-400" />
                      <span>Or Enter Google Sheet URL or ID Manually:</span>
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={customSheetUrl}
                        onChange={(e) => setCustomSheetUrl(e.target.value)}
                        placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit"
                        className="flex-1 text-xs bg-zinc-900 rounded-xl px-3 py-2 border border-zinc-700 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                      />
                      <button
                        onClick={() => {
                          const id = extractSpreadsheetId(customSheetUrl);
                          if (id) {
                            setSelectedSpreadsheetId(id);
                            handleFetchPreview(id);
                            setActiveTab('import');
                          } else {
                            showToast('error', 'Please enter a valid spreadsheet URL or ID.');
                          }
                        }}
                        className="px-4 py-2 bg-zinc-700 hover:bg-zinc-650 text-zinc-100 text-xs font-bold rounded-xl transition"
                      >
                        Load Sheet
                      </button>
                    </div>
                  </div>

                  {/* Selected Sheet Banner */}
                  {selectedSpreadsheetId && (
                    <div className="p-4 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-between gap-3">
                      <div>
                        <div className="text-[11px] text-zinc-400">Selected Spreadsheet</div>
                        <div className="text-xs font-bold text-emerald-400">
                          {activeSpreadsheetTitle || selectedSpreadsheetId}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {currentSheetUrl && (
                          <a
                            href={currentSheetUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3 py-1.5 text-xs text-zinc-300 hover:text-zinc-100 bg-zinc-700/80 hover:bg-zinc-700 rounded-xl transition flex items-center gap-1.5"
                          >
                            <span>Open in Google Sheets</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                        <button
                          onClick={() => {
                            setActiveTab('import');
                            handleFetchPreview(selectedSpreadsheetId);
                          }}
                          className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 text-xs font-bold rounded-xl transition flex items-center gap-1.5"
                        >
                          <span>Proceed to Sync</span>
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: IMPORT (SYNC FROM SHEET TO APP) */}
              {activeTab === 'import' && (
                <div className="space-y-4">
                  {/* Top Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-zinc-850 rounded-2xl border border-zinc-750">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-bold text-zinc-100">
                        {activeSpreadsheetTitle || 'Google Sheet'}
                      </span>
                      {previewData && (
                        <span className="text-[10px] text-zinc-400">
                          (Tab: {previewData.tabName})
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleFetchPreview()}
                        disabled={isLoadingPreview}
                        className="px-3 py-1.5 bg-zinc-750 hover:bg-zinc-700 text-zinc-200 text-xs font-bold rounded-xl transition flex items-center gap-1.5"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isLoadingPreview ? 'animate-spin' : ''}`} />
                        <span>Re-scan Sheet</span>
                      </button>

                      {currentSheetUrl && (
                        <a
                          href={currentSheetUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 text-zinc-400 hover:text-emerald-400 hover:bg-zinc-750 rounded-xl transition"
                          title="Open Sheet in Google Sheets"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </div>

                  {isLoadingPreview ? (
                    <div className="py-12 text-center text-xs text-zinc-400 flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="w-6 h-6 animate-spin text-emerald-400" />
                      <span>Reading cell values from Google Sheets...</span>
                    </div>
                  ) : previewData ? (
                    <div className="space-y-4">
                      {/* Selection Toolbar */}
                      <div className="flex items-center justify-between text-xs text-zinc-400">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleSelectAllFields(true)}
                            className="text-emerald-400 hover:underline font-medium"
                          >
                            Select All
                          </button>
                          <span>·</span>
                          <button
                            onClick={() => handleSelectAllFields(false)}
                            className="hover:underline"
                          >
                            Deselect All
                          </button>
                          <span>·</span>
                          <span>
                            {selectedFieldsCount} of {previewData.fields.length} fields selected
                          </span>
                        </div>

                        {previewData.hasChanges ? (
                          <span className="text-amber-400 font-semibold flex items-center gap-1 text-[11px]">
                            <Sparkles className="w-3.5 h-3.5" />
                            Differences detected
                          </span>
                        ) : (
                          <span className="text-emerald-400 text-[11px]">
                            All fields already match current profile
                          </span>
                        )}
                      </div>

                      {/* Fields Table */}
                      <div className="border border-zinc-750 rounded-2xl overflow-hidden divide-y divide-zinc-800">
                        <div className="grid grid-cols-12 gap-2 p-3 bg-zinc-800/80 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                          <div className="col-span-1 text-center">Sync</div>
                          <div className="col-span-3">Profile Attribute</div>
                          <div className="col-span-4">Value in Google Sheet</div>
                          <div className="col-span-4">Current App Value</div>
                        </div>

                        {previewData.fields.map((field) => (
                          <div
                            key={field.key}
                            onClick={() => handleToggleField(field.key)}
                            className={`grid grid-cols-12 gap-2 p-3 text-xs items-center cursor-pointer transition ${
                              field.isDifferent
                                ? field.selected
                                  ? 'bg-emerald-950/20 hover:bg-emerald-950/30'
                                  : 'bg-amber-950/10 hover:bg-amber-950/20'
                                : 'hover:bg-zinc-800/40 opacity-75'
                            }`}
                          >
                            <div className="col-span-1 flex justify-center">
                              <input
                                type="checkbox"
                                checked={field.selected}
                                onChange={() => handleToggleField(field.key)}
                                className="w-4 h-4 text-emerald-500 rounded accent-emerald-500 cursor-pointer"
                              />
                            </div>
                            <div className="col-span-3 font-bold text-zinc-200">
                              {field.label}
                            </div>
                            <div className="col-span-4 text-emerald-300 font-medium truncate">
                              {field.sheetValue || <span className="text-zinc-600 italic">Empty</span>}
                            </div>
                            <div className="col-span-4 text-zinc-400 truncate">
                              {field.currentValue || <span className="text-zinc-600 italic">Not set</span>}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Bottom Sync Action Bar */}
                      <div className="flex items-center justify-between p-4 bg-zinc-850 rounded-2xl border border-zinc-750">
                        <div className="text-xs text-zinc-300">
                          Ready to update <strong>{selectedFieldsCount}</strong> attributes in your LoveConnect profile.
                        </div>

                        <button
                          onClick={() => setShowConfirmImportModal(true)}
                          disabled={selectedFieldsCount === 0 || isSyncingProfile}
                          className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-zinc-950 font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition flex items-center gap-2 disabled:opacity-50"
                        >
                          {isSyncingProfile ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <DownloadCloud className="w-4 h-4" />
                          )}
                          <span>Apply Sync to LoveConnect</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="py-12 text-center space-y-3">
                      <p className="text-xs text-zinc-400">
                        No spreadsheet loaded yet. Click below to load values.
                      </p>
                      <button
                        onClick={() => handleFetchPreview()}
                        className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 text-xs font-bold rounded-xl transition"
                      >
                        Load Spreadsheet Data
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: EXPORT (PUSH APP PROFILE & CONTACTS TO SHEET) */}
              {activeTab === 'export' && (
                <div className="space-y-4">
                  <div className="p-4 sm:p-5 rounded-2xl bg-zinc-800/60 border border-zinc-750 space-y-3">
                    <div className="flex items-center gap-2 text-zinc-100 font-bold text-sm">
                      <UploadCloud className="w-5 h-5 text-emerald-400" />
                      <span>Push LoveConnect Profile & Contacts to Google Sheet</span>
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Keep your Google Sheet up-to-date with your current profile attributes and contact records. This will write your current photo URLs, bio, occupation, education, contact phone/email, and connection list into the sheet.
                    </p>

                    <div className="p-3 bg-zinc-900 rounded-xl border border-zinc-750 space-y-2 text-xs">
                      <div className="font-bold text-zinc-300">Target Google Sheet:</div>
                      <div className="text-emerald-400 font-mono text-[11px] truncate">
                        {activeSpreadsheetTitle || selectedSpreadsheetId || 'None selected'}
                      </div>
                    </div>

                    <div className="pt-2 flex justify-end">
                      <button
                        onClick={() => setShowConfirmExportModal(true)}
                        disabled={isPushingToSheet || !selectedSpreadsheetId}
                        className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-zinc-950 text-xs font-extrabold rounded-xl shadow-lg shadow-emerald-500/20 transition flex items-center gap-2 disabled:opacity-50"
                      >
                        {isPushingToSheet ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <UploadCloud className="w-4 h-4" />
                        )}
                        <span>Push Data to Google Sheet</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: CONTACTS & CONNECTIONS */}
              {activeTab === 'contacts' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                        <Users className="w-4 h-4 text-emerald-400" />
                        <span>Contacts & Social Connections</span>
                      </h4>
                      <p className="text-xs text-zinc-400">
                        {connections.length} active connections in LoveConnect
                      </p>
                    </div>

                    <button
                      onClick={() => setShowConfirmExportModal(true)}
                      className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-750 border border-zinc-700 text-zinc-200 text-xs font-bold rounded-xl transition flex items-center gap-1.5"
                    >
                      <UploadCloud className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Sync Contacts to Sheet</span>
                    </button>
                  </div>

                  <div className="border border-zinc-750 rounded-2xl overflow-hidden divide-y divide-zinc-800">
                    <div className="grid grid-cols-12 gap-2 p-3 bg-zinc-800/80 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                      <div className="col-span-4">Contact Name</div>
                      <div className="col-span-3">Status</div>
                      <div className="col-span-5">Connected Date</div>
                    </div>

                    {connections.length > 0 ? (
                      connections.map((conn) => {
                        const isRequester = conn.requester_id === currentUser.id;
                        const otherUser = isRequester
                          ? conn.receiver || allUsers.find((u) => u.id === conn.receiver_id)
                          : conn.requester || allUsers.find((u) => u.id === conn.requester_id);

                        return (
                          <div
                            key={conn.id}
                            className="grid grid-cols-12 gap-2 p-3 text-xs items-center hover:bg-zinc-850 transition"
                          >
                            <div className="col-span-4 font-bold text-zinc-200 flex items-center gap-2 truncate">
                              <span>{otherUser?.full_name || 'Contact'}</span>
                              <span className="text-[10px] text-zinc-500 font-normal">
                                @{otherUser?.username}
                              </span>
                            </div>
                            <div className="col-span-3">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  conn.status === 'ACCEPTED'
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                }`}
                              >
                                {conn.status}
                              </span>
                            </div>
                            <div className="col-span-5 text-zinc-400">
                              {new Date(conn.created_at).toLocaleDateString(undefined, {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-6 text-center text-xs text-zinc-500">
                        No active connections yet. As you make matches and social connections, they will be listed here.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-900 flex items-center justify-between">
          <div className="text-[11px] text-zinc-500 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Encrypted OAuth2 Google Sheets API Integration</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-750 text-zinc-300 text-xs font-bold rounded-xl transition"
          >
            Close
          </button>
        </div>
      </div>

      {/* MANDATORY CONFIRMATION MODAL FOR IMPORT (MUTATING USER PROFILE DATA) */}
      {showConfirmImportModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-zinc-900 border border-zinc-700 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto">
              <ArrowRightLeft className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h4 className="text-base font-bold text-zinc-100">
                Confirm Profile Update from Google Sheet?
              </h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                This will overwrite <strong>{selectedFieldsCount}</strong> attributes of your active LoveConnect profile with values imported from <em>{activeSpreadsheetTitle || 'the selected spreadsheet'}</em>.
              </p>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                onClick={() => setShowConfirmImportModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-750 text-zinc-300 text-xs font-bold transition"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteImport}
                className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-zinc-950 text-xs font-extrabold transition shadow-md shadow-emerald-500/20"
              >
                Confirm & Sync
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MANDATORY CONFIRMATION MODAL FOR EXPORT (MUTATING GOOGLE SPREADSHEET DATA) */}
      {showConfirmExportModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-zinc-900 border border-zinc-700 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto">
              <UploadCloud className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h4 className="text-base font-bold text-zinc-100">
                Confirm Export to Google Sheet?
              </h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                This will write or overwrite your current LoveConnect profile attributes and contact records into <em>{activeSpreadsheetTitle || 'the selected spreadsheet'}</em> in Google Sheets.
              </p>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                onClick={() => setShowConfirmExportModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-750 text-zinc-300 text-xs font-bold transition"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteExport}
                className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-zinc-950 text-xs font-extrabold transition shadow-md shadow-emerald-500/20"
              >
                Confirm & Push
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
