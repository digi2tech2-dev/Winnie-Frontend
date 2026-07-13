import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { filterMainCategories, getPublicCatalog } from "../../api/catalog";
import EmptyState from "../../components/EmptyState";
import ProductPurchaseModal from "../../components/ProductPurchaseModal";
import BestSellingSection from "../../components/home/BestSellingSection";
import CategoryShowcaseSection from "../../components/home/CategoryShowcaseSection";
import CustomerReviews from "../../components/home/CustomerReviews";
import HomeSlide from "../../components/home/HomeSlide";
import RecentAdditionsSection from "../../components/home/RecentAdditionsSection";

export default function PublicHome() {
  const navigate = useNavigate();
  const { t } = useTranslation("home");
  const [catalog, setCatalog] = useState({ categories: [], products: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [purchaseItem, setPurchaseItem] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const loadCatalog = async () => {
      setLoading(true);
      setError("");

      try {
        const result = await getPublicCatalog({ page: 1, limit: 12 });
        if (!cancelled) {
          setCatalog({
            categories: result.categories,
            products: result.products,
          });
        }
      } catch (requestError) {
        if (!cancelled) {
          setCatalog({ categories: [], products: [] });
          setError(requestError.userMessage || t("public.catalogLoadError"));
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

  const openCategory = (category) => navigate(`/categories/${category.slug || category.id}`);
  const openProducts = () => navigate("/best-selling");
  const openRecentlyAdded = () => navigate("/recently-added");
  const openPurchase = (product, categoryTitle = t("showcase.catalog")) => {
    setPurchaseItem({ product, category: categoryTitle });
  };
  const confirmPurchase = () => {
    setPurchaseItem(null);
    navigate("/login", { state: { from: "/customer/dashboard" } });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="mx-auto max-w-[1120px] space-y-6 px-4 pb-32 pt-5 sm:px-6 sm:pt-7 lg:space-y-8 lg:px-8 lg:pb-16"
    >
      <HomeSlide categoriesPath="/categories" />
      {loading ? (
        <div className="glass-panel rounded-lg p-8 text-center text-sm font-black text-slate-500 dark:text-slate-400">
          {t("common:states.loadingCatalog")}
        </div>
      ) : error ? (
        <EmptyState title={t("public.catalogEmptyTitle")} description={error} />
      ) : (
        <>
          <CategoryShowcaseSection
            categories={filterMainCategories(catalog.categories)}
            onSelect={openCategory}
          />
          <RecentAdditionsSection
            items={catalog.products}
            onSelect={(product) => openPurchase(product, product.categoryTitle || t("showcase.catalog"))}
            onViewAll={openRecentlyAdded}
          />
          <BestSellingSection
            items={catalog.products}
            onSelect={(product) => openPurchase(product, product.categoryTitle || t("showcase.catalog"))}
            onViewAll={openProducts}
          />
        </>
      )}
      <CustomerReviews />
      <AnimatePresence>
        {purchaseItem && (
          <ProductPurchaseModal
            product={purchaseItem.product}
            category={purchaseItem.category}
            onClose={() => setPurchaseItem(null)}
            onConfirm={confirmPurchase}
            requireAccountId={false}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
