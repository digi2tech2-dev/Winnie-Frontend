import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate, useOutletContext } from "react-router-dom";
import { Camera, X } from "lucide-react";
import { resolveBackendAssetUrl } from "../../api/adapters";
import { filterMainCategories, getCustomerCatalog } from "../../api/catalog";
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
const completeProfileDismissedKey = "winnie-complete-profile-dismissed";

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

function getCompleteProfileDismissed() {
  try {
    return localStorage.getItem(completeProfileDismissedKey) === "true";
  } catch {
    return false;
  }
}

export default function CustomerDashboard({ basePath = "/customer" }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { token, user } = useAuth();
  const { t } = useTranslation("home");
  const outletContext = useOutletContext() || {};
  const [dashboardData, setDashboardData] = useState(initialDashboardData);
  const [profileAvatarUrl, setProfileAvatarUrl] = useState(getStoredProfileAvatar);
  const [completeProfileDismissed, setCompleteProfileDismissed] = useState(getCompleteProfileDismissed);

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
  const dismissCompleteProfile = () => {
    setCompleteProfileDismissed(true);
    try {
      localStorage.setItem(completeProfileDismissedKey, "true");
    } catch {
      // Keep the notice dismissed for the current session when storage is unavailable.
    }
  };

  return (
    <div className="space-y-6 lg:space-y-8">
      {!hasProfileImage && !completeProfileDismissed ? (
        <div className="relative overflow-hidden rounded-[18px] border border-violet-200/70 bg-[linear-gradient(115deg,rgba(250,245,255,0.96),rgba(255,255,255,0.92)_55%,rgba(240,249,255,0.9))] p-2 shadow-[0_8px_20px_rgba(109,40,217,0.08)] backdrop-blur-xl dark:border-violet-400/15 dark:bg-[linear-gradient(115deg,rgba(124,58,237,0.11),rgba(17,24,39,0.94)_52%,rgba(14,165,233,0.07))] sm:p-2.5">
          <span aria-hidden="true" className="pointer-events-none absolute -left-8 -top-10 h-24 w-24 rounded-full bg-sky-300/20 blur-2xl dark:bg-sky-400/10" />
          <span aria-hidden="true" className="pointer-events-none absolute -bottom-12 right-1/3 h-24 w-24 rounded-full bg-violet-300/20 blur-2xl dark:bg-violet-500/10" />

          <div className="relative flex items-center justify-between gap-2.5">
            <div className="flex min-w-0 flex-1 items-center gap-2.5">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-violet-600 to-sky-500 text-white shadow-[0_6px_14px_rgba(109,40,217,0.20)]">
                <Camera className="h-3.5 w-3.5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-black leading-4 text-slate-900 dark:text-white sm:text-sm">{t("dashboard.completeProfileTitle")}</span>
              </span>
            </div>

            <div className="flex shrink-0 items-center justify-end gap-1.5 whitespace-nowrap">
              <button
                type="button"
                onClick={dismissCompleteProfile}
                className="inline-flex h-7 items-center justify-center rounded-xl px-2 text-[11px] font-bold text-slate-500 transition hover:bg-white/80 hover:text-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/70 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white"
                aria-label={t("dashboard.dismissCompleteProfile")}
              >
                <X className="h-3 w-3" />
              </button>
              <button
                type="button"
                onClick={() => navigate(`${basePath}/profile`)}
                className="rounded-xl bg-violet-600 px-3 py-1.5 text-[11px] font-black whitespace-nowrap text-white shadow-[0_6px_14px_rgba(124,58,237,0.22)] transition hover:-translate-y-0.5 hover:bg-violet-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 dark:ring-offset-slate-950"
              >
                {t("dashboard.completeProfileAction")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
      <HomeSlide categoriesPath={`${basePath}/categories`} />
      <HomeShowcase
        categories={filterMainCategories(dashboardData.categories)}
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
