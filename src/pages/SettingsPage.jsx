import { useState } from "react";
import { Bell, Check, Globe2, Moon, RotateCcw, Save, ShieldCheck, WalletCards } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useToast } from "../components/ToastProvider";
import WhatsAppSupportButton from "../components/WhatsAppSupportButton";

const languageOptions = [
  { value: "ar", label: "العربية", noteKey: "languageOptions.arNote" },
  { value: "en", label: "English", noteKey: "languageOptions.enNote" },
];

const defaultPreferences = {
  orderUpdates: true,
  walletAlerts: true,
  dailyOffers: false,
  twoFactor: false,
  loginAlerts: true,
  securePayments: true,
};

export default function SettingsPage({
  theme,
  language,
  currency,
  currencyNote = "",
  isSaving = false,
  languageLocked = false,
  saveDisabled = false,
  onThemeChange,
  onLanguageChange,
  onSave,
}) {
  const { clearToasts, showToast } = useToast();
  const { t } = useTranslation("settings");
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState(() => {
    try {
      return { ...defaultPreferences, ...JSON.parse(localStorage.getItem("winnie-user-preferences") || "{}") };
    } catch {
      return defaultPreferences;
    }
  });

  const toggle = (key) => setPreferences((current) => ({ ...current, [key]: !current[key] }));

  const saveInFlight = saving || isSaving;

  const save = async () => {
    if (saveInFlight) return;

    clearToasts();
    setSaving(true);

    try {
      const result = await onSave?.({ language, currency, theme, preferences });
      localStorage.setItem("winnie-user-preferences", JSON.stringify(preferences));
      showToast({
        type: "success",
        title: result?.title || t("savedTitle"),
        message: result?.message || t("savedMessage"),
      });
    } catch (error) {
      showToast({
        type: "error",
        title: t("saveErrorTitle"),
        message: error.userMessage || error.message || t("saveErrorMessage"),
      });
    } finally {
      setSaving(false);
    }
  };

  const reset = () => {
    if (!languageLocked) onLanguageChange("ar");
    onThemeChange("light");
    setPreferences(defaultPreferences);
    showToast({ type: "info", title: t("resetTitle"), message: t("resetMessage") });
  };

  return (
    <div className="mx-auto max-w-[980px] space-y-4 pb-4">
      <section className="relative overflow-hidden rounded-[28px] border border-violet-200/70 bg-[linear-gradient(135deg,#ffffff_0%,#f5f3ff_50%,#ecfeff_100%)] p-5 shadow-[0_20px_55px_rgba(124,58,237,0.10)] dark:border-white/10 dark:bg-[linear-gradient(135deg,#111827_0%,#15142a_52%,#071827_100%)] sm:p-7">
        <span className="absolute -right-16 -top-20 h-48 w-48 rounded-full bg-violet-400/15 blur-3xl" />
        <div className="relative flex items-center gap-4">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-[20px] bg-gradient-to-br from-violet-600 to-cyan-500 text-white shadow-[0_16px_34px_rgba(124,58,237,0.28)]"><ShieldCheck className="h-7 w-7" /></span>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-violet-600 dark:text-violet-300">{t("eyebrow")}</p>
            <h1 className="mt-1 text-2xl font-black text-slate-950 dark:text-white sm:text-3xl">{t("title")}</h1>
            <p className="mt-1 max-w-xl text-sm font-semibold leading-6 text-slate-500 dark:text-slate-400">{t("description")}</p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <SettingsPanel icon={Globe2} title={t("languageTitle")} description={t(languageLocked ? "adminLanguageDescription" : "languageDescription")}>
          <div className="grid grid-cols-2 gap-2">
            {languageLocked ? (
              <>
                <ChoiceCard active disabled tone="language" title={t("adminLanguagePrimary")} note={t("adminLanguagePrimaryNote")} />
                <ChoiceCard disabled tone="language" title={t("adminLanguageSecondary")} note={t("adminLanguageSecondaryNote")} />
              </>
            ) : (
              languageOptions.map((option) => <ChoiceCard key={option.value} active={language === option.value} tone="language" title={option.label} note={t(option.noteKey)} onClick={() => onLanguageChange(option.value)} />)
            )}
          </div>
        </SettingsPanel>

        <SettingsPanel icon={WalletCards} title={t("currencyTitle")} description={t("currencyDescription")}>
          <div className="rounded-2xl border border-violet-200 bg-violet-50 px-4 py-3 dark:border-violet-400/20 dark:bg-violet-500/10">
            <strong dir="ltr" className="block text-base font-black text-violet-800 dark:text-violet-200">{currency}</strong>
            <span className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
              <span>{currencyNote}</span>
              <WhatsAppSupportButton />
            </span>
          </div>
        </SettingsPanel>

        <SettingsPanel icon={Moon} title={t("appearanceTitle")} description={t("appearanceDescription")}>
          <div className="grid grid-cols-2 gap-2">
            <ChoiceCard active={theme === "light"} tone="appearance" title={t("light")} note={t("lightNote")} onClick={() => onThemeChange("light")} />
            <ChoiceCard active={theme === "dark"} tone="appearance" title={t("dark")} note={t("darkNote")} onClick={() => onThemeChange("dark")} />
          </div>
        </SettingsPanel>

        <SettingsPanel icon={Bell} title={t("notificationsTitle")} description={t("notificationsDescription")}>
          <PreferenceSwitch label={t("orderUpdates")} checked={preferences.orderUpdates} onChange={() => toggle("orderUpdates")} />
          <PreferenceSwitch label={t("walletAlerts")} checked={preferences.walletAlerts} onChange={() => toggle("walletAlerts")} />
          <PreferenceSwitch label={t("dailyOffers")} checked={preferences.dailyOffers} onChange={() => toggle("dailyOffers")} />
        </SettingsPanel>

        <SettingsPanel icon={ShieldCheck} title={t("securityTitle")} description={t("securityDescription")} className="lg:col-span-2">
          <div className="grid gap-2 sm:grid-cols-3">
            <PreferenceSwitch label={t("twoFactor")} checked={preferences.twoFactor} onChange={() => toggle("twoFactor")} />
            <PreferenceSwitch label={t("loginAlerts")} checked={preferences.loginAlerts} onChange={() => toggle("loginAlerts")} />
            <PreferenceSwitch label={t("securePayments")} checked={preferences.securePayments} onChange={() => toggle("securePayments")} />
          </div>
        </SettingsPanel>
      </section>

      <div className="sticky bottom-24 z-20 grid grid-cols-[1fr_auto] gap-2 rounded-[20px] border border-slate-200 bg-white/90 p-2.5 shadow-[0_16px_45px_rgba(15,23,42,0.14)] backdrop-blur-xl dark:border-white/10 dark:bg-[#0b1220]/92 xl:bottom-4">
        <button
          type="button"
          disabled={saveDisabled || saveInFlight}
          aria-busy={saveInFlight}
          onClick={save}
          className="interactive-ring inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-cyan-500 px-5 text-sm font-black text-white shadow-[0_14px_30px_rgba(124,58,237,0.24)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Save className="h-4 w-4" />
          {saveInFlight ? t("saving") : t("save")}
        </button>
        <button
          type="button"
          disabled={saveInFlight}
          onClick={reset}
          className="interactive-ring inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-xs font-black text-slate-600 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-300"
        >
          <RotateCcw className="h-4 w-4" />
          <span className="hidden sm:inline">{t("reset")}</span>
        </button>
      </div>
    </div>
  );
}

function SettingsPanel({ icon: Icon, title, description, className = "", children }) {
  return (
    <article className={`rounded-[24px] border border-slate-200 bg-white/90 p-4 shadow-[0_14px_34px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-[#111827] ${className}`}>
      <div className="mb-4 flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-violet-500/10 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300"><Icon className="h-5 w-5" /></span>
        <div><h2 className="text-base font-black text-slate-950 dark:text-white">{title}</h2><p className="mt-0.5 text-xs font-semibold leading-5 text-slate-500 dark:text-slate-400">{description}</p></div>
      </div>
      <div className="space-y-2">{children}</div>
    </article>
  );
}

function ChoiceCard({ active, disabled = false, title, note, onClick, compact = false, tone = "default" }) {
  const languageTone = tone === "language";
  const appearanceTone = tone === "appearance";
  const colorClasses = languageTone
    ? active
      ? "border-violet-500 bg-violet-50 text-violet-800 shadow-[0_10px_24px_rgba(124,58,237,0.10)] dark:border-fuchsia-400/70 dark:bg-[linear-gradient(135deg,rgba(124,58,237,0.38),rgba(37,99,235,0.28))] dark:text-white dark:shadow-[0_12px_30px_rgba(124,58,237,0.22)]"
      : "border-slate-200 bg-slate-50/70 text-slate-700 dark:border-cyan-300/25 dark:bg-[linear-gradient(135deg,rgba(15,23,42,0.92),rgba(8,47,73,0.48))] dark:text-cyan-50 dark:hover:border-cyan-300/45 dark:hover:bg-[linear-gradient(135deg,rgba(30,41,59,0.96),rgba(8,69,94,0.60))]"
    : appearanceTone
      ? active
        ? "border-blue-500 bg-blue-50 text-blue-800 shadow-[0_10px_24px_rgba(37,99,235,0.10)] dark:border-cyan-300/65 dark:bg-[linear-gradient(135deg,rgba(14,116,144,0.42),rgba(37,99,235,0.34))] dark:text-white dark:shadow-[0_12px_30px_rgba(6,182,212,0.18)]"
        : "border-slate-200 bg-slate-50/70 text-slate-700 dark:border-indigo-300/25 dark:bg-[linear-gradient(135deg,rgba(15,23,42,0.94),rgba(49,46,129,0.34))] dark:text-indigo-50 dark:hover:border-indigo-300/45 dark:hover:bg-[linear-gradient(135deg,rgba(30,41,59,0.96),rgba(55,48,163,0.46))]"
    : active
      ? "border-violet-500 bg-violet-50 text-violet-800 shadow-[0_10px_24px_rgba(124,58,237,0.10)] dark:bg-violet-500/12 dark:text-violet-200"
      : "border-slate-200 bg-slate-50/70 text-slate-700 dark:border-white/10 dark:bg-white/[0.035] dark:text-slate-300";

  return (
    <button type="button" disabled={disabled} onClick={onClick} className={`relative min-w-0 rounded-2xl border text-right transition disabled:cursor-not-allowed disabled:opacity-65 ${compact ? "h-14 px-3" : "min-h-[72px] p-3"} ${colorClasses}`}>
      {active && <span className="absolute top-2 grid h-5 w-5 place-items-center rounded-full bg-violet-600 text-white shadow-md ltr:left-2 ltr:right-auto rtl:left-auto rtl:right-2 dark:bg-gradient-to-br dark:from-fuchsia-400 dark:to-cyan-400 dark:text-slate-950"><Check className="h-3 w-3" /></span>}
      <strong className={`block truncate text-sm font-black ${active ? "ltr:pl-6 rtl:pr-6" : ""}`}>{title}</strong>
      {note && <span className={`mt-1 block text-[10px] font-semibold ${active ? "ltr:pl-5 rtl:pr-5" : ""} ${languageTone ? active ? "text-violet-600 dark:text-violet-100" : "text-slate-500 dark:text-cyan-100/70" : appearanceTone ? active ? "text-blue-600 dark:text-cyan-100" : "text-slate-500 dark:text-indigo-100/70" : "text-slate-500 dark:text-slate-400"}`}>{note}</span>}
    </button>
  );
}

function PreferenceSwitch({ label, checked, onChange }) {
  return (
    <button type="button" role="switch" aria-checked={checked} onClick={onChange} className="flex min-h-12 w-full items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-right dark:border-white/10 dark:bg-white/[0.035]">
      <span className="text-right text-xs font-black text-slate-700 dark:text-slate-200">{label}</span>
      <span className={`relative h-6 w-11 shrink-0 rounded-full transition ${checked ? "bg-violet-600" : "bg-slate-300 dark:bg-slate-700"}`}><span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition ${checked ? "left-6" : "left-1"}`} /></span>
    </button>
  );
}
