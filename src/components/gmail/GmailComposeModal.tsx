import React, { useState, useEffect } from 'react';
import {
  X,
  Send,
  FileText,
  Sparkles,
  Users,
  Coffee,
  Heart,
  MessageSquare,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { sendGmailEmail, createGmailDraft } from '../../services/gmailService';
import { GmailConfirmationModal } from './GmailConfirmationModal';

interface GmailComposeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEmailSent?: () => void;
  initialTo?: string;
  initialSubject?: string;
  initialBody?: string;
}

export const GmailComposeModal: React.FC<GmailComposeModalProps> = ({
  isOpen,
  onClose,
  onEmailSent,
  initialTo = '',
  initialSubject = '',
  initialBody = ''
}) => {
  const { currentUser } = useAuth();
  const { matches, connections } = useApp();

  const [to, setTo] = useState(initialTo);
  const [subject, setSubject] = useState(initialSubject);
  const [body, setBody] = useState(initialBody);
  const [cc, setCc] = useState('');
  const [showCc, setShowCc] = useState(false);
  const [showContactPicker, setShowContactPicker] = useState(false);

  const [isSending, setIsSending] = useState(false);
  const [isDrafting, setIsDrafting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // State for mandatory confirmation before sending
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTo(initialTo);
      setSubject(initialSubject);
      setBody(initialBody);
      setStatusMessage(null);
    }
  }, [isOpen, initialTo, initialSubject, initialBody]);

  if (!isOpen) return null;

  // Extract contact list from matches and connections
  const contactCandidates = [
    ...matches.map((m) => (m.user1_id === currentUser.id ? m.user2 : m.user1)),
    ...connections
      .filter((c) => c.status === 'ACCEPTED')
      .map((c) => (c.requester_id === currentUser.id ? c.receiver : c.requester))
  ].filter((p, index, self) => p && self.findIndex((o) => o.id === p.id) === index && p.id !== currentUser.id);

  const templates = [
    {
      label: '☕ Coffee Date Invite',
      icon: Coffee,
      subject: `Coffee & conversation this week? ☕`,
      body: `Hi there!\n\nI really enjoyed connecting on LoveConnect and thought it'd be wonderful to grab coffee or a drink sometime this week if you're free.\n\nLet me know what days work best for you!\n\nWarmly,\n${currentUser.full_name}`
    },
    {
      label: '✨ Say Hello',
      icon: Heart,
      subject: `Hey from LoveConnect! ✨`,
      body: `Hi!\n\nSaw your profile on LoveConnect and loved your interests in ${currentUser.interests.slice(0, 2).join(' & ')}. Hope you're having a wonderful day!\n\nBest,\n${currentUser.full_name}`
    },
    {
      label: '💌 Profile Share',
      icon: Sparkles,
      subject: `Connecting from LoveConnect 💌`,
      body: `Hey!\n\nHere is my LoveConnect contact information and profile (${currentUser.username}). Looking forward to staying in touch!\n\nCheers,\n${currentUser.full_name}`
    }
  ];

  const handleSelectTemplate = (template: typeof templates[0]) => {
    setSubject(template.subject);
    setBody(template.body);
  };

  const handleSelectContact = (contactEmail: string, contactName: string) => {
    setTo(contactEmail);
    if (!subject) {
      setSubject(`Hello ${contactName}! 💌`);
    }
    setShowContactPicker(false);
  };

  const handleSaveDraft = async () => {
    if (!to && !subject && !body) {
      setStatusMessage({ type: 'error', text: 'Please fill in a recipient, subject, or message body to save a draft.' });
      return;
    }

    setIsDrafting(true);
    setStatusMessage(null);
    try {
      await createGmailDraft({
        to: to.trim(),
        subject: subject.trim() || '(No Subject)',
        body,
        cc: showCc && cc.trim() ? cc.trim() : undefined
      });
      setStatusMessage({ type: 'success', text: 'Draft saved to your Gmail drafts folder!' });
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to save draft' });
    } finally {
      setIsDrafting(false);
    }
  };

  // User clicked "Send Email" -> Mandatory confirmation modal is presented first
  const handleInitiateSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!to.trim()) {
      setStatusMessage({ type: 'error', text: 'Please specify at least one recipient email address.' });
      return;
    }
    if (!body.trim()) {
      setStatusMessage({ type: 'error', text: 'Please provide some message content before sending.' });
      return;
    }

    setShowConfirmModal(true);
  };

  // Explicit confirmation callback to perform actual send
  const handleConfirmedSend = async () => {
    setIsSending(true);
    setStatusMessage(null);
    try {
      await sendGmailEmail({
        to: to.trim(),
        subject: subject.trim() || '(No Subject)',
        body,
        cc: showCc && cc.trim() ? cc.trim() : undefined
      });

      setShowConfirmModal(false);
      setStatusMessage({ type: 'success', text: 'Email successfully sent via Gmail!' });

      setTimeout(() => {
        onEmailSent?.();
        onClose();
      }, 1200);
    } catch (err: any) {
      setShowConfirmModal(false);
      setStatusMessage({ type: 'error', text: err.message || 'Failed to send email. Please check permissions.' });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-40 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
        <div
          className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          role="dialog"
          aria-modal="true"
        >
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/90">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center">
                <Send className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-zinc-100 flex items-center gap-2">
                  <span>Compose via Gmail</span>
                  <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 text-[10px] font-bold border border-rose-500/20">
                    Live Google Account
                  </span>
                </h3>
                <p className="text-[11px] text-zinc-400">Send authentic emails from your Google inbox</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-zinc-400 hover:text-zinc-200 p-2 rounded-xl hover:bg-zinc-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <form onSubmit={handleInitiateSend} className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
            {statusMessage && (
              <div
                className={`p-3 rounded-2xl text-xs flex items-center gap-2.5 ${
                  statusMessage.type === 'success'
                    ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
                    : 'bg-rose-500/15 border border-rose-500/30 text-rose-300'
                }`}
              >
                {statusMessage.type === 'success' ? (
                  <CheckCircle className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                )}
                <span>{statusMessage.text}</span>
              </div>
            )}

            {/* Quick Templates */}
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-pink-400" />
                <span>Quick Date & Match Templates</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {templates.map((tpl, i) => {
                  const Icon = tpl.icon;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleSelectTemplate(tpl)}
                      className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-750 text-zinc-300 text-xs font-medium border border-zinc-700/60 transition flex items-center gap-1.5"
                    >
                      <Icon className="w-3.5 h-3.5 text-pink-400" />
                      <span>{tpl.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Recipient Field */}
            <div className="space-y-1.5 relative">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-zinc-300">To:</label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowCc(!showCc)}
                    className="text-[11px] font-bold text-zinc-400 hover:text-zinc-200 transition"
                  >
                    {showCc ? '- Hide Cc' : '+ Add Cc'}
                  </button>
                  {contactCandidates.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowContactPicker(!showContactPicker)}
                      className="text-[11px] font-bold text-pink-400 hover:text-pink-300 flex items-center gap-1 transition"
                    >
                      <Users className="w-3 h-3" />
                      <span>Pick from Matches ({contactCandidates.length})</span>
                    </button>
                  )}
                </div>
              </div>

              <input
                type="email"
                required
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder="recipient@example.com"
                className="w-full px-3.5 py-2.5 bg-zinc-800/80 border border-zinc-700/80 rounded-2xl text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-pink-500"
              />

              {/* Match Contact Picker Dropdown */}
              {showContactPicker && (
                <div className="p-2 bg-zinc-800 border border-zinc-700 rounded-2xl shadow-xl space-y-1 max-h-48 overflow-y-auto">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 px-2 py-1">
                    Select a Connection or Match
                  </div>
                  {contactCandidates.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => handleSelectContact(c.email, c.full_name)}
                      className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-zinc-700/60 text-left transition"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={c.avatar_url}
                          alt={c.full_name}
                          className="w-6 h-6 rounded-full object-cover border border-zinc-600"
                        />
                        <div className="truncate">
                          <div className="text-xs font-bold text-zinc-200">{c.full_name}</div>
                          <div className="text-[10px] text-zinc-400 truncate">{c.email}</div>
                        </div>
                      </div>
                      <span className="text-[10px] font-semibold text-pink-400 px-2 py-0.5 rounded-full bg-pink-500/10">
                        Select
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* CC Field */}
            {showCc && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300">Cc:</label>
                <input
                  type="email"
                  value={cc}
                  onChange={(e) => setCc(e.target.value)}
                  placeholder="optional-cc@example.com"
                  className="w-full px-3.5 py-2.5 bg-zinc-800/80 border border-zinc-700/80 rounded-2xl text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-pink-500"
                />
              </div>
            )}

            {/* Subject Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-300">Subject:</label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Subject of your message"
                className="w-full px-3.5 py-2.5 bg-zinc-800/80 border border-zinc-700/80 rounded-2xl text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-pink-500"
              />
            </div>

            {/* Message Body */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-300">Message:</label>
              <textarea
                required
                rows={7}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Write your email here..."
                className="w-full p-3.5 bg-zinc-800/80 border border-zinc-700/80 rounded-2xl text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-pink-500 resize-none font-sans"
              />
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={isDrafting || isSending}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-750 text-zinc-300 text-xs font-bold transition flex items-center gap-1.5 border border-zinc-700/60"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>{isDrafting ? 'Saving Draft...' : 'Save Draft'}</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSending}
                  className="px-4 py-2 rounded-xl text-zinc-400 hover:text-zinc-200 text-xs font-semibold hover:bg-zinc-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSending || isDrafting}
                  className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 text-white text-xs font-bold shadow-md shadow-pink-500/20 hover:opacity-95 transition flex items-center gap-2"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Email</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Mandatory User Confirmation Dialog before sending an email */}
      <GmailConfirmationModal
        isOpen={showConfirmModal}
        type="send"
        title="Confirm Sending Email"
        description="Are you sure you want to send this email via your connected Google account? This will dispatch a real email message through Gmail."
        itemDetails={{
          to,
          subject,
          preview: body.slice(0, 160)
        }}
        confirmLabel="Confirm & Send"
        isProcessing={isSending}
        onConfirm={handleConfirmedSend}
        onClose={() => setShowConfirmModal(false)}
      />
    </>
  );
};
