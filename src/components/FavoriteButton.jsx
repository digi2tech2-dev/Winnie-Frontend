import { motion } from "framer-motion";
import { Heart, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useFavorites } from "../context/FavoritesContext";

export default function FavoriteButton({ product, compact = false, className = "" }) {
  const { t } = useTranslation("products");
  const { isFavorite, toggleFavorite } = useFavorites();
  const active = isFavorite(product);
  const label = active ? t("favorites.remove") : t("favorites.add");

  return (
    <motion.button
      type="button"
      initial={false}
      animate={active ? { scale: [1, 1.16, 1], rotate: [0, -7, 0] } : { scale: 1, rotate: 0 }}
      transition={{ duration: 0.38, ease: "easeOut" }}
      whileHover={{ y: -2, scale: 1.08 }}
      whileTap={{ scale: 0.88 }}
      onClick={(event) => {
        event.stopPropagation();
        toggleFavorite(product);
      }}
      onKeyDown={(event) => event.stopPropagation()}
      aria-label={label}
      aria-pressed={active}
      title={label}
      className={`group/favorite relative isolate grid shrink-0 place-items-center overflow-visible rounded-[12px] border outline-none backdrop-blur-xl transition-[color,background-color,border-color,box-shadow] duration-300 focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950 ${
        compact ? "h-[22px] w-[22px] rounded-[9px]" : "h-8 w-8 sm:h-9 sm:w-9"
      } ${
        active
          ? "border-rose-300/80 bg-[linear-gradient(145deg,#FB7185_0%,#EC4899_48%,#C026D3_100%)] text-white shadow-[0_8px_22px_rgba(236,72,153,0.40),inset_0_1px_0_rgba(255,255,255,0.42)] ring-4 ring-rose-400/10 dark:border-rose-300/45 dark:shadow-[0_0_22px_rgba(236,72,153,0.34)]"
          : "border-rose-100/90 bg-[linear-gradient(145deg,rgba(255,255,255,0.96),rgba(255,241,242,0.86))] text-rose-400 shadow-[0_6px_16px_rgba(190,24,93,0.10),inset_0_1px_0_rgba(255,255,255,0.95)] hover:border-rose-200 hover:bg-rose-50 hover:text-rose-500 hover:shadow-[0_9px_20px_rgba(244,63,94,0.18)] dark:border-rose-300/15 dark:bg-[linear-gradient(145deg,rgba(30,41,59,0.94),rgba(76,5,25,0.48))] dark:text-rose-300 dark:shadow-[0_0_14px_rgba(244,63,94,0.10)] dark:hover:border-rose-300/30"
      } ${className}`}
    >
      <span className={`pointer-events-none absolute inset-[2px] -z-10 overflow-hidden ${compact ? "rounded-[6px]" : "rounded-[9px]"}`}>
        <span className={`absolute -left-2 -top-3 h-5 w-8 rotate-[-28deg] bg-white/30 blur-[3px] transition-opacity ${active ? "opacity-100" : "opacity-45"}`} />
      </span>
      <Heart
        className={`${compact ? "h-3 w-3" : "h-4 w-4 sm:h-[18px] sm:w-[18px]"} relative z-10 transition-transform duration-300 group-hover/favorite:scale-110 ${active ? "fill-current drop-shadow-[0_2px_5px_rgba(136,19,55,0.34)]" : "fill-rose-100/65 dark:fill-rose-400/10"}`}
        strokeWidth={active ? 2.2 : 2.35}
      />
      {active ? (
        <motion.span
          initial={{ opacity: 0, scale: 0, rotate: -20 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          className={`absolute grid place-items-center rounded-full border border-white/80 bg-white text-fuchsia-500 shadow-[0_4px_10px_rgba(192,38,211,0.30)] ${compact ? "-right-1 -top-1 h-3 w-3" : "-right-1.5 -top-1.5 h-4 w-4"}`}
          aria-hidden="true"
        >
          <Sparkles className={compact ? "h-2 w-2 fill-current" : "h-2.5 w-2.5 fill-current"} />
        </motion.span>
      ) : null}
    </motion.button>
  );
}
