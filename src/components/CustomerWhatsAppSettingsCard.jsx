import { useEffect, useMemo, useState } from "react";
import { BadgeCheck, MessageCircle, Save, Send, ShieldCheck } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "./ToastProvider";
import {
  getMyWhatsAppSettings,
  sendMyWhatsAppCode,
  sendMyWhatsAppTest,
  updateMyWhatsAppSettings,
  verifyMyWhatsAppCode,
} from "../api/whatsappNotifications";

const preferenceGroups = [
  { key: "walletTopupCompleted", label: "شحن المحفظة" },
  { key: "manualDepositApproved", label: "الإيداعات اليدوية" },
  { key: "orderCreated", label: "إنشاء الطلبات" },
  { key: "orderCompleted", label: "تنفيذ الطلبات" },
  { key: "orderFailed", label: "تعذر الطلبات" },
  { key: "identityVerificationRequired", label: "تنبيهات الهوية" },
  { key: "securityAlerts", label: "تنبيهات الأمان" },
];

export default function CustomerWhatsAppSettingsCard() {
  const { token } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!token) return;
      setLoading(true);
      try {
        const result = await getMyWhatsAppSettings(token);
        if (!cancelled) {
          setSettings(result.settings);
          setPhone(result.settings.phone || "");
        }
      } catch (error) {
        if (!cancelled) showToast({ type: "error", title: "تعذر تحميل واتساب", message: error.userMessage || error.message });
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [showToast, token]);

  const phoneChanged = String(phone || "").trim() !== String(settings?.phone || "");
  const verified = settings?.phoneVerified === true && !phoneChanged;
  const canSendTest = settings?.enabled === true && verified;
  const preferences = useMemo(() => settings?.eventPreferences || {}, [settings]);

  const updatePreference = (key) => {
    setSettings((current) => ({
      ...current,
      eventPreferences: {
        ...(current?.eventPreferences || {}),
        [key]: current?.eventPreferences?.[key] === false,
      },
    }));
  };

  const run = async (action, fn, successTitle) => {
    if (busy) return;
    setBusy(action);
    try {
      const result = await fn();
      if (result?.settings) {
        setSettings(result.settings);
        setPhone(result.settings.phone || phone);
      }
      showToast({ type: "success", title: successTitle, message: result?.message || "تم تنفيذ العملية بنجاح." });
    } catch (error) {
      showToast({ type: "error", title: "تعذر تنفيذ العملية", message: error.userMessage || error.message });
    } finally {
      setBusy("");
    }
  };

  if (loading) {
    return (
      <article className="rounded-[24px] border border-emerald-100 bg-white/90 p-4 dark:border-white/10 dark:bg-[#111827]">
        <div className="h-6 w-44 animate-pulse rounded-xl bg-slate-200 dark:bg-white/10" />
        <div className="mt-4 h-28 animate-pulse rounded-2xl bg-slate-100 dark:bg-white/5" />
      </article>
    );
  }

  return (
    <article dir="rtl" className="rounded-[24px] border border-emerald-200 bg-white/90 p-4 text-right shadow-[0_14px_34px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-[#111827]">
      <div className="mb-4 flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300">
          <MessageCircle className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-black text-slate-950 dark:text-white">إشعارات واتساب</h2>
          <p className="mt-0.5 text-xs font-semibold leading-5 text-slate-500 dark:text-slate-400">إعداد مستقل عن إشعارات التطبيق.</p>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-xs font-black ${verified ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200" : "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-200"}`}>
          {verified ? "مؤكد" : "غير مؤكد"}
        </span>
      </div>

      <div className="space-y-3">
        <SwitchRow
          label="تفعيل إشعارات واتساب"
          checked={settings?.enabled === true}
          onChange={() => setSettings((current) => ({ ...current, enabled: current?.enabled !== true }))}
        />

        <label className="block">
          <span className="mb-2 block text-xs font-black text-slate-600 dark:text-slate-300">رقم واتساب</span>
          <input
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="+2010xxxxxxx"
            dir="ltr"
            className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 text-left text-sm font-bold text-slate-900 outline-none transition focus:border-emerald-400 dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
          />
        </label>

        {settings?.enabled && !verified && (
          <p className="rounded-2xl border border-amber-100 bg-amber-50 px-3 py-2 text-xs font-bold leading-5 text-amber-700 dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-200">
            لن تصلك إشعارات واتساب حتى يتم تأكيد الرقم.
          </p>
        )}

        <div className="grid gap-2 sm:grid-cols-2">
          {preferenceGroups.map((item) => (
            <SwitchRow key={item.key} label={item.label} checked={preferences[item.key] !== false} onChange={() => updatePreference(item.key)} />
          ))}
        </div>

        <div className="grid gap-2 md:grid-cols-4">
          <button
            type="button"
            onClick={() => run("save", () => updateMyWhatsAppSettings(token, { enabled: settings?.enabled === true, phone, eventPreferences: preferences }), "تم حفظ إعدادات واتساب")}
            disabled={Boolean(busy)}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-3 text-xs font-black text-white disabled:opacity-60"
          >
            <Save className="h-4 w-4" /> حفظ
          </button>
          <button
            type="button"
            onClick={() => run("code", () => sendMyWhatsAppCode(token, phone), "تم إرسال كود التفعيل")}
            disabled={Boolean(busy) || !phone.trim()}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 text-xs font-black text-emerald-700 disabled:opacity-60 dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-200"
          >
            <Send className="h-4 w-4" /> إرسال كود التفعيل
          </button>
          <div className="flex gap-2 md:col-span-2">
            <input
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="123456"
              dir="ltr"
              className="h-11 min-w-0 flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-3 text-center text-sm font-black tracking-[0.2em] outline-none focus:border-emerald-400 dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
            />
            <button
              type="button"
              onClick={() => run("verify", () => verifyMyWhatsAppCode(token, code), "تم تأكيد رقم واتساب")}
              disabled={Boolean(busy) || code.length !== 6}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-sky-200 bg-sky-50 px-3 text-xs font-black text-sky-700 disabled:opacity-60 dark:border-sky-400/20 dark:bg-sky-500/10 dark:text-sky-200"
            >
              <BadgeCheck className="h-4 w-4" /> تأكيد الكود
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={() => run("test", () => sendMyWhatsAppTest(token), "تم إرسال رسالة التجربة")}
          disabled={Boolean(busy) || !canSendTest}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-700 disabled:opacity-50 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200"
        >
          <ShieldCheck className="h-4 w-4" /> إرسال رسالة تجربة
        </button>
      </div>
    </article>
  );
}

function SwitchRow({ label, checked, onChange }) {
  return (
    <button type="button" role="switch" aria-checked={checked} onClick={onChange} className="flex min-h-11 items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-right dark:border-white/10 dark:bg-white/[0.035]">
      <span className="text-xs font-black text-slate-700 dark:text-slate-200">{label}</span>
      <span className={`relative h-6 w-11 shrink-0 rounded-full transition ${checked ? "bg-emerald-600" : "bg-slate-300 dark:bg-slate-700"}`}>
        <span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition ${checked ? "left-6" : "left-1"}`} />
      </span>
    </button>
  );
}
