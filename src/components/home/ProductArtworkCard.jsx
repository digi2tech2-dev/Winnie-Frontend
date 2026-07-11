import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { iconMap } from "../icons";

export default function ProductArtworkCard({ item, index, onSelect }) {
  const { t } = useTranslation("home");
  const Icon = typeof item.icon === "function" ? item.icon : iconMap[item.icon] || iconMap.ShoppingBag;
  const tone = item.tone || item.cover || "from-[#7C3AED] via-[#2563EB] to-[#111827]";
  const priceLabel = item.displayPriceLabel || item.price || "";

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.15, delay: index * 0.035 }}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.985 }}
      onClick={onSelect}
      className="group flex min-w-0 flex-col overflow-hidden rounded-[20px] border border-slate-100 bg-white text-center shadow-[0_10px_26px_rgba(15,23,42,0.08)] outline-none transition-shadow duration-150 hover:shadow-[0_16px_36px_rgba(124,58,237,0.14)] focus-visible:ring-2 focus-visible:ring-[#8B5CF6] focus-visible:ring-offset-2 dark:border-white/10 dark:bg-[#111827] dark:shadow-[0_8px_28px_rgba(0,0,0,0.28)]"
    >
      <span className={`relative grid aspect-square w-full place-items-center overflow-hidden bg-gradient-to-br ${tone}`}>
        {item.image ? (
          <img src={item.image} alt={item.name || item.title || ""} className="h-full w-full object-contain transition-transform duration-150 group-hover:scale-[1.03]" loading="lazy" />
        ) : (
          <Icon className="h-12 w-12 text-white drop-shadow-[0_8px_18px_rgba(15,23,42,0.3)] sm:h-16 sm:w-16" />
        )}
      </span>
      <span className="flex min-h-[58px] w-full flex-col justify-center px-2.5 py-2 sm:min-h-[66px] sm:px-3">
        <span className="line-clamp-2 text-xs font-black leading-4 text-slate-950 dark:text-white sm:text-sm sm:leading-5">{item.name || item.title}</span>
        <span dir="ltr" className="mt-1 truncate text-[11px] font-black text-[#7C3AED] dark:text-[#C084FC] sm:text-xs">
          {priceLabel || t("showcase.priceUnavailable")}
        </span>
      </span>
    </motion.button>
  );
}
