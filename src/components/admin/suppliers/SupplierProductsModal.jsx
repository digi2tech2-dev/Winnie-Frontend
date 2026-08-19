import { useEffect, useRef, useState } from "react";
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

const AUTO_PROVIDER_FAMILIES = new Set(["TOPUPS", "GIFTCARDS", "GAME_KEYS", "TELEGRAM", "STEAM_TOPUP", "STEAM_GIFTS", "MANUAL_SERVICES"]);

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
  onFazerCardsSteamGiftIndexRefresh,
  onFazerCardsSteamGiftSearch,
  onImport,
  onPageChange,
  onSearch,
  onSync,
  pagination,
  products = [],
  search = "",
  supplier,
  fazerCardsCatalog = {},
}) {
  const [query, setQuery] = useState("");
  const previousDebouncedSearchRef = useRef("");
  const [copiedId, setCopiedId] = useState("");
  const [steamGiftAppId, setSteamGiftAppId] = useState("");
  const [steamGiftAppIdError, setSteamGiftAppIdError] = useState("");
  const [steamGiftSearchQuery, setSteamGiftSearchQuery] = useState("");
  const [steamGiftSearchState, setSteamGiftSearchState] = useState({
    error: "",
    indexEmpty: false,
    items: [],
    loading: false,
    message: "",
    searched: false,
  });
  const [steamGiftIndexRefreshing, setSteamGiftIndexRefreshing] = useState(false);

  useEffect(() => {
    setQuery(search || "");
    previousDebouncedSearchRef.current = search || "";
  }, [search, supplier?.id]);

  useEffect(() => {
    if (!fazerCards || !supplier || !onSearch) return undefined;

    const normalizedQuery = query.trim();
    if (normalizedQuery === previousDebouncedSearchRef.current) return undefined;

    const timeoutId = window.setTimeout(() => {
      previousDebouncedSearchRef.current = normalizedQuery;
      onSearch(normalizedQuery, filters);
    }, 400);

    return () => window.clearTimeout(timeoutId);
  }, [fazerCards, filters, onSearch, query, supplier]);

  const submitSearch = () => {
    const normalizedQuery = query.trim();
    previousDebouncedSearchRef.current = normalizedQuery;
    onSearch?.(normalizedQuery, filters);
  };

  if (!supplier) return null;

  const syncBusy = actionKey === `${supplier?.id}:sync`;
  const syncAllBusy = actionKey === `${supplier?.id}:sync-all`;
  const activeFamily = String(filters.familyKey || "").toUpperCase();
  const steamGiftsSelected = activeFamily === "STEAM_GIFTS";
  const steamGiftAppIdValue = steamGiftAppId.trim();
  const familySummary = fazerCardsCatalog.summary?.byFamily || {};
  const contractSummary = fazerCardsCatalog.contractsSummary?.families || {};
  const familyList = fazerCardsCatalog.families?.length ? fazerCardsCatalog.families : FAZERCARDS_FAMILY_TABS;
  const syncResult = fazerCardsCatalog.syncResult;
  const syncFamilyHint = steamGiftsSelected
    ? "Steam Gifts تتم مزامنتها بلعبة واحدة فقط لتجنب سحب الكتالوج الكبير."
    : "اختر عائلة لمزامنة منتجاتها من المورد.";
  const visibleProducts = fazerCards && activeFamily
    ? products.filter((product) => String(product?.familyKey || "").toUpperCase() === activeFamily)
    : products;

  const updateFilter = (patch) => {
    if (Object.prototype.hasOwnProperty.call(patch, "familyKey")) {
      setSteamGiftAppIdError("");
    }
    onFilterChange?.({ ...filters, ...patch });
  };
  const handleSyncFamily = () => {
    if (steamGiftsSelected && !steamGiftAppIdValue) {
      setSteamGiftAppIdError("اكتب AppID أولاً لمزامنة Steam Gifts");
      return;
    }
    setSteamGiftAppIdError("");
    onFazerCardsSyncFamily?.(
      activeFamily || "TOPUPS",
      steamGiftsSelected ? { appid: Number(steamGiftAppIdValue) } : {},
    );
  };
  const handleSteamGiftSearch = async (event) => {
    event?.preventDefault?.();
    if (!onFazerCardsSteamGiftSearch) return;
    setSteamGiftSearchState((current) => ({ ...current, error: "", loading: true, searched: true }));
    try {
      const result = await onFazerCardsSteamGiftSearch(steamGiftSearchQuery);
      setSteamGiftSearchState({
        error: "",
        indexEmpty: result?.indexEmpty === true,
        items: Array.isArray(result?.items) ? result.items : [],
        loading: false,
        message: result?.message || "",
        searched: true,
      });
    } catch (error) {
      setSteamGiftSearchState({
        error: error.userMessage || error.message || "تعذر البحث في فهرس Steam Gifts.",
        indexEmpty: false,
        items: [],
        loading: false,
        message: "",
        searched: true,
      });
    }
  };
  const handleSteamGiftIndexRefresh = async () => {
    if (!onFazerCardsSteamGiftIndexRefresh || steamGiftIndexRefreshing) return;
    setSteamGiftIndexRefreshing(true);
    try {
      const result = await onFazerCardsSteamGiftIndexRefresh();
      if (result) {
        setSteamGiftSearchState((current) => ({
          ...current,
          message: result.warning || `تم تحديث الفهرس: ${result.returned || 0} لعبة.`,
        }));
      }
    } finally {
      setSteamGiftIndexRefreshing(false);
    }
  };
  const handleSteamGiftResultSync = (item) => {
    const appid = Number(item?.appid);
    if (!Number.isFinite(appid) || appid <= 0) return;
    setSteamGiftAppId(String(appid));
    setSteamGiftAppIdError("");
    onFazerCardsSyncFamily?.("STEAM_GIFTS", { appid });
  };
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
            submitSearch();
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
                      <span className="mt-1 block truncate text-[7px] font-black text-violet-500 dark:text-violet-200">{family.key === "STEAM_GIFTS" ? "ON_DEMAND_SYNC" : contract.supportStage || "CATALOG"}</span>
                      <span className="block truncate text-[7px] font-bold text-slate-400">{contract.executionStage || "NONE"}</span>
                    </button>
                  );
                })}
              </div>

              {steamGiftsSelected && (
                <div className="grid gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-2 dark:border-white/10 dark:bg-[#0B1220]">
                  <div className="grid gap-1">
                    <label className="text-[8px] font-black text-slate-500 dark:text-slate-300" htmlFor="steam-gift-search">
                      Search Steam Gifts
                    </label>
                    <div className="flex gap-2">
                      <input
                        id="steam-gift-search"
                        value={steamGiftSearchQuery}
                        onChange={(event) => setSteamGiftSearchQuery(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") handleSteamGiftSearch(event);
                        }}
                        placeholder="ابحث باسم اللعبة أو AppID"
                        className="h-9 min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-[10px] font-bold outline-none dark:border-white/10 dark:bg-[#111827] dark:text-white"
                      />
                      <button
                        type="button"
                        onClick={handleSteamGiftSearch}
                        disabled={steamGiftSearchState.loading}
                        className="inline-flex h-9 items-center gap-1 rounded-xl bg-violet-600 px-3 text-[8px] font-black text-white disabled:opacity-60"
                      >
                        <Search className="h-3.5 w-3.5" />
                        بحث
                      </button>
                    </div>
                    <p className="text-[8px] font-bold text-slate-500 dark:text-slate-300">
                      البحث يستخدم الفهرس المحلي فقط ولا يستدعي المورد أثناء الكتابة.
                    </p>
                  </div>

                  {steamGiftSearchState.searched && (
                    <div className="grid gap-1 rounded-xl bg-white p-2 text-[9px] font-bold text-slate-500 dark:bg-[#111827] dark:text-slate-300">
                      {steamGiftSearchState.loading ? (
                        <span>جارٍ البحث...</span>
                      ) : steamGiftSearchState.error ? (
                        <span className="text-rose-600 dark:text-rose-200">{steamGiftSearchState.error}</span>
                      ) : steamGiftSearchState.indexEmpty ? (
                        <span>{steamGiftSearchState.message || "فهرس Steam Gifts فارغ. حدّث الفهرس أو اكتب AppID يدويًا."}</span>
                      ) : steamGiftSearchState.items.length ? (
                        steamGiftSearchState.items.map((item) => (
                          <div key={item.appid} className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-100 px-2 py-1 dark:border-white/10">
                            <span className="min-w-0 flex-1 truncate">{item.name}</span>
                            <span dir="ltr" className="text-slate-400">AppID {item.appid}</span>
                            <button
                              type="button"
                              onClick={() => handleSteamGiftResultSync(item)}
                              disabled={loading || Boolean(actionKey)}
                              className="h-7 rounded-lg bg-slate-900 px-2 text-[8px] font-black text-white disabled:opacity-60 dark:bg-white dark:text-slate-950"
                            >
                              مزامنة هذه اللعبة
                            </button>
                          </div>
                        ))
                      ) : (
                        <span>لا توجد نتائج. جرّب AppID أو اسمًا آخر.</span>
                      )}
                    </div>
                  )}

                  <div className="grid gap-1">
                    <label className="text-[8px] font-black text-slate-500 dark:text-slate-300" htmlFor="steam-gift-appid">
                      Steam AppID
                    </label>
                    <input
                      id="steam-gift-appid"
                      dir="ltr"
                      inputMode="numeric"
                      value={steamGiftAppId}
                      onChange={(event) => {
                        setSteamGiftAppId(event.target.value);
                        setSteamGiftAppIdError("");
                      }}
                      placeholder="مثال: 730"
                      className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-[10px] font-bold outline-none dark:border-white/10 dark:bg-[#111827] dark:text-white"
                    />
                    <p className="text-[8px] font-bold text-slate-500 dark:text-slate-300">
                      Steam Gifts تتم مزامنتها بلعبة واحدة فقط لتجنب سحب الكتالوج الكبير.
                    </p>
                    {steamGiftAppIdError && (
                      <p className="text-[8px] font-black text-rose-600 dark:text-rose-200">{steamGiftAppIdError}</p>
                    )}
                  </div>

                  <details className="rounded-xl border border-slate-200 bg-white px-2 py-1 dark:border-white/10 dark:bg-[#111827]">
                    <summary className="cursor-pointer text-[8px] font-black text-slate-500 dark:text-slate-300">خيارات متقدمة</summary>
                    <div className="mt-2 grid gap-1">
                      <p className="text-[8px] font-bold text-slate-500 dark:text-slate-300">
                        يتم تحديث الفهرس فقط ولا يتم إنشاء منتجات. قد يستغرق وقتًا بسبب حجم الكتالوج.
                      </p>
                      <button
                        type="button"
                        onClick={handleSteamGiftIndexRefresh}
                        disabled={steamGiftIndexRefreshing || loading || Boolean(actionKey)}
                        className="inline-flex h-8 w-fit items-center gap-1 rounded-xl border border-slate-200 px-3 text-[8px] font-black text-slate-600 disabled:opacity-60 dark:border-white/10 dark:text-slate-300"
                      >
                        <RefreshCw className={`h-3.5 w-3.5 ${steamGiftIndexRefreshing ? "animate-spin" : ""}`} />
                        تحديث فهرس الألعاب
                      </button>
                      {steamGiftSearchState.message && (
                        <p className="text-[8px] font-bold text-slate-400">{steamGiftSearchState.message}</p>
                      )}
                    </div>
                  </details>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-2 text-[9px] font-bold text-amber-700 dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-200">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                <span className="min-w-0 flex-1">{syncFamilyHint}</span>
                <button
                  type="button"
                  onClick={handleSyncFamily}
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
                      {familyKey}: التالي {result?.nextCursor || "-"} | المزيد {result?.hasMore ? "نعم" : "لا"}{result?.skipped ? " | تم التجاوز" : ""}
                    </span>
                  ))}
                </div>
              )}

              <div className="grid gap-2 sm:grid-cols-6">
              <input
                value={filters.category || ""}
                onChange={(event) => updateFilter({ category: event.target.value })}
                placeholder="التصنيف"
                className="h-9 rounded-xl border border-slate-200 bg-slate-50 px-3 text-[10px] font-bold outline-none dark:border-white/10 dark:bg-[#0B1220] dark:text-white"
              />
              <select
                value={filters.supported ?? "true"}
                onChange={(event) => updateFilter({ supported: event.target.value })}
                className="h-9 rounded-xl border border-slate-200 bg-slate-50 px-2 text-[10px] font-bold outline-none dark:border-white/10 dark:bg-[#0B1220] dark:text-white"
              >
                <option value="">كل حالات الدعم</option>
                <option value="true">مدعوم</option>
                <option value="false">غير مدعوم</option>
              </select>
              <select
                value={filters.blocked ?? ""}
                onChange={(event) => updateFilter({ blocked: event.target.value })}
                className="h-9 rounded-xl border border-slate-200 bg-slate-50 px-2 text-[10px] font-bold outline-none dark:border-white/10 dark:bg-[#0B1220] dark:text-white"
              >
                <option value="">كل حالات الحظر</option>
                <option value="false">غير محظور</option>
                <option value="true">محظور</option>
              </select>
              <select
                value={filters.imported ?? ""}
                onChange={(event) => updateFilter({ imported: event.target.value })}
                className="h-9 rounded-xl border border-slate-200 bg-slate-50 px-2 text-[10px] font-bold outline-none dark:border-white/10 dark:bg-[#0B1220] dark:text-white"
              >
                <option value="">كل حالات الاستيراد</option>
                <option value="false">غير مستورد</option>
                <option value="true">تم استيراده</option>
                </select>
              <select
                value={filters.fulfillmentMode || ""}
                onChange={(event) => updateFilter({ fulfillmentMode: event.target.value })}
                className="h-9 rounded-xl border border-slate-200 bg-slate-50 px-2 text-[10px] font-bold outline-none dark:border-white/10 dark:bg-[#0B1220] dark:text-white"
              >
                <option value="">كل أنماط التنفيذ</option>
                {FULFILLMENT_MODES.map((mode) => <option key={mode} value={mode}>{mode}</option>)}
              </select>
              <input
                value={filters.blockReason || ""}
                onChange={(event) => updateFilter({ blockReason: event.target.value })}
                placeholder="سبب الحظر"
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
            <p className="py-8 text-center text-xs font-black text-slate-400">جارٍ تحميل منتجات المورد...</p>
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
                  {!fazerCards && (
                    <p dir="ltr" className="mt-1 text-right text-[9px] font-bold text-slate-400">
                      {product.externalProductId || product.id}
                    </p>
                  )}
                  <p className="mt-1 text-[9px] font-bold text-slate-500 dark:text-slate-300">
                    Qty {product.minQty} - {product.maxQty} | Last sync {product.lastSyncedAtLabel}
                  </p>
                  {fazerCards && (
                    <div className="mt-2 flex flex-wrap gap-1.5 text-[8px] font-black">
                      <span className="rounded-full bg-slate-200 px-2 py-1 text-slate-600 dark:bg-white/10 dark:text-slate-300">{product.categoryName || product.category || "بلا تصنيف"}</span>
                      {(product.region || product.platform) && (
                        <span className="rounded-full bg-slate-200 px-2 py-1 text-slate-600 dark:bg-white/10 dark:text-slate-300">{[product.platform, product.region].filter(Boolean).join(" / ")}</span>
                      )}
                      <span className="rounded-full bg-slate-200 px-2 py-1 text-slate-600 dark:bg-white/10 dark:text-slate-300">المخزون: {product.stockLabel || "غير معروف"}</span>
                      <span className="rounded-full bg-sky-100 px-2 py-1 text-sky-700 dark:bg-sky-500/15 dark:text-sky-200">{product.requiredFieldsLabel}</span>
                      <span className={`rounded-full px-2 py-1 ${product.isSupported ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200" : "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-200"}`}>
                        {product.isSupported ? "مدعوم" : "غير مدعوم"}
                      </span>
                      <span className={`rounded-full px-2 py-1 ${product.imported ? "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-200" : "bg-slate-200 text-slate-600 dark:bg-white/10 dark:text-slate-300"}`}>
                        {product.imported ? "تم استيراده" : "غير مستورد"}
                      </span>
                      <details className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1 dark:border-white/10 dark:bg-white/[0.03]">
                        <summary className="cursor-pointer text-[8px] font-black text-slate-500 dark:text-slate-300">خيارات متقدمة</summary>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          <span className="rounded-full bg-indigo-100 px-2 py-1 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-200">{product.familyKey || "UNKNOWN"}</span>
                          <span className="rounded-full bg-cyan-100 px-2 py-1 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-200">{product.fulfillmentMode || "UNKNOWN"}</span>
                          {contract.supportStage && <span className="rounded-full bg-violet-100 px-2 py-1 text-violet-700 dark:bg-violet-500/15 dark:text-violet-200">{contract.supportStage}</span>}
                          {contract.executionStage && <span className="rounded-full bg-slate-200 px-2 py-1 text-slate-600 dark:bg-white/10 dark:text-slate-300">{contract.executionStage}</span>}
                          {product.supportLevel && <span className="rounded-full bg-slate-200 px-2 py-1 text-slate-600 dark:bg-white/10 dark:text-slate-300">{product.supportLevel}</span>}
                          <span dir="ltr" className="rounded-full bg-slate-200 px-2 py-1 text-slate-600 dark:bg-white/10 dark:text-slate-300">{product.externalProductId || product.id}</span>
                          <span className={`rounded-full px-2 py-1 ${product.isBlocked ? "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-200" : "bg-slate-200 text-slate-600 dark:bg-white/10 dark:text-slate-300"}`}>
                            {product.isBlocked ? product.blockReason || "محظور" : "غير محظور"}
                          </span>
                          {firstBlocker && <span className="rounded-full bg-amber-100 px-2 py-1 text-amber-700 dark:bg-amber-500/15 dark:text-amber-200">{firstBlocker}</span>}
                        </div>
                      </details>
                    </div>
                  )}
                  {fazerCards && imported && (
                    <div className="mt-2 rounded-xl border border-slate-200 bg-white p-2 text-[9px] font-bold text-slate-500 dark:border-white/10 dark:bg-[#111827] dark:text-slate-300">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className={`rounded-full px-2 py-1 ${visibleToCustomer ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200" : "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-200"}`}>
                          {visibleToCustomer ? "ظاهر للعملاء" : "غير ظاهر للعملاء"}
                        </span>
                        <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-600 dark:bg-white/10 dark:text-slate-200">
                          {imported.providerExecutionMode === "AUTO_PROVIDER" ? "تنفيذ تلقائي من المورد" : imported.providerExecutionMode === "MANUAL_FULFILLMENT" ? "تنفيذ الطلب" : "غير مفعل"}
                        </span>
                      </div>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        <span className={imported.isActive ? "text-emerald-600 dark:text-emerald-200" : "text-amber-600 dark:text-amber-200"}>مفعّل: {imported.isActive ? "نعم" : "لا"}</span>
                        <span className={imported.visibleInStore ? "text-emerald-600 dark:text-emerald-200" : "text-amber-600 dark:text-amber-200"}>ظاهر بالمتجر: {imported.visibleInStore ? "نعم" : "لا"}</span>
                        <span>status={imported.status || "-"}</span>
                        <span className={imported.customerPurchaseEnabled ? "text-emerald-600 dark:text-emerald-200" : "text-amber-600 dark:text-amber-200"}>شراء العملاء: {imported.customerPurchaseEnabled ? "مسموح" : "غير مسموح"}</span>
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
                        <summary className="cursor-pointer text-[8px] font-black text-slate-500 dark:text-slate-300">التفاصيل والخيارات المتقدمة</summary>
                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                          <span dir="ltr" className="rounded bg-white px-2 py-1 text-slate-600 dark:bg-[#111827] dark:text-slate-200">معرّف منتج Winnie: {imported.id}</span>
                          <button
                            type="button"
                            onClick={() => copyProductId(imported.id)}
                            className="inline-flex h-6 items-center gap-1 rounded-lg border border-slate-200 px-2 text-[8px] font-black text-slate-600 dark:border-white/10 dark:text-slate-300"
                          >
                            <Copy className="h-3 w-3" />
                            {copiedId === imported.id ? "تم النسخ" : "نسخ معرّف المنتج"}
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
                        معاينة
                      </button>
                      <button
                        type="button"
                        disabled={loading}
                        onClick={() => onImport?.(product)}
                        className="inline-flex h-8 items-center gap-1 rounded-xl bg-violet-600 px-3 text-[9px] font-black text-white disabled:bg-slate-300 disabled:text-slate-500 dark:disabled:bg-white/10 dark:disabled:text-slate-400"
                      >
                        <Download className="h-3.5 w-3.5" />
                        {product.imported ? "تحديث المنتج" : "استيراد المنتج"}
                      </button>
                      <button
                        type="button"
                        disabled={launchManualDisabled}
                        title={manualFieldWarning || undefined}
                        onClick={() => onFazerCardsLaunchManual?.(product)}
                        className="inline-flex h-8 items-center gap-1 rounded-xl bg-emerald-600 px-3 text-[9px] font-black text-white disabled:bg-slate-300 disabled:text-slate-500 dark:disabled:bg-white/10 dark:disabled:text-slate-400"
                      >
                        <Rocket className="h-3.5 w-3.5" />
                        نشر المنتج
                      </button>
                      {autoProviderCapable && (
                        <button
                          type="button"
                          disabled={enableAutoDisabled}
                          onClick={() => onFazerCardsEnableAuto?.(product)}
                          className="inline-flex h-8 items-center gap-1 rounded-xl bg-sky-600 px-3 text-[9px] font-black text-white disabled:bg-slate-300 disabled:text-slate-500 dark:disabled:bg-white/10 dark:disabled:text-slate-400"
                        >
                          <Rocket className="h-3.5 w-3.5" />
                          تفعيل التنفيذ التلقائي
                        </button>
                      )}
                      <details className="w-full text-right sm:w-auto">
                        <summary className="cursor-pointer rounded-xl border border-slate-200 px-3 py-2 text-[9px] font-black text-slate-500 dark:border-white/10 dark:text-slate-300">
                          خيارات متقدمة
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
                            معاينة الطلب
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
                        تعطيل المنتج
                      </button>
                    </div>
                  )}
                </div>
              </article>
              );
            })
          ) : (
            <p className="py-8 text-center text-xs font-black text-slate-400">
              {fazerCards && activeFamily === "STEAM_GIFTS"
                ? "اكتب AppID واضغط Sync Family لإضافة منتجات Steam Gifts."
                : "لا توجد منتجات للمورد."}
            </p>
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
