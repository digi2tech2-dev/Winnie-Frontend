import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCustomerCatalog } from "../../api/catalog";
import HomeSlide from "../../components/home/HomeSlide";
import { CategoriesGrid } from "../../components/home/HomeShowcase";
import EmptyState from "../../components/EmptyState";
import { useAuth } from "../../context/AuthContext";

export default function CustomerCategories({ basePath = "/customer" }) {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return undefined;

    let cancelled = false;

    const loadCatalog = async () => {
      setLoading(true);
      setError("");

      try {
        const catalog = await getCustomerCatalog(token);
        if (!cancelled) setCategories(catalog.categories);
      } catch (requestError) {
        if (!cancelled) {
          setError(requestError.userMessage || "Unable to load categories.");
          setCategories([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadCatalog();

    return () => {
      cancelled = true;
    };
  }, [token]);

  const openCategory = (category) => {
    navigate(`${basePath}/categories/${category.slug || category.id}`);
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
        {loading ? (
          <div className="glass-panel rounded-lg p-8 text-center text-sm font-black text-slate-500 dark:text-slate-400">
            Loading categories...
          </div>
        ) : error ? (
          <EmptyState title="Unable to load categories" description={error} />
        ) : categories.length ? (
          <CategoriesGrid categories={categories} layout="two" onCategorySelect={openCategory} />
        ) : (
          <EmptyState title="No categories yet" description="Active backend categories will appear here when they are seeded." />
        )}
      </section>
    </div>
  );
}
