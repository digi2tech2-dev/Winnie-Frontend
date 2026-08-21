export const importantLinks = [
  { slug: "privacy-policy", path: "/privacy-policy", label: { ar: "سياسة الخصوصية", en: "Privacy Policy" } },
  { slug: "terms-and-conditions", path: "/terms-and-conditions", label: { ar: "الشروط والأحكام", en: "Terms and Conditions" } },
  { slug: "aml-policy", path: "/aml-policy", label: { ar: "مكافحة غسل الأموال", en: "Anti-Money Laundering" } },
  { slug: "replacement-cancellation-policy", path: "/replacement-cancellation-policy", label: { ar: "الاستبدال والإلغاء", en: "Replacement & Cancellation" } },
  { slug: "contact-methods", path: "/contact-methods", label: { ar: "وسائل التواصل", en: "Contact Methods" } },
  { slug: "suggestions-complaints", path: "/suggestions-complaints", label: { ar: "الاقتراحات والشكاوى", en: "Suggestions & Complaints" } },
  { slug: "affiliate-marketing", path: "/affiliate-marketing", label: { ar: "التسويق بالعمولة", en: "Affiliate Marketing" } },
];

export function getImportantArticle(slug, articles = []) {
  return articles.find((article) => article.slug === slug);
}
