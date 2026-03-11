import { useState } from 'react';
import { userService } from '../../services';
import { useToast } from '../../components/ui/Toast';
import { Button, Input, Select, Modal } from '../../components/ui';

export default function CreateUserModal({ isOpen, onClose, onCreated }) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'developer',
    designation: '',
    phone: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const handleChange = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value });
    if (errors[field]) setErrors({ ...errors, [field]: '' });
  };

  const validate = () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = 'Name is required';
    if (!form.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) newErrors.email = 'Invalid email';
    if (!form.password) newErrors.password = 'Password is required';
    else if (form.password.length < 8) newErrors.password = 'Min 8 characters';
    if (!form.role) newErrors.role = 'Role is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await userService.create(form);
      toast.success('User created successfully');
      setForm({ name: '', email: '', password: '', role: 'developer', designation: '', phone: '' });
      setErrors({});
      onCreated();
    } catch (error) {
      const message = error.response?.data?.error?.message || 'Failed to create user';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Team Member" size="md">
      <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
        <Input label="Full Name" placeholder="John Doe" value={form.name} onChange={handleChange('name')} error={errors.name} autoComplete="off" />
        <Input label="Email" type="email" placeholder="john@company.com" value={form.email} onChange={handleChange('email')} error={errors.email} autoComplete="off" />
        <Input label="Password" type="password" placeholder="Minimum 8 characters" value={form.password} onChange={handleChange('password')} error={errors.password} autoComplete="new-password" />
        <Select
          label="Role"
          value={form.role}
          onChange={handleChange('role')}
          error={errors.role}
          options={[
            { value: 'developer', label: 'Developer' },
            { value: 'project_manager', label: 'Project Manager' },
            { value: 'super_admin', label: 'Super Admin' },
          ]}
        />
        <Input label="Designation" placeholder="e.g. Senior Developer" value={form.designation} onChange={handleChange('designation')} />
        <Input label="Phone" placeholder="+1 234 567 890" value={form.phone} onChange={handleChange('phone')} />

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={loading}>Create User</Button>
        </div>
      </form>
    </Modal>
  );
}
