import { Avatar, Skeleton } from './ui';

function timeAgo(date) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  const years = Math.floor(months / 12);
  return `${years}y ago`;
}

function actionLabel(action) {
  const labels = {
    created: 'created',
    updated: 'updated',
    deleted: 'deleted',
    transitioned: 'transitioned',
    commented: 'commented on',
    uploaded: 'uploaded',
  };
  return labels[action] || action;
}

function MetadataContext({ metadata }) {
  if (!metadata) return null;

  if (metadata.from && metadata.to) {
    return (
      <span className="text-xs text-slate-400 ml-1">
        from <span className="font-medium text-slate-500">{metadata.from}</span>
        {' \u2192 '}
        <span className="font-medium text-slate-500">{metadata.to}</span>
      </span>
    );
  }

  return null;
}

function ActivityItem({ activity }) {
  const { actor, action, targetType, targetTitle, metadata, createdAt } = activity;

  return (
    <div className="relative pl-8 pb-6 last:pb-0 group">
      {/* Timeline connector line */}
      <div className="absolute left-[11px] top-6 bottom-0 w-px bg-slate-200 dark:bg-slate-700 group-last:hidden" />

      {/* Timeline dot */}
      <div className="absolute left-1.5 top-1.5 w-3 h-3 rounded-full border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800" />

      <div className="flex items-start gap-3">
        <Avatar
          name={actor?.name || 'Unknown'}
          src={actor?.avatar}
          size="sm"
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-slate-700 dark:text-slate-300">
            <span className="font-medium text-slate-900 dark:text-slate-100">{actor?.name || 'Unknown'}</span>
            {' '}
            {actionLabel(action)}
            {' '}
            <span className="text-slate-500">{targetType}</span>
            {targetTitle && (
              <>
                {' '}
                <span className="font-medium text-slate-700 dark:text-slate-300">&quot;{targetTitle}&quot;</span>
              </>
            )}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-slate-400">{timeAgo(createdAt)}</span>
            <MetadataContext metadata={metadata} />
          </div>
        </div>
      </div>
    </div>
  );
}

function SkeletonItem() {
  return (
    <div className="relative pl-8 pb-6 last:pb-0">
      <div className="absolute left-1.5 top-1.5 w-3 h-3 rounded-full border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800" />
      <div className="flex items-start gap-3">
        <Skeleton variant="avatar" className="w-8 h-8" />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" className="w-3/4" />
          <Skeleton variant="text" className="w-1/4 h-3" />
        </div>
      </div>
    </div>
  );
}

export default function ActivityFeed({ activities = [], loading = false }) {
  if (loading) {
    return (
      <div className="space-y-0">
        {[...Array(5)].map((_, i) => (
          <SkeletonItem key={i} />
        ))}
      </div>
    );
  }

  if (!activities.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="text-slate-300 mb-3">
          <svg className="w-10 h-10 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
        </div>
        <p className="text-sm font-medium text-slate-500">No activity yet</p>
        <p className="text-xs text-slate-400 mt-1">Activity will appear here as changes are made.</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {activities.map((activity) => (
        <ActivityItem key={activity._id} activity={activity} />
      ))}
    </div>
  );
}
