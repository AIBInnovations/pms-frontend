import { useState, useMemo } from 'react';
import { Button, Badge, Skeleton } from '../../components/ui';
import { TASK_STAGES, TASK_STAGE_COLORS } from '../../utils/constants';

const STAGE_HEX = {
  primary: '#3b82f6',
  warning: '#f59e0b',
  success: '#22c55e',
  default: '#94a3b8',
  danger: '#ef4444',
};

function getStageColor(stage) {
  const colorKey = TASK_STAGE_COLORS[stage] || 'default';
  return STAGE_HEX[colorKey] || STAGE_HEX.default;
}

function startOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day; // Monday as start
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function daysBetween(a, b) {
  const msPerDay = 86400000;
  return Math.round((b.getTime() - a.getTime()) / msPerDay);
}

function formatHeaderDate(date) {
  return date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });
}

function formatMonthYear(date) {
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

const COL_WIDTH = 48; // px per day column
const LABEL_WIDTH = 220; // left label column width

function GanttSkeleton() {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 mb-4">
        <Skeleton variant="button" className="w-24" />
        <Skeleton variant="button" className="w-16" />
        <Skeleton variant="button" className="w-24" />
      </div>
      <div className="rounded-2xl border border-slate-200/60 dark:border-slate-700/60 bg-white dark:bg-slate-800 overflow-hidden">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center border-b border-slate-100 dark:border-slate-700 px-4 py-3 gap-4">
            <Skeleton variant="text" className="w-44 shrink-0" />
            <Skeleton variant="text" className="flex-1 h-6 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function GanttChart({ tasks, loading }) {
  const [weekOffset, setWeekOffset] = useState(0);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const weekStart = useMemo(() => {
    return addDays(startOfWeek(today), weekOffset * 7);
  }, [today, weekOffset]);

  // Show 2 weeks (14 days) for a reasonable view
  const totalDays = 14;
  const days = useMemo(() => {
    return Array.from({ length: totalDays }, (_, i) => addDays(weekStart, i));
  }, [weekStart]);

  const weekEnd = addDays(weekStart, totalDays - 1);

  // Filter tasks that overlap the visible range
  const visibleTasks = useMemo(() => {
    if (!tasks) return [];
    return tasks.filter((task) => {
      const start = new Date(task.startDate || task.createdAt);
      const end = task.dueDate ? new Date(task.dueDate) : start;
      // Task overlaps if its range intersects the visible window
      return start <= weekEnd && end >= weekStart;
    });
  }, [tasks, weekStart, weekEnd]);

  if (loading) {
    return <GanttSkeleton />;
  }

  const isToday = (date) =>
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate();

  const isWeekend = (date) => date.getDay() === 0 || date.getDay() === 6;

  return (
    <div className="space-y-3 animate-fade-in">
      {/* Navigation */}
      <div className="flex items-center gap-2">
        <Button variant="secondary" size="sm" onClick={() => setWeekOffset((w) => w - 1)}>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Prev Week
        </Button>
        <Button variant="secondary" size="sm" onClick={() => setWeekOffset(0)}>
          Today
        </Button>
        <Button variant="secondary" size="sm" onClick={() => setWeekOffset((w) => w + 1)}>
          Next Week
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </Button>
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300 ml-3">
          {formatMonthYear(weekStart)}
        </span>
      </div>

      {/* Chart */}
      <div className="rounded-2xl border border-slate-200/60 dark:border-slate-700/60 bg-white dark:bg-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <div style={{ minWidth: LABEL_WIDTH + totalDays * COL_WIDTH }}>
            {/* Header row */}
            <div className="flex border-b border-slate-200 dark:border-slate-600 bg-slate-50/50 dark:bg-slate-800/50 sticky top-0 z-10">
              <div
                className="shrink-0 px-4 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-400 border-r border-slate-100 dark:border-slate-700"
                style={{ width: LABEL_WIDTH }}
              >
                Task
              </div>
              {days.map((day, i) => (
                <div
                  key={i}
                  className={`text-center py-2.5 text-[11px] font-medium border-r border-slate-100 dark:border-slate-700 last:border-r-0 ${
                    isToday(day)
                      ? 'bg-primary-50 text-primary-700 font-semibold'
                      : isWeekend(day)
                        ? 'text-slate-400 bg-slate-50/80 dark:bg-slate-700/50'
                        : 'text-slate-500 dark:text-slate-400'
                  }`}
                  style={{ width: COL_WIDTH }}
                >
                  {formatHeaderDate(day)}
                </div>
              ))}
            </div>

            {/* Task rows */}
            {visibleTasks.length === 0 ? (
              <div className="flex items-center justify-center py-16">
                <p className="text-sm text-slate-400">No tasks in this date range</p>
              </div>
            ) : (
              visibleTasks.map((task) => {
                const taskStart = new Date(task.startDate || task.createdAt);
                taskStart.setHours(0, 0, 0, 0);
                const hasDueDate = !!task.dueDate;
                const taskEnd = hasDueDate ? new Date(task.dueDate) : taskStart;
                taskEnd.setHours(0, 0, 0, 0);

                // Calculate bar position relative to the visible window
                const barStartOffset = Math.max(0, daysBetween(weekStart, taskStart));
                const barEndOffset = Math.min(totalDays - 1, daysBetween(weekStart, taskEnd));

                // If the task starts before the visible range, clamp to 0
                const clampedStart = Math.max(0, barStartOffset);
                const clampedEnd = Math.min(totalDays - 1, barEndOffset);

                const barLeft = clampedStart * COL_WIDTH;
                const barWidth = hasDueDate
                  ? Math.max(COL_WIDTH * 0.5, (clampedEnd - clampedStart + 1) * COL_WIDTH - 8)
                  : 0; // if no dueDate, we render a dot instead

                const color = getStageColor(task.stage);

                return (
                  <div key={task._id} className="flex border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50/40 dark:hover:bg-slate-700/50 transition-colors">
                    {/* Label */}
                    <div
                      className="shrink-0 px-4 py-2 flex items-center gap-2 border-r border-slate-100 dark:border-slate-700 min-h-[40px]"
                      style={{ width: LABEL_WIDTH }}
                    >
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: color }}
                      />
                      <span className="text-sm text-slate-800 dark:text-slate-200 truncate font-medium">{task.title}</span>
                      <Badge size="sm" color={TASK_STAGE_COLORS[task.stage]}>
                        {TASK_STAGES[task.stage]}
                      </Badge>
                    </div>

                    {/* Bar area */}
                    <div className="relative flex-1 min-h-[40px]" style={{ minWidth: totalDays * COL_WIDTH }}>
                      {/* Day grid lines */}
                      {days.map((day, i) => (
                        <div
                          key={i}
                          className={`absolute top-0 bottom-0 border-r border-slate-100 dark:border-slate-700 last:border-r-0 ${
                            isToday(day) ? 'bg-primary-50/30' : isWeekend(day) ? 'bg-slate-50/60 dark:bg-slate-700/30' : ''
                          }`}
                          style={{ left: i * COL_WIDTH, width: COL_WIDTH }}
                        />
                      ))}

                      {/* Task bar or dot */}
                      {hasDueDate ? (
                        <div
                          className="absolute top-1/2 -translate-y-1/2 rounded-md h-6 flex items-center px-2 z-[1]"
                          style={{
                            left: barLeft + 4,
                            width: barWidth,
                            backgroundColor: color,
                          }}
                          title={`${task.title} (${taskStart.toLocaleDateString()} - ${taskEnd.toLocaleDateString()})`}
                        >
                          <span className="text-[10px] text-white font-medium truncate">
                            {barWidth > 60 ? task.title : ''}
                          </span>
                        </div>
                      ) : (
                        <div
                          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full z-[1] ring-2 ring-white dark:ring-slate-800 shadow-sm"
                          style={{
                            left: barLeft + COL_WIDTH / 2 - 6,
                            backgroundColor: color,
                          }}
                          title={`${task.title} (${taskStart.toLocaleDateString()}) — no due date`}
                        />
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 px-1">
        {Object.entries(TASK_STAGES)
          .filter(([key]) => key !== 'archived')
          .map(([key, label]) => (
            <div key={key} className="flex items-center gap-1.5">
              <span
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: getStageColor(key) }}
              />
              <span className="text-xs text-slate-500 dark:text-slate-400">{label}</span>
            </div>
          ))}
      </div>
    </div>
  );
}
