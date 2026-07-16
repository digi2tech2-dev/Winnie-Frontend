import { useState } from "react";
import { useTranslation } from "react-i18next";

export default function CategoryShowcaseSection({ categories = [], onSelect, showHeading = true }) {
  const { t, i18n } = useTranslation("home");
  const isArabic = i18n.language?.startsWith("ar");

  return (
    <section id="home-categories" dir={isArabic ? "rtl" : "ltr"} className="space-y-5">
      {showHeading ? (
        <h2 className="relative text-xl font-black tracking-normal text-slate-950 dark:text-white sm:text-2xl ltr:pl-3 rtl:pr-3">
          <span className="absolute top-1/2 h-8 w-1 -translate-y-1/2 rounded-full bg-[linear-gradient(180deg,#ec4899,#7c3aed,#22d3ee)] ltr:left-0 rtl:right-0" />
          {t("homePage.browseCategories")}
        </h2>
      ) : null}

      {categories.length ? (
        <div className="main-category-grid">
          {categories.map((category) => (
            <CategoryItem
              key={category.id || category._id || category.slug || category.name}
              category={category}
              onSelect={() => onSelect?.(category)}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-[22px] border border-violet-100 bg-white/[0.85] p-6 text-center text-sm font-black text-slate-500 dark:border-white/10 dark:bg-slate-900/80 dark:text-slate-400">
          {t("showcase.noCategories")}
        </div>
      )}
    </section>
  );
}

function CategoryItem({ category, onSelect }) {
  const [imageFailed, setImageFailed] = useState(false);
  const categoryName = category.title || category.name || "";

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-label={categoryName}
      className="premium-category group flex min-w-0 flex-col items-center text-center outline-none active:scale-[0.985] focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-4 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-950"
    >
      <span className="premium-category__frame relative inline-block max-w-full overflow-hidden rounded-[18px] leading-none">
        {category.image && !imageFailed ? (
          <img
            src={category.image}
            alt={categoryName}
            className="relative z-[1] block h-auto max-w-full object-contain p-[2px]"
            loading="lazy"
            onError={() => setImageFailed(true)}
          />
        ) : null}
      </span>
      <span className="mt-3 line-clamp-2 min-h-10 w-full text-center text-sm font-black leading-5 text-slate-950 transition-colors group-hover:text-violet-700 dark:text-white dark:group-hover:text-violet-300 sm:text-base sm:leading-6">
        {categoryName}
      </span>
    </button>
  );
}
