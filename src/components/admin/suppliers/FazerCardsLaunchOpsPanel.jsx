import { useEffect, useMemo, useState } from "react";
import { Activity, AlertTriangle, CheckCircle2, ClipboardList, RefreshCw, Rocket, XCircle } from "lucide-react";

const familyOptions = ["", "TOPUPS", "GIFTCARDS", "GAME_KEYS", "TELEGRAM", "STEAM_TOPUP", "MANUAL_SERVICES"];

function CountPill({ label, value }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-[9px] font-black text-slate-600 dark:bg-white/10 dark:text-slate-300">
      {label}: {Number(value || 0).toLocaleString("ar-EG-u-nu-latn")}
    </span>
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

function parseProductIds(value) {
  return String(value || "")
    .split(/[\n,]+/)
    .map((item) => item.trim())
    .filter(Boolean);
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
  filters = {},
  error = "",
}) {
  const [idsText, setIdsText] = useState("");
  const [mode, setMode] = useState("MANUAL_FULFILLMENT");
  const productIds = useMemo(() => parseProductIds(idsText), [idsText]);

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
      dryRun,
    });
  };

  return (
    <section className="rounded-[20px] border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-[#111827]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Rocket className="h-5 w-5 text-violet-500" />
          <div>
            <h2 className="text-sm font-black dark:text-white">FazerCards Launch Ops</h2>
          <p className="text-[9px] font-bold text-slate-400">Manual fulfillment, launch gates, and bulk product controls.</p>
        </div>
      </div>
        <button
          type="button"
          onClick={() => onLoad?.()}
          disabled={loading}
          className="inline-flex h-9 items-center gap-1 rounded-xl border border-slate-200 px-3 text-[9px] font-black text-slate-600 disabled:opacity-60 dark:border-white/10 dark:text-slate-300"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="mt-3 flex items-start gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-[10px] font-bold text-rose-700 dark:border-rose-400/20 dark:bg-rose-500/10 dark:text-rose-200">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_1.2fr]">
        <div className="rounded-2xl bg-slate-50 p-3 dark:bg-[#0B1220]">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-violet-500" />
            <h3 className="text-[11px] font-black dark:text-white">Launch Health</h3>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <GateBadge label="API" enabled={health?.api?.enabled && health?.api?.connectionOk} />
            <GateBadge label="Customer Purchase" enabled={health?.gates?.customerPurchaseEnabled} />
            <GateBadge label="Real Orders" enabled={health?.gates?.realOrdersEnabled} />
            <GateBadge label="Code Delivery" enabled={health?.gates?.codeDeliveryEnabled} />
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <CountPill label="Visible" value={health?.products?.activeCustomerVisible} />
            <CountPill label="Auto" value={health?.products?.autoProvider} />
            <CountPill label="Manual" value={health?.products?.manualFulfillment} />
            <CountPill label="Disabled" value={health?.products?.disabled} />
            <CountPill label="Manual Review" value={health?.orders?.manualReview} />
            <CountPill label="Completed 24h" value={health?.orders?.completed24h} />
            <CountPill label="Failed 24h" value={health?.orders?.failed24h} />
          </div>
          {!!health?.warnings?.length && (
            <div className="mt-3 space-y-1">
              {health.warnings.slice(0, 4).map((warning) => (
                <p key={warning} className="flex items-start gap-1 text-[9px] font-bold text-amber-600 dark:text-amber-200">
                  <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
                  {warning}
                </p>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl bg-slate-50 p-3 dark:bg-[#0B1220]">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-violet-500" />
            <h3 className="text-[11px] font-black dark:text-white">Bulk Launch Controls</h3>
          </div>
          <textarea
            value={idsText}
            onChange={(event) => setIdsText(event.target.value)}
            placeholder="Paste imported Winnie Product IDs, one per line or comma-separated"
            className="mt-2 min-h-20 w-full rounded-xl border border-slate-200 bg-white p-2 text-[10px] font-bold outline-none dark:border-white/10 dark:bg-[#111827] dark:text-white"
          />
          <p className="mt-1 text-[9px] font-bold text-slate-400">
            Use Winnie Product IDs from imported products, not supplier ProviderProduct IDs.
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <select
              value={mode}
              onChange={(event) => setMode(event.target.value)}
              className="h-9 rounded-xl border border-slate-200 bg-white px-2 text-[10px] font-bold dark:border-white/10 dark:bg-[#111827] dark:text-white"
            >
              <option value="MANUAL_FULFILLMENT">MANUAL_FULFILLMENT</option>
              <option value="AUTO_PROVIDER">AUTO_PROVIDER</option>
              <option value="DISABLED">DISABLED</option>
            </select>
            <button
              type="button"
              onClick={() => submitBulk(true)}
              disabled={loading || productIds.length === 0}
              className="h-9 rounded-xl border border-violet-200 px-3 text-[9px] font-black text-violet-700 disabled:opacity-50 dark:border-violet-400/20 dark:text-violet-200"
            >
              Dry-run Preview
            </button>
            <button
              type="button"
              onClick={() => submitBulk(false)}
              disabled={loading || productIds.length === 0}
              className="h-9 rounded-xl bg-violet-600 px-3 text-[9px] font-black text-white disabled:opacity-50"
            >
              Apply
            </button>
          </div>
          {bulkResult && (
            <div className="mt-2 max-h-28 overflow-auto rounded-xl border border-slate-200 bg-white p-2 text-[9px] font-bold text-slate-500 dark:border-white/10 dark:bg-[#111827] dark:text-slate-300">
              <p>{bulkResult.dryRun ? "Dry-run" : "Applied"}: {bulkResult.updated || bulkResult.wouldUpdate || 0} ok, {bulkResult.failed || 0} failed.</p>
              {(bulkResult.results || []).slice(0, 8).map((item) => (
                <div key={item.productId} dir="ltr" className={item.ok ? "text-emerald-600" : "text-rose-600"}>
                  <p>{item.productId}: {item.ok ? `${item.requestedMode} | visible=${String(Boolean(item.visibleToCustomer))}` : (item.errors || []).map((error) => error.code).join(", ")}</p>
                  {item.ok && Array.isArray(item.visibilityReasons) && item.visibilityReasons.length > 0 && (
                    <p className="text-amber-600 dark:text-amber-200">Reasons: {item.visibilityReasons.join(", ")}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-3 rounded-2xl bg-slate-50 p-3 dark:bg-[#0B1220]">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-[11px] font-black dark:text-white">Manual FazerCards Orders</h3>
          <select
            value={filters.familyKey || ""}
            onChange={(event) => onManualFilterChange?.({ ...filters, familyKey: event.target.value })}
            className="h-8 rounded-xl border border-slate-200 bg-white px-2 text-[9px] font-bold dark:border-white/10 dark:bg-[#111827] dark:text-white"
          >
            {familyOptions.map((family) => <option key={family || "ALL"} value={family}>{family || "All families"}</option>)}
          </select>
        </div>
        <div className="mt-2 space-y-2">
          {manualOrders.length ? manualOrders.slice(0, 8).map((order) => (
            <article key={order.id} className="rounded-xl border border-slate-200 bg-white p-2 dark:border-white/10 dark:bg-[#111827]">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-[10px] font-black dark:text-white">#{order.orderNumber || order.id} - {order.product?.name || "Order"}</p>
                  <p className="text-[8px] font-bold text-slate-400">{order.familyKey} | {order.status} | {order.customer?.email || "customer"}</p>
                  {!!order.submittedFields?.length && (
                    <p className="mt-1 text-[8px] font-bold text-slate-500 dark:text-slate-300">
                      {order.submittedFields.map((field) => `${field.label}: ${field.value}`).join(" | ")}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap gap-1">
                  <button type="button" onClick={() => onCompleteManual?.(order)} className="h-8 rounded-xl bg-emerald-600 px-3 text-[8px] font-black text-white">Complete</button>
                  <button type="button" onClick={() => onFailManual?.(order)} className="h-8 rounded-xl bg-rose-600 px-3 text-[8px] font-black text-white">Fail</button>
                  <button type="button" onClick={() => onNoteManual?.(order)} className="h-8 rounded-xl border border-slate-200 px-3 text-[8px] font-black text-slate-600 dark:border-white/10 dark:text-slate-300">Note</button>
                </div>
              </div>
            </article>
          )) : (
            <p className="py-4 text-center text-[10px] font-black text-slate-400">No manual FazerCards orders found.</p>
          )}
        </div>
      </div>
    </section>
  );
}
