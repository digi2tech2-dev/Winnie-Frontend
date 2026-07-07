import { FileText, PackageCheck, RotateCcw, ShieldCheck, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

const policyIcons = [ShieldCheck, RotateCcw, PackageCheck];
const policyPaths = [
  "/privacy-policy",
  "/replacement-cancellation-policy",
  "/terms-and-conditions",
];

export default function PolicyAgreement({ checked, onChange, onOpenPolicies, id = "policy-agreement" }) {
  const { t } = useTranslation("auth");

  return (
    <div className="flex items-center justify-center gap-2.5 rounded-md px-1 py-1 text-center">
      <span className="relative grid h-5 w-5 shrink-0 place-items-center">
        {!checked && <span className="absolute inset-0 animate-pulse rounded border-2 border-[#E4C46B] opacity-70 shadow-[0_0_0_6px_rgba(228,196,107,0.18)]" />}
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          className="relative h-5 w-5 cursor-pointer rounded border-2 border-[#C9D3DF] bg-white text-[#7C3AED] transition hover:border-[#E4C46B] focus:ring-2 focus:ring-[#E4C46B]/35 dark:border-white/25 dark:bg-white/10"
        />
      </span>

      <p className="min-w-0 whitespace-nowrap text-[13px] font-bold text-slate-600 dark:text-slate-300 sm:text-sm">
        <label htmlFor={id} className="cursor-pointer">
          {t("policies:agreement.accept", { defaultValue: "أوافق على" })}
        </label>{" "}
        <button
          type="button"
          onClick={onOpenPolicies}
          className="interactive-ring font-black text-royal underline decoration-[#E4C46B] decoration-2 underline-offset-4 transition hover:text-pulse dark:text-pulse dark:hover:text-white"
        >
          {t("policies:agreement.terms", { defaultValue: "الشروط والأحكام" })}
        </button>
      </p>
    </div>
  );
}

export function PoliciesModal({ onClose }) {
  const { t } = useTranslation("policies");
  const policySections = t("agreement.sections", { returnObjects: true });

  return (
    <div className="fixed inset-0 z-[180] grid place-items-center bg-slate-950/78 px-4 py-6 backdrop-blur-md" role="dialog" aria-modal="true" aria-labelledby="policies-title" onClick={onClose}>
      <div className="max-h-[88vh] w-full max-w-[680px] overflow-hidden rounded-lg border border-white/18 bg-white text-right text-slate-950 shadow-[0_34px_110px_rgba(2,6,23,0.45)] dark:border-white/10 dark:bg-[#0A1020] dark:text-white" onClick={(event) => event.stopPropagation()}>
        <div className="relative overflow-hidden bg-[linear-gradient(135deg,#071226_0%,#1D2B53_42%,#7C3AED_100%)] px-5 py-5 text-white">
          <div className="relative z-10 flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="grid h-16 w-16 shrink-0 place-items-center rounded-[18px] border border-white/30 bg-[linear-gradient(145deg,#FFFFFF,#F5F3FF)] shadow-[0_16px_36px_rgba(0,0,0,0.24)] dark:border-[#C084FC]/35 dark:bg-[linear-gradient(145deg,#171C2C,#211238)] dark:shadow-[0_0_24px_rgba(168,85,247,0.30),0_16px_36px_rgba(0,0,0,0.34)]">
                <img src="/logo.png" alt="Winnie Fun" className="h-12 w-12 object-contain drop-shadow-[0_6px_12px_rgba(76,29,149,0.22)] dark:brightness-110 dark:drop-shadow-[0_0_14px_rgba(192,132,252,0.50)]" />
              </span>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#BAF1FF]">Winnie Fun</p>
                <h2 id="policies-title" className="mt-1 text-2xl font-black">
                  {t("agreement.title")}
                </h2>
                <p className="mt-1 text-sm font-semibold text-white/72">{t("agreement.subtitle")}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-white/16 bg-white/10 text-white transition hover:bg-white/18"
              aria-label={t("agreement.closeWindow")}
              title={t("agreement.close")}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="relative z-10 mt-5 grid grid-cols-3 gap-2 text-center text-[11px] font-black text-white/80">
            <span className="rounded-md border border-white/14 bg-white/10 px-2 py-2">{t("agreement.tabs.privacy")}</span>
            <span className="rounded-md border border-white/14 bg-white/10 px-2 py-2">{t("agreement.tabs.refund")}</span>
            <span className="rounded-md border border-white/14 bg-white/10 px-2 py-2">{t("agreement.tabs.orders")}</span>
          </div>
        </div>

        <div className="border-b border-slate-200 bg-slate-50 px-5 py-4 dark:border-white/10 dark:bg-white/[0.035]">
          <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-white/[0.055]">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-aqua to-pulse text-white">
              <FileText className="h-5 w-5" />
            </span>
            <p className="text-sm font-bold leading-6 text-slate-600 dark:text-slate-300">
              {t("agreement.notice")}
            </p>
          </div>
        </div>

        <div className="max-h-[52vh] space-y-3 overflow-y-auto p-5">
          {policySections.map((section, index) => {
            const Icon = policyIcons[index] || FileText;
            const policyPath = policyPaths[index] || "/terms-and-conditions";

            return (
              <section key={section.title} className="rounded-lg border border-slate-200 bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.05)] dark:border-white/10 dark:bg-white/[0.055]">
                <div className="flex items-start gap-3">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-[#BAF1FF] to-[#E9D5FF] text-royal dark:from-pulse/25 dark:to-aqua/20 dark:text-pulse">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="text-base font-black text-slate-950 dark:text-white">{section.title}</h3>
                    <p className="mt-2 text-sm font-semibold leading-7 text-slate-600 dark:text-slate-300">
                      {section.text}{" "}
                      <Link
                        to={policyPath}
                        onClick={onClose}
                        className="interactive-ring inline-flex items-center font-black text-royal underline decoration-[#E4C46B] decoration-2 underline-offset-4 transition hover:text-pulse dark:text-pulse dark:hover:text-white"
                      >
                        {t("agreement.more")}
                      </Link>
                    </p>
                  </div>
                </div>
              </section>
            );
          })}
        </div>

        <div className="flex items-center justify-end border-t border-slate-200 bg-white px-5 py-4 dark:border-white/10 dark:bg-[#0A1020]">
          <button
            type="button"
            onClick={onClose}
            className="interactive-ring h-11 rounded-lg bg-gradient-to-l from-royal to-pulse px-6 text-sm font-black text-white shadow-glow"
          >
            {t("agreement.understood")}
          </button>
        </div>
      </div>
    </div>
  );
}
