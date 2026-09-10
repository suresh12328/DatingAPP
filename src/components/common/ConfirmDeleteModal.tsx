import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trash2, AlertTriangle, X, Loader2 } from 'lucide-react';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  isDeleting?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  title,
  description,
  confirmText = 'Delete',
  cancelText = 'Cancel',
  isDeleting = false,
  onConfirm,
  onClose
}) => {
  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isDeleting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isDeleting, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        id="confirm-delete-modal-backdrop"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs select-none"
        onClick={() => {
          if (!isDeleting) onClose();
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 8 }}
          transition={{ duration: 0.16 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-sm bg-zinc-900 text-zinc-100 rounded-3xl p-6 sm:p-7 shadow-2xl border border-zinc-800"
          role="dialog"
          aria-modal="true"
        >
          {/* Close button */}
          <button
            id="cancel-delete-modal-x-btn"
            onClick={onClose}
            disabled={isDeleting}
            className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-zinc-200 rounded-full hover:bg-zinc-800 transition disabled:opacity-50"
            title="Cancel"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Danger icon badge */}
          <div className="w-14 h-14 mx-auto rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mb-4 shadow-inner">
            <Trash2 className="w-7 h-7" />
          </div>

          {/* Title & Description */}
          <div className="text-center space-y-2 mb-6">
            <h3 className="text-lg font-bold text-zinc-100 font-heading">
              {title}
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed max-w-xs mx-auto">
              {description}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              id="confirm-delete-cancel-btn"
              onClick={onClose}
              disabled={isDeleting}
              className="flex-1 py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-750 text-zinc-300 hover:text-white font-semibold text-xs transition border border-zinc-700/60 disabled:opacity-50"
            >
              {cancelText}
            </button>
            <button
              type="button"
              id="confirm-delete-action-btn"
              onClick={onConfirm}
              disabled={isDeleting}
              className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-98 text-white font-semibold text-xs shadow-lg shadow-rose-600/30 flex items-center justify-center gap-1.5 transition disabled:opacity-50"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Deleting...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{confirmText}</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
