import { AlertTriangle, Home, ServerCrash } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function ErrorPage({ code = 404, onNavigate }) {
  const { t } = useTranslation("common");
  const isServer = code === 500;
  const Icon = isServer ? ServerCrash : AlertTriangle;

  return (
    <div className="grid min-h-[calc(100vh-180px)] place-items-center py-10">
      <section className="glass-panel w-full max-w-2xl rounded-lg p-8 text-center">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-lg bg-gradient-to-br from-royal to-pulse text-white shadow-glow">
          <Icon className="h-8 w-8" />
        </span>
        <p className="mt-6 text-sm font-black uppercase tracking-[0.22em] text-royal dark:text-pulse">
          {t("error.code", { code })}
        </p>
        <h1 className="mt-2 text-4xl font-black">
          {isServer ? t("error.serverTitle") : t("error.notFoundTitle")}
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
          {isServer ? t("error.serverDescription") : t("error.notFoundDescription")}
        </p>
        <button
          type="button"
          onClick={() => onNavigate("dashboard")}
          className="interactive-ring mt-7 inline-flex h-12 items-center gap-2 rounded-lg bg-gradient-to-r from-royal to-pulse px-5 text-sm font-black text-white shadow-glow"
        >
          <Home className="h-5 w-5" />
          {t("error.home")}
        </button>
      </section>
    </div>
  );
}
