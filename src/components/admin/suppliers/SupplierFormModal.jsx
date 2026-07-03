import { useState } from "react";
import { createPortal } from "react-dom";
import { Save, Server, X } from "lucide-react";

const authTypeOptions = [
  { value: "NONE", label: "No authentication" },
  { value: "API_KEY", label: "API Key" },
  { value: "BEARER_TOKEN", label: "Bearer Token" },
  { value: "USERNAME_PASSWORD", label: "Username and Password" },
];

const integrationTypeOptions = [
  { value: "API", label: "API" },
];

export default function SupplierFormModal({ error = "", open, supplier, onClose, onSave, saving = false }) {
  if (!open) return null;

  return createPortal(
    <SupplierFormContent
      key={supplier?.id || "new-provider"}
      backendError={error}
      onClose={onClose}
      onSave={onSave}
      saving={saving}
      supplier={supplier}
    />,
    document.body,
  );
}

function SupplierFormContent({ supplier, backendError, onClose, onSave, saving }) {
  const editing = Boolean(supplier);
  const [form, setForm] = useState({
    apiToken: "",
    authType: supplier?.authType || "NONE",
    baseUrl: supplier?.baseUrl || "",
    integrationType: supplier?.integrationType || "API",
    isActive: supplier?.active ?? true,
    name: supplier?.name || "",
    slug: supplier?.slug || "",
    supportedFeaturesText: (supplier?.supportedFeatures || []).join("\n"),
    syncInterval: supplier?.syncInterval ?? 60,
  });
  const [error, setError] = useState("");

  const update = (key, value) => {
    setError("");
    setForm((current) => ({ ...current, [key]: value }));
  };

  const submit = (event) => {
    event.preventDefault();
    if (saving) return;

    if (!form.name.trim() || !form.baseUrl.trim() || (!editing && !form.slug.trim())) {
      setError(editing ? "Provider name and base URL are required by the backend." : "Provider name, code, and base URL are required.");
      return;
    }

    onSave(form);
  };

  return (
    <div className="fixed inset-0 z-[130] flex items-end justify-center bg-slate-950/60 sm:items-center sm:p-4">
      <section className="flex max-h-[92dvh] w-full max-w-[620px] flex-col rounded-t-[28px] bg-white sm:rounded-[28px] dark:bg-[#111827]">
        <header className="flex items-center gap-3 border-b border-slate-100 p-4 dark:border-white/10">
          <Server className="h-5 w-5 text-violet-500" />
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-black dark:text-white">{editing ? "Edit provider" : "Add provider"}</h2>
            <p className="mt-0.5 text-[9px] font-bold text-slate-400">Provider secrets are stored only by the backend and are never displayed after save.</p>
          </div>
          <button type="button" onClick={onClose} disabled={saving} className="grid h-9 w-9 place-items-center rounded-xl text-slate-400 hover:bg-slate-100 disabled:opacity-60 dark:hover:bg-white/[0.07]">
            <X className="h-4 w-4" />
          </button>
        </header>

        <form id="supplier-form" onSubmit={submit} className="grid gap-3 overflow-y-auto p-4 sm:grid-cols-2">
          <Field label="Provider name">
            <input value={form.name} onChange={(event) => update("name", event.target.value)} className={inputClassName} />
          </Field>
          <Field label="Provider code">
            <input dir="ltr" value={form.slug} onChange={(event) => update("slug", event.target.value)} placeholder="provider-slug" className={inputClassName} />
          </Field>
          <Field label="Base API URL" wide={!editing}>
            <input dir="ltr" value={form.baseUrl} onChange={(event) => update("baseUrl", event.target.value)} placeholder="https://provider.example/api" className={inputClassName} />
          </Field>
          <Field label="Provider type / integration type">
            <select value={form.integrationType} onChange={(event) => update("integrationType", event.target.value)} className={inputClassName}>
              {integrationTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </Field>
          <Field label="Auth type">
            <select value={form.authType} onChange={(event) => update("authType", event.target.value)} className={inputClassName}>
              {authTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </Field>
          <label className="flex min-h-11 items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 text-[10px] font-black text-slate-600 dark:border-white/10 dark:bg-[#0B1220] dark:text-white">
            <span>Active provider</span>
            <input type="checkbox" checked={form.isActive} onChange={(event) => update("isActive", event.target.checked)} className="h-4 w-4 accent-violet-600" />
          </label>
          {editing && (
            <>
              <Field label="API token">
                <input
                  dir="ltr"
                  type="password"
                  value={form.apiToken}
                  onChange={(event) => update("apiToken", event.target.value)}
                  placeholder="Leave blank to keep backend credential"
                  className={inputClassName}
                />
              </Field>
              <Field label="Sync interval">
                <input dir="ltr" type="number" min="0" value={form.syncInterval} onChange={(event) => update("syncInterval", event.target.value)} className={inputClassName} />
              </Field>
              <Field label="Supported features" wide>
                <textarea
                  value={form.supportedFeaturesText}
                  onChange={(event) => update("supportedFeaturesText", event.target.value)}
                  rows={4}
                  placeholder="fetchProducts&#10;placeOrder&#10;checkOrder"
                  className={`${inputClassName} h-auto py-3`}
                />
              </Field>
            </>
          )}
          {(error || backendError) && <p className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-[10px] font-black text-rose-700 sm:col-span-2 dark:border-rose-400/20 dark:bg-rose-500/10 dark:text-rose-300">{error || backendError}</p>}
        </form>

        <footer className="sticky bottom-0 grid grid-cols-2 gap-2 border-t border-slate-100 bg-white p-3 dark:border-white/10 dark:bg-[#111827]">
          <button type="button" onClick={onClose} disabled={saving} className="h-11 rounded-xl border border-slate-200 text-[10px] font-black text-slate-600 disabled:opacity-60 dark:border-white/10 dark:text-white">
            Cancel
          </button>
          <button type="submit" form="supplier-form" disabled={saving} className="inline-flex h-11 items-center justify-center gap-1 rounded-xl bg-violet-600 text-[10px] font-black text-white disabled:opacity-60">
            <Save className="h-4 w-4" />
            {saving ? "Saving..." : editing ? "Save provider" : "Add provider"}
          </button>
        </footer>
      </section>
    </div>
  );
}

function Field({ label, wide, children }) {
  return (
    <label className={wide ? "sm:col-span-2" : ""}>
      <span className="mb-1 block text-[9px] font-black text-slate-500">{label}</span>
      {children}
    </label>
  );
}

const inputClassName = "h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 text-[10px] font-black outline-none focus:border-violet-300 focus:ring-4 focus:ring-violet-500/10 dark:border-white/10 dark:bg-[#0B1220] dark:text-white";
