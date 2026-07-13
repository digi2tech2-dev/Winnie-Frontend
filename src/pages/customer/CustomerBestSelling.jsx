import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useOutletContext } from "react-router-dom";
import { getCustomerProducts, getPublicCatalog } from "../../api/catalog";
import EmptyState from "../../components/EmptyState";
import HomeProductCard from "../../components/home/HomeProductCard";
import { useAuth } from "../../context/AuthContext";
import { useCustomerPurchase } from "../../hooks/useCustomerPurchase";
import { sortProductsByBestSelling } from "../../utils/bestSellingProducts";

const pageSize = 100;

export default function CustomerBestSelling({ loginOnPurchase = false, basePath = "/customer" }) {
  const navigate = useNavigate();
  const { token } = useAuth();
  const { t, i18n } = useTranslation("home");
  const { t: productsT } = useTranslation("products");
  const outletContext = useOutletContext() || {};
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
        } else {
          const result = await getPublicCatalog({ page: 1, limit: pageSize });
          if (!cancelled) setPublicProducts(result.products);
        }
      } catch (requestError) {
        if (!cancelled) {
          setBackendProducts([]);
          setPublicProducts([]);
          setError(requestError.userMessage || productsT("listing.loadError"));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadProducts();
    return () => { cancelled = true; };
  }, [token, useBackendProducts, productsT]);

  const sourceProducts = useBackendProducts ? backendProducts : publicProducts;
  const bestSellingProducts = useMemo(
    () => sortProductsByBestSelling(sourceProducts.filter((product) => product?.isActive !== false && product?.visibleInStore !== false && product?.visible !== false)),
    [sourceProducts],
  );

  const selectProduct = (product) => {
    if (!useBackendProducts) {
      navigate("/login", { state: { from: `${basePath}/dashboard` } });
      return;
    }
    openPurchase(product, product.categoryTitle || t("dashboard.customerCatalog"));
  };

  return (
    <div dir={i18n.language?.startsWith("ar") ? "rtl" : "ltr"} className="space-y-6">
      <header>
        <h1 className="relative text-2xl font-black text-slate-950 dark:text-white sm:text-3xl ltr:pl-3 rtl:pr-3">
          <span className="absolute top-1/2 h-9 w-1 -translate-y-1/2 rounded-full bg-[linear-gradient(180deg,#ec4899,#7c3aed,#22d3ee)] ltr:left-0 rtl:right-0" />
          {t("homePage.bestSellers")}
        </h1>
        <p className="mt-2 text-sm font-bold text-slate-500 dark:text-slate-400">{t("bestSellers.subtitle")}</p>
      </header>

      {loading ? (
        <div className="glass-panel rounded-lg p-8 text-center text-sm font-black text-slate-500 dark:text-slate-400">{t("common:states.loadingProducts")}</div>
      ) : error ? (
        <EmptyState title={productsT("listing.loadError")} description={error} />
      ) : bestSellingProducts.length ? (
        <section className="recent-products-grid">
          {bestSellingProducts.map((product, index) => (
            <HomeProductCard key={product.id || product._id || product.slug || product.name} product={product} index={index} onSelect={selectProduct} />
          ))}
        </section>
      ) : (
        <EmptyState title={t("bestSellers.empty")} />
      )}
      {purchaseModals}
    </div>
  );
}
