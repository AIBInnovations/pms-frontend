import { useState, useEffect, useCallback } from 'react';
import { clientService } from '../../services';
import { useToast } from '../../components/ui/Toast';
import { Button, Badge, Input, Select, EmptyState, Skeleton } from '../../components/ui';
import CreateClientModal from './CreateClientModal';
import ClientDetailDrawer from './ClientDetailDrawer';

const STATUS_LABELS = {
  prospect: 'Prospect',
  active: 'Active',
  on_hold: 'On Hold',
  churned: 'Churned',
};

const STATUS_COLORS = {
  prospect: 'default',
  active: 'success',
  on_hold: 'warning',
  churned: 'danger',
};

function fmtDate(d) {
  if (!d) return '--';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function ClientsPage() {
  const toast = useToast();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState(null);

  const fetchClients = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const res = await clientService.getAll(params);
      setClients(res.data || []);
    } catch {
      toast.error('Failed to load clients');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, toast]);

  useEffect(() => { fetchClients(); }, [fetchClients]);

  const statusOptions = Object.entries(STATUS_LABELS).map(([v, l]) => ({ value: v, label: l }));

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Clients <span className="text-sm font-normal text-slate-400 ml-2">{clients.length}</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage your client relationships</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          New Client
        </Button>
      </div>

      <div className="card p-4">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="flex-1 relative">
            <svg className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <Input className="pl-10" placeholder="Search by company, contact, email..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} options={statusOptions} placeholder="All statuses" />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {[1,2,3,4].map((i) => <Skeleton key={i} variant="card" className="h-28" />)}
        </div>
      ) : clients.length === 0 ? (
        <EmptyState
          title="No clients found"
          description="Add your first client to start tracking relationships."
          action={<Button onClick={() => setShowCreate(true)} size="sm">New Client</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {clients.map((client) => {
            const primary = client.contacts?.find((c) => c.isPrimary) || client.contacts?.[0];
            return (
              <div
                key={client._id}
                onClick={() => setSelectedClientId(client._id)}
                className="card p-4 cursor-pointer hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600 transition-all"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{client.company}</p>
                    <span className="text-[11px] font-mono text-slate-400">{client.clientId}</span>
                  </div>
                  <Badge size="sm" color={STATUS_COLORS[client.status]}>{STATUS_LABELS[client.status]}</Badge>
                </div>
                {primary && (
                  <div className="text-xs text-slate-600 dark:text-slate-400 mb-2">
                    <p>{primary.name} {primary.role && <span className="text-slate-400">· {primary.role}</span>}</p>
                    {primary.email && <p className="text-slate-400">{primary.email}</p>}
                  </div>
                )}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                  <span className="text-[10px] text-slate-400">Client since {fmtDate(client.clientSince)}</span>
                  {client.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {client.tags.slice(0, 3).map((t) => (
                        <span key={t} className="text-[9px] bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 rounded px-1.5 py-0.5">{t}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <CreateClientModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={() => { setShowCreate(false); fetchClients(); }}
      />

      <ClientDetailDrawer
        clientId={selectedClientId}
        isOpen={!!selectedClientId}
        onClose={() => setSelectedClientId(null)}
        onUpdated={fetchClients}
      />
    </div>
  );
}
