import { useState, useEffect } from 'react';
import { leadService } from '../../services';
import { useToast } from '../../components/ui/Toast';
import { Button, Input, Select, Modal } from '../../components/ui';
import {
  LEAD_STATUSES, LEAD_SOURCES, LEAD_PIPELINES, LEAD_BUDGETS, LEAD_SERVICES,
} from '../../utils/constants';

const initialForm = {
  contactName: '',
  company: '',
  email: '',
  phone: '',
  source: 'other',
  status: 'new',
  pipeline: 'new_business',
  assignee: '',
  budgetRange: '',
  dealValue: '',
  serviceInterest: [],
  priority: false,
  description: '',
};

export default function CreateLeadModal({ isOpen, onClose, onCreated, salesUsers }) {
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState(null);
  const toast = useToast();

  useEffect(() => {
    if (!isOpen) {
      setForm(initialForm);
      setDuplicateWarning(null);
    }
  }, [isOpen]);

  // Check for duplicate when email or company changes
  useEffect(() => {
    if (!form.email && !form.company) { setDuplicateWarning(null); return; }
    const t = setTimeout(async () => {
      try {
        const res = await leadService.checkDuplicate(form.email, form.company);
        setDuplicateWarning(res.data || null);
      } catch { /* ignore */ }
    }, 500);
    return () => clearTimeout(t);
  }, [form.email, form.company]);

  const handleChange = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const toggleService = (s) => {
    setForm((prev) => ({
      ...prev,
      serviceInterest: prev.serviceInterest.includes(s)
        ? prev.serviceInterest.filter((x) => x !== s)
        : [...prev.serviceInterest, s],
    }));
  };

  const handleSubmit = async () => {
    if (!form.contactName.trim()) { toast.error('Contact name is required'); return; }
    setSubmitting(true);
    try {
      const payload = { ...form };
      if (payload.dealValue) payload.dealValue = Number(payload.dealValue);
      else delete payload.dealValue;
      if (!payload.assignee) delete payload.assignee;
      await leadService.create(payload);
      toast.success('Lead created');
      onCreated();
    } catch (e) {
      toast.error(e.response?.data?.error?.message || 'Failed to create lead');
    } finally {
      setSubmitting(false);
    }
  };

  const sourceOptions = Object.entries(LEAD_SOURCES).map(([v, l]) => ({ value: v, label: l }));
  const statusOptions = Object.entries(LEAD_STATUSES).filter(([k]) => k !== 'lost').map(([v, l]) => ({ value: v, label: l }));
  const pipelineOptions = Object.entries(LEAD_PIPELINES).map(([v, l]) => ({ value: v, label: l }));
  const budgetOptions = Object.entries(LEAD_BUDGETS).map(([v, l]) => ({ value: v, label: l }));
  const assigneeOptions = salesUsers.map((u) => ({ value: u._id, label: u.name }));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Lead"
      size="xl"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} loading={submitting}>Create Lead</Button>
        </div>
      }
    >
      <div className="space-y-4">
        {duplicateWarning && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3 text-sm text-amber-700 dark:text-amber-400">
            ⚠️ A lead with similar email or company already exists: <strong>{duplicateWarning.contactName}</strong> ({duplicateWarning.leadId})
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Contact Name <span className="text-red-400">*</span></label>
            <Input value={form.contactName} onChange={handleChange('contactName')} placeholder="John Doe" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Company</label>
            <Input value={form.company} onChange={handleChange('company')} placeholder="Acme Inc" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
            <Input type="email" value={form.email} onChange={handleChange('email')} placeholder="john@acme.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Phone</label>
            <Input value={form.phone} onChange={handleChange('phone')} placeholder="+91 ..." />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Source</label>
            <Select value={form.source} onChange={handleChange('source')} options={sourceOptions} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Status</label>
            <Select value={form.status} onChange={handleChange('status')} options={statusOptions} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Pipeline</label>
            <Select value={form.pipeline} onChange={handleChange('pipeline')} options={pipelineOptions} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Assignee</label>
            <Select value={form.assignee} onChange={handleChange('assignee')} options={assigneeOptions} placeholder="Unassigned" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Budget Range</label>
            <Select value={form.budgetRange} onChange={handleChange('budgetRange')} options={budgetOptions} placeholder="Not specified" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Estimated Deal Value (₹)</label>
            <Input type="number" value={form.dealValue} onChange={handleChange('dealValue')} placeholder="0" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Service Interest</label>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(LEAD_SERVICES).map(([key, label]) => {
              const selected = form.serviceInterest.includes(key);
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggleService(key)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    selected
                      ? 'bg-primary-600 text-white border-primary-600'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-slate-400'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
          <textarea
            className="input-base min-h-[80px] resize-none"
            value={form.description}
            onChange={handleChange('description')}
            placeholder="Initial notes about this lead..."
          />
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.priority}
            onChange={(e) => setForm({ ...form, priority: e.target.checked })}
            className="rounded border-slate-300 dark:border-slate-600 text-primary-600 focus:ring-primary-500"
          />
          <span className="text-sm text-slate-700 dark:text-slate-300">Mark as High Priority</span>
        </label>
      </div>
    </Modal>
  );
}
