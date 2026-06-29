import { Activity, Archive, Ban, Boxes, CircleDollarSign, Pencil, RefreshCw, Stethoscope } from "lucide-react";
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
  productCountLabel = "Backend catalog",
  supplier,
}) {
  const busy = actionKey.startsWith(`${supplier.id}:`);
  const connectionStatus = actionKey === `${supplier.id}:test`
    ? "testing"
    : connectionResult
      ? connectionResult.connected ? "connected" : "failed"
      : "unknown";

  return (
    <article className="rounded-[23px] border border-slate-200/90 bg-white p-4 shadow-[0_14px_34px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-[#111827]">
      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-blue-500 text-sm font-black text-white">
          {supplier.name.slice(0, 1).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-sm font-black text-slate-950 dark:text-white">{supplier.name}</h2>
          <p dir="ltr" className="mt-0.5 truncate text-right text-[9px] font-black text-slate-400">{supplier.code || supplier.id}</p>
        </div>
        <ConnectionStatusBadge status={supplier.active ? "active" : "inactive"} />
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <Info label="Connection"><ConnectionStatusBadge status={connectionStatus} /></Info>
        <Info label="Products" value={productCountLabel} />
        <Info label="Updated" value={supplier.updatedAtLabel} />
      </div>

      <div className="mt-2 grid grid-cols-2 gap-2">
        <Info label="Base URL" value={supplier.baseUrl || "-"} dir="ltr" />
        <Info label="Sync interval" value={`${supplier.syncInterval} min`} dir="ltr" />
      </div>

      <p className="mt-3 line-clamp-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-[9px] font-bold leading-5 text-slate-500 dark:border-white/[0.06] dark:bg-[#0B1220]/70 dark:text-slate-400">
        {supplier.supportedFeaturesLabel}
      </p>

      {connectionResult && (
        <p className="mt-2 rounded-xl bg-slate-50 px-3 py-2 text-[9px] font-bold text-slate-500 dark:bg-[#0B1220] dark:text-slate-300">
          {connectionResult.message}
        </p>
      )}

      <div className="mt-3 grid grid-cols-2 gap-1.5 sm:grid-cols-3">
        <ActionButton busy={actionKey === `${supplier.id}:test`} disabled={busy} icon={Activity} label="Test" onClick={() => onTest(supplier)} />
        <ActionButton disabled={busy} icon={Boxes} label="Products" onClick={() => onProducts(supplier)} />
        <ActionButton busy={actionKey === `${supplier.id}:sync`} disabled={busy || !supplier.active} icon={RefreshCw} label="Sync" onClick={() => onSync(supplier)} />
        <ActionButton disabled={busy} icon={Stethoscope} label="Tools" onClick={() => onTools(supplier)} />
        <ActionButton disabled={busy} icon={Pencil} label="Edit" onClick={() => onEdit(supplier)} />
        <ActionButton disabled={busy} icon={CircleDollarSign} label="Balance" onClick={() => onTools(supplier)} />
        <ActionButton disabled={busy} danger={supplier.active} icon={Ban} label={supplier.active ? "Disable" : "Enable"} onClick={() => onToggle(supplier)} />
        <ActionButton disabled={busy} danger icon={Archive} label="Archive" onClick={() => onArchive(supplier)} />
      </div>
    </article>
  );
}

function Info({ label, value, children, dir }) {
  return (
    <div className="min-w-0 rounded-xl bg-slate-50 p-2 dark:bg-[#0B1220]">
      <p className="text-[7px] font-black text-slate-400">{label}</p>
      {children || (
        <p dir={dir} title={String(value)} className={`mt-1 truncate text-[9px] font-black text-slate-700 dark:text-slate-200 ${dir === "ltr" ? "text-right" : ""}`}>
          {value}
        </p>
      )}
    </div>
  );
}

function ActionButton({ busy, danger, disabled, icon: Icon, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || busy}
      className={`inline-flex min-h-9 items-center justify-center gap-1 rounded-xl px-1 text-[7.5px] font-black transition disabled:cursor-not-allowed disabled:opacity-55 ${
        danger
          ? "bg-rose-500/10 text-rose-700 hover:bg-rose-500/15 dark:text-rose-300"
          : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-white/[0.06] dark:text-slate-300 dark:hover:bg-white/[0.09]"
      }`}
    >
      {busy ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Icon className="h-3 w-3" />}
      {busy ? "Working" : label}
    </button>
  );
}
