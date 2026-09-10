import React, { useEffect } from 'react';
import {
  Image as ImageIcon,
  Camera,
  MapPin,
  User,
  FileText,
  BarChart2,
  Calendar,
  Sparkles,
  X
} from 'lucide-react';

export type AttachmentOptionType =
  | 'gallery'
  | 'camera'
  | 'location'
  | 'contact'
  | 'document'
  | 'poll'
  | 'event'
  | 'ai_images';

interface AttachmentBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectOption: (option: AttachmentOptionType) => void;
}

interface AttachmentOptionConfig {
  id: AttachmentOptionType;
  label: string;
  icon: React.ElementType;
  bgGradient: string;
  hoverColor: string;
}

const ATTACHMENT_OPTIONS: AttachmentOptionConfig[] = [
  {
    id: 'gallery',
    label: 'Gallery',
    icon: ImageIcon,
    bgGradient: 'bg-gradient-to-tr from-blue-600 to-blue-500',
    hoverColor: 'hover:ring-2 hover:ring-blue-400/50'
  },
  {
    id: 'camera',
    label: 'Camera',
    icon: Camera,
    bgGradient: 'bg-gradient-to-tr from-pink-600 to-rose-500',
    hoverColor: 'hover:ring-2 hover:ring-pink-400/50'
  },
  {
    id: 'location',
    label: 'Location',
    icon: MapPin,
    bgGradient: 'bg-gradient-to-tr from-emerald-600 to-teal-500',
    hoverColor: 'hover:ring-2 hover:ring-emerald-400/50'
  },
  {
    id: 'contact',
    label: 'Contact',
    icon: User,
    bgGradient: 'bg-gradient-to-tr from-sky-600 to-cyan-500',
    hoverColor: 'hover:ring-2 hover:ring-sky-400/50'
  },
  {
    id: 'document',
    label: 'Document',
    icon: FileText,
    bgGradient: 'bg-gradient-to-tr from-purple-600 to-violet-500',
    hoverColor: 'hover:ring-2 hover:ring-purple-400/50'
  },
  {
    id: 'poll',
    label: 'Poll',
    icon: BarChart2,
    bgGradient: 'bg-gradient-to-tr from-amber-500 to-orange-500',
    hoverColor: 'hover:ring-2 hover:ring-amber-400/50'
  },
  {
    id: 'event',
    label: 'Event',
    icon: Calendar,
    bgGradient: 'bg-gradient-to-tr from-rose-600 to-red-500',
    hoverColor: 'hover:ring-2 hover:ring-rose-400/50'
  },
  {
    id: 'ai_images',
    label: 'AI images',
    icon: Sparkles,
    bgGradient: 'bg-gradient-to-tr from-indigo-600 to-blue-600',
    hoverColor: 'hover:ring-2 hover:ring-indigo-400/50'
  }
];

export const AttachmentBottomSheet: React.FC<AttachmentBottomSheetProps> = ({
  isOpen,
  onClose,
  onSelectOption
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/65 backdrop-blur-xs animate-in fade-in duration-200">
      {/* Backdrop click to dismiss */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Pop-up / Bottom Sheet Card */}
      <div
        id="attachment-bottom-sheet"
        className="relative z-10 w-full max-w-md bg-zinc-900 border-t sm:border border-zinc-800 rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl shadow-black/80 transition-all transform animate-in slide-in-from-bottom-6 duration-200"
      >
        {/* Top Handle Bar */}
        <div className="w-12 h-1.5 bg-zinc-700 rounded-full mx-auto mb-5 cursor-pointer" onClick={onClose} />

        {/* Close button for desktop */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition"
          title="Close attachment menu"
        >
          <X className="w-4 h-4" />
        </button>

        {/* 4x2 Grid of 8 Options matching the uploaded spec */}
        <div className="grid grid-cols-4 gap-y-5 gap-x-2 sm:gap-x-4 py-2">
          {ATTACHMENT_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            return (
              <button
                key={opt.id}
                id={`attachment-opt-${opt.id}`}
                type="button"
                onClick={() => {
                  onSelectOption(opt.id);
                  onClose();
                }}
                className="group flex flex-col items-center text-center focus:outline-none transition active:scale-95"
              >
                {/* Colorful circular icon button */}
                <div
                  className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center text-white shadow-lg ${opt.bgGradient} ${opt.hoverColor} group-hover:scale-105 group-hover:shadow-xl transition-all duration-200`}
                >
                  <Icon className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2.2]" />
                </div>

                {/* Option text label */}
                <span className="mt-2 text-xs font-medium text-zinc-300 group-hover:text-zinc-100 transition truncate max-w-[70px]">
                  {opt.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
