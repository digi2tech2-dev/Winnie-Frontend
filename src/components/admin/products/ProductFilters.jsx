import { ChevronDown, Filter, RotateCcw, Search, SlidersHorizontal } from "lucide-react";
import { useState } from "react";

export default function ProductFilters({ filters, onChange, onSearch, onReset, mainCategories, subCategories, activeCount }) {
  const [open, setOpen] = useState(true);
  const visibleSubs = filters.mainCategoryId === "all" ? subCategories : subCategories.filter((item) => item.parentId === filters.mainCategoryId);
  const update = (key) => (event) => onChange(key, event.target.value);

  return (
    <section className="overflow-hidden rounded-[24px] border border-slate-200/90 bg-white shadow-[0_14px_36px_rgba(15,23,42,0.055)] dark:border-white/[0.08] dark:bg-[#111827] dark:shadow-[0_0_20px_rgba(139,92,246,0.10)]">
      <button type="button" onClick={() => setOpen((current) => !current)} className="flex min-h-[64px] w-full items-center gap-3 px-4 text-right transition hover:bg-slate-50 dark:hover:bg-[#1A2335]" aria-expanded={open}>
        <span className="grid h-9 w-9 place-items-center rounded-2xl bg-gradient-to-br from-sky-500 to-violet-500 text-white"><SlidersHorizontal className="h-4.5 w-4.5" /></span>
        <span className="min-w-0 flex-1">
          <span className="inline-flex items-center gap-2 text-sm font-black text-slate-950 dark:text-white">فلاتر المنتجات {activeCount > 0 && <i className="not-italic grid h-5 min-w-5 place-items-center rounded-full bg-violet-500 px-1 text-[9px] text-white">{activeCount}</i>}</span>
          <span className="mt-0.5 block text-[9px] font-bold text-slate-400">بحث وتصفية دقيقة للكتالوج</span>
        </span>
        <ChevronDown className={`h-4.5 w-4.5 text-slate-400 transition ${open ? "rotate-180" : ""}`} />
      </button>
      <div className={`grid transition-[grid-template-rows] duration-300 ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
        <div className="overflow-hidden">
          <form onSubmit={onSearch} className="border-t border-slate-100 p-4 dark:border-white/[0.07]">
            <label className="relative block">
              <Search className="pointer-events-none absolute right-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-violet-500" />
              <input type="search" value={filters.query} onChange={update("query")} placeholder="ابحث باسم المنتج" className={`${inputClassName} pe-10`} />
            </label>
            <div className="mt-3 grid grid-cols-2 gap-2.5 lg:grid-cols-5">
              <FilterSelect label="القسم الرئيسي" value={filters.mainCategoryId} onChange={update("mainCategoryId")}>
                <option value="all">كل الأقسام</option>
                {mainCategories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </FilterSelect>
              <FilterSelect label="القسم الفرعي" value={filters.subCategoryId} onChange={update("subCategoryId")}>
                <option value="all">كل الأقسام الفرعية</option>
                {visibleSubs.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </FilterSelect>
              <FilterSelect label="الحالة" value={filters.status} onChange={update("status")}>
                <option value="all">الكل</option><option value="available">متوفر</option><option value="unavailable">غير متوفر</option><option value="paused">موقوف مؤقتًا</option>
              </FilterSelect>
              <FilterSelect label="النوع" value={filters.linkType} onChange={update("linkType")}>
                <option value="all">الكل</option><option value="manual">يدوي</option><option value="automatic">آلي</option>
              </FilterSelect>
              <FilterSelect label="الترتيب" value={filters.sort} onChange={update("sort")} wide>
                <option value="newest">المضافة حديثًا</option><option value="oldest">الأقدم</option><option value="priceHigh">السعر الأعلى</option><option value="priceLow">السعر الأقل</option><option value="displayOrder">ترتيب العرض</option>
              </FilterSelect>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2.5 sm:flex sm:justify-end">
              <button type="button" onClick={onReset} className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-slate-200 px-4 text-[10px] font-black text-slate-600 transition hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/[0.06]"><RotateCcw className="h-3.5 w-3.5" />إعادة تعيين</button>
              <button type="submit" className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-l from-[#7C3AED] to-[#3B82F6] px-5 text-[10px] font-black text-white shadow-[0_10px_24px_rgba(124,58,237,0.20)]"><Filter className="h-3.5 w-3.5" />بحث</button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}

function FilterSelect({ label, children, ...props }) {
  return <label className="min-w-0"><span className="mb-1 block text-[9px] font-black text-slate-500 dark:text-slate-300">{label}</span><select {...props} className={inputClassName}>{children}</select></label>;
}

const inputClassName = "h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-2.5 text-[10px] font-black text-slate-900 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10 dark:border-white/10 dark:bg-[#0B1220] dark:text-white";
