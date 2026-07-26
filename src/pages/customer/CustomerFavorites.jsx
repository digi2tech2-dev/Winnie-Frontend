import { Heart, ShoppingBag } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate, useOutletContext } from "react-router-dom";
import EmptyState from "../../components/EmptyState";
import HomeProductCard from "../../components/home/HomeProductCard";
import { useAuth } from "../../context/AuthContext";
import { useFavorites } from "../../context/FavoritesContext";
import { useCustomerPurchase } from "../../hooks/useCustomerPurchase";
import { isProductVisibleInStore } from "../../utils/productAvailability";

export default function CustomerFavorites({ basePath = "/customer" }) {
  const navigate = useNavigate();
  const { token } = useAuth();
  const { favorites } = useFavorites();
  const { t, i18n } = useTranslation("products");
  const outletContext = useOutletContext() || {};
  const { openPurchase, purchaseModals } = useCustomerPurchase({
    basePath,
    onSuccess: outletContext.onWalletRefresh,
    token,
  });
  const visibleFavorites = favorites.filter(isProductVisibleInStore);

  return (
    <div dir={i18n.language?.startsWith("ar") ? "rtl" : "ltr"} className="compact-favorites-page space-y-4">
      <header className="relative overflow-hidden rounded-[20px] border border-rose-100 bg-[linear-gradient(135deg,rgba(255,241,242,0.94),rgba(245,243,255,0.9),rgba(240,249,255,0.9))] p-3 shadow-[0_12px_32px_rgba(190,24,93,0.09)] dark:border-rose-400/15 dark:bg-[linear-gradient(135deg,rgba(76,5,25,0.34),rgba(46,16,101,0.30),rgba(8,47,73,0.24))] sm:p-4">
        <span className="pointer-events-none absolute -left-8 -top-10 h-32 w-32 rounded-full bg-rose-300/20 blur-3xl" />
        <div className="relative flex items-center gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[15px] bg-[linear-gradient(135deg,#FB7185,#EC4899,#A855F7)] text-white shadow-[0_12px_26px_rgba(236,72,153,0.26)]">
            <Heart className="h-5 w-5 fill-current" />
          </span>
          <div className="min-w-0">
            <h1 className="text-xl font-black text-slate-950 dark:text-white sm:text-2xl">{t("favorites.title")}</h1>
            <p className="mt-0.5 text-xs font-bold leading-5 text-slate-500 dark:text-slate-300">{t("favorites.subtitle")}</p>
          </div>
        </div>
      </header>

      {visibleFavorites.length ? (
        <section className="marketplace-product-grid">
          {visibleFavorites.map((product, index) => (
            <HomeProductCard
              key={product.id || product._id || product.productId || product.slug || product.name}
              product={product}
              index={index}
              onSelect={(selectedProduct) => openPurchase(selectedProduct, selectedProduct.categoryTitle || t("favorites.title"))}
            />
          ))}
        </section>
      ) : (
        <EmptyState
          icon={ShoppingBag}
          title={t("favorites.emptyTitle")}
          description={t("favorites.emptyDescription")}
          actionLabel={t("favorites.browse")}
          onAction={() => navigate(`${basePath}/categories`)}
        />
      )}

      {purchaseModals}
    </div>
  );
}

