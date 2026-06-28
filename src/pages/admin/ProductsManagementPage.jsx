import { useEffect, useMemo, useRef, useState } from "react";
import { Boxes, PackagePlus, Search, Sparkles } from "lucide-react";
import CategoriesCatalog from "../../components/admin/products/CategoriesCatalog";
import CategoryFormModal from "../../components/admin/products/CategoryFormModal";
import ConfirmDialog from "../../components/admin/products/ConfirmDialog";
import ProductCard from "../../components/admin/products/ProductCard";
import ProductFilters from "../../components/admin/products/ProductFilters";
import ProductFormModal from "../../components/admin/products/ProductFormModal";
import EmptyState from "../../components/EmptyState";
import { SkeletonBlock } from "../../components/Skeletons";
import { useToast } from "../../components/ToastProvider";
import {
  adminProductsSeed,
  mainCategoriesSeed,
  providers,
  subCategoriesSeed,
  supplierProducts,
} from "../../data/adminProducts";

const initialFilters = { query: "", mainCategoryId: "all", subCategoryId: "all", status: "all", linkType: "all", sort: "newest" };

export default function ProductsManagementPage() {
  const [mainCategories, setMainCategories] = useState(mainCategoriesSeed);
  const [subCategories, setSubCategories] = useState(subCategoriesSeed);
  const [products, setProducts] = useState(adminProductsSeed);
  const [draftFilters, setDraftFilters] = useState(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState(initialFilters);
  const [initialLoading, setInitialLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(false);
  const [categoryModal, setCategoryModal] = useState({ open: false, type: "main", category: null });
  const [productModal, setProductModal] = useState({ open: false, product: null });
  const [confirm, setConfirm] = useState({ open: false, kind: "", item: null });
  const loadingTimerRef = useRef(null);
  const { showToast } = useToast();

  useEffect(() => {
    loadingTimerRef.current = window.setTimeout(() => setInitialLoading(false), 650);
    return () => window.clearTimeout(loadingTimerRef.current);
  }, []);

  const mainById = useMemo(() => Object.fromEntries(mainCategories.map((item) => [item.id, item])), [mainCategories]);
  const subById = useMemo(() => Object.fromEntries(subCategories.map((item) => [item.id, item])), [subCategories]);
  const providerById = useMemo(() => Object.fromEntries(providers.map((item) => [item.id, item])), []);
  const filteredProducts = useMemo(() => filterProducts(products, appliedFilters), [appliedFilters, products]);
  const activeFiltersCount = countActiveFilters(appliedFilters);

  const updateFilter = (key, value) => {
    setDraftFilters((current) => ({ ...current, [key]: value, ...(key === "mainCategoryId" ? { subCategoryId: "all" } : {}) }));
  };

  const applyFilters = (event) => {
    event.preventDefault();
    setAppliedFilters({ ...draftFilters });
    setProductsLoading(true);
    window.clearTimeout(loadingTimerRef.current);
    loadingTimerRef.current = window.setTimeout(() => setProductsLoading(false), 280);
  };

  const resetFilters = () => {
    window.clearTimeout(loadingTimerRef.current);
    setDraftFilters({ ...initialFilters });
    setAppliedFilters({ ...initialFilters });
    setProductsLoading(false);
  };

  const openCategoryForm = (type, category = null) => setCategoryModal({ open: true, type, category });

  const saveCategory = (values) => {
    const editing = Boolean(categoryModal.category);
    const nextCategory = editing ? { ...categoryModal.category, ...values } : { ...values, id: `${categoryModal.type === "main" ? "cat" : "sub"}-${Date.now()}` };
    if (categoryModal.type === "main") {
      setMainCategories((current) => editing ? current.map((item) => item.id === nextCategory.id ? nextCategory : item) : [...current, nextCategory]);
    } else {
      setSubCategories((current) => editing ? current.map((item) => item.id === nextCategory.id ? nextCategory : item) : [...current, nextCategory]);
    }
    setCategoryModal({ open: false, type: "main", category: null });
    showToast({ type: "success", title: editing ? "تم تحديث القسم" : "تمت إضافة القسم", message: `تم حفظ “${nextCategory.name}” بنجاح.` });
  };

  const saveProduct = (values) => {
    const editing = Boolean(productModal.product);
    const nextProduct = editing
      ? { ...productModal.product, ...values }
      : { ...values, id: `PRD-${Date.now().toString().slice(-6)}`, createdAt: new Date().toISOString() };
    setProducts((current) => editing ? current.map((item) => item.id === nextProduct.id ? nextProduct : item) : [nextProduct, ...current]);
    setProductModal({ open: false, product: null });
    showToast({ type: "success", title: editing ? "تم تحديث المنتج" : "تمت إضافة المنتج", message: `تم حفظ “${nextProduct.nameAr}” بنجاح.` });
  };

  const requestDelete = (kind, item) => setConfirm({ open: true, kind, item });

  const confirmDelete = () => {
    const { kind, item } = confirm;
    if (kind === "main") {
      const relatedSubIds = new Set(subCategories.filter((sub) => sub.parentId === item.id).map((sub) => sub.id));
      setMainCategories((current) => current.filter((category) => category.id !== item.id));
      setSubCategories((current) => current.filter((category) => category.parentId !== item.id));
      setProducts((current) => current.filter((product) => product.mainCategoryId !== item.id && !relatedSubIds.has(product.subCategoryId)));
    } else if (kind === "sub") {
      setSubCategories((current) => current.filter((category) => category.id !== item.id));
      setProducts((current) => current.map((product) => product.subCategoryId === item.id ? { ...product, subCategoryId: "" } : product));
    } else if (kind === "product") {
      setProducts((current) => current.filter((product) => product.id !== item.id));
    }
    setConfirm({ open: false, kind: "", item: null });
    showToast({ type: "success", title: "تم الحذف بنجاح", message: `تم حذف “${item.name || item.nameAr}” من الكتالوج.` });
  };

  const togglePause = (product) => {
    const nextPaused = !product.paused;
    setProducts((current) => current.map((item) => item.id === product.id ? { ...item, paused: nextPaused } : item));
    showToast({ type: nextPaused ? "warning" : "success", title: nextPaused ? "تم إيقاف البيع مؤقتًا" : "تم استئناف البيع", message: product.nameAr });
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

      {initialLoading ? <ManagementLoadingState /> : (
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
              <button type="button" onClick={() => setProductModal({ open: true, product: null })} className="inline-flex h-10 items-center gap-1.5 rounded-2xl bg-gradient-to-l from-[#7C3AED] to-[#3B82F6] px-3.5 text-[10px] font-black text-white shadow-[0_10px_24px_rgba(124,58,237,0.22)]"><PackagePlus className="h-4 w-4" />إضافة منتج</button>
            </div>

            <ProductFilters filters={draftFilters} onChange={updateFilter} onSearch={applyFilters} onReset={resetFilters} mainCategories={mainCategories} subCategories={subCategories} activeCount={activeFiltersCount} />

            <div className="flex items-center justify-between gap-3 px-1"><p className="text-[10px] font-black text-slate-500 dark:text-slate-300">نتائج المنتجات</p><span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[9px] font-black text-slate-500 dark:border-white/10 dark:bg-[#111827] dark:text-slate-300">{filteredProducts.length.toLocaleString("ar-EG")} نتيجة</span></div>

            {productsLoading ? <ProductCardsSkeleton /> : filteredProducts.length ? (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {filteredProducts.map((product) => <ProductCard key={product.id} product={product} mainCategory={mainById[product.mainCategoryId]} subCategory={subById[product.subCategoryId]} provider={providerById[product.providerId]} onEdit={(item) => setProductModal({ open: true, product: item })} onDelete={(item) => requestDelete("product", item)} onTogglePause={togglePause} />)}
              </div>
            ) : (
              <EmptyState icon={Search} title="لا توجد منتجات مطابقة" description="غيّر خيارات البحث أو أعد تعيين الفلاتر لعرض كل المنتجات." actionLabel="إعادة تعيين الفلاتر" onAction={resetFilters} />
            )}
          </section>
        </>
      )}

      <CategoryFormModal open={categoryModal.open} type={categoryModal.type} category={categoryModal.category} mainCategories={mainCategories} onClose={() => setCategoryModal({ open: false, type: "main", category: null })} onSave={saveCategory} />
      <ProductFormModal open={productModal.open} product={productModal.product} mainCategories={mainCategories} subCategories={subCategories} providers={providers} supplierProducts={supplierProducts} onClose={() => setProductModal({ open: false, product: null })} onSave={saveProduct} />
      <ConfirmDialog open={confirm.open} title={getConfirmTitle(confirm.kind)} message={getConfirmMessage(confirm.kind, confirm.item)} confirmLabel="تأكيد الحذف" onCancel={() => setConfirm({ open: false, kind: "", item: null })} onConfirm={confirmDelete} />
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
    if (filters.sort === "oldest") return new Date(first.createdAt) - new Date(second.createdAt);
    if (filters.sort === "priceHigh") return second.finalPrice - first.finalPrice;
    if (filters.sort === "priceLow") return first.finalPrice - second.finalPrice;
    if (filters.sort === "displayOrder") return first.displayOrder - second.displayOrder;
    return new Date(second.createdAt) - new Date(first.createdAt);
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
  if (kind === "main") return `سيتم حذف “${item.name}” والأقسام الفرعية والمنتجات التابعة له. لا يمكن التراجع عن هذا الإجراء.`;
  if (kind === "sub") return `سيتم حذف “${item.name}”، وستعود المنتجات التابعة له إلى القسم الرئيسي بدون قسم فرعي.`;
  return `سيتم حذف “${item.nameAr}” نهائيًا من كتالوج المنتجات.`;
}

function ManagementLoadingState() {
  return <div className="space-y-4"><section className="rounded-[26px] border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-[#111827]"><SkeletonBlock className="h-8 w-44" /><div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">{Array.from({ length: 4 }).map((_, index) => <SkeletonBlock key={index} className="h-44 rounded-[22px]" />)}</div><div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 3 }).map((_, index) => <SkeletonBlock key={index} className="h-20 rounded-[20px]" />)}</div></section><ProductCardsSkeleton /></div>;
}

function ProductCardsSkeleton() {
  return <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3" aria-busy="true">{Array.from({ length: 6 }).map((_, index) => <article key={index} className="rounded-[24px] border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-[#111827]"><SkeletonBlock className="h-36 rounded-2xl" /><SkeletonBlock className="mt-3 h-5 w-3/4" /><div className="mt-3 grid grid-cols-2 gap-2"><SkeletonBlock className="h-12 rounded-xl" /><SkeletonBlock className="h-12 rounded-xl" /></div><SkeletonBlock className="mt-3 h-9 rounded-xl" /></article>)}</div>;
}
