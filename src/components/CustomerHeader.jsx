import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { Bell, Menu, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import HeaderSearchOverlay from "./HeaderSearchOverlay";
import ProductPurchaseModal from "./ProductPurchaseModal";
import PurchaseSuccessModal from "./PurchaseSuccessModal";
import { createPurchaseReceipt } from "../utils/purchaseReceipt";

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

export default function CustomerHeader({ onOpenSidebar, unreadNotificationCount = 0 }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const [purchaseItem, setPurchaseItem] = useState(null);
  const [completedPurchase, setCompletedPurchase] = useState(null);
  const [profileAvatarUrl, setProfileAvatarUrl] = useState(getStoredProfileAvatar);
  const headerAvatarUrl = profileAvatarUrl || (isImageAvatar(user?.avatar) ? user.avatar : "") || "/hero-winnie-fun.png";

  useEffect(() => {
    const refreshAvatar = () => setProfileAvatarUrl(getStoredProfileAvatar());

    window.addEventListener("storage", refreshAvatar);
    window.addEventListener(profileAvatarChangedEvent, refreshAvatar);

    return () => {
      window.removeEventListener("storage", refreshAvatar);
      window.removeEventListener(profileAvatarChangedEvent, refreshAvatar);
    };
  }, []);

  const confirmPurchase = (payload) => {
    setCompletedPurchase(createPurchaseReceipt(payload, purchaseItem?.category));
    setPurchaseItem(null);
  };

  return (
    <>
      <header dir="ltr" className="site-header-warm fixed inset-x-0 top-0 z-[70] border-b border-sky-100 bg-white/90 px-4 py-3.5 shadow-[0_14px_36px_rgba(14,165,233,0.10)] backdrop-blur-2xl dark:border-[rgba(255,255,255,0.08)] dark:bg-[rgba(10,15,29,0.95)] dark:shadow-[0_0_18px_rgba(139,92,246,0.18)] lg:px-8">
        <div className="mx-auto flex max-w-[1120px] items-center gap-2 sm:gap-3">
          <Link to="/customer/dashboard" className="flex min-w-0 items-center gap-0.5 text-left sm:gap-1.5">
            <img src="/logo.png" alt="Winnie Fun logo" className="h-11 w-11 shrink-0 object-contain sm:h-16 sm:w-16" />
            <span className="-ml-0.5 min-w-0 text-center leading-none drop-shadow-[0_0_18px_rgba(139,92,246,0.25)] sm:-ml-1">
              <span className="block truncate text-2xl font-black italic tracking-wide text-slate-950 dark:text-white sm:text-4xl">
                innie
              </span>
              <span className="mt-0.5 block text-[9px] font-black uppercase tracking-[0.3em] text-[#A855F7] sm:text-xs sm:tracking-[0.34em]">
                Fun
              </span>
            </span>
          </Link>

          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="grid h-12 w-12 place-items-center rounded-2xl border border-transparent bg-transparent text-[#8B5CF6] transition hover:bg-[#F5F3FF] dark:text-[#A855F7] dark:hover:bg-[#1A2335] dark:hover:shadow-[0_0_18px_rgba(139,92,246,0.18)] sm:h-[52px] sm:w-[52px]"
              aria-label="فتح البحث"
              title="بحث"
            >
              <Search className="h-7 w-7 stroke-[1.8]" />
            </button>

            <button
              type="button"
              className="relative grid h-12 w-12 place-items-center rounded-2xl border border-transparent bg-transparent text-[#8B5CF6] transition hover:bg-[#F5F3FF] dark:text-[#A855F7] dark:hover:bg-[#1A2335] dark:hover:shadow-[0_0_18px_rgba(139,92,246,0.18)] sm:h-[52px] sm:w-[52px]"
              aria-label="الإشعارات"
              title="الإشعارات"
              onClick={() => navigate("/customer/notifications")}
            >
              <Bell className="h-7 w-7 stroke-[1.8]" />
              {unreadNotificationCount > 0 && (
                <span className="absolute right-0 top-0 grid h-6 min-w-6 place-items-center rounded-full bg-gradient-to-br from-[#8B5CF6] to-[#A855F7] px-1 text-[11px] font-black leading-none text-white shadow-[0_0_16px_rgba(168,85,247,0.80)]">
                  {unreadNotificationCount}
                </span>
              )}
            </button>

            <Link
              to="/customer/profile"
              className="relative block h-12 w-12 overflow-hidden rounded-full border-2 border-[#C4B5FD]/72 bg-white shadow-[0_12px_28px_rgba(14,165,233,0.16)] transition hover:-translate-y-0.5 hover:border-[#8B5CF6] dark:border-[#A855F7]/72 dark:bg-[#151827] dark:shadow-[0_0_24px_rgba(168,85,247,0.30)] sm:h-14 sm:w-14"
              aria-label="الملف الشخصي"
              title={user?.name || "الملف الشخصي"}
            >
              <img
                src={headerAvatarUrl}
                alt=""
                className="h-full w-full object-cover"
              />
              <span className="absolute bottom-0.5 right-0.5 h-3.5 w-3.5 rounded-full border-2 border-[#050816] bg-emerald-400 sm:h-4 sm:w-4" />
              <span className="sr-only">{user?.name || "الملف الشخصي"}</span>
            </Link>

            <button
              type="button"
              onClick={onOpenSidebar}
              className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-transparent bg-transparent text-slate-700 transition hover:bg-[#EFFBFF] dark:border-[rgba(255,255,255,0.08)] dark:bg-[#111827] dark:text-[#C4C9D4] dark:hover:border-[#A855F7]/55 dark:hover:bg-[#1A2335] xl:hidden"
              aria-label="فتح القائمة"
              title="فتح القائمة"
            >
              <Menu className="h-7 w-7 stroke-[1.8]" />
            </button>
          </div>
        </div>
      </header>

      <HeaderSearchOverlay
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onNavigate={navigate}
        onProductSelect={(product) => setPurchaseItem({ product, category: product.groupTitle })}
        mode="customer"
      />
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
    </>
  );
}
