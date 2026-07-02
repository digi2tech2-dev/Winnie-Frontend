import EmptyState from "../components/EmptyState";

const pageCopy = {
  all: ["Orders", "Open the customer orders page to view backend orders."],
  history: ["Order History", "Open the customer orders page to view backend order history."],
  completed: ["Completed Orders", "Completed orders are loaded from the backend customer orders page."],
  pending: ["Pending Orders", "Pending orders are loaded from the backend customer orders page."],
  cancelled: ["Cancelled Orders", "Cancelled orders are loaded from the backend customer orders page."],
};

export default function OrdersPage({ filter = "all", onNavigate }) {
  const [title, description] = pageCopy[filter] || pageCopy.all;

  return (
    <div className="space-y-6">
      <section className="glass-panel rounded-lg p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-black">{title}</h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{description}</p>
          </div>
        </div>
      </section>

      <EmptyState
        title="No orders loaded"
        description="Use the backend-connected customer orders page for current order data."
        actionLabel="Open orders"
        onAction={() => onNavigate?.("orders")}
      />
    </div>
  );
}
