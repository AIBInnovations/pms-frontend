import { useState, useCallback } from 'react';
import { commentService } from '../../services';
import { Avatar } from '../ui';
import { renderMarkdown } from '../../utils/markdown';
import CommentInput from './CommentInput';

const REACTION_EMOJIS = ['\ud83d\udc4d', '\u2764\ufe0f', '\ud83c\udf89', '\ud83d\udc40', '\ud83d\ude80', '\ud83d\ude04'];

const timeAgo = (date) => {
  const seconds = Math.floor((Date.now() - new Date(date)) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export default function CommentItem({ comment, currentUserId, onDelete, onUpdate, onReact, onReply }) {
  const [editing, setEditing] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [reactions, setReactions] = useState(comment.reactions || []);
  const [repliesExpanded, setRepliesExpanded] = useState(false);
  const [replies, setReplies] = useState([]);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [repliesLoaded, setRepliesLoaded] = useState(false);

  const isOwner = comment.author?._id === currentUserId;

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this comment?')) {
      onDelete(comment._id);
    }
  };

  const handleEdit = async (newBody) => {
    await onUpdate(comment._id, { body: newBody });
    setEditing(false);
  };

  const handleReaction = async (emoji) => {
    try {
      const { data } = await commentService.addReaction(comment._id, emoji);
      setReactions(data.reactions || []);
      onReact?.(comment._id, data.reactions || []);
    } catch {
      // Silently fail on reaction errors
    }
    setShowEmojiPicker(false);
  };

  const handleReplyClick = () => {
    onReply?.(comment._id);
  };

  const toggleReplies = useCallback(async () => {
    if (repliesExpanded) {
      setRepliesExpanded(false);
      return;
    }

    setRepliesExpanded(true);

    if (!repliesLoaded) {
      setLoadingReplies(true);
      try {
        const response = await commentService.getReplies(comment._id);
        setReplies(response.data || []);
        setRepliesLoaded(true);
      } catch {
        // Silently fail
      } finally {
        setLoadingReplies(false);
      }
    }
  }, [repliesExpanded, repliesLoaded, comment._id]);

  // Reactions are stored as {emoji, users[]}, map to display format
  const groupedReactions = reactions.map((r) => ({
    emoji: r.emoji,
    count: r.users?.length || 0,
    reacted: r.users?.some((u) => (u._id || u).toString() === currentUserId),
  })).filter((r) => r.count > 0);

  return (
    <div className="flex gap-3 py-4">
      <Avatar
        name={comment.author?.name || 'Unknown'}
        src={comment.author?.avatar}
        size="sm"
      />

      <div className="flex-1 min-w-0">
        {/* Header row */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
            {comment.author?.name || 'Unknown'}
          </span>
          <span className="text-xs text-slate-400">
            {timeAgo(comment.createdAt)}
          </span>
          {comment.createdAt !== comment.updatedAt && (
            <span className="text-xs text-slate-400 italic">edited</span>
          )}

          {isOwner && !editing && (
            <div className="ml-auto flex items-center gap-1">
              <button
                onClick={() => setEditing(true)}
                className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors px-1.5 py-0.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                Edit
              </button>
              <button
                onClick={handleDelete}
                className="text-xs text-slate-400 hover:text-danger-600 transition-colors px-1.5 py-0.5 rounded hover:bg-danger-50"
              >
                Delete
              </button>
            </div>
          )}
        </div>

        {/* Body */}
        {editing ? (
          <div className="mt-2">
            <CommentInput
              initialValue={comment.body}
              onSubmit={handleEdit}
              onCancel={() => setEditing(false)}
              placeholder="Edit your comment..."
              autoFocus
            />
          </div>
        ) : (
          <div
            className="mt-1 text-sm text-slate-600 dark:text-slate-400"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(comment.body) }}
          />
        )}

        {/* Actions and reactions row */}
        {!editing && (
          <div className="mt-2 flex items-center gap-1.5 flex-wrap">
            {/* Existing reactions */}
            {groupedReactions.map((reaction) => (
              <button
                key={reaction.emoji}
                onClick={() => handleReaction(reaction.emoji)}
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs border transition-colors ${
                  reaction.reacted
                    ? 'bg-primary-50 border-primary-200 hover:bg-primary-100'
                    : 'bg-slate-100 dark:bg-slate-700 border-transparent hover:bg-slate-200 dark:hover:bg-slate-600'
                }`}
              >
                <span>{reaction.emoji}</span>
                <span className="text-slate-600 dark:text-slate-400">{reaction.count}</span>
              </button>
            ))}

            {/* Add reaction */}
            <div className="relative">
              <button
                onClick={() => setShowEmojiPicker((prev) => !prev)}
                className="inline-flex items-center justify-center w-6 h-6 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-600 dark:hover:text-slate-300 transition-colors text-sm"
                title="Add reaction"
              >
                +
              </button>

              {showEmojiPicker && (
                <div className="absolute left-0 bottom-full mb-1 flex items-center gap-0.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl shadow-lg px-2 py-1.5 z-10">
                  {REACTION_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => handleReaction(emoji)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-sm"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Reply button */}
            {onReply && (
              <button
                onClick={handleReplyClick}
                className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors px-1.5 py-0.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 ml-1"
              >
                Reply
              </button>
            )}
          </div>
        )}

        {/* Nested replies toggle */}
        {!editing && !comment.parentComment && (
          <div className="mt-2">
            <button
              onClick={toggleReplies}
              className="text-xs text-primary-600 hover:text-primary-700 transition-colors font-medium"
            >
              {repliesExpanded ? 'Hide replies' : 'Show replies'}
            </button>

            {repliesExpanded && (
              <div className="mt-3 ml-1 pl-4 border-l-2 border-slate-100 dark:border-slate-700 space-y-0">
                {loadingReplies && (
                  <div className="flex items-center gap-2 py-3">
                    <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 w-24 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                      <div className="h-3 w-48 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                    </div>
                  </div>
                )}

                {!loadingReplies && repliesLoaded && replies.length === 0 && (
                  <p className="text-xs text-slate-400 py-2">No replies yet</p>
                )}

                {replies.map((reply) => (
                  <div key={reply._id} className="flex gap-2.5 py-3">
                    <Avatar
                      name={reply.author?.name || 'Unknown'}
                      src={reply.author?.avatar}
                      size="xs"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-slate-900 dark:text-slate-100">
                          {reply.author?.name || 'Unknown'}
                        </span>
                        <span className="text-xs text-slate-400">
                          {timeAgo(reply.createdAt)}
                        </span>
                      </div>
                      <div
                        className="mt-0.5 text-sm text-slate-600 dark:text-slate-400"
                        dangerouslySetInnerHTML={{ __html: renderMarkdown(reply.body) }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
