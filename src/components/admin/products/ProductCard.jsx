import { Link2, MoreVertical, Pause, Pencil, Play, RefreshCw, Trash2 } from "lucide-react";

function formatUsdPrice(value) {
  const rawValue = String(value ?? "").trim().replace(/,/g, "");
  const plainDecimalMatch = rawValue.match(/^(-?\d+)(?:\.(\d+))?$/);

  if (plainDecimalMatch) {
    const integerPart = plainDecimalMatch[1];
    const decimalPart = plainDecimalMatch[2];
    const exactValue = decimalPart === undefined
      ? `${integerPart}.00`
      : `${integerPart}.${decimalPart.padEnd(2, "0")}`;
    return `${exactValue} US$`;
  }

  const numericValue = Number(rawValue);
  if (!Number.isFinite(numericValue)) return `${rawValue || "0.00"} US$`;

  return `${numericValue.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 20,
    useGrouping: false,
  })} US$`;
}

const isProductStopped = (product) => product.isActive === false;

export default function ProductCard({ actionBusy = false, mainCategory, onDelete, onEdit, onProviderLink, onProviderSync, onTogglePause, product }) {
  const displayStatus = product.status === "unavailable" ? "unavailable" : product.paused ? "paused" : product.status;
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
      <td className="px-4 py-3 text-xs font-bold text-slate-300">{mainCategory?.name || "غير محدد"}</td>
      <td dir="ltr" className="whitespace-nowrap px-4 py-3 text-right text-xs font-black text-emerald-400">{formatUsdPrice(product.finalPrice)}</td>
      <td className="px-4 py-3"><OrderLimits product={product} /></td>
      <td className="px-4 py-3">
        <div className="space-y-1">
          <ProductStatus status={displayStatus} />
          <CustomerVisibilityBadge product={product} />
        </div>
      </td>
      <td className="px-4 py-3"><ProductActions actionBusy={actionBusy} product={product} onDelete={onDelete} onEdit={onEdit} onProviderLink={onProviderLink} onProviderSync={onProviderSync} onTogglePause={onTogglePause} /></td>
    </tr>
  );
}

export function ProductMobileCard({ actionBusy = false, mainCategory, onDelete, onEdit, onProviderLink, onProviderSync, onTogglePause, product }) {
  const displayStatus = product.status === "unavailable" ? "unavailable" : product.paused ? "paused" : product.status;
  return (
    <article className="admin-products-mobile-card admin-product-item-mobile-card min-w-0 space-y-1.5">
      <div className="flex min-w-0 items-center gap-2">
        <img src={product.image || "/logo.png"} alt="" className="h-8 w-8 shrink-0 rounded-md border border-blue-500/30 object-cover" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[10px] font-black leading-4 text-slate-100">{product.nameAr}</p>
          <p className="truncate text-[7px] font-bold leading-3 text-slate-500">{product.nameEn || "منتج يدوي"}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <ProductStatus status={displayStatus} compact />
          <CustomerVisibilityBadge compact product={product} />
        </div>
      </div>
      <div className="grid grid-cols-[minmax(0,0.72fr)_minmax(128px,1.28fr)] gap-1">
        <MobileMeta label="القسم الرئيسي" value={mainCategory?.name || "غير محدد"} />
        <MobileMeta label="السعر" value={formatUsdPrice(product.finalPrice)} accent showFull />
        <OrderLimits product={product} mobile />
        <MobileMeta
          label="نوع الربط"
          value={<ProductLinkType product={product} />}
        />
      </div>
      <div className="flex justify-end"><ProductActions compact actionBusy={actionBusy} product={product} onDelete={onDelete} onEdit={onEdit} onProviderLink={onProviderLink} onProviderSync={onProviderSync} onTogglePause={onTogglePause} /></div>
    </article>
  );
}

function MobileMeta({ accent = false, label, showFull = false, value }) {
  return (
    <div className={`admin-products-meta min-w-0 rounded-md border border-[#142654] bg-[#060e29] px-1.5 py-1 ${showFull ? "overflow-visible" : "overflow-hidden"}`}>
      <p className="text-[7px] font-bold leading-3 text-slate-500">{label}</p>
      {showFull ? (
        <bdi
          dir="ltr"
          title={String(value)}
          className={`admin-products-price-value block w-full whitespace-normal break-words text-left text-[9px] font-black leading-3.5 tracking-tight [overflow-wrap:anywhere] ${accent ? "text-emerald-400" : "text-slate-200"}`}
        >
          {value}
        </bdi>
      ) : (
        <div className={`truncate text-[9px] font-black leading-3.5 ${accent ? "text-emerald-400" : "text-slate-200"}`}>{value}</div>
      )}
    </div>
  );
}

function ProductLinkType({ product }) {
  if (product.linkType !== "automatic") {
    return (
      <span className="mr-auto flex w-fit max-w-full items-center gap-1 rounded-full border border-amber-400/25 bg-amber-400/10 px-1.5 py-0.5 text-[7px] font-black text-amber-300">
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400 shadow-[0_0_7px_rgba(251,191,36,0.85)]" />
        يدوي
      </span>
    );
  }

  return (
    <span className="mr-auto flex w-fit max-w-full items-center rounded-full border border-violet-400/25 bg-gradient-to-l from-violet-500/15 to-cyan-400/10 px-1.5 py-0.5 shadow-[0_0_10px_rgba(139,92,246,0.12)]">
      <span className="shrink-0 text-[7px] font-black text-fuchsia-300">تلقائي</span>
      <span aria-hidden="true" className="mx-1 h-3 w-px shrink-0 bg-gradient-to-b from-transparent via-cyan-300 to-transparent shadow-[0_0_5px_rgba(103,232,249,0.75)]" />
      <span className="min-w-0 truncate text-[7px] font-black text-cyan-300">{product.providerName || "المورد"}</span>
    </span>
  );
}

function OrderLimits({ mobile = false, product }) {
  const minimum = product.min ?? product.minQty ?? 1;
  const maximum = product.max ?? product.maxQty ?? minimum;

  if (mobile) {
    return (
      <div className="admin-products-meta min-w-0 rounded-md border border-[#142654] bg-[#060e29] px-1.5 py-1">
        <p className="text-[7px] font-bold leading-3 text-slate-500">حدود الطلب</p>
        <div className="mt-0.5 grid grid-cols-2 gap-1">
          <LimitRow label="الحد الأدنى" value={minimum} />
          <LimitRow label="الحد الأقصى" value={maximum} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <LimitBadge label="الأدنى" value={minimum} />
      <LimitBadge label="الأقصى" value={maximum} />
    </div>
  );
}

function LimitRow({ label, value }) {
  return <div className="flex min-w-0 items-center justify-between gap-1 rounded bg-white/[0.04] px-1 py-0.5"><span className="truncate text-[6px] font-bold leading-3 text-slate-500">{label}</span><strong dir="ltr" className="text-[8px] font-black leading-3 text-slate-200">{value}</strong></div>;
}

function LimitBadge({ label, value }) {
  return <span className="inline-flex items-center gap-1 rounded-md border border-blue-500/15 bg-blue-500/[0.06] px-2 py-1 text-[9px] font-bold text-slate-400"><span>{label}</span><strong dir="ltr" className="text-[10px] font-black text-slate-200">{value}</strong></span>;
}

function ProductStatus({ compact = false, status }) {
  const labels = { available: "نشط", unavailable: "غير متوفر", paused: "موقوف" };
  const tone = status === "available" ? "bg-emerald-500/15 text-emerald-400" : status === "paused" ? "bg-amber-500/15 text-amber-400" : "bg-rose-500/15 text-rose-400";
  return <span className={`inline-flex justify-center rounded-full font-black ${compact ? "min-w-[44px] px-1.5 py-1 text-[7px]" : "min-w-[58px] px-3 py-1.5 text-[10px]"} ${tone}`}>{labels[status] || status}</span>;
}

function CustomerVisibilityBadge({ compact = false, product }) {
  const status = product.customerVisibilityStatus || {};
  const visible = product.visibleToCustomer === true || status.visibleToCustomer === true;
  const reasons = product.visibilityReasons || status.reasons || [];
  const label = visible ? "Visible to customers" : "Not visible to customers";
  const tone = visible ? "bg-emerald-500/10 text-emerald-300" : "bg-amber-500/10 text-amber-300";

  return (
    <span
      title={visible ? label : reasons.join(", ") || label}
      className={`inline-flex max-w-full justify-center rounded-full font-black ${compact ? "px-1.5 py-0.5 text-[6px]" : "px-2 py-1 text-[8px]"} ${tone}`}
    >
      {label}
    </span>
  );
}

function ProductActions({ actionBusy, compact = false, onDelete, onEdit, onProviderLink, onProviderSync, onTogglePause, product }) {
  const stopped = isProductStopped(product);
  const actionSize = compact ? "h-7 w-7" : "h-8 w-8";
  const iconSize = compact ? "h-3.5 w-3.5" : "h-4 w-4";

  return (
    <div className={`admin-products-actions flex items-center ${compact ? "gap-1" : "gap-2"}`}>
      <details className="group/details relative">
        <summary className={`grid ${actionSize} cursor-pointer list-none place-items-center rounded-md border border-[#1a2e5b] text-slate-400 transition hover:text-white`}><MoreVertical className={iconSize} /></summary>
        <div className={`admin-products-menu absolute left-0 z-20 w-44 space-y-1 rounded-xl border border-[#20376e] bg-[#07112d] p-2 shadow-2xl ${compact ? "top-8" : "top-10"}`}>
          <MenuButton icon={stopped ? Play : Pause} label={stopped ? "تفعيل" : "إيقاف مؤقت"} onClick={() => onTogglePause(product)} disabled={actionBusy} tone={stopped ? "success" : "default"} />
          <MenuButton icon={Link2} label={product.isProviderLinked ? "تغيير الربط" : "ربط مورد"} onClick={() => onProviderLink(product)} disabled={actionBusy} />
          <MenuButton icon={RefreshCw} label="مزامنة السعر" onClick={() => onProviderSync(product)} disabled={actionBusy || !product.isProviderLinked} />
        </div>
      </details>
      <button type="button" onClick={() => onEdit(product)} disabled={actionBusy} className={`grid ${actionSize} place-items-center rounded-md border border-blue-600/60 bg-blue-600/10 text-blue-400 transition hover:bg-blue-600/20 disabled:opacity-50`} aria-label={`تعديل ${product.nameAr}`}><Pencil className={iconSize} /></button>
      <button type="button" onClick={() => onDelete(product)} disabled={actionBusy} className={`grid ${actionSize} place-items-center rounded-md border border-rose-600/50 bg-rose-600/10 text-rose-500 transition hover:bg-rose-600/20 disabled:opacity-50`} aria-label={`حذف ${product.nameAr}`}><Trash2 className={iconSize} /></button>
    </div>
  );
}

function MenuButton({ disabled, icon: Icon, label, onClick, tone = "default" }) {
  const iconTone = tone === "success" ? "text-emerald-400" : "text-violet-400";
  return <button type="button" disabled={disabled} onClick={onClick} className="flex h-9 w-full items-center gap-2 rounded-lg px-2 text-right text-[10px] font-black text-slate-300 transition hover:bg-white/[0.06] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"><Icon className={`h-3.5 w-3.5 ${iconTone}`} />{label}</button>;
}
