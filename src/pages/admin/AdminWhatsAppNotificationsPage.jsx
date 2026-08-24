import { useEffect, useState } from "react";
import {
  Activity,
  BellRing,
  Clock3,
  ChevronDown,
  Edit3,
  Filter,
  Info,
  MessageCircle,
  Plus,
  Radio,
  RefreshCw,
  RotateCcw,
  Send,
  Server,
  Trash2,
  UserRoundPlus,
  UsersRound,
  Wifi,
  WifiOff,
} from "lucide-react";
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
import "../../styles/admin-whatsapp-notifications.css";

const defaultPreferences = {
  successfulPayment: true,
  manualDepositPending: true,
  providerOrderFailed: true,
  paymentWebhookError: true,
  financialDayClosed: true,
  largeWalletAdjustment: true,
  providerBalanceWarning: true,
  subAgentRequestSubmitted: true,
};

const preferenceLabels = {
  successfulPayment: "دفع ناجح",
  manualDepositPending: "إيداع قيد المراجعة",
  providerOrderFailed: "فشل المورد",
  paymentWebhookError: "خطأ إشعار الدفع التلقائي",
  financialDayClosed: "تقفيل اليوم",
  largeWalletAdjustment: "تعديل محفظة كبير",
  providerBalanceWarning: "تحذير رصيد مورد",
  subAgentRequestSubmitted: "طلب وكيل فرعي جديد",
};

const deliveryStatusLabels = {
  pending: "قيد الانتظار",
  queued: "في قائمة الانتظار",
  processing: "جارٍ الإرسال",
  sent: "تم الإرسال",
  delivered: "تم التسليم",
  failed: "فشل الإرسال",
  retry_pending: "بانتظار إعادة المحاولة",
  sent_unconfirmed: "تم الإرسال دون تأكيد",
  skipped: "تم التجاوز",
  enabled: "مفعّلة",
  disabled: "معطّلة",
  reachable: "متصلة",
  connected: "متصلة",
  disconnected: "غير متصلة",
  unknown: "غير معروفة",
  configured: "مضبوطة",
  missing: "غير مضبوطة",
};

const eventTypeLabels = {
  ...preferenceLabels,
  successful_payment: preferenceLabels.successfulPayment,
  manual_deposit_pending: preferenceLabels.manualDepositPending,
  provider_order_failed: preferenceLabels.providerOrderFailed,
  payment_webhook_error: preferenceLabels.paymentWebhookError,
  financial_day_closed: preferenceLabels.financialDayClosed,
  large_wallet_adjustment: preferenceLabels.largeWalletAdjustment,
  provider_balance_warning: preferenceLabels.providerBalanceWarning,
};

const statusFilterOptions = [
  { value: "", label: "كل الحالات" },
  { value: "pending", label: "قيد الانتظار" },
  { value: "sent", label: "تم الإرسال" },
  { value: "failed", label: "فشل الإرسال" },
  { value: "retry_pending", label: "بانتظار إعادة المحاولة" },
  { value: "sent_unconfirmed", label: "تم الإرسال دون تأكيد" },
  { value: "skipped", label: "تم التجاوز" },
];

const eventFilterOptions = [
  { value: "", label: "كل أنواع الأحداث" },
  ...Object.entries(preferenceLabels).map(([value, label]) => ({ value, label })),
];

const recipientFilterOptions = [
  { value: "", label: "كل أنواع المستلمين" },
  { value: "customer", label: "العملاء" },
  { value: "admin", label: "الإدارة" },
];

function translateDeliveryStatus(value) {
  if (!value) return "-";
  return deliveryStatusLabels[String(value).trim().toLowerCase()] || "حالة غير معروفة";
}

function translateEventType(value) {
  if (!value) return "حدث غير محدد";
  return eventTypeLabels[value] || eventTypeLabels[String(value).trim().toLowerCase()] || "حدث إشعار واتساب";
}

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
  const [filtersOpen, setFiltersOpen] = useState(false);
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
    <div dir="rtl" className="wa-admin-page">
      <section className="wa-admin-hero">
        <span className="wa-admin-hero-glow is-one" aria-hidden="true" />
        <span className="wa-admin-hero-glow is-two" aria-hidden="true" />
        <div className="wa-admin-hero-main">
          <span className="wa-admin-brand-icon" aria-hidden="true">
            <MessageCircle />
          </span>
          <div className="wa-admin-hero-copy">
            <span className="wa-admin-eyebrow">مركز التواصل الفوري</span>
            <h1>إشعارات واتساب</h1>
            <p>تابع حالة الخدمة، ونظّم المستلمين، وراجع جميع عمليات الإرسال من مكان واحد.</p>
          </div>
          <span className={`wa-admin-connection-chip${status?.canReachOpenWA ? " is-online" : ""}`}>
            {status?.canReachOpenWA ? <Wifi /> : <WifiOff />}
            {status?.canReachOpenWA ? "الخدمة متصلة" : "الخدمة غير متصلة"}
          </span>
          <button type="button" onClick={loadAll} disabled={loading || busy} className="wa-admin-refresh">
            <RefreshCw className={loading ? "animate-spin" : ""} />
            {loading ? "جارٍ التحديث..." : "تحديث البيانات"}
          </button>
        </div>

        <div className="wa-admin-overview">
          <OverviewCard
            icon={status?.canReachOpenWA ? Wifi : WifiOff}
            label="حالة الاتصال"
            value={status?.canReachOpenWA ? "متصلة" : "غير متصلة"}
            tone={status?.canReachOpenWA ? "green" : "red"}
          />
          <OverviewCard icon={UsersRound} label="مستلمو الإدارة" value={`${recipients.length} مستلم`} tone="violet" />
          <OverviewCard icon={BellRing} label="السجلات المعروضة" value={`${logs.length} سجل`} tone="blue" />
          <OverviewCard
            icon={Server}
            label="جلسة الإرسال"
            value={status?.sessionIdConfigured ? "مضبوطة" : "غير مضبوطة"}
            tone={status?.sessionIdConfigured ? "green" : "orange"}
          />
        </div>
      </section>

      <section className="wa-admin-primary-grid">
        <Panel
          className="wa-admin-status-panel"
          icon={Radio}
          title="حالة خدمة واتساب"
          description="معلومات الاتصال والجلسة الحالية"
        >
          <div className="wa-admin-status-list">
            <StatusRow label="حالة التشغيل" value={status?.enabled ? "مفعّلة" : "معطّلة"} tone={status?.enabled ? "good" : "warn"} />
            <StatusRow label="حالة الاتصال" value={status?.canReachOpenWA ? translateDeliveryStatus(status?.status || "reachable") : "غير معروفة"} tone={status?.canReachOpenWA ? "good" : "warn"} />
            <StatusRow label="معرّف الجلسة" value={status?.sessionIdConfigured ? status?.sessionId || "مضبوط" : "غير مضبوط"} />
            <StatusRow label="آخر فحص" value={formatDateTime(lastChecked, "ar-EG-u-nu-latn")} />
          </div>
          {status?.lastError ? (
            <div className="wa-admin-service-alert">
              <WifiOff />
              <p>يوجد خطأ في الاتصال بخدمة واتساب. راجع إعدادات الخدمة في الخادم.</p>
            </div>
          ) : (
            <div className="wa-admin-service-note">
              <Info />
              <p>يتم تحديث حالة الاتصال عند فتح الصفحة أو الضغط على زر تحديث البيانات.</p>
            </div>
          )}
        </Panel>

        <Panel
          className="wa-admin-recipient-form-panel"
          icon={form.id ? Edit3 : UserRoundPlus}
          title={form.id ? "تعديل بيانات المستلم" : "إضافة مستلم جديد"}
          description="حدد رقم واتساب وأنواع التنبيهات التي سيستقبلها"
          action={form.id ? <Badge tone="warn">وضع التعديل</Badge> : null}
        >
          <form onSubmit={saveRecipient} className="wa-admin-recipient-form">
            <div className="wa-admin-form-grid">
              <Input label="اسم المستلم" value={form.name} onChange={(value) => setForm((current) => ({ ...current, name: value }))} placeholder="مثال: مدير العمليات" />
              <Input label="رقم واتساب" dir="ltr" value={form.phone} onChange={(value) => setForm((current) => ({ ...current, phone: value }))} placeholder="+2010xxxxxxx" />
            </div>

            <label className="wa-admin-toggle-card">
              <span>
                <b>تفعيل هذا المستلم</b>
                <small>السماح بإرسال إشعارات واتساب لهذا الرقم</small>
              </span>
              <input type="checkbox" checked={form.enabled} onChange={(event) => setForm((current) => ({ ...current, enabled: event.target.checked }))} />
            </label>

            <div className="wa-admin-preferences">
              <div className="wa-admin-preferences-heading">
                <BellRing />
                <div>
                  <b>أنواع الإشعارات</b>
                  <small>اختر الأحداث التي تريد إرسالها لهذا المستلم</small>
                </div>
              </div>
              <div className="wa-admin-preferences-grid">
                {Object.entries(preferenceLabels).map(([key, label]) => (
                  <label key={key} className="wa-admin-preference">
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
            </div>

            <div className="wa-admin-form-actions">
              <button type="submit" disabled={Boolean(busy)} className="wa-admin-primary-button">
                {form.id ? <Edit3 /> : <Plus />}
                {form.id ? "حفظ التعديلات" : "إضافة المستلم"}
              </button>
              {form.id ? (
                <button type="button" onClick={() => setForm(emptyForm)} className="wa-admin-secondary-button">
                  إلغاء التعديل
                </button>
              ) : null}
            </div>
          </form>
        </Panel>
      </section>

      <Panel
        className="wa-admin-recipients-panel"
        icon={UsersRound}
        title="مستلمو الإدارة"
        description="الأرقام الإدارية التي تستقبل إشعارات المنصة"
        action={<span className="wa-admin-count-badge">{recipients.length} مستلم</span>}
      >
        {loading ? (
          <div className="wa-admin-card-grid">
            {Array.from({ length: 3 }).map((_, index) => <div key={index} className="wa-admin-card-skeleton" />)}
          </div>
        ) : recipients.length ? (
          <div className="wa-admin-card-grid">
            {recipients.map((recipient) => {
              const recipientId = recipient.id || recipient._id;
              const activeEvents = Object.entries(preferenceLabels)
                .filter(([key]) => recipient.eventPreferences?.[key] !== false)
                .map(([, label]) => label);

              return (
                <article key={recipientId} className={`wa-admin-recipient-card${recipient.enabled ? "" : " is-disabled"}`}>
                  <div className="wa-admin-recipient-top">
                    <span className="wa-admin-avatar">{(recipient.name || "م").trim().charAt(0)}</span>
                    <div className="wa-admin-recipient-copy">
                      <h3>{recipient.name || "مستلم بدون اسم"}</h3>
                      <p dir="ltr">{recipient.phone || "-"}</p>
                    </div>
                    <Badge tone={recipient.enabled ? "good" : "muted"}>{recipient.enabled ? "مفعّل" : "متوقف"}</Badge>
                  </div>

                  <div className="wa-admin-recipient-events">
                    <div className="wa-admin-events-title">
                      <BellRing />
                      <span>{activeEvents.length} أنواع إشعارات مفعّلة</span>
                    </div>
                    <div className="wa-admin-event-tags">
                      {activeEvents.slice(0, 3).map((label) => <span key={label}>{label}</span>)}
                      {activeEvents.length > 3 ? <span>+{activeEvents.length - 3}</span> : null}
                    </div>
                  </div>

                  <div className="wa-admin-recipient-actions">
                    <button
                      type="button"
                      onClick={() => run(`test-${recipientId}`, () => sendAdminWhatsAppRecipientTest(token, recipientId), "تم إرسال رسالة تجربة")}
                      disabled={Boolean(busy)}
                      className="is-test"
                    >
                      <Send /> إرسال تجربة
                    </button>
                    <button type="button" onClick={() => editRecipient(recipient)} className="is-edit">
                      <Edit3 /> تعديل
                    </button>
                    <button
                      type="button"
                      onClick={() => run(`delete-${recipientId}`, () => deleteAdminWhatsAppRecipient(token, recipientId), "تم حذف المستلم")}
                      disabled={Boolean(busy)}
                      className="is-delete"
                    >
                      <Trash2 /> حذف
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <EmptyBlock icon={UsersRound} title="لا يوجد مستلمون بعد" description="أضف أول مستلم إداري من النموذج الموجود بالأعلى." />
        )}
      </Panel>

      <Panel
        className="wa-admin-logs-panel"
        icon={Activity}
        title="سجلات الإرسال"
        description="تابع نتيجة كل إشعار وأعد محاولة الرسائل الفاشلة"
        action={<span className="wa-admin-count-badge">{logs.length} سجل</span>}
      >
        <div className="mb-3 overflow-hidden rounded-[13px] border border-slate-200 dark:border-white/[0.07]">
          <button
            type="button"
            onClick={() => setFiltersOpen((open) => !open)}
            aria-expanded={filtersOpen}
            aria-controls="whatsapp-logs-filters-content"
            className="flex min-h-11 w-full items-center gap-2 px-3 text-right transition hover:bg-slate-50 dark:hover:bg-white/[0.04]"
          >
            <Filter className="h-4 w-4 text-emerald-600 dark:text-emerald-300" />
            <b className="flex-1 text-xs font-black text-slate-900 dark:text-white">الفلاتر</b>
            <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform ${filtersOpen ? "rotate-180" : ""}`} />
          </button>
          <div id="whatsapp-logs-filters-content" className={`grid transition-[grid-template-rows] duration-300 ${filtersOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
          <div className={filtersOpen ? "overflow-visible" : "overflow-hidden"}>
        <div className="wa-admin-filters">
          <Select label="الحالة" value={filters.status} options={statusFilterOptions} onChange={(value) => setFilters((current) => ({ ...current, status: value }))} />
          <Select label="نوع الحدث" value={filters.eventType} options={eventFilterOptions} onChange={(value) => setFilters((current) => ({ ...current, eventType: value }))} />
          <Select label="نوع المستلم" value={filters.recipientType} options={recipientFilterOptions} onChange={(value) => setFilters((current) => ({ ...current, recipientType: value }))} />
          <button type="button" onClick={refreshLogs} disabled={Boolean(busy)} className="wa-admin-filter-button">
            <RefreshCw className={busy === "logs" ? "animate-spin" : ""} />
            تطبيق الفلاتر
          </button>
        </div>
          </div>
          </div>
        </div>

        {logs.length ? (
          <div className="wa-admin-logs-list">
            {logs.map((log) => {
              const logId = log._id || log.id;
              const tone = log.status === "sent" ? "good" : log.status === "failed" ? "bad" : log.status === "skipped" ? "muted" : "warn";

              return (
                <article key={logId} className={`wa-admin-log is-${tone}`}>
                  <span className="wa-admin-log-icon">
                    {log.status === "sent" ? <Send /> : log.status === "failed" ? <WifiOff /> : <Clock3 />}
                  </span>
                  <div className="wa-admin-log-copy">
                    <div className="wa-admin-log-title">
                      <h3>{translateEventType(log.eventType)}</h3>
                      <Badge tone={tone}>{translateDeliveryStatus(log.status)}</Badge>
                    </div>
                    <p>{log.title || log.message || "إشعار واتساب بدون تفاصيل إضافية."}</p>
                    {log.createdAt ? <small>{formatDateTime(log.createdAt, "ar-EG-u-nu-latn")}</small> : null}
                  </div>
                  {log.status === "failed" ? (
                    <button
                      type="button"
                      onClick={() => run(`retry-${logId}`, () => retryAdminWhatsAppLog(token, logId), "تمت إعادة المحاولة")}
                      disabled={Boolean(busy)}
                      className="wa-admin-retry"
                    >
                      <RotateCcw /> إعادة المحاولة
                    </button>
                  ) : null}
                </article>
              );
            })}
          </div>
        ) : (
          <EmptyBlock icon={Activity} title="لا توجد سجلات مطابقة" description="غيّر الفلاتر أو حدّث البيانات لعرض أحدث عمليات الإرسال." />
        )}
      </Panel>

      <section className="wa-admin-tips">
        <span className="wa-admin-tips-icon"><Info /></span>
        <div>
          <h2>إرشادات مهمة</h2>
          <p>استخدم رقم واتساب منفصلًا للإشعارات، وتأكد من اتصال جلسة الخدمة قبل إرسال رسائل التجربة.</p>
        </div>
      </section>
    </div>
  );
}

function OverviewCard({ icon: Icon, label, tone, value }) {
  return (
    <article className={`wa-admin-overview-card is-${tone}`}>
      <span><Icon /></span>
      <div>
        <small>{label}</small>
        <b>{value}</b>
      </div>
    </article>
  );
}

function Panel({ action, children, className = "", description, icon: Icon, title }) {
  return (
    <section className={`admin-whatsapp-panel ${className}`}>
      <header className="wa-admin-panel-header">
        <span className="wa-admin-panel-icon"><Icon /></span>
        <div>
          <h2>{title}</h2>
          {description ? <p>{description}</p> : null}
        </div>
        {action ? <div className="wa-admin-panel-action">{action}</div> : null}
      </header>
      <div className="wa-admin-panel-body">{children}</div>
    </section>
  );
}

function EmptyBlock({ description, icon: Icon, title }) {
  return (
    <div className="wa-admin-empty">
      <span><Icon /></span>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}

function Input({ label, value, onChange, placeholder = "", dir = "rtl" }) {
  return (
    <label className="wa-admin-field">
      <span>{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        dir={dir}
        className="wa-admin-input"
      />
    </label>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <label className="wa-admin-field">
      <span>{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="wa-admin-input"
      >
        {options.map((option) => (
          <option key={option.value || "all"} value={option.value}>{option.label}</option>
        ))}
      </select>
    </label>
  );
}

function StatusRow({ label, value, tone = "muted" }) {
  return (
    <div className="admin-whatsapp-status-row">
      <span>{label}</span>
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
  return <span className={`wa-admin-badge is-${tone} ${classes[tone]}`}>{children}</span>;
}
