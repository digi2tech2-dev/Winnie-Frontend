import { useMemo, useState } from "react";
import { ArrowLeft, CalendarDays, CheckCircle2, CircleDollarSign, Download, ReceiptText, Search } from "lucide-react";
import { Link } from "react-router-dom";

const topUpTransactions = [
  {
    id: "TX-5208",
    title: "Balance top-up",
    method: "Visa **** 4242",
    amount: 500,
    date: "June 15, 2026",
    time: "12:42 AM",
    status: "Completed",
  },
  {
    id: "TX-5184",
    title: "Balance top-up",
    method: "Apple Pay",
    amount: 250,
    date: "June 12, 2026",
    time: "4:05 PM",
    status: "Completed",
  },
];

const formatMoney = (value) => new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
}).format(value);

export default function CustomerWalletTransactions({ basePath = "/customer" }) {
  const [query, setQuery] = useState("");
  const total = topUpTransactions.reduce((sum, transaction) => sum + transaction.amount, 0);
  const filteredTransactions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return topUpTransactions;
    return topUpTransactions.filter((transaction) => `${transaction.id} ${transaction.method}`.toLowerCase().includes(normalizedQuery));
  }, [query]);

  return (
    <div
      dir="ltr"
      className="-mx-4 -mt-6 min-h-[calc(100vh-124px)] overflow-hidden bg-[#F8FCFF] px-4 pb-10 pt-5 text-slate-950 dark:bg-[#020615] dark:text-white sm:-mx-6 sm:px-6 lg:-mx-8"
    >
      <div className="mx-auto w-full max-w-[880px] space-y-5">
        <header className="rounded-[20px] border border-[#8B5CF6]/[0.14] bg-[linear-gradient(135deg,rgba(139,92,246,0.13),rgba(255,255,255,0.96)_42%)] p-4 shadow-soft backdrop-blur-xl dark:border-[#8B5CF6]/[0.18] dark:bg-[linear-gradient(135deg,rgba(139,92,246,0.24),rgba(8,13,30,0.98)_42%)] dark:shadow-[0_18px_54px_rgba(0,0,0,0.34)] sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[linear-gradient(145deg,#a855f7,#5b21b6)] text-white shadow-[0_14px_34px_rgba(139,92,246,0.38)]">
                <ReceiptText className="h-6 w-6" />
              </span>
              <div className="min-w-0">
                <h1 className="text-2xl font-black text-slate-950 dark:text-white sm:text-3xl">Balance top-ups</h1>
                <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-white/[0.52]">Your balance addition history in one place.</p>
              </div>
            </div>

            <Link to={`${basePath}/wallet`} className="interactive-ring inline-flex h-11 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white/80 px-4 text-sm font-black text-slate-600 dark:border-white/10 dark:bg-[#060a18]/[0.82] dark:text-white/70">
              <ArrowLeft className="h-4 w-4" />
              Wallet
            </Link>
          </div>
        </header>

        <section className="grid grid-cols-2 gap-3">
          <SummaryCard label="Total added" value={formatMoney(total)} />
          <SummaryCard label="Top-up operations" value={String(topUpTransactions.length)} />
        </section>

        <section className="rounded-[18px] border border-slate-200 bg-white/90 p-4 shadow-soft backdrop-blur-xl dark:border-white/[0.07] dark:bg-[#080d1e]/[0.96] dark:shadow-[0_16px_42px_rgba(0,0,0,0.28)]">
          <div className="flex items-center gap-3">
            <label className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 dark:text-white/[0.38]" />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by transaction ID or method"
                className="h-12 w-full rounded-full border border-slate-200 bg-white px-12 text-sm font-semibold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-[#8B5CF6]/70 focus:ring-4 focus:ring-[#8B5CF6]/15 dark:border-white/10 dark:bg-[#050918] dark:text-white dark:placeholder:text-white/[0.34]"
              />
            </label>
            <button type="button" className="interactive-ring grid h-12 w-12 shrink-0 place-items-center rounded-full border border-slate-200 bg-white text-[#8B5CF6] dark:border-white/10 dark:bg-[#050918] dark:text-[#A855F7]" aria-label="Download top-up history" title="Download">
              <Download className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-5 space-y-3">
            {filteredTransactions.length ? filteredTransactions.map((transaction) => (
              <TransactionRow key={transaction.id} transaction={transaction} />
            )) : (
              <div className="rounded-[16px] border border-dashed border-slate-200 px-4 py-10 text-center dark:border-white/10">
                <ReceiptText className="mx-auto h-8 w-8 text-slate-300 dark:text-white/20" />
                <p className="mt-3 text-sm font-black text-slate-500 dark:text-white/50">No top-up operations found.</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function SummaryCard({ label, value }) {
  return (
    <article className="min-w-0 rounded-[16px] border border-slate-200 bg-white/90 p-3 shadow-soft backdrop-blur-xl dark:border-white/[0.07] dark:bg-[#080d1e]/[0.96] sm:p-4">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 text-white"><CircleDollarSign className="h-5 w-5" /></span>
      <p className="mt-3 text-xs font-bold text-slate-500 dark:text-white/50 sm:text-sm">{label}</p>
      <p className="mt-1 break-words text-lg font-black text-slate-950 dark:text-white sm:text-2xl">{value}</p>
    </article>
  );
}

function TransactionRow({ transaction }) {
  return (
    <article className="group rounded-[16px] border border-slate-200 bg-white p-4 transition hover:border-[#8B5CF6]/40 hover:bg-[#F5F3FF] dark:border-white/[0.07] dark:bg-[#050918] dark:hover:bg-[#0b1024]">
      <div className="flex flex-wrap items-center gap-4">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-emerald-500/12 text-emerald-600 dark:text-emerald-300"><CircleDollarSign className="h-6 w-6" /></span>
        <div className="min-w-[180px] flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-black text-slate-950 dark:text-white sm:text-lg">{transaction.title}</h2>
            <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-2.5 py-1 text-xs font-black text-emerald-600 dark:text-emerald-300">{transaction.status}</span>
          </div>
          <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-white/[0.45]">{transaction.method} · {transaction.id}</p>
        </div>
        <div className="min-w-[150px] sm:text-right">
          <p className="text-xl font-black text-emerald-600 dark:text-emerald-300">+{formatMoney(transaction.amount)}</p>
          <p className="mt-1 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 dark:text-white/[0.45]"><CalendarDays className="h-4 w-4" />{transaction.date} · {transaction.time}</p>
        </div>
        <CheckCircle2 className="ml-auto hidden h-5 w-5 text-emerald-500 sm:block" />
      </div>
    </article>
  );
}
