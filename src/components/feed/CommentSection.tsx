import React, { useState } from 'react';
import { Heart, Send, CornerDownRight, MoreHorizontal } from 'lucide-react';
import { Comment } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { Avatar } from '../common/Avatar';

interface CommentSectionProps {
  postId: string;
  comments: Comment[];
}

export const CommentSection: React.FC<CommentSectionProps> = ({ postId, comments }) => {
  const { currentUser } = useAuth();
  const { addComment, addCommentReply } = useApp();
  const [commentText, setCommentText] = useState('');
  const [replyingToCommentId, setReplyingToCommentId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (commentText.trim()) {
      addComment(postId, commentText.trim());
      setCommentText('');
    }
  };

  const handleAddReply = (commentId: string, e: React.FormEvent) => {
    e.preventDefault();
    if (replyText.trim()) {
      addCommentReply(postId, commentId, replyText.trim());
      setReplyText('');
      setReplyingToCommentId(null);
    }
  };

  return (
    <div className="pt-3 border-t border-zinc-800 space-y-3">
      {/* Input box */}
      <form onSubmit={handleAddComment} className="flex items-center gap-2">
        <Avatar
          src={currentUser.avatar_url}
          name={currentUser.full_name}
          size="sm"
        />
        <div className="flex-1 relative">
          <input
            type="text"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Write a supportive comment or reply..."
            className="w-full bg-zinc-800/80 hover:bg-zinc-800 focus:bg-zinc-850 text-xs sm:text-sm text-zinc-100 rounded-2xl py-2.5 pl-3.5 pr-10 border border-zinc-700/60 focus:border-pink-500/50 focus:ring-2 focus:ring-pink-500/20 outline-none transition placeholder-zinc-500"
          />
          <button
            type="submit"
            disabled={!commentText.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-pink-400 hover:text-pink-300 disabled:opacity-30 transition"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>

      {/* Comments List */}
      <div className="space-y-3 pt-1">
        {comments.map((c) => (
          <div key={c.id} className="space-y-2">
            <div className="flex items-start gap-2.5 group">
              <Avatar
                src={c.author.avatar_url}
                name={c.author.full_name}
                size="sm"
              />
              <div className="flex-1 min-w-0">
                <div className="bg-zinc-800/80 border border-zinc-750/60 rounded-2xl p-3 inline-block max-w-full">
                  <div className="text-xs font-bold text-zinc-100 flex items-center gap-2">
                    <span>{c.author.full_name}</span>
                    <span className="text-[10px] font-normal text-zinc-400">
                      {new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-200 mt-1 leading-relaxed whitespace-pre-wrap">
                    {c.content}
                  </p>
                </div>

                {/* Comment Actions */}
                <div className="flex items-center gap-3 text-[11px] font-semibold text-zinc-400 mt-1 ml-2">
                  <button className="hover:text-pink-400 transition flex items-center gap-1">
                    <span>Like</span>
                    {c.likes_count > 0 && <span>({c.likes_count})</span>}
                  </button>
                  <button
                    onClick={() => setReplyingToCommentId(replyingToCommentId === c.id ? null : c.id)}
                    className="hover:text-pink-400 transition"
                  >
                    Reply
                  </button>
                </div>
              </div>
            </div>

            {/* Nested replies */}
            {c.replies && c.replies.length > 0 && (
              <div className="pl-8 space-y-2 border-l-2 border-zinc-800 ml-4">
                {c.replies.map((reply) => (
                  <div key={reply.id} className="flex items-start gap-2">
                    <Avatar
                      src={reply.author.avatar_url}
                      name={reply.author.full_name}
                      size="xs"
                    />
                    <div className="bg-zinc-800/80 border border-zinc-750/60 rounded-2xl p-2.5 inline-block">
                      <div className="text-xs font-bold text-zinc-100">
                        {reply.author.full_name}
                      </div>
                      <p className="text-xs text-zinc-200 mt-0.5">
                        {reply.content}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Reply Input Form */}
            {replyingToCommentId === c.id && (
              <form
                onSubmit={(e) => handleAddReply(c.id, e)}
                className="pl-8 flex items-center gap-2 mt-1"
              >
                <CornerDownRight className="w-3.5 h-3.5 text-zinc-400" />
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={`Reply to ${c.author.full_name.split(' ')[0]}...`}
                  className="flex-1 bg-zinc-800 text-xs text-zinc-100 rounded-xl py-1.5 px-3 border border-zinc-700 outline-none focus:ring-1 focus:ring-pink-400 placeholder-zinc-500"
                />
                <button
                  type="submit"
                  disabled={!replyText.trim()}
                  className="text-xs font-semibold text-pink-400 disabled:opacity-40 hover:text-pink-300"
                >
                  Send
                </button>
              </form>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
