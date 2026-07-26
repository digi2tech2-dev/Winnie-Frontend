import { Activity, Archive, Ban, Boxes, CircleDollarSign, Pencil, PlugZap, RefreshCw, Stethoscope } from "lucide-react";
import { isXenaProvider } from "../../../utils/xena";
import ConnectionStatusBadge from "./ConnectionStatusBadge";

export default function SupplierCard({
  actionKey = "",
  connectionResult,
  onArchive,
  onEdit,
  onProducts,
  onSync,
  onTest,
  onToggle,
  onTools,
  onXena,
  productCountLabel = "كتالوج المورد",
  supplier,
}) {
  const busy = actionKey.startsWith(`${supplier.id}:`);
  const xena = isXenaProvider(supplier);
  const connectionStatus = actionKey === `${supplier.id}:test`
    ? "testing"
    : connectionResult
      ? connectionResult.connected ? "connected" : "failed"
      : "unknown";
  const featuresMissing = supplier.supportedFeaturesLabel === "Not returned";
  const supportedFeaturesLabel = featuresMissing
    ? "لم يُرجع المورد خصائص مدعومة"
    : supplier.supportedFeaturesLabel;

  return (
    <article className="admin-supplier-card rounded-[23px] border border-slate-200/90 bg-white p-4 shadow-[0_14px_34px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-[#111827]">
      <div className="admin-supplier-card-head flex items-start gap-3">
        <span className="admin-supplier-avatar grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-blue-500 text-sm font-black text-white">
          {supplier.name.slice(0, 1).toUpperCase()}
        </span>
        <div className="admin-supplier-identity min-w-0 flex-1">
          <h2 className="admin-supplier-name truncate text-sm font-black text-slate-950 dark:text-white">{supplier.name}</h2>
          <p dir="ltr" className="admin-supplier-code mt-0.5 truncate text-right text-[9px] font-black text-slate-400">{supplier.code || supplier.id}</p>
        </div>
        <span className="admin-supplier-main-status"><ConnectionStatusBadge status={supplier.active ? "active" : "inactive"} /></span>
      </div>

      <div className="admin-supplier-primary-facts mt-3 grid grid-cols-3 gap-2">
        <Info label="الاتصال"><ConnectionStatusBadge status={connectionStatus} /></Info>
        <Info className="admin-supplier-catalog-info" label="المنتجات" value={productCountLabel} />
        <Info className="admin-supplier-updated-info" label="آخر تحديث" value={supplier.updatedAtLabel} />
      </div>

      <div className="admin-supplier-network-facts mt-2 grid grid-cols-2 gap-2">
        <Info className="admin-supplier-url-info" label="الرابط الأساسي" value={supplier.baseUrl || "-"} dir="ltr" wrap />
        <Info className="admin-supplier-sync-info" label="مدة المزامنة" value={`${supplier.syncInterval} دقيقة`} dir="ltr" />
      </div>

      <p className="admin-supplier-features mt-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-[9px] font-bold leading-5 text-slate-500 dark:border-white/[0.06] dark:bg-[#0B1220]/70 dark:text-slate-400">
        <span>خصائص الربط</span>
        <b dir={featuresMissing ? "rtl" : "ltr"} style={{ textAlign: featuresMissing ? "right" : "left" }} title={supportedFeaturesLabel}>{supportedFeaturesLabel}</b>
      </p>

      {connectionResult && (
        <p className="admin-supplier-connection-result mt-2 rounded-xl bg-slate-50 px-3 py-2 text-[9px] font-bold text-slate-500 dark:bg-[#0B1220] dark:text-slate-300">
          {connectionResult.message}
        </p>
      )}

      <div className="admin-supplier-actions mt-3 grid grid-cols-2 gap-1.5 sm:grid-cols-3">
        <ActionButton busy={actionKey === `${supplier.id}:test`} disabled={busy} icon={Activity} label="اختبار" onClick={() => onTest(supplier)} tone="sky" />
        <ActionButton disabled={busy} icon={Boxes} label="المنتجات" onClick={() => onProducts(supplier)} tone="violet" />
        <ActionButton busy={actionKey === `${supplier.id}:sync`} disabled={busy || !supplier.active} icon={RefreshCw} label="مزامنة" onClick={() => onSync(supplier)} tone="cyan" />
        {xena && <ActionButton disabled={busy} icon={PlugZap} label="Xena" onClick={() => onXena?.(supplier)} tone="violet" />}
        <ActionButton disabled={busy} icon={Stethoscope} label="الأدوات" onClick={() => onTools(supplier)} tone="slate" />
        <ActionButton disabled={busy} icon={Pencil} label="تعديل" onClick={() => onEdit(supplier)} tone="amber" />
        <ActionButton disabled={busy} icon={CircleDollarSign} label="الرصيد" onClick={() => onTools(supplier)} tone="emerald" />
        <ActionButton disabled={busy} icon={Ban} label={supplier.active ? "تعطيل" : "تفعيل"} onClick={() => onToggle(supplier)} tone={supplier.active ? "orange" : "emerald"} />
        <ActionButton disabled={busy} icon={Archive} label="أرشفة" onClick={() => onArchive(supplier)} tone="rose" />
      </div>
    </article>
  );
}

function Info({ className = "", label, value, children, dir, wrap = false }) {
  return (
    <div className={`admin-supplier-info min-w-0 rounded-xl bg-slate-50 p-2 dark:bg-[#0B1220] ${className}`}>
      <p className="admin-supplier-info-label text-[7px] font-black text-slate-400">{label}</p>
      {children || (
        <p dir={dir} title={String(value)} className={`admin-supplier-info-value mt-1 text-[9px] font-black text-slate-700 dark:text-slate-200 ${wrap ? "break-all whitespace-normal" : "truncate"} ${dir === "ltr" ? "text-right" : ""}`}>
          {value}
        </p>
      )}
    </div>
  );
}

const actionToneClasses = {
  amber: "border-amber-200/80 bg-amber-500/10 text-amber-700 hover:bg-amber-500/15 dark:border-amber-400/15 dark:text-amber-300",
  cyan: "border-cyan-200/80 bg-cyan-500/10 text-cyan-700 hover:bg-cyan-500/15 dark:border-cyan-400/15 dark:text-cyan-300",
  emerald: "border-emerald-200/80 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/15 dark:border-emerald-400/15 dark:text-emerald-300",
  orange: "border-orange-200/80 bg-orange-500/10 text-orange-700 hover:bg-orange-500/15 dark:border-orange-400/15 dark:text-orange-300",
  rose: "border-rose-200/80 bg-rose-500/10 text-rose-700 hover:bg-rose-500/15 dark:border-rose-400/15 dark:text-rose-300",
  sky: "border-sky-200/80 bg-sky-500/10 text-sky-700 hover:bg-sky-500/15 dark:border-sky-400/15 dark:text-sky-300",
  slate: "border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200 dark:border-white/[0.07] dark:bg-white/[0.06] dark:text-slate-300 dark:hover:bg-white/[0.09]",
  violet: "border-violet-200/80 bg-violet-500/10 text-violet-700 hover:bg-violet-500/15 dark:border-violet-400/15 dark:text-violet-300",
};

function ActionButton({ busy, disabled, icon: Icon, label, onClick, tone = "slate" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || busy}
      className={`admin-supplier-action inline-flex min-h-9 items-center justify-center gap-1 rounded-xl border px-1 text-[7.5px] font-black transition disabled:cursor-not-allowed disabled:opacity-55 ${actionToneClasses[tone] || actionToneClasses.slate}`}
    >
      {busy ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Icon className="h-3 w-3" />}
      {busy ? "جارٍ التنفيذ" : label}
    </button>
  );
}
