import { Pencil, Power, RefreshCw, Trash2 } from "lucide-react";

export default function PaymentMethodCard({ method, onEdit, onDelete, onRefresh, onToggle }) {
  return (
    <article className="rounded-2xl border border-slate-100 bg-slate-50/70 p-2.5 dark:border-white/[0.06] dark:bg-[#0B1220]">
      <div className="flex items-center gap-2.5">
        <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-xl bg-white p-1 dark:bg-[#111827]">
          <img src={method.imageUrl || method.image || "/logo.png"} alt={method.name} className="h-full w-full object-contain" />
        </span>
        <div className="min-w-0 flex-1">
          <h4 className="truncate text-[10px] font-black dark:text-white">{method.name}</h4>
          <p className="truncate text-[8px] font-bold text-slate-400">{method.description}</p>
        </div>
        <span className={`rounded-full px-2 py-1 text-[8px] font-black ${method.active ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "bg-rose-500/10 text-rose-700 dark:text-rose-300"}`}>
          {method.active ? "نشطة" : "غير نشطة"}
        </span>
      </div>

      <div className="mt-2 grid grid-cols-2 gap-1.5 text-[8px] font-bold text-slate-500 dark:text-slate-300">
        <p className="truncate">الحساب: <b dir="ltr">{method.account || "-"}</b></p>
        <p className="truncate">البنك: <b>{method.bank || method.gateway || "-"}</b></p>
        <p className="truncate">المالك: <b>{method.owner || "-"}</b></p>
        <p>الرسوم: <b>{Number(method.fee || 0)}%</b></p>
      </div>

      <div className="mt-2 grid grid-cols-4 gap-1">
        <Button icon={Pencil} label="تعديل" onClick={() => onEdit(method)} />
        <Button icon={Trash2} label="حذف" danger onClick={() => onDelete(method)} />
        <Button icon={RefreshCw} label="تحديث" onClick={() => onRefresh(method)} />
        <Button icon={Power} label={method.active ? "تعطيل" : "تفعيل"} danger={method.active} onClick={() => onToggle(method)} />
      </div>
    </article>
  );
}

function Button({ icon: Icon, label, onClick, danger = false }) {
  return (
    <button
      onClick={onClick}
      type="button"
      className={`inline-flex h-8 items-center justify-center gap-0.5 rounded-lg text-[7px] font-black ${
        danger ? "bg-rose-500/10 text-rose-700 dark:text-rose-300" : "bg-white text-slate-600 dark:bg-white/[0.06] dark:text-slate-300"
      }`}
    >
      <Icon className="h-2.5 w-2.5" />
      {label}
    </button>
  );
}
