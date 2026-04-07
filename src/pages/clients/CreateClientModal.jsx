import { useState, useEffect } from 'react';
import { clientService } from '../../services';
import { useToast } from '../../components/ui/Toast';
import { Button, Input, Select, Modal } from '../../components/ui';

const initial = {
  company: '',
  source: '',
  status: 'active',
  tags: '',
  contacts: [{ name: '', role: '', email: '', phone: '', isPrimary: true }],
};

const STATUS_OPTIONS = [
  { value: 'prospect', label: 'Prospect' },
  { value: 'active', label: 'Active' },
  { value: 'on_hold', label: 'On Hold' },
];

export default function CreateClientModal({ isOpen, onClose, onCreated }) {
  const toast = useToast();
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (!isOpen) setForm(initial); }, [isOpen]);

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
      contacts: [...prev.contacts, { name: '', role: '', email: '', phone: '', isPrimary: false }],
    }));
  };

  const removeContact = (idx) => {
    setForm((prev) => ({
      ...prev,
      contacts: prev.contacts.filter((_, i) => i !== idx),
    }));
  };

  const handleSave = async () => {
    if (!form.company.trim()) { toast.error('Company is required'); return; }
    if (!form.contacts[0]?.name?.trim()) { toast.error('At least one contact name is required'); return; }
    setSaving(true);
    try {
      const payload = {
        ...form,
        contacts: form.contacts.filter((c) => c.name.trim()),
        tags: form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      };
      await clientService.create(payload);
      toast.success('Client created');
      onCreated();
    } catch (e) {
      toast.error(e.response?.data?.error?.message || 'Failed to create');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Client"
      size="xl"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} loading={saving}>Create Client</Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Company <span className="text-red-400">*</span></label>
            <Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} placeholder="Acme Inc" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Status</label>
            <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} options={STATUS_OPTIONS} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Source</label>
            <Input value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} placeholder="Referral, website..." />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tags</label>
            <Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="Enterprise, High Value (comma-separated)" />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Contacts</label>
            <button onClick={addContact} className="text-xs text-primary-600 hover:text-primary-700 font-medium">+ Add Contact</button>
          </div>
          <div className="space-y-2">
            {form.contacts.map((c, i) => (
              <div key={i} className="card p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={c.isPrimary}
                      onChange={() => setPrimary(i)}
                      className="text-primary-600"
                    />
                    <span className="text-xs text-slate-600 dark:text-slate-400">{c.isPrimary ? 'Primary contact' : 'Set as primary'}</span>
                  </label>
                  {form.contacts.length > 1 && (
                    <button onClick={() => removeContact(i)} className="text-xs text-slate-400 hover:text-danger-600">Remove</button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input value={c.name} onChange={(e) => updateContact(i, 'name', e.target.value)} placeholder="Name *" />
                  <Input value={c.role} onChange={(e) => updateContact(i, 'role', e.target.value)} placeholder="Role / Title" />
                  <Input type="email" value={c.email} onChange={(e) => updateContact(i, 'email', e.target.value)} placeholder="Email" />
                  <Input value={c.phone} onChange={(e) => updateContact(i, 'phone', e.target.value)} placeholder="Phone" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}
