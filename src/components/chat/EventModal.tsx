import React, { useState } from 'react';
import { Calendar, MapPin, Clock, FileText, X } from 'lucide-react';

export interface EventData {
  id: string;
  title: string;
  dateTime: string;
  location: string;
  description?: string;
  rsvpYes: string[];
  rsvpMaybe: string[];
  createdBy: string;
}

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitEvent: (event: EventData) => void;
  currentUserId: string;
  chatPartnerName?: string;
}

export const EventModal: React.FC<EventModalProps> = ({
  isOpen,
  onClose,
  onSubmitEvent,
  currentUserId,
  chatPartnerName
}) => {
  const [title, setTitle] = useState('');
  const [dateTime, setDateTime] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('Please provide a title for the date or event.');
      return;
    }

    if (!dateTime) {
      setError('Please select a date and time.');
      return;
    }

    const eventData: EventData = {
      id: `ev-${Date.now()}`,
      title: title.trim(),
      dateTime,
      location: location.trim() || 'To be decided',
      description: description.trim() || undefined,
      rsvpYes: [currentUserId],
      rsvpMaybe: [],
      createdBy: currentUserId
    };

    onSubmitEvent(eventData);
    handleClose();
  };

  const handleClose = () => {
    setTitle('');
    setDateTime('');
    setLocation('');
    setDescription('');
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-100">Plan Date / Event</h3>
              <p className="text-[11px] text-zinc-400">
                Send a date invite {chatPartnerName ? `to ${chatPartnerName}` : ''}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-800/50 text-rose-300 text-xs">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Event / Date Title
            </label>
            <input
              type="text"
              id="event-title-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Sunset Cocktails & Live Jazz 🍸"
              className="w-full px-3.5 py-2.5 bg-zinc-800 border border-zinc-750 rounded-2xl text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-rose-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-rose-400" />
              Date & Time
            </label>
            <input
              type="datetime-local"
              value={dateTime}
              onChange={(e) => setDateTime(e.target.value)}
              className="w-full px-3.5 py-2 bg-zinc-800 border border-zinc-750 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-rose-500 scheme-dark"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-rose-400" />
              Location / Venue
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Perch Rooftop, Downtown LA"
              className="w-full px-3.5 py-2 bg-zinc-800 border border-zinc-750 rounded-xl text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-rose-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-zinc-400" />
              Notes / Dress Code (Optional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Smart casual, reservations booked for 7:30 PM!"
              className="w-full px-3.5 py-2 bg-zinc-800 border border-zinc-750 rounded-xl text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-rose-500 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="event-submit-btn"
              className="px-5 py-2 text-xs font-bold bg-gradient-to-r from-rose-500 to-pink-500 hover:opacity-95 text-white rounded-xl shadow-md transition"
            >
              Send Invitation
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
