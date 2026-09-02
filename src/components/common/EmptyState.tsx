import React from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionText,
  onAction,
  className = ''
}) => {
  return (
    <div
      id={`empty-state-${title.replace(/\s+/g, '-').toLowerCase()}`}
      className={`flex flex-col items-center justify-center p-8 sm:p-12 text-center bg-zinc-900 rounded-3xl border border-zinc-800 shadow-sm ${className}`}
    >
      <div className="w-16 h-16 rounded-3xl bg-pink-500/10 text-pink-400 flex items-center justify-center mb-4 border border-pink-500/20">
        <Icon className="w-8 h-8" />
      </div>
      <h3 className="text-lg font-bold text-zinc-100 font-heading mb-1">{title}</h3>
      <p className="text-sm text-zinc-400 max-w-sm mb-6">{description}</p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 text-white text-sm font-semibold hover:opacity-95 shadow-md shadow-pink-500/20 transition"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};
