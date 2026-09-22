export const SITE_NAME = "Winnie HUB";
export const SITE_NAME_AR = "ويني هب";
// Keep the production domain aligned with the domain verified in Search Console.
// It can still be overridden for previews with VITE_SITE_URL.
export const SITE_URL = String(import.meta.env.VITE_SITE_URL || "https://winniehub.ae").replace(/\/+$/, "");
export const SITE_DEFAULT_IMAGE = "/hero-winnie-fun.png";

export const DEFAULT_SEO = {
  ar: {
    title: "Winnie HUB | شحن الألعاب والبطاقات الرقمية",
    description: "ويني هب منصة آمنة وسريعة لشحن الألعاب وتطبيقات المحادثة وشراء بطاقات الهدايا والاشتراكات الرقمية.",
  },
  en: {
    title: "Winnie HUB | Games, Gift Cards & Digital Top-Ups",
    description: "Winnie HUB is a fast and secure platform for game top-ups, voice chat apps, gift cards and digital subscriptions.",
  },
};

export function absoluteSiteUrl(path = "/") {
  const value = String(path || "/").trim();
  if (/^https?:\/\//i.test(value)) return value;
  return `${SITE_URL}${value.startsWith("/") ? value : `/${value}`}`;
}
