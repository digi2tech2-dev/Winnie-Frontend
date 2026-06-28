import MetricCard from "../components/MetricCard";
import ProductCard from "../components/ProductCard";
import {
  dashboardMetrics,
  favoriteProducts,
  notifications,
  orders,
  specialOffers,
  walletBalance,
} from "../data/catalog";
import { iconMap } from "../components/icons";

export default function DashboardPage({ onNavigate }) {
  return (
    <div className="space-y-6">
      <section className="glass-panel rounded-lg p-6">
        <div className="grid gap-6 lg:grid-cols-[1fr_320px] lg:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-royal dark:text-pulse">
              User dashboard
            </p>
            <h1 className="mt-2 text-3xl font-black sm:text-4xl">Welcome back, Winnie User</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
              A focused command center for your wallet, orders, offers, notifications and saved services.
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white/70 p-5 dark:border-white/10 dark:bg-white/[0.045]">
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Current Balance</p>
            <p className="mt-2 text-4xl font-black">{walletBalance}</p>
            <button
              type="button"
              onClick={() => onNavigate("wallet")}
              className="interactive-ring mt-5 h-11 w-full rounded-lg bg-gradient-to-r from-royal to-pulse text-sm font-black text-white shadow-glow"
            >
              Manage Wallet
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {dashboardMetrics.map((metric, index) => (
          <MetricCard key={metric.label} item={metric} index={index} />
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="glass-panel rounded-lg p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-black">Latest Orders</h2>
            <button type="button" onClick={() => onNavigate("orders")} className="text-sm font-black text-royal dark:text-pulse">
              View all
            </button>
          </div>
          <div className="space-y-3">
            {orders.slice(0, 4).map((order) => (
              <button
                key={order.id}
                type="button"
                onClick={() => onNavigate("order-detail")}
                className="flex w-full items-center justify-between gap-4 rounded-lg border border-slate-200 bg-white/65 p-4 text-left transition hover:border-pulse/45 dark:border-white/10 dark:bg-white/[0.045]"
              >
                <span>
                  <span className="block font-black">{order.product}</span>
                  <span className="text-sm text-slate-500 dark:text-slate-400">{order.id} - {order.date}</span>
                </span>
                <span className="text-right">
                  <span className="block font-black">{order.price}</span>
                  <span className="text-sm text-slate-500 dark:text-slate-400">{order.status}</span>
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="glass-panel rounded-lg p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-black">Notifications</h2>
            <button type="button" onClick={() => onNavigate("notifications")} className="text-sm font-black text-royal dark:text-pulse">
              Open
            </button>
          </div>
          <div className="space-y-3">
            {notifications.slice(0, 3).map((item) => {
              const Icon = iconMap[item.level === "success" ? "CheckCircle2" : item.level === "warning" ? "AlertTriangle" : "Bell"];
              return (
                <div key={item.id} className="flex gap-3 rounded-lg border border-slate-200 bg-white/65 p-4 dark:border-white/10 dark:bg-white/[0.045]">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-royal/12 text-royal dark:bg-pulse/15 dark:text-pulse">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span>
                    <span className="block font-black">{item.title}</span>
                    <span className="text-sm text-slate-500 dark:text-slate-400">{item.message}</span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="glass-panel rounded-lg p-5">
          <h2 className="text-xl font-black">Special Offers</h2>
          <div className="mt-4 grid gap-3">
            {specialOffers.map((offer) => {
              const Icon = iconMap[offer.icon];
              return (
                <div key={offer.title} className="rounded-lg border border-slate-200 bg-white/65 p-4 dark:border-white/10 dark:bg-white/[0.045]">
                  <div className="flex items-start gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-lg bg-gradient-to-br from-royal to-pulse text-white">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="font-black">{offer.title}</h3>
                        <span className="rounded-md bg-gold/20 px-2 py-1 text-xs font-black text-amber-700 dark:text-gold">{offer.badge}</span>
                      </div>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{offer.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-black">Favorite Products</h2>
            <button type="button" onClick={() => onNavigate("deals")} className="text-sm font-black text-royal dark:text-pulse">
              Find deals
            </button>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {favoriteProducts.map((product) => (
              <ProductCard key={product.name} product={product} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
