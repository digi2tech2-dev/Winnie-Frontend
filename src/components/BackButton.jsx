import { ArrowRight } from "lucide-react";
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
  const { t } = useTranslation("common");
  const currentPath = normalizePath(location.pathname);
  const hiddenPathSet = new Set(hiddenPaths.map(normalizePath));

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
    <div dir="ltr" className={`mb-4 flex justify-end ${className}`}>
      <button
        type="button"
        onClick={goBack}
        dir="rtl"
        className="interactive-ring inline-flex h-10 items-center justify-center gap-2 rounded-full border border-[#8B5CF6]/20 bg-white/90 px-4 text-sm font-black text-[#7C3AED] shadow-[0_12px_28px_rgba(139,92,246,0.12)] backdrop-blur-xl transition hover:border-[#8B5CF6]/40 hover:bg-[#F5F3FF] dark:border-white/10 dark:bg-[#111827]/90 dark:text-[#C084FC] dark:hover:border-[#A855F7]/55 dark:hover:bg-[#1A2335]"
        aria-label={t("actions.backAria")}
        title={t("actions.backAria")}
      >
        <ArrowRight className="h-4 w-4" />
        <span>{t("actions.back")}</span>
      </button>
    </div>
  );
}
