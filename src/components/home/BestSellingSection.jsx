import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import ProductArtworkCard from "./ProductArtworkCard";

const maxBestSellingItems = 6;

function getBestSellingScore(item = {}) {
  const keys = ["salesCount", "ordersCount", "soldCount", "purchaseCount", "popularity", "rating"];

  return keys.reduce((score, key) => {
    const value = Number(item[key]);
    return Number.isFinite(value) ? Math.max(score, value) : score;
  }, 0);
}

export default function BestSellingSection({ items = [], onSelect }) {
  const { t } = useTranslation("home");
  const bestSellingItems = useMemo(() => {
    const activeItems = items.filter((item) => item?.isActive !== false);
    const scoredItems = activeItems
      .map((item, index) => ({ item, index, score: getBestSellingScore(item) }))
      .sort((left, right) => right.score - left.score || left.index - right.index)
      .map(({ item }) => item);

    return scoredItems.slice(0, maxBestSellingItems);
  }, [items]);

  if (!bestSellingItems.length) return null;

  return (
    <section id="best-selling" className="best-selling-section">
      <div className="mb-3 flex items-center justify-between gap-4 sm:mb-4">
        <h2 className="relative pr-3 text-lg font-black tracking-normal text-slate-950 dark:text-white sm:text-xl">
          <span className="absolute right-0 top-1/2 h-7 w-1 -translate-y-1/2 rounded-full bg-[linear-gradient(180deg,#F43F5E,#F97316,#7C3AED)] shadow-[0_0_14px_rgba(244,63,94,0.35)]" />
          {t("showcase.bestSelling")}
        </h2>
      </div>
      <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-3 xl:grid-cols-4">
        {bestSellingItems.map((item, index) => (
          <ProductArtworkCard key={item.id || item._id || item.slug || item.name} item={item} index={index} onSelect={() => onSelect?.(item)} />
        ))}
      </div>
    </section>
  );
}
