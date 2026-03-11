import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { userService } from '../../services';
import { useToast } from '../../components/ui/Toast';
import { Button, Input, Avatar, Badge } from '../../components/ui';
import { ROLE_LABELS } from '../../utils/constants';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('profile');

  const [profile, setProfile] = useState({
    name: '',
    designation: '',
    phone: '',
    skills: '',
  });
  const [profileLoading, setProfileLoading] = useState(false);

  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setProfile({
        name: user.name || '',
        designation: user.designation || '',
        phone: user.phone || '',
        skills: user.skills?.join(', ') || '',
      });
    }
  }, [user]);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    try {
      const payload = {
        name: profile.name,
        designation: profile.designation,
        phone: profile.phone,
        skills: profile.skills.split(',').map((s) => s.trim()).filter(Boolean),
      };
      const response = await userService.updateProfile(payload);
      updateUser(response.data);
      toast.success('Profile updated');
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!passwords.currentPassword) errs.currentPassword = 'Required';
    if (!passwords.newPassword) errs.newPassword = 'Required';
    else if (passwords.newPassword.length < 8) errs.newPassword = 'Min 8 characters';
    if (passwords.newPassword !== passwords.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    setPasswordErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setPasswordLoading(true);
    try {
      await userService.changePassword(passwords.currentPassword, passwords.newPassword);
      toast.success('Password changed successfully');
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      const message = error.response?.data?.error?.message || 'Failed to change password';
      toast.error(message);
    } finally {
      setPasswordLoading(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile' },
    { id: 'security', label: 'Security' },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Avatar name={user?.name} size="lg" />
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">{user?.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge color="primary">{ROLE_LABELS[user?.role]}</Badge>
            {user?.designation && <span className="text-sm text-slate-500 dark:text-slate-400">{user.designation}</span>}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-700 rounded-full p-1 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-1.5 text-sm font-medium rounded-full transition-colors ${
              activeTab === tab.id
                ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-slate-100 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="card p-6">
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <Input label="Full Name" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
            <Input label="Email" value={user?.email} disabled hint="Email cannot be changed" />
            <Input label="Designation" value={profile.designation} onChange={(e) => setProfile({ ...profile, designation: e.target.value })} placeholder="e.g. Senior Developer" />
            <Input label="Phone" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} placeholder="+1 234 567 890" />
            <Input label="Skills" value={profile.skills} onChange={(e) => setProfile({ ...profile, skills: e.target.value })} placeholder="React, Node.js, MongoDB" hint="Comma-separated list" />
            <div className="flex justify-end pt-2">
              <Button type="submit" loading={profileLoading}>Save Changes</Button>
            </div>
          </form>
        </div>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <div className="card p-6">
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-4">Change Password</h3>
          <form onSubmit={handlePasswordSubmit} className="space-y-4" autoComplete="off">
            <Input
              label="Current Password"
              type="password"
              value={passwords.currentPassword}
              onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
              error={passwordErrors.currentPassword}
              autoComplete="current-password"
            />
            <Input
              label="New Password"
              type="password"
              value={passwords.newPassword}
              onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
              error={passwordErrors.newPassword}
              autoComplete="new-password"
            />
            <Input
              label="Confirm New Password"
              type="password"
              value={passwords.confirmPassword}
              onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
              error={passwordErrors.confirmPassword}
              autoComplete="new-password"
            />
            <div className="flex justify-end pt-2">
              <Button type="submit" loading={passwordLoading}>Update Password</Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
