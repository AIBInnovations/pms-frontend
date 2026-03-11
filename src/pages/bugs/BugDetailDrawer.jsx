import { useState, useEffect, useCallback } from 'react';
import CommentSection from '../../components/comments/CommentSection';
import { bugService } from '../../services';
import { useToast } from '../../components/ui/Toast';
import { Button, Badge, Avatar } from '../../components/ui';
import {
  BUG_SEVERITIES, BUG_SEVERITY_COLORS,
  BUG_STATUSES, BUG_STATUS_COLORS,
  TASK_PRIORITIES, TASK_PRIORITY_COLORS,
} from '../../utils/constants';

function formatDate(dateStr) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function LoadingSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="px-6 py-4 border-b dark:border-slate-700">
        <div className="h-3 w-20 bg-slate-200 dark:bg-slate-700 rounded mb-3" />
        <div className="h-5 w-3/4 bg-slate-200 dark:bg-slate-700 rounded" />
      </div>
      <div className="px-6 py-3 border-b dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 flex gap-2">
        <div className="h-5 w-16 bg-slate-200 dark:bg-slate-700 rounded-full" />
        <div className="h-5 w-20 bg-slate-200 dark:bg-slate-700 rounded-full" />
        <div className="h-5 w-16 bg-slate-200 dark:bg-slate-700 rounded-full" />
      </div>
      <div className="px-6 py-5 space-y-6">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i}>
            <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded mb-2" />
            <div className="h-4 w-full bg-slate-200 dark:bg-slate-700 rounded mb-1" />
            <div className="h-4 w-2/3 bg-slate-200 dark:bg-slate-700 rounded" />
          </div>
        ))}
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
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

export default function BugDetailDrawer({ bugId, isOpen, onClose, onUpdated }) {
  const toast = useToast();
  const [bug, setBug] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [transitioning, setTransitioning] = useState(false);

  const fetchData = useCallback(async () => {
    if (!bugId) return;
    setLoading(true);
    try {
      const res = await bugService.getById(bugId);
      setBug(res.data);
      setSelectedStatus(res.data.status || '');
    } catch {
      toast.error('Failed to load bug details');
    } finally {
      setLoading(false);
    }
  }, [bugId, toast]);

  useEffect(() => {
    if (isOpen && bugId) {
      fetchData();
    }
    if (!isOpen) {
      setBug(null);
      setSelectedStatus('');
    }
  }, [bugId, isOpen, fetchData]);

  const handleTransition = useCallback(async () => {
    if (!selectedStatus || selectedStatus === bug?.status) return;
    setTransitioning(true);
    try {
      await bugService.transition(bugId, selectedStatus);
      toast.success(`Bug moved to ${BUG_STATUSES[selectedStatus]}`);
      setBug((prev) => ({ ...prev, status: selectedStatus }));
      onUpdated?.();
    } catch {
      toast.error('Failed to update bug status');
      setSelectedStatus(bug?.status || '');
    } finally {
      setTransitioning(false);
    }
  }, [selectedStatus, bug, bugId, toast, onUpdated]);

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 z-50 ${isOpen ? '' : 'pointer-events-none'}`}>
      <div
        className={`absolute inset-0 bg-black/20 transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />
      <div
        className={`absolute right-0 top-0 h-full w-full max-w-lg bg-white dark:bg-slate-900 shadow-xl transition-transform overflow-y-auto ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {loading || !bug ? (
          <LoadingSkeleton />
        ) : (
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-white dark:bg-slate-900 px-6 py-4 border-b dark:border-slate-700">
              <div className="flex items-start justify-between">
                <span className="font-mono text-xs text-slate-400">{bug.bugId}</span>
                <button
                  onClick={onClose}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mt-1">{bug.title}</h2>
            </div>

            {/* Meta row */}
            <div className="px-6 py-3 border-b dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 flex items-center gap-2 flex-wrap">
              <Badge color={BUG_SEVERITY_COLORS[bug.severity]} size="sm">
                {BUG_SEVERITIES[bug.severity] || bug.severity}
              </Badge>
              <Badge color={BUG_STATUS_COLORS[bug.status]} size="sm" dot>
                {BUG_STATUSES[bug.status] || bug.status}
              </Badge>
              <Badge color={TASK_PRIORITY_COLORS[bug.priority]} size="sm">
                {TASK_PRIORITIES[bug.priority] || bug.priority}
              </Badge>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-6 flex-1">
              {/* Description */}
              <div>
                <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">Description</h3>
                {bug.description ? (
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-wrap">{bug.description}</p>
                ) : (
                  <p className="text-sm text-slate-400 italic">No description</p>
                )}
              </div>

              {/* Steps to Reproduce */}
              <div>
                <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">Steps to Reproduce</h3>
                {bug.stepsToReproduce ? (
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-wrap">{bug.stepsToReproduce}</p>
                ) : (
                  <p className="text-sm text-slate-400 italic">Not provided</p>
                )}
              </div>

              {/* Expected Result */}
              <div>
                <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">Expected Result</h3>
                {bug.expectedResult ? (
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-wrap">{bug.expectedResult}</p>
                ) : (
                  <p className="text-sm text-slate-400 italic">Not provided</p>
                )}
              </div>

              {/* Actual Result */}
              <div>
                <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">Actual Result</h3>
                {bug.actualResult ? (
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-wrap">{bug.actualResult}</p>
                ) : (
                  <p className="text-sm text-slate-400 italic">Not provided</p>
                )}
              </div>

              {/* Environment */}
              <div>
                <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">Environment</h3>
                {bug.environment ? (
                  <p className="text-sm text-slate-600 dark:text-slate-400">{bug.environment}</p>
                ) : (
                  <p className="text-sm text-slate-400 italic">Not specified</p>
                )}
              </div>

              {/* Details grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Due Date</dt>
                  <dd className="text-sm text-slate-900 dark:text-slate-100">{formatDate(bug.dueDate) || 'Not set'}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Reporter</dt>
                  <dd>
                    {bug.reporter ? (
                      <div className="flex items-center gap-2">
                        <Avatar name={bug.reporter.name} src={bug.reporter.avatar} size="xs" />
                        <span className="text-sm text-slate-900 dark:text-slate-100">{bug.reporter.name}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-slate-400">Unknown</span>
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Assignee</dt>
                  <dd>
                    {bug.assignee ? (
                      <div className="flex items-center gap-2">
                        <Avatar name={bug.assignee.name} src={bug.assignee.avatar} size="xs" />
                        <span className="text-sm text-slate-900 dark:text-slate-100">{bug.assignee.name}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-slate-400">Unassigned</span>
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Related Task</dt>
                  <dd>
                    {bug.relatedTask ? (
                      <span className="text-sm text-primary-600 hover:text-primary-700 cursor-pointer">
                        {bug.relatedTask.taskId} — {bug.relatedTask.title}
                      </span>
                    ) : (
                      <span className="text-sm text-slate-400">None</span>
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Created</dt>
                  <dd className="text-sm text-slate-900 dark:text-slate-100">{formatDate(bug.createdAt)}</dd>
                </div>
              </div>

              {/* Comments */}
              <CommentSection commentableType="Bug" commentableId={bugId} />
            </div>

            {/* Footer — Status transition */}
            <div className="sticky bottom-0 px-6 py-4 border-t dark:border-slate-700 bg-white dark:bg-slate-900">
              <div className="flex items-end gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">Update Status</label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
                  >
                    {Object.entries(BUG_STATUSES).map(([key, label]) => (
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
                  disabled={!selectedStatus || selectedStatus === bug.status}
                  onClick={handleTransition}
                >
                  Update Status
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
