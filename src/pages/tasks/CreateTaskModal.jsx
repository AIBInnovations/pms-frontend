import { useState, useEffect } from 'react';
import { taskService, projectService } from '../../services';
import { useToast } from '../../components/ui/Toast';
import { useAuth } from '../../context/AuthContext';
import { Button, Input, Select, Modal, Avatar } from '../../components/ui';
import { TASK_TYPES, TASK_PRIORITIES } from '../../utils/constants';

const initialForm = {
  project: '',
  title: '',
  description: '',
  type: 'feature',
  priority: 'medium',
  dueDate: '',
  assignees: [],
};

const typeOptions = Object.entries(TASK_TYPES).map(([value, label]) => ({ value, label }));
const priorityOptions = Object.entries(TASK_PRIORITIES).map(([value, label]) => ({ value, label }));

export default function CreateTaskModal({ isOpen, onClose, onCreated, defaultProjectId = null, defaultType = null }) {
  const [form, setForm] = useState({ ...initialForm });
  const [projects, setProjects] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();
  const { user } = useAuth();
  const isDeveloper = user?.role === 'developer';

  // Fetch projects when modal opens
  useEffect(() => {
    if (!isOpen) return;

    const fetchProjects = async () => {
      try {
        const { data } = await projectService.getAll({ limit: 100 });
        setProjects(data);
      } catch {
        toast.error('Failed to load projects');
      }
    };

    fetchProjects();
  }, [isOpen]);

  // Pre-fill defaults when modal opens
  useEffect(() => {
    if (isOpen) {
      setForm((prev) => ({
        ...prev,
        ...(defaultProjectId && { project: defaultProjectId }),
        ...(defaultType && { type: defaultType }),
      }));
    }
  }, [isOpen, defaultProjectId, defaultType]);

  // Fetch team members when project changes
  useEffect(() => {
    if (!form.project) {
      setTeamMembers([]);
      return;
    }

    const fetchTeam = async () => {
      try {
        const { data } = await projectService.getTeam(form.project);
        setTeamMembers(data);
      } catch {
        toast.error('Failed to load team members');
      }
    };

    fetchTeam();
  }, [form.project]);

  const handleChange = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value });
  };

  const toggleAssignee = (memberId) => {
    setForm((prev) => ({
      ...prev,
      assignees: prev.assignees.includes(memberId)
        ? prev.assignees.filter((id) => id !== memberId)
        : [...prev.assignees, memberId],
    }));
  };

  const handleClose = () => {
    setForm({ ...initialForm });
    setTeamMembers([]);
    onClose();
  };

  const handleSubmit = async () => {
    if (!form.project) {
      toast.error('Please select a project');
      return;
    }
    if (!form.title.trim()) {
      toast.error('Please enter a task title');
      return;
    }

    setSubmitting(true);
    try {
      const payload = { ...form };
      if (payload.dueDate) payload.dueDate = new Date(payload.dueDate).toISOString();
      await taskService.create(payload);
      toast.success('Task created successfully');
      setForm({ ...initialForm });
      setTeamMembers([]);
      onCreated();
    } catch (error) {
      const message = error.response?.data?.error?.message || 'Failed to create task';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const projectOptions = projects.map((p) => ({ value: p._id, label: p.name }));

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create Task"
      size="xl"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit} loading={submitting}>Create Task</Button>
        </div>
      }
    >
      <div className={`grid ${isDeveloper ? 'grid-cols-1' : 'grid-cols-2'} gap-x-6 gap-y-4`}>
        {/* Left column */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Project <span className="text-red-400">*</span></label>
            <Select
              value={form.project}
              onChange={handleChange('project')}
              options={projectOptions}
              placeholder="Select project"
              disabled={!!defaultProjectId}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Title <span className="text-red-400">*</span></label>
            <Input value={form.title} onChange={handleChange('title')} placeholder="Task title" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
            <textarea className="input-base min-h-[68px] resize-none" value={form.description} onChange={handleChange('description')} placeholder="Brief task description" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Type</label>
              <Select value={form.type} onChange={handleChange('type')} options={typeOptions} placeholder="Type" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Priority</label>
              <Select value={form.priority} onChange={handleChange('priority')} options={priorityOptions} placeholder="Priority" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Due Date & Time</label>
            <input
              type="datetime-local"
              value={form.dueDate}
              onChange={handleChange('dueDate')}
              className="input-base"
            />
          </div>
        </div>

        {/* Right column - Assignees (hidden for developers, auto-assigned on backend) */}
        {!isDeveloper && (
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Assignees
              {form.assignees.length > 0 && <span className="ml-1.5 text-xs font-normal text-primary-600 dark:text-primary-400">{form.assignees.length} selected</span>}
            </label>
            {!form.project ? (
              <div className="border border-slate-200 dark:border-slate-600 rounded-xl p-8 text-center">
                <p className="text-sm text-slate-400">Select a project first</p>
              </div>
            ) : (
              <div className="border border-slate-200 dark:border-slate-600 rounded-xl overflow-y-auto max-h-[320px] p-2 space-y-0.5">
                {teamMembers.length === 0 ? (
                  <p className="text-sm text-slate-400 py-3 text-center">No team members found</p>
                ) : (
                  teamMembers.map((member) => (
                    <label
                      key={member._id}
                      className={`flex items-center gap-2.5 py-1.5 px-2 rounded-lg cursor-pointer transition-colors ${
                        form.assignees.includes(member._id) ? 'bg-primary-50 dark:bg-primary-900/20' : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'
                      }`}
                    >
                      <input type="checkbox" checked={form.assignees.includes(member._id)} onChange={() => toggleAssignee(member._id)} className="rounded border-slate-300 dark:border-slate-600 text-primary-600 focus:ring-primary-500" />
                      <Avatar name={member.name} src={member.avatar} size="sm" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">{member.name}</p>
                        <p className="text-xs text-slate-400 truncate">{member.projectRole}</p>
                      </div>
                    </label>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
