import { useState, useMemo } from 'react';
import { Button, Skeleton } from '../../components/ui';
import { TASK_PRIORITY_COLORS } from '../../utils/constants';

const PRIORITY_HEX = {
  danger: '#ef4444',
  warning: '#f59e0b',
  primary: '#3b82f6',
  default: '#94a3b8',
};

function getPriorityColor(priority) {
  const colorKey = TASK_PRIORITY_COLORS[priority] || 'default';
  return PRIORITY_HEX[colorKey] || PRIORITY_HEX.default;
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function CalendarSkeleton() {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-2">
        <Skeleton variant="title" className="w-40" />
        <div className="flex gap-2">
          <Skeleton variant="button" className="w-20" />
          <Skeleton variant="button" className="w-20" />
        </div>
      </div>
      <div className="rounded-2xl border border-slate-200/60 dark:border-slate-700/60 bg-white dark:bg-slate-800 overflow-hidden">
        <div className="grid grid-cols-7 border-b border-slate-100 dark:border-slate-700">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="px-3 py-2.5">
              <Skeleton variant="text" className="w-8" />
            </div>
          ))}
        </div>
        {Array.from({ length: 5 }).map((_, row) => (
          <div key={row} className="grid grid-cols-7">
            {Array.from({ length: 7 }).map((_, col) => (
              <div key={col} className="border border-slate-100 dark:border-slate-700 p-2 min-h-[100px]">
                <Skeleton variant="text" className="w-6 mb-2" />
                {col % 3 === 0 && <Skeleton variant="text" className="w-full h-5 rounded" />}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function CalendarView({ tasks, loading, onTaskClick }) {
  const [monthOffset, setMonthOffset] = useState(0);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const currentMonth = useMemo(() => {
    const d = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
    return d;
  }, [today, monthOffset]);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  // Build calendar grid
  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // getDay() returns 0=Sunday. We want Monday=0.
    let startWeekday = firstDay.getDay() - 1;
    if (startWeekday < 0) startWeekday = 6;

    const days = [];

    // Previous month padding
    for (let i = startWeekday - 1; i >= 0; i--) {
      const d = new Date(year, month, -i);
      days.push({ date: d, isCurrentMonth: false });
    }

    // Current month days
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push({ date: new Date(year, month, i), isCurrentMonth: true });
    }

    // Next month padding to fill 6 rows
    const remaining = 42 - days.length; // 6 rows x 7
    for (let i = 1; i <= remaining; i++) {
      days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
    }

    return days;
  }, [year, month]);

  // Group tasks by dueDate
  const tasksByDate = useMemo(() => {
    const map = {};
    if (!tasks) return map;
    for (const task of tasks) {
      if (!task.dueDate) continue;
      const d = new Date(task.dueDate);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (!map[key]) map[key] = [];
      map[key].push(task);
    }
    return map;
  }, [tasks]);

  const dateKey = (d) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

  const isToday = (d) =>
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate();

  const monthLabel = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // Split into rows of 7
  const weeks = [];
  for (let i = 0; i < calendarDays.length; i += 7) {
    weeks.push(calendarDays.slice(i, i + 7));
  }

  if (loading) {
    return <CalendarSkeleton />;
  }

  return (
    <div className="space-y-3 animate-fade-in">
      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">{monthLabel}</h2>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => setMonthOffset((m) => m - 1)}>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            Prev
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setMonthOffset(0)}>
            Today
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setMonthOffset((m) => m + 1)}>
            Next
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </Button>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="rounded-2xl border border-slate-200/60 dark:border-slate-700/60 bg-white dark:bg-slate-800 overflow-hidden">
        {/* Weekday header */}
        <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-600 bg-slate-50/50 dark:bg-slate-800/50">
          {WEEKDAYS.map((day) => (
            <div key={day} className="px-3 py-2.5 text-xs font-semibold text-slate-500 dark:text-slate-400 text-center">
              {day}
            </div>
          ))}
        </div>

        {/* Weeks */}
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7">
            {week.map((cell, di) => {
              const key = dateKey(cell.date);
              const dayTasks = tasksByDate[key] || [];
              const todayCell = isToday(cell.date);
              const maxChips = 3;
              const overflow = dayTasks.length - maxChips;

              return (
                <div
                  key={di}
                  className={`border border-slate-100 dark:border-slate-700 p-1.5 min-h-[100px] transition-colors ${
                    cell.isCurrentMonth ? 'bg-white dark:bg-slate-800' : 'bg-slate-50/40 dark:bg-slate-800/50'
                  } ${todayCell ? 'ring-2 ring-inset ring-primary-400/50 bg-primary-50/20' : ''}`}
                >
                  {/* Day number */}
                  <div className="flex items-center justify-end mb-1">
                    <span
                      className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full ${
                        todayCell
                          ? 'bg-primary-600 text-white'
                          : cell.isCurrentMonth
                            ? 'text-slate-700 dark:text-slate-300'
                            : 'text-slate-300 dark:text-slate-600'
                      }`}
                    >
                      {cell.date.getDate()}
                    </span>
                  </div>

                  {/* Task chips */}
                  <div className="space-y-0.5">
                    {dayTasks.slice(0, maxChips).map((task) => (
                      <button
                        key={task._id}
                        onClick={() => onTaskClick?.(task._id)}
                        className="w-full text-left px-1.5 py-0.5 rounded text-[11px] font-medium truncate block hover:opacity-80 transition-opacity cursor-pointer"
                        style={{
                          backgroundColor: getPriorityColor(task.priority) + '18',
                          color: getPriorityColor(task.priority),
                          borderLeft: `2px solid ${getPriorityColor(task.priority)}`,
                        }}
                        title={task.title}
                      >
                        {task.title}
                      </button>
                    ))}
                    {overflow > 0 && (
                      <span className="text-[10px] text-slate-400 font-medium px-1.5">
                        +{overflow} more
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
