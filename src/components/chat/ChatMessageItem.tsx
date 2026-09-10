import React, { useState } from 'react';
import {
  MapPin,
  User,
  FileText,
  BarChart2,
  Calendar,
  Download,
  ExternalLink,
  Play,
  Pause,
  Clock,
  Check,
  CheckCheck
} from 'lucide-react';
import { Message, Profile } from '../../types';
import { Avatar } from '../common/Avatar';

interface ChatMessageItemProps {
  message: Message;
  isMe: boolean;
  currentUser: Profile;
  partnerUser: Profile;
  onVotePoll?: (messageId: string, optionId: string) => void;
  onRsvpEvent?: (messageId: string, status: 'yes' | 'maybe') => void;
  onOpenMedia?: (url: string, type: 'image' | 'video') => void;
  onViewContact?: (userId: string) => void;
}

export const MessageStatusTicks: React.FC<{
  status?: 'sent' | 'delivered' | 'read';
  isRead?: boolean;
  className?: string;
  isBlueBubble?: boolean;
}> = ({ status, isRead, className = '', isBlueBubble = false }) => {
  const normalizedStatus = status || (isRead ? 'read' : 'sent');

  if (normalizedStatus === 'read') {
    return (
      <span
        title="Read / Seen"
        className={`inline-flex items-center ${isBlueBubble ? 'text-cyan-200' : 'text-sky-400'} font-semibold ${className}`}
        aria-label="Read"
      >
        <CheckCheck className="w-3.5 h-3.5 stroke-[2.2]" />
      </span>
    );
  }

  if (normalizedStatus === 'delivered') {
    return (
      <span
        title="Delivered"
        className={`inline-flex items-center ${isBlueBubble ? 'text-white/80' : 'text-zinc-300'} ${className}`}
        aria-label="Delivered"
      >
        <CheckCheck className="w-3.5 h-3.5 stroke-[2]" />
      </span>
    );
  }

  return (
    <span
      title="Sent"
      className={`inline-flex items-center ${isBlueBubble ? 'text-white/50' : 'text-zinc-500'} ${className}`}
      aria-label="Sent"
    >
      <Check className="w-3.5 h-3.5 stroke-[2]" />
    </span>
  );
};

export const ChatMessageItem: React.FC<ChatMessageItemProps> = ({
  message,
  isMe,
  currentUser,
  partnerUser,
  onVotePoll,
  onRsvpEvent,
  onOpenMedia,
  onViewContact
}) => {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // Time formatter
  const formattedTime = new Date(message.created_at).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });

  const content = message.content || '';

  // 1. Check for LOCATION card: [LOCATION:{...}]
  if (content.startsWith('[LOCATION:') && content.endsWith(']')) {
    try {
      const jsonStr = content.slice(10, -1);
      const locData = JSON.parse(jsonStr);
      return (
        <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-3`}>
          <div
            className={`max-w-xs sm:max-w-sm rounded-3xl p-4 shadow-lg border ${
              isMe
                ? 'bg-zinc-800/95 border-pink-500/30 text-white'
                : 'bg-zinc-900 border-zinc-800 text-zinc-100'
            }`}
          >
            <div className="flex items-center gap-2.5 mb-2.5">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                  Shared Location
                </span>
                <h4 className="text-xs font-bold text-zinc-100 truncate">
                  {locData.title || 'Live Location'}
                </h4>
              </div>
            </div>

            <p className="text-xs text-zinc-300 mb-3 bg-zinc-950/40 p-2.5 rounded-xl border border-zinc-800">
              {locData.address || `${locData.lat?.toFixed(4)}, ${locData.lng?.toFixed(4)}`}
            </p>

            <div className="flex items-center justify-between pt-1">
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${locData.lat},${locData.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 hover:text-emerald-300 transition"
              >
                <span>Open in Maps</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-zinc-500">{formattedTime}</span>
                {isMe && <MessageStatusTicks status={message.status} isRead={message.is_read || Boolean(message.read_at)} />}
              </div>
            </div>
          </div>
        </div>
      );
    } catch {
      // Fallback to regular text if parse fails
    }
  }

  // 2. Check for CONTACT card: [CONTACT:{...}]
  if (content.startsWith('[CONTACT:') && content.endsWith(']')) {
    try {
      const jsonStr = content.slice(9, -1);
      const contactData = JSON.parse(jsonStr);
      return (
        <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-3`}>
          <div
            className={`max-w-xs sm:max-w-sm w-72 rounded-3xl p-4 shadow-lg border ${
              isMe
                ? 'bg-zinc-800/95 border-sky-500/30 text-white'
                : 'bg-zinc-900 border-zinc-800 text-zinc-100'
            }`}
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0">
                <User className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400">
                Contact Card
              </span>
            </div>

            <div className="flex items-center gap-3 bg-zinc-950/50 p-3 rounded-2xl border border-zinc-800/70 mb-3">
              <Avatar
                src={contactData.avatar || contactData.avatar_url}
                name={contactData.name || contactData.full_name}
                size="md"
              />
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-zinc-100 truncate">
                  {contactData.name || contactData.full_name}
                </h4>
                <p className="text-[11px] text-zinc-400 truncate">
                  @{contactData.username}
                </p>
                {contactData.location && (
                  <p className="text-[10px] text-zinc-500 truncate">
                    {contactData.location}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between">
              {onViewContact ? (
                <button
                  type="button"
                  onClick={() => onViewContact(contactData.id)}
                  className="px-3 py-1.5 rounded-xl bg-sky-500/20 hover:bg-sky-500 text-sky-400 hover:text-white text-xs font-bold transition"
                >
                  View Profile
                </button>
              ) : (
                <span className="text-xs text-sky-400 font-medium">LoveConnect User</span>
              )}
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-zinc-500">{formattedTime}</span>
                {isMe && <MessageStatusTicks status={message.status} isRead={message.is_read || Boolean(message.read_at)} />}
              </div>
            </div>
          </div>
        </div>
      );
    } catch {
      // Fallback
    }
  }

  // 3. Check for POLL card: [POLL:{...}]
  if (content.startsWith('[POLL:') && content.endsWith(']')) {
    try {
      const jsonStr = content.slice(6, -1);
      const pollData = JSON.parse(jsonStr);
      const totalVotes = pollData.options.reduce(
        (acc: number, opt: any) => acc + (opt.votes?.length || 0),
        0
      );

      return (
        <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-3`}>
          <div
            className={`max-w-xs sm:max-w-sm w-80 rounded-3xl p-4 shadow-lg border ${
              isMe
                ? 'bg-zinc-800/95 border-amber-500/30 text-white'
                : 'bg-zinc-900 border-zinc-800 text-zinc-100'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <BarChart2 className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                Poll
              </span>
            </div>

            <h4 className="text-xs sm:text-sm font-bold text-zinc-100 mb-3">
              {pollData.question}
            </h4>

            <div className="space-y-2 mb-3">
              {pollData.options.map((opt: any) => {
                const voteCount = opt.votes?.length || 0;
                const percentage = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
                const hasVoted = opt.votes?.includes(currentUser.id);

                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => onVotePoll?.(message.id, opt.id)}
                    className={`relative w-full text-left p-2.5 rounded-xl border transition overflow-hidden ${
                      hasVoted
                        ? 'border-amber-500/80 bg-amber-500/10'
                        : 'border-zinc-750 bg-zinc-950/40 hover:border-zinc-600'
                    }`}
                  >
                    {/* Background progress fill */}
                    {totalVotes > 0 && (
                      <div
                        className="absolute inset-y-0 left-0 bg-amber-500/20 transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    )}

                    <div className="relative z-10 flex items-center justify-between text-xs">
                      <span className="font-medium text-zinc-200 truncate pr-2">
                        {opt.text}
                      </span>
                      <span className="text-[11px] font-bold text-zinc-400 shrink-0">
                        {percentage}% ({voteCount})
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between text-[10px] text-zinc-500 pt-1 border-t border-zinc-800">
              <span>{totalVotes} vote{totalVotes === 1 ? '' : 's'}</span>
              <div className="flex items-center gap-1">
                <span>{formattedTime}</span>
                {isMe && <MessageStatusTicks status={message.status} isRead={message.is_read || Boolean(message.read_at)} />}
              </div>
            </div>
          </div>
        </div>
      );
    } catch {
      // Fallback
    }
  }

  // 4. Check for EVENT card: [EVENT:{...}]
  if (content.startsWith('[EVENT:') && content.endsWith(']')) {
    try {
      const jsonStr = content.slice(7, -1);
      const evData = JSON.parse(jsonStr);
      const evDate = new Date(evData.dateTime);
      const isDateValid = !isNaN(evDate.getTime());
      const hasRsvpdYes = evData.rsvpYes?.includes(currentUser.id);

      return (
        <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-3`}>
          <div
            className={`max-w-xs sm:max-w-sm w-80 rounded-3xl p-4 shadow-lg border ${
              isMe
                ? 'bg-zinc-800/95 border-rose-500/30 text-white'
                : 'bg-zinc-900 border-zinc-800 text-zinc-100'
            }`}
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                <Calendar className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400">
                Date & Event Invitation
              </span>
            </div>

            <div className="flex gap-3 bg-zinc-950/50 p-3 rounded-2xl border border-zinc-800/70 mb-3">
              {isDateValid && (
                <div className="flex flex-col items-center justify-center w-12 h-14 bg-rose-500/20 text-rose-400 rounded-xl border border-rose-500/30 shrink-0">
                  <span className="text-[9px] font-bold uppercase">
                    {evDate.toLocaleString('default', { month: 'short' })}
                  </span>
                  <span className="text-base font-extrabold">{evDate.getDate()}</span>
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h4 className="text-xs sm:text-sm font-bold text-zinc-100 truncate">
                  {evData.title}
                </h4>
                <div className="flex items-center gap-1 text-[11px] text-zinc-400 mt-1">
                  <Clock className="w-3 h-3 text-zinc-500" />
                  <span>
                    {isDateValid
                      ? evDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : evData.dateTime}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-zinc-400 mt-0.5">
                  <MapPin className="w-3 h-3 text-zinc-500" />
                  <span className="truncate">{evData.location}</span>
                </div>
              </div>
            </div>

            {evData.description && (
              <p className="text-xs text-zinc-300 italic mb-3 bg-zinc-950/30 p-2 rounded-xl">
                "{evData.description}"
              </p>
            )}

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() => onRsvpEvent?.(message.id, hasRsvpdYes ? 'maybe' : 'yes')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  hasRsvpdYes
                    ? 'bg-emerald-500 text-white'
                    : 'bg-rose-500/20 hover:bg-rose-500 text-rose-400 hover:text-white'
                }`}
              >
                <Check className="w-3.5 h-3.5" />
                <span>{hasRsvpdYes ? "I'm Going!" : 'Accept Invitation'}</span>
              </button>
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-zinc-500">{formattedTime}</span>
                {isMe && <MessageStatusTicks status={message.status} isRead={message.is_read || Boolean(message.read_at)} />}
              </div>
            </div>
          </div>
        </div>
      );
    } catch {
      // Fallback
    }
  }

  // 5. Check for DOCUMENT card: [DOCUMENT:{...}]
  if (content.startsWith('[DOCUMENT:') && content.endsWith(']')) {
    try {
      const jsonStr = content.slice(10, -1);
      const docData = JSON.parse(jsonStr);
      return (
        <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-3`}>
          <div
            className={`max-w-xs sm:max-w-sm rounded-3xl p-3.5 shadow-lg border ${
              isMe
                ? 'bg-zinc-800/95 border-purple-500/30 text-white'
                : 'bg-zinc-900 border-zinc-800 text-zinc-100'
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-bold text-zinc-100 truncate">
                  {docData.name || 'Document'}
                </h4>
                <p className="text-[10px] text-zinc-400">{docData.size || 'Shared file'}</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-zinc-800/80">
              <a
                href={docData.url}
                download={docData.name || 'document'}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs font-bold text-purple-400 hover:text-purple-300 transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download</span>
              </a>
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-zinc-500">{formattedTime}</span>
                {isMe && <MessageStatusTicks status={message.status} isRead={message.is_read || Boolean(message.read_at)} />}
              </div>
            </div>
          </div>
        </div>
      );
    } catch {
      // Fallback
    }
  }

  // 6. Check for VOICE note: [VOICE:{...}]
  if (content.startsWith('[VOICE:') && content.endsWith(']')) {
    try {
      const jsonStr = content.slice(7, -1);
      const voiceData = JSON.parse(jsonStr);
      return (
        <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-3`}>
          <div
            className={`max-w-xs rounded-3xl p-3 shadow-lg border flex items-center gap-3 ${
              isMe
                ? 'bg-zinc-800/95 border-pink-500/30 text-white'
                : 'bg-zinc-900 border-zinc-800 text-zinc-100'
            }`}
          >
            <button
              type="button"
              onClick={() => setIsPlayingAudio(!isPlayingAudio)}
              className="w-10 h-10 rounded-full bg-pink-600 hover:bg-pink-500 text-white flex items-center justify-center shrink-0 shadow-md transition"
            >
              {isPlayingAudio ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
            </button>

            {/* Visual audio wave bars */}
            <div className="flex items-center gap-1 h-6 flex-1 px-1">
              {[40, 75, 55, 90, 60, 45, 80, 65, 95, 50, 70, 40].map((h, i) => (
                <div
                  key={i}
                  className={`w-1 rounded-full transition-all duration-200 ${
                    isPlayingAudio ? 'bg-pink-500 animate-pulse' : 'bg-zinc-600'
                  }`}
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>

            <div className="text-right shrink-0">
              <span className="block text-[11px] font-mono text-zinc-300">
                {voiceData.duration || '0:12'}
              </span>
              <div className="flex items-center justify-end gap-1">
                <span className="text-[9px] text-zinc-500">{formattedTime}</span>
                {isMe && <MessageStatusTicks status={message.status} isRead={message.is_read || Boolean(message.read_at)} />}
              </div>
            </div>
          </div>
        </div>
      );
    } catch {
      // Fallback
    }
  }

  // 7. Media Attachment (Photo or Video)
  if (message.media_url) {
    const isVideo = message.media_type === 'video' || /\.(mp4|webm|mov)$/i.test(message.media_url);

    return (
      <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-3`}>
        <div
          className={`max-w-xs sm:max-w-sm rounded-3xl overflow-hidden shadow-lg border ${
            isMe
              ? 'bg-zinc-800/95 border-pink-500/30'
              : 'bg-zinc-900 border-zinc-800'
          }`}
        >
          {isVideo ? (
            <video
              src={message.media_url}
              controls
              playsInline
              className="w-full max-h-72 object-cover rounded-t-3xl bg-black"
            />
          ) : (
            <div
              className="relative cursor-pointer group"
              onClick={() => onOpenMedia?.(message.media_url!, 'image')}
            >
              <img
                src={message.media_url}
                alt="Chat attachment"
                className="w-full max-h-72 object-cover rounded-t-3xl transition group-hover:opacity-95"
              />
            </div>
          )}

          {/* Optional Caption and footer */}
          <div className="p-2.5 flex items-center justify-between">
            {content && !content.startsWith('[') ? (
              <p className="text-xs text-zinc-200 truncate pr-2">{content}</p>
            ) : (
              <span />
            )}
            <div className="flex items-center gap-1 text-[10px] text-zinc-400 shrink-0 ml-auto">
              <span>{formattedTime}</span>
              {isMe && (
                <MessageStatusTicks
                  status={message.status}
                  isRead={message.is_read || Boolean(message.read_at)}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 8. Like / Thumbs Up Reaction
  if (content === '👍') {
    return (
      <div className={`flex ${isMe ? 'justify-end' : 'justify-start items-end gap-2'} mb-2.5 px-2`}>
        {!isMe && partnerUser && (
          <Avatar
            src={partnerUser.avatar_url}
            name={partnerUser.full_name}
            size="xs"
            className="shrink-0 mb-1"
          />
        )}
        <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
          <div className="text-4xl sm:text-5xl hover:scale-110 active:scale-95 transition cursor-pointer select-none py-1">
            👍
          </div>
          <div className="flex items-center gap-1 text-[10px] text-zinc-500 mt-0.5">
            <span>{formattedTime}</span>
            {isMe && (
              <MessageStatusTicks
                status={message.status}
                isRead={message.is_read || Boolean(message.read_at)}
              />
            )}
          </div>
        </div>
      </div>
    );
  }

  // 9. Standard Text Message
  return (
    <div className={`flex ${isMe ? 'justify-end' : 'justify-start items-end gap-2'} mb-2.5`}>
      {!isMe && partnerUser && (
        <Avatar
          src={partnerUser.avatar_url}
          name={partnerUser.full_name}
          size="xs"
          className="shrink-0 mb-1"
        />
      )}
      <div
        className={`max-w-[80%] sm:max-w-md px-4 py-2.5 rounded-2xl shadow-sm text-sm break-words ${
          isMe
            ? 'bg-[#0084FF] text-white rounded-br-sm'
            : 'bg-[#2e3035] text-zinc-100 rounded-bl-sm border border-zinc-700/40'
        }`}
      >
        <p className="leading-relaxed whitespace-pre-wrap">{content}</p>
        <div className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${isMe ? 'text-white/75' : 'text-zinc-400'}`}>
          <span>{formattedTime}</span>
          {isMe && (
            <MessageStatusTicks
              status={message.status}
              isRead={message.is_read || Boolean(message.read_at)}
              isBlueBubble={true}
            />
          )}
        </div>
      </div>
    </div>
  );
};
