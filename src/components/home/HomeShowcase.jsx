import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import { iconMap } from "../icons";
import productsBanner from "../../../photo/اسلايد 3.jpg";

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
          <div dir="rtl" className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-3 xl:grid-cols-4">
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
      : "grid grid-cols-2 gap-3 py-2 md:gap-4 lg:grid-cols-3 xl:grid-cols-4";

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
  const isLarge = size === "large";

  if (isLarge) {
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
        <span className="relative grid h-40 w-full max-w-[148px] place-items-center transition group-hover:scale-[1.04] sm:h-52 sm:max-w-[210px] lg:h-56 lg:max-w-[230px]">
          <span className={`absolute bottom-6 h-[114px] w-[120px] -rotate-[8deg] rounded-[32px] bg-gradient-to-br ${category.tone} shadow-[0_22px_42px_rgba(14,165,233,0.20)] sm:h-[160px] sm:w-[172px] sm:rounded-[52px] lg:h-[172px] lg:w-[184px]`} />
          <span className={`relative grid h-[90px] w-[90px] place-items-center overflow-hidden rounded-[30px] border border-white/55 bg-gradient-to-br ${category.tone} text-white shadow-[0_18px_32px_rgba(15,23,42,0.25)] transition group-hover:-translate-y-2 sm:h-[126px] sm:w-[126px] sm:rounded-[40px] lg:h-[138px] lg:w-[138px]`}>
            <Icon className="h-12 w-12 sm:h-[72px] sm:w-[72px] lg:h-20 lg:w-20" />
            {category.image ? <img src={category.image} alt={category.title} className="absolute inset-0 h-full w-full object-cover" loading="lazy" onError={(event) => event.currentTarget.remove()} /> : null}
          </span>
        </span>
        <span className="mt-3 min-h-[58px] max-w-[12rem] text-lg font-black leading-7 text-slate-950 transition group-hover:text-[#7C3AED] dark:text-white sm:mt-4 sm:text-2xl sm:leading-9">{category.title}</span>
      </motion.button>
    );
  }

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.32, delay: index * 0.05 }}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.985 }}
      onClick={onSelect}
      aria-label={category.title}
      className="group relative aspect-[4/3] min-w-0 overflow-hidden rounded-[20px] border border-white/50 bg-slate-900 text-center shadow-[0_12px_30px_rgba(15,23,42,0.12)] outline-none transition duration-150 hover:shadow-[0_18px_38px_rgba(76,29,149,0.18)] sm:rounded-[22px]"
    >
      <span className={`absolute inset-0 bg-gradient-to-br ${category.tone}`} />
      <Icon className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 text-white/80 transition duration-300 group-hover:scale-110" />
      {category.image ? (
        <img src={category.image} alt={category.title} className="absolute inset-0 h-full w-full object-cover transition duration-300 group-hover:scale-105" loading="lazy" onError={(event) => event.currentTarget.remove()} />
      ) : null}
      {!category.image ? (
        <>
          <span className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/10 to-transparent" />
          <span className="absolute inset-x-2 bottom-2 line-clamp-2 text-sm font-black leading-5 text-white drop-shadow-md sm:inset-x-3 sm:bottom-3 sm:text-base sm:leading-6">
            {category.title}
          </span>
        </>
      ) : null}
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
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={onSelect}
      className="group relative flex min-w-0 flex-col overflow-hidden rounded-[20px] border border-slate-100 bg-white text-right shadow-[0_12px_28px_rgba(15,23,42,0.08)] outline-none transition duration-150 hover:shadow-[0_18px_38px_rgba(76,29,149,0.14)] focus-visible:ring-2 focus-visible:ring-[#A855F7] focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-white/10 dark:bg-[#111827] dark:shadow-[0_0_20px_rgba(139,92,246,0.16)] dark:focus-visible:ring-offset-[#050816]"
    >
      <span className="absolute right-2 top-2 z-20 rounded-full bg-[#7C3AED] px-2 py-0.5 text-[8px] font-black text-white shadow-[0_7px_16px_rgba(124,58,237,0.34)] sm:right-2.5 sm:top-2.5 sm:text-[9px]">
        {t("showcase.catalog")}
      </span>
      <div className={`relative grid aspect-square shrink-0 place-items-center overflow-hidden rounded-b-[16px] bg-gradient-to-br ${product.cover || product.tone || "from-[#7C3AED] via-[#2563EB] to-[#111827]"}`}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(255,255,255,0.35),transparent_28%),linear-gradient(180deg,transparent,rgba(2,6,23,0.42))]" />
        <ProductVisual product={product} />
      </div>
      <div className="flex min-h-0 flex-1 flex-col justify-between p-2.5 sm:p-3">
        <h3 dir="ltr" className="truncate text-center text-xs font-black tracking-normal text-slate-950 dark:text-white sm:text-sm">
          {product.name}
        </h3>
        <div className="mt-1.5 flex min-h-5 items-center justify-center">
          {priceLabel ? (
            <span dir="ltr" className="truncate text-[11px] font-black text-[#7C3AED] dark:text-[#A78BFA] sm:text-xs">
              {priceLabel}
            </span>
          ) : (
            <span className="truncate text-[10px] font-bold text-slate-400 dark:text-slate-500">{t("showcase.priceUnavailable")}</span>
          )}
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
