import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ui/Toast';
import { Button, Input } from '../../components/ui';
import AuthLayout from '../../layouts/AuthLayout';

export default function LoginPage() {
  const [email, setEmail] = useState('admin@pms.com');
  const [password, setPassword] = useState('Admin@123');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [hintCleared, setHintCleared] = useState({ email: false, password: false });
  const { login } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const handleFocus = (field) => {
    if (!hintCleared[field]) {
      if (field === 'email') setEmail('');
      if (field === 'password') setPassword('');
      setHintCleared((prev) => ({ ...prev, [field]: true }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Invalid email address';
    if (!password) newErrors.password = 'Password is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (error) {
      const message = error.response?.data?.error?.message || 'Login failed. Please try again.';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Welcome back</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
          <Input
            label="Email"
            type="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onFocus={() => handleFocus('email')}
            error={errors.email}
            autoComplete="off"
            hint={!hintCleared.email ? 'admin@pms.com (click to clear)' : undefined}
          />
          <div>
            <Input
              label="Password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => handleFocus('password')}
              error={errors.password}
              autoComplete="off"
              hint={!hintCleared.password ? 'Admin@123 (click to clear)' : undefined}
            />
            <div className="mt-2 text-right">
              <Link to="/forgot-password" className="text-xs text-slate-500 dark:text-slate-400 hover:text-primary-600 font-medium transition-colors">
                Forgot password?
              </Link>
            </div>
          </div>

          <Button type="submit" loading={loading} className="w-full">
            Sign in
          </Button>
        </form>

        {/* Quick login credentials */}
        <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-3 space-y-2">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 text-center">Demo Credentials <span className="text-slate-400 dark:text-slate-500">(password: Admin@123)</span></p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Admin', email: 'admin@pms.com', color: 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800' },
              { label: 'PM', email: 'sarah@pms.com', color: 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800' },
              { label: 'Developer', email: 'priya@pms.com', color: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' },
            ].map((cred) => (
              <button
                key={cred.email}
                type="button"
                onClick={() => { setEmail(cred.email); setPassword('Admin@123'); setHintCleared({ email: true, password: true }); }}
                className={`text-xs font-medium px-2 py-1.5 rounded-lg border transition-colors hover:opacity-80 ${cred.color}`}
              >
                {cred.label}
              </button>
            ))}
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 dark:text-slate-500">
          Don't have an account? Contact your administrator.
        </p>
      </div>
    </AuthLayout>
  );
}
