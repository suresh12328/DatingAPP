import React, { useState } from 'react';
import { X, Sliders, Check } from 'lucide-react';
import { DatingPreferences } from '../../types';

interface DatingFiltersModalProps {
  initialFilters: DatingPreferences;
  onApply: (filters: DatingPreferences) => void;
  onClose: () => void;
}

export const DatingFiltersModal: React.FC<DatingFiltersModalProps> = ({
  initialFilters,
  onApply,
  onClose
}) => {
  const [interestedIn, setInterestedIn] = useState<'WOMEN' | 'MEN' | 'EVERYONE'>(
    initialFilters.interested_in
  );
  const [minAge, setMinAge] = useState(initialFilters.age_range.min);
  const [maxAge, setMaxAge] = useState(initialFilters.age_range.max);
  const [maxDistance, setMaxDistance] = useState(initialFilters.max_distance_miles);
  const [onlyVerified, setOnlyVerified] = useState(initialFilters.only_verified);

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    onApply({
      interested_in: interestedIn,
      age_range: { min: minAge, max: maxAge },
      max_distance_miles: maxDistance,
      only_verified: onlyVerified
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-zinc-900 rounded-3xl p-6 w-full max-w-md shadow-2xl border border-zinc-800 relative animate-in fade-in zoom-in-95 text-zinc-100">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-zinc-100 rounded-full hover:bg-zinc-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 mb-6">
          <div className="p-2.5 bg-pink-500/15 border border-pink-500/30 text-pink-400 rounded-2xl">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-zinc-100 font-heading">
              Dating Preferences
            </h3>
            <p className="text-xs text-zinc-400">
              Customize who you see in your discover deck
            </p>
          </div>
        </div>

        <form onSubmit={handleApply} className="space-y-5">
          {/* Interested in */}
          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
              Interested in
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { key: 'WOMEN', label: 'Women' },
                { key: 'MEN', label: 'Men' },
                { key: 'EVERYONE', label: 'Everyone' }
              ].map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setInterestedIn(opt.key as any)}
                  className={`py-2.5 px-3 rounded-2xl text-xs font-bold transition ${
                    interestedIn === opt.key
                      ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-xs'
                      : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-750 border border-zinc-700/60'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Age Range Slider */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                Age Range
              </label>
              <span className="text-xs font-semibold text-pink-400">
                {minAge} – {maxAge} years old
              </span>
            </div>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min={18}
                max={60}
                value={minAge}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  if (val <= maxAge) setMinAge(val);
                }}
                className="w-full accent-pink-500 bg-zinc-800"
              />
              <input
                type="range"
                min={18}
                max={70}
                value={maxAge}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  if (val >= minAge) setMaxAge(val);
                }}
                className="w-full accent-pink-500 bg-zinc-800"
              />
            </div>
            <div className="flex justify-between text-[10px] text-zinc-500 mt-1">
              <span>18 yo (Strict 18+ policy)</span>
              <span>70+ yo</span>
            </div>
          </div>

          {/* Maximum Distance */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                Maximum Distance
              </label>
              <span className="text-xs font-semibold text-pink-400">
                {maxDistance} miles
              </span>
            </div>
            <input
              type="range"
              min={5}
              max={150}
              step={5}
              value={maxDistance}
              onChange={(e) => setMaxDistance(Number(e.target.value))}
              className="w-full accent-pink-500 bg-zinc-800"
            />
          </div>

          {/* Only Verified */}
          <div className="flex items-center justify-between p-3.5 bg-zinc-800/80 rounded-2xl border border-zinc-750">
            <div>
              <div className="text-xs font-bold text-zinc-200">
                Only Verified Profiles
              </div>
              <div className="text-[11px] text-zinc-400">
                Show only photo-verified members
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={onlyVerified}
                onChange={(e) => setOnlyVerified(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-600"></div>
            </label>
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-zinc-300 hover:bg-zinc-800 transition"
            >
              Cancel
            </button>
            <button
              id="apply-dating-filters-btn"
              type="submit"
              className="px-6 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md shadow-pink-500/20 hover:opacity-95 transition"
            >
              Apply Filters
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
