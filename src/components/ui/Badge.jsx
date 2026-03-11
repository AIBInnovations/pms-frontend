const colorMap = {
  default: 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 ring-slate-200/60 dark:ring-slate-600/60',
  primary: 'bg-primary-50 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 ring-primary-200/60 dark:ring-primary-700/60',
  success: 'bg-success-50 dark:bg-emerald-900/40 text-success-700 dark:text-emerald-300 ring-success-200/60 dark:ring-emerald-700/60',
  warning: 'bg-warning-50 dark:bg-amber-900/40 text-warning-700 dark:text-amber-300 ring-warning-200/60 dark:ring-amber-700/60',
  danger: 'bg-danger-50 dark:bg-red-900/40 text-danger-700 dark:text-red-300 ring-danger-200/60 dark:ring-red-700/60',
};

const sizeMap = {
  sm: 'px-2 py-0.5 text-[11px]',
  md: 'px-2.5 py-0.5 text-xs',
};

export default function Badge({ children, color = 'default', dot = false, size = 'md', className = '' }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-medium ring-1 ring-inset ${sizeMap[size]} ${colorMap[color]} ${className}`}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full bg-current`} />}
      {children}
    </span>
  );
}
