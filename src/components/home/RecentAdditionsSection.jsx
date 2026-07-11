import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import recentAdditionsBanner from "../../../photo/اسلايد4.jpg";
import ProductArtworkCard from "./ProductArtworkCard";

const maxRecentItems = 8;

function getTimestamp(item) {
  const value = item?.createdAt || item?.created_at || item?.publishedAt || item?.updatedAt;
  if (!value) return null;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : null;
}

export default function RecentAdditionsSection({ items = [], onSelect }) {
  const { t } = useTranslation("home");
  const recentItems = useMemo(() => {
    const activeItems = items.filter((item) => item?.isActive !== false);
    const datedItems = activeItems
      .map((item) => ({ item, timestamp: getTimestamp(item) }))
      .filter(({ timestamp }) => timestamp)
      .sort((left, right) => right.timestamp - left.timestamp)
      .map(({ item }) => item);

    return (datedItems.length ? datedItems : activeItems).slice(0, maxRecentItems);
  }, [items]);

  if (!recentItems.length) return null;

  return (
    <section id="recent-additions" className="recent-additions-section">
      <div className="mb-3 flex items-center justify-between gap-4 sm:mb-4">
        <h2 className="relative pr-3 text-lg font-black tracking-normal text-slate-950 dark:text-white sm:text-xl">
          <span className="absolute right-0 top-1/2 h-7 w-1 -translate-y-1/2 rounded-full bg-[linear-gradient(180deg,#38BDF8,#7C3AED)]" />
          {t("showcase.recentlyAdded")}
        </h2>
      </div>
      <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-3 xl:grid-cols-4">
        {recentItems.map((item, index) => (
          <ProductArtworkCard key={item.id || item._id || item.slug || item.name} item={item} index={index} onSelect={() => onSelect?.(item)} />
        ))}
      </div>
      <div className="mx-auto mt-6 w-[92%] max-w-[820px] overflow-hidden rounded-[16px] border border-slate-100 bg-white shadow-[0_14px_34px_rgba(15,23,42,0.09)] dark:border-white/10 dark:bg-[#111827] dark:shadow-[0_0_20px_rgba(139,92,246,0.14)] sm:mt-8 sm:w-[86%]">
        <img src={recentAdditionsBanner} alt={t("showcase.recentlyAdded")} className="h-auto w-full object-cover" loading="lazy" />
      </div>
    </section>
  );
}
