import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ui/Toast';
import { Button, Skeleton } from '../../components/ui';
import NotificationPreferences from './NotificationPreferences';

const tabs = [
  { id: 'general', label: 'General' },
  { id: 'notifications', label: 'Notifications' },
];

export default function SettingsPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const isSuperAdmin = user?.role === 'super_admin';

  const fetchSettings = useCallback(async () => {
    try {
      const { data } = await api.get('/settings');
      setSettings(data.data);
    } catch {
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleChange = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data } = await api.patch('/settings', settings);
      setSettings(data.data);
      toast.success('Settings saved');
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Settings</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage application settings</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200 dark:border-slate-600 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              activeTab === tab.id
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'general' && (
        <>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-16 rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="space-y-6 max-w-xl">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Application Name</label>
                <input
                  type="text"
                  value={settings?.appName || ''}
                  onChange={(e) => handleChange('appName', e.target.value)}
                  disabled={!isSuperAdmin}
                  className="input-base"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Default Project Type</label>
                <select
                  value={settings?.defaultProjectType || 'time_and_material'}
                  onChange={(e) => handleChange('defaultProjectType', e.target.value)}
                  disabled={!isSuperAdmin}
                  className="input-base"
                >
                  <option value="fixed_cost">Fixed Cost</option>
                  <option value="time_and_material">Time & Material</option>
                  <option value="retainer">Retainer</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Default Task Priority</label>
                <select
                  value={settings?.defaultTaskPriority || 'medium'}
                  onChange={(e) => handleChange('defaultTaskPriority', e.target.value)}
                  disabled={!isSuperAdmin}
                  className="input-base"
                >
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Max File Upload Size (MB)</label>
                <input
                  type="number"
                  value={settings?.maxFileSize || 10}
                  onChange={(e) => handleChange('maxFileSize', Number(e.target.value))}
                  disabled={!isSuperAdmin}
                  min={1}
                  max={100}
                  className="input-base"
                />
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleChange('maintenanceMode', !settings?.maintenanceMode)}
                  disabled={!isSuperAdmin}
                  className={`w-9 h-5 rounded-full relative transition-colors ${
                    settings?.maintenanceMode ? 'bg-danger-500' : 'bg-slate-200 dark:bg-slate-600'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
                      settings?.maintenanceMode ? 'left-[18px]' : 'left-0.5'
                    }`}
                  />
                </button>
                <div>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Maintenance Mode</p>
                  <p className="text-xs text-slate-400">Restrict access to admins only</p>
                </div>
              </div>

              {isSuperAdmin && (
                <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
                  <Button variant="primary" onClick={handleSave} loading={saving}>
                    Save Settings
                  </Button>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {activeTab === 'notifications' && <NotificationPreferences />}
    </div>
  );
}
