import { useMemo } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { sortProductsByBestSelling } from "../../utils/bestSellingProducts";
import HomeProductCard from "./HomeProductCard";

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
            className="inline-flex h-10 items-center gap-2 rounded-[14px] bg-white px-3 text-sm font-black text-violet-700 shadow-[0_10px_24px_rgba(76,29,149,0.08)] ring-1 ring-violet-100 transition hover:bg-violet-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 dark:bg-slate-900 dark:text-violet-200 dark:ring-white/10 dark:hover:bg-white/10"
          >
            {t("showcase.viewAll")}
            <ArrowIcon className="h-4 w-4" />
          </button>
        ) : null}
      </div>
      <div className="homepage-product-row">
        {bestSellingItems.map((item, index) => (
          <HomeProductCard
            key={item.id || item._id || item.slug || item.name}
            product={item}
            index={index}
            onSelect={onSelect}
            variant="featured"
          />
        ))}
      </div>
    </section>
  );
}
