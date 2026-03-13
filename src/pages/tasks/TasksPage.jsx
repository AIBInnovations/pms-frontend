import { useState, useEffect, useCallback } from 'react';
import { taskService, projectService, userService } from '../../services';
import { useToast } from '../../components/ui/Toast';
import { Button, Badge, Avatar, Input, Select, EmptyState, Skeleton } from '../../components/ui';
import {
  TASK_STAGES, TASK_STAGE_COLORS, TASK_PRIORITIES, TASK_PRIORITY_COLORS,
} from '../../utils/constants';
import KanbanBoard from './KanbanBoard';
import CreateTaskModal from './CreateTaskModal';
import TaskDetailDrawer from './TaskDetailDrawer';
import BulkActionBar from './BulkActionBar';
import WorkloadView from './WorkloadView';

export default function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('board'); // 'board' | 'list' | 'workload'
  const [search, setSearch] = useState('');
  const [projectFilter, setProjectFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [stageFilter, setStageFilter] = useState('');
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [projects, setProjects] = useState([]);
  const [developers, setDevelopers] = useState([]);
  const [assigneeFilter, setAssigneeFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const toast = useToast();

  // Fetch project and developer options for filters
  useEffect(() => {
    projectService.getAll({ limit: 100 }).then((res) => setProjects(res.data)).catch(() => {});
    userService.getAll({ role: 'developer', status: 'active', limit: 100 }).then((res) => setDevelopers(res.data || [])).catch(() => {});
  }, []);

  const fetchTasks = useCallback(async () => {
    if (view === 'workload') return;
    setLoading(true);
    try {
      const params = { page, limit: view === 'board' ? 200 : 50, parentTask: 'null' };
      if (search) params.search = search;
      if (projectFilter) params.project = projectFilter;
      if (priorityFilter) params.priority = priorityFilter;
      if (stageFilter) params.stage = stageFilter;
      if (assigneeFilter) params.assignee = assigneeFilter;
      if (view === 'list') {
        params.sortBy = sortBy;
        params.sortOrder = sortOrder;
      }
      const response = await taskService.getAll(params);
      setTasks(response.data);
      setMeta(response.meta);
    } catch {
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [page, search, projectFilter, priorityFilter, stageFilter, assigneeFilter, view, sortBy, sortOrder, toast]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleTransition = async (taskId, newStage) => {
    try {
      await taskService.transition(taskId, newStage);
      setTasks((prev) =>
        prev.map((t) => (t._id === taskId ? { ...t, stage: newStage } : t))
      );
    } catch (error) {
      const code = error.response?.data?.error?.code;
      const message = error.response?.data?.error?.message || 'Failed to move task';
      if (code === 'OVERDUE_RESTRICTED') {
        // Snap task back to backlog in the UI
        setTasks((prev) =>
          prev.map((t) => (t._id === taskId ? { ...t, stage: 'backlog' } : t))
        );
      }
      toast.error(message);
    }
  };

  // Auto-move overdue tasks (in todo/in_progress) to backlog after fetch
  useEffect(() => {
    if (loading || tasks.length === 0) return;
    const now = new Date();
    const overdueTasks = tasks.filter(
      (t) => t.dueDate && new Date(t.dueDate) < now && ['todo', 'in_progress'].includes(t.stage)
    );
    if (overdueTasks.length === 0) return;

    // Optimistically move them in the UI
    setTasks((prev) =>
      prev.map((t) =>
        overdueTasks.some((o) => o._id === t._id) ? { ...t, stage: 'backlog' } : t
      )
    );

    // Transition each on the backend (fire-and-forget)
    for (const t of overdueTasks) {
      taskService.transition(t._id, 'backlog').catch(() => {});
    }

    if (overdueTasks.length === 1) {
      toast.error(`"${overdueTasks[0].title}" is overdue and was moved to Backlog`);
    } else {
      toast.error(`${overdueTasks.length} overdue tasks were moved to Backlog`);
    }
  }, [loading, tasks.length]); // only run after initial fetch completes

  const handleTaskClick = (task) => {
    setSelectedTaskId(task._id);
  };

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
    setPage(1);
  };

  const toggleSelect = (taskId) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === tasks.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(tasks.map((t) => t._id)));
    }
  };

  const handleBulkAction = async (action, value) => {
    try {
      await taskService.bulkAction([...selectedIds], action, value);
      toast.success(`Bulk ${action.replace('_', ' ')} completed`);
      setSelectedIds(new Set());
      fetchTasks();
    } catch {
      toast.error('Bulk action failed');
    }
  };

  const SortHeader = ({ column, children }) => {
    const active = sortBy === column;
    return (
      <th
        className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider px-5 py-3 cursor-pointer select-none hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
        onClick={() => handleSort(column)}
      >
        <span className="inline-flex items-center gap-1">
          {children}
          {active && (
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              {sortOrder === 'asc' ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              )}
            </svg>
          )}
        </span>
      </th>
    );
  };

  const projectOptions = projects.map((p) => ({ value: p._id, label: `${p.code} — ${p.name}` }));
  const priorityOptions = Object.entries(TASK_PRIORITIES).map(([v, l]) => ({ value: v, label: l }));
  const stageOptions = Object.entries(TASK_STAGES).filter(([k]) => k !== 'archived').map(([v, l]) => ({ value: v, label: l }));
  const developerOptions = developers.map((d) => ({ value: d._id, label: d.name }));

  const viewButtons = [
    { key: 'board', label: 'Board', icon: 'M9 4.5v15m6-15v15m-10.875 0h15.75c.621 0 1.125-.504 1.125-1.125V5.625c0-.621-.504-1.125-1.125-1.125H4.125C3.504 4.5 3 5.004 3 5.625v12.75c0 .621.504 1.125 1.125 1.125z' },
    { key: 'list', label: 'List', icon: 'M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z' },
    { key: 'workload', label: 'Workload', icon: 'M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z' },
  ];

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Tasks
            {meta && <span className="text-sm font-normal text-slate-400 ml-2">{meta.total}</span>}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage and track all tasks across projects</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          New Task
        </Button>
      </div>

      {/* Filters + View toggle */}
      <div className="card p-4">
        <div className="flex flex-col lg:flex-row gap-3">
          {view !== 'workload' && (
            <>
              <div className="flex-1 relative">
                <svg className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
                <Input
                  className="pl-10"
                  placeholder="Search tasks..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                />
              </div>
              <Select
                value={projectFilter}
                onChange={(e) => { setProjectFilter(e.target.value); setPage(1); }}
                options={projectOptions}
                placeholder="All projects"
              />
              <Select
                value={priorityFilter}
                onChange={(e) => { setPriorityFilter(e.target.value); setPage(1); }}
                options={priorityOptions}
                placeholder="All priorities"
              />
              <Select
                value={assigneeFilter}
                onChange={(e) => { setAssigneeFilter(e.target.value); setPage(1); }}
                options={developerOptions}
                placeholder="All developers"
              />
              {view === 'list' && (
                <Select
                  value={stageFilter}
                  onChange={(e) => { setStageFilter(e.target.value); setPage(1); }}
                  options={stageOptions}
                  placeholder="All stages"
                />
              )}
            </>
          )}
          {view === 'workload' && (
            <Select
              value={projectFilter}
              onChange={(e) => { setProjectFilter(e.target.value); }}
              options={projectOptions}
              placeholder="All projects"
              className="flex-1"
            />
          )}
          {/* View toggle */}
          <div className="flex gap-1 bg-slate-100 dark:bg-slate-700 rounded-full p-1 shrink-0">
            {viewButtons.map((vb) => (
              <button
                key={vb.key}
                onClick={() => { setView(vb.key); setSelectedIds(new Set()); }}
                className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                  view === vb.key ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-slate-100 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                <svg className="w-4 h-4 inline-block mr-1 -mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={vb.icon} />
                </svg>
                {vb.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      {view === 'workload' ? (
        <WorkloadView projectId={projectFilter || undefined} />
      ) : loading ? (
        view === 'board' ? (
          <div className="flex gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="min-w-[260px] flex-1">
                <Skeleton variant="text" className="w-20 mb-3" />
                <div className="space-y-2.5 bg-slate-50/80 dark:bg-slate-700/50 rounded-2xl p-2">
                  {Array.from({ length: 2 }).map((_, j) => (
                    <Skeleton key={j} variant="card" className="h-24" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card overflow-hidden">
            <table className="w-full">
              <tbody>
                {Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-b border-slate-100 dark:border-slate-700">
                    <td className="px-5 py-4"><Skeleton variant="text" className="w-4" /></td>
                    <td className="px-5 py-4"><Skeleton variant="text" className="w-16" /></td>
                    <td className="px-5 py-4"><Skeleton variant="text" className="w-48" /></td>
                    <td className="px-5 py-4"><Skeleton variant="button" className="w-20" /></td>
                    <td className="px-5 py-4"><Skeleton variant="button" className="w-20" /></td>
                    <td className="px-5 py-4"><Skeleton variant="circle" className="w-8 h-8" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : tasks.length === 0 ? (
        <EmptyState
          title="No tasks found"
          description="Try adjusting your filters or create a new task."
          action={<Button onClick={() => setShowCreateModal(true)} size="sm">New Task</Button>}
        />
      ) : view === 'board' ? (
        <KanbanBoard tasks={tasks} onTransition={handleTransition} onTaskClick={handleTaskClick} groupByProject />
      ) : (
        <>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
                    <th className="px-5 py-3 w-10">
                      <input
                        type="checkbox"
                        checked={selectedIds.size === tasks.length && tasks.length > 0}
                        onChange={toggleSelectAll}
                        className="rounded border-slate-300 dark:border-slate-600 text-primary-600 focus:ring-primary-500"
                      />
                    </th>
                    <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider px-5 py-3">ID</th>
                    <SortHeader column="title">Title</SortHeader>
                    <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider px-5 py-3">Project</th>
                    <SortHeader column="priority">Priority</SortHeader>
                    <SortHeader column="stage">Stage</SortHeader>
                    <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider px-5 py-3">Assignees</th>
                    <SortHeader column="dueDate">Due</SortHeader>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {tasks.map((task) => (
                    <tr
                      key={task._id}
                      className={`hover:bg-slate-50/50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer ${selectedIds.has(task._id) ? 'bg-primary-50/30 dark:bg-primary-900/20' : ''}`}
                    >
                      <td className="px-5 py-3.5" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedIds.has(task._id)}
                          onChange={() => toggleSelect(task._id)}
                          className="rounded border-slate-300 dark:border-slate-600 text-primary-600 focus:ring-primary-500"
                        />
                      </td>
                      <td className="px-5 py-3.5" onClick={() => handleTaskClick(task)}>
                        <span className="font-mono text-xs text-slate-400">{task.taskId}</span>
                      </td>
                      <td className="px-5 py-3.5" onClick={() => handleTaskClick(task)}>
                        <span className="text-sm font-medium text-slate-900 dark:text-slate-100 line-clamp-1">{task.title}</span>
                      </td>
                      <td className="px-5 py-3.5" onClick={() => handleTaskClick(task)}>
                        <span className="text-xs text-slate-500 dark:text-slate-400">{task.project?.code}</span>
                      </td>
                      <td className="px-5 py-3.5" onClick={() => handleTaskClick(task)}>
                        <Badge size="sm" color={TASK_PRIORITY_COLORS[task.priority]}>
                          {TASK_PRIORITIES[task.priority]}
                        </Badge>
                      </td>
                      <td className="px-5 py-3.5" onClick={() => handleTaskClick(task)}>
                        <Badge size="sm" color={TASK_STAGE_COLORS[task.stage]}>
                          {TASK_STAGES[task.stage]}
                        </Badge>
                      </td>
                      <td className="px-5 py-3.5" onClick={() => handleTaskClick(task)}>
                        <div className="flex items-center -space-x-1.5">
                          {task.assignees?.slice(0, 3).map((a) => (
                            <Avatar key={a._id} name={a.name} size="xs" />
                          ))}
                          {task.assignees?.length > 3 && (
                            <span className="text-[10px] text-slate-400 ml-2">+{task.assignees.length - 3}</span>
                          )}
                          {!task.assignees?.length && <span className="text-xs text-slate-300 dark:text-slate-600">—</span>}
                        </div>
                      </td>
                      <td className="px-5 py-3.5" onClick={() => handleTaskClick(task)}>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {task.dueDate
                            ? new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                            : '—'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {meta && meta.totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 dark:border-slate-700">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Showing {(meta.page - 1) * meta.limit + 1} to {Math.min(meta.page * meta.limit, meta.total)} of {meta.total}
                </p>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                    Previous
                  </Button>
                  <Button variant="secondary" size="sm" disabled={page >= meta.totalPages} onClick={() => setPage(page + 1)}>
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <BulkActionBar
          selectedCount={selectedIds.size}
          onAction={handleBulkAction}
          onClear={() => setSelectedIds(new Set())}
        />
      )}

      {/* Create Task Modal */}
      <CreateTaskModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={() => { setShowCreateModal(false); fetchTasks(); }}
      />

      {/* Task Detail Drawer */}
      <TaskDetailDrawer
        taskId={selectedTaskId}
        isOpen={!!selectedTaskId}
        onClose={() => setSelectedTaskId(null)}
        onUpdated={fetchTasks}
      />
    </div>
  );
}
