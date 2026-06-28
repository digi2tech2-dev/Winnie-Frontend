import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import {
  CalendarDays,
  Filter,
  PackageCheck,
  RotateCcw,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import EmptyState from "../../components/EmptyState";
import { orders } from "../../data/catalog";

const statusClasses = {
  مكتمل: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300",
  "قيد التنفيذ": "bg-blue-500/12 text-blue-700 dark:text-blue-300",
  معلق: "bg-amber-500/14 text-amber-700 dark:text-amber-300",
  ملغي: "bg-rose-500/12 text-rose-700 dark:text-rose-300",
};

const monthMap = {
  يناير: 0,
  فبراير: 1,
  مارس: 2,
  أبريل: 3,
  ابريل: 3,
  مايو: 4,
  يونيو: 5,
  يوليو: 6,
  أغسطس: 7,
  اغسطس: 7,
  سبتمبر: 8,
  أكتوبر: 9,
  اكتوبر: 9,
  نوفمبر: 10,
  ديسمبر: 11,
};

const initialFilters = {
  query: "",
  status: "all",
  delivery: "all",
  dateFrom: "",
  dateTo: "",
  sort: "newest",
};

const hiddenDeliveryFilterOptions = new Set(["تفعيل الاشتراك"]);

function uniqueValues(key) {
  return Array.from(new Set(orders.map((order) => order[key]).filter(Boolean)));
}

function parseOrderPrice(price) {
  const match = String(price).match(/[\d.]+/);
  return match ? Number.parseFloat(match[0]) : 0;
}

function parseArabicDate(date) {
  const [day, month, year] = String(date).split(" ");
  return new Date(Number(year), monthMap[month] ?? 0, Number(day)).getTime();
}

function openDatePicker(event) {
  const input = event.currentTarget;

  if (typeof input.showPicker !== "function") {
    input.focus();
    return;
  }

  try {
    input.showPicker();
  } catch {
    input.focus();
  }
}

function blockDateTyping(event) {
  if (["Tab", "Escape", "ArrowLeft", "ArrowRight"].includes(event.key)) return;
  event.preventDefault();

  if (event.key === "Enter" || event.key === " ") {
    openDatePicker(event);
  }
}

export default function CustomerOrders({ basePath = "/customer" }) {
  const [filters, setFilters] = useState(initialFilters);
  const statusOptions = useMemo(() => uniqueValues("status"), []);
  const deliveryOptions = useMemo(
    () => uniqueValues("delivery").filter((delivery) => !hiddenDeliveryFilterOptions.has(delivery)),
    [],
  );

  const updateFilter = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value }));
  };

  const resetFilters = () => {
    setFilters(initialFilters);
  };

  const filteredOrders = useMemo(() => {
    const query = filters.query.trim().toLowerCase();
    const fromTime = filters.dateFrom ? new Date(`${filters.dateFrom}T00:00:00`).getTime() : null;
    const toTime = filters.dateTo ? new Date(`${filters.dateTo}T23:59:59`).getTime() : null;

    return orders
      .filter((order) => {
        const orderTime = parseArabicDate(order.date);
        const searchable = [
          order.id,
          order.product,
          order.status,
          order.price,
          order.date,
          order.delivery,
          `${order.progress}%`,
        ]
          .join(" ")
          .toLowerCase();

        const matchesSearch = !query || searchable.includes(query);
        const matchesStatus = filters.status === "all" || order.status === filters.status;
        const matchesDelivery = filters.delivery === "all" || order.delivery === filters.delivery;
        const matchesDateRange =
          (fromTime === null || orderTime >= fromTime) &&
          (toTime === null || orderTime <= toTime);

        return matchesSearch && matchesStatus && matchesDelivery && matchesDateRange;
      })
      .sort((first, second) => {
        if (filters.sort === "oldest") return parseArabicDate(first.date) - parseArabicDate(second.date);
        if (filters.sort === "price-high") return parseOrderPrice(second.price) - parseOrderPrice(first.price);
        if (filters.sort === "price-low") return parseOrderPrice(first.price) - parseOrderPrice(second.price);
        if (filters.sort === "progress-high") return second.progress - first.progress;
        if (filters.sort === "progress-low") return first.progress - second.progress;
        return parseArabicDate(second.date) - parseArabicDate(first.date);
      });
  }, [filters]);

  const activeFiltersCount = Object.entries(filters).filter(([key, value]) => {
    if (key === "sort") return value !== initialFilters.sort;
    return value !== initialFilters[key] && value !== "";
  }).length;

  return (
    <div className="space-y-6">
      <section className="glass-panel rounded-lg p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-black">طلباتي</h1>
            <p className="mt-2 text-sm font-semibold text-slate-500 dark:text-slate-400">سجل طلباتك وحالة التسليم.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex h-10 items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-4 text-sm font-black text-slate-600 dark:border-white/10 dark:bg-white/[0.045] dark:text-slate-300">
              <PackageCheck className="h-4 w-4 text-[#8B5CF6]" />
              {filteredOrders.length} من {orders.length}
            </span>
            <button
              type="button"
              onClick={resetFilters}
              className="interactive-ring inline-flex h-10 items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-4 text-sm font-black text-slate-600 transition hover:border-[#C4B5FD] hover:bg-[#F5F3FF] dark:border-white/10 dark:bg-white/[0.045] dark:text-slate-300 dark:hover:bg-white/[0.075]"
            >
              <RotateCcw className="h-4 w-4" />
              تصفير الفلاتر
              {activeFiltersCount > 0 && (
                <span className="grid h-5 min-w-5 place-items-center rounded-full bg-[#8B5CF6] px-1 text-[11px] text-white">
                  {activeFiltersCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-[24px] border border-[#C4B5FD]/55 bg-[linear-gradient(135deg,#FFFFFF_0%,#F8FCFF_48%,#F5F3FF_100%)] p-4 shadow-[0_18px_45px_rgba(124,58,237,0.10)] dark:border-white/10 dark:bg-[linear-gradient(135deg,#0B1220_0%,#111827_100%)] dark:shadow-[0_0_22px_rgba(139,92,246,0.16)]">
        <div className="flex items-center gap-2 text-sm font-black text-slate-900 dark:text-slate-200">
          <span className="grid h-9 w-9 place-items-center rounded-2xl bg-[linear-gradient(135deg,#38BDF8,#8B5CF6)] text-white shadow-[0_12px_28px_rgba(56,189,248,0.22)]">
            <SlidersHorizontal className="h-5 w-5" />
          </span>
          بحث وفلترة الطلبات
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <label className="relative col-span-2">
            <Search className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#8B5CF6] dark:text-slate-400" />
            <input
              type="search"
              value={filters.query}
              onChange={(event) => updateFilter("query", event.target.value)}
              placeholder="ابحث برقم الطلب، المنتج، الحالة، السعر..."
              className="h-12 w-full rounded-2xl border border-[#D8B4FE]/70 bg-white px-12 text-sm font-bold text-slate-950 shadow-[0_12px_28px_rgba(59,130,246,0.08)] outline-none transition placeholder:text-slate-400 focus:border-[#8B5CF6]/80 focus:ring-4 focus:ring-[#8B5CF6]/15 dark:border-white/10 dark:bg-white/[0.065] dark:text-white dark:shadow-none"
            />
          </label>

          <FilterSelect label="الحالة" value={filters.status} onChange={(value) => updateFilter("status", value)}>
            <option value="all">كل الحالات</option>
            {statusOptions.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </FilterSelect>

          <FilterSelect label="التسليم" value={filters.delivery} onChange={(value) => updateFilter("delivery", value)}>
            <option value="all">كل طرق التسليم</option>
            {deliveryOptions.map((delivery) => (
              <option key={delivery} value={delivery}>{delivery}</option>
            ))}
          </FilterSelect>

          <DateRangeFilter
            from={filters.dateFrom}
            to={filters.dateTo}
            onChange={updateFilter}
          />

          <FilterSelect label="ترتيب النتائج" value={filters.sort} onChange={(value) => updateFilter("sort", value)}>
            <option value="newest">الأحدث أولاً</option>
            <option value="oldest">الأقدم أولاً</option>
            <option value="price-high">السعر الأعلى</option>
            <option value="price-low">السعر الأقل</option>
            <option value="progress-high">الأقرب للتسليم</option>
            <option value="progress-low">الأقل تقدماً</option>
          </FilterSelect>
        </div>
      </section>

      {filteredOrders.length > 0 ? (
      <section className="glass-panel overflow-hidden rounded-lg">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[780px] text-right text-sm">
            <thead className="border-b border-slate-200 bg-slate-50/80 text-xs uppercase tracking-[0.18em] text-slate-500 dark:border-white/10 dark:bg-white/[0.045] dark:text-slate-400">
              <tr>
                <th className="px-5 py-4">رقم الطلب</th>
                <th className="px-5 py-4">المنتج</th>
                <th className="px-5 py-4">الحالة</th>
                <th className="px-5 py-4">السعر</th>
                <th className="px-5 py-4">التاريخ</th>
                <th className="px-5 py-4">التسليم</th>
                <th className="px-5 py-4">التقدم</th>
                <th className="px-5 py-4">الإجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-white/10">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="transition hover:bg-slate-50 dark:hover:bg-white/[0.045]">
                  <td className="px-5 py-4 font-black">{order.id}</td>
                  <td className="px-5 py-4 font-semibold">{order.product}</td>
                  <td className="px-5 py-4">
                    <span className={`rounded-md px-2.5 py-1 text-xs font-black ${statusClasses[order.status]}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 font-black">{order.price}</td>
                  <td className="px-5 py-4 text-slate-500 dark:text-slate-400">{order.date}</td>
                  <td className="px-5 py-4 text-slate-500 dark:text-slate-400">{order.delivery}</td>
                  <td className="px-5 py-4">
                    <div className="flex min-w-[130px] items-center gap-2">
                      <span className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
                        <span className="block h-full rounded-full bg-[linear-gradient(90deg,#7C3AED,#38BDF8)]" style={{ width: `${order.progress}%` }} />
                      </span>
                      <span className="w-10 text-right text-xs font-black text-slate-500 dark:text-slate-400">{order.progress}%</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <Link to={`${basePath}/order/${order.id.replace("#", "")}`} className="font-black text-pulse">
                      التفاصيل
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      ) : (
        <EmptyState
          icon={Search}
          title="لا توجد طلبات مطابقة"
          description="غيّر كلمات البحث أو صفّر الفلاتر لعرض كل الطلبات مرة أخرى."
          actionLabel="تصفير الفلاتر"
          onAction={resetFilters}
        />
      )}
    </div>
  );
}

function DateRangeFilter({ from, to, onChange }) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center gap-2 text-xs font-black text-slate-700 dark:text-slate-400">
        <span className="grid h-7 w-7 place-items-center rounded-xl bg-[linear-gradient(135deg,#22D3EE,#7C3AED,#EC4899)] text-white shadow-[0_10px_24px_rgba(124,58,237,0.28)]">
          <CalendarDays className="h-4 w-4" />
        </span>
        التاريخ
      </span>
      <span className="grid grid-cols-2 gap-2 rounded-2xl border border-[#D8B4FE]/70 bg-white p-1.5 shadow-[0_12px_28px_rgba(124,58,237,0.10)] transition focus-within:border-[#8B5CF6]/80 focus-within:ring-4 focus-within:ring-[#8B5CF6]/15 dark:border-white/10 dark:bg-white/[0.065] dark:shadow-none">
        <span className="min-w-0">
          <span className="mb-1 block px-2 text-[10px] font-black text-[#8B5CF6] dark:text-[#C084FC]">من</span>
          <input
            type="date"
            value={from}
            onChange={(event) => onChange("dateFrom", event.target.value)}
            onPointerDown={openDatePicker}
            onFocus={openDatePicker}
            onKeyDown={blockDateTyping}
            onPaste={(event) => event.preventDefault()}
            inputMode="none"
            className="h-9 w-full rounded-xl border border-transparent bg-[#F8FCFF] px-2 text-xs font-black text-slate-900 outline-none transition hover:border-[#C4B5FD] focus:border-[#8B5CF6]/60 dark:bg-[#0B1220] dark:text-white"
            aria-label="تاريخ البداية"
          />
        </span>
        <span className="min-w-0">
          <span className="mb-1 block px-2 text-[10px] font-black text-[#EC4899] dark:text-[#F0ABFC]">إلى</span>
          <input
            type="date"
            value={to}
            onChange={(event) => onChange("dateTo", event.target.value)}
            onPointerDown={openDatePicker}
            onFocus={openDatePicker}
            onKeyDown={blockDateTyping}
            onPaste={(event) => event.preventDefault()}
            inputMode="none"
            className="h-9 w-full rounded-xl border border-transparent bg-[#FDF7FF] px-2 text-xs font-black text-slate-900 outline-none transition hover:border-[#F0ABFC] focus:border-[#EC4899]/60 dark:bg-[#0B1220] dark:text-white"
            aria-label="تاريخ النهاية"
          />
        </span>
      </span>
    </label>
  );
}

function FilterSelect({ label, value, onChange, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center gap-1.5 text-xs font-black text-slate-700 dark:text-slate-400">
        <span className="grid h-5 w-5 place-items-center rounded-lg bg-[#EDE9FE] text-[#8B5CF6] dark:bg-transparent">
          <Filter className="h-3.5 w-3.5" />
        </span>
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 w-full rounded-2xl border border-[#D8B4FE]/70 bg-white px-3 text-sm font-black text-slate-900 shadow-[0_12px_26px_rgba(124,58,237,0.08)] outline-none transition focus:border-[#8B5CF6]/80 focus:ring-4 focus:ring-[#8B5CF6]/15 dark:border-white/10 dark:bg-white/[0.065] dark:text-white dark:shadow-none"
      >
        {children}
      </select>
    </label>
  );
}
