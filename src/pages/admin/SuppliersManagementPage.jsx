import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, Boxes, CloudCog, Plus, RefreshCw, Search, Server } from "lucide-react";
import {
  checkAdminProviderOrder,
  createAdminProvider,
  deleteAdminProvider,
  dryRunFazerCardsProduct,
  getFazerCardsCatalogFamilies,
  getFazerCardsCatalogSummary,
  getFazerCardsContractsSummary,
  getFazerCardsProductReadiness,
  getFazerCardsProviderProducts,
  getAdminProviderBalance,
  getAdminProviderProducts,
  getAdminProviders,
  syncFazerCardsCatalogAll,
  syncFazerCardsCatalogFamily,
  syncAdminProviderProducts,
  testAdminProvider,
  toggleAdminProvider,
  updateAdminProvider,
} from "../../api/adminProviders";
import ConfirmDialog from "../../components/admin/products/ConfirmDialog";
import FazerCardsImportModal from "../../components/admin/suppliers/FazerCardsImportModal";
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

const defaultFazerCardsFilters = {
  blockReason: "",
  blocked: "",
  category: "",
  familyKey: "TOPUPS",
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

function getProviderCode(provider) {
  return String(provider?.providerCode || provider?.code || provider?.provider?.providerCode || "").toUpperCase() || null;
}

function isFazerCardsSupplier(supplier) {
  const providerCode = getProviderCode(supplier);
  const slug = String(supplier?.slug || supplier?.code || "").toLowerCase();
  const name = String(supplier?.name || supplier?.displayName || "").toLowerCase();
  return providerCode === "FAZER_CARDS" || slug === "fazer-cards" || name === "fazercards" || name === "fazer cards";
}

export default function SuppliersManagementPage() {
  const { token } = useAuth();
  const { showToast } = useToast();
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
  const [fazerImportProduct, setFazerImportProduct] = useState(null);
  const [toolsFor, setToolsFor] = useState(null);
  const [xenaFor, setXenaFor] = useState(null);
  const [globalSearch, setGlobalSearch] = useState({
    error: "",
    loading: false,
    pagination: null,
    products: [],
    searched: false,
  });

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
      .map((result) => result.reason?.userMessage || result.reason?.message || "Could not load FazerCards catalog metadata.")
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

    setProductsState((current) => ({
      ...current,
      error: "",
      filters: effectiveFilters,
      loading: true,
      page,
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
    setProductsState((current) => ({
      ...current,
      filters: { ...defaultFazerCardsFilters, ...filters },
    }));
  };

  const runFazerCardsSyncFamily = async (familyKey = "TOPUPS") => {
    const supplier = productsState.supplier;
    const normalizedFamily = String(familyKey || productsState.filters.familyKey || "TOPUPS").toUpperCase();
    if (!token || !supplier || actionKey) return;

    if (normalizedFamily === "STEAM_GIFTS") {
      showToast({
        type: "warning",
        title: "STEAM_GIFTS unavailable",
        message: "FazerCards returned HTTP 404 for this catalog family in production, so it remains disabled.",
      });
      return;
    }

    setActionKey(`${supplier.id}:sync-family:${normalizedFamily}`);
    try {
      const result = await syncFazerCardsCatalogFamily(token, {
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
        title: `${normalizedFamily} synced`,
        message: `Created ${result.result.providerProductsCreated || 0}, updated ${result.result.providerProductsUpdated || 0}.`,
      });
      await loadFazerCatalogMeta({ silent: true });
      await loadProviderProducts(supplier, {
        filters: { ...productsState.filters, familyKey: normalizedFamily },
        page: 1,
        search: productsState.search,
      });
    } catch (error) {
      showToast({
        type: "error",
        title: "FazerCards family sync failed",
        message: error.userMessage || error.message || "Could not sync FazerCards family.",
      });
    } finally {
      setActionKey("");
    }
  };

  const runFazerCardsSyncAll = async () => {
    const supplier = productsState.supplier;
    if (!token || !supplier || actionKey) return;
    if (!window.confirm("Run read-only FazerCards sync for all catalog families? No order endpoint will be called and no Winnie products will be created.")) return;

    setActionKey(`${supplier.id}:sync-all`);
    try {
      const result = await syncFazerCardsCatalogAll(token, {
        includeSteamGifts: true,
        limit: 20,
      });
      setFazerCatalog((current) => ({ ...current, syncResult: result.result }));
      showToast({
        type: result.result.errors?.length ? "warning" : "success",
        title: "FazerCards sync-all finished",
        message: `Created ${result.result.totals?.providerProductsCreated || 0}, updated ${result.result.totals?.providerProductsUpdated || 0}.`,
      });
      await loadFazerCatalogMeta({ silent: true });
      await loadProviderProducts(supplier, {
        filters: productsState.filters,
        page: 1,
        search: productsState.search,
      });
    } catch (error) {
      showToast({
        type: "error",
        title: "FazerCards sync-all failed",
        message: error.userMessage || error.message || "Could not run FazerCards sync-all.",
      });
    } finally {
      setActionKey("");
    }
  };

  const handleFazerCardsReadiness = async (providerProduct) => {
    const importedProductId = providerProduct?.importedProduct?.id;
    if (!token || !importedProductId || actionKey) {
      showToast({ type: "warning", title: "Import first", message: "Readiness checks run against the imported Winnie Product." });
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
        title: "FazerCards readiness",
        message: `${readiness.readyForLiveExecution ? "Ready" : "Not ready"} (${passed}/${total} checks). ${(readiness.warnings || [])[0] || ""}`,
      });
    } catch (error) {
      showToast({ type: "error", title: "Readiness failed", message: error.userMessage || "Could not check readiness." });
    } finally {
      setActionKey("");
    }
  };

  const handleFazerCardsDryRun = async (providerProduct) => {
    const importedProductId = providerProduct?.importedProduct?.id;
    if (!token || !importedProductId || actionKey) {
      showToast({ type: "warning", title: "Import first", message: "Dry-run previews run against the imported Winnie Product." });
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
      const rawFields = window.prompt("Enter dry-run fields JSON. This does not create an order.", JSON.stringify(template, null, 2));
      if (rawFields === null) return;
      try {
        fields = JSON.parse(rawFields || "{}");
      } catch {
        showToast({ type: "error", title: "Invalid JSON", message: "Dry-run fields must be valid JSON." });
        return;
      }
    }

    const rawQuantity = providerProduct.fulfillmentMode === "TOPUP_WITH_FIELDS"
      ? "1"
      : window.prompt("Dry-run quantity. This does not create an order.", "1");
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
        title: dryRun.success === false ? "FazerCards contract unconfirmed" : "FazerCards dry-run built",
        message: dryRun.success === false
          ? dryRun.message || "This family does not have a confirmed provider payload contract yet. No provider order was called."
          : `${dryRun.wouldCall || "No live endpoint"} preview created. No provider order was called.`,
      });
    } catch (error) {
      showToast({ type: "error", title: "Dry-run failed", message: error.userMessage || "Could not build dry-run preview." });
    } finally {
      setActionKey("");
    }
  };

  const handleFazerCardsImported = async (result) => {
    showToast({
      type: "success",
      title: result.action === "updated" ? "Import updated" : "Product imported",
      message: `${result.product.name || "FazerCards product"} was saved inactive and hidden from customers.`,
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
    <div dir="rtl" className="admin-suppliers-page space-y-4">
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

      <SupplierFormModal error={formError} open={form !== undefined} supplier={form} onClose={() => !saving && setForm(undefined)} onSave={saveSupplier} saving={saving} />
      {productsState.supplier && (
        <SupplierProductsModal
          actionKey={actionKey}
          error={productsState.error || fazerCatalog.error}
          fazerCardsCatalog={fazerCatalog}
          fazerCards={isFazerCardsSupplier(productsState.supplier)}
          filters={productsState.filters}
          loading={productsState.loading}
          onClose={() => setProductsState({ ...emptyProductsState, filters: { ...defaultFazerCardsFilters } })}
          onFilterChange={updateFazerCardsFilters}
          onFazerCardsDryRun={handleFazerCardsDryRun}
          onFazerCardsReadiness={handleFazerCardsReadiness}
          onFazerCardsSyncAll={runFazerCardsSyncAll}
          onFazerCardsSyncFamily={runFazerCardsSyncFamily}
          onImport={setFazerImportProduct}
          onPageChange={(page) => loadProviderProducts(productsState.supplier, { filters: productsState.filters, page, search: productsState.search })}
          onSearch={(search, filters) => loadProviderProducts(productsState.supplier, { filters, page: 1, search })}
          onSync={requestSync}
          pagination={productsState.pagination}
          products={productsState.products}
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

function Header({ onAdd, onRefresh, refreshing }) {
  return (
    <section className="admin-suppliers-hero flex items-center gap-3 rounded-[26px] border border-violet-200 bg-gradient-to-l from-white to-sky-50 p-5 dark:border-white/10 dark:bg-[linear-gradient(135deg,#111827,#17152A)]">
      <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-blue-500 text-white"><Server className="h-5 w-5" /></span>
      <div className="min-w-0 flex-1">
        <h1 className="text-2xl font-black dark:text-white">إدارة الموردين</h1>
        <p className="text-[9px] font-bold text-slate-400">إدارة الموردين ومزامنة الكتالوج واختبار الاتصال وتصفح المنتجات.</p>
      </div>
      <button type="button" onClick={onRefresh} disabled={refreshing} className="inline-flex h-10 items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 text-[9px] font-black text-slate-600 disabled:opacity-60 dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-300">
        <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
        تحديث
      </button>
      <button type="button" onClick={onAdd} className="inline-flex h-10 items-center gap-1 rounded-xl bg-violet-600 px-3 text-[9px] font-black text-white">
        <Plus className="h-4 w-4" />
        Add provider
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
