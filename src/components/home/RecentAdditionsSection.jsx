import { ArrowLeft, ArrowRight } from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { sortProductsByNewest } from "../../utils/recentProducts";
import HomeProductCard from "./HomeProductCard";

export const recentHomepageLimit = 6;

export default function RecentAdditionsSection({ items = [], onSelect, onViewAll }) {
  const { t, i18n } = useTranslation("home");
  const isArabic = i18n.language?.startsWith("ar");
  const ArrowIcon = isArabic ? ArrowLeft : ArrowRight;
  const recentItems = useMemo(
    () => sortProductsByNewest(items.filter((item) => item?.isActive !== false)).slice(0, recentHomepageLimit),
    [items],
  );

  return (
    <section id="recent-additions" dir={isArabic ? "rtl" : "ltr"} className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="relative text-xl font-black tracking-normal text-slate-950 dark:text-white sm:text-2xl ltr:pl-3 rtl:pr-3">
            <span className="absolute top-1/2 h-8 w-1 -translate-y-1/2 rounded-full bg-[linear-gradient(180deg,#ec4899,#7c3aed,#22d3ee)] ltr:left-0 rtl:right-0" />
            {t("recentlyAdded.title")}
          </h2>
          <p className="mt-2 text-xs font-bold leading-5 text-slate-500 dark:text-slate-400 sm:text-sm">
            {t("recentlyAdded.subtitle")}
          </p>
        </div>
        {onViewAll ? (
          <button
            type="button"
            onClick={onViewAll}
            className="inline-flex h-10 shrink-0 items-center gap-2 rounded-[14px] border border-violet-300/70 px-3 text-xs font-black text-violet-700 transition hover:bg-violet-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 dark:border-violet-400/30 dark:text-violet-200 dark:hover:bg-violet-400/10 sm:text-sm"
          >
            {t("recentlyAdded.viewAll")}
            <ArrowIcon className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      {recentItems.length ? (
        <div className="homepage-product-row">
          {recentItems.map((product, index) => (
            <HomeProductCard
              key={product.id || product._id || product.slug || product.name}
              product={product}
              index={index}
              onSelect={onSelect}
              variant="featured"
            />
          ))}
        </div>
      ) : (
        <div className="rounded-[22px] border border-violet-100 bg-white/[0.85] p-6 text-center text-sm font-black text-slate-500 dark:border-white/10 dark:bg-slate-900/80 dark:text-slate-400">
          {t("recentlyAdded.empty")}
        </div>
      )}
    </section>
  );
}
