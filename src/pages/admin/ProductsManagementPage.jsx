import { useCallback, useEffect, useMemo, useState } from "react";
import { Boxes, PackagePlus, Search, Sparkles } from "lucide-react";
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
  getAdminProducts,
  toggleAdminProduct,
  updateAdminProduct,
} from "../../api/adminProducts";
import CategoriesCatalog from "../../components/admin/products/CategoriesCatalog";
import CategoryFormModal from "../../components/admin/products/CategoryFormModal";
import ConfirmDialog from "../../components/admin/products/ConfirmDialog";
import ProductCard from "../../components/admin/products/ProductCard";
import ProductFilters from "../../components/admin/products/ProductFilters";
import ProductFormModal from "../../components/admin/products/ProductFormModal";
import EmptyState from "../../components/EmptyState";
import { SkeletonBlock } from "../../components/Skeletons";
import { useToast } from "../../components/ToastProvider";
import { useAuth } from "../../context/AuthContext";

const initialFilters = { query: "", mainCategoryId: "all", subCategoryId: "all", status: "all", linkType: "all", sort: "newest" };
const productPageSize = 200;

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
      setLoadError(error.userMessage || "Unable to load admin catalog.");
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
        title: editing ? "Category updated" : "Category created",
        message: result.message || result.category.name,
      });
      await loadCatalog({ silent: true });
    } catch (error) {
      showToast({
        type: "error",
        title: "Category save failed",
        message: error.userMessage || "The category could not be saved.",
      });
    } finally {
      setSaving("");
    }
  };

  const saveProduct = async (values) => {
    if (!token || saving) return;

    const editing = Boolean(productModal.product);
    setSaving("product");
    try {
      const result = editing
        ? await updateAdminProduct(token, productModal.product.id, values, categoryLookup)
        : await createAdminProduct(token, values, categoryLookup);

      closeProductForm();
      showToast({
        type: "success",
        title: editing ? "Product updated" : "Product created",
        message: result.message || result.product.name,
      });
      await loadCatalog({ silent: true });
    } catch (error) {
      showToast({
        type: "error",
        title: "Product save failed",
        message: error.userMessage || "The product could not be saved.",
      });
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
      showToast({
        type: "success",
        title: "Deleted",
        message: `${item.name || item.nameAr} was deleted from the backend catalog.`,
      });
      await loadCatalog({ silent: true });
    } catch (error) {
      showToast({
        type: "error",
        title: "Delete failed",
        message: error.userMessage || "The item could not be deleted.",
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
        title: result.product.isActive ? "Product activated" : "Product deactivated",
        message: result.message || result.product.name,
      });
      await loadCatalog({ silent: true });
    } catch (error) {
      showToast({
        type: "error",
        title: "Status update failed",
        message: error.userMessage || "The product status could not be updated.",
      });
    } finally {
      setActionId("");
    }
  };

  return (
    <div dir="rtl" className="space-y-4 sm:space-y-5">
      <section className="relative overflow-hidden rounded-[26px] border border-violet-200/70 bg-gradient-to-l from-white via-sky-50/80 to-violet-50/80 p-5 shadow-[0_18px_48px_rgba(124,58,237,0.09)] sm:p-6 dark:border-white/[0.08] dark:bg-[linear-gradient(135deg,#111827,#0D1324_58%,#17152A)] dark:shadow-[0_0_26px_rgba(139,92,246,0.14)]">
        <span className="pointer-events-none absolute -left-10 -top-14 h-36 w-36 rounded-full bg-violet-400/15 blur-3xl" />
        <div className="relative flex items-center gap-3">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-[18px] bg-gradient-to-br from-[#7C3AED] to-[#3B82F6] text-white shadow-[0_12px_28px_rgba(124,58,237,0.25)]"><Boxes className="h-6 w-6" /></span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2"><h1 className="text-2xl font-black text-slate-950 sm:text-3xl dark:text-white">إدارة المنتجات</h1><span className="rounded-full border border-sky-200 bg-sky-50 px-2 py-1 text-[9px] font-black text-sky-700 dark:border-sky-400/20 dark:bg-sky-400/10 dark:text-sky-300">المنتجات</span></div>
            <p className="mt-1 text-xs font-bold text-slate-500 sm:text-sm dark:text-[#9AA7BD]">تحكم كامل في أقسام المتجر والمنتجات والأسعار.</p>
          </div>
          <Sparkles className="hidden h-6 w-6 text-violet-400/60 sm:block" />
        </div>
      </section>

      {initialLoading ? <ManagementLoadingState /> : loadError ? (
        <EmptyState title="Unable to load catalog" description={loadError} actionLabel="Try again" onAction={() => loadCatalog()} />
      ) : (
        <>
          <CategoriesCatalog
            mainCategories={mainCategories}
            subCategories={subCategories}
            onAddMain={() => openCategoryForm("main")}
            onAddSub={() => openCategoryForm("sub")}
            onEditMain={(category) => openCategoryForm("main", category)}
            onEditSub={(category) => openCategoryForm("sub", category)}
            onDeleteMain={(category) => requestDelete("main", category)}
            onDeleteSub={(category) => requestDelete("sub", category)}
          />

          <section className="space-y-3">
            <div className="flex items-center gap-3 px-1">
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"><PackagePlus className="h-5 w-5" /></span>
              <div className="min-w-0 flex-1"><h2 className="text-base font-black text-slate-950 dark:text-white">المنتجات</h2><p className="mt-0.5 text-[9px] font-bold text-slate-400">{products.length.toLocaleString("ar-EG")} منتجات داخل الكتالوج</p></div>
              <button type="button" onClick={() => setProductModal({ open: true, product: null })} disabled={saving === "product"} className="inline-flex h-10 items-center gap-1.5 rounded-2xl bg-gradient-to-l from-[#7C3AED] to-[#3B82F6] px-3.5 text-[10px] font-black text-white shadow-[0_10px_24px_rgba(124,58,237,0.22)] disabled:cursor-not-allowed disabled:opacity-60"><PackagePlus className="h-4 w-4" />إضافة منتج</button>
            </div>

            <ProductFilters filters={draftFilters} onChange={updateFilter} onSearch={applyFilters} onReset={resetFilters} mainCategories={mainCategories} subCategories={subCategories} activeCount={activeFiltersCount} />

            <div className="flex items-center justify-between gap-3 px-1"><p className="text-[10px] font-black text-slate-500 dark:text-slate-300">نتائج المنتجات</p><span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[9px] font-black text-slate-500 dark:border-white/10 dark:bg-[#111827] dark:text-slate-300">{filteredProducts.length.toLocaleString("ar-EG")} نتيجة</span></div>

            {productsLoading ? <ProductCardsSkeleton /> : filteredProducts.length ? (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    mainCategory={mainById[product.mainCategoryId]}
                    subCategory={subById[product.subCategoryId]}
                    provider={{ name: product.providerName || (product.isProviderLinked ? "Provider linked" : "Manual backend") }}
                    onEdit={(item) => setProductModal({ open: true, product: item })}
                    onDelete={(item) => requestDelete("product", item)}
                    onTogglePause={togglePause}
                    actionBusy={Boolean(actionId)}
                  />
                ))}
              </div>
            ) : (
              <EmptyState icon={Search} title="لا توجد منتجات مطابقة" description="غيّر خيارات البحث أو أعد تعيين الفلاتر لعرض كل المنتجات المحملة." actionLabel="إعادة تعيين الفلاتر" onAction={resetFilters} />
            )}
          </section>

          {pagination?.total > productPageSize && (
            <p className="rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-[10px] font-bold text-amber-800 dark:border-amber-400/15 dark:bg-amber-500/10 dark:text-amber-300">
              Showing the first {productPageSize} backend products. Narrow filters are applied within the loaded page.
            </p>
          )}
        </>
      )}

      <CategoryFormModal open={categoryModal.open} type={categoryModal.type} category={categoryModal.category} mainCategories={mainCategories} onClose={closeCategoryForm} onSave={saveCategory} saving={saving === "category"} />
      <ProductFormModal open={productModal.open} product={productModal.product} mainCategories={mainCategories} subCategories={subCategories} onClose={closeProductForm} onSave={saveProduct} saving={saving === "product"} />
      <ConfirmDialog open={confirm.open} title={getConfirmTitle(confirm.kind)} message={getConfirmMessage(confirm.kind, confirm.item)} confirmLabel="تأكيد الحذف" onCancel={() => !actionId && setConfirm({ open: false, kind: "", item: null })} onConfirm={confirmDelete} busy={Boolean(actionId)} />
    </div>
  );
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

function getConfirmMessage(kind, item) {
  if (!item) return "";
  if (kind === "main") return `سيتم حذف "${item.name}" من backend catalog. المنتجات المرتبطة به ستفقد هذا التصنيف حسب قواعد الخادم.`;
  if (kind === "sub") return `سيتم حذف "${item.name}" من backend catalog. المنتجات المرتبطة به ستفقد هذا التصنيف حسب قواعد الخادم.`;
  return `سيتم حذف "${item.nameAr}" من كتالوج المنتجات في الخادم.`;
}

function ManagementLoadingState() {
  return <div className="space-y-4"><section className="rounded-[26px] border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-[#111827]"><SkeletonBlock className="h-8 w-44" /><div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">{Array.from({ length: 4 }).map((_, index) => <SkeletonBlock key={index} className="h-44 rounded-[22px]" />)}</div><div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 3 }).map((_, index) => <SkeletonBlock key={index} className="h-20 rounded-[20px]" />)}</div></section><ProductCardsSkeleton /></div>;
}

function ProductCardsSkeleton() {
  return <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3" aria-busy="true">{Array.from({ length: 6 }).map((_, index) => <article key={index} className="rounded-[24px] border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-[#111827]"><SkeletonBlock className="h-36 rounded-2xl" /><SkeletonBlock className="mt-3 h-5 w-3/4" /><div className="mt-3 grid grid-cols-2 gap-2"><SkeletonBlock className="h-12 rounded-xl" /><SkeletonBlock className="h-12 rounded-xl" /></div><SkeletonBlock className="mt-3 h-9 rounded-xl" /></article>)}</div>;
}
