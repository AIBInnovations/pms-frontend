import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { proposalService, leadService, clientService } from '../../services';
import { useToast } from '../../components/ui/Toast';
import { Button, Badge, Input, Select, Skeleton } from '../../components/ui';

const STATUS_LABELS = {
  draft: 'Draft', sent: 'Sent', viewed: 'Viewed', accepted: 'Accepted', rejected: 'Rejected',
};
const STATUS_COLORS = {
  draft: 'default', sent: 'primary', viewed: 'warning', accepted: 'success', rejected: 'danger',
};

function fmtCurrency(n) {
  return `\u20B9${(n || 0).toLocaleString('en-IN')}`;
}

function fmtDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function ProposalEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [searchParams] = useSearchParams();
  const isNew = !id;

  const [proposal, setProposal] = useState(null);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [leads, setLeads] = useState([]);
  const [clients, setClients] = useState([]);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showVersions, setShowVersions] = useState(false);

  const [form, setForm] = useState({
    lead: searchParams.get('lead') || '',
    client: searchParams.get('client') || '',
    title: '',
    summary: '',
    lineItems: [],
    discountType: 'none',
    discountValue: 0,
    paymentTerms: [],
    validityDate: '',
    notes: '',
  });

  // Fetch lead/client lists for dropdowns
  useEffect(() => {
    Promise.all([
      leadService.getAll({ limit: 200 }),
      clientService.getAll({ limit: 200 }),
    ]).then(([l, c]) => {
      setLeads(l.data || []);
      setClients(c.data || []);
    }).catch(() => {});
  }, []);

  const fetchProposal = useCallback(async () => {
    if (isNew) return;
    setLoading(true);
    try {
      const res = await proposalService.getById(id);
      setProposal(res.data);
      setForm({
        lead: res.data.lead?._id || '',
        client: res.data.client?._id || '',
        title: res.data.title || '',
        summary: res.data.summary || '',
        lineItems: res.data.lineItems || [],
        discountType: res.data.discountType || 'none',
        discountValue: res.data.discountValue || 0,
        paymentTerms: res.data.paymentTerms || [],
        validityDate: res.data.validityDate ? new Date(res.data.validityDate).toISOString().split('T')[0] : '',
        notes: res.data.notes || '',
      });
    } catch {
      toast.error('Failed to load proposal');
    } finally {
      setLoading(false);
    }
  }, [id, isNew, toast]);

  useEffect(() => { fetchProposal(); }, [fetchProposal]);

  // Calculations
  const subtotal = form.lineItems.reduce((sum, li) => sum + ((li.quantity || 0) * (li.unitPrice || 0)), 0);
  let discountAmount = 0;
  if (form.discountType === 'percentage') discountAmount = subtotal * (form.discountValue / 100);
  else if (form.discountType === 'fixed') discountAmount = Number(form.discountValue) || 0;
  const total = Math.max(0, subtotal - discountAmount);

  const updateLineItem = (idx, field, value) => {
    setForm((prev) => ({
      ...prev,
      lineItems: prev.lineItems.map((li, i) => i === idx ? { ...li, [field]: value } : li),
    }));
  };

  const addLineItem = () => {
    setForm((prev) => ({
      ...prev,
      lineItems: [...prev.lineItems, { description: '', quantity: 1, unitPrice: 0, type: 'one_time' }],
    }));
  };

  const removeLineItem = (idx) => {
    setForm((prev) => ({ ...prev, lineItems: prev.lineItems.filter((_, i) => i !== idx) }));
  };

  const moveLineItem = (idx, direction) => {
    setForm((prev) => {
      const items = [...prev.lineItems];
      const newIdx = idx + direction;
      if (newIdx < 0 || newIdx >= items.length) return prev;
      [items[idx], items[newIdx]] = [items[newIdx], items[idx]];
      return { ...prev, lineItems: items };
    });
  };

  const addMilestone = () => {
    setForm((prev) => ({
      ...prev,
      paymentTerms: [...prev.paymentTerms, { label: '', percentage: 0, dueOn: '' }],
    }));
  };

  const updateMilestone = (idx, field, value) => {
    setForm((prev) => ({
      ...prev,
      paymentTerms: prev.paymentTerms.map((m, i) => i === idx ? { ...m, [field]: value } : m),
    }));
  };

  const removeMilestone = (idx) => {
    setForm((prev) => ({ ...prev, paymentTerms: prev.paymentTerms.filter((_, i) => i !== idx) }));
  };

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error('Title is required'); return; }
    setSaving(true);
    try {
      const payload = { ...form };
      if (!payload.lead) delete payload.lead;
      if (!payload.client) delete payload.client;
      if (!payload.validityDate) delete payload.validityDate;
      payload.discountValue = Number(payload.discountValue) || 0;
      payload.lineItems = payload.lineItems.map((li) => ({
        description: li.description,
        quantity: Number(li.quantity) || 0,
        unitPrice: Number(li.unitPrice) || 0,
        type: li.type || 'one_time',
      }));

      if (isNew) {
        const res = await proposalService.create(payload);
        toast.success('Proposal created');
        navigate(`/proposals/${res.data._id}/edit`, { replace: true });
      } else {
        await proposalService.update(id, payload);
        toast.success('Proposal updated');
        fetchProposal();
      }
    } catch (e) {
      toast.error(e.response?.data?.error?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (newStatus === 'rejected') {
      setShowRejectForm(true);
      return;
    }
    try {
      await proposalService.updateStatus(id, newStatus);
      toast.success('Status updated');
      fetchProposal();
    } catch { toast.error('Failed'); }
  };

  const handleConfirmReject = async () => {
    try {
      await proposalService.updateStatus(id, 'rejected', rejectionReason);
      toast.success('Marked as rejected');
      setShowRejectForm(false);
      setRejectionReason('');
      fetchProposal();
    } catch { toast.error('Failed'); }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton variant="text" className="w-48 h-8" />
        <Skeleton variant="card" className="h-96" />
      </div>
    );
  }

  const leadOptions = leads.map((l) => ({ value: l._id, label: `${l.leadId} — ${l.contactName}${l.company ? ` (${l.company})` : ''}` }));
  const clientOptions = clients.map((c) => ({ value: c._id, label: `${c.clientId} — ${c.company}` }));

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <button onClick={() => navigate('/proposals')} className="text-xs text-slate-500 hover:text-slate-700 mb-1 flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            Back to Proposals
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              {isNew ? 'New Proposal' : proposal?.title}
            </h1>
            {proposal && (
              <>
                <span className="text-xs font-mono text-slate-400">{proposal.proposalNumber} · v{proposal.version}</span>
                <Badge size="sm" color={STATUS_COLORS[proposal.status]}>{STATUS_LABELS[proposal.status]}</Badge>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isNew && proposal?.versions?.length > 0 && (
            <Button variant="secondary" size="sm" onClick={() => setShowVersions(!showVersions)}>
              History ({proposal.versions.length})
            </Button>
          )}
          <Button onClick={handleSave} loading={saving}>{isNew ? 'Create' : 'Save'}</Button>
        </div>
      </div>

      {/* Status flow buttons */}
      {!isNew && proposal && (
        <div className="card p-3 flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-500 mr-2">Status:</span>
          {Object.entries(STATUS_LABELS).map(([key, label]) => (
            <button
              key={key}
              onClick={() => handleStatusChange(key)}
              disabled={proposal.status === key}
              className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                proposal.status === key
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-slate-400'
              }`}
            >
              {label}
            </button>
          ))}
          {proposal.sentAt && <span className="text-[10px] text-slate-400 ml-2">Sent: {fmtDate(proposal.sentAt)}</span>}
          {proposal.acceptedAt && <span className="text-[10px] text-emerald-600 ml-2">Accepted: {fmtDate(proposal.acceptedAt)}</span>}
        </div>
      )}

      {/* Reject reason form */}
      {showRejectForm && (
        <div className="card p-4 bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800">
          <h4 className="text-sm font-semibold text-danger-700 mb-2">Mark as Rejected</h4>
          <Input value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} placeholder="Rejection reason" />
          <div className="flex justify-end gap-2 mt-2">
            <Button variant="secondary" size="sm" onClick={() => setShowRejectForm(false)}>Cancel</Button>
            <Button size="sm" variant="danger" onClick={handleConfirmReject}>Confirm Rejection</Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Editor */}
        <div className="space-y-4">
          <div className="card p-5 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Lead</label>
                <Select value={form.lead} onChange={(e) => setForm({ ...form, lead: e.target.value })} options={leadOptions} placeholder="Select lead (optional)" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Client</label>
                <Select value={form.client} onChange={(e) => setForm({ ...form, client: e.target.value })} options={clientOptions} placeholder="Select client (optional)" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Title <span className="text-red-400">*</span></label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Proposal title" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Summary</label>
              <textarea
                className="input-base min-h-[80px] resize-none text-sm"
                value={form.summary}
                onChange={(e) => setForm({ ...form, summary: e.target.value })}
                placeholder="Executive summary..."
              />
            </div>
          </div>

          {/* Line items */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Line Items</h3>
              <Button size="sm" variant="secondary" onClick={addLineItem}>+ Add Item</Button>
            </div>
            <div className="space-y-2">
              {form.lineItems.map((li, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-start">
                  <div className="col-span-5">
                    <Input value={li.description} onChange={(e) => updateLineItem(idx, 'description', e.target.value)} placeholder="Description" />
                  </div>
                  <div className="col-span-2">
                    <Input type="number" value={li.quantity} onChange={(e) => updateLineItem(idx, 'quantity', Number(e.target.value))} placeholder="Qty" />
                  </div>
                  <div className="col-span-2">
                    <Input type="number" value={li.unitPrice} onChange={(e) => updateLineItem(idx, 'unitPrice', Number(e.target.value))} placeholder="Price" />
                  </div>
                  <div className="col-span-2">
                    <Select
                      value={li.type}
                      onChange={(e) => updateLineItem(idx, 'type', e.target.value)}
                      options={[{ value: 'one_time', label: 'One-time' }, { value: 'recurring', label: 'Recurring' }]}
                    />
                  </div>
                  <div className="col-span-1 flex items-center gap-0.5 pt-1.5">
                    <button onClick={() => moveLineItem(idx, -1)} disabled={idx === 0} className="text-slate-300 hover:text-slate-600 disabled:opacity-30">↑</button>
                    <button onClick={() => moveLineItem(idx, 1)} disabled={idx === form.lineItems.length - 1} className="text-slate-300 hover:text-slate-600 disabled:opacity-30">↓</button>
                    <button onClick={() => removeLineItem(idx)} className="text-slate-300 hover:text-danger-500">×</button>
                  </div>
                </div>
              ))}
              {form.lineItems.length === 0 && <p className="text-xs text-slate-400 text-center py-3">No line items. Click Add Item.</p>}
            </div>
          </div>

          {/* Discount */}
          <div className="card p-5 space-y-3">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Discount</h3>
            <div className="grid grid-cols-2 gap-3">
              <Select
                value={form.discountType}
                onChange={(e) => setForm({ ...form, discountType: e.target.value })}
                options={[
                  { value: 'none', label: 'No Discount' },
                  { value: 'percentage', label: 'Percentage (%)' },
                  { value: 'fixed', label: 'Fixed (₹)' },
                ]}
              />
              {form.discountType !== 'none' && (
                <Input type="number" value={form.discountValue} onChange={(e) => setForm({ ...form, discountValue: e.target.value })} placeholder="Value" />
              )}
            </div>
          </div>

          {/* Payment terms */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Payment Terms</h3>
              <Button size="sm" variant="secondary" onClick={addMilestone}>+ Add Milestone</Button>
            </div>
            <div className="space-y-2">
              {form.paymentTerms.map((m, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2">
                  <div className="col-span-5">
                    <Input value={m.label} onChange={(e) => updateMilestone(idx, 'label', e.target.value)} placeholder="Label (e.g. Upfront)" />
                  </div>
                  <div className="col-span-3">
                    <Input type="number" value={m.percentage || ''} onChange={(e) => updateMilestone(idx, 'percentage', Number(e.target.value))} placeholder="%" />
                  </div>
                  <div className="col-span-3">
                    <Input value={m.dueOn} onChange={(e) => updateMilestone(idx, 'dueOn', e.target.value)} placeholder="Due on (e.g. signing)" />
                  </div>
                  <div className="col-span-1 flex items-center justify-center pt-1.5">
                    <button onClick={() => removeMilestone(idx)} className="text-slate-300 hover:text-danger-500">×</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Validity & Notes */}
          <div className="card p-5 space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Validity Date</label>
              <Input type="date" value={form.validityDate} onChange={(e) => setForm({ ...form, validityDate: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Notes / Terms</label>
              <textarea
                className="input-base min-h-[80px] resize-none text-sm"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Additional terms and conditions..."
              />
            </div>
          </div>
        </div>

        {/* Live Preview */}
        <div className="space-y-4">
          <div className="card p-6 sticky top-4">
            <h3 className="text-xs font-semibold text-slate-500 uppercase mb-4">Preview</h3>

            <div className="border-b border-slate-200 dark:border-slate-700 pb-4 mb-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{form.title || 'Untitled Proposal'}</h2>
              {form.summary && <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 whitespace-pre-wrap">{form.summary}</p>}
            </div>

            {form.lineItems.length > 0 && (
              <div className="mb-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700">
                      <th className="text-left text-xs text-slate-500 py-2">Description</th>
                      <th className="text-right text-xs text-slate-500 py-2">Qty</th>
                      <th className="text-right text-xs text-slate-500 py-2">Price</th>
                      <th className="text-right text-xs text-slate-500 py-2">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {form.lineItems.map((li, idx) => (
                      <tr key={idx} className="border-b border-slate-100 dark:border-slate-800">
                        <td className="py-2 text-slate-700 dark:text-slate-300">
                          {li.description || '(no description)'}
                          {li.type === 'recurring' && <span className="text-[10px] text-primary-600 ml-1">/month</span>}
                        </td>
                        <td className="py-2 text-right text-slate-600 dark:text-slate-400">{li.quantity}</td>
                        <td className="py-2 text-right text-slate-600 dark:text-slate-400">{fmtCurrency(li.unitPrice)}</td>
                        <td className="py-2 text-right font-medium text-slate-700 dark:text-slate-300">{fmtCurrency((li.quantity || 0) * (li.unitPrice || 0))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Subtotal</span>
                <span className="font-medium text-slate-700 dark:text-slate-300">{fmtCurrency(subtotal)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Discount</span>
                  <span className="font-medium text-red-500">-{fmtCurrency(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-700">
                <span className="text-base font-semibold text-slate-900 dark:text-slate-100">Total</span>
                <span className="text-base font-bold text-emerald-600">{fmtCurrency(total)}</span>
              </div>
            </div>

            {form.paymentTerms.length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2">Payment Terms</h4>
                <ul className="space-y-1 text-xs text-slate-600 dark:text-slate-400">
                  {form.paymentTerms.map((m, idx) => (
                    <li key={idx}>• {m.label} {m.percentage > 0 && `(${m.percentage}%)`} {m.dueOn && `— ${m.dueOn}`}</li>
                  ))}
                </ul>
              </div>
            )}

            {form.notes && (
              <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2">Notes</h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 whitespace-pre-wrap">{form.notes}</p>
              </div>
            )}

            {form.validityDate && (
              <p className="text-[10px] text-slate-400 mt-4">Valid until {fmtDate(form.validityDate)}</p>
            )}
          </div>

          {/* Version history */}
          {showVersions && proposal?.versions?.length > 0 && (
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">Version History</h3>
              <div className="space-y-2">
                {proposal.versions.slice().reverse().map((v) => (
                  <div key={v._id} className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-700 dark:text-slate-300">v{v.version}</span>
                      <span className="text-[10px] text-slate-400">{fmtDate(v.snapshotAt)}</span>
                    </div>
                    {v.revisionNote && <p className="text-xs text-slate-500 mt-1">{v.revisionNote}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
