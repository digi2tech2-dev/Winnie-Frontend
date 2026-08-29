import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { ArrowRight, Search } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { filterChildCategories, filterProductsByCategory, getPublicCatalog } from "../../api/catalog";
import EmptyState from "../../components/EmptyState";
import HomeProductCard from "../../components/home/HomeProductCard";
import ProductPurchaseModal from "../../components/ProductPurchaseModal";
import { canPurchaseProduct } from "../../utils/productAvailability";
import Seo from "../../components/Seo";
import { buildBreadcrumbSchema, buildItemListSchema, cleanSeoText, getProductPath } from "../../utils/seo";

export default function PublicCategoryProducts() {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation("home");
  const searchInputRef = useRef(null);
  const [query, setQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [catalog, setCatalog] = useState({ categories: [], products: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadCatalog = async () => {
      setLoading(true);
      setError("");

      try {
        const result = await getPublicCatalog({ page: 1, limit: 100 });
        if (!cancelled) {
          setCatalog({
            categories: result.categories,
            products: result.products,
          });
        }
      } catch (requestError) {
        if (!cancelled) {
          setCatalog({ categories: [], products: [] });
          setError(requestError.userMessage || t("products:listing.loadError"));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadCatalog();

    return () => {
      cancelled = true;
    };
  }, [t]);

  const category = useMemo(
    () =>
      catalog.categories.find((item) =>
        [item.id, item._id, item.slug, item.name, item.title].some((value) => String(value || "") === String(categoryId || "")),
      ),
    [catalog.categories, categoryId],
  );
  const categoryTitle = category?.title || t("showcase.categories");

  const products = useMemo(() => {
    if (!category) return [];

    const cleanQuery = query.trim().toLowerCase();
    const categoryProducts = filterProductsByCategory(catalog.products, category);

    if (!cleanQuery) return categoryProducts;

    return categoryProducts.filter((product) =>
      `${product.name} ${product.categoryTitle || ""}`.toLowerCase().includes(cleanQuery),
    );
  }, [catalog.products, category, query]);

  const childCategories = useMemo(
    () => filterChildCategories(catalog.categories, category),
    [catalog.categories, category],
  );
  const isArabic = i18n.language?.startsWith("ar");
  const categoryPath = `/categories/${category?.slug || category?.id || categoryId || ""}`;
  const seoTitle = category
    ? `${categoryTitle} | ${isArabic ? "شحن وبطاقات رقمية" : "Digital Top-Ups"} | Winnie HUB`
    : `${t("public.categoriesTitle")} | Winnie HUB`;
  const seoDescription = category
    ? cleanSeoText(category.subtitle || category.description || (
      isArabic
        ? `تصفح منتجات ${categoryTitle} المتاحة للشحن والشراء بسرعة وأمان عبر Winnie HUB.`
        : `Browse ${categoryTitle} products available for fast and secure purchase through Winnie HUB.`
    ))
    : undefined;
  const seoSchemas = useMemo(() => category ? [
    buildBreadcrumbSchema([
      { name: isArabic ? "الرئيسية" : "Home", path: "/" },
      { name: t("public.categoriesTitle"), path: "/categories" },
      { name: categoryTitle, path: categoryPath },
    ]),
    ...(products.length ? [buildItemListSchema(products, categoryTitle)] : []),
  ] : [], [category, categoryPath, categoryTitle, isArabic, products, t]);
  const seoNode = (
    <Seo
      title={seoTitle}
      description={seoDescription}
      path={categoryPath}
      image={category?.image}
      noindex={!loading && !category}
      schemas={seoSchemas}
    />
  );

  const loginForPurchase = () => {
    setSelectedProduct(null);
    navigate("/login", { state: { from: "/customer/dashboard" } });
  };
  const selectProduct = (product) => {
    if (!canPurchaseProduct(product)) return;
    setSelectedProduct(product);
  };

  if (loading) {
    return (
      <>
        {seoNode}
        <div className="mx-auto max-w-[1120px] px-4 py-8 sm:px-6 lg:px-8">
          <div className="glass-panel rounded-lg p-8 text-center text-sm font-black text-slate-500 dark:text-slate-400">
            {t("common:states.loadingProducts")}
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        {seoNode}
        <div className="mx-auto max-w-[1120px] px-4 py-8 sm:px-6 lg:px-8">
          <EmptyState title={t("products:listing.loadError")} description={error} />
        </div>
      </>
    );
  }

  if (!category) {
    return (
      <>
        {seoNode}
        <div className="mx-auto max-w-[1120px] px-4 py-8 sm:px-6 lg:px-8">
          <EmptyState
            title={t("public.categoryNotFoundTitle")}
            description={t("public.categoryNotFoundDescription")}
            actionLabel={t("public.backToCategories")}
            onAction={() => navigate("/categories")}
          />
        </div>
      </>
    );
  }

  return (
    <>
      {seoNode}
      <div dir={isArabic ? "rtl" : "ltr"} className="category-products-page mx-auto max-w-[1120px] space-y-5 px-4 pb-32 pt-5 sm:px-6 sm:pt-7 lg:space-y-7 lg:px-8 lg:pb-16">
      <header className="category-page-hero relative isolate overflow-hidden rounded-[30px] border border-violet-100/90 bg-[linear-gradient(135deg,#F5F3FF_0%,#FFFFFF_48%,#ECFEFF_100%)] p-4 shadow-[0_20px_55px_rgba(76,29,149,0.10)] dark:border-white/10 dark:bg-[linear-gradient(135deg,#17132d,#0d172b_55%,#102536)] dark:shadow-[0_20px_55px_rgba(2,6,23,0.30)] sm:p-6">
        <span aria-hidden="true" className="pointer-events-none absolute -left-16 -top-20 -z-10 h-48 w-48 rounded-full bg-fuchsia-300/25 blur-3xl dark:bg-violet-500/15" />
        <span aria-hidden="true" className="pointer-events-none absolute -bottom-24 -right-10 -z-10 h-52 w-52 rounded-full bg-cyan-300/25 blur-3xl dark:bg-cyan-400/10" />
        <button
          type="button"
          onClick={() => navigate("/categories")}
          className="inline-flex items-center gap-1.5 rounded-full border border-violet-200/80 bg-white/75 px-3 py-1.5 text-[11px] font-black text-violet-700 shadow-sm transition hover:-translate-y-0.5 hover:border-violet-300 dark:border-white/10 dark:bg-white/[0.06] dark:text-violet-200"
        >
          <ArrowRight className="h-3.5 w-3.5" />
          {t("public.categoriesTitle")}
        </button>
        <div className="mt-4 flex items-center gap-3 sm:gap-4">
          <div className="category-page-hero__icon grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-[22px] border border-white/80 bg-white/80 p-2 shadow-[0_12px_28px_rgba(124,58,237,0.16)] dark:border-white/10 dark:bg-white/[0.08] sm:h-20 sm:w-20">
            {category.image ? <img src={category.image} alt="" className="h-full w-full object-contain" loading="eager" decoding="async" /> : <span className="text-2xl font-black text-violet-600 dark:text-violet-300">#</span>}
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-violet-600 dark:text-violet-300">Winnie HUB · {t("public.categoriesTitle")}</p>
            <h1 className="mt-1 truncate text-2xl font-black tracking-tight text-slate-950 dark:text-white sm:text-3xl">{categoryTitle}</h1>
            <p className="mt-1.5 max-w-2xl text-xs font-bold leading-5 text-slate-600 dark:text-slate-300 sm:text-sm">
              {t("public.productsInCategoryDescription")}
            </p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2 text-[11px] font-black text-slate-500 dark:text-slate-300">
          <span className="rounded-full border border-white/80 bg-white/70 px-3 py-1.5 shadow-sm dark:border-white/10 dark:bg-white/[0.06]">{products.length} {t("public.products") || "منتج"}</span>
          <span className="rounded-full border border-emerald-200/80 bg-emerald-50/75 px-3 py-1.5 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300">● {t("public.activeProducts", { defaultValue: "منتجات نشطة" })}</span>
        </div>
      </header>

      <form
        onSubmit={(event) => event.preventDefault()}
        className="category-page-search flex items-center gap-2 rounded-[22px] border border-sky-100/90 bg-white/80 p-2 shadow-[0_14px_35px_rgba(14,165,233,0.10)] dark:border-white/10 dark:bg-[#0d1525]/90 dark:shadow-[0_14px_35px_rgba(2,6,23,0.22)]"
      >
        <label className="site-filter-search min-w-0 flex-1">
          <span className="site-filter-search-icon"><Search /></span>
          <input
            ref={searchInputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="site-filter-search-input"
            placeholder={t("public.searchCategoryPlaceholder", { category: categoryTitle })}
          />
        </label>
        <button
          type="submit"
          onClick={() => searchInputRef.current?.focus()}
          className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-2xl bg-[linear-gradient(135deg,#7C3AED,#38BDF8)] px-4 text-sm font-black text-white shadow-[0_10px_22px_rgba(124,58,237,0.22)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_28px_rgba(124,58,237,0.30)]"
        >
          <Search className="h-4 w-4" />
          <span className="hidden sm:inline">{t("common:actions.search")}</span>
        </button>
      </form>

      {childCategories.length ? (
        <section className="marketplace-product-grid px-1" aria-label={t("public.categoriesTitle")}>
          {childCategories.map((child, index) => (
            <HomeProductCard
              key={child.id || child.slug || child.name}
              product={child}
              index={index}
              onSelect={(selectedChild) => navigate(`/categories/${selectedChild.slug || selectedChild.id}`)}
              href={`/categories/${child.slug || child.id}`}
              reservePriceSpace
              favoriteEnabled={false}
            />
          ))}
        </section>
      ) : null}

      {products.length ? (
        <section className="marketplace-product-grid px-1">
          {products.map((product, index) => (
            <HomeProductCard
              key={product.id || product.name}
              product={product}
              index={index}
              onSelect={selectProduct}
              href={getProductPath(product)}
            />
          ))}
        </section>
      ) : !childCategories.length ? (
        <EmptyState
          title={query ? t("public.noProductsFound") : t("public.noProductsYet")}
          description={query ? t("public.clearSearchDescription") : t("public.categoryEmptyDescription")}
          actionLabel={query ? t("public.clearSearch") : undefined}
          onAction={() => setQuery("")}
        />
      ) : null}

      <AnimatePresence>
        {selectedProduct && (
          <ProductPurchaseModal
            product={selectedProduct}
            category={category}
            onClose={() => setSelectedProduct(null)}
            onConfirm={loginForPurchase}
            requireAccountId={false}
          />
        )}
      </AnimatePresence>
      </div>
    </>
  );
}

