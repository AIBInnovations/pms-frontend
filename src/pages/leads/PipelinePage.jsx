import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { leadService, userService } from '../../services';
import { useToast } from '../../components/ui/Toast';
import { Button, Badge, Avatar, Input, Select, Skeleton } from '../../components/ui';
import {
  LEAD_STATUSES, LEAD_STATUS_COLORS, LEAD_PIPELINES, LEAD_SOURCES,
  LEAD_BUDGETS, LEAD_LOST_REASONS,
} from '../../utils/constants';
import LeadDetailDrawer from './LeadDetailDrawer';
import CreateLeadModal from './CreateLeadModal';

const STAGES = ['new', 'contacted', 'qualified', 'proposal_sent', 'negotiation', 'won', 'lost'];
const STUCK_DAYS = 7;

function fmtCurrency(n) {
  if (!n) return '\u20B90';
  if (n >= 100000) return `\u20B9${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `\u20B9${(n / 1000).toFixed(0)}K`;
  return `\u20B9${n}`;
}

function daysSince(date) {
  if (!date) return 0;
  return Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
}

function LeadCard({ lead, onDragStart, onClick, isStuck }) {
  const ageDays = daysSince(lead.stageEnteredAt);
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, lead)}
      onClick={() => onClick(lead)}
      className={`bg-white dark:bg-slate-800 rounded-xl border p-3 cursor-grab hover:shadow-md transition-all duration-150 active:scale-[0.98] active:cursor-grabbing ${
        isStuck
          ? 'border-amber-300 dark:border-amber-700 ring-1 ring-amber-200 dark:ring-amber-900'
          : 'border-slate-200/60 dark:border-slate-700/60 hover:border-slate-300 dark:hover:border-slate-600'
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <span className="font-mono text-[10px] text-slate-400">{lead.leadId}</span>
        {lead.priority && <span className="text-amber-500 text-[10px]" title="High Priority">⭐</span>}
      </div>
      <p className="text-sm font-medium text-slate-900 dark:text-slate-100 line-clamp-1">{lead.contactName}</p>
      {lead.company && <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{lead.company}</p>}

      {lead.dealValue > 0 && (
        <p className="text-sm font-bold text-emerald-600 mt-2">{fmtCurrency(lead.dealValue)}</p>
      )}

      <div className="flex items-center justify-between mt-2.5">
        <div className="flex items-center gap-1.5">
          {lead.assignee ? (
            <Avatar name={lead.assignee.name} size="xs" />
          ) : (
            <span className="text-[10px] text-slate-300">Unassigned</span>
          )}
        </div>
        <span className={`text-[10px] ${ageDays > STUCK_DAYS ? 'text-amber-600 font-semibold' : 'text-slate-400'}`}>
          {ageDays === 0 ? 'today' : `${ageDays}d`}
        </span>
      </div>
    </div>
  );
}

function Column({ stage, leads, onDrop, onDragOver, onTaskDragStart, onTaskClick }) {
  const [dragOver, setDragOver] = useState(false);
  const totalValue = leads.reduce((sum, l) => sum + (l.dealValue || 0), 0);

  return (
    <div
      className="flex flex-col min-w-[260px] max-w-[300px] flex-1"
      onDragOver={(e) => {
        e.preventDefault();
        onDragOver(e);
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        setDragOver(false);
        onDrop(e, stage);
      }}
    >
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <Badge size="sm" color={LEAD_STATUS_COLORS[stage]} dot>{LEAD_STATUSES[stage]}</Badge>
          <span className="text-[11px] text-slate-400 bg-slate-100 dark:bg-slate-700 rounded-full px-2 py-0.5 font-medium">
            {leads.length}
          </span>
        </div>
        {totalValue > 0 && (
          <span className="text-[10px] font-semibold text-emerald-600">{fmtCurrency(totalValue)}</span>
        )}
      </div>

      <div className={`flex-1 space-y-2 p-2 rounded-2xl transition-colors duration-150 min-h-[120px] ${
        dragOver ? 'bg-primary-50/50 dark:bg-primary-900/20 ring-2 ring-primary-200 dark:ring-primary-700 ring-inset' : 'bg-slate-50/80 dark:bg-slate-700/30'
      }`}>
        {leads.map((lead) => (
          <LeadCard
            key={lead._id}
            lead={lead}
            onDragStart={onTaskDragStart}
            onClick={onTaskClick}
            isStuck={daysSince(lead.lastActivityAt) > STUCK_DAYS}
          />
        ))}
        {leads.length === 0 && !dragOver && (
          <div className="flex items-center justify-center h-20">
            <p className="text-xs text-slate-300 dark:text-slate-600">No leads</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PipelinePage() {
  const toast = useToast();
  const [pipeline, setPipeline] = useState('new_business');
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [budgetFilter, setBudgetFilter] = useState('');
  const [salesUsers, setSalesUsers] = useState([]);
  const [selectedLeadId, setSelectedLeadId] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const dragLeadRef = useRef(null);
  const [showLostForm, setShowLostForm] = useState(null); // { leadId }
  const [lostReason, setLostReason] = useState('');
  const [lostNote, setLostNote] = useState('');

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
      const params = { pipeline, limit: 200 };
      if (search) params.search = search;
      if (assigneeFilter) params.assignee = assigneeFilter;
      if (sourceFilter) params.source = sourceFilter;
      if (budgetFilter) params.budgetRange = budgetFilter;
      const res = await leadService.getAll(params);
      setLeads(res.data || []);
    } catch {
      toast.error('Failed to load pipeline');
    } finally {
      setLoading(false);
    }
  }, [pipeline, search, assigneeFilter, sourceFilter, budgetFilter, toast]);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  const grouped = useMemo(() => {
    const g = {};
    for (const stage of STAGES) g[stage] = [];
    for (const lead of leads) {
      if (g[lead.status]) g[lead.status].push(lead);
    }
    return g;
  }, [leads]);

  const handleDragStart = (e, lead) => {
    dragLeadRef.current = lead;
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e, newStatus) => {
    e.preventDefault();
    const lead = dragLeadRef.current;
    dragLeadRef.current = null;
    if (!lead || lead.status === newStatus) return;

    if (newStatus === 'lost') {
      setShowLostForm({ leadId: lead._id });
      return;
    }

    if (newStatus === 'won') {
      // Show confirmation toast for now; convert-to-project flow comes in Phase 8
      if (!confirm(`Mark "${lead.contactName}" as Won? You'll be able to convert to a project later.`)) return;
    }

    // Optimistic update
    setLeads((prev) => prev.map((l) => l._id === lead._id ? { ...l, status: newStatus, stageEnteredAt: new Date() } : l));

    try {
      await leadService.update(lead._id, { status: newStatus });
      toast.success(`Moved to ${LEAD_STATUSES[newStatus]}`);
    } catch (e) {
      toast.error('Failed to update');
      fetchLeads();
    }
  };

  const handleConfirmLost = async () => {
    if (!lostReason) { toast.error('Lost reason is required'); return; }
    try {
      await leadService.update(showLostForm.leadId, { status: 'lost', lostReason, lostReasonNote: lostNote });
      toast.success('Marked as lost');
      setShowLostForm(null);
      setLostReason('');
      setLostNote('');
      fetchLeads();
    } catch (e) {
      toast.error(e.response?.data?.error?.message || 'Failed');
    }
  };

  const sourceOptions = Object.entries(LEAD_SOURCES).map(([v, l]) => ({ value: v, label: l }));
  const budgetOptions = Object.entries(LEAD_BUDGETS).map(([v, l]) => ({ value: v, label: l }));
  const assigneeOptions = salesUsers.map((u) => ({ value: u._id, label: u.name }));
  const lostReasonOptions = Object.entries(LEAD_LOST_REASONS).map(([v, l]) => ({ value: v, label: l }));

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Pipeline</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Visual deal flow across stages</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          New Lead
        </Button>
      </div>

      {/* Pipeline tabs */}
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1 w-fit">
        {Object.entries(LEAD_PIPELINES).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setPipeline(key)}
            className={`px-4 py-2 text-xs font-medium rounded-lg transition-colors ${
              pipeline === key
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="flex-1 relative">
            <svg className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <Input className="pl-10" placeholder="Search leads..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={assigneeFilter} onChange={(e) => setAssigneeFilter(e.target.value)} options={assigneeOptions} placeholder="All assignees" />
          <Select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)} options={sourceOptions} placeholder="All sources" />
          <Select value={budgetFilter} onChange={(e) => setBudgetFilter(e.target.value)} options={budgetOptions} placeholder="All budgets" />
        </div>
      </div>

      {/* Kanban board */}
      {loading ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STAGES.map((s) => (
            <div key={s} className="min-w-[260px] flex-1">
              <Skeleton variant="text" className="w-20 mb-3" />
              <div className="space-y-2.5 bg-slate-50/80 dark:bg-slate-700/50 rounded-2xl p-2">
                {[1,2].map((i) => <Skeleton key={i} variant="card" className="h-24" />)}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STAGES.map((stage) => (
            <Column
              key={stage}
              stage={stage}
              leads={grouped[stage] || []}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onTaskDragStart={handleDragStart}
              onTaskClick={(lead) => setSelectedLeadId(lead._id)}
            />
          ))}
        </div>
      )}

      {/* Lost form modal */}
      {showLostForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 max-w-sm w-full mx-4">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">Mark as Lost</h3>
            <Select value={lostReason} onChange={(e) => setLostReason(e.target.value)} options={lostReasonOptions} placeholder="Reason *" />
            <Input className="mt-2" value={lostNote} onChange={(e) => setLostNote(e.target.value)} placeholder="Additional notes (optional)" />
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="secondary" size="sm" onClick={() => { setShowLostForm(null); setLostReason(''); setLostNote(''); }}>Cancel</Button>
              <Button size="sm" variant="danger" onClick={handleConfirmLost}>Confirm Lost</Button>
            </div>
          </div>
        </div>
      )}

      <LeadDetailDrawer
        leadId={selectedLeadId}
        isOpen={!!selectedLeadId}
        onClose={() => setSelectedLeadId(null)}
        onUpdated={fetchLeads}
        salesUsers={salesUsers}
      />

      <CreateLeadModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={() => { setShowCreate(false); fetchLeads(); }}
        salesUsers={salesUsers}
      />
    </div>
  );
}
