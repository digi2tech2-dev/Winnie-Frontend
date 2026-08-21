import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const projectRoot = process.cwd();
const distDir = resolve(projectRoot, "dist");

async function loadEnvironment() {
  const values = {};
  for (const filename of [".env", ".env.production", ".env.local"]) {
    try {
      const source = await readFile(resolve(projectRoot, filename), "utf8");
      source.split(/\r?\n/).forEach((line) => {
        const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
        if (!match) return;
        values[match[1]] = match[2].trim().replace(/^['"]|['"]$/g, "");
      });
    } catch {
      // Environment files are optional in CI.
    }
  }
  return { ...values, ...process.env };
}

function xmlEscape(value) {
  return String(value).replace(/[<>&'"]/g, (character) => ({
    "<": "&lt;",
    ">": "&gt;",
    "&": "&amp;",
    "'": "&apos;",
    '"': "&quot;",
  })[character]);
}

function slugify(value = "") {
  return String(value)
    .normalize("NFKC")
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}

function productPath(product = {}) {
  const id = product.id || product._id;
  if (!id) return "";
  const slug = slugify(product.name || product.title);
  return `/products/${encodeURIComponent(String(id))}${slug ? `/${encodeURIComponent(slug)}` : ""}`;
}

async function loadCatalog(apiBaseUrl) {
  if (!apiBaseUrl) return { categories: [], products: [] };
  try {
    const response = await fetch(`${apiBaseUrl.replace(/\/+$/, "")}/public/catalog?limit=1000`, {
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) return { categories: [], products: [] };
    const payload = await response.json();
    const data = payload.data || payload;
    return {
      categories: Array.isArray(data.categories) ? data.categories : [],
      products: Array.isArray(data.products) ? data.products : [],
    };
  } catch (error) {
    console.warn(`[seo] Dynamic catalog URLs were skipped: ${error.message}`);
    return { categories: [], products: [] };
  }
}

const env = await loadEnvironment();
const siteUrl = String(env.VITE_SITE_URL || "https://winniefun.com").replace(/\/+$/, "");
const indexPath = resolve(distDir, "index.html");
const catalog = await loadCatalog(env.VITE_API_BASE_URL);
const staticPaths = [
  "/",
  "/categories",
  "/best-selling",
  "/recently-added",
  "/about",
  "/privacy-policy",
  "/terms-and-conditions",
  "/aml-policy",
  "/replacement-cancellation-policy",
  "/contact-methods",
  "/suggestions-complaints",
  "/affiliate-marketing",
];
const categoryPaths = catalog.categories
  .map((category) => category.slug || category.id || category._id)
  .filter(Boolean)
  .map((value) => `/categories/${encodeURIComponent(String(value))}`);
const productPaths = catalog.products.map(productPath).filter(Boolean);
const paths = [...new Set([...staticPaths, ...categoryPaths, ...productPaths])];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${paths.map((path) => `  <url><loc>${xmlEscape(`${siteUrl}${path}`)}</loc></url>`).join("\n")}
</urlset>
`;
const robots = `User-agent: *
Allow: /
Disallow: /admin/
Disallow: /customer/
Disallow: /auth/
Disallow: /payment/
Disallow: /login
Disallow: /register

Sitemap: ${siteUrl}/sitemap.xml
`;

await mkdir(distDir, { recursive: true });
let builtIndex = "";
try {
  builtIndex = await readFile(indexPath, "utf8");
} catch {
  // `seo:generate` may be run before the first Vite build.
}
await Promise.all([
  writeFile(resolve(distDir, "sitemap.xml"), sitemap, "utf8"),
  writeFile(resolve(distDir, "robots.txt"), robots, "utf8"),
  ...(builtIndex ? [writeFile(indexPath, builtIndex.replaceAll("https://winniefun.com", siteUrl), "utf8")] : []),
]);
console.log(`[seo] Generated robots.txt and sitemap.xml with ${paths.length} indexable URLs.`);
