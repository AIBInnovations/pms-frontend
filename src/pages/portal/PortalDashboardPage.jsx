import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { portalService } from '../../services';

function fmtMoney(n) { return '₹' + (Number(n) || 0).toLocaleString('en-IN'); }
function fmtDate(d) { return d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'; }

const STATUS_COLORS = {
  planning: 'bg-slate-100 text-slate-700',
  active: 'bg-emerald-100 text-emerald-700',
  on_hold: 'bg-amber-100 text-amber-700',
  completed: 'bg-blue-100 text-blue-700',
  draft: 'bg-slate-100 text-slate-700',
  sent: 'bg-blue-100 text-blue-700',
  viewed: 'bg-purple-100 text-purple-700',
  accepted: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-red-100 text-red-700',
  paid: 'bg-emerald-100 text-emerald-700',
  overdue: 'bg-red-100 text-red-700',
};

function StatusBadge({ status }) {
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium uppercase ${STATUS_COLORS[status] || 'bg-slate-100 text-slate-700'}`}>
      {status?.replace(/_/g, ' ')}
    </span>
  );
}

export default function PortalDashboardPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('projects');
  const [client, setClient] = useState(null);
  const [projects, setProjects] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('portalClient');
    if (!stored) { navigate('/portal/login', { replace: true }); return; }
    setClient(JSON.parse(stored));
    (async () => {
      try {
        const [pr, pp, iv] = await Promise.all([
          portalService.getProjects(),
          portalService.getProposals(),
          portalService.getInvoices(),
        ]);
        setProjects(pr.data || []);
        setProposals(pp.data || []);
        setInvoices(iv.data || []);
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate]);

  const logout = () => {
    localStorage.removeItem('portalToken');
    localStorage.removeItem('portalClient');
    navigate('/portal/login', { replace: true });
  };

  const totalOutstanding = invoices
    .filter((i) => i.status !== 'paid')
    .reduce((sum, i) => sum + (i.amount || 0), 0);
  const totalPaid = invoices
    .filter((i) => i.status === 'paid')
    .reduce((sum, i) => sum + (i.paidAmount || i.amount || 0), 0);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500">Client Portal</p>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">{client?.company || 'Welcome'}</h1>
          </div>
          <button onClick={logout} className="text-sm text-slate-500 hover:text-red-600">Sign out</button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        {/* KPI cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card p-4">
            <p className="text-xs text-slate-500 mb-1">Active Projects</p>
            <p className="text-2xl font-bold text-primary-600">{projects.filter((p) => p.status === 'active').length}</p>
          </div>
          <div className="card p-4">
            <p className="text-xs text-slate-500 mb-1">Total Projects</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{projects.length}</p>
          </div>
          <div className="card p-4">
            <p className="text-xs text-slate-500 mb-1">Outstanding</p>
            <p className="text-2xl font-bold text-amber-600">{fmtMoney(totalOutstanding)}</p>
          </div>
          <div className="card p-4">
            <p className="text-xs text-slate-500 mb-1">Paid</p>
            <p className="text-2xl font-bold text-emerald-600">{fmtMoney(totalPaid)}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1 w-fit">
          {[
            { id: 'projects', label: `Projects (${projects.length})` },
            { id: 'proposals', label: `Proposals (${proposals.length})` },
            { id: 'invoices', label: `Invoices (${invoices.length})` },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 text-xs font-medium rounded-lg transition-colors ${
                tab === t.id ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm' : 'text-slate-500'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="card p-12 text-center text-sm text-slate-500">Loading...</div>
        ) : tab === 'projects' ? (
          projects.length === 0 ? (
            <div className="card p-12 text-center text-sm text-slate-500">No projects yet</div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {projects.map((p) => (
                <div key={p._id} className="card p-5">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <p className="text-[10px] font-mono text-slate-400">{p.code}</p>
                      <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{p.name}</h3>
                    </div>
                    <StatusBadge status={p.status} />
                  </div>
                  {p.description && <p className="text-xs text-slate-500 line-clamp-2 mb-3">{p.description}</p>}
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span>Start: {fmtDate(p.startDate)}</span>
                    {p.endDate && <span>End: {fmtDate(p.endDate)}</span>}
                  </div>
                </div>
              ))}
            </div>
          )
        ) : tab === 'proposals' ? (
          proposals.length === 0 ? (
            <div className="card p-12 text-center text-sm text-slate-500">No proposals shared with you yet</div>
          ) : (
            <div className="card overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/50">
                  <tr className="text-left text-xs text-slate-500 uppercase">
                    <th className="px-4 py-3">Number</th>
                    <th className="px-4 py-3">Title</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Sent</th>
                    <th className="px-4 py-3">Valid Until</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {proposals.map((p) => (
                    <tr key={p._id}>
                      <td className="px-4 py-3 font-mono text-xs text-slate-500">{p.proposalNumber}</td>
                      <td className="px-4 py-3 font-medium">{p.title}</td>
                      <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                      <td className="px-4 py-3 text-slate-500">{fmtDate(p.sentAt)}</td>
                      <td className="px-4 py-3 text-slate-500">{fmtDate(p.validityDate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          invoices.length === 0 ? (
            <div className="card p-12 text-center text-sm text-slate-500">No invoices yet</div>
          ) : (
            <div className="card overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/50">
                  <tr className="text-left text-xs text-slate-500 uppercase">
                    <th className="px-4 py-3">Invoice #</th>
                    <th className="px-4 py-3">Project</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                    <th className="px-4 py-3">Due</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {invoices.map((i) => (
                    <tr key={i._id}>
                      <td className="px-4 py-3 font-mono text-xs">{i.invoiceNumber}</td>
                      <td className="px-4 py-3">{i.project?.name || '—'}</td>
                      <td className="px-4 py-3 text-xs text-slate-500 capitalize">{i.type?.replace(/_/g, ' ')}</td>
                      <td className="px-4 py-3 text-right font-semibold">{fmtMoney(i.amount)}</td>
                      <td className="px-4 py-3 text-slate-500">{fmtDate(i.dueDate)}</td>
                      <td className="px-4 py-3"><StatusBadge status={i.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </main>
    </div>
  );
}
