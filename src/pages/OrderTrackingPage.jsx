import EmptyState from "../components/EmptyState";

export default function OrderTrackingPage() {
  return (
    <div className="space-y-6">
      <section className="glass-panel rounded-lg p-6">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-royal dark:text-pulse">Order tracking</p>
        <h1 className="mt-2 text-3xl font-black">Tracking unavailable</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Current tracking information is available from backend-connected order details.
        </p>
      </section>

      <EmptyState
        title="No tracking data loaded"
        description="No tracking progress is available here."
      />
    </div>
  );
}
