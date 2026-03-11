import { useState, useEffect, useCallback, useRef } from 'react';
import { commentService } from '../../services';
import { useToast } from '../ui/Toast';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui';
import CommentInput from './CommentInput';
import CommentItem from './CommentItem';

function CommentSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex gap-3 py-4 animate-pulse">
          <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <div className="h-3 w-24 bg-slate-200 dark:bg-slate-700 rounded" />
              <div className="h-3 w-12 bg-slate-200 dark:bg-slate-700 rounded" />
            </div>
            <div className="h-3 w-full bg-slate-200 dark:bg-slate-700 rounded" />
            <div className="h-3 w-2/3 bg-slate-200 dark:bg-slate-700 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function CommentSection({ commentableType, commentableId }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [replyingTo, setReplyingTo] = useState(null);
  const toast = useToast();
  const { user } = useAuth();
  const replyInputRef = useRef(null);

  const fetchComments = useCallback(async (pageNum = 1) => {
    try {
      setLoading(true);
      const response = await commentService.getByEntity(commentableType, commentableId, {
        page: pageNum,
        limit: 20,
      });
      const { data, pagination } = response;

      if (pageNum === 1) {
        setComments(data);
      } else {
        setComments((prev) => [...prev, ...data]);
      }

      setTotalCount(pagination?.total || data.length);
      setHasMore(pageNum < (pagination?.pages || 1));
    } catch {
      toast.error('Failed to load comments');
    } finally {
      setLoading(false);
    }
  }, [commentableType, commentableId, toast]);

  useEffect(() => {
    if (commentableId) {
      setPage(1);
      fetchComments(1);
    }
  }, [fetchComments, commentableId]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchComments(nextPage);
  };

  const handleAddComment = async (body) => {
    setSubmitting(true);
    try {
      const response = await commentService.create({
        body,
        commentableType,
        commentableId,
      });
      setComments((prev) => [response.data, ...prev]);
      setTotalCount((prev) => prev + 1);
      toast.success('Comment added');
    } catch {
      toast.error('Failed to add comment');
      throw new Error('Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateComment = async (commentId, updateData) => {
    try {
      const response = await commentService.update(commentId, updateData);
      setComments((prev) =>
        prev.map((c) => (c._id === commentId ? { ...c, ...response.data } : c))
      );
      toast.success('Comment updated');
    } catch {
      toast.error('Failed to update comment');
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await commentService.delete(commentId);
      setComments((prev) => prev.filter((c) => c._id !== commentId));
      setTotalCount((prev) => prev - 1);
      toast.success('Comment deleted');
    } catch {
      toast.error('Failed to delete comment');
    }
  };

  const handleReact = (commentId, updatedReactions) => {
    setComments((prev) =>
      prev.map((c) => (c._id === commentId ? { ...c, reactions: updatedReactions } : c))
    );
  };

  const handleReply = (parentCommentId) => {
    setReplyingTo(parentCommentId);
    // Scroll reply input into view after render
    setTimeout(() => {
      replyInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 50);
  };

  const handleSubmitReply = async (body) => {
    if (!replyingTo) return;
    setSubmitting(true);
    try {
      await commentService.create({
        body,
        commentableType,
        commentableId,
        parentComment: replyingTo,
      });
      setReplyingTo(null);
      toast.success('Reply added');
    } catch {
      toast.error('Failed to add reply');
      throw new Error('Failed to add reply');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Comments</h3>
        {totalCount > 0 && (
          <span className="text-xs text-slate-400">({totalCount})</span>
        )}
      </div>

      {/* New comment input */}
      <CommentInput
        onSubmit={handleAddComment}
        loading={submitting && !replyingTo}
        placeholder="Write a comment..."
      />

      {/* Loading skeleton */}
      {loading && comments.length === 0 && <CommentSkeleton />}

      {/* Comment list */}
      {comments.length > 0 && (
        <div className="divide-y divide-slate-100 dark:divide-slate-700">
          {comments.map((comment) => (
            <div key={comment._id}>
              <CommentItem
                comment={comment}
                currentUserId={user?._id}
                onDelete={handleDeleteComment}
                onUpdate={handleUpdateComment}
                onReact={handleReact}
                onReply={handleReply}
              />

              {/* Inline reply input */}
              {replyingTo === comment._id && (
                <div ref={replyInputRef} className="ml-11 mb-4">
                  <CommentInput
                    onSubmit={handleSubmitReply}
                    loading={submitting && replyingTo === comment._id}
                    placeholder={`Reply to ${comment.author?.name || 'comment'}...`}
                    autoFocus
                    onCancel={() => setReplyingTo(null)}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && comments.length === 0 && (
        <p className="text-sm text-slate-400 text-center py-6">
          No comments yet. Be the first to comment.
        </p>
      )}

      {/* Load more */}
      {hasMore && (
        <div className="flex justify-center pt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLoadMore}
            loading={loading && comments.length > 0}
          >
            Load more
          </Button>
        </div>
      )}
    </div>
  );
}
