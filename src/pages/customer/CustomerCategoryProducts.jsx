import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate, useOutletContext, useParams } from "react-router-dom";
import { filterChildCategories, getCustomerCatalog } from "../../api/catalog";
import EmptyState from "../../components/EmptyState";
import HomeProductCard from "../../components/home/HomeProductCard";
import { useAuth } from "../../context/AuthContext";
import { useCustomerPurchase } from "../../hooks/useCustomerPurchase";

const CATEGORY_PAGE_SIZE = 24;
const SEARCH_DEBOUNCE_MS = 300;
const EMPTY_PAGINATION = { page: 1, pages: 0, total: 0 };

export default function CustomerCategoryProducts({ basePath = "/customer" }) {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const { t } = useTranslation("products");
  const outletContext = useOutletContext() || {};
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState(EMPTY_PAGINATION);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [initialError, setInitialError] = useState("");
  const [loadMoreError, setLoadMoreError] = useState("");
  const [failedPage, setFailedPage] = useState(null);
  const requestVersionRef = useRef(0);
  const previousCategoryRef = useRef(categoryId);
  const hasLoadedCategoriesRef = useRef(false);
  const selectedCategoryRef = useRef(categoryId);
  selectedCategoryRef.current = categoryId;
  const { openPurchase, purchaseModals } = useCustomerPurchase({
    basePath,
    onSuccess: outletContext.onWalletRefresh,
    token,
  });

  useEffect(() => {
    const timeoutId = setTimeout(() => setDebouncedQuery(query.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timeoutId);
  }, [query]);

  // Invalidate the previous request immediately. The fetch effect below waits
  // for the debounce window, while this prevents an old response from painting
  // results during that window.
  useEffect(() => {
    const categoryChanged = previousCategoryRef.current !== categoryId;
    previousCategoryRef.current = categoryId;
    requestVersionRef.current += 1;
    setLoading(categoryChanged || !hasLoadedCategoriesRef.current);
    setSearchLoading(!categoryChanged && hasLoadedCategoriesRef.current);
    setLoadingMore(false);
    setProducts([]);
    setPagination(EMPTY_PAGINATION);
    setInitialError("");
    setLoadMoreError("");
    setFailedPage(null);
  }, [categoryId, query]);

  useEffect(() => {
    if (!token) return undefined;

    let cancelled = false;
    const requestVersion = requestVersionRef.current;

    const loadCatalog = async () => {
      try {
        const catalog = await getCustomerCatalog(token, {
          category: categoryId,
          ...(debouncedQuery ? { search: debouncedQuery } : {}),
          limit: CATEGORY_PAGE_SIZE,
          page: 1,
        });
        if (!cancelled && requestVersion === requestVersionRef.current) {
          hasLoadedCategoriesRef.current = true;
          setCategories(catalog.categories);
          setProducts(catalog.products);
          setPagination(catalog.pagination);
        }
      } catch (requestError) {
        if (!cancelled && requestVersion === requestVersionRef.current) {
          setInitialError(requestError.userMessage || t("category.loadError"));
          setCategories([]);
          setProducts([]);
          setPagination(EMPTY_PAGINATION);
        }
      } finally {
        if (!cancelled && requestVersion === requestVersionRef.current) {
          setLoading(false);
          setSearchLoading(false);
        }
      }
    };

    void loadCatalog();

    return () => {
      cancelled = true;
    };
  }, [categoryId, debouncedQuery, t, token]);

  const category = useMemo(
    () =>
      categories.find((item) =>
        [item.id, item._id, item.slug, item.name, item.title]
          .map((value) => String(value || ""))
          .includes(String(categoryId || "")),
      ),
    [categories, categoryId],
  );

  const categoryProducts = products;

  const childCategories = useMemo(
    () => filterChildCategories(categories, category),
    [categories, category],
  );

  const hasMoreProducts = pagination.page < pagination.pages;

  const loadMoreProducts = async (requestedPage = pagination.page + 1) => {
    if (!token || loadingMore || requestedPage < 1) return;
    if (!hasMoreProducts && requestedPage !== failedPage) return;
    if (requestedPage !== pagination.page + 1) return;

    const requestedCategory = categoryId;
    const requestedSearch = debouncedQuery;
    const requestVersion = requestVersionRef.current;
    setLoadingMore(true);
    setLoadMoreError("");
    setFailedPage(null);
    try {
      const catalog = await getCustomerCatalog(token, {
        category: requestedCategory,
        ...(requestedSearch ? { search: requestedSearch } : {}),
        limit: CATEGORY_PAGE_SIZE,
        page: requestedPage,
      });
      if (
        selectedCategoryRef.current !== requestedCategory
        || requestVersion !== requestVersionRef.current
      ) return;
      setProducts((currentProducts) => {
        const currentIds = new Set(currentProducts.map((product) => String(product.id || product._id)));
        return [...currentProducts, ...catalog.products.filter((product) => !currentIds.has(String(product.id || product._id)))];
      });
      setPagination(catalog.pagination);
    } catch (requestError) {
      if (
        selectedCategoryRef.current === requestedCategory
        && requestVersion === requestVersionRef.current
      ) {
        setLoadMoreError(requestError.userMessage || t("category.loadError"));
        setFailedPage(requestedPage);
      }
    } finally {
      if (
        selectedCategoryRef.current === requestedCategory
        && requestVersion === requestVersionRef.current
      ) setLoadingMore(false);
    }
  };

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

  if (initialError) {
    return <EmptyState title={t("category.loadError")} description={initialError} />;
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
          className="site-filter-search"
        >
          <span className="site-filter-search-icon"><Search /></span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="site-filter-search-input"
            placeholder={t("category.searchPlaceholder", { category: category.title })}
          />
        </form>
      </header>

      {!searchLoading && childCategories.length ? (
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

      {searchLoading ? (
        <ProductGridSkeleton />
      ) : categoryProducts.length ? (
        <>
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
          {loadMoreError ? (
            <div role="alert" className="flex flex-wrap items-center justify-center gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-200">
              <span>{loadMoreError}</span>
              <button
                type="button"
                onClick={() => loadMoreProducts(failedPage)}
                disabled={loadingMore || !failedPage}
                className="rounded-lg border border-rose-300 px-3 py-1.5 font-black transition hover:bg-rose-100 disabled:cursor-wait disabled:opacity-60 dark:border-rose-300/40 dark:hover:bg-rose-400/10"
              >
                {loadingMore ? t("common:states.loading") : t("common:actions.retry")}
              </button>
            </div>
          ) : hasMoreProducts ? (
            <div className="flex justify-center px-1">
              <button
                type="button"
                onClick={() => loadMoreProducts()}
                disabled={loadingMore}
                className="rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-black text-white transition hover:bg-violet-700 disabled:cursor-wait disabled:opacity-60"
              >
                {loadingMore ? t("common:states.loading") : t("common:actions.loadMore")}
              </button>
            </div>
          ) : null}
        </>
      ) : query.trim() || !childCategories.length ? (
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
