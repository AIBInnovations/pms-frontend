import { useState, useEffect, useCallback } from 'react';
import { PieChart, Pie, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';
import { reportService } from '../../services';
import { Skeleton } from '../../components/ui';

const STAGE_COLORS = {
  backlog: '#94a3b8',
  todo: '#64748b',
  in_progress: '#3b82f6',
  in_review: '#f59e0b',
  testing: '#f59e0b',
  done: '#22c55e',
};

const STAGE_LABELS = {
  backlog: 'Backlog',
  todo: 'To Do',
  in_progress: 'In Progress',
  in_review: 'In Review',
  testing: 'Testing',
  done: 'Done',
};

function CustomTooltip({ active, payload }) {
  if (active && payload?.length) {
    const { name, value, fill } = payload[0];
    return (
      <div className="rounded-xl border border-slate-200/60 dark:border-slate-700/60 bg-white dark:bg-slate-800 px-3 py-2 shadow-lg">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: fill }} />
          <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{name}</span>
        </div>
        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 mt-0.5">{value} tasks</p>
      </div>
    );
  }
  return null;
}

export default function ProjectProgressReport({ project, startDate, endDate }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    if (!project) return;
    setLoading(true);
    setError(null);
    try {
      const params = { project };
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      const res = await reportService.projectProgress(params);
      setData(res.data);
    } catch {
      setError('Failed to load project progress report');
    } finally {
      setLoading(false);
    }
  }, [project, startDate, endDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (!project) {
    return (
      <div className="rounded-2xl border border-slate-200/60 dark:border-slate-700/60 bg-white dark:bg-slate-800 p-5">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-slate-300 dark:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Select a project to view progress</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl border border-slate-200/60 bg-white p-5">
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-8 w-16" />
            </div>
          ))}
        </div>
        <div className="rounded-2xl border border-slate-200/60 dark:border-slate-700/60 bg-white dark:bg-slate-800 p-5">
          <Skeleton className="h-4 w-40 mb-4" />
          <Skeleton className="h-72 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-slate-200/60 dark:border-slate-700/60 bg-white dark:bg-slate-800 p-5">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-sm text-danger-600">{error}</p>
          <button onClick={fetchData} className="text-sm text-primary-600 hover:text-primary-700 font-medium mt-2">
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const chartData = (data.stages || []).map((s) => ({
    name: STAGE_LABELS[s.stage] || s.stage,
    value: s.count,
    fill: STAGE_COLORS[s.stage] || '#94a3b8',
  }));

  const total = data.total || 0;
  const completed = data.completed || 0;
  const completionRate = data.completionRate != null ? data.completionRate : (total > 0 ? Math.round((completed / total) * 100) : 0);

  return (
    <div className="space-y-5">
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-200/60 dark:border-slate-700/60 bg-white dark:bg-slate-800 p-5">
          <p className="text-xs font-medium text-slate-400 mb-1">Total Tasks</p>
          <p className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">{total}</p>
        </div>
        <div className="rounded-2xl border border-slate-200/60 dark:border-slate-700/60 bg-white dark:bg-slate-800 p-5">
          <p className="text-xs font-medium text-slate-400 mb-1">Completed</p>
          <p className="text-3xl font-extrabold text-emerald-600 tracking-tight">{completed}</p>
        </div>
        <div className="rounded-2xl border border-slate-200/60 dark:border-slate-700/60 bg-white dark:bg-slate-800 p-5">
          <p className="text-xs font-medium text-slate-400 mb-1">Completion Rate</p>
          <div className="flex items-end gap-2">
            <p className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">{completionRate}%</p>
          </div>
          <div className="mt-2.5 h-2 w-full rounded-full bg-slate-100 dark:bg-slate-700">
            <div
              className="h-2 rounded-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${Math.min(completionRate, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Pie chart */}
      <div className="rounded-2xl border border-slate-200/60 dark:border-slate-700/60 bg-white dark:bg-slate-800 p-5">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4">Tasks by Stage</h3>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={3}
                dataKey="value"
                nameKey="name"
                stroke="none"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="bottom"
                iconType="circle"
                iconSize={8}
                formatter={(value) => <span className="text-xs text-slate-600 dark:text-slate-400">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-72 text-sm text-slate-400">
            No task data available
          </div>
        )}
      </div>
    </div>
  );
}
