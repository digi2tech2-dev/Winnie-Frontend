import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { filterMainCategories, getCategories } from "../../api/catalog";
import EmptyState from "../../components/EmptyState";
import HomeSlide from "../../components/home/HomeSlide";
import CategoryShowcaseSection from "../../components/home/CategoryShowcaseSection";

export default function PublicCategories() {
  const navigate = useNavigate();
  const { t } = useTranslation("home");
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadCategories = async () => {
      setLoading(true);
      setError("");

      try {
        const result = await getCategories();
        if (!cancelled) setCategories(filterMainCategories(result));
      } catch (requestError) {
        if (!cancelled) {
          setCategories([]);
          setError(requestError.userMessage || t("public.categoriesLoadError"));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadCategories();

    return () => {
      cancelled = true;
    };
  }, []);

  const openCategory = (category) => {
    navigate(`/categories/${category.slug || category.id}`);
  };

  return (
    <div className="mx-auto max-w-[1120px] space-y-5 px-4 pb-32 pt-5 sm:px-6 sm:pt-7 lg:px-8 lg:pb-16">
      <header className="px-1">
        <h1 className="relative pr-3 text-2xl font-black tracking-normal text-slate-950 dark:text-white sm:text-3xl">
          <span className="absolute right-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-full bg-[linear-gradient(180deg,#38BDF8,#7C3AED)]" />
          {t("public.categoriesTitle")}
        </h1>
        <p className="mt-2 text-sm font-bold leading-6 text-slate-500 dark:text-[#8A94A7]">
          {t("public.categoriesDescription")}
        </p>
      </header>

      <HomeSlide categoriesPath="/categories" />

      <section id="public-categories" className="px-1">
        {loading ? (
          <div className="glass-panel rounded-lg p-8 text-center text-sm font-black text-slate-500 dark:text-slate-400">
            {t("common:states.loadingCategories")}
          </div>
        ) : error ? (
          <EmptyState title={t("public.categoriesLoadError")} description={error} />
        ) : categories.length ? (
          <CategoryShowcaseSection categories={categories} onSelect={openCategory} showHeading={false} />
        ) : (
          <EmptyState title={t("public.categoriesEmptyTitle")} description={t("public.categoriesEmptyDescription")} />
        )}
      </section>
    </div>
  );
}
