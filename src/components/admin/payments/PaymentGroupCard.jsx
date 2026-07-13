import { ChevronDown, Pencil, Plus, Power, RefreshCw, Trash2 } from "lucide-react";
import { useState } from "react";
import PaymentMethodCard from "./PaymentMethodCard";

export default function PaymentGroupCard({
  group,
  methods,
  onAddMethod,
  onEdit,
  onDelete,
  onRefresh,
  onToggle,
  onEditMethod,
  onDeleteMethod,
  onRefreshMethod,
  onToggleMethod,
}) {
  const [open, setOpen] = useState(false);

  return (
    <article className="overflow-hidden rounded-[23px] border border-slate-200 bg-white shadow-[0_14px_34px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-[#111827]">
      <div className="p-3.5">
        <div className="flex items-center gap-3">
          <span className="payment-admin-logo-shell grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-2xl p-1.5">
            <img src={group.imageUrl || group.image || "/logo.png"} alt={group.name} className="h-full w-full object-contain" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-sm font-black dark:text-white">{group.name}</h2>
            <p className="mt-0.5 line-clamp-1 text-[8px] font-bold text-slate-400">{group.description}</p>
            <p className="mt-1 text-[8px] font-black text-violet-600">{group.currency} · {methods.length} طرق</p>
          </div>
          <span className={`rounded-full px-2 py-1 text-[8px] font-black ${group.active ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "bg-rose-500/10 text-rose-700 dark:text-rose-300"}`}>
            {group.active ? "نشطة" : "غير نشطة"}
          </span>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-1.5">
          <Button icon={Plus} label="إضافة طريقة" onClick={() => onAddMethod(group)} />
          <Button icon={ChevronDown} label="عرض" onClick={() => setOpen((value) => !value)} />
          <Button icon={Pencil} label="تعديل" onClick={() => onEdit(group)} />
          <Button icon={Trash2} label="حذف" danger onClick={() => onDelete(group)} />
          <Button icon={RefreshCw} label="تحديث" onClick={() => onRefresh(group)} />
          <Button icon={Power} label={group.active ? "تعطيل" : "تفعيل"} danger={group.active} onClick={() => onToggle(group)} />
        </div>
      </div>

      {open && (
        <div className="space-y-2 border-t border-slate-100 bg-slate-50/50 p-3 dark:border-white/[0.07] dark:bg-[#080D19]/60">
          {methods.length ? (
            methods.map((method) => (
              <PaymentMethodCard
                key={method.id}
                method={method}
                onDelete={onDeleteMethod}
                onEdit={onEditMethod}
                onRefresh={onRefreshMethod}
                onToggle={onToggleMethod}
              />
            ))
          ) : (
            <p className="py-5 text-center text-[9px] font-bold text-slate-400">لا توجد طرق دفع داخل المجموعة</p>
          )}
        </div>
      )}
    </article>
  );
}

function Button({ icon: Icon, label, onClick, danger = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-9 items-center justify-center gap-1 rounded-xl text-[7.5px] font-black ${
        danger ? "bg-rose-500/10 text-rose-700 dark:text-rose-300" : "bg-slate-100 text-slate-600 dark:bg-white/[0.06] dark:text-slate-300"
      }`}
    >
      <Icon className="h-3 w-3" />
      {label}
    </button>
  );
}
