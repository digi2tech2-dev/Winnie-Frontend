import { useCallback, useEffect, useMemo, useState } from "react";
import { Coins, Loader2, LockKeyhole, Pencil, Plus, Power, Search, Trash2, X } from "lucide-react";
import {
  createAdminCurrency,
  getAdminCurrencies,
  toggleAdminCurrency,
  updateAdminCurrency,
} from "../../api/adminCurrencies";
import ConfirmDialog from "../../components/admin/products/ConfirmDialog";
import EmptyState from "../../components/EmptyState";
import { SkeletonBlock } from "../../components/Skeletons";
import { useToast } from "../../components/ToastProvider";
import { useAuth } from "../../context/AuthContext";

export default function AdminCurrenciesPage() {
  const { token } = useAuth();
  const { showToast } = useToast();
  const [currencies, setCurrencies] = useState([]);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState(undefined);
  const [statusAction, setStatusAction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const filteredCurrencies = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return currencies;
    return currencies.filter((currency) => `${currency.code} ${currency.name}`.toLowerCase().includes(needle));
  }, [currencies, query]);

  const toast = useCallback((title, message, type = "success") => {
    showToast({ type, title, message });
  }, [showToast]);

  const load = useCallback(async () => {
    if (!token) return;

    setLoading(true);
    setError("");

    try {
      const result = await getAdminCurrencies(token);
      setCurrencies(result.currencies);
    } catch (requestError) {
      setCurrencies([]);
      setError(requestError.userMessage || "Unable to load currencies.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  const saveCurrency = async (values) => {
    if (busy) return;

    setBusy(true);
    setError("");

    try {
      if (values.exists) {
        await updateAdminCurrency(token, values.code, values);
      } else {
        await createAdminCurrency(token, values);
      }
      await load();
      toast(values.exists ? "تم تعديل سعر الصرف" : "تمت إضافة العملة", values.code);
      setEditing(undefined);
    } catch (requestError) {
      const message = requestError.userMessage || requestError.message || "Currency could not be saved.";
      setError(message);
      toast("تعذر حفظ العملة", message, "error");
    } finally {
      setBusy(false);
    }
  };

  const runStatusAction = async () => {
    if (!statusAction || busy) return;

    setBusy(true);
    setError("");

    try {
      await toggleAdminCurrency(token, statusAction.currency.code, !statusAction.currency.isActive);
      await load();
      toast("تم تحديث حالة العملة", statusAction.currency.code, "success");
      setStatusAction(null);
    } catch (requestError) {
      const message = requestError.userMessage || requestError.message || "Currency status could not be updated.";
      setError(message);
      toast("تعذر تحديث الحالة", message, "error");
    } finally {
      setBusy(false);
    }
  };

  const deleteUnsupported = (currency) => {
    toast("الحذف غير متاح", `لا يوجد route خلفي لحذف ${currency.code}. استخدم التعطيل بدلا من ذلك.`, "info");
  };

  return (
    <div dir="rtl" className="space-y-4">
      <Header busy={busy} onCreate={() => setEditing(null)} />

      {error && (
        <p className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-xs font-bold text-amber-800 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-200">
          {error}
        </p>
      )}

      <section className="rounded-[23px] border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-[#111827]">
        <h2 className="text-sm font-black dark:text-white">عملات الخلفية</h2>
        <label className="relative mt-3 block">
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-violet-500" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="ابحث عن عملة بالاسم أو الرمز"
            className="h-11 w-full rounded-2xl bg-slate-50 pe-9 ps-3 text-[10px] font-black dark:bg-[#0B1220] dark:text-white"
          />
        </label>
      </section>

      <section>
        {loading ? (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => <SkeletonBlock key={index} className="h-44 rounded-[22px]" />)}
          </div>
        ) : filteredCurrencies.length ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filteredCurrencies.map((currency) => (
              <CurrencyCard
                key={currency.code}
                currency={currency}
                onDelete={() => deleteUnsupported(currency)}
                onEdit={() => setEditing(currency)}
                onToggle={() => setStatusAction({ currency })}
              />
            ))}
          </div>
        ) : (
          <EmptyState icon={Coins} title="لا توجد عملات من الخلفية" />
        )}
      </section>

      <CurrencyModal
        busy={busy}
        currency={editing}
        open={editing !== undefined}
        onClose={() => setEditing(undefined)}
        onSave={saveCurrency}
      />

      <ConfirmDialog
        open={Boolean(statusAction)}
        busy={busy}
        tone="warning"
        title="تأكيد تغيير حالة العملة"
        message={`سيتم ${statusAction?.currency?.isActive ? "تعطيل" : "تفعيل"} ${statusAction?.currency?.code || ""} من خلال route الخلفية.`}
        confirmLabel={statusAction?.currency?.isActive ? "تعطيل" : "تفعيل"}
        onCancel={() => setStatusAction(null)}
        onConfirm={runStatusAction}
      />
    </div>
  );
}

function Header({ busy, onCreate }) {
  return (
    <section className="flex items-center gap-3 rounded-[26px] border border-violet-200 bg-gradient-to-l from-white to-violet-50 p-5 dark:border-white/10 dark:bg-[linear-gradient(135deg,#111827,#17152A)]">
      <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-blue-500 text-white">
        <Coins className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <h1 className="text-2xl font-black dark:text-white">إدارة العملات</h1>
        <p className="text-[9px] font-bold text-slate-400">سعر المنصة هو مصدر الحقيقة للتحويلات.</p>
      </div>
      <button
        type="button"
        disabled={busy}
        onClick={onCreate}
        className="inline-flex h-10 items-center gap-1 rounded-xl bg-violet-600 px-3 text-[9px] font-black text-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
        إضافة عملة
      </button>
    </section>
  );
}

function CurrencyCard({ currency, onDelete, onEdit, onToggle }) {
  const fixed = currency.code === "USD";

  return (
    <article className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-[0_12px_30px_rgba(15,23,42,0.05)] dark:border-white/10 dark:bg-[#111827]">
      <div className="flex items-center gap-3">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-violet-500/10 text-lg font-black text-violet-700 dark:text-violet-200">
          {currency.symbol}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-black dark:text-white">{currency.name}</h3>
          <p dir="ltr" className="text-right text-[9px] font-black text-violet-600">{currency.code}</p>
        </div>
        {fixed && (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-[7px] font-black text-slate-500 dark:bg-white/[0.06]">
            <LockKeyhole className="h-2.5 w-2.5" />
            ثابت
          </span>
        )}
      </div>

      <div className="mt-3 rounded-2xl bg-violet-50 p-3 dark:bg-violet-500/[0.08]">
        <p className="text-[8px] font-black text-violet-500">سعر المنصة مقابل 1 USD</p>
        <strong dir="ltr" className="mt-1 block text-right text-xl text-violet-700 dark:text-violet-300">
          {currency.platformRate.toLocaleString("en-US", { maximumFractionDigits: 6 })} {currency.code}
        </strong>
        <p dir="ltr" className="mt-2 text-right text-[8px] font-bold text-slate-400">
          Market: {currency.marketRate ?? "-"} · Markup: {currency.markupPercentage}%
        </p>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <span className={`rounded-full px-2 py-1 text-[8px] font-black ${currency.isActive ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "bg-rose-500/10 text-rose-700 dark:text-rose-300"}`}>
          {currency.isActive ? "نشطة" : "غير نشطة"}
        </span>
        <span className="text-[8px] font-bold text-slate-400">{currency.updatedAtLabel}</span>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <ActionButton icon={Pencil} label="تعديل" onClick={onEdit} />
        <ActionButton icon={Power} label={currency.isActive ? "تعطيل" : "تفعيل"} danger={currency.isActive} disabled={fixed && currency.isActive} onClick={onToggle} />
        <ActionButton icon={Trash2} label="حذف" danger onClick={onDelete} />
      </div>
    </article>
  );
}

function CurrencyModal({ busy, currency, open, onClose, onSave }) {
  const exists = Boolean(currency);
  const [form, setForm] = useState(() => ({
    applyDebtAdjustment: false,
    code: currency?.code || "",
    isActive: currency?.isActive ?? true,
    marketRate: currency?.marketRate ?? "",
    markupPercentage: currency?.markupPercentage ?? 0,
    name: currency?.name || "",
    platformRate: currency?.platformRate ?? 1,
    symbol: currency?.symbol || "",
  }));

  useEffect(() => {
    setForm({
      applyDebtAdjustment: false,
      code: currency?.code || "",
      isActive: currency?.isActive ?? true,
      marketRate: currency?.marketRate ?? "",
      markupPercentage: currency?.markupPercentage ?? 0,
      name: currency?.name || "",
      platformRate: currency?.platformRate ?? 1,
      symbol: currency?.symbol || "",
    });
  }, [currency]);

  if (!open) return null;

  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const save = () => {
    if (!form.code || !form.platformRate || Number(form.platformRate) <= 0) return;
    onSave({
      ...form,
      code: String(form.code).toUpperCase(),
      exists,
      marketRate: form.marketRate === "" ? undefined : Number(form.marketRate),
      markupPercentage: Number(form.markupPercentage) || 0,
      platformRate: Number(form.platformRate),
    });
  };

  return (
    <div className="fixed inset-0 z-[150] grid place-items-center bg-slate-950/65 p-4">
      <section className="w-full max-w-[460px] rounded-[26px] bg-white p-4 dark:bg-[#111827]">
        <div className="flex items-center gap-3">
          <Coins className="h-5 w-5 text-violet-500" />
          <div className="flex-1">
            <h2 className="text-sm font-black dark:text-white">{exists ? "تعديل سعر الصرف" : "إضافة العملة"}</h2>
            <p className="text-[8px] text-slate-400">{form.code || "NEW"} · backend currency route</p>
          </div>
          <button type="button" onClick={onClose} disabled={busy}><X className="h-4 w-4" /></button>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Field disabled={exists} label="الرمز" value={form.code} onChange={(value) => set("code", value.toUpperCase().slice(0, 3))} />
          <Field disabled={exists} label="الاسم" value={form.name} onChange={(value) => set("name", value)} />
          <Field disabled={exists} label="الرمز المختصر" value={form.symbol} onChange={(value) => set("symbol", value)} />
          <Field label="سعر المنصة" type="number" value={form.platformRate} onChange={(value) => set("platformRate", value)} />
          {!exists && <Field label="سعر السوق" type="number" value={form.marketRate} onChange={(value) => set("marketRate", value)} />}
          <Field label="نسبة الهامش %" type="number" value={form.markupPercentage} onChange={(value) => set("markupPercentage", value)} />
          {!exists && (
            <label>
              <span className="mb-1 block text-[9px] font-black text-slate-500">الحالة</span>
              <select value={form.isActive ? "yes" : "no"} onChange={(event) => set("isActive", event.target.value === "yes")} className={input}>
                <option value="yes">نشطة</option>
                <option value="no">غير نشطة</option>
              </select>
            </label>
          )}
          {exists && (
            <label className="flex min-h-11 items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 text-[9px] font-black text-slate-600 dark:border-white/10 dark:bg-[#0B1220] dark:text-white">
              <span>تعديل أرصدة الديون</span>
              <input type="checkbox" checked={form.applyDebtAdjustment} onChange={(event) => set("applyDebtAdjustment", event.target.checked)} />
            </label>
          )}
        </div>

        <button
          type="button"
          disabled={busy}
          onClick={save}
          className="mt-4 h-11 w-full rounded-2xl bg-violet-600 text-[10px] font-black text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? "Working..." : exists ? "حفظ التعديل" : "إضافة العملة"}
        </button>
      </section>
    </div>
  );
}

function Field({ disabled = false, label, type = "text", value, onChange }) {
  return (
    <label>
      <span className="mb-1 block text-[9px] font-black text-slate-500">{label}</span>
      <input disabled={disabled} type={type} value={value} onChange={(event) => onChange(event.target.value)} className={`${input} disabled:cursor-not-allowed disabled:opacity-70`} />
    </label>
  );
}

function ActionButton({ disabled = false, danger = false, icon: Icon, label, onClick }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex h-9 items-center justify-center gap-1 rounded-xl text-[8px] font-black disabled:cursor-not-allowed disabled:opacity-45 ${
        danger ? "bg-rose-500/10 text-rose-700 dark:text-rose-300" : "bg-sky-500/10 text-sky-700 dark:text-sky-300"
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}

const input = "h-11 w-full rounded-2xl bg-slate-50 px-3 text-xs font-black outline-none dark:bg-[#0B1220] dark:text-white";
