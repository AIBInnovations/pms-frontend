import { useState, useEffect, useCallback } from 'react';
import { PieChart, Pie, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';
import { reportService } from '../../services';
import { Skeleton } from '../../components/ui';

const SEVERITY_COLORS = {
  critical: '#ef4444',
  major: '#f97316',
  minor: '#3b82f6',
  trivial: '#94a3b8',
};

const SEVERITY_LABELS = {
  critical: 'Critical',
  major: 'Major',
  minor: 'Minor',
  trivial: 'Trivial',
};

const STATUS_COLORS = {
  open: '#ef4444',
  in_progress: '#3b82f6',
  fixed: '#eab308',
  verified: '#22c55e',
  closed: '#94a3b8',
  reopened: '#f97316',
  wont_fix: '#64748b',
};

const STATUS_LABELS = {
  open: 'Open',
  in_progress: 'In Progress',
  fixed: 'Fixed',
  verified: 'Verified',
  closed: 'Closed',
  reopened: 'Reopened',
  wont_fix: "Won't Fix",
};

function SeverityTooltip({ active, payload }) {
  if (active && payload?.length) {
    const { name, value, fill } = payload[0];
    return (
      <div className="rounded-xl border border-slate-200/60 dark:border-slate-700/60 bg-white dark:bg-slate-800 px-3 py-2 shadow-lg">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: fill }} />
          <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{name}</span>
        </div>
        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 mt-0.5">{value} bugs</p>
      </div>
    );
  }
  return null;
}

function StatusTooltip({ active, payload }) {
  if (active && payload?.length) {
    const { name, count, fill } = payload[0].payload;
    return (
      <div className="rounded-xl border border-slate-200/60 dark:border-slate-700/60 bg-white dark:bg-slate-800 px-3 py-2 shadow-lg">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: fill }} />
          <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{name}</span>
        </div>
        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 mt-0.5">{count} bugs</p>
      </div>
    );
  }
  return null;
}

export default function BugSummaryReport({ project }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    if (!project) return;
    setLoading(true);
    setError(null);
    try {
      const res = await reportService.bugSummary({ project });
      setData(res.data);
    } catch {
      setError('Failed to load bug summary report');
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
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 12.75c1.148 0 2.278.08 3.383.237 1.037.146 1.866.966 1.866 2.013 0 3.728-2.35 6.75-5.25 6.75S6.75 18.728 6.75 15c0-1.046.83-1.867 1.866-2.013A24.204 24.204 0 0112 12.75z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Select a project to view bug summary</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="rounded-2xl border border-slate-200/60 dark:border-slate-700/60 bg-white dark:bg-slate-800 p-5">
          <Skeleton className="h-4 w-32 mb-4" />
          <Skeleton className="h-72 w-full rounded-xl" />
        </div>
        <div className="rounded-2xl border border-slate-200/60 dark:border-slate-700/60 bg-white dark:bg-slate-800 p-5">
          <Skeleton className="h-4 w-32 mb-4" />
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

  const severityData = (data.bySeverity || []).map((s) => ({
    name: SEVERITY_LABELS[s._id] || s._id,
    value: s.count,
    fill: SEVERITY_COLORS[s._id] || '#94a3b8',
  }));

  const statusData = (data.byStatus || []).map((s) => ({
    name: STATUS_LABELS[s._id] || s._id,
    count: s.count,
    fill: STATUS_COLORS[s._id] || '#94a3b8',
  }));

  const hasSeverity = severityData.length > 0;
  const hasStatus = statusData.length > 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {/* Severity pie chart */}
      <div className="rounded-2xl border border-slate-200/60 dark:border-slate-700/60 bg-white dark:bg-slate-800 p-5">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4">Bugs by Severity</h3>
        {hasSeverity ? (
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={severityData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={90}
                paddingAngle={3}
                dataKey="value"
                nameKey="name"
                stroke="none"
              >
                {severityData.map((entry, index) => (
                  <Cell key={`sev-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip content={<SeverityTooltip />} />
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
            No severity data available
          </div>
        )}
      </div>

      {/* Status bar chart */}
      <div className="rounded-2xl border border-slate-200/60 dark:border-slate-700/60 bg-white dark:bg-slate-800 p-5">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4">Bugs by Status</h3>
        {hasStatus ? (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={statusData} margin={{ left: 0, right: 10, top: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
                interval={0}
                angle={-25}
                textAnchor="end"
                height={50}
              />
              <YAxis
                tick={{ fontSize: 12, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip content={<StatusTooltip />} cursor={{ fill: '#f1f5f9' }} />
              <Bar dataKey="count" radius={[6, 6, 0, 0]} barSize={32}>
                {statusData.map((entry, index) => (
                  <Cell key={`status-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-72 text-sm text-slate-400">
            No status data available
          </div>
        )}
      </div>
    </div>
  );
}
