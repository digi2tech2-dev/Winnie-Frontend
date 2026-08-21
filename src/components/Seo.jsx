import { useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import {
  absoluteSiteUrl,
  DEFAULT_SEO,
  SITE_DEFAULT_IMAGE,
  SITE_NAME,
} from "../config/site";
import { cleanSeoText } from "../utils/seo";

function upsertMeta(selector, attributes, content) {
  let element = document.head.querySelector(selector);
  if (!element) {
    element = document.createElement("meta");
    Object.entries(attributes).forEach(([name, value]) => element.setAttribute(name, value));
    document.head.appendChild(element);
  }
  element.setAttribute("content", content);
}

function upsertLink(rel, href, hreflang) {
  const selector = hreflang
    ? `link[rel="${rel}"][hreflang="${hreflang}"]`
    : `link[rel="${rel}"]:not([hreflang])`;
  let element = document.head.querySelector(selector);
  if (!element) {
    element = document.createElement("link");
    element.setAttribute("rel", rel);
    if (hreflang) element.setAttribute("hreflang", hreflang);
    document.head.appendChild(element);
  }
  element.setAttribute("href", href);
}

export default function Seo({
  title,
  description,
  path,
  image = SITE_DEFAULT_IMAGE,
  type = "website",
  noindex = false,
  schemas = [],
  schemaId = "page",
}) {
  const location = useLocation();
  const { language } = useLanguage();
  const locale = language === "en" ? "en" : "ar";
  const defaults = DEFAULT_SEO[locale];
  const pageTitle = cleanSeoText(title || defaults.title, 65);
  const pageDescription = cleanSeoText(description || defaults.description, 160);
  const canonicalPath = path || location.pathname || "/";
  const canonicalUrl = absoluteSiteUrl(canonicalPath);
  const imageUrl = absoluteSiteUrl(image || SITE_DEFAULT_IMAGE);
  const robots = noindex ? "noindex, nofollow, noarchive" : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1";
  const safeSchemaId = String(schemaId || "page").replace(/[^a-z0-9_-]/gi, "-");

  useLayoutEffect(() => {
    document.title = pageTitle;
    upsertMeta('meta[name="description"]', { name: "description" }, pageDescription);
    upsertMeta('meta[name="robots"]', { name: "robots" }, robots);
    upsertMeta('meta[name="googlebot"]', { name: "googlebot" }, robots);
    upsertMeta('meta[property="og:title"]', { property: "og:title" }, pageTitle);
    upsertMeta('meta[property="og:description"]', { property: "og:description" }, pageDescription);
    upsertMeta('meta[property="og:type"]', { property: "og:type" }, type);
    upsertMeta('meta[property="og:url"]', { property: "og:url" }, canonicalUrl);
    upsertMeta('meta[property="og:image"]', { property: "og:image" }, imageUrl);
    upsertMeta('meta[property="og:image:alt"]', { property: "og:image:alt" }, pageTitle);
    upsertMeta('meta[property="og:site_name"]', { property: "og:site_name" }, SITE_NAME);
    upsertMeta('meta[property="og:locale"]', { property: "og:locale" }, locale === "ar" ? "ar_AE" : "en_US");
    upsertMeta('meta[name="twitter:card"]', { name: "twitter:card" }, "summary_large_image");
    upsertMeta('meta[name="twitter:title"]', { name: "twitter:title" }, pageTitle);
    upsertMeta('meta[name="twitter:description"]', { name: "twitter:description" }, pageDescription);
    upsertMeta('meta[name="twitter:image"]', { name: "twitter:image" }, imageUrl);
    upsertLink("canonical", canonicalUrl);
    const schemaSelector = `script[data-winnie-seo-json-ld="${safeSchemaId}"]`;
    if (safeSchemaId === "route") document.getElementById("winnie-static-schema")?.remove();
    document.head.querySelectorAll(schemaSelector).forEach((element) => element.remove());
    schemas.filter(Boolean).forEach((schema) => {
      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.dataset.winnieSeoJsonLd = safeSchemaId;
      script.textContent = JSON.stringify(schema).replace(/</g, "\\u003c");
      document.head.appendChild(script);
    });

    return () => {
      document.head.querySelectorAll(schemaSelector).forEach((element) => element.remove());
    };
  }, [canonicalUrl, imageUrl, locale, pageDescription, pageTitle, robots, safeSchemaId, schemas, type]);

  return null;
}
