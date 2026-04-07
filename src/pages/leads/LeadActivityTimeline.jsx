import { useState, useEffect } from 'react';
import { salesActivityService } from '../../services';
import { useToast } from '../../components/ui/Toast';
import { Button, Badge, Avatar, Input, Select } from '../../components/ui';
import { ACTIVITY_TYPES, ACTIVITY_OUTCOMES, ACTIVITY_TYPE_ICONS } from '../../utils/constants';

function fmtDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function fmtTime(d) {
  if (!d) return '';
  return new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export default function LeadActivityTimeline({ leadId, onChange }) {
  const toast = useToast();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    type: 'call',
    outcome: '',
    notes: '',
    nextAction: '',
    nextActionDate: '',
  });

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const res = await salesActivityService.getByLead(leadId);
      setActivities(res.data || []);
    } catch {
      toast.error('Failed to load activities');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (leadId) fetchActivities();
  }, [leadId]);

  const resetForm = () => {
    setForm({ type: 'call', outcome: '', notes: '', nextAction: '', nextActionDate: '' });
    setShowForm(false);
  };

  const handleSave = async () => {
    if (!form.type) { toast.error('Type is required'); return; }
    setSaving(true);
    try {
      const payload = { ...form };
      if (!payload.nextActionDate) delete payload.nextActionDate;
      await salesActivityService.create(leadId, payload);
      toast.success('Activity logged');
      resetForm();
      fetchActivities();
      onChange?.();
    } catch {
      toast.error('Failed to log activity');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await salesActivityService.delete(id);
      toast.success('Deleted');
      fetchActivities();
      onChange?.();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const typeOptions = Object.entries(ACTIVITY_TYPES).map(([v, l]) => ({ value: v, label: l }));
  const outcomeOptions = Object.entries(ACTIVITY_OUTCOMES).map(([v, l]) => ({ value: v, label: l }));

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs font-semibold text-slate-500 uppercase">Activity Timeline {activities.length > 0 && <span className="text-slate-400 normal-case ml-1">({activities.length})</span>}</h4>
        <Button size="sm" variant="secondary" onClick={() => setShowForm(true)}>Log Activity</Button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="card p-4 mb-3 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} options={typeOptions} />
            <Select value={form.outcome} onChange={(e) => setForm({ ...form, outcome: e.target.value })} options={outcomeOptions} placeholder="Outcome" />
          </div>
          <textarea
            className="input-base min-h-[60px] resize-none text-sm"
            placeholder="Notes about this interaction..."
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-2">
            <Input value={form.nextAction} onChange={(e) => setForm({ ...form, nextAction: e.target.value })} placeholder="Next action" />
            <Input type="date" value={form.nextActionDate} onChange={(e) => setForm({ ...form, nextActionDate: e.target.value })} />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={resetForm}>Cancel</Button>
            <Button size="sm" onClick={handleSave} loading={saving}>Save</Button>
          </div>
        </div>
      )}

      {/* Timeline */}
      {loading ? (
        <p className="text-xs text-slate-400 text-center py-3">Loading...</p>
      ) : activities.length === 0 ? (
        <p className="text-xs text-slate-400 text-center py-3">No activities logged yet</p>
      ) : (
        <div className="space-y-2">
          {activities.map((a) => (
            <div key={a._id} className="flex gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 group">
              <div className="text-xl shrink-0">{ACTIVITY_TYPE_ICONS[a.type] || '📌'}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{ACTIVITY_TYPES[a.type]}</span>
                    {a.outcome && <Badge size="sm" color={a.outcome === 'interested' ? 'success' : a.outcome === 'not_interested' ? 'danger' : 'default'}>{ACTIVITY_OUTCOMES[a.outcome]}</Badge>}
                  </div>
                  <button onClick={() => handleDelete(a._id)} className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-danger-500 transition-all shrink-0">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                {a.notes && <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap">{a.notes}</p>}
                {a.nextAction && (
                  <p className="text-xs text-primary-600 mt-1.5">
                    → {a.nextAction}{a.nextActionDate && ` · ${fmtDate(a.nextActionDate)}`}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-1.5">
                  <Avatar name={a.createdBy?.name} size="xs" />
                  <span className="text-[10px] text-slate-400">{a.createdBy?.name} · {fmtTime(a.createdAt)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
