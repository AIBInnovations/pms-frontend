import { useState, useEffect, useCallback } from 'react';
import { leadService, userService } from '../../services';
import { useToast } from '../../components/ui/Toast';
import { Button, Badge, Avatar, Input, Select, EmptyState, Skeleton } from '../../components/ui';
import {
  LEAD_STATUSES, LEAD_STATUS_COLORS, LEAD_SOURCES, LEAD_PIPELINES,
  LEAD_BUDGETS, LEAD_SERVICES,
} from '../../utils/constants';
import CreateLeadModal from './CreateLeadModal';
import LeadDetailDrawer from './LeadDetailDrawer';

function fmtDate(d) {
  if (!d) return '--';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function fmtCurrency(n) {
  return n ? `\u20B9${n.toLocaleString('en-IN')}` : '--';
}

export default function LeadsPage() {
  const toast = useToast();
  const [leads, setLeads] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [pipelineFilter, setPipelineFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState(null);
  const [salesUsers, setSalesUsers] = useState([]);

  // Fetch sales users for assignee filter and create form
  useEffect(() => {
    Promise.all([
      userService.getAll({ role: 'sales_executive', status: 'active', limit: 100 }),
      userService.getAll({ role: 'project_manager', status: 'active', limit: 100 }),
      userService.getAll({ role: 'super_admin', status: 'active', limit: 100 }),
    ]).then(([sales, pm, admin]) => {
      setSalesUsers([...(sales.data || []), ...(pm.data || []), ...(admin.data || [])]);
    }).catch(() => {});
  }, []);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 50 };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (pipelineFilter) params.pipeline = pipelineFilter;
      if (sourceFilter) params.source = sourceFilter;
      if (assigneeFilter) params.assignee = assigneeFilter;
      const res = await leadService.getAll(params);
      setLeads(res.data || []);
      setMeta(res.meta);
    } catch {
      toast.error('Failed to load leads');
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, pipelineFilter, sourceFilter, assigneeFilter, toast]);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  const statusOptions = Object.entries(LEAD_STATUSES).map(([v, l]) => ({ value: v, label: l }));
  const pipelineOptions = Object.entries(LEAD_PIPELINES).map(([v, l]) => ({ value: v, label: l }));
  const sourceOptions = Object.entries(LEAD_SOURCES).map(([v, l]) => ({ value: v, label: l }));
  const assigneeOptions = salesUsers.map((u) => ({ value: u._id, label: u.name }));

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Leads {meta && <span className="text-sm font-normal text-slate-400 ml-2">{meta.total}</span>}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage your sales pipeline</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          New Lead
        </Button>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="flex-1 relative">
            <svg className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <Input className="pl-10" placeholder="Search by company, name, email..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <Select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} options={statusOptions} placeholder="All statuses" />
          <Select value={pipelineFilter} onChange={(e) => { setPipelineFilter(e.target.value); setPage(1); }} options={pipelineOptions} placeholder="All pipelines" />
          <Select value={sourceFilter} onChange={(e) => { setSourceFilter(e.target.value); setPage(1); }} options={sourceOptions} placeholder="All sources" />
          <Select value={assigneeFilter} onChange={(e) => { setAssigneeFilter(e.target.value); setPage(1); }} options={assigneeOptions} placeholder="All assignees" />
        </div>
      </div>

      {/* Leads list */}
      {loading ? (
        <div className="card overflow-hidden">
          <div className="p-4 space-y-3">
            {[1,2,3,4,5].map((i) => <Skeleton key={i} variant="text" className="h-12" />)}
          </div>
        </div>
      ) : leads.length === 0 ? (
        <EmptyState
          title="No leads found"
          description="Try adjusting your filters or create a new lead."
          action={<Button onClick={() => setShowCreate(true)} size="sm">New Lead</Button>}
        />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
                  <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider px-5 py-3">Lead ID</th>
                  <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider px-5 py-3">Contact / Company</th>
                  <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider px-5 py-3">Status</th>
                  <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider px-5 py-3">Source</th>
                  <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider px-5 py-3">Budget</th>
                  <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider px-5 py-3">Deal Value</th>
                  <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider px-5 py-3">Assignee</th>
                  <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider px-5 py-3">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {leads.map((lead) => (
                  <tr
                    key={lead._id}
                    onClick={() => setSelectedLeadId(lead._id)}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer"
                  >
                    <td className="px-5 py-3.5">
                      <span className="font-mono text-xs text-slate-400">{lead.leadId}</span>
                      {lead.priority && <span className="ml-1.5 text-amber-500" title="High Priority">⭐</span>}
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{lead.contactName}</p>
                      {lead.company && <p className="text-xs text-slate-500 dark:text-slate-400">{lead.company}</p>}
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge size="sm" color={LEAD_STATUS_COLORS[lead.status]}>{LEAD_STATUSES[lead.status]}</Badge>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-500 dark:text-slate-400">{LEAD_SOURCES[lead.source] || lead.source}</td>
                    <td className="px-5 py-3.5 text-xs text-slate-500 dark:text-slate-400">{LEAD_BUDGETS[lead.budgetRange] || '--'}</td>
                    <td className="px-5 py-3.5 text-sm font-semibold text-emerald-600">{fmtCurrency(lead.dealValue)}</td>
                    <td className="px-5 py-3.5">
                      {lead.assignee ? (
                        <div className="flex items-center gap-2">
                          <Avatar name={lead.assignee.name} size="xs" />
                          <span className="text-xs text-slate-600 dark:text-slate-400">{lead.assignee.name}</span>
                        </div>
                      ) : <span className="text-xs text-slate-300">Unassigned</span>}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-500 dark:text-slate-400">{fmtDate(lead.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {meta && meta.totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 dark:border-slate-700">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Showing {(meta.page - 1) * meta.limit + 1} to {Math.min(meta.page * meta.limit, meta.total)} of {meta.total}
              </p>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
                <Button variant="secondary" size="sm" disabled={page >= meta.totalPages} onClick={() => setPage(page + 1)}>Next</Button>
              </div>
            </div>
          )}
        </div>
      )}

      <CreateLeadModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={() => { setShowCreate(false); fetchLeads(); }}
        salesUsers={salesUsers}
      />

      <LeadDetailDrawer
        leadId={selectedLeadId}
        isOpen={!!selectedLeadId}
        onClose={() => setSelectedLeadId(null)}
        onUpdated={fetchLeads}
        salesUsers={salesUsers}
      />
    </div>
  );
}
