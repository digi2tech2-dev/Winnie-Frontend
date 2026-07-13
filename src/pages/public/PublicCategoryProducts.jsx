import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { ArrowRight, Search } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { filterChildCategories, filterProductsByCategory, getPublicCatalog } from "../../api/catalog";
import EmptyState from "../../components/EmptyState";
import { CategoriesGrid } from "../../components/home/HomeShowcase";
import HomeProductCard from "../../components/home/HomeProductCard";
import ProductPurchaseModal from "../../components/ProductPurchaseModal";

export default function PublicCategoryProducts() {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation("home");
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
  }, []);

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

  const loginForPurchase = () => {
    setSelectedProduct(null);
    navigate("/login", { state: { from: "/customer/dashboard" } });
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-[1120px] px-4 py-8 sm:px-6 lg:px-8">
        <div className="glass-panel rounded-lg p-8 text-center text-sm font-black text-slate-500 dark:text-slate-400">
          {t("common:states.loadingProducts")}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-[1120px] px-4 py-8 sm:px-6 lg:px-8">
        <EmptyState title={t("products:listing.loadError")} description={error} />
      </div>
    );
  }

  if (!category) {
    return (
      <div className="mx-auto max-w-[1120px] px-4 py-8 sm:px-6 lg:px-8">
        <EmptyState
          title={t("public.categoryNotFoundTitle")}
          description={t("public.categoryNotFoundDescription")}
          actionLabel={t("public.backToCategories")}
          onAction={() => navigate("/categories")}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1120px] space-y-5 px-4 pb-32 pt-5 sm:px-6 sm:pt-7 lg:space-y-7 lg:px-8 lg:pb-16">
      <header className="flex items-center justify-between gap-3 px-1">
        <div className="min-w-0">
          <button
            type="button"
            onClick={() => navigate("/categories")}
            className="mb-2 inline-flex items-center gap-1.5 text-xs font-black text-slate-500 transition hover:text-[#7C3AED] dark:text-[#AAB6CC] dark:hover:text-[#C084FC]"
          >
            <ArrowRight className="h-4 w-4" />
            {t("public.categoriesTitle")}
          </button>
          <h1 className="relative pr-3 text-2xl font-black tracking-normal text-slate-950 dark:text-white sm:text-3xl">
            <span className="absolute right-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-full bg-[linear-gradient(180deg,#38BDF8,#7C3AED)]" />
            {categoryTitle}
          </h1>
          <p className="mt-2 max-w-2xl text-sm font-bold leading-6 text-slate-500 dark:text-[#8A94A7]">
            {t("public.productsInCategoryDescription")}
          </p>
        </div>

        <button
          type="button"
          onClick={() => searchInputRef.current?.focus()}
          className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-sky-100 bg-white text-[#7C3AED] shadow-[0_12px_26px_rgba(14,165,233,0.10)] transition hover:-translate-y-0.5 hover:border-[#C4B5FD] hover:bg-[#F5F3FF] dark:border-[#2B3650] dark:bg-[#111827] dark:text-[#C084FC] dark:hover:border-[#A855F7]/55 dark:hover:bg-[#172033]"
          aria-label={t("public.searchCategory")}
          title={t("common:actions.search")}
        >
          <Search className="h-5 w-5" />
        </button>
      </header>

      <form
        onSubmit={(event) => event.preventDefault()}
        className="flex items-center gap-2 rounded-[24px] border border-sky-100 bg-white p-2 shadow-[0_14px_34px_rgba(14,165,233,0.10)] dark:border-[#2B3650] dark:bg-[#111827]"
      >
        <Search className="mr-2 h-5 w-5 shrink-0 text-[#8B5CF6] dark:text-[#C084FC]" />
        <input
          ref={searchInputRef}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="h-11 min-w-0 flex-1 bg-transparent px-1 text-sm font-bold text-slate-950 outline-none placeholder:text-slate-400 dark:text-white dark:placeholder:text-[#7F8AA0]"
          placeholder={t("public.searchCategoryPlaceholder", { category: categoryTitle })}
        />
        <button
          type="submit"
          className="h-11 rounded-2xl bg-[linear-gradient(135deg,#7C3AED,#38BDF8)] px-4 text-sm font-black text-white shadow-[0_12px_24px_rgba(124,58,237,0.20)] transition hover:-translate-y-0.5"
        >
          {t("common:actions.search")}
        </button>
      </form>

      {childCategories.length ? (
        <section className="px-1" aria-label={t("public.categoriesTitle")}>
          <CategoriesGrid
            categories={childCategories}
            layout="two"
            onCategorySelect={(child) => navigate(`/categories/${child.slug || child.id}`)}
          />
        </section>
      ) : null}

      {products.length ? (
        <section className="marketplace-product-grid px-1">
          {products.map((product, index) => (
            <HomeProductCard
              key={product.id || product.name}
              product={product}
              index={index}
              onSelect={setSelectedProduct}
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
  );
}

