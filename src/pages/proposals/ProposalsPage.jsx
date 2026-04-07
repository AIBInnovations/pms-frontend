import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { proposalService } from '../../services';
import { useToast } from '../../components/ui/Toast';
import { Button, Badge, Input, Select, EmptyState, Skeleton } from '../../components/ui';

const STATUS_LABELS = {
  draft: 'Draft',
  sent: 'Sent',
  viewed: 'Viewed',
  accepted: 'Accepted',
  rejected: 'Rejected',
};
const STATUS_COLORS = {
  draft: 'default',
  sent: 'primary',
  viewed: 'warning',
  accepted: 'success',
  rejected: 'danger',
};

function fmtDate(d) {
  if (!d) return '--';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function calcTotal(proposal) {
  const sub = (proposal.lineItems || []).reduce((sum, li) => sum + (li.quantity * li.unitPrice), 0);
  let discount = 0;
  if (proposal.discountType === 'percentage') discount = sub * (proposal.discountValue / 100);
  else if (proposal.discountType === 'fixed') discount = proposal.discountValue;
  return Math.max(0, sub - discount);
}

function fmtCurrency(n) {
  return `\u20B9${(n || 0).toLocaleString('en-IN')}`;
}

export default function ProposalsPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const res = await proposalService.getAll(params);
      setProposals(res.data || []);
    } catch {
      toast.error('Failed to load proposals');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, toast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDuplicate = async (id) => {
    try {
      const res = await proposalService.duplicate(id);
      toast.success('Duplicated');
      navigate(`/proposals/${res.data._id}/edit`);
    } catch { toast.error('Failed to duplicate'); }
  };

  const handleDelete = async (id) => {
    try {
      await proposalService.delete(id);
      toast.success('Deleted');
      setConfirmDeleteId(null);
      fetchData();
    } catch { toast.error('Failed to delete'); }
  };

  const statusOptions = Object.entries(STATUS_LABELS).map(([v, l]) => ({ value: v, label: l }));

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Proposals <span className="text-sm font-normal text-slate-400 ml-2">{proposals.length}</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Build and send proposals to clients</p>
        </div>
        <Button onClick={() => navigate('/proposals/new')}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          New Proposal
        </Button>
      </div>

      <div className="card p-4">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="flex-1 relative">
            <svg className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <Input className="pl-10" placeholder="Search proposals..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} options={statusOptions} placeholder="All statuses" />
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">{[1,2,3,4].map((i) => <Skeleton key={i} variant="card" className="h-16" />)}</div>
      ) : proposals.length === 0 ? (
        <EmptyState
          title="No proposals found"
          description="Build your first proposal."
          action={<Button size="sm" onClick={() => navigate('/proposals/new')}>New Proposal</Button>}
        />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
                <th className="text-left text-xs font-medium text-slate-500 uppercase px-5 py-3">Proposal</th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase px-5 py-3">Lead / Client</th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase px-5 py-3">Status</th>
                <th className="text-right text-xs font-medium text-slate-500 uppercase px-5 py-3">Total</th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase px-5 py-3">Created</th>
                <th className="text-right text-xs font-medium text-slate-500 uppercase px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {proposals.map((p) => (
                <tr key={p._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30">
                  <td className="px-5 py-3">
                    <div onClick={() => navigate(`/proposals/${p._id}/edit`)} className="cursor-pointer">
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{p.title}</p>
                      <span className="text-[10px] font-mono text-slate-400">{p.proposalNumber} · v{p.version}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-xs text-slate-500 dark:text-slate-400">
                    {p.client?.company || p.lead?.company || p.lead?.contactName || '--'}
                  </td>
                  <td className="px-5 py-3">
                    <Badge size="sm" color={STATUS_COLORS[p.status]}>{STATUS_LABELS[p.status]}</Badge>
                  </td>
                  <td className="px-5 py-3 text-sm font-semibold text-emerald-600 text-right">{fmtCurrency(calcTotal(p))}</td>
                  <td className="px-5 py-3 text-xs text-slate-500 dark:text-slate-400">{fmtDate(p.createdAt)}</td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => handleDuplicate(p._id)} className="p-1.5 rounded-lg text-slate-400 hover:text-primary-600 hover:bg-primary-50 transition-colors" title="Duplicate">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
                        </svg>
                      </button>
                      {confirmDeleteId === p._id ? (
                        <div className="flex items-center gap-1 bg-danger-50 dark:bg-danger-900/20 rounded-lg px-2 py-1">
                          <button onClick={() => handleDelete(p._id)} className="text-xs font-semibold text-danger-600 px-1">Yes</button>
                          <button onClick={() => setConfirmDeleteId(null)} className="text-xs text-slate-500 px-1">No</button>
                        </div>
                      ) : (
                        <button onClick={() => setConfirmDeleteId(p._id)} className="p-1.5 rounded-lg text-slate-400 hover:text-danger-600 hover:bg-danger-50 transition-colors" title="Delete">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
