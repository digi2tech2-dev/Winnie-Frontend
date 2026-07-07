import { useState } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, CircleDollarSign, Search, Stethoscope, X } from "lucide-react";

export default function SupplierToolsModal({ onCheckOrder, onClose, onGetBalance, supplier }) {
  const [balance, setBalance] = useState(null);
  const [balanceError, setBalanceError] = useState("");
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [orderResult, setOrderResult] = useState(null);
  const [orderError, setOrderError] = useState("");
  const [orderLoading, setOrderLoading] = useState(false);

  if (!supplier) return null;

  const fetchBalance = async () => {
    setBalanceLoading(true);
    setBalanceError("");
    try {
      const result = await onGetBalance(supplier);
      setBalance(result.balance);
    } catch (error) {
      setBalance(null);
      setBalanceError(error.userMessage || error.message || "تعذر تحميل رصيد المورد.");
    } finally {
      setBalanceLoading(false);
    }
  };

  const checkOrder = async (event) => {
    event.preventDefault();
    if (!orderId.trim()) return;

    setOrderLoading(true);
    setOrderError("");
    try {
      const result = await onCheckOrder(supplier, orderId.trim());
      setOrderResult(result.result);
    } catch (error) {
      setOrderResult(null);
      setOrderError(error.userMessage || error.message || "تعذر التحقق من حالة طلب المورد.");
    } finally {
      setOrderLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[130] grid place-items-center bg-slate-950/60 p-4">
      <section className="w-full max-w-[560px] rounded-[28px] bg-white p-4 dark:bg-[#111827]">
        <header className="flex items-center gap-3">
          <Stethoscope className="h-5 w-5 text-violet-500" />
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-black dark:text-white">أدوات المورد</h2>
            <p className="truncate text-[8px] text-slate-400">{supplier.name}</p>
          </div>
          <button type="button" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.07]">
            <X className="h-4 w-4" />
          </button>
        </header>

        <section className="mt-4 rounded-2xl border border-slate-200 p-3 dark:border-white/10">
          <h3 className="text-[11px] font-black dark:text-white">الرصيد</h3>
          <button
            type="button"
            onClick={fetchBalance}
            disabled={balanceLoading || !supplier.active}
            className="mt-2 inline-flex h-9 items-center gap-1 rounded-xl bg-emerald-600 px-3 text-[9px] font-black text-white disabled:opacity-60"
          >
            <CircleDollarSign className="h-3.5 w-3.5" />
            {balanceLoading ? "جارٍ التحقق..." : "التحقق من الرصيد"}
          </button>
          {balanceError && <ErrorMessage message={balanceError} />}
          {balance && (
            <div className="mt-2 rounded-xl bg-emerald-50 p-2 text-[9px] font-black text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
              <p dir="ltr" className="text-right">{balance.amountLabel}</p>
              <p className="mt-1 text-slate-500 dark:text-slate-300">Checked {balance.checkedAtLabel}</p>
            </div>
          )}
        </section>

        <section className="mt-3 rounded-2xl border border-slate-200 p-3 dark:border-white/10">
          <h3 className="text-[11px] font-black dark:text-white">حالة طلب المورد</h3>
          <form onSubmit={checkOrder} className="mt-2 flex gap-2">
            <input
              value={orderId}
              onChange={(event) => setOrderId(event.target.value)}
              placeholder="معرّف طلب المورد"
              className="h-9 min-w-0 flex-1 rounded-xl bg-slate-50 px-3 text-[9px] font-black outline-none dark:bg-[#0B1220] dark:text-white"
              dir="ltr"
            />
            <button type="submit" disabled={orderLoading || !supplier.active} className="inline-flex items-center gap-1 rounded-xl bg-sky-600 px-3 text-[8px] font-black text-white disabled:opacity-60">
              <Search className="h-3 w-3" />
              {orderLoading ? "جارٍ التحقق..." : "تحقق"}
            </button>
          </form>
          {orderError && <ErrorMessage message={orderError} />}
          {orderResult && (
            <div className={`mt-2 rounded-xl p-2 text-[9px] font-black ${orderResult.dlq ? "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300" : "bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300"}`}>
              <p>الحالة: {orderResult.unifiedStatus || orderResult.providerStatus || "غير متاحة"}</p>
              <p dir="ltr" className="mt-1 text-right">طلب المورد: {orderResult.providerOrderId || orderResult.orderId || "-"}</p>
              {orderResult.dlqReason && <p className="mt-1">Review reason: {orderResult.dlqReason}</p>}
              {orderResult.errorMessage && <p className="mt-1">{orderResult.errorMessage}</p>}
            </div>
          )}
        </section>
      </section>
    </div>,
    document.body,
  );
}

function ErrorMessage({ message }) {
  return (
    <p className="mt-2 flex items-start gap-1 rounded-xl bg-rose-50 p-2 text-[9px] font-black text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
      <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
      <span>{message}</span>
    </p>
  );
}
