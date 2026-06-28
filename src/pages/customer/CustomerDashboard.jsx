import { useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import ProductPurchaseModal from "../../components/ProductPurchaseModal";
import PurchaseSuccessModal from "../../components/PurchaseSuccessModal";
import CustomerReviews from "../../components/home/CustomerReviews";
import HomeShowcase from "../../components/home/HomeShowcase";
import HomeSlide from "../../components/home/HomeSlide";
import OffersSection from "../../components/home/OffersSection";
import PubgPromoBanner from "../../components/home/PubgPromoBanner";
import RecentAdditionsSection from "../../components/home/RecentAdditionsSection";
import { useAuth } from "../../context/AuthContext";
import { categories } from "../../data/catalog";
import { createPurchaseReceipt } from "../../utils/purchaseReceipt";

export default function CustomerDashboard({ basePath = "/customer" }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [purchaseItem, setPurchaseItem] = useState(null);
  const [completedPurchase, setCompletedPurchase] = useState(null);

  useEffect(() => {
    if (!location.hash) return;

    const sectionId = location.hash.replace("#", "");
    const timeout = window.setTimeout(() => {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);

    return () => window.clearTimeout(timeout);
  }, [location.hash]);

  const goSection = (sectionId) => {
    navigate(`${basePath}/dashboard#${sectionId}`);
  };

  const goTopUp = () => goSection("best-selling");
  const goGames = () => navigate(`${basePath}/best-selling`);
  const goCategory = (category) => {
    navigate(`${basePath}/categories/${category.id}`);
  };
  const openPurchase = (product, categoryTitle = "الأكثر مبيعاً") => {
    setPurchaseItem({ product, category: categoryTitle });
  };
  const openOfferPurchase = (offer) => {
    const offerCategory = categories.find((item) => item.id === offer.categoryId);
    setPurchaseItem({ product: offer, category: offerCategory || "العروض" });
  };
  const confirmPurchase = (payload) => {
    setCompletedPurchase(createPurchaseReceipt(payload, purchaseItem?.category));
    setPurchaseItem(null);
  };

  return (
    <div className="space-y-6 lg:space-y-8">
      <HomeSlide categoriesPath={`${basePath}/categories`} />
      <HomeShowcase onViewAll={goGames} onCategorySelect={goCategory} onProductSelect={(product) => openPurchase(product)} />
      <OffersSection onOrder={openOfferPurchase} />
      <PubgPromoBanner gamesPath={`${basePath}/categories/games`} />
      <RecentAdditionsSection onSelect={(product) => openPurchase(product, "المضافة حديثاً")} />
      <CustomerReviews reviewerName={user?.name || ""} />
      <AnimatePresence>
        {purchaseItem && (
          <ProductPurchaseModal
            product={purchaseItem.product}
            category={purchaseItem.category}
            onClose={() => setPurchaseItem(null)}
            onConfirm={confirmPurchase}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {completedPurchase && (
          <PurchaseSuccessModal
            receipt={completedPurchase}
            onClose={() => setCompletedPurchase(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
