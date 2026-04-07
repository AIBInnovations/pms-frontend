import { useState, useEffect, useCallback } from 'react';
import { leadService } from '../../services';
import LeadActivityTimeline from './LeadActivityTimeline';
import { useToast } from '../../components/ui/Toast';
import { Button, Badge, Avatar, Input, Select, Skeleton } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import {
  LEAD_STATUSES, LEAD_STATUS_COLORS, LEAD_SOURCES, LEAD_PIPELINES,
  LEAD_BUDGETS, LEAD_SERVICES, LEAD_LOST_REASONS,
} from '../../utils/constants';

function fmtDate(d) {
  if (!d) return '--';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function fmtCurrency(n) {
  return n ? `\u20B9${Number(n).toLocaleString('en-IN')}` : '--';
}

export default function LeadDetailDrawer({ leadId, isOpen, onClose, onUpdated, salesUsers = [] }) {
  const toast = useToast();
  const { user } = useAuth();
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showLostForm, setShowLostForm] = useState(false);
  const [lostReason, setLostReason] = useState('');
  const [lostNote, setLostNote] = useState('');

  const isAdmin = user?.role === 'super_admin';

  const fetchLead = useCallback(async () => {
    if (!leadId) return;
    setLoading(true);
    try {
      const res = await leadService.getById(leadId);
      setLead(res.data);
    } catch {
      toast.error('Failed to load lead');
    } finally {
      setLoading(false);
    }
  }, [leadId, toast]);

  useEffect(() => {
    if (isOpen && leadId) fetchLead();
    if (!isOpen) {
      setLead(null);
      setEditing(false);
      setShowLostForm(false);
      setNoteText('');
    }
  }, [leadId, isOpen, fetchLead]);

  const startEdit = () => {
    setForm({
      contactName: lead.contactName || '',
      company: lead.company || '',
      email: lead.email || '',
      phone: lead.phone || '',
      source: lead.source || 'other',
      status: lead.status || 'new',
      pipeline: lead.pipeline || 'new_business',
      assignee: lead.assignee?._id || '',
      budgetRange: lead.budgetRange || '',
      dealValue: lead.dealValue || '',
      serviceInterest: lead.serviceInterest || [],
      priority: lead.priority || false,
      description: lead.description || '',
      nextFollowUpAt: lead.nextFollowUpAt ? new Date(lead.nextFollowUpAt).toISOString().split('T')[0] : '',
    });
    setEditing(true);
  };

  const saveEdit = async () => {
    setSaving(true);
    try {
      const payload = { ...form };
      if (payload.dealValue !== '') payload.dealValue = Number(payload.dealValue);
      if (!payload.assignee) delete payload.assignee;
      if (!payload.nextFollowUpAt) payload.nextFollowUpAt = null;
      await leadService.update(leadId, payload);
      toast.success('Lead updated');
      setEditing(false);
      fetchLead();
      onUpdated?.();
    } catch (e) {
      toast.error(e.response?.data?.error?.message || 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  const handleQuickStatusChange = async (newStatus) => {
    if (newStatus === 'lost') {
      setShowLostForm(true);
      return;
    }
    try {
      await leadService.update(leadId, { status: newStatus });
      toast.success('Status updated');
      fetchLead();
      onUpdated?.();
    } catch (e) {
      toast.error(e.response?.data?.error?.message || 'Failed');
    }
  };

  const handleMarkLost = async () => {
    if (!lostReason) { toast.error('Lost reason is required'); return; }
    try {
      await leadService.update(leadId, { status: 'lost', lostReason, lostReasonNote: lostNote });
      toast.success('Marked as lost');
      setShowLostForm(false);
      setLostReason('');
      setLostNote('');
      fetchLead();
      onUpdated?.();
    } catch (e) {
      toast.error(e.response?.data?.error?.message || 'Failed');
    }
  };

  const handleAddNote = async () => {
    if (!noteText.trim()) return;
    try {
      await leadService.addNote(leadId, noteText.trim());
      setNoteText('');
      fetchLead();
    } catch {
      toast.error('Failed to add note');
    }
  };

  const handleDeleteNote = async (noteId) => {
    try {
      await leadService.deleteNote(leadId, noteId);
      fetchLead();
    } catch { toast.error('Failed to delete note'); }
  };

  const handleDelete = async () => {
    try {
      await leadService.delete(leadId);
      toast.success('Lead deleted');
      onUpdated?.();
      onClose();
    } catch { toast.error('Failed to delete'); }
  };

  if (!isOpen) return null;

  const statusOptions = Object.entries(LEAD_STATUSES).map(([v, l]) => ({ value: v, label: l }));
  const sourceOptions = Object.entries(LEAD_SOURCES).map(([v, l]) => ({ value: v, label: l }));
  const pipelineOptions = Object.entries(LEAD_PIPELINES).map(([v, l]) => ({ value: v, label: l }));
  const budgetOptions = Object.entries(LEAD_BUDGETS).map(([v, l]) => ({ value: v, label: l }));
  const lostReasonOptions = Object.entries(LEAD_LOST_REASONS).map(([v, l]) => ({ value: v, label: l }));
  const assigneeOptions = salesUsers.map((u) => ({ value: u._id, label: u.name }));

  return (
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 bg-slate-900/20" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full max-w-lg bg-white dark:bg-slate-900 shadow-xl animate-slide-in-right overflow-y-auto flex flex-col">
        {loading || !lead ? (
          <div className="p-6 space-y-3">
            <Skeleton variant="text" className="w-32 h-6" />
            <Skeleton variant="text" className="w-48 h-4" />
            <div className="space-y-2 mt-4">
              {[1,2,3,4].map((i) => <Skeleton key={i} variant="text" className="h-12" />)}
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="sticky top-0 z-10 bg-white dark:bg-slate-900 px-6 py-4 border-b">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <span className="font-mono text-xs text-slate-400">{lead.leadId}</span>
                  {lead.priority && <span className="ml-1.5 text-amber-500" title="High Priority">⭐</span>}
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mt-1">{lead.contactName}</h2>
                  {lead.company && <p className="text-sm text-slate-500 dark:text-slate-400">{lead.company}</p>}
                </div>
                <div className="flex items-center gap-1">
                  {!editing && <Button size="sm" variant="secondary" onClick={startEdit}>Edit</Button>}
                  {isAdmin && !confirmDelete && (
                    <button onClick={() => setConfirmDelete(true)} className="p-1.5 rounded-lg text-slate-400 hover:text-danger-600 hover:bg-danger-50 transition-colors">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79" />
                      </svg>
                    </button>
                  )}
                  {confirmDelete && (
                    <div className="flex items-center gap-1 bg-danger-50 dark:bg-danger-900/20 rounded-lg px-2 py-1">
                      <span className="text-xs text-danger-600 font-medium">Delete?</span>
                      <button onClick={handleDelete} className="text-xs font-semibold text-danger-600 px-1">Yes</button>
                      <button onClick={() => setConfirmDelete(false)} className="text-xs text-slate-500 px-1">No</button>
                    </div>
                  )}
                  <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge color={LEAD_STATUS_COLORS[lead.status]} size="sm">{LEAD_STATUSES[lead.status]}</Badge>
                <Badge color="default" size="sm">{LEAD_PIPELINES[lead.pipeline]}</Badge>
                {lead.dealValue > 0 && <Badge color="success" size="sm">{fmtCurrency(lead.dealValue)}</Badge>}
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
              {showLostForm && (
                <div className="card p-4 bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800">
                  <h4 className="text-sm font-semibold text-danger-700 mb-2">Mark as Lost</h4>
                  <Select value={lostReason} onChange={(e) => setLostReason(e.target.value)} options={lostReasonOptions} placeholder="Reason *" />
                  <Input className="mt-2" value={lostNote} onChange={(e) => setLostNote(e.target.value)} placeholder="Additional notes" />
                  <div className="flex justify-end gap-2 mt-3">
                    <Button variant="secondary" size="sm" onClick={() => setShowLostForm(false)}>Cancel</Button>
                    <Button size="sm" variant="danger" onClick={handleMarkLost}>Confirm Lost</Button>
                  </div>
                </div>
              )}

              {/* Quick status change */}
              {!editing && !showLostForm && (
                <div>
                  <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-2">Quick Status Change</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(LEAD_STATUSES).map(([key, label]) => (
                      <button
                        key={key}
                        onClick={() => handleQuickStatusChange(key)}
                        disabled={lead.status === key}
                        className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                          lead.status === key
                            ? 'bg-primary-600 text-white border-primary-600'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-slate-400'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {editing ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Contact Name</label>
                      <Input value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Company</label>
                      <Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Email</label>
                      <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Phone</label>
                      <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Source</label>
                      <Select value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} options={sourceOptions} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Pipeline</label>
                      <Select value={form.pipeline} onChange={(e) => setForm({ ...form, pipeline: e.target.value })} options={pipelineOptions} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Assignee</label>
                      <Select value={form.assignee} onChange={(e) => setForm({ ...form, assignee: e.target.value })} options={assigneeOptions} placeholder="Unassigned" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Budget Range</label>
                      <Select value={form.budgetRange} onChange={(e) => setForm({ ...form, budgetRange: e.target.value })} options={budgetOptions} placeholder="Not specified" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Deal Value (₹)</label>
                      <Input type="number" value={form.dealValue} onChange={(e) => setForm({ ...form, dealValue: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Next Follow-up</label>
                      <Input type="date" value={form.nextFollowUpAt} onChange={(e) => setForm({ ...form, nextFollowUpAt: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Service Interest</label>
                    <div className="flex flex-wrap gap-1.5">
                      {Object.entries(LEAD_SERVICES).map(([key, label]) => {
                        const selected = form.serviceInterest?.includes(key);
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => setForm({
                              ...form,
                              serviceInterest: selected ? form.serviceInterest.filter((s) => s !== key) : [...(form.serviceInterest || []), key],
                            })}
                            className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                              selected ? 'bg-primary-600 text-white border-primary-600' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300'
                            }`}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Description</label>
                    <textarea
                      className="input-base min-h-[80px] resize-none"
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                    />
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.priority}
                      onChange={(e) => setForm({ ...form, priority: e.target.checked })}
                      className="rounded border-slate-300 dark:border-slate-600 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-slate-700 dark:text-slate-300">High Priority</span>
                  </label>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button variant="secondary" size="sm" onClick={() => setEditing(false)}>Cancel</Button>
                    <Button size="sm" onClick={saveEdit} loading={saving}>Save</Button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Details */}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                    {lead.email && <div><dt className="text-xs text-slate-400">Email</dt><dd className="text-slate-700 dark:text-slate-300">{lead.email}</dd></div>}
                    {lead.phone && <div><dt className="text-xs text-slate-400">Phone</dt><dd className="text-slate-700 dark:text-slate-300">{lead.phone}</dd></div>}
                    <div><dt className="text-xs text-slate-400">Source</dt><dd className="text-slate-700 dark:text-slate-300">{LEAD_SOURCES[lead.source]}</dd></div>
                    {lead.budgetRange && <div><dt className="text-xs text-slate-400">Budget</dt><dd className="text-slate-700 dark:text-slate-300">{LEAD_BUDGETS[lead.budgetRange]}</dd></div>}
                    {lead.dealValue > 0 && <div><dt className="text-xs text-slate-400">Deal Value</dt><dd className="text-emerald-600 font-semibold">{fmtCurrency(lead.dealValue)}</dd></div>}
                    {lead.assignee && <div><dt className="text-xs text-slate-400">Assignee</dt><dd className="text-slate-700 dark:text-slate-300">{lead.assignee.name}</dd></div>}
                    {lead.nextFollowUpAt && <div><dt className="text-xs text-slate-400">Next Follow-up</dt><dd className="text-slate-700 dark:text-slate-300">{fmtDate(lead.nextFollowUpAt)}</dd></div>}
                    <div><dt className="text-xs text-slate-400">Created</dt><dd className="text-slate-700 dark:text-slate-300">{fmtDate(lead.createdAt)}</dd></div>
                  </div>

                  {lead.serviceInterest?.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2">Service Interest</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {lead.serviceInterest.map((s) => (
                          <Badge key={s} size="sm" color="primary">{LEAD_SERVICES[s]}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {lead.description && (
                    <div>
                      <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2">Description</h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap">{lead.description}</p>
                    </div>
                  )}

                  {lead.status === 'lost' && lead.lostReason && (
                    <div className="card p-3 bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800">
                      <h4 className="text-xs font-semibold text-danger-700 uppercase mb-1">Lost Reason</h4>
                      <p className="text-sm text-danger-600">{LEAD_LOST_REASONS[lead.lostReason]}</p>
                      {lead.lostReasonNote && <p className="text-xs text-danger-500 mt-1">{lead.lostReasonNote}</p>}
                    </div>
                  )}

                  {/* Activity Timeline */}
                  <LeadActivityTimeline leadId={leadId} onChange={fetchLead} />

                  {/* Internal notes */}
                  <div>
                    <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2">Internal Notes</h4>
                    <div className="space-y-2 mb-3">
                      {lead.internalNotes?.map((note) => (
                        <div key={note._id} className="flex items-start gap-2 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 group">
                          <Avatar name={note.createdBy?.name} size="xs" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="text-xs font-medium text-slate-700 dark:text-slate-300">{note.createdBy?.name}</p>
                              <span className="text-[10px] text-slate-400">{fmtDate(note.createdAt)}</span>
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">{note.text}</p>
                          </div>
                          <button onClick={() => handleDeleteNote(note._id)} className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-danger-500 transition-all">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                      {!lead.internalNotes?.length && <p className="text-xs text-slate-400">No notes yet</p>}
                    </div>
                    <div className="flex gap-2">
                      <Input value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder="Add a note..." onKeyDown={(e) => e.key === 'Enter' && handleAddNote()} />
                      <Button size="sm" onClick={handleAddNote} disabled={!noteText.trim()}>Add</Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
