import { Link2, MoreVertical, Pause, Pencil, Play, RefreshCw, Trash2 } from "lucide-react";

const currency = new Intl.NumberFormat("ar-EG-u-nu-latn", { style: "currency", currency: "USD", minimumFractionDigits: 2 });

export default function ProductCard({ actionBusy = false, onDelete, onEdit, onProviderLink, onProviderSync, onTogglePause, product, subCategory }) {
  const displayStatus = product.paused ? "paused" : product.status;
  return (
    <tr className="admin-products-row border-t border-[#142654] transition hover:bg-blue-500/[0.035]">
      <td className="px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <img src={product.image || "/logo.png"} alt="" className="h-10 w-10 shrink-0 rounded-lg border border-blue-500/30 object-cover shadow-[0_0_10px_rgba(59,130,246,0.16)]" />
          <div className="min-w-0">
            <p className="truncate text-xs font-black text-slate-100">{product.nameAr}</p>
            <p className="mt-1 truncate text-[9px] font-bold text-slate-500">{product.nameEn || "منتج يدوي"}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-xs font-bold text-slate-300">{subCategory?.name || "لا يوجد"}</td>
      <td dir="ltr" className="px-4 py-3 text-right text-xs font-black text-emerald-400">{currency.format(product.finalPrice)}</td>
      <td className="px-4 py-3 text-xs font-bold text-slate-300">{product.status === "unavailable" ? "غير متوفر" : "متوفر"}</td>
      <td className="px-4 py-3"><ProductStatus status={displayStatus} /></td>
      <td className="px-4 py-3"><ProductActions actionBusy={actionBusy} product={product} onDelete={onDelete} onEdit={onEdit} onProviderLink={onProviderLink} onProviderSync={onProviderSync} onTogglePause={onTogglePause} /></td>
    </tr>
  );
}

export function ProductMobileCard({ actionBusy = false, onDelete, onEdit, onProviderLink, onProviderSync, onTogglePause, product, subCategory }) {
  const displayStatus = product.paused ? "paused" : product.status;
  return (
    <article className="admin-products-mobile-card min-w-0 space-y-3 p-3.5">
      <div className="flex min-w-0 items-center gap-3">
        <img src={product.image || "/logo.png"} alt="" className="h-11 w-11 shrink-0 rounded-lg border border-blue-500/30 object-cover" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-black text-slate-100">{product.nameAr}</p>
          <p className="mt-1 truncate text-[9px] font-bold text-slate-500">{product.nameEn || "منتج يدوي"}</p>
        </div>
        <ProductStatus status={displayStatus} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <MobileMeta label="القسم الفرعي" value={subCategory?.name || "لا يوجد"} />
        <MobileMeta label="السعر" value={currency.format(product.finalPrice)} accent />
        <MobileMeta label="المخزون" value={product.status === "unavailable" ? "غير متوفر" : "متوفر"} />
        <MobileMeta label="نوع الربط" value={product.linkType === "automatic" ? "تلقائي" : "يدوي"} />
      </div>
      <div className="flex justify-end"><ProductActions actionBusy={actionBusy} product={product} onDelete={onDelete} onEdit={onEdit} onProviderLink={onProviderLink} onProviderSync={onProviderSync} onTogglePause={onTogglePause} /></div>
    </article>
  );
}

function MobileMeta({ accent = false, label, value }) {
  return <div className="admin-products-meta min-w-0 rounded-lg border border-[#142654] bg-[#060e29] p-2.5"><p className="text-[9px] font-bold text-slate-500">{label}</p><p className={`mt-1 truncate text-[11px] font-black ${accent ? "text-emerald-400" : "text-slate-200"}`}>{value}</p></div>;
}

function ProductStatus({ status }) {
  const labels = { available: "نشط", unavailable: "غير متوفر", paused: "موقوف" };
  const tone = status === "available" ? "bg-emerald-500/15 text-emerald-400" : status === "paused" ? "bg-amber-500/15 text-amber-400" : "bg-rose-500/15 text-rose-400";
  return <span className={`inline-flex min-w-[58px] justify-center rounded-full px-3 py-1.5 text-[10px] font-black ${tone}`}>{labels[status] || status}</span>;
}

function ProductActions({ actionBusy, onDelete, onEdit, onProviderLink, onProviderSync, onTogglePause, product }) {
  return (
    <div className="admin-products-actions flex items-center gap-2">
      <details className="group/details relative">
        <summary className="grid h-8 w-8 cursor-pointer list-none place-items-center rounded-md border border-[#1a2e5b] text-slate-400 transition hover:text-white"><MoreVertical className="h-4 w-4" /></summary>
        <div className="admin-products-menu absolute left-0 top-10 z-20 w-44 space-y-1 rounded-xl border border-[#20376e] bg-[#07112d] p-2 shadow-2xl">
          <MenuButton icon={product.paused ? Play : Pause} label={product.paused ? "استئناف المنتج" : "إيقاف مؤقت"} onClick={() => onTogglePause(product)} disabled={actionBusy} />
          <MenuButton icon={Link2} label={product.isProviderLinked ? "تغيير الربط" : "ربط مورد"} onClick={() => onProviderLink(product)} disabled={actionBusy} />
          <MenuButton icon={RefreshCw} label="مزامنة السعر" onClick={() => onProviderSync(product)} disabled={actionBusy || !product.isProviderLinked} />
        </div>
      </details>
      <button type="button" onClick={() => onEdit(product)} disabled={actionBusy} className="grid h-8 w-8 place-items-center rounded-md border border-blue-600/60 bg-blue-600/10 text-blue-400 transition hover:bg-blue-600/20 disabled:opacity-50" aria-label={`تعديل ${product.nameAr}`}><Pencil className="h-4 w-4" /></button>
      <button type="button" onClick={() => onDelete(product)} disabled={actionBusy} className="grid h-8 w-8 place-items-center rounded-md border border-rose-600/50 bg-rose-600/10 text-rose-500 transition hover:bg-rose-600/20 disabled:opacity-50" aria-label={`حذف ${product.nameAr}`}><Trash2 className="h-4 w-4" /></button>
    </div>
  );
}

function MenuButton({ disabled, icon: Icon, label, onClick }) {
  return <button type="button" disabled={disabled} onClick={onClick} className="flex h-9 w-full items-center gap-2 rounded-lg px-2 text-right text-[10px] font-black text-slate-300 transition hover:bg-white/[0.06] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"><Icon className="h-3.5 w-3.5 text-violet-400" />{label}</button>;
}
