import { useState } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, Boxes, ChevronLeft, ChevronRight, Copy, Download, Eye, FlaskConical, Power, RefreshCw, Rocket, Search, ShieldCheck, X } from "lucide-react";
import ConnectionStatusBadge from "./ConnectionStatusBadge";

const FAZERCARDS_FAMILY_TABS = [
  { key: "TOPUPS", label: "TOPUPS" },
  { key: "GIFTCARDS", label: "GIFTCARDS" },
  { key: "GAME_KEYS", label: "GAME_KEYS" },
  { key: "TELEGRAM", label: "TELEGRAM" },
  { key: "STEAM_TOPUP", label: "STEAM_TOPUP" },
  { key: "MANUAL_SERVICES", label: "MANUAL_SERVICES" },
  { key: "STEAM_GIFTS", label: "STEAM_GIFTS" },
];

const AUTO_PROVIDER_FAMILIES = new Set(["TOPUPS", "GIFTCARDS", "GAME_KEYS"]);

const FULFILLMENT_MODES = [
  "TOPUP_WITH_FIELDS",
  "CODE_DELIVERY",
  "TELEGRAM_STARS_TOPUP",
  "TELEGRAM_PREMIUM",
  "STEAM_TOPUP_WITH_LOGIN",
  "MANUAL_SERVICE",
  "STEAM_GIFT_INVITE",
  "UNKNOWN",
];

export default function SupplierProductsModal({
  actionKey = "",
  error = "",
  fazerCards = false,
  filters = {},
  loading = false,
  onClose,
  onFilterChange,
  onFazerCardsDryRun,
  onFazerCardsDisable,
  onFazerCardsEnableAuto,
  onFazerCardsLaunchManual,
  onFazerCardsReadiness,
  onFazerCardsSyncAll,
  onFazerCardsSyncFamily,
  onImport,
  onPageChange,
  onSearch,
  onSync,
  pagination,
  products = [],
  supplier,
  fazerCardsCatalog = {},
}) {
  const [query, setQuery] = useState("");
  const [copiedId, setCopiedId] = useState("");

  if (!supplier) return null;

  const syncBusy = actionKey === `${supplier?.id}:sync`;
  const syncAllBusy = actionKey === `${supplier?.id}:sync-all`;
  const activeFamily = String(filters.familyKey || "").toUpperCase();
  const familySummary = fazerCardsCatalog.summary?.byFamily || {};
  const contractSummary = fazerCardsCatalog.contractsSummary?.families || {};
  const familyList = fazerCardsCatalog.families?.length ? fazerCardsCatalog.families : FAZERCARDS_FAMILY_TABS;
  const syncResult = fazerCardsCatalog.syncResult;
  const steamGiftsWarning = familyList.find((family) => family.familyKey === "STEAM_GIFTS")?.warning
    || "STEAM_GIFTS catalog endpoint returned 404 in production and is currently unavailable.";
  const visibleProducts = fazerCards && activeFamily
    ? products.filter((product) => String(product?.familyKey || "").toUpperCase() === activeFamily)
    : products;

  const updateFilter = (patch) => onFilterChange?.({ ...filters, ...patch });
  const copyProductId = async (productId) => {
    if (!productId) return;
    try {
      await navigator.clipboard?.writeText(productId);
      setCopiedId(productId);
      window.setTimeout(() => setCopiedId(""), 1600);
    } catch {
      setCopiedId("");
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[130] flex items-end justify-center bg-slate-950/60 sm:items-center sm:p-4"
      onMouseDown={(event) => event.target === event.currentTarget && !syncBusy && onClose()}
    >
      <section className="flex max-h-[90dvh] w-full max-w-[860px] flex-col overflow-hidden rounded-t-[28px] bg-white sm:rounded-[28px] dark:bg-[#111827]">
        <header className="flex items-center gap-3 border-b border-slate-100 p-4 dark:border-white/10">
          <Boxes className="h-5 w-5 text-violet-500" />
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-sm font-black dark:text-white">{supplier?.name || "Supplier"} products</h2>
            <p className="text-[8px] font-bold text-slate-400">
              {(pagination?.total ?? products.length).toLocaleString("ar-EG-u-nu-latn")} synced supplier products
            </p>
          </div>
          {fazerCards ? (
            <button
              type="button"
              onClick={() => onFazerCardsSyncAll?.(supplier)}
              disabled={syncAllBusy || loading || !supplier?.active}
              className="inline-flex h-9 items-center gap-1 rounded-xl bg-violet-600 px-3 text-[9px] font-black text-white disabled:opacity-60"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${syncAllBusy ? "animate-spin" : ""}`} />
              Sync All
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onSync?.(supplier)}
              disabled={syncBusy || loading || !supplier?.active}
              className="inline-flex h-9 items-center gap-1 rounded-xl bg-violet-600 px-3 text-[9px] font-black text-white disabled:opacity-60"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${syncBusy ? "animate-spin" : ""}`} />
              Sync
            </button>
          )}
          <button type="button" onClick={onClose} disabled={syncBusy} className="grid h-9 w-9 place-items-center rounded-xl text-slate-400 hover:bg-slate-100 disabled:opacity-60 dark:hover:bg-white/[0.07]">
            <X className="h-4 w-4" />
          </button>
        </header>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            onSearch(query, filters);
          }}
          className="grid gap-2 border-b border-slate-100 p-3 dark:border-white/[0.07]"
        >
          <div className="flex gap-2">
            <label className="relative flex-1">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-violet-500" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search synced supplier products"
                className="h-10 w-full rounded-2xl border border-slate-200 bg-slate-50 pe-9 ps-3 text-xs font-black outline-none dark:border-white/10 dark:bg-[#0B1220] dark:text-white"
              />
            </label>
            <button type="submit" disabled={loading} className="h-10 rounded-2xl bg-slate-900 px-4 text-[10px] font-black text-white disabled:opacity-60 dark:bg-white dark:text-slate-950">
              Search
            </button>
          </div>

          {fazerCards && (
            <div className="grid gap-2">
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => updateFilter({ familyKey: "" })}
                  className={`rounded-full px-3 py-1.5 text-[8px] font-black ${!activeFamily ? "bg-violet-600 text-white" : "bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-300"}`}
                >
                  ALL
                </button>
                {FAZERCARDS_FAMILY_TABS.map((family) => (
                  <button
                    key={family.key}
                    type="button"
                    onClick={() => updateFilter({ familyKey: family.key })}
                    className={`rounded-full px-3 py-1.5 text-[8px] font-black ${activeFamily === family.key ? "bg-violet-600 text-white" : "bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-300"}`}
                  >
                    {family.label}
                  </button>
                ))}
              </div>

              <div className="grid gap-2 sm:grid-cols-4 lg:grid-cols-7">
                {FAZERCARDS_FAMILY_TABS.map((family) => {
                  const bucket = familySummary[family.key] || {};
                  const contract = contractSummary[family.key] || {};
                  return (
                    <button
                      key={family.key}
                      type="button"
                      onClick={() => updateFilter({ familyKey: family.key })}
                      className={`rounded-xl border p-2 text-left ${activeFamily === family.key ? "border-violet-300 bg-violet-50 dark:border-violet-400/30 dark:bg-violet-500/10" : "border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-[#0B1220]"}`}
                    >
                      <span className="block truncate text-[8px] font-black text-slate-500 dark:text-slate-300">{family.key}</span>
                      <strong className="mt-1 block text-sm font-black text-slate-900 dark:text-white">{bucket.total ?? 0}</strong>
                      <span className="text-[7px] font-bold text-slate-400">
                        S {bucket.supported ?? 0} | B {bucket.blocked ?? 0} | I {bucket.imported ?? 0}
                      </span>
                      <span className="mt-1 block truncate text-[7px] font-black text-violet-500 dark:text-violet-200">{contract.supportStage || "CATALOG"}</span>
                      <span className="block truncate text-[7px] font-bold text-slate-400">{contract.executionStage || "NONE"}</span>
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-2 text-[9px] font-bold text-amber-700 dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-200">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                <span className="min-w-0 flex-1">{steamGiftsWarning}</span>
                <button
                  type="button"
                  onClick={() => onFazerCardsSyncFamily?.(activeFamily || "TOPUPS")}
                  disabled={loading || !supplier?.active || Boolean(actionKey)}
                  className="inline-flex h-8 items-center gap-1 rounded-xl bg-slate-900 px-3 text-[8px] font-black text-white disabled:opacity-60 dark:bg-white dark:text-slate-950"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Sync Family
                </button>
              </div>

              {syncResult && (
                <div className="grid gap-1 rounded-2xl border border-slate-200 bg-slate-50 p-2 text-[9px] font-bold text-slate-500 dark:border-white/10 dark:bg-[#0B1220] dark:text-slate-300">
                  <span>
                    Last sync: created {syncResult.totals?.providerProductsCreated ?? syncResult.providerProductsCreated ?? 0}, updated {syncResult.totals?.providerProductsUpdated ?? syncResult.providerProductsUpdated ?? 0}
                  </span>
                  {Object.entries(syncResult.results || {}).map(([familyKey, result]) => (
                    <span key={familyKey} dir="ltr">
                      {familyKey}: next {result?.nextCursor || "-"} | more {result?.hasMore ? "yes" : "no"}{result?.skipped ? " | skipped" : ""}
                    </span>
                  ))}
                </div>
              )}

              <div className="grid gap-2 sm:grid-cols-6">
              <input
                value={filters.category || ""}
                onChange={(event) => updateFilter({ category: event.target.value })}
                placeholder="Category"
                className="h-9 rounded-xl border border-slate-200 bg-slate-50 px-3 text-[10px] font-bold outline-none dark:border-white/10 dark:bg-[#0B1220] dark:text-white"
              />
              <select
                value={filters.supported ?? "true"}
                onChange={(event) => updateFilter({ supported: event.target.value })}
                className="h-9 rounded-xl border border-slate-200 bg-slate-50 px-2 text-[10px] font-bold outline-none dark:border-white/10 dark:bg-[#0B1220] dark:text-white"
              >
                <option value="">All support</option>
                <option value="true">Supported</option>
                <option value="false">Unsupported</option>
              </select>
              <select
                value={filters.blocked ?? ""}
                onChange={(event) => updateFilter({ blocked: event.target.value })}
                className="h-9 rounded-xl border border-slate-200 bg-slate-50 px-2 text-[10px] font-bold outline-none dark:border-white/10 dark:bg-[#0B1220] dark:text-white"
              >
                <option value="">All blocked</option>
                <option value="false">Not blocked</option>
                <option value="true">Blocked</option>
              </select>
              <select
                value={filters.imported ?? ""}
                onChange={(event) => updateFilter({ imported: event.target.value })}
                className="h-9 rounded-xl border border-slate-200 bg-slate-50 px-2 text-[10px] font-bold outline-none dark:border-white/10 dark:bg-[#0B1220] dark:text-white"
              >
                <option value="">All imports</option>
                <option value="false">Not imported</option>
                <option value="true">Imported</option>
                </select>
              <select
                value={filters.fulfillmentMode || ""}
                onChange={(event) => updateFilter({ fulfillmentMode: event.target.value })}
                className="h-9 rounded-xl border border-slate-200 bg-slate-50 px-2 text-[10px] font-bold outline-none dark:border-white/10 dark:bg-[#0B1220] dark:text-white"
              >
                <option value="">All modes</option>
                {FULFILLMENT_MODES.map((mode) => <option key={mode} value={mode}>{mode}</option>)}
              </select>
              <input
                value={filters.blockReason || ""}
                onChange={(event) => updateFilter({ blockReason: event.target.value })}
                placeholder="Block reason"
                className="h-9 rounded-xl border border-slate-200 bg-slate-50 px-3 text-[10px] font-bold outline-none dark:border-white/10 dark:bg-[#0B1220] dark:text-white"
              />
              </div>
            </div>
          )}
        </form>

        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-4">
          {error && (
            <div className="flex items-start gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-xs font-bold text-rose-700 dark:border-rose-400/20 dark:bg-rose-500/10 dark:text-rose-200">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <p className="py-8 text-center text-xs font-black text-slate-400">Loading supplier products...</p>
          ) : visibleProducts.length ? (
            visibleProducts.map((product) => {
              const contract = contractSummary[product.familyKey] || {};
              const firstBlocker = contract.blockers?.[0] || "";
              const imported = product.importedProduct || null;
              const visibleToCustomer = imported?.visibleToCustomer === true;
              const visibilityReasons = imported?.visibilityReasons || imported?.customerVisibilityStatus?.reasons || [];
              const manualFieldWarning = imported?.manualFieldWarning || "";
              const manualFieldSuggestions = imported?.manualFieldSuggestions || [];
              const familyKey = String(product.familyKey || "").toUpperCase();
              const autoProviderCapable = AUTO_PROVIDER_FAMILIES.has(familyKey);
              const launchManualDisabled = loading
                || !product.importedProduct?.id
                || Boolean(manualFieldWarning)
                || actionKey === `${product.id}:launch-manual`;
              const enableAutoDisabled = loading
                || !product.importedProduct?.id
                || !autoProviderCapable
                || actionKey === `${product.id}:enable-auto`;
              return (
              <article key={product.id} className="grid gap-3 rounded-2xl bg-slate-50 p-3 dark:bg-[#0B1220] sm:grid-cols-[1fr_auto]">
                <div className="min-w-0">
                  <h3 className="truncate text-[11px] font-black dark:text-white">{product.name}</h3>
                  <p dir="ltr" className="mt-1 text-right text-[9px] font-bold text-slate-400">
                    {product.externalProductId || product.id}
                  </p>
                  <p className="mt-1 text-[9px] font-bold text-slate-500 dark:text-slate-300">
                    Qty {product.minQty} - {product.maxQty} | Last sync {product.lastSyncedAtLabel}
                  </p>
                  {fazerCards && (
                    <div className="mt-2 flex flex-wrap gap-1.5 text-[8px] font-black">
                      <span className="rounded-full bg-indigo-100 px-2 py-1 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-200">{product.familyKey || "UNKNOWN"}</span>
                      <span className="rounded-full bg-cyan-100 px-2 py-1 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-200">{product.fulfillmentMode || "UNKNOWN"}</span>
                      {contract.supportStage && <span className="rounded-full bg-violet-100 px-2 py-1 text-violet-700 dark:bg-violet-500/15 dark:text-violet-200">{contract.supportStage}</span>}
                      {contract.executionStage && <span className="rounded-full bg-slate-200 px-2 py-1 text-slate-600 dark:bg-white/10 dark:text-slate-300">{contract.executionStage}</span>}
                      <span className="rounded-full bg-slate-200 px-2 py-1 text-slate-600 dark:bg-white/10 dark:text-slate-300">{product.categoryName || product.category || "No category"}</span>
                      {(product.region || product.platform) && (
                        <span className="rounded-full bg-slate-200 px-2 py-1 text-slate-600 dark:bg-white/10 dark:text-slate-300">{[product.platform, product.region].filter(Boolean).join(" / ")}</span>
                      )}
                      <span className="rounded-full bg-slate-200 px-2 py-1 text-slate-600 dark:bg-white/10 dark:text-slate-300">Stock {product.stockLabel || "Unknown"}</span>
                      {product.supportLevel && <span className="rounded-full bg-slate-200 px-2 py-1 text-slate-600 dark:bg-white/10 dark:text-slate-300">{product.supportLevel}</span>}
                      <span className="rounded-full bg-sky-100 px-2 py-1 text-sky-700 dark:bg-sky-500/15 dark:text-sky-200">{product.requiredFieldsLabel}</span>
                      <span className={`rounded-full px-2 py-1 ${product.isSupported ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200" : "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-200"}`}>
                        {product.isSupported ? "Supported" : "Unsupported"}
                      </span>
                      <span className={`rounded-full px-2 py-1 ${product.isBlocked ? "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-200" : "bg-slate-200 text-slate-600 dark:bg-white/10 dark:text-slate-300"}`}>
                        {product.isBlocked ? product.blockReason || "Blocked" : "Not blocked"}
                      </span>
                      <span className={`rounded-full px-2 py-1 ${product.imported ? "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-200" : "bg-slate-200 text-slate-600 dark:bg-white/10 dark:text-slate-300"}`}>
                        {product.imported ? "Imported" : "Not imported"}
                      </span>
                      {firstBlocker && <span className="rounded-full bg-amber-100 px-2 py-1 text-amber-700 dark:bg-amber-500/15 dark:text-amber-200">{firstBlocker}</span>}
                    </div>
                  )}
                  {fazerCards && imported && (
                    <div className="mt-2 rounded-xl border border-slate-200 bg-white p-2 text-[9px] font-bold text-slate-500 dark:border-white/10 dark:bg-[#111827] dark:text-slate-300">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className={`rounded-full px-2 py-1 ${visibleToCustomer ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200" : "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-200"}`}>
                          {visibleToCustomer ? "Visible to customers" : "Not visible to customers"}
                        </span>
                        <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-600 dark:bg-white/10 dark:text-slate-200">
                          {imported.providerExecutionMode === "AUTO_PROVIDER" ? "تنفيذ تلقائي من المورد" : imported.providerExecutionMode === "MANUAL_FULFILLMENT" ? "تنفيذ بواسطة الفريق" : "غير مفعل"}
                        </span>
                      </div>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        <span className={imported.isActive ? "text-emerald-600 dark:text-emerald-200" : "text-amber-600 dark:text-amber-200"}>active={String(Boolean(imported.isActive))}</span>
                        <span className={imported.visibleInStore ? "text-emerald-600 dark:text-emerald-200" : "text-amber-600 dark:text-amber-200"}>visibleInStore={String(Boolean(imported.visibleInStore))}</span>
                        <span>status={imported.status || "-"}</span>
                        <span className={imported.customerPurchaseEnabled ? "text-emerald-600 dark:text-emerald-200" : "text-amber-600 dark:text-amber-200"}>customerPurchaseEnabled={String(Boolean(imported.customerPurchaseEnabled))}</span>
                        <span>mode={imported.providerExecutionMode || "-"}</span>
                      </div>
                      {!visibleToCustomer && visibilityReasons.length > 0 && (
                        <p className="mt-1 text-[8px] font-black text-amber-600 dark:text-amber-200">
                          {visibilityReasons.join(", ")}
                        </p>
                      )}
                      {manualFieldWarning && (
                        <p className="mt-1 text-[8px] font-black text-rose-600 dark:text-rose-200">
                          هذا المنتج يحتاج حقولاً يملؤها العميل قبل النشر.
                          {manualFieldSuggestions.length ? ` مقترح: ${manualFieldSuggestions.join(" / ")}` : ""}
                        </p>
                      )}
                      <details className="mt-2 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 dark:border-white/10 dark:bg-white/[0.03]">
                        <summary className="cursor-pointer text-[8px] font-black text-slate-500 dark:text-slate-300">Details / Advanced</summary>
                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                          <span dir="ltr" className="rounded bg-white px-2 py-1 text-slate-600 dark:bg-[#111827] dark:text-slate-200">Winnie Product ID: {imported.id}</span>
                          <button
                            type="button"
                            onClick={() => copyProductId(imported.id)}
                            className="inline-flex h-6 items-center gap-1 rounded-lg border border-slate-200 px-2 text-[8px] font-black text-slate-600 dark:border-white/10 dark:text-slate-300"
                          >
                            <Copy className="h-3 w-3" />
                            {copiedId === imported.id ? "Copied" : "Copy Product ID"}
                          </button>
                        </div>
                      </details>
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end">
                  <strong dir="ltr" className="text-[11px] text-violet-600 dark:text-violet-300">{fazerCards ? product.costPriceLabel : product.priceLabel}</strong>
                  <ConnectionStatusBadge status={product.active ? "connected" : "failed"} />
                  {fazerCards && (
                    <div className="flex flex-wrap justify-end gap-1.5 sm:flex-col sm:items-end">
                      <button
                        type="button"
                        disabled={loading}
                        onClick={() => onImport?.(product)}
                        className="inline-flex h-8 items-center gap-1 rounded-xl border border-slate-200 px-3 text-[9px] font-black text-slate-600 disabled:opacity-60 dark:border-white/10 dark:text-slate-300"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Preview
                      </button>
                      <button
                        type="button"
                        disabled={loading || product.familyKey === "STEAM_GIFTS"}
                        onClick={() => onImport?.(product)}
                        className="inline-flex h-8 items-center gap-1 rounded-xl bg-violet-600 px-3 text-[9px] font-black text-white disabled:bg-slate-300 disabled:text-slate-500 dark:disabled:bg-white/10 dark:disabled:text-slate-400"
                      >
                        <Download className="h-3.5 w-3.5" />
                        {product.imported ? "Update linked product" : "Import"}
                      </button>
                      <button
                        type="button"
                        disabled={launchManualDisabled}
                        title={manualFieldWarning || undefined}
                        onClick={() => onFazerCardsLaunchManual?.(product)}
                        className="inline-flex h-8 items-center gap-1 rounded-xl bg-emerald-600 px-3 text-[9px] font-black text-white disabled:bg-slate-300 disabled:text-slate-500 dark:disabled:bg-white/10 dark:disabled:text-slate-400"
                      >
                        <Rocket className="h-3.5 w-3.5" />
                        نشر بتنفيذ الفريق
                      </button>
                      {autoProviderCapable && (
                        <button
                          type="button"
                          disabled={enableAutoDisabled}
                          onClick={() => onFazerCardsEnableAuto?.(product)}
                          className="inline-flex h-8 items-center gap-1 rounded-xl bg-sky-600 px-3 text-[9px] font-black text-white disabled:bg-slate-300 disabled:text-slate-500 dark:disabled:bg-white/10 dark:disabled:text-slate-400"
                        >
                          <Rocket className="h-3.5 w-3.5" />
                          Enable Auto Provider
                        </button>
                      )}
                      <details className="w-full text-right sm:w-auto">
                        <summary className="cursor-pointer rounded-xl border border-slate-200 px-3 py-2 text-[9px] font-black text-slate-500 dark:border-white/10 dark:text-slate-300">
                          Advanced
                        </summary>
                        <div className="mt-1 flex flex-wrap justify-end gap-1.5">
                          <button
                            type="button"
                            disabled={loading || !product.importedProduct?.id}
                            onClick={() => onFazerCardsReadiness?.(product)}
                            className="inline-flex h-8 items-center gap-1 rounded-xl border border-emerald-200 px-3 text-[9px] font-black text-emerald-700 disabled:opacity-50 dark:border-emerald-400/20 dark:text-emerald-200"
                          >
                            <ShieldCheck className="h-3.5 w-3.5" />
                            Readiness
                          </button>
                          <button
                            type="button"
                            disabled={loading || !product.importedProduct?.id}
                            onClick={() => onFazerCardsDryRun?.(product)}
                            className="inline-flex h-8 items-center gap-1 rounded-xl border border-amber-200 px-3 text-[9px] font-black text-amber-700 disabled:opacity-50 dark:border-amber-400/20 dark:text-amber-200"
                          >
                            <FlaskConical className="h-3.5 w-3.5" />
                            Payload preview
                          </button>
                        </div>
                      </details>
                      <button
                        type="button"
                        disabled={loading || !product.importedProduct?.id || actionKey === `${product.id}:disable`}
                        onClick={() => onFazerCardsDisable?.(product)}
                        className="inline-flex h-8 items-center gap-1 rounded-xl border border-rose-200 px-3 text-[9px] font-black text-rose-700 disabled:opacity-50 dark:border-rose-400/20 dark:text-rose-200"
                      >
                        <Power className="h-3.5 w-3.5" />
                        Disable product
                      </button>
                    </div>
                  )}
                </div>
              </article>
              );
            })
          ) : (
            <p className="py-8 text-center text-xs font-black text-slate-400">No supplier products found.</p>
          )}
        </div>

        {pagination?.pages > 1 && (
          <footer className="flex shrink-0 items-center justify-between border-t border-slate-100 p-3 dark:border-white/[0.07]">
            <button type="button" disabled={loading || pagination.page <= 1} onClick={() => onPageChange(pagination.page - 1)} className="inline-flex h-9 items-center gap-1 rounded-xl border border-slate-200 px-3 text-[9px] font-black text-slate-600 disabled:opacity-50 dark:border-white/10 dark:text-slate-300">
              <ChevronRight className="h-3.5 w-3.5" />
              Previous
            </button>
            <span className="text-[10px] font-black text-slate-500 dark:text-slate-300">
              Page {pagination.page} of {pagination.pages}
            </span>
            <button type="button" disabled={loading || pagination.page >= pagination.pages} onClick={() => onPageChange(pagination.page + 1)} className="inline-flex h-9 items-center gap-1 rounded-xl border border-slate-200 px-3 text-[9px] font-black text-slate-600 disabled:opacity-50 dark:border-white/10 dark:text-slate-300">
              Next
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
          </footer>
        )}
      </section>
    </div>,
    document.body,
  );
}
