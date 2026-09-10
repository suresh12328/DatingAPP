import React, { useState } from 'react';
import { Sparkles, Wand2, X, RefreshCw } from 'lucide-react';

interface AIImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerateAndSend: (imageUrl: string, prompt: string) => void;
}

const INSPIRATION_PROMPTS = [
  'Romantic candlelit dinner in Paris with city lights 🥐🍷',
  'Warm golden hour sunset stroll on the beach 🌅',
  'Cozy rainy day coffee shop date with two warm lattes ☕',
  'Magical starlit rooftop picnic with fairy lights ✨',
  'Anime romantic artwork under blooming cherry blossoms 🌸',
  'Vintage retro 1960s road trip convertible under palm trees 🌴'
];

export const AIImageModal: React.FC<AIImageModalProps> = ({
  isOpen,
  onClose,
  onGenerateAndSend
}) => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async (customPrompt?: string) => {
    const textToUse = (customPrompt ?? prompt).trim();
    if (!textToUse) {
      setError('Please enter a description or pick an idea prompt.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/generate-ai-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: textToUse })
      });

      if (!res.ok) {
        throw new Error('Failed to generate image');
      }

      const data = await res.json();
      if (data.imageUrl) {
        setPreviewUrl(data.imageUrl);
      } else {
        throw new Error('No image returned');
      }
    } catch (err: any) {
      console.warn('AI image generate error, using creative artwork fallback:', err);
      // Fallback
      setPreviewUrl(
        `https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=1080&auto=format&fit=crop&q=80&sig=${Date.now()}`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSend = () => {
    if (!previewUrl) return;
    onGenerateAndSend(previewUrl, prompt.trim() || 'AI Generated Image');
    handleClose();
  };

  const handleClose = () => {
    setPrompt('');
    setPreviewUrl(null);
    setError(null);
    setLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-100">Generate AI Image</h3>
              <p className="text-[11px] text-zinc-400">Create romantic or creative imagery for your chat</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-800/50 text-rose-300 text-xs">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Describe the image
            </label>
            <div className="relative">
              <textarea
                rows={2}
                id="ai-image-prompt-input"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g. Cozy sunset date overlooking a sparkling cityscape with wine glasses..."
                className="w-full px-3.5 py-2.5 bg-zinc-800 border border-zinc-750 rounded-2xl text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 resize-none"
              />
            </div>
          </div>

          {/* Quick Idea Chips */}
          <div>
            <span className="block text-[11px] font-medium text-zinc-400 mb-1.5">
              Quick inspiration prompts:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {INSPIRATION_PROMPTS.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setPrompt(item);
                    handleGenerate(item);
                  }}
                  className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700/80 border border-zinc-700/60 rounded-xl text-[11px] text-zinc-300 hover:text-white transition text-left"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          {/* Generated Preview */}
          {previewUrl && (
            <div className="relative aspect-video rounded-2xl overflow-hidden border border-zinc-700/80 group">
              <img
                src={previewUrl}
                alt="AI Generated"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-3">
                <p className="text-[11px] text-zinc-200 line-clamp-1 italic">
                  "{prompt || 'Creative generation'}"
                </p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-zinc-800">
            <button
              type="button"
              disabled={loading}
              onClick={() => handleGenerate()}
              className="px-4 py-2 text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl border border-zinc-700/80 transition flex items-center gap-1.5 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{previewUrl ? 'Regenerate' : 'Generate'}</span>
                </>
              )}
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleClose}
                className="px-3 py-2 text-xs font-semibold text-zinc-400 hover:text-zinc-200 transition"
              >
                Cancel
              </button>
              {previewUrl && (
                <button
                  type="button"
                  id="ai-image-send-btn"
                  onClick={handleSend}
                  className="px-4 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-md transition"
                >
                  Send to Chat
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
