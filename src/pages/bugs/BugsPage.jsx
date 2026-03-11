import { useState, useEffect, useCallback } from 'react';
import { taskService, projectService } from '../../services';
import { useToast } from '../../components/ui/Toast';
import { Button, Badge, Avatar, Input, Select, EmptyState, Skeleton } from '../../components/ui';
import {
  TASK_STAGES, TASK_STAGE_COLORS, TASK_PRIORITIES, TASK_PRIORITY_COLORS,
} from '../../utils/constants';
import CreateTaskModal from '../tasks/CreateTaskModal';
import TaskDetailDrawer from '../tasks/TaskDetailDrawer';

export default function BugsPage() {
  const [bugs, setBugs] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [projectFilter, setProjectFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [stageFilter, setStageFilter] = useState('');
  const [projects, setProjects] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const toast = useToast();

  useEffect(() => {
    projectService.getAll({ limit: 100 }).then((res) => setProjects(res.data)).catch(() => {});
  }, []);

  const fetchBugs = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 50, type: 'bug', parentTask: 'null' };
      if (search) params.search = search;
      if (projectFilter) params.project = projectFilter;
      if (priorityFilter) params.priority = priorityFilter;
      if (stageFilter) params.stage = stageFilter;
      const response = await taskService.getAll(params);
      setBugs(response.data);
      setMeta(response.meta);
    } catch {
      toast.error('Failed to load bugs');
    } finally {
      setLoading(false);
    }
  }, [page, search, projectFilter, priorityFilter, stageFilter, toast]);

  useEffect(() => {
    fetchBugs();
  }, [fetchBugs]);

  const projectOptions = projects.map((p) => ({ value: p._id, label: `${p.code} — ${p.name}` }));
  const priorityOptions = Object.entries(TASK_PRIORITIES).map(([v, l]) => ({ value: v, label: l }));
  const stageOptions = Object.entries(TASK_STAGES).filter(([k]) => k !== 'archived').map(([v, l]) => ({ value: v, label: l }));

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Bugs
            {meta && <span className="text-sm font-normal text-slate-400 ml-2">{meta.total}</span>}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Track and manage bugs across projects</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Report Bug
        </Button>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="flex-1 relative">
            <svg className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <Input
              className="pl-10"
              placeholder="Search bugs..."
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
            value={stageFilter}
            onChange={(e) => { setStageFilter(e.target.value); setPage(1); }}
            options={stageOptions}
            placeholder="All stages"
          />
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="card overflow-hidden">
          <table className="w-full">
            <tbody>
              {Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="border-b border-slate-100 dark:border-slate-700">
                  <td className="px-5 py-4"><Skeleton variant="text" className="w-16" /></td>
                  <td className="px-5 py-4"><Skeleton variant="text" className="w-48" /></td>
                  <td className="px-5 py-4"><Skeleton variant="text" className="w-16" /></td>
                  <td className="px-5 py-4"><Skeleton variant="button" className="w-20" /></td>
                  <td className="px-5 py-4"><Skeleton variant="button" className="w-20" /></td>
                  <td className="px-5 py-4"><Skeleton variant="circle" className="w-8 h-8" /></td>
                  <td className="px-5 py-4"><Skeleton variant="text" className="w-20" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : bugs.length === 0 ? (
        <EmptyState
          title="No bugs found"
          description="Try adjusting your filters or report a new bug."
          action={<Button onClick={() => setShowCreateModal(true)} size="sm">Report Bug</Button>}
        />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
                  <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider px-5 py-3">ID</th>
                  <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider px-5 py-3">Title</th>
                  <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider px-5 py-3">Project</th>
                  <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider px-5 py-3">Priority</th>
                  <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider px-5 py-3">Stage</th>
                  <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider px-5 py-3">Assignees</th>
                  <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider px-5 py-3">Due</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {bugs.map((task) => (
                  <tr
                    key={task._id}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer"
                    onClick={() => setSelectedTaskId(task._id)}
                  >
                    <td className="px-5 py-3.5">
                      <span className="font-mono text-xs text-slate-400">{task.taskId}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-sm font-medium text-slate-900 dark:text-slate-100 line-clamp-1">{task.title}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs text-slate-500 dark:text-slate-400">{task.project?.code}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge size="sm" color={TASK_PRIORITY_COLORS[task.priority]}>
                        {TASK_PRIORITIES[task.priority]}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge size="sm" color={TASK_STAGE_COLORS[task.stage]}>
                        {TASK_STAGES[task.stage]}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center -space-x-1.5">
                        {task.assignees?.slice(0, 3).map((a) => (
                          <Avatar key={a._id} name={a.name} size="xs" />
                        ))}
                        {task.assignees?.length > 3 && (
                          <span className="text-[10px] text-slate-400 ml-2">+{task.assignees.length - 3}</span>
                        )}
                        {!task.assignees?.length && <span className="text-xs text-slate-300 dark:text-slate-600">&mdash;</span>}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {task.dueDate
                          ? new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                          : '\u2014'}
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
      )}

      {/* Create Bug Modal — reuses CreateTaskModal with type pre-set to 'bug' */}
      <CreateTaskModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={() => { setShowCreateModal(false); fetchBugs(); }}
        defaultType="bug"
      />

      {/* Bug Detail — reuses TaskDetailDrawer */}
      <TaskDetailDrawer
        taskId={selectedTaskId}
        isOpen={!!selectedTaskId}
        onClose={() => setSelectedTaskId(null)}
        onUpdated={fetchBugs}
      />
    </div>
  );
}
