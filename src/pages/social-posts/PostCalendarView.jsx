import { useState, useEffect, useCallback } from 'react';
import { socialPostService } from '../../services';
import { useToast } from '../../components/ui/Toast';
import { Skeleton } from '../../components/ui';
import { PLATFORM_MAP, STATUS_DOT } from './postConstants';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getMonthGrid(year, month) {
  // month is 1-indexed
  const firstDay = new Date(year, month - 1, 1);
  const startWeekday = firstDay.getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const cells = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month - 1, d));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function PostChip({ post, onClick }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(post); }}
      className="w-full text-left px-1.5 py-1 rounded text-[10px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-primary-400 hover:shadow-sm transition truncate flex items-center gap-1"
      title={post.title}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_DOT[post.status] || 'bg-slate-300'}`} />
      <span className="truncate flex-1">{post.title}</span>
      <span className="flex gap-0.5 shrink-0">
        {(post.platforms || []).slice(0, 3).map((p) => (
          <span key={p} className={`w-3 h-3 rounded-sm ${PLATFORM_MAP[p]?.color || 'bg-slate-400'} text-white text-[7px] flex items-center justify-center font-bold`}>
            {PLATFORM_MAP[p]?.initial?.[0] || '?'}
          </span>
        ))}
      </span>
    </button>
  );
}

export default function PostCalendarView({ refreshKey, onSelectPost, onCreateAtDate }) {
  const toast = useToast();
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedDay, setExpandedDay] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await socialPostService.getCalendar(year, month);
      setPosts(res.data || []);
    } catch {
      toast.error('Failed to load calendar');
    } finally {
      setLoading(false);
    }
  }, [year, month, toast]);

  useEffect(() => { fetchData(); }, [fetchData, refreshKey]);

  const cells = getMonthGrid(year, month);
  const monthName = new Date(year, month - 1, 1).toLocaleString('en-US', { month: 'long', year: 'numeric' });

  const postsByDay = posts.reduce((acc, p) => {
    if (!p.scheduledAt) return acc;
    const d = new Date(p.scheduledAt).getDate();
    if (!acc[d]) acc[d] = [];
    acc[d].push(p);
    return acc;
  }, {});

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(year - 1); }
    else setMonth(month - 1);
  };
  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear(year + 1); }
    else setMonth(month + 1);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          </button>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 min-w-[160px] text-center">{monthName}</h2>
          <button onClick={nextMonth} className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
        <button
          onClick={() => { setYear(today.getFullYear()); setMonth(today.getMonth() + 1); }}
          className="text-xs text-primary-600 hover:text-primary-700 font-medium"
        >
          Today
        </button>
      </div>

      {loading ? <Skeleton variant="card" className="h-[500px]" /> : (
        <div className="card overflow-hidden">
          <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800">
            {WEEKDAYS.map((d) => (
              <div key={d} className="px-2 py-2 text-[10px] font-semibold text-slate-500 uppercase text-center">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {cells.map((date, i) => {
              if (!date) return <div key={i} className="min-h-[100px] border-r border-b border-slate-100 dark:border-slate-800/50 bg-slate-50/30 dark:bg-slate-900/30" />;
              const dayPosts = postsByDay[date.getDate()] || [];
              const isToday = date.toDateString() === today.toDateString();
              return (
                <div
                  key={i}
                  onClick={() => onCreateAtDate && onCreateAtDate(date)}
                  className="min-h-[100px] p-1.5 border-r border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-medium ${isToday ? 'bg-primary-600 text-white w-5 h-5 rounded-full flex items-center justify-center' : 'text-slate-600 dark:text-slate-400'}`}>
                      {date.getDate()}
                    </span>
                    {dayPosts.length > 0 && <span className="text-[9px] text-slate-400">{dayPosts.length}</span>}
                  </div>
                  <div className="space-y-0.5">
                    {dayPosts.slice(0, 3).map((p) => (
                      <PostChip key={p._id} post={p} onClick={onSelectPost} />
                    ))}
                    {dayPosts.length > 3 && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setExpandedDay({ date, posts: dayPosts }); }}
                        className="w-full text-[9px] text-primary-600 hover:text-primary-700 text-center"
                      >
                        +{dayPosts.length - 3} more
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Day expansion modal */}
      {expandedDay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" onClick={() => setExpandedDay(null)}>
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl max-w-md w-full p-5 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-semibold mb-3">
              {expandedDay.date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </h3>
            <div className="space-y-2">
              {expandedDay.posts.map((p) => (
                <PostChip key={p._id} post={p} onClick={(post) => { setExpandedDay(null); onSelectPost(post); }} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
