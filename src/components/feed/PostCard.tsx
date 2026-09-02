import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  MoreHorizontal,
  MapPin,
  Smile,
  Trash2,
  Edit2,
  ShieldAlert,
  Globe,
  Users,
  Lock,
  Check
} from 'lucide-react';
import { Post } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { Avatar } from '../common/Avatar';
import { CommentSection } from './CommentSection';

interface PostCardProps {
  post: Post;
}

export const PostCard: React.FC<PostCardProps> = ({ post }) => {
  const { currentUser } = useAuth();
  const {
    likePost,
    toggleSavePost,
    deletePost,
    editPost,
    openReportModal,
    navigate
  } = useApp();

  const [showComments, setShowComments] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [copiedShare, setCopiedShare] = useState(false);

  const isMyPost = post.user_id === currentUser.id;
  const isAdmin = currentUser.role === 'ADMIN' || currentUser.role === 'MODERATOR';

  const handleLike = () => {
    likePost(post.id);
  };

  const handleSave = () => {
    toggleSavePost(post.id);
  };

  const handleDelete = () => {
    deletePost(post.id);
    setShowMenu(false);
  };

  const handleSaveEdit = () => {
    if (editContent.trim()) {
      editPost(post.id, editContent.trim());
      setIsEditing(false);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(`${window.location.origin}/#post/${post.id}`);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2000);
  };

  const timeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMin = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <article
      id={`post-card-${post.id}`}
      className="bg-zinc-900 rounded-3xl p-4 sm:p-5 border border-zinc-800 shadow-sm space-y-3.5 transition"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Avatar
            src={post.author.avatar_url}
            name={post.author.full_name}
            size="md"
            isOnline={post.author.is_online}
            isVerified={post.author.is_verified}
            onClick={() => navigate('profile', { username: post.author.username })}
          />
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span
                onClick={() => navigate('profile', { username: post.author.username })}
                className="text-sm font-bold text-zinc-100 hover:text-pink-400 transition cursor-pointer"
              >
                {post.author.full_name}
              </span>
              <span className="text-xs text-zinc-500">· {post.author.age} yo</span>

              {post.feeling && (
                <span className="text-xs text-zinc-400 font-medium">
                  is {post.feeling}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 text-[11px] text-zinc-400 mt-0.5">
              <span>{timeAgo(post.created_at)}</span>
              <span>·</span>
              {post.location && (
                <span className="flex items-center gap-0.5 text-zinc-300">
                  <MapPin className="w-3 h-3" />
                  <span>{post.location}</span>
                  <span className="ml-1">·</span>
                </span>
              )}
              {post.privacy === 'PUBLIC' && <Globe className="w-3 h-3 text-zinc-400" title="Public" />}
              {post.privacy === 'CONNECTIONS_ONLY' && <Users className="w-3 h-3 text-zinc-400" title="Connections" />}
              {post.privacy === 'PRIVATE' && <Lock className="w-3 h-3 text-zinc-400" title="Private" />}
            </div>
          </div>
        </div>

        {/* More Menu */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1.5 text-zinc-400 hover:text-zinc-100 rounded-full hover:bg-zinc-800 transition"
          >
            <MoreHorizontal className="w-5 h-5" />
          </button>

          {showMenu && (
            <div className="absolute right-0 mt-1 w-44 bg-zinc-900 rounded-2xl shadow-xl border border-zinc-750 p-1.5 z-30 animate-in fade-in zoom-in-95">
              {isMyPost && (
                <>
                  <button
                    onClick={() => {
                      setIsEditing(true);
                      setShowMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-zinc-200 hover:bg-zinc-800 rounded-xl transition"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    Edit Post
                  </button>
                  <button
                    onClick={handleDelete}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-950/40 rounded-xl transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete Post
                  </button>
                </>
              )}

              {isAdmin && !isMyPost && (
                <button
                  onClick={handleDelete}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-amber-400 hover:bg-amber-950/40 rounded-xl transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Admin Remove
                </button>
              )}

              {!isMyPost && (
                <button
                  onClick={() => {
                    setShowMenu(false);
                    openReportModal('POST', post.id, post.content.slice(0, 30));
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-950/40 rounded-xl transition"
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  Report Post
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Post Text / Edit Box */}
      {isEditing ? (
        <div className="space-y-2">
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            rows={3}
            className="w-full text-xs sm:text-sm p-3 rounded-2xl border border-zinc-750 bg-zinc-800 text-zinc-100 focus:ring-2 focus:ring-pink-500 outline-none"
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setIsEditing(false)}
              className="px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 rounded-xl font-semibold transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveEdit}
              className="px-4 py-1.5 text-xs bg-pink-600 text-white rounded-xl font-semibold hover:bg-pink-500 transition"
            >
              Save
            </button>
          </div>
        </div>
      ) : (
        <p className="text-xs sm:text-sm text-zinc-200 leading-relaxed whitespace-pre-wrap">
          {post.content}
        </p>
      )}

      {/* Media gallery */}
      {post.media && post.media.length > 0 && (
        <div className="rounded-2xl overflow-hidden bg-zinc-950 border border-zinc-800 max-h-[480px]">
          {post.media.length === 1 ? (
            <img
              src={post.media[0].url}
              alt="Post media"
              referrerPolicy="no-referrer"
              className="w-full h-auto max-h-[480px] object-cover hover:scale-[1.01] transition duration-300"
            />
          ) : (
            <div className="grid grid-cols-2 gap-1.5">
              {post.media.map((m, idx) => (
                <img
                  key={idx}
                  src={m.url}
                  alt="Post media"
                  referrerPolicy="no-referrer"
                  className="w-full h-56 object-cover hover:scale-105 transition duration-300"
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Metrics Row */}
      <div className="flex items-center justify-between text-xs text-zinc-400 px-1 pt-1">
        <div className="flex items-center gap-1.5">
          {post.likes_count > 0 && (
            <span className="flex items-center gap-1 text-zinc-300 font-medium">
              <span className="w-5 h-5 rounded-full bg-gradient-to-tr from-pink-500 to-rose-500 text-white flex items-center justify-center text-[10px] shadow-xs">
                <Heart className="w-3 h-3 fill-white" />
              </span>
              <span>{post.likes_count} {post.likes_count === 1 ? 'like' : 'likes'}</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {post.comments_count > 0 && (
            <button
              onClick={() => setShowComments(!showComments)}
              className="hover:underline text-zinc-400 hover:text-zinc-200"
            >
              {post.comments_count} {post.comments_count === 1 ? 'comment' : 'comments'}
            </button>
          )}
          {post.shares_count > 0 && (
            <span>{post.shares_count} shares</span>
          )}
        </div>
      </div>

      {/* Post Action Buttons */}
      <div className="pt-2 border-t border-zinc-800 flex items-center justify-between">
        <button
          id={`post-like-btn-${post.id}`}
          onClick={handleLike}
          className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-2xl text-xs sm:text-sm font-semibold transition ${
            post.liked_by_me
              ? 'text-pink-400 bg-pink-500/10'
              : 'text-zinc-400 hover:text-pink-400 hover:bg-zinc-800'
          }`}
        >
          <motion.div whileTap={{ scale: 1.3 }}>
            <Heart className={`w-4 h-4 ${post.liked_by_me ? 'fill-pink-500 text-pink-500' : ''}`} />
          </motion.div>
          <span>{post.liked_by_me ? 'Liked' : 'Like'}</span>
        </button>

        <button
          onClick={() => setShowComments(!showComments)}
          className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-2xl text-xs sm:text-sm font-semibold transition ${
            showComments ? 'text-pink-400 bg-pink-500/10' : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800'
          }`}
        >
          <MessageCircle className="w-4 h-4" />
          <span>Comment</span>
        </button>

        <button
          onClick={handleShare}
          className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-2xl text-xs sm:text-sm font-semibold text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition"
        >
          {copiedShare ? (
            <>
              <Check className="w-4 h-4 text-emerald-400" />
              <span className="text-emerald-400">Copied!</span>
            </>
          ) : (
            <>
              <Share2 className="w-4 h-4" />
              <span>Share</span>
            </>
          )}
        </button>

        <button
          onClick={handleSave}
          className={`p-2 rounded-2xl text-xs transition ${
            post.saved_by_me
              ? 'text-indigo-400 bg-indigo-500/15'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
          }`}
          title={post.saved_by_me ? 'Saved' : 'Save post'}
        >
          <Bookmark className={`w-4 h-4 ${post.saved_by_me ? 'fill-indigo-400' : ''}`} />
        </button>
      </div>

      {/* Expandable Comment Section */}
      {showComments && (
        <CommentSection
          postId={post.id}
          comments={post.comments || []}
        />
      )}
    </article>
  );
};
