import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import CommentSection from '../../components/comments/CommentSection';
import KanbanBoard from '../tasks/KanbanBoard';
import TaskDetailDrawer from '../tasks/TaskDetailDrawer';
import CreateTaskModal from '../tasks/CreateTaskModal';
import { projectService, taskService, userService } from '../../services';
import { useToast } from '../../components/ui/Toast';
import { Button, Badge, Avatar, EmptyState, Skeleton, Input, Select } from '../../components/ui';
import {
  PROJECT_TYPES, PROJECT_STATUSES, PROJECT_STATUS_COLORS,
  PROJECT_DOMAINS, PROJECT_DOMAIN_COLORS,
  TASK_STAGES, TASK_STAGE_COLORS, TASK_PRIORITY_COLORS, TASK_PRIORITIES,
  MILESTONE_STATUSES,
} from '../../utils/constants';

// ─── Helpers ──────────────────────────────────────────
function formatDate(dateStr) {
  if (!dateStr) return '--';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
function toInputDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toISOString().split('T')[0];
}

// ─── SVG Icons ────────────────────────────────────────
const BoardIcon = ({ className = 'w-4 h-4' }) => <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 4.5v15m6-15v15m-10.875 0h15.75c.621 0 1.125-.504 1.125-1.125V5.625c0-.621-.504-1.125-1.125-1.125H4.125C3.504 4.5 3 5.004 3 5.625v12.75c0 .621.504 1.125 1.125 1.125z" /></svg>;
const ListIcon = ({ className = 'w-4 h-4' }) => <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg>;

// ─── Tab config with icons ────────────────────────────
const TABS = [
  {
    id: 'tasks', label: 'Tasks',
    icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  },
  {
    id: 'milestones', label: 'Milestones',
    icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0l2.77-.693a9 9 0 016.208.682l.108.054a9 9 0 006.086.71l3.114-.732a48.524 48.524 0 01-.005-10.499l-3.11.732a9 9 0 01-6.085-.711l-.108-.054a9 9 0 00-6.208-.682L3 4.5M3 15V4.5" /></svg>,
  },
  {
    id: 'team', label: 'Team',
    icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>,
  },
  {
    id: 'details', label: 'Details',
    icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" /></svg>,
  },
  {
    id: 'discussion', label: 'Discussion',
    icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" /></svg>,
  },
];

const statusOptions = Object.entries(PROJECT_STATUSES).map(([v, l]) => ({ value: v, label: l }));
const typeOptions = Object.entries(PROJECT_TYPES).map(([v, l]) => ({ value: v, label: l }));

// ─── Main Component ───────────────────────────────────
export default function ProjectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();

  const canEdit = ['super_admin', 'project_manager'].includes(user?.role);

  // Core state
  const [activeTab, setActiveTab] = useState('tasks');
  const [taskView, setTaskView] = useState('board'); // 'board' | 'list'
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [tasksMeta, setTasksMeta] = useState(null);
  const [taskStats, setTaskStats] = useState(null);
  const [milestones, setMilestones] = useState([]);
  const [error, setError] = useState(null);

  // Task modals
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState(null);

  // Milestone form
  const [showMilestoneForm, setShowMilestoneForm] = useState(false);
  const [milestoneForm, setMilestoneForm] = useState({ title: '', dueDate: '' });
  const [milestoneLoading, setMilestoneLoading] = useState(false);

  // Details edit form
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [pmOptions, setPmOptions] = useState([]);
  const [devOptions, setDevOptions] = useState([]);

  // Inline GitHub links editor
  const [ghEditing, setGhEditing] = useState(false);
  const [ghLinks, setGhLinks] = useState([]);
  const [ghSaving, setGhSaving] = useState(false);

  // Inline team editor
  const [teamEditing, setTeamEditing] = useState(false);
  const [teamPm, setTeamPm] = useState('');
  const [teamDevs, setTeamDevs] = useState([]);
  const [teamSaving, setTeamSaving] = useState(false);

  // ─── Data fetching ──────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [projectRes, tasksRes, statsRes, milestonesRes] = await Promise.all([
        projectService.getById(id),
        taskService.getByProject(id, { limit: 200 }),
        taskService.getStats(id),
        projectService.getMilestones(id),
      ]);
      setProject(projectRes.data);
      setTasks(tasksRes.data || []);
      setTasksMeta(tasksRes.meta || null);
      setTaskStats(statsRes.data);
      setMilestones(milestonesRes.data || []);
    } catch {
      setError('Failed to load project details');
      toast.error('Failed to load project details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ─── Task actions ───────────────────────────────────
  const handleTransition = async (taskId, newStage) => {
    try {
      await taskService.transition(taskId, newStage);
      setTasks((prev) => prev.map((t) => (t._id === taskId ? { ...t, stage: newStage } : t)));
    } catch (error) {
      const code = error.response?.data?.error?.code;
      const message = error.response?.data?.error?.message || 'Failed to move task';
      if (code === 'OVERDUE_RESTRICTED') {
        setTasks((prev) => prev.map((t) => (t._id === taskId ? { ...t, stage: 'backlog' } : t)));
      }
      toast.error(message);
    }
  };

  const handleTaskCreated = () => {
    setShowCreateTask(false);
    fetchData();
  };

  const handleTaskUpdated = () => {
    setSelectedTaskId(null);
    fetchData();
  };

  const handlePriorityChange = (taskId, newPriority) => {
    setTasks((prev) => prev.map((t) => (t._id === taskId ? { ...t, priority: newPriority } : t)));
  };

  // ─── Milestone actions ──────────────────────────────
  const handleCreateMilestone = async (e) => {
    e.preventDefault();
    if (!milestoneForm.title.trim() || !milestoneForm.dueDate) return;
    setMilestoneLoading(true);
    try {
      const res = await projectService.createMilestone(id, {
        title: milestoneForm.title.trim(),
        dueDate: milestoneForm.dueDate,
      });
      setMilestones((prev) => [...prev, res.data]);
      setMilestoneForm({ title: '', dueDate: '' });
      setShowMilestoneForm(false);
      toast.success('Milestone created');
    } catch {
      toast.error('Failed to create milestone');
    } finally {
      setMilestoneLoading(false);
    }
  };

  const handleDeleteMilestone = async (milestoneId) => {
    try {
      await projectService.deleteMilestone(id, milestoneId);
      setMilestones((prev) => prev.filter((m) => m._id !== milestoneId));
      toast.success('Milestone deleted');
    } catch {
      toast.error('Failed to delete milestone');
    }
  };

  const cycleMilestoneStatus = async (milestone) => {
    const next = { pending: 'in_progress', in_progress: 'completed', completed: 'pending' };
    const newStatus = next[milestone.status] || 'pending';
    try {
      const res = await projectService.updateMilestone(id, milestone._id, { status: newStatus });
      setMilestones((prev) => prev.map((m) => m._id === milestone._id ? res.data : m));
      toast.success(`Milestone ${MILESTONE_STATUSES[newStatus].toLowerCase()}`);
    } catch {
      toast.error('Failed to update milestone');
    }
  };

  // ─── Details edit actions ───────────────────────────
  const startEditing = async () => {
    setEditForm({
      name: project.name || '',
      description: project.description || '',
      type: project.type || '',
      status: project.status || '',
      startDate: toInputDate(project.startDate),
      endDate: toInputDate(project.endDate),
      budget: project.budget ?? '',
      projectManager: project.projectManager?._id || '',
      developers: (project.developers || []).map((d) => d._id),
      githubLinks: (project.githubLinks || []).map((l) => ({ ...l })),
      domains: project.domains || [],
    });
    setEditing(true);

    try {
      const [pmRes, devRes, adminRes] = await Promise.all([
        userService.getAll({ role: 'project_manager', status: 'active', limit: 100 }),
        userService.getAll({ role: 'developer', status: 'active', limit: 100 }),
        userService.getAll({ role: 'super_admin', status: 'active', limit: 100 }),
      ]);
      setPmOptions([...(pmRes.data || []), ...(adminRes.data || [])].map((u) => ({ value: u._id, label: u.name })));
      setDevOptions(devRes.data || []);
    } catch {
      toast.error('Failed to load user options');
    }
  };

  const cancelEditing = () => {
    setEditing(false);
    setEditForm({});
  };

  const saveProject = async () => {
    if (!editForm.name?.trim()) {
      toast.error('Project name is required');
      return;
    }
    setSaving(true);
    try {
      const payload = { ...editForm };
      if (payload.budget === '') delete payload.budget;
      if (!payload.startDate) delete payload.startDate;
      if (!payload.endDate) delete payload.endDate;
      payload.githubLinks = (payload.githubLinks || [])
        .filter((l) => l.url?.trim())
        .map((l) => {
          let url = l.url.trim();
          if (url && !/^https?:\/\//i.test(url)) url = 'https://' + url;
          return { label: l.label || '', url, ...(l._id ? { _id: l._id } : {}) };
        });
      if (payload.budget !== undefined && payload.budget !== '') payload.budget = Number(payload.budget);
      const res = await projectService.update(id, payload);
      setProject(res.data);
      setEditing(false);
      toast.success('Project updated');
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to update project');
    } finally {
      setSaving(false);
    }
  };

  const toggleEditDev = (devId) => {
    setEditForm((prev) => ({
      ...prev,
      developers: prev.developers.includes(devId)
        ? prev.developers.filter((d) => d !== devId)
        : [...prev.developers, devId],
    }));
  };

  // ─── Quick status change ────────────────────────────
  const handleStatusChange = async (newStatus) => {
    try {
      const res = await projectService.update(id, { status: newStatus });
      setProject(res.data);
      toast.success(`Status changed to ${PROJECT_STATUSES[newStatus]}`);
    } catch {
      toast.error('Failed to change status');
    }
  };

  // ─── Inline GitHub links ───────────────────────────
  const startGhEditing = () => {
    setGhLinks([...(project.githubLinks || []).map((l) => ({ ...l })), { label: '', url: '' }]);
    setGhEditing(true);
  };

  const saveGhLinks = async () => {
    setGhSaving(true);
    try {
      const cleaned = ghLinks
        .filter((l) => l.url?.trim())
        .map((l) => {
          let url = l.url.trim();
          if (url && !/^https?:\/\//i.test(url)) url = 'https://' + url;
          return { label: l.label || '', url, ...(l._id ? { _id: l._id } : {}) };
        });
      const res = await projectService.update(id, { githubLinks: cleaned });
      setProject(res.data);
      setGhEditing(false);
      toast.success('GitHub links updated');
    } catch {
      toast.error('Failed to save GitHub links');
    } finally {
      setGhSaving(false);
    }
  };

  // ─── Inline team edit ──────────────────────────────
  const startTeamEditing = async () => {
    setTeamPm(project.projectManager?._id || '');
    setTeamDevs((project.developers || []).map((d) => d._id));
    setTeamEditing(true);
    try {
      const [pmRes, devRes, adminRes] = await Promise.all([
        userService.getAll({ role: 'project_manager', status: 'active', limit: 100 }),
        userService.getAll({ role: 'developer', status: 'active', limit: 100 }),
        userService.getAll({ role: 'super_admin', status: 'active', limit: 100 }),
      ]);
      setPmOptions([...(pmRes.data || []), ...(adminRes.data || [])].map((u) => ({ value: u._id, label: u.name })));
      setDevOptions(devRes.data || []);
    } catch {
      toast.error('Failed to load user options');
    }
  };

  const saveTeam = async () => {
    setTeamSaving(true);
    try {
      const res = await projectService.update(id, { projectManager: teamPm, developers: teamDevs });
      setProject(res.data);
      setTeamEditing(false);
      toast.success('Team updated. Removed members have been unassigned from tasks.');
      // Refresh tasks since assignees may have changed
      const tasksRes = await taskService.getByProject(id, { limit: 200 });
      setTasks(tasksRes.data || []);
    } catch {
      toast.error('Failed to update team');
    } finally {
      setTeamSaving(false);
    }
  };

  const toggleTeamDev = (devId) => {
    setTeamDevs((prev) => prev.includes(devId) ? prev.filter((d) => d !== devId) : [...prev, devId]);
  };

  // ─── Loading state ──────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-5 pb-24">
        <div className="flex items-center gap-3">
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="flex items-center justify-between">
          <div className="space-y-2"><Skeleton className="h-4 w-20" /><Skeleton variant="title" className="w-56" /></div>
          <Skeleton variant="button" />
        </div>
        <div className="flex gap-4 overflow-hidden">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="min-w-[260px] space-y-3">
              <Skeleton className="h-5 w-24" />
              <Skeleton variant="card" className="h-28" />
              <Skeleton variant="card" className="h-28" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ─── Error state ────────────────────────────────────
  if (error || !project) {
    return (
      <div className="space-y-6">
        <button onClick={() => navigate('/projects')} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
          Back to Projects
        </button>
        <EmptyState
          title="Project not found"
          description={error || 'The project could not be loaded.'}
          action={<Button onClick={() => navigate('/projects')}>Go to Projects</Button>}
        />
      </div>
    );
  }

  // ─── Tab: Tasks (Board + List toggle) ────────────────
  const totalTaskCount = taskStats ? Object.values(taskStats).reduce((a, b) => a + (typeof b === 'number' ? b : 0), 0) : tasks.length;

  const renderTasks = () => (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* View toggle */}
          <div className="flex bg-slate-100 dark:bg-slate-700 rounded-lg p-0.5">
            <button
              onClick={() => setTaskView('board')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                taskView === 'board' ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-slate-100 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
              }`}
            >
              <BoardIcon className="w-3.5 h-3.5" /> Board
            </button>
            <button
              onClick={() => setTaskView('list')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                taskView === 'list' ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-slate-100 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
              }`}
            >
              <ListIcon className="w-3.5 h-3.5" /> List
            </button>
          </div>
          <span className="text-xs text-slate-400">{totalTaskCount} tasks</span>
        </div>
        {(canEdit || user?.role === 'developer') && (
          <Button size="sm" onClick={() => setShowCreateTask(true)}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
            Add Task
          </Button>
        )}
      </div>

      {tasks.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" /></svg>}
            title="No tasks yet"
            description="Create your first task to start managing work on this project."
            action={canEdit && <Button size="sm" onClick={() => setShowCreateTask(true)}>Create Task</Button>}
          />
        </div>
      ) : taskView === 'board' ? (
        <KanbanBoard
          tasks={tasks}
          onTransition={handleTransition}
          onTaskClick={(task) => setSelectedTaskId(task._id)}
          projectId={id}
          onTaskCreated={(newTask) => { if (newTask) setTasks((prev) => [newTask, ...prev]); else fetchData(); }}
          onPriorityChange={handlePriorityChange}
          teamMembers={[
            ...(project.projectManager ? [project.projectManager] : []),
            ...(project.developers || []),
          ]}
          onTaskUpdated={(updatedTask) => setTasks((prev) => prev.map((t) => t._id === updatedTask._id ? updatedTask : t))}
        />
      ) : (
        <div className="card overflow-hidden">
          <div className="grid grid-cols-[80px_1fr_100px_110px_100px] gap-3 px-4 py-2.5 bg-slate-50 dark:bg-slate-700/50 border-b border-slate-100 dark:border-slate-700 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            <span>ID</span><span>Title</span><span>Priority</span><span>Stage</span><span>Assignees</span>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {tasks.map((task) => (
              <div
                key={task._id}
                onClick={() => setSelectedTaskId(task._id)}
                className="grid grid-cols-[80px_1fr_100px_110px_100px] gap-3 px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors items-center"
              >
                <span className="font-mono text-xs text-slate-400">{task.taskId}</span>
                <span className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{task.title}</span>
                <Badge color={TASK_PRIORITY_COLORS[task.priority]} size="sm">{TASK_PRIORITIES[task.priority]}</Badge>
                <Badge color={TASK_STAGE_COLORS[task.stage]} size="sm">{TASK_STAGES[task.stage]}</Badge>
                <div className="flex -space-x-1.5">
                  {task.assignees?.slice(0, 3).map((a) => <Avatar key={a._id} name={a.name} size="xs" />)}
                  {task.assignees?.length > 3 && <span className="text-[10px] text-slate-400 ml-1">+{task.assignees.length - 3}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // ─── Tab: Milestones ────────────────────────────────
  const completedMilestones = milestones.filter((m) => m.status === 'completed').length;
  const overdueMilestones = milestones.filter((m) => m.dueDate && new Date(m.dueDate) < new Date() && m.status !== 'completed').length;

  const renderMilestones = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Milestones</h3>
          {milestones.length > 0 && (
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>{completedMilestones}/{milestones.length} done</span>
              {overdueMilestones > 0 && <span className="text-red-500">{overdueMilestones} overdue</span>}
            </div>
          )}
        </div>
        {canEdit && (
          <Button size="sm" variant={showMilestoneForm ? 'ghost' : 'primary'} onClick={() => setShowMilestoneForm(!showMilestoneForm)}>
            {showMilestoneForm ? 'Cancel' : (
              <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>Add Milestone</>
            )}
          </Button>
        )}
      </div>

      {showMilestoneForm && (
        <form onSubmit={handleCreateMilestone} className="card p-4 flex items-end gap-3">
          <div className="flex-1">
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Title</label>
            <input type="text" value={milestoneForm.title} onChange={(e) => setMilestoneForm((p) => ({ ...p, title: e.target.value }))} placeholder="Milestone title" className="w-full rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm dark:bg-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500" required />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Due Date</label>
            <input type="date" value={milestoneForm.dueDate} onChange={(e) => setMilestoneForm((p) => ({ ...p, dueDate: e.target.value }))} className="rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm dark:bg-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500" required />
          </div>
          <Button type="submit" size="sm" loading={milestoneLoading}>Create</Button>
        </form>
      )}

      {milestones.length === 0 && !showMilestoneForm ? (
        <div className="card">
          <EmptyState
            icon={<svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0l2.77-.693a9 9 0 016.208.682l.108.054a9 9 0 006.086.71l3.114-.732a48.524 48.524 0 01-.005-10.499l-3.11.732a9 9 0 01-6.085-.711l-.108-.054a9 9 0 00-6.208-.682L3 4.5M3 15V4.5" /></svg>}
            title="No milestones yet"
            description="Add milestones to track key project deliverables."
            action={canEdit && <Button size="sm" onClick={() => setShowMilestoneForm(true)}>Add Milestone</Button>}
          />
        </div>
      ) : milestones.length > 0 && (
        <div className="space-y-2">
          {milestones.map((ms, idx) => {
            const isOverdue = ms.dueDate && new Date(ms.dueDate) < new Date() && ms.status !== 'completed';
            return (
              <div key={ms._id} className="card px-4 py-3 flex items-center gap-4">
                <div className="flex flex-col items-center gap-1">
                  <button
                    onClick={() => canEdit && cycleMilestoneStatus(ms)}
                    disabled={!canEdit}
                    className={`w-3 h-3 rounded-full ring-4 transition-colors ${canEdit ? 'cursor-pointer hover:scale-125' : ''} ${
                      ms.status === 'completed' ? 'bg-green-500 ring-green-100 dark:ring-green-900/30'
                        : ms.status === 'in_progress' ? 'bg-primary-500 ring-primary-100 dark:ring-primary-900/30'
                          : 'bg-slate-300 ring-slate-100 dark:bg-slate-500 dark:ring-slate-700'
                    }`}
                    title={canEdit ? `Click to change status` : undefined}
                  />
                  {idx < milestones.length - 1 && <div className="w-0.5 h-6 bg-slate-200 dark:bg-slate-600" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{ms.title}</p>
                  <p className={`text-xs mt-0.5 ${isOverdue ? 'text-red-500' : 'text-slate-400'}`}>
                    {formatDate(ms.dueDate)} {isOverdue && '(overdue)'}
                  </p>
                </div>
                <button
                  onClick={() => canEdit && cycleMilestoneStatus(ms)}
                  disabled={!canEdit}
                  className={canEdit ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}
                  title={canEdit ? `Click to change status` : undefined}
                >
                  <Badge color={ms.status === 'completed' ? 'success' : ms.status === 'in_progress' ? 'primary' : 'default'} size="sm">
                    {MILESTONE_STATUSES[ms.status] || ms.status}
                  </Badge>
                </button>
                {canEdit && (
                  <button onClick={() => handleDeleteMilestone(ms._id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors" title="Delete">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  // ─── Tab: Team ──────────────────────────────────────
  const renderTeam = () => {
    const pm = project.projectManager;
    const developers = project.developers || [];
    const memberCount = (pm ? 1 : 0) + developers.length;

    if (teamEditing && canEdit) {
      return (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Manage Team</h3>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setTeamEditing(false)}>Cancel</Button>
              <Button size="sm" onClick={saveTeam} loading={teamSaving}>Save</Button>
            </div>
          </div>

          <div className="card p-5 space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Project Manager</label>
              <Select value={teamPm} onChange={(e) => setTeamPm(e.target.value)} options={pmOptions} placeholder="Select PM" />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                Developers
                {teamDevs.length > 0 && <span className="ml-1 text-primary-600">{teamDevs.length} selected</span>}
              </label>
              <div className="border border-slate-200 dark:border-slate-600 rounded-xl max-h-[280px] overflow-y-auto p-2 space-y-0.5">
                {devOptions.length === 0 && <p className="text-sm text-slate-400 py-2 text-center">No developers available</p>}
                {devOptions.map((dev) => (
                  <label key={dev._id} className={`flex items-center gap-2.5 py-1.5 px-2 rounded-lg cursor-pointer transition-colors ${teamDevs.includes(dev._id) ? 'bg-primary-50 dark:bg-primary-900/20' : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}>
                    <input type="checkbox" className="rounded border-slate-300 dark:border-slate-600 text-primary-600 focus:ring-primary-500" checked={teamDevs.includes(dev._id)} onChange={() => toggleTeamDev(dev._id)} />
                    <Avatar name={dev.name} size="xs" />
                    <span className="text-sm text-slate-700 dark:text-slate-300">{dev.name}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Team</h3>
            <span className="text-xs text-slate-400">{memberCount} {memberCount === 1 ? 'member' : 'members'}</span>
          </div>
          {canEdit && (
            <Button size="sm" variant="secondary" onClick={startTeamEditing}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" /></svg>
              Manage Team
            </Button>
          )}
        </div>

        {!pm && developers.length === 0 ? (
          <div className="card"><EmptyState title="No team members" description="Click Manage Team to assign members." /></div>
        ) : (
          <div className="space-y-4">
            {/* Project Manager */}
            {pm && (
              <div>
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Project Manager</p>
                <div className="card p-4 flex items-center gap-4 border-l-3 border-l-primary-500">
                  <Avatar name={pm.name} src={pm.avatar} size="lg" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{pm.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{pm.email}</p>
                  </div>
                  <Badge color="primary" size="sm">Lead</Badge>
                </div>
              </div>
            )}

            {/* Developers */}
            {developers.length > 0 && (
              <div>
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Developers ({developers.length})</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {developers.map((dev) => (
                    <div key={dev._id} className="card p-4 flex items-center gap-3 hover:shadow-sm transition-shadow">
                      <Avatar name={dev.name} src={dev.avatar} size="md" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{dev.name}</p>
                        <p className="text-xs text-slate-400 truncate">{dev.email}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // ─── Tab: Details (editable for PM/Admin) ───────────
  const renderDetails = () => {
    if (editing && canEdit) {
      return (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Edit Project</h3>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={cancelEditing}>Cancel</Button>
              <Button size="sm" onClick={saveProject} loading={saving}>Save Changes</Button>
            </div>
          </div>

          <div className="card p-5 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Project Name</label>
                <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} placeholder="Project name" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Description</label>
                <textarea className="input-base min-h-[70px] resize-none" value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} placeholder="Project description" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Type</label>
                <Select value={editForm.type} onChange={(e) => setEditForm({ ...editForm, type: e.target.value })} options={typeOptions} placeholder="Select type" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Status</label>
                <Select value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })} options={statusOptions} placeholder="Select status" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Start Date</label>
                <Input type="date" value={editForm.startDate} onChange={(e) => setEditForm({ ...editForm, startDate: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">End Date</label>
                <Input type="date" value={editForm.endDate} onChange={(e) => setEditForm({ ...editForm, endDate: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Budget</label>
                <Input type="number" value={editForm.budget} onChange={(e) => setEditForm({ ...editForm, budget: e.target.value })} placeholder="0.00" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Project Manager</label>
                <Select value={editForm.projectManager} onChange={(e) => setEditForm({ ...editForm, projectManager: e.target.value })} options={pmOptions} placeholder="Select PM" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                Domains
                {editForm.domains?.length > 0 && <span className="ml-1 text-primary-600">{editForm.domains.length} selected</span>}
              </label>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(PROJECT_DOMAINS).map(([key, label]) => {
                  const selected = editForm.domains?.includes(key);
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setEditForm((prev) => ({
                        ...prev,
                        domains: selected ? prev.domains.filter((d) => d !== key) : [...(prev.domains || []), key],
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

            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                Developers
                {editForm.developers?.length > 0 && <span className="ml-1 text-primary-600">{editForm.developers.length} selected</span>}
              </label>
              <div className="border border-slate-200 dark:border-slate-600 rounded-xl max-h-[180px] overflow-y-auto p-2 space-y-0.5">
                {devOptions.length === 0 && <p className="text-sm text-slate-400 py-2 text-center">No developers available</p>}
                {devOptions.map((dev) => (
                  <label key={dev._id} className={`flex items-center gap-2.5 py-1.5 px-2 rounded-lg cursor-pointer transition-colors ${editForm.developers?.includes(dev._id) ? 'bg-primary-50 dark:bg-primary-900/20' : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}>
                    <input type="checkbox" className="rounded border-slate-300 dark:border-slate-600 text-primary-600 focus:ring-primary-500" checked={editForm.developers?.includes(dev._id)} onChange={() => toggleEditDev(dev._id)} />
                    <Avatar name={dev.name} size="xs" />
                    <span className="text-sm text-slate-700 dark:text-slate-300">{dev.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* GitHub Links Editor */}
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                GitHub Repositories
                {editForm.githubLinks?.length > 0 && <span className="ml-1 text-slate-400 font-normal">({editForm.githubLinks.length})</span>}
              </label>
              <div className="space-y-2">
                {editForm.githubLinks?.map((link, idx) => (
                  <div key={link._id || idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={link.label}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, githubLinks: prev.githubLinks.map((l, i) => i === idx ? { ...l, label: e.target.value } : l) }))}
                      placeholder="Label (e.g. Frontend)"
                      className="input-base !py-1.5 text-sm w-[120px] shrink-0"
                    />
                    <input
                      type="url"
                      value={link.url}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, githubLinks: prev.githubLinks.map((l, i) => i === idx ? { ...l, url: e.target.value } : l) }))}
                      placeholder="https://github.com/org/repo"
                      className="input-base !py-1.5 text-sm flex-1"
                    />
                    <button
                      onClick={() => setEditForm((prev) => ({ ...prev, githubLinks: prev.githubLinks.filter((_, i) => i !== idx) }))}
                      className="p-1.5 text-slate-300 hover:text-danger-500 transition-colors shrink-0"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => setEditForm((prev) => ({ ...prev, githubLinks: [...(prev.githubLinks || []), { label: '', url: '' }] }))}
                  className="flex items-center gap-1.5 text-xs font-medium text-primary-600 hover:text-primary-700 transition-colors mt-1"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                  Add repository link
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Read-only view
    const pm = project.projectManager;
    const totalTasks = taskStats ? Object.values(taskStats).reduce((a, b) => a + (typeof b === 'number' ? b : 0), 0) : 0;
    const doneTasks = taskStats?.done || 0;
    const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Project Details</h3>
          {canEdit && (
            <Button size="sm" variant="secondary" onClick={startEditing}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" /></svg>
              Edit Project
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-5">
            <div className="card p-5">
              <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">About</h4>
              {project.description ? (
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-wrap">{project.description}</p>
              ) : (
                <p className="text-sm italic text-slate-400">No description provided</p>
              )}

              {project.domains?.length > 0 && (
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700">
                  <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Domains</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {project.domains.map((d) => (
                      <span
                        key={d}
                        className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium text-white"
                        style={{ backgroundColor: PROJECT_DOMAIN_COLORS[d] || '#64748b' }}
                      >
                        {PROJECT_DOMAINS[d] || d}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {ghEditing && canEdit ? (
              <div className="card p-5">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">GitHub Repositories</h4>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => setGhEditing(false)} className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 px-2 py-1 rounded-lg transition-colors">Cancel</button>
                    <button onClick={saveGhLinks} disabled={ghSaving} className="text-xs font-medium text-primary-600 hover:text-primary-700 disabled:text-slate-300 px-2 py-1 rounded-lg transition-colors">{ghSaving ? 'Saving...' : 'Save'}</button>
                  </div>
                </div>
                <div className="space-y-2">
                  {ghLinks.map((link, idx) => (
                    <div key={link._id || idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={link.label}
                        onChange={(e) => setGhLinks((prev) => prev.map((l, i) => i === idx ? { ...l, label: e.target.value } : l))}
                        placeholder="Label (e.g. Frontend)"
                        className="input-base !py-1.5 text-sm w-[120px] shrink-0"
                      />
                      <input
                        type="url"
                        value={link.url}
                        onChange={(e) => setGhLinks((prev) => prev.map((l, i) => i === idx ? { ...l, url: e.target.value } : l))}
                        placeholder="https://github.com/org/repo"
                        className="input-base !py-1.5 text-sm flex-1"
                        autoFocus={idx === ghLinks.length - 1 && !link.url}
                      />
                      <button
                        onClick={() => setGhLinks((prev) => prev.filter((_, i) => i !== idx))}
                        className="p-1.5 text-slate-300 hover:text-danger-500 transition-colors shrink-0"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => setGhLinks((prev) => [...prev, { label: '', url: '' }])}
                    className="flex items-center gap-1.5 text-xs font-medium text-primary-600 hover:text-primary-700 transition-colors mt-1"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                    Add another
                  </button>
                </div>
              </div>
            ) : project.githubLinks?.length > 0 ? (
              <div className="card p-5">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">GitHub Repositories</h4>
                  {canEdit && (
                    <button onClick={startGhEditing} className="text-xs text-slate-400 hover:text-primary-600 transition-colors">Edit</button>
                  )}
                </div>
                <div className="space-y-2">
                  {project.githubLinks.map((link, idx) => (
                    <a
                      key={link._id || idx}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2.5 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-colors group"
                    >
                      <svg className="w-4.5 h-4.5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" /></svg>
                      <div className="min-w-0 flex-1">
                        {link.label && <p className="text-xs text-slate-400">{link.label}</p>}
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">{link.url.replace(/^https?:\/\/(www\.)?github\.com\//, '')}</p>
                      </div>
                      <svg className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" /></svg>
                    </a>
                  ))}
                </div>
              </div>
            ) : canEdit && (
              <button
                onClick={startGhEditing}
                className="card p-4 w-full flex items-center gap-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600 transition-colors group"
              >
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" /></svg>
                <div className="text-left">
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-300 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">Add GitHub Repositories</p>
                  <p className="text-xs text-slate-400">Link your project repositories</p>
                </div>
                <svg className="w-4 h-4 ml-auto shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
              </button>
            )}

            <div className="card p-5">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Progress</h4>
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{progress}%</span>
              </div>
              <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-700 mb-4">
                <div className="h-2 rounded-full bg-primary-500 transition-all" style={{ width: `${progress}%` }} />
              </div>
              {taskStats && (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {Object.entries(TASK_STAGES).filter(([k]) => k !== 'archived').map(([key, label]) => (
                    <div key={key} className="text-center p-2 rounded-lg bg-slate-50 dark:bg-slate-700/50">
                      <p className="text-lg font-bold text-slate-800 dark:text-slate-200">{taskStats[key] || 0}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{label}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-5">
            <div className="card p-5 space-y-3">
              <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Info</h4>
              {[
                ['Type', PROJECT_TYPES[project.type] || project.type],
                ['Status', <Badge key="s" color={PROJECT_STATUS_COLORS[project.status]} size="sm" dot>{PROJECT_STATUSES[project.status]}</Badge>],
                ['Start', formatDate(project.startDate)],
                ['End', formatDate(project.endDate)],
                ...(canEdit ? [['Budget', project.budget != null ? `$${project.budget.toLocaleString()}` : '--']] : []),
                ['Created', formatDate(project.createdAt)],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">{label}</span>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{value}</span>
                </div>
              ))}
            </div>

            {canEdit && (
              <div className="card p-4">
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Change Status</label>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(PROJECT_STATUSES).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => key !== project.status && handleStatusChange(key)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        project.status === key
                          ? 'bg-primary-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {pm && (
              <div className="card p-4 flex items-center gap-3">
                <Avatar name={pm.name} src={pm.avatar} size="sm" />
                <div className="min-w-0">
                  <p className="text-xs text-slate-400">Project Manager</p>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{pm.name}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ─── Main render ────────────────────────────────────
  return (
    <div className="space-y-5 pb-24 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 min-w-0">
          <button onClick={() => navigate('/projects')} className="p-1.5 -ml-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 dark:hover:text-slate-300 transition-all shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
          </button>
          <div className="min-w-0">
            <span className="font-mono text-xs text-slate-400">{project.code}</span>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 truncate">{project.name}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge color={PROJECT_STATUS_COLORS[project.status]} dot>
            {PROJECT_STATUSES[project.status]}
          </Badge>
        </div>
      </div>

      {/* Tab content */}
      {activeTab === 'tasks' && renderTasks()}
      {activeTab === 'milestones' && renderMilestones()}
      {activeTab === 'team' && renderTeam()}
      {activeTab === 'details' && renderDetails()}
      {activeTab === 'discussion' && (
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4">Discussion</h3>
          <CommentSection commentableType="Project" commentableId={id} />
        </div>
      )}

      {/* Floating bottom tab bar */}
      <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40">
        <div className="flex items-center gap-0.5 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl shadow-xl shadow-slate-900/10 dark:shadow-black/30 border border-slate-200/60 dark:border-slate-700/60 p-1">
          {TABS.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium transition-all duration-150 ${
                  active
                    ? 'bg-primary-600 text-white shadow-sm shadow-primary-600/25'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                {tab.icon}
                <span className={active ? '' : 'hidden sm:inline'}>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Task Detail Drawer */}
      <TaskDetailDrawer
        taskId={selectedTaskId}
        isOpen={!!selectedTaskId}
        onClose={() => setSelectedTaskId(null)}
        onUpdated={handleTaskUpdated}
      />

      {/* Create Task Modal */}
      <CreateTaskModal
        isOpen={showCreateTask}
        onClose={() => setShowCreateTask(false)}
        onCreated={handleTaskCreated}
        defaultProjectId={id}
      />
    </div>
  );
}
