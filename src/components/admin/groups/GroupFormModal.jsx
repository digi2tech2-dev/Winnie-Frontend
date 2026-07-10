import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Loader2, Save, UsersRound, X } from "lucide-react";

const FALLBACK_LABELS = {
  active: "Active",
  addGroup: "Add Group",
  inactive: "Inactive",
  markupPercentage: "Markup Percentage",
};

export default function GroupFormModal({ busy = false, labels = FALLBACK_LABELS, open, group, onClose, onSave }) {
  if (!open) return null;

  return createPortal(
    <Content busy={busy} group={group} labels={{ ...FALLBACK_LABELS, ...labels }} onClose={onClose} onSave={onSave} />,
    document.body,
  );
}

function Content({ busy, group, labels, onClose, onSave }) {
  const [form, setForm] = useState({
    isActive: group?.isActive ?? true,
    name: group?.name || "",
    percentage: group?.percentage ?? 0,
  });
  const [error, setError] = useState("");

  useEffect(() => {
    setForm({
      isActive: group?.isActive ?? true,
      name: group?.name || "",
      percentage: group?.percentage ?? 0,
    });
    setError("");
  }, [group]);

  useEffect(() => {
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = oldOverflow;
    };
  }, []);

  const submit = (event) => {
    event.preventDefault();
    const name = form.name.trim();
    const percentage = Number(form.percentage);

    if (!name) {
      setError(labels.nameRequired || "Group name is required.");
      return;
    }

    if (!Number.isFinite(percentage) || percentage < 0) {
      setError(labels.percentageRequired || "Markup percentage must be zero or greater.");
      return;
    }

    onSave({ ...form, name, percentage });
  };

  return (
    <div className="fixed inset-0 z-[130] flex items-end justify-center bg-slate-950/60 sm:items-center sm:p-4" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="flex max-h-[92dvh] w-full max-w-[520px] flex-col overflow-hidden rounded-t-[28px] bg-white sm:rounded-[28px] dark:bg-[#111827]">
        <header className="flex items-center gap-3 border-b border-slate-100 p-4 dark:border-white/10">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-violet-500/10 text-violet-600 dark:text-violet-300">
            <UsersRound className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-black text-slate-950 dark:text-white">{group ? labels.edit : labels.addGroup}</h2>
            <p className="text-[9px] font-bold text-slate-400">{labels.subtitle}</p>
          </div>
          <button onClick={onClose} disabled={busy} type="button" className="grid h-9 w-9 place-items-center rounded-xl bg-slate-100 disabled:opacity-60 dark:bg-white/[0.06]">
            <X className="h-4 w-4" />
          </button>
        </header>

        <form onSubmit={submit} className="overflow-y-auto p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={labels.groupName || "Group name"}>
              <input
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                disabled={busy}
                className={input}
              />
            </Field>
            <Field label={`${labels.markupPercentage} %`}>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.percentage}
                onChange={(event) => setForm({ ...form, percentage: event.target.value })}
                disabled={busy}
                className={input}
              />
            </Field>
          </div>

          <Field label={labels.status || "Status"} className="mt-3">
            <select
              value={form.isActive ? "active" : "inactive"}
              onChange={(event) => setForm({ ...form, isActive: event.target.value === "active" })}
              disabled={busy}
              className={input}
            >
              <option value="active">{labels.active}</option>
              <option value="inactive">{labels.inactive}</option>
            </select>
          </Field>

          {error && <p className="mt-3 rounded-xl bg-rose-50 p-2 text-[9px] font-black text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">{error}</p>}
        </form>

        <footer className="sticky bottom-0 grid grid-cols-2 gap-2 border-t border-slate-100 bg-white p-3 dark:border-white/10 dark:bg-[#111827]">
          <button type="button" onClick={onClose} disabled={busy} className="h-11 rounded-2xl border border-slate-200 text-xs font-black disabled:opacity-60 dark:border-white/10 dark:text-white">
            {labels.cancel || "Cancel"}
          </button>
          <button type="button" onClick={submit} disabled={busy} className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-gradient-to-l from-violet-600 to-blue-500 text-xs font-black text-white disabled:opacity-60">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {group ? labels.save || "Save" : labels.addGroup}
          </button>
        </footer>
      </section>
    </div>
  );
}

function Field({ label, className = "", children }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-[9px] font-black text-slate-500 dark:text-slate-300">{label}</span>
      {children}
    </label>
  );
}

const input = "h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 text-xs font-black outline-none focus:border-violet-400 disabled:cursor-not-allowed disabled:opacity-70 dark:border-white/10 dark:bg-[#0B1220] dark:text-white";
