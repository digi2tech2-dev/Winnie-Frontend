import { useMemo } from "react";
import { useLocation } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import { absoluteSiteUrl, SITE_NAME, SITE_NAME_AR } from "../config/site";
import Seo from "./Seo";

const PUBLIC_PAGES = {
  "/": {
    ar: ["Winnie HUB | شحن الألعاب والبطاقات الرقمية", "اشحن الألعاب وتطبيقات المحادثة واشتري بطاقات الهدايا والاشتراكات الرقمية بسرعة وأمان عبر ويني هب."],
    en: ["Winnie HUB | Games, Gift Cards & Digital Top-Ups", "Top up games and voice chat apps, and buy gift cards and digital subscriptions quickly and securely with Winnie HUB."],
  },
  "/categories": {
    ar: ["أقسام الشحن والبطاقات الرقمية | Winnie HUB", "تصفح جميع أقسام شحن الألعاب والبطاقات والاشتراكات الرقمية المتاحة على ويني هب."],
    en: ["Digital Top-Up & Gift Card Categories | Winnie HUB", "Browse all available game top-up, gift card and digital subscription categories on Winnie HUB."],
  },
  "/best-selling": {
    ar: ["المنتجات الأكثر مبيعًا | Winnie HUB", "اكتشف أشهر منتجات شحن الألعاب والبطاقات الرقمية الأكثر طلبًا على ويني هب."],
    en: ["Best-Selling Digital Products | Winnie HUB", "Discover the most popular game top-ups and digital products on Winnie HUB."],
  },
  "/recently-added": {
    ar: ["أحدث المنتجات الرقمية | Winnie HUB", "تابع أحدث منتجات الشحن والبطاقات والاشتراكات الرقمية المضافة إلى ويني هب."],
    en: ["Recently Added Digital Products | Winnie HUB", "Explore the latest top-ups, gift cards and subscriptions added to Winnie HUB."],
  },
  "/about": {
    ar: ["عن Winnie HUB | منصة المنتجات الرقمية", "تعرف على ويني هب وخدمات شحن الألعاب والبطاقات الرقمية وطرق الدفع والدعم المتاحة."],
    en: ["About Winnie HUB | Digital Products Platform", "Learn about Winnie HUB, its game top-up and digital card services, payment methods and customer support."],
  },
};

const NOINDEX_PREFIXES = ["/admin", "/customer", "/auth", "/payment"];
const NOINDEX_PATHS = new Set(["/login", "/register", "/forgot-password", "/email-verified", "/500"]);
const PUBLIC_ARTICLE_PATHS = new Set([
  "/privacy-policy",
  "/terms-and-conditions",
  "/aml-policy",
  "/replacement-cancellation-policy",
  "/contact-methods",
  "/suggestions-complaints",
  "/affiliate-marketing",
]);

export default function RouteSeo() {
  const location = useLocation();
  const { language } = useLanguage();
  const locale = language === "en" ? "en" : "ar";
  const pathname = location.pathname;
  const page = PUBLIC_PAGES[pathname]?.[locale];
  const isDynamicPublicPage = pathname.startsWith("/categories/") || pathname.startsWith("/products/");
  const isKnownPublicPage = Boolean(page) || PUBLIC_ARTICLE_PATHS.has(pathname) || isDynamicPublicPage;
  const noindex = NOINDEX_PATHS.has(pathname)
    || NOINDEX_PREFIXES.some((prefix) => pathname.startsWith(prefix))
    || !isKnownPublicPage;
  const schemas = useMemo(() => {
    if (pathname !== "/") return [];
    return [
      {
        "@context": "https://schema.org",
        "@type": "Organization",
        "@id": `${absoluteSiteUrl("/")}#organization`,
        name: SITE_NAME,
        alternateName: SITE_NAME_AR,
        url: absoluteSiteUrl("/"),
        logo: absoluteSiteUrl("/logo.png"),
        email: "Support@winniehub.ae",
        sameAs: ["https://www.instagram.com/winnie.cards"],
      },
      {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "@id": `${absoluteSiteUrl("/")}#website`,
        name: SITE_NAME,
        alternateName: SITE_NAME_AR,
        url: absoluteSiteUrl("/"),
        inLanguage: ["ar", "en"],
        publisher: { "@id": `${absoluteSiteUrl("/")}#organization` },
      },
    ];
  }, [pathname]);

  return (
    <Seo
      title={page?.[0] || (noindex ? `${SITE_NAME} | حساب المستخدم` : undefined)}
      description={page?.[1]}
      noindex={noindex}
      schemaId="route"
      schemas={schemas}
    />
  );
}
