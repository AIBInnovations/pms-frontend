import { useState, useEffect, useCallback } from 'react';
import { accountsService, projectService } from '../../services';
import { useToast } from '../../components/ui/Toast';
import { Button, Badge, Input, Select, Skeleton, EmptyState } from '../../components/ui';

const EXPENSE_CATEGORIES = [
  { value: 'salaries', label: 'Salaries & Wages' },
  { value: 'freelancer', label: 'Freelancer / Contractor' },
  { value: 'software_tools', label: 'Software & Tools' },
  { value: 'hosting', label: 'Hosting & Infrastructure' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'office', label: 'Office' },
  { value: 'travel', label: 'Travel' },
  { value: 'miscellaneous', label: 'Miscellaneous' },
];

const PAYMENT_METHODS = [
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'upi', label: 'UPI' },
  { value: 'cash', label: 'Cash' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'other', label: 'Other' },
];

const FOUNDERS = [
  { value: 'akshat', label: 'Akshat' },
  { value: 'bhavya', label: 'Bhavya' },
];

function fmt(n) { return `\u20B9${(n || 0).toLocaleString('en-IN')}`; }
function fmtDate(d) { return d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '--'; }

function getMonthOptions() {
  const opts = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    opts.push({ value: d.toISOString().slice(0, 7), label: d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) });
  }
  return opts;
}

export default function AccountsPage() {
  const toast = useToast();
  const [tab, setTab] = useState('overview');
  const [month, setMonth] = useState('');
  const [summary, setSummary] = useState(null);
  const [receivables, setReceivables] = useState([]);
  const [payments, setPayments] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [plans, setPlans] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    projectService.getAll({ limit: 100 }).then((res) => setProjects(res.data || [])).catch(() => {});
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (tab === 'overview') {
        const [sumRes, recRes] = await Promise.all([
          accountsService.getSummary(month || undefined),
          accountsService.getReceivables(),
        ]);
        setSummary(sumRes.data);
        setReceivables(recRes.data || []);
      } else if (tab === 'payments') {
        const res = await accountsService.getPayments({ limit: 100 });
        setPayments(res.data || []);
      } else if (tab === 'expenses') {
        const res = await accountsService.getExpenses({ limit: 100 });
        setExpenses(res.data || []);
      } else if (tab === 'withdrawals') {
        const res = await accountsService.getWithdrawals({ limit: 100 });
        setWithdrawals(res.data || []);
      } else if (tab === 'recurring') {
        const [plansRes, invRes] = await Promise.all([
          accountsService.getRecurringPlans(),
          accountsService.getInvoices({ limit: 200 }),
        ]);
        setPlans(plansRes.data || []);
        setInvoices(invRes.data || []);
      }
    } catch {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [tab, month, toast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const projectOptions = projects.map((p) => ({ value: p._id, label: `${p.code} — ${p.name}` }));

  const resetForm = () => { setForm({}); setShowForm(false); };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (tab === 'payments') {
        if (!form.project || !form.amount || !form.date) { toast.error('Project, amount, and date are required'); setSaving(false); return; }
        await accountsService.addPayment({ ...form, amount: Number(form.amount) });
        toast.success('Payment recorded');
      } else if (tab === 'expenses') {
        if (!form.category || !form.amount || !form.date) { toast.error('Category, amount, and date are required'); setSaving(false); return; }
        await accountsService.addExpense({ ...form, amount: Number(form.amount) });
        toast.success('Expense recorded');
      } else if (tab === 'withdrawals') {
        if (!form.person || !form.amount || !form.date) { toast.error('Person, amount, and date are required'); setSaving(false); return; }
        await accountsService.addWithdrawal({ ...form, amount: Number(form.amount) });
        toast.success('Withdrawal recorded');
      }
      resetForm();
      fetchData();
    } catch {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (type, id) => {
    try {
      if (type === 'payments') await accountsService.deletePayment(id);
      else if (type === 'expenses') await accountsService.deleteExpense(id);
      else if (type === 'withdrawals') await accountsService.deleteWithdrawal(id);
      toast.success('Deleted');
      fetchData();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'recurring', label: 'Recurring' },
    { id: 'payments', label: 'Payments' },
    { id: 'expenses', label: 'Expenses' },
    { id: 'withdrawals', label: 'Withdrawals' },
  ];

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Accounts</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Financial overview and transaction management</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1 w-fit">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => { setTab(t.id); setShowForm(false); }}
            className={`px-4 py-2 text-xs font-medium rounded-lg transition-colors ${tab === t.id ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {tab === 'overview' && (
        <>
          <div className="flex justify-end">
            <select value={month} onChange={(e) => setMonth(e.target.value)}
              className="rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-1.5 text-sm text-slate-700 dark:text-slate-300 outline-none">
              <option value="">All Time</option>
              {getMonthOptions().map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[1,2,3,4].map((i) => <Skeleton key={i} variant="card" className="h-24" />)}</div>
          ) : summary && (
            <>
              {/* Summary cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="card p-4">
                  <p className="text-xs text-slate-500 mb-1">Total Received</p>
                  <p className="text-xl font-bold text-emerald-600">{fmt(summary.allTime.received)}</p>
                  {month && <p className="text-xs text-slate-400 mt-1">This period: {fmt(summary.period.received)}</p>}
                </div>
                <div className="card p-4">
                  <p className="text-xs text-slate-500 mb-1">Total Expenses</p>
                  <p className="text-xl font-bold text-red-500">{fmt(summary.allTime.expenses)}</p>
                  {month && <p className="text-xs text-slate-400 mt-1">This period: {fmt(summary.period.expenses)}</p>}
                </div>
                <div className="card p-4">
                  <p className="text-xs text-slate-500 mb-1">Total Withdrawals</p>
                  <p className="text-xl font-bold text-amber-600">{fmt(summary.allTime.withdrawals)}</p>
                  {month && <p className="text-xs text-slate-400 mt-1">This period: {fmt(summary.period.withdrawals)}</p>}
                </div>
                <div className="card p-4">
                  <p className="text-xs text-slate-500 mb-1">Available Balance</p>
                  <p className={`text-xl font-bold ${summary.availableBalance >= 0 ? 'text-primary-600' : 'text-red-600'}`}>{fmt(summary.availableBalance)}</p>
                </div>
              </div>

              {/* Founder withdrawals */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="card p-5">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">Founder Withdrawals (All Time)</h3>
                  <div className="space-y-3">
                    {FOUNDERS.map((f) => (
                      <div key={f.value} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800">
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{f.label}</span>
                        <span className="text-sm font-bold text-amber-600">{fmt(summary.founderWithdrawals?.[f.value])}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card p-5">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">Expense Breakdown {month ? '(Period)' : '(All Time)'}</h3>
                  {summary.expenseByCategory?.length > 0 ? (
                    <div className="space-y-2">
                      {summary.expenseByCategory.map((e) => (
                        <div key={e._id} className="flex items-center justify-between">
                          <span className="text-xs text-slate-600 dark:text-slate-400">{EXPENSE_CATEGORIES.find((c) => c.value === e._id)?.label || e._id}</span>
                          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{fmt(e.total)}</span>
                        </div>
                      ))}
                    </div>
                  ) : <p className="text-sm text-slate-400">No expenses recorded</p>}
                </div>
              </div>

              {/* Receivables */}
              <div className="card p-5">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">Project Receivables</h3>
                {receivables.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-100 dark:border-slate-700">
                          <th className="text-left text-xs font-medium text-slate-500 uppercase px-3 py-2">Project</th>
                          <th className="text-right text-xs font-medium text-slate-500 uppercase px-3 py-2">Budget</th>
                          <th className="text-right text-xs font-medium text-slate-500 uppercase px-3 py-2">Received</th>
                          <th className="text-right text-xs font-medium text-slate-500 uppercase px-3 py-2">Receivable</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {receivables.map((r) => (
                          <tr key={r.project._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30">
                            <td className="px-3 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300">{r.project.code} — {r.project.name}</td>
                            <td className="px-3 py-2.5 text-sm text-right text-slate-500">{fmt(r.budget)}</td>
                            <td className="px-3 py-2.5 text-sm text-right text-emerald-600 font-semibold">{fmt(r.received)}</td>
                            <td className="px-3 py-2.5 text-sm text-right font-semibold">
                              <span className={r.receivable > 0 ? 'text-amber-600' : 'text-emerald-600'}>{fmt(r.receivable)}</span>
                            </td>
                          </tr>
                        ))}
                        <tr className="bg-slate-50 dark:bg-slate-800 font-semibold">
                          <td className="px-3 py-2.5 text-sm text-slate-700 dark:text-slate-300">Total</td>
                          <td className="px-3 py-2.5 text-sm text-right">{fmt(receivables.reduce((s, r) => s + r.budget, 0))}</td>
                          <td className="px-3 py-2.5 text-sm text-right text-emerald-600">{fmt(receivables.reduce((s, r) => s + r.received, 0))}</td>
                          <td className="px-3 py-2.5 text-sm text-right text-amber-600">{fmt(receivables.reduce((s, r) => s + r.receivable, 0))}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                ) : <p className="text-sm text-slate-400">Set project budgets to track receivables</p>}
              </div>

              {/* Revenue by project */}
              {summary.revenueByProject?.length > 0 && (
                <div className="card p-5">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">Revenue by Project {month ? '(Period)' : '(All Time)'}</h3>
                  <div className="space-y-2">
                    {summary.revenueByProject.map((r) => (
                      <div key={r._id} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800">
                        <span className="text-sm text-slate-700 dark:text-slate-300">{r.project?.code} — {r.project?.name || 'Unknown'}</span>
                        <span className="text-sm font-semibold text-emerald-600">{fmt(r.total)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Payments Tab */}
      {tab === 'payments' && (
        <TransactionTab
          title="Incoming Payments"
          records={payments}
          loading={loading}
          showForm={showForm}
          setShowForm={setShowForm}
          form={form}
          setForm={setForm}
          saving={saving}
          onSave={handleSave}
          onReset={resetForm}
          onDelete={(id) => handleDelete('payments', id)}
          formFields={
            <>
              <Select value={form.project || ''} onChange={(e) => setForm({ ...form, project: e.target.value })} options={projectOptions} placeholder="Select Project *" />
              <Input type="number" value={form.amount || ''} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="Amount *" />
              <Input type="date" value={form.date || ''} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              <Select value={form.paymentMethod || 'bank_transfer'} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })} options={PAYMENT_METHODS} />
              <Input value={form.reference || ''} onChange={(e) => setForm({ ...form, reference: e.target.value })} placeholder="Reference / Transaction ID" />
              <Input value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description" />
            </>
          }
          columns={['Project', 'Amount', 'Date', 'Method', 'Reference']}
          renderRow={(r) => (
            <>
              <td className="px-3 py-2.5 text-sm text-slate-700 dark:text-slate-300">{r.project?.code} — {r.project?.name}</td>
              <td className="px-3 py-2.5 text-sm font-semibold text-emerald-600">{fmt(r.amount)}</td>
              <td className="px-3 py-2.5 text-sm text-slate-500">{fmtDate(r.date)}</td>
              <td className="px-3 py-2.5"><Badge size="sm" color="default">{r.paymentMethod?.replace('_', ' ')}</Badge></td>
              <td className="px-3 py-2.5 text-xs text-slate-400 font-mono">{r.reference || '--'}</td>
            </>
          )}
        />
      )}

      {/* Expenses Tab */}
      {tab === 'expenses' && (
        <TransactionTab
          title="Expenses"
          records={expenses}
          loading={loading}
          showForm={showForm}
          setShowForm={setShowForm}
          form={form}
          setForm={setForm}
          saving={saving}
          onSave={handleSave}
          onReset={resetForm}
          onDelete={(id) => handleDelete('expenses', id)}
          formFields={
            <>
              <Select value={form.category || ''} onChange={(e) => setForm({ ...form, category: e.target.value })} options={EXPENSE_CATEGORIES} placeholder="Category *" />
              <Input type="number" value={form.amount || ''} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="Amount *" />
              <Input type="date" value={form.date || ''} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              <Input value={form.paidTo || ''} onChange={(e) => setForm({ ...form, paidTo: e.target.value })} placeholder="Paid To" />
              <Input value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description" />
            </>
          }
          columns={['Category', 'Amount', 'Date', 'Paid To', 'Description']}
          renderRow={(r) => (
            <>
              <td className="px-3 py-2.5"><Badge size="sm" color="warning">{EXPENSE_CATEGORIES.find((c) => c.value === r.category)?.label || r.category}</Badge></td>
              <td className="px-3 py-2.5 text-sm font-semibold text-red-500">{fmt(r.amount)}</td>
              <td className="px-3 py-2.5 text-sm text-slate-500">{fmtDate(r.date)}</td>
              <td className="px-3 py-2.5 text-sm text-slate-600 dark:text-slate-400">{r.paidTo || '--'}</td>
              <td className="px-3 py-2.5 text-sm text-slate-500 truncate max-w-[200px]">{r.description || '--'}</td>
            </>
          )}
        />
      )}

      {/* Recurring Tab */}
      {tab === 'recurring' && (
        <RecurringTab
          plans={plans} setPlans={setPlans}
          invoices={invoices} setInvoices={setInvoices}
          selectedPlan={selectedPlan} setSelectedPlan={setSelectedPlan}
          projects={projects} projectOptions={projectOptions}
          loading={loading} toast={toast} fetchData={fetchData}
        />
      )}

      {/* Withdrawals Tab */}
      {tab === 'withdrawals' && (
        <TransactionTab
          title="Founder Withdrawals"
          records={withdrawals}
          loading={loading}
          showForm={showForm}
          setShowForm={setShowForm}
          form={form}
          setForm={setForm}
          saving={saving}
          onSave={handleSave}
          onReset={resetForm}
          onDelete={(id) => handleDelete('withdrawals', id)}
          formFields={
            <>
              <Select value={form.person || ''} onChange={(e) => setForm({ ...form, person: e.target.value })} options={FOUNDERS} placeholder="Person *" />
              <Input type="number" value={form.amount || ''} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="Amount *" />
              <Input type="date" value={form.date || ''} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              <Input value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description" />
            </>
          }
          columns={['Person', 'Amount', 'Date', 'Description']}
          renderRow={(r) => (
            <>
              <td className="px-3 py-2.5"><Badge size="sm" color={r.person === 'akshat' ? 'primary' : 'success'}>{r.person === 'akshat' ? 'Akshat' : 'Bhavya'}</Badge></td>
              <td className="px-3 py-2.5 text-sm font-semibold text-amber-600">{fmt(r.amount)}</td>
              <td className="px-3 py-2.5 text-sm text-slate-500">{fmtDate(r.date)}</td>
              <td className="px-3 py-2.5 text-sm text-slate-500 truncate max-w-[250px]">{r.description || '--'}</td>
            </>
          )}
        />
      )}
    </div>
  );
}

// ─── Recurring Tab Component ─────────────────────────
function RecurringTab({ plans, setPlans, invoices, setInvoices, selectedPlan, setSelectedPlan, projects, projectOptions, loading, toast, fetchData }) {
  const [showPlanForm, setShowPlanForm] = useState(false);
  const [planForm, setPlanForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [payingId, setPayingId] = useState(null);
  const [payForm, setPayForm] = useState({});

  const handleAddPlan = async () => {
    if (!planForm.project || !planForm.recurringAmount || !planForm.startDate) {
      toast.error('Project, recurring amount, and start date are required'); return;
    }
    setSaving(true);
    try {
      await accountsService.addRecurringPlan({
        ...planForm,
        setupFee: Number(planForm.setupFee || 0),
        recurringAmount: Number(planForm.recurringAmount),
      });
      toast.success('Recurring plan created');
      setPlanForm({});
      setShowPlanForm(false);
      fetchData();
    } catch (e) {
      toast.error(e.response?.data?.error?.message || 'Failed to create plan');
    } finally { setSaving(false); }
  };

  const handleDeletePlan = async (id) => {
    try {
      await accountsService.deleteRecurringPlan(id);
      toast.success('Plan deleted');
      if (selectedPlan?._id === id) setSelectedPlan(null);
      fetchData();
    } catch { toast.error('Failed to delete'); }
  };

  const currentPeriod = new Date().toISOString().slice(0, 7);

  const handleGenerateInvoice = async (plan, type, period) => {
    try {
      await accountsService.generateInvoice({
        project: plan.project._id,
        recurringPlan: plan._id,
        type,
        period: type === 'recurring' ? period : '',
        amount: type === 'setup' ? plan.setupFee : plan.recurringAmount,
        dueDate: new Date().toISOString(),
      });
      toast.success('Invoice generated');
      fetchData();
    } catch (e) {
      toast.error(e.response?.data?.error?.message || 'Failed to generate invoice');
    }
  };

  const handleMarkPaid = async (invoiceId) => {
    try {
      await accountsService.markInvoicePaid(invoiceId, payForm);
      toast.success('Marked as paid');
      setPayingId(null);
      setPayForm({});
      fetchData();
    } catch { toast.error('Failed'); }
  };

  const handleDeleteInvoice = async (id) => {
    try {
      await accountsService.deleteInvoice(id);
      toast.success('Invoice deleted');
      fetchData();
    } catch { toast.error('Failed to delete'); }
  };

  const planInvoices = selectedPlan ? invoices.filter((i) => i.recurringPlan?._id === selectedPlan._id || i.recurringPlan === selectedPlan._id) : [];

  // Generate month options for invoicing
  const monthOptions = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date(new Date().getFullYear(), new Date().getMonth() - i, 1);
    monthOptions.push(d.toISOString().slice(0, 7));
  }

  if (loading) return <div className="space-y-3">{[1,2,3].map((i) => <Skeleton key={i} variant="card" className="h-20" />)}</div>;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Recurring Payment Plans <span className="text-slate-400 font-normal">{plans.length}</span></h3>
        <Button size="sm" onClick={() => { setPlanForm({}); setShowPlanForm(true); }}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
          Add Plan
        </Button>
      </div>

      {/* Add plan form */}
      {showPlanForm && (
        <div className="card p-5">
          <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-3">New Recurring Plan</h4>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            <Select value={planForm.project || ''} onChange={(e) => setPlanForm({ ...planForm, project: e.target.value })} options={projectOptions} placeholder="Project *" />
            <Input type="number" value={planForm.setupFee || ''} onChange={(e) => setPlanForm({ ...planForm, setupFee: e.target.value })} placeholder="Setup / One-time Fee" />
            <Input type="number" value={planForm.recurringAmount || ''} onChange={(e) => setPlanForm({ ...planForm, recurringAmount: e.target.value })} placeholder="Monthly Amount *" />
            <Input type="date" value={planForm.startDate || ''} onChange={(e) => setPlanForm({ ...planForm, startDate: e.target.value })} />
            <Select value={planForm.frequency || 'monthly'} onChange={(e) => setPlanForm({ ...planForm, frequency: e.target.value })} options={[{ value: 'monthly', label: 'Monthly' }, { value: 'quarterly', label: 'Quarterly' }, { value: 'yearly', label: 'Yearly' }]} />
            <Input value={planForm.notes || ''} onChange={(e) => setPlanForm({ ...planForm, notes: e.target.value })} placeholder="Notes" />
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="secondary" size="sm" onClick={() => setShowPlanForm(false)}>Cancel</Button>
            <Button size="sm" onClick={handleAddPlan} loading={saving}>Create Plan</Button>
          </div>
        </div>
      )}

      {/* Plans list */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {plans.map((plan) => {
          const planInvs = invoices.filter((i) => (i.recurringPlan?._id || i.recurringPlan) === plan._id);
          const paidCount = planInvs.filter((i) => i.status === 'paid').length;
          const totalPaid = planInvs.filter((i) => i.status === 'paid').reduce((s, i) => s + (i.paidAmount || i.amount), 0);
          const isSelected = selectedPlan?._id === plan._id;

          return (
            <div
              key={plan._id}
              onClick={() => setSelectedPlan(isSelected ? null : plan)}
              className={`card p-4 cursor-pointer transition-all ${isSelected ? 'ring-2 ring-primary-500 border-primary-300' : 'hover:shadow-md'}`}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{plan.project?.code} — {plan.project?.name}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge size="sm" color={plan.status === 'active' ? 'success' : plan.status === 'paused' ? 'warning' : 'default'}>{plan.status}</Badge>
                    <span className="text-xs text-slate-400">{plan.frequency}</span>
                  </div>
                </div>
                <button onClick={(e) => { e.stopPropagation(); handleDeletePlan(plan._id); }}
                  className="p-1 rounded-lg text-slate-300 hover:text-danger-600 transition-colors">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79" />
                  </svg>
                </button>
              </div>
              <div className="grid grid-cols-3 gap-3 mt-3">
                {plan.setupFee > 0 && (
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase">Setup Fee</p>
                    <p className={`text-sm font-semibold ${plan.setupFeePaid ? 'text-emerald-600' : 'text-amber-600'}`}>{fmt(plan.setupFee)}</p>
                    <p className="text-[10px] text-slate-400">{plan.setupFeePaid ? 'Paid' : 'Pending'}</p>
                  </div>
                )}
                <div>
                  <p className="text-[10px] text-slate-400 uppercase">Recurring</p>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{fmt(plan.recurringAmount)}/mo</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase">Collected</p>
                  <p className="text-sm font-semibold text-emerald-600">{fmt(totalPaid)}</p>
                  <p className="text-[10px] text-slate-400">{paidCount} invoices paid</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {plans.length === 0 && !showPlanForm && <EmptyState title="No recurring plans" description="Add a plan to start tracking recurring payments." />}

      {/* Selected plan: invoices */}
      {selectedPlan && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Invoices — {selectedPlan.project?.code}
            </h3>
            <div className="flex gap-2">
              {selectedPlan.setupFee > 0 && !selectedPlan.setupFeePaid && (
                <Button size="sm" variant="secondary" onClick={() => handleGenerateInvoice(selectedPlan, 'setup')}>
                  Generate Setup Invoice
                </Button>
              )}
              <div className="flex items-center gap-1">
                <select
                  className="rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 py-1.5 text-xs text-slate-700 dark:text-slate-300 outline-none"
                  defaultValue={currentPeriod}
                  id="invoiceMonth"
                >
                  {monthOptions.map((m) => <option key={m} value={m}>{new Date(m + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</option>)}
                </select>
                <Button size="sm" onClick={() => handleGenerateInvoice(selectedPlan, 'recurring', document.getElementById('invoiceMonth').value)}>
                  Generate Invoice
                </Button>
              </div>
            </div>
          </div>

          {planInvoices.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">No invoices yet. Generate one above.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-700">
                    <th className="text-left text-xs font-medium text-slate-500 uppercase px-3 py-2">Invoice</th>
                    <th className="text-left text-xs font-medium text-slate-500 uppercase px-3 py-2">Type</th>
                    <th className="text-left text-xs font-medium text-slate-500 uppercase px-3 py-2">Period</th>
                    <th className="text-right text-xs font-medium text-slate-500 uppercase px-3 py-2">Amount</th>
                    <th className="text-left text-xs font-medium text-slate-500 uppercase px-3 py-2">Status</th>
                    <th className="text-right text-xs font-medium text-slate-500 uppercase px-3 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {planInvoices.sort((a, b) => (b.period || '').localeCompare(a.period || '')).map((inv) => (
                    <tr key={inv._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30">
                      <td className="px-3 py-2.5 text-xs font-mono text-slate-500">{inv.invoiceNumber}</td>
                      <td className="px-3 py-2.5"><Badge size="sm" color={inv.type === 'setup' ? 'primary' : 'default'}>{inv.type === 'setup' ? 'Setup' : 'Recurring'}</Badge></td>
                      <td className="px-3 py-2.5 text-sm text-slate-600 dark:text-slate-400">
                        {inv.period ? new Date(inv.period + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '--'}
                      </td>
                      <td className="px-3 py-2.5 text-sm font-semibold text-right">{fmt(inv.amount)}</td>
                      <td className="px-3 py-2.5">
                        <Badge size="sm" color={inv.status === 'paid' ? 'success' : inv.status === 'overdue' ? 'danger' : inv.status === 'sent' ? 'primary' : 'default'}>
                          {inv.status}
                        </Badge>
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {inv.status !== 'paid' && (
                            payingId === inv._id ? (
                              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                <select value={payForm.paymentMethod || 'bank_transfer'} onChange={(e) => setPayForm({ ...payForm, paymentMethod: e.target.value })}
                                  className="text-xs border border-slate-200 dark:border-slate-600 rounded px-1.5 py-1 bg-transparent">
                                  <option value="bank_transfer">Bank</option><option value="upi">UPI</option><option value="cash">Cash</option>
                                </select>
                                <input type="text" value={payForm.paymentReference || ''} onChange={(e) => setPayForm({ ...payForm, paymentReference: e.target.value })}
                                  placeholder="Ref" className="text-xs border border-slate-200 dark:border-slate-600 rounded px-1.5 py-1 w-20 bg-transparent" />
                                <button onClick={() => handleMarkPaid(inv._id)} className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 px-1">Confirm</button>
                                <button onClick={() => setPayingId(null)} className="text-xs text-slate-400 px-1">Cancel</button>
                              </div>
                            ) : (
                              <button onClick={() => { setPayingId(inv._id); setPayForm({}); }}
                                className="text-xs font-medium text-emerald-600 hover:text-emerald-700 px-2 py-1 rounded-lg hover:bg-emerald-50 transition-colors">
                                Mark Paid
                              </button>
                            )
                          )}
                          {inv.status === 'paid' && (
                            <span className="text-xs text-slate-400">{fmtDate(inv.paidDate)}</span>
                          )}
                          <button onClick={() => handleDeleteInvoice(inv._id)}
                            className="p-1 rounded-lg text-slate-300 hover:text-danger-600 transition-colors">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Reusable transaction tab layout
function TransactionTab({ title, records, loading, showForm, setShowForm, form, setForm, saving, onSave, onReset, onDelete, formFields, columns, renderRow }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{title} <span className="text-slate-400 font-normal">{records.length}</span></h3>
        <Button size="sm" onClick={() => { onReset(); setShowForm(true); }}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
          Add
        </Button>
      </div>

      {showForm && (
        <div className="card p-5">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">{formFields}</div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="secondary" size="sm" onClick={onReset}>Cancel</Button>
            <Button size="sm" onClick={onSave} loading={saving}>Save</Button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-2">{[1,2,3].map((i) => <Skeleton key={i} variant="text" className="h-12" />)}</div>
      ) : records.length === 0 ? (
        <EmptyState title={`No ${title.toLowerCase()}`} description="Click Add to record a transaction." />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
                {columns.map((c) => <th key={c} className="text-left text-xs font-medium text-slate-500 uppercase px-3 py-2">{c}</th>)}
                <th className="text-right text-xs font-medium text-slate-500 uppercase px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {records.map((r) => (
                <tr key={r._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30">
                  {renderRow(r)}
                  <td className="px-3 py-2.5 text-right">
                    <button onClick={() => onDelete(r._id)} className="p-1.5 rounded-lg text-slate-400 hover:text-danger-600 hover:bg-danger-50 transition-colors">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>
                    </button>
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
