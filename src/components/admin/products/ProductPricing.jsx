import { AlertTriangle, Bot, CheckCircle2, FlaskConical, Link2, RefreshCw, Search, ShieldCheck, UserRound } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { dryRunFazerCardsProduct, getFazerCardsProductReadiness } from "../../../api/adminProviders";
import { formatSupplierPrice } from "../../../api/adminProducts";
import { Field, inputClassName, Section } from "./BasicProductInfo";

const emptyProviderLink = {
  error: "",
  loadingProducts: false,
  loadingProviders: false,
  providerProducts: [],
  providers: [],
};

const safeTrim = (value) => String(value ?? "").trim();
const asArray = (value) => (Array.isArray(value) ? value : []);

export default function ProductPricing({
  onChange,
  onLinkModeChange,
  onPatch,
  onProductSearch,
  onProviderChange,
  onProviderProductSelect,
  providerLink = emptyProviderLink,
  token,
  value,
}) {
  const automatic = value.linkType === "automatic";
  const selectedProvider = providerLink.providers.find((provider) => provider.id === value.providerId);
  const selectedProduct = providerLink.providerProducts.find((product) => product.id === value.providerProductId)
    || getCurrentProductSummary(value);
  const selectedExternalId = safeTrim(selectedProduct?.externalProductId || value.providerProductExternalId);
  const selectedProviderCode = safeTrim(selectedProvider?.providerCode || selectedProvider?.code || value.providerCode).toUpperCase().replace(/-/g, "_");
  const isFazerCards = selectedProviderCode === "FAZER_CARDS" || selectedProviderCode === "FAZERCARDS" || selectedExternalId.startsWith("FAZER_");
  const priceSynced = Boolean(value.syncPriceFromProvider);
  const limitsSynced = Boolean(value.syncLimitsFromProvider);
  const searchValue = value.providerProductSearch || "";
  const providerProductCount = providerLink.pagination?.total ?? providerLink.providerProducts.length;
  const productId = safeTrim(value.id || value._id);
  const providerMeta = getFazerCardsProviderMeta(value, selectedProduct);
  const visibilityStatus = value.customerVisibilityStatus || {};
  const visibleToCustomer = value.visibleToCustomer === true || visibilityStatus.visibleToCustomer === true;
  const visibilityReasons = value.visibilityReasons || visibilityStatus.reasons || [];
  const manualFieldWarning = isFazerCards ? getManualFieldWarning(value, providerMeta) : null;
  const requiredFieldsLabel = asArray(providerMeta.requiredFields)
    .map((field) => field.label || field.key || field.name)
    .filter(Boolean)
    .join("، ") || "لا توجد حقول إضافية";
  const [providerTool, setProviderTool] = useState({
    busy: "",
    dryRun: null,
    error: "",
    readiness: null,
  });
  const searchTimerRef = useRef(null);

  useEffect(() => () => clearTimeout(searchTimerRef.current), []);
  useEffect(() => {
    setProviderTool({ busy: "", dryRun: null, error: "", readiness: null });
  }, [productId, value.providerProductId]);

  const updateLimit = (field, nextValue) => {
    onPatch({
      [field]: nextValue,
      syncLimitsFromProvider: false,
    });
  };

  const updatePrice = (field, nextValue) => {
    onPatch({
      [field]: nextValue,
      ...(field === "finalPrice" ? { basePrice: nextValue } : {}),
      syncPriceFromProvider: false,
      syncPriceWithProvider: false,
    });
  };

  const updateProductSearch = (nextValue) => {
    onPatch({ providerProductSearch: nextValue });
    clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      if (value.providerId) onProductSearch(nextValue);
    }, 450);
  };

  const runFazerCardsReadiness = async () => {
    if (!token || !productId || providerTool.busy) return;
    setProviderTool((current) => ({ ...current, busy: "readiness", error: "", readiness: null }));
    try {
      const result = await getFazerCardsProductReadiness(token, productId);
      setProviderTool((current) => ({ ...current, busy: "", readiness: result.readiness || null }));
    } catch (error) {
      setProviderTool((current) => ({
        ...current,
        busy: "",
        error: error.userMessage || error.message || "Could not check FazerCards readiness.",
      }));
    }
  };

  const runFazerCardsDryRun = async () => {
    if (!token || !productId || providerTool.busy) return;

    const requiredFields = providerMeta.requiredFields || [];
    let fields = {};
    if (requiredFields.length) {
      const template = requiredFields.reduce((acc, field) => {
        const key = field.key || field.id || field.label;
        if (key) acc[key] = "";
        return acc;
      }, {});
      const rawFields = window.prompt("Enter payload preview fields JSON. This does not create an order.", JSON.stringify(template, null, 2));
      if (rawFields === null) return;
      try {
        fields = JSON.parse(rawFields || "{}");
      } catch {
        setProviderTool((current) => ({ ...current, error: "Payload preview fields must be valid JSON." }));
        return;
      }
    }

    const rawQuantity = providerMeta.fulfillmentMode === "TOPUP_WITH_FIELDS"
      ? "1"
      : window.prompt("Payload preview quantity. This does not create an order.", "1");
    if (rawQuantity === null) return;

    setProviderTool((current) => ({ ...current, busy: "dry-run", dryRun: null, error: "" }));
    try {
      const result = await dryRunFazerCardsProduct(token, productId, {
        fields,
        quantity: Number(rawQuantity || 1),
      });
      setProviderTool((current) => ({ ...current, busy: "", dryRun: result.dryRun || null }));
    } catch (error) {
      setProviderTool((current) => ({
        ...current,
        busy: "",
        error: error.userMessage || error.message || "Could not build FazerCards dry-run preview.",
      }));
    }
  };

  return (
    <Section title="الكمية والتسعير" description="حدد حدود الطلب والسعر الأساسي، واختر طريقة تنفيذ المنتج.">
      <div className="flex flex-col">
      <div className="order-1 grid grid-cols-2 gap-2.5 sm:gap-3">
        <TypeButton active={!automatic} tone="manual" icon={UserRound} title="ربط يدوي" description="منتج يدوي من لوحة الإدارة" onClick={() => onLinkModeChange("manual")} />
        <TypeButton active={automatic} tone="automatic" icon={Bot} title="ربط آلي" description="تنفيذ الطلبات عبر مورد" onClick={() => onLinkModeChange("automatic")} />
      </div>

      <div className="order-3 mt-4 grid grid-cols-2 gap-2.5 sm:mt-5 sm:gap-4">
        <NumberField label="الحد الأدنى للطلب" value={value.min} onChange={(next) => updateLimit("min", next)} min="1" disabled={limitsSynced} disabledMessage="ألغِ مزامنة حدود الطلب للتعديل يدويًا" />
        <NumberField label="الحد الأقصى للطلب" value={value.max} onChange={(next) => updateLimit("max", next)} min="1" disabled={limitsSynced} disabledMessage="ألغِ مزامنة حدود الطلب للتعديل يدويًا" />
        <NumberField label="السعر الأصلي" value={value.originalPrice} onChange={(next) => updatePrice("originalPrice", next)} step="any" disabled={priceSynced} disabledMessage="ألغِ مزامنة السعر من المورد للتعديل يدويًا" />
        <NumberField label="السعر النهائي" value={value.finalPrice} onChange={(next) => updatePrice("finalPrice", next)} step="any" disabled={priceSynced} disabledMessage="ألغِ مزامنة السعر من المورد للتعديل يدويًا" />
        <NumberField className="col-span-2" label="نسبة الخصم %" value={value.discountPercentage} onChange={(next) => onChange("discountPercentage", next)} min="0" max="100" step="1" />
      </div>

      {automatic && (
        <div className="order-2 mt-4 space-y-3 rounded-2xl border border-sky-400/20 bg-sky-500/[0.08] p-3 sm:p-4">
          <div className="flex items-start gap-2">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-sky-500/12 text-sky-700 dark:text-sky-300">
              <Link2 className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <h4 className="text-[11px] font-black text-slate-900 dark:text-white">إعداد الربط الآلي</h4>
              <p className="mt-0.5 text-[9px] font-bold leading-5 text-slate-500 dark:text-slate-300">سيتم تنفيذ الطلبات تلقائيًا من خلال المورد المختار.</p>
              <p className="text-[9px] font-bold leading-5 text-slate-500 dark:text-slate-300">بيانات توثيق المورد لا تظهر هنا.</p>
            </div>
            <span className="inline-flex shrink-0 items-center rounded-full border border-sky-400/20 bg-sky-500/10 px-2.5 py-1.5 text-[9px] font-black text-sky-300">
              {providerLink.loadingProducts ? "جارٍ التحميل" : `${providerProductCount.toLocaleString("ar-EG-u-nu-latn")} منتج`}
            </span>
          </div>

          {providerLink.error && (
            <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-2.5 text-[10px] font-bold text-rose-700 dark:border-rose-400/20 dark:bg-rose-500/10 dark:text-rose-200">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{providerLink.error}</span>
            </div>
          )}

          <Field label="المورد">
            <select
              value={value.providerId || ""}
              onChange={(event) => onProviderChange(event.target.value)}
              disabled={providerLink.loadingProviders}
              className={inputClassName}
            >
              <option value="">{providerLink.loadingProviders ? "جاري تحميل الموردين..." : "اختر المورد"}</option>
              {providerLink.providers.map((provider) => (
                <option key={provider.id} value={provider.id}>
                  {provider.name}{provider.code ? ` (${provider.code})` : ""}
                </option>
              ))}
            </select>
          </Field>

          {!providerLink.loadingProviders && !providerLink.providers.length && (
            <p className="rounded-xl border border-amber-200 bg-amber-50 p-2.5 text-[10px] font-bold text-amber-800 dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-200">لا توجد موردين نشطين متاحين للربط.</p>
          )}

          {selectedProvider && selectedProvider.credentialConfigured === false && (
            <p className="rounded-xl border border-amber-200 bg-amber-50 p-2.5 text-[10px] font-bold text-amber-800 dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-200">تنبيه: هذا المورد لا يظهر كبيانات توثيق مكتملة.</p>
          )}

          <div className="rounded-2xl border border-cyan-400/25 bg-gradient-to-l from-cyan-500/[0.08] to-blue-500/[0.06] p-2.5 shadow-[0_0_20px_rgba(6,182,212,0.06)]">
            <div className="mb-2 flex items-center justify-between gap-3 px-1">
              <span className="text-[10px] font-black text-cyan-200">البحث في منتجات المورد</span>
              <span className="text-[8px] font-bold text-slate-500">يبحث تلقائيًا أثناء الكتابة</span>
            </div>
            <label className="relative block min-w-0">
              <span className="pointer-events-none absolute left-1 top-1 grid h-9 w-9 place-items-center rounded-lg border border-cyan-400/30 bg-cyan-500/15 text-cyan-300">
                {providerLink.loadingProducts ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              </span>
              <input
                value={searchValue}
                onChange={(event) => updateProductSearch(event.target.value)}
                disabled={!value.providerId}
                placeholder="اكتب اسم المنتج أو المعرّف..."
                className="h-11 w-full rounded-xl border border-cyan-400/20 bg-[#040c1e] py-0 pl-12 pr-3 text-[11px] font-bold text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400/60 focus:ring-4 focus:ring-cyan-500/10"
              />
            </label>
          </div>

          {!providerLink.loadingProducts && value.providerId && (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.07] bg-[#071126] px-3 py-2 text-[9px] font-bold text-slate-400">
              <span>{searchValue ? "نتائج البحث في منتجات المورد" : "منتجات المورد المتاحة"}</span>
              <strong className="text-sky-300">{providerProductCount.toLocaleString("ar-EG-u-nu-latn")} منتج</strong>
            </div>
          )}

          <div className="grid max-h-60 gap-2 overflow-y-auto rounded-2xl border border-white/70 bg-white/70 p-2 dark:border-white/10 dark:bg-[#0B1220]/60">
            {!value.providerId ? (
              <EmptyProviderMessage text="اختر موردًا لتحميل المنتجات." />
            ) : providerLink.loadingProducts ? (
              <EmptyProviderMessage spinning text="جاري تحميل منتجات المورد..." />
            ) : providerLink.providerProducts.length ? (
              providerLink.providerProducts.map((product) => (
                <ProviderProductButton
                  key={product.id}
                  product={product}
                  selected={product.id === value.providerProductId}
                  onClick={() => onProviderProductSelect(product)}
                />
              ))
            ) : (
              <EmptyProviderMessage text={searchValue ? "لا توجد منتجات مطابقة للبحث." : "لم تتم مزامنة منتجات لهذا المورد بعد."} />
            )}
          </div>

          {selectedProduct && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-[10px] font-bold text-emerald-800 dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-200">
              <p className="flex items-center gap-1.5 font-black">
                <CheckCircle2 className="h-4 w-4" />
                {selectedProduct.name}
              </p>
              <div className="mt-2 grid gap-1 sm:grid-cols-3">
                <SummaryItem label="المعرف الخارجي" value={selectedProduct.externalProductId || "-"} />
                <SummaryItem label="الكمية" value={`${selectedProduct.minQty ?? "-"} - ${selectedProduct.maxQty ?? "-"}`} />
                <SummaryItem label="السعر" value={selectedProduct.priceLabel || "-"} />
              </div>
            </div>
          )}

          <div className="grid gap-2 sm:grid-cols-3">
            <CheckboxField checked={Boolean(value.syncPriceFromProvider)} label="مزامنة السعر من المورد" onChange={(checked) => {
              const supplierPrice = checked ? getExactSupplierPrice(selectedProduct) : "";
              onPatch({
                syncPriceFromProvider: checked,
                syncPriceWithProvider: checked,
                ...(supplierPrice ? {
                  supplierPrice,
                  originalPrice: supplierPrice,
                  finalPrice: supplierPrice,
                  basePrice: supplierPrice,
                } : {}),
              });
            }} />
            <CheckboxField checked={Boolean(value.syncLimitsFromProvider)} label="مزامنة حدود الطلب" onChange={(checked) => onPatch({
              syncLimitsFromProvider: checked,
              ...(checked && selectedProduct ? {
                min: selectedProduct.minQty ?? value.min,
                max: selectedProduct.maxQty ?? value.max,
              } : {}),
            })} />
            <CheckboxField checked={Boolean(value.syncNameFromProvider)} label="مزامنة اسم المنتج" onChange={(checked) => onPatch({ syncNameFromProvider: checked })} />
          </div>

          {isFazerCards && (
            <div className="rounded-2xl border border-amber-300/30 bg-amber-500/10 p-3 text-[10px] font-bold text-amber-900 dark:text-amber-100">
              <div className="mb-3 grid gap-1 sm:grid-cols-3">
                <SummaryItem label="Customer visibility" value={visibleToCustomer ? "Visible to customers" : "Not visible to customers"} />
                <SummaryItem label="Fulfillment" value={value.providerExecutionMode === "AUTO_PROVIDER" ? "تنفيذ تلقائي من المورد" : value.providerExecutionMode === "DISABLED" ? "معطل" : "تنفيذ الطلب"} />
                <SummaryItem label="Required fields" value={requiredFieldsLabel} />
                <SummaryItem label="Stock" value={providerMeta.stockLabel || "Unknown"} />
              </div>
              {!visibleToCustomer && visibilityReasons.length > 0 && (
                <p className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[10px] font-black text-amber-800 dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-100">
                  لا يمكن نشر المنتج بعد: {visibilityReasons.join(", ")}
                </p>
              )}
              {manualFieldWarning && (
                <p className="mb-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-[10px] font-black text-rose-700 dark:border-rose-400/20 dark:bg-rose-500/10 dark:text-rose-200">
                  هذا المنتج يحتاج حقولاً يملؤها العميل قبل النشر.
                  {manualFieldWarning.suggestions.length ? ` مقترح: ${manualFieldWarning.suggestions.join(" / ")}` : ""}
                </p>
              )}
              <CheckboxField
                checked={Boolean(value.providerExecutionEnabled)}
                disabled={Boolean(value.providerExecutionBlocked)}
                label="تفعيل التنفيذ التلقائي من FazerCards"
                onChange={(checked) => onPatch({ providerExecutionEnabled: checked })}
              />
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <CheckboxField
                  checked={Boolean(value.customerPurchaseEnabled)}
                  label="إتاحة الشراء للعملاء"
                  onChange={(checked) => onPatch({ customerPurchaseEnabled: checked })}
                />
                <Field label="طريقة التنفيذ">
                  <select
                    className={inputClassName}
                    value={value.providerExecutionMode || "MANUAL_FULFILLMENT"}
                    onChange={(event) => onPatch({
                      providerExecutionMode: event.target.value,
                      ...(event.target.value !== "AUTO_PROVIDER" ? { providerExecutionEnabled: false } : {}),
                    })}
                  >
                    <option value="AUTO_PROVIDER">تنفيذ تلقائي من المورد</option>
                    <option value="MANUAL_FULFILLMENT">تنفيذ الطلب</option>
                    <option value="DISABLED">معطل</option>
                  </select>
                </Field>
              </div>
              <p className="mt-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[10px] font-black text-amber-800 dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-100">
                سيظهر المنتج للعملاء فقط عندما يكون نشطاً، ظاهراً في المتجر، متاحاً، ومفعلاً للشراء.
              </p>
              <p className="mt-2 leading-5">
                التنفيذ التلقائي يظل مرتبطاً بإعدادات السيرفر، بينما نشر المنتج للعملاء يتم التحكم به من هنا.
              </p>
              {value.providerExecutionBlocked && (
                <p className="mt-1 rounded-xl bg-rose-500/10 px-3 py-2 text-rose-700 dark:text-rose-200">
                  هذا المنتج يحتاج مراجعة إعدادات التنفيذ{providerMeta.blockReason ? `: ${providerMeta.blockReason}` : "."}
                </p>
              )}
              <details className="mt-3 rounded-xl border border-slate-200 bg-white/70 p-2 dark:border-white/10 dark:bg-[#0B1220]">
                <summary className="cursor-pointer text-[10px] font-black text-slate-600 dark:text-slate-200">Advanced provider tools</summary>
                <div className="mt-2 grid gap-1 sm:grid-cols-3">
                  <SummaryItem label="Provider" value="FazerCards" />
                  <SummaryItem label="Family" value={providerMeta.familyKey || "UNKNOWN"} />
                  <SummaryItem label="Mode" value={providerMeta.fulfillmentMode || "UNKNOWN"} />
                  <SummaryItem label="External ID" value={providerMeta.externalProductId || "-"} />
                  <SummaryItem label="Provider cost" value={providerMeta.priceLabel || "-"} />
                  <SummaryItem label="Region" value={providerMeta.region || "-"} />
                  <SummaryItem label="Platform" value={providerMeta.platform || "-"} />
                  <SummaryItem label="Block reason" value={providerMeta.blockReason || "-"} />
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={runFazerCardsReadiness}
                    disabled={!token || !productId || Boolean(providerTool.busy)}
                    className="inline-flex h-9 items-center gap-1 rounded-xl border border-emerald-300/40 px-3 text-[9px] font-black text-emerald-700 disabled:opacity-50 dark:text-emerald-200"
                  >
                    <ShieldCheck className="h-3.5 w-3.5" />
                    {providerTool.busy === "readiness" ? "Checking..." : "Readiness"}
                  </button>
                  <button
                    type="button"
                    onClick={runFazerCardsDryRun}
                    disabled={!token || !productId || Boolean(providerTool.busy)}
                    className="inline-flex h-9 items-center gap-1 rounded-xl border border-amber-300/40 px-3 text-[9px] font-black text-amber-700 disabled:opacity-50 dark:text-amber-100"
                  >
                    <FlaskConical className="h-3.5 w-3.5" />
                    {providerTool.busy === "dry-run" ? "Building..." : "Payload preview"}
                  </button>
                </div>
              </details>
              {providerTool.error && (
                <p className="mt-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-[10px] font-black text-rose-700 dark:border-rose-400/20 dark:bg-rose-500/10 dark:text-rose-200">{providerTool.error}</p>
              )}
              {providerTool.readiness && (
                <div className="mt-2 rounded-xl border border-emerald-200 bg-emerald-50 p-2 text-[9px] font-bold text-emerald-800 dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-200">
                  <p className="font-black">Auto provider ready: {providerTool.readiness.readyForLiveExecution ? "yes" : "no"}</p>
                  {providerTool.readiness.contract && (
                    <div className="mt-2 grid gap-1 sm:grid-cols-2">
                      <SummaryItem label="Support stage" value={providerTool.readiness.supportStage || providerTool.readiness.contract.supportStage || "-"} />
                      <SummaryItem label="Execution stage" value={providerTool.readiness.executionStage || providerTool.readiness.contract.executionStage || "-"} />
                      <SummaryItem label="Customer purchase" value={providerTool.readiness.canCustomerPurchase ? "ready" : "not ready"} />
                      <SummaryItem label="Controlled provider run" value={providerTool.readiness.canLivePilot ? "available" : "not available"} />
                      <SummaryItem label="Storage" value={providerTool.readiness.contract.storageStrategy || "-"} />
                      <SummaryItem label="Delivery" value={providerTool.readiness.contract.customerDeliveryStrategy || "-"} />
                    </div>
                  )}
                  {providerTool.readiness.contract?.providerPayloadSchema && (
                    <pre dir="ltr" className="mt-2 max-h-24 overflow-auto rounded-lg bg-slate-950 p-2 text-left text-[8px] text-slate-100">{JSON.stringify(providerTool.readiness.contract.providerPayloadSchema, null, 2)}</pre>
                  )}
                  {(providerTool.readiness.blockers || []).slice(0, 3).map((blocker) => <p key={blocker}>Blocker: {blocker}</p>)}
                  {(providerTool.readiness.missingCapabilities || []).slice(0, 3).map((capability) => <p key={capability}>Missing: {capability}</p>)}
                  {(providerTool.readiness.warnings || []).slice(0, 3).map((warning) => <p key={warning}>{warning}</p>)}
                </div>
              )}
              {providerTool.dryRun && (
                <div className="mt-2 rounded-xl border border-slate-200 bg-white/70 p-2 text-[9px] font-bold text-slate-700 dark:border-white/10 dark:bg-[#0B1220] dark:text-slate-200">
                  <p className="font-black">Would call: {providerTool.dryRun.wouldCall || "No supplier endpoint"}</p>
                  <pre dir="ltr" className="mt-1 max-h-28 overflow-auto rounded-lg bg-slate-950 p-2 text-left text-[8px] text-slate-100">{JSON.stringify(providerTool.dryRun.payload || {}, null, 2)}</pre>
                  <p className="mt-1 text-amber-600 dark:text-amber-300">معاينة فقط. لم يتم إنشاء طلب لدى المورد.</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
      </div>
    </Section>
  );
}

function TypeButton({ active, icon: Icon, title, description, onClick, tone }) {
  const activeTone = tone === "manual"
    ? "border-sky-400/60 bg-sky-500/15 shadow-[0_0_22px_rgba(14,165,233,0.15)]"
    : "border-fuchsia-400/60 bg-violet-500/15 shadow-[0_0_22px_rgba(168,85,247,0.16)]";
  const iconTone = tone === "manual" ? "from-sky-500 to-blue-600" : "from-violet-500 to-fuchsia-600";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-w-0 items-center gap-2 rounded-xl border p-2.5 text-right transition sm:gap-3 sm:rounded-2xl sm:p-4 ${active ? activeTone : "border-[#203664] bg-[#071126] hover:border-violet-400/40"}`}
    >
      <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg sm:h-9 sm:w-9 sm:rounded-xl ${active ? `bg-gradient-to-br ${iconTone} text-white` : "bg-white/[0.06] text-slate-400"}`}>
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0">
        <strong className="block truncate text-[10px] text-white sm:text-xs">{title}</strong>
        <span className="mt-0.5 block truncate text-[8px] font-bold text-slate-400 sm:mt-1 sm:text-[9px]">{description}</span>
      </span>
    </button>
  );
}

function NumberField({ className = "", disabled = false, disabledMessage = "", label, value, onChange, min = "0", max, step = "1" }) {
  return (
    <Field label={label} className={className}>
      <input
        type="number"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        title={disabled ? disabledMessage : undefined}
        onChange={(event) => onChange(event.target.value)}
        className={`${inputClassName} disabled:border-slate-700/60 disabled:bg-slate-900/70 disabled:text-slate-500 disabled:opacity-70`}
      />
    </Field>
  );
}

function ProviderProductButton({ onClick, product, selected }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border p-2.5 text-right transition ${selected ? "border-violet-300 bg-violet-50 dark:border-violet-400/30 dark:bg-violet-500/10" : "border-slate-200 bg-white hover:border-violet-200 dark:border-white/10 dark:bg-[#111827]"}`}
    >
      <strong className="block truncate text-[11px] font-black text-slate-900 dark:text-white">{product.name}</strong>
      <span className="mt-1 block truncate text-[9px] font-bold text-slate-500 dark:text-slate-400">
        {product.externalProductId || "بدون معرف خارجي"} | {product.minQty ?? "-"} - {product.maxQty ?? "-"}{product.priceLabel ? ` | ${product.priceLabel}` : ""}
      </span>
    </button>
  );
}

function CheckboxField({ checked, disabled = false, label, onChange }) {
  return (
    <label className={`flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[10px] font-black text-slate-700 dark:border-white/10 dark:bg-[#0B1220] dark:text-slate-200 ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}>
      <input type="checkbox" checked={checked} disabled={disabled} onChange={(event) => onChange(event.target.checked)} className="h-4 w-4 accent-violet-600" />
      <span>{label}</span>
    </label>
  );
}

function EmptyProviderMessage({ spinning = false, text }) {
  return (
    <p className="flex min-h-20 items-center justify-center gap-2 rounded-xl bg-slate-50 p-3 text-center text-[10px] font-black text-slate-400 dark:bg-[#111827]">
      {spinning && <RefreshCw className="h-4 w-4 animate-spin" />}
      {text}
    </p>
  );
}

function SummaryItem({ label, value }) {
  return (
    <span className="rounded-xl bg-white/70 px-2 py-1.5 dark:bg-white/[0.06]">
      <span className="block text-[8px] text-emerald-700/70 dark:text-emerald-100/70">{label}</span>
      <span className="mt-0.5 block truncate font-black">{value}</span>
    </span>
  );
}

function getCurrentProductSummary(value) {
  if (!value.providerProductId || !value.providerProductName) return null;

  const supplierPrice = safeTrim(value.supplierPrice || value.providerPrice || value.rawPrice);

  return {
    id: safeTrim(value.providerProductId),
    externalProductId: safeTrim(value.providerProductExternalId),
    familyKey: safeTrim(value.familyKey || value.providerProductFamilyKey),
    fulfillmentMode: safeTrim(value.fulfillmentMode || value.providerProductFulfillmentMode),
    maxQty: value.providerProductMaxQty ?? null,
    minQty: value.providerProductMinQty ?? null,
    name: safeTrim(value.providerProductName),
    platform: safeTrim(value.providerPlatform),
    priceLabel: supplierPrice ? formatSupplierPrice(supplierPrice) : "",
    rawPrice: supplierPrice,
    region: safeTrim(value.providerRegion),
    requiredFields: Array.isArray(value.providerProductRequiredFields) ? value.providerProductRequiredFields : [],
    stock: value.providerStock ?? null,
    supplierPrice,
  };
}

function getFazerCardsProviderMeta(value = {}, selectedProduct = {}) {
  const familyKey = safeTrim(value.familyKey || selectedProduct?.familyKey || value.providerProductFamilyKey);
  const fulfillmentMode = safeTrim(value.fulfillmentMode || selectedProduct?.fulfillmentMode || value.providerProductFulfillmentMode);
  const stock = value.providerStock ?? selectedProduct?.stock ?? null;
  const supplierPrice = safeTrim(value.supplierPrice || selectedProduct?.supplierPrice || selectedProduct?.rawPrice || selectedProduct?.price);

  return {
    blockReason: safeTrim(value.providerBlockReason || selectedProduct?.blockReason),
    externalProductId: safeTrim(value.providerProductExternalId || selectedProduct?.externalProductId),
    familyKey,
    fulfillmentMode,
    platform: safeTrim(value.providerPlatform || selectedProduct?.platform),
    priceLabel: supplierPrice ? formatSupplierPrice(supplierPrice) : selectedProduct?.priceLabel || "",
    region: safeTrim(value.providerRegion || selectedProduct?.region),
    requiredFields: Array.isArray(value.providerProductRequiredFields)
      ? value.providerProductRequiredFields
      : Array.isArray(selectedProduct?.requiredFields)
        ? selectedProduct.requiredFields
        : [],
    stock,
    stockLabel: stock === undefined || stock === null || stock === "" ? "Unknown" : String(stock),
  };
}

function getManualFieldWarning(value = {}, providerMeta = {}) {
  const familyKey = safeTrim(value.familyKey || providerMeta.familyKey).toUpperCase();
  const fulfillmentMode = safeTrim(value.fulfillmentMode || providerMeta.fulfillmentMode).toUpperCase();
  const executionMode = safeTrim(value.providerExecutionMode || "MANUAL_FULFILLMENT").toUpperCase();
  if (executionMode !== "MANUAL_FULFILLMENT") return null;
  if (fulfillmentMode === "CODE_DELIVERY" || familyKey === "GIFTCARDS" || familyKey === "GAME_KEYS") return null;

  const configuredFields = [
    ...asArray(value.extraFields),
    ...asArray(value.orderFields),
    ...asArray(value.dynamicFields),
    ...asArray(providerMeta.requiredFields),
  ]
    .map((field) => ({
      key: safeTrim(field.key || field.name || field.id),
      label: safeTrim(field.label || field.title || field.name || field.key),
      required: field.required !== false,
      isActive: field.isActive !== false && field.active !== false,
    }))
    .filter((field) => field.isActive && field.required && (field.key || field.label));

  const identityText = [
    value.name,
    value.nameAr,
    value.nameEn,
    value.externalProductId,
    value.providerProductExternalId,
    providerMeta.externalProductId,
  ].map(safeTrim).join(" ");
  const loginLike = /\b(via\s+login|login|username|account)\b/i.test(identityText);
  const hasLoginField = configuredFields.some((field) =>
    /(login|username|user[_\s-]?name|account|user[_\s-]?id|player[_\s-]?id|uid|profile|roblox)/i.test(`${field.key} ${field.label}`),
  );

  const suggestions = [];
  if (familyKey === "TELEGRAM") suggestions.push("telegram_username");
  if (familyKey === "STEAM_TOPUP") suggestions.push("steam_login", "steam_profile", "steam_username");
  if (familyKey === "MANUAL_SERVICES") suggestions.push("account_username");
  if (familyKey === "TOPUPS") suggestions.push("user_id", "account_id", "player_id");
  if (loginLike) suggestions.push("roblox_username", "account_username", "login");

  if (!configuredFields.length || (loginLike && !hasLoginField)) {
    return { suggestions: [...new Set(suggestions)] };
  }
  return null;
}

function getExactSupplierPrice(providerProduct) {
  return safeTrim(
    providerProduct?.supplierPrice
    ?? providerProduct?.rawPrice
    ?? providerProduct?.price
    ?? "",
  );
}
