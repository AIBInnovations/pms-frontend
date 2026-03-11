import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { useToast } from '../../components/ui/Toast';
import { Button, Skeleton } from '../../components/ui';

const NOTIFICATION_TYPES = [
  { key: 'task_assigned', label: 'Task Assignment', desc: 'When you are assigned to a task' },
  { key: 'bug_assigned', label: 'Bug Assignment', desc: 'When a bug is assigned to you' },
  { key: 'comment_mention', label: 'Mentions', desc: 'When someone @mentions you in a comment' },
  { key: 'comment_reply', label: 'Comment Replies', desc: 'When someone replies to your comment' },
  { key: 'deadline_approaching', label: 'Deadline Reminders', desc: 'When a task deadline is approaching' },
  { key: 'status_change', label: 'Status Changes', desc: 'When a task or bug status changes' },
];

export default function NotificationPreferences() {
  const toast = useToast();
  const [prefs, setPrefs] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchPrefs = useCallback(async () => {
    try {
      const { data } = await api.get('/notifications/preferences');
      setPrefs(data.data);
    } catch {
      toast.error('Failed to load preferences');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchPrefs();
  }, [fetchPrefs]);

  const handleToggle = (channel, type) => {
    setPrefs((prev) => ({
      ...prev,
      [channel]: {
        ...prev[channel],
        [type]: !prev[channel]?.[type],
      },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.patch('/notifications/preferences', {
        email: prefs.email,
        inApp: prefs.inApp,
      });
      toast.success('Preferences saved');
    } catch {
      toast.error('Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-14 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Notification Preferences</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Choose how you want to be notified</p>
      </div>

      <div className="rounded-2xl border border-slate-200/60 dark:border-slate-700/60 overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-[1fr_80px_80px] gap-4 px-5 py-3 bg-slate-50 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Notification</span>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">In-App</span>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">Email</span>
        </div>

        {/* Rows */}
        {NOTIFICATION_TYPES.map((type, index) => (
          <div
            key={type.key}
            className={`grid grid-cols-[1fr_80px_80px] gap-4 items-center px-5 py-4 ${
              index < NOTIFICATION_TYPES.length - 1 ? 'border-b border-slate-100 dark:border-slate-700' : ''
            }`}
          >
            <div>
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{type.label}</p>
              <p className="text-xs text-slate-400 mt-0.5">{type.desc}</p>
            </div>
            <div className="flex justify-center">
              <button
                onClick={() => handleToggle('inApp', type.key)}
                className={`w-9 h-5 rounded-full relative transition-colors ${
                  prefs?.inApp?.[type.key] !== false ? 'bg-primary-500' : 'bg-slate-200 dark:bg-slate-600'
                }`}
              >
                <span
                  className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
                    prefs?.inApp?.[type.key] !== false ? 'left-[18px]' : 'left-0.5'
                  }`}
                />
              </button>
            </div>
            <div className="flex justify-center">
              <button
                onClick={() => handleToggle('email', type.key)}
                className={`w-9 h-5 rounded-full relative transition-colors ${
                  prefs?.email?.[type.key] !== false ? 'bg-primary-500' : 'bg-slate-200 dark:bg-slate-600'
                }`}
              >
                <span
                  className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
                    prefs?.email?.[type.key] !== false ? 'left-[18px]' : 'left-0.5'
                  }`}
                />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex justify-end">
        <Button variant="primary" onClick={handleSave} loading={saving}>
          Save Preferences
        </Button>
      </div>
    </div>
  );
}
