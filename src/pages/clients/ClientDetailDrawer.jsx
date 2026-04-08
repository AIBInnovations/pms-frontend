import { useState, useEffect, useCallback } from 'react';
import { clientService, portalService } from '../../services';
import { useToast } from '../../components/ui/Toast';
import { useAuth } from '../../context/AuthContext';
import { Button, Badge, Avatar, Input, Select, Skeleton } from '../../components/ui';

const STATUS_LABELS = { prospect: 'Prospect', active: 'Active', on_hold: 'On Hold', churned: 'Churned' };
const STATUS_COLORS = { prospect: 'default', active: 'success', on_hold: 'warning', churned: 'danger' };
const STATUS_OPTIONS = Object.entries(STATUS_LABELS).map(([v, l]) => ({ value: v, label: l }));

function fmtDate(d) {
  if (!d) return '--';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function fmtCurrency(n) {
  return `\u20B9${(n || 0).toLocaleString('en-IN')}`;
}

export default function ClientDetailDrawer({ clientId, isOpen, onClose, onUpdated }) {
  const toast = useToast();
  const { user } = useAuth();
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [portalUrl, setPortalUrl] = useState('');

  const isAdmin = user?.role === 'super_admin';

  const fetchClient = useCallback(async () => {
    if (!clientId) return;
    setLoading(true);
    try {
      const res = await clientService.getById(clientId);
      setClient(res.data);
    } catch {
      toast.error('Failed to load client');
    } finally {
      setLoading(false);
    }
  }, [clientId, toast]);

  useEffect(() => {
    if (isOpen && clientId) fetchClient();
    if (!isOpen) {
      setClient(null);
      setEditing(false);
    }
  }, [clientId, isOpen, fetchClient]);

  const startEdit = () => {
    setForm({
      company: client.company || '',
      status: client.status || 'active',
      source: client.source || '',
      tags: (client.tags || []).join(', '),
      contacts: client.contacts || [],
      churnReason: client.churnReason || '',
    });
    setEditing(true);
  };

  const updateContact = (idx, field, value) => {
    setForm((prev) => ({
      ...prev,
      contacts: prev.contacts.map((c, i) => i === idx ? { ...c, [field]: value } : c),
    }));
  };

  const setPrimary = (idx) => {
    setForm((prev) => ({
      ...prev,
      contacts: prev.contacts.map((c, i) => ({ ...c, isPrimary: i === idx })),
    }));
  };

  const addContact = () => {
    setForm((prev) => ({
      ...prev,
      contacts: [...(prev.contacts || []), { name: '', role: '', email: '', phone: '', isPrimary: false }],
    }));
  };

  const removeContact = (idx) => {
    setForm((prev) => ({ ...prev, contacts: prev.contacts.filter((_, i) => i !== idx) }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        ...form,
        tags: form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      };
      await clientService.update(clientId, payload);
      toast.success('Client updated');
      setEditing(false);
      fetchClient();
      onUpdated?.();
    } catch (e) {
      toast.error(e.response?.data?.error?.message || 'Failed');
    } finally {
      setSaving(false);
    }
  };

  const handleAddNote = async () => {
    if (!noteText.trim()) return;
    try {
      await clientService.addNote(clientId, noteText.trim());
      setNoteText('');
      fetchClient();
    } catch { toast.error('Failed'); }
  };

  const handleDeleteNote = async (noteId) => {
    try {
      await clientService.deleteNote(clientId, noteId);
      fetchClient();
    } catch { toast.error('Failed'); }
  };

  const handleDelete = async () => {
    try {
      await clientService.delete(clientId);
      toast.success('Client deleted');
      onUpdated?.();
      onClose();
    } catch { toast.error('Failed'); }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 bg-slate-900/20" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full max-w-2xl bg-white dark:bg-slate-900 shadow-xl animate-slide-in-right overflow-y-auto flex flex-col">
        {loading || !client ? (
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
                  <span className="font-mono text-xs text-slate-400">{client.clientId}</span>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{client.company}</h2>
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
                <Badge color={STATUS_COLORS[client.status]} size="sm">{STATUS_LABELS[client.status]}</Badge>
                {client.tags?.map((t) => <Badge key={t} color="default" size="sm">{t}</Badge>)}
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
              {editing ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Company</label>
                      <Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Status</label>
                      <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} options={STATUS_OPTIONS} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Source</label>
                      <Input value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Tags</label>
                      <Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="comma, separated" />
                    </div>
                  </div>
                  {form.status === 'churned' && (
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Churn Reason</label>
                      <Input value={form.churnReason} onChange={(e) => setForm({ ...form, churnReason: e.target.value })} placeholder="Why did they churn?" />
                    </div>
                  )}

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-medium text-slate-500">Contacts</label>
                      <button onClick={addContact} className="text-xs text-primary-600 hover:text-primary-700 font-medium">+ Add</button>
                    </div>
                    <div className="space-y-2">
                      {form.contacts?.map((c, i) => (
                        <div key={i} className="card p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input type="radio" checked={c.isPrimary} onChange={() => setPrimary(i)} className="text-primary-600" />
                              <span className="text-xs text-slate-600 dark:text-slate-400">{c.isPrimary ? 'Primary' : 'Set primary'}</span>
                            </label>
                            <button onClick={() => removeContact(i)} className="text-xs text-slate-400 hover:text-danger-600">Remove</button>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <Input value={c.name} onChange={(e) => updateContact(i, 'name', e.target.value)} placeholder="Name" />
                            <Input value={c.role} onChange={(e) => updateContact(i, 'role', e.target.value)} placeholder="Role" />
                            <Input value={c.email} onChange={(e) => updateContact(i, 'email', e.target.value)} placeholder="Email" />
                            <Input value={c.phone} onChange={(e) => updateContact(i, 'phone', e.target.value)} placeholder="Phone" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <Button variant="secondary" size="sm" onClick={() => setEditing(false)}>Cancel</Button>
                    <Button size="sm" onClick={handleSave} loading={saving}>Save</Button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="card p-3 text-center">
                      <p className="text-[10px] text-slate-400 uppercase">Lifetime Value</p>
                      <p className="text-sm font-bold text-emerald-600 mt-1">{fmtCurrency(client.lifetimeValue)}</p>
                    </div>
                    <div className="card p-3 text-center">
                      <p className="text-[10px] text-slate-400 uppercase">Projects</p>
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mt-1">{client.linkedProjects?.length || 0}</p>
                    </div>
                    <div className="card p-3 text-center">
                      <p className="text-[10px] text-slate-400 uppercase">Client Since</p>
                      <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mt-1">{fmtDate(client.clientSince)}</p>
                    </div>
                  </div>

                  {/* Contacts */}
                  <div>
                    <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2">Contacts</h4>
                    <div className="space-y-2">
                      {client.contacts?.length > 0 ? client.contacts.map((c) => (
                        <div key={c._id} className="card p-3 flex items-start gap-3">
                          <Avatar name={c.name} size="sm" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{c.name}</p>
                              {c.isPrimary && <Badge size="sm" color="primary">Primary</Badge>}
                            </div>
                            {c.role && <p className="text-xs text-slate-500 dark:text-slate-400">{c.role}</p>}
                            <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                              {c.email && <span>{c.email}</span>}
                              {c.phone && <span>{c.phone}</span>}
                            </div>
                          </div>
                        </div>
                      )) : <p className="text-sm text-slate-400">No contacts yet</p>}
                    </div>
                  </div>

                  {/* Linked Projects */}
                  {client.linkedProjects?.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2">Linked Projects</h4>
                      <div className="space-y-1.5">
                        {client.linkedProjects.map((p) => (
                          <div key={p._id} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800">
                            <div>
                              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{p.code} — {p.name}</p>
                            </div>
                            <Badge size="sm" color="default">{p.status}</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Portal Access (admin only) */}
                  {isAdmin && (
                    <div>
                      <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2">Client Portal Access</h4>
                      <div className="card p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-slate-600 dark:text-slate-400">
                            Status: <span className={client.portalEnabled ? 'text-emerald-600 font-medium' : 'text-slate-400'}>
                              {client.portalEnabled ? 'Enabled' : 'Disabled'}
                            </span>
                          </p>
                          <div className="flex gap-2">
                            <button
                              onClick={async () => {
                                try {
                                  const res = await portalService.enableAccess(client._id);
                                  const url = `${window.location.origin}${res.data.accessUrl}`;
                                  setPortalUrl(url);
                                  toast.success('Portal access generated');
                                  fetchClient();
                                } catch { toast.error('Failed to enable portal'); }
                              }}
                              className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                            >
                              {client.portalEnabled ? 'Regenerate Link' : 'Enable & Generate Link'}
                            </button>
                            {client.portalEnabled && (
                              <button
                                onClick={async () => {
                                  try {
                                    await portalService.disableAccess(client._id);
                                    setPortalUrl('');
                                    toast.success('Portal disabled');
                                    fetchClient();
                                  } catch { toast.error('Failed to disable'); }
                                }}
                                className="text-xs text-red-600 hover:text-red-700 font-medium"
                              >
                                Disable
                              </button>
                            )}
                          </div>
                        </div>
                        {portalUrl && (
                          <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded text-[11px] font-mono break-all flex items-center gap-2">
                            <span className="flex-1">{portalUrl}</span>
                            <button
                              onClick={() => { navigator.clipboard.writeText(portalUrl); toast.success('Copied'); }}
                              className="text-primary-600 hover:text-primary-700 shrink-0"
                            >
                              Copy
                            </button>
                          </div>
                        )}
                        {client.portalLastLogin && (
                          <p className="text-[10px] text-slate-400">Last login: {fmtDate(client.portalLastLogin)}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {client.status === 'churned' && client.churnReason && (
                    <div className="card p-3 bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800">
                      <h4 className="text-xs font-semibold text-danger-700 uppercase mb-1">Churn Reason</h4>
                      <p className="text-sm text-danger-600">{client.churnReason}</p>
                      {client.churnDate && <p className="text-[10px] text-danger-500 mt-1">Churned on {fmtDate(client.churnDate)}</p>}
                    </div>
                  )}

                  {/* Internal notes */}
                  <div>
                    <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2">Internal Notes</h4>
                    <div className="space-y-2 mb-3">
                      {client.internalNotes?.length > 0 ? client.internalNotes.map((note) => (
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
                      )) : <p className="text-xs text-slate-400">No notes yet</p>}
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
