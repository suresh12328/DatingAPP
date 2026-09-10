import React, { useState } from 'react';
import { BarChart2, Plus, Trash2, X } from 'lucide-react';

export interface PollData {
  id: string;
  question: string;
  options: { id: string; text: string; votes: string[] }[];
  allowMultiple: boolean;
  createdBy: string;
}

interface PollModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitPoll: (poll: PollData) => void;
  currentUserId: string;
}

export const PollModal: React.FC<PollModalProps> = ({
  isOpen,
  onClose,
  onSubmitPoll,
  currentUserId
}) => {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState<string[]>(['', '']);
  const [allowMultiple, setAllowMultiple] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAddOption = () => {
    if (options.length >= 6) return;
    setOptions([...options, '']);
  };

  const handleRemoveOption = (index: number) => {
    if (options.length <= 2) return;
    setOptions(options.filter((_, i) => i !== index));
  };

  const handleOptionChange = (index: number, val: string) => {
    const updated = [...options];
    updated[index] = val;
    setOptions(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanQuestion = question.trim();
    if (!cleanQuestion) {
      setError('Please enter a poll question.');
      return;
    }

    const cleanOptions = options.map((o) => o.trim()).filter(Boolean);
    if (cleanOptions.length < 2) {
      setError('Please provide at least 2 valid options.');
      return;
    }

    const pollData: PollData = {
      id: `poll-${Date.now()}`,
      question: cleanQuestion,
      options: cleanOptions.map((text, idx) => ({
        id: `opt-${idx + 1}-${Date.now()}`,
        text,
        votes: []
      })),
      allowMultiple,
      createdBy: currentUserId
    };

    onSubmitPoll(pollData);
    handleClose();
  };

  const handleClose = () => {
    setQuestion('');
    setOptions(['', '']);
    setAllowMultiple(false);
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              <BarChart2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-100">Create a Poll</h3>
              <p className="text-[11px] text-zinc-400">Ask a question with interactive vote options</p>
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
        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-800/50 text-rose-300 text-xs">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Poll Question
            </label>
            <input
              type="text"
              id="poll-question-input"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g. Where should our first date be? ☕🍹🍣"
              className="w-full px-3.5 py-2.5 bg-zinc-800 border border-zinc-750 rounded-2xl text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-zinc-300">
              Options
            </label>
            {options.map((opt, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="text"
                  value={opt}
                  onChange={(e) => handleOptionChange(idx, e.target.value)}
                  placeholder={`Option ${idx + 1} (e.g. ${
                    idx === 0 ? 'Cozy coffee shop' : idx === 1 ? 'Rooftop cocktail bar' : 'Taco truck stroll'
                  })`}
                  className="flex-1 px-3 py-2 bg-zinc-800 border border-zinc-750 rounded-xl text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                />
                {options.length > 2 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveOption(idx)}
                    className="p-2 text-zinc-500 hover:text-rose-400 hover:bg-zinc-800 rounded-xl transition"
                    title="Remove option"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}

            {options.length < 6 && (
              <button
                type="button"
                onClick={handleAddOption}
                className="w-full py-2 border border-dashed border-zinc-700 hover:border-amber-500 text-zinc-400 hover:text-amber-400 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition mt-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Option</span>
              </button>
            )}
          </div>

          {/* Multiple votes toggle */}
          <div className="flex items-center justify-between pt-2 border-t border-zinc-800/60">
            <span className="text-xs text-zinc-300">Allow multiple votes</span>
            <input
              type="checkbox"
              checked={allowMultiple}
              onChange={(e) => setAllowMultiple(e.target.checked)}
              className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 bg-zinc-800 border-zinc-700"
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
              id="poll-submit-btn"
              className="px-5 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-zinc-950 rounded-xl shadow-md transition"
            >
              Send Poll
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
