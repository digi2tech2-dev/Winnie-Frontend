import EmptyState from "../components/EmptyState";
import { orders } from "../data/catalog";

const statusClasses = {
  Completed: "bg-emerald-500/12 text-emerald-600 dark:text-emerald-300",
  Processing: "bg-blue-500/12 text-blue-600 dark:text-blue-300",
  Pending: "bg-amber-500/14 text-amber-700 dark:text-amber-300",
  Cancelled: "bg-rose-500/12 text-rose-600 dark:text-rose-300",
};

const pageCopy = {
  all: ["Orders", "Track recent purchases, delivery status and prices."],
  history: ["Order History", "A complete view of your past and active Winnie Fun orders."],
  completed: ["Completed Orders", "All delivered orders and fulfilled digital services."],
  pending: ["Pending Orders", "Orders that are waiting for provider processing or payment review."],
  cancelled: ["Cancelled Orders", "Orders cancelled by the user, provider, or payment checks."],
};

export default function OrdersPage({ filter = "all", onNavigate }) {
  const visibleOrders = orders.filter((order) => {
    if (filter === "all" || filter === "history") return true;
    if (filter === "completed") return order.status === "Completed";
    if (filter === "pending") return ["Pending", "Processing"].includes(order.status);
    if (filter === "cancelled") return order.status === "Cancelled";
    return true;
  });
  const [title, description] = pageCopy[filter] || pageCopy.all;

  return (
    <div className="space-y-6">
      <section className="glass-panel rounded-lg p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-black">{title}</h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{description}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              ["orders", "All"],
              ["orders-completed", "Completed"],
              ["orders-pending", "Pending"],
              ["orders-cancelled", "Cancelled"],
            ].map(([target, label]) => (
              <button
                key={target}
                type="button"
                onClick={() => onNavigate(target)}
                className="h-10 rounded-lg border border-slate-200 bg-white/70 px-3 text-sm font-black transition hover:border-pulse/45 dark:border-white/10 dark:bg-white/[0.045]"
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {visibleOrders.length ? (
        <section className="glass-panel overflow-hidden rounded-lg">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[780px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50/80 text-xs uppercase tracking-[0.18em] text-slate-500 dark:border-white/10 dark:bg-white/[0.045] dark:text-slate-400">
                <tr>
                  <th className="px-5 py-4">Order ID</th>
                  <th className="px-5 py-4">Product</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Price</th>
                  <th className="px-5 py-4">Date</th>
                  <th className="px-5 py-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-white/10">
                {visibleOrders.map((order) => (
                  <tr key={order.id} className="transition hover:bg-slate-50 dark:hover:bg-white/[0.045]">
                    <td className="px-5 py-4 font-black">{order.id}</td>
                    <td className="px-5 py-4">{order.product}</td>
                    <td className="px-5 py-4">
                      <span className={`rounded-md px-2.5 py-1 text-xs font-black ${statusClasses[order.status]}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-black">{order.price}</td>
                    <td className="px-5 py-4 text-slate-500 dark:text-slate-400">{order.date}</td>
                    <td className="px-5 py-4">
                      <button
                        type="button"
                        onClick={() => onNavigate("order-detail")}
                        className="font-black text-royal dark:text-pulse"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : (
        <EmptyState
          title="No orders found"
          description="This order category is currently empty."
          actionLabel="Explore products"
          onAction={() => onNavigate("games")}
        />
      )}
    </div>
  );
}
