export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-[420px] animate-slide-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 text-white font-bold text-lg mb-4 shadow-lg shadow-primary-600/20">
            P
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Project Management</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Built for teams that ship</p>
        </div>
        {/* Card */}
        <div className="card p-8">
          {children}
        </div>
        {/* Footer */}
        <p className="text-center text-xs text-slate-400 dark:text-slate-500 mt-6">Powered by PMS</p>
      </div>
    </div>
  );
}
