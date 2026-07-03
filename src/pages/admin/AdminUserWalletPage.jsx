import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, CircleDollarSign, Loader2, ReceiptText, RefreshCw, Search, WalletCards } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { getAdminUserWallet, getAdminUserWalletTransactions } from "../../api/adminWallet";
import { formatCurrency } from "../../api/adapters";
import { useAuth } from "../../context/AuthContext";

const pageSize = 20;

export default function AdminUserWalletPage() {
  const { id } = useParams();
  const { token } = useAuth();
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: pageSize, total: 0, pages: 1 });
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!token || !id) return;

    setLoading(true);
    setError("");

    try {
      const [walletResult, transactionResult] = await Promise.all([
        getAdminUserWallet(token, id),
        getAdminUserWalletTransactions(token, id, { page, limit: pageSize }),
      ]);
      setWallet(walletResult.wallet);
      setTransactions(transactionResult.transactions);
      setPagination(transactionResult.pagination);
    } catch (requestError) {
      setWallet(null);
      setTransactions([]);
      setPagination({ page, limit: pageSize, total: 0, pages: 1 });
      setError(requestError.userMessage || "Unable to load this user's wallet history.");
    } finally {
      setLoading(false);
    }
  }, [id, page, token]);

  useEffect(() => {
    void load();
  }, [load]);

  const filteredTransactions = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return transactions;

    return transactions.filter((transaction) => [
      transaction.id,
      transaction.description,
      transaction.semanticTypeLabel,
      transaction.sourceType,
      transaction.statusLabel,
      transaction.directionLabel,
    ].join(" ").toLowerCase().includes(needle));
  }, [query, transactions]);

  const user = wallet?.user;
  const currency = wallet?.currency || user?.currency || "USD";

  return (
    <div dir="rtl" className="space-y-4">
      <section className="flex flex-wrap items-center gap-3 rounded-[24px] border border-violet-200 bg-white p-4 dark:border-white/10 dark:bg-[#111827]">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-violet-600 text-white">
          <WalletCards className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[9px] font-black uppercase text-violet-500">User wallet</p>
          <h1 className="truncate text-2xl font-black text-slate-950 dark:text-white">
            {user?.name || "Wallet and transactions"}
          </h1>
          <p dir="ltr" className="mt-1 text-left text-[10px] font-bold text-slate-400">{user?.email || id}</p>
        </div>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-[10px] font-black text-slate-600 disabled:opacity-60 dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-300"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Refresh
        </button>
        <Link to="/admin/tools/users" className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-900 px-3 text-[10px] font-black text-white dark:bg-white dark:text-slate-950">
          <ArrowLeft className="h-4 w-4" />
          Users
        </Link>
      </section>

      {error && (
        <p className="rounded-2xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700 dark:border-rose-400/20 dark:bg-rose-500/10 dark:text-rose-200">
          {error}
        </p>
      )}

      <section className="grid gap-3 md:grid-cols-3">
        <SummaryCard icon={CircleDollarSign} label="Wallet balance" value={wallet?.balanceLabel || formatCurrency(0, currency, "ar-EG-u-nu-latn")} />
        <SummaryCard label="Credit limit" value={formatCurrency(wallet?.creditLimit || 0, currency, "ar-EG-u-nu-latn")} />
        <SummaryCard label="Credit used" value={formatCurrency(wallet?.creditUsed || 0, currency, "ar-EG-u-nu-latn")} />
      </section>

      <section className="rounded-[22px] border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-[#111827]">
        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-black text-slate-950 dark:text-white">Transaction history</h2>
            <p className="text-[9px] font-bold text-slate-400">{pagination.total} backend ledger movement(s)</p>
          </div>
          <label className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-violet-500" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search loaded transactions"
              className="h-11 w-full rounded-2xl bg-slate-50 pe-9 ps-3 text-[10px] font-black outline-none dark:bg-[#0B1220] dark:text-white"
            />
          </label>
        </div>

        <div className="mt-4 space-y-2">
          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm font-black text-slate-500 dark:border-white/10 dark:bg-[#0B1220] dark:text-slate-300">
              Loading wallet movements...
            </div>
          ) : filteredTransactions.length ? (
            filteredTransactions.map((transaction) => (
              <TransactionRow key={transaction.id} transaction={transaction} />
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-10 text-center dark:border-white/10">
              <ReceiptText className="mx-auto h-8 w-8 text-slate-300 dark:text-white/20" />
              <p className="mt-3 text-sm font-black text-slate-500 dark:text-white/50">No wallet transactions found.</p>
            </div>
          )}
        </div>

        {!loading && !error && pagination.pages > 1 && (
          <div className="mt-4 flex items-center justify-between gap-3">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              className="h-10 rounded-xl border border-slate-200 px-4 text-[10px] font-black disabled:opacity-45 dark:border-white/10 dark:text-white"
            >
              Previous
            </button>
            <span className="text-[10px] font-black text-slate-500 dark:text-slate-300">
              Page {pagination.page} of {pagination.pages}
            </span>
            <button
              type="button"
              disabled={page >= pagination.pages}
              onClick={() => setPage((current) => Math.min(pagination.pages, current + 1))}
              className="h-10 rounded-xl border border-slate-200 px-4 text-[10px] font-black disabled:opacity-45 dark:border-white/10 dark:text-white"
            >
              Next
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

function SummaryCard({ icon: Icon = WalletCards, label, value }) {
  return (
    <article className="rounded-[20px] border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-[#111827]">
      <Icon className="h-8 w-8 rounded-xl bg-violet-500/10 p-2 text-violet-600 dark:text-violet-300" />
      <p className="mt-3 text-[9px] font-black text-slate-400">{label}</p>
      <strong dir="ltr" className="mt-1 block text-right text-xl font-black text-slate-950 dark:text-white">{value}</strong>
    </article>
  );
}

function TransactionRow({ transaction }) {
  const credit = transaction.direction === "CREDIT";

  return (
    <article className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-[#0B1220] sm:grid-cols-[1fr_auto]">
      <div className="min-w-0">
        <p className="truncate text-sm font-black text-slate-900 dark:text-white">{transaction.description}</p>
        <p className="mt-1 text-[9px] font-bold text-slate-400">
          {transaction.semanticTypeLabel} - {transaction.sourceType || "WALLET"} - {transaction.dateLabel}
        </p>
      </div>
      <div className="text-left">
        <strong dir="ltr" className={credit ? "text-sm font-black text-emerald-600" : "text-sm font-black text-rose-600"}>
          {transaction.amountLabel}
        </strong>
        <p dir="ltr" className="mt-1 text-[9px] font-bold text-slate-400">
          {transaction.balanceBefore.toFixed(2)} {"->"} {transaction.balanceAfter.toFixed(2)} {transaction.currency}
        </p>
      </div>
    </article>
  );
}
