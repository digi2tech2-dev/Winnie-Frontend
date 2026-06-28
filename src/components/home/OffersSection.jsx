import { motion } from "framer-motion";
import { ArrowLeft, ShoppingCart, Sparkles } from "lucide-react";
import { premiumOffers } from "../../data/homeContent";

export default function OffersSection({ onOrder }) {
  return (
    <section id="offers" className="offers-section">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <h2 className="relative pr-3 text-xl font-black tracking-normal text-slate-950 dark:text-white sm:text-2xl">
            <span className="absolute right-0 top-1/2 h-7 w-1 -translate-y-1/2 rounded-full bg-[linear-gradient(180deg,#FBBF24,#A855F7)]" />
            العروض
          </h2>
          <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-[#8A94A7] sm:text-sm">
            عروض محدودة على أشهر خدمات الشحن والاشتراكات
          </p>
        </div>
        <span className="hidden items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-black text-amber-700 shadow-[0_10px_24px_rgba(245,158,11,0.10)] dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-300 sm:inline-flex">
          <Sparkles className="h-3.5 w-3.5" />
          Deals
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        {premiumOffers.map((offer, index) => (
          <OfferCard key={offer.name} offer={offer} index={index} onOrder={() => onOrder?.(offer)} />
        ))}
      </div>
    </section>
  );
}

function OfferCard({ offer, index, onOrder }) {
  const Icon = offer.icon;
  const triggerOrder = () => onOrder?.(offer);

  return (
    <motion.article
      role="button"
      tabIndex={0}
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.3, delay: index * 0.04 }}
      whileHover={{ y: -7 }}
      onClick={triggerOrder}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          triggerOrder();
        }
      }}
      className="offer-card group relative cursor-pointer overflow-hidden rounded-[18px] border border-sky-100 bg-white shadow-[0_12px_30px_rgba(14,165,233,0.10)] outline-none transition hover:border-[#C4B5FD] hover:shadow-[0_16px_40px_rgba(124,58,237,0.13)] focus-visible:ring-2 focus-visible:ring-[#A855F7] focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-white/10 dark:bg-[#111827] dark:shadow-[0_0_18px_rgba(139,92,246,0.14)] dark:hover:border-[#A855F7]/55 dark:hover:bg-[#1A2335] dark:focus-visible:ring-offset-[#050816]"
    >
      <div className={`relative min-h-[104px] overflow-hidden bg-gradient-to-br ${offer.tone} p-3 text-white`}>
        <span className="limited-badge absolute right-2 top-2 z-10 rounded-full border border-white/30 bg-white/18 px-2 py-0.5 text-[9px] font-black text-white shadow-[0_8px_18px_rgba(15,23,42,0.18)] backdrop-blur-md">
          عرض محدود
        </span>
        <span className="discount-badge absolute left-2 top-2 z-10 rounded-full bg-[#FBBF24] px-2 py-0.5 text-[9px] font-black text-[#422006] shadow-[0_10px_20px_rgba(251,191,36,0.22)]">
          {offer.discount}
        </span>

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_24%_20%,rgba(255,255,255,0.38),transparent_30%),linear-gradient(180deg,transparent,rgba(2,6,23,0.36))]" />
        <div className="relative mx-auto mt-7 grid h-14 w-16 place-items-center">
          <span className="absolute inset-x-1 bottom-0 h-9 rounded-[42%_58%_48%_52%/50%_42%_58%_50%] bg-white/18 blur-[1px]" />
          <span className="absolute h-12 w-12 rotate-[-10deg] rounded-2xl border border-white/22 bg-white/16 shadow-[0_16px_28px_rgba(2,6,23,0.22)] backdrop-blur-sm transition group-hover:rotate-0 group-hover:scale-105" />
          <Icon className="relative h-8 w-8 drop-shadow-[0_10px_18px_rgba(2,6,23,0.30)] transition group-hover:-translate-y-0.5 group-hover:scale-105" />
        </div>
      </div>

      <div className="p-3">
        <h3 className="line-clamp-1 text-sm font-black text-slate-950 dark:text-white">{offer.name}</h3>
        <div className="mt-2 flex items-end justify-between gap-2">
          <div>
            <p dir="ltr" className="old-price text-xs font-black text-slate-400 line-through dark:text-[#7C8598]">
              {offer.oldPrice}
            </p>
            <p dir="ltr" className="new-price mt-0.5 text-lg font-black leading-none text-[#7C3AED] dark:text-[#C084FC]">
              {offer.newPrice}
            </p>
          </div>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              triggerOrder();
            }}
            className="inline-flex h-8 shrink-0 items-center gap-1 rounded-lg bg-[linear-gradient(135deg,#7C3AED,#A855F7)] px-2.5 text-[11px] font-black text-white shadow-[0_10px_22px_rgba(124,58,237,0.22)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_28px_rgba(124,58,237,0.28)]"
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            اطلب الآن
            <ArrowLeft className="h-3 w-3" />
          </button>
        </div>
      </div>
    </motion.article>
  );
}
