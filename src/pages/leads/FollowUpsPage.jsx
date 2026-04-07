import { useState, useEffect, useCallback } from 'react';
import { salesActivityService } from '../../services';
import { useToast } from '../../components/ui/Toast';
import { Badge, Avatar, Skeleton, EmptyState } from '../../components/ui';
import { ACTIVITY_TYPES, ACTIVITY_TYPE_ICONS } from '../../utils/constants';
import LeadDetailDrawer from './LeadDetailDrawer';

function fmtDate(d) {
  if (!d) return '';
  const date = new Date(d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const targetDay = new Date(date);
  targetDay.setHours(0, 0, 0, 0);

  if (targetDay.getTime() === today.getTime()) return 'Today';
  if (targetDay.getTime() === tomorrow.getTime()) return 'Tomorrow';
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function daysFromNow(d) {
  if (!d) return 0;
  const ms = new Date(d).getTime() - Date.now();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

function FollowUpCard({ activity, onClick }) {
  const isOverdue = daysFromNow(activity.nextActionDate) < 0;
  return (
    <div
      onClick={() => onClick(activity.lead._id)}
      className={`card p-4 cursor-pointer hover:shadow-md transition-all ${isOverdue ? 'border-red-200 dark:border-red-800' : ''}`}
    >
      <div className="flex items-start gap-3">
        <div className="text-xl shrink-0">{ACTIVITY_TYPE_ICONS[activity.type] || '📌'}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{activity.lead?.contactName}</p>
              {activity.lead?.company && <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{activity.lead.company}</p>}
            </div>
            <Badge size="sm" color={isOverdue ? 'danger' : 'primary'}>{fmtDate(activity.nextActionDate)}</Badge>
          </div>
          {activity.nextAction && (
            <p className="text-sm text-slate-700 dark:text-slate-300 mt-2">→ {activity.nextAction}</p>
          )}
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-1.5">
              <Avatar name={activity.createdBy?.name} size="xs" />
              <span className="text-[10px] text-slate-400">{activity.createdBy?.name}</span>
            </div>
            <span className="text-[10px] font-mono text-slate-300">{activity.lead?.leadId}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FollowUpsPage() {
  const toast = useToast();
  const [tab, setTab] = useState('upcoming');
  const [upcoming, setUpcoming] = useState([]);
  const [overdue, setOverdue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLeadId, setSelectedLeadId] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [upRes, overRes] = await Promise.all([
        salesActivityService.getUpcoming(),
        salesActivityService.getOverdue(),
      ]);
      setUpcoming(upRes.data || []);
      setOverdue(overRes.data || []);
    } catch {
      toast.error('Failed to load follow-ups');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Group upcoming by day bucket
  const todayItems = upcoming.filter((a) => daysFromNow(a.nextActionDate) === 0);
  const tomorrowItems = upcoming.filter((a) => daysFromNow(a.nextActionDate) === 1);
  const weekItems = upcoming.filter((a) => {
    const d = daysFromNow(a.nextActionDate);
    return d >= 2 && d <= 7;
  });

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Follow-ups</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Stay on top of your sales follow-ups</p>
      </div>

      {/* Stat row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4">
          <p className="text-xs text-slate-500 mb-1">Today</p>
          <p className="text-2xl font-bold text-primary-600">{todayItems.length}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-slate-500 mb-1">Tomorrow</p>
          <p className="text-2xl font-bold text-slate-700 dark:text-slate-300">{tomorrowItems.length}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-slate-500 mb-1">This Week</p>
          <p className="text-2xl font-bold text-slate-700 dark:text-slate-300">{weekItems.length}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-slate-500 mb-1">Overdue</p>
          <p className="text-2xl font-bold text-red-600">{overdue.length}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1 w-fit">
        {[
          { id: 'upcoming', label: `Upcoming (${upcoming.length})` },
          { id: 'overdue', label: `Overdue (${overdue.length})` },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-xs font-medium rounded-lg transition-colors ${
              tab === t.id ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {[1,2,3,4].map((i) => <Skeleton key={i} variant="card" className="h-24" />)}
        </div>
      ) : tab === 'upcoming' ? (
        <div className="space-y-5">
          {todayItems.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-slate-500 uppercase mb-2">Today</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {todayItems.map((a) => <FollowUpCard key={a._id} activity={a} onClick={setSelectedLeadId} />)}
              </div>
            </div>
          )}
          {tomorrowItems.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-slate-500 uppercase mb-2">Tomorrow</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {tomorrowItems.map((a) => <FollowUpCard key={a._id} activity={a} onClick={setSelectedLeadId} />)}
              </div>
            </div>
          )}
          {weekItems.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-slate-500 uppercase mb-2">This Week</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {weekItems.map((a) => <FollowUpCard key={a._id} activity={a} onClick={setSelectedLeadId} />)}
              </div>
            </div>
          )}
          {upcoming.length === 0 && <EmptyState title="No upcoming follow-ups" description="You're all caught up." />}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {overdue.length === 0 ? (
            <div className="col-span-2"><EmptyState title="No overdue follow-ups" description="Great job staying on top of things!" /></div>
          ) : (
            overdue.map((a) => <FollowUpCard key={a._id} activity={a} onClick={setSelectedLeadId} />)
          )}
        </div>
      )}

      <LeadDetailDrawer
        leadId={selectedLeadId}
        isOpen={!!selectedLeadId}
        onClose={() => setSelectedLeadId(null)}
        onUpdated={fetchData}
        salesUsers={[]}
      />
    </div>
  );
}
