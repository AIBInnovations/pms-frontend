export default function WaterReminderModal({ onDismiss }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-sm w-full mx-4 overflow-hidden animate-scale-in">
        {/* Gradient header with water animation */}
        <div className="relative h-48 bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-500 flex items-center justify-center overflow-hidden">
          {/* Animated water ripples */}
          <div className="absolute inset-0">
            <div className="absolute bottom-0 left-0 right-0 h-24 opacity-30">
              <div className="absolute inset-0 rounded-[50%] bg-white/20 animate-pulse" style={{ animationDuration: '2s' }} />
            </div>
            <div className="absolute top-6 left-6 w-3 h-3 bg-white/30 rounded-full animate-bounce" style={{ animationDelay: '0.2s', animationDuration: '1.5s' }} />
            <div className="absolute top-12 right-10 w-2 h-2 bg-white/20 rounded-full animate-bounce" style={{ animationDelay: '0.8s', animationDuration: '2s' }} />
            <div className="absolute top-20 left-1/3 w-2.5 h-2.5 bg-white/25 rounded-full animate-bounce" style={{ animationDelay: '0.5s', animationDuration: '1.8s' }} />
          </div>

          {/* Large water drop icon */}
          <div className="relative">
            <svg className="w-24 h-24 text-white drop-shadow-lg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center pt-2">
              <svg className="w-8 h-8 text-blue-200/80" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-8 py-6 text-center">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            Time to Hydrate!
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
            You've been working for an hour. Take a moment to drink some water — your body and mind will thank you.
          </p>

          <button
            onClick={onDismiss}
            className="w-full py-3 px-6 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 active:scale-[0.98]"
          >
            I'll Drink Water Now
          </button>
        </div>
      </div>
    </div>
  );
}
