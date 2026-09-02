import React from 'react';
import { ShieldCheck } from 'lucide-react';

interface AvatarProps {
  src?: string;
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  isOnline?: boolean;
  isVerified?: boolean;
  className?: string;
  onClick?: () => void;
}

const sizeClasses = {
  xs: 'w-7 h-7 text-xs',
  sm: 'w-9 h-9 text-xs',
  md: 'w-11 h-11 text-sm',
  lg: 'w-14 h-14 text-base',
  xl: 'w-20 h-20 text-xl',
  '2xl': 'w-28 h-28 text-2xl',
};

const badgeSizes = {
  xs: 'w-2 h-2 ring-1',
  sm: 'w-2.5 h-2.5 ring-2',
  md: 'w-3 h-3 ring-2',
  lg: 'w-3.5 h-3.5 ring-2',
  xl: 'w-4 h-4 ring-2',
  '2xl': 'w-5 h-5 ring-4',
};

export const Avatar: React.FC<AvatarProps> = ({
  src,
  name,
  size = 'md',
  isOnline,
  isVerified,
  className = '',
  onClick
}) => {
  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      id={`avatar-${name.replace(/\s+/g, '-').toLowerCase()}`}
      className={`relative inline-block shrink-0 select-none ${onClick ? 'cursor-pointer hover:opacity-90 transition' : ''} ${className}`}
      onClick={onClick}
    >
      <div
        className={`${sizeClasses[size]} rounded-full overflow-hidden bg-gradient-to-tr from-pink-500 via-rose-500 to-indigo-600 flex items-center justify-center text-white font-semibold shadow-sm`}
      >
        {src ? (
          <img
            src={src}
            alt={name}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
            onError={(e) => {
              // fallback to initials on broken image
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        ) : (
          <span>{initials}</span>
        )}
      </div>

      {isOnline && (
        <span
          className={`absolute bottom-0 right-0 rounded-full bg-emerald-500 ring-white ${badgeSizes[size]}`}
          title="Online now"
        />
      )}

      {isVerified && (
        <span
          className="absolute -top-0.5 -right-0.5 bg-blue-500 text-white rounded-full p-0.5 shadow-sm"
          title="Verified Profile"
        >
          <ShieldCheck className="w-3 h-3" />
        </span>
      )}
    </div>
  );
};
