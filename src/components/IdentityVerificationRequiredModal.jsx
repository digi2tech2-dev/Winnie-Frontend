import { MessageCircle, ShieldAlert, X } from "lucide-react";
import { useTranslation } from "react-i18next";

export const IDENTITY_VERIFICATION_WHATSAPP_URL =
  "https://wa.me/971527715868?text=Hello%20Winnie%20Support%2C%20I%20need%20to%20verify%20my%20identity.";

export default function IdentityVerificationRequiredModal({ open, reason = "", onClose }) {
  const { t } = useTranslation("common");

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[260] grid place-items-center bg-slate-950/60 px-4 py-6 backdrop-blur-sm" role="dialog" aria-modal="true">
      <section className="w-full max-w-[460px] overflow-hidden rounded-[30px] border border-emerald-200/70 bg-white p-5 text-slate-950 shadow-[0_30px_90px_rgba(15,23,42,0.35)] dark:border-emerald-400/20 dark:bg-[#101827] dark:text-white">
        <div className="mb-4 flex items-start justify-between gap-4">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-emerald-500/12 text-emerald-600 dark:text-emerald-300">
            <ShieldAlert className="h-7 w-7" />
          </span>
          <button
            type="button"
            onClick={onClose}
            className="grid h-10 w-10 place-items-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-100 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/10"
            aria-label={t("identityVerification.close", { defaultValue: "Close" })}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <h2 className="text-2xl font-black">
          {t("identityVerification.requiredTitle", { defaultValue: "Identity verification required" })}
        </h2>
        <p className="mt-3 text-sm font-semibold leading-7 text-slate-600 dark:text-slate-300">
          {t("identityVerification.requiredMessage", {
            defaultValue: "To protect your account and continue purchases or top-ups, please contact support to verify your identity.",
          })}
        </p>
        {reason ? (
          <p className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-200">
            {reason}
          </p>
        ) : null}

        <a
          href={IDENTITY_VERIFICATION_WHATSAPP_URL}
          target="_blank"
          rel="noreferrer"
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#25D366] px-5 py-3 text-sm font-black text-white shadow-[0_18px_38px_rgba(37,211,102,0.28)] transition hover:-translate-y-0.5 hover:bg-[#1ebe5d]"
        >
          <MessageCircle className="h-5 w-5" />
          <span>{t("identityVerification.contactSupportWhatsApp", { defaultValue: "Contact on WhatsApp" })}</span>
        </a>
      </section>
    </div>
  );
}
