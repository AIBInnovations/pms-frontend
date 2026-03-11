import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { taskService, projectService } from '../../services';
import { useToast } from '../../components/ui/Toast';
import { Button, Badge, Input, Select, EmptyState, Skeleton } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import {
  TASK_STAGES,
  TASK_STAGE_COLORS,
  TASK_PRIORITIES,
  TASK_PRIORITY_COLORS,
  KANBAN_COLUMNS,
} from '../../utils/constants';

function MyTaskCard({ task, onDragStart }) {
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.stage !== 'done';

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, task)}
      className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200/60 dark:border-slate-700/60 p-3.5 cursor-grab hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-sm transition-all duration-150 active:scale-[0.98] active:cursor-grabbing"
    >
      {/* Project code + Priority */}
      <div className="flex items-center justify-between mb-2">
        <span className="font-mono text-[11px] text-slate-400">
          {task.project?.code || task.taskId}
        </span>
        <Badge size="sm" color={TASK_PRIORITY_COLORS[task.priority]}>
          {TASK_PRIORITIES[task.priority]}
        </Badge>
      </div>

      {/* Title */}
      <p className="text-sm font-medium text-slate-900 dark:text-slate-100 line-clamp-2 leading-snug">{task.title}</p>

      {/* Due date */}
      {task.dueDate && (
        <div className="flex items-center gap-1.5 mt-2">
          <svg className={`w-3.5 h-3.5 ${isOverdue ? 'text-danger-500' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
          </svg>
          <span className={`text-[11px] font-medium ${isOverdue ? 'text-danger-500' : 'text-slate-400'}`}>
            {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            {isOverdue && ' (overdue)'}
          </span>
        </div>
      )}
    </div>
  );
}

function KanbanColumn({ stage, tasks, onDrop, onDragOver, onTaskDragStart }) {
  const [dragOver, setDragOver] = useState(false);

  // Group tasks by project
  const projectGroups = useMemo(() => {
    const map = new Map();
    for (const task of tasks) {
      const pid = task.project?._id || 'unassigned';
      if (!map.has(pid)) {
        map.set(pid, { id: pid, name: task.project?.name || 'No Project', tasks: [] });
      }
      map.get(pid).tasks.push(task);
    }
    return Array.from(map.values());
  }, [tasks]);

  return (
    <div
      className="flex flex-col min-w-[260px] max-w-[300px] flex-1"
      onDragOver={(e) => {
        e.preventDefault();
        onDragOver(e);
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        setDragOver(false);
        onDrop(e, stage);
      }}
    >
      {/* Column header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <Badge size="sm" color={TASK_STAGE_COLORS[stage]} dot>
            {TASK_STAGES[stage]}
          </Badge>
          <span className="text-[11px] text-slate-400 bg-slate-100 dark:bg-slate-700 rounded-full px-2 py-0.5 font-medium">
            {tasks.length}
          </span>
        </div>
      </div>

      {/* Cards area */}
      <div
        className={`flex-1 space-y-2.5 p-2 rounded-2xl transition-colors duration-150 min-h-[120px] ${
          dragOver ? 'bg-primary-50/50 dark:bg-primary-900/20 ring-2 ring-primary-200 dark:ring-primary-700 ring-inset' : 'bg-slate-50/80 dark:bg-slate-700/30'
        }`}
      >
        {projectGroups.map((group) => (
          <div key={group.id}>
            {/* Project name header */}
            <div className="flex items-center gap-1.5 px-1 py-1.5 mb-1">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 truncate">
                {group.name}
              </span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500">
                {group.tasks.length}
              </span>
            </div>
            <div className="space-y-2">
              {group.tasks.map((task) => (
                <MyTaskCard key={task._id} task={task} onDragStart={onTaskDragStart} />
              ))}
            </div>
          </div>
        ))}
        {tasks.length === 0 && !dragOver && (
          <div className="flex items-center justify-center h-20">
            <p className="text-xs text-slate-300 dark:text-slate-600">No tasks</p>
          </div>
        )}
      </div>
    </div>
  );
}

function MyTasksSkeleton() {
  return (
    <div className="space-y-5">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton variant="title" className="w-36" />
          <Skeleton variant="text" className="w-60" />
        </div>
      </div>

      {/* Filter bar skeleton */}
      <div className="card p-4">
        <div className="flex gap-3">
          <Skeleton variant="text" className="flex-1 h-10 rounded-xl" />
          <Skeleton variant="button" className="w-36 h-10" />
          <Skeleton variant="button" className="w-36 h-10" />
        </div>
      </div>

      {/* Board skeleton */}
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
    </div>
  );
}

export default function MyTasksPage() {
  const { user } = useAuth();
  const toast = useToast();
  const dragTaskRef = useRef(null);

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);

  // Filters
  const [search, setSearch] = useState('');
  const [projectFilter, setProjectFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  // Fetch projects for dropdown
  useEffect(() => {
    projectService.getAll({ limit: 100 }).then((res) => setProjects(res.data)).catch(() => {});
  }, []);

  // Fetch user's tasks
  const fetchTasks = useCallback(async () => {
    if (!user?._id) return;
    setLoading(true);
    try {
      const params = { assignee: user._id, limit: 200, parentTask: 'null' };
      if (search) params.search = search;
      if (projectFilter) params.project = projectFilter;
      if (priorityFilter) params.priority = priorityFilter;
      const response = await taskService.getAll(params);
      setTasks(response.data);
    } catch {
      toast.error('Failed to load your tasks');
    } finally {
      setLoading(false);
    }
  }, [user?._id, search, projectFilter, priorityFilter, toast]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Drag and drop
  const handleDragStart = (e, task) => {
    dragTaskRef.current = task;
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e, newStage) => {
    e.preventDefault();
    const task = dragTaskRef.current;
    if (!task || task.stage === newStage) {
      dragTaskRef.current = null;
      return;
    }
    try {
      await taskService.transition(task._id, newStage);
      setTasks((prev) =>
        prev.map((t) => (t._id === task._id ? { ...t, stage: newStage } : t))
      );
    } catch {
      toast.error('Failed to move task');
    }
    dragTaskRef.current = null;
  };

  // Group tasks by stage
  const grouped = useMemo(() => {
    const g = {};
    for (const col of KANBAN_COLUMNS) {
      g[col] = [];
    }
    for (const task of tasks) {
      if (g[task.stage]) {
        g[task.stage].push(task);
      }
    }
    return g;
  }, [tasks]);

  const totalCount = tasks.length;

  const projectOptions = projects.map((p) => ({ value: p._id, label: `${p.code} - ${p.name}` }));
  const priorityOptions = Object.entries(TASK_PRIORITIES).map(([v, l]) => ({ value: v, label: l }));

  if (loading && tasks.length === 0) {
    return (
      <div className="animate-fade-in">
        <MyTasksSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
          My Tasks
          {totalCount > 0 && <span className="text-sm font-normal text-slate-400 ml-2">{totalCount}</span>}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Tasks assigned to you across all projects
        </p>
      </div>

      {/* Filter bar */}
      <div className="card p-4">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="flex-1 relative">
            <svg
              className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <Input
              className="pl-10"
              placeholder="Search your tasks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            options={projectOptions}
            placeholder="All projects"
          />
          <Select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            options={priorityOptions}
            placeholder="All priorities"
          />
        </div>
      </div>

      {/* Kanban board */}
      {tasks.length === 0 && !loading ? (
        <EmptyState
          icon={
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
            </svg>
          }
          title="No tasks assigned to you"
          description="Tasks assigned to you will appear here. Try adjusting your filters or ask your project manager for task assignments."
        />
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {KANBAN_COLUMNS.map((stage) => (
            <KanbanColumn
              key={stage}
              stage={stage}
              tasks={grouped[stage]}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onTaskDragStart={handleDragStart}
            />
          ))}
        </div>
      )}
    </div>
  );
}
