import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import CommentSection from '../../components/comments/CommentSection';
import { taskService, projectService, bugService } from '../../services';
import { useToast } from '../../components/ui/Toast';
import { Button, Badge, Avatar, Input, Select, FileUpload, FileList } from '../../components/ui';
import {
  TASK_TYPES,
  TASK_PRIORITIES,
  TASK_PRIORITY_COLORS,
  TASK_STAGES,
  TASK_STAGE_COLORS,
  BUG_SEVERITY_COLORS,
  BUG_SEVERITIES,
  BUG_STATUS_COLORS,
  BUG_STATUSES,
} from '../../utils/constants';

const typeOptions = Object.entries(TASK_TYPES).map(([value, label]) => ({ value, label }));
const priorityOptions = Object.entries(TASK_PRIORITIES).map(([value, label]) => ({ value, label }));

function formatDate(dateStr) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
function toDatetimeLocal(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function formatDateTime(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
    ' at ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

// ─── Icons ───────────────────────────────────────────
const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
  </svg>
);
const CloseIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

function LoadingSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="px-6 py-4 border-b">
        <div className="h-3 w-20 bg-slate-200 dark:bg-slate-700 rounded mb-3" />
        <div className="h-5 w-3/4 bg-slate-200 dark:bg-slate-700 rounded" />
      </div>
      <div className="px-6 py-3 border-b bg-slate-50/50 dark:bg-slate-800/50 flex gap-2">
        <div className="h-5 w-16 bg-slate-200 dark:bg-slate-700 rounded-full" />
        <div className="h-5 w-20 bg-slate-200 dark:bg-slate-700 rounded-full" />
        <div className="h-5 w-16 bg-slate-200 dark:bg-slate-700 rounded-full" />
      </div>
      <div className="px-6 py-5 space-y-6">
        <div>
          <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded mb-2" />
          <div className="h-4 w-full bg-slate-200 dark:bg-slate-700 rounded mb-1" />
          <div className="h-4 w-2/3 bg-slate-200 dark:bg-slate-700 rounded" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i}>
              <div className="h-3 w-16 bg-slate-200 dark:bg-slate-700 rounded mb-1.5" />
              <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Inline editable field ───────────────────────────
function InlineField({ value, onSave, canEdit, multiline, placeholder, className = '' }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const ref = useRef(null);

  useEffect(() => { setDraft(value); }, [value]);

  const commit = () => {
    setEditing(false);
    if (draft !== value) onSave(draft);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') { setDraft(value); setEditing(false); }
    if (!multiline && e.key === 'Enter') commit();
  };

  if (!canEdit) {
    return multiline ? (
      <p className={`text-sm text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-wrap ${className}`}>
        {value || <span className="italic text-slate-400">{placeholder || 'None'}</span>}
      </p>
    ) : (
      <span className={className}>{value || <span className="italic text-slate-400">{placeholder || 'None'}</span>}</span>
    );
  }

  if (!editing) {
    return multiline ? (
      <p
        onClick={() => { setEditing(true); setTimeout(() => ref.current?.focus(), 0); }}
        className={`text-sm text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-wrap cursor-pointer rounded-lg px-2 py-1 -mx-2 -my-1 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors ${className}`}
      >
        {value || <span className="italic text-slate-400">{placeholder || 'Click to add...'}</span>}
      </p>
    ) : (
      <span
        onClick={() => { setEditing(true); setTimeout(() => ref.current?.focus(), 0); }}
        className={`cursor-pointer rounded-md px-1.5 py-0.5 -mx-1.5 -my-0.5 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors ${className}`}
      >
        {value || <span className="italic text-slate-400">{placeholder || 'Click to add...'}</span>}
      </span>
    );
  }

  return multiline ? (
    <textarea
      ref={ref}
      autoFocus
      className="input-base min-h-[80px] resize-none text-sm w-full"
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
    />
  ) : (
    <input
      ref={ref}
      autoFocus
      type="text"
      className="input-base text-sm w-full"
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
    />
  );
}

// ─── Inline select ───────────────────────────────────
function InlineSelect({ value, options, display, onSave, canEdit, badge, badgeColor }) {
  const [editing, setEditing] = useState(false);

  if (!canEdit) {
    return badge ? (
      <Badge color={badgeColor} size="sm">{display}</Badge>
    ) : (
      <span className="text-sm text-slate-900 dark:text-slate-100">{display}</span>
    );
  }

  if (!editing) {
    return (
      <span
        onClick={() => setEditing(true)}
        className="cursor-pointer"
      >
        {badge ? (
          <Badge color={badgeColor} size="sm" className="hover:ring-2 hover:ring-slate-300 dark:hover:ring-slate-600 transition-all">{display}</Badge>
        ) : (
          <span className="text-sm text-slate-900 dark:text-slate-100 rounded-md px-1.5 py-0.5 -mx-1.5 -my-0.5 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors">{display}</span>
        )}
      </span>
    );
  }

  return (
    <select
      autoFocus
      value={value}
      onChange={(e) => { setEditing(false); if (e.target.value !== value) onSave(e.target.value); }}
      onBlur={() => setEditing(false)}
      className="rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 py-1 text-xs text-slate-700 dark:text-slate-300 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

export default function TaskDetailDrawer({ taskId, isOpen, onClose, onUpdated }) {
  const { user } = useAuth();
  const toast = useToast();
  const [task, setTask] = useState(null);
  const [subtasks, setSubtasks] = useState([]);
  const [linkedBugs, setLinkedBugs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedStage, setSelectedStage] = useState('');
  const [transitioning, setTransitioning] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [teamMembers, setTeamMembers] = useState([]);
  const [showAssigneePicker, setShowAssigneePicker] = useState(false);
  const [newChecklistItem, setNewChecklistItem] = useState('');

  const canEdit = ['super_admin', 'project_manager', 'developer'].includes(user?.role);
  const canManage = ['super_admin', 'project_manager'].includes(user?.role);

  const fetchData = useCallback(async () => {
    if (!taskId) return;
    setLoading(true);
    try {
      const [taskRes, subtasksRes, bugsRes] = await Promise.all([
        taskService.getById(taskId),
        taskService.getSubtasks(taskId),
        bugService.getLinkedBugs(taskId).catch(() => ({ data: [] })),
      ]);
      setTask(taskRes.data);
      setSubtasks(subtasksRes.data || []);
      setLinkedBugs(bugsRes.data || []);
      setSelectedStage(taskRes.data.stage || '');
    } catch {
      toast.error('Failed to load task details');
    } finally {
      setLoading(false);
    }
  }, [taskId, toast]);

  useEffect(() => {
    if (isOpen && taskId) {
      fetchData();
    }
    if (!isOpen) {
      setTask(null);
      setSubtasks([]);
      setLinkedBugs([]);
      setSelectedStage('');
      setTeamMembers([]);
      setShowAssigneePicker(false);
    }
  }, [taskId, isOpen, fetchData]);

  // Fetch team when needed
  const ensureTeamLoaded = useCallback(async () => {
    if (teamMembers.length > 0 || !task) return;
    const projectId = task.project?._id || task.project;
    if (!projectId) return;
    try {
      const { data } = await projectService.getTeam(projectId);
      setTeamMembers(data || []);
    } catch { /* ignore */ }
  }, [task, teamMembers.length]);

  // Save a single field — optimistic update only, no parent refetch
  const saveField = useCallback(async (patch) => {
    try {
      await taskService.update(taskId, patch);
      setTask((prev) => ({ ...prev, ...patch }));
    } catch (error) {
      const message = error.response?.data?.error?.message || 'Failed to update';
      toast.error(message);
      fetchData(); // revert on error
    }
  }, [taskId, toast, fetchData]);

  const handleChecklistToggle = useCallback(async (index) => {
    if (!task) return;
    const updated = task.checklists.map((item, i) =>
      i === index ? { ...item, checked: !item.checked } : item
    );
    setTask((prev) => ({ ...prev, checklists: updated }));
    try {
      await taskService.update(taskId, { checklists: updated });
    } catch {
      setTask((prev) => ({
        ...prev,
        checklists: prev.checklists.map((item, i) =>
          i === index ? { ...item, checked: !item.checked } : item
        ),
      }));
      toast.error('Failed to update checklist');
    }
  }, [task, taskId, toast]);

  const addChecklistItem = useCallback(async () => {
    if (!newChecklistItem.trim() || !task) return;
    const updated = [...(task.checklists || []), { text: newChecklistItem.trim(), checked: false }];
    setTask((prev) => ({ ...prev, checklists: updated }));
    setNewChecklistItem('');
    try {
      await taskService.update(taskId, { checklists: updated });
    } catch {
      toast.error('Failed to add checklist item');
      fetchData();
    }
  }, [newChecklistItem, task, taskId, toast, fetchData]);

  const removeChecklistItem = useCallback(async (index) => {
    if (!task) return;
    const updated = task.checklists.filter((_, i) => i !== index);
    setTask((prev) => ({ ...prev, checklists: updated }));
    try {
      await taskService.update(taskId, { checklists: updated });
    } catch {
      toast.error('Failed to remove checklist item');
      fetchData();
    }
  }, [task, taskId, toast, fetchData]);

  const handleTransition = useCallback(async () => {
    if (!selectedStage || selectedStage === task?.stage) return;
    setTransitioning(true);
    try {
      await taskService.transition(taskId, selectedStage);
      toast.success(`Task moved to ${TASK_STAGES[selectedStage]}`);
      setTask((prev) => ({ ...prev, stage: selectedStage }));
      onUpdated?.();
    } catch {
      toast.error('Failed to transition task');
      setSelectedStage(task?.stage || '');
    } finally {
      setTransitioning(false);
    }
  }, [selectedStage, task, taskId, toast, onUpdated]);

  const handleUpload = useCallback(async (file) => {
    setUploading(true);
    try {
      const res = await taskService.uploadAttachment(taskId, file);
      setTask((prev) => ({ ...prev, attachments: [...(prev.attachments || []), res.data] }));
      toast.success('File uploaded');
    } catch {
      toast.error('Failed to upload file');
    } finally {
      setUploading(false);
    }
  }, [taskId, toast]);

  const handleDeleteTask = useCallback(async () => {
    setDeleting(true);
    try {
      await taskService.delete(taskId);
      toast.success('Task deleted');
      onUpdated?.();
      onClose();
    } catch {
      toast.error('Failed to delete task');
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  }, [taskId, toast, onUpdated, onClose]);

  const handleDeleteAttachment = useCallback(async (attachmentId) => {
    try {
      await taskService.removeAttachment(taskId, attachmentId);
      setTask((prev) => ({
        ...prev,
        attachments: prev.attachments.filter((a) => a._id !== attachmentId),
      }));
      toast.success('Attachment removed');
    } catch {
      toast.error('Failed to remove attachment');
    }
  }, [taskId, toast]);

  const toggleAssignee = useCallback(async (memberId) => {
    if (!task) return;
    const currentIds = task.assignees?.map((a) => a._id) || [];
    const newIds = currentIds.includes(memberId)
      ? currentIds.filter((id) => id !== memberId)
      : [...currentIds, memberId];
    try {
      await taskService.update(taskId, { assignees: newIds });
      fetchData();
      onUpdated?.();
    } catch (error) {
      const message = error.response?.data?.error?.message || 'Failed to update assignees';
      toast.error(message);
    }
  }, [task, taskId, fetchData, toast, onUpdated]);

  if (!isOpen) return null;

  const checkedCount = task?.checklists?.filter((c) => c.checked).length || 0;
  const totalChecklist = task?.checklists?.length || 0;
  const checklistPercentage = totalChecklist > 0 ? Math.round((checkedCount / totalChecklist) * 100) : 0;

  return (
    <div className="fixed inset-0 z-40">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/20" onClick={onClose} />

      {/* Panel */}
      <div className="absolute right-0 top-0 h-full w-full max-w-lg bg-white dark:bg-slate-900 shadow-xl animate-slide-in-right overflow-y-auto flex flex-col">
        {loading || !task ? (
          <LoadingSkeleton />
        ) : (
          <>
            {/* Header */}
            <div className="sticky top-0 z-10 bg-white dark:bg-slate-900 px-6 py-4 border-b">
              <div className="flex items-start justify-between">
                <span className="font-mono text-xs text-slate-400">{task.taskId}</span>
                <div className="flex items-center gap-1">
                  {canManage && (
                    <>
                      {!confirmDelete ? (
                        <button
                          onClick={() => setConfirmDelete(true)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-danger-600 dark:hover:text-danger-400 hover:bg-danger-50 dark:hover:bg-danger-900/20 transition-colors"
                          title="Delete task"
                        >
                          <TrashIcon />
                        </button>
                      ) : (
                        <div className="flex items-center gap-1 bg-danger-50 dark:bg-danger-900/20 rounded-lg px-2 py-1">
                          <span className="text-xs text-danger-600 dark:text-danger-400 font-medium">Delete?</span>
                          <button
                            onClick={handleDeleteTask}
                            disabled={deleting}
                            className="text-xs font-semibold text-danger-600 hover:text-danger-700 dark:text-danger-400 disabled:opacity-50 px-1"
                          >
                            {deleting ? '...' : 'Yes'}
                          </button>
                          <button
                            onClick={() => setConfirmDelete(false)}
                            className="text-xs font-medium text-slate-500 hover:text-slate-700 px-1"
                          >
                            No
                          </button>
                        </div>
                      )}
                    </>
                  )}
                  <button
                    onClick={onClose}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  >
                    <CloseIcon />
                  </button>
                </div>
              </div>
              {/* Inline-editable title */}
              <div className="mt-1">
                <InlineField
                  value={task.title}
                  canEdit={canEdit}
                  onSave={(v) => saveField({ title: v.trim() })}
                  placeholder="Task title"
                  className="text-lg font-semibold text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            {/* Meta row — click to change */}
            <div className="px-6 py-3 border-b bg-slate-50/50 dark:bg-slate-800/50 flex items-center gap-2 flex-wrap">
              <InlineSelect
                value={task.priority}
                options={priorityOptions}
                display={TASK_PRIORITIES[task.priority] || task.priority}
                badge
                badgeColor={TASK_PRIORITY_COLORS[task.priority]}
                canEdit={canEdit}
                onSave={(v) => saveField({ priority: v })}
              />
              <Badge color={TASK_STAGE_COLORS[task.stage]} size="sm" dot>
                {TASK_STAGES[task.stage] || task.stage}
              </Badge>
              <InlineSelect
                value={task.type}
                options={typeOptions}
                display={TASK_TYPES[task.type] || task.type}
                badge
                badgeColor="default"
                canEdit={canEdit}
                onSave={(v) => saveField({ type: v })}
              />
            </div>

            {/* Blocked / On Hold banners */}
            {task.isBlocked && (
              <div className="mx-6 mt-4 bg-danger-50 border border-danger-200 rounded-xl p-3 flex items-start justify-between gap-2">
                <div>
                  <h4 className="text-sm font-semibold text-danger-700 mb-0.5">Blocked</h4>
                  <InlineField
                    value={task.blockedReason}
                    canEdit={canEdit}
                    onSave={(v) => saveField({ blockedReason: v })}
                    placeholder="Add reason..."
                    className="text-sm text-danger-600"
                  />
                </div>
                {canEdit && (
                  <button
                    onClick={() => saveField({ isBlocked: false, blockedReason: '' })}
                    className="text-xs font-medium text-danger-500 hover:text-danger-700 shrink-0 mt-0.5"
                  >
                    Unblock
                  </button>
                )}
              </div>
            )}
            {task.isOnHold && (
              <div className="mx-6 mt-4 bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start justify-between gap-2">
                <div>
                  <h4 className="text-sm font-semibold text-amber-700 mb-0.5">On Hold</h4>
                  <InlineField
                    value={task.onHoldReason}
                    canEdit={canEdit}
                    onSave={(v) => saveField({ onHoldReason: v })}
                    placeholder="Add reason..."
                    className="text-sm text-amber-600"
                  />
                </div>
                {canEdit && (
                  <button
                    onClick={() => saveField({ isOnHold: false, onHoldReason: '' })}
                    className="text-xs font-medium text-amber-500 hover:text-amber-700 shrink-0 mt-0.5"
                  >
                    Resume
                  </button>
                )}
              </div>
            )}

            {/* Quick actions — set blocked / on hold */}
            {canEdit && !task.isBlocked && !task.isOnHold && (
              <div className="mx-6 mt-4 flex gap-2">
                <button
                  onClick={() => saveField({ isBlocked: true, isOnHold: false })}
                  className="text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 dark:text-red-400 dark:bg-red-900/20 dark:hover:bg-red-900/30 px-2.5 py-1 rounded-lg transition-colors"
                >
                  Mark Blocked
                </button>
                <button
                  onClick={() => saveField({ isOnHold: true, isBlocked: false })}
                  className="text-xs font-medium text-amber-600 bg-amber-50 hover:bg-amber-100 dark:text-amber-400 dark:bg-amber-900/20 dark:hover:bg-amber-900/30 px-2.5 py-1 rounded-lg transition-colors"
                >
                  Put On Hold
                </button>
              </div>
            )}

            {/* Body */}
            <div className="px-6 py-5 space-y-6 flex-1">
              {/* Description */}
              <div>
                <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">Description</h3>
                <InlineField
                  value={task.description}
                  canEdit={canEdit}
                  multiline
                  onSave={(v) => saveField({ description: v.trim() })}
                  placeholder="Add a description..."
                />
              </div>

              {/* Details grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Due Date</dt>
                  <dd>
                    {canManage ? (
                      <input
                        type="datetime-local"
                        value={toDatetimeLocal(task.dueDate)}
                        onChange={(e) => {
                          const val = e.target.value ? new Date(e.target.value).toISOString() : null;
                          saveField({ dueDate: val });
                        }}
                        className="text-sm bg-transparent border-b border-transparent hover:border-slate-300 dark:hover:border-slate-600 focus:border-primary-500 outline-none py-0.5 text-slate-900 dark:text-slate-100 cursor-pointer w-full"
                      />
                    ) : (
                      <span className="text-sm text-slate-900 dark:text-slate-100">{formatDateTime(task.dueDate) || 'Not set'}</span>
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Progress</dt>
                  <dd className="flex items-center gap-2">
                    {canEdit ? (
                      <>
                        <input
                          type="range"
                          min="0" max="100" step="5"
                          value={task.progress ?? 0}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setTask((prev) => ({ ...prev, progress: val }));
                          }}
                          onMouseUp={(e) => saveField({ progress: Number(e.target.value) })}
                          onTouchEnd={(e) => saveField({ progress: Number(e.target.value) })}
                          className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary-600"
                        />
                        <span className="text-xs text-slate-500 w-8 text-right">{task.progress ?? 0}%</span>
                      </>
                    ) : (
                      <span className="text-sm text-slate-900 dark:text-slate-100">{task.progress ?? 0}%</span>
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Created</dt>
                  <dd className="text-sm text-slate-900 dark:text-slate-100">{formatDate(task.createdAt)}</dd>
                </div>
              </div>

              {/* Assignees */}
              <div>
                <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">
                  Assignees
                  {canManage && (
                    <button
                      onClick={() => { setShowAssigneePicker((v) => !v); ensureTeamLoaded(); }}
                      className="ml-2 text-xs font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
                    >
                      {showAssigneePicker ? 'Done' : 'Edit'}
                    </button>
                  )}
                </h3>
                {task.assignees?.length > 0 ? (
                  <div className="space-y-2">
                    {task.assignees.map((assignee) => (
                      <div key={assignee._id} className="flex items-center gap-3">
                        <Avatar name={assignee.name} src={assignee.avatar} size="sm" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{assignee.name}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{assignee.email}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-400">{canManage ? 'Click Edit to assign members' : 'No assignees'}</p>
                )}
                {showAssigneePicker && (
                  <div className="mt-3 border border-slate-200 dark:border-slate-600 rounded-xl overflow-y-auto max-h-[180px] p-2 space-y-0.5">
                    {teamMembers.length === 0 ? (
                      <p className="text-sm text-slate-400 py-2 text-center">Loading team...</p>
                    ) : (
                      teamMembers.map((member) => {
                        const isSelected = task.assignees?.some((a) => a._id === member._id);
                        return (
                          <label
                            key={member._id}
                            className={`flex items-center gap-2.5 py-1.5 px-2 rounded-lg cursor-pointer transition-colors ${
                              isSelected ? 'bg-primary-50 dark:bg-primary-900/20' : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleAssignee(member._id)}
                              className="rounded border-slate-300 dark:border-slate-600 text-primary-600 focus:ring-primary-500"
                            />
                            <Avatar name={member.name} src={member.avatar} size="sm" />
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">{member.name}</p>
                              <p className="text-xs text-slate-400 truncate">{member.projectRole}</p>
                            </div>
                          </label>
                        );
                      })
                    )}
                  </div>
                )}
              </div>

              {/* Checklist */}
              <div>
                <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">
                  Checklist{' '}
                  {totalChecklist > 0 && (
                    <span className="text-slate-400 font-normal">({checkedCount}/{totalChecklist})</span>
                  )}
                </h3>
                {totalChecklist > 0 && (
                  <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1.5 mb-3">
                    <div
                      className="bg-primary-500 h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${checklistPercentage}%` }}
                    />
                  </div>
                )}
                <ul className="space-y-1.5">
                  {task.checklists?.map((item, index) => (
                    <li key={item._id || index} className="flex items-center gap-2.5 group">
                      <input
                        type="checkbox"
                        checked={item.checked}
                        onChange={() => handleChecklistToggle(index)}
                        className="h-4 w-4 rounded border-slate-300 dark:border-slate-600 text-primary-600 focus:ring-primary-500 cursor-pointer"
                      />
                      <span className={`text-sm flex-1 ${item.checked ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-300'}`}>
                        {item.text}
                      </span>
                      {canEdit && (
                        <button
                          onClick={() => removeChecklistItem(index)}
                          className="p-1 text-slate-300 hover:text-danger-500 transition-colors opacity-0 group-hover:opacity-100 shrink-0"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
                {canEdit && (
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="text"
                      value={newChecklistItem}
                      onChange={(e) => setNewChecklistItem(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addChecklistItem()}
                      placeholder="Add checklist item..."
                      className="flex-1 text-sm bg-transparent border-b border-dashed border-slate-200 dark:border-slate-700 focus:border-primary-500 outline-none py-1 text-slate-700 dark:text-slate-300 placeholder:text-slate-300"
                    />
                    <button
                      onClick={addChecklistItem}
                      disabled={!newChecklistItem.trim()}
                      className="text-xs font-medium text-primary-600 hover:text-primary-700 disabled:text-slate-300 transition-colors"
                    >
                      Add
                    </button>
                  </div>
                )}
              </div>

              {/* Subtasks */}
              <div>
                <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">
                  Subtasks{' '}
                  {subtasks.length > 0 && (
                    <span className="text-slate-400 font-normal">({subtasks.length})</span>
                  )}
                </h3>
                {subtasks.length > 0 ? (
                  <div className="space-y-2">
                    {subtasks.map((sub) => (
                      <div key={sub._id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                        <div className="min-w-0">
                          <span className="font-mono text-xs text-slate-400 mr-2">{sub.taskId}</span>
                          <span className="text-sm text-slate-700 dark:text-slate-300">{sub.title}</span>
                        </div>
                        <Badge color={TASK_STAGE_COLORS[sub.stage]} size="sm">
                          {TASK_STAGES[sub.stage] || sub.stage}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-400">No subtasks</p>
                )}
              </div>

              {/* Time Logged */}
              {(task.estimatedHours > 0 || task.actualHours > 0) && (
                <div>
                  <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">Time Logged</h3>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      {task.actualHours || 0}h / {task.estimatedHours || 0}h estimated
                    </span>
                  </div>
                  {task.estimatedHours > 0 && (
                    <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full transition-all duration-300 ${
                          (task.actualHours || 0) > task.estimatedHours ? 'bg-danger-500' : 'bg-primary-500'
                        }`}
                        style={{ width: `${Math.min(((task.actualHours || 0) / task.estimatedHours) * 100, 100)}%` }}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Linked Bugs */}
              {linkedBugs.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">
                    Linked Bugs{' '}
                    <span className="text-slate-400 font-normal">({linkedBugs.length})</span>
                  </h3>
                  <div className="space-y-2">
                    {linkedBugs.map((bug) => (
                      <div key={bug._id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                        <div className="min-w-0 flex-1">
                          <span className="font-mono text-xs text-slate-400 mr-2">{bug.bugId}</span>
                          <span className="text-sm text-slate-700 dark:text-slate-300">{bug.title}</span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0 ml-2">
                          <Badge color={BUG_SEVERITY_COLORS[bug.severity]} size="sm">
                            {BUG_SEVERITIES[bug.severity]}
                          </Badge>
                          <Badge color={BUG_STATUS_COLORS[bug.status]} size="sm">
                            {BUG_STATUSES[bug.status]}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Attachments */}
              <div>
                <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">
                  Attachments{' '}
                  {task.attachments?.length > 0 && (
                    <span className="text-slate-400 font-normal">({task.attachments.length})</span>
                  )}
                </h3>
                <FileList files={task.attachments || []} onDelete={canEdit ? handleDeleteAttachment : undefined} />
                {canEdit && (
                  <div className="mt-3">
                    <FileUpload onUpload={handleUpload} loading={uploading} />
                  </div>
                )}
              </div>

              {/* Comments */}
              <CommentSection commentableType="Task" commentableId={taskId} />
            </div>

            {/* Footer - Stage transition */}
            <div className="sticky bottom-0 px-6 py-4 border-t bg-white dark:bg-slate-900">
              <div className="flex items-end gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">Move to stage</label>
                  <select
                    value={selectedStage}
                    onChange={(e) => setSelectedStage(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
                  >
                    {Object.entries(TASK_STAGES).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  loading={transitioning}
                  disabled={!selectedStage || selectedStage === task.stage}
                  onClick={handleTransition}
                >
                  Move
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
