import { useState, useEffect, useCallback } from 'react';
import { attendanceService } from '../../services';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ui/Toast';
import { Button, Badge, Avatar, Skeleton } from '../../components/ui';

function formatTime(dateStr) {
  if (!dateStr) return '--';
  return new Date(dateStr).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function formatDuration(checkIn, checkOut) {
  if (!checkIn || !checkOut) return '--';
  const ms = new Date(checkOut) - new Date(checkIn);
  const hours = Math.floor(ms / 3600000);
  const mins = Math.floor((ms % 3600000) / 60000);
  return `${hours}h ${mins}m`;
}

function getMonthOptions() {
  const opts = [];
  const now = new Date();
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = d.toISOString().slice(0, 7);
    const label = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    opts.push({ value, label });
  }
  return opts;
}

export default function AttendancePage() {
  const { user } = useAuth();
  const toast = useToast();
  const isAdmin = user?.role === 'super_admin';

  const [today, setToday] = useState(null);
  const [loadingToday, setLoadingToday] = useState(true);
  const [checking, setChecking] = useState(false);
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [summary, setSummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [todayAll, setTodayAll] = useState([]);
  const [loadingAll, setLoadingAll] = useState(false);
  const [networkName, setNetworkName] = useState('');
  const [suspiciousPrompt, setSuspiciousPrompt] = useState(null);

  // Detect network name via RTCPeerConnection for local IP hint
  useEffect(() => {
    // We rely on user sending network info from their OS
    // For web, we can try navigator.connection but it's limited
    // We'll send empty and let backend decide based on IP
  }, []);

  const fetchToday = useCallback(async () => {
    setLoadingToday(true);
    try {
      const res = await attendanceService.getToday();
      setToday(res.data);
    } catch {
      // Not checked in
      setToday(null);
    } finally {
      setLoadingToday(false);
    }
  }, []);

  const fetchSummary = useCallback(async () => {
    setLoadingSummary(true);
    try {
      const res = await attendanceService.getSummary({ month });
      setSummary(res.data);
    } catch {
      toast.error('Failed to load attendance summary');
    } finally {
      setLoadingSummary(false);
    }
  }, [month, toast]);

  const fetchTodayAll = useCallback(async () => {
    if (!isAdmin) return;
    setLoadingAll(true);
    try {
      const res = await attendanceService.getTodayAll();
      setTodayAll(res.data || []);
    } catch {
      // ignore
    } finally {
      setLoadingAll(false);
    }
  }, [isAdmin]);

  useEffect(() => { fetchToday(); }, [fetchToday]);
  useEffect(() => { fetchSummary(); }, [fetchSummary]);
  useEffect(() => { fetchTodayAll(); }, [fetchTodayAll]);

  const handleCheckIn = async (confirmedNetworkName) => {
    setChecking(true);
    try {
      const res = await attendanceService.checkIn({ networkName: confirmedNetworkName || networkName });
      setToday(res.data);

      if (res.warnings?.length > 0) {
        toast.error(res.warnings.join('. '));
      } else {
        toast.success(res.message || 'Checked in!');
      }

      fetchSummary();
      if (isAdmin) fetchTodayAll();
    } catch (error) {
      const msg = error.response?.data?.error?.message || 'Failed to check in';
      toast.error(msg);
    } finally {
      setChecking(false);
      setSuspiciousPrompt(null);
    }
  };

  const handleCheckOut = async () => {
    setChecking(true);
    try {
      const res = await attendanceService.checkOut({});
      setToday(res.data);
      toast.success('Checked out!');
      fetchSummary();
      if (isAdmin) fetchTodayAll();
    } catch (error) {
      const msg = error.response?.data?.error?.message || 'Failed to check out';
      toast.error(msg);
    } finally {
      setChecking(false);
    }
  };

  const checkedIn = !!today?.checkIn;
  const checkedOut = !!today?.checkOut;
  const monthOptions = getMonthOptions();

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Attendance</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
        </p>
      </div>

      {/* Check-in / Check-out card */}
      {!isAdmin && (
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-1">Today's Attendance</h2>
              {loadingToday ? (
                <Skeleton variant="text" className="w-40" />
              ) : checkedIn ? (
                <div className="flex items-center gap-4">
                  <div>
                    <span className="text-xs text-slate-400">Check-in</span>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{formatTime(today.checkIn)}</p>
                  </div>
                  {checkedOut && (
                    <div>
                      <span className="text-xs text-slate-400">Check-out</span>
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{formatTime(today.checkOut)}</p>
                    </div>
                  )}
                  {checkedOut && (
                    <div>
                      <span className="text-xs text-slate-400">Duration</span>
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{formatDuration(today.checkIn, today.checkOut)}</p>
                    </div>
                  )}
                  {today.isSuspicious && (
                    <Badge color="warning" size="sm">Suspicious</Badge>
                  )}
                </div>
              ) : (
                <p className="text-sm text-slate-400">Not checked in yet</p>
              )}
            </div>

            <div className="flex items-center gap-3">
              {/* Network name input */}
              {!checkedIn && (
                <input
                  type="text"
                  placeholder="WiFi name (optional)"
                  value={networkName}
                  onChange={(e) => setNetworkName(e.target.value)}
                  className="input-base text-sm w-44"
                />
              )}
              {!checkedIn ? (
                <Button onClick={() => handleCheckIn()} loading={checking}>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Check In
                </Button>
              ) : !checkedOut ? (
                <Button variant="secondary" onClick={handleCheckOut} loading={checking}>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                  </svg>
                  Check Out
                </Button>
              ) : (
                <Badge color="success" size="sm">
                  Done for today
                </Badge>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Suspicious prompt modal */}
      {suspiciousPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 max-w-sm w-full mx-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Different Network Detected</h3>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">{suspiciousPrompt}</p>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={() => setSuspiciousPrompt(null)}>Cancel</Button>
              <Button size="sm" onClick={() => handleCheckIn(networkName)}>Check In Anyway</Button>
            </div>
          </div>
        </div>
      )}

      {/* Monthly summary */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Monthly Summary</h2>
          <select
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-1.5 text-sm text-slate-700 dark:text-slate-300 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
          >
            {monthOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {loadingSummary ? (
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => <Skeleton key={i} variant="card" className="h-20" />)}
          </div>
        ) : summary ? (
          <>
            <div className="grid grid-cols-3 gap-4 mb-5">
              <div className="text-center p-4 rounded-xl bg-primary-50 dark:bg-primary-900/20">
                <p className="text-2xl font-bold text-primary-700 dark:text-primary-400">{summary.presentDays}</p>
                <p className="text-xs text-slate-500 mt-1">Days Present</p>
              </div>
              <div className="text-center p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20">
                <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">{summary.totalHours}h</p>
                <p className="text-xs text-slate-500 mt-1">Total Hours</p>
              </div>
              <div className="text-center p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20">
                <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">{summary.suspiciousDays}</p>
                <p className="text-xs text-slate-500 mt-1">Suspicious</p>
              </div>
            </div>

            {/* Daily records table */}
            {summary.records?.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-700">
                      <th className="text-left text-xs font-medium text-slate-500 uppercase px-3 py-2">Date</th>
                      <th className="text-left text-xs font-medium text-slate-500 uppercase px-3 py-2">Check In</th>
                      <th className="text-left text-xs font-medium text-slate-500 uppercase px-3 py-2">Check Out</th>
                      <th className="text-left text-xs font-medium text-slate-500 uppercase px-3 py-2">Duration</th>
                      <th className="text-left text-xs font-medium text-slate-500 uppercase px-3 py-2">IP</th>
                      <th className="text-left text-xs font-medium text-slate-500 uppercase px-3 py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {summary.records.map((r) => (
                      <tr key={r._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30">
                        <td className="px-3 py-2.5 text-sm text-slate-700 dark:text-slate-300">
                          {new Date(r.date + 'T00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </td>
                        <td className="px-3 py-2.5 text-sm text-slate-600 dark:text-slate-400">{formatTime(r.checkIn)}</td>
                        <td className="px-3 py-2.5 text-sm text-slate-600 dark:text-slate-400">{formatTime(r.checkOut)}</td>
                        <td className="px-3 py-2.5 text-sm text-slate-600 dark:text-slate-400">{formatDuration(r.checkIn, r.checkOut)}</td>
                        <td className="px-3 py-2.5 text-xs font-mono text-slate-400">{r.ip}</td>
                        <td className="px-3 py-2.5">
                          {r.isSuspicious ? (
                            <Badge color="warning" size="sm" title={r.suspiciousReason}>Suspicious</Badge>
                          ) : (
                            <Badge color="success" size="sm">Normal</Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        ) : (
          <p className="text-sm text-slate-400 text-center py-6">No attendance records for this month</p>
        )}
      </div>

      {/* Admin: Today's attendance overview */}
      {isAdmin && (
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4">
            Today's Team Attendance
            {todayAll.length > 0 && <span className="text-slate-400 font-normal ml-2">{todayAll.length} checked in</span>}
          </h2>
          {loadingAll ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => <Skeleton key={i} variant="text" className="h-12" />)}
            </div>
          ) : todayAll.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">No one has checked in yet today</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-700">
                    <th className="text-left text-xs font-medium text-slate-500 uppercase px-3 py-2">Member</th>
                    <th className="text-left text-xs font-medium text-slate-500 uppercase px-3 py-2">Check In</th>
                    <th className="text-left text-xs font-medium text-slate-500 uppercase px-3 py-2">Check Out</th>
                    <th className="text-left text-xs font-medium text-slate-500 uppercase px-3 py-2">IP</th>
                    <th className="text-left text-xs font-medium text-slate-500 uppercase px-3 py-2">Network</th>
                    <th className="text-left text-xs font-medium text-slate-500 uppercase px-3 py-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {todayAll.map((r) => (
                    <tr key={r._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30">
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={r.user?.name} src={r.user?.avatar} size="sm" />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">{r.user?.name}</p>
                            <p className="text-xs text-slate-400 truncate">{r.user?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-sm text-slate-600 dark:text-slate-400">{formatTime(r.checkIn)}</td>
                      <td className="px-3 py-2.5 text-sm text-slate-600 dark:text-slate-400">{formatTime(r.checkOut)}</td>
                      <td className="px-3 py-2.5 text-xs font-mono text-slate-400">{r.ip}</td>
                      <td className="px-3 py-2.5 text-xs text-slate-500">{r.networkName || '--'}</td>
                      <td className="px-3 py-2.5">
                        {r.isSuspicious ? (
                          <Badge color="warning" size="sm" title={r.suspiciousReason}>Suspicious</Badge>
                        ) : (
                          <Badge color="success" size="sm">Normal</Badge>
                        )}
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
