import { ArrowLeft, ArrowRight } from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { sortProductsByNewest } from "../../utils/recentProducts";
import HomeProductCard from "./HomeProductCard";
import HorizontalProductCarousel from "./HorizontalProductCarousel";

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
            className="inline-flex h-7 shrink-0 items-center gap-1 rounded-full border border-slate-200/70 bg-white/35 px-2.5 text-[10px] font-black text-slate-400 shadow-[0_3px_10px_rgba(15,23,42,0.04)] backdrop-blur-sm transition hover:border-violet-200 hover:bg-violet-50/60 hover:text-violet-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-300 dark:border-white/10 dark:bg-white/[0.025] dark:text-slate-500 dark:hover:border-violet-400/20 dark:hover:bg-violet-400/[0.06] dark:hover:text-violet-300"
          >
            {t("recentlyAdded.viewAll")}
            <ArrowIcon className="h-3 w-3 stroke-[2.4]" />
          </button>
        ) : null}
      </div>

      {recentItems.length ? (
        <HorizontalProductCarousel label={t("recentlyAdded.title")}>
          {recentItems.map((product, index) => (
            <div key={product.id || product._id || product.slug || product.name} dir={isArabic ? "rtl" : "ltr"} className="homepage-product-carousel__item snap-start">
              <HomeProductCard product={product} index={index} onSelect={onSelect} variant="featured" />
            </div>
          ))}
        </HorizontalProductCarousel>
      ) : (
        <div className="rounded-[22px] border border-violet-100 bg-white/[0.85] p-6 text-center text-sm font-black text-slate-500 dark:border-white/10 dark:bg-slate-900/80 dark:text-slate-400">
          {t("recentlyAdded.empty")}
        </div>
      )}
    </section>
  );
}
