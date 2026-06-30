import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import { ImagePlus, Save, X } from "lucide-react";
import { PAYMENT_GATEWAYS } from "../../../api/paymentMethods";

const methodTypes = ["MANUAL", "ONLINE", "CARD", "WALLET", "BANK_TRANSFER", "CRYPTO"];

export default function PaymentMethodFormModal({ open, method, defaultGroupId, groups, onClose, onSave }) {
  if (!open) return null;

  return createPortal(
    <Content
      key={method?.id || defaultGroupId || "new"}
      method={method}
      defaultGroupId={defaultGroupId}
      groups={groups}
      onClose={onClose}
      onSave={onSave}
    />,
    document.body,
  );
}

function Content({ method, defaultGroupId, groups, onClose, onSave }) {
  const selectedGroup = groups.find((group) => group.id === (method?.groupId || defaultGroupId)) || groups[0];
  const [form, setForm] = useState({
    account: method?.account || "",
    active: method?.active ?? method?.isActive ?? true,
    bank: method?.bank || "",
    currency: method?.currency || selectedGroup?.currency || "USD",
    description: method?.description || "",
    fee: method?.fee ?? 0,
    gateway: method?.gateway || "",
    groupId: method?.groupId || defaultGroupId || selectedGroup?.id || "",
    image: method?.image || "",
    imageFile: null,
    instructions: method?.instructions || "",
    maxAmount: method?.maxAmount ?? "",
    minAmount: method?.minAmount ?? "",
    name: method?.name || "",
    owner: method?.owner || "",
    requiresReceipt: method?.requiresReceipt ?? true,
    sortOrder: method?.sortOrder ?? 0,
    type: method?.type || (method?.gateway ? "ONLINE" : "MANUAL"),
  });
  const [preview, setPreview] = useState(method?.imageUrl || method?.image || "");

  useEffect(() => () => {
    if (preview.startsWith("blob:")) URL.revokeObjectURL(preview);
  }, [preview]);

  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const pickImage = (file) => {
    if (!file) return;
    if (preview.startsWith("blob:")) URL.revokeObjectURL(preview);
    setForm((current) => ({ ...current, imageFile: file }));
    setPreview(URL.createObjectURL(file));
  };

  const save = () => {
    if (!form.name.trim() || !form.groupId) return;
    onSave({
      ...form,
      active: form.active,
      currency: String(form.currency || "USD").toUpperCase(),
      currencies: [String(form.currency || "USD").toUpperCase()],
      fee: Number(form.fee) || 0,
      image: form.image || method?.image || "",
      isActive: form.active,
      maxAmount: form.maxAmount === "" ? null : Number(form.maxAmount),
      minAmount: form.minAmount === "" ? null : Number(form.minAmount),
      name: form.name.trim(),
      requiresReceipt: Boolean(form.requiresReceipt),
      sortOrder: Number(form.sortOrder) || 0,
      type: String(form.type || "MANUAL").toUpperCase(),
    });
  };

  return (
    <div className="fixed inset-0 z-[140] flex items-end justify-center bg-slate-950/60 sm:items-center sm:p-4">
      <section className="flex max-h-[94dvh] w-full max-w-[680px] flex-col rounded-t-[28px] bg-white sm:rounded-[28px] dark:bg-[#111827]">
        <header className="flex items-center border-b p-4 dark:border-white/10">
          <h2 className="flex-1 text-sm font-black dark:text-white">{method ? "تعديل طريقة الدفع" : "إضافة طريقة دفع"}</h2>
          <button type="button" onClick={onClose}><X className="h-4 w-4" /></button>
        </header>

        <div className="grid gap-3 overflow-y-auto p-4 sm:grid-cols-2">
          <SelectField label="المجموعة" value={form.groupId} onChange={(value) => {
            const nextGroup = groups.find((group) => group.id === value);
            setForm((current) => ({
              ...current,
              groupId: value,
              currency: current.currency || nextGroup?.currency || "USD",
            }));
          }}>
            {groups.map((group) => (
              <option key={group.id} value={group.id}>{group.name}</option>
            ))}
          </SelectField>

          <Field label="اسم طريقة الدفع" value={form.name} onChange={(value) => set("name", value)} />
          <Field label="الوصف للعميل" value={form.description} onChange={(value) => set("description", value)} />
          <Field label="نسبة الرسوم %" type="number" value={form.fee} onChange={(value) => set("fee", value)} />
          <Field label="رقم الحساب أو المحفظة" value={form.account} onChange={(value) => set("account", value)} />
          <Field label="اسم البنك / الشبكة" value={form.bank} onChange={(value) => set("bank", value)} />
          <Field label="اسم صاحب الحساب" value={form.owner} onChange={(value) => set("owner", value)} />
          <Field label="العملة" value={form.currency} onChange={(value) => set("currency", value.toUpperCase())} />
          <Field label="الحد الأدنى" type="number" value={form.minAmount} onChange={(value) => set("minAmount", value)} />
          <Field label="الحد الأقصى" type="number" value={form.maxAmount} onChange={(value) => set("maxAmount", value)} />

          <SelectField label="النوع" value={form.type} onChange={(value) => set("type", value)}>
            {methodTypes.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </SelectField>

          <SelectField label="بوابة الدفع" value={form.gateway} onChange={(value) => set("gateway", value)}>
            <option value="">بدون بوابة</option>
            {PAYMENT_GATEWAYS.map((gateway) => (
              <option key={gateway} value={gateway}>{gateway}</option>
            ))}
          </SelectField>

          <Field label="ترتيب العرض" type="number" value={form.sortOrder} onChange={(value) => set("sortOrder", value)} />

          <SelectField label="الحالة" value={form.active ? "yes" : "no"} onChange={(value) => set("active", value === "yes")}>
            <option value="yes">نشطة</option>
            <option value="no">غير نشطة</option>
          </SelectField>

          <SelectField label="إيصال التحويل" value={form.requiresReceipt ? "yes" : "no"} onChange={(value) => set("requiresReceipt", value === "yes")}>
            <option value="yes">مطلوب</option>
            <option value="no">غير مطلوب</option>
          </SelectField>

          <label className="sm:col-span-2">
            <span className="mb-1 block text-[9px] font-black text-slate-500">تعليمات الدفع</span>
            <textarea value={form.instructions} onChange={(event) => set("instructions", event.target.value)} className={`${input} min-h-20 py-2`} />
          </label>

          <label className="flex cursor-pointer items-center gap-2 rounded-2xl border border-dashed p-2 dark:border-white/10">
            <span className="grid h-12 w-12 place-items-center overflow-hidden rounded-xl bg-slate-50">
              {preview ? <img src={preview} alt="" className="h-full w-full object-contain" /> : <ImagePlus className="h-4 w-4" />}
            </span>
            <span className="text-[8px] font-black text-violet-600">صورة الطريقة</span>
            <input type="file" accept="image/*" className="sr-only" onChange={(event) => pickImage(event.target.files?.[0])} />
          </label>
        </div>

        <footer className="sticky bottom-0 grid grid-cols-2 gap-2 border-t bg-white p-3 dark:border-white/10 dark:bg-[#111827]">
          <button type="button" onClick={onClose} className="h-11 rounded-xl border text-[10px] font-black dark:border-white/10 dark:text-white">إلغاء</button>
          <button type="button" onClick={save} className="inline-flex h-11 items-center justify-center gap-1 rounded-xl bg-violet-600 text-[10px] font-black text-white">
            <Save className="h-4 w-4" />
            حفظ
          </button>
        </footer>
      </section>
    </div>
  );
}

function Field({ label, type = "text", value, onChange }) {
  return (
    <label>
      <span className="mb-1 block text-[9px] font-black text-slate-500">{label}</span>
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} className={input} />
    </label>
  );
}

function SelectField({ label, value, onChange, children }) {
  return (
    <label>
      <span className="mb-1 block text-[9px] font-black text-slate-500">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className={input}>
        {children}
      </select>
    </label>
  );
}

const input = "h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 text-[10px] font-black outline-none dark:border-white/10 dark:bg-[#0B1220] dark:text-white";
