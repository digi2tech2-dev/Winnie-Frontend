export const importantLinks = [
  { slug: "privacy-policy", path: "/privacy-policy" },
  { slug: "terms-and-conditions", path: "/terms-and-conditions" },
  { slug: "aml-policy", path: "/aml-policy" },
  { slug: "replacement-cancellation-policy", path: "/replacement-cancellation-policy" },
  { slug: "contact-methods", path: "/contact-methods" },
  { slug: "suggestions-complaints", path: "/suggestions-complaints" },
  { slug: "affiliate-marketing", path: "/affiliate-marketing" },
];

export function getImportantArticle(slug, articles = []) {
  return articles.find((article) => article.slug === slug);
}
