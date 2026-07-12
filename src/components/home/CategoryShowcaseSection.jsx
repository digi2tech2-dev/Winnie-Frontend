import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { iconMap } from "../icons";

function getCategorySubtitle(category, fallback) {
  return category.subtitle || category.description || category.summary || fallback;
}

export default function CategoryShowcaseSection({ categories = [], onSelect }) {
  const { t, i18n } = useTranslation("home");
  const isArabic = i18n.language?.startsWith("ar");

  return (
    <section id="home-categories" dir={isArabic ? "rtl" : "ltr"} className="space-y-4">
      <div className="flex items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="mb-1 inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-3 py-1 text-xs font-black text-violet-700 ring-1 ring-violet-100 dark:bg-violet-500/10 dark:text-violet-200 dark:ring-violet-300/10">
            <Sparkles className="h-3.5 w-3.5" />
            Winnie Fun
          </p>
          <h2 className="text-xl font-black tracking-normal text-slate-950 dark:text-white sm:text-2xl">
            {t("homePage.browseCategories")}
          </h2>
        </div>
      </div>

      {categories.length ? (
        <div className="grid w-full grid-cols-2 gap-3 md:grid-cols-3 md:gap-5 2xl:grid-cols-4">
          {categories.map((category, index) => (
            <CategoryCard
              key={category.id || category._id || category.slug || category.name}
              category={category}
              index={index}
              isArabic={isArabic}
              onSelect={() => onSelect?.(category)}
              subtitleFallback={t("homePage.categorySubtitleFallback")}
              cta={t("homePage.browseCategory")}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-[22px] border border-violet-100 bg-white/[0.85] p-6 text-center text-sm font-black text-slate-500 shadow-[0_14px_34px_rgba(14,165,233,0.08)] dark:border-white/10 dark:bg-slate-900/80 dark:text-slate-400">
          {t("showcase.noCategories")}
        </div>
      )}
    </section>
  );
}

function CategoryCard({ category, index, isArabic, onSelect, subtitleFallback, cta }) {
  const [imageFailed, setImageFailed] = useState(false);
  const Icon = iconMap[category.icon] || iconMap.Gift;
  const tone = category.tone || "from-[#7C3AED] via-[#2563EB] to-[#06B6D4]";
  const ArrowIcon = isArabic ? ArrowLeft : ArrowRight;
  const hasImage = category.image && !imageFailed;

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.26, delay: Math.min(index, 8) * 0.04 }}
      whileHover={{ y: -5 }}
      whileTap={{ scale: 0.985 }}
      onClick={onSelect}
      className="group w-full max-w-[420px] overflow-hidden rounded-[18px] border border-white/80 bg-white/95 text-start shadow-[0_12px_26px_rgba(76,29,149,0.09)] outline-none backdrop-blur-xl transition duration-200 hover:-translate-y-1 hover:border-cyan-200 hover:shadow-[0_18px_40px_rgba(14,165,233,0.15)] focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-white/10 dark:bg-slate-900/90 dark:focus-visible:ring-offset-slate-950 sm:rounded-[24px]"
    >
      <span className={["relative block h-[118px] overflow-hidden bg-gradient-to-br min-[390px]:h-[132px] sm:h-[170px] md:h-[190px] xl:h-[205px]", tone].join(" ")}>
        <span className="absolute inset-0 bg-[radial-gradient(circle_at_24%_20%,rgba(255,255,255,0.48),transparent_31%),radial-gradient(circle_at_78%_78%,rgba(34,211,238,0.34),transparent_36%),linear-gradient(180deg,rgba(255,255,255,0.08),rgba(15,23,42,0.42))]" />
        <span className="absolute -bottom-8 start-8 h-20 w-20 rounded-full bg-white/30 blur-2xl sm:h-24 sm:w-24 md:h-28 md:w-28" />
        <span className="absolute inset-3 grid place-items-center rounded-[16px] border border-white/30 bg-white/[0.12] text-white shadow-[0_14px_28px_rgba(15,23,42,0.20)] backdrop-blur transition duration-300 group-hover:scale-[1.03] sm:inset-4 sm:rounded-[22px]">
          <Icon className="h-10 w-10 drop-shadow-[0_0_16px_rgba(255,255,255,0.45)] sm:h-12 sm:w-12 md:h-14 md:w-14" />
          {hasImage ? (
            <img
              src={category.image}
              alt={category.title || category.name || ""}
              className="absolute inset-0 h-full w-full object-cover object-center"
              loading="lazy"
              onError={() => setImageFailed(true)}
            />
          ) : null}
        </span>
      </span>

      <span className="block space-y-2 p-3 sm:space-y-2.5 sm:p-4">
        <span className="block min-h-[2.6rem] sm:min-h-[3.6rem]">
          <span className="line-clamp-1 text-[13px] font-black leading-5 text-slate-950 dark:text-white sm:text-base sm:leading-6">{category.title || category.name}</span>
          <span className="mt-0.5 hidden text-[11px] font-bold leading-4 text-slate-500 dark:text-slate-400 min-[390px]:line-clamp-1 sm:mt-1 sm:line-clamp-2 sm:text-xs sm:leading-5">
            {getCategorySubtitle(category, subtitleFallback)}
          </span>
        </span>
        <span className="inline-flex h-8 max-w-full items-center gap-1.5 rounded-[12px] bg-slate-950 px-2.5 text-[10px] font-black text-white shadow-[0_8px_16px_rgba(15,23,42,0.12)] transition group-hover:bg-violet-700 dark:bg-white dark:text-slate-950 sm:h-9 sm:gap-2 sm:rounded-[14px] sm:px-3 sm:text-xs sm:shadow-[0_10px_22px_rgba(15,23,42,0.16)]">
          {cta}
          <ArrowIcon className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
        </span>
      </span>
    </motion.button>
  );
}
