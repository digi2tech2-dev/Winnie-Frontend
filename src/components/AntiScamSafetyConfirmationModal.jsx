import { useMemo, useState } from "react";
import { ShieldAlert, X } from "lucide-react";
import { useTranslation } from "react-i18next";

const TERMS_PATH = "/terms-and-conditions";

export default function AntiScamSafetyConfirmationModal({ onCancel, onConfirm }) {
  const { t, i18n } = useTranslation("wallet");
  const [checked, setChecked] = useState({
    ownNeed: false,
    readWarning: false,
    terms: false,
  });
  const isArabic = String(i18n.language || "").toLowerCase().startsWith("ar");
  const allChecked = checked.ownNeed && checked.readWarning && checked.terms;
  const warningPoints = useMemo(() => [1, 2, 3, 4, 5].map((index) => t(`antiScamPoint${index}`)), [t]);

  const toggle = (key) => {
    setChecked((current) => ({ ...current, [key]: !current[key] }));
  };

  const confirm = () => {
    if (!allChecked) return;
    onConfirm?.();
  };

  return (
    <div
      dir={isArabic ? "rtl" : "ltr"}
      className="fixed inset-0 z-[190] flex items-center justify-center overflow-y-auto bg-slate-950/72 p-2.5 backdrop-blur-sm sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="anti-scam-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCancel?.();
      }}
    >
      <section className="relative flex max-h-[calc(100dvh-1.25rem)] w-full max-w-[540px] flex-col overflow-hidden rounded-[20px] border border-white/30 bg-white text-slate-950 shadow-[0_28px_80px_rgba(2,6,23,0.5)] dark:border-white/10 dark:bg-[#080d1e] dark:text-white sm:max-h-[calc(100dvh-2rem)]">
        <span className="absolute inset-x-0 top-0 z-10 h-1 bg-gradient-to-r from-amber-400 via-orange-500 to-violet-500" aria-hidden="true" />
        <header className="relative flex shrink-0 items-center gap-3 border-b border-slate-200 bg-[linear-gradient(135deg,#fff8ed,#ffffff_52%,#f7f5ff)] px-3.5 py-3 text-start dark:border-white/10 dark:bg-[linear-gradient(135deg,rgba(245,158,11,0.16),rgba(8,13,30,0.98)_52%,rgba(139,92,246,0.16))]">
          <button
            type="button"
            onClick={onCancel}
            className={`interactive-ring absolute top-2.5 grid h-7 w-7 place-items-center rounded-full border border-slate-200 bg-white/90 text-slate-500 shadow-sm transition hover:scale-105 hover:text-slate-950 dark:border-white/10 dark:bg-white/[0.07] dark:text-white/60 dark:hover:text-white ${isArabic ? "left-2.5" : "right-2.5"}`}
            aria-label={t("antiScamCancel")}
            title={t("antiScamCancel")}
          >
            <X className="h-3.5 w-3.5" />
          </button>

          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[14px] border border-amber-300/60 bg-gradient-to-br from-amber-100 to-orange-50 text-amber-700 shadow-[0_8px_22px_rgba(245,158,11,0.2)] dark:border-amber-300/20 dark:from-amber-300/15 dark:to-orange-400/5 dark:text-amber-300">
            <ShieldAlert className="h-5 w-5" />
          </span>
          <div className={`min-w-0 flex-1 ${isArabic ? "pl-8" : "pr-8"}`}>
            <h2 id="anti-scam-title" className="text-base font-black leading-5 sm:text-lg">
              {t("antiScamTitle")}
            </h2>
            <p className="mt-0.5 text-[11px] font-bold leading-4 text-slate-500 dark:text-white/60">
              {t("antiScamSubtitle")}
            </p>
          </div>
        </header>

        <div className="min-h-0 overflow-y-auto bg-slate-50/70 px-2.5 py-2.5 dark:bg-black/10 sm:px-3">
          <ol className="grid gap-1.5 rounded-[14px] border border-amber-200/80 bg-gradient-to-br from-amber-50 to-orange-50/60 p-1.5 text-[11px] font-bold leading-[1.15rem] text-amber-950 dark:border-amber-300/15 dark:from-amber-300/[0.09] dark:to-orange-400/[0.04] dark:text-amber-100 sm:text-xs">
            {warningPoints.map((point, index) => (
              <li key={point} className="flex items-start gap-2 rounded-[10px] border border-white/70 bg-white/65 px-2 py-1.5 shadow-[0_2px_8px_rgba(120,53,15,0.04)] dark:border-white/[0.05] dark:bg-white/[0.035]">
                <span className="mt-px grid h-[19px] w-[19px] shrink-0 place-items-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-[9px] font-black text-white shadow-[0_3px_8px_rgba(245,158,11,0.28)]">
                  {index + 1}
                </span>
                <span className="min-w-0 flex-1">{point}</span>
              </li>
            ))}
          </ol>

          <div className="mt-2 grid gap-1.5">
            <CheckboxRow
              checked={checked.ownNeed}
              id="anti-scam-own-need"
              label={t("antiScamCheckOwnNeed")}
              onChange={() => toggle("ownNeed")}
            />
            <CheckboxRow
              checked={checked.readWarning}
              id="anti-scam-read-warning"
              label={t("antiScamCheckReadWarning")}
              onChange={() => toggle("readWarning")}
            />
            <label
              htmlFor="anti-scam-terms"
              className={`group flex cursor-pointer items-start gap-2 rounded-xl border p-2 text-[11px] font-bold leading-[1.15rem] transition sm:text-xs ${checked.terms ? "border-violet-300 bg-violet-50 text-violet-950 shadow-[0_4px_14px_rgba(139,92,246,0.08)] dark:border-violet-400/30 dark:bg-violet-400/10 dark:text-violet-100" : "border-slate-200 bg-white text-slate-700 hover:border-[#8B5CF6]/40 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/74"}`}
            >
              <input
                id="anti-scam-terms"
                type="checkbox"
                checked={checked.terms}
                onChange={() => toggle("terms")}
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-[#8B5CF6] focus:ring-[#8B5CF6]/30 dark:border-white/20 dark:bg-[#050918]"
              />
              <span>
                {t("antiScamCheckTermsPrefix")}{" "}
                <a
                  href={TERMS_PATH}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="interactive-ring font-black text-[#7C3AED] underline decoration-amber-400 decoration-2 underline-offset-4 dark:text-[#C084FC]"
                  onClick={(event) => event.stopPropagation()}
                >
                  {t("antiScamTerms")}
                </a>
              </span>
            </label>
          </div>
        </div>

        <footer className="grid shrink-0 grid-cols-[0.8fr_1.4fr] gap-2 border-t border-slate-200 bg-white px-2.5 py-2.5 dark:border-white/10 dark:bg-[#080d1e] sm:px-3">
          <button
            type="button"
            onClick={onCancel}
            className="interactive-ring h-9 rounded-[10px] border border-slate-200 bg-white text-xs font-black text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/70 dark:hover:bg-white/[0.08]"
          >
            {t("antiScamCancel")}
          </button>
          <button
            type="button"
            disabled={!allChecked}
            onClick={confirm}
            className="interactive-ring h-9 rounded-[10px] bg-gradient-to-r from-[#7C3AED] via-[#8B5CF6] to-[#A855F7] px-3 text-xs font-black text-white shadow-[0_8px_22px_rgba(139,92,246,0.3)] transition hover:-translate-y-px hover:shadow-[0_10px_26px_rgba(139,92,246,0.38)] disabled:cursor-not-allowed disabled:bg-none disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none disabled:hover:translate-y-0 dark:disabled:bg-white/[0.08] dark:disabled:text-white/35"
          >
            {t("antiScamAgreeContinue")}
          </button>
        </footer>
      </section>
    </div>
  );
}

function CheckboxRow({ checked, id, label, onChange }) {
  return (
    <label
      htmlFor={id}
      className={`group flex cursor-pointer items-start gap-2 rounded-xl border p-2 text-[11px] font-bold leading-[1.15rem] transition sm:text-xs ${checked ? "border-violet-300 bg-violet-50 text-violet-950 shadow-[0_4px_14px_rgba(139,92,246,0.08)] dark:border-violet-400/30 dark:bg-violet-400/10 dark:text-violet-100" : "border-slate-200 bg-white text-slate-700 hover:border-[#8B5CF6]/40 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/74"}`}
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-[#8B5CF6] focus:ring-[#8B5CF6]/30 dark:border-white/20 dark:bg-[#050918]"
      />
      <span>{label}</span>
    </label>
  );
}
