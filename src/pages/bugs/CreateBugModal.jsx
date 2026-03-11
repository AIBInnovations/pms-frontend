import { useState, useEffect } from 'react';
import { bugService, projectService, taskService } from '../../services';
import { useToast } from '../../components/ui/Toast';
import { Button, Input, Select, Modal } from '../../components/ui';
import { BUG_SEVERITIES, TASK_PRIORITIES } from '../../utils/constants';

const initialForm = {
  project: '',
  title: '',
  description: '',
  severity: 'major',
  priority: 'medium',
  environment: '',
  stepsToReproduce: '',
  expectedResult: '',
  actualResult: '',
  assignee: '',
  relatedTask: '',
  dueDate: '',
};

const severityOptions = Object.entries(BUG_SEVERITIES).map(([value, label]) => ({ value, label }));
const priorityOptions = Object.entries(TASK_PRIORITIES).map(([value, label]) => ({ value, label }));

export default function CreateBugModal({ isOpen, onClose, onCreated }) {
  const [form, setForm] = useState({ ...initialForm });
  const [projects, setProjects] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [projectTasks, setProjectTasks] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();

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

  // Fetch team members and tasks when project changes
  useEffect(() => {
    if (!form.project) {
      setTeamMembers([]);
      setProjectTasks([]);
      return;
    }

    const fetchProjectData = async () => {
      try {
        const [teamRes, tasksRes] = await Promise.all([
          projectService.getTeam(form.project),
          taskService.getByProject(form.project, { limit: 200 }),
        ]);
        setTeamMembers(teamRes.data);
        setProjectTasks(tasksRes.data);
      } catch {
        toast.error('Failed to load project data');
      }
    };

    fetchProjectData();
  }, [form.project]);

  const handleChange = (field) => (e) => {
    const value = e.target.value;
    if (field === 'project') {
      setForm((prev) => ({ ...prev, project: value, assignee: '', relatedTask: '' }));
    } else {
      setForm((prev) => ({ ...prev, [field]: value }));
    }
  };

  const handleClose = () => {
    setForm({ ...initialForm });
    setTeamMembers([]);
    setProjectTasks([]);
    onClose();
  };

  const handleSubmit = async () => {
    if (!form.project) {
      toast.error('Please select a project');
      return;
    }
    if (!form.title.trim()) {
      toast.error('Please enter a bug title');
      return;
    }

    setSubmitting(true);
    try {
      const payload = { ...form };
      if (!payload.assignee) delete payload.assignee;
      if (!payload.relatedTask) delete payload.relatedTask;
      if (!payload.dueDate) delete payload.dueDate;

      await bugService.create(payload);
      toast.success('Bug reported successfully');
      setForm({ ...initialForm });
      setTeamMembers([]);
      setProjectTasks([]);
      onCreated();
    } catch (error) {
      const message = error.response?.data?.error?.message || 'Failed to report bug';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const projectOptions = projects.map((p) => ({ value: p._id, label: p.name }));
  const assigneeOptions = teamMembers.map((m) => ({ value: m._id, label: m.name }));
  const taskOptions = projectTasks.map((t) => ({ value: t._id, label: `${t.taskId} — ${t.title}` }));

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Report Bug"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit} loading={submitting}>Report Bug</Button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Project */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Project</label>
          <Select
            value={form.project}
            onChange={handleChange('project')}
            options={projectOptions}
            placeholder="Select project"
          />
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Title</label>
          <Input
            value={form.title}
            onChange={handleChange('title')}
            placeholder="Bug title"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Description</label>
          <textarea
            className="input-base min-h-[80px] resize-none"
            value={form.description}
            onChange={handleChange('description')}
            placeholder="Describe the bug (optional)"
          />
        </div>

        {/* Severity + Priority */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Severity</label>
            <Select
              value={form.severity}
              onChange={handleChange('severity')}
              options={severityOptions}
              placeholder="Select severity"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Priority</label>
            <Select
              value={form.priority}
              onChange={handleChange('priority')}
              options={priorityOptions}
              placeholder="Select priority"
            />
          </div>
        </div>

        {/* Environment */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Environment</label>
          <Input
            value={form.environment}
            onChange={handleChange('environment')}
            placeholder="e.g., Chrome 120, Windows 11, Production"
          />
        </div>

        {/* Steps to Reproduce */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Steps to Reproduce</label>
          <textarea
            className="input-base min-h-[80px] resize-none"
            value={form.stepsToReproduce}
            onChange={handleChange('stepsToReproduce')}
            placeholder="1. Go to...&#10;2. Click on...&#10;3. Observe..."
          />
        </div>

        {/* Expected Result + Actual Result */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Expected Result</label>
            <textarea
              className="input-base min-h-[60px] resize-none"
              value={form.expectedResult}
              onChange={handleChange('expectedResult')}
              placeholder="What should happen"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Actual Result</label>
            <textarea
              className="input-base min-h-[60px] resize-none"
              value={form.actualResult}
              onChange={handleChange('actualResult')}
              placeholder="What actually happens"
            />
          </div>
        </div>

        {/* Assignee + Related Task */}
        {form.project && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Assignee</label>
              <Select
                value={form.assignee}
                onChange={handleChange('assignee')}
                options={assigneeOptions}
                placeholder="Select assignee"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Related Task</label>
              <Select
                value={form.relatedTask}
                onChange={handleChange('relatedTask')}
                options={taskOptions}
                placeholder="Select task"
              />
            </div>
          </div>
        )}

        {/* Due Date */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Due Date</label>
            <Input
              type="date"
              value={form.dueDate}
              onChange={handleChange('dueDate')}
            />
          </div>
        </div>
      </div>
    </Modal>
  );
}
