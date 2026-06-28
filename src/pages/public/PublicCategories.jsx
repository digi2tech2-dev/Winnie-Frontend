import { useNavigate } from "react-router-dom";
import HomeSlide from "../../components/home/HomeSlide";
import { CategoriesGrid } from "../../components/home/HomeShowcase";

export default function PublicCategories() {
  const navigate = useNavigate();

  const openCategory = (category) => {
    navigate(`/categories/${category.id}`);
  };

  return (
    <div className="mx-auto max-w-[1120px] space-y-5 px-4 pb-32 pt-5 sm:px-6 sm:pt-7 lg:px-8 lg:pb-16">
      <header className="px-1">
        <h1 className="relative pr-3 text-2xl font-black tracking-normal text-slate-950 dark:text-white sm:text-3xl">
          <span className="absolute right-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-full bg-[linear-gradient(180deg,#38BDF8,#7C3AED)]" />
          الأقسام
        </h1>
        <p className="mt-2 text-sm font-bold leading-6 text-slate-500 dark:text-[#8A94A7]">
          اختار القسم وافتح خدمات الشحن قبل تسجيل الدخول.
        </p>
      </header>

      <HomeSlide categoriesPath="/categories" />

      <section id="public-categories" className="px-1">
        <CategoriesGrid layout="two" onCategorySelect={openCategory} />
      </section>
    </div>
  );
}
