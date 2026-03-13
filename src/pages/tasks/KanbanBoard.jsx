import { useState, useRef, useEffect, useMemo } from 'react';
import { Badge, Avatar } from '../../components/ui';
import { taskService, projectService } from '../../services';
import { TASK_STAGES, TASK_STAGE_COLORS, TASK_PRIORITY_COLORS, TASK_PRIORITIES, KANBAN_COLUMNS } from '../../utils/constants';

const PRIORITY_WEIGHT = { critical: 0, high: 1, medium: 2, low: 3 };

function sortByPriority(tasks) {
  return [...tasks].sort((a, b) => (PRIORITY_WEIGHT[a.priority] ?? 9) - (PRIORITY_WEIGHT[b.priority] ?? 9));
}

const PRIORITY_ORDER = ['critical', 'high', 'medium', 'low'];

function getDueUrgency(dueDate) {
  if (!dueDate) return null;
  const now = new Date();
  const due = new Date(dueDate);
  const diffMs = due - now;
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  if (diffDays < 0) return 'overdue';
  if (diffDays < 1) return 'today';
  if (diffDays <= 3) return 'soon';
  return 'normal';
}

const DUE_STYLES = {
  overdue: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20',
  today: 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20',
  soon: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20',
  normal: 'text-slate-400 bg-transparent',
};

function PriorityBadge({ task, onPriorityChange }) {
  const [showPicker, setShowPicker] = useState(false);
  const [animating, setAnimating] = useState(false);
  const pickerRef = useRef(null);

  useEffect(() => {
    if (!showPicker) return;
    const handleClick = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) setShowPicker(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showPicker]);

  const handleSelect = async (priority) => {
    if (priority === task.priority) { setShowPicker(false); return; }
    setAnimating(true);
    setShowPicker(false);
    try {
      await taskService.update(task._id, { priority });
      onPriorityChange?.(task._id, priority);
    } catch {
      // revert silently
    }
    setTimeout(() => setAnimating(false), 300);
  };

  return (
    <div className="relative" ref={pickerRef}>
      <button
        onClick={(e) => { e.stopPropagation(); setShowPicker(!showPicker); }}
        className={`transition-transform duration-200 ${animating ? 'scale-110' : 'hover:scale-105'}`}
      >
        <Badge size="sm" color={TASK_PRIORITY_COLORS[task.priority]}>
          {TASK_PRIORITIES[task.priority]}
        </Badge>
      </button>
      {showPicker && (
        <div
          className="absolute right-0 top-full mt-1.5 z-20 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg shadow-slate-200/50 dark:shadow-slate-900/50 p-1 min-w-[110px] animate-in fade-in slide-in-from-top-1 duration-150"
          style={{ animation: 'priorityPopIn 150ms ease-out' }}
        >
          {PRIORITY_ORDER.map((p) => (
            <button
              key={p}
              onClick={(e) => { e.stopPropagation(); handleSelect(p); }}
              className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                p === task.priority
                  ? 'bg-slate-100 dark:bg-slate-700'
                  : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'
              }`}
            >
              <Badge size="sm" color={TASK_PRIORITY_COLORS[p]}>
                {TASK_PRIORITIES[p]}
              </Badge>
              {p === task.priority && (
                <svg className="w-3 h-3 text-primary-500 ml-auto" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function QuickAssignButton({ task, teamMembers: teamMembersProp, onTaskUpdated }) {
  const [showPicker, setShowPicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fetchedMembers, setFetchedMembers] = useState(null);
  const pickerRef = useRef(null);

  const members = teamMembersProp?.length ? teamMembersProp : fetchedMembers;

  useEffect(() => {
    if (!showPicker) return;
    const handleClick = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) setShowPicker(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showPicker]);

  // Fetch team on-demand when picker opens and no teamMembers prop
  useEffect(() => {
    if (!showPicker || teamMembersProp?.length || fetchedMembers) return;
    const projectId = task.project?._id || task.project;
    if (!projectId) return;
    projectService.getTeam(projectId).then((res) => setFetchedMembers(res.data)).catch(() => {});
  }, [showPicker, teamMembersProp, fetchedMembers, task.project]);

  const handleAssign = async (memberId) => {
    setSaving(true);
    try {
      const res = await taskService.update(task._id, { assignees: [memberId] });
      onTaskUpdated?.(res.data);
    } catch {
      // silently fail
    } finally {
      setSaving(false);
      setShowPicker(false);
    }
  };

  return (
    <div className="relative" ref={pickerRef}>
      <button
        onClick={(e) => { e.stopPropagation(); setShowPicker(!showPicker); }}
        className="w-6 h-6 rounded-full border-2 border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center text-slate-400 hover:border-primary-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
        title="Assign someone"
      >
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
      </button>
      {showPicker && (
        <div
          className="absolute right-0 bottom-full mb-1.5 z-20 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg shadow-slate-200/50 dark:shadow-slate-900/50 p-1 min-w-[160px]"
          style={{ animation: 'priorityPopIn 150ms ease-out' }}
        >
          <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider px-2.5 py-1">Assign to</p>
          {!members ? (
            <p className="text-xs text-slate-400 px-2.5 py-2 text-center">Loading...</p>
          ) : members.length === 0 ? (
            <p className="text-xs text-slate-400 px-2.5 py-2 text-center">No members</p>
          ) : (
            members.map((m) => (
              <button
                key={m._id}
                onClick={(e) => { e.stopPropagation(); handleAssign(m._id); }}
                disabled={saving}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors disabled:opacity-50"
              >
                <Avatar name={m.name} size="xs" />
                <span className="text-sm text-slate-700 dark:text-slate-300 truncate">{m.name}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function TaskCard({ task, onDragStart, onDragOver, onClick, onPriorityChange, teamMembers, onTaskUpdated }) {
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, task)}
      onDragOver={(e) => onDragOver(e, task)}
      onClick={() => onClick(task)}
      className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200/60 dark:border-slate-700/60 p-3.5 cursor-grab hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-sm transition-all duration-150 active:scale-[0.98] active:cursor-grabbing"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="font-mono text-[11px] text-slate-400">{task.taskId}</span>
        <PriorityBadge task={task} onPriorityChange={onPriorityChange} />
      </div>
      <p className="text-sm font-medium text-slate-900 dark:text-slate-100 line-clamp-2 leading-snug">{task.title}</p>
      {task.dueDate && (() => {
        const urgency = getDueUrgency(task.dueDate);
        return (
          <span className={`inline-flex items-center gap-1 text-[11px] font-medium mt-2 px-1.5 py-0.5 rounded-md ${DUE_STYLES[urgency]}`}>
            {urgency === 'overdue' && (
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            )}
            {urgency === 'overdue' ? 'Overdue' : new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        );
      })()}
      <div className="flex items-center justify-between mt-2.5">
        <div className="flex items-center gap-1">
          {task.assignees?.slice(0, 3).map((a) => (
            <Avatar key={a._id} name={a.name} size="xs" />
          ))}
          {task.assignees?.length > 3 && (
            <span className="text-[10px] text-slate-400 ml-1">+{task.assignees.length - 3}</span>
          )}
        </div>
        {(!task.assignees || task.assignees.length === 0) && (
          <QuickAssignButton task={task} teamMembers={teamMembers} onTaskUpdated={onTaskUpdated} />
        )}
      </div>
    </div>
  );
}

function QuickAdd({ projectId, stage, onCreated }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const handleSubmit = async () => {
    if (!title.trim() || !projectId) return;
    setSaving(true);
    try {
      const res = await taskService.create({ project: projectId, title: title.trim(), stage });
      setTitle('');
      setOpen(false);
      onCreated?.(res.data);
    } catch {
      // silently fail — user can retry
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSubmit();
    if (e.key === 'Escape') { setTitle(''); setOpen(false); }
  };

  if (!projectId) return null;

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full mt-1.5 flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-white dark:hover:bg-slate-800 transition-colors group"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        <span className="text-xs font-medium">Add task</span>
      </button>
    );
  }

  return (
    <div className="mt-1.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200/60 dark:border-slate-700/60 p-2.5 shadow-sm">
      <input
        ref={inputRef}
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => { if (!title.trim()) setOpen(false); }}
        placeholder="Task name..."
        disabled={saving}
        className="w-full text-sm bg-transparent outline-none text-slate-800 dark:text-slate-200 placeholder:text-slate-300 dark:placeholder:text-slate-600"
      />
      <div className="flex items-center justify-between mt-2">
        <span className="text-[10px] text-slate-300 dark:text-slate-600">Enter to save</span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => { setTitle(''); setOpen(false); }}
            className="text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 px-1.5 py-0.5 rounded transition-colors"
          >
            Esc
          </button>
          <button
            onClick={handleSubmit}
            disabled={!title.trim() || saving}
            className="text-[10px] font-medium text-primary-600 hover:text-primary-700 disabled:text-slate-300 px-1.5 py-0.5 rounded transition-colors"
          >
            {saving ? '...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Column({ stage, tasks, onDrop, onDragOver, onTaskDragStart, onTaskDragOverCard, onTaskClick, onPriorityChange, dropIndicator, projectId, onTaskCreated, teamMembers, onTaskUpdated, groupByProject }) {
  const [dragOver, setDragOver] = useState(false);

  // Group tasks by project when groupByProject is true
  const projectGroups = useMemo(() => {
    if (!groupByProject) return null;
    const groups = [];
    const map = new Map();
    for (const task of tasks) {
      const pid = task.project?._id || 'unassigned';
      if (!map.has(pid)) {
        const group = { id: pid, name: task.project?.name || 'No Project', code: task.project?.code || '', tasks: [] };
        map.set(pid, group);
        groups.push(group);
      }
      map.get(pid).tasks.push(task);
    }
    return groups;
  }, [tasks, groupByProject]);

  return (
    <div
      className="flex flex-col min-w-[260px] max-w-[300px] flex-1"
      onDragOver={(e) => {
        e.preventDefault();
        onDragOver(e, stage);
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        setDragOver(false);
        onDrop(e, stage);
      }}
    >
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{TASK_STAGES[stage]}</span>
          <span className="text-[11px] text-slate-400 bg-slate-100 dark:bg-slate-700 rounded-full px-2 py-0.5 font-medium">
            {tasks.length}
          </span>
        </div>
      </div>
      <div
        className={`flex-1 space-y-2.5 p-2 rounded-2xl transition-colors duration-150 min-h-[120px] ${
          dragOver ? 'bg-primary-50/50 dark:bg-primary-900/20 ring-2 ring-primary-200 dark:ring-primary-700 ring-inset' : 'bg-slate-50/80 dark:bg-slate-700/30'
        }`}
      >
        {groupByProject && projectGroups ? (
          <>
            {projectGroups.map((group) => (
              <div key={group.id}>
                <div className="flex items-center gap-1.5 px-1 py-1.5 mb-1">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider truncate">{group.name}</span>
                  <span className="text-[10px] text-slate-300 dark:text-slate-600">({group.tasks.length})</span>
                </div>
                <div className="space-y-2">
                  {group.tasks.map((task, idx) => {
                    const globalIdx = tasks.indexOf(task);
                    return (
                      <div key={task._id}>
                        {dropIndicator?.stage === stage && dropIndicator?.index === globalIdx && (
                          <div className="h-1 rounded bg-primary-400 mb-2 mx-1 transition-all" />
                        )}
                        <TaskCard
                          task={task}
                          onDragStart={onTaskDragStart}
                          onDragOver={onTaskDragOverCard}
                          onClick={onTaskClick}
                          onPriorityChange={onPriorityChange}
                          teamMembers={teamMembers}
                          onTaskUpdated={onTaskUpdated}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
            {dropIndicator?.stage === stage && dropIndicator?.index === tasks.length && (
              <div className="h-1 rounded bg-primary-400 mx-1 transition-all" />
            )}
          </>
        ) : (
          <>
            {tasks.map((task, idx) => (
              <div key={task._id}>
                {dropIndicator?.stage === stage && dropIndicator?.index === idx && (
                  <div className="h-1 rounded bg-primary-400 mb-2 mx-1 transition-all" />
                )}
                <TaskCard
                  task={task}
                  onDragStart={onTaskDragStart}
                  onDragOver={onTaskDragOverCard}
                  onClick={onTaskClick}
                  onPriorityChange={onPriorityChange}
                  teamMembers={teamMembers}
                  onTaskUpdated={onTaskUpdated}
                />
              </div>
            ))}
            {dropIndicator?.stage === stage && dropIndicator?.index === tasks.length && (
              <div className="h-1 rounded bg-primary-400 mx-1 transition-all" />
            )}
          </>
        )}
        {tasks.length === 0 && !dragOver && (
          <div className="flex items-center justify-center h-20">
            <p className="text-xs text-slate-300 dark:text-slate-600">No tasks</p>
          </div>
        )}
        <QuickAdd projectId={projectId} stage={stage} onCreated={onTaskCreated} />
      </div>
    </div>
  );
}

export default function KanbanBoard({ tasks, onTransition, onTaskClick, projectId, onTaskCreated, onPriorityChange, teamMembers, onTaskUpdated, groupByProject }) {
  const dragTaskRef = useRef(null);
  const [dropIndicator, setDropIndicator] = useState(null);
  const [columnOrder, setColumnOrder] = useState({});

  // Build grouped + sorted columns, respecting manual reorder
  const grouped = useMemo(() => {
    const g = {};
    for (const col of KANBAN_COLUMNS) g[col] = [];
    for (const task of tasks) {
      if (g[task.stage]) g[task.stage].push(task);
    }
    // Sort each column: use manual order if exists, otherwise sort by priority
    for (const col of KANBAN_COLUMNS) {
      const manualOrder = columnOrder[col];
      if (manualOrder && manualOrder.length > 0) {
        const taskMap = new Map(g[col].map((t) => [t._id, t]));
        const ordered = [];
        // First place tasks that are in the manual order
        for (const id of manualOrder) {
          if (taskMap.has(id)) {
            ordered.push(taskMap.get(id));
            taskMap.delete(id);
          }
        }
        // Then append any new tasks (not yet in manual order), sorted by priority
        const remaining = sortByPriority([...taskMap.values()]);
        g[col] = [...ordered, ...remaining];
      } else {
        g[col] = sortByPriority(g[col]);
      }
    }
    return g;
  }, [tasks, columnOrder]);

  // Reset manual order when tasks change significantly (e.g. project switch)
  const taskIds = useMemo(() => tasks.map((t) => t._id).sort().join(','), [tasks]);
  const prevTaskIds = useRef(taskIds);
  useEffect(() => {
    if (taskIds !== prevTaskIds.current) {
      const prevSet = new Set(prevTaskIds.current.split(','));
      const currSet = new Set(taskIds.split(','));
      // If more than half the tasks changed, reset manual order
      let overlap = 0;
      for (const id of currSet) if (prevSet.has(id)) overlap++;
      if (overlap < currSet.size * 0.5) setColumnOrder({});
      prevTaskIds.current = taskIds;
    }
  }, [taskIds]);

  const handleDragStart = (e, task) => {
    dragTaskRef.current = task;
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOverCard = (e, overTask) => {
    e.preventDefault();
    const stage = overTask.stage;
    const colTasks = grouped[stage] || [];
    const rect = e.currentTarget.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    const idx = colTasks.findIndex((t) => t._id === overTask._id);
    const dropIdx = e.clientY < midY ? idx : idx + 1;
    setDropIndicator({ stage, index: dropIdx });
  };

  const handleDragOverColumn = (e, stage) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    // If dragging over empty area (not a card), show indicator at end
    if (!dropIndicator || dropIndicator.stage !== stage) {
      setDropIndicator({ stage, index: (grouped[stage] || []).length });
    }
  };

  const handleDrop = (e, newStage) => {
    e.preventDefault();
    const task = dragTaskRef.current;
    if (!task) return;

    const dropIdx = dropIndicator?.stage === newStage ? dropIndicator.index : (grouped[newStage] || []).length;

    if (task.stage !== newStage) {
      // Cross-column: transition stage + insert at position
      onTransition(task._id, newStage);
      // Update manual order for target column
      const targetIds = (grouped[newStage] || []).map((t) => t._id);
      targetIds.splice(dropIdx, 0, task._id);
      // Remove from source column manual order
      const sourceIds = (grouped[task.stage] || []).filter((t) => t._id !== task._id).map((t) => t._id);
      setColumnOrder((prev) => ({ ...prev, [newStage]: targetIds, [task.stage]: sourceIds }));
    } else {
      // Same column: reorder
      const colTasks = [...(grouped[newStage] || [])];
      const fromIdx = colTasks.findIndex((t) => t._id === task._id);
      if (fromIdx !== -1 && fromIdx !== dropIdx) {
        colTasks.splice(fromIdx, 1);
        const insertIdx = dropIdx > fromIdx ? dropIdx - 1 : dropIdx;
        colTasks.splice(insertIdx, 0, task);
        setColumnOrder((prev) => ({ ...prev, [newStage]: colTasks.map((t) => t._id) }));
      }
    }

    dragTaskRef.current = null;
    setDropIndicator(null);
  };

  const handlePriorityChange = (taskId, newPriority) => {
    // Clear manual order for the affected column so priority sort takes over
    const task = tasks.find((t) => t._id === taskId);
    if (task) {
      setColumnOrder((prev) => {
        const next = { ...prev };
        delete next[task.stage];
        return next;
      });
    }
    onPriorityChange?.(taskId, newPriority);
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {KANBAN_COLUMNS.map((stage) => (
        <Column
          key={stage}
          stage={stage}
          tasks={grouped[stage]}
          onDrop={handleDrop}
          onDragOver={handleDragOverColumn}
          onTaskDragStart={handleDragStart}
          onTaskDragOverCard={handleDragOverCard}
          onTaskClick={onTaskClick}
          onPriorityChange={handlePriorityChange}
          dropIndicator={dropIndicator}
          projectId={projectId}
          onTaskCreated={onTaskCreated}
          teamMembers={teamMembers}
          onTaskUpdated={onTaskUpdated}
          groupByProject={groupByProject}
        />
      ))}
    </div>
  );
}
