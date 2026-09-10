import React, { useState } from 'react';
import { User, Search, X, Check } from 'lucide-react';
import { Profile } from '../../types';
import { Avatar } from '../common/Avatar';

interface ContactPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  contacts: Profile[];
  onSelectContact: (contact: Profile) => void;
}

export const ContactPickerModal: React.FC<ContactPickerModalProps> = ({
  isOpen,
  onClose,
  contacts,
  onSelectContact
}) => {
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  const filtered = contacts.filter(
    (c) =>
      c.full_name.toLowerCase().includes(search.toLowerCase()) ||
      c.username.toLowerCase().includes(search.toLowerCase()) ||
      c.location?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-sky-500/20 text-sky-400">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-100">Share Contact</h3>
              <p className="text-[11px] text-zinc-400">Select a connection to share with this chat</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-zinc-800 bg-zinc-950/40">
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search contacts by name or username..."
              className="w-full pl-9 pr-3 py-2 bg-zinc-800 border border-zinc-700/60 rounded-xl text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-sky-500"
            />
          </div>
        </div>

        {/* Contacts List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1 divide-y divide-zinc-800/40">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-xs text-zinc-400">
              No contacts found matching "{search}"
            </div>
          ) : (
            filtered.map((c) => (
              <div
                key={c.id}
                id={`contact-item-${c.id}`}
                onClick={() => {
                  onSelectContact(c);
                  onClose();
                }}
                className="flex items-center justify-between p-3 rounded-2xl hover:bg-zinc-800/70 transition cursor-pointer group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar src={c.avatar_url} name={c.full_name} size="md" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-xs font-bold text-zinc-100 group-hover:text-sky-400 transition truncate">
                        {c.full_name}
                      </h4>
                      <span className="text-[10px] text-zinc-500">· {c.age}</span>
                    </div>
                    <p className="text-[11px] text-zinc-400 truncate">@{c.username}</p>
                    {c.location && (
                      <p className="text-[10px] text-zinc-500 truncate">{c.location}</p>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  className="px-3 py-1.5 rounded-xl bg-sky-500/10 hover:bg-sky-500 text-sky-400 hover:text-white text-xs font-semibold transition"
                >
                  Share
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
