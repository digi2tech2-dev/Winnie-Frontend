import { Filter, LayoutGrid, MoreVertical, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

const number = (value) => Number(value || 0).toLocaleString("ar-EG-u-nu-latn");

export default function CategoriesCatalog({ mainCategories, subCategories, products = [], onAddMain, onAddSub, onEditMain, onEditSub, onDeleteMain, onDeleteSub }) {
  const [mainQuery, setMainQuery] = useState("");
  const [subQuery, setSubQuery] = useState("");
  const [mainActiveOnly, setMainActiveOnly] = useState(false);
  const [subActiveOnly, setSubActiveOnly] = useState(false);
  const parentNameById = Object.fromEntries(mainCategories.map((category) => [category.id, category.name]));
  const mainRows = useMemo(() => mainCategories.filter((category) => {
    const matchesQuery = category.name?.toLocaleLowerCase("ar").includes(mainQuery.trim().toLocaleLowerCase("ar"));
    return matchesQuery && (!mainActiveOnly || category.visible !== false);
  }), [mainActiveOnly, mainCategories, mainQuery]);
  const subRows = useMemo(() => subCategories.filter((category) => {
    const query = subQuery.trim().toLocaleLowerCase("ar");
    const matchesQuery = category.name?.toLocaleLowerCase("ar").includes(query) || parentNameById[category.parentId]?.toLocaleLowerCase("ar").includes(query);
    return matchesQuery && (!subActiveOnly || category.isActive !== false);
  }), [parentNameById, subActiveOnly, subCategories, subQuery]);

  const mainCounts = useMemo(() => Object.fromEntries(mainCategories.map((category) => [category.id, {
    products: products.filter((product) => product.mainCategoryId === category.id).length,
    subs: subCategories.filter((sub) => sub.parentId === category.id).length,
  }])), [mainCategories, products, subCategories]);
  const subCounts = useMemo(() => Object.fromEntries(subCategories.map((category) => [category.id, products.filter((product) => product.subCategoryId === category.id).length])), [products, subCategories]);

  return (
    <div className="space-y-6">
      <CategoryPanel title="الأقسام الرئيسية" icon={LayoutGrid} addLabel="إضافة قسم رئيسي" onAdd={onAddMain} query={mainQuery} onQuery={setMainQuery} activeOnly={mainActiveOnly} onToggleActive={() => setMainActiveOnly((value) => !value)}>
        <table className="hidden w-full min-w-[760px] table-fixed text-right md:table">
          <SharedColumnWidths />
          <thead><tr><Th>القسم الرئيسي</Th><Th>عدد الأقسام الفرعية</Th><Th>عدد المنتجات</Th><Th>الحالة</Th><Th>الإجراءات</Th></tr></thead>
          <tbody>
            {mainRows.map((category) => (
              <tr key={category.id} className="admin-products-row h-16 border-t border-[#142654] transition hover:bg-blue-500/[0.035]">
                <Td><CategoryIdentity category={category} /></Td>
                <Td>{number(mainCounts[category.id]?.subs)}</Td>
                <Td>{number(mainCounts[category.id]?.products)}</Td>
                <Td><ActiveBadge active={category.visible !== false} /></Td>
                <Td><RowActions item={category} onEdit={onEditMain} onDelete={onDeleteMain} /></Td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="divide-y divide-[#142654] md:hidden">
          {mainRows.map((category) => <MobileCategoryCard key={category.id} category={category} active={category.visible !== false} details={[{ label: "الأقسام الفرعية", value: number(mainCounts[category.id]?.subs) }, { label: "المنتجات", value: number(mainCounts[category.id]?.products) }]} onEdit={onEditMain} onDelete={onDeleteMain} />)}
        </div>
      </CategoryPanel>

      <CategoryPanel title="الأقسام الفرعية" icon={LayoutGrid} addLabel="إضافة قسم فرعي" onAdd={onAddSub} query={subQuery} onQuery={setSubQuery} activeOnly={subActiveOnly} onToggleActive={() => setSubActiveOnly((value) => !value)}>
        <table className="hidden w-full min-w-[760px] table-fixed text-right md:table">
          <SharedColumnWidths />
          <thead><tr><Th>القسم الرئيسي</Th><Th>القسم الفرعي</Th><Th>عدد المنتجات</Th><Th>الحالة</Th><Th>الإجراءات</Th></tr></thead>
          <tbody>
            {subRows.map((category) => (
              <tr key={category.id} className="admin-products-row h-16 border-t border-[#142654] transition hover:bg-blue-500/[0.035]">
                <Td>{parentNameById[category.parentId] || "قسم غير محدد"}</Td>
                <Td><CategoryIdentity category={category} /></Td>
                <Td>{number(subCounts[category.id])}</Td>
                <Td><ActiveBadge active={category.isActive !== false} /></Td>
                <Td><RowActions item={category} onEdit={onEditSub} onDelete={onDeleteSub} /></Td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="divide-y divide-[#142654] md:hidden">
          {subRows.map((category) => <MobileCategoryCard key={category.id} category={category} active={category.isActive !== false} details={[{ label: "القسم الرئيسي", value: parentNameById[category.parentId] || "غير محدد" }, { label: "المنتجات", value: number(subCounts[category.id]) }]} onEdit={onEditSub} onDelete={onDeleteSub} />)}
        </div>
      </CategoryPanel>
    </div>
  );
}

function CategoryPanel({ activeOnly, addLabel, children, icon: Icon, onAdd, onQuery, onToggleActive, query, title }) {
  return (
    <section className="admin-products-panel relative overflow-hidden rounded-[22px] border border-[#17327b] bg-[#030b24] p-3 shadow-[0_0_0_1px_rgba(37,99,235,0.08),0_18px_50px_rgba(0,0,0,0.28),0_0_34px_rgba(37,99,235,0.08)] sm:p-4">
      <span className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-violet-600/[0.07] blur-3xl" />
      <header className="relative flex min-w-0 items-center gap-3 px-1 py-2 sm:gap-4 sm:px-2">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-fuchsia-500/60 bg-violet-500/10 text-fuchsia-300 shadow-[0_0_18px_rgba(192,38,211,0.22)] sm:h-11 sm:w-11"><Icon className="h-5 w-5" /></span>
        <h2 className="min-w-0 flex-1 whitespace-nowrap text-lg font-black text-white sm:text-2xl">{title}</h2>
        <button type="button" onClick={onAdd} className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-lg border border-fuchsia-400/80 bg-gradient-to-l from-violet-600/35 to-blue-600/30 px-2.5 text-[10px] font-black text-white shadow-[0_0_16px_rgba(192,38,211,0.28)] transition hover:border-fuchsia-300 hover:shadow-[0_0_24px_rgba(192,38,211,0.4)] sm:gap-2 sm:px-4 sm:text-xs"><Plus className="h-4 w-4" />{addLabel}</button>
      </header>
      <div className="relative mt-4 flex flex-wrap items-center gap-2 px-1 sm:px-2">
        <label className="relative min-w-[210px] flex-1 sm:max-w-sm">
          <span className="pointer-events-none absolute left-1 top-1 grid h-8 w-8 place-items-center rounded-md border border-violet-500/40 bg-violet-500/15 text-violet-300"><Search className="h-4 w-4" /></span>
          <input type="text" value={query} onChange={(event) => onQuery(event.target.value)} aria-label={`البحث في ${title}`} placeholder={title === "الأقسام الرئيسية" ? "ابحث باسم القسم الرئيسي" : "ابحث باسم القسم الفرعي"} className="admin-products-panel-input h-10 w-full rounded-lg border border-[#1a2e5b] bg-[#02081b] py-0 pl-11 pr-3 text-[11px] font-bold text-white outline-none placeholder:text-slate-500 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/15" />
        </label>
        <button type="button" onClick={onToggleActive} className={`admin-products-panel-filter inline-flex h-10 items-center gap-2 rounded-lg border px-3 text-[11px] font-black transition ${activeOnly ? "border-fuchsia-500/70 bg-fuchsia-500/15 text-fuchsia-200" : "border-[#1a2e5b] bg-[#060d23] text-slate-300 hover:border-violet-500/60"}`}><Filter className="h-4 w-4" />فلترة</button>
      </div>
      <div className="admin-products-panel-table relative mt-3 w-full max-w-full overflow-hidden rounded-xl border border-[#142654] bg-[#02091d] md:overflow-x-auto">
        {children}
      </div>
    </section>
  );
}

function CategoryIdentity({ category }) {
  return <div className="flex min-w-0 flex-1 items-center gap-3"><img src={category.image || "/logo.png"} alt="" className="h-9 w-9 shrink-0 rounded-lg border border-blue-500/30 object-cover shadow-[0_0_10px_rgba(59,130,246,0.16)]" /><span className="min-w-0 truncate font-bold text-slate-100">{category.name}</span></div>;
}

function ActiveBadge({ active }) {
  return <span className={`inline-flex min-w-[58px] justify-center rounded-full px-3 py-1.5 text-[10px] font-black ${active ? "bg-emerald-500/15 text-emerald-400 shadow-[inset_0_0_12px_rgba(16,185,129,0.08)]" : "bg-slate-500/15 text-slate-400"}`}>{active ? "نشط" : "مخفي"}</span>;
}

function RowActions({ item, onDelete, onEdit }) {
  return <div className="flex items-center gap-2"><button type="button" className="grid h-8 w-8 place-items-center rounded-md border border-[#1a2e5b] text-slate-400 transition hover:text-white" aria-label="المزيد"><MoreVertical className="h-4 w-4" /></button><button type="button" onClick={() => onEdit(item)} className="grid h-8 w-8 place-items-center rounded-md border border-blue-600/60 bg-blue-600/10 text-blue-400 transition hover:bg-blue-600/20" aria-label={`تعديل ${item.name}`}><Pencil className="h-4 w-4" /></button><button type="button" onClick={() => onDelete(item)} className="grid h-8 w-8 place-items-center rounded-md border border-rose-600/50 bg-rose-600/10 text-rose-500 transition hover:bg-rose-600/20" aria-label={`حذف ${item.name}`}><Trash2 className="h-4 w-4" /></button></div>;
}

function MobileCategoryCard({ active, category, details, onDelete, onEdit }) {
  return (
    <article className="admin-products-mobile-card min-w-0 space-y-3 p-3.5">
      <div className="flex min-w-0 items-center gap-3"><CategoryIdentity category={category} /><span className="ms-auto shrink-0"><ActiveBadge active={active} /></span></div>
      <div className="grid grid-cols-2 gap-2">{details.map((detail) => <div key={detail.label} className="admin-products-meta min-w-0 rounded-lg border border-[#142654] bg-[#060e29] p-2.5"><p className="text-[9px] font-bold text-slate-500">{detail.label}</p><p className="mt-1 truncate text-[11px] font-black text-slate-200">{detail.value}</p></div>)}</div>
      <div className="flex justify-end"><RowActions item={category} onEdit={onEdit} onDelete={onDelete} /></div>
    </article>
  );
}

function SharedColumnWidths() {
  return <colgroup><col className="w-[30%]" /><col className="w-[22%]" /><col className="w-[18%]" /><col className="w-[14%]" /><col className="w-[16%]" /></colgroup>;
}

function Th({ children }) { return <th className="whitespace-nowrap bg-[#060e29] px-5 py-3.5 text-[10px] font-black text-slate-400">{children}</th>; }
function Td({ children }) { return <td className="whitespace-nowrap px-5 py-3 text-xs font-bold text-slate-200">{children}</td>; }
