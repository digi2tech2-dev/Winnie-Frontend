import { BookOpenText, Check, ChevronRight, ClipboardCopy, Code2, ExternalLink, Menu } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getCanonicalApiBaseUrl } from "../api/developerAccess";

const sections = [
  ["introduction", "Introduction"],
  ["base-url", "Base URL"],
  ["authentication", "Authentication"],
  ["profile", "Profile"],
  ["products", "Products"],
  ["product-fields", "Product Fields"],
  ["content", "Content / Categories"],
  ["create-order", "Create Order"],
  ["check-orders", "Check Orders"],
  ["status-values", "Status Values"],
  ["error-codes", "Error Codes"],
  ["code-examples", "Code Examples"],
  ["legacy", "Legacy Compatibility"],
];

const errorCodes = [
  [100, "Insufficient balance"],
  [105, "Quantity unavailable"],
  [106, "Quantity not allowed"],
  [109, "Product not found"],
  [110, "Unavailable"],
  [111, "Rate limited"],
  [112, "Quantity too small"],
  [113, "Quantity too large"],
  [114, "Business rule"],
  [120, "Token required"],
  [121, "Invalid token"],
  [122, "API disabled, inactive, or blocked"],
  [123, "IP not allowed"],
  [124, "Validation"],
  [130, "Maintenance"],
  [500, "Internal error"],
];

function code(value) {
  return JSON.stringify(value, null, 2);
}

async function copyText(value) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const field = document.createElement("textarea");
  field.value = value;
  field.setAttribute("readonly", "");
  field.style.position = "fixed";
  field.style.opacity = "0";
  document.body.appendChild(field);
  field.select();
  document.execCommand("copy");
  field.remove();
}

function CopyButton({ value }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await copyText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // Code remains selectable when the browser denies clipboard access.
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={`Copy ${value}`}
      className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs font-bold text-slate-200 transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-violet-300"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-300" /> : <ClipboardCopy className="h-3.5 w-3.5" />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function CodeBlock({ label, value }) {
  return (
    <div className="min-w-0 overflow-hidden rounded-xl border border-slate-800 bg-[#080e1b] shadow-[0_12px_32px_rgba(2,6,23,0.16)]">
      <div className="flex items-center justify-between gap-3 border-b border-white/10 px-3.5 py-3">
        <p className="min-w-0 truncate text-xs font-black text-slate-200">{label}</p>
        <CopyButton value={value} />
      </div>
      <pre className="max-h-[420px] overflow-auto p-4 text-left font-mono text-xs leading-6 text-slate-200"><code>{value}</code></pre>
    </div>
  );
}

function EndpointCard({ children, description, method, parameters, path, request, response }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.05)] dark:border-white/10 dark:bg-white/[0.025] sm:p-6">
      <div className="flex flex-wrap items-center gap-2" dir="ltr">
        <span className={`rounded-md px-2 py-1 text-[10px] font-black ${method === "POST" ? "bg-violet-100 text-violet-700 dark:bg-violet-400/15 dark:text-violet-200" : "bg-cyan-100 text-cyan-800 dark:bg-cyan-400/15 dark:text-cyan-200"}`}>{method}</span>
        <code className="break-all font-mono text-sm font-bold text-slate-900 dark:text-white">{path}</code>
      </div>
      <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">{description}</p>
      {parameters?.length > 0 && (
        <dl className="mt-4 grid gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm dark:border-white/10 dark:bg-white/[0.03]">
          {parameters.map(([name, detail]) => (
            <div key={name} className="grid gap-1 sm:grid-cols-[180px_1fr] sm:gap-3">
              <dt className="font-mono font-bold text-violet-700 dark:text-violet-200">{name}</dt>
              <dd className="text-slate-600 dark:text-slate-300">{detail}</dd>
            </div>
          ))}
        </dl>
      )}
      {children && <div className="mt-4">{children}</div>}
      {(request || response) && (
        <div className="mt-5 grid gap-4 xl:grid-cols-2">
          {request && <CodeBlock label="Request example" value={request} />}
          {response && <CodeBlock label="Response example" value={response} />}
        </div>
      )}
    </article>
  );
}

function DocsSection({ children, id, title }) {
  return (
    <section id={id} className="scroll-mt-24 rounded-[26px] border border-slate-200/80 bg-white/90 p-5 shadow-[0_18px_45px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-[#0a1020]/90 sm:p-7">
      <h2 className="text-xl font-black tracking-tight text-slate-950 dark:text-white sm:text-2xl">{title}</h2>
      <div className="mt-4 space-y-4 text-sm leading-7 text-slate-600 dark:text-slate-300">{children}</div>
    </section>
  );
}

function SectionNav({ activeSection, mobile = false }) {
  return (
    <nav aria-label="API documentation sections" className={mobile ? "grid gap-1 p-3" : "space-y-1"}>
      {sections.map(([id, label]) => (
        <a
          key={id}
          href={`#${id}`}
          className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm font-bold transition ${activeSection === id ? "bg-violet-600 text-white shadow-sm" : "text-slate-600 hover:bg-violet-50 hover:text-violet-800 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"}`}
        >
          {label}
          <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
        </a>
      ))}
    </nav>
  );
}

export default function ApiDocsPage() {
  const [activeSection, setActiveSection] = useState("introduction");
  const baseUrl = getCanonicalApiBaseUrl();
  const aliasUrl = baseUrl.replace(/\/client\/api$/, "/api/client/api");
  const legacyUrl = baseUrl.replace(/\/client\/api$/, "/api/client");

  useEffect(() => {
    if (!("IntersectionObserver" in window)) return undefined;
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.find((entry) => entry.isIntersecting);
      if (visible?.target?.id) setActiveSection(visible.target.id);
    }, { rootMargin: "-20% 0px -68% 0px", threshold: 0 });

    sections.forEach(([id]) => {
      const section = document.getElementById(id);
      if (section) observer.observe(section);
    });
    return () => observer.disconnect();
  }, []);

  const profileResponse = code({ balance: "150", email: "developer@example.com", currency: "USD" });
  const productResponse = code([{
    id: 1000,
    name: "Example product",
    price: 1.5,
    currency: "USD",
    available: true,
    product_type: "package",
    parent_id: 100,
    category_name: "Games",
    category_img: "https://example.com/category.png",
    qty_values: null,
    params: ["Player ID"],
    fields: [{ key: "player_id", label: "Player ID", type: "text", required: true, options: [] }],
    min: 1,
    max: 1,
  }]);
  const contentResponse = code({
    status: "OK",
    data: {
      categories: [{ id: 100, name: "Games", parent_id: 0, image: "https://example.com/category.png", available: true }],
      products: [],
    },
  });
  const orderResponse = code({
    status: "OK",
    data: {
      order_id: "ID_abc123",
      order_uuid: "stable-client-key",
      status: "wait",
      price: 1.5,
      currency: "USD",
      data: { player_id: "123456" },
      replay_api: null,
    },
  });
  const checkResponse = code({
    status: "OK",
    data: [{
      order_id: "ID_abc123",
      order_uuid: "stable-client-key",
      quantity: 1,
      data: { player_id: "123456" },
      created_at: "2026-01-01 12:00:00",
      product_name: "Example product",
      price: "1.5",
      status: "wait",
      replay_api: null,
    }],
  });
  const orderBody = code({ product_id: 1000, qty: 1, order_uuid: "stable-client-key", params: { player_id: "123456" } });
  const errorResponse = code({ status: "ERROR", code: 121, message: "Invalid API token" });

  return (
    <main dir="ltr" className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(224,242,254,0.95),transparent_32%),linear-gradient(135deg,#FFFFFF_0%,#F8FCFF_46%,#FDF2F8_100%)] px-4 py-6 text-slate-900 dark:bg-[linear-gradient(180deg,#050816_0%,#0A1120_35%,#0D1324_100%)] dark:text-[#C4C9D4] sm:px-6 sm:py-8">
      <div className="mx-auto max-w-7xl">
        <header className="rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-[0_18px_55px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-[#0a1020] sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3.5">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-violet-600 text-white shadow-[0_10px_28px_rgba(124,58,237,0.28)]"><Code2 className="h-6 w-6" /></span>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-600 dark:text-violet-300">Winnie HUB Developers</p>
                <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-950 dark:text-white sm:text-3xl">Canonical B2B API</h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">Build catalog, order, and status integrations with Winnie’s public Canonical B2B contract.</p>
              </div>
            </div>
            <Link to="/developers/api" className="inline-flex w-fit items-center gap-2 rounded-xl bg-violet-600 px-4 py-3 text-sm font-black text-white shadow-sm transition hover:bg-violet-700">
              <BookOpenText className="h-4 w-4" />
              Developer API
              <ExternalLink className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-violet-200 bg-violet-50/70 p-4 dark:border-violet-400/20 dark:bg-violet-400/[0.08] sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-violet-700 dark:text-violet-200">Primary Base URL</p>
              <code className="mt-1 block overflow-x-auto font-mono text-sm font-bold text-slate-900 dark:text-white">{baseUrl}</code>
            </div>
            <CopyButton value={baseUrl} />
          </div>
        </header>

        <details className="mt-5 rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#0a1020] lg:hidden">
          <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-sm font-black text-slate-900 [&::-webkit-details-marker]:hidden dark:text-white"><Menu className="h-4 w-4 text-violet-600 dark:text-violet-300" />Browse documentation</summary>
          <SectionNav activeSection={activeSection} mobile />
        </details>

        <div className="mt-6 grid gap-6 lg:grid-cols-[230px_minmax(0,1fr)]">
          <aside className="hidden lg:block">
            <div className="sticky top-6 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-white/10 dark:bg-[#0a1020]">
              <p className="px-3 pb-2 pt-1 text-xs font-black uppercase tracking-[0.14em] text-slate-400">On this page</p>
              <SectionNav activeSection={activeSection} />
            </div>
          </aside>

          <div className="min-w-0 space-y-5">
            <DocsSection id="introduction" title="Introduction">
              <p>Winnie exposes a Canonical B2B API for supplier integrations. Products, categories, and orders use public compatibility identifiers; never rely on MongoDB IDs. Catalog prices are reseller sale prices expressed in USD.</p>
            </DocsSection>

            <DocsSection id="base-url" title="Base URL">
              <p>Use the primary base for new Canonical integrations. The alias is available for compatibility. Winnie’s older client API remains available, but it is not the recommended Canonical base.</p>
              <div className="grid gap-3">
                <CodeBlock label="Primary — recommended" value={baseUrl} />
                <CodeBlock label="Alias" value={aliasUrl} />
                <CodeBlock label="Legacy Winnie client API — not Canonical" value={legacyUrl} />
              </div>
            </DocsSection>

            <DocsSection id="authentication" title="Authentication">
              <p>Send one supported token header on every request. Use <code className="rounded bg-violet-100 px-1.5 py-0.5 font-mono font-bold text-violet-800 dark:bg-violet-400/15 dark:text-violet-100">api-token</code> for new integrations. Keep the token in server-side environment configuration only.</p>
              <CodeBlock label="Supported authentication headers" value={"api-token: YOUR_API_TOKEN\n\nx-api-key: YOUR_API_TOKEN\n\nAuthorization: Bearer YOUR_API_TOKEN"} />
            </DocsSection>

            <DocsSection id="profile" title="Profile">
              <EndpointCard method="GET" path="/profile" description="Returns the authenticated API account’s balance, email, and currency." request={`GET ${baseUrl}/profile\napi-token: YOUR_API_TOKEN`} response={profileResponse} />
            </DocsSection>

            <DocsSection id="products" title="Products">
              <EndpointCard
                method="GET"
                path="/products"
                description="Lists products available to the authenticated account. id is Winnie’s public numeric compatibility product ID; catalog price is the final reseller sale price in USD."
                parameters={[["products_id", "Optional comma-separated public product IDs, for example 1000,1001."], ["base=1", "Optional minimal base-compatible product view; it omits category and field detail."]]}
                request={`GET ${baseUrl}/products\nGET ${baseUrl}/products?products_id=1000,1001\nGET ${baseUrl}/products?base=1\napi-token: YOUR_API_TOKEN`}
                response={productResponse}
              />
              <p>Full product responses include availability, category metadata, quantity rules, legacy <code>params[]</code>, and structured <code>fields[]</code>. Never use MongoDB ObjectIds as product identifiers.</p>
            </DocsSection>

            <DocsSection id="product-fields" title="Product Fields">
              <p><code>params[]</code> is retained for legacy display labels. Use <code>fields[]</code> to build order forms and validate the customer input you send in <code>params</code>.</p>
              <CodeBlock label="Structured field example" value={code([{ key: "player_id", label: "Player ID", type: "text", required: true, options: [] }])} />
              <p>Supported structured metadata is <code>key</code>, <code>label</code>, <code>type</code>, <code>required</code>, and <code>options</code>.</p>
            </DocsSection>

            <DocsSection id="content" title="Content / Categories">
              <EndpointCard
                method="GET"
                path="/content/:parentId"
                description="Returns direct child categories and products assigned directly to a public numeric category compatibility ID. Use 0 for the root."
                parameters={[["parentId", "Public numeric category ID. Use 0 for root categories and uncategorized products."]]}
                request={`GET ${baseUrl}/content/0\nGET ${baseUrl}/content/100\napi-token: YOUR_API_TOKEN`}
                response={contentResponse}
              />
              <p><code>/content/0</code> returns root categories and uncategorized products. A non-root parent returns only direct children and direct products, preserving Winnie’s nested-category model.</p>
            </DocsSection>

            <DocsSection id="create-order" title="Create Order">
              <EndpointCard
                method="POST"
                path="/orders"
                description="Creates an order using Winnie’s existing pricing, wallet, validation, and fulfillment flow."
                parameters={[["product_id", "Required public numeric Canonical product ID."], ["qty", "Required quantity allowed by the product’s quantity rules."], ["order_uuid", "Required stable, caller-controlled idempotency key."], ["params", "Customer/product input object; provide every required fields[] value."]]}
                request={`POST ${baseUrl}/orders\napi-token: YOUR_API_TOKEN\nContent-Type: application/json\n\n${orderBody}`}
                response={orderResponse}
              />
              <p>Replaying the same <code>order_uuid</code> for the same account returns the original order instead of creating or debiting twice. Client-supplied price, currency, and balance are never authoritative.</p>
            </DocsSection>

            <DocsSection id="check-orders" title="Check Orders">
              <EndpointCard
                method="GET"
                path="/check"
                description="Returns only orders owned by the authenticated API account. Unknown references return a successful response with an empty data array."
                parameters={[["orders", "Comma-separated public Canonical order identifiers returned as order_id."], ["orders + uuid=1", "Treat comma-separated orders values as order_uuid references."], ["uuids", "Treat comma-separated values as order_uuid references."]]}
                request={`GET ${baseUrl}/check?orders=ID_abc123,ID_def456\nGET ${baseUrl}/check?orders=stable-client-key&uuid=1\nGET ${baseUrl}/check?uuids=stable-client-key\napi-token: YOUR_API_TOKEN`}
                response={checkResponse}
              />
              <p>The backend may accept historical numeric <code>orderNumber</code> values for compatibility, but MongoDB IDs are never part of the public contract.</p>
            </DocsSection>

            <DocsSection id="status-values" title="Status Values">
              <div className="grid gap-3 sm:grid-cols-3">
                {[['accept', 'Completed successfully'], ['reject', 'Definitively rejected or failed'], ['wait', 'Pending or processing']].map(([status, meaning]) => (
                  <article key={status} className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.03]">
                    <code className="font-mono text-base font-black text-violet-700 dark:text-violet-200">{status}</code>
                    <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{meaning}</p>
                  </article>
                ))}
              </div>
              <p>These are the public Canonical values. Winnie internal workflow states are not part of the API contract.</p>
            </DocsSection>

            <DocsSection id="error-codes" title="Error Codes">
              <p>Canonical errors use the following envelope:</p>
              <CodeBlock label="Error response" value={errorResponse} />
              <div className="grid gap-2 sm:grid-cols-2">
                {errorCodes.map(([number, label]) => <div key={number} className="flex gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 dark:border-white/10 dark:bg-white/[0.03]"><code className="font-mono font-black text-violet-700 dark:text-violet-200">{number}</code><span>{label}</span></div>)}
              </div>
              <p>Rate limiting is 1,000 requests per 15 minutes per IP and returns code <code>111</code>. Maintenance returns code <code>130</code> only for order-placement endpoints; profile, products, content, and check remain available.</p>
            </DocsSection>

            <DocsSection id="code-examples" title="Code Examples">
              <p>All examples use dummy values and the recommended <code>api-token</code> header.</p>
              <div className="grid gap-4">
                <CodeBlock label="cURL" value={`curl -X POST ${baseUrl}/orders \\\n  -H "api-token: YOUR_API_TOKEN" \\\n  -H "Content-Type: application/json" \\\n  -d '${JSON.stringify({ product_id: 1000, qty: 1, order_uuid: "stable-client-key", params: { player_id: "123456" } })}'\n\ncurl -H "api-token: YOUR_API_TOKEN" ${baseUrl}/profile\ncurl -H "api-token: YOUR_API_TOKEN" ${baseUrl}/products\ncurl -H "api-token: YOUR_API_TOKEN" "${baseUrl}/check?uuids=stable-client-key"`} />
                <CodeBlock label="JavaScript" value={`const headers = { "api-token": "YOUR_API_TOKEN", "Content-Type": "application/json" };\n\nconst profile = await fetch("${baseUrl}/profile", { headers });\nconst products = await fetch("${baseUrl}/products", { headers });\nconst order = await fetch("${baseUrl}/orders", {\n  method: "POST",\n  headers,\n  body: JSON.stringify(${orderBody}),\n});\nconst checked = await fetch("${baseUrl}/check?uuids=stable-client-key", { headers });`} />
                <CodeBlock label="PHP" value={`$headers = ["api-token: YOUR_API_TOKEN", "Content-Type: application/json"];\n$body = json_encode(["product_id" => 1000, "qty" => 1, "order_uuid" => "stable-client-key", "params" => ["player_id" => "123456"]]);\n$ch = curl_init("${baseUrl}/orders");\ncurl_setopt_array($ch, [CURLOPT_POST => true, CURLOPT_HTTPHEADER => $headers, CURLOPT_POSTFIELDS => $body, CURLOPT_RETURNTRANSFER => true]);\n$response = curl_exec($ch);`} />
                <CodeBlock label="Python" value={`import requests\n\nheaders = {"api-token": "YOUR_API_TOKEN"}\nprofile = requests.get("${baseUrl}/profile", headers=headers)\nproducts = requests.get("${baseUrl}/products", headers=headers)\norder = requests.post("${baseUrl}/orders", headers=headers, json=${orderBody})\nchecked = requests.get("${baseUrl}/check", headers=headers, params={"uuids": "stable-client-key"})`} />
              </div>
            </DocsSection>

            <DocsSection id="legacy" title="Legacy Compatibility">
              <EndpointCard
                method="GET"
                path="/newOrder/:productId/params"
                description="Retained only for existing integrations. Use POST /orders for all new integrations."
                parameters={[["productId", "Public numeric Canonical product ID."], ["qty", "Requested quantity."], ["order_uuid", "Stable caller idempotency key."], ["additional query values", "Customer fields, for example player_id=123456."]]}
                request={`GET ${baseUrl}/newOrder/1000/params?qty=1&order_uuid=stable-client-key&player_id=123456\napi-token: YOUR_API_TOKEN`}
                response={orderResponse}
              />
              <p>Winnie’s older <code>{legacyUrl}</code> client API surface remains legacy compatibility only; it is not the preferred Canonical interface.</p>
            </DocsSection>
          </div>
        </div>
      </div>
    </main>
  );
}
