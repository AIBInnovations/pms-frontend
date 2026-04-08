import { useState, useEffect, useCallback } from 'react';
import { socialPostService } from '../../services';
import { useToast } from '../../components/ui/Toast';
import { useAuth } from '../../context/AuthContext';
import { Button, Badge, Avatar, Skeleton } from '../../components/ui';
import { PLATFORM_MAP, STATUS_MAP } from './postConstants';

function fmtDateTime(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function PostDetailDrawer({ postId, isOpen, onClose, onChanged, onEdit }) {
  const toast = useToast();
  const { user } = useAuth();
  const isAdmin = user?.role === 'super_admin';

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');

  const fetchPost = useCallback(async () => {
    if (!postId) return;
    setLoading(true);
    try {
      const res = await socialPostService.getById(postId);
      setPost(res.data);
    } catch {
      toast.error('Failed to load post');
    } finally {
      setLoading(false);
    }
  }, [postId, toast]);

  useEffect(() => {
    if (isOpen && postId) fetchPost();
    if (!isOpen) {
      setPost(null);
      setRejecting(false);
      setReason('');
    }
  }, [postId, isOpen, fetchPost]);

  const action = async (fn, successMsg) => {
    try {
      await fn();
      toast.success(successMsg);
      onChanged && onChanged();
      fetchPost();
    } catch (e) {
      toast.error(e.response?.data?.error?.message || 'Action failed');
    }
  };

  const handleSubmit = () => action(() => socialPostService.submit(post._id), 'Submitted for approval');
  const handleApprove = () => action(() => socialPostService.approve(post._id), 'Post approved');
  const handlePublish = () => action(() => socialPostService.publish(post._id), 'Marked as published');
  const handleArchive = () => action(() => socialPostService.archive(post._id), 'Post archived');
  const handleDelete = async () => {
    if (!confirm('Delete this post permanently?')) return;
    try {
      await socialPostService.delete(post._id);
      toast.success('Post deleted');
      onChanged && onChanged();
      onClose();
    } catch (e) {
      toast.error(e.response?.data?.error?.message || 'Delete failed');
    }
  };
  const handleReject = async () => {
    if (!reason.trim()) { toast.error('Reason required'); return; }
    await action(() => socialPostService.reject(post._id, reason.trim()), 'Post rejected');
    setRejecting(false);
    setReason('');
  };

  if (!isOpen) return null;

  const status = post && STATUS_MAP[post.status];

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-slate-900/30" onClick={onClose} />
      <aside className="relative ml-auto w-full max-w-xl h-full bg-white dark:bg-slate-900 shadow-2xl flex flex-col">
        {loading || !post ? (
          <div className="p-6"><Skeleton variant="card" className="h-32" /></div>
        ) : (
          <>
            {/* Header */}
            <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="min-w-0">
                  <p className="text-[10px] font-mono text-slate-400">{post.postId}</p>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{post.title}</h2>
                </div>
                <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge size="sm" color={status?.color || 'default'}>{status?.label}</Badge>
                {(post.platforms || []).map((p) => (
                  <span key={p} className={`px-2 py-0.5 rounded text-[10px] font-bold text-white ${PLATFORM_MAP[p]?.color}`}>
                    {PLATFORM_MAP[p]?.label}
                  </span>
                ))}
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
              {post.status === 'rejected' && post.rejectionReason && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                  <p className="text-xs font-semibold text-red-700 dark:text-red-300 uppercase mb-1">Rejection Reason</p>
                  <p className="text-sm text-red-600 dark:text-red-400">{post.rejectionReason}</p>
                </div>
              )}

              <div>
                <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2">Content</h4>
                <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{post.content}</p>
              </div>

              {post.media?.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2">Media</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {post.media.map((m, i) => (
                      <a key={i} href={m.url} target="_blank" rel="noreferrer" className="aspect-square rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 block">
                        {m.type === 'image' ? (
                          <img src={m.url} alt={m.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-2xl">
                            {m.type === 'video' ? '🎬' : '📎'}
                          </div>
                        )}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {post.hashtags?.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2">Hashtags</h4>
                  <div className="flex flex-wrap gap-1">
                    {post.hashtags.map((h, i) => (
                      <span key={i} className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-xs text-slate-600 dark:text-slate-400">#{h}</span>
                    ))}
                  </div>
                </div>
              )}

              {post.link && (
                <div>
                  <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2">Link</h4>
                  <a href={post.link} target="_blank" rel="noreferrer" className="text-sm text-primary-600 hover:underline break-all">{post.link}</a>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] text-slate-500 uppercase">Scheduled</p>
                  <p className="text-sm text-slate-700 dark:text-slate-300">{fmtDateTime(post.scheduledAt)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase">Published</p>
                  <p className="text-sm text-slate-700 dark:text-slate-300">{fmtDateTime(post.publishedAt)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase">Campaign</p>
                  <p className="text-sm text-slate-700 dark:text-slate-300">{post.campaign || '—'}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase">Assignee</p>
                  {post.assignee ? (
                    <div className="flex items-center gap-2 mt-1">
                      <Avatar name={post.assignee.name} size="xs" />
                      <span className="text-sm text-slate-700 dark:text-slate-300">{post.assignee.name}</span>
                    </div>
                  ) : <p className="text-sm text-slate-400">Unassigned</p>}
                </div>
              </div>

              {post.notes && (
                <div>
                  <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2">Internal Notes</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap">{post.notes}</p>
                </div>
              )}

              {/* Audit */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1 text-[11px] text-slate-400">
                <p>Created by {post.createdBy?.name} on {fmtDateTime(post.createdAt)}</p>
                {post.approvedBy && (
                  <p>{post.status === 'rejected' ? 'Rejected' : 'Approved'} by {post.approvedBy?.name} on {fmtDateTime(post.approvedAt)}</p>
                )}
              </div>
            </div>

            {/* Action footer */}
            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
              {rejecting ? (
                <div className="space-y-2">
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={2}
                    placeholder="Why are you rejecting this post?"
                    className="input-base"
                  />
                  <div className="flex gap-2 justify-end">
                    <Button variant="ghost" onClick={() => { setRejecting(false); setReason(''); }}>Cancel</Button>
                    <Button onClick={handleReject}>Reject Post</Button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2 flex-wrap justify-end">
                  {['draft', 'idea', 'rejected'].includes(post.status) && (
                    <>
                      <Button variant="ghost" onClick={() => onEdit(post)}>Edit</Button>
                      <Button onClick={handleSubmit}>Submit for Approval</Button>
                    </>
                  )}
                  {post.status === 'pending_approval' && (
                    <>
                      {isAdmin && <Button variant="ghost" onClick={() => setRejecting(true)}>Reject</Button>}
                      {isAdmin && <Button onClick={handleApprove}>Approve</Button>}
                      {!isAdmin && <Button variant="ghost" onClick={() => onEdit(post)}>Edit</Button>}
                    </>
                  )}
                  {post.status === 'scheduled' && (
                    <>
                      <Button variant="ghost" onClick={() => onEdit(post)}>Edit</Button>
                      <Button variant="ghost" onClick={handleArchive}>Archive</Button>
                      <Button onClick={handlePublish}>Mark Published</Button>
                    </>
                  )}
                  {post.status === 'published' && (
                    <Button variant="ghost" onClick={handleArchive}>Archive</Button>
                  )}
                  {isAdmin && post.status !== 'archived' && (
                    <Button variant="ghost" onClick={handleDelete}>Delete</Button>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
