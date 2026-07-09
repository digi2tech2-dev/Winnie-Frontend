import { Filter, RotateCcw, Search } from "lucide-react";
import { useState } from "react";

export default function ProductFilters({ filters, onChange, onSearch, onReset, mainCategories, subCategories, activeCount }) {
  const [open, setOpen] = useState(false);
  const visibleSubs = filters.mainCategoryId === "all" ? subCategories : subCategories.filter((item) => item.parentId === filters.mainCategoryId);
  const update = (key) => (event) => onChange(key, event.target.value);
  return (
    <form onSubmit={onSearch} className="px-1 sm:px-2">
      <div className="flex flex-wrap items-center gap-2">
        <label className="relative min-w-[220px] flex-1 sm:max-w-sm"><span className="admin-products-search-icon pointer-events-none absolute left-1 top-1 grid h-8 w-8 place-items-center rounded-md border border-violet-500/40 bg-violet-500/15 text-violet-300"><Search className="h-4 w-4" /></span><input type="text" value={filters.query} onChange={update("query")} aria-label="البحث في المنتجات" placeholder="ابحث باسم المنتج" className={`${inputClassName} admin-products-panel-input py-0 pl-11 pr-3`} /></label>
        <button type="button" onClick={() => setOpen((value) => !value)} className={`admin-products-panel-filter inline-flex h-10 items-center gap-2 rounded-lg border px-3 text-[11px] font-black transition ${open || activeCount ? "border-fuchsia-500/70 bg-fuchsia-500/15 text-fuchsia-200" : "border-[#1a2e5b] bg-[#060d23] text-slate-300 hover:border-violet-500/60"}`}><Filter className="h-4 w-4" />فلترة{activeCount > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-violet-500 px-1 text-[9px] text-white">{activeCount}</span>}</button>
      </div>
      {open && <div className="admin-products-filter-popover mt-3 grid gap-2 rounded-xl border border-[#172b58] bg-[#02091d] p-3 sm:grid-cols-2 xl:grid-cols-5">
        <Select value={filters.mainCategoryId} onChange={update("mainCategoryId")}><option value="all">كل الأقسام الرئيسية</option>{mainCategories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select>
        <Select value={filters.subCategoryId} onChange={update("subCategoryId")}><option value="all">كل الأقسام الفرعية</option>{visibleSubs.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select>
        <Select value={filters.status} onChange={update("status")}><option value="all">كل الحالات</option><option value="available">متوفر</option><option value="unavailable">غير متوفر</option><option value="paused">موقوف مؤقتًا</option></Select>
        <Select value={filters.linkType} onChange={update("linkType")}><option value="all">كل الأنواع</option><option value="manual">يدوي</option><option value="automatic">آلي</option></Select>
        <div className="flex gap-2"><button type="submit" className="h-10 flex-1 rounded-lg bg-gradient-to-l from-violet-600 to-blue-600 text-[11px] font-black text-white">تطبيق</button><button type="button" onClick={onReset} className="grid h-10 w-10 place-items-center rounded-lg border border-[#1a2e5b] text-slate-400 hover:text-white" aria-label="إعادة تعيين"><RotateCcw className="h-4 w-4" /></button></div>
      </div>}
    </form>
  );
}

function Select({ children, ...props }) { return <select {...props} className={`${inputClassName} admin-products-panel-input px-3`}>{children}</select>; }
const inputClassName = "h-10 w-full rounded-lg border border-[#1a2e5b] bg-[#02081b] text-[11px] font-bold text-slate-200 outline-none placeholder:text-slate-600 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/15";
