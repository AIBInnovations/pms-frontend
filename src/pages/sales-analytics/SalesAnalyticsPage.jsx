import { useState, useEffect, useCallback } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts';
import { salesAnalyticsService } from '../../services';
import { useToast } from '../../components/ui/Toast';
import { Skeleton, EmptyState } from '../../components/ui';

function fmtMoney(n) {
  return '₹' + (Number(n) || 0).toLocaleString('en-IN');
}

function KpiCard({ label, value, sub, tone = 'default' }) {
  const tones = {
    default: 'text-slate-900 dark:text-slate-100',
    success: 'text-emerald-600',
    danger: 'text-red-600',
    primary: 'text-primary-600',
  };
  return (
    <div className="card p-4">
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${tones[tone]}`}>{value}</p>
      {sub && <p className="text-[11px] text-slate-400 mt-1">{sub}</p>}
    </div>
  );
}

function ChartCard({ title, children, height = 280 }) {
  return (
    <div className="card p-5">
      <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4">{title}</h3>
      <div style={{ width: '100%', height }}>{children}</div>
    </div>
  );
}

const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

const SOURCE_LABELS = {
  website: 'Website', email: 'Email', referral: 'Referral',
  cold_outreach: 'Cold Outreach', social: 'Social', event: 'Event', other: 'Other',
};

const STAGE_LABELS = {
  new: 'New', contacted: 'Contacted', qualified: 'Qualified',
  proposal_sent: 'Proposal Sent', negotiation: 'Negotiation', won: 'Won',
};

const PIPELINE_LABELS = {
  new_business: 'New Business', upsell: 'Upsell', renewal: 'Renewal', partnership: 'Partnership',
};

const LOST_REASON_LABELS = {
  price: 'Price', timeline: 'Timeline', no_response: 'No Response',
  chose_competitor: 'Chose Competitor', other: 'Other', unspecified: 'Unspecified',
};

function todayKey() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}
function monthsAgoKey(n) {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  return d.toISOString().slice(0, 10);
}

export default function SalesAnalyticsPage() {
  const toast = useToast();
  const [startDate, setStartDate] = useState(monthsAgoKey(5));
  const [endDate, setEndDate] = useState(todayKey());
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [funnel, setFunnel] = useState([]);
  const [trend, setTrend] = useState([]);
  const [wonLost, setWonLost] = useState(null);
  const [sources, setSources] = useState([]);
  const [pipelineBreakdown, setPipelineBreakdown] = useState([]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const params = { startDate, endDate };
      const [ov, fn, tr, wl, src, pb] = await Promise.all([
        salesAnalyticsService.getOverview(params),
        salesAnalyticsService.getFunnel(params),
        salesAnalyticsService.getRevenueTrend(params),
        salesAnalyticsService.getWonLost(params),
        salesAnalyticsService.getSources(params),
        salesAnalyticsService.getPipelineBreakdown(params),
      ]);
      setOverview(ov.data);
      setFunnel((fn.data || []).map((s) => ({ ...s, label: STAGE_LABELS[s.stage] || s.stage })));
      setTrend(tr.data || []);
      setWonLost(wl.data);
      setSources((src.data || []).map((s) => ({ ...s, label: SOURCE_LABELS[s.source] || s.source })));
      setPipelineBreakdown(pb.data || []);
    } catch {
      toast.error('Failed to load sales analytics');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, toast]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Aggregate pipeline breakdown by pipeline type for chart
  const pipelineAgg = Object.values(
    pipelineBreakdown.reduce((acc, row) => {
      const key = row.pipeline;
      if (!acc[key]) acc[key] = { pipeline: key, label: PIPELINE_LABELS[key] || key, count: 0, value: 0 };
      acc[key].count += row.count;
      acc[key].value += row.value;
      return acc;
    }, {})
  );

  const lostReasonsData = (wonLost?.lostReasons || []).map((r) => ({
    reason: LOST_REASON_LABELS[r.reason] || r.reason,
    count: r.count,
  }));

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Sales Analytics</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Performance, conversion, and pipeline insights</p>
        </div>
        <div className="flex items-center gap-2">
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
            className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900" />
          <span className="text-slate-400 text-sm">to</span>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
            className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900" />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} variant="card" className="h-24" />)}
        </div>
      ) : overview ? (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <KpiCard label="Total Leads" value={overview.totalLeads} tone="primary" />
            <KpiCard label="Won Deals" value={overview.wonLeads} tone="success" sub={`${overview.conversionRate}% conversion`} />
            <KpiCard label="Revenue" value={fmtMoney(overview.revenue)} tone="success" />
            <KpiCard label="Pipeline Value" value={fmtMoney(overview.pipelineValue)} sub={`${overview.activeLeads} active`} />
            <KpiCard label="Avg Deal Size" value={fmtMoney(overview.avgDealSize)} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ChartCard title="Conversion Funnel">
              {funnel.length === 0 ? <EmptyState title="No data" /> : (
                <ResponsiveContainer>
                  <BarChart data={funnel} layout="vertical" margin={{ left: 30 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="label" tick={{ fontSize: 11 }} width={90} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ChartCard>

            <ChartCard title="Revenue Trend">
              {trend.length === 0 ? <EmptyState title="No revenue data" /> : (
                <ResponsiveContainer>
                  <LineChart data={trend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => '₹' + (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v)} />
                    <Tooltip formatter={(v) => fmtMoney(v)} />
                    <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </ChartCard>

            <ChartCard title="Lead Sources">
              {sources.length === 0 ? <EmptyState title="No source data" /> : (
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={sources} dataKey="total" nameKey="label" cx="50%" cy="50%" outerRadius={90} label={(e) => e.label}>
                      {sources.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </ChartCard>

            <ChartCard title="Pipeline Value by Type">
              {pipelineAgg.length === 0 ? <EmptyState title="No active pipeline" /> : (
                <ResponsiveContainer>
                  <BarChart data={pipelineAgg}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => '₹' + (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v)} />
                    <Tooltip formatter={(v) => fmtMoney(v)} />
                    <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ChartCard>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {wonLost && (
              <div className="card p-5">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4">Won vs Lost</h3>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
                    <p className="text-xs text-emerald-700 dark:text-emerald-300">Won</p>
                    <p className="text-2xl font-bold text-emerald-600">{wonLost.won.count}</p>
                    <p className="text-xs text-emerald-600 mt-1">{fmtMoney(wonLost.won.value)}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20">
                    <p className="text-xs text-red-700 dark:text-red-300">Lost</p>
                    <p className="text-2xl font-bold text-red-600">{wonLost.lost.count}</p>
                    <p className="text-xs text-red-600 mt-1">{fmtMoney(wonLost.lost.value)}</p>
                  </div>
                </div>
                {lostReasonsData.length > 0 && (
                  <>
                    <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Lost Reasons</p>
                    <div style={{ width: '100%', height: 160 }}>
                      <ResponsiveContainer>
                        <BarChart data={lostReasonsData} layout="vertical" margin={{ left: 20 }}>
                          <XAxis type="number" tick={{ fontSize: 11 }} />
                          <YAxis type="category" dataKey="reason" tick={{ fontSize: 11 }} width={110} />
                          <Tooltip />
                          <Bar dataKey="count" fill="#ef4444" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </>
                )}
              </div>
            )}

            <div className="card p-5">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4">Source Performance</h3>
              {sources.length === 0 ? <EmptyState title="No data" /> : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-slate-500 uppercase border-b border-slate-100 dark:border-slate-800">
                      <th className="py-2">Source</th>
                      <th className="py-2 text-right">Leads</th>
                      <th className="py-2 text-right">Won</th>
                      <th className="py-2 text-right">Conv.</th>
                      <th className="py-2 text-right">Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {sources.map((s) => (
                      <tr key={s.source}>
                        <td className="py-2 font-medium">{s.label}</td>
                        <td className="py-2 text-right">{s.total}</td>
                        <td className="py-2 text-right text-emerald-600">{s.won}</td>
                        <td className="py-2 text-right">{Math.round(s.conversionRate)}%</td>
                        <td className="py-2 text-right font-semibold">{fmtMoney(s.revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
