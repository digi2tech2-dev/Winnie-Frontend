import { useMemo, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { ArrowRight, Search } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import EmptyState from "../../components/EmptyState";
import { iconMap } from "../../components/icons";
import ProductPurchaseModal from "../../components/ProductPurchaseModal";
import { categories, productGroups } from "../../data/catalog";

export default function PublicCategoryProducts() {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const searchInputRef = useRef(null);
  const [query, setQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);

  const category = categories.find((item) => item.id === categoryId);
  const group = productGroups[categoryId];
  const categoryTitle = category?.title || group?.title || "القسم";

  const products = useMemo(() => {
    const cleanQuery = query.trim().toLowerCase();
    const groupProducts = group?.products || [];

    if (!cleanQuery) return groupProducts;

    return groupProducts.filter((product) => product.name.toLowerCase().includes(cleanQuery));
  }, [group, query]);

  const loginForPurchase = () => {
    setSelectedProduct(null);
    navigate("/login", { state: { from: "/customer/dashboard" } });
  };

  if (!group) {
    return (
      <div className="mx-auto max-w-[1120px] px-4 py-8 sm:px-6 lg:px-8">
        <EmptyState
          title="القسم غير موجود"
          description="القسم المطلوب غير متاح حالياً."
          actionLabel="العودة للأقسام"
          onAction={() => navigate("/categories")}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1120px] space-y-5 px-4 pb-32 pt-5 sm:px-6 sm:pt-7 lg:space-y-7 lg:px-8 lg:pb-16">
      <header className="flex items-center justify-between gap-3 px-1">
        <div className="min-w-0">
          <button
            type="button"
            onClick={() => navigate("/categories")}
            className="mb-2 inline-flex items-center gap-1.5 text-xs font-black text-slate-500 transition hover:text-[#7C3AED] dark:text-[#AAB6CC] dark:hover:text-[#C084FC]"
          >
            <ArrowRight className="h-4 w-4" />
            الأقسام
          </button>
          <h1 className="relative pr-3 text-2xl font-black tracking-normal text-slate-950 dark:text-white sm:text-3xl">
            <span className="absolute right-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-full bg-[linear-gradient(180deg,#38BDF8,#7C3AED)]" />
            {categoryTitle}
          </h1>
          <p className="mt-2 max-w-2xl text-sm font-bold leading-6 text-slate-500 dark:text-[#8A94A7]">
            افتح أي تطبيق، اكتب بيانات الشحن إذا حبيت، وبعد الضغط على شراء سيتم تحويلك لتسجيل الدخول.
          </p>
        </div>

        <button
          type="button"
          onClick={() => searchInputRef.current?.focus()}
          className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-sky-100 bg-white text-[#7C3AED] shadow-[0_12px_26px_rgba(14,165,233,0.10)] transition hover:-translate-y-0.5 hover:border-[#C4B5FD] hover:bg-[#F5F3FF] dark:border-[#2B3650] dark:bg-[#111827] dark:text-[#C084FC] dark:hover:border-[#A855F7]/55 dark:hover:bg-[#172033]"
          aria-label="بحث داخل القسم"
          title="بحث"
        >
          <Search className="h-5 w-5" />
        </button>
      </header>

      <form
        onSubmit={(event) => event.preventDefault()}
        className="flex items-center gap-2 rounded-[24px] border border-sky-100 bg-white p-2 shadow-[0_14px_34px_rgba(14,165,233,0.10)] dark:border-[#2B3650] dark:bg-[#111827]"
      >
        <Search className="mr-2 h-5 w-5 shrink-0 text-[#8B5CF6] dark:text-[#C084FC]" />
        <input
          ref={searchInputRef}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="h-11 min-w-0 flex-1 bg-transparent px-1 text-sm font-bold text-slate-950 outline-none placeholder:text-slate-400 dark:text-white dark:placeholder:text-[#7F8AA0]"
          placeholder={`ابحث داخل ${categoryTitle}`}
        />
        <button
          type="submit"
          className="h-11 rounded-2xl bg-[linear-gradient(135deg,#7C3AED,#38BDF8)] px-4 text-sm font-black text-white shadow-[0_12px_24px_rgba(124,58,237,0.20)] transition hover:-translate-y-0.5"
        >
          بحث
        </button>
      </form>

      {products.length ? (
        <section className="grid grid-cols-3 gap-x-2 gap-y-6 px-1 sm:gap-x-5 sm:gap-y-8">
          {products.map((product, index) => (
            <ProductTile key={product.name} product={product} index={index} onSelect={() => setSelectedProduct(product)} />
          ))}
        </section>
      ) : (
        <EmptyState
          title="لا توجد نتائج"
          description="جرّب كتابة اسم منتج آخر داخل هذا القسم."
          actionLabel="مسح البحث"
          onAction={() => setQuery("")}
        />
      )}

      <AnimatePresence>
        {selectedProduct && (
          <ProductPurchaseModal
            product={selectedProduct}
            category={category || group}
            onClose={() => setSelectedProduct(null)}
            onConfirm={loginForPurchase}
            requireAccountId={false}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function ProductTile({ product, index, onSelect }) {
  const ProductIcon = iconMap[product.icon] || iconMap.ShoppingBag;

  return (
    <button
      type="button"
      onClick={onSelect}
      className="group flex min-w-0 flex-col items-center text-center outline-none"
      style={{ animationDelay: `${Math.min(index * 35, 220)}ms` }}
    >
      <span className="relative grid h-24 w-full max-w-[96px] place-items-center transition group-hover:scale-[1.04] sm:h-36 sm:max-w-[144px] lg:h-40 lg:max-w-[160px]">
        <span className="absolute bottom-2 h-5 w-20 rounded-full bg-slate-950/12 blur-md transition group-hover:bg-[#7C3AED]/16 dark:bg-black/35 sm:h-7 sm:w-32" />
        <span className={`absolute bottom-4 h-[74px] w-[78px] rotate-[-8deg] rounded-[24px] bg-gradient-to-br ${product.tone} shadow-[0_18px_34px_rgba(15,23,42,0.20)] transition group-hover:-rotate-[12deg] sm:h-[112px] sm:w-[120px] sm:rounded-[36px] lg:h-[124px] lg:w-[132px]`} />
        <span className="absolute bottom-5 h-[62px] w-[62px] rotate-[-8deg] rounded-[20px] bg-[radial-gradient(circle_at_22%_18%,rgba(255,255,255,0.34)_0_2px,transparent_3px)] bg-[length:14px_14px] opacity-35 sm:h-[94px] sm:w-[94px]" />
        <span className={`relative grid h-[58px] w-[58px] place-items-center rounded-[20px] border border-white/55 bg-gradient-to-br ${product.tone} text-white shadow-[0_16px_28px_rgba(15,23,42,0.25)] transition group-hover:-translate-y-2 group-hover:rotate-[3deg] sm:h-[88px] sm:w-[88px] sm:rounded-[28px] lg:h-[98px] lg:w-[98px]`}>
          <span className="absolute inset-1 rounded-[16px] bg-white/14 sm:rounded-[24px]" />
          <ProductIcon className="relative h-8 w-8 drop-shadow-[0_10px_18px_rgba(15,23,42,0.30)] sm:h-12 sm:w-12 lg:h-14 lg:w-14" />
        </span>
      </span>
      <span className="mt-2 block min-h-[40px] max-w-[7.5rem] text-[12px] font-black leading-5 text-slate-950 transition group-hover:text-[#7C3AED] dark:text-white dark:group-hover:text-[#C084FC] sm:mt-3 sm:max-w-[10rem] sm:text-base sm:leading-7">
        {product.name}
      </span>
    </button>
  );
}
