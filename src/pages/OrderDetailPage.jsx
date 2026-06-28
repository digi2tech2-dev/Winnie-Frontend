import { ArrowUpRight, Download, PackageCheck, ReceiptText } from "lucide-react";
import { orderTimeline, orders } from "../data/catalog";
import { useToast } from "../components/ToastProvider";

export default function OrderDetailPage({ onNavigate }) {
  const order = orders[1];
  const { showToast } = useToast();

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
      <section className="glass-panel rounded-lg p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-royal dark:text-pulse">Order details</p>
            <h1 className="mt-2 text-3xl font-black">{order.id}</h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{order.product} - {order.date}</p>
          </div>
          <span className="rounded-md bg-blue-500/12 px-3 py-1 text-sm font-black text-blue-600 dark:text-blue-300">
            {order.status}
          </span>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <Info label="Product" value={order.product} />
          <Info label="Price" value={order.price} />
          <Info label="Delivery" value={order.delivery} />
        </div>

        <div className="mt-8">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xl font-black">Progress</h2>
            <span className="text-sm font-black text-royal dark:text-pulse">{order.progress}%</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
            <div className="h-full rounded-full bg-gradient-to-r from-royal to-aqua" style={{ width: `${order.progress}%` }} />
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => onNavigate("order-tracking")}
            className="interactive-ring inline-flex h-11 items-center gap-2 rounded-lg bg-gradient-to-r from-royal to-pulse px-5 text-sm font-black text-white shadow-glow"
          >
            <PackageCheck className="h-5 w-5" />
            Track Order
          </button>
          <button
            type="button"
            onClick={() => showToast({ type: "info", title: "Invoice prepared", message: "Mock invoice download is ready." })}
            className="interactive-ring inline-flex h-11 items-center gap-2 rounded-lg border border-slate-200 px-5 text-sm font-black dark:border-white/10"
          >
            <Download className="h-5 w-5" />
            Invoice
          </button>
        </div>
      </section>

      <aside className="glass-panel rounded-lg p-6">
        <ReceiptText className="h-8 w-8 text-royal dark:text-pulse" />
        <h2 className="mt-4 text-xl font-black">Order Timeline</h2>
        <div className="mt-5 space-y-4">
          {orderTimeline.map((step) => (
            <div key={step.title} className="flex gap-3">
              <span className={`mt-1 h-3 w-3 shrink-0 rounded-full ${step.state === "done" ? "bg-emerald-400" : step.state === "active" ? "bg-pulse" : "bg-slate-300 dark:bg-white/20"}`} />
              <span>
                <span className="block font-black">{step.title}</span>
                <span className="text-sm text-slate-500 dark:text-slate-400">{step.text}</span>
              </span>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => onNavigate("support")}
          className="mt-6 inline-flex items-center gap-2 text-sm font-black text-royal dark:text-pulse"
        >
          Need help?
          <ArrowUpRight className="h-4 w-4" />
        </button>
      </aside>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white/65 p-4 dark:border-white/10 dark:bg-white/[0.045]">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="mt-2 font-black">{value}</p>
    </div>
  );
}
