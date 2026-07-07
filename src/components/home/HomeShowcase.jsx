import { motion } from "framer-motion";
import { ArrowLeft, Star } from "lucide-react";
import { useTranslation } from "react-i18next";
import { iconMap } from "../icons";
import productsBanner from "../../../photo/اسلايد 3.jpg";

const categoryAccentIcons = {
  games: ["Sword", "Flame"],
  voice: ["Headphones", "MessageCircle"],
  social: ["Heart", "UsersRound"],
  ai: ["Sparkles", "Code2"],
  "gift-cards": ["Ticket", "Coins"],
  subscriptions: ["Play", "Music"],
};

export default function HomeShowcase({
  categories = [],
  products = [],
  productsTitle,
  onViewAll,
  onCategorySelect,
  onProductSelect,
}) {
  const { t } = useTranslation("home");

  return (
    <div dir="rtl" className="space-y-6 text-right lg:space-y-8">
      <section id="home-categories">
        <ShowcaseHeading title={t("showcase.categories")} />
        {categories.length ? (
          <CategoriesGrid categories={categories} onCategorySelect={onCategorySelect} />
        ) : (
          <CleanEmptyState title={t("showcase.noCategories")} />
        )}
      </section>

      <section id="catalog-products">
        <ShowcaseHeading title={productsTitle || t("showcase.products")} action={t("showcase.viewAll")} onAction={products.length ? onViewAll : undefined} />
        {products.length ? (
          <div dir="rtl" className="no-scrollbar flex items-stretch gap-3 overflow-x-auto overflow-y-hidden pb-2 sm:gap-4">
            {products.map((product, index) => (
              <ProductCatalogCard
                key={product.id || product.name}
                product={product}
                index={index}
                onSelect={() => onProductSelect?.(product)}
              />
            ))}
          </div>
        ) : (
          <CleanEmptyState title={t("showcase.noProducts")} />
        )}
      </section>

      <ProductsBanner />

    </div>
  );
}

function ProductsBanner() {
  const { t } = useTranslation("home");

  return (
    <div className="mx-auto mb-4 w-[92%] max-w-[820px] overflow-hidden rounded-[16px] border border-slate-100 bg-white shadow-[0_14px_34px_rgba(15,23,42,0.09)] dark:border-white/10 dark:bg-[#111827] dark:shadow-[0_0_20px_rgba(139,92,246,0.14)] sm:w-[86%]">
      <img
        src={productsBanner}
        alt={t("showcase.products")}
        className="h-auto w-full object-cover"
        loading="lazy"
      />
    </div>
  );
}

export function CategoriesGrid({ categories = [], onCategorySelect, layout = "three" }) {
  const gridClassName =
    layout === "two"
      ? "grid grid-cols-2 gap-x-4 gap-y-6 py-2 sm:gap-x-8 sm:gap-y-8"
      : "grid grid-cols-3 gap-x-2 gap-y-5 py-2 sm:gap-x-4 sm:gap-y-6";

  return (
    <div dir="rtl" className={gridClassName}>
      {categories.map((category, index) => (
        <CategoryImageItem
          key={category.id || category.slug || category.name}
          category={category}
          index={index}
          size={layout === "two" ? "large" : "default"}
          onSelect={() => onCategorySelect?.(category)}
        />
      ))}
    </div>
  );
}

function ShowcaseHeading({ title, action = "View all", onAction }) {
  return (
    <div dir="rtl" className="mb-4 flex items-center justify-between gap-4 text-right">
      <h2 className="relative pr-3 text-xl font-black tracking-normal text-slate-950 dark:text-white sm:text-2xl">
        <span className="absolute right-0 top-1/2 h-7 w-1 -translate-y-1/2 rounded-full bg-[linear-gradient(180deg,#38BDF8,#7C3AED)]" />
        {title}
      </h2>
      {onAction && (
        <button
          type="button"
          onClick={onAction}
          className="inline-flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-black text-[#8B5CF6] transition hover:bg-[#F5F3FF] hover:text-[#6D28D9] dark:text-[#C084FC] dark:hover:bg-[#8B5CF6]/14 dark:hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          {action}
        </button>
      )}
    </div>
  );
}

function CategoryImageItem({ category, index, onSelect, size = "default" }) {
  const Icon = iconMap[category.icon] || iconMap.Gift;
  const [firstAccent, secondAccent] = categoryAccentIcons[category.id] || ["Sparkles", "Star"];
  const AccentOne = iconMap[firstAccent] || iconMap.Sparkles;
  const AccentTwo = iconMap[secondAccent] || iconMap.Star;
  const isLarge = size === "large";

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.32, delay: index * 0.05 }}
      whileHover={{ y: -5 }}
      whileTap={{ scale: 0.985 }}
      onClick={onSelect}
      className="group flex min-w-0 flex-col items-center text-center outline-none"
    >
      <span
        className={`relative grid w-full place-items-center transition group-hover:scale-[1.04] ${
          isLarge ? "h-40 max-w-[148px] sm:h-52 sm:max-w-[210px] lg:h-56 lg:max-w-[230px]" : "h-32 max-w-[116px] sm:h-40 sm:max-w-[154px]"
        }`}
      >
        <span
          className={`absolute bottom-2 rounded-full bg-slate-950/12 blur-md transition group-hover:bg-[#7C3AED]/16 dark:bg-black/35 ${
            isLarge ? "h-7 w-28 sm:h-8 sm:w-44" : "h-6 w-24 sm:w-32"
          }`}
        />
        <span
          className={`absolute rotate-[8deg] rounded-[34px] bg-gradient-to-br ${category.tone} opacity-25 blur-[1px] transition group-hover:rotate-[12deg] ${
            isLarge
              ? "bottom-5 h-[112px] w-[112px] sm:h-[158px] sm:w-[158px] sm:rounded-[48px] lg:h-[170px] lg:w-[170px]"
              : "bottom-5 h-[92px] w-[92px] sm:h-[122px] sm:w-[122px] sm:rounded-[40px]"
          }`}
        />
        <span
          className={`absolute rotate-[-8deg] rounded-[32px] bg-gradient-to-br ${category.tone} shadow-[0_22px_42px_rgba(14,165,233,0.20)] transition group-hover:-rotate-[12deg] group-hover:shadow-[0_28px_52px_rgba(124,58,237,0.22)] ${
            isLarge
              ? "bottom-6 h-[114px] w-[120px] sm:h-[160px] sm:w-[172px] sm:rounded-[52px] lg:h-[172px] lg:w-[184px]"
              : "bottom-6 h-[92px] w-[96px] sm:h-[124px] sm:w-[132px] sm:rounded-[42px]"
          }`}
        />
        <span
          className={`absolute rotate-[-8deg] rounded-[28px] bg-[radial-gradient(circle_at_22%_18%,rgba(255,255,255,0.34)_0_2px,transparent_3px)] bg-[length:15px_15px] opacity-35 ${
            isLarge ? "bottom-7 h-[96px] w-[96px] sm:h-[134px] sm:w-[134px] lg:h-[146px] lg:w-[146px]" : "bottom-7 h-[78px] w-[76px] sm:h-[104px] sm:w-[104px]"
          }`}
        />

        <span
          className={`absolute grid rotate-[-14deg] place-items-center rounded-2xl border border-white/70 bg-white/72 text-[#7C3AED] shadow-[0_12px_24px_rgba(15,23,42,0.12)] backdrop-blur transition group-hover:-translate-y-1 dark:border-white/10 dark:bg-white/12 dark:text-white ${
            isLarge ? "left-0 top-9 h-11 w-11 sm:left-2 sm:top-12 sm:h-14 sm:w-14" : "left-0 top-8 h-10 w-10 sm:left-1 sm:top-10 sm:h-12 sm:w-12"
          }`}
        >
          <AccentOne className={isLarge ? "h-[22px] w-[22px] sm:h-7 sm:w-7" : "h-5 w-5 sm:h-6 sm:w-6"} />
        </span>
        <span
          className={`absolute grid rotate-[12deg] place-items-center rounded-2xl border border-white/60 bg-white/62 text-[#0EA5E9] shadow-[0_10px_22px_rgba(15,23,42,0.10)] backdrop-blur transition group-hover:-translate-y-1 dark:border-white/10 dark:bg-white/10 dark:text-[#C084FC] ${
            isLarge ? "right-0 top-4 h-10 w-10 sm:right-2 sm:top-5 sm:h-[52px] sm:w-[52px]" : "right-0 top-3 h-9 w-9 sm:right-1 sm:top-4 sm:h-11 sm:w-11"
          }`}
        >
          <AccentTwo className={isLarge ? "h-5 w-5 sm:h-6 sm:w-6" : "h-4.5 w-4.5 sm:h-5 sm:w-5"} />
        </span>

        <span
          className={`relative grid place-items-center overflow-hidden border border-white/55 bg-gradient-to-br ${category.tone} text-white shadow-[0_18px_32px_rgba(15,23,42,0.25)] transition group-hover:-translate-y-2 group-hover:rotate-[3deg] ${
            isLarge ? "h-[90px] w-[90px] rounded-[30px] sm:h-[126px] sm:w-[126px] sm:rounded-[40px] lg:h-[138px] lg:w-[138px]" : "h-[72px] w-[72px] rounded-[26px] sm:h-[94px] sm:w-[94px] sm:rounded-[32px]"
          }`}
        >
          <span className={`absolute inset-1 bg-white/14 ${isLarge ? "rounded-[26px] sm:rounded-[36px]" : "rounded-[22px] sm:rounded-[28px]"}`} />
          <Icon className={`relative drop-shadow-[0_10px_18px_rgba(15,23,42,0.30)] ${isLarge ? "h-12 w-12 sm:h-[72px] sm:w-[72px] lg:h-20 lg:w-20" : "h-10 w-10 sm:h-14 sm:w-14"}`} />
          {category.image ? (
            <img
              src={category.image}
              alt={category.title}
              className="absolute inset-0 h-full w-full object-cover"
              loading="lazy"
              onError={(event) => event.currentTarget.remove()}
            />
          ) : null}
        </span>
      </span>
      <span
        className={`block font-black text-slate-950 transition group-hover:text-[#7C3AED] dark:text-white dark:group-hover:text-[#C084FC] ${
          isLarge ? "mt-3 min-h-[58px] max-w-[12rem] text-lg leading-7 sm:mt-4 sm:text-2xl sm:leading-9" : "mt-2 min-h-[44px] max-w-[9rem] text-[15px] leading-6 sm:mt-3 sm:text-lg sm:leading-7"
        }`}
      >
        {category.title}
      </span>
    </motion.button>
  );
}

function ProductCatalogCard({ product, index, onSelect }) {
  const { t } = useTranslation("home");
  const priceLabel = product.displayPriceLabel || product.price || "";

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.3, delay: index * 0.04 }}
      whileHover={{ y: -6 }}
      whileTap={{ scale: 0.98 }}
      onClick={onSelect}
      className="group relative flex h-[190px] w-[138px] min-w-[138px] flex-col overflow-hidden rounded-[18px] border border-slate-100 bg-white text-right shadow-[0_14px_30px_rgba(15,23,42,0.09)] outline-none transition focus-visible:ring-2 focus-visible:ring-[#A855F7] focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-white/10 dark:bg-[#111827] dark:shadow-[0_0_20px_rgba(139,92,246,0.16)] dark:focus-visible:ring-offset-[#050816] sm:h-[212px] sm:w-[158px] sm:min-w-[158px] sm:rounded-[20px]"
    >
      <span className="absolute right-2 top-2 z-20 rounded-full bg-[#7C3AED] px-2 py-0.5 text-[8px] font-black text-white shadow-[0_7px_16px_rgba(124,58,237,0.34)] sm:right-2.5 sm:top-2.5 sm:text-[9px]">
        {t("showcase.catalog")}
      </span>
      <div className={`relative grid h-[112px] shrink-0 place-items-center overflow-hidden bg-gradient-to-br ${product.cover || product.tone || "from-[#7C3AED] via-[#2563EB] to-[#111827]"} sm:h-[128px]`}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(255,255,255,0.35),transparent_28%),linear-gradient(180deg,transparent,rgba(2,6,23,0.42))]" />
        <ProductVisual product={product} />
      </div>
      <div className="flex min-h-0 flex-1 flex-col justify-between p-2.5 sm:p-3">
        <h3 dir="ltr" className="truncate text-center text-[13px] font-black tracking-normal text-slate-950 dark:text-white sm:text-sm">
          {product.name}
        </h3>
        <div className="mt-2 flex min-h-5 items-center justify-center gap-2">
          {priceLabel ? (
            <span dir="ltr" className="truncate text-[11px] font-black text-slate-500 dark:text-[#A78BFA] sm:text-xs">
              {priceLabel}
            </span>
          ) : (
            <span className="truncate text-[10px] font-bold text-slate-400 dark:text-slate-500">{t("showcase.priceUnavailable")}</span>
          )}
          {product.rating ? (
            <span dir="ltr" className="inline-flex shrink-0 items-center gap-0.5 text-[10px] font-black text-slate-600 dark:text-slate-300">
              <Star className="h-3 w-3 fill-[#FBBF24] text-[#FBBF24]" />
              {product.rating}
            </span>
          ) : null}
        </div>
      </div>
    </motion.button>
  );
}

function ProductVisual({ product }) {
  const Icon = typeof product.icon === "function" ? product.icon : iconMap[product.icon] || iconMap.ShoppingBag;

  return (
    <div className={`${product.image ? "h-full w-full" : "h-16 w-16 rounded-full sm:h-[72px] sm:w-[72px]"} relative grid place-items-center overflow-hidden border border-white/20 bg-white/12 text-white shadow-[0_18px_34px_rgba(0,0,0,0.30)] backdrop-blur transition group-hover:scale-105`}>
      <div className="absolute inset-1.5 rounded-full bg-white/10" />
      <Icon className="relative h-9 w-9 drop-shadow-[0_0_18px_rgba(255,255,255,0.45)] sm:h-10 sm:w-10" />
      {product.image ? (
        <img
          src={product.image}
          alt={product.name}
          className="absolute inset-0 h-full w-full object-cover"
          loading="lazy"
          onError={(event) => event.currentTarget.remove()}
        />
      ) : null}
    </div>
  );
}

function CleanEmptyState({ title }) {
  return (
    <div className="rounded-[22px] border border-slate-200 bg-white/80 p-6 text-center text-sm font-black text-slate-500 shadow-[0_14px_34px_rgba(14,165,233,0.08)] dark:border-white/10 dark:bg-[#111827]/80 dark:text-slate-400">
      {title}
    </div>
  );
}
