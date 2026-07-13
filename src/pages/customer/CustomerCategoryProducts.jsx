import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate, useOutletContext, useParams } from "react-router-dom";
import { filterChildCategories, filterProductsByCategory, getCustomerCatalog } from "../../api/catalog";
import EmptyState from "../../components/EmptyState";
import HomeProductCard from "../../components/home/HomeProductCard";
import { useAuth } from "../../context/AuthContext";
import { useCustomerPurchase } from "../../hooks/useCustomerPurchase";

export default function CustomerCategoryProducts({ basePath = "/customer" }) {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const { t } = useTranslation("products");
  const outletContext = useOutletContext() || {};
  const [query, setQuery] = useState("");
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { openPurchase, purchaseModals } = useCustomerPurchase({
    basePath,
    onSuccess: outletContext.onWalletRefresh,
    token,
  });

  useEffect(() => {
    if (!token) return undefined;

    let cancelled = false;

    const loadCatalog = async () => {
      setLoading(true);
      setError("");

      try {
        const catalog = await getCustomerCatalog(token);
        if (!cancelled) {
          setCategories(catalog.categories);
          setProducts(catalog.products);
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(requestError.userMessage || t("category.loadError"));
          setCategories([]);
          setProducts([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadCatalog();

    return () => {
      cancelled = true;
    };
  }, [token]);

  const category = useMemo(
    () =>
      categories.find((item) =>
        [item.id, item._id, item.slug, item.name, item.title]
          .map((value) => String(value || ""))
          .includes(String(categoryId || "")),
      ),
    [categories, categoryId],
  );

  const categoryProducts = useMemo(() => {
    const cleanQuery = query.trim().toLowerCase();
    const matches = filterProductsByCategory(products, category);

    if (!cleanQuery) return matches;

    return matches.filter((product) =>
      `${product.name} ${product.categoryTitle} ${product.displayPriceLabel}`.toLowerCase().includes(cleanQuery),
    );
  }, [category, products, query]);

  const childCategories = useMemo(
    () => filterChildCategories(categories, category),
    [categories, category],
  );

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="rounded-[20px] border border-violet-100 bg-white/[0.86] p-3 shadow-[0_10px_24px_rgba(76,29,149,0.07)] dark:border-white/10 dark:bg-slate-900/80">
          <div className="h-4 w-28 animate-pulse rounded-full bg-slate-200 dark:bg-white/10" />
          <div className="mt-3 h-9 w-full animate-pulse rounded-2xl bg-slate-100 dark:bg-white/10" />
        </div>
        <ProductGridSkeleton />
      </div>
    );
  }

  if (error) {
    return <EmptyState title={t("category.loadError")} description={error} />;
  }

  if (!category) {
    return (
      <EmptyState
        title={t("category.notFoundTitle")}
        description={t("category.notFoundDescription")}
        actionLabel={t("category.backToCategories")}
        onAction={() => navigate(`${basePath}/categories`)}
      />
    );
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      <header className="rounded-[20px] border border-violet-100 bg-white/[0.88] p-3 shadow-[0_12px_28px_rgba(76,29,149,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/85 sm:p-4">
        <div className="mb-3 min-w-0">
          <button
            type="button"
            onClick={() => navigate(`${basePath}/categories`)}
            className="mb-1.5 inline-flex items-center gap-1.5 text-xs font-black text-slate-500 transition hover:text-[#7C3AED] dark:text-[#AAB6CC] dark:hover:text-[#C084FC]"
          >
            <ArrowRight className="h-4 w-4" />
            {t("common:nav.categories")}
          </button>
          <h1 className="relative pr-3 text-xl font-black tracking-normal text-slate-950 dark:text-white sm:text-2xl">
            <span className="absolute right-0 top-1/2 h-7 w-1 -translate-y-1/2 rounded-full bg-[linear-gradient(180deg,#38BDF8,#7C3AED)]" />
            {category.title}
          </h1>
        </div>

        <form
          onSubmit={(event) => event.preventDefault()}
          className="flex h-10 items-center gap-2 rounded-2xl border border-sky-100 bg-slate-50/80 px-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] dark:border-white/10 dark:bg-slate-950/35"
        >
          <Search className="h-4 w-4 shrink-0 text-[#8B5CF6] dark:text-[#C084FC]" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="h-full min-w-0 flex-1 bg-transparent text-sm font-bold text-slate-950 outline-none placeholder:text-slate-400 dark:text-white dark:placeholder:text-[#7F8AA0]"
            placeholder={t("category.searchPlaceholder", { category: category.title })}
          />
        </form>
      </header>

      {childCategories.length ? (
        <section className="marketplace-product-grid px-1" aria-label={t("common:nav.categories")}>
          {childCategories.map((child, index) => (
            <HomeProductCard
              key={child.id || child.slug || child.name}
              product={child}
              index={index}
              onSelect={(selectedChild) => navigate(`${basePath}/categories/${selectedChild.slug || selectedChild.id}`)}
              reservePriceSpace
              favoriteEnabled={false}
            />
          ))}
        </section>
      ) : null}

      {categoryProducts.length ? (
        <section className="marketplace-product-grid px-1">
          {categoryProducts.map((product, index) => (
            <HomeProductCard
              key={product.id || product._id || product.slug || product.name}
              product={product}
              index={index}
              onSelect={(selectedProduct) => openPurchase(selectedProduct, category)}
              variant="compact"
            />
          ))}
        </section>
      ) : !childCategories.length ? (
        <EmptyState
          title={t("category.noProductsFound")}
          description={t("category.emptyDescription")}
          actionLabel={query ? t("category.clearSearch") : undefined}
          onAction={() => setQuery("")}
        />
      ) : null}
      {purchaseModals}
    </div>
  );
}

function ProductGridSkeleton() {
  return (
    <div className="marketplace-product-grid px-1" aria-hidden="true">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="overflow-hidden rounded-[14px] border border-white/80 bg-white/[0.86] shadow-[0_8px_18px_rgba(76,29,149,0.08)] dark:border-white/10 dark:bg-slate-900/80">
          <div className="aspect-square animate-pulse bg-slate-200 dark:bg-white/10" />
          <div className="space-y-1.5 p-1.5">
            <div className="h-3 animate-pulse rounded-full bg-slate-200 dark:bg-white/10" />
            <div className="h-3 w-2/3 animate-pulse rounded-full bg-slate-200 dark:bg-white/10" />
            <div className="h-7 animate-pulse rounded-[10px] bg-slate-200 dark:bg-white/10" />
          </div>
        </div>
      ))}
    </div>
  );
}
