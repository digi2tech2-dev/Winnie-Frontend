import { useNavigate } from "react-router-dom";
import HomeSlide from "../../components/home/HomeSlide";
import { CategoriesGrid } from "../../components/home/HomeShowcase";

export default function CustomerCategories({ basePath = "/customer" }) {
  const navigate = useNavigate();

  const openCategory = (category) => {
    navigate(`${basePath}/categories/${category.id}`);
  };

  return (
    <div className="space-y-5 lg:space-y-7">
      <header className="px-1">
        <h1 className="relative pr-3 text-2xl font-black tracking-normal text-slate-950 dark:text-white sm:text-3xl">
          <span className="absolute right-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-full bg-[linear-gradient(180deg,#38BDF8,#7C3AED)]" />
          الأقسام
        </h1>
      </header>

      <HomeSlide categoriesPath={`${basePath}/categories`} />

      <section id="customer-categories" className="px-1">
        <CategoriesGrid layout="two" onCategorySelect={openCategory} />
      </section>
    </div>
  );
}
