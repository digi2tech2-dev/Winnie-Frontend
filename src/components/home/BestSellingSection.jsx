import { useMemo } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { sortProductsByBestSelling } from "../../utils/bestSellingProducts";
import HomeProductCard from "./HomeProductCard";
import HorizontalProductCarousel from "./HorizontalProductCarousel";

const maxBestSellingItems = 6;

export default function BestSellingSection({ items = [], onSelect, onViewAll }) {
  const { t, i18n } = useTranslation("home");
  const isArabic = i18n.language?.startsWith("ar");
  const ArrowIcon = isArabic ? ArrowLeft : ArrowRight;
  const bestSellingItems = useMemo(() => {
    const activeItems = items.filter((item) => item?.isActive !== false);
    return sortProductsByBestSelling(activeItems).slice(0, maxBestSellingItems);
  }, [items]);

  if (!bestSellingItems.length) return null;

  return (
    <section id="best-selling" dir={isArabic ? "rtl" : "ltr"} className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="relative text-xl font-black tracking-normal text-slate-950 dark:text-white sm:text-2xl">
          <span className="absolute top-1/2 h-8 w-1 -translate-y-1/2 rounded-full bg-[linear-gradient(180deg,#F43F5E,#7C3AED,#38BDF8)] shadow-[0_0_14px_rgba(124,58,237,0.30)] ltr:-left-3 rtl:-right-3" />
          {t("homePage.bestSellers")}
        </h2>
        {onViewAll ? (
          <button
            type="button"
            onClick={onViewAll}
            className="inline-flex h-7 items-center gap-1 rounded-full border border-slate-200/70 bg-white/35 px-2.5 text-[10px] font-black text-slate-400 shadow-[0_3px_10px_rgba(15,23,42,0.04)] backdrop-blur-sm transition hover:border-violet-200 hover:bg-violet-50/60 hover:text-violet-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-300 dark:border-white/10 dark:bg-white/[0.025] dark:text-slate-500 dark:hover:border-violet-400/20 dark:hover:bg-violet-400/[0.06] dark:hover:text-violet-300"
          >
            {t("showcase.viewAll")}
            <ArrowIcon className="h-3 w-3 stroke-[2.4]" />
          </button>
        ) : null}
      </div>
      <HorizontalProductCarousel label={t("homePage.bestSellers")}>
        {bestSellingItems.map((item, index) => (
          <div key={item.id || item._id || item.slug || item.name} dir={isArabic ? "rtl" : "ltr"} className="homepage-product-carousel__item snap-start">
            <HomeProductCard product={item} index={index} onSelect={onSelect} variant="featured" />
          </div>
        ))}
      </HorizontalProductCarousel>
    </section>
  );
}
