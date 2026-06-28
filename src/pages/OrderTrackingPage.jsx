import { Clock, PackageCheck, ShieldCheck } from "lucide-react";
import { orderTimeline, orders } from "../data/catalog";

export default function OrderTrackingPage() {
  const order = orders[1];

  return (
    <div className="space-y-6">
      <section className="glass-panel rounded-lg p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-royal dark:text-pulse">Live tracking</p>
            <h1 className="mt-2 text-3xl font-black">{order.id}</h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{order.delivery}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white/70 p-4 dark:border-white/10 dark:bg-white/[0.045]">
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Estimated completion</p>
            <p className="mt-1 text-2xl font-black">12 min</p>
          </div>
        </div>
      </section>

      <section className="glass-panel rounded-lg p-6">
        <div className="grid gap-4 md:grid-cols-3">
          <Mini icon={ShieldCheck} title="Payment secured" text="Wallet charge is confirmed." />
          <Mini icon={Clock} title="Provider queue" text="Activation is currently processing." />
          <Mini icon={PackageCheck} title="Delivery check" text="Final confirmation will arrive soon." />
        </div>
        <div className="mt-8 space-y-5">
          {orderTimeline.map((step, index) => (
            <div key={step.title} className="relative flex gap-4">
              {index < orderTimeline.length - 1 && <span className="absolute left-[13px] top-8 h-full w-px bg-slate-200 dark:bg-white/10" />}
              <span className={`relative z-10 grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-black text-white ${step.state === "done" ? "bg-emerald-500" : step.state === "active" ? "bg-pulse" : "bg-slate-300 dark:bg-white/20"}`}>
                {index + 1}
              </span>
              <div className="rounded-lg border border-slate-200 bg-white/65 p-4 dark:border-white/10 dark:bg-white/[0.045]">
                <h3 className="font-black">{step.title}</h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{step.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Mini({ icon: Icon, title, text }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white/65 p-4 dark:border-white/10 dark:bg-white/[0.045]">
      <Icon className="h-6 w-6 text-royal dark:text-pulse" />
      <h3 className="mt-3 font-black">{title}</h3>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{text}</p>
    </div>
  );
}
