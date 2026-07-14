import { useEffect, useState } from "react";
import { MessageCircle, Plus, RefreshCw, RotateCcw, Send, Trash2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../components/ToastProvider";
import { formatDateTime } from "../../api/adapters";
import {
  createAdminWhatsAppRecipient,
  deleteAdminWhatsAppRecipient,
  getAdminWhatsAppLogs,
  getAdminWhatsAppRecipients,
  getAdminWhatsAppStatus,
  retryAdminWhatsAppLog,
  sendAdminWhatsAppRecipientTest,
  updateAdminWhatsAppRecipient,
} from "../../api/whatsappNotifications";

const defaultPreferences = {
  successfulPayment: true,
  manualDepositPending: true,
  providerOrderFailed: true,
  paymentWebhookError: true,
  financialDayClosed: true,
  largeWalletAdjustment: true,
  providerBalanceWarning: true,
};

const preferenceLabels = {
  successfulPayment: "دفع ناجح",
  manualDepositPending: "إيداع قيد المراجعة",
  providerOrderFailed: "فشل المورد",
  paymentWebhookError: "خطأ Webhook",
  financialDayClosed: "تقفيل اليوم",
  largeWalletAdjustment: "تعديل محفظة كبير",
  providerBalanceWarning: "تحذير رصيد مورد",
};

const emptyForm = { id: "", name: "", phone: "", enabled: true, eventPreferences: defaultPreferences };

export default function AdminWhatsAppNotificationsPage() {
  const { token } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [status, setStatus] = useState(null);
  const [recipients, setRecipients] = useState([]);
  const [logs, setLogs] = useState([]);
  const [filters, setFilters] = useState({ status: "", eventType: "", recipientType: "" });
  const [form, setForm] = useState(emptyForm);
  const lastChecked = status?._checkedAt || null;

  const loadAll = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [nextStatus, nextRecipients, nextLogs] = await Promise.all([
        getAdminWhatsAppStatus(token),
        getAdminWhatsAppRecipients(token),
        getAdminWhatsAppLogs(token, { page: 1, limit: 20, ...filters }),
      ]);
      setStatus({ ...nextStatus, _checkedAt: new Date().toISOString() });
      setRecipients(nextRecipients);
      setLogs(nextLogs.logs);
    } catch (error) {
      showToast({ type: "error", title: "تعذر تحميل واتساب", message: error.userMessage || error.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const run = async (action, fn, title) => {
    if (busy) return;
    setBusy(action);
    try {
      await fn();
      showToast({ type: "success", title, message: "تم تنفيذ العملية بنجاح." });
      await loadAll();
    } catch (error) {
      showToast({ type: "error", title: "تعذر تنفيذ العملية", message: error.userMessage || error.message });
    } finally {
      setBusy("");
    }
  };

  const saveRecipient = async (event) => {
    event.preventDefault();
    const payload = {
      name: form.name,
      phone: form.phone,
      enabled: form.enabled,
      eventPreferences: form.eventPreferences,
    };
    await run(
      "save-recipient",
      () => (form.id ? updateAdminWhatsAppRecipient(token, form.id, payload) : createAdminWhatsAppRecipient(token, payload)),
      form.id ? "تم تحديث المستلم" : "تم إضافة المستلم",
    );
    setForm(emptyForm);
  };

  const editRecipient = (recipient) => {
    setForm({
      id: recipient.id || recipient._id,
      name: recipient.name || "",
      phone: recipient.phone || "",
      enabled: recipient.enabled !== false,
      eventPreferences: { ...defaultPreferences, ...(recipient.eventPreferences || {}) },
    });
  };

  const refreshLogs = () => run("logs", async () => {
    const result = await getAdminWhatsAppLogs(token, { page: 1, limit: 20, ...filters });
    setLogs(result.logs);
  }, "تم تحديث السجلات");

  return (
    <div dir="rtl" className="mx-auto max-w-[1180px] space-y-4 pb-8 text-right">
      <section className="rounded-[24px] border border-emerald-100 bg-white/95 p-5 shadow-[0_18px_45px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-[#111827]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300">
              <MessageCircle className="h-6 w-6" />
            </span>
            <div>
              <h1 className="text-2xl font-black text-slate-950 dark:text-white">إشعارات واتساب</h1>
              <p className="mt-1 text-sm font-bold text-slate-500 dark:text-slate-400">إدارة OpenWA والمستلمين والسجلات التشغيلية.</p>
            </div>
          </div>
          <button onClick={loadAll} disabled={loading || busy} className="inline-flex h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 disabled:opacity-60 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200">
            <RefreshCw className="h-4 w-4" /> تحديث الحالة
          </button>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
        <Panel title="OpenWA Status">
          <StatusRow label="Enabled" value={status?.enabled ? "Enabled" : "Disabled"} tone={status?.enabled ? "good" : "warn"} />
          <StatusRow label="Session id" value={status?.sessionIdConfigured ? status?.sessionId || "Configured" : "Missing"} />
          <StatusRow label="Connection" value={status?.canReachOpenWA ? status?.status || "reachable" : "unknown"} tone={status?.canReachOpenWA ? "good" : "warn"} />
          <StatusRow label="Last checked" value={formatDateTime(lastChecked, "ar-EG-u-nu-latn")} />
          {status?.lastError && <p className="rounded-2xl border border-amber-100 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-700 dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-200">{status.lastError}</p>}
        </Panel>

        <Panel title={form.id ? "تعديل مستلم" : "إضافة مستلم"}>
          <form onSubmit={saveRecipient} className="grid gap-3 md:grid-cols-2">
            <Input label="الاسم" value={form.name} onChange={(value) => setForm((current) => ({ ...current, name: value }))} />
            <Input label="رقم واتساب" dir="ltr" value={form.phone} onChange={(value) => setForm((current) => ({ ...current, phone: value }))} />
            <label className="flex h-11 items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-3 text-xs font-black dark:border-white/10 dark:bg-white/[0.04]">
              <span>مفعل</span>
              <input type="checkbox" checked={form.enabled} onChange={(event) => setForm((current) => ({ ...current, enabled: event.target.checked }))} />
            </label>
            <div className="flex gap-2">
              <button disabled={Boolean(busy)} className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 text-xs font-black text-white disabled:opacity-60">
                <Plus className="h-4 w-4" /> {form.id ? "حفظ التعديل" : "إضافة"}
              </button>
              {form.id && <button type="button" onClick={() => setForm(emptyForm)} className="h-11 rounded-2xl border border-slate-200 px-4 text-xs font-black dark:border-white/10">إلغاء</button>}
            </div>
            <div className="md:col-span-2 grid gap-2 sm:grid-cols-2">
              {Object.entries(preferenceLabels).map(([key, label]) => (
                <label key={key} className="flex h-10 items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-3 text-xs font-bold dark:border-white/10 dark:bg-white/[0.04]">
                  <span>{label}</span>
                  <input
                    type="checkbox"
                    checked={form.eventPreferences[key] !== false}
                    onChange={(event) => setForm((current) => ({
                      ...current,
                      eventPreferences: { ...current.eventPreferences, [key]: event.target.checked },
                    }))}
                  />
                </label>
              ))}
            </div>
          </form>
        </Panel>
      </section>

      <Panel title="Admin Recipients">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-xs text-slate-500">
              <tr>
                <th className="p-2">الاسم</th>
                <th className="p-2">الهاتف</th>
                <th className="p-2">الحالة</th>
                <th className="p-2">الأحداث</th>
                <th className="p-2">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {recipients.map((recipient) => (
                <tr key={recipient.id || recipient._id} className="border-t border-slate-100 dark:border-white/10">
                  <td className="p-2 font-black">{recipient.name}</td>
                  <td className="p-2 font-bold" dir="ltr">{recipient.phone}</td>
                  <td className="p-2"><Badge tone={recipient.enabled ? "good" : "muted"}>{recipient.enabled ? "مفعل" : "متوقف"}</Badge></td>
                  <td className="p-2 text-xs text-slate-500">{Object.entries(preferenceLabels).filter(([key]) => recipient.eventPreferences?.[key] !== false).map(([, label]) => label).join("، ")}</td>
                  <td className="p-2">
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => run(`test-${recipient.id}`, () => sendAdminWhatsAppRecipientTest(token, recipient.id || recipient._id), "تم إرسال رسالة تجربة")} className="grid h-9 w-9 place-items-center rounded-xl border border-emerald-200 text-emerald-700 dark:border-emerald-400/20 dark:text-emerald-200" title="إرسال تجربة"><Send className="h-4 w-4" /></button>
                      <button onClick={() => editRecipient(recipient)} className="h-9 rounded-xl border border-slate-200 px-3 text-xs font-black dark:border-white/10">تعديل</button>
                      <button onClick={() => run(`delete-${recipient.id}`, () => deleteAdminWhatsAppRecipient(token, recipient.id || recipient._id), "تم حذف المستلم")} className="grid h-9 w-9 place-items-center rounded-xl border border-rose-200 text-rose-600 dark:border-rose-400/20 dark:text-rose-200" title="حذف"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {recipients.length === 0 && <tr><td colSpan={5} className="p-5 text-center text-sm font-bold text-slate-500">لا يوجد مستلمون بعد.</td></tr>}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel title="Logs">
        <div className="mb-3 grid gap-2 md:grid-cols-[1fr_1fr_1fr_auto]">
          <Input label="Status" value={filters.status} onChange={(value) => setFilters((current) => ({ ...current, status: value }))} placeholder="pending / sent / failed" />
          <Input label="Event type" value={filters.eventType} onChange={(value) => setFilters((current) => ({ ...current, eventType: value }))} />
          <Input label="Recipient type" value={filters.recipientType} onChange={(value) => setFilters((current) => ({ ...current, recipientType: value }))} placeholder="customer / admin" />
          <button onClick={refreshLogs} className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 text-xs font-black dark:border-white/10">
            <RefreshCw className="h-4 w-4" /> فلترة
          </button>
        </div>
        <div className="space-y-2">
          {logs.map((log) => (
            <div key={log._id || log.id} className="grid gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs dark:border-white/10 dark:bg-white/[0.04] md:grid-cols-[120px_150px_1fr_auto]">
              <Badge tone={log.status === "sent" ? "good" : log.status === "failed" ? "bad" : log.status === "skipped" ? "muted" : "warn"}>{log.status}</Badge>
              <span className="font-black">{log.eventType}</span>
              <span className="min-w-0 truncate text-slate-600 dark:text-slate-300">{log.title || log.message}</span>
              {log.status === "failed" && (
                <button onClick={() => run(`retry-${log._id}`, () => retryAdminWhatsAppLog(token, log._id || log.id), "تمت إعادة المحاولة")} className="inline-flex h-8 items-center gap-1 rounded-xl border border-sky-200 px-2 font-black text-sky-700 dark:border-sky-400/20 dark:text-sky-200">
                  <RotateCcw className="h-3.5 w-3.5" /> Retry
                </button>
              )}
            </div>
          ))}
          {logs.length === 0 && <p className="rounded-2xl border border-slate-200 p-5 text-center text-sm font-bold text-slate-500 dark:border-white/10">لا توجد سجلات مطابقة.</p>}
        </div>
      </Panel>

      <Panel title="Instructions">
        <ul className="space-y-2 text-sm font-bold leading-6 text-slate-600 dark:text-slate-300">
          <li>استخدم رقم واتساب منفصل للإشعارات.</li>
          <li>تأكد من اتصال جلسة OpenWA قبل الإرسال.</li>
        </ul>
      </Panel>
    </div>
  );
}

function Panel({ title, children }) {
  return (
    <section className="rounded-[24px] border border-slate-200 bg-white/95 p-4 shadow-[0_14px_34px_rgba(15,23,42,0.05)] dark:border-white/10 dark:bg-[#111827]">
      <h2 className="mb-3 text-base font-black text-slate-950 dark:text-white">{title}</h2>
      {children}
    </section>
  );
}

function Input({ label, value, onChange, placeholder = "", dir = "rtl" }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-black text-slate-500">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        dir={dir}
        className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm font-bold outline-none focus:border-emerald-400 dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
      />
    </label>
  );
}

function StatusRow({ label, value, tone = "muted" }) {
  return (
    <div className="mb-2 flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/[0.04]">
      <span className="font-bold text-slate-500 dark:text-slate-400">{label}</span>
      <Badge tone={tone}>{value || "-"}</Badge>
    </div>
  );
}

function Badge({ tone = "muted", children }) {
  const classes = {
    good: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200",
    bad: "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-200",
    warn: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-200",
    muted: "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-200",
  };
  return <span className={`inline-flex max-w-full items-center justify-center rounded-full px-2.5 py-1 text-xs font-black ${classes[tone]}`}>{children}</span>;
}
