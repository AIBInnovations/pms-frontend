import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const actions = [
  { name: 'Go to Dashboard', section: 'Navigation', path: '/dashboard', shortcut: 'G D' },
  { name: 'Go to Projects', section: 'Navigation', path: '/projects', shortcut: 'G P' },
  { name: 'Go to Tasks', section: 'Navigation', path: '/tasks', shortcut: 'G T' },
  { name: 'Go to My Tasks', section: 'Navigation', path: '/my-tasks', shortcut: 'G M' },
  { name: 'Go to Bugs', section: 'Navigation', path: '/bugs', shortcut: 'G B' },
  { name: 'Go to Documents', section: 'Navigation', path: '/documents', shortcut: 'G O' },
  { name: 'Go to Notifications', section: 'Navigation', path: '/notifications', shortcut: 'G N' },
  { name: 'Go to Reports', section: 'Navigation', path: '/reports' },
  { name: 'Go to Settings', section: 'Navigation', path: '/settings' },
  { name: 'Go to Profile', section: 'Navigation', path: '/profile' },
];

export default function CommandPalette({ isOpen, onClose }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  // Filter actions by query (fuzzy includes match on name)
  const filtered = useMemo(() => {
    if (!query.trim()) return actions;
    const lower = query.toLowerCase();
    return actions.filter((action) =>
      action.name.toLowerCase().includes(lower)
    );
  }, [query]);

  // Group filtered results by section
  const grouped = useMemo(() => {
    const groups = {};
    filtered.forEach((action) => {
      const section = action.section || 'Other';
      if (!groups[section]) {
        groups[section] = [];
      }
      groups[section].push(action);
    });
    return groups;
  }, [filtered]);

  // Flat list for keyboard navigation indexing
  const flatItems = useMemo(() => {
    const items = [];
    Object.keys(grouped).forEach((section) => {
      grouped[section].forEach((action) => {
        items.push(action);
      });
    });
    return items;
  }, [grouped]);

  // Execute the selected action
  const executeAction = useCallback(
    (action) => {
      if (action?.path) {
        navigate(action.path);
        onClose();
      }
    },
    [navigate, onClose]
  );

  // Reset state when palette opens or closes
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setActiveIndex(0);
      // Focus the input on next tick so the DOM is ready
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    }
  }, [isOpen]);

  // Clamp activeIndex when filtered results change
  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  // Scroll active item into view
  useEffect(() => {
    if (!listRef.current) return;
    const activeEl = listRef.current.querySelector('[data-active="true"]');
    if (activeEl) {
      activeEl.scrollIntoView({ block: 'nearest' });
    }
  }, [activeIndex]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setActiveIndex((prev) =>
            prev < flatItems.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setActiveIndex((prev) =>
            prev > 0 ? prev - 1 : flatItems.length - 1
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (flatItems[activeIndex]) {
            executeAction(flatItems[activeIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
        default:
          break;
      }
    },
    [flatItems, activeIndex, executeAction, onClose]
  );

  if (!isOpen) return null;

  let itemCounter = 0;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[20vh]"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative w-full max-w-lg bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200/60 dark:border-slate-700/60 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200/60 dark:border-slate-700/60">
          <svg
            className="w-5 h-5 text-slate-400 shrink-0"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
            />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or search..."
            className="flex-1 bg-transparent text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 outline-none"
          />
          <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded">
            ESC
          </kbd>
        </div>

        {/* Results list */}
        <div
          ref={listRef}
          className="max-h-72 overflow-y-auto overscroll-contain py-2"
        >
          {flatItems.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-slate-400">
              No results found for &ldquo;{query}&rdquo;
            </div>
          ) : (
            Object.keys(grouped).map((section) => (
              <div key={section}>
                {/* Section header */}
                <div className="px-4 pt-2 pb-1">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    {section}
                  </span>
                </div>

                {/* Section items */}
                {grouped[section].map((action) => {
                  const index = itemCounter++;
                  const isActive = index === activeIndex;

                  return (
                    <button
                      key={action.path}
                      data-active={isActive}
                      onClick={() => executeAction(action)}
                      onMouseEnter={() => setActiveIndex(index)}
                      className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors ${
                        isActive
                          ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                      }`}
                    >
                      {/* Icon */}
                      {action.icon ? (
                        <span className="shrink-0">{action.icon}</span>
                      ) : (
                        <svg
                          className={`w-4 h-4 shrink-0 ${
                            isActive ? 'text-primary-500' : 'text-slate-400'
                          }`}
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
                          />
                        </svg>
                      )}

                      {/* Name */}
                      <span className="flex-1 truncate">{action.name}</span>

                      {/* Shortcut badge */}
                      {action.shortcut && (
                        <span className="flex items-center gap-1">
                          {action.shortcut.split(' ').map((key, i) => (
                            <kbd
                              key={i}
                              className={`inline-flex items-center justify-center min-w-[20px] px-1.5 py-0.5 text-[11px] font-medium rounded border ${
                                isActive
                                  ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400 border-primary-200 dark:border-primary-700'
                                  : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-500 border-slate-200 dark:border-slate-600'
                              }`}
                            >
                              {key}
                            </kbd>
                          ))}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer with shortcut hints */}
        <div className="flex items-center gap-4 px-4 py-2.5 border-t border-slate-200/60 dark:border-slate-700/60 bg-slate-50/80 dark:bg-slate-800/80 text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <kbd className="inline-flex items-center justify-center px-1 py-0.5 font-medium bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-[10px]">
              &uarr;
            </kbd>
            <kbd className="inline-flex items-center justify-center px-1 py-0.5 font-medium bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-[10px]">
              &darr;
            </kbd>
            <span className="ml-0.5">to navigate</span>
          </span>
          <span className="flex items-center gap-1">
            <kbd className="inline-flex items-center justify-center px-1 py-0.5 font-medium bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-[10px]">
              &crarr;
            </kbd>
            <span className="ml-0.5">to select</span>
          </span>
          <span className="flex items-center gap-1">
            <kbd className="inline-flex items-center justify-center px-1.5 py-0.5 font-medium bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-[10px]">
              esc
            </kbd>
            <span className="ml-0.5">to close</span>
          </span>
        </div>
      </div>
    </div>
  );
}
