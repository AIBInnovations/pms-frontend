import { useState, useEffect } from 'react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import { reportService } from '../../services';
import { Badge, Skeleton } from '../../components/ui';

const STAGE_COLORS = {
  backlog: '#94a3b8',
  todo: '#64748b',
  in_progress: '#3b82f6',
  in_review: '#f59e0b',
  testing: '#a78bfa',
  done: '#22c55e',
  archived: '#cbd5e1',
};
const STAGE_LABELS = {
  backlog: 'Backlog', todo: 'To Do', in_progress: 'In Progress',
  in_review: 'In Review', testing: 'Testing', done: 'Done', archived: 'Archived',
};

const PRIORITY_COLORS = {
  critical: '#ef4444', high: '#f97316', medium: '#f59e0b', low: '#22c55e',
};
const PRIORITY_LABELS = {
  critical: 'Critical', high: 'High', medium: 'Medium', low: 'Low',
};

const PROJECT_STATUS_COLORS = {
  active: 'success', on_hold: 'warning', completed: 'primary', cancelled: 'danger', planning: 'default',
};
const PROJECT_STATUS_LABELS = {
  active: 'Active', on_hold: 'On Hold', completed: 'Completed', cancelled: 'Cancelled', planning: 'Planning',
};

function StatCard({ label, value, hint, accent }) {
  return (
    <div className={`rounded-2xl border p-5 ${accent
      ? 'bg-primary-600 border-primary-600'
      : 'bg-white dark:bg-slate-800 border-slate-200/60 dark:border-slate-700/60'}`}>
      <p className={`text-xs font-medium mb-1 ${accent ? 'text-primary-200' : 'text-slate-400'}`}>{label}</p>
      <p className={`text-4xl font-extrabold tracking-tight ${accent ? 'text-white' : 'text-slate-900 dark:text-slate-100'}`}>{value}</p>
      {hint && <p className={`text-xs mt-1 ${accent ? 'text-primary-200' : 'text-slate-400'}`}>{hint}</p>}
    </div>
  );
}

function PieTooltip({ active, payload }) {
  if (active && payload?.length) {
    const { name, value, fill } = payload[0];
    return (
      <div className="rounded-xl border border-slate-200/60 dark:border-slate-700/60 bg-white dark:bg-slate-800 px-3 py-2 shadow-lg">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: fill }} />
          <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{name}</span>
        </div>
        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 mt-0.5">{value}</p>
      </div>
    );
  }
  return null;
}

function BarTooltip({ active, payload, label }) {
  if (active && payload?.length) {
    return (
      <div className="rounded-xl border border-slate-200/60 dark:border-slate-700/60 bg-white dark:bg-slate-800 px-3 py-2 shadow-lg">
        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">{label}</p>
        {payload.map((p, i) => (
          <p key={i} className="text-sm text-slate-900 dark:text-slate-100">
            <span style={{ color: p.fill }}>{p.name}</span>: {p.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
}

export default function OrgOverviewReport() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await reportService.orgOverview();
      setData(res.data);
    } catch {
      setError('Failed to load organisation overview');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-2xl border border-slate-200/60 bg-white dark:bg-slate-800 dark:border-slate-700/60 p-5">
              <Skeleton className="h-3 w-20 mb-2" />
              <Skeleton className="h-10 w-16" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="rounded-2xl border border-slate-200/60 dark:border-slate-700/60 bg-white dark:bg-slate-800 p-5">
            <Skeleton className="h-4 w-32 mb-4" />
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
          <div className="rounded-2xl border border-slate-200/60 dark:border-slate-700/60 bg-white dark:bg-slate-800 p-5">
            <Skeleton className="h-4 w-32 mb-4" />
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-slate-200/60 dark:border-slate-700/60 bg-white dark:bg-slate-800 p-5">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-sm text-red-500">{error}</p>
          <button onClick={fetchData} className="text-sm text-primary-600 hover:text-primary-700 font-medium mt-2">Try again</button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  // Chart data prep
  const stageChartData = (data.tasksByStage || []).map((s) => ({
    name: STAGE_LABELS[s._id] || s._id,
    value: s.count,
    fill: STAGE_COLORS[s._id] || '#94a3b8',
  }));

  const priorityChartData = Object.entries(PRIORITY_LABELS).map(([key, label]) => ({
    name: label,
    value: data.tasksByPriority?.find((p) => p._id === key)?.count || 0,
    fill: PRIORITY_COLORS[key],
  })).filter((d) => d.value > 0);

  const projectStatusChartData = (data.projectsByStatus || []).map((s) => ({
    name: PROJECT_STATUS_LABELS[s._id] || s._id,
    value: s.count,
    fill: s._id === 'active' ? '#22c55e'
      : s._id === 'completed' ? '#3b82f6'
      : s._id === 'on_hold' ? '#f59e0b'
      : s._id === 'cancelled' ? '#ef4444'
      : '#94a3b8',
  }));

  const projectHealthData = (data.projectHealth || []).slice(0, 10).map((p) => ({
    name: p.name.length > 20 ? p.name.slice(0, 18) + '…' : p.name,
    Tasks: p.totalTasks,
    Done: p.completedTasks,
  }));

  return (
    <div className="space-y-5">
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Projects" value={data.totalProjects} hint={`Across all statuses`} accent />
        <StatCard label="Total Tasks" value={data.totalTasks} hint={`${data.doneTasks} completed`} />
        <StatCard label="Org Completion" value={`${data.completionRate}%`} hint="Tasks marked done" />
        <StatCard label="Open Bugs" value={data.openBugs} hint={data.openBugs ? 'Needs attention' : 'All clear'} />
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Tasks by stage */}
        <div className="rounded-2xl border border-slate-200/60 dark:border-slate-700/60 bg-white dark:bg-slate-800 p-5">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4">Tasks by Stage</h3>
          {stageChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={stageChartData} cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={3} dataKey="value" nameKey="name" stroke="none">
                  {stageChartData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Pie>
                <Tooltip content={<PieTooltip />} />
                <Legend verticalAlign="bottom" iconType="circle" iconSize={7}
                  formatter={(v) => <span className="text-xs text-slate-500 dark:text-slate-400">{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-60 text-sm text-slate-400">No data</div>
          )}
        </div>

        {/* Projects by status */}
        <div className="rounded-2xl border border-slate-200/60 dark:border-slate-700/60 bg-white dark:bg-slate-800 p-5">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4">Projects by Status</h3>
          {projectStatusChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={projectStatusChartData} cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={3} dataKey="value" nameKey="name" stroke="none">
                  {projectStatusChartData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Pie>
                <Tooltip content={<PieTooltip />} />
                <Legend verticalAlign="bottom" iconType="circle" iconSize={7}
                  formatter={(v) => <span className="text-xs text-slate-500 dark:text-slate-400">{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-60 text-sm text-slate-400">No data</div>
          )}
        </div>

        {/* Task priority distribution */}
        <div className="rounded-2xl border border-slate-200/60 dark:border-slate-700/60 bg-white dark:bg-slate-800 p-5">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4">Tasks by Priority</h3>
          {priorityChartData.length > 0 ? (
            <div className="space-y-3 mt-2">
              {Object.entries(PRIORITY_LABELS).map(([key, label]) => {
                const count = data.tasksByPriority?.find((p) => p._id === key)?.count || 0;
                const pct = data.totalTasks > 0 ? Math.round((count / data.totalTasks) * 100) : 0;
                return (
                  <div key={key}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-medium" style={{ color: PRIORITY_COLORS[key] }}>{label}</span>
                      <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">{count} <span className="text-slate-400 font-normal">({pct}%)</span></span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-700">
                      <div className="h-1.5 rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: PRIORITY_COLORS[key] }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center justify-center h-60 text-sm text-slate-400">No data</div>
          )}
        </div>
      </div>

      {/* Project health bar chart */}
      {projectHealthData.length > 0 && (
        <div className="rounded-2xl border border-slate-200/60 dark:border-slate-700/60 bg-white dark:bg-slate-800 p-5">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4">Project Task Overview (Top 10)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={projectHealthData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<BarTooltip />} cursor={{ fill: 'rgba(148,163,184,0.08)' }} />
              <Legend iconType="circle" iconSize={7}
                formatter={(v) => <span className="text-xs text-slate-500 dark:text-slate-400">{v}</span>} />
              <Bar dataKey="Tasks" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={32} />
              <Bar dataKey="Done" fill="#22c55e" radius={[4, 4, 0, 0]} maxBarSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Projects health table */}
      <div className="rounded-2xl border border-slate-200/60 dark:border-slate-700/60 bg-white dark:bg-slate-800 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">All Projects Health</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
                <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider px-5 py-3">Project</th>
                <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider px-5 py-3">Status</th>
                <th className="text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider px-5 py-3">Total Tasks</th>
                <th className="text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider px-5 py-3">Completed</th>
                <th className="text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider px-5 py-3">Open Bugs</th>
                <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider px-5 py-3 min-w-[140px]">Completion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {(data.projectHealth || []).length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-sm text-slate-400">No projects found</td>
                </tr>
              ) : (
                (data.projectHealth || []).map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="px-5 py-3.5">
                      <div>
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{p.name}</p>
                        {p.code && <p className="text-xs font-mono text-slate-400">{p.code}</p>}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge size="sm" color={PROJECT_STATUS_COLORS[p.status] || 'default'} dot>
                        {PROJECT_STATUS_LABELS[p.status] || p.status}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5 text-right text-sm text-slate-700 dark:text-slate-300 font-semibold">{p.totalTasks}</td>
                    <td className="px-5 py-3.5 text-right text-sm text-emerald-600 font-semibold">{p.completedTasks}</td>
                    <td className="px-5 py-3.5 text-right text-sm font-semibold">
                      <span className={p.openBugs > 0 ? 'text-red-500' : 'text-slate-400'}>{p.openBugs}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full bg-slate-100 dark:bg-slate-700">
                          <div
                            className="h-1.5 rounded-full bg-primary-500 transition-all duration-500"
                            style={{ width: `${p.completionRate}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 w-10 text-right">{p.completionRate}%</span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
