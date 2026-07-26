import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

const defaultHomePaths = ["/", "/customer/dashboard", "/admin/user/dashboard", "/admin/tools/dashboard"];

function normalizePath(path) {
  if (!path || path === "/") return "/";
  return path.replace(/\/+$/, "");
}

export default function BackButton({
  className = "",
  fallbackPath = "/",
  hiddenPaths = defaultHomePaths,
  alwaysUseFallback = false,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { i18n, t } = useTranslation("common");
  const currentPath = normalizePath(location.pathname);
  const hiddenPathSet = new Set(hiddenPaths.map(normalizePath));
  const BackArrow = i18n.language?.startsWith("ar") ? ChevronRight : ChevronLeft;

  if (hiddenPathSet.has(currentPath)) {
    return null;
  }

  const goBack = () => {
    if (alwaysUseFallback) {
      navigate(fallbackPath, { replace: true });
      return;
    }

    if (window.history.length > 1) {
      navigate(-1);
      return;
    }

    navigate(fallbackPath, { replace: true });
  };

  return (
    <div dir="ltr" className={`winnie-back-button relative top-1 mb-4 flex justify-end ${className}`}>
      <button
        type="button"
        onClick={goBack}
        dir="rtl"
        className="interactive-ring winnie-back-button-control group inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/80 bg-[linear-gradient(145deg,rgba(255,255,255,0.98),rgba(237,233,254,0.94))] text-[#7C3AED] shadow-[0_10px_24px_rgba(124,58,237,0.18),inset_0_1px_0_rgba(255,255,255,0.95)] backdrop-blur-xl transition duration-300 hover:-translate-y-0.5 hover:scale-105 hover:border-[#A78BFA]/60 hover:text-[#5B21B6] hover:shadow-[0_14px_32px_rgba(124,58,237,0.26)] active:translate-y-0 active:scale-95 dark:border-white/12 dark:bg-[linear-gradient(145deg,rgba(30,41,59,0.96),rgba(46,16,101,0.86))] dark:text-[#D8B4FE] dark:shadow-[0_12px_28px_rgba(88,28,135,0.30),inset_0_1px_0_rgba(255,255,255,0.10)] dark:hover:border-[#C084FC]/55 dark:hover:text-white"
        aria-label={t("actions.backAria")}
        title={t("actions.backAria")}
      >
        <BackArrow className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" strokeWidth={3} />
      </button>
    </div>
  );
}
