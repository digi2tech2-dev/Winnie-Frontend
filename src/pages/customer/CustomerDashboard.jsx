import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate, useOutletContext } from "react-router-dom";
import { UserRound } from "lucide-react";
import { resolveBackendAssetUrl } from "../../api/adapters";
import { getCustomerCatalog } from "../../api/catalog";
import BestSellingSection from "../../components/home/BestSellingSection";
import CustomerReviews from "../../components/home/CustomerReviews";
import HomeShowcase from "../../components/home/HomeShowcase";
import HomeSlide from "../../components/home/HomeSlide";
import RecentAdditionsSection from "../../components/home/RecentAdditionsSection";
import { useAuth } from "../../context/AuthContext";
import { useCustomerPurchase } from "../../hooks/useCustomerPurchase";

const initialDashboardData = {
  categories: [],
  products: [],
};

const profileAvatarKey = "winnie-profile-avatar";
const profileAvatarChangedEvent = "winnie-profile-avatar-change";

function getStoredProfileAvatar() {
  try {
    return localStorage.getItem(profileAvatarKey) || "";
  } catch {
    return "";
  }
}

function isImageAvatar(avatar) {
  return typeof avatar === "string" && /^(https?:|data:image|\/)/.test(avatar);
}

export default function CustomerDashboard({ basePath = "/customer" }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { token, user } = useAuth();
  const { t } = useTranslation("home");
  const outletContext = useOutletContext() || {};
  const [dashboardData, setDashboardData] = useState(initialDashboardData);
  const [profileAvatarUrl, setProfileAvatarUrl] = useState(getStoredProfileAvatar);

  const { openPurchase, purchaseModals } = useCustomerPurchase({
    basePath,
    onSuccess: outletContext.onWalletRefresh,
    token,
  });

  useEffect(() => {
    if (!location.hash) return undefined;

    const sectionId = location.hash.replace("#", "");
    const timeout = window.setTimeout(() => {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);

    return () => window.clearTimeout(timeout);
  }, [location.hash]);

  useEffect(() => {
    if (!token) return undefined;

    let cancelled = false;

    const loadCatalog = async () => {
      try {
        const catalog = await getCustomerCatalog(token, { page: 1, limit: 12 });
        if (!cancelled) {
          setDashboardData({ categories: catalog.categories, products: catalog.products });
        }
      } catch {
        if (!cancelled) setDashboardData(initialDashboardData);
      }
    };

    void loadCatalog();

    return () => {
      cancelled = true;
    };
  }, [token]);

  useEffect(() => {
    const refreshAvatar = () => setProfileAvatarUrl(getStoredProfileAvatar());
    window.addEventListener(profileAvatarChangedEvent, refreshAvatar);
    window.addEventListener("storage", refreshAvatar);

    return () => {
      window.removeEventListener(profileAvatarChangedEvent, refreshAvatar);
      window.removeEventListener("storage", refreshAvatar);
    };
  }, []);

  const goGames = () => navigate(`${basePath}/best-selling`);
  const goCategory = (category) => {
    navigate(`${basePath}/categories/${category.slug || category.id}`);
  };
  const backendAvatarUrl = resolveBackendAssetUrl(user?.avatar);
  const hasProfileImage = isImageAvatar(backendAvatarUrl) || isImageAvatar(profileAvatarUrl);

  return (
    <div className="space-y-6 lg:space-y-8">
      {!hasProfileImage ? (
        <button
          type="button"
          onClick={() => navigate(`${basePath}/profile`)}
          className="interactive-ring flex w-full items-center gap-3 rounded-2xl border border-violet-200/80 bg-gradient-to-l from-violet-50 via-white to-sky-50 p-3 text-start shadow-[0_12px_30px_rgba(124,58,237,0.08)] dark:border-violet-400/20 dark:bg-[linear-gradient(120deg,rgba(124,58,237,0.12),rgba(17,24,39,0.96),rgba(14,165,233,0.08))]"
        >
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-violet-600 to-sky-500 text-white shadow-[0_10px_24px_rgba(124,58,237,0.25)]">
            <UserRound className="h-5 w-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-black text-slate-950 dark:text-white">{t("dashboard.completeProfileTitle")}</span>
            <span className="mt-0.5 block text-xs font-bold leading-5 text-slate-500 dark:text-slate-300">{t("dashboard.completeProfileDescription")}</span>
          </span>
        </button>
      ) : null}
      <HomeSlide categoriesPath={`${basePath}/categories`} />
      <HomeShowcase
        categories={dashboardData.categories}
        products={dashboardData.products.slice(0, 8)}
        onViewAll={goGames}
        onCategorySelect={goCategory}
        onProductSelect={(product) => openPurchase(product, product.categoryTitle || t("dashboard.customerCatalog"))}
      />
      <RecentAdditionsSection
        items={dashboardData.products}
        onSelect={(product) => openPurchase(product, product.categoryTitle || t("dashboard.customerCatalog"))}
      />
      <BestSellingSection
        items={dashboardData.products}
        onSelect={(product) => openPurchase(product, product.categoryTitle || t("dashboard.customerCatalog"))}
      />
      <CustomerReviews />
      {purchaseModals}
    </div>
  );
}
