import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { portalService } from '../../services';

export default function PortalLoginPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [clientId, setClientId] = useState(params.get('clientId') || '');
  const [token, setToken] = useState(params.get('token') || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Auto-attempt if both query params present
  useEffect(() => {
    const c = params.get('clientId');
    const t = params.get('token');
    if (c && t) handleLogin(c, t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleLogin(c, t) {
    setError('');
    setLoading(true);
    try {
      const res = await portalService.login(c || clientId, t || token);
      localStorage.setItem('portalToken', res.data.token);
      localStorage.setItem('portalClient', JSON.stringify(res.data.client));
      navigate('/portal/dashboard', { replace: true });
    } catch (e) {
      setError(e.response?.data?.error?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Client Portal</h1>
          <p className="text-sm text-slate-500 mt-2">Sign in with the access link from your account manager</p>
        </div>
        <form
          onSubmit={(e) => { e.preventDefault(); handleLogin(); }}
          className="card p-6 space-y-4"
        >
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Client ID</label>
            <input
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              placeholder="CLIENT-0001"
              required
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Access Token</label>
            <input
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Paste your access token"
              required
              type="password"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-mono"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
