import { useEffect, useState } from "react";
import { MessageCircle, RefreshCw, RotateCcw, Save, Wifi, WifiOff } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../components/ToastProvider";
import {
  getAdminWhatsAppConfiguration,
  reconnectAdminWhatsApp,
  resetAdminWhatsApp,
  saveAdminWhatsAppSettings,
} from "../../api/whatsappNotifications";

const DEFAULTS = {
  newOrder: true,
  paymentSuccess: true,
  depositPending: true,
  providerFailure: true,
  manualReview: true,
  automaticPaymentError: true,
  dayClosed: true,
  largeWalletAdjustment: true,
  providerBalanceWarning: false,
  subAgentRequest: true,
};
const EVENTS = [
  ["newOrder", "طلب جديد"],
  ["paymentSuccess", "دفع ناجح"],
  ["depositPending", "إيداع قيد المراجعة"],
  ["providerFailure", "فشل المورد"],
  ["manualReview", "طلب يحتاج مراجعة يدوية"],
  ["automaticPaymentError", "خطأ الدفع/الإشعار التلقائي"],
  ["dayClosed", "تقفيل اليوم"],
  ["largeWalletAdjustment", "تعديل محفظة كبير"],
  ["providerBalanceWarning", "تحذير رصيد مورد"],
  ["subAgentRequest", "طلب وكيل فرعي جديد"],
];
const statusLabel = { CONNECTED: "متصل", DISCONNECTED: "غير متصل", QR_REQUIRED: "يتطلب QR", INITIALIZING: "جارٍ التهيئة", AUTHENTICATED: "تمت المصادقة", ERROR: "خطأ" };

export default function AdminWhatsAppNotificationsPage() {
  const { token } = useAuth();
  const { showToast } = useToast();
  const [status, setStatus] = useState({});
  const [preferences, setPreferences] = useState(DEFAULTS);
  const [thresholds, setThresholds] = useState({});
  const [balanceProviders, setBalanceProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");

  const load = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await getAdminWhatsAppConfiguration(token);
      setStatus(data.status);
      setPreferences({ ...DEFAULTS, ...(data.settings?.eventPreferences || {}) });
      setThresholds(data.settings?.providerBalanceThresholds || {});
      setBalanceProviders(Array.isArray(data.settings?.balanceProviders) ? data.settings.balanceProviders : []);
    } catch (error) {
      showToast({ type: "error", title: "تعذر تحميل إعدادات واتساب", message: error.userMessage || error.message });
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [token]); // eslint-disable-line react-hooks/exhaustive-deps
  const run = async (key, action, success) => {
    setBusy(key);
    try { await action(); showToast({ type: "success", title: success }); await load(); }
    catch (error) { showToast({ type: "error", title: "تعذر تنفيذ العملية", message: error.userMessage || error.message }); }
    finally { setBusy(""); }
  };

  return <main dir="rtl" className="admin-whatsapp-page space-y-4">
    <section className="admin-whatsapp-hero">
      <div><span><MessageCircle /></span><h1>إشعارات واتساب للإدارة</h1><p>رقم إداري واحد من إعدادات الخادم، مع سياسة أحداث موحّدة.</p></div>
      <button type="button" onClick={load} disabled={loading || Boolean(busy)}><RefreshCw className={loading ? "animate-spin" : ""} /> تحديث</button>
    </section>
    <section className="grid gap-4 lg:grid-cols-2">
      <article className="admin-whatsapp-panel">
        <h2>الاتصال</h2>
        <div className="admin-whatsapp-status-row"><span>{status.isConnected ? <Wifi /> : <WifiOff />}</span><b>{statusLabel[status.status] || "غير معروف"}</b></div>
        {status.lastError ? <p className="text-sm text-red-600">{status.lastError}</p> : null}
        {status.qrDataUrl ? <img src={status.qrDataUrl} alt="WhatsApp QR" className="max-w-xs" /> : null}
        <div className="flex gap-2"><button type="button" onClick={() => run("reconnect", () => reconnectAdminWhatsApp(token), "تم طلب إعادة الاتصال")} disabled={Boolean(busy)}>إعادة الاتصال</button><button type="button" onClick={() => run("reset", () => resetAdminWhatsApp(token), "تمت إعادة ضبط الجلسة")} disabled={Boolean(busy)}><RotateCcw /> إعادة ضبط الجلسة</button></div>
      </article>
      <article className="admin-whatsapp-panel">
        <h2>المستلم</h2>
        <p dir="ltr" className="text-lg">{status.adminRecipientMasked || "غير مضبوط"}</p>
        <p>يُضبط الرقم على الخادم عبر ADMIN_NOTIFICATION_NUMBER ولا يمكن تعديله من لوحة الإدارة.</p>
      </article>
    </section>
    <section className="admin-whatsapp-panel">
      <h2>أنواع الإشعارات</h2><p>اختَر الأحداث التي تُرسل إلى المستلم الإداري الوحيد.</p>
      <div className="grid gap-2 md:grid-cols-2">
        {EVENTS.map(([key, label]) => <label key={key} className="flex items-center justify-between rounded border p-3"><span>{label}</span><input type="checkbox" checked={preferences[key] === true} onChange={(event) => setPreferences((current) => ({ ...current, [key]: event.target.checked }))} /></label>)}
      </div>
      <div className="mt-4 rounded border p-4">
        <h3>حدود تحذير أرصدة الموردين</h3>
        <p className="text-sm">تظهر فقط للموردين النشطين الذين يدعم محولهم الحالي قراءة رصيد مباشرة. يجب ضبط حد واحد صالح على الأقل قبل تفعيل التحذير.</p>
        {balanceProviders.length ? <div className="mt-3 grid gap-3 md:grid-cols-2">{balanceProviders.map((provider) => <label key={provider.key} className="block rounded border p-3"><span className="block font-medium">{provider.name}</span><small className="block">{provider.unit ? `الوحدة: ${provider.unit}` : "الوحدة غير معلنة من المورد"}</small><input type="number" min="0" step="any" inputMode="decimal" value={thresholds[provider.key] || ""} onChange={(event) => setThresholds((current) => ({ ...current, [provider.key]: event.target.value }))} placeholder="حد التحذير" className="mt-2 w-full" /></label>)}</div> : <p className="mt-2 text-sm">لا يوجد مورد نشط يدعم حالياً قراءة رصيد مباشرة.</p>}
      </div>
      <button type="button" onClick={() => run("save", () => saveAdminWhatsAppSettings(token, { eventPreferences: preferences, providerBalanceThresholds: thresholds }), "تم حفظ سياسة الإشعارات")} disabled={Boolean(busy) || loading}><Save /> حفظ الإعدادات</button>
    </section>
  </main>;
}
