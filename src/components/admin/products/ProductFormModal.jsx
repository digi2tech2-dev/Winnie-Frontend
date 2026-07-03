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
  profitMargin: 0,
  status: "available",
  visible: true,
  paused: false,
  extraFields: [],
};

const tabs = [
  { id: "basic", label: "المعلومات الأساسية", shortLabel: "الأساسية", icon: Info },
  { id: "pricing", label: "الكمية والتسعير", shortLabel: "التسعير", icon: CircleDollarSign },
  { id: "settings", label: "إعدادات المنتج", shortLabel: "الإعدادات", icon: Settings2 },
  { id: "fields", label: "الحقول الإضافية", shortLabel: "الحقول", icon: Braces },
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
      providerProductId: providerProduct.id,
      providerProductExternalId: providerProduct.externalProductId || "",
      providerProductMaxQty: providerProduct.maxQty ?? null,
      providerProductMinQty: providerProduct.minQty ?? null,
      providerProductName: providerProduct.name,
    }));
  };

  const submit = (event) => {
    event.preventDefault();
    if (saving) return;
    if (!form.nameAr.trim() || !form.nameEn.trim()) {
      setActiveTab("basic");
      setError("أدخل اسم المنتج بالعربي والإنجليزي.");
      return;
    }
    if (!form.mainCategoryId) {
      setActiveTab("basic");
      setError("اختر القسم الرئيسي للمنتج.");
      return;
    }
    if (Number(form.finalPrice) <= 0) {
      setActiveTab("pricing");
      setError("السعر النهائي يجب أن يكون أكبر من صفر.");
      return;
    }
    if (Number(form.min) < 1 || Number(form.max) < Number(form.min)) {
      setActiveTab("pricing");
      setError("تأكد أن حدود الطلب صحيحة وأن الحد الأقصى لا يقل عن الحد الأدنى.");
      return;
    }
    if (form.linkType === "automatic" && !form.providerId) {
      setActiveTab("pricing");
      setError("اختر المورد قبل حفظ الربط الآلي.");
      return;
    }
    if (form.linkType === "automatic" && !form.providerProductId) {
      setActiveTab("pricing");
      setError("اختر منتج المورد قبل حفظ الربط الآلي.");
      return;
    }

    const numericOriginalPrice = Number(form.originalPrice) || 0;
    const numericFinalPrice = Number(form.finalPrice) || 0;
    const normalizedFields = form.extraFields.map((field, index) => ({
      ...field,
      label: field.label.trim() || `حقل ${index + 1}`,
      key: makeFieldKey(field.key || field.label, index),
      options: parseOptions(field),
    }));
    const invalidField = normalizedFields.find((field) => !/^[a-z][a-z0-9_]*$/.test(field.key));
    if (invalidField) {
      setActiveTab("fields");
      setError("اسم الحقل البرمجي يجب أن يبدأ بحرف إنجليزي ويستخدم snake_case فقط.");
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
      ...form,
      nameAr: form.nameAr.trim(),
      nameEn: form.nameEn.trim(),
      description: form.description.trim(),
      image: form.image || "",
      displayOrder: Math.max(1, Number(form.displayOrder) || 1),
      min: Math.max(0, Number(form.min) || 0),
      max: Math.max(0, Number(form.max) || 0),
      supplierPrice: Number(form.supplierPrice) || 0,
      supplierMin: Math.max(0, Number(form.supplierMin) || 0),
      supplierMax: Math.max(0, Number(form.supplierMax) || 0),
      originalPrice: numericOriginalPrice,
      finalPrice: numericFinalPrice,
      profitMargin: numericOriginalPrice > 0 ? Number((((numericFinalPrice - numericOriginalPrice) / numericOriginalPrice) * 100).toFixed(2)) : Number(form.profitMargin) || 0,
      clearProviderLink: Boolean(form.clearProviderLink),
      extraFields: normalizedFields,
      providerId: form.providerId,
      providerProductId: form.providerProductId,
      syncLimits: Boolean(form.syncLimitsFromProvider),
      syncName: Boolean(form.syncNameFromProvider),
      syncPrice: Boolean(form.syncPriceFromProvider),
    });
  };

  return (
    <div className="fixed inset-0 z-[130] flex items-end justify-center bg-slate-950/60 p-0 backdrop-blur-[4px] sm:items-center sm:p-4 dark:bg-[#02040C]/80" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section role="dialog" aria-modal="true" aria-labelledby="product-form-title" className="flex h-[96dvh] w-full max-w-[820px] flex-col overflow-hidden rounded-t-[28px] border border-white/70 bg-[#F8FAFC] shadow-[0_34px_100px_rgba(15,23,42,0.34)] sm:h-auto sm:max-h-[92vh] sm:rounded-[30px] dark:border-white/10 dark:bg-[#080D19] dark:shadow-[0_0_50px_rgba(139,92,246,0.20)]">
        <header className="relative shrink-0 overflow-hidden border-b border-slate-200 bg-white px-4 pb-3 pt-4 sm:px-5 dark:border-white/[0.08] dark:bg-[#111827]">
          <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-l from-[#8B5CF6] via-[#3B82F6] to-[#22C55E]" />
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-blue-500 text-white shadow-[0_10px_24px_rgba(124,58,237,0.22)]"><Settings2 className="h-5 w-5" /></span>
            <div className="min-w-0 flex-1">
              <p className="text-[9px] font-black text-violet-600 dark:text-violet-300">إدارة المنتجات</p>
              <h2 id="product-form-title" className="mt-0.5 truncate text-lg font-black text-slate-950 dark:text-white">{product ? "تعديل المنتج" : "إضافة منتج جديد"}</h2>
            </div>
            <button type="button" onClick={onClose} className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-500 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-300"><X className="h-5 w-5" /></button>
          </div>

          <nav className="no-scrollbar mt-4 flex gap-1.5 overflow-x-auto" aria-label="أقسام نموذج المنتج">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const active = tab.id === activeTab;
              return <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl px-3 text-[9px] font-black transition ${active ? "bg-violet-600 text-white shadow-[0_8px_20px_rgba(124,58,237,0.22)]" : "bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-white/[0.06] dark:text-slate-300 dark:hover:bg-white/[0.10]"}`}><Icon className="h-3.5 w-3.5" /><span className="sm:hidden">{tab.shortLabel}</span><span className="hidden sm:inline">{tab.label}</span></button>;
            })}
          </nav>
        </header>

        <form id="product-management-form" onSubmit={submit} className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3.5 sm:p-5">
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

        <footer className="sticky bottom-0 z-10 grid shrink-0 grid-cols-2 gap-2.5 border-t border-slate-200 bg-white/95 p-3.5 backdrop-blur-xl sm:flex sm:justify-end sm:px-5 dark:border-white/[0.08] dark:bg-[#111827]/95">
          <button type="button" onClick={onClose} disabled={saving} className="h-11 rounded-2xl border border-slate-200 px-5 text-xs font-black text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/[0.06]">إلغاء</button>
          <button type="submit" form="product-management-form" disabled={saving} className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-gradient-to-l from-[#7C3AED] to-[#3B82F6] px-6 text-xs font-black text-white shadow-[0_12px_28px_rgba(124,58,237,0.22)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"><Save className="h-4 w-4" />{saving ? "Saving..." : "حفظ المنتج"}</button>
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
      providerName: product?.providerName || "",
    },
    ...products,
  ];
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
