import { AnimatePresence } from "framer-motion";
import { ArrowRight, CheckCircle2, LogIn, ShieldCheck, ShoppingBag, Zap } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getPublicProduct } from "../../api/catalog";
import EmptyState from "../../components/EmptyState";
import ProductPurchaseModal from "../../components/ProductPurchaseModal";
import Seo from "../../components/Seo";
import { useLanguage } from "../../context/LanguageContext";
import { canPurchaseProduct } from "../../utils/productAvailability";
import {
  buildBreadcrumbSchema,
  buildProductSchema,
  cleanSeoText,
  getProductPath,
} from "../../utils/seo";

export default function PublicProductPage() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isArabic = language === "ar";
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [purchaseOpen, setPurchaseOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");

    getPublicProduct(productId)
      .then((nextResult) => {
        if (!cancelled) setResult(nextResult);
      })
      .catch((requestError) => {
        if (!cancelled) {
          setResult(null);
          setError(requestError.userMessage || (isArabic ? "تعذر تحميل المنتج الآن." : "The product could not be loaded."));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isArabic, productId]);

  const product = result?.product;
  const category = result?.category;
  const productPath = product ? getProductPath(product) : `/products/${encodeURIComponent(productId || "")}`;
  const title = product
    ? `${product.name} | Winnie HUB`
    : (isArabic ? "تفاصيل المنتج | Winnie HUB" : "Product Details | Winnie HUB");
  const description = product
    ? cleanSeoText(product.description || `${product.name} متوفر للشحن والشراء بأمان وسرعة عبر Winnie HUB.`)
    : undefined;
  const schemas = useMemo(() => {
    if (!product) return [];
    return [
      buildProductSchema(product, productPath),
      buildBreadcrumbSchema([
        { name: isArabic ? "الرئيسية" : "Home", path: "/" },
        { name: isArabic ? "الأقسام" : "Categories", path: "/categories" },
        ...(category ? [{ name: category.title || category.name, path: `/categories/${category.slug || category.id}` }] : []),
        { name: product.name, path: productPath },
      ]),
    ];
  }, [category, isArabic, product, productPath]);
  const text = isArabic ? {
    back: "العودة للمنتجات",
    available: "متوفر الآن",
    unavailable: "غير متوفر حاليًا",
    buy: "شراء المنتج",
    login: "سجّل الدخول لإتمام الشراء",
    secure: "دفع آمن",
    fast: "تنفيذ سريع",
    support: "دعم متواصل",
    noDescription: "منتج رقمي متوفر عبر منصة ويني هب بسرعة وأمان.",
    notFound: "المنتج غير موجود",
    notFoundDescription: "قد يكون المنتج غير متاح أو تم تغيير رابطه.",
  } : {
    back: "Back to products",
    available: "Available now",
    unavailable: "Currently unavailable",
    buy: "Buy product",
    login: "Sign in to complete your purchase",
    secure: "Secure payment",
    fast: "Fast delivery",
    support: "Continuous support",
    noDescription: "A digital product available quickly and securely through Winnie HUB.",
    notFound: "Product not found",
    notFoundDescription: "This product may be unavailable or its link may have changed.",
  };

  if (loading) {
    return (
      <>
        <Seo title={title} path={productPath} />
        <div className="mx-auto max-w-[1120px] px-4 py-8 sm:px-6 lg:px-8">
          <div className="glass-panel min-h-72 animate-pulse rounded-lg" aria-label={isArabic ? "جاري تحميل المنتج" : "Loading product"} />
        </div>
      </>
    );
  }

  if (!product || error) {
    return (
      <>
        <Seo title={text.notFound} path={productPath} noindex />
        <div className="mx-auto max-w-[1120px] px-4 py-8 sm:px-6 lg:px-8">
          <EmptyState
            title={text.notFound}
            description={error || text.notFoundDescription}
            actionLabel={text.back}
            onAction={() => navigate("/categories")}
          />
        </div>
      </>
    );
  }

  const purchasable = canPurchaseProduct(product);
  const price = product.displayPriceLabel || product.minTotalDisplay || product.unitPriceDisplay || product.price || "";

  return (
    <>
      <Seo
        title={title}
        description={description}
        path={productPath}
        image={product.image}
        type="product"
        schemas={schemas}
      />
      <article className="mx-auto max-w-[1120px] px-4 pb-32 pt-6 sm:px-6 lg:px-8 lg:pb-16">
        <nav aria-label={isArabic ? "مسار التنقل" : "Breadcrumb"} className="mb-5 flex flex-wrap items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
          <Link to="/categories" className="inline-flex items-center gap-1.5 transition hover:text-violet-600 dark:hover:text-violet-300">
            <ArrowRight className={`h-4 w-4 ${isArabic ? "" : "rotate-180"}`} />
            {text.back}
          </Link>
          {category ? (
            <>
              <span aria-hidden="true">/</span>
              <Link to={`/categories/${category.slug || category.id}`} className="transition hover:text-violet-600 dark:hover:text-violet-300">
                {category.title || category.name}
              </Link>
            </>
          ) : null}
        </nav>

        <div className="glass-panel grid overflow-hidden rounded-lg p-5 shadow-soft sm:p-7 lg:grid-cols-[minmax(280px,0.85fr)_minmax(0,1.15fr)] lg:gap-10 lg:p-9">
          <div className="flex aspect-square w-full items-center justify-center overflow-hidden rounded-lg bg-white/70 p-5 dark:bg-slate-950/35">
            {product.image ? (
              <img
                src={product.image}
                alt={product.name}
                width="720"
                height="720"
                fetchPriority="high"
                decoding="async"
                className="h-full w-full object-contain"
              />
            ) : (
              <ShoppingBag className="h-24 w-24 text-violet-500 dark:text-violet-300" aria-hidden="true" />
            )}
          </div>

          <div className="mt-6 flex min-w-0 flex-col justify-center lg:mt-0">
            {category ? (
              <Link to={`/categories/${category.slug || category.id}`} className="w-fit rounded-full bg-violet-50 px-3 py-1.5 text-xs font-black text-violet-700 transition hover:bg-violet-100 dark:bg-violet-500/10 dark:text-violet-300">
                {category.title || category.name}
              </Link>
            ) : null}
            <h1 className="mt-4 text-3xl font-black leading-tight text-slate-950 dark:text-white sm:text-4xl">{product.name}</h1>
            <p className="mt-4 text-sm font-semibold leading-8 text-slate-600 dark:text-slate-300 sm:text-base">
              {product.description || text.noDescription}
            </p>
            {price ? <p dir="ltr" className="mt-5 text-start text-2xl font-black text-violet-700 dark:text-violet-300">{price}</p> : null}

            <div className="mt-5 flex flex-wrap gap-2">
              <TrustPill icon={ShieldCheck} label={text.secure} />
              <TrustPill icon={Zap} label={text.fast} />
              <TrustPill icon={CheckCircle2} label={text.support} />
            </div>

            <button
              type="button"
              disabled={!purchasable}
              onClick={() => setPurchaseOpen(true)}
              className="mt-7 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-[linear-gradient(135deg,#7C3AED,#38BDF8)] px-6 text-sm font-black text-white shadow-[0_16px_36px_rgba(124,58,237,0.24)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:grayscale disabled:opacity-55 sm:w-fit"
            >
              <LogIn className="h-5 w-5" />
              {purchasable ? text.buy : text.unavailable}
            </button>
            {purchasable ? <p className="mt-2 text-xs font-bold text-slate-500 dark:text-slate-400">{text.login}</p> : null}
          </div>
        </div>
      </article>

      <AnimatePresence>
        {purchaseOpen ? (
          <ProductPurchaseModal
            product={product}
            category={category}
            onClose={() => setPurchaseOpen(false)}
            onConfirm={() => navigate("/login", { state: { from: productPath } })}
            requireAccountId={false}
          />
        ) : null}
      </AnimatePresence>
    </>
  );
}

function TrustPill({ icon: Icon, label }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-100 bg-sky-50/70 px-3 py-2 text-xs font-black text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
      <Icon className="h-4 w-4 text-violet-600 dark:text-violet-300" />
      {label}
    </span>
  );
}
