import { useState, useEffect } from 'react';
import { projectService, userService } from '../../services';
import { useToast } from '../../components/ui/Toast';
import { Button, Input, Select, Modal } from '../../components/ui';
import { PROJECT_TYPES, PROJECT_DOMAINS, PROJECT_DOMAIN_COLORS } from '../../utils/constants';

const initialForm = {
  name: '',
  description: '',
  type: '',
  startDate: '',
  endDate: '',
  budget: '',
  projectManager: '',
  developers: [],
  domains: [],
};

const typeOptions = Object.entries(PROJECT_TYPES).map(([value, label]) => ({ value, label }));

export default function CreateProjectModal({ isOpen, onClose, onCreated }) {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [pmOptions, setPmOptions] = useState([]);
  const [developerList, setDeveloperList] = useState([]);
  const toast = useToast();

  useEffect(() => {
    if (!isOpen) {
      setForm(initialForm);
      setErrors({});
      return;
    }

    const fetchOptions = async () => {
      try {
        const [pmRes, devRes] = await Promise.all([
          userService.getAll({ role: 'project_manager', status: 'active', limit: 100 }),
          userService.getAll({ role: 'developer', status: 'active', limit: 100 }),
        ]);

        // Also fetch super_admins as PM candidates
        const adminRes = await userService.getAll({ role: 'super_admin', status: 'active', limit: 100 });

        const pmUsers = [...(pmRes.data || []), ...(adminRes.data || [])];
        setPmOptions(pmUsers.map((u) => ({ value: u._id, label: u.name })));
        setDeveloperList(devRes.data || []);
      } catch {
        toast.error('Failed to load team members');
      }
    };

    fetchOptions();
  }, [isOpen]);

  const handleChange = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value });
    if (errors[field]) setErrors({ ...errors, [field]: '' });
  };

  const toggleDeveloper = (devId) => {
    setForm((prev) => ({
      ...prev,
      developers: prev.developers.includes(devId)
        ? prev.developers.filter((id) => id !== devId)
        : [...prev.developers, devId],
    }));
  };

  const validate = () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = 'Name is required';
    if (!form.type) newErrors.type = 'Type is required';
    if (!form.projectManager) newErrors.projectManager = 'Project Manager is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      await projectService.create(form);
      toast.success('Project created');
      onCreated();
    } catch (error) {
      const message = error.response?.data?.error?.message || 'Failed to create project';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Project"
      size="xl"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} loading={submitting}>Create Project</Button>
        </div>
      }
    >
      <div className="grid grid-cols-2 gap-x-6 gap-y-4">
        {/* Left column */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Project Name <span className="text-red-400">*</span></label>
            <Input
              placeholder="Project name"
              value={form.name}
              onChange={handleChange('name')}
              error={errors.name}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
            <textarea
              className="input-base min-h-[68px] resize-none"
              placeholder="Brief project description"
              value={form.description}
              onChange={handleChange('description')}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Type <span className="text-red-400">*</span></label>
              <Select
                value={form.type}
                onChange={handleChange('type')}
                options={typeOptions}
                placeholder="Select type"
                error={errors.type}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Budget</label>
              <Input
                type="number"
                placeholder="0.00"
                value={form.budget}
                onChange={handleChange('budget')}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Start Date</label>
              <Input type="date" value={form.startDate} onChange={handleChange('startDate')} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">End Date</label>
              <Input type="date" value={form.endDate} onChange={handleChange('endDate')} />
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Project Manager <span className="text-red-400">*</span></label>
            <Select
              value={form.projectManager}
              onChange={handleChange('projectManager')}
              options={pmOptions}
              placeholder="Select PM"
              error={errors.projectManager}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Developers
              {form.developers.length > 0 && (
                <span className="ml-1.5 text-xs font-normal text-primary-600 dark:text-primary-400">
                  {form.developers.length} selected
                </span>
              )}
            </label>
            <div className="max-h-[200px] overflow-y-auto space-y-0.5 border border-slate-200 dark:border-slate-600 rounded-xl p-2">
              {developerList.length === 0 && (
                <p className="text-sm text-slate-400 py-2 text-center">No developers available</p>
              )}
              {developerList.map((dev) => (
                <label
                  key={dev._id}
                  className={`flex items-center gap-2.5 py-1.5 px-2 rounded-lg cursor-pointer transition-colors ${
                    form.developers.includes(dev._id)
                      ? 'bg-primary-50 dark:bg-primary-900/20'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'
                  }`}
                >
                  <input
                    type="checkbox"
                    className="rounded border-slate-300 dark:border-slate-600 text-primary-600 focus:ring-primary-500"
                    checked={form.developers.includes(dev._id)}
                    onChange={() => toggleDeveloper(dev._id)}
                  />
                  {dev.avatar ? (
                    <img src={dev.avatar} alt={dev.name} className="w-6 h-6 rounded-full object-cover" />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 flex items-center justify-center text-xs font-medium">
                      {dev.name?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="text-sm text-slate-700 dark:text-slate-300">{dev.name}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Domains (full width below) */}
        <div className="col-span-2 mt-1">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Domains
            {form.domains.length > 0 && (
              <span className="ml-1.5 text-xs font-normal text-primary-600 dark:text-primary-400">
                {form.domains.length} selected
              </span>
            )}
          </label>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(PROJECT_DOMAINS).map(([key, label]) => {
              const selected = form.domains.includes(key);
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setForm((prev) => ({
                    ...prev,
                    domains: selected ? prev.domains.filter((d) => d !== key) : [...prev.domains, key],
                  }))}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                    selected
                      ? 'text-white border-transparent'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-slate-400'
                  }`}
                  style={selected ? { backgroundColor: PROJECT_DOMAIN_COLORS[key] } : {}}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </Modal>
  );
}
