import { ChevronLeft, ChevronRight } from "lucide-react";

function getVisiblePages(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1);
  const candidates = new Set([1, total, current - 1, current, current + 1]);
  const pages = [...candidates].filter((page) => page >= 1 && page <= total).sort((a, b) => a - b);
  const result = [];
  pages.forEach((page, index) => {
    if (index && page - pages[index - 1] > 1) result.push(`gap-${page}`);
    result.push(page);
  });
  return result;
}

export default function AdminPagination({ page = 1, pages = 1, total = 0, loading = false, onChange }) {
  const totalPages = Math.max(1, Number(pages) || 1);
  const currentPage = Math.min(totalPages, Math.max(1, Number(page) || 1));
  if (totalPages <= 1) return null;

  const goTo = (nextPage) => {
    const safePage = Math.min(totalPages, Math.max(1, nextPage));
    if (!loading && safePage !== currentPage) onChange?.(safePage);
  };

  return (
    <nav dir="ltr" aria-label="التنقل بين الصفحات" className="flex flex-wrap items-center justify-center gap-2 py-4">
      <button
        type="button"
        aria-label="الصفحة السابقة"
        disabled={loading || currentPage <= 1}
        onClick={() => goTo(currentPage - 1)}
        className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-violet-300 hover:text-violet-700 disabled:cursor-not-allowed disabled:opacity-35 dark:border-white/10 dark:bg-[#111827] dark:text-slate-300"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      {getVisiblePages(currentPage, totalPages).map((item) => (
        typeof item === "number" ? (
          <button
            key={item}
            type="button"
            aria-label={`الصفحة ${item}`}
            aria-current={item === currentPage ? "page" : undefined}
            disabled={loading}
            onClick={() => goTo(item)}
            className={`h-10 min-w-10 rounded-xl px-3 text-xs font-black shadow-sm transition ${
              item === currentPage
                ? "bg-gradient-to-br from-violet-600 to-fuchsia-500 text-white shadow-violet-500/25"
                : "border border-slate-200 bg-white text-slate-600 hover:border-violet-300 hover:text-violet-700 dark:border-white/10 dark:bg-[#111827] dark:text-slate-300"
            }`}
          >
            {item}
          </button>
        ) : <span key={item} className="px-1 text-slate-400">…</span>
      ))}

      <button
        type="button"
        aria-label="الصفحة التالية"
        disabled={loading || currentPage >= totalPages}
        onClick={() => goTo(currentPage + 1)}
        className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-violet-300 hover:text-violet-700 disabled:cursor-not-allowed disabled:opacity-35 dark:border-white/10 dark:bg-[#111827] dark:text-slate-300"
      >
        <ChevronRight className="h-4 w-4" />
      </button>

      <span dir="rtl" className="w-full text-center text-[10px] font-bold text-slate-400">
        صفحة {currentPage} من {totalPages}{total ? ` · ${Number(total).toLocaleString("ar-EG-u-nu-latn")} نتيجة` : ""}
      </span>
    </nav>
  );
}
