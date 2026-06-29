import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, Boxes, CloudCog, Plus, RefreshCw, Search, Server } from "lucide-react";
import {
  checkAdminProviderOrder,
  createAdminProvider,
  deleteAdminProvider,
  getAdminProviderBalance,
  getAdminProviderProducts,
  getAdminProviders,
  syncAdminProviderProducts,
  testAdminProvider,
  toggleAdminProvider,
  updateAdminProvider,
} from "../../api/adminProviders";
import ConfirmDialog from "../../components/admin/products/ConfirmDialog";
import SupplierCard from "../../components/admin/suppliers/SupplierCard";
import SupplierFormModal from "../../components/admin/suppliers/SupplierFormModal";
import SupplierProductsModal from "../../components/admin/suppliers/SupplierProductsModal";
import SupplierSearchProducts from "../../components/admin/suppliers/SupplierSearchProducts";
import SupplierToolsModal from "../../components/admin/suppliers/SupplierToolsModal";
import EmptyState from "../../components/EmptyState";
import { SkeletonBlock } from "../../components/Skeletons";
import { useToast } from "../../components/ToastProvider";
import { useAuth } from "../../context/AuthContext";

const productPageSize = 30;

const emptyProductsState = {
  error: "",
  loading: false,
  page: 1,
  pagination: { page: 1, limit: productPageSize, total: 0, pages: 1 },
  products: [],
  search: "",
  supplier: null,
};

export default function SuppliersManagementPage() {
  const { token } = useAuth();
  const { showToast } = useToast();
  const [suppliers, setSuppliers] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [form, setForm] = useState(undefined);
  const [saving, setSaving] = useState(false);
  const [actionKey, setActionKey] = useState("");
  const [confirm, setConfirm] = useState({ kind: "", supplier: null });
  const [connectionResults, setConnectionResults] = useState({});
  const [providerProductsTotal, setProviderProductsTotal] = useState(0);
  const [productsState, setProductsState] = useState(emptyProductsState);
  const [toolsFor, setToolsFor] = useState(null);
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
      setLoadError("Admin session is required.");
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
      setLoadError(error.userMessage || "Unable to load backend providers.");
    } finally {
      setInitialLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadSuppliers();
  }, [loadSuppliers]);

  const stats = useMemo(() => [
    { label: "Providers", value: suppliers.length, icon: Server },
    { label: "Active", value: suppliers.filter((supplier) => supplier.active).length, icon: CloudCog },
    { label: "Inactive", value: suppliers.filter((supplier) => !supplier.active).length, icon: RefreshCw },
    { label: "Provider products", value: providerProductsTotal, icon: Boxes },
  ], [providerProductsTotal, suppliers]);

  const saveSupplier = async (values) => {
    if (!token || saving) return;
    const editing = Boolean(form?.id);

    setSaving(true);
    try {
      const result = editing
        ? await updateAdminProvider(token, form.id, values)
        : await createAdminProvider(token, values);

      setForm(undefined);
      showToast({
        type: "success",
        title: editing ? "Provider updated" : "Provider created",
        message: result.message || result.provider.name,
      });
      await loadSuppliers({ silent: true });
    } catch (error) {
      showToast({
        type: "error",
        title: "Provider save failed",
        message: error.userMessage || "The provider could not be saved.",
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
        title: result.result.connected ? "Connection successful" : "Connection failed",
        message: result.result.message,
      });
    } catch (error) {
      showToast({ type: "error", title: "Connection test failed", message: error.userMessage || "Backend provider test failed." });
    } finally {
      setActionKey("");
    }
  };

  const requestSync = (supplier) => setConfirm({ kind: "sync", supplier });
  const requestToggle = (supplier) => setConfirm({ kind: "toggle", supplier });
  const requestArchive = (supplier) => setConfirm({ kind: "archive", supplier });

  const runConfirmedAction = async () => {
    const { kind, supplier } = confirm;
    if (!token || !supplier || actionKey) return;

    setActionKey(`${supplier.id}:${kind}`);
    try {
      if (kind === "sync") {
        const result = await syncAdminProviderProducts(token, supplier.id);
        showToast({
          type: result.result.errors.length ? "warning" : "success",
          title: result.message || "Provider sync completed",
          message: `${result.result.totalFetched} fetched, ${result.result.updated + result.result.upserted} upserted/updated.`,
        });
        if (productsState.supplier?.id === supplier.id) {
          await loadProviderProducts(supplier, { page: productsState.page, search: productsState.search });
        }
      } else if (kind === "toggle") {
        const result = await toggleAdminProvider(token, supplier.id);
        showToast({
          type: result.provider.active ? "success" : "warning",
          title: result.provider.active ? "Provider enabled" : "Provider disabled",
          message: result.message || result.provider.name,
        });
      } else if (kind === "archive") {
        const result = await deleteAdminProvider(token, supplier.id);
        showToast({ type: "warning", title: "Provider archived", message: result.message || result.provider.name });
      }

      setConfirm({ kind: "", supplier: null });
      await loadSuppliers({ silent: true });
    } catch (error) {
      showToast({
        type: "error",
        title: "Provider action failed",
        message: error.userMessage || "Backend provider action failed.",
      });
    } finally {
      setActionKey("");
    }
  };

  const loadProviderProducts = async (supplier, { page = 1, search = "" } = {}) => {
    if (!token || !supplier) return;

    setProductsState((current) => ({
      ...current,
      error: "",
      loading: true,
      page,
      search,
      supplier,
    }));

    try {
      const result = await getAdminProviderProducts(token, supplier.id, {
        includeInactive: true,
        limit: productPageSize,
        page,
        search,
      });
      setProductsState({
        error: "",
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
        error: error.userMessage || "Unable to load provider products.",
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
        error: error.userMessage || "Unable to search provider products.",
        loading: false,
        pagination: null,
        products: [],
        searched: true,
      });
    }
  };

  return (
    <div dir="rtl" className="space-y-4">
      <Header onAdd={() => setForm(null)} onRefresh={() => loadSuppliers()} refreshing={initialLoading} />

      {initialLoading ? (
        <SuppliersLoadingState />
      ) : loadError ? (
        <EmptyState icon={AlertTriangle} title="Unable to load providers" description={loadError} actionLabel="Try again" onAction={() => loadSuppliers()} />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
            {stats.map(({ label, value, icon: Icon }) => (
              <article key={label} className="rounded-[20px] border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-[#111827]">
                <Icon className="h-8 w-8 rounded-xl bg-violet-500/10 p-2 text-violet-600" />
                <strong className="mt-2 block text-2xl font-black dark:text-white">{value.toLocaleString("ar-EG")}</strong>
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
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {suppliers.map((supplier) => (
                <SupplierCard
                  key={supplier.id}
                  actionKey={actionKey}
                  connectionResult={connectionResults[supplier.id]}
                  onArchive={requestArchive}
                  onEdit={setForm}
                  onProducts={(item) => loadProviderProducts(item)}
                  onSync={requestSync}
                  onTest={testConnection}
                  onToggle={requestToggle}
                  onTools={setToolsFor}
                  productCountLabel="Open catalog"
                  supplier={supplier}
                />
              ))}
            </div>
          ) : (
            <EmptyState icon={Search} title="No backend providers found" description="Create a provider to start syncing provider products." actionLabel="Create provider" onAction={() => setForm(null)} />
          )}
        </>
      )}

      <SupplierFormModal open={form !== undefined} supplier={form} onClose={() => !saving && setForm(undefined)} onSave={saveSupplier} saving={saving} />
      <SupplierProductsModal
        actionKey={actionKey}
        error={productsState.error}
        loading={productsState.loading}
        onClose={() => setProductsState(emptyProductsState)}
        onPageChange={(page) => loadProviderProducts(productsState.supplier, { page, search: productsState.search })}
        onSearch={(search) => loadProviderProducts(productsState.supplier, { page: 1, search })}
        onSync={requestSync}
        pagination={productsState.pagination}
        products={productsState.products}
        supplier={productsState.supplier}
      />
      <SupplierToolsModal
        onCheckOrder={(supplier, orderId) => checkAdminProviderOrder(token, supplier.id, orderId)}
        onClose={() => setToolsFor(null)}
        onGetBalance={(supplier) => getAdminProviderBalance(token, supplier.id)}
        supplier={toolsFor}
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
    <section className="flex items-center gap-3 rounded-[26px] border border-violet-200 bg-gradient-to-l from-white to-sky-50 p-5 dark:border-white/10 dark:bg-[linear-gradient(135deg,#111827,#17152A)]">
      <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-blue-500 text-white"><Server className="h-5 w-5" /></span>
      <div className="min-w-0 flex-1">
        <h1 className="text-2xl font-black dark:text-white">Provider management</h1>
        <p className="text-[9px] font-bold text-slate-400">Backend providers, catalog sync, diagnostics, and safe product browsing.</p>
      </div>
      <button type="button" onClick={onRefresh} disabled={refreshing} className="inline-flex h-10 items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 text-[9px] font-black text-slate-600 disabled:opacity-60 dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-300">
        <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
        Refresh
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
  if (kind === "sync") return "Sync provider catalog?";
  if (kind === "toggle") return "Change provider status?";
  if (kind === "archive") return "Archive provider?";
  return "Confirm provider action";
}

function getConfirmLabel(kind, supplier) {
  if (kind === "sync") return "Sync catalog";
  if (kind === "toggle") return supplier?.active ? "Disable provider" : "Enable provider";
  if (kind === "archive") return "Archive provider";
  return "Confirm";
}

function getConfirmMessage(kind, supplier) {
  if (!supplier) return "";
  if (kind === "sync") return `Ask the backend to sync cached provider products for ${supplier.name}. The frontend will refetch after the backend confirms.`;
  if (kind === "toggle") return `Ask the backend to ${supplier.active ? "disable" : "enable"} ${supplier.name}. Linked products and orders remain controlled by backend rules.`;
  if (kind === "archive") return `Soft-delete ${supplier.name} through the backend. The provider will be disabled and removed from active use.`;
  return `Run backend action for ${supplier.name}.`;
}
