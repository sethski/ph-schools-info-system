// =============================================================================
// MINDI — Offline Fallback Page (/offline)
// Shown when user navigates to a page not in cache while offline.
// =============================================================================

export default function OfflinePage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center space-y-4 max-w-sm">
        <div className="text-6xl" aria-hidden="true">🧠</div>
        <h1 className="font-display text-2xl font-bold text-white tracking-tight">
          You're offline
        </h1>
        <p className="text-white/40 text-sm leading-relaxed">
          Mindi is still here. Your cached brain is available — switch to the graph
          or chat to use what's already loaded.
        </p>
        <p className="text-white/25 text-xs">
          Changes you make will sync automatically when you reconnect.
        </p>
        <button
          onClick={() => window.history.back()}
          className="mt-2 px-4 py-2.5 bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 rounded-xl text-sm hover:bg-indigo-500/30 transition-all min-h-[44px]"
        >
          ← Go back
        </button>
      </div>
    </main>
  );
}
