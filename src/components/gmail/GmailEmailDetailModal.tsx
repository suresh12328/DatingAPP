import React, { useState } from 'react';
import {
  X,
  Star,
  Trash2,
  Reply,
  Mail,
  MailCheck,
  Calendar,
  User,
  ShieldCheck,
  ExternalLink,
  Code
} from 'lucide-react';
import { GmailEmail } from '../../types/gmail';
import {
  modifyGmailMessageLabels,
  trashGmailMessage
} from '../../services/gmailService';
import { GmailConfirmationModal } from './GmailConfirmationModal';

interface GmailEmailDetailModalProps {
  isOpen: boolean;
  email: GmailEmail | null;
  onClose: () => void;
  onReply: (to: string, subject: string, originalBody: string) => void;
  onEmailUpdated: () => void;
}

export const GmailEmailDetailModal: React.FC<GmailEmailDetailModalProps> = ({
  isOpen,
  email,
  onClose,
  onReply,
  onEmailUpdated
}) => {
  const [viewMode, setViewMode] = useState<'formatted' | 'raw'>('formatted');
  const [isStarred, setIsStarred] = useState(email?.isStarred ?? false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showTrashConfirm, setShowTrashConfirm] = useState(false);

  // Keep state in sync with email prop
  React.useEffect(() => {
    if (email) {
      setIsStarred(email.isStarred);
    }
  }, [email]);

  if (!isOpen || !email) return null;

  const handleToggleStar = async () => {
    try {
      if (isStarred) {
        setIsStarred(false);
        await modifyGmailMessageLabels(email.id, [], ['STARRED']);
      } else {
        setIsStarred(true);
        await modifyGmailMessageLabels(email.id, ['STARRED'], []);
      }
      onEmailUpdated();
    } catch (err) {
      console.error('Failed to update star state:', err);
    }
  };

  const handleMarkUnread = async () => {
    try {
      await modifyGmailMessageLabels(email.id, ['UNREAD'], []);
      onEmailUpdated();
      onClose();
    } catch (err) {
      console.error('Failed to mark as unread:', err);
    }
  };

  // Explicit confirmation callback for trashing an email
  const handleConfirmedTrash = async () => {
    setIsProcessing(true);
    try {
      await trashGmailMessage(email.id);
      setShowTrashConfirm(false);
      onEmailUpdated();
      onClose();
    } catch (err) {
      console.error('Failed to trash email:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReplyClick = () => {
    const replySubject = email.subject.startsWith('Re:') ? email.subject : `Re: ${email.subject}`;
    const quotedBody = `\n\n--- On ${email.date}, ${email.from} wrote:\n> ${email.bodyText.replace(/\n/g, '\n> ')}`;
    onReply(email.fromEmail, replySubject, quotedBody);
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-40 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
        <div
          className="w-full max-w-3xl bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          role="dialog"
          aria-modal="true"
        >
          {/* Top action header */}
          <div className="p-4 sm:p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/90">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleToggleStar}
                className={`p-2 rounded-xl transition ${
                  isStarred
                    ? 'text-amber-400 bg-amber-500/10 hover:bg-amber-500/20'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                }`}
                title={isStarred ? 'Unstar email' : 'Star email'}
              >
                <Star className={`w-4 h-4 ${isStarred ? 'fill-amber-400' : ''}`} />
              </button>

              <button
                type="button"
                onClick={handleMarkUnread}
                className="p-2 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition"
                title="Mark as unread"
              >
                <Mail className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setShowTrashConfirm(true)}
                className="p-2 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition"
                title="Move to trash"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              <div className="h-4 w-px bg-zinc-800 mx-1" />

              <button
                type="button"
                onClick={handleReplyClick}
                className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-750 text-zinc-200 text-xs font-semibold transition flex items-center gap-1.5"
              >
                <Reply className="w-3.5 h-3.5" />
                <span>Reply</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              {email.bodyHtml && (
                <div className="flex items-center bg-zinc-800/80 rounded-xl p-0.5 border border-zinc-700/60">
                  <button
                    type="button"
                    onClick={() => setViewMode('formatted')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                      viewMode === 'formatted'
                        ? 'bg-zinc-700 text-zinc-100 shadow-sm'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    HTML
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('raw')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                      viewMode === 'raw'
                        ? 'bg-zinc-700 text-zinc-100 shadow-sm'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    Text
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={onClose}
                className="text-zinc-400 hover:text-zinc-200 p-2 rounded-xl hover:bg-zinc-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Email Subject & Meta */}
          <div className="p-5 border-b border-zinc-800 bg-zinc-900/60 space-y-3">
            <div className="flex items-start justify-between gap-4">
              <h2 className="text-base sm:text-lg font-extrabold text-zinc-100 font-heading leading-tight">
                {email.subject}
              </h2>
              <div className="flex flex-wrap gap-1 shrink-0">
                {email.labels.map((lbl) => (
                  <span
                    key={lbl}
                    className="px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 text-[10px] font-semibold border border-zinc-700"
                  >
                    {lbl}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-zinc-400 pt-1">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-rose-500 to-pink-500 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
                  {email.fromName ? email.fromName[0].toUpperCase() : 'M'}
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-zinc-200 truncate flex items-center gap-1.5">
                    <span>{email.fromName}</span>
                    <span className="text-[11px] text-zinc-400 font-normal truncate">&lt;{email.fromEmail}&gt;</span>
                  </div>
                  <div className="text-[11px] text-zinc-400 truncate">To: {email.to || 'me'}</div>
                </div>
              </div>

              <div className="text-[11px] text-zinc-500 shrink-0 text-right">
                {email.date}
              </div>
            </div>
          </div>

          {/* Content Body */}
          <div className="p-5 overflow-y-auto flex-1 text-sm text-zinc-200 leading-relaxed font-sans bg-zinc-950/40">
            {viewMode === 'formatted' && email.bodyHtml ? (
              <div
                className="prose prose-invert max-w-none text-zinc-300 text-xs sm:text-sm overflow-x-auto"
                dangerouslySetInnerHTML={{ __html: email.bodyHtml }}
              />
            ) : (
              <pre className="whitespace-pre-wrap font-sans text-xs sm:text-sm text-zinc-300 leading-relaxed">
                {email.bodyText}
              </pre>
            )}
          </div>

          {/* Quick Reply Bar */}
          <div className="p-4 border-t border-zinc-800 bg-zinc-900 flex items-center justify-between">
            <button
              type="button"
              onClick={handleReplyClick}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white text-xs font-bold transition flex items-center gap-2 shadow-md shadow-pink-500/20"
            >
              <Reply className="w-3.5 h-3.5" />
              <span>Reply to {email.fromName}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-zinc-400 hover:text-zinc-200 text-xs font-semibold hover:bg-zinc-800 transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Mandatory User Confirmation Dialog before moving email to trash */}
      <GmailConfirmationModal
        isOpen={showTrashConfirm}
        type="trash"
        title="Move Email to Trash"
        description="Are you sure you want to move this email to the trash in your Gmail account? You can recover it from the trash folder in Gmail within 30 days."
        itemDetails={{
          to: email.fromEmail,
          subject: email.subject,
          preview: email.snippet
        }}
        confirmLabel="Move to Trash"
        isProcessing={isProcessing}
        onConfirm={handleConfirmedTrash}
        onClose={() => setShowTrashConfirm(false)}
      />
    </>
  );
};
