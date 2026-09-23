import { useCallback, useEffect, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, LoaderCircle, MessageCircle, QrCode, Radio, RefreshCw, RotateCcw, Save, ShieldCheck, Smartphone, Wifi, WifiOff } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../components/ToastProvider";
import ConfirmDialog from "../../components/admin/products/ConfirmDialog";
import { getAdminWhatsAppConfiguration, reconnectAdminWhatsApp, resetAdminWhatsApp, saveAdminWhatsAppSettings } from "../../api/whatsappNotifications";
import "../../styles/admin-whatsapp-notifications.css";

const DEFAULTS = { newOrder: true, paymentSuccess: true, depositPending: true, providerFailure: true, manualReview: true, automaticPaymentError: true, dayClosed: true, largeWalletAdjustment: true, providerBalanceWarning: false, subAgentRequest: true };
const EVENTS = [
  ["newOrder", "طلب جديد", "إشعار عند إنشاء طلب جديد بنجاح"],
  ["paymentSuccess", "دفع ناجح", "إشعار بعد تأكيد عملية الدفع"],
  ["depositPending", "إيداع قيد المراجعة", "إشعار عند وصول طلب إيداع جديد"],
  ["providerFailure", "فشل المورد", "تنبيه عند فشل تنفيذ المورد للطلب"],
  ["manualReview", "طلب يحتاج مراجعة يدوية", "تنبيه للحالات غير المؤكدة أو اليدوية"],
  ["automaticPaymentError", "خطأ الدفع/الإشعار التلقائي", "تنبيه عند تعذر تسوية الدفع تلقائياً"],
  ["dayClosed", "تقفيل اليوم", "إشعار بعد إتمام الإغلاق المالي اليومي"],
  ["largeWalletAdjustment", "تعديل محفظة كبير", "تنبيه بالتعديلات المالية الكبيرة"],
  ["providerBalanceWarning", "تحذير رصيد مورد", "يتطلب إعداد حد صالح لمورد واحد على الأقل"],
  ["subAgentRequest", "طلب وكيل فرعي جديد", "إشعار عند إرسال طلب وكيل فرعي"],
];
const STATUS_META = {
  CONNECTED: { label: "متصل", tone: "connected" }, DISCONNECTED: { label: "غير متصل", tone: "disconnected" }, QR_REQUIRED: { label: "بانتظار مسح QR", tone: "waiting" }, INITIALIZING: { label: "جارٍ التهيئة", tone: "waiting" }, AUTHENTICATED: { label: "تمت المصادقة", tone: "waiting" }, ERROR: { label: "تعذر الاتصال", tone: "error" },
};
const POLLING_STATES = new Set(["INITIALIZING", "QR_REQUIRED", "AUTHENTICATED"]);
const shouldPoll = (nextStatus) => POLLING_STATES.has(nextStatus?.status);
const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : new Intl.DateTimeFormat("ar-EG", { dateStyle: "medium", timeStyle: "short" }).format(date);
};

function ConnectionVisual({ status, onReconnect, busy }) {
  const state = status?.status || "DISCONNECTED";
  if (state === "QR_REQUIRED" && status?.qrDataUrl) return <div className="wa-connection-visual wa-connection-visual--qr"><div className="wa-live-label"><Radio aria-hidden="true" /> الجلسة بانتظار الربط</div><div className="wa-qr-shell"><img src={status.qrDataUrl} alt="رمز QR لربط جلسة واتساب الإدارة" /></div><h2>امسح رمز QR لربط واتساب</h2><p>من واتساب افتح <b>الأجهزة المرتبطة</b> ثم اختر <b>ربط جهاز</b>.</p><span className="wa-live-indicator"><i /> يتم انتظار المسح…</span></div>;
  if (state === "QR_REQUIRED") return <div className="wa-connection-visual wa-connection-visual--waiting"><span className="wa-visual-icon"><LoaderCircle className="wa-spin" /></span><h2>جارٍ إنشاء رمز QR…</h2><p>سيظهر رمز الربط هنا تلقائياً فور أن يصبح جاهزاً.</p><span className="wa-live-indicator"><i /> جارٍ تحديث حالة الجلسة…</span></div>;
  if (state === "INITIALIZING") return <div className="wa-connection-visual wa-connection-visual--waiting"><span className="wa-visual-icon"><LoaderCircle className="wa-spin" /></span><h2>جارٍ تشغيل جلسة واتساب…</h2><p>يتم تجهيز عميل واتساب بشكل آمن. سيظهر رمز الربط فور جاهزيته.</p></div>;
  if (state === "AUTHENTICATED") return <div className="wa-connection-visual wa-connection-visual--waiting"><span className="wa-visual-icon"><ShieldCheck /></span><h2>تمت المصادقة، جارٍ إكمال الاتصال…</h2><p>تم قبول جلسة واتساب، ويتم الآن تأكيد جاهزية الإرسال.</p><span className="wa-live-indicator"><i /> جارٍ التحقق من الاتصال…</span></div>;
  if (state === "CONNECTED") return <div className="wa-connection-visual wa-connection-visual--connected"><span className="wa-visual-icon"><CheckCircle2 /></span><h2>واتساب متصل ويعمل بنجاح</h2><p>سيتم إرسال الأحداث المفعلة إلى رقم الإدارة المجهز على الخادم.</p><span className="wa-live-indicator"><i /> اتصال مباشر وجاهز للإرسال</span></div>;
  if (state === "ERROR") return <div className="wa-connection-visual wa-connection-visual--error"><span className="wa-visual-icon"><AlertCircle /></span><h2>تعذر إكمال اتصال واتساب</h2><p>{status?.lastError || "حدث خطأ أثناء تجهيز جلسة واتساب. حاول الاتصال مرة أخرى."}</p><button type="button" className="wa-button wa-button--primary" onClick={onReconnect} disabled={busy}><RefreshCw className={busy ? "wa-spin" : ""} /> إعادة المحاولة</button></div>;
  return <div className="wa-connection-visual wa-connection-visual--disconnected"><span className="wa-visual-icon"><QrCode /></span><h2>اربط جلسة واتساب الإدارة</h2><p>تُستخدم هذه الجلسة لإرسال الإشعارات التشغيلية إلى رقم الإدارة الوحيد.</p><button type="button" className="wa-button wa-button--primary" onClick={onReconnect} disabled={busy}><Smartphone /> ربط واتساب</button></div>;
}

export default function AdminWhatsAppNotificationsPage() {
  const { token } = useAuth();
  const { showToast } = useToast();
  const [status, setStatus] = useState({ status: "DISCONNECTED" });
  const [preferences, setPreferences] = useState(DEFAULTS);
  const [thresholds, setThresholds] = useState({});
  const [balanceProviders, setBalanceProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [resetConfirmationOpen, setResetConfirmationOpen] = useState(false);
  const mountedRef = useRef(true);
  const pollTimerRef = useRef(null);
  const pollActiveRef = useRef(false);
  const pollRequestRef = useRef(false);
  const statusGenerationRef = useRef(0);

  const stopPolling = useCallback(() => {
    pollActiveRef.current = false;
    if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    pollTimerRef.current = null;
  }, []);

  const applyConfiguration = useCallback((data, { includeSettings = false } = {}) => {
    if (!mountedRef.current || !data) return;
    setStatus(data.status || { status: "DISCONNECTED" });
    if (!includeSettings) return;
    setPreferences({ ...DEFAULTS, ...(data.settings?.eventPreferences || {}) });
    setThresholds(data.settings?.providerBalanceThresholds || {});
    setBalanceProviders(Array.isArray(data.settings?.balanceProviders) ? data.settings.balanceProviders : []);
  }, []);

  const loadConfiguration = useCallback(async ({ showLoader = false, showError = true } = {}) => {
    if (!token) return null;
    const generation = statusGenerationRef.current;
    if (showLoader) setLoading(true);
    try {
      const data = await getAdminWhatsAppConfiguration(token);
      if (!mountedRef.current || generation !== statusGenerationRef.current) return null;
      applyConfiguration(data, { includeSettings: true });
      return data;
    } catch (error) {
      if (showError && mountedRef.current && generation === statusGenerationRef.current) {
        showToast({ type: "error", title: "تعذر تحميل إعدادات واتساب", message: error.userMessage || error.message });
      }
      return null;
    } finally {
      if (showLoader && mountedRef.current && generation === statusGenerationRef.current) setLoading(false);
    }
  }, [applyConfiguration, showToast, token]);

  const refreshConnectionStatus = useCallback(async () => {
    if (!token || pollRequestRef.current) return null;
    const generation = statusGenerationRef.current;
    pollRequestRef.current = true;
    try {
      const data = await getAdminWhatsAppConfiguration(token);
      if (!mountedRef.current || generation !== statusGenerationRef.current) return null;
      applyConfiguration(data);
      return data.status || null;
    } catch (_error) {
      return null;
    } finally {
      pollRequestRef.current = false;
    }
  }, [applyConfiguration, token]);

  const startPolling = useCallback(() => {
    if (pollActiveRef.current) return;
    const generation = statusGenerationRef.current;
    pollActiveRef.current = true;
    const poll = async () => {
      if (!pollActiveRef.current || !mountedRef.current || generation !== statusGenerationRef.current) return;
      const nextStatus = await refreshConnectionStatus();
      if (!pollActiveRef.current || !mountedRef.current || generation !== statusGenerationRef.current) {
        return;
      }
      if (nextStatus && !shouldPoll(nextStatus)) {
        stopPolling();
        return;
      }
      pollTimerRef.current = setTimeout(poll, 1500);
    };
    void poll();
  }, [refreshConnectionStatus, stopPolling]);

  useEffect(() => {
    mountedRef.current = true;
    statusGenerationRef.current += 1;
    void loadConfiguration({ showLoader: true });
    return () => {
      mountedRef.current = false;
      stopPolling();
    };
  }, [loadConfiguration, stopPolling]);

  useEffect(() => {
    if (shouldPoll(status)) startPolling();
    else stopPolling();
  }, [startPolling, status, stopPolling]);

  const handleRefresh = async () => {
    stopPolling();
    const generation = statusGenerationRef.current + 1;
    statusGenerationRef.current = generation;
    setBusy("refresh");
    const data = await loadConfiguration({ showError: true });
    if (data && shouldPoll(data.status)) startPolling();
    if (mountedRef.current && generation === statusGenerationRef.current) setLoading(false);
    if (mountedRef.current) setBusy("");
  };
  const handleReconnect = async () => {
    if (!token) return;
    stopPolling();
    const generation = statusGenerationRef.current + 1;
    statusGenerationRef.current = generation;
    setBusy("reconnect");
    try {
      const nextStatus = await reconnectAdminWhatsApp(token);
      if (!mountedRef.current || generation !== statusGenerationRef.current) return;
      const appliedStatus = nextStatus || { status: "INITIALIZING" };
      setStatus(appliedStatus);
      if (shouldPoll(appliedStatus)) startPolling();
      showToast({ type: "success", title: "تم طلب ربط واتساب", message: "يتم الآن تجهيز الجلسة ورمز QR عند الحاجة." });
    } catch (error) {
      showToast({ type: "error", title: "تعذر إعادة الاتصال", message: error.userMessage || error.message });
    } finally {
      if (mountedRef.current) setBusy("");
    }
  };
  const handleReset = async () => {
    if (!token) return;
    stopPolling();
    const generation = statusGenerationRef.current + 1;
    statusGenerationRef.current = generation;
    setBusy("reset");
    try {
      const nextStatus = await resetAdminWhatsApp(token);
      if (!mountedRef.current || generation !== statusGenerationRef.current) return;
      const appliedStatus = nextStatus || { status: "INITIALIZING" };
      setStatus(appliedStatus);
      setResetConfirmationOpen(false);
      if (shouldPoll(appliedStatus)) startPolling();
      showToast({ type: "success", title: "تمت إعادة ضبط جلسة واتساب", message: "أنشأنا جلسة جديدة؛ امسح رمز QR عند ظهوره." });
    } catch (error) {
      showToast({ type: "error", title: "تعذر إعادة ضبط الجلسة", message: error.userMessage || error.message });
    } finally {
      if (mountedRef.current) setBusy("");
    }
  };
  const handleSave = async () => {
    if (!token) return;
    setBusy("save");
    try {
      const saved = await saveAdminWhatsAppSettings(token, { eventPreferences: preferences, providerBalanceThresholds: thresholds });
      if (mountedRef.current && saved) {
        setPreferences({ ...DEFAULTS, ...(saved.eventPreferences || preferences) });
        setThresholds(saved.providerBalanceThresholds || thresholds);
        if (Array.isArray(saved.balanceProviders)) setBalanceProviders(saved.balanceProviders);
      }
      showToast({ type: "success", title: "تم حفظ سياسة الإشعارات" });
    } catch (error) {
      showToast({ type: "error", title: "تعذر حفظ الإعدادات", message: error.userMessage || error.message });
    } finally {
      if (mountedRef.current) setBusy("");
    }
  };

  const meta = STATUS_META[status.status] || STATUS_META.DISCONNECTED;
  const connectionBusy = busy === "reconnect" || busy === "reset";
  const reconnectLabel = status.status === "CONNECTED" ? "إعادة اتصال" : "ربط / إعادة اتصال";

  return <main dir="rtl" className="wa-admin-page">
    <header className="wa-admin-header">
      <div className="wa-header-title"><span className="wa-header-mark"><MessageCircle /></span><div><p className="wa-eyebrow">Winnie Operations</p><h1>واتساب الإدارة</h1><p>جلسة واتساب واحدة لإرسال الإشعارات التشغيلية إلى رقم الإدارة المجهز على الخادم.</p></div></div>
      <div className="wa-header-actions">
        <button type="button" className="wa-button wa-button--ghost" onClick={handleRefresh} disabled={Boolean(busy)}><RefreshCw className={busy === "refresh" ? "wa-spin" : ""} /> تحديث</button>
        <button type="button" className="wa-button wa-button--primary" onClick={handleReconnect} disabled={Boolean(busy) || loading}><Wifi /> {busy === "reconnect" ? "جارٍ الاتصال…" : reconnectLabel}</button>
        <button type="button" className="wa-button wa-button--reset" onClick={() => setResetConfirmationOpen(true)} disabled={Boolean(busy) || loading}><RotateCcw /> إعادة ضبط الجلسة</button>
      </div>
    </header>

    <section className="wa-connection-grid" aria-live="polite">
      <article className="wa-panel wa-session-panel">
        <div className="wa-panel-heading"><div><p className="wa-section-kicker">حالة الجلسة</p><h2>ربط واتساب</h2></div><span className={`wa-status-pill wa-status-pill--${meta.tone}`}>{status.isConnected ? <Wifi /> : <WifiOff />}{meta.label}</span></div>
        {loading ? <div className="wa-connection-loading"><LoaderCircle className="wa-spin" /> جارٍ تحميل حالة الجلسة…</div> : <ConnectionVisual status={status} onReconnect={handleReconnect} busy={connectionBusy} />}
      </article>
      <aside className="wa-panel wa-summary-panel">
        <div className="wa-panel-heading"><div><p className="wa-section-kicker">ملخص آمن</p><h2>تفاصيل الاتصال</h2></div><ShieldCheck /></div>
        <dl className="wa-summary-list">
          <div><dt>الحالة الحالية</dt><dd><span className={`wa-status-dot wa-status-dot--${meta.tone}`} />{meta.label}</dd></div>
          <div><dt>رقم الإدارة</dt><dd dir="ltr">{status.adminRecipientMasked || "غير مضبوط"}</dd></div>
          <div><dt>المستلم مجهز</dt><dd>{status.adminNumberConfigured ? "نعم" : "لا"}</dd></div>
          <div><dt>رمز QR</dt><dd>{status.hasQrCode ? "متاح للمسح" : "غير متاح حالياً"}</dd></div>
          <div><dt>آخر اتصال</dt><dd>{formatDate(status.connectedAt)}</dd></div>
          {typeof status.dependencyAvailable === "boolean" ? <div><dt>عميل واتساب</dt><dd>{status.dependencyAvailable ? "متاح" : "غير متاح"}</dd></div> : null}
        </dl>
        {status.lastError ? <div className="wa-summary-error" role="status"><AlertCircle /> <span>{status.lastError}</span></div> : null}
        <p className="wa-recipient-note">لا يمكن تعديل رقم المستلم من لوحة الإدارة، ولا تظهر بيانات جلسة أو رقم كامل هنا.</p>
      </aside>
    </section>

    <section className="wa-panel wa-settings-panel">
      <div className="wa-settings-heading"><div><p className="wa-section-kicker">سياسة الإرسال</p><h2>أنواع الإشعارات</h2><p>فعّل الأحداث التي تريد إرسالها إلى جلسة واتساب الإدارة.</p></div><button type="button" className="wa-button wa-button--save" onClick={handleSave} disabled={Boolean(busy) || loading}><Save /> {busy === "save" ? "جارٍ الحفظ…" : "حفظ الإعدادات"}</button></div>
      <div className="wa-event-grid">
        {EVENTS.map(([key, label, description]) => <label key={key} className={`wa-event-card ${preferences[key] ? "is-enabled" : ""}`} htmlFor={`wa-event-${key}`}><span><b>{label}</b><small>{description}</small></span><input id={`wa-event-${key}`} type="checkbox" checked={preferences[key] === true} onChange={(event) => setPreferences((current) => ({ ...current, [key]: event.target.checked }))} disabled={Boolean(busy)} /><i className="wa-toggle" aria-hidden="true"><em /></i></label>)}
      </div>
      <div className="wa-thresholds">
        <div className="wa-thresholds-heading"><span><AlertCircle /></span><div><h3>حدود تحذير أرصدة الموردين</h3><p>تظهر للموردين النشطين ذوي قراءة الرصيد المباشرة فقط. يلزم حد صالح واحد على الأقل لتفعيل التحذير.</p></div></div>
        {balanceProviders.length ? <div className="wa-threshold-grid">{balanceProviders.map((provider) => { const inputId = `wa-threshold-${provider.key}`; return <div key={provider.key} className="wa-threshold-card"><label htmlFor={inputId}>{provider.name}</label><small>{provider.unit ? `الوحدة: ${provider.unit}` : "الوحدة غير معلنة من المورد"}</small><input id={inputId} type="number" min="0" step="any" inputMode="decimal" value={thresholds[provider.key] || ""} onChange={(event) => setThresholds((current) => ({ ...current, [provider.key]: event.target.value }))} placeholder="حد التحذير" disabled={Boolean(busy)} /></div>; })}</div> : <p className="wa-empty-thresholds">لا يوجد مورد نشط يدعم حالياً قراءة رصيد مباشرة.</p>}
      </div>
    </section>

    <ConfirmDialog open={resetConfirmationOpen} title="إعادة ضبط جلسة واتساب؟" message="سيتم حذف بيانات الجلسة المحلية وبدء جلسة جديدة تتطلب مسح رمز QR مرة أخرى. لن تتغير إعدادات أنواع الإشعارات." confirmLabel="إعادة ضبط الجلسة" tone="danger" busy={busy === "reset"} onCancel={() => !busy && setResetConfirmationOpen(false)} onConfirm={handleReset} />
  </main>;
}
