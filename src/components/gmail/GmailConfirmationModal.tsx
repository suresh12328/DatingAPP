import React from 'react';
import { AlertTriangle, Send, Trash2, X } from 'lucide-react';

interface GmailConfirmationModalProps {
  isOpen: boolean;
  type: 'send' | 'trash' | 'delete';
  title: string;
  description: string;
  itemDetails?: {
    to?: string;
    subject?: string;
    preview?: string;
  };
  confirmLabel?: string;
  isProcessing?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export const GmailConfirmationModal: React.FC<GmailConfirmationModalProps> = ({
  isOpen,
  type,
  title,
  description,
  itemDetails,
  confirmLabel,
  isProcessing = false,
  onConfirm,
  onClose
}) => {
  if (!isOpen) return null;

  const isDestructive = type === 'trash' || type === 'delete';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden p-6 space-y-4"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                isDestructive
                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
              }`}
            >
              {isDestructive ? (
                <Trash2 className="w-5 h-5" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-100">{title}</h3>
              <p className="text-xs text-zinc-400">Gmail Action Confirmation</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="text-zinc-400 hover:text-zinc-200 p-1.5 rounded-xl hover:bg-zinc-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-zinc-300 leading-relaxed">{description}</p>

        {itemDetails && (
          <div className="p-3.5 bg-zinc-800/60 rounded-2xl border border-zinc-750 text-xs space-y-1.5">
            {itemDetails.to && (
              <div className="flex items-center gap-2 text-zinc-300">
                <span className="text-zinc-500 font-medium w-14 shrink-0">Recipient:</span>
                <span className="font-semibold text-zinc-200 truncate">{itemDetails.to}</span>
              </div>
            )}
            {itemDetails.subject && (
              <div className="flex items-center gap-2 text-zinc-300">
                <span className="text-zinc-500 font-medium w-14 shrink-0">Subject:</span>
                <span className="font-semibold text-zinc-100 truncate">{itemDetails.subject}</span>
              </div>
            )}
            {itemDetails.preview && (
              <div className="pt-1.5 border-t border-zinc-700/50 text-[11px] text-zinc-400 line-clamp-3 italic">
                "{itemDetails.preview}"
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="px-4 py-2 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 rounded-xl transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isProcessing}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition shadow-md flex items-center gap-2 ${
              isDestructive
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/20'
                : 'bg-gradient-to-r from-pink-500 to-rose-500 hover:opacity-90 text-white shadow-pink-500/20'
            }`}
          >
            {isProcessing ? (
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : isDestructive ? (
              <Trash2 className="w-3.5 h-3.5" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
            <span>{confirmLabel || (isDestructive ? 'Delete' : 'Confirm & Send')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
