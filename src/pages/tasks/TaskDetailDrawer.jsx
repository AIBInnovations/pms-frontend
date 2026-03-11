import { useState, useEffect, useCallback } from 'react';
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
const stageOptions = Object.entries(TASK_STAGES).map(([value, label]) => ({ value, label }));

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
const EditIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
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

  // Edit mode state
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [teamMembers, setTeamMembers] = useState([]);
  const [saving, setSaving] = useState(false);

  // Checklist editing
  const [newChecklistItem, setNewChecklistItem] = useState('');

  const canEdit = ['super_admin', 'project_manager'].includes(user?.role);

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
      setEditing(false);
      setTeamMembers([]);
    }
  }, [taskId, isOpen, fetchData]);

  // When entering edit mode, populate form and fetch team
  const startEditing = useCallback(async () => {
    if (!task) return;
    setEditForm({
      title: task.title || '',
      description: task.description || '',
      type: task.type || 'feature',
      priority: task.priority || 'medium',
      dueDate: toDatetimeLocal(task.dueDate),
      progress: task.progress ?? 0,
      assignees: task.assignees?.map((a) => a._id) || [],
      isBlocked: task.isBlocked || false,
      blockedReason: task.blockedReason || '',
      checklists: task.checklists?.map((c) => ({ ...c })) || [],
    });
    setNewChecklistItem('');
    // Fetch team members for the assignee picker
    if (task.project?._id || task.project) {
      try {
        const projectId = task.project?._id || task.project;
        const { data } = await projectService.getTeam(projectId);
        setTeamMembers(data || []);
      } catch {
        console.error('Failed to load team members');
      }
    }
    setEditing(true);
  }, [task]);

  const cancelEditing = () => {
    setEditing(false);
    setEditForm({});
    setTeamMembers([]);
    setNewChecklistItem('');
  };

  const handleEditChange = (field) => (e) => {
    setEditForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const toggleEditAssignee = (memberId) => {
    setEditForm((prev) => ({
      ...prev,
      assignees: prev.assignees.includes(memberId)
        ? prev.assignees.filter((id) => id !== memberId)
        : [...prev.assignees, memberId],
    }));
  };

  const handleChecklistItemChange = (index, text) => {
    setEditForm((prev) => ({
      ...prev,
      checklists: prev.checklists.map((item, i) => (i === index ? { ...item, text } : item)),
    }));
  };

  const removeChecklistItem = (index) => {
    setEditForm((prev) => ({
      ...prev,
      checklists: prev.checklists.filter((_, i) => i !== index),
    }));
  };

  const addChecklistItem = () => {
    if (!newChecklistItem.trim()) return;
    setEditForm((prev) => ({
      ...prev,
      checklists: [...prev.checklists, { text: newChecklistItem.trim(), checked: false }],
    }));
    setNewChecklistItem('');
  };

  const saveEdits = async () => {
    if (!editForm.title.trim()) {
      toast.error('Title is required');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: editForm.title.trim(),
        description: editForm.description.trim(),
        type: editForm.type,
        priority: editForm.priority,
        assignees: editForm.assignees,
        dueDate: editForm.dueDate ? new Date(editForm.dueDate).toISOString() : null,
        progress: Number(editForm.progress),
        isBlocked: editForm.isBlocked,
        blockedReason: editForm.isBlocked ? editForm.blockedReason : '',
        checklists: editForm.checklists.map((c) => ({ text: c.text, checked: c.checked, ...(c._id ? { _id: c._id } : {}) })),
      };
      // Remove undefined fields
      Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);

      await taskService.update(taskId, payload);
      toast.success('Task updated');
      setEditing(false);
      fetchData();
      onUpdated?.();
    } catch (error) {
      const message = error.response?.data?.error?.message || 'Failed to update task';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleChecklistToggle = useCallback(
    async (index) => {
      if (!task) return;
      const updatedChecklists = task.checklists.map((item, i) =>
        i === index ? { ...item, checked: !item.checked } : item
      );
      setTask((prev) => ({ ...prev, checklists: updatedChecklists }));
      try {
        await taskService.update(taskId, { checklists: updatedChecklists });
      } catch {
        setTask((prev) => ({
          ...prev,
          checklists: prev.checklists.map((item, i) =>
            i === index ? { ...item, checked: !item.checked } : item
          ),
        }));
        toast.error('Failed to update checklist');
      }
    },
    [task, taskId, toast]
  );

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

  if (!isOpen) return null;

  const checkedCount = task?.checklists?.filter((c) => c.checked).length || 0;
  const totalChecklist = task?.checklists?.length || 0;
  const checklistPercentage = totalChecklist > 0 ? Math.round((checkedCount / totalChecklist) * 100) : 0;

  // ─── Edit Mode Render ──────────────────────────────
  const renderEditMode = () => (
    <>
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-slate-900 px-6 py-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-slate-400">{task.taskId}</span>
            <span className="text-xs font-medium text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30 px-2 py-0.5 rounded-full">Editing</span>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={cancelEditing} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
              <CloseIcon />
            </button>
          </div>
        </div>
      </div>

      {/* Edit Form Body */}
      <div className="px-6 py-5 space-y-5 flex-1 overflow-y-auto">
        {/* Title */}
        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">Title <span className="text-red-400">*</span></label>
          <Input value={editForm.title} onChange={handleEditChange('title')} placeholder="Task title" />
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">Description</label>
          <textarea
            className="input-base min-h-[80px] resize-none"
            value={editForm.description}
            onChange={handleEditChange('description')}
            placeholder="Task description"
          />
        </div>

        {/* Type + Priority */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">Type</label>
            <Select value={editForm.type} onChange={handleEditChange('type')} options={typeOptions} />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">Priority</label>
            <Select value={editForm.priority} onChange={handleEditChange('priority')} options={priorityOptions} />
          </div>
        </div>

        {/* Due Date & Time */}
        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">Due Date & Time</label>
          <input
            type="datetime-local"
            value={editForm.dueDate}
            onChange={handleEditChange('dueDate')}
            className="input-base"
          />
        </div>

        {/* Progress */}
        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">
            Progress <span className="text-slate-400 font-normal">({editForm.progress}%)</span>
          </label>
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={editForm.progress}
            onChange={(e) => setEditForm((prev) => ({ ...prev, progress: Number(e.target.value) }))}
            className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary-600"
          />
        </div>

        {/* Blocked */}
        <div className="space-y-2">
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={editForm.isBlocked}
              onChange={(e) => setEditForm((prev) => ({ ...prev, isBlocked: e.target.checked }))}
              className="rounded border-slate-300 dark:border-slate-600 text-danger-600 focus:ring-danger-500"
            />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Blocked</span>
          </label>
          {editForm.isBlocked && (
            <Input
              value={editForm.blockedReason}
              onChange={handleEditChange('blockedReason')}
              placeholder="Reason for blocking..."
            />
          )}
        </div>

        {/* Assignees */}
        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">
            Assignees
            {editForm.assignees?.length > 0 && (
              <span className="ml-1.5 text-primary-600 dark:text-primary-400">{editForm.assignees.length} selected</span>
            )}
          </label>
          <div className="border border-slate-200 dark:border-slate-600 rounded-xl overflow-y-auto max-h-[180px] p-2 space-y-0.5">
            {teamMembers.length === 0 ? (
              <p className="text-sm text-slate-400 py-2 text-center">Loading team...</p>
            ) : (
              teamMembers.map((member) => (
                <label
                  key={member._id}
                  className={`flex items-center gap-2.5 py-1.5 px-2 rounded-lg cursor-pointer transition-colors ${
                    editForm.assignees.includes(member._id) ? 'bg-primary-50 dark:bg-primary-900/20' : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={editForm.assignees.includes(member._id)}
                    onChange={() => toggleEditAssignee(member._id)}
                    className="rounded border-slate-300 dark:border-slate-600 text-primary-600 focus:ring-primary-500"
                  />
                  <Avatar name={member.name} src={member.avatar} size="sm" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">{member.name}</p>
                    <p className="text-xs text-slate-400 truncate">{member.projectRole}</p>
                  </div>
                </label>
              ))
            )}
          </div>
        </div>

        {/* Checklist Editor */}
        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">
            Checklist
            {editForm.checklists?.length > 0 && (
              <span className="text-slate-400 font-normal ml-1">({editForm.checklists.length} items)</span>
            )}
          </label>
          <div className="space-y-1.5">
            {editForm.checklists?.map((item, index) => (
              <div key={item._id || index} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={item.checked}
                  onChange={() =>
                    setEditForm((prev) => ({
                      ...prev,
                      checklists: prev.checklists.map((c, i) => (i === index ? { ...c, checked: !c.checked } : c)),
                    }))
                  }
                  className="rounded border-slate-300 dark:border-slate-600 text-primary-600 focus:ring-primary-500 shrink-0"
                />
                <input
                  type="text"
                  value={item.text}
                  onChange={(e) => handleChecklistItemChange(index, e.target.value)}
                  className="flex-1 text-sm bg-transparent border-b border-slate-200 dark:border-slate-700 focus:border-primary-500 outline-none py-1 text-slate-700 dark:text-slate-300"
                />
                <button
                  onClick={() => removeChecklistItem(index)}
                  className="p-1 text-slate-300 hover:text-danger-500 transition-colors shrink-0"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
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
        </div>
      </div>

      {/* Edit Footer */}
      <div className="sticky bottom-0 px-6 py-4 border-t bg-white dark:bg-slate-900">
        <div className="flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={cancelEditing}>Cancel</Button>
          <Button size="sm" loading={saving} onClick={saveEdits}>Save Changes</Button>
        </div>
      </div>
    </>
  );

  // ─── View Mode Render ──────────────────────────────
  const renderViewMode = () => (
    <>
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-slate-900 px-6 py-4 border-b">
        <div className="flex items-start justify-between">
          <span className="font-mono text-xs text-slate-400">{task.taskId}</span>
          <div className="flex items-center gap-1">
            {canEdit && (
              <button
                onClick={startEditing}
                className="p-1.5 rounded-lg text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                title="Edit task"
              >
                <EditIcon />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <CloseIcon />
            </button>
          </div>
        </div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mt-1">{task.title}</h2>
      </div>

      {/* Meta row */}
      <div className="px-6 py-3 border-b bg-slate-50/50 dark:bg-slate-800/50 flex items-center gap-2 flex-wrap">
        <Badge color={TASK_PRIORITY_COLORS[task.priority]} size="sm">
          {TASK_PRIORITIES[task.priority] || task.priority}
        </Badge>
        <Badge color={TASK_STAGE_COLORS[task.stage]} size="sm" dot>
          {TASK_STAGES[task.stage] || task.stage}
        </Badge>
        <Badge color="default" size="sm">
          {TASK_TYPES[task.type] || task.type}
        </Badge>
      </div>

      {/* Body */}
      <div className="px-6 py-5 space-y-6 flex-1">
        {/* Description */}
        <div>
          <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">Description</h3>
          {task.description ? (
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-wrap">{task.description}</p>
          ) : (
            <p className="text-sm text-slate-400 italic">No description</p>
          )}
        </div>

        {/* Details grid */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <dt className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Due Date</dt>
            <dd className="text-sm text-slate-900 dark:text-slate-100">{formatDateTime(task.dueDate) || 'Not set'}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Progress</dt>
            <dd className="text-sm text-slate-900 dark:text-slate-100">{task.progress ?? 0}%</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Created</dt>
            <dd className="text-sm text-slate-900 dark:text-slate-100">{formatDate(task.createdAt)}</dd>
          </div>
        </div>

        {/* Assignees */}
        <div>
          <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">Assignees</h3>
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
            <p className="text-sm text-slate-400">No assignees</p>
          )}
        </div>

        {/* Checklist */}
        {task.checklists?.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">
              Checklist{' '}
              <span className="text-slate-400 font-normal">
                ({checkedCount}/{totalChecklist})
              </span>
            </h3>
            <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1.5 mb-3">
              <div
                className="bg-primary-500 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${checklistPercentage}%` }}
              />
            </div>
            <ul className="space-y-1.5">
              {task.checklists.map((item, index) => (
                <li key={item._id || index} className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={item.checked}
                    onChange={() => handleChecklistToggle(index)}
                    className="h-4 w-4 rounded border-slate-300 dark:border-slate-600 text-primary-600 focus:ring-primary-500 cursor-pointer"
                  />
                  <span
                    className={`text-sm ${
                      item.checked ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {item.text}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

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
                <div
                  key={sub._id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700"
                >
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
                <div
                  key={bug._id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700"
                >
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

        {/* Blocked indicator */}
        {task.isBlocked && (
          <div className="bg-danger-50 border border-danger-200 rounded-xl p-3">
            <h4 className="text-sm font-semibold text-danger-700 mb-1">Blocked</h4>
            {task.blockedReason && (
              <p className="text-sm text-danger-600">{task.blockedReason}</p>
            )}
          </div>
        )}

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
                <option key={key} value={key}>
                  {label}
                </option>
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
  );

  return (
    <div className="fixed inset-0 z-40">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/20" onClick={editing ? undefined : onClose} />

      {/* Panel */}
      <div className="absolute right-0 top-0 h-full w-full max-w-lg bg-white dark:bg-slate-900 shadow-xl animate-slide-in-right overflow-y-auto flex flex-col">
        {loading || !task ? (
          <LoadingSkeleton />
        ) : editing ? (
          renderEditMode()
        ) : (
          renderViewMode()
        )}
      </div>
    </div>
  );
}
