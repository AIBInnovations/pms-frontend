import { useState, useEffect, useCallback } from 'react';
import { socialPostService } from '../../services';
import { useToast } from '../../components/ui/Toast';
import { Button, Select } from '../../components/ui';
import { PLATFORMS, STATUSES } from './postConstants';
import PostCalendarView from './PostCalendarView';
import PostListView from './PostListView';
import PostFormModal from './PostFormModal';
import PostDetailDrawer from './PostDetailDrawer';

export default function SocialPostsPage() {
  const toast = useToast();
  const [tab, setTab] = useState('calendar');
  const [stats, setStats] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const [filters, setFilters] = useState({ status: '', platform: '', campaign: '' });

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [defaultDate, setDefaultDate] = useState(null);

  const [drawerPostId, setDrawerPostId] = useState(null);

  const fetchStats = useCallback(async () => {
    try {
      const res = await socialPostService.getStats();
      setStats(res.data);
    } catch { /* silent */ }
  }, []);

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const params = { limit: 100 };
      if (filters.status) params.status = filters.status;
      if (filters.platform) params.platform = filters.platform;
      if (filters.campaign) params.campaign = filters.campaign;
      const res = await socialPostService.getAll(params);
      setPosts(res.data || []);
    } catch {
      toast.error('Failed to load posts');
    } finally {
      setLoading(false);
    }
  }, [filters, toast]);

  useEffect(() => { fetchStats(); }, [fetchStats, refreshKey]);
  useEffect(() => { if (tab === 'list') fetchList(); }, [tab, fetchList, refreshKey]);

  const openCreate = (date) => {
    setEditing(null);
    setDefaultDate(date || null);
    setModalOpen(true);
  };

  const openEdit = (post) => {
    setDrawerPostId(null);
    setEditing(post);
    setDefaultDate(null);
    setModalOpen(true);
  };

  const handleSelectPost = (post) => setDrawerPostId(post._id);

  const triggerRefresh = () => setRefreshKey((k) => k + 1);

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Social Media</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Plan, draft, and approve your posts across platforms</p>
        </div>
        <Button onClick={() => openCreate()}>+ New Post</Button>
      </div>

      {/* Stats strip */}
      {stats && (
        <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: 'Drafts', value: stats.draft + stats.idea, tone: 'text-slate-700 dark:text-slate-300' },
            { label: 'Pending', value: stats.pending_approval, tone: 'text-amber-600' },
            { label: 'Scheduled', value: stats.scheduled, tone: 'text-blue-600' },
            { label: 'Published', value: stats.published, tone: 'text-emerald-600' },
            { label: 'Rejected', value: stats.rejected, tone: 'text-red-600' },
            { label: 'Total', value: stats.total, tone: 'text-slate-900 dark:text-slate-100' },
          ].map((s) => (
            <div key={s.label} className="card p-3">
              <p className="text-[10px] text-slate-500 uppercase">{s.label}</p>
              <p className={`text-2xl font-bold ${s.tone}`}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tabs + filters */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1 w-fit">
          {[
            { id: 'calendar', label: 'Calendar' },
            { id: 'list', label: 'List' },
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

        {tab === 'list' && (
          <div className="flex gap-2 items-end">
            <Select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              options={STATUSES.map((s) => ({ value: s.value, label: s.label }))}
              placeholder="All statuses"
            />
            <Select
              value={filters.platform}
              onChange={(e) => setFilters({ ...filters, platform: e.target.value })}
              options={PLATFORMS.map((p) => ({ value: p.value, label: p.label }))}
              placeholder="All platforms"
            />
            <input
              value={filters.campaign}
              onChange={(e) => setFilters({ ...filters, campaign: e.target.value })}
              placeholder="Campaign"
              className="input-base h-[38px]"
            />
          </div>
        )}
      </div>

      {tab === 'calendar' ? (
        <PostCalendarView
          refreshKey={refreshKey}
          onSelectPost={handleSelectPost}
          onCreateAtDate={openCreate}
        />
      ) : (
        <PostListView posts={posts} loading={loading} onSelectPost={handleSelectPost} />
      )}

      <PostFormModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null); setDefaultDate(null); }}
        editing={editing}
        defaultDate={defaultDate}
        onSaved={triggerRefresh}
      />

      <PostDetailDrawer
        postId={drawerPostId}
        isOpen={!!drawerPostId}
        onClose={() => setDrawerPostId(null)}
        onChanged={triggerRefresh}
        onEdit={openEdit}
      />
    </div>
  );
}
