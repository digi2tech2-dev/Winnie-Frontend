import { useCallback, useEffect, useState } from "react";
import {
  Banknote,
  Clock3,
  Loader2,
  MessageSquareWarning,
  RefreshCw,
  Save,
  Settings,
  ShieldCheck,
  UserRoundPlus,
  Wrench,
} from "lucide-react";
import {
  ADMIN_SETTING_KEYS,
  getAdminSettings,
  normalizePaymentRiskLimits,
  updatePaymentRiskLimits,
  updateManagedAdminSetting,
} from "../../api/adminSettings";
import { useToast } from "../../components/ToastProvider";
import { useAuth } from "../../context/AuthContext";

function settingsToForm(settingsByKey = {}) {
  return {
    maintenanceMode: settingsByKey.maintenanceMode?.value === true,
    paymentRiskLimits: normalizePaymentRiskLimits(settingsByKey.paymentRiskLimits?.value),
  };
}

export default function AdminSettingsPage() {
  const { token } = useAuth();
  const { showToast } = useToast();
  const [form, setForm] = useState(settingsToForm());
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!token) return;

    setLoading(true);
    setError("");

    try {
      const result = await getAdminSettings(token);
      setForm(settingsToForm(result.settingsByKey));
    } catch (requestError) {
      setError(requestError.userMessage || "تعذر تحميل إعدادات النظام.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const setRisk = (key, value) => setForm((current) => ({
    ...current,
    paymentRiskLimits: {
      ...normalizePaymentRiskLimits(current.paymentRiskLimits),
      [key]: value,
    },
  }));

  const save = async () => {
    if (busy) return;

    setBusy(true);
    setError("");

    try {
      const updates = [
        [ADMIN_SETTING_KEYS.maintenanceMode, form.maintenanceMode],
      ];

      for (const [key, value] of updates) {
        await updateManagedAdminSetting(token, key, value);
      }
      await updatePaymentRiskLimits(token, form.paymentRiskLimits);

      await load();
      showToast({ type: "success", title: "تم حفظ الإعدادات", message: "تم تحديث إعدادات النظام." });
    } catch (requestError) {
      const message = requestError.userMessage || requestError.message || "تعذر حفظ الإعدادات.";
      setError(message);
      showToast({ type: "error", title: "فشل حفظ الإعدادات", message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div dir="rtl" className="space-y-5 pb-2">
      <section className="relative isolate overflow-hidden rounded-[30px] border border-violet-300/20 bg-[linear-gradient(125deg,#4c1d95_0%,#6d28d9_42%,#2563eb_100%)] p-5 text-white shadow-[0_20px_50px_rgba(76,29,149,0.24)] sm:p-7">
        <div className="absolute -left-16 -top-20 -z-10 h-52 w-52 rounded-full bg-cyan-300/20 blur-3xl" />
        <div className="absolute -bottom-24 right-20 -z-10 h-52 w-52 rounded-full bg-fuchsia-400/25 blur-3xl" />
        <div className="flex items-center gap-4">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-[20px] border border-white/20 bg-white/15 shadow-inner backdrop-blur-sm">
            <Settings className="h-7 w-7" />
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-black sm:text-3xl">إعدادات النظام</h1>
            <p className="mt-1 text-[10px] font-bold text-violet-100 sm:text-xs">إدارة تشغيل المنصة وحدود حماية عمليات الدفع من مكان واحد.</p>
          </div>
        </div>
        <button
          type="button"
          disabled={busy || loading}
          onClick={() => void load()}
          className="mt-5 inline-flex h-10 items-center gap-2 rounded-xl border border-white/20 bg-white/15 px-4 text-[10px] font-black text-white backdrop-blur-sm transition hover:bg-white/25 disabled:cursor-not-allowed disabled:opacity-60 sm:absolute sm:left-7 sm:top-1/2 sm:mt-0 sm:-translate-y-1/2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          تحديث
        </button>
      </section>

      {error && (
        <p className="rounded-[20px] border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-700 shadow-sm dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-200">
          {error}
        </p>
      )}

      {loading ? (
        <section className="grid min-h-64 place-items-center rounded-[26px] border border-violet-100 bg-gradient-to-br from-white to-violet-50 p-10 dark:border-white/10 dark:from-[#111827] dark:to-[#15132a]">
          <div className="text-center">
            <Loader2 className="mx-auto h-9 w-9 animate-spin text-violet-500" />
            <p className="mt-3 text-xs font-black text-slate-400">جاري تحميل الإعدادات...</p>
          </div>
        </section>
      ) : (
        <section className="space-y-4">
          <SettingsCard
            title="إعدادات التشغيل"
            description="تحكم في حالة المنصة والخدمات المتاحة للمستخدمين."
            icon={<Wrench className="h-5 w-5" />}
            iconClassName="bg-gradient-to-br from-amber-400 to-orange-500 shadow-orange-500/20"
          >
            <SwitchField label="وضع الصيانة" checked={form.maintenanceMode} onChange={(value) => set("maintenanceMode", value)} />
          </SettingsCard>

          <SettingsCard
            title="حدود مخاطر الدفع"
            description="حدد قيود الدفع التي يطبّقها الخادم لحماية الحسابات والمحفظة."
            icon={<ShieldCheck className="h-5 w-5" />}
            iconClassName="bg-gradient-to-br from-emerald-400 to-cyan-500 shadow-cyan-500/20"
          >
            <SwitchField label="تفعيل حدود مخاطر الدفع الإلكتروني" checked={form.paymentRiskLimits.enabled} onChange={(value) => setRisk("enabled", value)} />
            <ReadOnlyInfo label="أساس احتساب المبلغ" value="القيمة المكافئة بالدولار، ويقيّمها الخادم قبل إنشاء عملية الدفع" />
            <div className="grid gap-4 lg:grid-cols-2">
              <FieldSection title="حدود المبالغ" icon={<Banknote className="h-4 w-4" />} tone="emerald">
                <NumberField label="الحد الأقصى لعملية شحن واحدة" value={form.paymentRiskLimits.maxSingleAmount} onChange={(value) => setRisk("maxSingleAmount", value)} />
                <NumberField label="حد المبلغ في الساعة" value={form.paymentRiskLimits.hourlyAmountLimit} onChange={(value) => setRisk("hourlyAmountLimit", value)} />
                <NumberField label="حد المبلغ اليومي" value={form.paymentRiskLimits.dailyAmountLimit} onChange={(value) => setRisk("dailyAmountLimit", value)} />
              </FieldSection>

              <FieldSection title="حدود المحاولات" icon={<Clock3 className="h-4 w-4" />} tone="amber">
                <NumberField label="حد المحاولات في الساعة" step="1" value={form.paymentRiskLimits.hourlyAttemptLimit} onChange={(value) => setRisk("hourlyAttemptLimit", value)} />
                <NumberField label="حد المحاولات اليومي" step="1" value={form.paymentRiskLimits.dailyAttemptLimit} onChange={(value) => setRisk("dailyAttemptLimit", value)} />
              </FieldSection>

              <FieldSection title="قيود الحسابات الجديدة" icon={<UserRoundPlus className="h-4 w-4" />} tone="violet" className="lg:col-span-2">
                <NumberField label="عمر الحساب الجديد بالساعات" value={form.paymentRiskLimits.newAccountHours} onChange={(value) => setRisk("newAccountHours", value)} />
                <NumberField label="حد العملية الواحدة للحساب الجديد" value={form.paymentRiskLimits.newAccountSingleAmount} onChange={(value) => setRisk("newAccountSingleAmount", value)} />
                <NumberField label="الحد اليومي للحساب الجديد" value={form.paymentRiskLimits.newAccountDailyAmount} onChange={(value) => setRisk("newAccountDailyAmount", value)} />
              </FieldSection>
            </div>

            <FieldSection title="رسالة الحظر للعميل" icon={<MessageSquareWarning className="h-4 w-4" />} tone="rose" contentClassName="md:grid-cols-1 xl:grid-cols-1">
              <TextAreaField label="النص الذي سيظهر عند تجاوز الحدود" value={form.paymentRiskLimits.customerMessage} onChange={(value) => setRisk("customerMessage", value)} />
            </FieldSection>
          </SettingsCard>
        </section>
      )}

      <div className="sticky bottom-4 z-20 rounded-[22px] border border-violet-200/70 bg-white/85 p-2.5 shadow-[0_18px_50px_rgba(76,29,149,0.18)] backdrop-blur-xl dark:border-violet-400/20 dark:bg-[#0b1220]/90">
        <button
          type="button"
          disabled={busy || loading}
          onClick={save}
          className="interactive-ring inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-l from-violet-600 via-purple-600 to-blue-600 px-5 text-sm font-black text-white shadow-[0_14px_30px_rgba(124,58,237,0.28)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          حفظ الإعدادات
        </button>
      </div>
    </div>
  );
}

function SettingsCard({ children, description, icon, iconClassName, title }) {
  return (
    <article className="overflow-hidden rounded-[28px] border border-slate-200/80 bg-white/95 shadow-[0_18px_45px_rgba(15,23,42,0.07)] dark:border-white/10 dark:bg-[#111827]/95">
      <div className="flex items-center gap-3 border-b border-slate-100 bg-gradient-to-l from-slate-50 to-white px-4 py-4 dark:border-white/[0.07] dark:from-white/[0.035] dark:to-transparent sm:px-5">
        <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-white shadow-lg ${iconClassName}`}>{icon}</span>
        <div>
          <h2 className="text-base font-black text-slate-950 dark:text-white">{title}</h2>
          {description && <p className="mt-0.5 text-[10px] font-bold text-slate-400">{description}</p>}
        </div>
      </div>
      <div className="space-y-4 p-4 sm:p-5">{children}</div>
    </article>
  );
}

const sectionTones = {
  amber: "border-amber-200/80 bg-amber-50/70 text-amber-700 dark:border-amber-400/15 dark:bg-amber-400/[0.06] dark:text-amber-300",
  emerald: "border-emerald-200/80 bg-emerald-50/70 text-emerald-700 dark:border-emerald-400/15 dark:bg-emerald-400/[0.06] dark:text-emerald-300",
  rose: "border-rose-200/80 bg-rose-50/70 text-rose-700 dark:border-rose-400/15 dark:bg-rose-400/[0.06] dark:text-rose-300",
  violet: "border-violet-200/80 bg-violet-50/70 text-violet-700 dark:border-violet-400/15 dark:bg-violet-400/[0.06] dark:text-violet-300",
};

function FieldSection({ children, className = "", contentClassName = "", icon, title, tone }) {
  return (
    <div className={`rounded-[22px] border p-3.5 ${sectionTones[tone]} ${className}`}>
      <div className="mb-3 flex items-center gap-2 text-xs font-black">
        <span className="grid h-7 w-7 place-items-center rounded-xl bg-white/80 shadow-sm dark:bg-white/10">{icon}</span>
        {title}
      </div>
      <div className={`grid gap-3 md:grid-cols-2 xl:grid-cols-3 ${contentClassName}`}>{children}</div>
    </div>
  );
}

function NumberField({ label, value, onChange, step = "any" }) {
  return <InputField label={label} min="0" step={step} type="number" value={value} onChange={onChange} />;
}

function InputField({ label, type = "text", value, onChange, min, step }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[9px] font-black text-slate-600 dark:text-slate-300">{label}</span>
      <input min={min} step={step} type={type} value={value} onChange={(event) => onChange(event.target.value)} className={input} />
    </label>
  );
}

function TextAreaField({ label, value, onChange }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[9px] font-black text-slate-600 dark:text-slate-300">{label}</span>
      <textarea value={value} onChange={(event) => onChange(event.target.value)} className={`${input} min-h-28 py-2`} />
    </label>
  );
}

function SwitchField({ checked, label, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`flex min-h-14 w-full items-center justify-between gap-3 rounded-[18px] border px-4 py-2.5 text-right transition-colors ${checked ? "border-violet-200 bg-violet-50 dark:border-violet-400/20 dark:bg-violet-400/[0.08]" : "border-slate-200 bg-slate-50/80 dark:border-white/10 dark:bg-white/[0.035]"}`}
    >
      <span>
        <span className="block text-right text-xs font-black text-slate-800 dark:text-slate-100">{label}</span>
        <span className={`mt-0.5 block text-[9px] font-bold ${checked ? "text-violet-600 dark:text-violet-300" : "text-slate-400"}`}>{checked ? "مُفعّل الآن" : "غير مُفعّل"}</span>
      </span>
      <span className={`relative h-7 w-12 shrink-0 rounded-full shadow-inner transition ${checked ? "bg-gradient-to-l from-violet-600 to-blue-500" : "bg-slate-300 dark:bg-slate-700"}`}>
        <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-md transition ${checked ? "left-6" : "left-1"}`} />
      </span>
    </button>
  );
}

function ReadOnlyInfo({ label, value }) {
  return (
    <div className="rounded-[18px] border border-cyan-200/80 bg-gradient-to-l from-cyan-50 to-blue-50 px-4 py-3 dark:border-cyan-400/15 dark:from-cyan-400/[0.07] dark:to-blue-400/[0.05]">
      <p className="text-[9px] font-black text-cyan-700 dark:text-cyan-300">{label}</p>
      <p className="mt-1 text-xs font-bold leading-5 text-slate-700 dark:text-slate-100">{value}</p>
    </div>
  );
}

const input = "h-11 w-full rounded-xl border border-white/90 bg-white/90 px-3 text-[11px] font-black text-slate-800 shadow-sm outline-none transition-colors focus:border-violet-400 focus:ring-2 focus:ring-violet-400/15 dark:border-white/10 dark:bg-[#0B1220]/90 dark:text-white dark:focus:border-violet-400/60";
