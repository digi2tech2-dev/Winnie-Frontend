import { FolderPlus, LayoutGrid, Layers3, Plus } from "lucide-react";
import MainCategoryCard from "./MainCategoryCard";
import SubCategoryCard from "./SubCategoryCard";

export default function CategoriesCatalog({ mainCategories, subCategories, onAddMain, onAddSub, onEditMain, onEditSub, onDeleteMain, onDeleteSub }) {
  const parentNameById = Object.fromEntries(mainCategories.map((category) => [category.id, category.name]));

  return (
    <section className="rounded-[26px] border border-slate-200/90 bg-white/85 p-3.5 shadow-[0_16px_40px_rgba(15,23,42,0.055)] sm:p-5 dark:border-white/[0.08] dark:bg-[#0D1324]/90 dark:shadow-[0_0_22px_rgba(139,92,246,0.10)]">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-blue-500 text-white shadow-[0_10px_24px_rgba(124,58,237,0.22)]"><LayoutGrid className="h-5 w-5" /></span>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-black text-slate-950 dark:text-white">كتالوج الأقسام</h2>
          <p className="mt-0.5 text-[10px] font-bold text-slate-500 dark:text-[#8A94A7]">نظّم واجهة المتجر ومسارات تصفح المنتجات</p>
        </div>
        <button type="button" onClick={onAddMain} className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-2xl bg-violet-500/10 px-3 text-[10px] font-black text-violet-700 transition hover:bg-violet-500/15 dark:text-violet-300">
          <Plus className="h-4 w-4" /> إضافة قسم
        </button>
      </div>

      <div className="mt-5 flex items-end justify-between gap-3">
        <div>
          <h3 className="text-sm font-black text-slate-900 dark:text-white">الأقسام الرئيسية</h3>
          <p className="mt-0.5 text-[9px] font-bold text-slate-400">تظهر في الصفحة الرئيسية للمتجر</p>
        </div>
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[9px] font-black text-slate-500 dark:bg-white/[0.06] dark:text-slate-300">{mainCategories.length.toLocaleString("ar-EG")} أقسام</span>
      </div>
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {mainCategories.map((category) => <MainCategoryCard key={category.id} category={category} onEdit={onEditMain} onDelete={onDeleteMain} />)}
      </div>

      <div className="my-5 h-px bg-gradient-to-l from-transparent via-slate-200 to-transparent dark:via-white/10" />

      <div className="flex items-center gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-300"><Layers3 className="h-4.5 w-4.5" /></span>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-black text-slate-900 dark:text-white">الأقسام الفرعية</h3>
          <p className="mt-0.5 text-[9px] font-bold text-slate-400">تظهر داخل القسم الرئيسي التابع لها</p>
        </div>
        <button type="button" onClick={onAddSub} className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl border border-sky-200 bg-sky-50 px-2.5 text-[9px] font-black text-sky-700 transition hover:bg-sky-100 dark:border-sky-400/15 dark:bg-sky-400/10 dark:text-sky-300">
          <FolderPlus className="h-3.5 w-3.5" /> إضافة قسم فرعي
        </button>
      </div>
      <div className="mt-3 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        {subCategories.map((category) => <SubCategoryCard key={category.id} category={category} parentName={parentNameById[category.parentId]} onEdit={onEditSub} onDelete={onDeleteSub} />)}
      </div>
    </section>
  );
}
