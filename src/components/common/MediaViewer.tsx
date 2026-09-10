import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Download,
  ExternalLink,
  Play,
  Pause,
  Volume2,
  VolumeX
} from 'lucide-react';

export interface MediaViewerItem {
  url: string;
  type: 'image' | 'video';
  title?: string;
  caption?: string;
  authorName?: string;
  authorAvatar?: string;
  createdAt?: string;
}

interface MediaViewerProps {
  isOpen: boolean;
  onClose: () => void;
  items: MediaViewerItem[];
  initialIndex?: number;
}

export const MediaViewer: React.FC<MediaViewerProps> = ({
  isOpen,
  onClose,
  items,
  initialIndex = 0
}) => {
  const [currentIndex, setCurrentIndex] = useState<number>(initialIndex);
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(Math.max(0, Math.min(initialIndex, items.length - 1)));
      setZoom(1);
      setPan({ x: 0, y: 0 });
    }
  }, [isOpen, initialIndex, items.length]);

  // Reset zoom & pan on index change
  useEffect(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setIsPlaying(true);
  }, [currentIndex]);

  const currentItem = items[currentIndex];

  const handlePrev = useCallback(() => {
    if (items.length <= 1) return;
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : items.length - 1));
  }, [items.length]);

  const handleNext = useCallback(() => {
    if (items.length <= 1) return;
    setCurrentIndex((prev) => (prev < items.length - 1 ? prev + 1 : 0));
  }, [items.length]);

  // Keyboard navigation & ESC
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === '+' || e.key === '=') {
        setZoom((z) => Math.min(3.5, z + 0.25));
      } else if (e.key === '-' || e.key === '_') {
        setZoom((z) => Math.max(1, z - 0.25));
      } else if (e.key === '0') {
        setZoom(1);
        setPan({ x: 0, y: 0 });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, handlePrev, handleNext]);

  // Zoom handlers
  const handleZoomIn = () => setZoom((z) => Math.min(3.5, Number((z + 0.3).toFixed(2))));
  const handleZoomOut = () => {
    setZoom((z) => {
      const next = Math.max(1, Number((z - 0.3).toFixed(2)));
      if (next === 1) setPan({ x: 0, y: 0 });
      return next;
    });
  };
  const handleResetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Drag pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom <= 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || zoom <= 1) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  // Video toggle
  const togglePlay = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  };

  if (!isOpen || !currentItem) return null;

  return (
    <div
      id="media-viewer-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md select-none transition-opacity duration-200"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* Top Header Controls */}
      <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-20 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
        {/* Left: Author / Info */}
        <div className="flex items-center gap-3">
          {currentItem.authorAvatar && (
            <img
              src={currentItem.authorAvatar}
              alt=""
              className="w-10 h-10 rounded-full object-cover border border-zinc-700"
            />
          )}
          <div className="text-left">
            {currentItem.authorName && (
              <p className="text-sm font-semibold text-white leading-tight">
                {currentItem.authorName}
              </p>
            )}
            {items.length > 1 && (
              <span className="text-xs text-zinc-400">
                {currentIndex + 1} of {items.length}
              </span>
            )}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Zoom controls (for images only) */}
          {currentItem.type === 'image' && (
            <div className="hidden sm:flex items-center gap-1 bg-zinc-900/80 border border-zinc-800 rounded-xl px-2 py-1">
              <button
                type="button"
                onClick={handleZoomIn}
                title="Zoom In (+)"
                className="p-1.5 text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-lg transition"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleZoomOut}
                disabled={zoom <= 1}
                title="Zoom Out (-)"
                className="p-1.5 text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-lg transition disabled:opacity-30"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              {zoom > 1 && (
                <button
                  type="button"
                  onClick={handleResetZoom}
                  title="Reset Zoom"
                  className="p-1.5 text-pink-400 hover:text-pink-300 hover:bg-zinc-800 rounded-lg transition"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}
              <span className="text-xs text-zinc-400 px-1 font-mono">
                {Math.round(zoom * 100)}%
              </span>
            </div>
          )}

          {/* Open in new tab */}
          <a
            href={currentItem.url}
            target="_blank"
            rel="noopener noreferrer"
            title="Open Original"
            className="p-2 text-zinc-300 hover:text-white hover:bg-zinc-800/80 rounded-xl transition"
          >
            <ExternalLink className="w-5 h-5" />
          </a>

          {/* Download link */}
          <a
            href={currentItem.url}
            download
            title="Download Media"
            className="p-2 text-zinc-300 hover:text-white hover:bg-zinc-800/80 rounded-xl transition"
          >
            <Download className="w-5 h-5" />
          </a>

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            title="Close (ESC)"
            className="p-2 text-zinc-300 hover:text-white hover:bg-pink-600/30 rounded-xl transition border border-transparent hover:border-pink-500/50"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Prev / Next Chevrons */}
      {items.length > 1 && (
        <>
          <button
            type="button"
            onClick={handlePrev}
            aria-label="Previous Media"
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-zinc-900/70 hover:bg-zinc-800 text-zinc-200 hover:text-white border border-zinc-700/60 shadow-lg backdrop-blur-xs transition"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <button
            type="button"
            onClick={handleNext}
            aria-label="Next Media"
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-zinc-900/70 hover:bg-zinc-800 text-zinc-200 hover:text-white border border-zinc-700/60 shadow-lg backdrop-blur-xs transition"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      {/* Main Media Content Area */}
      <div
        className="w-full h-full flex items-center justify-center p-4 sm:p-12 overflow-hidden"
        onMouseDown={handleMouseDown}
        style={{ cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
      >
        {currentItem.type === 'video' ? (
          <div className="relative max-w-5xl max-h-[85vh] flex items-center justify-center">
            <video
              ref={videoRef}
              src={currentItem.url}
              controls
              autoPlay
              playsInline
              className="max-w-full max-h-[85vh] rounded-xl object-contain shadow-2xl bg-black"
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            />
          </div>
        ) : (
          <div
            className="transition-transform duration-75 ease-out max-w-full max-h-full flex items-center justify-center"
            style={{
              transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`
            }}
          >
            <img
              src={currentItem.url}
              alt={currentItem.title || 'Media preview'}
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl pointer-events-auto"
              draggable={false}
              onDoubleClick={() => {
                if (zoom === 1) {
                  setZoom(2);
                } else {
                  handleResetZoom();
                }
              }}
            />
          </div>
        )}
      </div>

      {/* Bottom Caption Bar */}
      {(currentItem.caption || currentItem.title) && (
        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 bg-gradient-to-t from-black/90 via-black/60 to-transparent z-20 pointer-events-none">
          <div className="max-w-3xl mx-auto text-center pointer-events-auto">
            {currentItem.title && (
              <h4 className="text-base font-semibold text-white mb-1">
                {currentItem.title}
              </h4>
            )}
            {currentItem.caption && (
              <p className="text-sm text-zinc-300 leading-relaxed">
                {currentItem.caption}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
