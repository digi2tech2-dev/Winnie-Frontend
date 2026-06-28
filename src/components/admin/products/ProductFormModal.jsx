import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Braces, CircleDollarSign, Info, Save, Settings2, X } from "lucide-react";
import { emptyProduct } from "../../../data/adminProducts";
import BasicProductInfo from "./BasicProductInfo";
import ExtraFieldsBuilder from "./ExtraFieldsBuilder";
import ProductPricing from "./ProductPricing";
import ProductSettings from "./ProductSettings";

const tabs = [
  { id: "basic", label: "المعلومات الأساسية", shortLabel: "الأساسية", icon: Info },
  { id: "pricing", label: "الكمية والتسعير", shortLabel: "التسعير", icon: CircleDollarSign },
  { id: "settings", label: "إعدادات المنتج", shortLabel: "الإعدادات", icon: Settings2 },
  { id: "fields", label: "الحقول الإضافية", shortLabel: "الحقول", icon: Braces },
];

export default function ProductFormModal({ open, product, mainCategories, subCategories, providers, supplierProducts, onClose, onSave }) {
  if (!open) return null;
  return createPortal(
    <ProductFormContent
      key={product?.id || "new-product"}
      product={product}
      mainCategories={mainCategories}
      subCategories={subCategories}
      providers={providers}
      supplierProducts={supplierProducts}
      onClose={onClose}
      onSave={onSave}
    />,
    document.body,
  );
}

function ProductFormContent({ product, mainCategories, subCategories, providers, supplierProducts, onClose, onSave }) {
  const [form, setForm] = useState(() => ({ ...emptyProduct, ...product, extraFields: (product?.extraFields || []).map((field) => ({ ...field })) }));
  const [activeTab, setActiveTab] = useState("basic");
  const [error, setError] = useState("");

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

  const update = (key, value) => {
    setError("");
    setForm((current) => ({ ...current, [key]: value }));
  };
  const patch = (values) => {
    setError("");
    setForm((current) => ({ ...current, ...values }));
  };

  const submit = (event) => {
    event.preventDefault();
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
    if (form.linkType === "automatic" && (!form.providerId || !form.providerProductId)) {
      setActiveTab("pricing");
      setError("اختر المورد والمنتج المرتبط به قبل الحفظ.");
      return;
    }
    if (Number(form.finalPrice) < 0) {
      setActiveTab("pricing");
      setError("السعر النهائي لا يمكن أن يكون سالبًا.");
      return;
    }

    const numericOriginalPrice = Number(form.originalPrice) || 0;
    const numericFinalPrice = Number(form.finalPrice) || 0;
    const normalizedFields = form.extraFields.map((field, index) => ({
      ...field,
      label: field.label.trim() || `حقل ${index + 1}`,
      key: field.key.trim() || makeFieldKey(field.label, index),
    }));

    onSave({
      ...form,
      nameAr: form.nameAr.trim(),
      nameEn: form.nameEn.trim(),
      description: form.description.trim(),
      image: form.image || "/logo.png",
      displayOrder: Math.max(1, Number(form.displayOrder) || 1),
      min: Math.max(0, Number(form.min) || 0),
      max: Math.max(0, Number(form.max) || 0),
      supplierPrice: Number(form.supplierPrice) || 0,
      supplierMin: Math.max(0, Number(form.supplierMin) || 0),
      supplierMax: Math.max(0, Number(form.supplierMax) || 0),
      originalPrice: numericOriginalPrice,
      finalPrice: numericFinalPrice,
      profitMargin: numericOriginalPrice > 0 ? Number((((numericFinalPrice - numericOriginalPrice) / numericOriginalPrice) * 100).toFixed(2)) : Number(form.profitMargin) || 0,
      providerId: form.linkType === "manual" ? "winnie-manual" : form.providerId,
      providerProductId: form.linkType === "manual" ? "" : form.providerProductId,
      extraFields: normalizedFields,
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
          {activeTab === "pricing" && <ProductPricing value={form} onChange={update} onPatch={patch} providers={providers} supplierProducts={supplierProducts} />}
          {activeTab === "settings" && <ProductSettings value={form} onChange={update} />}
          {activeTab === "fields" && <ExtraFieldsBuilder fields={form.extraFields} onChange={(fields) => update("extraFields", fields)} />}
          {error && <p className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-[10px] font-black text-rose-700 dark:border-rose-400/15 dark:bg-rose-500/10 dark:text-rose-300">{error}</p>}
        </form>

        <footer className="sticky bottom-0 z-10 grid shrink-0 grid-cols-2 gap-2.5 border-t border-slate-200 bg-white/95 p-3.5 backdrop-blur-xl sm:flex sm:justify-end sm:px-5 dark:border-white/[0.08] dark:bg-[#111827]/95">
          <button type="button" onClick={onClose} className="h-11 rounded-2xl border border-slate-200 px-5 text-xs font-black text-slate-600 transition hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/[0.06]">إلغاء</button>
          <button type="submit" form="product-management-form" className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-gradient-to-l from-[#7C3AED] to-[#3B82F6] px-6 text-xs font-black text-white shadow-[0_12px_28px_rgba(124,58,237,0.22)] transition hover:-translate-y-0.5"><Save className="h-4 w-4" />حفظ المنتج</button>
        </footer>
      </section>
    </div>
  );
}

function makeFieldKey(label, index) {
  const normalized = label.trim().toLocaleLowerCase("ar").replace(/[^\p{L}\p{N}]+/gu, "_").replace(/^_+|_+$/g, "");
  return normalized || `field_${index + 1}`;
}
