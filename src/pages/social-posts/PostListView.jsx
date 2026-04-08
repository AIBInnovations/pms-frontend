import { Badge, Avatar, Skeleton, EmptyState } from '../../components/ui';
import { PLATFORM_MAP, STATUS_MAP } from './postConstants';

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function PostListView({ posts, loading, onSelectPost }) {
  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} variant="card" className="h-14" />)}
      </div>
    );
  }

  if (!posts || posts.length === 0) {
    return <EmptyState title="No posts yet" description="Create your first post to start planning your content calendar." />;
  }

  return (
    <div className="card overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 dark:bg-slate-800/50">
          <tr className="text-left text-xs text-slate-500 uppercase">
            <th className="px-4 py-3">Post ID</th>
            <th className="px-4 py-3">Title</th>
            <th className="px-4 py-3">Platforms</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Assignee</th>
            <th className="px-4 py-3">Scheduled</th>
            <th className="px-4 py-3">Campaign</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {posts.map((p) => {
            const status = STATUS_MAP[p.status];
            return (
              <tr
                key={p._id}
                onClick={() => onSelectPost(p)}
                className="hover:bg-slate-50 dark:hover:bg-slate-800/30 cursor-pointer"
              >
                <td className="px-4 py-3 font-mono text-[11px] text-slate-500">{p.postId}</td>
                <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{p.title}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    {(p.platforms || []).map((pl) => (
                      <span key={pl} className={`px-1.5 py-0.5 rounded text-[9px] font-bold text-white ${PLATFORM_MAP[pl]?.color || 'bg-slate-400'}`}>
                        {PLATFORM_MAP[pl]?.initial || '?'}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Badge size="sm" color={status?.color || 'default'}>{status?.label || p.status}</Badge>
                </td>
                <td className="px-4 py-3">
                  {p.assignee ? (
                    <div className="flex items-center gap-2">
                      <Avatar name={p.assignee.name} size="xs" />
                      <span className="text-xs text-slate-600 dark:text-slate-400">{p.assignee.name}</span>
                    </div>
                  ) : <span className="text-xs text-slate-400">—</span>}
                </td>
                <td className="px-4 py-3 text-xs text-slate-500">{fmtDate(p.scheduledAt)}</td>
                <td className="px-4 py-3 text-xs text-slate-500">{p.campaign || '—'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
