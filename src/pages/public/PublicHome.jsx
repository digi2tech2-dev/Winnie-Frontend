import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import ProductPurchaseModal from "../../components/ProductPurchaseModal";
import CustomerReviews from "../../components/home/CustomerReviews";
import HomeShowcase from "../../components/home/HomeShowcase";
import HomeSlide from "../../components/home/HomeSlide";
import OffersSection from "../../components/home/OffersSection";
import PubgPromoBanner from "../../components/home/PubgPromoBanner";
import RecentAdditionsSection from "../../components/home/RecentAdditionsSection";
import { categories } from "../../data/catalog";

export default function PublicHome() {
  const navigate = useNavigate();
  const [purchaseItem, setPurchaseItem] = useState(null);

  const openCategory = (category) => navigate(`/categories/${category.id}`);
  const openBestSelling = () => navigate("/best-selling");
  const openPurchase = (product, categoryTitle = "الأكثر مبيعاً") => {
    setPurchaseItem({ product, category: categoryTitle });
  };
  const openOfferPurchase = (offer) => {
    const offerCategory = categories.find((item) => item.id === offer.categoryId);
    setPurchaseItem({ product: offer, category: offerCategory || "العروض" });
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
      <HomeShowcase onViewAll={openBestSelling} onCategorySelect={openCategory} onProductSelect={(product) => openPurchase(product)} />
      <OffersSection onOrder={openOfferPurchase} />
      <PubgPromoBanner gamesPath="/categories/games" />
      <RecentAdditionsSection onSelect={(product) => openPurchase(product, "المضافة حديثاً")} />
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
