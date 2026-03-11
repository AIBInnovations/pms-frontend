import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import useDebounce from '../hooks/useDebounce';

export default function GlobalSearch() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);
  const debouncedQuery = useDebounce(query, 300);

  const search = useCallback(async (q) => {
    if (!q || q.length < 2) {
      setResults(null);
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.get('/search', { params: { q } });
      setResults(data.data);
    } catch {
      setResults(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    search(debouncedQuery);
  }, [debouncedQuery, search]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNavigate = (path) => {
    navigate(path);
    setOpen(false);
    setQuery('');
    setResults(null);
  };

  const hasResults = results && (
    results.tasks?.length || results.projects?.length ||
    results.documents?.length
  );

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Search tasks, projects, docs..."
          className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50/50 dark:bg-slate-800/50 text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-800 focus:border-primary-300 dark:focus:border-primary-500 focus:ring-1 focus:ring-primary-300 outline-none transition-colors"
        />
      </div>

      {open && query.length >= 2 && (
        <div className="absolute top-full mt-2 w-full min-w-[360px] bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200/60 dark:border-slate-700/60 z-50 overflow-hidden max-h-[400px] overflow-y-auto">
          {loading && (
            <div className="px-4 py-3 text-sm text-slate-400">Searching...</div>
          )}

          {!loading && !hasResults && (
            <div className="px-4 py-6 text-center text-sm text-slate-400">No results found</div>
          )}

          {!loading && hasResults && (
            <>
              {results.projects?.length > 0 && (
                <div>
                  <div className="px-4 py-2 bg-slate-50 dark:bg-slate-900 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Projects</div>
                  {results.projects.map((p) => (
                    <button
                      key={p._id}
                      onClick={() => handleNavigate(`/projects/${p._id}`)}
                      className="w-full text-left px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2 transition-colors"
                    >
                      <span className="font-mono text-xs text-slate-400">{p.code}</span>
                      <span className="text-sm text-slate-700 dark:text-slate-300 truncate">{p.name}</span>
                    </button>
                  ))}
                </div>
              )}

              {results.tasks?.length > 0 && (
                <div>
                  <div className="px-4 py-2 bg-slate-50 dark:bg-slate-900 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Tasks</div>
                  {results.tasks.map((t) => (
                    <button
                      key={t._id}
                      onClick={() => handleNavigate('/tasks')}
                      className="w-full text-left px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2 transition-colors"
                    >
                      <span className="font-mono text-xs text-slate-400">{t.taskId}</span>
                      <span className="text-sm text-slate-700 dark:text-slate-300 truncate">{t.title}</span>
                    </button>
                  ))}
                </div>
              )}

              {results.documents?.length > 0 && (
                <div>
                  <div className="px-4 py-2 bg-slate-50 dark:bg-slate-900 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Documents</div>
                  {results.documents.map((d) => (
                    <button
                      key={d._id}
                      onClick={() => handleNavigate(`/documents/${d._id}`)}
                      className="w-full text-left px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2 transition-colors"
                    >
                      <span className="text-sm text-slate-700 dark:text-slate-300 truncate">{d.title}</span>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
