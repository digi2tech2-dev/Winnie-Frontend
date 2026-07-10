import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Braces, CircleDollarSign, Info, Save, Settings2, X } from "lucide-react";
import { getAdminProductProviderOptions, getAdminProductProviderProductOptions } from "../../../api/adminProducts";
import BasicProductInfo from "./BasicProductInfo";
import ExtraFieldsBuilder from "./ExtraFieldsBuilder";
import ProductPricing from "./ProductPricing";
import ProductSettings from "./ProductSettings";
import { useAuth } from "../../../context/AuthContext";

const emptyProduct = {
  nameAr: "",
  nameEn: "",
  description: "",
  mainCategoryId: "",
  subCategoryId: "",
  displayOrder: 1,
  image: "",
  imageFile: null,
  linkType: "manual",
  providerId: "",
  providerProductId: "",
  providerProductSearch: "",
  syncLimitsFromProvider: true,
  syncNameFromProvider: false,
  syncPriceFromProvider: false,
  clearProviderLink: false,
  min: 1,
  max: 1,
  originalPrice: 0,
  finalPrice: 0,
  supplierPrice: "",
  supplierMin: 0,
  supplierMax: 0,
  discountPercentage: 0,
  profitMargin: 0,
  status: "available",
  visible: true,
  paused: false,
  extraFields: [],
};

const tabs = [
  { id: "basic", label: "المعلومات الأساسية", shortLabel: "الأساسية", icon: Info, activeClass: "border-sky-400/70 bg-sky-500/15 text-sky-200 shadow-[0_0_20px_rgba(14,165,233,0.16)]", iconClass: "from-sky-500 to-blue-600" },
  { id: "pricing", label: "الكمية والتسعير", shortLabel: "التسعير", icon: CircleDollarSign, activeClass: "border-emerald-400/70 bg-emerald-500/15 text-emerald-200 shadow-[0_0_20px_rgba(16,185,129,0.14)]", iconClass: "from-emerald-500 to-teal-600" },
  { id: "settings", label: "إعدادات المنتج", shortLabel: "الإعدادات", icon: Settings2, activeClass: "border-violet-400/70 bg-violet-500/15 text-violet-200 shadow-[0_0_20px_rgba(139,92,246,0.18)]", iconClass: "from-violet-500 to-fuchsia-600" },
  { id: "fields", label: "الحقول الإضافية", shortLabel: "الحقول", icon: Braces, activeClass: "border-amber-400/70 bg-amber-500/15 text-amber-200 shadow-[0_0_20px_rgba(245,158,11,0.14)]", iconClass: "from-amber-500 to-orange-600" },
];

const emptyProviderLinkState = {
  error: "",
  loadingProducts: false,
  loadingProviders: false,
  pagination: null,
  providerProducts: [],
  providers: [],
};

export default function ProductFormModal({ open, product, mainCategories, subCategories, onClose, onSave, saving = false }) {
  if (!open) return null;
  return createPortal(
    <ProductFormContent
      key={product?.id || "new-product"}
      product={product}
      mainCategories={mainCategories}
      subCategories={subCategories}
      onClose={onClose}
      onSave={onSave}
      saving={saving}
    />,
    document.body,
  );
}

function ProductFormContent({ product, mainCategories, subCategories, onClose, onSave, saving }) {
  const { token } = useAuth();
  const existingProviderLink = hasProviderLink(product);
  const [form, setForm] = useState(() => buildInitialProductForm(product));
  const [activeTab, setActiveTab] = useState("basic");
  const [error, setError] = useState("");
  const [providerLink, setProviderLink] = useState(emptyProviderLinkState);
  const providerOptionsLoaded = useRef(false);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleEscape = (event) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", handleEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  const loadProviderProducts = useCallback(async (providerId, search = "", selectedProductId = "") => {
    if (!token || !providerId) {
      setProviderLink((current) => ({
        ...current,
        loadingProducts: false,
        pagination: null,
        providerProducts: [],
      }));
      return;
    }

    setProviderLink((current) => ({
      ...current,
      error: "",
      loadingProducts: true,
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
        providerProducts: mergeSelectedProductOption(result.products, selectedProductId, product),
      }));
    } catch (loadError) {
      setProviderLink((current) => ({
        ...current,
        error: loadError.userMessage || "تعذر تحميل منتجات المورد.",
        loadingProducts: false,
        pagination: null,
        providerProducts: [],
      }));
    }
  }, [product, token]);

  const loadProviders = useCallback(async (preferredProviderId = "") => {
    if (!token) return "";

    setProviderLink((current) => ({
      ...current,
      error: "",
      loadingProviders: true,
    }));

    try {
      const result = await getAdminProductProviderOptions(token);
      const providers = result.providers.filter((provider) => provider.isActive !== false);
      const selectedProviderId = providers.some((provider) => provider.id === preferredProviderId)
        ? preferredProviderId
        : providers[0]?.id || "";

      setProviderLink((current) => ({
        ...current,
        error: "",
        loadingProviders: false,
        providers,
      }));

      return selectedProviderId;
    } catch (loadError) {
      setProviderLink((current) => ({
        ...current,
        error: loadError.userMessage || "تعذر تحميل الموردين.",
        loadingProviders: false,
        providers: [],
      }));
      return "";
    }
  }, [token]);

  const initializeAutomaticOptions = useCallback(async (preferredProviderId = "", selectedProductId = "") => {
    const providerId = await loadProviders(preferredProviderId);
    if (!providerId) return;
    const selectedProviderProductId = providerId === preferredProviderId ? selectedProductId : "";

    setForm((current) => ({
      ...current,
      providerId,
      providerProductId: selectedProviderProductId,
    }));
    await loadProviderProducts(providerId, "", selectedProviderProductId);
  }, [loadProviderProducts, loadProviders]);

  useEffect(() => {
    if (form.linkType !== "automatic" || providerOptionsLoaded.current) return;

    providerOptionsLoaded.current = true;
    void initializeAutomaticOptions(form.providerId, form.providerProductId);
  }, [form.linkType, form.providerId, form.providerProductId, initializeAutomaticOptions]);

  const update = (key, value) => {
    setError("");
    setForm((current) => ({ ...current, [key]: value }));
  };
  const patch = (values) => {
    setError("");
    setForm((current) => ({ ...current, ...values }));
  };

  const changeLinkMode = (mode) => {
    setError("");
    if (mode === "manual") {
      if (form.linkType === "automatic" && existingProviderLink && !window.confirm("سيتم إزالة ربط المورد الحالي وتحويل المنتج إلى تنفيذ يدوي. هل تريد المتابعة؟")) {
        return;
      }

      setForm((current) => ({
        ...current,
        clearProviderLink: existingProviderLink,
        linkType: "manual",
        providerId: "",
        providerProductId: "",
        providerProductSearch: "",
      }));
      setProviderLink((current) => ({
        ...current,
        error: "",
        loadingProducts: false,
        providerProducts: [],
      }));
      return;
    }

    providerOptionsLoaded.current = false;
    setForm((current) => ({
      ...current,
      clearProviderLink: false,
      linkType: "automatic",
      providerId: current.providerId || product?.providerId || "",
      providerProductId: current.providerProductId || product?.providerProductId || "",
    }));
  };

  const changeProvider = (providerId) => {
    setForm((current) => ({
      ...current,
      providerId,
      providerProductId: "",
      providerProductSearch: "",
    }));
    setProviderLink((current) => ({
      ...current,
      error: "",
      pagination: null,
      providerProducts: [],
    }));
    if (providerId) void loadProviderProducts(providerId);
  };

  const searchProviderProducts = (search) => {
    setForm((current) => ({ ...current, providerProductSearch: search }));
    if (form.providerId) void loadProviderProducts(form.providerId, search, form.providerProductId);
  };

  const selectProviderProduct = (providerProduct) => {
    setError("");
    setForm((current) => ({
      ...current,
      ...buildProviderProductSelectionPatch(providerProduct, current),
    }));
  };

  const submit = (event) => {
    event.preventDefault();
    if (saving) return;
    const selectedProviderProduct = findSelectedProviderProduct(providerLink.providerProducts, form.providerProductId);
    const effectiveForm = form.syncPriceFromProvider
      ? applySupplierPriceSync(form, selectedProviderProduct)
      : form;

    if (!effectiveForm.nameAr.trim() || !effectiveForm.nameEn.trim()) {
      setActiveTab("basic");
      setError("أدخل اسم المنتج بالعربي والإنجليزي.");
      return;
    }
    if (!effectiveForm.mainCategoryId) {
      setActiveTab("basic");
      setError("اختر القسم الرئيسي للمنتج.");
      return;
    }
    if (Number(effectiveForm.finalPrice) <= 0) {
      setActiveTab("pricing");
      setError("السعر النهائي يجب أن يكون أكبر من صفر.");
      return;
    }
    if (Number(effectiveForm.discountPercentage) < 0 || Number(effectiveForm.discountPercentage) > 100) {
      setActiveTab("pricing");
      setError("نسبة الخصم يجب أن تكون بين 0 و100.");
      return;
    }
    if (Number(effectiveForm.min) < 1 || Number(effectiveForm.max) < Number(effectiveForm.min)) {
      setActiveTab("pricing");
      setError("تأكد أن حدود الطلب صحيحة وأن الحد الأقصى لا يقل عن الحد الأدنى.");
      return;
    }
    if (effectiveForm.linkType === "automatic" && !effectiveForm.providerId) {
      setActiveTab("pricing");
      setError("اختر المورد قبل حفظ الربط الآلي.");
      return;
    }
    if (effectiveForm.linkType === "automatic" && !effectiveForm.providerProductId) {
      setActiveTab("pricing");
      setError("اختر منتج المورد قبل حفظ الربط الآلي.");
      return;
    }

    const numericOriginalPrice = Number(effectiveForm.originalPrice) || 0;
    const numericFinalPrice = Number(effectiveForm.finalPrice) || 0;
    const normalizedFields = effectiveForm.extraFields.map((field, index) => ({
      ...field,
      label: field.label.trim() || `حقل ${index + 1}`,
      key: makeFieldKey(field.key || field.label, index),
      options: parseOptions(field),
    }));
    const invalidField = normalizedFields.find((field) => !/^[a-z][a-z0-9_]*$/.test(field.key));
    if (invalidField) {
      setActiveTab("fields");
      setError("اسم الحقل البرمجي يجب أن يبدأ بحرف لاتيني ويستخدم الأحرف الصغيرة والأرقام والشرطة السفلية فقط.");
      return;
    }
    const fieldKeys = normalizedFields.map((field) => field.key);
    if (new Set(fieldKeys).size !== fieldKeys.length) {
      setActiveTab("fields");
      setError("أسماء الحقول البرمجية يجب ألا تتكرر داخل المنتج.");
      return;
    }
    const invalidSelect = normalizedFields.find((field) => field.active !== false && field.type === "select" && !field.options.length);
    if (invalidSelect) {
      setActiveTab("fields");
      setError("حقول الاختيار تحتاج خيارًا واحدًا على الأقل.");
      return;
    }
    const invalidNumberBounds = normalizedFields.find((field) => field.type === "number" && field.min !== "" && field.max !== "" && Number(field.min) > Number(field.max));
    if (invalidNumberBounds) {
      setActiveTab("fields");
      setError("أقل قيمة في الحقل الرقمي لا يمكن أن تكون أكبر من أكبر قيمة.");
      return;
    }

    onSave({
      ...effectiveForm,
      nameAr: effectiveForm.nameAr.trim(),
      nameEn: effectiveForm.nameEn.trim(),
      description: effectiveForm.description.trim(),
      image: effectiveForm.image || "",
      displayOrder: Math.max(1, Number(effectiveForm.displayOrder) || 1),
      min: Math.max(0, Number(effectiveForm.min) || 0),
      max: Math.max(0, Number(effectiveForm.max) || 0),
      supplierPrice: String(effectiveForm.supplierPrice ?? "").trim(),
      supplierMin: Math.max(0, Number(effectiveForm.supplierMin) || 0),
      supplierMax: Math.max(0, Number(effectiveForm.supplierMax) || 0),
      originalPrice: String(effectiveForm.originalPrice ?? "").trim(),
      finalPrice: String(effectiveForm.finalPrice ?? "").trim(),
      discountPercentage: Math.min(100, Math.max(0, Number(effectiveForm.discountPercentage) || 0)),
      profitMargin: numericOriginalPrice > 0 ? Number((((numericFinalPrice - numericOriginalPrice) / numericOriginalPrice) * 100).toFixed(2)) : Number(effectiveForm.profitMargin) || 0,
      clearProviderLink: Boolean(effectiveForm.clearProviderLink),
      extraFields: normalizedFields,
      providerId: effectiveForm.providerId,
      providerProductId: effectiveForm.providerProductId,
      syncLimits: Boolean(effectiveForm.syncLimitsFromProvider),
      syncName: Boolean(effectiveForm.syncNameFromProvider),
      syncPrice: Boolean(effectiveForm.syncPriceFromProvider),
    });
  };

  return (
    <div className="fixed inset-0 z-[130] flex items-end justify-center bg-[#01030b]/85 p-0 backdrop-blur-md sm:items-center sm:p-4" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section role="dialog" aria-modal="true" aria-labelledby="product-form-title" className="dark flex h-[97dvh] w-full max-w-[960px] flex-col overflow-hidden rounded-t-[26px] border border-[#21376d] bg-[#050a18] shadow-[0_0_0_1px_rgba(59,130,246,0.08),0_34px_100px_rgba(0,0,0,0.55),0_0_60px_rgba(124,58,237,0.12)] sm:h-auto sm:max-h-[94vh] sm:rounded-[28px]">
        <header className="relative shrink-0 overflow-hidden border-b border-white/[0.08] bg-[linear-gradient(135deg,#0c1630,#080f22_55%,#120d29)] px-4 pb-4 pt-5 sm:px-6">
          <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-l from-fuchsia-500 via-blue-500 to-emerald-400" />
          <span className="pointer-events-none absolute -left-12 -top-16 h-40 w-40 rounded-full bg-violet-500/10 blur-3xl" />
          <div className="relative flex items-center gap-3">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-violet-400/40 bg-gradient-to-br from-violet-600 to-blue-600 text-white shadow-[0_0_24px_rgba(124,58,237,0.28)]"><Settings2 className="h-5 w-5" /></span>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-black tracking-wide text-violet-300">إدارة المنتجات</p>
              <h2 id="product-form-title" className="mt-1 truncate text-xl font-black text-white sm:text-2xl">{product ? "تعديل المنتج" : "إضافة منتج جديد"}</h2>
            </div>
            <button type="button" onClick={onClose} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[0.05] text-slate-300 transition hover:border-rose-400/40 hover:bg-rose-500/10 hover:text-rose-300"><X className="h-5 w-5" /></button>
          </div>

          <nav className="relative mt-5 grid grid-cols-4 gap-1.5 rounded-2xl border border-white/[0.07] bg-[#030817]/70 p-1.5 sm:gap-2" aria-label="أقسام نموذج المنتج">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const active = tab.id === activeTab;
              return <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} className={`flex min-w-0 flex-col items-center justify-center gap-1.5 rounded-xl border px-1 py-2.5 text-[9px] font-black transition sm:h-12 sm:flex-row sm:gap-2 sm:px-3 sm:text-[11px] ${active ? tab.activeClass : "border-transparent text-slate-500 hover:border-white/10 hover:bg-white/[0.04] hover:text-slate-300"}`}><span className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-gradient-to-br ${tab.iconClass} text-white shadow-md`}><Icon className="h-3.5 w-3.5" /></span><span className="truncate sm:hidden">{tab.shortLabel}</span><span className="hidden truncate sm:inline">{tab.label}</span></button>;
            })}
          </nav>
        </header>

        <form id="product-management-form" onSubmit={submit} className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.05),transparent_38%)] p-3 sm:p-6">
          {activeTab === "basic" && <BasicProductInfo value={form} onChange={update} mainCategories={mainCategories} subCategories={subCategories} />}
          {activeTab === "pricing" && (
            <ProductPricing
              value={form}
              onChange={update}
              onLinkModeChange={changeLinkMode}
              onPatch={patch}
              onProductSearch={searchProviderProducts}
              onProviderChange={changeProvider}
              onProviderProductSelect={selectProviderProduct}
              providerLink={providerLink}
            />
          )}
          {activeTab === "settings" && <ProductSettings value={form} onChange={update} />}
          {activeTab === "fields" && <ExtraFieldsBuilder fields={form.extraFields} onChange={(fields) => update("extraFields", fields)} />}
          {error && <p className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-[10px] font-black text-rose-700 dark:border-rose-400/15 dark:bg-rose-500/10 dark:text-rose-300">{error}</p>}
        </form>

        <footer className="sticky bottom-0 z-10 grid shrink-0 grid-cols-2 gap-2.5 border-t border-white/[0.08] bg-[#0a1226]/95 p-3.5 backdrop-blur-xl sm:flex sm:justify-end sm:px-6">
          <button type="button" onClick={onClose} disabled={saving} className="h-11 rounded-xl border border-white/10 px-6 text-xs font-black text-slate-300 transition hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-60">إلغاء</button>
          <button type="submit" form="product-management-form" disabled={saving} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-violet-400/30 bg-gradient-to-l from-violet-600 to-blue-600 px-7 text-xs font-black text-white shadow-[0_0_24px_rgba(124,58,237,0.24)] transition hover:-translate-y-0.5 hover:shadow-[0_0_30px_rgba(124,58,237,0.34)] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"><Save className="h-4 w-4" />{saving ? "جارٍ الحفظ..." : "حفظ المنتج"}</button>
        </footer>
      </section>
    </div>
  );
}

function hasProviderLink(product) {
  return Boolean(product?.isProviderLinked || product?.providerId || product?.providerProductId);
}

function buildInitialProductForm(product) {
  const providerLinked = hasProviderLink(product);

  return {
    ...emptyProduct,
    ...product,
    clearProviderLink: false,
    extraFields: (product?.extraFields || []).map(cloneExtraField),
    linkType: providerLinked ? "automatic" : product?.linkType || "manual",
    providerId: product?.providerId || "",
    providerProductId: product?.providerProductId || "",
    providerProductSearch: "",
    syncLimitsFromProvider: !providerLinked,
    syncNameFromProvider: false,
    syncPriceFromProvider: providerLinked ? product?.syncPriceWithProvider !== false : false,
  };
}

function mergeSelectedProductOption(products = [], selectedProductId = "", product) {
  if (!selectedProductId || products.some((item) => item.id === selectedProductId)) {
    return products;
  }

  const selectedName = product?.providerProductName || "";
  if (!selectedName) return products;

  return [
    {
      id: selectedProductId,
      externalProductId: product?.providerProductExternalId || "",
      maxQty: product?.providerProductMaxQty ?? null,
      minQty: product?.providerProductMinQty ?? null,
      name: selectedName,
      priceLabel: "",
      rawPrice: product?.supplierPrice || product?.providerPrice || "",
      supplierPrice: product?.supplierPrice || product?.providerPrice || "",
      providerName: product?.providerName || "",
    },
    ...products,
  ];
}

function getSupplierPrice(providerProduct) {
  return String(
    providerProduct?.supplierPrice
    ?? providerProduct?.rawPrice
    ?? providerProduct?.price
    ?? "",
  ).trim();
}

function applySupplierPriceSync(draft, providerProduct) {
  const supplierPrice = getSupplierPrice(providerProduct) || String(draft?.supplierPrice ?? "").trim();
  if (!supplierPrice) return draft;

  return {
    ...draft,
    supplierPrice,
    originalPrice: supplierPrice,
    finalPrice: supplierPrice,
    basePrice: supplierPrice,
  };
}

function buildProviderProductSelectionPatch(providerProduct, current) {
  const supplierPrice = getSupplierPrice(providerProduct);
  const patch = {
    providerProductId: providerProduct.id,
    providerProductExternalId: providerProduct.externalProductId || "",
    providerProductMaxQty: providerProduct.maxQty ?? null,
    providerProductMinQty: providerProduct.minQty ?? null,
    providerProductName: providerProduct.name,
    supplierPrice,
    supplierMin: providerProduct.minQty ?? 0,
    supplierMax: providerProduct.maxQty ?? 0,
  };

  if (current.syncLimitsFromProvider) {
    patch.min = providerProduct.minQty ?? current.min;
    patch.max = providerProduct.maxQty ?? current.max;
  }

  return current.syncPriceFromProvider
    ? applySupplierPriceSync(patch, providerProduct)
    : patch;
}

function findSelectedProviderProduct(products = [], providerProductId = "") {
  return products.find((product) => product.id === providerProductId) || null;
}

function makeFieldKey(label, index) {
  const normalized = String(label || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").replace(/^[^a-z]+/, "");
  return normalized || `field_${index + 1}`;
}

function parseOptions(field) {
  if (Array.isArray(field.options)) return field.options.map((option) => String(option || "").trim()).filter(Boolean);
  return String(field.optionsText || "").split(/[\n,]+/).map((option) => option.trim()).filter(Boolean);
}

function cloneExtraField(field) {
  return {
    ...field,
    optionsText: Array.isArray(field.options) ? field.options.join("\n") : field.optionsText || "",
  };
}
