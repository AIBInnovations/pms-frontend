import { useState, useEffect, useCallback, useMemo, createContext, useContext, useRef } from 'react';

const ToastContext = createContext(null);

const typeStyles = {
  success: { bg: 'bg-success-50', border: 'border-success-200', icon: 'text-success-600' },
  error: { bg: 'bg-danger-50', border: 'border-danger-200', icon: 'text-danger-600' },
  warning: { bg: 'bg-warning-50', border: 'border-warning-200', icon: 'text-warning-600' },
  info: { bg: 'bg-primary-50', border: 'border-primary-200', icon: 'text-primary-600' },
};

const icons = {
  success: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  error: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  warning: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
  info: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
};

function ToastItem({ toast, onRemove }) {
  const [progress, setProgress] = useState(100);
  const duration = toast.duration || 4000;
  const intervalRef = useRef(null);

  useEffect(() => {
    const step = 100 / (duration / 16);
    intervalRef.current = setInterval(() => {
      setProgress((prev) => {
        const next = prev - step;
        if (next <= 0) {
          clearInterval(intervalRef.current);
          return 0;
        }
        return next;
      });
    }, 16);
    return () => clearInterval(intervalRef.current);
  }, [duration]);

  useEffect(() => {
    if (progress <= 0) {
      onRemove(toast.id);
    }
  }, [progress, toast.id, onRemove]);

  const style = typeStyles[toast.type] || typeStyles.info;

  return (
    <div className={`animate-slide-in-right flex items-start gap-3 w-[360px] p-4 rounded-2xl border dark:border-slate-700 shadow-lg shadow-slate-900/5 dark:shadow-slate-950/30 bg-white dark:bg-slate-800 ${style.border}`}>
      <span className={`shrink-0 mt-0.5 ${style.icon}`}>
        {icons[toast.type] || icons.info}
      </span>
      <div className="flex-1 min-w-0">
        {toast.title && <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{toast.title}</p>}
        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{toast.message}</p>
      </div>
      <button
        onClick={() => onRemove(toast.id)}
        className="shrink-0 p-0.5 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((toast) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { ...toast, id }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={addToast}>
      {children}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-3">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const addToast = useContext(ToastContext);
  if (!addToast) throw new Error('useToast must be used within ToastProvider');

  return useMemo(() => ({
    success: (message, title) => addToast({ type: 'success', message, title }),
    error: (message, title) => addToast({ type: 'error', message, title }),
    warning: (message, title) => addToast({ type: 'warning', message, title }),
    info: (message, title) => addToast({ type: 'info', message, title }),
  }), [addToast]);
}
