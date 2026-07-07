import EmptyState from "../components/EmptyState";

export default function OrderDetailPage({ onNavigate }) {
  return (
    <div className="space-y-6">
      <section className="glass-panel rounded-lg p-6">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-royal dark:text-pulse">Order details</p>
        <h1 className="mt-2 text-3xl font-black">Order unavailable</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Use the backend-connected customer order details page for current order data.
        </p>
      </section>

      <EmptyState
        title="No order loaded"
        description="No order details are available here."
        actionLabel="Open orders"
        onAction={() => onNavigate?.("orders")}
      />
    </div>
  );
}
