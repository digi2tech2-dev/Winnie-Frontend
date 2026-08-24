import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, ArrowLeft, Boxes, CloudCog, Plus, RefreshCw, Search, Server, Sparkles } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import {
  addFazerCardsManualOrderNote,
  bulkUpdateFazerCardsLaunch,
  checkAdminProviderOrder,
  completeFazerCardsManualOrder,
  createAdminProvider,
  deleteAdminProvider,
  dryRunFazerCardsProduct,
  failFazerCardsManualOrder,
  getFazerCardsCatalogFamilies,
  getFazerCardsCatalogSummary,
  getFazerCardsContractsSummary,
  getFazerCardsLaunchHealth,
  getFazerCardsManualOrders,
  getFazerCardsProductReadiness,
  getFazerCardsProviderProducts,
  getFazerCardsWebhookDeliveries,
  getAdminProviderBalance,
  getAdminProviderProducts,
  getAdminProviders,
  launchFazerCardsProduct,
  publishEligibleFazerCardsProducts,
  refreshFazerCardsSteamGiftIndex,
  searchFazerCardsSteamGiftIndex,
  syncFazerCardsCatalogAll,
  syncFazerCardsCatalogFamily,
  syncAdminProviderProducts,
  testAdminProvider,
  toggleAdminProvider,
  updateAdminProvider,
} from "../../api/adminProviders";
import ConfirmDialog from "../../components/admin/products/ConfirmDialog";
import FazerCardsImportModal from "../../components/admin/suppliers/FazerCardsImportModal";
import FazerCardsSpecialProviderPage from "../../components/admin/suppliers/FazerCardsSpecialProviderPage";
import SupplierCard from "../../components/admin/suppliers/SupplierCard";
import SupplierFormModal from "../../components/admin/suppliers/SupplierFormModal";
import SupplierProductsModal from "../../components/admin/suppliers/SupplierProductsModal";
import SupplierSearchProducts from "../../components/admin/suppliers/SupplierSearchProducts";
import SupplierToolsModal from "../../components/admin/suppliers/SupplierToolsModal";
import XenaSupplierModal from "../../components/admin/suppliers/XenaSupplierModal";
import EmptyState from "../../components/EmptyState";
import { SkeletonBlock } from "../../components/Skeletons";
import { useToast } from "../../components/ToastProvider";
import { useAuth } from "../../context/AuthContext";

const productPageSize = 30;
const AUTO_PROVIDER_FAMILIES = new Set(["TOPUPS", "GIFTCARDS", "GAME_KEYS", "TELEGRAM", "STEAM_TOPUP", "STEAM_GIFTS", "MANUAL_SERVICES"]);

const defaultFazerCardsFilters = {
  blockReason: "",
  blocked: "",
  category: "",
  familyKey: "TOPUPS",
  familyKeyExplicit: false,
  fulfillmentMode: "",
  imported: "",
  supported: "",
};

const emptyProductsState = {
  error: "",
  filters: defaultFazerCardsFilters,
  loading: false,
  page: 1,
  pagination: { page: 1, limit: productPageSize, total: 0, pages: 1 },
  products: [],
  search: "",
  supplier: null,
};

const emptyFazerCatalogState = {
  contractsSummary: null,
  error: "",
  families: [],
  loading: false,
  summary: null,
  syncResult: null,
};

const emptyFazerLaunchOpsState = {
  bulkResult: null,
  error: "",
  health: null,
  loading: false,
  manualFilters: { familyKey: "" },
  manualOrders: [],
  webhookDeliveries: [],
};

function getProviderCode(provider) {
  return String(provider?.providerCode || provider?.code || provider?.provider?.providerCode || "").toUpperCase() || null;
}

function isFazerCardsSupplier(supplier) {
  const providerCode = getProviderCode(supplier);
  const slug = String(supplier?.slug || supplier?.code || "").toLowerCase();
  const name = String(supplier?.name || supplier?.displayName || "").toLowerCase();
  return providerCode === "FAZER_CARDS" || slug === "fazer-cards" || name === "fazercards" || name === "fazer cards";
}

function isFazerCardsRateLimitError(error) {
  return Number(error?.status) === 429 && String(error?.code || "").toUpperCase().startsWith("FAZERCARDS_");
}

function getFazerCardsRetrySeconds(error) {
  const candidates = [
    error?.retryAfter,
    error?.payload?.retryAfterSeconds,
    error?.payload?.retryAfter,
    error?.payload?.data?.retryAfterSeconds,
  ];
  return candidates
    .map((value) => Number.parseInt(String(value ?? ""), 10))
    .find((value) => Number.isFinite(value) && value > 0) || 60;
}

export default function SuppliersManagementPage() {
  const { token } = useAuth();
  const { showToast } = useToast();
  const location = useLocation();
  const specialProviderPage = location.pathname.endsWith("/special-provider");
  const [suppliers, setSuppliers] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [form, setForm] = useState(undefined);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [actionKey, setActionKey] = useState("");
  const [confirm, setConfirm] = useState({ kind: "", supplier: null });
  const [connectionResults, setConnectionResults] = useState({});
  const [providerProductsTotal, setProviderProductsTotal] = useState(0);
  const [productsState, setProductsState] = useState(emptyProductsState);
  const [fazerCatalog, setFazerCatalog] = useState(emptyFazerCatalogState);
  const [fazerLaunchOps, setFazerLaunchOps] = useState(emptyFazerLaunchOpsState);
  const [fazerImportProduct, setFazerImportProduct] = useState(null);
  const [toolsFor, setToolsFor] = useState(null);
  const [xenaFor, setXenaFor] = useState(null);
  const providerProductsRequestRef = useRef(0);
  const [globalSearch, setGlobalSearch] = useState({
    error: "",
    loading: false,
    pagination: null,
    products: [],
    searched: false,
  });

  const recordFazerCardsRateLimit = (error) => {
    if (!isFazerCardsRateLimitError(error)) return false;
    const retryAfterSeconds = getFazerCardsRetrySeconds(error);
    setFazerCatalog((current) => ({
      ...current,
      error: `تم الوصول إلى حد طلبات FazerCards. انتظر ${retryAfterSeconds} ثانية ثم حاول مرة أخرى.`,
    }));
    return true;
  };

  const loadSuppliers = useCallback(async ({ silent = false } = {}) => {
    if (!token) {
      setInitialLoading(false);
      setLoadError("يلزم تسجيل الدخول بحساب مدير.");
      return;
    }

    if (!silent) setInitialLoading(true);
    setLoadError("");

    try {
      const result = await getAdminProviders(token, { includeInactive: true });
      setSuppliers(result.providers);

      try {
        const productResult = await getAdminProviderProducts(token, "", { page: 1, limit: 1 });
        setProviderProductsTotal(productResult.pagination.total);
      } catch {
        setProviderProductsTotal(0);
      }
    } catch (error) {
      setSuppliers([]);
      setLoadError(error.userMessage || "تعذر تحميل الموردين.");
    } finally {
      setInitialLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadSuppliers();
  }, [loadSuppliers]);

  const stats = useMemo(() => [
    { label: "الموردون", value: suppliers.length, icon: Server },
    { label: "النشطون", value: suppliers.filter((supplier) => supplier.active).length, icon: CloudCog },
    { label: "غير النشطين", value: suppliers.filter((supplier) => !supplier.active).length, icon: RefreshCw },
    { label: "منتجات الموردين", value: providerProductsTotal, icon: Boxes },
  ], [providerProductsTotal, suppliers]);

  const fazerCardsSupplier = useMemo(
    () => suppliers.find((supplier) => isFazerCardsSupplier(supplier)) || null,
    [suppliers],
  );

  const saveSupplier = async (values) => {
    if (!token || saving) return;
    const editing = Boolean(form?.id);

    setSaving(true);
    setFormError("");
    try {
      const result = editing
        ? await updateAdminProvider(token, form.id, values)
        : await createAdminProvider(token, values);

      setForm(undefined);
      showToast({
        type: "success",
        title: editing ? "تم تحديث المورد" : "تمت إضافة المورد",
        message: result.message || result.provider.name,
      });
      await loadSuppliers({ silent: true });
    } catch (error) {
      setFormError(error.userMessage || "تعذر حفظ المورد.");
      showToast({
        type: "error",
        title: "فشل حفظ المورد",
        message: error.userMessage || "تعذر حفظ المورد.",
      });
    } finally {
      setSaving(false);
    }
  };

  const testConnection = async (supplier) => {
    if (!token || actionKey) return;
    setActionKey(`${supplier.id}:test`);
    try {
      const result = await testAdminProvider(token, supplier.id);
      setConnectionResults((current) => ({ ...current, [supplier.id]: result.result }));
      showToast({
        type: result.result.connected ? "success" : "error",
        title: result.result.connected ? "نجح الاتصال" : "فشل الاتصال",
        message: result.result.message,
      });
    } catch (error) {
      if (isFazerCardsSupplier(supplier) && recordFazerCardsRateLimit(error)) return;
      showToast({ type: "error", title: "فشل اختبار الاتصال", message: error.userMessage || "فشل اختبار المورد من الخادم." });
    } finally {
      setActionKey("");
    }
  };

  const requestSync = (supplier) => setConfirm({ kind: "sync", supplier });
  const requestToggle = (supplier) => setConfirm({ kind: "toggle", supplier });
  const requestArchive = (supplier) => setConfirm({ kind: "archive", supplier });

  const loadFazerCatalogMeta = useCallback(async ({ silent = false } = {}) => {
    if (!token) return;
    if (!silent) setFazerCatalog((current) => ({ ...current, error: "", loading: true }));

    const [familiesResult, summaryResult, contractsResult] = await Promise.allSettled([
      getFazerCardsCatalogFamilies(token),
      getFazerCardsCatalogSummary(token),
      getFazerCardsContractsSummary(token),
    ]);

    const nextError = [familiesResult, summaryResult, contractsResult]
      .filter((result) => result.status === "rejected")
      .map((result) => result.reason?.userMessage || result.reason?.message || "تعذر تحميل بيانات كتالوج FazerCards.")
      .join(" ");

    setFazerCatalog((current) => ({
      ...current,
      contractsSummary: contractsResult.status === "fulfilled" ? contractsResult.value : current.contractsSummary,
      error: nextError,
      families: familiesResult.status === "fulfilled" ? familiesResult.value.families : current.families,
      loading: false,
      summary: summaryResult.status === "fulfilled" ? summaryResult.value : current.summary,
    }));
  }, [token]);

  const loadFazerProviderHealth = useCallback(async ({ silent = false } = {}) => {
    if (!token) return;
    if (!silent) setFazerLaunchOps((current) => ({ ...current, error: "", loading: true }));

    try {
      const result = await getFazerCardsLaunchHealth(token);
      setFazerLaunchOps((current) => ({ ...current, error: "", health: result.health, loading: false }));
    } catch (error) {
      setFazerLaunchOps((current) => ({
        ...current,
        error: error.userMessage || "تعذر التحقق من اتصال FazerCards.",
        loading: false,
      }));
    }
  }, [token]);

  useEffect(() => {
    if (!specialProviderPage || !fazerCardsSupplier) return;
    void loadFazerProviderHealth();
  }, [fazerCardsSupplier, loadFazerProviderHealth, specialProviderPage]);

  const runConfirmedAction = async () => {
    const { kind, supplier } = confirm;
    if (!token || !supplier || actionKey) return;

    setActionKey(`${supplier.id}:${kind}`);
    try {
      if (kind === "sync") {
        const result = await syncAdminProviderProducts(token, supplier.id);
        showToast({
          type: result.result.errors.length ? "warning" : "success",
          title: result.message || "اكتملت مزامنة المورد",
        message: `تم جلب ${result.result.totalFetched} منتج، وتحديث أو إضافة ${result.result.updated + result.result.upserted} منتج.`,
        });
        if (productsState.supplier?.id === supplier.id) {
          await loadProviderProducts(supplier, { filters: productsState.filters, page: productsState.page, search: productsState.search });
        }
      } else if (kind === "toggle") {
        const result = await toggleAdminProvider(token, supplier.id);
        showToast({
          type: result.provider.active ? "success" : "warning",
          title: result.provider.active ? "تم تفعيل المورد" : "تم تعطيل المورد",
          message: result.message || result.provider.name,
        });
      } else if (kind === "archive") {
        const result = await deleteAdminProvider(token, supplier.id);
        showToast({ type: "warning", title: "تمت أرشفة المورد", message: result.message || result.provider.name });
      }

      setConfirm({ kind: "", supplier: null });
      await loadSuppliers({ silent: true });
    } catch (error) {
      if (isFazerCardsSupplier(supplier) && recordFazerCardsRateLimit(error)) {
        setConfirm({ kind: "", supplier: null });
        return;
      }
      showToast({
        type: "error",
        title: "فشل إجراء المورد",
        message: error.userMessage || "فشل تنفيذ الإجراء على المورد.",
      });
    } finally {
      setActionKey("");
    }
  };

  const loadProviderProducts = async (supplier, { page = 1, search = "", filters } = {}) => {
    if (!token || !supplier) return;
    const fazerCards = isFazerCardsSupplier(supplier);
    const effectiveFilters = fazerCards
      ? { ...defaultFazerCardsFilters, ...(filters || productsState.filters || {}) }
      : {};
    const requestId = providerProductsRequestRef.current + 1;
    providerProductsRequestRef.current = requestId;

    setProductsState((current) => ({
      ...current,
      error: "",
      filters: effectiveFilters,
      loading: true,
      page,
      products: fazerCards ? [] : current.products,
      search,
      supplier,
    }));

    try {
      if (fazerCards) void loadFazerCatalogMeta({ silent: true });

      const result = fazerCards
        ? await getFazerCardsProviderProducts(token, {
            ...effectiveFilters,
            limit: productPageSize,
            page,
            search,
          })
        : await getAdminProviderProducts(token, supplier.id, {
            includeInactive: true,
            limit: productPageSize,
            page,
            search,
          });
      if (providerProductsRequestRef.current !== requestId) return;
      setProductsState({
        error: "",
        filters: effectiveFilters,
        loading: false,
        page: result.pagination.page,
        pagination: result.pagination,
        products: result.products,
        search,
        supplier,
      });
    } catch (error) {
      if (providerProductsRequestRef.current !== requestId) return;
      setProductsState((current) => ({
        ...current,
        error: error.userMessage || "تعذر تحميل منتجات المورد.",
        loading: false,
        products: [],
      }));
    }
  };

  const searchAllProviderProducts = async (query) => {
    if (!token) return;

    setGlobalSearch((current) => ({ ...current, error: "", loading: true, searched: true }));
    try {
      const result = await getAdminProviderProducts(token, "", {
        limit: productPageSize,
        page: 1,
        search: query,
      });
      setGlobalSearch({
        error: "",
        loading: false,
        pagination: result.pagination,
        products: result.products,
        searched: true,
      });
    } catch (error) {
      setGlobalSearch({
        error: error.userMessage || "تعذر البحث في منتجات الموردين.",
        loading: false,
        pagination: null,
        products: [],
        searched: true,
      });
    }
  };

  const updateFazerCardsFilters = (filters) => {
    const supplier = productsState.supplier;
    if (!token || !supplier || !isFazerCardsSupplier(supplier)) return;
    const nextFilters = { ...defaultFazerCardsFilters, ...filters };
    setProductsState((current) => ({
      ...current,
      error: "",
      filters: nextFilters,
      loading: true,
      page: 1,
      pagination: { ...current.pagination, page: 1 },
      products: [],
    }));
    void loadProviderProducts(supplier, {
      filters: nextFilters,
      page: 1,
      search: productsState.search,
    });
  };

  const closeProviderProductsModal = () => {
    providerProductsRequestRef.current += 1;
    setProductsState({ ...emptyProductsState, filters: { ...defaultFazerCardsFilters } });
  };

  const runFazerCardsSyncFamily = async (familyKey = "TOPUPS", options = {}) => {
    const supplier = productsState.supplier;
    const normalizedFamily = String(familyKey || productsState.filters.familyKey || "TOPUPS").toUpperCase();
    if (!token || !supplier || actionKey) return;

    const steamGiftAppId = String(options?.appid ?? "").trim();
    if (normalizedFamily === "STEAM_GIFTS") {
      const numericAppId = Number(steamGiftAppId);
      if (!steamGiftAppId || !Number.isFinite(numericAppId) || numericAppId <= 0) {
        showToast({
          type: "warning",
          title: "AppID مطلوب",
          message: "اكتب AppID أولاً لمزامنة Steam Gifts",
        });
        return;
      }
    }

    setActionKey(`${supplier.id}:sync-family:${normalizedFamily}`);
    try {
      const result = await syncFazerCardsCatalogFamily(token, {
        appid: normalizedFamily === "STEAM_GIFTS" ? Number(steamGiftAppId) : undefined,
        family: normalizedFamily,
        limit: 20,
      });
      setFazerCatalog((current) => ({
        ...current,
        syncResult: {
          results: { [normalizedFamily]: result.result },
          totals: {
            providerProductsCreated: result.result.providerProductsCreated || 0,
            providerProductsUpdated: result.result.providerProductsUpdated || 0,
          },
        },
      }));
      showToast({
        type: "success",
        title: `تمت مزامنة ${normalizedFamily}`,
        message: `تمت إضافة ${result.result.providerProductsCreated || 0} وتحديث ${result.result.providerProductsUpdated || 0} منتج.`,
      });
      await loadFazerCatalogMeta({ silent: true });
      await loadProviderProducts(supplier, {
        filters: { ...productsState.filters, familyKey: normalizedFamily },
        page: 1,
        search: productsState.search,
      });
    } catch (error) {
      if (recordFazerCardsRateLimit(error)) return;
      showToast({
        type: "error",
        title: "فشلت مزامنة فئة FazerCards",
        message: error.userMessage || error.message || "تعذر مزامنة فئة FazerCards.",
      });
    } finally {
      setActionKey("");
    }
  };

  const searchSteamGiftIndex = async (query = "") => {
    if (!token) return { items: [], indexEmpty: true };
    const result = await searchFazerCardsSteamGiftIndex(token, { q: query, limit: 20 });
    return result.result || {};
  };

  const refreshSteamGiftIndex = async () => {
    const supplier = productsState.supplier;
    if (!token || !supplier || actionKey) return null;
    if (!window.confirm("تحديث فهرس Steam Gifts فقط؟ لن يتم إنشاء منتجات ولن يتم تنفيذ أي طلب.")) return null;

    setActionKey(`${supplier.id}:steam-gift-index-refresh`);
    try {
      const result = await refreshFazerCardsSteamGiftIndex(token);
      const data = result.result || {};
      showToast({
        type: data.warning ? "warning" : "success",
        title: "تم تحديث فهرس Steam Gifts",
        message: `تمت فهرسة ${data.returned || 0} لعبة. جديد ${data.upserted || 0}، تحديث ${data.updated || 0}.`,
      });
      return data;
    } catch (error) {
      if (!recordFazerCardsRateLimit(error)) {
        showToast({
          type: "error",
          title: "تعذر تحديث الفهرس",
          message: error.userMessage || error.message || "تعذر تحديث فهرس Steam Gifts.",
        });
      }
      throw error;
    } finally {
      setActionKey("");
    }
  };

  const runFazerCardsSyncAll = async () => {
    const supplier = productsState.supplier;
    if (!token || !supplier || actionKey) return;
    if (!window.confirm("هل تريد تشغيل مزامنة FazerCards للقراءة فقط لكل فئات الكتالوج؟ لن يتم استدعاء أي نقطة نهاية للطلبات ولن تُنشأ منتجات Winnie.")) return;

    setActionKey(`${supplier.id}:sync-all`);
    try {
      const result = await syncFazerCardsCatalogAll(token, {
        includeSteamGifts: true,
        limit: 20,
      });
      setFazerCatalog((current) => ({ ...current, syncResult: result.result }));
      showToast({
        type: result.result.errors?.length ? "warning" : "success",
        title: "اكتملت مزامنة FazerCards الشاملة",
        message: `تمت إضافة ${result.result.totals?.providerProductsCreated || 0} وتحديث ${result.result.totals?.providerProductsUpdated || 0} منتج.`,
      });
      await loadFazerCatalogMeta({ silent: true });
      await loadProviderProducts(supplier, {
        filters: productsState.filters,
        page: 1,
        search: productsState.search,
      });
    } catch (error) {
      if (recordFazerCardsRateLimit(error)) return;
      showToast({
        type: "error",
        title: "فشلت مزامنة FazerCards الشاملة",
        message: error.userMessage || error.message || "تعذر تشغيل مزامنة FazerCards الشاملة.",
      });
    } finally {
      setActionKey("");
    }
  };

  const loadFazerLaunchOps = useCallback(async ({ silent = false, filters = fazerLaunchOps.manualFilters } = {}) => {
    if (!token) return;
    if (!silent) setFazerLaunchOps((current) => ({ ...current, error: "", loading: true }));

    const [healthResult, manualResult, webhookResult] = await Promise.allSettled([
      getFazerCardsLaunchHealth(token),
      getFazerCardsManualOrders(token, {
        familyKey: filters.familyKey || undefined,
        limit: 20,
        page: 1,
      }),
      getFazerCardsWebhookDeliveries(token, { limit: 10, page: 1 }),
    ]);

    const error = [healthResult, manualResult, webhookResult]
      .filter((result) => result.status === "rejected")
      .map((result) => result.reason?.userMessage || result.reason?.message || "تعذر تحميل عمليات تشغيل FazerCards.")
      .join(" ");

    setFazerLaunchOps((current) => ({
      ...current,
      error,
      health: healthResult.status === "fulfilled" ? healthResult.value.health : current.health,
      loading: false,
      manualFilters: filters,
      manualOrders: manualResult.status === "fulfilled" ? manualResult.value.manualOrders : current.manualOrders,
      webhookDeliveries: webhookResult.status === "fulfilled" ? webhookResult.value.deliveries : current.webhookDeliveries,
    }));
  }, [fazerLaunchOps.manualFilters, token]);

  const handleFazerManualFilterChange = async (filters) => {
    setFazerLaunchOps((current) => ({ ...current, manualFilters: filters }));
    await loadFazerLaunchOps({ filters });
  };

  const handleFazerBulkLaunch = async (payload) => {
    if (!token || fazerLaunchOps.loading) return;
    if (!payload.dryRun && !window.confirm("هل تريد تطبيق إعدادات نشر FazerCards؟ قد يؤدي ذلك إلى إظهار المنتجات المحددة للعملاء.")) return;

    setFazerLaunchOps((current) => ({ ...current, error: "", loading: true }));
    try {
      const result = await bulkUpdateFazerCardsLaunch(token, payload);
      setFazerLaunchOps((current) => ({ ...current, bulkResult: result.result }));
      showToast({
        type: result.result.failed ? "warning" : "success",
        title: payload.dryRun ? "أصبحت معاينة النشر جاهزة" : "تم تحديث إعدادات النشر",
        message: `نجح ${result.result.updated || result.result.wouldUpdate || 0} وفشل ${result.result.failed || 0}.`,
      });
      await loadFazerLaunchOps({ silent: true });
      if (productsState.supplier && isFazerCardsSupplier(productsState.supplier)) {
        await loadProviderProducts(productsState.supplier, {
          filters: productsState.filters,
          page: productsState.page,
          search: productsState.search,
        });
      }
    } catch (error) {
      setFazerLaunchOps((current) => ({ ...current, error: error.userMessage || "تعذر تحديث إعدادات نشر FazerCards." }));
      showToast({ type: "error", title: "فشل تحديث النشر", message: error.userMessage || "تعذر تحديث إعدادات نشر FazerCards." });
    } finally {
      setFazerLaunchOps((current) => ({ ...current, loading: false }));
    }
  };

  const handlePublishEligibleFazerCards = async ({ providerExecutionMode = "MANUAL_FULFILLMENT", familyKey = "", dryRun = false } = {}) => {
    if (!token || fazerLaunchOps.loading) return;
    const isAuto = providerExecutionMode === "AUTO_PROVIDER";
    const confirmMessage = isAuto
      ? "تفعيل التنفيذ التلقائي للمنتجات المؤكدة؟ سيبدأ التنفيذ الفعلي فقط عند تفعيل إعدادات المورد من السيرفر."
      : "نشر المنتجات المؤهلة للعملاء؟ المنتجات غير المكتملة ستظهر كأخطاء ولن تُنشر.";
    if (!dryRun && !window.confirm(confirmMessage)) return;

    setFazerLaunchOps((current) => ({ ...current, loading: true, error: "" }));
    try {
      const result = await publishEligibleFazerCardsProducts(token, {
        familyKey,
        providerExecutionMode,
        dryRun,
      });
      setFazerLaunchOps((current) => ({ ...current, bulkResult: result.result }));
      showToast({
        type: result.result.failed ? "warning" : "success",
        title: isAuto ? "تم تحديث التنفيذ التلقائي" : "تم نشر المنتجات",
        message: `${result.result.updated || result.result.wouldUpdate || 0} منتج جاهز، ${result.result.failed || 0} بحاجة لمراجعة.`,
      });
      await refreshFazerLaunchSurfaces();
    } catch (error) {
      setFazerLaunchOps((current) => ({ ...current, error: error.userMessage || "تعذر تحديث منتجات FazerCards." }));
      showToast({ type: "error", title: "تعذر تحديث المنتجات", message: error.userMessage || "تعذر تحديث منتجات FazerCards." });
    } finally {
      setFazerLaunchOps((current) => ({ ...current, loading: false }));
    }
  };

  const refreshFazerLaunchSurfaces = async () => {
    await loadFazerLaunchOps({ silent: true });
    if (productsState.supplier && isFazerCardsSupplier(productsState.supplier)) {
      await loadProviderProducts(productsState.supplier, {
        filters: productsState.filters,
        page: productsState.page,
        search: productsState.search,
      });
    }
  };

  const handleFazerProductLaunchManual = async (providerProduct) => {
    const importedProductId = providerProduct?.importedProduct?.id;
    if (!token || !importedProductId || actionKey) return;
    if (!window.confirm("نشر هذا المنتج للعملاء؟")) return;

    setActionKey(`${providerProduct.id}:launch-manual`);
    try {
      const result = await launchFazerCardsProduct(token, importedProductId, {
        customerPurchaseEnabled: true,
        isActive: true,
        visibleInStore: true,
        status: "available",
        providerExecutionMode: "MANUAL_FULFILLMENT",
      });
      const launchStatus = result.result?.launchStatus || result.result?.result?.customerVisibilityStatus || {};
      showToast({
        type: launchStatus.visibleToCustomer === true ? "success" : "warning",
        title: "تم تحديث إعدادات النشر",
        message: launchStatus.visibleToCustomer === true
          ? "المنتج ظاهر الآن للعملاء."
          : `تم حفظ المنتج، لكنه غير ظاهر: ${(launchStatus.reasons || []).join(", ") || "راجع حالة النشر."}`,
      });
      await refreshFazerLaunchSurfaces();
    } catch (error) {
      showToast({ type: "error", title: "تعذر النشر", message: error.userMessage || "تعذر نشر منتج FazerCards." });
    } finally {
      setActionKey("");
    }
  };

  const handleFazerProductEnableAutoProvider = async (providerProduct) => {
    const importedProductId = providerProduct?.importedProduct?.id;
    const familyKey = String(providerProduct?.familyKey || "").toUpperCase();
    if (!token || !importedProductId || actionKey) return;
    if (!AUTO_PROVIDER_FAMILIES.has(familyKey)) {
      showToast({
        type: "warning",
        title: "التنفيذ التلقائي غير متاح",
        message: "هذه العائلة لا تدعم التنفيذ التلقائي حالياً.",
      });
      return;
    }
    if (!window.confirm("تفعيل هذا المنتج للعملاء مع تنفيذ تلقائي من المورد؟ سيظل التنفيذ الحقيقي مرتبطاً بإعدادات السيرفر.")) return;

    setActionKey(`${providerProduct.id}:enable-auto`);
    try {
      const result = await launchFazerCardsProduct(token, importedProductId, {
        customerPurchaseEnabled: true,
        isActive: true,
        visibleInStore: true,
        status: "available",
        providerExecutionMode: "AUTO_PROVIDER",
        providerExecutionEnabled: true,
      });
      const launchStatus = result.result?.launchStatus || result.result?.result?.customerVisibilityStatus || {};
      showToast({
        type: launchStatus.visibleToCustomer === true ? "success" : "warning",
        title: "تم تفعيل التنفيذ التلقائي",
        message: launchStatus.visibleToCustomer === true
          ? "المنتج ظاهر للعملاء. سيبدأ التنفيذ التلقائي بعد تفعيل إعدادات المورد من السيرفر."
          : `تم حفظ الإعدادات، لكن المنتج غير ظاهر: ${(launchStatus.reasons || []).join(", ") || "راجع حالة النشر."}`,
      });
      await refreshFazerLaunchSurfaces();
    } catch (error) {
      showToast({ type: "error", title: "تعذر تفعيل التنفيذ التلقائي", message: error.userMessage || "تعذر تحديث إعدادات المنتج." });
    } finally {
      setActionKey("");
    }
  };

  const handleFazerProductDisable = async (providerProduct) => {
    const importedProductId = providerProduct?.importedProduct?.id;
    if (!token || !importedProductId || actionKey) return;
    if (!window.confirm("هل تريد تعطيل منتج Winnie المستورد وإخفاءه عن العملاء؟")) return;

    const providerExecutionMode = providerProduct.familyKey === "STEAM_GIFTS"
      ? "DISABLED"
      : "MANUAL_FULFILLMENT";

    setActionKey(`${providerProduct.id}:disable`);
    try {
      await launchFazerCardsProduct(token, importedProductId, {
        customerPurchaseEnabled: false,
        isActive: false,
        visibleInStore: false,
        status: "unavailable",
        providerExecutionMode,
      });
      showToast({ type: "success", title: "تم تعطيل المنتج", message: "أصبح المنتج مخفيًا عن العملاء." });
      await refreshFazerLaunchSurfaces();
    } catch (error) {
      showToast({ type: "error", title: "فشل التعطيل", message: error.userMessage || "تعذر تعطيل منتج FazerCards هذا." });
    } finally {
      setActionKey("");
    }
  };

  const handleCompleteManualOrder = async (order) => {
    if (!token || !order?.id) return;
    const note = window.prompt("ملاحظة الإكمال", "تم تنفيذ الطلب يدويًا.");
    if (note === null) return;
    let deliveredCodes = [];
    if (order.fulfillmentMode === "CODE_DELIVERY") {
      const raw = window.prompt("أدخل مصفوفة JSON للأكواد المسلّمة. تُحفظ الأكواد مشفّرة ولن تظهر في القوائم.", "[{\"code\":\"\",\"pin\":\"\",\"serial\":\"\"}]");
      if (raw === null) return;
      try {
        deliveredCodes = JSON.parse(raw || "[]");
      } catch {
        showToast({ type: "error", title: "تنسيق JSON غير صالح", message: "يجب أن تكون الأكواد المسلّمة ضمن مصفوفة JSON." });
        return;
      }
    }

    setFazerLaunchOps((current) => ({ ...current, loading: true }));
    try {
      await completeFazerCardsManualOrder(token, order.id, { adminNote: note, deliveredCodes });
      showToast({ type: "success", title: "اكتمل الطلب اليدوي", message: "تم وضع علامة مكتمل على الطلب." });
      await loadFazerLaunchOps({ silent: true });
    } catch (error) {
      showToast({ type: "error", title: "فشل الإكمال", message: error.userMessage || "تعذر إكمال الطلب اليدوي." });
    } finally {
      setFazerLaunchOps((current) => ({ ...current, loading: false }));
    }
  };

  const handleFailManualOrder = async (order) => {
    if (!token || !order?.id) return;
    const reason = window.prompt("سبب الفشل", "تعذر تنفيذ الطلب يدويًا.");
    if (!reason) return;
    const refund = window.confirm("هل تريد رد رصيد هذا الطلب إذا تم خصمه؟ لن يُنفذ الاسترداد أكثر من مرة.");

    setFazerLaunchOps((current) => ({ ...current, loading: true }));
    try {
      const result = await failFazerCardsManualOrder(token, order.id, { reason, refund });
      showToast({
        type: "warning",
        title: "فشل الطلب اليدوي",
        message: result.result.refunded ? "فشل الطلب وتمت معالجة الاسترداد مرة واحدة." : "فشل الطلب بدون استرداد.",
      });
      await loadFazerLaunchOps({ silent: true });
    } catch (error) {
      showToast({ type: "error", title: "تعذر تسجيل الفشل", message: error.userMessage || "تعذر تسجيل فشل الطلب اليدوي." });
    } finally {
      setFazerLaunchOps((current) => ({ ...current, loading: false }));
    }
  };

  const handleNoteManualOrder = async (order) => {
    if (!token || !order?.id) return;
    const adminNote = window.prompt("ملاحظة داخلية", "");
    if (!adminNote) return;

    setFazerLaunchOps((current) => ({ ...current, loading: true }));
    try {
      await addFazerCardsManualOrderNote(token, order.id, { adminNote });
      showToast({ type: "success", title: "تمت إضافة الملاحظة", message: "تم حفظ الملاحظة الداخلية." });
      await loadFazerLaunchOps({ silent: true });
    } catch (error) {
      showToast({ type: "error", title: "فشلت إضافة الملاحظة", message: error.userMessage || "تعذر إضافة الملاحظة." });
    } finally {
      setFazerLaunchOps((current) => ({ ...current, loading: false }));
    }
  };

  const handleFazerCardsReadiness = async (providerProduct) => {
    const importedProductId = providerProduct?.importedProduct?.id;
    if (!token || !importedProductId || actionKey) {
      showToast({ type: "warning", title: "استورد المنتج أولاً", message: "تعمل فحوصات الجاهزية على منتج Winnie المستورد." });
      return;
    }

    setActionKey(`${providerProduct.id}:readiness`);
    try {
      const result = await getFazerCardsProductReadiness(token, importedProductId);
      const readiness = result.readiness || {};
      const checks = readiness.checks || {};
      const passed = Object.values(checks).filter((value) => value === true).length;
      const total = Object.keys(checks).length;
      showToast({
        type: readiness.readyForLiveExecution ? "success" : "warning",
        title: "جاهزية FazerCards",
        message: `${readiness.readyForLiveExecution ? "جاهز" : "غير جاهز"} (${passed}/${total} فحص). ${(readiness.warnings || [])[0] || ""}`,
      });
    } catch (error) {
      showToast({ type: "error", title: "فشل فحص الجاهزية", message: error.userMessage || "تعذر التحقق من الجاهزية." });
    } finally {
      setActionKey("");
    }
  };

  const handleFazerCardsDryRun = async (providerProduct) => {
    const importedProductId = providerProduct?.importedProduct?.id;
    if (!token || !importedProductId || actionKey) {
      showToast({ type: "warning", title: "استورد المنتج أولاً", message: "تعمل معاينات الحمولة على منتج Winnie المستورد." });
      return;
    }

    const requiredFields = providerProduct.requiredFields || [];
    let fields = {};
    if (requiredFields.length) {
      const template = requiredFields.reduce((acc, field) => {
        const key = field.key || field.id || field.label;
        if (key) acc[key] = "";
        return acc;
      }, {});
      const rawFields = window.prompt("أدخل حقول معاينة الحمولة بصيغة JSON. لن يؤدي ذلك إلى إنشاء طلب.", JSON.stringify(template, null, 2));
      if (rawFields === null) return;
      try {
        fields = JSON.parse(rawFields || "{}");
      } catch {
        showToast({ type: "error", title: "تنسيق JSON غير صالح", message: "يجب أن تكون حقول معاينة الحمولة بصيغة JSON صالحة." });
        return;
      }
    }

    const rawQuantity = providerProduct.fulfillmentMode === "TOPUP_WITH_FIELDS"
      ? "1"
      : window.prompt("كمية معاينة الحمولة. لن يؤدي ذلك إلى إنشاء طلب.", "1");
    if (rawQuantity === null) return;

    setActionKey(`${providerProduct.id}:dry-run`);
    try {
      const result = await dryRunFazerCardsProduct(token, importedProductId, {
        fields,
        quantity: Number(rawQuantity || 1),
      });
      const dryRun = result.dryRun || {};
      showToast({
        type: dryRun.success === false ? "warning" : "success",
        title: dryRun.success === false ? "عقد FazerCards غير مؤكد" : "تم إنشاء معاينة حمولة FazerCards",
        message: dryRun.success === false
          ? dryRun.message || "لا تحتوي هذه الفئة على عقد حمولة مؤكد للمورد حتى الآن. لم يتم إنشاء طلب للمورد."
          : `تم إنشاء معاينة ${dryRun.wouldCall || "بدون استدعاء نقطة نهاية للمورد"}. لم يتم إنشاء طلب للمورد.`,
      });
    } catch (error) {
      showToast({ type: "error", title: "فشلت معاينة الحمولة", message: error.userMessage || "تعذر إنشاء معاينة الحمولة." });
    } finally {
      setActionKey("");
    }
  };

  const handleFazerCardsImported = async (result) => {
    showToast({
      type: "success",
      title: result.action === "updated" ? "تم تحديث الاستيراد" : "تم استيراد المنتج",
      message: `تم حفظ ${result.product.name || "منتج FazerCards"} كمنتج غير مفعّل ومخفي عن العملاء.`,
    });
    if (productsState.supplier) {
      await loadProviderProducts(productsState.supplier, {
        filters: productsState.filters,
        page: productsState.page,
        search: productsState.search,
      });
    }
    await loadFazerCatalogMeta({ silent: true });
    await loadSuppliers({ silent: true });
  };

  return (
    <div dir="rtl" className="admin-suppliers-page supplier-control-room space-y-4">
      {specialProviderPage ? (
        <FazerCardsSpecialProviderPage
          health={fazerLaunchOps.health}
          loadError={loadError}
          loading={initialLoading}
          onRefresh={() => {
            void loadFazerProviderHealth();
            void loadSuppliers({ silent: true });
          }}
          refreshing={fazerLaunchOps.loading}
          supplier={fazerCardsSupplier}
          token={token}
        />
      ) : (
        <>
          <Header onAdd={() => { setFormError(""); setForm(null); }} onRefresh={() => loadSuppliers()} refreshing={initialLoading} />

          {initialLoading ? (
            <SuppliersLoadingState />
          ) : loadError ? (
            <EmptyState icon={AlertTriangle} title="تعذر تحميل الموردين" description={loadError} actionLabel="حاول مجددًا" onAction={() => loadSuppliers()} />
          ) : (
            <>
              <div className="admin-suppliers-stats grid grid-cols-2 gap-2 lg:grid-cols-4">
                {stats.map(({ label, value, icon: Icon }) => (
                  <article key={label} className="admin-suppliers-stat rounded-[20px] border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-[#111827]">
                    <Icon className="h-8 w-8 rounded-xl bg-violet-500/10 p-2 text-violet-600" />
                    <strong className="mt-2 block text-2xl font-black dark:text-white">{value.toLocaleString("ar-EG-u-nu-latn")}</strong>
                    <p className="text-[8px] font-black text-slate-400">{label}</p>
                  </article>
                ))}
              </div>

              {fazerCardsSupplier && <SpecialProviderPortal supplier={fazerCardsSupplier} />}

              <SupplierSearchProducts
                error={globalSearch.error}
                loading={globalSearch.loading}
                onSearch={searchAllProviderProducts}
                pagination={globalSearch.pagination}
                products={globalSearch.products}
                searched={globalSearch.searched}
              />

              {suppliers.length ? (
                <div className="admin-suppliers-list grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {suppliers.map((supplier) => (
                    <SupplierCard
                      key={supplier.id}
                      actionKey={actionKey}
                      connectionResult={connectionResults[supplier.id]}
                      onArchive={requestArchive}
                      onEdit={(item) => { setFormError(""); setForm(item); }}
                      onProducts={(item) => loadProviderProducts(item)}
                      onSync={requestSync}
                      onTest={testConnection}
                      onToggle={requestToggle}
                      onTools={setToolsFor}
                      onXena={setXenaFor}
                      productCountLabel="فتح الكتالوج"
                      supplier={supplier}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState icon={Search} title="لا يوجد موردون" description="أضف موردًا لبدء مزامنة منتجاته." actionLabel="إضافة مورد" onAction={() => setForm(null)} />
              )}
            </>
          )}
        </>
      )}

      <SupplierFormModal error={formError} open={form !== undefined} supplier={form} onClose={() => !saving && setForm(undefined)} onSave={saveSupplier} saving={saving} />
      {productsState.supplier && (
        <SupplierProductsModal
          actionKey={actionKey}
          error={productsState.error || fazerCatalog.error}
          fazerCardsCatalog={fazerCatalog}
          fazerCards={isFazerCardsSupplier(productsState.supplier)}
          filters={productsState.filters}
          loading={productsState.loading}
          onClose={closeProviderProductsModal}
          onFilterChange={updateFazerCardsFilters}
          onFazerCardsDisable={handleFazerProductDisable}
          onFazerCardsDryRun={handleFazerCardsDryRun}
          onFazerCardsEnableAuto={handleFazerProductEnableAutoProvider}
          onFazerCardsLaunchManual={handleFazerProductLaunchManual}
          onFazerCardsReadiness={handleFazerCardsReadiness}
          onFazerCardsSyncAll={runFazerCardsSyncAll}
          onFazerCardsSyncFamily={runFazerCardsSyncFamily}
          onFazerCardsSteamGiftIndexRefresh={refreshSteamGiftIndex}
          onFazerCardsSteamGiftSearch={searchSteamGiftIndex}
          onImport={setFazerImportProduct}
          onPageChange={(page) => loadProviderProducts(productsState.supplier, { filters: productsState.filters, page, search: productsState.search })}
          onSearch={(search, filters) => loadProviderProducts(productsState.supplier, { filters, page: 1, search })}
          onSync={requestSync}
          pagination={productsState.pagination}
          products={productsState.products}
          search={productsState.search}
          supplier={productsState.supplier}
        />
      )}
      <FazerCardsImportModal
        onClose={() => setFazerImportProduct(null)}
        onImported={handleFazerCardsImported}
        product={fazerImportProduct}
        token={token}
      />
      <SupplierToolsModal
        onCheckOrder={(supplier, orderId) => checkAdminProviderOrder(token, supplier.id, orderId)}
        onClose={() => setToolsFor(null)}
        onGetBalance={(supplier) => getAdminProviderBalance(token, supplier.id)}
        supplier={toolsFor}
      />
      <XenaSupplierModal
        onClose={() => setXenaFor(null)}
        onUpdated={() => loadSuppliers({ silent: true })}
        supplier={xenaFor}
        token={token}
      />
      <ConfirmDialog
        busy={Boolean(actionKey)}
        confirmLabel={getConfirmLabel(confirm.kind, confirm.supplier)}
        message={getConfirmMessage(confirm.kind, confirm.supplier)}
        onCancel={() => !actionKey && setConfirm({ kind: "", supplier: null })}
        onConfirm={runConfirmedAction}
        open={Boolean(confirm.supplier)}
        title={getConfirmTitle(confirm.kind)}
        tone={confirm.kind === "archive" ? "danger" : "warning"}
      />
    </div>
  );
}

function SpecialProviderPortal({ supplier }) {
  return (
    <Link to="/admin/tools/suppliers/special-provider" className="fazer-special-portal">
      <span className="fazer-special-portal-mark">F<Sparkles /></span>
      <span className="fazer-special-portal-copy">
        <small>مساحة تشغيل مستقلة</small>
        <strong>صفحة مورد خاص</strong>
        <p>ابحث في Catalogs، افتح Offers، واربط ما تحتاجه فقط بمنتجات المتجر.</p>
      </span>
      <span className="fazer-special-portal-action">فتح الصفحة <ArrowLeft /></span>
    </Link>
  );
}

function Header({ onAdd, onRefresh, refreshing }) {
  return (
    <section className="admin-suppliers-hero supplier-control-hero flex items-center gap-3 rounded-[26px] border border-violet-200 bg-gradient-to-l from-white to-sky-50 p-5 dark:border-white/10 dark:bg-[linear-gradient(135deg,#111827,#17152A)]">
      <span className="supplier-control-hero-icon grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-blue-500 text-white"><Server className="h-5 w-5" /></span>
      <div className="min-w-0 flex-1">
        <p className="supplier-control-kicker">مركز التحكم الذكي</p>
        <h1 className="text-2xl font-black dark:text-white">إدارة الموردين</h1>
        <p className="text-[9px] font-bold text-slate-400">راقب الاتصالات، نظّم الكتالوج، وأدر عمليات الشحن من مكان واحد.</p>
      </div>
      <button type="button" onClick={onRefresh} disabled={refreshing} className="inline-flex h-10 items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 text-[9px] font-black text-slate-600 disabled:opacity-60 dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-300">
        <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
        تحديث
      </button>
      <button type="button" onClick={onAdd} className="inline-flex h-10 items-center gap-1 rounded-xl bg-violet-600 px-3 text-[9px] font-black text-white">
        <Plus className="h-4 w-4" />
        إضافة مورد
      </button>
    </section>
  );
}

function SuppliersLoadingState() {
  return (
    <div className="space-y-4" aria-busy="true">
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => <SkeletonBlock key={index} className="h-28 rounded-[20px]" />)}
      </div>
      <SkeletonBlock className="h-36 rounded-[24px]" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => <SkeletonBlock key={index} className="h-72 rounded-[22px]" />)}
      </div>
    </div>
  );
}

function getConfirmTitle(kind) {
  if (kind === "sync") return "هل تريد مزامنة كتالوج المورد؟";
  if (kind === "toggle") return "هل تريد تغيير حالة المورد؟";
  if (kind === "archive") return "هل تريد أرشفة المورد؟";
  return "تأكيد إجراء المورد";
}

function getConfirmLabel(kind, supplier) {
  if (kind === "sync") return "مزامنة الكتالوج";
  if (kind === "toggle") return supplier?.active ? "تعطيل المورد" : "تفعيل المورد";
  if (kind === "archive") return "أرشفة المورد";
  return "تأكيد";
}

function getConfirmMessage(kind, supplier) {
  if (!supplier) return "";
  if (kind === "sync") return `سيزامن الخادم منتجات المورد ${supplier.name}، ثم تُحدّث القائمة بعد التأكيد.`;
  if (kind === "toggle") return `سيقوم الخادم بـ${supplier.active ? "تعطيل" : "تفعيل"} المورد ${supplier.name} مع بقاء المنتجات والطلبات خاضعة لقواعد النظام.`;
  if (kind === "archive") return `سيُؤرشف المورد ${supplier.name} ويُعطّل ويُزال من الاستخدام النشط.`;
  return `تنفيذ الإجراء على المورد ${supplier.name}.`;
}
