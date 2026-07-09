import { useState } from "react";
import {
  ChevronDown,
  Filter,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Sparkles,
  UserRound,
} from "lucide-react";
import DateFilterPicker from "../../DateFilterPicker";

const statusOptions = [
  ["all", "كل الحالات"],
  ["pending", "قيد الانتظار"],
  ["processing", "قيد التنفيذ"],
  ["manual_review", "مراجعة يدوية"],
  ["partial", "مكتمل جزئيًا"],
  ["completed", "مكتمل"],
  ["failed", "فشل"],
  ["canceled", "ملغي"],
];

export default function OrdersFilters({ filters, onChange, onApply, onReset, activeCount = 0 }) {
  const [isOpen, setIsOpen] = useState(true);
  const update = (key) => (event) => onChange(key, event.target.value);
  const updateDateRange = (range) => {
    Object.entries(range).forEach(([key, value]) => onChange(key, value));
  };

  return (
    <section className="overflow-visible rounded-[24px] border border-slate-200/90 bg-white/90 shadow-[0_16px_40px_rgba(15,23,42,0.06)] dark:border-white/[0.08] dark:bg-[#111827] dark:shadow-[0_0_22px_rgba(139,92,246,0.12)]">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="flex min-h-[68px] w-full items-center gap-3 px-4 text-right transition hover:bg-slate-50/80 sm:px-5 dark:hover:bg-[#1A2335]"
        aria-expanded={isOpen}
        aria-controls="orders-filters-content"
      >
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[#8B5CF6] to-[#3B82F6] text-white shadow-[0_10px_24px_rgba(124,58,237,0.24)]">
          <SlidersHorizontal className="h-5 w-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2 text-base font-black text-slate-950 dark:text-white">
            الفلاتر
            {activeCount > 0 && (
              <span className="grid h-5 min-w-5 place-items-center rounded-full bg-[#8B5CF6] px-1.5 text-[10px] font-black text-white">
                {activeCount.toLocaleString("ar-EG-u-nu-latn")}
              </span>
            )}
          </span>
          <span className="mt-0.5 block text-[11px] font-bold text-slate-500 dark:text-[#8A94A7]">
            البحث والحالة والمستخدم والتاريخ تُطبّق مباشرة على بيانات الخادم.
          </span>
        </span>
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
          <ChevronDown className={`h-4.5 w-4.5 transition duration-300 ${isOpen ? "rotate-180" : ""}`} />
        </span>
      </button>

      <div
        id="orders-filters-content"
        className={`grid transition-[grid-template-rows] duration-300 ease-out ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
      >
        <div className={isOpen ? "overflow-visible" : "overflow-hidden"}>
          <form onSubmit={onApply} className="border-t border-slate-100 px-4 pb-4 pt-4 sm:px-5 sm:pb-5 dark:border-white/[0.07]">
            <div className="grid gap-3 lg:grid-cols-[1fr_260px]">
              <label className="relative block">
                <span className="mb-1.5 block text-[11px] font-black text-slate-600 dark:text-slate-300">بحث</span>
                <Search className="pointer-events-none absolute bottom-3.5 right-3.5 h-4.5 w-4.5 text-[#8B5CF6]" />
                <input
                  type="search"
                  value={filters.query}
                  onChange={update("query")}
                  placeholder="رقم الطلب أو معرّفه أو رقم طلب المورد أو قيمة مُدخلة"
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50/75 px-10 text-xs font-bold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-[#8B5CF6]/65 focus:bg-white focus:ring-4 focus:ring-[#8B5CF6]/10 sm:text-sm dark:border-white/10 dark:bg-[#0B1220] dark:text-white dark:focus:bg-[#0D1324]"
                />
              </label>

              <FilterField label="معرّف العميل" icon={UserRound}>
                <input
                  value={filters.userId}
                  onChange={update("userId")}
                  placeholder="معرّف المستخدم المكوّن من 24 حرفًا"
                  className={fieldClassName}
                  dir="ltr"
                />
              </FilterField>
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <FilterField label="الحالة" icon={Filter}>
                <select value={filters.status} onChange={update("status")} className={fieldClassName}>
                  {statusOptions.map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </FilterField>

              <FilterField label="نوع التنفيذ" icon={Sparkles}>
                <select value={filters.type} onChange={update("type")} className={fieldClassName}>
                  <option value="all">كل الأنواع</option>
                  <option value="automatic">تلقائي</option>
                  <option value="manual">يدوي</option>
                </select>
              </FilterField>

              <DateFilterPicker
                from={filters.dateFrom}
                to={filters.dateTo}
                preset={filters.datePreset === "month" ? "thisMonth" : filters.datePreset}
                onChange={updateDateRange}
              />

              <FilterField label="ترتيب الصفحة" icon={SlidersHorizontal}>
                <select value={filters.sort} onChange={update("sort")} className={fieldClassName}>
                  <option value="newest">الأحدث أولًا</option>
                  <option value="oldest">الأقدم أولًا</option>
                </select>
              </FilterField>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2.5 sm:flex sm:justify-end">
              <button
                type="button"
                onClick={onReset}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-xs font-black text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 dark:border-white/10 dark:bg-white/[0.045] dark:text-slate-300 dark:hover:bg-white/[0.08]"
              >
                <RotateCcw className="h-4 w-4" />
                إعادة ضبط
              </button>
              <button
                type="submit"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-gradient-to-l from-[#7C3AED] to-[#3B82F6] px-5 text-xs font-black text-white shadow-[0_12px_28px_rgba(124,58,237,0.22)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_34px_rgba(124,58,237,0.28)]"
              >
                <Filter className="h-4 w-4" />
                تطبيق الفلاتر
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}

const fieldClassName =
  "h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-900 outline-none transition focus:border-[#8B5CF6]/65 focus:ring-4 focus:ring-[#8B5CF6]/10 dark:border-white/10 dark:bg-[#0B1220] dark:text-white";

function FilterField({ label, icon: Icon, children }) {
  return (
    <label className="block min-w-0">
      <span className="mb-1.5 flex items-center gap-1.5 text-[11px] font-black text-slate-600 dark:text-slate-300">
        <Icon className="h-3.5 w-3.5 text-[#8B5CF6] dark:text-[#C084FC]" />
        {label}
      </span>
      {children}
    </label>
  );
}
