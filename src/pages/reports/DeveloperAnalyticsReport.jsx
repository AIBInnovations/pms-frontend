import { useState, useEffect, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { reportService } from '../../services';
import { Avatar, Badge, Skeleton } from '../../components/ui';

function formatHours(hours) {
  if (hours === null || hours === undefined) return '-';
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  const remaining = Math.round(hours % 24);
  return remaining > 0 ? `${days}d ${remaining}h` : `${days}d`;
}

function MetricCard({ label, value, sub, color = 'slate' }) {
  const colorMap = {
    green: 'text-emerald-600 dark:text-emerald-400',
    red: 'text-red-600 dark:text-red-400',
    amber: 'text-amber-600 dark:text-amber-400',
    blue: 'text-primary-600 dark:text-primary-400',
    slate: 'text-slate-900 dark:text-slate-100',
  };
  return (
    <div className="text-center">
      <p className={`text-lg font-bold ${colorMap[color]}`}>{value}</p>
      <p className="text-[11px] text-slate-400 mt-0.5">{label}</p>
      {sub && <p className="text-[10px] text-slate-400">{sub}</p>}
    </div>
  );
}

function CustomTooltip({ active, payload }) {
  if (active && payload?.length) {
    const d = payload[0].payload;
    return (
      <div className="rounded-xl border border-slate-200/60 dark:border-slate-700/60 bg-white dark:bg-slate-800 px-3 py-2 shadow-lg">
        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{d.name}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">First Pass Rate: {d.firstPassRate}%</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">Review Bounces: {d.reviewBounces}</p>
      </div>
    );
  }
  return null;
}

function TaskDetailRow({ task }) {
  const stageColors = {
    done: 'text-emerald-600',
    in_review: 'text-blue-600',
    in_progress: 'text-amber-600',
    testing: 'text-purple-600',
    todo: 'text-slate-600',
    backlog: 'text-slate-400',
  };
  return (
    <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-700/50 transition-colors text-xs">
      <td className="py-2 pr-3">
        <span className="font-mono text-slate-400">{task.taskId}</span>
      </td>
      <td className="py-2 pr-3">
        <span className="text-slate-700 dark:text-slate-300 line-clamp-1">{task.title}</span>
      </td>
      <td className="py-2 pr-3">
        <span className="text-slate-400">{task.project?.name || '-'}</span>
      </td>
      <td className="py-2 pr-3 text-center">
        <span className={stageColors[task.stage] || 'text-slate-400'}>{task.stage?.replace('_', ' ')}</span>
      </td>
      <td className="py-2 pr-3 text-center">
        <span className={task.reviewBounces > 0 ? 'text-red-500 font-semibold' : 'text-slate-400'}>
          {task.reviewBounces}
        </span>
      </td>
      <td className="py-2 pr-3 text-center">
        <span className="text-slate-500">{task.reviewCycles}</span>
      </td>
      <td className="py-2 pr-3 text-center">
        {task.isFirstPass ? (
          <span className="text-emerald-500">Yes</span>
        ) : task.stage === 'done' ? (
          <span className="text-red-400">No</span>
        ) : (
          <span className="text-slate-300">-</span>
        )}
      </td>
      <td className="py-2 text-right">
        <span className="text-slate-400">{task.completionTimeMs ? formatHours(Math.round((task.completionTimeMs / (1000 * 60 * 60)) * 10) / 10) : '-'}</span>
      </td>
    </tr>
  );
}

export default function DeveloperAnalyticsReport({ project }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedDev, setExpandedDev] = useState(null);

  const fetchData = useCallback(async () => {
    if (!project) return;
    setLoading(true);
    setError(null);
    try {
      const res = await reportService.developerAnalytics({ project });
      setData(res.data || []);
    } catch {
      setError('Failed to load developer analytics');
    } finally {
      setLoading(false);
    }
  }, [project]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (!project) {
    return (
      <div className="rounded-2xl border border-slate-200/60 dark:border-slate-700/60 bg-white dark:bg-slate-800 p-5">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-slate-300 dark:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Select a project to view developer analytics</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="rounded-2xl border border-slate-200/60 dark:border-slate-700/60 bg-white dark:bg-slate-800 p-5">
          <Skeleton className="h-4 w-48 mb-4" />
          <Skeleton className="h-72 w-full rounded-xl" />
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-2xl border border-slate-200/60 dark:border-slate-700/60 bg-white dark:bg-slate-800 p-5">
            <div className="flex items-center gap-3">
              <Skeleton variant="avatar" />
              <Skeleton className="h-4 flex-1" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-slate-200/60 dark:border-slate-700/60 bg-white dark:bg-slate-800 p-5">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-sm text-danger-600">{error}</p>
          <button onClick={fetchData} className="text-sm text-primary-600 hover:text-primary-700 font-medium mt-2">Try again</button>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200/60 dark:border-slate-700/60 bg-white dark:bg-slate-800 p-5">
        <div className="flex items-center justify-center py-16 text-sm text-slate-400">
          No developer data available for this project
        </div>
      </div>
    );
  }

  // Chart data: first pass rate per developer
  const chartData = data.map((d) => ({
    name: d.user?.name || 'Unknown',
    firstPassRate: d.firstPassRate,
    reviewBounces: d.reviewBounces,
  }));

  const barColors = chartData.map((d) =>
    d.firstPassRate >= 80 ? '#10b981' : d.firstPassRate >= 50 ? '#f59e0b' : '#ef4444'
  );

  return (
    <div className="space-y-5">
      {/* First Pass Rate Chart */}
      <div className="rounded-2xl border border-slate-200/60 dark:border-slate-700/60 bg-white dark:bg-slate-800 p-5">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-1">First-Pass Completion Rate</h3>
        <p className="text-xs text-slate-400 mb-4">Tasks completed on first review without being sent back</p>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={Math.max(200, chartData.length * 44)}>
            <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 20, top: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} unit="%" />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: '#475569' }} width={100} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f1f5f9' }} />
              <Bar dataKey="firstPassRate" radius={[0, 6, 6, 0]} barSize={24}>
                {chartData.map((_, i) => (
                  <Cell key={i} fill={barColors[i]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : null}
      </div>

      {/* Developer Cards */}
      {data.map((dev) => {
        const isExpanded = expandedDev === dev.user._id;
        return (
          <div key={dev.user._id} className="rounded-2xl border border-slate-200/60 dark:border-slate-700/60 bg-white dark:bg-slate-800 overflow-hidden">
            {/* Summary row */}
            <button
              onClick={() => setExpandedDev(isExpanded ? null : dev.user._id)}
              className="w-full text-left p-5 hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors"
            >
              <div className="flex items-center gap-4">
                <Avatar name={dev.user.name} src={dev.user.avatar} size="md" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{dev.user.name}</p>
                  <p className="text-xs text-slate-400 truncate">{dev.user.email}</p>
                </div>
                <div className="flex items-center gap-6 flex-shrink-0">
                  <MetricCard label="Tasks" value={dev.totalTasks} />
                  <MetricCard label="Completed" value={`${dev.completionRate}%`} color={dev.completionRate >= 70 ? 'green' : dev.completionRate >= 40 ? 'amber' : 'red'} />
                  <MetricCard label="First Pass" value={`${dev.firstPassRate}%`} color={dev.firstPassRate >= 80 ? 'green' : dev.firstPassRate >= 50 ? 'amber' : 'red'} />
                  <MetricCard label="Review Bounces" value={dev.reviewBounces} color={dev.reviewBounces === 0 ? 'green' : dev.reviewBounces <= 3 ? 'amber' : 'red'} />
                  <MetricCard label="Avg Iterations" value={dev.avgIterationsToComplete || '-'} />
                  <MetricCard label="Avg Completion" value={dev.avgCompletionTimeHours ? formatHours(dev.avgCompletionTimeHours) : '-'} />
                  <MetricCard label="Avg Dev Time" value={dev.avgDevWorkTimeHours ? formatHours(dev.avgDevWorkTimeHours) : '-'} />
                  <MetricCard label="Overdue" value={dev.overdueCompletions} color={dev.overdueCompletions === 0 ? 'green' : 'red'} />
                </div>
                <svg className={`w-5 h-5 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </div>
            </button>

            {/* Expanded task details */}
            {isExpanded && dev.taskDetails?.length > 0 && (
              <div className="border-t border-slate-100 dark:border-slate-700 px-5 pb-5">
                <div className="overflow-x-auto mt-3">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-700">
                        <th className="text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wider pb-2 pr-3">ID</th>
                        <th className="text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wider pb-2 pr-3">Title</th>
                        <th className="text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wider pb-2 pr-3">Project</th>
                        <th className="text-center text-[10px] font-semibold text-slate-400 uppercase tracking-wider pb-2 pr-3">Stage</th>
                        <th className="text-center text-[10px] font-semibold text-slate-400 uppercase tracking-wider pb-2 pr-3">Bounces</th>
                        <th className="text-center text-[10px] font-semibold text-slate-400 uppercase tracking-wider pb-2 pr-3">Reviews</th>
                        <th className="text-center text-[10px] font-semibold text-slate-400 uppercase tracking-wider pb-2 pr-3">1st Pass</th>
                        <th className="text-right text-[10px] font-semibold text-slate-400 uppercase tracking-wider pb-2">Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
                      {dev.taskDetails.map((task, idx) => (
                        <TaskDetailRow key={idx} task={task} />
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
