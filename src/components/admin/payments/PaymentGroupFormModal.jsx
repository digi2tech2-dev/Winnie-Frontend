import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import { ImagePlus, Save, X } from "lucide-react";

export default function PaymentGroupFormModal({ open, group, currencies, onClose, onSave }) {
  if (!open) return null;

  return createPortal(
    <Content key={group?.id || "new"} group={group} currencies={currencies} onClose={onClose} onSave={onSave} />,
    document.body,
  );
}

function Content({ group, currencies, onClose, onSave }) {
  const [form, setForm] = useState({
    active: group?.active ?? group?.isActive ?? true,
    currency: group?.currency || "USD",
    description: group?.description || "",
    image: group?.image || "",
    imageFile: null,
    name: group?.name || "",
    sortOrder: group?.sortOrder ?? 0,
  });
  const [preview, setPreview] = useState(group?.imageUrl || group?.image || "");

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
    if (!form.name.trim()) return;
    onSave({
      ...form,
      image: form.image || group?.image || "",
      isActive: form.active,
      name: form.name.trim(),
      sortOrder: Number(form.sortOrder) || 0,
    });
  };

  return (
    <Shell title={group ? "تعديل مجموعة الدفع" : "إضافة مجموعة جديدة"} onClose={onClose} onSave={save}>
      <label className="block">
        <Label>اسم المجموعة</Label>
        <input value={form.name} onChange={(event) => set("name", event.target.value)} className={input} />
      </label>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <label>
          <Label>العملة</Label>
          <select value={form.currency} onChange={(event) => set("currency", event.target.value)} className={input}>
            {(currencies.length ? currencies : ["USD"]).map((currency) => (
              <option key={currency} value={currency}>{currency}</option>
            ))}
          </select>
        </label>
        <label>
          <Label>الحالة</Label>
          <select value={form.active ? "yes" : "no"} onChange={(event) => set("active", event.target.value === "yes")} className={input}>
            <option value="yes">نشطة</option>
            <option value="no">غير نشطة</option>
          </select>
        </label>
      </div>

      <label className="mt-3 block">
        <Label>ترتيب العرض</Label>
        <input type="number" value={form.sortOrder} onChange={(event) => set("sortOrder", event.target.value)} className={input} />
      </label>

      <label className="mt-3 block">
        <Label>الوصف</Label>
        <textarea value={form.description} onChange={(event) => set("description", event.target.value)} className={`${input} min-h-20 py-2`} />
      </label>

      <label className="mt-3 flex cursor-pointer items-center gap-3 rounded-2xl border border-dashed border-violet-200 p-3 dark:border-violet-400/20">
        <span className="grid h-16 w-16 place-items-center overflow-hidden rounded-xl bg-violet-50">
          {preview ? <img src={preview} alt="" className="h-full w-full object-cover" /> : <ImagePlus className="h-5 w-5 text-violet-400" />}
        </span>
        <span className="text-[9px] font-black text-violet-600">رفع صورة المجموعة ومعاينتها</span>
        <input type="file" accept="image/*" className="sr-only" onChange={(event) => pickImage(event.target.files?.[0])} />
      </label>
    </Shell>
  );
}

function Shell({ title, onClose, onSave, children }) {
  return (
    <div className="fixed inset-0 z-[130] flex items-end justify-center bg-slate-950/60 sm:items-center sm:p-4">
      <section className="flex max-h-[92dvh] w-full max-w-[560px] flex-col rounded-t-[28px] bg-white sm:rounded-[28px] dark:bg-[#111827]">
        <header className="flex items-center gap-3 border-b border-slate-100 p-4 dark:border-white/10">
          <h2 className="flex-1 text-sm font-black dark:text-white">{title}</h2>
          <button type="button" onClick={onClose}><X className="h-4 w-4" /></button>
        </header>
        <div className="overflow-y-auto p-4">{children}</div>
        <footer className="sticky bottom-0 grid grid-cols-2 gap-2 border-t bg-white p-3 dark:border-white/10 dark:bg-[#111827]">
          <button type="button" onClick={onClose} className="h-11 rounded-xl border text-[10px] font-black dark:border-white/10 dark:text-white">إلغاء</button>
          <button type="button" onClick={onSave} className="inline-flex h-11 items-center justify-center gap-1 rounded-xl bg-violet-600 text-[10px] font-black text-white">
            <Save className="h-4 w-4" />
            حفظ
          </button>
        </footer>
      </section>
    </div>
  );
}

function Label({ children }) {
  return <span className="mb-1 block text-[9px] font-black text-slate-500">{children}</span>;
}

const input = "h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 text-[10px] font-black outline-none dark:border-white/10 dark:bg-[#0B1220] dark:text-white";
