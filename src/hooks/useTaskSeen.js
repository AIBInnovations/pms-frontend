import { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

/**
 * Tracks which tasks the current user has "seen" (opened the detail drawer).
 * Uses localStorage for persistence + React state for reactivity.
 *
 * hasNew(task) → true when task.lastCommentAt is newer than the user's last view.
 * markSeen(taskId) → records the current timestamp as the user's last view.
 */
export default function useTaskSeen() {
  const { user } = useAuth();
  const storageKey = `pms_task_seen_${user?._id || 'anon'}`;

  const [seenMap, setSeenMap] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(storageKey) || '{}');
    } catch {
      return {};
    }
  });

  const markSeen = useCallback((taskId) => {
    if (!taskId) return;
    const now = Date.now();
    setSeenMap((prev) => {
      const next = { ...prev, [taskId]: now };
      try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch {}
      return next;
    });
  }, [storageKey]);

  const hasNew = useCallback((task) => {
    if (!task?.lastCommentAt) return false;
    const lastSeen = seenMap[task._id];
    return !lastSeen || new Date(task.lastCommentAt).getTime() > lastSeen;
  }, [seenMap]);

  return { markSeen, hasNew };
}
