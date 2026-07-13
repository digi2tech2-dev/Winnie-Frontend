import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useOutletContext } from "react-router-dom";
import { getCustomerProducts } from "../../api/catalog";
import EmptyState from "../../components/EmptyState";
import HomeProductCard from "../../components/home/HomeProductCard";
import { useAuth } from "../../context/AuthContext";
import { useCustomerPurchase } from "../../hooks/useCustomerPurchase";
import { sortProductsByNewest } from "../../utils/recentProducts";

const pageSize = 100;

export default function CustomerRecentlyAdded({ basePath = "/customer" }) {
  const { token } = useAuth();
  const { t, i18n } = useTranslation("home");
  const outletContext = useOutletContext() || {};
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

    const loadProducts = async () => {
      setLoading(true);
      setError("");
      try {
        const result = await getCustomerProducts(token, { page: 1, limit: pageSize });
        if (!cancelled) setProducts(result.products);
      } catch (requestError) {
        if (!cancelled) {
          setProducts([]);
          setError(requestError.userMessage || t("recentlyAdded.loadError"));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadProducts();
    return () => { cancelled = true; };
  }, [token, t]);

  const recentProducts = useMemo(
    () => sortProductsByNewest(products.filter((product) => product?.isActive !== false && product?.visibleInStore !== false && product?.visible !== false)),
    [products],
  );
  const selectProduct = (product) => openPurchase(product, product.categoryTitle || t("dashboard.customerCatalog"));

  return (
    <div dir={i18n.language?.startsWith("ar") ? "rtl" : "ltr"} className="space-y-6">
      <header>
        <h1 className="relative text-2xl font-black text-slate-950 dark:text-white sm:text-3xl ltr:pl-3 rtl:pr-3">
          <span className="absolute top-1/2 h-9 w-1 -translate-y-1/2 rounded-full bg-[linear-gradient(180deg,#ec4899,#7c3aed,#22d3ee)] ltr:left-0 rtl:right-0" />
          {t("recentlyAdded.title")}
        </h1>
        <p className="mt-2 text-sm font-bold text-slate-500 dark:text-slate-400">{t("recentlyAdded.subtitle")}</p>
      </header>

      {loading ? (
        <div className="glass-panel rounded-lg p-8 text-center text-sm font-black text-slate-500 dark:text-slate-400">{t("common:states.loadingProducts")}</div>
      ) : error ? (
        <EmptyState title={t("recentlyAdded.loadError")} description={error} />
      ) : recentProducts.length ? (
        <section className="recent-products-grid">
          {recentProducts.map((product, index) => (
            <HomeProductCard key={product.id || product._id || product.slug || product.name} product={product} index={index} onSelect={selectProduct} />
          ))}
        </section>
      ) : (
        <EmptyState title={t("recentlyAdded.empty")} />
      )}
      {purchaseModals}
    </div>
  );
}
