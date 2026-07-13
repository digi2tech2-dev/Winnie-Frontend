import { Heart, ShoppingBag } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate, useOutletContext } from "react-router-dom";
import EmptyState from "../../components/EmptyState";
import HomeProductCard from "../../components/home/HomeProductCard";
import { useAuth } from "../../context/AuthContext";
import { useFavorites } from "../../context/FavoritesContext";
import { useCustomerPurchase } from "../../hooks/useCustomerPurchase";

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

  return (
    <div dir={i18n.language?.startsWith("ar") ? "rtl" : "ltr"} className="space-y-6">
      <header className="relative overflow-hidden rounded-[26px] border border-rose-100 bg-[linear-gradient(135deg,rgba(255,241,242,0.94),rgba(245,243,255,0.9),rgba(240,249,255,0.9))] p-5 shadow-[0_18px_46px_rgba(190,24,93,0.10)] dark:border-rose-400/15 dark:bg-[linear-gradient(135deg,rgba(76,5,25,0.34),rgba(46,16,101,0.30),rgba(8,47,73,0.24))] sm:p-6">
        <span className="pointer-events-none absolute -left-8 -top-10 h-32 w-32 rounded-full bg-rose-300/20 blur-3xl" />
        <div className="relative flex items-center gap-4">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-[20px] bg-[linear-gradient(135deg,#FB7185,#EC4899,#A855F7)] text-white shadow-[0_16px_34px_rgba(236,72,153,0.30)]">
            <Heart className="h-7 w-7 fill-current" />
          </span>
          <div className="min-w-0">
            <h1 className="text-2xl font-black text-slate-950 dark:text-white sm:text-3xl">{t("favorites.title")}</h1>
            <p className="mt-1 text-sm font-bold leading-6 text-slate-500 dark:text-slate-300">{t("favorites.subtitle")}</p>
          </div>
        </div>
      </header>

      {favorites.length ? (
        <section className="marketplace-product-grid">
          {favorites.map((product, index) => (
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

