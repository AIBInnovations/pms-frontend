import { useState, useEffect, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts';
import { attendanceService } from '../../services';
import { useToast } from '../../components/ui/Toast';
import { Avatar, Badge, Skeleton } from '../../components/ui';

function fmtTime(d) {
  if (!d) return '—';
  return new Date(d).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function fmtMinutesAsTime(mins) {
  if (mins == null) return '—';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const period = h >= 12 ? 'PM' : 'AM';
  const hr = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${hr}:${String(m).padStart(2, '0')} ${period}`;
}

function hoursBetween(a, b) {
  if (!a || !b) return 0;
  return (new Date(b) - new Date(a)) / (1000 * 60 * 60);
}

function monthOptions() {
  const opts = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    opts.push({
      value: d.toISOString().slice(0, 7),
      label: d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    });
  }
  return opts;
}

function KpiCard({ label, value, sub, tone = 'default' }) {
  const tones = {
    default: 'text-slate-900 dark:text-slate-100',
    success: 'text-emerald-600',
    warning: 'text-amber-600',
    danger: 'text-red-600',
    primary: 'text-primary-600',
  };
  return (
    <div className="card p-3">
      <p className="text-[10px] text-slate-500 uppercase">{label}</p>
      <p className={`text-xl font-bold ${tones[tone]}`}>{value}</p>
      {sub && <p className="text-[10px] text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
}

function MonthCalendar({ month, records }) {
  const [y, m] = month.split('-').map(Number);
  const firstDay = new Date(y, m - 1, 1);
  const daysInMonth = new Date(y, m, 0).getDate();
  const startWeekday = firstDay.getDay();
  const cells = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const byDay = {};
  for (const r of records) {
    const d = parseInt(r.date.slice(-2), 10);
    byDay[d] = r;
  }

  const today = new Date();
  const todayDay = (today.getFullYear() === y && today.getMonth() + 1 === m) ? today.getDate() : null;

  const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <div>
      <div className="grid grid-cols-7 gap-1 mb-1">
        {WEEKDAYS.map((d, i) => (
          <div key={i} className="text-[10px] font-medium text-slate-400 text-center">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((d, i) => {
          if (!d) return <div key={i} />;
          const rec = byDay[d];
          const isWeekend = new Date(y, m - 1, d).getDay() === 0 || new Date(y, m - 1, d).getDay() === 6;
          let cls = 'bg-slate-100 dark:bg-slate-800 text-slate-400';
          let title = 'Absent';
          if (rec) {
            if (rec.isSuspicious) { cls = 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'; title = 'Suspicious'; }
            else if (!rec.checkOut) { cls = 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'; title = 'No check-out'; }
            else { cls = 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'; title = 'Present'; }
          } else if (isWeekend) {
            cls = 'bg-slate-50 dark:bg-slate-900 text-slate-300';
            title = 'Weekend';
          }
          const isToday = d === todayDay;
          return (
            <div
              key={i}
              title={title}
              className={`aspect-square rounded flex items-center justify-center text-xs font-medium ${cls} ${isToday ? 'ring-2 ring-primary-500' : ''}`}
            >
              {d}
            </div>
          );
        })}
      </div>
      <div className="flex gap-3 mt-3 text-[10px] text-slate-500">
        <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-400" /> Present</div>
        <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-amber-400" /> Suspicious</div>
        <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-blue-400" /> No check-out</div>
        <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-slate-200" /> Absent</div>
      </div>
    </div>
  );
}

export default function UserAttendanceDrawer({ user, isOpen, onClose, initialMonth }) {
  const toast = useToast();
  const [month, setMonth] = useState(initialMonth || new Date().toISOString().slice(0, 7));
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user?._id) return;
    setLoading(true);
    try {
      const res = await attendanceService.getSummary({ userId: user._id, month });
      setSummary(res.data);
    } catch {
      toast.error('Failed to load attendance analytics');
    } finally {
      setLoading(false);
    }
  }, [user?._id, month, toast]);

  useEffect(() => {
    if (isOpen && user?._id) fetchData();
  }, [isOpen, user?._id, fetchData]);

  useEffect(() => {
    if (isOpen) setMonth(initialMonth || new Date().toISOString().slice(0, 7));
  }, [isOpen, initialMonth]);

  if (!isOpen || !user) return null;

  const records = summary?.records || [];
  const chartData = records.map((r) => ({
    day: parseInt(r.date.slice(-2), 10),
    hours: r.checkIn && r.checkOut ? Math.round(hoursBetween(r.checkIn, r.checkOut) * 100) / 100 : 0,
  }));

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-slate-900/30" onClick={onClose} />
      <aside className="relative ml-auto w-full max-w-2xl h-full bg-white dark:bg-slate-900 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar name={user.name} src={user.avatar} size="md" />
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 truncate">{user.name}</h2>
              <p className="text-xs text-slate-500 truncate">{user.email}</p>
              {user.role && <Badge size="sm" color="default">{user.role.replace(/_/g, ' ')}</Badge>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1.5 text-xs"
            >
              {monthOptions().map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {loading || !summary ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} variant="card" className="h-24" />)}
            </div>
          ) : (
            <>
              {/* KPI grid */}
              <div className="grid grid-cols-3 gap-2">
                <KpiCard label="Present Days" value={summary.presentDays} tone="primary" />
                <KpiCard label="Total Hours" value={summary.totalHours} sub="hrs" tone="success" />
                <KpiCard label="Avg / Day" value={summary.avgHours} sub="hrs" />
                <KpiCard label="Late Arrivals" value={summary.lateArrivals} sub="after 10 AM" tone={summary.lateArrivals > 0 ? 'warning' : 'default'} />
                <KpiCard label="Suspicious" value={summary.suspiciousDays} tone={summary.suspiciousDays > 0 ? 'danger' : 'default'} />
                <KpiCard label="Avg Check-In" value={fmtMinutesAsTime(summary.avgCheckInMinutes)} />
              </div>

              {/* Secondary stats */}
              <div className="grid grid-cols-3 gap-2">
                <KpiCard label="Longest Day" value={summary.longestHours} sub="hrs" />
                <KpiCard label="Shortest Day" value={summary.shortestHours} sub="hrs" />
                <KpiCard label="Incomplete" value={summary.incompleteDays} sub="no check-out" tone={summary.incompleteDays > 0 ? 'warning' : 'default'} />
              </div>

              {/* Calendar */}
              <div className="card p-4">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">Monthly View</h3>
                <MonthCalendar month={month} records={records} />
              </div>

              {/* Hours trend */}
              {records.length > 0 && (
                <div className="card p-4">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">Daily Hours</h3>
                  <div style={{ width: '100%', height: 200 }}>
                    <ResponsiveContainer>
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip formatter={(v) => `${v} hrs`} labelFormatter={(d) => `Day ${d}`} />
                        <ReferenceLine y={8} stroke="#94a3b8" strokeDasharray="3 3" />
                        <Line type="monotone" dataKey="hours" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Records table */}
              <div className="card p-4">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">Attendance Log</h3>
                {records.length === 0 ? (
                  <p className="text-sm text-slate-400">No check-ins this month.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-xs text-slate-500 uppercase border-b border-slate-100 dark:border-slate-800">
                          <th className="py-2">Date</th>
                          <th className="py-2">In</th>
                          <th className="py-2">Out</th>
                          <th className="py-2 text-right">Hours</th>
                          <th className="py-2">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {records.map((r) => {
                          const hrs = r.checkIn && r.checkOut ? Math.round(hoursBetween(r.checkIn, r.checkOut) * 100) / 100 : null;
                          const d = new Date(r.date);
                          const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                          return (
                            <tr key={r._id}>
                              <td className="py-2 text-slate-700 dark:text-slate-300">{dayLabel}</td>
                              <td className="py-2 text-slate-600 dark:text-slate-400">{fmtTime(r.checkIn)}</td>
                              <td className="py-2 text-slate-600 dark:text-slate-400">{fmtTime(r.checkOut)}</td>
                              <td className="py-2 text-right font-medium text-slate-700 dark:text-slate-300">
                                {hrs != null ? `${hrs} hrs` : '—'}
                              </td>
                              <td className="py-2">
                                {r.isSuspicious ? (
                                  <Badge size="sm" color="warning" title={r.suspiciousReason}>Suspicious</Badge>
                                ) : !r.checkOut ? (
                                  <Badge size="sm" color="primary">Open</Badge>
                                ) : (
                                  <Badge size="sm" color="success">Normal</Badge>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </aside>
    </div>
  );
}
