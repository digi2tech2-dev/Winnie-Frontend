import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate, useOutletContext, useParams } from "react-router-dom";
import { filterChildCategories, filterProductsByCategory, getCustomerCatalog } from "../../api/catalog";
import EmptyState from "../../components/EmptyState";
import { CategoriesGrid } from "../../components/home/HomeShowcase";
import { iconMap } from "../../components/icons";
import { useAuth } from "../../context/AuthContext";
import { useCustomerPurchase } from "../../hooks/useCustomerPurchase";

export default function CustomerCategoryProducts({ basePath = "/customer" }) {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const searchInputRef = useRef(null);
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
      <div className="glass-panel rounded-lg p-8 text-center text-sm font-black text-slate-500 dark:text-slate-400">
        {t("category.loading")}
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
    <div className="space-y-5 lg:space-y-7">
      <header className="flex items-center justify-between gap-3 px-1">
        <div className="min-w-0">
          <button
            type="button"
            onClick={() => navigate(`${basePath}/categories`)}
            className="mb-2 inline-flex items-center gap-1.5 text-xs font-black text-slate-500 transition hover:text-[#7C3AED] dark:text-[#AAB6CC] dark:hover:text-[#C084FC]"
          >
            <ArrowRight className="h-4 w-4" />
            {t("common:nav.categories")}
          </button>
          <h1 className="relative pr-3 text-2xl font-black tracking-normal text-slate-950 dark:text-white sm:text-3xl">
            <span className="absolute right-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-full bg-[linear-gradient(180deg,#38BDF8,#7C3AED)]" />
            {category.title}
          </h1>
        </div>

        <button
          type="button"
          onClick={() => searchInputRef.current?.focus()}
          className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-sky-100 bg-white text-[#7C3AED] shadow-[0_12px_26px_rgba(14,165,233,0.10)] transition hover:-translate-y-0.5 hover:border-[#C4B5FD] hover:bg-[#F5F3FF] dark:border-[#2B3650] dark:bg-[#111827] dark:text-[#C084FC] dark:hover:border-[#A855F7]/55 dark:hover:bg-[#172033]"
          aria-label={t("category.searchCategory")}
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
          placeholder={t("category.searchPlaceholder", { category: category.title })}
        />
        <button
          type="submit"
          className="h-11 rounded-2xl bg-[linear-gradient(135deg,#7C3AED,#38BDF8)] px-4 text-sm font-black text-white shadow-[0_12px_24px_rgba(124,58,237,0.20)] transition hover:-translate-y-0.5"
        >
          {t("common:actions.search")}
        </button>
      </form>

      {childCategories.length ? (
        <section className="px-1" aria-label={t("common:nav.categories")}>
          <CategoriesGrid
            categories={childCategories}
            layout="two"
            onCategorySelect={(child) => navigate(`${basePath}/categories/${child.slug || child.id}`)}
          />
        </section>
      ) : null}

      {categoryProducts.length ? (
        <section className="grid grid-cols-3 gap-x-2 gap-y-6 px-1 sm:gap-x-5 sm:gap-y-8">
          {categoryProducts.map((product, index) => (
            <ProductTile key={product.id} product={product} index={index} onSelect={() => openPurchase(product, category)} />
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

function ProductTile({ product, index, onSelect }) {
  const ProductIcon = iconMap[product.icon] || iconMap.ShoppingBag;

  return (
    <button
      type="button"
      onClick={onSelect}
      className="group flex min-w-0 flex-col items-center text-center outline-none"
      style={{ animationDelay: `${Math.min(index * 35, 220)}ms` }}
    >
      <span className="relative grid h-24 w-full max-w-[96px] place-items-center transition group-hover:scale-[1.04] sm:h-36 sm:max-w-[144px] lg:h-40 lg:max-w-[160px]">
        <span className="absolute bottom-2 h-5 w-20 rounded-full bg-slate-950/12 blur-md transition group-hover:bg-[#7C3AED]/16 dark:bg-black/35 sm:h-7 sm:w-32" />
        <span className={`absolute bottom-4 h-[74px] w-[78px] rotate-[-8deg] rounded-[24px] bg-gradient-to-br ${product.tone} shadow-[0_18px_34px_rgba(15,23,42,0.20)] transition group-hover:-rotate-[12deg] sm:h-[112px] sm:w-[120px] sm:rounded-[36px] lg:h-[124px] lg:w-[132px]`} />
        <span className="absolute bottom-5 h-[62px] w-[62px] rotate-[-8deg] rounded-[20px] bg-[radial-gradient(circle_at_22%_18%,rgba(255,255,255,0.34)_0_2px,transparent_3px)] bg-[length:14px_14px] opacity-35 sm:h-[94px] sm:w-[94px]" />
        <span className={`relative grid h-[58px] w-[58px] place-items-center rounded-[20px] border border-white/55 bg-gradient-to-br ${product.tone} text-white shadow-[0_16px_28px_rgba(15,23,42,0.25)] transition group-hover:-translate-y-2 group-hover:rotate-[3deg] sm:h-[88px] sm:w-[88px] sm:rounded-[28px] lg:h-[98px] lg:w-[98px]`}>
          <span className="absolute inset-1 rounded-[16px] bg-white/14 sm:rounded-[24px]" />
          <ProductIcon className="relative h-8 w-8 drop-shadow-[0_10px_18px_rgba(15,23,42,0.30)] sm:h-12 sm:w-12 lg:h-14 lg:w-14" />
        </span>
      </span>
      <span className="mt-2 block min-h-[40px] max-w-[7.5rem] text-[12px] font-black leading-5 text-slate-950 transition group-hover:text-[#7C3AED] dark:text-white dark:group-hover:text-[#C084FC] sm:mt-3 sm:max-w-[10rem] sm:text-base sm:leading-7">
        {product.name}
      </span>
      <span dir="ltr" className="mt-1 block max-w-[8rem] truncate text-[11px] font-black text-[#8B5CF6] dark:text-[#C084FC] sm:max-w-[10rem] sm:text-sm">
        {product.displayPriceLabel}
      </span>
    </button>
  );
}
