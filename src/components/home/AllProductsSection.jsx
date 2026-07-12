import { ArrowLeft, ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import HomeProductCard from "./HomeProductCard";

export default function AllProductsSection({ items = [], onSelect, onViewAll }) {
  const { t, i18n } = useTranslation("home");
  const isArabic = i18n.language?.startsWith("ar");
  const ArrowIcon = isArabic ? ArrowLeft : ArrowRight;

  return (
    <section id="catalog-products" dir={isArabic ? "rtl" : "ltr"} className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="relative text-xl font-black tracking-normal text-slate-950 dark:text-white sm:text-2xl">
          <span className="absolute top-1/2 h-8 w-1 -translate-y-1/2 rounded-full bg-[linear-gradient(180deg,#38BDF8,#7C3AED)] shadow-[0_0_14px_rgba(14,165,233,0.25)] ltr:-left-3 rtl:-right-3" />
          {t("homePage.allProducts")}
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

      {items.length ? (
        <div className="grid grid-cols-3 gap-2 sm:gap-3 md:grid-cols-4 lg:grid-cols-5 2xl:grid-cols-6">
          {items.map((product, index) => (
            <HomeProductCard
              key={product.id || product._id || product.slug || product.name}
              product={product}
              index={index}
              onSelect={onSelect}
              variant="compact"
            />
          ))}
        </div>
      ) : (
        <div className="rounded-[22px] border border-violet-100 bg-white/[0.85] p-6 text-center text-sm font-black text-slate-500 shadow-[0_14px_34px_rgba(14,165,233,0.08)] dark:border-white/10 dark:bg-slate-900/80 dark:text-slate-400">
          {t("homePage.noProductsAvailable")}
        </div>
      )}
    </section>
  );
}
