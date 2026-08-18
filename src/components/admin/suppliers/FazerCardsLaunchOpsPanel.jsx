import { useEffect, useMemo, useState } from "react";
import { Activity, AlertTriangle, CheckCircle2, ClipboardList, RefreshCw, Rocket, XCircle } from "lucide-react";

const familyOptions = ["", "TOPUPS", "GIFTCARDS", "GAME_KEYS", "TELEGRAM", "STEAM_TOPUP", "MANUAL_SERVICES"];

function parseProductIds(value) {
  return String(value || "")
    .split(/[\n,]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString("ar-EG-u-nu-latn");
}

function formatBalance(balance) {
  if (balance === null || balance === undefined || balance === "") return "-";
  if (typeof balance === "object") {
    const amount = balance.amount ?? balance.balance ?? balance.available ?? balance.value;
    const currency = balance.currency || "USD";
    return amount === undefined || amount === null ? "-" : `${formatNumber(amount)} ${currency}`;
  }
  return `${formatNumber(balance)} USD`;
}

function formatDate(value) {
  if (!value) return "-";
  try {
    return new Date(value).toLocaleString("ar-EG-u-nu-latn");
  } catch {
    return "-";
  }
}

function formatWebhookStatus(status) {
  if (status === "enabled") return "مفعل";
  if (status === "missing_secret") return "السر غير مضبوط";
  return "غير مفعل";
}

function MetricCard({ label, value, tone = "slate" }) {
  const toneClass = {
    amber: "bg-amber-50 text-amber-800 dark:bg-amber-500/10 dark:text-amber-100",
    emerald: "bg-emerald-50 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-100",
    rose: "bg-rose-50 text-rose-800 dark:bg-rose-500/10 dark:text-rose-100",
    sky: "bg-sky-50 text-sky-800 dark:bg-sky-500/10 dark:text-sky-100",
    slate: "bg-slate-50 text-slate-700 dark:bg-[#0B1220] dark:text-slate-100",
  }[tone] || "bg-slate-50 text-slate-700 dark:bg-[#0B1220] dark:text-slate-100";

  return (
    <div className={`rounded-2xl p-3 ${toneClass}`}>
      <p className="text-[9px] font-black text-slate-400 dark:text-slate-300">{label}</p>
      <strong className="mt-1 block text-lg font-black">{value}</strong>
    </div>
  );
}

function GateBadge({ label, enabled }) {
  const Icon = enabled ? CheckCircle2 : XCircle;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[9px] font-black ${enabled ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200" : "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-200"}`}>
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}

function formatHealthWarning(warning) {
  const text = String(warning || "");
  const lower = text.toLowerCase();
  if (lower.includes("real order") || lower.includes("real orders") || lower.includes("global real")) {
    return "يتطلب تفعيل إعدادات المورد من السيرفر.";
  }
  if (lower.includes("code delivery")) {
    return "يتطلب تفعيل تسليم الأكواد من إعدادات السيرفر.";
  }
  if (lower.includes("steam gifts")) {
    return "Steam Gifts متاحة بالمزامنة حسب AppID فقط.";
  }
  if (lower.includes("manual review")) {
    return text.replace(/manual review/gi, "قيد التنفيذ");
  }
  return text;
}

function ResultSummary({ result }) {
  if (!result) return null;
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3 text-[10px] font-bold text-slate-600 dark:border-white/10 dark:bg-[#0B1220] dark:text-slate-200">
      <p className="font-black">
        {result.dryRun ? "معاينة" : "تم التحديث"}: {formatNumber(result.updated || result.wouldUpdate || 0)} جاهز، {formatNumber(result.failed || 0)} بحاجة لمراجعة.
      </p>
      {!!result.results?.length && (
        <details className="mt-2">
          <summary className="cursor-pointer text-[9px] font-black text-slate-400">تفاصيل النتيجة</summary>
          <div className="mt-2 max-h-28 overflow-auto space-y-1">
            {result.results.slice(0, 10).map((item) => (
              <p key={item.productId} dir="ltr" className={item.ok ? "text-emerald-600" : "text-rose-600"}>
                {item.productName || item.productId}: {item.ok ? "OK" : (item.errors || []).map((error) => error.code).join(", ")}
              </p>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}

export default function FazerCardsLaunchOpsPanel({
  bulkResult = null,
  health = null,
  loading = false,
  manualOrders = [],
  onBulkLaunch,
  onCompleteManual,
  onFailManual,
  onLoad,
  onManualFilterChange,
  onNoteManual,
  onPublishEligible,
  filters = {},
  error = "",
  webhookDeliveries = [],
}) {
  const [idsText, setIdsText] = useState("");
  const [mode, setMode] = useState("MANUAL_FULFILLMENT");
  const productIds = useMemo(() => parseProductIds(idsText), [idsText]);
  const pendingOrders = Number(health?.orders?.manualPending || 0) + Number(health?.orders?.processing || 0);

  useEffect(() => {
    onLoad?.();
  }, [onLoad]);

  const submitBulk = (dryRun) => {
    onBulkLaunch?.({
      productIds,
      customerPurchaseEnabled: true,
      isActive: true,
      visibleInStore: true,
      status: "available",
      providerExecutionMode: mode,
      providerExecutionEnabled: mode === "AUTO_PROVIDER",
      dryRun,
    });
  };

  return (
    <section className="rounded-[20px] border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-[#111827]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Rocket className="h-5 w-5 text-violet-500" />
          <div>
            <h2 className="text-sm font-black dark:text-white">إدارة FazerCards</h2>
            <p className="text-[9px] font-bold text-slate-400">تشغيل المنتجات ومتابعة الطلبات بشكل إنتاجي.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onLoad?.()}
          disabled={loading}
          className="inline-flex h-9 items-center gap-1 rounded-xl border border-slate-200 px-3 text-[9px] font-black text-slate-600 disabled:opacity-60 dark:border-white/10 dark:text-slate-300"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          تحديث
        </button>
      </div>

      {error && (
        <div className="mt-3 flex items-start gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-[10px] font-bold text-rose-700 dark:border-rose-400/20 dark:bg-rose-500/10 dark:text-rose-200">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-6">
        <MetricCard label="حالة الاتصال بالمورد" value={health?.api?.connectionOk ? "متصل" : "غير متصل"} tone={health?.api?.connectionOk ? "emerald" : "amber"} />
        <MetricCard label="الرصيد" value={formatBalance(health?.api?.balance)} tone="sky" />
        <MetricCard label="المنتجات المنشورة" value={formatNumber(health?.products?.activeCustomerVisible)} tone="emerald" />
        <MetricCard label="تنفيذ تلقائي" value={formatNumber(health?.products?.autoProvider)} tone="sky" />
        <MetricCard label="طلبات قيد التنفيذ" value={formatNumber(pendingOrders)} tone="amber" />
        <MetricCard label="طلبات فاشلة 24 ساعة" value={formatNumber(health?.orders?.failed24h)} tone="rose" />
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_auto]">
        <div className="rounded-2xl bg-slate-50 p-3 dark:bg-[#0B1220]">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-violet-500" />
            <h3 className="text-[11px] font-black dark:text-white">إجراءات التشغيل</h3>
          </div>
          <p className="mt-1 text-[9px] font-bold text-slate-400">
            المنتجات غير المكتملة أو غير المدعومة ستظهر في النتيجة ولن يتم نشرها.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onPublishEligible?.({ providerExecutionMode: "MANUAL_FULFILLMENT" })}
              disabled={loading}
              className="inline-flex h-10 items-center gap-1 rounded-xl bg-violet-600 px-4 text-[10px] font-black text-white disabled:opacity-60"
            >
              <Rocket className="h-4 w-4" />
              نشر المنتجات المؤهلة
            </button>
            <button
              type="button"
              onClick={() => onPublishEligible?.({ providerExecutionMode: "AUTO_PROVIDER" })}
              disabled={loading}
              className="inline-flex h-10 items-center gap-1 rounded-xl bg-sky-600 px-4 text-[10px] font-black text-white disabled:opacity-60"
            >
              <CheckCircle2 className="h-4 w-4" />
              تفعيل التنفيذ التلقائي للمنتجات المؤكدة
            </button>
          </div>
        </div>
        <ResultSummary result={bulkResult} />
      </div>

      <details className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-[#0B1220]">
        <summary className="cursor-pointer text-[10px] font-black text-slate-500 dark:text-slate-300">خيارات متقدمة</summary>
        <div className="mt-3 grid gap-3 lg:grid-cols-2">
          <div>
            <div className="flex flex-wrap gap-1.5">
              <GateBadge label="API" enabled={health?.api?.enabled && health?.api?.connectionOk} />
              <GateBadge label="Webhooks" enabled={health?.webhooks?.enabled && health?.webhooks?.secretConfigured} />
              <GateBadge label="شراء العملاء" enabled={health?.gates?.customerPurchaseEnabled} />
              <GateBadge label="إعدادات التنفيذ التلقائي" enabled={health?.gates?.realOrdersEnabled} />
              <GateBadge label="تسليم الأكواد" enabled={health?.gates?.codeDeliveryEnabled} />
            </div>
            {!!health?.warnings?.length && (
              <div className="mt-2 space-y-1">
                {health.warnings.slice(0, 5).map((warning) => (
                  <p key={warning} className="flex items-start gap-1 text-[9px] font-bold text-amber-600 dark:text-amber-200">
                    <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
                    {formatHealthWarning(warning)}
                  </p>
                ))}
              </div>
            )}
            <div className="mt-3 rounded-xl border border-slate-200 bg-white p-2 dark:border-white/10 dark:bg-[#111827]">
              <p className="text-[9px] font-black text-slate-400">إشعار FazerCards</p>
              <p className="mt-1 text-[9px] font-bold text-slate-600 dark:text-slate-200">
                {formatWebhookStatus(health?.webhooks?.status)}
              </p>
              <code dir="ltr" className="mt-1 block break-all rounded-lg bg-slate-100 px-2 py-1 text-[9px] text-slate-600 dark:bg-white/5 dark:text-slate-200">
                {health?.webhooks?.endpointUrl || "https://winniefun.com/api/webhooks/providers/fazercards"}
              </code>
              {!!webhookDeliveries.length && (
                <div className="mt-2 max-h-28 space-y-1 overflow-auto">
                  {webhookDeliveries.slice(0, 5).map((delivery) => (
                    <p key={delivery.eventId || `${delivery.event}-${delivery.receivedAt}`} dir="ltr" className="text-[8px] font-bold text-slate-500 dark:text-slate-300">
                      {delivery.event || "event"} | {delivery.processingStatus || "-"} | {delivery.providerOrderId || "-"} | {delivery.statusBefore || "-"} -&gt; {delivery.statusAfter || "-"} | {formatDate(delivery.receivedAt)}
                    </p>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-violet-500" />
              <h3 className="text-[11px] font-black dark:text-white">تحديث منتجات محددة</h3>
            </div>
            <textarea
              value={idsText}
              onChange={(event) => setIdsText(event.target.value)}
              placeholder="معرّفات منتجات Winnie"
              className="mt-2 min-h-20 w-full rounded-xl border border-slate-200 bg-white p-2 text-[10px] font-bold outline-none dark:border-white/10 dark:bg-[#111827] dark:text-white"
            />
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <select
                value={mode}
                onChange={(event) => setMode(event.target.value)}
                className="h-9 rounded-xl border border-slate-200 bg-white px-2 text-[10px] font-bold dark:border-white/10 dark:bg-[#111827] dark:text-white"
              >
                <option value="MANUAL_FULFILLMENT">تنفيذ الطلب</option>
                <option value="AUTO_PROVIDER">تنفيذ تلقائي من المورد</option>
                <option value="DISABLED">تعطيل</option>
              </select>
              <button
                type="button"
                onClick={() => submitBulk(true)}
                disabled={loading || productIds.length === 0}
                className="h-9 rounded-xl border border-violet-200 px-3 text-[9px] font-black text-violet-700 disabled:opacity-50 dark:border-violet-400/20 dark:text-violet-200"
              >
                معاينة
              </button>
              <button
                type="button"
                onClick={() => submitBulk(false)}
                disabled={loading || productIds.length === 0}
                className="h-9 rounded-xl bg-violet-600 px-3 text-[9px] font-black text-white disabled:opacity-50"
              >
                تطبيق
              </button>
            </div>
          </div>
        </div>
      </details>

      <div className="mt-3 rounded-2xl bg-slate-50 p-3 dark:bg-[#0B1220]">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-[11px] font-black dark:text-white">طلبات قيد التنفيذ</h3>
          <select
            value={filters.familyKey || ""}
            onChange={(event) => onManualFilterChange?.({ ...filters, familyKey: event.target.value })}
            className="h-8 rounded-xl border border-slate-200 bg-white px-2 text-[9px] font-bold dark:border-white/10 dark:bg-[#111827] dark:text-white"
          >
            {familyOptions.map((family) => <option key={family || "ALL"} value={family}>{family || "كل العائلات"}</option>)}
          </select>
        </div>
        <div className="mt-2 space-y-2">
          {manualOrders.length ? manualOrders.slice(0, 8).map((order) => (
            <article key={order.id} className="rounded-xl border border-slate-200 bg-white p-2 dark:border-white/10 dark:bg-[#111827]">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-[10px] font-black dark:text-white">#{order.orderNumber || order.id} - {order.product?.name || "طلب"}</p>
                  <p className="text-[8px] font-bold text-slate-400">{order.familyKey} | {order.status} | {order.customer?.email || "العميل"}</p>
                  {!!order.submittedFields?.length && (
                    <p className="mt-1 text-[8px] font-bold text-slate-500 dark:text-slate-300">
                      {order.submittedFields.map((field) => `${field.label}: ${field.value}`).join(" | ")}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap gap-1">
                  <button type="button" onClick={() => onCompleteManual?.(order)} className="h-8 rounded-xl bg-emerald-600 px-3 text-[8px] font-black text-white">إكمال</button>
                  <button type="button" onClick={() => onFailManual?.(order)} className="h-8 rounded-xl bg-rose-600 px-3 text-[8px] font-black text-white">فشل</button>
                  <button type="button" onClick={() => onNoteManual?.(order)} className="h-8 rounded-xl border border-slate-200 px-3 text-[8px] font-black text-slate-600 dark:border-white/10 dark:text-slate-300">ملاحظة</button>
                </div>
              </div>
            </article>
          )) : (
            <p className="py-4 text-center text-[10px] font-black text-slate-400">لا توجد طلبات قيد التنفيذ.</p>
          )}
        </div>
      </div>
    </section>
  );
}
