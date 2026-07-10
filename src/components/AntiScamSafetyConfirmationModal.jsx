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
      className="fixed inset-0 z-[190] flex items-end justify-center bg-slate-950/72 px-3 py-4 backdrop-blur-sm sm:items-center sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-labelledby="anti-scam-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCancel?.();
      }}
    >
      <section className="flex max-h-[92dvh] w-full max-w-[620px] flex-col overflow-hidden rounded-t-[22px] border border-white/20 bg-white text-slate-950 shadow-[0_30px_90px_rgba(2,6,23,0.45)] sm:rounded-[22px] dark:border-white/10 dark:bg-[#080d1e] dark:text-white">
        <header className="relative border-b border-slate-200 bg-[linear-gradient(135deg,#fff7ed,#ffffff_48%,#f5f3ff)] px-4 py-4 text-center dark:border-white/10 dark:bg-[linear-gradient(135deg,rgba(245,158,11,0.18),rgba(8,13,30,0.98)_48%,rgba(139,92,246,0.18))] sm:px-5">
          <button
            type="button"
            onClick={onCancel}
            className={`interactive-ring absolute top-3 grid h-9 w-9 place-items-center rounded-xl border border-slate-200 bg-white/80 text-slate-500 transition hover:text-slate-950 dark:border-white/10 dark:bg-white/[0.06] dark:text-white/60 dark:hover:text-white ${isArabic ? "left-3" : "right-3"}`}
            aria-label={t("antiScamCancel")}
            title={t("antiScamCancel")}
          >
            <X className="h-4 w-4" />
          </button>

          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-amber-300/50 bg-amber-100 text-amber-700 shadow-[0_14px_34px_rgba(245,158,11,0.20)] dark:border-amber-300/20 dark:bg-amber-300/12 dark:text-amber-300">
            <ShieldAlert className="h-7 w-7" />
          </span>
          <h2 id="anti-scam-title" className="mt-3 text-xl font-black leading-7 sm:text-2xl">
            {t("antiScamTitle")}
          </h2>
          <p className="mt-1 text-sm font-bold leading-6 text-slate-500 dark:text-white/60">
            {t("antiScamSubtitle")}
          </p>
        </header>

        <div className="overflow-y-auto px-4 py-4 sm:px-5">
          <ol className="grid gap-2 rounded-[16px] border border-amber-300/45 bg-amber-50/90 p-3 text-sm font-bold leading-6 text-amber-950 dark:border-amber-300/20 dark:bg-amber-300/10 dark:text-amber-100">
            {warningPoints.map((point, index) => (
              <li key={point} className="flex items-start gap-2.5">
                <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-amber-500 text-[11px] font-black text-white">
                  {index + 1}
                </span>
                <span className="min-w-0 flex-1">{point}</span>
              </li>
            ))}
          </ol>

          <div className="mt-4 grid gap-2.5">
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
              className="flex cursor-pointer items-start gap-3 rounded-[14px] border border-slate-200 bg-slate-50/80 p-3 text-sm font-bold leading-6 text-slate-700 transition hover:border-[#8B5CF6]/40 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/74"
            >
              <input
                id="anti-scam-terms"
                type="checkbox"
                checked={checked.terms}
                onChange={() => toggle("terms")}
                className="mt-1 h-5 w-5 shrink-0 rounded border-slate-300 text-[#8B5CF6] focus:ring-[#8B5CF6]/30 dark:border-white/20 dark:bg-[#050918]"
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

        <footer className="grid gap-2 border-t border-slate-200 bg-white px-4 py-3 sm:grid-cols-[1fr_1.5fr] dark:border-white/10 dark:bg-[#080d1e]">
          <button
            type="button"
            onClick={onCancel}
            className="interactive-ring h-11 rounded-xl border border-slate-200 bg-white text-sm font-black text-slate-600 transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/70 dark:hover:bg-white/[0.08]"
          >
            {t("antiScamCancel")}
          </button>
          <button
            type="button"
            disabled={!allChecked}
            onClick={confirm}
            className="interactive-ring h-11 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#A855F7] px-4 text-sm font-black text-white shadow-[0_12px_30px_rgba(139,92,246,0.30)] disabled:cursor-not-allowed disabled:bg-none disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none dark:disabled:bg-white/[0.08] dark:disabled:text-white/35"
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
      className="flex cursor-pointer items-start gap-3 rounded-[14px] border border-slate-200 bg-slate-50/80 p-3 text-sm font-bold leading-6 text-slate-700 transition hover:border-[#8B5CF6]/40 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/74"
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="mt-1 h-5 w-5 shrink-0 rounded border-slate-300 text-[#8B5CF6] focus:ring-[#8B5CF6]/30 dark:border-white/20 dark:bg-[#050918]"
      />
      <span>{label}</span>
    </label>
  );
}
