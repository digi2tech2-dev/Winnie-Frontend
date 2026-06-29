import { motion } from "framer-motion";
import { Search, ShoppingCart, Star, TrendingUp } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCustomerProducts } from "../../api/catalog";
import EmptyState from "../../components/EmptyState";
import { iconMap } from "../../components/icons";
import { useAuth } from "../../context/AuthContext";
import { bestSellingProductsAll } from "../../data/homeContent";
import { useCustomerPurchase } from "../../hooks/useCustomerPurchase";

const pageSize = 100;

export default function CustomerBestSelling({ loginOnPurchase = false, basePath = "/customer" }) {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [query, setQuery] = useState("");
  const [backendProducts, setBackendProducts] = useState([]);
  const [loading, setLoading] = useState(!loginOnPurchase);
  const [error, setError] = useState("");
  const useBackendProducts = !loginOnPurchase && Boolean(token);
  const { openPurchase, purchaseModals } = useCustomerPurchase({ basePath, token });

  useEffect(() => {
    if (!useBackendProducts) {
      setLoading(false);
      return undefined;
    }

    let cancelled = false;

    const loadProducts = async () => {
      setLoading(true);
      setError("");

      try {
        const result = await getCustomerProducts(token, { page: 1, limit: pageSize });
        if (!cancelled) setBackendProducts(result.products);
      } catch (requestError) {
        if (!cancelled) {
          setError(requestError.userMessage || "Unable to load products.");
          setBackendProducts([]);
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

  const sourceProducts = useBackendProducts ? backendProducts : bestSellingProductsAll;
  const visibleProducts = useMemo(() => {
    const searchValue = query.trim().toLowerCase();
    if (!searchValue) return sourceProducts;

    return sourceProducts.filter((product) =>
      `${product.name} ${product.price} ${product.displayPriceLabel || ""} ${product.rating || ""} ${product.categoryTitle || ""}`
        .toLowerCase()
        .includes(searchValue),
    );
  }, [query, sourceProducts]);

  const handleProductSelect = (product) => {
    if (loginOnPurchase) {
      navigate("/login", { state: { from: `${basePath}/dashboard` } });
      return;
    }

    openPurchase(product, product.categoryTitle || "Customer catalog");
  };

  return (
    <div dir="rtl" className="space-y-5">
      <section className="relative overflow-hidden rounded-[24px] border border-[#8B5CF6]/15 bg-[linear-gradient(135deg,rgba(56,189,248,0.18),rgba(255,255,255,0.96)_38%,rgba(236,72,153,0.12))] p-5 shadow-[0_22px_58px_rgba(14,165,233,0.12)] dark:border-white/10 dark:bg-[linear-gradient(135deg,rgba(124,58,237,0.30),rgba(8,13,30,0.98)_42%,rgba(236,72,153,0.14))] dark:shadow-[0_0_28px_rgba(139,92,246,0.20)] sm:p-6">
        <div className="absolute left-6 top-6 grid h-16 w-16 place-items-center rounded-[22px] bg-[linear-gradient(135deg,#22D3EE,#7C3AED,#EC4899)] text-white shadow-[0_18px_44px_rgba(124,58,237,0.34)]">
          <TrendingUp className="h-8 w-8" />
        </div>
        <div className="max-w-[720px]">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#8B5CF6] dark:text-[#C084FC]">Winnie Fun</p>
          <h1 className="mt-2 text-3xl font-black text-slate-950 dark:text-white">{useBackendProducts ? "Customer catalog" : "Best selling"}</h1>
          <p className="mt-2 text-sm font-bold leading-6 text-slate-500 dark:text-slate-300">
            {useBackendProducts
              ? "Authenticated product prices are loaded from the backend. Orders stay read-only in this phase."
              : "Browse popular services and log in before placing real orders."}
          </p>
        </div>
      </section>

      <section className="rounded-[22px] border border-slate-200 bg-white/90 p-3 shadow-[0_16px_42px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-[#0B1220]/95 dark:shadow-[0_0_22px_rgba(139,92,246,0.16)]">
        <label className="relative block">
          <Search className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search products..."
            className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-12 text-sm font-bold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-[#8B5CF6]/70 focus:ring-4 focus:ring-[#8B5CF6]/15 dark:border-white/10 dark:bg-[#050816] dark:text-white"
          />
        </label>
      </section>

      {loading ? (
        <div className="glass-panel rounded-lg p-8 text-center text-sm font-black text-slate-500 dark:text-slate-400">
          Loading products...
        </div>
      ) : error ? (
        <EmptyState title="Unable to load products" description={error} />
      ) : visibleProducts.length ? (
        <section className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
          {visibleProducts.map((product, index) => (
            <BestSellingGridCard
              key={product.id || product.name}
              actionLabel={useBackendProducts ? "Buy now" : "Log in"}
              product={product}
              index={index}
              onSelect={() => handleProductSelect(product)}
            />
          ))}
        </section>
      ) : (
        <EmptyState
          title="No products found"
          description={query ? "Clear the search to view all loaded products." : "No active backend products are available yet."}
          actionLabel={query ? "Clear search" : undefined}
          onAction={() => setQuery("")}
        />
      )}
      {purchaseModals}
    </div>
  );
}

function BestSellingGridCard({ actionLabel, product, index, onSelect }) {
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
      className="group overflow-hidden rounded-[22px] border border-slate-100 bg-white text-right shadow-[0_18px_42px_rgba(15,23,42,0.10)] outline-none transition focus-visible:ring-2 focus-visible:ring-[#A855F7] focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-white/10 dark:bg-[#111827] dark:shadow-[0_0_22px_rgba(139,92,246,0.18)] dark:focus-visible:ring-offset-[#050816]"
    >
      <div className={`relative grid h-36 place-items-center overflow-hidden bg-gradient-to-br ${cover} sm:h-44`}>
        <span className="absolute right-3 top-3 rounded-full bg-[#7C3AED] px-2.5 py-1 text-[10px] font-black text-white shadow-[0_8px_18px_rgba(124,58,237,0.34)]">
          Catalog
        </span>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(255,255,255,0.35),transparent_28%),linear-gradient(180deg,transparent,rgba(2,6,23,0.42))]" />
        <span className="relative grid h-20 w-20 place-items-center rounded-[26px] border border-white/20 bg-white/14 text-white shadow-[0_22px_42px_rgba(0,0,0,0.32)] backdrop-blur transition group-hover:scale-105 sm:h-24 sm:w-24">
          <span className="absolute inset-2 rounded-[22px] bg-white/10" />
          <Icon className="relative h-11 w-11 drop-shadow-[0_0_22px_rgba(255,255,255,0.45)] sm:h-14 sm:w-14" />
        </span>
      </div>
      <div className="p-3 sm:p-4">
        <h2 dir="ltr" className="truncate text-center text-base font-black tracking-normal text-slate-950 dark:text-white sm:text-lg">
          {product.name}
        </h2>
        <div className="mt-3 flex items-center justify-between gap-2">
          <span dir="ltr" className="truncate text-sm font-black text-slate-500 dark:text-[#A78BFA] sm:text-base">{priceLabel}</span>
          <span dir="ltr" className="inline-flex items-center gap-1 text-sm font-black text-slate-600 dark:text-slate-300">
            <Star className="h-4 w-4 fill-[#FBBF24] text-[#FBBF24]" />
            {product.rating || "4.8"}
          </span>
        </div>
        <span className="mt-3 inline-flex h-9 w-full items-center justify-center gap-2 rounded-xl bg-slate-100 text-xs font-black text-slate-500 dark:bg-white/10 dark:text-white/60">
          <ShoppingCart className="h-4 w-4" />
          {actionLabel}
        </span>
      </div>
    </motion.button>
  );
}
