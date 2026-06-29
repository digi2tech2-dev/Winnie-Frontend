import { useState } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, Link2, RefreshCw, Search, X } from "lucide-react";

export default function ProductProviderLinkModal({
  error = "",
  linkState,
  loadingProducts = false,
  loadingProviders = false,
  onClose,
  onProviderChange,
  onSearchProducts,
  onSubmit,
  onUpdate,
  saving = false,
}) {
  const [search, setSearch] = useState("");

  if (!linkState.open || !linkState.product) return null;

  const selectedProvider = linkState.providers.find((provider) => provider.id === linkState.providerId);
  const selectedProduct = linkState.providerProducts.find((product) => product.id === linkState.providerProductId);

  return createPortal(
    <div className="fixed inset-0 z-[150] flex items-end justify-center bg-slate-950/60 p-0 backdrop-blur-[4px] sm:items-center sm:p-4 dark:bg-[#02040C]/80">
      <section role="dialog" aria-modal="true" aria-labelledby="provider-link-title" className="flex max-h-[92vh] w-full max-w-[680px] flex-col overflow-hidden rounded-t-[28px] border border-white/70 bg-white shadow-[0_34px_100px_rgba(15,23,42,0.34)] sm:rounded-[30px] dark:border-white/10 dark:bg-[#111827]">
        <header className="flex items-center gap-3 border-b border-slate-100 p-4 dark:border-white/10">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-violet-500/10 text-violet-600 dark:text-violet-300">
            <Link2 className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 id="provider-link-title" className="text-sm font-black text-slate-950 dark:text-white">Link product to provider</h2>
            <p className="truncate text-[9px] font-bold text-slate-400">{linkState.product.nameAr || linkState.product.name}</p>
          </div>
          <button type="button" onClick={onClose} disabled={saving} className="grid h-9 w-9 place-items-center rounded-xl text-slate-400 hover:bg-slate-100 disabled:opacity-60 dark:hover:bg-white/[0.07]">
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
          {error && (
            <div className="flex items-start gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-xs font-bold text-rose-700 dark:border-rose-400/20 dark:bg-rose-500/10 dark:text-rose-200">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <label className="block">
            <span className="mb-1 block text-[10px] font-black text-slate-500">Provider</span>
            <select
              value={linkState.providerId}
              onChange={(event) => onProviderChange(event.target.value)}
              disabled={loadingProviders || saving}
              className={fieldClassName}
            >
              <option value="">{loadingProviders ? "Loading providers..." : "Select provider"}</option>
              {linkState.providers.map((provider) => (
                <option key={provider.id} value={provider.id}>{provider.name}</option>
              ))}
            </select>
          </label>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              onSearchProducts(search);
            }}
            className="flex gap-2"
          >
            <label className="relative flex-1">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-violet-500" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                disabled={!linkState.providerId || loadingProducts || saving}
                placeholder="Search provider products"
                className="h-10 w-full rounded-2xl border border-slate-200 bg-slate-50 pe-9 ps-3 text-xs font-black outline-none disabled:opacity-60 dark:border-white/10 dark:bg-[#0B1220] dark:text-white"
              />
            </label>
            <button type="submit" disabled={!linkState.providerId || loadingProducts || saving} className="inline-flex h-10 items-center gap-1 rounded-2xl bg-slate-900 px-4 text-[10px] font-black text-white disabled:opacity-60 dark:bg-white dark:text-slate-950">
              {loadingProducts && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
              Search
            </button>
          </form>

          <div className="grid gap-2">
            {loadingProducts ? (
              <p className="rounded-2xl bg-slate-50 p-4 text-center text-xs font-black text-slate-400 dark:bg-[#0B1220]">Loading provider products...</p>
            ) : linkState.providerProducts.length ? (
              linkState.providerProducts.map((product) => {
                const selected = product.id === linkState.providerProductId;
                return (
                  <button
                    type="button"
                    key={product.id}
                    onClick={() => onUpdate({ providerProductId: product.id })}
                    disabled={saving}
                    className={`rounded-2xl border p-3 text-right transition disabled:opacity-60 ${
                      selected
                        ? "border-violet-300 bg-violet-50 dark:border-violet-400/30 dark:bg-violet-500/10"
                        : "border-slate-200 bg-slate-50 hover:border-violet-200 dark:border-white/10 dark:bg-[#0B1220]"
                    }`}
                  >
                    <strong className="block truncate text-[11px] font-black text-slate-900 dark:text-white">{product.name}</strong>
                    <span className="mt-1 block text-[9px] font-bold text-slate-400">
                      {product.providerName || selectedProvider?.name || "Provider"} | Qty {product.minQty ?? "-"} - {product.maxQty ?? "-"}
                    </span>
                  </button>
                );
              })
            ) : (
              <p className="rounded-2xl bg-slate-50 p-4 text-center text-xs font-black text-slate-400 dark:bg-[#0B1220]">No provider products returned.</p>
            )}
          </div>

          {(selectedProvider || selectedProduct) && (
            <div className="rounded-2xl border border-sky-200 bg-sky-50 p-3 text-[10px] font-bold text-sky-700 dark:border-sky-400/20 dark:bg-sky-500/10 dark:text-sky-200">
              {selectedProvider?.name || "Provider"} {selectedProduct ? `- ${selectedProduct.name}` : ""}
            </div>
          )}
        </div>

        <footer className="grid grid-cols-2 gap-2 border-t border-slate-100 bg-white p-3 dark:border-white/10 dark:bg-[#111827]">
          <button type="button" onClick={onClose} disabled={saving} className="h-11 rounded-xl border border-slate-200 text-[10px] font-black text-slate-600 disabled:opacity-60 dark:border-white/10 dark:text-white">
            Cancel
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={saving || !linkState.providerId || !linkState.providerProductId}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-violet-600 text-[10px] font-black text-white disabled:opacity-60"
          >
            {saving && <RefreshCw className="h-4 w-4 animate-spin" />}
            {saving ? "Linking..." : "Link through backend"}
          </button>
        </footer>
      </section>
    </div>,
    document.body,
  );
}

const fieldClassName = "h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 text-xs font-black outline-none disabled:opacity-60 dark:border-white/10 dark:bg-[#0B1220] dark:text-white";
