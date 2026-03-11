import { useState, useCallback, useMemo } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import CommandPalette from '../components/CommandPalette';
import useKeyboardShortcuts from '../hooks/useKeyboardShortcuts';

export default function AppLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const navigate = useNavigate();

  const shortcuts = useMemo(() => [
    { key: 'k', ctrl: true, handler: () => setPaletteOpen(true) },
    { key: 'b', ctrl: true, handler: () => setSidebarCollapsed(prev => !prev) },
  ], []);

  useKeyboardShortcuts(shortcuts);

  const handleMobileToggle = useCallback(() => setMobileOpen(prev => !prev), []);

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
          <Topbar onMobileMenuToggle={handleMobileToggle} />
          <main className="flex-1 overflow-y-auto p-6 max-md:p-3 animate-fade-in">
            <Outlet />
          </main>
        </div>
      </div>

      <CommandPalette isOpen={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  );
}
