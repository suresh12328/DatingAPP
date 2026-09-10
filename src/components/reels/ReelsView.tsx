import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Film,
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  Volume2,
  VolumeX,
  Play,
  Music,
  Plus,
  X,
  UploadCloud,
  Video,
  Trash2,
  RefreshCw,
  AlertCircle,
  Loader2,
  Send,
  Sparkles,
  ArrowUp,
  Check,
  MoreVertical,
  Flag
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { Avatar } from '../common/Avatar';
import { Reel } from '../../types';
import { api } from '../../lib/api';
import { uploadMediaFile, validateMediaFile } from '../../lib/uploadService';
import { ConfirmDeleteModal } from '../common/ConfirmDeleteModal';

interface HeartAnimation {
  id: number;
  x: number;
  y: number;
}

interface CommentItem {
  id: string;
  user_id: string;
  author: {
    id: string;
    full_name: string;
    username: string;
    avatar_url: string;
    is_verified?: boolean;
  };
  content: string;
  created_at: string;
  likes_count: number;
}

const SOUND_PREF_KEY = 'loveconnect_reels_muted';

export const ReelsView: React.FC = () => {
  const { currentUser } = useAuth();
  const { reels, likeReel, saveReel, shareReel, commentReel, createReel, deleteReel, openReportModal, navigate } = useApp();

  // Feed & Pagination state
  const [reelsList, setReelsList] = useState<Reel[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingFeed, setIsLoadingFeed] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [activeReelId, setActiveReelId] = useState<string | null>(null);

  // Reel Delete state
  const [reelToDelete, setReelToDelete] = useState<Reel | null>(null);
  const [isDeletingReel, setIsDeletingReel] = useState(false);

  // Global Audio preference with persistence
  const [isMuted, setIsMuted] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(SOUND_PREF_KEY);
      if (saved !== null) {
        return saved === 'true';
      }
    } catch {}
    return true; // Start muted initially to comply with browser autoplay policies
  });

  const handleToggleMute = useCallback((forceVal?: boolean) => {
    setIsMuted(prev => {
      const nextVal = forceVal !== undefined ? forceVal : !prev;
      try {
        localStorage.setItem(SOUND_PREF_KEY, String(nextVal));
      } catch {}
      return nextVal;
    });
  }, []);

  // Toast notifications
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Comment Drawer state
  const [activeCommentReel, setActiveCommentReel] = useState<Reel | null>(null);
  const [commentsList, setCommentsList] = useState<CommentItem[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // Upload Reel Modal state
  const [isCreatingReel, setIsCreatingReel] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [reelCaption, setReelCaption] = useState('');
  const [reelMusic, setReelMusic] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatusText, setUploadStatusText] = useState('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Scroll Container Ref
  const containerRef = useRef<HTMLDivElement>(null);
  const PAGE_LIMIT = 4;

  // Show temporary toast
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  }, []);

  // Delete Reel Handler
  const handleConfirmDeleteReel = async () => {
    if (!reelToDelete) return;
    setIsDeletingReel(true);
    try {
      await deleteReel(reelToDelete.id);
      // Remove immediately from UI
      setReelsList(prev => prev.filter(r => r.id !== reelToDelete.id));
      showToast('Video deleted globally across all devices');
      setReelToDelete(null);
    } catch (err: any) {
      console.error('Failed to delete reel:', err);
      showToast(err.message || 'Failed to delete video. Please try again.');
    } finally {
      setIsDeletingReel(false);
    }
  };

  // Synchronize reels feed with global AppContext state (e.g. when deleted from another phone/device)
  useEffect(() => {
    if (reels && reels.length >= 0) {
      const activeIds = new Set(reels.map(r => r.id));
      setReelsList(prev => {
        const filtered = prev.filter(r => activeIds.has(r.id));
        if (filtered.length !== prev.length) {
          return filtered;
        }
        return prev;
      });
    }
  }, [reels]);

  // If the active playing reel was deleted on another device, shift focus smoothly to the first available reel
  useEffect(() => {
    if (activeReelId && reelsList.length > 0 && !reelsList.some(r => r.id === activeReelId)) {
      setActiveReelId(reelsList[0].id);
    }
  }, [reelsList, activeReelId]);

  // Initial load of reels (Page 1)
  useEffect(() => {
    let isMounted = true;
    const fetchInitialReels = async () => {
      setIsLoadingFeed(true);
      try {
        const data = await api.getPaginatedReels(1, PAGE_LIMIT);
        if (isMounted) {
          const loaded = data.reels || [];
          setReelsList(loaded);
          setHasMore(data.pagination ? data.pagination.hasMore : false);
          setCurrentPage(1);
          if (loaded.length > 0) {
            setActiveReelId(loaded[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to load reels feed:', err);
        // Fallback to all reels
        try {
          const fallback = await api.getReels();
          if (isMounted && fallback.length > 0) {
            setReelsList(fallback);
            setActiveReelId(fallback[0].id);
            setHasMore(false);
          }
        } catch (e) {
          console.error('Fallback error:', e);
        }
      } finally {
        if (isMounted) setIsLoadingFeed(false);
      }
    };

    fetchInitialReels();
    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch more reels when scrolling near bottom
  const loadMoreReels = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    const nextPage = currentPage + 1;

    try {
      const data = await api.getPaginatedReels(nextPage, PAGE_LIMIT);
      if (data.reels && data.reels.length > 0) {
        setReelsList(prev => {
          const existingIds = new Set(prev.map(r => r.id));
          const newItems = data.reels.filter(r => !existingIds.has(r.id));
          return [...prev, ...newItems];
        });
        setCurrentPage(nextPage);
        setHasMore(data.pagination ? data.pagination.hasMore : false);
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error('Failed to load more reels:', err);
      setHasMore(false);
    } finally {
      setIsLoadingMore(false);
    }
  }, [currentPage, hasMore, isLoadingMore]);

  // Clean up object URL on unmount or file change
  useEffect(() => {
    return () => {
      if (videoPreviewUrl) {
        URL.revokeObjectURL(videoPreviewUrl);
      }
    };
  }, [videoPreviewUrl]);

  // Keyboard navigation for desktop: ArrowDown / ArrowUp / Space
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (isCreatingReel || activeCommentReel) return;
    if (e.key === 'ArrowDown' || e.key === 'PageDown') {
      e.preventDefault();
      if (containerRef.current) {
        containerRef.current.scrollBy({ top: containerRef.current.clientHeight, behavior: 'smooth' });
      }
    } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
      e.preventDefault();
      if (containerRef.current) {
        containerRef.current.scrollBy({ top: -containerRef.current.clientHeight, behavior: 'smooth' });
      }
    } else if (e.key === 'm' || e.key === 'M') {
      handleToggleMute();
    }
  };

  // Guarantee only ONE reel can play audio and video at any time
  useEffect(() => {
    if (!containerRef.current || !activeReelId) return;
    const allVideos = containerRef.current.querySelectorAll('video');
    allVideos.forEach(vid => {
      const slide = vid.closest('[data-reel-id]');
      const id = slide?.getAttribute('data-reel-id');
      if (id !== activeReelId) {
        vid.pause();
        vid.muted = true;
      }
    });
  }, [activeReelId]);

  // Like handler
  const handleLikeReel = async (reel: Reel) => {
    setReelsList(prev =>
      prev.map(r =>
        r.id === reel.id
          ? {
              ...r,
              liked_by_me: !r.liked_by_me,
              likes_count: !r.liked_by_me ? r.likes_count + 1 : Math.max(0, r.likes_count - 1)
            }
          : r
      )
    );
    try {
      await likeReel(reel.id);
    } catch (err) {
      console.error('Like error:', err);
    }
  };

  // Save / Bookmark handler
  const handleSaveReel = async (reel: Reel) => {
    const nextSaved = !reel.saved_by_me;
    setReelsList(prev =>
      prev.map(r => (r.id === reel.id ? { ...r, saved_by_me: nextSaved } : r))
    );
    showToast(nextSaved ? 'Reel saved to your bookmarks!' : 'Reel removed from bookmarks');
    try {
      await saveReel(reel.id);
    } catch (err) {
      console.error('Save error:', err);
    }
  };

  // Share handler
  const handleShareReel = async (reel: Reel) => {
    const shareUrl = window.location.href;
    setReelsList(prev =>
      prev.map(r => (r.id === reel.id ? { ...r, shares_count: (r.shares_count || 0) + 1 } : r))
    );

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${reel.author.full_name}'s Reel on LoveConnect`,
          text: reel.caption,
          url: shareUrl
        });
        showToast('Shared successfully!');
      } catch {
        // User cancelled or fallback
        await navigator.clipboard.writeText(shareUrl);
        showToast('Link copied to clipboard!');
      }
    } else {
      await navigator.clipboard.writeText(shareUrl);
      showToast('Link copied to clipboard!');
    }

    try {
      await shareReel(reel.id);
    } catch (err) {
      console.error('Share error:', err);
    }
  };

  // Open comments drawer
  const handleOpenComments = async (reel: Reel) => {
    setActiveCommentReel(reel);
    setIsLoadingComments(true);
    try {
      const data = await api.getReelComments(reel.id);
      setCommentsList(data || []);
    } catch (err) {
      console.error('Failed to load comments:', err);
      setCommentsList([]);
    } finally {
      setIsLoadingComments(false);
    }
  };

  // Submit comment
  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCommentReel || !commentText.trim() || isSubmittingComment) return;

    const text = commentText.trim();
    setCommentText('');
    setIsSubmittingComment(true);

    try {
      const newComment = await commentReel(activeCommentReel.id, text);
      if (newComment) {
        setCommentsList(prev => [newComment, ...prev]);
        setReelsList(prev =>
          prev.map(r =>
            r.id === activeCommentReel.id
              ? { ...r, comments_count: (r.comments_count || 0) + 1 }
              : r
          )
        );
      }
    } catch (err) {
      console.error('Comment error:', err);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // Scroll to top
  const handleScrollToTop = () => {
    if (containerRef.current) {
      containerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // File selection for upload
  const handleSelectFile = (file: File) => {
    setUploadError(null);
    const validation = validateMediaFile(file, ['video']);
    if (!validation.valid) {
      setUploadError(validation.error || 'Please select a valid video file (MP4, WebM, or MOV).');
      return;
    }

    if (videoPreviewUrl) {
      URL.revokeObjectURL(videoPreviewUrl);
    }

    const preview = URL.createObjectURL(file);
    setSelectedFile(file);
    setVideoPreviewUrl(preview);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleSelectFile(file);
    e.target.value = '';
  };

  const handleRemoveVideo = () => {
    if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
    setSelectedFile(null);
    setVideoPreviewUrl(null);
    setUploadError(null);
  };

  const handleCloseModal = () => {
    if (isUploading) return;
    handleRemoveVideo();
    setReelCaption('');
    setReelMusic('');
    setUploadProgress(0);
    setUploadStatusText('');
    setUploadError(null);
    setIsCreatingReel(false);
  };

  const handlePublishReel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setUploadError('Please select a video file.');
      return;
    }
    if (!reelCaption.trim()) {
      setUploadError('Please enter a caption.');
      return;
    }

    try {
      setIsUploading(true);
      setUploadError(null);
      setUploadProgress(15);
      setUploadStatusText('Preparing video...');

      const userId = currentUser?.id || 'user-suresh';
      const uploadResult = await uploadMediaFile(selectedFile, 'reels', userId, {
        onProgress: (percent, stage) => {
          setUploadProgress(percent);
          if (stage === 'preparing') setUploadStatusText('Preparing video for upload...');
          else if (stage === 'uploading') setUploadStatusText(`Uploading video (${percent}%)...`);
          else if (stage === 'processing') setUploadStatusText('Processing reel...');
        }
      });

      setUploadStatusText('Publishing reel...');
      const created = await api.createReel(
        userId,
        uploadResult.url,
        reelCaption.trim(),
        reelMusic.trim() || undefined
      );

      // Prepend the new reel to the feed
      if (created) {
        setReelsList(prev => [created, ...prev]);
        setActiveReelId(created.id);
        showToast('Your Reel is now live! 🎉');
      }

      handleCloseModal();
      // Scroll to the very top to play the newly uploaded reel
      setTimeout(() => {
        handleScrollToTop();
      }, 200);
    } catch (err: any) {
      console.error('Upload error:', err);
      setUploadError(err.message || 'Failed to upload reel. Please try again.');
      setIsUploading(false);
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          id="reels-toast"
          className="fixed top-20 z-50 px-4 py-2 rounded-full bg-zinc-900/90 text-white border border-pink-500/30 text-xs font-semibold backdrop-blur-md shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-200"
        >
          <Sparkles className="w-3.5 h-3.5 text-pink-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Floating Top Controls Header (Desktop & Mobile) */}
      <div className="w-full max-w-[430px] sm:max-w-[440px] mb-2 px-1 flex items-center justify-between text-zinc-100">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400 shadow-sm">
            <Film className="w-3.5 h-3.5" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight font-heading flex items-center gap-1.5">
              <span>Reels</span>
              <span className="w-2 h-2 rounded-full bg-pink-500 animate-pulse" />
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Global Mute / Unmute Button */}
          <button
            id="global-mute-toggle-btn"
            onClick={() => handleToggleMute()}
            title={isMuted ? 'Unmute original audio (M)' : 'Mute original audio (M)'}
            className={`px-3 py-1.5 rounded-full border transition flex items-center gap-1.5 text-xs font-semibold backdrop-blur-md ${
              isMuted
                ? 'bg-zinc-900/90 border-zinc-700/80 text-zinc-300 hover:text-white hover:border-pink-500/50'
                : 'bg-pink-500/20 border-pink-500/40 text-pink-300 shadow-md shadow-pink-500/20'
            }`}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 text-zinc-400" /> : <Volume2 className="w-3.5 h-3.5 text-pink-400 animate-pulse" />}
            <span className="text-[11px]">{isMuted ? '🔇 Unmute' : '🔊 Sound On'}</span>
          </button>

          {/* Upload Reel Button */}
          <button
            id="upload-reel-header-btn"
            onClick={() => setIsCreatingReel(true)}
            className="px-3 py-1.5 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white text-xs font-bold shadow-md shadow-pink-500/20 hover:opacity-95 active:scale-95 transition flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Upload Reel</span>
          </button>
        </div>
      </div>

      {/* Main TikTok Vertical Snap Scroll Container */}
      <div
        id="tiktok-reels-container"
        ref={containerRef}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        className="relative w-full max-w-[430px] sm:max-w-[440px] h-[calc(100dvh-7.5rem)] md:h-[calc(100vh-8rem)] max-h-[820px] bg-black sm:rounded-3xl rounded-2xl overflow-y-scroll snap-y snap-mandatory no-scrollbar border border-zinc-800/80 shadow-2xl focus:outline-none select-none"
        style={{ scrollSnapType: 'y mandatory', WebkitOverflowScrolling: 'touch' }}
      >
        {/* Loading Spinner on initial load */}
        {isLoadingFeed ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-zinc-400 space-y-3 bg-zinc-950">
            <Loader2 className="w-8 h-8 text-pink-500 animate-spin" />
            <p className="text-xs font-medium text-zinc-300">Loading reels...</p>
          </div>
        ) : reelsList.length === 0 ? (
          /* Empty State when no reels in DB */
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-zinc-400 space-y-4 bg-zinc-950">
            <div className="w-16 h-16 rounded-3xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400">
              <Film className="w-8 h-8" />
            </div>
            <div>
              <h3 id="no-reels-heading" className="text-base font-bold text-zinc-100 mb-1 font-heading">No Reels yet</h3>
              <p className="text-xs text-zinc-400 max-w-xs">
                Be the first to share a video reel and show your energy!
              </p>
            </div>
            <button
              id="upload-reel-empty-btn"
              onClick={() => setIsCreatingReel(true)}
              className="px-5 py-2.5 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 text-white text-xs font-bold shadow-lg shadow-pink-500/20 hover:opacity-95 active:scale-95 transition flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Upload Reel</span>
            </button>
          </div>
        ) : (
          /* List of vertical snap reels */
          reelsList.map((reel, index) => (
            <SingleReelItem
              key={reel.id}
              reel={reel}
              index={index}
              totalCount={reelsList.length}
              isActive={activeReelId === reel.id}
              isMuted={isMuted}
              isMyReel={reel.user_id === currentUser.id}
              onDeleteClick={() => setReelToDelete(reel)}
              onReportClick={() => openReportModal('REEL', reel.id, reel.caption)}
              onToggleMute={handleToggleMute}
              onInView={() => {
                setActiveReelId(reel.id);
                // Trigger infinite load if near end
                if (index >= reelsList.length - 2 && hasMore && !isLoadingMore) {
                  loadMoreReels();
                }
              }}
              onLike={() => handleLikeReel(reel)}
              onSave={() => handleSaveReel(reel)}
              onShare={() => handleShareReel(reel)}
              onOpenComments={() => handleOpenComments(reel)}
              onAuthorClick={() => navigate('profile', { username: reel.author.username })}
            />
          ))
        )}

        {/* Loading indicator when fetching more reels while scrolling */}
        {isLoadingMore && (
          <div className="snap-start snap-always w-full h-24 shrink-0 flex items-center justify-center gap-2 bg-zinc-950/80 text-zinc-400 text-xs border-t border-zinc-800">
            <Loader2 className="w-4 h-4 text-pink-500 animate-spin" />
            <span>Loading more reels...</span>
          </div>
        )}

        {/* End of Feed Screen (when all reels loaded) */}
        {!hasMore && reelsList.length > 0 && !isLoadingFeed && (
          <div
            id="end-of-reels-slide"
            className="snap-start snap-always w-full h-full min-h-full shrink-0 relative flex flex-col items-center justify-center p-6 text-center bg-gradient-to-b from-zinc-950 via-black to-zinc-950 text-zinc-300 border-t border-zinc-800/80 select-none"
            style={{ scrollSnapAlign: 'start', scrollSnapStop: 'always' }}
          >
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-pink-500/20 to-rose-500/20 border border-pink-500/30 flex items-center justify-center text-pink-400 mb-4 shadow-lg shadow-pink-500/10">
              <Check className="w-8 h-8 text-pink-400" />
            </div>

            <h3 className="text-lg font-bold text-zinc-100 font-heading mb-1">
              You're All Caught Up! 🎉
            </h3>
            <p className="text-xs text-zinc-400 max-w-[260px] leading-relaxed mb-6">
              You've watched all available reels in the feed. Upload your own reel or check back soon for new vibes!
            </p>

            <div className="flex flex-col gap-2.5 w-full max-w-[220px]">
              <button
                id="end-slide-upload-btn"
                onClick={() => setIsCreatingReel(true)}
                className="w-full py-2.5 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 active:scale-95 text-white text-xs font-bold shadow-lg shadow-pink-500/25 transition flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Upload a Reel</span>
              </button>
              <button
                id="end-slide-back-to-top-btn"
                onClick={handleScrollToTop}
                className="w-full py-2.5 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs font-semibold border border-zinc-700/80 transition flex items-center justify-center gap-1.5"
              >
                <ArrowUp className="w-3.5 h-3.5" />
                <span>Back to Top</span>
              </button>
            </div>
          </div>
        )}

        {/* Slide-Up Comments Bottom Sheet (TikTok Style) */}
        {activeCommentReel && (
          <div className="absolute inset-0 z-40 bg-black/60 backdrop-blur-xs flex flex-col justify-end animate-in fade-in duration-200">
            {/* Backdrop click to dismiss */}
            <div
              className="flex-1 w-full"
              onClick={() => setActiveCommentReel(null)}
            />

            <div
              id="tiktok-comment-drawer"
              className="w-full max-h-[68%] bg-zinc-900 border-t border-zinc-700/80 rounded-t-3xl flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-200 text-zinc-100"
            >
              {/* Comments Header */}
              <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-zinc-200 uppercase tracking-wider">
                    Comments ({activeCommentReel.comments_count || commentsList.length})
                  </span>
                </div>
                <button
                  id="close-comment-drawer-btn"
                  onClick={() => setActiveCommentReel(null)}
                  className="p-1 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Comments List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
                {isLoadingComments ? (
                  <div className="py-8 flex flex-col items-center justify-center text-zinc-400 gap-2">
                    <Loader2 className="w-5 h-5 text-pink-500 animate-spin" />
                    <span>Loading comments...</span>
                  </div>
                ) : commentsList.length === 0 ? (
                  <div className="py-8 text-center text-zinc-400">
                    <p className="font-semibold text-zinc-300">No comments yet</p>
                    <p className="text-[11px] text-zinc-500 mt-0.5">Be the first to say something!</p>
                  </div>
                ) : (
                  commentsList.map(comment => (
                    <div key={comment.id} className="flex items-start gap-2.5 group">
                      <Avatar
                        src={comment.author?.avatar_url}
                        name={comment.author?.full_name || 'User'}
                        size="sm"
                        isVerified={comment.author?.is_verified}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="font-bold text-zinc-200 text-xs">
                            {comment.author?.full_name || 'User'}
                          </span>
                          <span className="text-[10px] text-zinc-500">
                            {formatTimeAgo(comment.created_at)}
                          </span>
                        </div>
                        <p className="text-zinc-300 text-xs leading-relaxed break-words">
                          {comment.content}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Add Comment Input */}
              <form
                onSubmit={handleSubmitComment}
                className="p-3 border-t border-zinc-800 bg-zinc-950/90 flex items-center gap-2"
              >
                <Avatar
                  src={currentUser?.avatar_url}
                  name={currentUser?.full_name || 'Me'}
                  size="sm"
                />
                <input
                  id="reel-comment-input"
                  type="text"
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  placeholder="Add a comment..."
                  disabled={isSubmittingComment}
                  className="flex-1 bg-zinc-800 text-xs text-zinc-100 placeholder-zinc-500 px-3 py-2 rounded-full border border-zinc-700 focus:outline-none focus:border-pink-500 transition"
                />
                <button
                  id="submit-reel-comment-btn"
                  type="submit"
                  disabled={!commentText.trim() || isSubmittingComment}
                  className="p-2 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 text-white disabled:opacity-30 disabled:pointer-events-none hover:opacity-90 active:scale-95 transition"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Upload Reel Modal (Laptop and Mobile File Picker) */}
      {isCreatingReel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
          <div
            id="upload-reel-modal"
            className="bg-zinc-900 rounded-3xl p-5 sm:p-6 w-full max-w-md my-auto shadow-2xl border border-zinc-800 text-zinc-100 flex flex-col max-h-[92vh]"
          >
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-zinc-800/80">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400">
                  <Video className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-100">Upload Video Reel</h3>
                  <p className="text-[11px] text-zinc-400">Select video from your laptop or mobile</p>
                </div>
              </div>
              <button
                type="button"
                id="close-upload-modal-btn"
                onClick={handleCloseModal}
                disabled={isUploading}
                className="p-1 rounded-full text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 disabled:opacity-50 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePublishReel} className="overflow-y-auto pr-1 space-y-4">
              {/* Select Video / Preview */}
              {!videoPreviewUrl ? (
                <div>
                  <input
                    id="reel-file-input"
                    ref={fileInputRef}
                    type="file"
                    accept="video/mp4,video/webm,video/quicktime,video/mov,video/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div
                    id="reel-drag-drop-zone"
                    onDragOver={e => {
                      e.preventDefault();
                      setIsDragOver(true);
                    }}
                    onDragLeave={() => setIsDragOver(false)}
                    onDrop={e => {
                      e.preventDefault();
                      setIsDragOver(false);
                      const file = e.dataTransfer.files?.[0];
                      if (file) handleSelectFile(file);
                    }}
                    onClick={() => fileInputRef.current?.click()}
                    className={`cursor-pointer rounded-2xl border-2 border-dashed p-6 flex flex-col items-center justify-center text-center transition-all ${
                      isDragOver
                        ? 'border-pink-500 bg-pink-500/10 scale-[0.99]'
                        : 'border-zinc-700 bg-zinc-850 hover:border-pink-500/50 hover:bg-zinc-800'
                    }`}
                  >
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-pink-500/20 to-rose-500/20 border border-pink-500/30 flex items-center justify-center text-pink-400 mb-3">
                      <UploadCloud className="w-6 h-6" />
                    </div>
                    <span className="text-sm font-semibold text-zinc-100 mb-1">
                      Select Video
                    </span>
                    <span className="text-xs text-zinc-400 max-w-[240px]">
                      Tap to browse or drop video file from your laptop or mobile
                    </span>
                    <div className="mt-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-800 border border-zinc-700 text-[10px] text-zinc-400 font-medium">
                      <span>MP4, WebM, MOV</span>
                      <span>•</span>
                      <span>Up to 60MB</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="relative rounded-2xl overflow-hidden bg-black border border-zinc-800 flex items-center justify-center max-h-72 aspect-[9/14] sm:aspect-[9/16] mx-auto shadow-inner">
                    <video
                      src={videoPreviewUrl}
                      controls
                      playsInline
                      className="w-full h-full max-h-72 object-contain"
                    />
                    <div className="absolute top-2 right-2 flex items-center gap-1.5 z-10">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        title="Change Video"
                        className="px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-sm border border-white/10 text-zinc-200 hover:text-white text-xs font-medium flex items-center gap-1 hover:bg-black/90 transition"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Change</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleRemoveVideo}
                        disabled={isUploading}
                        title="Remove Video"
                        className="p-1.5 rounded-full bg-black/70 backdrop-blur-sm border border-white/10 text-rose-400 hover:text-rose-300 hover:bg-black/90 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/mp4,video/webm,video/quicktime,video/mov,video/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  {selectedFile && (
                    <div className="flex items-center justify-between text-[11px] text-zinc-400 px-1">
                      <span className="truncate max-w-[220px]">{selectedFile.name}</span>
                      <span>{(selectedFile.size / (1024 * 1024)).toFixed(1)} MB</span>
                    </div>
                  )}
                </div>
              )}

              {/* Caption */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Caption <span className="text-pink-400">*</span>
                </label>
                <textarea
                  id="reel-caption-input"
                  rows={2}
                  value={reelCaption}
                  onChange={e => setReelCaption(e.target.value)}
                  placeholder="Tell people what's happening... #vibes"
                  required
                  disabled={isUploading}
                  className="w-full text-xs p-3 rounded-2xl border border-zinc-700 bg-zinc-800 text-zinc-100 outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent placeholder-zinc-500 resize-none transition"
                />
              </div>

              {/* Music / Sound Track Title */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Music / Sound Title (Optional)
                </label>
                <div className="relative">
                  <Music className="w-3.5 h-3.5 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="reel-music-input"
                    type="text"
                    value={reelMusic}
                    onChange={e => setReelMusic(e.target.value)}
                    placeholder="e.g. Original Audio - Summer Breeze"
                    disabled={isUploading}
                    className="w-full text-xs pl-9 pr-3 py-2.5 rounded-2xl border border-zinc-700 bg-zinc-800 text-zinc-100 outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent placeholder-zinc-500 transition"
                  />
                </div>
              </div>

              {/* Upload Progress Bar */}
              {isUploading && (
                <div className="space-y-1.5 p-3 rounded-2xl bg-zinc-800/80 border border-zinc-700/50">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-300 font-medium flex items-center gap-1.5">
                      <Loader2 className="w-3.5 h-3.5 text-pink-400 animate-spin" />
                      {uploadStatusText || 'Uploading reel...'}
                    </span>
                    <span className="font-bold text-pink-400">{uploadProgress}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-zinc-700 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-pink-500 to-rose-500 transition-all duration-300 rounded-full"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Upload Error */}
              {uploadError && (
                <div className="flex items-start gap-2 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{uploadError}</span>
                </div>
              )}

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800/80">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={isUploading}
                  className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-xl transition disabled:opacity-40"
                >
                  Cancel
                </button>
                <button
                  id="publish-reel-btn"
                  type="submit"
                  disabled={!selectedFile || !reelCaption.trim() || isUploading}
                  className="px-5 py-2 text-xs font-bold bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 active:scale-95 text-white rounded-xl shadow-md shadow-pink-500/20 disabled:opacity-40 disabled:pointer-events-none transition flex items-center gap-1.5"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Publishing...</span>
                    </>
                  ) : (
                    <span>Publish Reel</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Reel Confirmation Popup */}
      <ConfirmDeleteModal
        isOpen={!!reelToDelete}
        isDeleting={isDeletingReel}
        title="Delete Video"
        description="Are you sure you want to permanently delete this video? All likes, comments, and views will be removed."
        confirmText="Delete Video"
        onConfirm={handleConfirmDeleteReel}
        onClose={() => {
          if (!isDeletingReel) setReelToDelete(null);
        }}
      />
    </div>
  );
};

// =========================================================================
// Single Reel Item Component (Vertical Snap Slide)
// =========================================================================
interface SingleReelItemProps {
  reel: Reel;
  index: number;
  totalCount: number;
  isActive: boolean;
  isMuted: boolean;
  isMyReel: boolean;
  onDeleteClick: () => void;
  onReportClick: () => void;
  onToggleMute: (forceVal?: boolean) => void;
  onInView: () => void;
  onLike: () => void;
  onSave: () => void;
  onShare: () => void;
  onOpenComments: () => void;
  onAuthorClick: () => void;
}

const SingleReelItem: React.FC<SingleReelItemProps> = ({
  reel,
  index,
  totalCount,
  isActive,
  isMuted,
  isMyReel,
  onDeleteClick,
  onReportClick,
  onToggleMute,
  onInView,
  onLike,
  onSave,
  onShare,
  onOpenComments,
  onAuthorClick
}) => {
  const itemRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [playbackProgress, setPlaybackProgress] = useState(0);
  const [showPlayIcon, setShowPlayIcon] = useState(false);
  const [isCaptionExpanded, setIsCaptionExpanded] = useState(false);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  // Floating heart animations for double tap
  const [heartAnimations, setHeartAnimations] = useState<HeartAnimation[]>([]);
  const lastTapRef = useRef<number>(0);

  // IntersectionObserver: detect when this reel is in view (>60%)
  useEffect(() => {
    const el = itemRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            onInView();
          }
        });
      },
      { threshold: 0.62 }
    );

    observer.observe(el);
    return () => {
      observer.disconnect();
    };
  }, [onInView]);

  // Handle Play/Pause and original audio track when active state changes
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isActive) {
      // Respect user's sound preference
      video.muted = isMuted;

      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
            setAutoplayBlocked(false);
          })
          .catch(err => {
            console.warn('Autoplay with sound restricted by browser policy:', err);
            // If browser policy blocks sound autoplay, immediately fall back to muted so video plays smoothly
            if (!video.muted) {
              video.muted = true;
              setAutoplayBlocked(true);
              video
                .play()
                .then(() => {
                  setIsPlaying(true);
                })
                .catch(e => {
                  console.warn('Muted autoplay also prevented:', e);
                  setIsPlaying(false);
                });
            } else {
              setIsPlaying(false);
            }
          });
      }
    } else {
      // Reel moved away: Immediately pause and mute to guarantee zero audio overlap
      video.pause();
      video.muted = true;
      setIsPlaying(false);
      setShowPlayIcon(false);
      setAutoplayBlocked(false);
    }
  }, [isActive, isMuted]);

  // Single Click to toggle play/pause, Double Click to like
  const handleVideoClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const now = Date.now();
    const timeDiff = now - lastTapRef.current;

    if (timeDiff < 300) {
      // Double tap -> Like with floating heart
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const newHeart: HeartAnimation = { id: Date.now(), x, y };
      setHeartAnimations(prev => [...prev, newHeart]);
      setTimeout(() => {
        setHeartAnimations(prev => prev.filter(h => h.id !== newHeart.id));
      }, 1000);

      if (!reel.liked_by_me) {
        onLike();
      }
      lastTapRef.current = 0;
      return;
    }

    lastTapRef.current = now;

    // Delay single tap to verify it wasn't double tap
    setTimeout(() => {
      if (lastTapRef.current === now) {
        const video = videoRef.current;
        if (!video) return;

        if (video.paused) {
          video.muted = isMuted;
          video.play().then(() => {
            setIsPlaying(true);
            setShowPlayIcon(false);
          }).catch(console.warn);
        } else {
          video.pause();
          setIsPlaying(false);
          setShowPlayIcon(true);
        }
      }
    }, 280);
  };

  // Video time update -> Scrubber progress
  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video || !video.duration) return;
    const prog = (video.currentTime / video.duration) * 100;
    setPlaybackProgress(prog);
  };

  // Seek on scrubber click
  const handleScrubberClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video || !video.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, clickX / rect.width));
    video.currentTime = pct * video.duration;
  };

  return (
    <div
      ref={itemRef}
      id={`reel-slide-${reel.id}`}
      data-reel-id={reel.id}
      className="snap-start snap-always w-full h-full min-h-full shrink-0 relative flex flex-col justify-between overflow-hidden bg-black select-none"
      style={{ scrollSnapAlign: 'start', scrollSnapStop: 'always' }}
    >
      {/* Background Video Element */}
      <div
        className="absolute inset-0 w-full h-full cursor-pointer flex items-center justify-center bg-black"
        onClick={handleVideoClick}
      >
        <video
          ref={videoRef}
          src={reel.video_url}
          playsInline
          loop
          muted={isMuted}
          onTimeUpdate={handleTimeUpdate}
          onWaiting={() => setIsBuffering(true)}
          onPlaying={() => setIsBuffering(false)}
          onCanPlay={() => setIsBuffering(false)}
          className="w-full h-full object-cover"
        />

        {/* Cinematic Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-transparent to-black/90 pointer-events-none" />

        {/* Center Buffering Spinner */}
        {isBuffering && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-15">
            <div className="p-3 rounded-full bg-black/60 backdrop-blur-sm border border-white/10">
              <Loader2 className="w-8 h-8 text-pink-500 animate-spin" />
            </div>
          </div>
        )}

        {/* Center Pause Indicator */}
        {showPlayIcon && !isBuffering && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-15 animate-in zoom-in-75 duration-150">
            <div className="w-16 h-16 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center text-white/90 shadow-2xl">
              <Play className="w-8 h-8 fill-white translate-x-0.5" />
            </div>
          </div>
        )}

        {/* Floating Double-Tap Hearts */}
        {heartAnimations.map(h => (
          <div
            key={h.id}
            style={{ left: h.x - 30, top: h.y - 30 }}
            className="absolute pointer-events-none z-30 animate-in fade-in zoom-in duration-300"
          >
            <Heart className="w-16 h-16 text-rose-500 fill-rose-500 drop-shadow-[0_0_15px_rgba(244,63,94,0.8)] animate-bounce" />
          </div>
        ))}
      </div>

      {/* Top Header Overlay */}
      <div className="relative z-20 p-4 flex items-center justify-between text-white pointer-events-auto">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold tracking-wider uppercase bg-black/50 px-2.5 py-1 rounded-full backdrop-blur-md border border-white/15 text-zinc-200 shadow-sm">
            Reel {index + 1} of {totalCount}
          </span>
        </div>

        {/* Top-Right Sound & Reel Count Overlay */}
        <div className="flex items-center gap-2">
          <button
            id={`reel-mute-btn-${reel.id}`}
            onClick={e => {
              e.stopPropagation();
              const video = videoRef.current;
              if (isMuted || autoplayBlocked) {
                if (video) {
                  video.muted = false;
                  video.play().catch(console.warn);
                }
                onToggleMute(false);
                setAutoplayBlocked(false);
              } else {
                if (video) video.muted = true;
                onToggleMute(true);
              }
            }}
            className={`px-3 py-1.5 rounded-full backdrop-blur-md border transition-all flex items-center gap-1.5 text-xs font-semibold shadow-lg active:scale-95 ${
              isMuted || autoplayBlocked
                ? 'bg-black/70 border-pink-500/50 text-pink-200 hover:text-white hover:bg-black/90 hover:border-pink-400'
                : 'bg-pink-500/30 border-pink-500/60 text-pink-200 shadow-pink-500/20'
            }`}
            title={isMuted || autoplayBlocked ? 'Tap to enable original sound' : 'Mute sound'}
          >
            {isMuted || autoplayBlocked ? (
              <>
                <VolumeX className="w-3.5 h-3.5 text-pink-400" />
                <span className="text-[11px] font-medium tracking-wide">🔇 Original Sound Muted</span>
              </>
            ) : (
              <>
                <Volume2 className="w-3.5 h-3.5 text-pink-400 animate-pulse" />
                <span className="text-[11px] font-bold text-pink-300 tracking-wide">🔊 Sound On</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Floating One-Tap Unmute Banner when Sound is Muted */}
      {(isMuted || autoplayBlocked) && isActive && (
        <div
          id={`reel-unmute-prompt-${reel.id}`}
          onClick={e => {
            e.stopPropagation();
            const video = videoRef.current;
            if (video) {
              video.muted = false;
              video.play().catch(console.warn);
            }
            onToggleMute(false);
            setAutoplayBlocked(false);
          }}
          className="absolute top-16 left-1/2 -translate-x-1/2 z-25 cursor-pointer px-4 py-2 rounded-full bg-black/80 hover:bg-black/95 backdrop-blur-md border border-pink-500/60 text-pink-200 text-xs font-bold shadow-2xl flex items-center gap-2 animate-bounce transition hover:scale-105 select-none"
        >
          <VolumeX className="w-4 h-4 text-pink-400 shrink-0" />
          <span>Tap for Original Audio 🔊</span>
        </div>
      )}

      {/* Right Floating Actions Column (TikTok Rail) */}
      <div className="absolute right-3 bottom-14 z-20 flex flex-col items-center gap-3.5 text-white pointer-events-auto">
        {/* Author Avatar with Link */}
        <div className="relative group cursor-pointer mb-1" onClick={onAuthorClick}>
          <div className="p-0.5 rounded-full bg-gradient-to-tr from-pink-500 to-rose-500 shadow-md">
            <Avatar
              src={reel.author?.avatar_url}
              name={reel.author?.full_name || 'Author'}
              size="md"
              isVerified={reel.author?.is_verified}
            />
          </div>
        </div>

        {/* Like Button */}
        <button
          id={`reel-like-btn-${reel.id}`}
          onClick={e => {
            e.stopPropagation();
            onLike();
          }}
          className="flex flex-col items-center gap-1 group focus:outline-none"
        >
          <div
            className={`p-3 rounded-full backdrop-blur-md transition-all duration-200 active:scale-75 ${
              reel.liked_by_me
                ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/50 scale-105'
                : 'bg-black/55 hover:bg-black/75 text-white border border-white/15'
            }`}
          >
            <Heart
              className={`w-5 h-5 transition-transform ${
                reel.liked_by_me ? 'fill-white text-white' : 'text-white group-hover:scale-110'
              }`}
            />
          </div>
          <span className="text-[11px] font-bold drop-shadow-md text-zinc-100">
            {formatCount(reel.likes_count)}
          </span>
        </button>

        {/* Comment Button */}
        <button
          id={`reel-comment-btn-${reel.id}`}
          onClick={e => {
            e.stopPropagation();
            onOpenComments();
          }}
          className="flex flex-col items-center gap-1 group focus:outline-none"
        >
          <div className="p-3 rounded-full bg-black/55 hover:bg-black/75 border border-white/15 backdrop-blur-md transition-all duration-200 active:scale-75">
            <MessageCircle className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
          </div>
          <span className="text-[11px] font-bold drop-shadow-md text-zinc-100">
            {formatCount(reel.comments_count)}
          </span>
        </button>

        {/* Save / Bookmark Button */}
        <button
          id={`reel-save-btn-${reel.id}`}
          onClick={e => {
            e.stopPropagation();
            onSave();
          }}
          className="flex flex-col items-center gap-1 group focus:outline-none"
        >
          <div
            className={`p-3 rounded-full backdrop-blur-md transition-all duration-200 active:scale-75 ${
              reel.saved_by_me
                ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/40 scale-105'
                : 'bg-black/55 hover:bg-black/75 text-white border border-white/15'
            }`}
          >
            <Bookmark
              className={`w-5 h-5 transition-transform ${
                reel.saved_by_me ? 'fill-white text-white' : 'text-white group-hover:scale-110'
              }`}
            />
          </div>
          <span className="text-[11px] font-bold drop-shadow-md text-zinc-100">
            {reel.saved_by_me ? 'Saved' : 'Save'}
          </span>
        </button>

        {/* Share Button */}
        <button
          id={`reel-share-btn-${reel.id}`}
          onClick={e => {
            e.stopPropagation();
            onShare();
          }}
          className="flex flex-col items-center gap-1 group focus:outline-none"
        >
          <div className="p-3 rounded-full bg-black/55 hover:bg-black/75 border border-white/15 backdrop-blur-md transition-all duration-200 active:scale-75">
            <Share2 className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
          </div>
          <span className="text-[11px] font-bold drop-shadow-md text-zinc-100">
            {formatCount(reel.shares_count || 0)}
          </span>
        </button>

        {/* 3-Dot More Options Button */}
        <div className="relative">
          <button
            id={`reel-options-btn-${reel.id}`}
            onClick={e => {
              e.stopPropagation();
              setShowMenu(prev => !prev);
            }}
            className="flex flex-col items-center gap-1 group focus:outline-none"
            title="More options"
          >
            <div className="p-3 rounded-full bg-black/55 hover:bg-black/75 border border-white/15 backdrop-blur-md transition-all duration-200 active:scale-75 text-white">
              <MoreVertical className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </div>
          </button>

          {/* Options Dropdown Menu */}
          {showMenu && (
            <div
              onClick={e => e.stopPropagation()}
              className="absolute right-0 bottom-full mb-2 w-44 bg-zinc-900/95 backdrop-blur-md border border-zinc-700/80 rounded-2xl shadow-2xl p-1.5 z-40 animate-in fade-in zoom-in-95"
            >
              {isMyReel && (
                <button
                  id={`reel-delete-action-${reel.id}`}
                  onClick={e => {
                    e.stopPropagation();
                    setShowMenu(false);
                    onDeleteClick();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-950/40 rounded-xl transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Video</span>
                </button>
              )}

              {!isMyReel && (
                <button
                  id={`reel-report-action-${reel.id}`}
                  onClick={e => {
                    e.stopPropagation();
                    setShowMenu(false);
                    onReportClick();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 rounded-xl transition"
                >
                  <Flag className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Report Video</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Spinning Vinyl Audio Record (clickable to toggle audio) */}
        <div
          onClick={e => {
            e.stopPropagation();
            const video = videoRef.current;
            if (isMuted || autoplayBlocked) {
              if (video) {
                video.muted = false;
                video.play().catch(console.warn);
              }
              onToggleMute(false);
              setAutoplayBlocked(false);
            } else {
              if (video) video.muted = true;
              onToggleMute(true);
            }
          }}
          className="mt-1 flex items-center justify-center cursor-pointer group"
          title={isMuted || autoplayBlocked ? 'Tap to unmute original audio' : 'Playing original audio'}
        >
          <div
            className={`w-9 h-9 rounded-full bg-zinc-900 border-2 transition-transform group-hover:scale-110 p-1 flex items-center justify-center shadow-lg ${
              !isMuted && !autoplayBlocked ? 'border-pink-500 shadow-pink-500/30' : 'border-zinc-700'
            } ${isPlaying ? 'animate-spin' : ''}`}
            style={{ animationDuration: '4s' }}
          >
            <div className={`w-3 h-3 rounded-full ${!isMuted && !autoplayBlocked ? 'bg-pink-500' : 'bg-zinc-600'}`} />
          </div>
        </div>
      </div>

      {/* Bottom Info Overlay (Author, Caption, Audio) */}
      <div className="relative z-20 p-4 pb-3 text-white space-y-2 max-w-[78%] pointer-events-auto">
        {/* Author details */}
        <div
          onClick={onAuthorClick}
          className="flex items-center gap-2 cursor-pointer w-fit group"
        >
          <span className="text-sm font-bold drop-shadow-md group-hover:text-pink-300 transition">
            {reel.author?.full_name || 'User'}
          </span>
          {reel.author?.username && (
            <span className="text-xs text-zinc-300 font-normal drop-shadow-md">
              @{reel.author.username}
            </span>
          )}
        </div>

        {/* Caption with hashtag styling */}
        <div className="text-xs text-zinc-100 drop-shadow-md leading-relaxed">
          <p className={isCaptionExpanded ? '' : 'line-clamp-2'}>
            {formatCaption(reel.caption)}
          </p>
          {reel.caption.length > 90 && (
            <button
              onClick={() => setIsCaptionExpanded(prev => !prev)}
              className="text-[11px] font-bold text-pink-400 hover:text-pink-300 mt-0.5"
            >
              {isCaptionExpanded ? 'less' : 'more'}
            </button>
          )}
        </div>

        {/* Music / Soundtrack Ticker */}
        {reel.music_title && (
          <div className="flex items-center gap-2 text-[11px] text-zinc-300 drop-shadow-md overflow-hidden">
            <Music className={`w-3.5 h-3.5 text-pink-400 shrink-0 ${isPlaying ? 'animate-bounce' : ''}`} />
            <span className="truncate">{reel.music_title}</span>
          </div>
        )}
      </div>

      {/* Bottom Scrubber Progress Bar */}
      <div
        id={`reel-scrubber-${reel.id}`}
        onClick={handleScrubberClick}
        className="relative w-full h-1 bg-zinc-800/80 cursor-pointer group z-30 transition-all hover:h-1.5"
      >
        <div
          className="h-full bg-gradient-to-r from-pink-500 to-rose-500 transition-all duration-100 relative"
          style={{ width: `${playbackProgress}%` }}
        >
          <span className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white opacity-0 group-hover:opacity-100 shadow-md" />
        </div>
      </div>
    </div>
  );
};

// =========================================================================
// Helpers
// =========================================================================
function formatCount(num: number): string {
  if (!num) return '0';
  if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  return String(num);
}

function formatTimeAgo(dateString?: string): string {
  if (!dateString) return 'recently';
  const now = Date.now();
  const past = new Date(dateString).getTime();
  const diffSec = Math.floor((now - past) / 1000);

  if (diffSec < 60) return 'just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
}

function formatCaption(caption: string): React.ReactNode {
  if (!caption) return '';
  const parts = caption.split(/(#[a-zA-Z0-9_]+)/g);
  return parts.map((part, i) => {
    if (part.startsWith('#')) {
      return (
        <span key={i} className="font-semibold text-pink-400 hover:underline">
          {part}
        </span>
      );
    }
    return part;
  });
}
