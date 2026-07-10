import { motion } from "framer-motion";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { iconMap } from "../icons";

const maxBestSellingItems = 6;

function getBestSellingScore(item = {}) {
  const keys = [
    "salesCount",
    "ordersCount",
    "soldCount",
    "purchaseCount",
    "popularity",
    "rating",
  ];

  return keys.reduce((score, key) => {
    const value = Number(item[key]);
    return Number.isFinite(value) ? Math.max(score, value) : score;
  }, 0);
}

function getDiscountPercentage(item = {}) {
  if (item.hasDiscount !== true) return null;

  const percentage = Number(item.discountPercentage ?? item.discountPercent ?? item.discount);
  if (Number.isFinite(percentage) && percentage > 0) {
    return Math.round(percentage);
  }

  const rate = Number(item.discountRate);
  if (Number.isFinite(rate) && rate > 0) {
    return Math.round(rate <= 1 ? rate * 100 : rate);
  }

  return null;
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

      <div className="grid grid-cols-3 gap-x-2 gap-y-7 sm:grid-cols-4 sm:gap-x-4 sm:gap-y-8 lg:grid-cols-6">
        {bestSellingItems.map((item, index) => (
          <BestSellingItem
            key={item.id || item._id || item.slug || item.name}
            item={item}
            index={index}
            onSelect={() => onSelect?.(item)}
          />
        ))}
      </div>
    </section>
  );
}

function BestSellingItem({ item, index, onSelect }) {
  const { t, i18n } = useTranslation("home");
  const isArabic = i18n.language?.startsWith("ar");
  const Icon = typeof item.icon === "function" ? item.icon : iconMap[item.icon] || iconMap.ShoppingBag;
  const tone = item.tone || item.cover || "from-[#7C3AED] via-[#2563EB] to-[#111827]";
  const priceLabel = item.displayPriceLabel || item.price || "";
  const discountPercentage = getDiscountPercentage(item);

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.3, delay: index * 0.04 }}
      whileHover={{ y: -6 }}
      whileTap={{ scale: 0.985 }}
      onClick={onSelect}
      className="group flex min-w-0 flex-col items-center text-center outline-none"
    >
      <span className="relative grid h-[122px] w-full max-w-[108px] place-items-center sm:h-[148px] sm:max-w-[134px]">
        <span className="absolute bottom-1 left-1/2 h-12 w-24 -translate-x-1/2 rounded-full bg-rose-500/25 blur-xl transition group-hover:bg-orange-400/35" />
        <span className="absolute bottom-0 h-[98px] w-[100px] rounded-t-[22px] bg-gradient-to-b from-[#FB7185] via-[#F97316] to-[#7C3AED] shadow-[0_18px_34px_rgba(244,63,94,0.24)] transition duration-300 group-hover:shadow-[0_24px_46px_rgba(249,115,22,0.32)] sm:h-[118px] sm:w-[112px] sm:rounded-t-[26px]" />
        <span className="absolute bottom-4 h-[76px] w-[100px] rounded-t-[23px] bg-[radial-gradient(circle_at_18%_18%,rgba(255,255,255,0.28)_0_2px,transparent_3px)] bg-[length:12px_12px] opacity-40 sm:h-[94px] sm:w-[112px] sm:rounded-t-[27px] sm:bg-[length:15px_15px]" />
        <span className="absolute inset-x-3 bottom-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent" />
        {discountPercentage ? (
          <span dir={isArabic ? "rtl" : "ltr"} className="absolute -right-2 top-1 z-20 whitespace-nowrap rounded-full border-2 border-white bg-gradient-to-r from-[#F43F5E] to-[#F97316] px-2 py-1 text-[8px] font-black text-white shadow-[0_8px_20px_rgba(244,63,94,0.42)] dark:border-[#111827] sm:-right-3 sm:top-0 sm:px-2.5 sm:text-[10px]">
            {isArabic ? `خصم ${discountPercentage}%` : `${discountPercentage}% OFF`}
          </span>
        ) : null}
        <span className={`relative mb-6 grid h-[66px] w-[66px] place-items-center overflow-hidden rounded-[21px] border border-white/75 bg-gradient-to-br ${tone} text-white shadow-[0_16px_28px_rgba(15,23,42,0.28)] transition duration-300 group-hover:-translate-y-1.5 group-hover:scale-105 sm:mb-7 sm:h-[82px] sm:w-[82px] sm:rounded-[25px]`}>
          <span className="absolute inset-1 rounded-[17px] bg-white/12 sm:rounded-[21px]" />
          {item.image ? (
            <img src={item.image} alt="" className="relative h-full w-full object-cover" loading="lazy" />
          ) : (
            <Icon className="relative h-9 w-9 drop-shadow-[0_6px_12px_rgba(15,23,42,0.28)] sm:h-11 sm:w-11" />
          )}
        </span>
      </span>

      <span className="mt-2 line-clamp-2 min-h-10 w-full max-w-[116px] text-[13px] font-black leading-5 text-slate-950 transition group-hover:text-[#7C3AED] dark:text-white dark:group-hover:text-[#C084FC] sm:min-h-12 sm:max-w-[150px] sm:text-base sm:leading-6">
        {item.name || item.title}
      </span>

      <span className="mt-1.5 flex min-h-7 max-w-[116px] items-center justify-center rounded-xl border border-orange-200/80 bg-gradient-to-r from-rose-50 to-orange-50 px-2 py-1 shadow-[0_7px_18px_rgba(249,115,22,0.12)] dark:border-orange-400/20 dark:bg-[linear-gradient(90deg,rgba(244,63,94,0.12),rgba(249,115,22,0.12))] sm:min-h-8 sm:max-w-[150px] sm:px-3">
        <span dir="ltr" className="truncate text-[10px] font-black text-[#E54B24] dark:text-[#FDBA74] sm:text-xs">
          {priceLabel || t("showcase.priceUnavailable")}
        </span>
      </span>
    </motion.button>
  );
}
