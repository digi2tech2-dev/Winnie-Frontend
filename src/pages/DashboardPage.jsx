export default function DashboardPage({ onNavigate }) {
  return (
    <div className="space-y-6">
      <section className="glass-panel rounded-lg p-6 text-center">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-royal dark:text-pulse">
          Customer dashboard
        </p>
        <h1 className="mt-2 text-3xl font-black sm:text-4xl">Dashboard unavailable here</h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
          Open wallet or orders to view your current account activity.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={() => onNavigate?.("wallet")}
            className="interactive-ring h-11 rounded-lg bg-gradient-to-r from-royal to-pulse px-5 text-sm font-black text-white shadow-glow"
          >
            Open wallet
          </button>
          <button
            type="button"
            onClick={() => onNavigate?.("orders")}
            className="interactive-ring h-11 rounded-lg border border-slate-200 bg-white px-5 text-sm font-black text-slate-600 dark:border-white/10 dark:bg-white/[0.055] dark:text-slate-200"
          >
            Open orders
          </button>
        </div>
      </section>
    </div>
  );
}
