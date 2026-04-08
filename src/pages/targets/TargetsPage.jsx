import { useState, useEffect, useCallback } from 'react';
import { targetService, userService } from '../../services';
import { useToast } from '../../components/ui/Toast';
import { Button, Modal, Input, Select, Badge, Avatar, Skeleton, EmptyState } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../utils/constants';

function fmtMoney(n) {
  return '₹' + (Number(n) || 0).toLocaleString('en-IN');
}

function currentMonthKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function ProgressBar({ pct, color = 'primary' }) {
  const colors = {
    primary: 'bg-primary-500',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-red-500',
  };
  const clamped = Math.min(100, Math.max(0, pct));
  const tone = pct >= 100 ? 'success' : pct >= 70 ? 'primary' : pct >= 40 ? 'warning' : 'danger';
  return (
    <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
      <div className={`h-full ${colors[tone] || colors[color]} transition-all`} style={{ width: `${clamped}%` }} />
    </div>
  );
}

function TargetCard({ item, onEdit, onDelete, isAdmin }) {
  const { target, progress } = item;
  const label = target.type === 'firm' ? 'Firm-wide' : target.user?.name || 'User';
  return (
    <div className="card p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {target.type === 'user' && target.user && <Avatar name={target.user.name} size="sm" />}
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{label}</p>
              <p className="text-[11px] text-slate-500 uppercase tracking-wide">{target.period} · {target.periodKey}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge size="sm" color={target.type === 'firm' ? 'primary' : 'default'}>{target.type}</Badge>
          {isAdmin && (
            <>
              <button onClick={() => onEdit(target)} className="text-xs text-slate-500 hover:text-primary-600">Edit</button>
              <button onClick={() => onDelete(target._id)} className="text-xs text-slate-500 hover:text-red-600">Delete</button>
            </>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {target.revenueTarget > 0 && (
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-slate-500">Revenue</span>
              <span className="font-medium text-slate-700 dark:text-slate-300">
                {fmtMoney(progress.revenueActual)} / {fmtMoney(progress.revenueTarget)} · {progress.revenuePct}%
              </span>
            </div>
            <ProgressBar pct={progress.revenuePct} />
          </div>
        )}
        {target.dealsTarget > 0 && (
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-slate-500">Deals Won</span>
              <span className="font-medium text-slate-700 dark:text-slate-300">{progress.dealsActual} / {progress.dealsTarget} · {progress.dealsPct}%</span>
            </div>
            <ProgressBar pct={progress.dealsPct} />
          </div>
        )}
        {target.proposalsTarget > 0 && (
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-slate-500">Proposals</span>
              <span className="font-medium text-slate-700 dark:text-slate-300">{progress.proposalsActual} / {progress.proposalsTarget} · {progress.proposalsPct}%</span>
            </div>
            <ProgressBar pct={progress.proposalsPct} />
          </div>
        )}
        {target.leadsTarget > 0 && (
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-slate-500">Leads</span>
              <span className="font-medium text-slate-700 dark:text-slate-300">{progress.leadsActual} / {progress.leadsTarget} · {progress.leadsPct}%</span>
            </div>
            <ProgressBar pct={progress.leadsPct} />
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
        <span className="text-[10px] text-slate-400 uppercase">Period elapsed</span>
        <span className="text-[10px] font-medium text-slate-500">{progress.paceElapsed}%</span>
      </div>
    </div>
  );
}

function TargetFormModal({ isOpen, onClose, onSave, editing, users }) {
  const [form, setForm] = useState({
    type: 'firm', user: '', period: 'month', periodKey: currentMonthKey(),
    leadsTarget: 0, proposalsTarget: 0, dealsTarget: 0, revenueTarget: 0, notes: '',
  });

  useEffect(() => {
    if (editing) {
      setForm({
        type: editing.type, user: editing.user?._id || '', period: editing.period, periodKey: editing.periodKey,
        leadsTarget: editing.leadsTarget, proposalsTarget: editing.proposalsTarget,
        dealsTarget: editing.dealsTarget, revenueTarget: editing.revenueTarget, notes: editing.notes || '',
      });
    } else {
      setForm({ type: 'firm', user: '', period: 'month', periodKey: currentMonthKey(), leadsTarget: 0, proposalsTarget: 0, dealsTarget: 0, revenueTarget: 0, notes: '' });
    }
  }, [editing, isOpen]);

  const submit = (e) => {
    e.preventDefault();
    const payload = { ...form };
    if (payload.type === 'firm') payload.user = null;
    if (!payload.user) delete payload.user;
    onSave(payload);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editing ? 'Edit Target' : 'New Target'} size="md">
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Select label="Type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            <option value="firm">Firm-wide</option>
            <option value="user">User</option>
          </Select>
          {form.type === 'user' && (
            <Select label="User" value={form.user} onChange={(e) => setForm({ ...form, user: e.target.value })} required>
              <option value="">Select user...</option>
              {users.map((u) => <option key={u._id} value={u._id}>{u.name}</option>)}
            </Select>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Select label="Period" value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value })}>
            <option value="month">Month</option>
            <option value="quarter">Quarter</option>
          </Select>
          <Input label="Period Key" value={form.periodKey} onChange={(e) => setForm({ ...form, periodKey: e.target.value })}
            placeholder={form.period === 'month' ? '2026-04' : '2026-Q2'} required />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Leads Target" type="number" min={0} value={form.leadsTarget} onChange={(e) => setForm({ ...form, leadsTarget: Number(e.target.value) })} />
          <Input label="Proposals Target" type="number" min={0} value={form.proposalsTarget} onChange={(e) => setForm({ ...form, proposalsTarget: Number(e.target.value) })} />
          <Input label="Deals Target" type="number" min={0} value={form.dealsTarget} onChange={(e) => setForm({ ...form, dealsTarget: Number(e.target.value) })} />
          <Input label="Revenue Target (₹)" type="number" min={0} value={form.revenueTarget} onChange={(e) => setForm({ ...form, revenueTarget: Number(e.target.value) })} />
        </div>
        <Input label="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit">{editing ? 'Update' : 'Create'}</Button>
        </div>
      </form>
    </Modal>
  );
}

function Leaderboard({ rows }) {
  if (!rows || rows.length === 0) {
    return <EmptyState title="No data yet" description="Once leads start flowing, the leaderboard will populate." />;
  }
  return (
    <div className="card overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 dark:bg-slate-800/50">
          <tr className="text-left text-xs text-slate-500 uppercase">
            <th className="px-4 py-3">#</th>
            <th className="px-4 py-3">User</th>
            <th className="px-4 py-3 text-right">Leads</th>
            <th className="px-4 py-3 text-right">Won</th>
            <th className="px-4 py-3 text-right">Conv. Rate</th>
            <th className="px-4 py-3 text-right">Revenue</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {rows.map((r, i) => (
            <tr key={r.user._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
              <td className="px-4 py-3 font-mono text-slate-400">{i + 1}</td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <Avatar name={r.user.name} size="sm" />
                  <div>
                    <p className="font-medium text-slate-900 dark:text-slate-100">{r.user.name}</p>
                    <p className="text-[11px] text-slate-500">{r.user.email}</p>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3 text-right">{r.leadsCount}</td>
              <td className="px-4 py-3 text-right text-emerald-600 font-medium">{r.wonCount}</td>
              <td className="px-4 py-3 text-right">{Math.round(r.conversionRate)}%</td>
              <td className="px-4 py-3 text-right font-semibold">{fmtMoney(r.revenue)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function TargetsPage() {
  const { user } = useAuth();
  const toast = useToast();
  const isAdmin = user?.role === ROLES.SUPER_ADMIN;

  const [tab, setTab] = useState('targets');
  const [items, setItems] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [periodKey, setPeriodKey] = useState(currentMonthKey());

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [curRes, lbRes] = await Promise.all([
        targetService.getCurrent(),
        targetService.getLeaderboard(periodKey),
      ]);
      setItems(curRes.data || []);
      setLeaderboard(lbRes.data || []);
    } catch {
      toast.error('Failed to load targets');
    } finally {
      setLoading(false);
    }
  }, [toast, periodKey]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (!isAdmin) return;
    userService.getAll({ limit: 200 }).then((res) => {
      const list = res.data || res.users || [];
      setUsers(list.filter((u) => ['super_admin', 'project_manager', 'sales_executive'].includes(u.role)));
    }).catch(() => {});
  }, [isAdmin]);

  const handleSave = async (payload) => {
    try {
      if (editing) {
        await targetService.update(editing._id, payload);
        toast.success('Target updated');
      } else {
        await targetService.create(payload);
        toast.success('Target created');
      }
      setModalOpen(false);
      setEditing(null);
      fetchData();
    } catch (e) {
      toast.error(e.response?.data?.error?.message || 'Failed to save target');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this target?')) return;
    try {
      await targetService.delete(id);
      toast.success('Target deleted');
      fetchData();
    } catch {
      toast.error('Failed to delete target');
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Targets & Performance</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Track progress against monthly and quarterly goals</p>
        </div>
        {isAdmin && (
          <Button onClick={() => { setEditing(null); setModalOpen(true); }}>+ New Target</Button>
        )}
      </div>

      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1 w-fit">
        {[
          { id: 'targets', label: 'Targets' },
          { id: 'leaderboard', label: 'Leaderboard' },
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

      {tab === 'targets' ? (
        loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} variant="card" className="h-56" />)}
          </div>
        ) : items.length === 0 ? (
          <EmptyState title="No targets set" description={isAdmin ? 'Create a firm-wide or per-user target to start tracking.' : 'Ask an admin to set targets.'} />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {items.map((item) => (
              <TargetCard
                key={item.target._id}
                item={item}
                isAdmin={isAdmin}
                onEdit={(t) => { setEditing(t); setModalOpen(true); }}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-500">Period:</label>
            <input
              value={periodKey}
              onChange={(e) => setPeriodKey(e.target.value)}
              className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
              placeholder="2026-04 or 2026-Q2"
            />
          </div>
          {loading ? <Skeleton variant="card" className="h-64" /> : <Leaderboard rows={leaderboard} />}
        </div>
      )}

      <TargetFormModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null); }}
        onSave={handleSave}
        editing={editing}
        users={users}
      />
    </div>
  );
}
