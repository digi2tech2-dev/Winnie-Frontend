import { useEffect, useMemo, useState } from "react";
import { ArrowDownLeft, ArrowLeft, ArrowRight, ArrowUpRight, CalendarDays, CheckCircle2, ChevronDown, CircleDollarSign, Download, Filter, Hash, ReceiptText, RefreshCw, Search, ShieldCheck, SlidersHorizontal, Sparkles, WalletCards, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { getWalletTransactions } from "../../api/wallet";
import { formatCurrency } from "../../api/adapters";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";

const pageSize = 15;
const initialFilters = { direction: "ALL", status: "ALL", from: "", to: "" };

function getVisiblePages(current, total) {
  if (total <= 5) return Array.from({ length: total }, (_, index) => index + 1);
  const start = Math.max(1, Math.min(current - 2, total - 4));
  return Array.from({ length: 5 }, (_, index) => start + index);
}

function escapeCsvValue(value) {
  let safeValue = String(value ?? "");
  if (/^[=+\-@]/.test(safeValue)) safeValue = `'${safeValue}`;
  return `"${safeValue.replace(/"/g, '""')}"`;
}

function downloadCsvFile(rows, fileName) {
  const csv = rows.map((row) => row.map(escapeCsvValue).join(",")).join("\r\n");
  const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export default function CustomerWalletTransactions({ basePath = "/customer" }) {
  const { token } = useAuth();
  const { isArabic } = useLanguage();
  const { t } = useTranslation("wallet");
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState(initialFilters);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: pageSize, total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query.trim()), 350);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    setPage(1);
  }, [debouncedQuery, filters.direction, filters.from, filters.status, filters.to]);

  useEffect(() => {
    if (!token) return undefined;

    let cancelled = false;

    const loadTransactions = async () => {
      setLoading(true);
      setError("");

      try {
        const result = await getWalletTransactions(token, {
          page,
          limit: pageSize,
          search: debouncedQuery || undefined,
          direction: filters.direction === "ALL" ? undefined : filters.direction,
          status: filters.status === "ALL" ? undefined : filters.status,
          fromDate: filters.from || undefined,
          toDate: filters.to || undefined,
        });
        if (!cancelled) {
          setTransactions(result.transactions);
          setPagination(result.pagination);
          // The backend is the source of truth for the active page. This also
          // keeps the UI in sync if the API clamps an out-of-range page.
          if (page !== result.pagination.page) {
            setPage(result.pagination.page);
          }
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(requestError.userMessage || t("transactions.loadError"));
          setTransactions([]);
          setPagination({ page, limit: pageSize, total: 0, pages: 1 });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadTransactions();

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, filters.direction, filters.from, filters.status, filters.to, page, reloadKey, t, token]);

  const filteredTransactions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const fromTime = filters.from ? new Date(`${filters.from}T00:00:00`).getTime() : null;
    const toTime = filters.to ? new Date(`${filters.to}T23:59:59.999`).getTime() : null;
    return transactions.filter((transaction) => {
      const time = transaction.date ? new Date(transaction.date).getTime() : null;
      const matchesQuery = !normalizedQuery || [
        transaction.id,
        transaction.reference,
        transaction.description,
        transaction.semanticTypeLabel,
        transaction.statusLabel,
        transaction.typeLabel,
        transaction.sourceType,
        transaction.amount,
      ].join(" ").toLowerCase().includes(normalizedQuery);
      return matchesQuery
        && (filters.direction === "ALL" || transaction.direction === filters.direction)
        && (filters.status === "ALL" || transaction.status === filters.status)
        && (!fromTime || (time && time >= fromTime))
        && (!toTime || (time && time <= toTime));
    });
  }, [filters, query, transactions]);

  const creditedTotal = filteredTransactions
    .filter((transaction) => transaction.direction === "CREDIT")
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const debitedTotal = filteredTransactions
    .filter((transaction) => transaction.direction === "DEBIT")
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const primaryCurrency = transactions[0]?.currency || "EGP";
  const statuses = [...new Set(transactions.map((item) => item.status).filter(Boolean))];
  const activeFilterCount = Object.values(filters).filter((value) => value && value !== "ALL").length;
  const currentPage = pagination.page || page;
  const visiblePages = getVisiblePages(currentPage, Math.max(1, pagination.pages || 1));
  const BackArrow = isArabic ? ArrowRight : ArrowLeft;

  const clearFilters = () => {
    setQuery("");
    setFilters(initialFilters);
  };

  const downloadTransactions = () => {
    if (!filteredTransactions.length) return;

    const headers = [
      t("transactions.export.id"),
      t("transactions.export.date"),
      t("transactions.export.type"),
      t("transactions.export.description"),
      t("transactions.export.direction"),
      t("transactions.export.amount"),
      t("transactions.export.currency"),
      t("transactions.export.status"),
      t("transactions.export.balanceBefore"),
      t("transactions.export.balanceAfter"),
    ];
    const rows = filteredTransactions.map((transaction) => [
      transaction.id,
      transaction.dateLabel,
      transaction.semanticTypeLabel || transaction.typeLabel,
      transaction.description,
      transaction.directionLabel || transaction.direction,
      transaction.amount,
      transaction.currency,
      transaction.statusLabel,
      transaction.balanceBefore,
      transaction.balanceAfter,
    ]);
    const dateStamp = new Date().toISOString().slice(0, 10);

    downloadCsvFile([headers, ...rows], `wallet-transactions-${dateStamp}.csv`);
  };

  return (
    <div
      dir={isArabic ? "rtl" : "ltr"}
      className="relative -mx-4 -mt-6 min-h-[calc(100vh-124px)] overflow-hidden bg-[radial-gradient(circle_at_85%_0%,rgba(139,92,246,0.09),transparent_28%),radial-gradient(circle_at_10%_28%,rgba(34,211,238,0.07),transparent_24%),#f6f8fc] px-4 pb-14 pt-6 text-slate-950 dark:bg-[radial-gradient(circle_at_85%_0%,rgba(124,58,237,0.16),transparent_30%),radial-gradient(circle_at_10%_28%,rgba(6,182,212,0.08),transparent_24%),#050814] dark:text-white sm:-mx-6 sm:px-6 lg:-mx-8"
    >
      <div className="pointer-events-none absolute -end-24 top-20 h-72 w-72 rounded-full border-[48px] border-violet-500/[0.04]" />
      <div className="relative mx-auto w-full max-w-6xl space-y-5">
        <header className="group relative overflow-hidden rounded-[30px] border border-white/80 bg-white/90 shadow-[0_22px_70px_rgba(42,51,83,0.11)] backdrop-blur-xl dark:border-white/10 dark:bg-[#0b1020]/90">
          <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-violet-600 via-fuchsia-500 to-cyan-400" />
          <div className="pointer-events-none absolute -end-10 -top-16 h-52 w-52 rounded-full bg-violet-500/10 blur-2xl transition group-hover:bg-violet-500/15" />
          <div className="relative p-4 sm:p-6 lg:p-8">
          <div className="flex items-center justify-between gap-3 sm:gap-5">
            <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
              <span className="relative grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[linear-gradient(145deg,#a855f7,#5b21b6)] text-white shadow-[0_18px_40px_rgba(124,58,237,0.34)] ring-4 ring-violet-500/10 sm:h-14 sm:w-14 sm:rounded-[20px] lg:h-16 lg:w-16 lg:rounded-[22px]">
                <ReceiptText className="h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7" strokeWidth={2.2} />
                <span className="absolute -end-1 -top-1 grid h-6 w-6 place-items-center rounded-full border-2 border-white bg-cyan-400 text-violet-950 dark:border-[#0b1020]"><Sparkles className="h-3 w-3" /></span>
              </span>
              <div className="min-w-0">
                <p className="mb-1 inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-[0.12em] text-violet-600 dark:text-violet-300 sm:text-[10px] lg:text-[11px] lg:tracking-[0.18em]"><ShieldCheck className="h-3 w-3 sm:h-3.5 sm:w-3.5" />{t("transactions.eyebrow")}</p>
                <h1 className="truncate text-lg font-black tracking-tight text-slate-950 dark:text-white sm:text-2xl lg:text-4xl">{t("transactions.title")}</h1>
                <p className="mt-1 line-clamp-1 max-w-2xl text-[11px] font-semibold text-slate-500 dark:text-white/[0.52] sm:text-xs lg:mt-2 lg:text-sm lg:leading-6">{t("transactions.description")}</p>
              </div>
            </div>

            <Link to={`${basePath}/wallet`} className="interactive-ring inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:border-violet-300 hover:text-violet-700 hover:shadow-md dark:border-white/10 dark:bg-[#060a18]/[0.82] dark:text-white/70 sm:h-11 sm:rounded-2xl sm:px-4 sm:text-sm lg:h-12 lg:px-5">
              <BackArrow className="h-4 w-4" />
              <span className="hidden min-[380px]:inline">{t("transactions.wallet")}</span>
            </Link>
          </div>
          </div>
        </header>

        <section className="grid grid-cols-3 gap-2 sm:gap-3 lg:gap-4">
          <SummaryCard icon={ArrowDownLeft} tone="emerald" label={t("transactions.creditedVisible")} value={formatCurrency(creditedTotal, primaryCurrency)} />
          <SummaryCard icon={ArrowUpRight} tone="rose" label={t("transactions.debitedVisible")} value={formatCurrency(debitedTotal, primaryCurrency)} />
          <SummaryCard icon={WalletCards} tone="violet" label={t("transactions.allTransactions")} value={String(pagination.total || 0)} />
        </section>

        <section className="rounded-[30px] border border-white/80 bg-white/95 p-4 shadow-[0_22px_70px_rgba(42,51,83,0.10)] backdrop-blur-xl dark:border-white/10 dark:bg-[#080d1e]/95 dark:shadow-[0_18px_50px_rgba(0,0,0,0.3)] sm:p-6">
          <div className="flex flex-row gap-2 sm:gap-3">
            <label className="site-filter-search group relative min-w-0 flex-1">
              <span className="site-filter-search-icon pointer-events-none"><Search className="h-4.5 w-4.5" /></span>
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t("transactions.searchPlaceholder")}
                className="site-filter-search-input"
              />
              {query && <button type="button" onClick={() => setQuery("")} aria-label={t("transactions.clearSearch")} className="absolute end-3 top-1/2 -translate-y-1/2 text-slate-400"><X className="h-4 w-4" /></button>}
            </label>
            <button type="button" onClick={() => setFiltersOpen((value) => !value)} aria-expanded={filtersOpen} className={`interactive-ring inline-flex h-14 shrink-0 items-center justify-center gap-2 rounded-xl border-2 px-3 text-sm font-black shadow-sm transition sm:px-5 ${filtersOpen || activeFilterCount ? "border-violet-600 bg-violet-600 text-white" : "border-slate-200 bg-white text-slate-700 hover:border-violet-400 hover:text-violet-700 dark:border-slate-700 dark:bg-[#0d1324] dark:text-white/80"}`}>
              <SlidersHorizontal className="h-5 w-5" strokeWidth={2.4} /><span className="hidden sm:inline">{t("transactions.filters")}</span>
              {activeFilterCount > 0 && <span className="rounded-full bg-violet-600 px-1.5 text-xs text-white">{activeFilterCount}</span>}
            </button>
            <button
              type="button"
              onClick={downloadTransactions}
              disabled={loading || Boolean(error) || filteredTransactions.length === 0}
              className="interactive-ring inline-flex h-14 shrink-0 items-center justify-center gap-2 rounded-xl border-2 border-slate-950 bg-slate-950 px-5 text-xs font-black text-white shadow-sm transition hover:border-violet-700 hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white dark:bg-white dark:text-slate-950 sm:text-sm"
              aria-label={t("transactions.downloadAria")}
              title={t("transactions.downloadTitle")}
            >
              <Download className="h-5 w-5" />
              <span className="hidden sm:inline">{t("transactions.download")}</span>
            </button>
          </div>
          {filtersOpen && (
            <div className="mt-4 grid gap-3 rounded-2xl border-2 border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-[#050918] sm:grid-cols-2 lg:grid-cols-5">
              <FilterSelect label={t("transactions.direction")} value={filters.direction} onChange={(value) => setFilters((current) => ({ ...current, direction: value }))} options={[["ALL", t("transactions.all")], ["CREDIT", t("transactions.credit")], ["DEBIT", t("transactions.debit")]]} />
              <FilterSelect label={t("transactions.status")} value={filters.status} onChange={(value) => setFilters((current) => ({ ...current, status: value }))} options={[["ALL", t("transactions.all")], ...statuses.map((status) => [status, transactions.find((item) => item.status === status)?.statusLabel || status])]} />
              <DateField label={t("transactions.fromDate")} value={filters.from} max={filters.to} onChange={(value) => setFilters((current) => ({ ...current, from: value }))} />
              <DateField label={t("transactions.toDate")} value={filters.to} min={filters.from} onChange={(value) => setFilters((current) => ({ ...current, to: value }))} />
              <button type="button" onClick={clearFilters} disabled={!activeFilterCount && !query} className="mt-auto h-11 rounded-xl text-sm font-black text-slate-500 hover:bg-slate-200 disabled:opacity-40 dark:hover:bg-white/10">{t("transactions.clearAll")}</button>
            </div>
          )}

          <div className="mt-5 space-y-3">
            {loading ? (
              <div className="rounded-[16px] border border-slate-200 bg-white px-4 py-8 text-center text-sm font-black text-slate-500 dark:border-white/10 dark:bg-[#050918] dark:text-white/50">
                {t("transactions.loading")}
              </div>
            ) : error ? (
              <div className="rounded-[16px] border border-rose-400/30 bg-rose-400/10 px-4 py-8 text-center text-sm font-black text-rose-700 dark:text-rose-300">
                <p>{error}</p><button type="button" onClick={() => setReloadKey((value) => value + 1)} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2 text-white dark:bg-white dark:text-slate-950"><RefreshCw className="h-4 w-4" />{t("transactions.tryAgain")}</button>
              </div>
            ) : filteredTransactions.length ? (
              filteredTransactions.map((transaction) => (
                <TransactionRow key={transaction.id} transaction={transaction} />
              ))
            ) : (
              <div className="rounded-[16px] border border-dashed border-slate-200 px-4 py-10 text-center dark:border-white/10">
                <Filter className="mx-auto h-8 w-8 text-slate-300 dark:text-white/20" />
                <p className="mt-3 text-sm font-black text-slate-500 dark:text-white/50">{query || activeFilterCount ? t("transactions.noResultsTitle") : t("transactions.emptyTitle")}</p>
                <p className="mt-1 text-xs font-semibold text-slate-400">{query || activeFilterCount ? t("transactions.noResultsDescription") : t("transactions.emptyDescription")}</p>
              </div>
            )}
          </div>

          {!loading && !error && pagination.total > 0 && (
            <div className="mt-5 flex items-center justify-center border-t-2 border-slate-100 pt-5 dark:border-slate-800">
              <nav className="flex flex-wrap items-center justify-center gap-1" aria-label={t("transactions.paginationLabel")}>
                <PageButton disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)} icon={isArabic ? ArrowRight : ArrowLeft} />
                {visiblePages.map((number) => <button type="button" key={number} aria-current={number === currentPage ? "page" : undefined} onClick={() => setPage(number)} className={`grid h-11 min-w-11 place-items-center rounded-xl border-2 px-2 text-sm font-black transition ${number === currentPage ? "border-violet-600 bg-violet-600 text-white shadow-[0_7px_18px_rgba(124,58,237,0.25)]" : "border-transparent text-slate-500 hover:border-slate-200 hover:bg-slate-50 dark:text-slate-400 dark:hover:border-slate-700 dark:hover:bg-white/5"}`}>{number}</button>)}
                <PageButton disabled={currentPage >= pagination.pages} onClick={() => setPage(currentPage + 1)} icon={isArabic ? ArrowLeft : ArrowRight} />
              </nav>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function SummaryCard({ icon: Icon, tone, label, value }) {
  const styles = {
    emerald: {
      icon: "border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300",
      glow: "bg-emerald-400",
      line: "from-emerald-500 to-cyan-400",
    },
    rose: {
      icon: "border-rose-200 bg-rose-50 text-rose-600 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300",
      glow: "bg-rose-400",
      line: "from-rose-500 to-orange-400",
    },
    violet: {
      icon: "border-violet-200 bg-violet-50 text-violet-600 dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-300",
      glow: "bg-violet-400",
      line: "from-violet-600 to-fuchsia-400",
    },
  }[tone];
  return (
    <article className="group relative flex min-w-0 items-center gap-1.5 overflow-hidden rounded-2xl border border-white bg-white/95 p-2 shadow-[0_12px_35px_rgba(42,51,83,0.08)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_45px_rgba(42,51,83,0.13)] dark:border-white/10 dark:bg-[#080d1e] sm:gap-3 sm:p-4 lg:gap-4 lg:rounded-[22px] lg:p-5">
      <span className={`pointer-events-none absolute -end-8 -top-10 h-24 w-24 rounded-full opacity-[0.08] blur-xl ${styles.glow}`} />
      <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl border shadow-sm transition duration-300 group-hover:scale-105 sm:h-11 sm:w-11 sm:rounded-2xl lg:h-14 lg:w-14 ${styles.icon}`}><Icon className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6" strokeWidth={2.3} /></span>
      <div className="relative min-w-0 flex-1">
        <p className="truncate text-[8px] font-bold text-slate-500 dark:text-white/50 sm:text-[10px] lg:text-xs">{label}</p>
        <p className="mt-0.5 truncate text-[11px] font-black tracking-tight text-slate-950 dark:text-white sm:mt-1 sm:text-base lg:mt-1.5 lg:text-2xl">{value}</p>
      </div>
      <span className={`absolute inset-x-5 bottom-0 h-0.5 origin-start scale-x-0 rounded-full bg-gradient-to-r transition-transform duration-300 group-hover:scale-x-100 ${styles.line}`} />
    </article>
  );
}

function FilterSelect({ label, value, onChange, options }) {
  return <label><span className="mb-1 block text-xs font-black text-slate-500">{label}</span><span className="relative block"><select value={value} onChange={(event) => onChange(event.target.value)} className="h-12 w-full appearance-none rounded-xl border-2 border-slate-200 bg-white px-3 pe-8 text-sm font-bold outline-none focus:border-violet-500 dark:border-slate-700 dark:bg-[#080d1e]">{options.map(([key, text]) => <option key={key} value={key}>{text}</option>)}</select><ChevronDown className="pointer-events-none absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2" /></span></label>;
}

function DateField({ label, value, onChange, min, max }) {
  return <label><span className="mb-1 block text-xs font-black text-slate-500">{label}</span><input type="date" value={value} min={min || undefined} max={max || undefined} onChange={(event) => onChange(event.target.value)} className="h-12 w-full rounded-xl border-2 border-slate-200 bg-white px-3 text-sm font-bold outline-none focus:border-violet-500 dark:border-slate-700 dark:bg-[#080d1e] dark:[color-scheme:dark]" /></label>;
}

function PageButton({ disabled, onClick, icon: Icon }) {
  return <button type="button" disabled={disabled} onClick={onClick} className="grid h-11 w-11 place-items-center rounded-xl border-2 border-slate-200 bg-white text-slate-700 transition hover:border-violet-400 hover:text-violet-700 disabled:cursor-default disabled:border-slate-100 disabled:bg-slate-50 disabled:text-slate-300 dark:border-slate-700 dark:bg-[#080d1e] dark:text-white dark:disabled:border-slate-800 dark:disabled:bg-[#080d1e] dark:disabled:text-slate-700"><Icon className="h-4 w-4" strokeWidth={2.5} /></button>;
}

function TransactionRow({ transaction }) {
  const isDebit = transaction.direction === "DEBIT";
  const amountClass = isDebit ? "text-rose-600 dark:text-rose-300" : "text-emerald-600 dark:text-emerald-300";
  const DirectionIcon = isDebit ? ArrowUpRight : ArrowDownLeft;

  return (
    <article className="group relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-3 shadow-[0_5px_18px_rgba(15,23,42,0.035)] transition duration-300 hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-[0_16px_34px_rgba(124,58,237,0.10)] dark:border-white/10 dark:bg-[#050918] dark:hover:border-violet-500/60 dark:hover:bg-[#0b1024] sm:p-4 lg:rounded-[20px] lg:p-5">
      <span className={`absolute inset-y-4 start-0 w-1 rounded-e-full ${isDebit ? "bg-rose-500" : "bg-emerald-500"}`} />
      <div className="grid grid-cols-[40px_minmax(0,1fr)_auto] items-center gap-2.5 sm:grid-cols-[48px_minmax(0,1fr)_auto] sm:gap-4 lg:grid-cols-[56px_minmax(0,1fr)_auto] lg:gap-5">
        <span className={`relative grid h-10 w-10 shrink-0 place-items-center rounded-xl border shadow-sm sm:h-12 sm:w-12 sm:rounded-2xl lg:h-14 lg:w-14 ${isDebit ? "border-rose-200 bg-gradient-to-br from-rose-50 to-orange-50 text-rose-600 dark:border-rose-500/30 dark:from-rose-500/15 dark:to-orange-500/5 dark:text-rose-300" : "border-emerald-200 bg-gradient-to-br from-emerald-50 to-cyan-50 text-emerald-600 dark:border-emerald-500/30 dark:from-emerald-500/15 dark:to-cyan-500/5 dark:text-emerald-300"}`}>
          <CircleDollarSign className="h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7" strokeWidth={2.1} />
          <span className={`absolute -bottom-1 -end-1 grid h-5 w-5 place-items-center rounded-md border-2 border-white text-white shadow-sm dark:border-[#050918] sm:h-6 sm:w-6 sm:rounded-lg ${isDebit ? "bg-rose-500" : "bg-emerald-500"}`}><DirectionIcon className="h-3 w-3 sm:h-3.5 sm:w-3.5" strokeWidth={3} /></span>
        </span>
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
            <h2 className="truncate text-xs font-black tracking-tight text-slate-950 dark:text-white sm:text-base lg:text-lg">{transaction.semanticTypeLabel}</h2>
            <span className="hidden shrink-0 items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-[9px] font-black text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300 min-[460px]:inline-flex sm:px-2.5 sm:text-[11px]"><CheckCircle2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />{transaction.statusLabel}</span>
          </div>
          <p className="mt-1 truncate text-[10px] font-semibold text-slate-500 dark:text-white/[0.45] sm:mt-1.5 sm:text-xs lg:mt-2 lg:text-sm">{transaction.description}</p>
          <p className="mt-0.5 inline-flex max-w-full items-center gap-1 truncate font-mono text-[8px] font-bold text-slate-400 dark:text-white/30 sm:mt-1 sm:text-[10px] lg:text-[11px]"><Hash className="h-2.5 w-2.5 shrink-0 sm:h-3 sm:w-3" />{transaction.id}</p>
        </div>
        <div className="min-w-[76px] rounded-xl bg-slate-50 px-2 py-2 text-end dark:bg-white/[0.035] sm:min-w-[125px] sm:rounded-2xl sm:px-3 lg:min-w-[165px] lg:px-4 lg:py-3">
          <p className={`whitespace-nowrap text-xs font-black tracking-tight sm:text-lg lg:text-2xl ${amountClass}`}>{transaction.amountLabel}</p>
          <p className="mt-1 inline-flex items-center justify-end gap-1 text-[8px] font-bold text-slate-500 dark:text-white/[0.45] sm:mt-1.5 sm:text-[10px] lg:text-xs"><CalendarDays className="h-3 w-3 sm:h-3.5 sm:w-3.5 lg:h-4 lg:w-4" /><span className="max-w-[72px] truncate sm:max-w-[120px] lg:max-w-none">{transaction.dateLabel}</span></p>
        </div>
      </div>
    </article>
  );
}
