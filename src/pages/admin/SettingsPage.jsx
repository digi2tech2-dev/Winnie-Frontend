import { useCallback, useEffect, useState } from "react";
import { Loader2, RefreshCw, Save, Settings } from "lucide-react";
import {
  ADMIN_SETTING_KEYS,
  getAdminSettings,
  updateManagedAdminSetting,
} from "../../api/adminSettings";
import { useToast } from "../../components/ToastProvider";
import { useAuth } from "../../context/AuthContext";

const numericFields = [
  ADMIN_SETTING_KEYS.orderTimeoutMinutes,
  ADMIN_SETTING_KEYS.providerRetryLimit,
  ADMIN_SETTING_KEYS.maxWalletAdjustment,
  ADMIN_SETTING_KEYS.defaultPaginationLimit,
];

function settingsToForm(settingsByKey = {}) {
  return {
    defaultPaginationLimit: settingsByKey.defaultPaginationLimit?.value ?? 20,
    maintenanceMode: settingsByKey.maintenanceMode?.value === true,
    maxWalletAdjustment: settingsByKey.maxWalletAdjustment?.value ?? 10000,
    orderTimeoutMinutes: settingsByKey.orderTimeoutMinutes?.value ?? 30,
    paymentInstructions: settingsByKey.paymentInstructions?.value || "",
    providerRetryLimit: settingsByKey.providerRetryLimit?.value ?? 5,
    whatsappNumber: settingsByKey.whatsappNumber?.value || "",
  };
}

export default function AdminSettingsPage() {
  const { token } = useAuth();
  const { showToast } = useToast();
  const [form, setForm] = useState(settingsToForm());
  const [settingsByKey, setSettingsByKey] = useState({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!token) return;

    setLoading(true);
    setError("");

    try {
      const result = await getAdminSettings(token);
      setSettingsByKey(result.settingsByKey);
      setForm(settingsToForm(result.settingsByKey));
    } catch (requestError) {
      setError(requestError.userMessage || "Unable to load backend settings.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const save = async () => {
    if (busy) return;

    setBusy(true);
    setError("");

    try {
      const updates = [
        [ADMIN_SETTING_KEYS.maintenanceMode, form.maintenanceMode],
        [ADMIN_SETTING_KEYS.orderTimeoutMinutes, Number(form.orderTimeoutMinutes)],
        [ADMIN_SETTING_KEYS.providerRetryLimit, Number(form.providerRetryLimit)],
        [ADMIN_SETTING_KEYS.maxWalletAdjustment, Number(form.maxWalletAdjustment)],
        [ADMIN_SETTING_KEYS.defaultPaginationLimit, Number(form.defaultPaginationLimit)],
        [ADMIN_SETTING_KEYS.paymentInstructions, form.paymentInstructions || ""],
        [ADMIN_SETTING_KEYS.whatsappNumber, form.whatsappNumber || ""],
      ];

      for (const [key, value] of updates) {
        await updateManagedAdminSetting(token, key, value);
      }

      await load();
      showToast({ type: "success", title: "Settings saved", message: "Backend settings were updated." });
    } catch (requestError) {
      const message = requestError.userMessage || requestError.message || "Settings could not be saved.";
      setError(message);
      showToast({ type: "error", title: "Settings save failed", message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div dir="rtl" className="space-y-4">
      <section className="flex items-center gap-3 rounded-[26px] border border-violet-200 bg-gradient-to-l from-white to-violet-50 p-5 dark:border-white/10 dark:bg-[linear-gradient(135deg,#111827,#17152A)]">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-blue-500 text-white">
          <Settings className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-black dark:text-white">إعدادات النظام</h1>
          <p className="text-[9px] font-bold text-slate-400">يتم حفظ القيم المدعومة فقط في backend settings.</p>
        </div>
        <button
          type="button"
          disabled={busy || loading}
          onClick={() => void load()}
          className="inline-flex h-10 items-center gap-1 rounded-xl border border-violet-200 bg-white px-3 text-[8px] font-black text-violet-700 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-white/[0.06] dark:text-violet-200"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          تحديث
        </button>
      </section>

      {error && (
        <p className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-xs font-bold text-amber-800 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-200">
          {error}
        </p>
      )}

      {loading ? (
        <section className="grid place-items-center rounded-[22px] border border-slate-200 bg-white p-10 dark:border-white/10 dark:bg-[#111827]">
          <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
        </section>
      ) : (
        <section className="grid gap-4 lg:grid-cols-2">
          <Panel title="Operational settings">
            <SwitchField label="Maintenance mode" checked={form.maintenanceMode} onChange={(value) => set("maintenanceMode", value)} />
            {numericFields.map((field) => (
              <NumberField key={field} label={field} value={form[field]} onChange={(value) => set(field, value)} />
            ))}
          </Panel>

          <Panel title="Payment display settings">
            <TextField label="WhatsApp number" value={form.whatsappNumber} onChange={(value) => set("whatsappNumber", value)} />
            <TextAreaField label="Payment instructions" value={form.paymentInstructions} onChange={(value) => set("paymentInstructions", value)} />
            <ReadOnlyInfo label="Payment groups" value={`${Array.isArray(settingsByKey.paymentGroups?.value) ? settingsByKey.paymentGroups.value.length : 0} configured`} />
            <ReadOnlyInfo label="Country accounts" value={`${Array.isArray(settingsByKey.paymentCountryAccounts?.value) ? settingsByKey.paymentCountryAccounts.value.length : 0} configured`} />
          </Panel>
        </section>
      )}

      <div className="sticky bottom-4 z-20 grid grid-cols-1 gap-2 rounded-[20px] border border-slate-200 bg-white/90 p-2.5 shadow-[0_16px_45px_rgba(15,23,42,0.14)] backdrop-blur-xl dark:border-white/10 dark:bg-[#0b1220]/92">
        <button
          type="button"
          disabled={busy || loading}
          onClick={save}
          className="interactive-ring inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-violet-600 px-5 text-sm font-black text-white shadow-[0_14px_30px_rgba(124,58,237,0.24)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          حفظ الإعدادات
        </button>
      </div>
    </div>
  );
}

function Panel({ children, title }) {
  return (
    <article className="rounded-[24px] border border-slate-200 bg-white/90 p-4 shadow-[0_14px_34px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-[#111827]">
      <h2 className="text-base font-black text-slate-950 dark:text-white">{title}</h2>
      <div className="mt-4 space-y-3">{children}</div>
    </article>
  );
}

function NumberField({ label, value, onChange }) {
  return <InputField label={label} type="number" value={value} onChange={onChange} />;
}

function TextField({ label, value, onChange }) {
  return <InputField label={label} value={value} onChange={onChange} />;
}

function InputField({ label, type = "text", value, onChange }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[9px] font-black text-slate-500">{label}</span>
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} className={input} />
    </label>
  );
}

function TextAreaField({ label, value, onChange }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[9px] font-black text-slate-500">{label}</span>
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
      className="flex min-h-12 w-full items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-right dark:border-white/10 dark:bg-white/[0.035]"
    >
      <span className="text-right text-xs font-black text-slate-700 dark:text-slate-200">{label}</span>
      <span className={`relative h-6 w-11 shrink-0 rounded-full transition ${checked ? "bg-violet-600" : "bg-slate-300 dark:bg-slate-700"}`}>
        <span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition ${checked ? "left-6" : "left-1"}`} />
      </span>
    </button>
  );
}

function ReadOnlyInfo({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-3 py-2 dark:border-white/10 dark:bg-white/[0.035]">
      <p className="text-[9px] font-black text-slate-500">{label}</p>
      <p className="mt-1 text-xs font-black text-slate-800 dark:text-white">{value}</p>
    </div>
  );
}

const input = "h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 text-[10px] font-black outline-none dark:border-white/10 dark:bg-[#0B1220] dark:text-white";
