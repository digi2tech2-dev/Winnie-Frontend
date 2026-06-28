import { Link, useParams } from "react-router-dom";
import { PackageCheck } from "lucide-react";
import { orderTimeline, orders } from "../../data/catalog";

export default function CustomerOrderDetails({ basePath = "/customer" }) {
  const { id } = useParams();
  const order = orders.find((item) => item.id.replace("#", "") === id) || orders[0];

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
      <section className="glass-panel rounded-lg p-6">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-royal dark:text-pulse">تفاصيل الطلب</p>
        <h1 className="mt-2 text-3xl font-black">{order.id}</h1>
        <p className="mt-2 text-sm text-slate-400 dark:text-[#8A94A7]">{order.product} - {order.date}</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <Info label="الحالة" value={order.status} />
          <Info label="السعر" value={order.price} />
          <Info label="التسليم" value={order.delivery} />
        </div>
        <div className="mt-8 h-3 overflow-hidden rounded-full bg-slate-200 dark:bg-[#0D1324]">
          <div className="h-full rounded-full bg-gradient-to-r from-royal to-aqua" style={{ width: `${order.progress}%` }} />
        </div>
        <Link to={`${basePath}/order/${order.id.replace("#", "")}`} className="interactive-ring mt-6 inline-flex h-11 items-center gap-2 rounded-lg bg-gradient-to-r from-royal to-pulse px-5 text-sm font-black text-white shadow-glow">
          <PackageCheck className="h-5 w-5" />
          التتبع نشط
        </Link>
      </section>
      <aside className="glass-panel rounded-lg p-6">
        <h2 className="text-xl font-black">مسار الطلب</h2>
        <div className="mt-5 space-y-4">
          {orderTimeline.map((step) => (
            <div key={step.title} className="flex gap-3">
              <span className={`mt-1 h-3 w-3 shrink-0 rounded-full ${step.state === "done" ? "bg-emerald-400" : step.state === "active" ? "bg-pulse" : "bg-slate-300 dark:bg-[#7C8598]"}`} />
              <span>
                <span className="block font-black">{step.title}</span>
                <span className="text-sm text-slate-400 dark:text-[#8A94A7]">{step.text}</span>
              </span>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white/65 p-4 dark:border-[rgba(255,255,255,0.08)] dark:bg-[#111827] dark:shadow-[0_0_20px_rgba(139,92,246,0.20)]">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400 dark:text-[#8A94A7]">{label}</p>
      <p className="mt-2 font-black">{value}</p>
    </div>
  );
}
