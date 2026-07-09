import { useCallback, useEffect, useMemo, useState } from "react";
import { LayoutGrid, PackagePlus, Search } from "lucide-react";
import {
  createAdminCategory,
  deleteAdminCategory,
  getAdminCategories,
  updateAdminCategory,
} from "../../api/adminCategories";
import {
  buildAdminCategoryLookup,
  createAdminProduct,
  deleteAdminProduct,
  getAdminProductProviderOptions,
  getAdminProductProviderProductOptions,
  getAdminProducts,
  linkAdminProductProvider,
  syncAdminProductProvider,
  toggleAdminProduct,
  unlinkAdminProductProvider,
  updateAdminProduct,
} from "../../api/adminProducts";
import CategoriesCatalog from "../../components/admin/products/CategoriesCatalog";
import CategoryFormModal from "../../components/admin/products/CategoryFormModal";
import ConfirmDialog from "../../components/admin/products/ConfirmDialog";
import ProductCard, { ProductMobileCard } from "../../components/admin/products/ProductCard";
import ProductFilters from "../../components/admin/products/ProductFilters";
import ProductFormModal from "../../components/admin/products/ProductFormModal";
import ProductProviderLinkModal from "../../components/admin/products/ProductProviderLinkModal";
import EmptyState from "../../components/EmptyState";
import { SkeletonBlock } from "../../components/Skeletons";
import { useToast } from "../../components/ToastProvider";
import { useAuth } from "../../context/AuthContext";

const initialFilters = { query: "", mainCategoryId: "all", subCategoryId: "all", status: "all", linkType: "all", sort: "newest" };
const productPageSize = 200;
const emptyProviderLinkState = {
  error: "",
  loadingProducts: false,
  loadingProviders: false,
  open: false,
  pagination: null,
  product: null,
  providerId: "",
  providerProductId: "",
  providerProducts: [],
  providers: [],
  search: "",
};

export default function ProductsManagementPage() {
  const { token } = useAuth();
  const { showToast } = useToast();
  const [mainCategories, setMainCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [draftFilters, setDraftFilters] = useState(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState(initialFilters);
  const [initialLoading, setInitialLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState("");
  const [actionId, setActionId] = useState("");
  const [pagination, setPagination] = useState(null);
  const [categoryModal, setCategoryModal] = useState({ open: false, type: "main", category: null });
  const [productModal, setProductModal] = useState({ open: false, product: null });
  const [providerLink, setProviderLink] = useState(emptyProviderLinkState);
  const [confirm, setConfirm] = useState({ open: false, kind: "", item: null });

  const categoryLookup = useMemo(
    () => buildAdminCategoryLookup([...mainCategories, ...subCategories]),
    [mainCategories, subCategories],
  );
  const mainById = useMemo(() => Object.fromEntries(mainCategories.map((item) => [item.id, item])), [mainCategories]);
  const subById = useMemo(() => Object.fromEntries(subCategories.map((item) => [item.id, item])), [subCategories]);
  const filteredProducts = useMemo(() => filterProducts(products, appliedFilters), [appliedFilters, products]);
  const activeFiltersCount = countActiveFilters(appliedFilters);

  const loadCatalog = useCallback(async ({ silent = false } = {}) => {
    if (!token) {
      setInitialLoading(false);
      return;
    }

    if (!silent) setInitialLoading(true);
    setProductsLoading(true);
    setLoadError("");

    try {
      const categoryResult = await getAdminCategories(token);
      const nextMainCategories = categoryResult.tree.mainCategories;
      const nextSubCategories = categoryResult.tree.subCategories;
      const nextLookup = buildAdminCategoryLookup([...nextMainCategories, ...nextSubCategories]);
      const productResult = await getAdminProducts(token, { page: 1, limit: productPageSize }, nextLookup);

      setMainCategories(nextMainCategories);
      setSubCategories(nextSubCategories);
      setProducts(productResult.products);
      setPagination(productResult.pagination);
    } catch (error) {
      setLoadError(error.userMessage || "تعذر تحميل كتالوج الإدارة.");
      setMainCategories([]);
      setSubCategories([]);
      setProducts([]);
      setPagination(null);
    } finally {
      setInitialLoading(false);
      setProductsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadCatalog();
  }, [loadCatalog]);

  const updateFilter = (key, value) => {
    setDraftFilters((current) => ({ ...current, [key]: value, ...(key === "mainCategoryId" ? { subCategoryId: "all" } : {}) }));
  };

  const applyFilters = (event) => {
    event.preventDefault();
    setAppliedFilters({ ...draftFilters });
  };

  const resetFilters = () => {
    setDraftFilters({ ...initialFilters });
    setAppliedFilters({ ...initialFilters });
  };

  const openCategoryForm = (type, category = null) => setCategoryModal({ open: true, type, category });
  const closeCategoryForm = () => setCategoryModal({ open: false, type: "main", category: null });
  const closeProductForm = () => setProductModal({ open: false, product: null });

  const saveCategory = async (values) => {
    if (!token || saving) return;

    const editing = Boolean(categoryModal.category);
    const payload = {
      ...values,
      isActive: values.visible !== false,
      parentCategory: categoryModal.type === "sub" ? values.parentId : null,
    };

    setSaving("category");
    try {
      const result = editing
        ? await updateAdminCategory(token, categoryModal.category.id, payload)
        : await createAdminCategory(token, payload);

      closeCategoryForm();
      showToast({
        type: "success",
        title: editing ? "تم تحديث القسم" : "تم إنشاء القسم",
        message: result.message || result.category.name,
      });
      await loadCatalog({ silent: true });
    } catch (error) {
      showToast({
        type: "error",
        title: "فشل حفظ القسم",
        message: error.userMessage || "تعذر حفظ القسم.",
      });
    } finally {
      setSaving("");
    }
  };

  const saveProduct = async (values) => {
    if (!token || saving) return;

    const editing = Boolean(productModal.product);
    setSaving("product");
    let result;

    try {
      result = editing
        ? await updateAdminProduct(token, productModal.product.id, values, categoryLookup, productModal.product)
        : await createAdminProduct(token, values, categoryLookup);
    } catch (error) {
      showToast({
        type: "error",
        title: "فشل حفظ المنتج",
        message: error.userMessage || "تعذر حفظ المنتج.",
      });
      setSaving("");
      return;
    }

    const savedProduct = result.product;

    try {
      if (values.linkType === "automatic") {
        await linkAdminProductProvider(token, savedProduct.id, {
          fulfillmentMode: "AUTO",
          mode: "automatic",
          providerId: values.providerId,
          providerProductId: values.providerProductId,
          syncLimits: values.syncLimits,
          syncName: values.syncName,
          syncPrice: values.syncPrice,
        }, categoryLookup);
      } else if (editing && values.clearProviderLink) {
        await unlinkAdminProductProvider(token, savedProduct.id, categoryLookup);
      }

      setProducts((current) => (
        editing
          ? current.map((product) => (product.id === savedProduct.id ? savedProduct : product))
          : [savedProduct, ...current.filter((product) => product.id !== savedProduct.id)]
      ));
      closeProductForm();
      showToast({
        type: "success",
        title: values.linkType === "automatic" ? "تم ربط المنتج" : editing ? "تم تحديث المنتج" : "تم إنشاء المنتج",
        message: result.message || savedProduct.name,
      });
      await loadCatalog({ silent: true });
    } catch {
      closeProductForm();
      showToast({
        type: "warning",
        title: "فشل ربط المورد",
        message: values.linkType === "automatic"
          ? "تم حفظ المنتج لكن فشل ربط المورد. افتح التعديل وحاول الربط مرة أخرى."
          : "تم حفظ المنتج لكن فشل إلغاء ربط المورد. افتح التعديل وحاول مجددًا.",
      });
      await loadCatalog({ silent: true });
    } finally {
      setSaving("");
    }
  };

  const requestDelete = (kind, item) => setConfirm({ open: true, kind, item });

  const confirmDelete = async () => {
    const { kind, item } = confirm;
    if (!token || !item || actionId) return;

    setActionId(`${kind}:${item.id}`);
    try {
      if (kind === "product") {
        await deleteAdminProduct(token, item.id, categoryLookup);
      } else if (kind === "provider-sync") {
        const result = await syncAdminProductProvider(token, item.id, categoryLookup);
        showToast({
          type: "success",
          title: "تمت مزامنة سعر المورد",
          message: result.message || result.product.name,
        });
      } else if (kind === "main") {
        const children = subCategories.filter((category) => category.parentId === item.id);
        for (const child of children) {
          await deleteAdminCategory(token, child.id);
        }
        await deleteAdminCategory(token, item.id);
      } else {
        await deleteAdminCategory(token, item.id);
      }

      setConfirm({ open: false, kind: "", item: null });
      if (kind !== "provider-sync") {
        showToast({
          type: "success",
          title: "تم الحذف",
          message: `تم حذف ${item.name || item.nameAr} من كتالوج الخادم.`,
        });
      }
      await loadCatalog({ silent: true });
    } catch (error) {
      showToast({
        type: "error",
        title: "فشل الحذف",
        message: error.userMessage || "تعذر حذف العنصر.",
      });
    } finally {
      setActionId("");
    }
  };

  const togglePause = async (product) => {
    if (!token || actionId) return;

    setActionId(`product:${product.id}`);
    try {
      const result = await toggleAdminProduct(token, product.id, categoryLookup);
      showToast({
        type: result.product.isActive ? "success" : "warning",
        title: result.product.isActive ? "تم تفعيل المنتج" : "تم تعطيل المنتج",
        message: result.message || result.product.name,
      });
      await loadCatalog({ silent: true });
    } catch (error) {
      showToast({
        type: "error",
        title: "فشل تحديث الحالة",
        message: error.userMessage || "تعذر تحديث حالة المنتج.",
      });
    } finally {
      setActionId("");
    }
  };

  const loadProviderProductOptions = useCallback(async (providerId, search = "", selectedProductId = "") => {
    if (!token || !providerId) return;

    setProviderLink((current) => ({
      ...current,
      error: "",
      loadingProducts: true,
      providerId,
      search,
    }));

    try {
      const result = await getAdminProductProviderProductOptions(token, providerId, {
        limit: 100,
        page: 1,
        search,
      });
      setProviderLink((current) => ({
        ...current,
        error: "",
        loadingProducts: false,
        pagination: result.pagination,
        providerProductId: selectedProductId || current.providerProductId || result.products[0]?.id || "",
        providerProducts: result.products,
        search,
      }));
    } catch (error) {
      setProviderLink((current) => ({
        ...current,
        error: error.userMessage || "تعذر تحميل خيارات منتجات المورد.",
        loadingProducts: false,
        providerProductId: "",
        providerProducts: [],
      }));
    }
  }, [token]);

  const openProviderLink = async (product) => {
    if (!token || actionId) return;

    setProviderLink({
      ...emptyProviderLinkState,
      loadingProviders: true,
      open: true,
      product,
      providerId: product.providerId || "",
      providerProductId: product.providerProductId || "",
    });

    try {
      const result = await getAdminProductProviderOptions(token);
      const providerId = product.providerId || result.providers[0]?.id || "";
      setProviderLink((current) => ({
        ...current,
        error: "",
        loadingProviders: false,
        providerId,
        providers: result.providers,
      }));
      if (providerId) {
        await loadProviderProductOptions(providerId, "", product.providerProductId || "");
      }
    } catch (error) {
      setProviderLink((current) => ({
        ...current,
        error: error.userMessage || "تعذر تحميل خيارات الموردين.",
        loadingProviders: false,
      }));
    }
  };

  const changeProviderLinkProvider = async (providerId) => {
    setProviderLink((current) => ({
      ...current,
      providerId,
      providerProductId: "",
      providerProducts: [],
    }));
    if (providerId) await loadProviderProductOptions(providerId);
  };

  const saveProviderLink = async () => {
    if (!token || saving || !providerLink.product || !providerLink.providerId || !providerLink.providerProductId) return;

    setSaving("provider-link");
    try {
      const result = await linkAdminProductProvider(token, providerLink.product.id, {
        providerId: providerLink.providerId,
        providerProductId: providerLink.providerProductId,
      }, categoryLookup);
      setProviderLink(emptyProviderLinkState);
      showToast({
        type: "success",
        title: "تم ربط المنتج",
        message: result.message || "تم تحديث ربط المنتج بالمورد.",
      });
      await loadCatalog({ silent: true });
    } catch (error) {
      setProviderLink((current) => ({
        ...current,
        error: error.userMessage || "فشل ربط المنتج بالمورد.",
      }));
    } finally {
      setSaving("");
    }
  };

  const requestProviderSync = (product) => setConfirm({ open: true, kind: "provider-sync", item: product });

  return (
    <div dir="rtl" className="admin-products-page-shell mx-auto w-full min-w-0 max-w-[1600px] space-y-6 overflow-hidden rounded-[26px] bg-[#010617] p-2 pb-8 sm:p-4">
      {initialLoading ? <ManagementLoadingState /> : loadError ? (
        <EmptyState title="تعذر تحميل الكتالوج" description={loadError} actionLabel="حاول مجددًا" onAction={() => loadCatalog()} />
      ) : (
        <>
          <CategoriesCatalog
            mainCategories={mainCategories}
            subCategories={subCategories}
            products={products}
            onAddMain={() => openCategoryForm("main")}
            onAddSub={() => openCategoryForm("sub")}
            onEditMain={(category) => openCategoryForm("main", category)}
            onEditSub={(category) => openCategoryForm("sub", category)}
            onDeleteMain={(category) => requestDelete("main", category)}
            onDeleteSub={(category) => requestDelete("sub", category)}
          />

          <section className="admin-products-section relative space-y-4 overflow-hidden rounded-[22px] border border-[#17327b] bg-[#030b24] p-3 shadow-[0_0_0_1px_rgba(37,99,235,0.08),0_18px_50px_rgba(0,0,0,0.28),0_0_34px_rgba(37,99,235,0.08)] sm:p-4">
            <span className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-violet-600/[0.07] blur-3xl" />
            <div className="relative flex min-w-0 items-center gap-2 px-1 py-1 sm:gap-3 sm:px-2">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-fuchsia-500/60 bg-violet-500/10 text-fuchsia-300 shadow-[0_0_18px_rgba(192,38,211,0.22)]"><LayoutGrid className="h-5 w-5" /></span>
              <h2 className="min-w-0 flex-1 text-xl font-black text-white sm:text-2xl">المنتجات</h2>
              <button type="button" onClick={() => setProductModal({ open: true, product: null })} disabled={saving === "product"} className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-lg border border-fuchsia-400/80 bg-gradient-to-l from-violet-600/35 to-blue-600/30 px-2.5 text-[10px] font-black text-white shadow-[0_0_16px_rgba(192,38,211,0.28)] transition hover:border-fuchsia-300 hover:shadow-[0_0_24px_rgba(192,38,211,0.4)] disabled:opacity-50 sm:gap-2 sm:px-4 sm:text-xs"><PackagePlus className="h-4 w-4" />إضافة منتج</button>
            </div>

            <ProductFilters filters={draftFilters} onChange={updateFilter} onSearch={applyFilters} onReset={resetFilters} mainCategories={mainCategories} subCategories={subCategories} activeCount={activeFiltersCount} />

            {productsLoading ? <ProductCardsSkeleton /> : filteredProducts.length ? (
              <div className="admin-products-panel-table relative w-full max-w-full rounded-xl border border-[#142654] bg-[#02091d] md:overflow-x-auto">
                <table className="hidden w-full min-w-[900px] table-fixed text-right md:table">
                  <thead><tr><ProductTh className="w-[28%]">المنتج</ProductTh><ProductTh>القسم الفرعي</ProductTh><ProductTh>السعر</ProductTh><ProductTh>المخزون</ProductTh><ProductTh>الحالة</ProductTh><ProductTh className="w-36">الإجراءات</ProductTh></tr></thead>
                  <tbody>{filteredProducts.map((product) => (
                    <ProductCard key={product.id} product={product} mainCategory={mainById[product.mainCategoryId]} subCategory={subById[product.subCategoryId]} provider={{ name: product.providerName || (product.isProviderLinked ? "مرتبط بمورد" : "منتج يدوي") }} onEdit={(item) => setProductModal({ open: true, product: item })} onDelete={(item) => requestDelete("product", item)} onProviderLink={openProviderLink} onProviderSync={requestProviderSync} onTogglePause={togglePause} actionBusy={Boolean(actionId)} />
                  ))}</tbody>
                </table>
                <div className="divide-y divide-[#142654] md:hidden">{filteredProducts.map((product) => (
                  <ProductMobileCard key={product.id} product={product} subCategory={subById[product.subCategoryId]} onEdit={(item) => setProductModal({ open: true, product: item })} onDelete={(item) => requestDelete("product", item)} onProviderLink={openProviderLink} onProviderSync={requestProviderSync} onTogglePause={togglePause} actionBusy={Boolean(actionId)} />
                ))}</div>
              </div>
            ) : (
              <EmptyState icon={Search} title="لا توجد منتجات مطابقة" description="غيّر خيارات البحث أو أعد تعيين الفلاتر لعرض كل المنتجات المحملة." actionLabel="إعادة تعيين الفلاتر" onAction={resetFilters} />
            )}
          </section>

          {pagination?.total > productPageSize && (
            <p className="rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-[10px] font-bold text-amber-800 dark:border-amber-400/15 dark:bg-amber-500/10 dark:text-amber-300">
              يتم عرض أول {productPageSize} منتج من الخادم. تُطبّق الفلاتر الدقيقة داخل الصفحة المحملة.
            </p>
          )}
        </>
      )}

      <CategoryFormModal open={categoryModal.open} type={categoryModal.type} category={categoryModal.category} mainCategories={mainCategories} onClose={closeCategoryForm} onSave={saveCategory} saving={saving === "category"} />
      <ProductFormModal open={productModal.open} product={productModal.product} mainCategories={mainCategories} subCategories={subCategories} onClose={closeProductForm} onSave={saveProduct} saving={saving === "product"} />
      <ProductProviderLinkModal
        error={providerLink.error}
        linkState={providerLink}
        loadingProducts={providerLink.loadingProducts}
        loadingProviders={providerLink.loadingProviders}
        onClose={() => !saving && setProviderLink(emptyProviderLinkState)}
        onProviderChange={changeProviderLinkProvider}
        onSearchProducts={(search) => loadProviderProductOptions(providerLink.providerId, search, providerLink.providerProductId)}
        onSubmit={saveProviderLink}
        onUpdate={(values) => setProviderLink((current) => ({ ...current, ...values }))}
        saving={saving === "provider-link"}
      />
      <ConfirmDialog
        open={confirm.open}
        title={confirm.kind === "provider-sync" ? "هل تريد مزامنة سعر المورد؟" : getConfirmTitle(confirm.kind)}
        message={confirm.kind === "provider-sync" ? getProviderSyncConfirmMessage(confirm.item) : getConfirmMessage(confirm.kind, confirm.item)}
        confirmLabel={getConfirmLabel(confirm.kind)}
        onCancel={() => !actionId && setConfirm({ open: false, kind: "", item: null })}
        onConfirm={confirmDelete}
        busy={Boolean(actionId)}
        tone={confirm.kind === "provider-sync" ? "warning" : "danger"}
      />
    </div>
  );
}

function ProductTh({ children, className = "" }) {
  return <th className={`admin-products-table-heading bg-[#060e29] px-4 py-3 text-[10px] font-black text-slate-400 ${className}`}>{children}</th>;
}

function filterProducts(products, filters) {
  const query = filters.query.trim().toLocaleLowerCase("ar");
  return products.filter((product) => {
    const status = product.paused ? "paused" : product.status;
    return (!query || `${product.nameAr} ${product.nameEn}`.toLocaleLowerCase("ar").includes(query)) &&
      (filters.mainCategoryId === "all" || product.mainCategoryId === filters.mainCategoryId) &&
      (filters.subCategoryId === "all" || product.subCategoryId === filters.subCategoryId) &&
      (filters.status === "all" || status === filters.status) &&
      (filters.linkType === "all" || product.linkType === filters.linkType);
  }).sort((first, second) => {
    if (filters.sort === "oldest") return new Date(first.createdAt || 0) - new Date(second.createdAt || 0);
    if (filters.sort === "priceHigh") return second.finalPrice - first.finalPrice;
    if (filters.sort === "priceLow") return first.finalPrice - second.finalPrice;
    if (filters.sort === "displayOrder") return first.displayOrder - second.displayOrder;
    return new Date(second.createdAt || 0) - new Date(first.createdAt || 0);
  });
}

function countActiveFilters(filters) {
  return [filters.query.trim(), filters.mainCategoryId !== "all", filters.subCategoryId !== "all", filters.status !== "all", filters.linkType !== "all", filters.sort !== "newest"].filter(Boolean).length;
}

function getConfirmTitle(kind) {
  return kind === "product" ? "حذف المنتج؟" : kind === "sub" ? "حذف القسم الفرعي؟" : "حذف القسم الرئيسي؟";
}

function getConfirmLabel(kind) {
  return kind === "provider-sync" ? "مزامنة سعر المورد" : "تأكيد الحذف";
}

function getProviderSyncConfirmMessage(item) {
  if (!item) return "";
  return `سيُطلب من الخادم مزامنة بيانات سعر المورد للمنتج "${item.nameAr || item.name}"، ثم ستُحدّث الواجهة البيانات بعد التأكيد.`;
}

function getConfirmMessage(kind, item) {
  if (!item) return "";
  if (kind === "main") return `سيتم حذف "${item.name}" من كتالوج الخادم. المنتجات المرتبطة به ستفقد هذا التصنيف حسب قواعد الخادم.`;
  if (kind === "sub") return `سيتم حذف "${item.name}" من كتالوج الخادم. المنتجات المرتبطة به ستفقد هذا التصنيف حسب قواعد الخادم.`;
  return `سيتم حذف "${item.nameAr}" من كتالوج المنتجات في الخادم.`;
}

function ManagementLoadingState() {
  return <div className="space-y-4"><section className="rounded-[26px] border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-[#111827]"><SkeletonBlock className="h-8 w-44" /><div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">{Array.from({ length: 4 }).map((_, index) => <SkeletonBlock key={index} className="h-44 rounded-[22px]" />)}</div><div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 3 }).map((_, index) => <SkeletonBlock key={index} className="h-20 rounded-[20px]" />)}</div></section><ProductCardsSkeleton /></div>;
}

function ProductCardsSkeleton() {
  return <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3" aria-busy="true">{Array.from({ length: 6 }).map((_, index) => <article key={index} className="rounded-[24px] border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-[#111827]"><SkeletonBlock className="h-36 rounded-2xl" /><SkeletonBlock className="mt-3 h-5 w-3/4" /><div className="mt-3 grid grid-cols-2 gap-2"><SkeletonBlock className="h-12 rounded-xl" /><SkeletonBlock className="h-12 rounded-xl" /></div><SkeletonBlock className="mt-3 h-9 rounded-xl" /></article>)}</div>;
}
