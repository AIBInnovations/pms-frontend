import { useState, useEffect } from 'react';
import { taskService } from '../../services';
import { Avatar, Badge, Skeleton, EmptyState } from '../../components/ui';
import { TASK_PRIORITIES, TASK_PRIORITY_COLORS, TASK_STAGES, TASK_STAGE_COLORS } from '../../utils/constants';

export default function WorkloadView({ projectId }) {
  const [workload, setWorkload] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    taskService
      .getWorkload(projectId)
      .then((res) => setWorkload(res.data || []))
      .catch(() => setWorkload([]))
      .finally(() => setLoading(false));
  }, [projectId]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="card p-5 space-y-4">
            <div className="flex items-center gap-3">
              <Skeleton variant="avatar" />
              <div className="flex-1 space-y-2">
                <Skeleton variant="text" className="w-1/2" />
                <Skeleton variant="text" className="w-3/4" />
              </div>
            </div>
            <Skeleton variant="text" />
            <Skeleton variant="text" className="w-2/3" />
          </div>
        ))}
      </div>
    );
  }

  if (workload.length === 0) {
    return (
      <EmptyState
        title="No workload data"
        description="No active tasks with assignees found."
      />
    );
  }

  const maxTasks = Math.max(...workload.map((w) => w.totalTasks), 1);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {workload.map((entry) => {
        const priorityCounts = {};
        for (const p of entry.priorities) {
          priorityCounts[p] = (priorityCounts[p] || 0) + 1;
        }
        const stageCounts = {};
        for (const s of entry.stages || []) {
          stageCounts[s] = (stageCounts[s] || 0) + 1;
        }

        return (
          <div key={entry._id} className="card p-5">
            {/* User info */}
            <div className="flex items-center gap-3 mb-4">
              <Avatar
                name={entry.user.name}
                src={entry.user.avatar}
                size="md"
              />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                  {entry.user.name}
                </p>
                <p className="text-xs text-slate-400 truncate">
                  {entry.user.email}
                </p>
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-6 mb-4">
              <div>
                <p className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  {entry.totalTasks}
                </p>
                <p className="text-xs text-slate-400">Tasks</p>
              </div>
              <div>
                <p className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  {entry.totalEstimatedHours}
                </p>
                <p className="text-xs text-slate-400">Est. Hours</p>
              </div>
            </div>

            {/* Proportional bar */}
            <div className="h-2 rounded-full bg-primary-100 mb-4">
              <div
                className="h-2 rounded-full bg-primary-500 transition-all duration-300"
                style={{ width: `${(entry.totalTasks / maxTasks) * 100}%` }}
              />
            </div>

            {/* Stage breakdown */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              {Object.entries(stageCounts).map(([stage, count]) => (
                <Badge
                  key={stage}
                  size="sm"
                  color={TASK_STAGE_COLORS[stage] || 'default'}
                  dot
                >
                  {TASK_STAGES[stage] || stage} {count}
                </Badge>
              ))}
            </div>

            {/* Priority breakdown */}
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(priorityCounts).map(([priority, count]) => (
                <Badge
                  key={priority}
                  size="sm"
                  color={TASK_PRIORITY_COLORS[priority] || 'default'}
                >
                  {TASK_PRIORITIES[priority] || priority} {count}
                </Badge>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
