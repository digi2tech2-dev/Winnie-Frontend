import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowUpLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleDot,
  Clock3,
  Database,
  FolderOpen,
  Layers3,
  Link2,
  Loader2,
  PackageCheck,
  Plus,
  RefreshCw,
  Rocket,
  Search,
  Server,
  Trash2,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  getFazerCardsCatalogFamilies,
  getFazerCardsCatalogSyncStatus,
  getFazerCardsProviderProducts,
  launchFazerCardsProduct,
  refreshFazerCardsSteamGiftIndex,
  searchFazerCardsSteamGiftIndex,
  syncFazerCardsCatalogAll,
  syncFazerCardsCatalogFamily,
} from "../../../api/adminProviders";
import {
  groupFazerCardsCatalogs,
  readRetrievedFazerCardsCatalogs,
  removeRetrievedFazerCardsCatalog,
  saveRetrievedFazerCardsCatalog,
} from "../../../utils/fazerCardsCatalogs";
import FazerCardsImportModal from "./FazerCardsImportModal";
import "../../../styles/fazercards-special-provider.css";

const SEARCH_DELAY = 350;
const CATALOG_SEARCH_PAGE_SIZE = 100;
const OFFERS_PAGE_SIZE = 50;
const SYNC_SUCCESS_COOLDOWN_SECONDS = 30;
const SYNC_RATE_LIMIT_COOLDOWN_SECONDS = 60;
const DEFAULT_SEARCH_FAMILIES = ["TOPUPS", "GIFTCARDS", "GAME_KEYS", "TELEGRAM", "STEAM_TOPUP", "MANUAL_SERVICES", "STEAM_GIFTS"];
const INDEX_SYNC_FAMILIES = DEFAULT_SEARCH_FAMILIES.filter((familyKey) => familyKey !== "STEAM_GIFTS");
const FAMILY_LABELS = {
  GAME_KEYS: "مفاتيح الألعاب",
  GIFTCARDS: "بطاقات الهدايا",
  MANUAL_SERVICES: "الخدمات اليدوية",
  STEAM_GIFTS: "Steam Gifts",
  STEAM_TOPUP: "شحن Steam",
  TELEGRAM: "Telegram",
  TOPUPS: "الشحن المباشر",
};
const AUTO_PROVIDER_FAMILIES = new Set(DEFAULT_SEARCH_FAMILIES);
const EMPTY_IMPORT_STATE = {
  action: "",
  error: "",
  launchMessage: "",
  launchTone: "",
  loading: false,
  manualFieldWarning: "",
  product: null,
  warning: "",
};

export default function FazerCardsSpecialProviderPage({
  health,
  loadError,
  loading,
  onRefresh,
  refreshing = false,
  supplier,
  token,
}) {
  const [query, setQuery] = useState("");
  const [searchState, setSearchState] = useState({ error: "", loading: false, results: [], searched: false, warning: "" });
  const [syncState, setSyncState] = useState({ action: "", error: "", lastSyncedAt: "", message: "" });
  const [syncCooldownUntil, setSyncCooldownUntil] = useState(0);
  const [syncCooldownSeconds, setSyncCooldownSeconds] = useState(0);
  const [retryFamily, setRetryFamily] = useState("GIFTCARDS");
  const [steamGiftAppId, setSteamGiftAppId] = useState("");
  const [steamGiftState, setSteamGiftState] = useState({
    error: "",
    indexEmpty: false,
    indexRefreshing: false,
    items: [],
    loading: false,
    message: "",
    searched: false,
  });
  const [retrievedCatalogs, setRetrievedCatalogs] = useState(() => readRetrievedFazerCardsCatalogs());
  const [retrievingKey, setRetrievingKey] = useState("");
  const [activeCatalog, setActiveCatalog] = useState(null);
  const requestRef = useRef(0);
  const syncLockRef = useRef(false);

  const retrievedKeys = useMemo(() => new Set(retrievedCatalogs.map((catalog) => catalog.key)), [retrievedCatalogs]);
  const connected = health?.api?.connectionOk === true || (!health && supplier?.active === true);
  const steamGiftsSelected = retryFamily === "STEAM_GIFTS";

  useEffect(() => {
    let active = true;
    if (!token) return undefined;

    getFazerCardsCatalogSyncStatus(token)
      .then(({ status }) => {
        if (!active) return;
        setSyncState((current) => ({ ...current, lastSyncedAt: getLatestSyncTimestamp(status) }));
      })
      .catch(() => {});

    return () => { active = false; };
  }, [token]);

  useEffect(() => {
    if (!syncCooldownUntil) {
      setSyncCooldownSeconds(0);
      return undefined;
    }

    const updateRemaining = () => {
      const remaining = Math.max(0, Math.ceil((syncCooldownUntil - Date.now()) / 1000));
      setSyncCooldownSeconds(remaining);
      if (!remaining) {
        setSyncCooldownUntil(0);
        setSyncState((current) => (
          current.error.includes("حد طلبات FazerCards") ? { ...current, error: "" } : current
        ));
      }
    };
    updateRemaining();
    const timer = window.setInterval(updateRemaining, 1000);
    return () => window.clearInterval(timer);
  }, [syncCooldownUntil]);

  const activateProviderCooldown = (error) => {
    const waitSeconds = getSyncRetrySeconds(error);
    startSyncCooldown(setSyncCooldownUntil, setSyncCooldownSeconds, waitSeconds);
    setSyncState((current) => ({ ...current, action: "", error: "", message: "" }));
    return waitSeconds;
  };

  const resetCatalogSearch = (nextQuery) => {
    requestRef.current += 1;
    setQuery(nextQuery);
    setSearchState({ error: "", loading: false, results: [], searched: false, warning: "" });
  };

  const searchCatalogs = async (event, requestedQuery = query) => {
    event?.preventDefault?.();
    const searchQuery = requestedQuery.trim();
    const requestId = requestRef.current + 1;
    requestRef.current = requestId;

    if (searchQuery.length < 2) {
      setSearchState({
        error: "اكتب حرفين على الأقل، ثم اضغط على زر البحث.",
        loading: false,
        results: [],
        searched: false,
        warning: "",
      });
      return;
    }

    setSearchState({ error: "", loading: true, results: [], searched: true, warning: "" });

    try {
      let familyKeys = DEFAULT_SEARCH_FAMILIES;
      try {
        const familyResult = await getFazerCardsCatalogFamilies(token);
        familyKeys = Array.from(new Set([
          ...DEFAULT_SEARCH_FAMILIES,
          ...familyResult.families
            .map((family) => String(family.familyKey || "").trim().toUpperCase())
            .filter((familyKey) => DEFAULT_SEARCH_FAMILIES.includes(familyKey)),
        ]));
      } catch {
        // The known families remain a safe fallback if catalog metadata is unavailable.
      }

      if (requestRef.current !== requestId) return;
      const familyResults = await Promise.allSettled(familyKeys.map((familyKey) => (
        getAllCachedFamilySearchResults(token, familyKey, searchQuery)
      )));

      if (requestRef.current !== requestId) return;
      const successfulResults = familyResults.filter((result) => result.status === "fulfilled");
      const failedResults = familyResults.filter((result) => result.status === "rejected");
      if (!successfulResults.length) throw failedResults[0]?.reason || new Error("Catalog search failed");

      const uniqueProducts = new Map();
      successfulResults.forEach(({ value }) => {
        value.products.forEach((product) => uniqueProducts.set(product.id || product.offerId, product));
      });

      setSearchState({
        error: "",
        loading: false,
        results: groupFazerCardsCatalogs(Array.from(uniqueProducts.values())),
        searched: true,
        warning: failedResults.length
          ? `تم البحث في ${successfulResults.length} عائلة، وتعذر الوصول إلى ${failedResults.length}. أعد المحاولة لإكمال البحث.`
          : "",
      });
    } catch (error) {
      if (requestRef.current !== requestId) return;
      setSearchState({
        error: error.userMessage || "تعذر البحث في كتالوج FazerCards.",
        loading: false,
        results: [],
        searched: true,
        warning: "",
      });
    }
  };

  const refreshSyncTimestamp = async () => {
    try {
      const { status } = await getFazerCardsCatalogSyncStatus(token);
      return getLatestSyncTimestamp(status) || new Date().toISOString();
    } catch {
      return new Date().toISOString();
    }
  };

  const syncCatalogIndex = async () => {
    if (!token || syncLockRef.current || syncState.action || syncCooldownSeconds > 0) return;
    syncLockRef.current = true;
    requestRef.current += 1;
    setSyncState((current) => ({ ...current, action: "all", error: "", message: "" }));

    try {
      const { result } = await syncFazerCardsCatalogAll(token, {
        families: INDEX_SYNC_FAMILIES,
        includeSteamGifts: false,
        limit: CATALOG_SEARCH_PAGE_SIZE,
      });
      const errors = Array.isArray(result.errors) ? result.errors.length : 0;
      const created = Number(result.totals?.providerProductsCreated || 0);
      const updated = Number(result.totals?.providerProductsUpdated || 0);
      const lastSyncedAt = await refreshSyncTimestamp();
      setSyncState({
        action: "",
        error: "",
        lastSyncedAt,
        message: errors
          ? `اكتملت المزامنة مع ${errors} ملاحظة. تمت إضافة ${created} وتحديث ${updated}.`
          : `الفهرس محدث: تمت إضافة ${created} وتحديث ${updated} منتج مورد.`,
      });
      startSyncCooldown(setSyncCooldownUntil, setSyncCooldownSeconds, SYNC_SUCCESS_COOLDOWN_SECONDS);
      if (query.trim().length >= 2) await searchCatalogs(null, query);
    } catch (error) {
      const rateLimited = Number(error.status) === 429;
      if (rateLimited) {
        activateProviderCooldown(error);
        return;
      }
      setSyncState((current) => ({
        ...current,
        action: "",
        error: error.userMessage || error.message || "تعذر تحديث فهرس FazerCards.",
        message: "",
      }));
    } finally {
      syncLockRef.current = false;
    }
  };

  const syncFamilyAndRetry = async () => {
    if (!token || syncLockRef.current || syncState.action || syncCooldownSeconds > 0 || !retryFamily) return;
    syncLockRef.current = true;
    requestRef.current += 1;
    setSyncState((current) => ({ ...current, action: `family:${retryFamily}`, error: "", message: "" }));

    try {
      const { result } = await syncFazerCardsCatalogFamily(token, {
        family: retryFamily,
        limit: CATALOG_SEARCH_PAGE_SIZE,
      });
      const created = Number(result.providerProductsCreated || 0);
      const updated = Number(result.providerProductsUpdated || 0);
      const lastSyncedAt = await refreshSyncTimestamp();
      setSyncState({
        action: "",
        error: "",
        lastSyncedAt,
        message: `تم تحديث ${FAMILY_LABELS[retryFamily] || retryFamily}: جديد ${created}، تحديث ${updated}.`,
      });
      startSyncCooldown(setSyncCooldownUntil, setSyncCooldownSeconds, SYNC_SUCCESS_COOLDOWN_SECONDS);
      if (query.trim().length >= 2) await searchCatalogs(null, query);
    } catch (error) {
      const rateLimited = Number(error.status) === 429;
      if (rateLimited) {
        activateProviderCooldown(error);
        return;
      }
      setSyncState((current) => ({
        ...current,
        action: "",
        error: error.userMessage || error.message || `تعذر تحديث ${FAMILY_LABELS[retryFamily] || retryFamily}.`,
        message: "",
      }));
    } finally {
      syncLockRef.current = false;
    }
  };

  const searchSteamGiftIndex = async (event) => {
    event?.preventDefault?.();
    setSteamGiftState((current) => ({ ...current, error: "", loading: true, searched: true }));
    try {
      const result = await searchFazerCardsSteamGiftIndex(token, { q: steamGiftAppId, limit: 20 });
      setSteamGiftState((current) => ({
        ...current,
        error: "",
        indexEmpty: result.result?.indexEmpty === true,
        items: Array.isArray(result.result?.items) ? result.result.items : [],
        loading: false,
        message: result.result?.message || "",
        searched: true,
      }));
    } catch (error) {
      setSteamGiftState((current) => ({
        ...current,
        error: error.userMessage || error.message || "تعذر البحث في فهرس Steam Gifts.",
        indexEmpty: false,
        items: [],
        loading: false,
        message: "",
        searched: true,
      }));
    }
  };

  const refreshSteamGiftIndex = async () => {
    if (!token || steamGiftState.indexRefreshing || syncLockRef.current || syncState.action || syncCooldownSeconds > 0) return;
    if (!window.confirm("تحديث فهرس Steam Gifts فقط؟ لن يتم إنشاء منتجات أو تنفيذ طلبات.")) return;

    syncLockRef.current = true;
    setSteamGiftState((current) => ({ ...current, error: "", indexRefreshing: true, message: "" }));
    setSyncState((current) => ({ ...current, action: "steam-gift-index", error: "", message: "" }));
    try {
      const result = await refreshFazerCardsSteamGiftIndex(token);
      const data = result.result || {};
      setSteamGiftState((current) => ({
        ...current,
        indexRefreshing: false,
        message: data.warning || `تم تحديث الفهرس: ${data.returned || 0} لعبة.`,
      }));
      setSyncState((current) => ({ ...current, action: "" }));
    } catch (error) {
      const rateLimited = Number(error.status) === 429;
      if (rateLimited) {
        activateProviderCooldown(error);
        setSteamGiftState((current) => ({ ...current, indexRefreshing: false }));
        return;
      }
      setSteamGiftState((current) => ({
        ...current,
        error: error.userMessage || error.message || "تعذر تحديث فهرس Steam Gifts.",
        indexRefreshing: false,
      }));
      setSyncState((current) => ({ ...current, action: "" }));
    } finally {
      syncLockRef.current = false;
    }
  };

  const syncSteamGift = async ({ appid, name } = {}) => {
    const normalizedAppId = String(appid ?? steamGiftAppId).trim();
    if (!/^\d+$/.test(normalizedAppId) || Number(normalizedAppId) <= 0) {
      setSteamGiftState((current) => ({ ...current, error: "اكتب AppID صالحًا أولاً.", message: "" }));
      return;
    }
    if (!token || syncLockRef.current || syncState.action || syncCooldownSeconds > 0) return;

    syncLockRef.current = true;
    requestRef.current += 1;
    setSteamGiftAppId(normalizedAppId);
    setSteamGiftState((current) => ({ ...current, error: "", message: "" }));
    setSyncState((current) => ({ ...current, action: "steam-gifts", error: "", message: "" }));
    try {
      const { result } = await syncFazerCardsCatalogFamily(token, {
        appid: Number(normalizedAppId),
        family: "STEAM_GIFTS",
        gameName: name,
      });
      const created = Number(result.providerProductsCreated || 0);
      const updated = Number(result.providerProductsUpdated || 0);
      const searchTerm = String(name || normalizedAppId);
      setQuery(searchTerm);
      await searchCatalogs(null, searchTerm);
      const lastSyncedAt = await refreshSyncTimestamp();
      setSyncState({
        action: "",
        error: "",
        lastSyncedAt,
        message: `تمت مزامنة Steam Gifts للعبة ${normalizedAppId}: جديد ${created}، تحديث ${updated}.`,
      });
      startSyncCooldown(setSyncCooldownUntil, setSyncCooldownSeconds, SYNC_SUCCESS_COOLDOWN_SECONDS);
    } catch (error) {
      const rateLimited = Number(error.status) === 429;
      if (rateLimited) {
        activateProviderCooldown(error);
        return;
      }
      setSyncState((current) => ({
        ...current,
        action: "",
        error: error.userMessage || error.message || "تعذر مزامنة Steam Gifts.",
        message: "",
      }));
    } finally {
      syncLockRef.current = false;
    }
  };


  const retrieveCatalog = async (catalog) => {
    if (!token || retrievingKey) return;
    setRetrievingKey(catalog.key);
    try {
      const result = await getFazerCardsProviderProducts(token, {
        category: catalog.category,
        familyKey: catalog.familyKey,
        limit: 1,
        page: 1,
      });
      setRetrievedCatalogs(saveRetrievedFazerCardsCatalog({
        ...catalog,
        offerCount: result.pagination?.total || catalog.offerCount,
      }));
    } catch (error) {
      setSearchState((current) => ({ ...current, error: error.userMessage || "تعذر استرداد الكتالوج." }));
    } finally {
      setRetrievingKey("");
    }
  };

  const removeCatalog = (catalog) => {
    setRetrievedCatalogs(removeRetrievedFazerCardsCatalog(catalog.key));
    if (activeCatalog?.key === catalog.key) setActiveCatalog(null);
  };

  if (loading) return <ProviderPageSkeleton />;

  if (loadError || !supplier) {
    return (
      <section className="fc-state fc-state--error">
        <AlertCircle />
        <h1>تعذر فتح FazerCards</h1>
        <p>{loadError || "لم يتم العثور على المورد ضمن الموردين المسجلين."}</p>
        <Link to="/admin/tools/suppliers"><ArrowLeft /> العودة إلى الموردين</Link>
      </section>
    );
  }

  return (
    <main dir="rtl" className="fc-page">
      <header className="fc-header">
        <div className="fc-header__main">
          <Link className="fc-icon-button" to="/admin/tools/suppliers" aria-label="العودة إلى الموردين"><ArrowLeft /></Link>
          <span className="fc-brand" aria-hidden="true">F</span>
          <div className="fc-header__copy">
            <div className="fc-title-line">
              <h1>FazerCards</h1>
              <span className={`fc-connection ${connected ? "is-online" : "is-offline"}`}>
                <i /> {connected ? "متصل" : health ? "غير متصل" : "نشط"}
              </span>
            </div>
            <p>اختر الكتالوج، ثم أضف Offer واحدًا كمنتج متجر مع مزامنة الاسم والسعر والحدود.</p>
          </div>
        </div>
        <button type="button" className="fc-refresh" onClick={onRefresh} disabled={refreshing || Boolean(syncState.action) || syncCooldownSeconds > 0}>
          <RefreshCw className={refreshing ? "animate-spin" : ""} /> {syncCooldownSeconds > 0 ? `متاح بعد ${syncCooldownSeconds} ثانية` : "تحديث"}
        </button>
      </header>

      <ol className="fc-flow" aria-label="خطوات ربط عرض FazerCards">
        <FlowStep icon={Search} label="بحث" active />
        <FlowStep icon={PackageCheck} label="استرداد Catalog" />
        <FlowStep icon={FolderOpen} label="اختيار Offer" />
        <FlowStep icon={Link2} label="إضافة ومزامنة" />
      </ol>

      <section className="fc-search-panel">
        <div className="fc-section-heading">
          <div><span>كتالوج المورد</span><h2>ابحث عن لعبة أو Catalog</h2></div>
          <small>لن يتم تحميل كل منتجات المورد</small>
        </div>

        <div className="fc-family-sync">
          <div className="fc-family-sync__heading">
            <div><span>عائلات FazerCards</span><strong>اختر عائلة الكتالوج</strong></div>
            <small>Steam Gifts تستخدم بحث AppID خاصًا بها.</small>
          </div>
          <div className={`fc-family-sync__controls${steamGiftsSelected ? " is-steam-gifts" : ""}`}>
            <div className="fc-family-sync__options" role="list" aria-label="عائلات FazerCards المتاحة للمزامنة">
              {DEFAULT_SEARCH_FAMILIES.map((familyKey) => (
                <button
                  key={familyKey}
                  type="button"
                  className={retryFamily === familyKey ? "is-selected" : ""}
                  onClick={() => setRetryFamily(familyKey)}
                  disabled={Boolean(syncState.action)}
                  aria-pressed={retryFamily === familyKey}
                >
                  <span>{FAMILY_LABELS[familyKey] || familyKey}</span>
                  <small>{familyKey}</small>
                  {retryFamily === familyKey ? <Check /> : null}
                </button>
              ))}
            </div>
            {!steamGiftsSelected && (
              <button type="button" className="fc-family-sync__submit" onClick={syncFamilyAndRetry} disabled={Boolean(syncState.action) || syncCooldownSeconds > 0}>
                {syncState.action.startsWith("family:") ? <Loader2 className="animate-spin" /> : <RefreshCw />}
                <span>
                  <strong>{syncState.action.startsWith("family:") ? "جارٍ مزامنة العائلة" : syncCooldownSeconds > 0 ? `انتظر ${syncCooldownSeconds} ثانية` : `مزامنة ${FAMILY_LABELS[retryFamily] || retryFamily}`}</strong>
                  <small>{syncCooldownSeconds > 0 ? "حماية من تكرار طلبات المزامنة" : query.trim().length >= 2 ? "ثم إعادة البحث تلقائيًا" : "تحديث فهرس العائلة فقط"}</small>
                </span>
              </button>
            )}
          </div>
        </div>
        {!steamGiftsSelected && (
          <div className="fc-index-bar">
            <span className="fc-index-bar__icon"><Database /></span>
            <div className="fc-index-bar__copy">
              <strong>فهرس Catalogs</strong>
              <small><Clock3 /> {syncState.lastSyncedAt ? `آخر مزامنة ${formatSyncDate(syncState.lastSyncedAt)}` : "لم يصل وقت آخر مزامنة"}</small>
            </div>
            <button type="button" onClick={syncCatalogIndex} disabled={Boolean(syncState.action) || syncCooldownSeconds > 0}>
              {syncState.action === "all" ? <Loader2 className="animate-spin" /> : <RefreshCw />}
              <span>{syncState.action === "all" ? "جارٍ تحديث الفهرس" : syncCooldownSeconds > 0 ? `متاح بعد ${syncCooldownSeconds} ث` : "تحديث فهرس الكتالوج"}</span>
            </button>
          </div>
        )}
        {steamGiftsSelected && <section className="fc-steam-gifts" aria-labelledby="fc-steam-gifts-title">
          <div className="fc-family-sync__heading">
            <div>
              <span>STEAM_GIFTS · ON-DEMAND</span>
              <strong id="fc-steam-gifts-title">Steam Gifts</strong>
            </div>
            <small>فهرس الألعاب محلي؛ تفاصيل العروض تُجلب للـ AppID المختار فقط.</small>
          </div>
          <div className="fc-steam-gifts__controls">
            <form className="fc-steam-gifts__search" onSubmit={searchSteamGiftIndex}>
              <label className="fc-search-box fc-search-box--compact">
                {steamGiftState.loading ? <Loader2 className="animate-spin" /> : <Search />}
                <input
                  dir="ltr"
                  inputMode="search"
                  value={steamGiftAppId}
                  onChange={(event) => setSteamGiftAppId(event.target.value)}
                  placeholder="Game name or Steam AppID, e.g. 730"
                />
              </label>
              <button type="submit" className="fc-button fc-button--soft" disabled={steamGiftState.loading}>
                <Search /> بحث في الفهرس
              </button>
            </form>
            <button
              type="button"
              className="fc-button fc-button--soft"
              onClick={refreshSteamGiftIndex}
              disabled={steamGiftState.indexRefreshing || Boolean(syncState.action) || syncCooldownSeconds > 0}
            >
              {steamGiftState.indexRefreshing ? <Loader2 className="animate-spin" /> : <RefreshCw />}
              {steamGiftState.indexRefreshing ? "جارٍ تحديث الفهرس" : syncCooldownSeconds > 0 ? `متاح بعد ${syncCooldownSeconds} ثانية` : "تحديث فهرس Steam Gifts"}
            </button>
            <button
              type="button"
              className="fc-button fc-button--primary"
              onClick={() => syncSteamGift()}
              disabled={Boolean(syncState.action) || syncCooldownSeconds > 0}
            >
              {syncState.action === "steam-gifts" ? <Loader2 className="animate-spin" /> : <PackageCheck />}
              {syncState.action === "steam-gifts" ? "جارٍ مزامنة AppID" : syncCooldownSeconds > 0 ? `انتظر ${syncCooldownSeconds} ثانية` : "مزامنة AppID"}
            </button>
          </div>
          <p className="fc-steam-gifts__hint">لن تحاول المزامنة الشاملة جلب كتالوج Steam Gifts الضخم. استخدم AppID يدويًا أو ابحث في الفهرس ثم مزامنة اللعبة المطلوبة.</p>
          {steamGiftState.error ? <p className="fc-sync-message is-error"><AlertCircle />{steamGiftState.error}</p> : null}
          {steamGiftState.message ? <p className="fc-sync-message is-success"><Check />{steamGiftState.message}</p> : null}
          {steamGiftState.searched && !steamGiftState.loading && !steamGiftState.error ? (
            <div className="fc-steam-gifts__results">
              {steamGiftState.indexEmpty ? (
                <p>{steamGiftState.message || "فهرس Steam Gifts فارغ. حدّث الفهرس أو اكتب AppID يدويًا."}</p>
              ) : steamGiftState.items.length ? steamGiftState.items.map((item) => (
                <div key={item.appid}>
                  <span>{item.name}</span>
                  <small dir="ltr">AppID {item.appid}</small>
                  <button type="button" onClick={() => syncSteamGift(item)} disabled={Boolean(syncState.action) || syncCooldownSeconds > 0}>
                    {syncCooldownSeconds > 0 ? `انتظر ${syncCooldownSeconds} ثانية` : "مزامنة هذه اللعبة"}
                  </button>
                </div>
              )) : (
                <p>لا توجد نتائج في الفهرس. جرّب اسمًا آخر أو اكتب AppID مباشرةً.</p>
              )}
            </div>
          ) : null}
        </section>}
        {syncCooldownSeconds > 0 ? <p className="fc-sync-cooldown"><Clock3 /> يمكنك البحث الآن، وستتاح المزامنة مجددًا بعد {syncCooldownSeconds} ثانية.</p> : null}
        {syncState.message ? <p className="fc-sync-message is-success"><Check />{syncState.message}</p> : null}
        {syncState.error ? <p className="fc-sync-message is-error"><AlertCircle />{syncState.error}</p> : null}

        {!steamGiftsSelected && <>
        <form className="fc-catalog-search" onSubmit={searchCatalogs}>
          <label className="fc-search-box">
            <Search />
            <input
              value={query}
              onChange={(event) => resetCatalogSearch(event.target.value)}
              placeholder="مثال: PUBG Mobile أو Netflix"
              autoComplete="off"
            />
            {query && <button type="button" onClick={() => resetCatalogSearch("")} aria-label="مسح البحث"><X /></button>}
          </label>
          <button
            type="submit"
            className="fc-catalog-search__submit"
            disabled={searchState.loading || query.trim().length < 2}
          >
            {searchState.loading ? <Loader2 className="animate-spin" /> : <Search />}
            <span><strong>{searchState.loading ? "جارٍ البحث" : "بحث"}</strong><small>كل العائلات</small></span>
          </button>
        </form>

        <div className="fc-search-results" aria-live="polite">
          {searchState.warning ? <p className="fc-search-warning"><AlertCircle />{searchState.warning}</p> : null}
          {searchState.error ? (
            <InlineState icon={AlertCircle} tone="error" title="تعذر إكمال البحث" description={searchState.error} />
          ) : searchState.loading ? (
            <CatalogRowsSkeleton />
          ) : searchState.searched && !searchState.results.length ? (
            <InlineState icon={Search} title="لا توجد Catalogs مطابقة" description="اختر العائلة المناسبة من قسم المزامنة أعلاه، ثم حدّثها وأعد البحث." />
          ) : searchState.results.length ? (
            searchState.results.map((catalog) => {
              const retrieved = retrievedKeys.has(catalog.key);
              return (
                <CatalogRow key={catalog.key} catalog={catalog} retrieved={retrieved}>
                  {retrieved ? (
                    <button type="button" className="fc-button fc-button--soft" onClick={() => setActiveCatalog(retrievedCatalogs.find((item) => item.key === catalog.key) || catalog)}>
                      <FolderOpen /> فتح الكتالوج
                    </button>
                  ) : (
                    <button type="button" className="fc-button fc-button--primary" onClick={() => retrieveCatalog(catalog)} disabled={Boolean(retrievingKey)}>
                      {retrievingKey === catalog.key ? <Loader2 className="animate-spin" /> : <PackageCheck />} استرداد
                    </button>
                  )}
                </CatalogRow>
              );
            })
          ) : (
            <div className="fc-search-hint"><Search /><span>اكتب حرفين على الأقل، ثم اضغط «بحث» للبحث في كل العائلات والـCatalogs.</span></div>
          )}
        </div>
        </>}
      </section>

      <section className="fc-retrieved">
        <div className="fc-section-heading">
          <div><span>مساحة العمل</span><h2>Catalogs المستردة</h2></div>
          <small>{retrievedCatalogs.length.toLocaleString("ar-EG-u-nu-latn")} Catalog</small>
        </div>

        <div className="fc-retrieved-list">
          {retrievedCatalogs.length ? retrievedCatalogs.map((catalog) => (
            <CatalogRow key={catalog.key} catalog={catalog} retrieved>
              <button type="button" className="fc-button fc-button--soft" onClick={() => setActiveCatalog(catalog)}><FolderOpen /> فتح الكتالوج</button>
              <button type="button" className="fc-remove" onClick={() => removeCatalog(catalog)} aria-label={`إزالة استرداد ${catalog.name}`}><Trash2 /> إزالة الاسترداد</button>
            </CatalogRow>
          )) : (
            <InlineState icon={Layers3} title="لا توجد Catalogs مستردة" description="استخدم البحث أعلاه ثم استرد الكتالوج الذي تريد العمل عليه فقط." />
          )}
        </div>
      </section>

      {activeCatalog && <CatalogOffers catalog={activeCatalog} token={token} onClose={() => setActiveCatalog(null)} />}
    </main>
  );
}

async function getAllCachedFamilySearchResults(token, familyKey, search) {
  const firstPage = await getFazerCardsProviderProducts(token, {
    familyKey,
    familyKeyExplicit: true,
    limit: CATALOG_SEARCH_PAGE_SIZE,
    page: 1,
    search,
  });
  const products = [...firstPage.products];
  const pages = Math.max(1, Number(firstPage.pagination?.pages) || 1);

  for (let page = 2; page <= pages; page += 1) {
    const result = await getFazerCardsProviderProducts(token, {
      familyKey,
      familyKeyExplicit: true,
      limit: CATALOG_SEARCH_PAGE_SIZE,
      page,
      search,
    });
    products.push(...result.products);
  }

  return { ...firstPage, products };
}

function CatalogOffers({ catalog, onClose, token }) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [selectedOfferId, setSelectedOfferId] = useState("");
  const [state, setState] = useState({ error: "", loading: true, offers: [], pagination: null });
  const [importState, setImportState] = useState(EMPTY_IMPORT_STATE);
  const [importOffer, setImportOffer] = useState(null);
  const requestRef = useRef(0);

  useEffect(() => {
    const requestId = requestRef.current + 1;
    requestRef.current = requestId;
    const timer = window.setTimeout(async () => {
      setState((current) => ({ ...current, error: "", loading: true }));
      try {
        const result = await getFazerCardsProviderProducts(token, {
          category: catalog.category,
          familyKey: catalog.familyKey,
          limit: OFFERS_PAGE_SIZE,
          page,
          search: query.trim() || undefined,
        });
        if (requestRef.current !== requestId) return;
        setState({ error: "", loading: false, offers: result.products, pagination: result.pagination });
      } catch (error) {
        if (requestRef.current !== requestId) return;
        setState({ error: error.userMessage || "تعذر تحميل عروض الكتالوج.", loading: false, offers: [], pagination: null });
      }
    }, query ? SEARCH_DELAY : 0);
    return () => window.clearTimeout(timer);
  }, [catalog, page, query, token]);

  const selectedOffer = state.offers.find((offer) => offer.id === selectedOfferId);
  const selectedFamilyKey = String(selectedOffer?.familyKey || catalog.familyKey || "").toUpperCase();
  const autoProviderCapable = AUTO_PROVIDER_FAMILIES.has(selectedFamilyKey);
  const launchDisabled = !importState.product?.id || Boolean(importState.action) || importState.loading;

  const selectOffer = (offerId) => {
    const offer = state.offers.find((item) => item.id === offerId);
    setSelectedOfferId(offerId);
    setImportState(offer?.importedProduct ? {
      ...EMPTY_IMPORT_STATE,
      manualFieldWarning: offer.importedProduct.manualFieldWarning || "",
      product: offer.importedProduct,
    } : EMPTY_IMPORT_STATE);
  };

  const handleOfferImported = async (result) => {
    if (!result.product?.id || !selectedOffer) return;
    const importedOfferId = selectedOffer.id;
    setImportState({ ...EMPTY_IMPORT_STATE, product: result.product });
    setState((current) => ({
      ...current,
      offers: current.offers.map((offer) => offer.id === importedOfferId
        ? { ...offer, imported: true, importedProduct: result.product }
        : offer),
    }));

    try {
      const refreshed = await getFazerCardsProviderProducts(token, {
        category: catalog.category,
        familyKey: catalog.familyKey,
        limit: OFFERS_PAGE_SIZE,
        page,
        search: query.trim() || undefined,
      });
      const refreshedOffer = refreshed.products.find((offer) => offer.id === importedOfferId);
      if (!refreshedOffer) return;
      setState({ error: "", loading: false, offers: refreshed.products, pagination: refreshed.pagination });
      setImportState((current) => ({
        ...current,
        manualFieldWarning: refreshedOffer.importedProduct?.manualFieldWarning || "",
        product: refreshedOffer.importedProduct || current.product,
      }));
    } catch {
      // The import already succeeded. Keep the confirmed result shown by the legacy flow.
    }
  };

  const launchImportedProduct = async (providerExecutionMode) => {
    const productId = importState.product?.id;
    const isAuto = providerExecutionMode === "AUTO_PROVIDER";
    const familyKey = String(selectedOffer?.familyKey || catalog.familyKey || "").toUpperCase();
    if (!productId || importState.action) return;

    if (isAuto && !AUTO_PROVIDER_FAMILIES.has(familyKey)) {
      setImportState((current) => ({
        ...current,
        launchMessage: "هذه العائلة لا تدعم التنفيذ التلقائي حاليًا.",
        launchTone: "warning",
      }));
      return;
    }

    const confirmation = isAuto
      ? "نشر المنتج وتفعيل التنفيذ التلقائي من FazerCards؟ سيظل التنفيذ الحقيقي مرتبطًا بمفاتيح أمان المورد."
      : "نشر المنتج للعملاء مع تنفيذ الطلب يدويًا؟";
    if (!window.confirm(confirmation)) return;

    setImportState((current) => ({ ...current, action: isAuto ? "auto" : "manual", error: "", launchMessage: "", launchTone: "" }));
    try {
      const result = await launchFazerCardsProduct(token, productId, {
        customerPurchaseEnabled: true,
        isActive: true,
        providerExecutionEnabled: isAuto,
        providerExecutionMode,
        status: "available",
        visibleInStore: true,
      });
      const launchStatus = result.result?.launchStatus
        || result.result?.result?.customerVisibilityStatus
        || result.result?.customerVisibilityStatus
        || {};
      const visibleToCustomer = launchStatus.visibleToCustomer === true;
      const reasons = Array.isArray(launchStatus.reasons) ? launchStatus.reasons : [];

      setImportState((current) => ({
        ...current,
        action: "",
        launchMessage: visibleToCustomer
          ? isAuto ? "تم نشر المنتج وتفعيل التنفيذ التلقائي بنجاح." : "تم نشر المنتج للعملاء بنجاح."
          : `تم حفظ إعدادات التشغيل، لكن المنتج غير ظاهر للعملاء: ${reasons.join("، ") || "راجع جاهزية المنتج."}`,
        launchTone: visibleToCustomer ? "success" : "warning",
        product: {
          ...current.product,
          isActive: true,
          providerExecutionEnabled: isAuto,
          providerExecutionMode,
          status: "available",
          visibleInStore: visibleToCustomer,
        },
      }));
    } catch (error) {
      setImportState((current) => ({
        ...current,
        action: "",
        launchMessage: error.userMessage || (isAuto ? "تعذر تفعيل التنفيذ التلقائي." : "تعذر نشر المنتج."),
        launchTone: "error",
      }));
    }
  };

  return (
    <section className="fc-offers" aria-labelledby="fc-offers-title">
      <header className="fc-offers__header">
        <div><span>{catalog.familyKey || "FAZERCARDS"}</span><h2 id="fc-offers-title">{catalog.name}</h2><p>{state.pagination?.total ?? catalog.offerCount} Offers</p></div>
        <button type="button" className="fc-icon-button" onClick={onClose} aria-label="إغلاق الكتالوج"><X /></button>
      </header>

      <label className="fc-search-box fc-search-box--compact">
        {state.loading ? <Loader2 className="animate-spin" /> : <Search />}
        <input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="بحث داخل العروض" />
      </label>

      <div className="fc-offers-layout">
        <div className="fc-offer-list">
          {state.error ? (
            <InlineState icon={AlertCircle} tone="error" title="تعذر تحميل Offers" description={state.error} />
          ) : state.loading ? (
            <CatalogRowsSkeleton rows={4} />
          ) : state.offers.length ? state.offers.map((offer) => {
            const selected = selectedOfferId === offer.id;
            return (
              <button type="button" key={offer.id} className={`fc-offer ${selected ? "is-selected" : ""}`} onClick={() => selectOffer(offer.id)}>
                <span className="fc-radio">{selected ? <Check /> : <CircleDot />}</span>
                <span className="fc-offer__copy">
                  <strong>{offer.offerName || offer.name}</strong>
                  <small>{[offer.region, offer.platform].filter(Boolean).join(" · ") || offer.externalProductId}</small>
                </span>
                <span className="fc-offer__aside">
                  <b className="fc-offer__price">{offer.priceLabel}</b>
                  {offer.imported && <small><Check /> مضاف</small>}
                </span>
              </button>
            );
          }) : (
            <InlineState icon={Search} title="لا توجد عروض مطابقة" description="جرّب عبارة بحث أقصر داخل هذا الكتالوج." />
          )}
        </div>

        <aside className="fc-import-panel">
          {selectedOffer ? (
            <>
              <span className="fc-import-panel__eyebrow">العرض المختار</span>
              <h3>{selectedOffer.offerName || selectedOffer.name}</h3>
              <p dir="ltr">{selectedOffer.externalProductId || selectedOffer.offerId}</p>

              <div className="fc-import-summary">
                <SummaryDatum label="سعر المورد" value={selectedOffer.priceLabel || "—"} />
                <SummaryDatum label="الحد الأدنى" value={selectedOffer.minQty ?? "—"} />
                <SummaryDatum label="الحد الأقصى" value={selectedOffer.maxQty ?? "—"} />
              </div>

              <div className="fc-sync-options">
                <span><Check /> مزامنة الاسم</span>
                <span><Check /> مزامنة السعر</span>
                <span><Check /> مزامنة الحدود</span>
              </div>

              {importState.error && <div className="fc-import-message is-error"><AlertCircle /> {importState.error}</div>}
              {importState.product && (
                <div className={`fc-import-message ${importState.warning ? "is-warning" : "is-success"}`}>
                  {importState.warning ? <AlertCircle /> : <Check />}
                  <div>
                    <strong>{importState.warning ? "تمت الإضافة مع ملاحظة" : "تمت إضافة المنتج ومزامنته"}</strong>
                    <p>{importState.warning || importState.product.name}</p>
                  </div>
                </div>
              )}

              <button type="button" className="fc-import-action" onClick={() => setImportOffer(selectedOffer)}>
                {selectedOffer.imported || importState.product ? <RefreshCw /> : <Plus />}
                {selectedOffer.imported || importState.product ? "تحديث بيانات الاستيراد" : "إضافة المنتج ومزامنته"}
              </button>

              <div className="fc-launch-block">
                <div className="fc-launch-block__heading">
                  <div><span>بعد الإضافة</span><strong>تشغيل ونشر المنتج</strong></div>
                  <small>{importState.product?.id ? "تم الاستيراد" : "أضف المنتج أولًا"}</small>
                </div>
                <div className="fc-launch-actions">
                  <button
                    type="button"
                    className="fc-launch-action is-manual"
                    onClick={() => launchImportedProduct("MANUAL_FULFILLMENT")}
                    disabled={launchDisabled || Boolean(importState.manualFieldWarning)}
                  >
                    {importState.action === "manual" ? <Loader2 className="animate-spin" /> : <Rocket />}
                    <span><strong>نشر المنتج</strong><small>إظهار للعملاء · تنفيذ يدوي</small></span>
                  </button>
                  <button
                    type="button"
                    className="fc-launch-action is-auto"
                    onClick={() => launchImportedProduct("AUTO_PROVIDER")}
                    disabled={launchDisabled || !autoProviderCapable}
                  >
                    {importState.action === "auto" ? <Loader2 className="animate-spin" /> : <Server />}
                    <span><strong>تفعيل التنفيذ التلقائي</strong><small>نشر وتشغيل عبر FazerCards</small></span>
                  </button>
                </div>
                {!autoProviderCapable && <small className="fc-launch-hint">التنفيذ التلقائي غير مدعوم لهذه العائلة.</small>}
                {importState.manualFieldWarning && <small className="fc-launch-hint is-warning">{importState.manualFieldWarning}</small>}
              </div>

              {importState.launchMessage && (
                <div className={`fc-import-message is-${importState.launchTone || "warning"}`}>
                  {importState.launchTone === "success" ? <Check /> : <AlertCircle />}
                  <div><strong>{importState.launchTone === "success" ? "اكتمل التشغيل" : "حالة التشغيل"}</strong><p>{importState.launchMessage}</p></div>
                </div>
              )}

              {importState.product && (
                <Link className="fc-manage-product" to="/admin/tools/products">إدارة المنتجات <ArrowUpLeft /></Link>
              )}
              <small className="fc-import-note">لن تتم إضافة أي Offer آخر من هذا Catalog.</small>
            </>
          ) : (
            <div className="fc-import-empty"><CircleDot /><strong>اختر Offer واحدًا</strong><p>ستظهر هنا بيانات السعر والحدود وخيارات المزامنة قبل الإضافة.</p></div>
          )}
        </aside>
      </div>

      {state.pagination?.pages > 1 && (
        <div className="fc-pagination">
          <button type="button" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page <= 1 || state.loading}><ChevronRight /></button>
          <span>{page} / {state.pagination.pages}</span>
          <button type="button" onClick={() => setPage((value) => Math.min(state.pagination.pages, value + 1))} disabled={page >= state.pagination.pages || state.loading}><ChevronLeft /></button>
        </div>
      )}

      <FazerCardsImportModal
        onClose={() => setImportOffer(null)}
        onImported={handleOfferImported}
        product={importOffer}
        token={token}
      />

    </section>
  );
}

function SummaryDatum({ label, value }) {
  return <div><span>{label}</span><strong>{value}</strong></div>;
}

function CatalogRow({ catalog, children, retrieved = false }) {
  return (
    <article className="fc-catalog-row">
      <span className="fc-catalog-icon">{retrieved ? <PackageCheck /> : <Server />}</span>
      <div className="fc-catalog-copy">
        <strong>{catalog.name}</strong>
        <span>{retrieved && <b><Check /> مسترد</b>}{catalog.offerCount.toLocaleString("ar-EG-u-nu-latn")} Offers{catalog.familyKey && <em>{catalog.familyKey}</em>}</span>
      </div>
      <div className="fc-catalog-actions">{children}</div>
    </article>
  );
}

function FlowStep({ active = false, icon: Icon, label }) {
  return <li className={active ? "is-active" : ""}><span><Icon /></span><b>{label}</b></li>;
}

function InlineState({ description, icon: Icon, title, tone = "neutral" }) {
  return <div className="fc-inline-state" data-tone={tone}><Icon /><div><strong>{title}</strong><p>{description}</p></div></div>;
}

function CatalogRowsSkeleton({ rows = 3 }) {
  return <div className="fc-rows-skeleton" aria-busy="true">{Array.from({ length: rows }).map((_, index) => <span key={index} />)}</div>;
}

function ProviderPageSkeleton() {
  return <div className="fc-page-skeleton" aria-busy="true"><span /><span /><span /></div>;
}

function getLatestSyncTimestamp(status = {}) {
  const candidates = [status.lastSyncedAt, status.syncedAt, status.updatedAt, status.lastSyncAt];
  Object.values(status.families || status.byFamily || {}).forEach((family) => {
    if (!family || typeof family !== "object") return;
    candidates.push(family.lastSyncedAt, family.syncedAt, family.updatedAt, family.lastSyncAt);
  });

  return candidates
    .filter(Boolean)
    .map((value) => ({ timestamp: String(value), time: new Date(value).getTime() }))
    .filter((item) => Number.isFinite(item.time))
    .sort((a, b) => b.time - a.time)[0]?.timestamp || "";
}

function formatSyncDate(value) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "غير معروف";
  return new Intl.DateTimeFormat("ar-EG-u-nu-latn", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function startSyncCooldown(setUntil, setSeconds, seconds) {
  const safeSeconds = Math.max(1, Math.ceil(Number(seconds) || SYNC_RATE_LIMIT_COOLDOWN_SECONDS));
  setSeconds(safeSeconds);
  setUntil(Date.now() + (safeSeconds * 1000));
}

function getSyncRetrySeconds(error = {}) {
  const candidates = [
    error.retryAfter,
    error.payload?.retryAfter,
    error.payload?.retryAfterSeconds,
    error.payload?.data?.retryAfter,
    error.payload?.data?.retryAfterSeconds,
    error.details?.retryAfter,
    error.details?.retryAfterSeconds,
  ];
  const returnedValue = candidates
    .map((value) => Number.parseInt(String(value ?? ""), 10))
    .find((value) => Number.isFinite(value) && value > 0);
  return returnedValue || SYNC_RATE_LIMIT_COOLDOWN_SECONDS;
}
