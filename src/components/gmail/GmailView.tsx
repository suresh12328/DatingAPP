import React, { useState, useEffect, useCallback } from 'react';
import {
  Mail,
  Send,
  Inbox,
  Star,
  FileText,
  Trash2,
  Search,
  RefreshCw,
  Plus,
  Sparkles,
  Users,
  CheckCircle,
  AlertCircle,
  LogOut,
  ExternalLink,
  ShieldCheck,
  ShieldAlert
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { GmailEmail, GmailUserProfile } from '../../types/gmail';
import {
  isGoogleConnected,
  getGoogleUser,
  signInWithGoogle,
  signOutGoogle,
  onGoogleAuthStateChanged,
  listGmailMessages,
  getGmailUserProfile,
  modifyGmailMessageLabels,
  trashGmailMessage
} from '../../services/gmailService';
import { GoogleSignInButton } from '../sheets/GoogleSignInButton';
import { GmailComposeModal } from './GmailComposeModal';
import { GmailEmailDetailModal } from './GmailEmailDetailModal';
import { GmailConfirmationModal } from './GmailConfirmationModal';

type FolderType = 'INBOX' | 'STARRED' | 'SENT' | 'DRAFT' | 'TRASH';

export const GmailView: React.FC = () => {
  const { currentUser } = useAuth();
  const { matches, connections } = useApp();

  // Auth & Connection State
  const [connected, setConnected] = useState(isGoogleConnected());
  const [googleUser, setGoogleUser] = useState(getGoogleUser());
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Email Data State
  const [folder, setFolder] = useState<FolderType>('INBOX');
  const [searchQuery, setSearchQuery] = useState('');
  const [emails, setEmails] = useState<GmailEmail[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<GmailUserProfile | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modals
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [composeInitialTo, setComposeInitialTo] = useState('');
  const [composeInitialSubject, setComposeInitialSubject] = useState('');
  const [composeInitialBody, setComposeInitialBody] = useState('');

  const [selectedEmail, setSelectedEmail] = useState<GmailEmail | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Quick action confirmation modal
  const [pendingTrashEmail, setPendingTrashEmail] = useState<GmailEmail | null>(null);
  const [isTrashing, setIsTrashing] = useState(false);

  // Track Google Auth state
  useEffect(() => {
    const unsubscribe = onGoogleAuthStateChanged((user, token) => {
      setConnected(Boolean(user && token));
      setGoogleUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Fetch emails according to current folder & search
  const loadEmails = useCallback(async () => {
    if (!isGoogleConnected()) return;

    setIsLoading(true);
    setErrorMessage(null);
    try {
      let labelIds: string[] | undefined = undefined;
      let q = searchQuery.trim();

      switch (folder) {
        case 'INBOX':
          labelIds = ['INBOX'];
          break;
        case 'STARRED':
          labelIds = ['STARRED'];
          break;
        case 'SENT':
          labelIds = ['SENT'];
          break;
        case 'DRAFT':
          labelIds = ['DRAFT'];
          break;
        case 'TRASH':
          labelIds = ['TRASH'];
          break;
      }

      const [res, profile] = await Promise.all([
        listGmailMessages({ query: q || undefined, labelIds, maxResults: 20 }),
        getGmailUserProfile().catch(() => null)
      ]);

      setEmails(res.messages);
      if (profile) setUserProfile(profile);
    } catch (err: any) {
      console.error('Failed to load Gmail messages:', err);
      setErrorMessage(err.message || 'Failed to load messages from Gmail');
    } finally {
      setIsLoading(false);
    }
  }, [folder, searchQuery]);

  useEffect(() => {
    if (connected) {
      loadEmails();
    }
  }, [connected, folder, loadEmails]);

  const handleSignIn = async () => {
    setIsAuthenticating(true);
    setAuthError(null);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      console.error('Google Sign In Error:', err);
      setAuthError(err.message || 'Failed to authenticate with Google.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleSignOut = async () => {
    await signOutGoogle();
    setEmails([]);
    setUserProfile(null);
  };

  const handleToggleStar = async (e: React.MouseEvent, email: GmailEmail) => {
    e.stopPropagation();
    const willStar = !email.isStarred;
    // Optimistic update
    setEmails((prev) =>
      prev.map((item) =>
        item.id === email.id
          ? {
              ...item,
              isStarred: willStar,
              labels: willStar
                ? [...item.labels, 'STARRED']
                : item.labels.filter((l) => l !== 'STARRED')
            }
          : item
      )
    );

    try {
      if (willStar) {
        await modifyGmailMessageLabels(email.id, ['STARRED'], []);
      } else {
        await modifyGmailMessageLabels(email.id, [], ['STARRED']);
      }
    } catch (err) {
      console.error('Failed to update star state:', err);
      loadEmails();
    }
  };

  const handleInitiateTrash = (e: React.MouseEvent, email: GmailEmail) => {
    e.stopPropagation();
    setPendingTrashEmail(email);
  };

  const handleConfirmTrash = async () => {
    if (!pendingTrashEmail) return;
    setIsTrashing(true);
    try {
      await trashGmailMessage(pendingTrashEmail.id);
      setEmails((prev) => prev.filter((item) => item.id !== pendingTrashEmail.id));
      setPendingTrashEmail(null);
    } catch (err: any) {
      alert(`Failed to move to trash: ${err.message}`);
    } finally {
      setIsTrashing(false);
    }
  };

  const handleOpenEmail = (email: GmailEmail) => {
    setSelectedEmail(email);
    setIsDetailOpen(true);

    // Optimistically mark as read
    if (email.isUnread) {
      setEmails((prev) =>
        prev.map((item) =>
          item.id === email.id
            ? {
                ...item,
                isUnread: false,
                labels: item.labels.filter((l) => l !== 'UNREAD')
              }
            : item
        )
      );
      modifyGmailMessageLabels(email.id, [], ['UNREAD']).catch(console.warn);
    }
  };

  const handleComposeWithMatch = (matchEmail: string, matchName: string) => {
    setComposeInitialTo(matchEmail);
    setComposeInitialSubject(`Hello ${matchName}! ☕`);
    setComposeInitialBody(`Hi ${matchName},\n\nI really enjoyed connecting on LoveConnect! Would love to chat or grab a coffee sometime soon.\n\nBest,\n${currentUser.full_name}`);
    setIsComposeOpen(true);
  };

  // Extract contact candidates
  const contactCandidates = [
    ...matches.map((m) => (m.user1_id === currentUser.id ? m.user2 : m.user1)),
    ...connections
      .filter((c) => c.status === 'ACCEPTED')
      .map((c) => (c.requester_id === currentUser.id ? c.receiver : c.requester))
  ].filter((p, index, self) => p && self.findIndex((o) => o.id === p.id) === index && p.id !== currentUser.id);

  const isAdmin = currentUser.role === 'ADMIN' && (currentUser.id === 'user-suresh' || currentUser.email?.toLowerCase() === 'bohara.suresh8884@gmail.com');

  if (!isAdmin) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4 text-center space-y-4">
        <div className="w-14 h-14 mx-auto rounded-3xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-black text-zinc-100 font-heading">
          Administrator Access Required
        </h2>
        <p className="text-sm text-zinc-400 leading-relaxed">
          Google Workspace integration is reserved exclusively for system administrator Suresh Bohara. Normal user profiles do not have access to Google Workspace settings or tools.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="bg-zinc-900 rounded-3xl p-5 border border-zinc-800 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-rose-500 to-pink-500 flex items-center justify-center text-white shadow-md shadow-rose-500/20">
              <Mail className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-extrabold text-zinc-100 font-heading">
                  Gmail Inbox
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] font-bold">
                  Google Workspace
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Send & receive emails, write to your dating matches, and manage your Google Inbox
              </p>
            </div>
          </div>

          {connected && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                id="gmail-refresh-btn"
                onClick={() => loadEmails()}
                disabled={isLoading}
                className="p-2.5 rounded-2xl bg-zinc-800 hover:bg-zinc-750 text-zinc-300 border border-zinc-700/80 text-xs font-semibold transition flex items-center gap-1.5"
                title="Refresh Gmail"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-pink-400' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>

              <button
                type="button"
                id="gmail-compose-btn"
                onClick={() => {
                  setComposeInitialTo('');
                  setComposeInitialSubject('');
                  setComposeInitialBody('');
                  setIsComposeOpen(true);
                }}
                className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 text-white text-xs font-bold shadow-md shadow-pink-500/20 hover:opacity-95 transition flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Compose Email</span>
              </button>
            </div>
          )}
        </div>

        {/* Connection Status Bar */}
        <div className="mt-4 pt-3.5 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
          {connected && googleUser ? (
            <div className="flex items-center gap-2.5">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-zinc-400">
                Connected as <strong className="text-zinc-200">{googleUser.email}</strong>
              </span>
              {userProfile && (
                <span className="text-[11px] text-zinc-500 hidden sm:inline">
                  ({userProfile.messagesTotal.toLocaleString()} total messages in account)
                </span>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-amber-400">
              <AlertCircle className="w-4 h-4" />
              <span>Connect your Google account to access your Gmail inbox and send emails.</span>
            </div>
          )}

          {connected && (
            <button
              type="button"
              onClick={handleSignOut}
              className="text-zinc-400 hover:text-rose-400 text-xs font-medium flex items-center gap-1 transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Switch Account</span>
            </button>
          )}
        </div>
      </div>

      {/* When NOT connected: Google Sign-in Prompt Card */}
      {!connected && (
        <div className="bg-zinc-900 rounded-3xl p-8 border border-zinc-800 text-center space-y-5 shadow-sm">
          <div className="w-16 h-16 rounded-3xl bg-rose-500/10 text-rose-400 border border-rose-500/20 mx-auto flex items-center justify-center shadow-lg shadow-rose-500/10">
            <Mail className="w-8 h-8" />
          </div>

          <div className="max-w-md mx-auto space-y-2">
            <h2 className="text-lg font-bold text-zinc-100 font-heading">
              Connect Your Gmail Account
            </h2>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Link your Google account to read incoming emails, compose and reply to messages, and send direct emails to your LoveConnect dating matches and friends.
            </p>
          </div>

          <div className="flex flex-col items-center justify-center gap-3 pt-2">
            <GoogleSignInButton
              onClick={handleSignIn}
              loading={isAuthenticating}
              text="Sign in with Google to Connect Gmail"
              className="px-6 py-3"
            />
            {authError && (
              <p className="text-xs text-rose-400 max-w-sm mx-auto">{authError}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-xl mx-auto pt-4 text-left">
            <div className="p-3 bg-zinc-800/50 rounded-2xl border border-zinc-750 space-y-1">
              <div className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Secure In-Memory</span>
              </div>
              <p className="text-[11px] text-zinc-400">Tokens are cached securely in memory and never stored in localStorage.</p>
            </div>
            <div className="p-3 bg-zinc-800/50 rounded-2xl border border-zinc-750 space-y-1">
              <div className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-pink-400" />
                <span>Email Matches</span>
              </div>
              <p className="text-[11px] text-zinc-400">Pre-fill emails directly with your mutual matches and connections.</p>
            </div>
            <div className="p-3 bg-zinc-800/50 rounded-2xl border border-zinc-750 space-y-1">
              <div className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>Smart Templates</span>
              </div>
              <p className="text-[11px] text-zinc-400">Quick icebreakers and coffee date invitations with one click.</p>
            </div>
          </div>
        </div>
      )}

      {/* When Connected: Mailbox Workspace */}
      {connected && (
        <div className="space-y-4">
          {/* Quick Match Email Bar */}
          {contactCandidates.length > 0 && (
            <div className="bg-zinc-900 rounded-3xl p-4 border border-zinc-800 shadow-sm space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-pink-400" />
                  <span>Send an Email to Your Dating Matches</span>
                </div>
                <span className="text-[10px] text-zinc-500">1-click compose</span>
              </div>

              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                {contactCandidates.slice(0, 8).map((contact) => (
                  <button
                    key={contact.id}
                    type="button"
                    onClick={() => handleComposeWithMatch(contact.email, contact.full_name)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-zinc-800/80 hover:bg-zinc-750 text-zinc-300 text-xs font-medium border border-zinc-700/60 shrink-0 transition group"
                  >
                    <img
                      src={contact.avatar_url}
                      alt={contact.full_name}
                      className="w-5 h-5 rounded-full object-cover border border-zinc-600 group-hover:border-pink-500 transition"
                    />
                    <span className="truncate max-w-[100px]">{contact.full_name.split(' ')[0]}</span>
                    <Mail className="w-3 h-3 text-zinc-500 group-hover:text-pink-400 transition" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Search and Filter Row */}
          <div className="bg-zinc-900 rounded-3xl p-4 border border-zinc-800 shadow-sm space-y-3">
            {/* Search Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                loadEmails();
              }}
              className="flex items-center gap-2"
            >
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search emails by sender, subject, or keywords (e.g. from:sarah, date, coffee)..."
                  className="w-full pl-10 pr-4 py-2 bg-zinc-800/80 border border-zinc-700/80 rounded-2xl text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-pink-500"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 rounded-2xl bg-zinc-800 hover:bg-zinc-750 text-zinc-200 text-xs font-bold border border-zinc-700/80 transition"
              >
                Search
              </button>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                  }}
                  className="px-3 py-2 rounded-2xl text-zinc-400 hover:text-zinc-200 text-xs font-medium transition"
                >
                  Clear
                </button>
              )}
            </form>

            {/* Folder Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-zinc-800/80">
              {[
                { id: 'INBOX' as FolderType, label: 'Inbox', icon: Inbox },
                { id: 'STARRED' as FolderType, label: 'Starred', icon: Star },
                { id: 'SENT' as FolderType, label: 'Sent', icon: Send },
                { id: 'DRAFT' as FolderType, label: 'Drafts', icon: FileText },
                { id: 'TRASH' as FolderType, label: 'Trash', icon: Trash2 }
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = folder === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setFolder(tab.id)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-2 ${
                      isActive
                        ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-sm shadow-pink-500/20'
                        : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-zinc-400'}`} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Email List Card */}
          <div className="bg-zinc-900 rounded-3xl border border-zinc-800 shadow-sm overflow-hidden">
            {errorMessage && (
              <div className="p-4 bg-rose-500/10 border-b border-rose-500/20 text-rose-300 text-xs flex items-center justify-between">
                <span>{errorMessage}</span>
                <button
                  type="button"
                  onClick={() => loadEmails()}
                  className="underline font-bold hover:text-rose-200"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Loading Skeleton */}
            {isLoading && (
              <div className="p-8 space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center gap-3 animate-pulse">
                    <div className="w-5 h-5 bg-zinc-800 rounded-lg" />
                    <div className="w-8 h-8 bg-zinc-800 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-zinc-800 rounded w-1/4" />
                      <div className="h-3 bg-zinc-800/60 rounded w-3/4" />
                    </div>
                    <div className="w-16 h-3 bg-zinc-800 rounded" />
                  </div>
                ))}
              </div>
            )}

            {/* Empty State */}
            {!isLoading && emails.length === 0 && (
              <div className="p-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-zinc-800/80 text-zinc-500 mx-auto flex items-center justify-center">
                  <Mail className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-zinc-200">No emails found</h4>
                  <p className="text-xs text-zinc-500">
                    {searchQuery
                      ? `No emails match "${searchQuery}" in ${folder}`
                      : `Your ${folder.toLowerCase()} folder is currently empty`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsComposeOpen(true)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-750 text-xs font-bold text-zinc-200 border border-zinc-700/80 transition"
                >
                  Compose a Message
                </button>
              </div>
            )}

            {/* Email Rows */}
            {!isLoading && emails.length > 0 && (
              <div className="divide-y divide-zinc-800/70">
                {emails.map((email) => (
                  <div
                    key={email.id}
                    onClick={() => handleOpenEmail(email)}
                    className={`flex items-center gap-3 p-3.5 sm:p-4 hover:bg-zinc-800/50 cursor-pointer transition group ${
                      email.isUnread ? 'bg-zinc-850/40' : ''
                    }`}
                  >
                    {/* Star button */}
                    <button
                      type="button"
                      onClick={(e) => handleToggleStar(e, email)}
                      className="p-1 text-zinc-500 hover:text-amber-400 transition"
                      title={email.isStarred ? 'Unstar' : 'Star'}
                    >
                      <Star
                        className={`w-4 h-4 ${
                          email.isStarred ? 'fill-amber-400 text-amber-400' : ''
                        }`}
                      />
                    </button>

                    {/* Unread indicator */}
                    <div className="w-2 flex justify-center">
                      {email.isUnread && (
                        <span className="w-2 h-2 rounded-full bg-pink-500 shadow-sm shadow-pink-500/50" />
                      )}
                    </div>

                    {/* Sender Initial Avatar */}
                    <div className="w-8 h-8 rounded-full bg-zinc-800 text-zinc-300 flex items-center justify-center font-bold text-xs shrink-0 border border-zinc-700">
                      {email.fromName ? email.fromName[0].toUpperCase() : 'M'}
                    </div>

                    {/* Sender Name & Snippet */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs truncate ${
                            email.isUnread
                              ? 'font-extrabold text-zinc-100'
                              : 'font-medium text-zinc-300'
                          }`}
                        >
                          {email.fromName}
                        </span>
                        {email.isDraft && (
                          <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 text-[10px] font-bold">
                            Draft
                          </span>
                        )}
                      </div>

                      <div className="flex items-baseline gap-1.5 text-xs text-zinc-400 truncate">
                        <span
                          className={`${
                            email.isUnread
                              ? 'font-bold text-zinc-200'
                              : 'font-normal text-zinc-300'
                          }`}
                        >
                          {email.subject}
                        </span>
                        <span className="text-zinc-600">—</span>
                        <span className="text-zinc-500 truncate text-[11px]">
                          {email.snippet}
                        </span>
                      </div>
                    </div>

                    {/* Actions & Date */}
                    <div className="flex items-center gap-2 shrink-0 text-right">
                      <button
                        type="button"
                        onClick={(e) => handleInitiateTrash(e, email)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-zinc-500 hover:text-rose-400 transition"
                        title="Move to trash"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-[11px] text-zinc-500">{email.date.split(',')[0]}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Compose Modal */}
      <GmailComposeModal
        isOpen={isComposeOpen}
        onClose={() => setIsComposeOpen(false)}
        onEmailSent={() => {
          loadEmails();
        }}
        initialTo={composeInitialTo}
        initialSubject={composeInitialSubject}
        initialBody={composeInitialBody}
      />

      {/* Email Detail Modal */}
      <GmailEmailDetailModal
        isOpen={isDetailOpen}
        email={selectedEmail}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedEmail(null);
        }}
        onReply={(to, subject, originalBody) => {
          setComposeInitialTo(to);
          setComposeInitialSubject(subject);
          setComposeInitialBody(originalBody);
          setIsComposeOpen(true);
        }}
        onEmailUpdated={() => {
          loadEmails();
        }}
      />

      {/* Mandatory Trash Confirmation Modal */}
      <GmailConfirmationModal
        isOpen={Boolean(pendingTrashEmail)}
        type="trash"
        title="Move Email to Trash"
        description="Are you sure you want to move this email to trash in Gmail? You can still access it from your Trash folder."
        itemDetails={
          pendingTrashEmail
            ? {
                to: pendingTrashEmail.fromEmail,
                subject: pendingTrashEmail.subject,
                preview: pendingTrashEmail.snippet
              }
            : undefined
        }
        confirmLabel="Move to Trash"
        isProcessing={isTrashing}
        onConfirm={handleConfirmTrash}
        onClose={() => setPendingTrashEmail(null)}
      />
    </div>
  );
};
