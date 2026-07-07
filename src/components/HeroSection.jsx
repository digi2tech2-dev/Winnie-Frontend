import { ArrowRight, BadgeCheck, Headphones, ShieldCheck, Zap } from "lucide-react";

const paymentMethods = ["Visa", "Mastercard", "Wallet"];

export default function HeroSection({ onTopUp }) {
  return (
    <section className="glass-panel relative overflow-hidden rounded-lg">
      <div className="absolute inset-0 bg-grid-fade bg-[length:36px_36px] opacity-60" />
      <div className="absolute inset-0 bg-gradient-to-r from-white via-white/72 to-white/15 dark:from-[#090a1d] dark:via-[#090a1d]/75 dark:to-[#090a1d]/20" />
      <img
        src="/hero-winnie-fun.png"
        alt=""
        className="absolute inset-y-0 right-0 h-full w-full object-cover opacity-55 mix-blend-multiply dark:opacity-80 dark:mix-blend-normal"
      />
      <div className="relative grid min-h-[310px] gap-6 p-6 sm:p-8 lg:grid-cols-[1fr_330px] lg:p-10">
        <div className="max-w-2xl self-center">
          <p className="mb-3 inline-flex rounded-lg border border-pulse/20 bg-pulse/10 px-3 py-1 text-xs font-black uppercase tracking-[0.22em] text-royal dark:text-pulse">
            Global digital top up
          </p>
          <h1 className="max-w-xl text-4xl font-black leading-tight tracking-normal sm:text-5xl lg:text-6xl">
            Top Up Anything.
            <span className="block gradient-text">Play Everything.</span>
          </h1>
          <p className="mt-4 max-w-lg text-base leading-7 text-slate-600 dark:text-slate-300">
            Instant top-ups, secure payments and 24/7 support for games, apps,
            subscriptions, gift cards, social services and AI tools.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onTopUp}
              className="interactive-ring inline-flex h-12 items-center gap-3 rounded-lg bg-gradient-to-r from-royal to-pulse px-5 text-sm font-black text-white shadow-glow"
            >
              Top Up Now
              <ArrowRight className="h-5 w-5" />
            </button>
            <div className="flex flex-wrap gap-2">
              {paymentMethods.map((method) => (
                <span
                  key={method}
                  className="rounded-md border border-slate-200 bg-white/80 px-3 py-2 text-xs font-black text-slate-700 dark:border-white/10 dark:bg-white/10 dark:text-white"
                >
                  {method}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-3 self-center sm:grid-cols-3 lg:grid-cols-1">
          {[
            { title: "Secure Payments", text: "100% safe and trusted", icon: ShieldCheck, tone: "from-blue-500 to-royal" },
            { title: "Instant Delivery", text: "Get top-ups in seconds", icon: Zap, tone: "from-pink-500 to-rose-600" },
            { title: "24/7 Support", text: "We are here anytime", icon: Headphones, tone: "from-aqua to-blue-600" },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-lg border border-white/70 bg-white/75 p-4 backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.07]"
            >
              <div className="flex items-center gap-3">
                <span className={`grid h-11 w-11 place-items-center rounded-lg bg-gradient-to-br ${item.tone} text-white`}>
                  <item.icon className="h-5 w-5" />
                </span>
                <span>
                  <span className="block text-sm font-black">{item.title}</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {item.text}
                  </span>
                </span>
                <BadgeCheck className="ml-auto h-4 w-4 text-emerald-400" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
