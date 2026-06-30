import { useState } from "react";
import { Bell, Check, Globe2, Moon, RotateCcw, Save, ShieldCheck, WalletCards } from "lucide-react";
import { useToast } from "../components/ToastProvider";

const languageOptions = [
  { value: "ar", label: "العربية", note: { ar: "لغة الواجهة العربية", en: "Arabic interface" } },
  { value: "en", label: "English", note: { ar: "لغة الواجهة الإنجليزية", en: "English interface" } },
];

const defaultCurrencyOptions = ["USD", "EUR", "AED", "EGP"];

const defaultPreferences = {
  orderUpdates: true,
  walletAlerts: true,
  dailyOffers: false,
  twoFactor: false,
  loginAlerts: true,
  securePayments: true,
};

const settingsCopy = {
  ar: {
    appearanceDescription: "اختر الشكل الأنسب لك.",
    appearanceTitle: "المظهر",
    currencyDescription: "اختر العملة المستخدمة في عرض الأسعار والأرصدة.",
    currencyTitle: "العملة",
    dailyOffers: "العروض اليومية",
    dark: "داكن",
    darkNote: "مريح للعين",
    description: "تحكم في اللغة، العملة، المظهر، الإشعارات، وأمان الحساب.",
    eyebrow: "إعدادات متقدمة",
    languageDescription: "اختر اللغة المستخدمة في الصفحات العامة وصفحات المستخدم.",
    languageTitle: "اللغة",
    light: "فاتح",
    lightNote: "واضح ونظيف",
    loginAlerts: "تنبيهات تسجيل الدخول عبر البريد",
    notificationsDescription: "تحكم في التحديثات التي تريد استقبالها.",
    notificationsTitle: "الإشعارات",
    orderUpdates: "تحديثات الطلبات",
    reset: "إعادة ضبط",
    resetMessage: "الإعدادات الافتراضية جاهزة. اضغط حفظ لتأكيدها.",
    resetTitle: "تمت إعادة ضبط الإعدادات",
    save: "حفظ الإعدادات",
    savedMessage: "تم تحديث تفضيلات حسابك.",
    savedTitle: "تم حفظ الإعدادات",
    securePayments: "تأكيد آمن للدفع",
    securityDescription: "أضف طبقة حماية إضافية لحسابك.",
    securityTitle: "أمان الحساب",
    title: "التفضيلات",
    twoFactor: "المصادقة الثنائية",
    walletAlerts: "تنبيهات المحفظة",
  },
  en: {
    appearanceDescription: "Use the theme that feels most comfortable for you.",
    appearanceTitle: "Appearance",
    currencyDescription: "Select the currency used to display prices and balances.",
    currencyTitle: "Currency",
    dailyOffers: "Daily offers",
    dark: "Dark",
    darkNote: "Easy on the eyes",
    description: "Manage your language, currency, appearance, notifications and account security.",
    eyebrow: "Advanced settings",
    languageDescription: "Choose the language used across customer and public pages.",
    languageTitle: "Language",
    light: "Light",
    lightNote: "Bright and clean",
    loginAlerts: "Email login alerts",
    notificationsDescription: "Control the updates you want to receive.",
    notificationsTitle: "Notifications",
    orderUpdates: "Order updates",
    reset: "Reset",
    resetMessage: "Default preferences are ready. Tap Save settings to confirm.",
    resetTitle: "Settings reset",
    save: "Save settings",
    savedMessage: "Your account preferences have been updated.",
    savedTitle: "Settings saved",
    securePayments: "Secure payment confirmation",
    securityDescription: "Add another layer of protection to your account.",
    securityTitle: "Account security",
    title: "Preferences",
    twoFactor: "Two-factor authentication",
    walletAlerts: "Wallet alerts",
  },
};

export default function SettingsPage({
  theme,
  language,
  currency,
  currencyDisabled = false,
  currencyNote = "",
  currencyOptions = defaultCurrencyOptions,
  isSaving = false,
  saveDisabled = false,
  onThemeChange,
  onLanguageChange,
  onCurrencyChange,
  onSave,
}) {
  const { showToast } = useToast();
  const t = settingsCopy[language] || settingsCopy.ar;
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
    setSaving(true);

    try {
      localStorage.setItem("winnie-user-preferences", JSON.stringify(preferences));
      const result = await onSave?.({ language, currency, theme, preferences });
      showToast({
        type: "success",
        title: result?.title || t.savedTitle,
        message: result?.message || t.savedMessage,
      });
    } catch (error) {
      showToast({
        type: "error",
        title: "Unable to save settings",
        message: error.userMessage || error.message || "Please try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  const reset = () => {
    onLanguageChange("ar");
    onCurrencyChange("USD");
    onThemeChange("light");
    setPreferences(defaultPreferences);
    showToast({ type: "info", title: t.resetTitle, message: t.resetMessage });
  };

  return (
    <div className="mx-auto max-w-[980px] space-y-4 pb-4">
      <section className="relative overflow-hidden rounded-[28px] border border-violet-200/70 bg-[linear-gradient(135deg,#ffffff_0%,#f5f3ff_50%,#ecfeff_100%)] p-5 shadow-[0_20px_55px_rgba(124,58,237,0.10)] dark:border-white/10 dark:bg-[linear-gradient(135deg,#111827_0%,#15142a_52%,#071827_100%)] sm:p-7">
        <span className="absolute -right-16 -top-20 h-48 w-48 rounded-full bg-violet-400/15 blur-3xl" />
        <div className="relative flex items-center gap-4">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-[20px] bg-gradient-to-br from-violet-600 to-cyan-500 text-white shadow-[0_16px_34px_rgba(124,58,237,0.28)]"><ShieldCheck className="h-7 w-7" /></span>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-violet-600 dark:text-violet-300">{t.eyebrow}</p>
            <h1 className="mt-1 text-2xl font-black text-slate-950 dark:text-white sm:text-3xl">{t.title}</h1>
            <p className="mt-1 max-w-xl text-sm font-semibold leading-6 text-slate-500 dark:text-slate-400">{t.description}</p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <SettingsPanel icon={Globe2} title={t.languageTitle} description={t.languageDescription}>
          <div className="grid grid-cols-2 gap-2">
            {languageOptions.map((option) => <ChoiceCard key={option.value} active={language === option.value} title={option.label} note={option.note[language]} onClick={() => onLanguageChange(option.value)} />)}
          </div>
        </SettingsPanel>

        <SettingsPanel icon={WalletCards} title={t.currencyTitle} description={t.currencyDescription}>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {currencyOptions.map((option) => (
              <ChoiceCard
                key={option}
                active={currency === option}
                disabled={currencyDisabled}
                title={option}
                onClick={() => onCurrencyChange(option)}
                compact
              />
            ))}
          </div>
          {currencyNote && <p className="text-[10px] font-bold leading-5 text-slate-500 dark:text-slate-400">{currencyNote}</p>}
        </SettingsPanel>

        <SettingsPanel icon={Moon} title={t.appearanceTitle} description={t.appearanceDescription}>
          <div className="grid grid-cols-2 gap-2">
            <ChoiceCard active={theme === "light"} title={t.light} note={t.lightNote} onClick={() => onThemeChange("light")} />
            <ChoiceCard active={theme === "dark"} title={t.dark} note={t.darkNote} onClick={() => onThemeChange("dark")} />
          </div>
        </SettingsPanel>

        <SettingsPanel icon={Bell} title={t.notificationsTitle} description={t.notificationsDescription}>
          <PreferenceSwitch label={t.orderUpdates} checked={preferences.orderUpdates} onChange={() => toggle("orderUpdates")} />
          <PreferenceSwitch label={t.walletAlerts} checked={preferences.walletAlerts} onChange={() => toggle("walletAlerts")} />
          <PreferenceSwitch label={t.dailyOffers} checked={preferences.dailyOffers} onChange={() => toggle("dailyOffers")} />
        </SettingsPanel>

        <SettingsPanel icon={ShieldCheck} title={t.securityTitle} description={t.securityDescription} className="lg:col-span-2">
          <div className="grid gap-2 sm:grid-cols-3">
            <PreferenceSwitch label={t.twoFactor} checked={preferences.twoFactor} onChange={() => toggle("twoFactor")} />
            <PreferenceSwitch label={t.loginAlerts} checked={preferences.loginAlerts} onChange={() => toggle("loginAlerts")} />
            <PreferenceSwitch label={t.securePayments} checked={preferences.securePayments} onChange={() => toggle("securePayments")} />
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
          {saveInFlight ? "Saving..." : t.save}
        </button>
        <button
          type="button"
          disabled={saveInFlight}
          onClick={reset}
          className="interactive-ring inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-xs font-black text-slate-600 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-300"
        >
          <RotateCcw className="h-4 w-4" />
          <span className="hidden sm:inline">{t.reset}</span>
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

function ChoiceCard({ active, disabled = false, title, note, onClick, compact = false }) {
  return (
    <button type="button" disabled={disabled} onClick={onClick} className={`relative min-w-0 rounded-2xl border text-right transition disabled:cursor-not-allowed disabled:opacity-65 ${compact ? "h-14 px-3" : "min-h-[72px] p-3"} ${active ? "border-violet-500 bg-violet-50 text-violet-800 shadow-[0_10px_24px_rgba(124,58,237,0.10)] dark:bg-violet-500/12 dark:text-violet-200" : "border-slate-200 bg-slate-50/70 text-slate-700 dark:border-white/10 dark:bg-white/[0.035] dark:text-slate-300"}`}>
      {active && <span className="absolute right-2 top-2 grid h-5 w-5 place-items-center rounded-full bg-violet-600 text-white"><Check className="h-3 w-3" /></span>}
      <strong className="block truncate text-sm font-black">{title}</strong>
      {note && <span className="mt-1 block pr-5 text-[10px] font-semibold text-slate-500 dark:text-slate-400">{note}</span>}
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
