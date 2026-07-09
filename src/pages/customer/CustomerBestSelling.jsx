import { motion } from "framer-motion";
import { Search, ShoppingCart, ShoppingBag } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useOutletContext } from "react-router-dom";
import { getCustomerProducts, getPublicCatalog } from "../../api/catalog";
import EmptyState from "../../components/EmptyState";
import { iconMap } from "../../components/icons";
import { useAuth } from "../../context/AuthContext";
import { useCustomerPurchase } from "../../hooks/useCustomerPurchase";

const pageSize = 100;

export default function CustomerBestSelling({ loginOnPurchase = false, basePath = "/customer" }) {
  const navigate = useNavigate();
  const { token } = useAuth();
  const { t } = useTranslation("products");
  const outletContext = useOutletContext() || {};
  const [query, setQuery] = useState("");
  const [backendProducts, setBackendProducts] = useState([]);
  const [publicProducts, setPublicProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const useBackendProducts = !loginOnPurchase && Boolean(token);
  const { openPurchase, purchaseModals } = useCustomerPurchase({
    basePath,
    onSuccess: outletContext.onWalletRefresh,
    token,
  });

  useEffect(() => {
    let cancelled = false;

    const loadProducts = async () => {
      setLoading(true);
      setError("");

      try {
        if (useBackendProducts) {
          const result = await getCustomerProducts(token, { page: 1, limit: pageSize });
          if (!cancelled) setBackendProducts(result.products);
          return;
        }

        const result = await getPublicCatalog({ page: 1, limit: pageSize });
        if (!cancelled) setPublicProducts(result.products);
      } catch (requestError) {
        if (!cancelled) {
          setError(requestError.userMessage || t("listing.loadError"));
          setBackendProducts([]);
          setPublicProducts([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadProducts();

    return () => {
      cancelled = true;
    };
  }, [token, useBackendProducts]);

  const sourceProducts = useBackendProducts ? backendProducts : publicProducts;
  const visibleProducts = useMemo(() => {
    const searchValue = query.trim().toLowerCase();
    if (!searchValue) return sourceProducts;

    return sourceProducts.filter((product) =>
      `${product.name} ${product.displayPriceLabel || ""} ${product.categoryTitle || ""}`.toLowerCase().includes(searchValue),
    );
  }, [query, sourceProducts]);

  const handleProductSelect = (product) => {
    if (!useBackendProducts) {
      navigate("/login", { state: { from: `${basePath}/dashboard` } });
      return;
    }

    openPurchase(product, product.categoryTitle || t("listing.catalog"));
  };

  return (
    <div dir="rtl" className="space-y-3 sm:space-y-5">
      <section className="relative overflow-hidden rounded-[18px] border border-[#8B5CF6]/15 bg-[linear-gradient(135deg,rgba(56,189,248,0.16),rgba(255,255,255,0.96)_42%,rgba(236,72,153,0.10))] p-3 shadow-[0_14px_34px_rgba(14,165,233,0.10)] dark:border-white/10 dark:bg-[linear-gradient(135deg,rgba(124,58,237,0.26),rgba(8,13,30,0.98)_45%,rgba(236,72,153,0.12))] dark:shadow-[0_0_22px_rgba(139,92,246,0.16)] sm:rounded-[24px] sm:p-6">
        <div className="absolute left-3 top-3 grid h-11 w-11 place-items-center rounded-[16px] bg-[linear-gradient(135deg,#22D3EE,#7C3AED,#EC4899)] text-white shadow-[0_12px_28px_rgba(124,58,237,0.28)] sm:left-6 sm:top-6 sm:h-16 sm:w-16 sm:rounded-[22px] sm:shadow-[0_18px_44px_rgba(124,58,237,0.34)]">
          <ShoppingBag className="h-5 w-5 sm:h-8 sm:w-8" />
        </div>
        <div className="max-w-[720px] pl-12 sm:pl-0">
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#8B5CF6] dark:text-[#C084FC] sm:text-xs sm:tracking-[0.18em]">{t("listing.eyebrow")}</p>
          <h1 className="mt-1 text-xl font-black text-slate-950 dark:text-white sm:mt-2 sm:text-3xl">{t("listing.title")}</h1>
          <p className="mt-1 text-xs font-bold leading-5 text-slate-500 dark:text-slate-300 sm:mt-2 sm:text-sm sm:leading-6">
            {useBackendProducts
              ? t("listing.authenticatedDescription")
              : t("listing.publicDescription")}
          </p>
        </div>
      </section>

      <section className="rounded-[16px] border border-slate-200 bg-white/90 p-2 shadow-[0_10px_28px_rgba(15,23,42,0.07)] dark:border-white/10 dark:bg-[#0B1220]/95 dark:shadow-[0_0_18px_rgba(139,92,246,0.14)] sm:rounded-[22px] sm:p-3">
        <label className="relative block">
          <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 sm:right-4 sm:h-5 sm:w-5" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("listing.searchPlaceholder")}
            className="h-10 w-full rounded-xl border border-slate-200 bg-white px-9 text-xs font-bold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-[#8B5CF6]/70 focus:ring-4 focus:ring-[#8B5CF6]/15 dark:border-white/10 dark:bg-[#050816] dark:text-white sm:h-12 sm:rounded-2xl sm:px-12 sm:text-sm"
          />
        </label>
      </section>

      {loading ? (
        <div className="glass-panel rounded-lg p-8 text-center text-sm font-black text-slate-500 dark:text-slate-400">
          {t("common:states.loadingProducts")}
        </div>
      ) : error ? (
        <EmptyState title={t("listing.loadError")} description={error} />
      ) : visibleProducts.length ? (
        <section className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
          {visibleProducts.map((product, index) => (
            <ProductGridCard
              key={product.id || product.name}
              actionLabel={useBackendProducts ? t("common:actions.buyNow") : t("listing.logIn")}
              product={product}
              index={index}
              onSelect={() => handleProductSelect(product)}
            />
          ))}
        </section>
      ) : (
        <EmptyState
          title={t("listing.noProductsFound")}
          description={query ? t("listing.noProductsFoundDescription") : t("listing.noActiveProductsDescription")}
          actionLabel={query ? t("listing.clearSearch") : undefined}
          onAction={() => setQuery("")}
        />
      )}
      {purchaseModals}
    </div>
  );
}

function ProductGridCard({ actionLabel, product, index, onSelect }) {
  const { t } = useTranslation("products");
  const Icon = typeof product.icon === "function" ? product.icon : iconMap[product.icon] || iconMap.ShoppingBag;
  const cover = product.cover || product.tone || "from-[#7C3AED] via-[#2563EB] to-[#111827]";
  const priceLabel = product.displayPriceLabel || product.price || "";

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay: index * 0.025 }}
      whileHover={{ y: -5 }}
      whileTap={{ scale: 0.98 }}
      onClick={onSelect}
      className="group flex min-h-[112px] overflow-hidden rounded-[16px] border border-slate-100 bg-white text-right shadow-[0_10px_26px_rgba(15,23,42,0.08)] outline-none transition focus-visible:ring-2 focus-visible:ring-[#A855F7] focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-white/10 dark:bg-[#111827] dark:shadow-[0_0_18px_rgba(139,92,246,0.14)] dark:focus-visible:ring-offset-[#050816] sm:block sm:min-h-0 sm:rounded-[22px] sm:shadow-[0_18px_42px_rgba(15,23,42,0.10)] sm:dark:shadow-[0_0_22px_rgba(139,92,246,0.18)]"
    >
      <div className={`relative grid h-auto min-h-[112px] w-28 shrink-0 place-items-center overflow-hidden bg-gradient-to-br ${cover} sm:h-44 sm:w-full`}>
        <span className="absolute right-2 top-2 rounded-full bg-[#7C3AED] px-2 py-0.5 text-[9px] font-black text-white shadow-[0_8px_18px_rgba(124,58,237,0.30)] sm:right-3 sm:top-3 sm:px-2.5 sm:py-1 sm:text-[10px]">
          {t("listing.catalog")}
        </span>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(255,255,255,0.35),transparent_28%),linear-gradient(180deg,transparent,rgba(2,6,23,0.42))]" />
        <span className="relative grid h-14 w-14 place-items-center rounded-[18px] border border-white/20 bg-white/14 text-white shadow-[0_14px_28px_rgba(0,0,0,0.28)] backdrop-blur transition group-hover:scale-105 sm:h-24 sm:w-24 sm:rounded-[26px] sm:shadow-[0_22px_42px_rgba(0,0,0,0.32)]">
          <span className="absolute inset-1.5 rounded-[14px] bg-white/10 sm:inset-2 sm:rounded-[22px]" />
          {product.image ? (
            <img src={product.image} alt="" className="relative h-10 w-10 rounded-xl object-cover sm:h-16 sm:w-16 sm:rounded-2xl" loading="lazy" />
          ) : (
            <Icon className="relative h-8 w-8 drop-shadow-[0_0_18px_rgba(255,255,255,0.42)] sm:h-14 sm:w-14 sm:drop-shadow-[0_0_22px_rgba(255,255,255,0.45)]" />
          )}
        </span>
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-center p-3 sm:block sm:p-4">
        <h2 dir="ltr" className="line-clamp-2 text-right text-sm font-black leading-5 tracking-normal text-slate-950 dark:text-white sm:truncate sm:text-center sm:text-lg">
          {product.name}
        </h2>
        <div className="mt-1.5 flex items-center justify-start sm:mt-3 sm:justify-center">
          {priceLabel ? (
            <span dir="ltr" className="truncate text-xs font-black text-slate-500 dark:text-[#A78BFA] sm:text-base">
              {priceLabel}
            </span>
          ) : (
            <span className="truncate text-xs font-black text-slate-400 dark:text-slate-500 sm:text-sm">{t("listing.loginForPricing")}</span>
          )}
        </div>
        <span className="mt-2 inline-flex h-8 w-full items-center justify-center gap-1.5 rounded-lg bg-slate-100 text-[11px] font-black text-slate-500 dark:bg-white/10 dark:text-white/60 sm:mt-3 sm:h-9 sm:gap-2 sm:rounded-xl sm:text-xs">
          <ShoppingCart className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          {actionLabel}
        </span>
      </div>
    </motion.button>
  );
}
