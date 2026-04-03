import { useState, useEffect, useCallback, useMemo } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import CommandPalette from '../components/CommandPalette';
import useKeyboardShortcuts from '../hooks/useKeyboardShortcuts';
import { useAuth } from '../context/AuthContext';
import { attendanceService } from '../services';
import useWaterReminder from '../hooks/useWaterReminder';

export default function AppLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [showCheckInPrompt, setShowCheckInPrompt] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  // Check if user needs to check in today
  useEffect(() => {
    if (!user || user.role === 'super_admin') return;
    const dismissed = sessionStorage.getItem('attendance_dismissed');
    if (dismissed === new Date().toISOString().slice(0, 10)) return;

    attendanceService.getToday().then((res) => {
      if (!res.data) setShowCheckInPrompt(true);
    }).catch(() => {});
  }, [user]);

  const handlePromptCheckIn = async () => {
    setCheckingIn(true);
    try {
      await attendanceService.checkIn({});
      setShowCheckInPrompt(false);
    } catch {
      // If already checked in or error, just close
      setShowCheckInPrompt(false);
    } finally {
      setCheckingIn(false);
    }
  };

  const dismissPrompt = () => {
    sessionStorage.setItem('attendance_dismissed', new Date().toISOString().slice(0, 10));
    setShowCheckInPrompt(false);
  };

  const shortcuts = useMemo(() => [
    { key: 'k', ctrl: true, handler: () => setPaletteOpen(true) },
    { key: 'b', ctrl: true, handler: () => setSidebarCollapsed(prev => !prev) },
  ], []);

  useKeyboardShortcuts(shortcuts);

  const handleMobileToggle = useCallback(() => setMobileOpen(prev => !prev), []);
  const { showReminder, dismissReminder, testSound, secondsLeft } = useWaterReminder();

  return (
    <div className="h-screen p-3 max-md:p-0">
      <div className="h-full rounded-3xl max-md:rounded-none overflow-hidden flex bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-700/50 shadow-sm">
        {/* Mobile overlay */}
        {mobileOpen && (
          <div
            className="fixed inset-0 bg-slate-900/40 z-40 md:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}

        {/* Desktop sidebar */}
        <div className="hidden md:flex">
          <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
        </div>

        {/* Mobile sidebar */}
        {mobileOpen && (
          <div className="fixed inset-y-0 left-0 z-50 w-[260px] md:hidden animate-slide-in-left">
            <Sidebar collapsed={false} onToggle={() => setMobileOpen(false)} />
          </div>
        )}

        <div className="flex-1 flex flex-col min-w-0 bg-[#f8f9fb] dark:bg-slate-950">
          <Topbar onMobileMenuToggle={handleMobileToggle} onTestWaterSound={user?.role === 'super_admin' ? testSound : null} waterCountdown={secondsLeft} />
          {showCheckInPrompt && (
            <div className="mx-6 mt-4 max-md:mx-3 max-md:mt-2 flex items-center gap-3 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-xl px-4 py-3">
              <svg className="w-5 h-5 text-primary-600 dark:text-primary-400 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-primary-800 dark:text-primary-300 flex-1">You haven't marked your attendance today.</p>
              <button
                onClick={handlePromptCheckIn}
                disabled={checkingIn}
                className="hidden lg:inline-flex text-xs font-semibold text-white bg-primary-600 hover:bg-primary-700 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
              >
                {checkingIn ? 'Checking in...' : 'Check In'}
              </button>
              <button
                onClick={() => { dismissPrompt(); navigate('/attendance'); }}
                className="lg:hidden text-xs font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400 px-2 py-1"
              >
                Go to Attendance
              </button>
              <button onClick={dismissPrompt} className="text-primary-400 hover:text-primary-600 dark:hover:text-primary-300 transition-colors p-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
          {showReminder && (
            <div className="mx-6 mt-3 max-md:mx-3 flex items-center gap-3 bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-800 rounded-xl px-4 py-3 animate-fade-in">
              <span className="text-lg shrink-0">💧</span>
              <p className="text-sm text-cyan-800 dark:text-cyan-300 flex-1 font-medium">Time to drink water! Stay hydrated.</p>
              <button onClick={dismissReminder} className="text-cyan-400 hover:text-cyan-600 dark:hover:text-cyan-300 transition-colors p-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
          <main className="flex-1 overflow-y-auto p-6 max-md:p-3 animate-fade-in">
            <Outlet />
          </main>
        </div>
      </div>

      <CommandPalette isOpen={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  );
}
