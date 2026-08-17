import {
  BookOpenText,
  Braces,
  Check,
  CheckCircle2,
  Copy,
  Eye,
  EyeOff,
  Fingerprint,
  KeyRound,
  Link2,
  PackageSearch,
  RefreshCw,
  ShieldCheck,
  ShoppingCart,
  Terminal,
  TriangleAlert,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { getMyDeveloperAccess, rotateMyDeveloperToken } from "../../api/developerAccess";
import { useToast } from "../../components/ToastProvider";
import { useAuth } from "../../context/AuthContext";

const endpointGroups = [
  {
    icon: PackageSearch,
    eyebrow: "Catalog",
    title: "الحساب والمنتجات",
    endpoints: [
      ["GET", "/profile", "الرصيد والعملة وبيانات حساب API"],
      ["GET", "/products", "قائمة المنتجات والأسعار والحقول المطلوبة"],
    ],
  },
  {
    icon: ShoppingCart,
    eyebrow: "Orders",
    title: "الطلبات",
    endpoints: [
      ["POST", "/orders", "إنشاء طلب باستخدام productId وqty وorder_uuid"],
      ["GET", "/check?orders=ORDER_ID", "فحص حالة طلب أو عدة طلبات مفصولة بفاصلة"],
    ],
  },
];

const guideSteps = [
  {
    title: "انسخ بيانات الاتصال",
    text: "احتفظ بالتوكن والرابط في متغيرات البيئة داخل الخادم.",
  },
  {
    title: "أرسل التوكن",
    text: "أضف X-API-Key إلى Header في كل طلب ترسله.",
  },
  {
    title: "ميّز كل طلب",
    text: "أنشئ order_uuid جديدًا مع كل عملية لمنع التكرار.",
  },
];

function formatDate(value) {
  if (!value) return "غير متاح";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "غير متاح";
  return new Intl.DateTimeFormat("ar-EG-u-nu-latn", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

async function writeClipboard(value) {
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

export default function DeveloperApiPage() {
  const { token, user } = useAuth();
  const { showToast } = useToast();
  const [access, setAccess] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tokenVisible, setTokenVisible] = useState(true);
  const [rotating, setRotating] = useState(false);
  const [confirmRotate, setConfirmRotate] = useState(false);

  const loadAccess = useCallback(async () => {
    if (!token) {
      setLoading(false);
      setError("يلزم تسجيل الدخول لعرض بيانات API.");
      return;
    }

    if (user?.apiAccessEnabled !== true) {
      setAccess({ enabled: false, apiBaseUrl: "", apiToken: "" });
      setLoading(false);
      setError("");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const result = await getMyDeveloperAccess(token);
      setAccess(result.access);
    } catch (requestError) {
      setError(requestError?.userMessage || requestError?.message || "تعذر تحميل بيانات API.");
    } finally {
      setLoading(false);
    }
  }, [token, user?.apiAccessEnabled]);

  useEffect(() => {
    void loadAccess();
  }, [loadAccess]);

  const copyValue = async (value, label) => {
    if (!value) {
      showToast({ type: "warning", title: label + " غير متاح" });
      return;
    }

    try {
      await writeClipboard(value);
      showToast({ type: "success", title: "تم نسخ " + label, duration: 1800 });
    } catch {
      showToast({ type: "error", title: "تعذر نسخ " + label });
    }
  };

  const rotateToken = async () => {
    if (!confirmRotate) {
      setConfirmRotate(true);
      return;
    }

    setRotating(true);
    try {
      const result = await rotateMyDeveloperToken(token);
      setAccess(result.access);
      setTokenVisible(true);
      setConfirmRotate(false);
      showToast({
        type: "success",
        title: result.message || "تم تغيير API Token",
        message: "انسخ التوكن الجديد الآن؛ التوكن السابق لم يعد صالحًا.",
      });
    } catch (requestError) {
      showToast({
        type: "error",
        title: "تعذر تغيير API Token",
        message: requestError?.userMessage || requestError?.message || "حاول مرة أخرى.",
      });
    } finally {
      setRotating(false);
    }
  };

  const baseUrl = access?.apiBaseUrl || "";
  const apiToken = access?.apiToken || "";
  const exampleBaseUrl = baseUrl || "https://api.example.com/api/client";
  const curlExample = useMemo(() => [
    "curl --request GET \\",
    "  --url '" + exampleBaseUrl + "/products' \\",
    "  --header 'X-API-Key: YOUR_API_KEY' \\",
    "  --header 'Accept: application/json'",
  ].join("\n"), [exampleBaseUrl]);
  const javascriptExample = useMemo(() => [
    "const response = await fetch(",
    "  '" + exampleBaseUrl + "/orders',",
    "  {",
    "    method: 'POST',",
    "    headers: {",
    "      'X-API-Key': 'YOUR_API_KEY',",
    "      'Content-Type': 'application/json',",
    "    },",
    "    body: JSON.stringify({",
    "      productId: 'PRODUCT_ID',",
    "      qty: 1,",
    "      order_uuid: crypto.randomUUID(),",
    "      dynamicData: {",
    "        player_id: '123456789',",
    "        server: 'EU',",
    "      },",
    "    }),",
    "  },",
    ");",
    "",
    "const result = await response.json();",
  ].join("\n"), [exampleBaseUrl]);

  if (loading) {
    return (
      <section dir="rtl" className="mx-auto grid min-h-[420px] max-w-6xl place-items-center px-4">
        <div className="text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-violet-200 bg-white shadow-lg dark:border-white/10 dark:bg-slate-900">
            <RefreshCw className="h-6 w-6 animate-spin text-violet-600 dark:text-violet-300" />
          </span>
          <p className="mt-4 text-sm font-bold text-slate-500 dark:text-slate-300">جارٍ تجهيز مساحة المطور...</p>
        </div>
      </section>
    );
  }

  if (user?.apiAccessEnabled !== true || access?.enabled === false) {
    return (
      <section dir="rtl" className="mx-auto grid min-h-[420px] max-w-3xl place-items-center px-4">
        <div className="w-full rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-[0_18px_55px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-[#0a1020]">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300">
            <Braces className="h-6 w-6" />
          </span>
          <h1 className="mt-4 text-xl font-black text-slate-950 dark:text-white">واجهة API غير مفعلة لحسابك</h1>
          <p className="mt-2 text-sm font-bold leading-7 text-slate-500 dark:text-slate-300">تواصل مع الإدارة لتفعيلها.</p>
        </div>
      </section>
    );
  }

  return (
    <div dir="rtl" className="developer-api-page relative mx-auto max-w-6xl space-y-5 pb-6 pt-2 sm:space-y-6 sm:pb-10 sm:pt-5">
      <section className="developer-api-hero relative isolate overflow-hidden rounded-[26px] border border-slate-200/80 bg-white px-4 py-5 shadow-[0_18px_55px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-[#0a1020] sm:px-7 sm:py-7">
        <div className="pointer-events-none absolute inset-y-0 left-0 -z-10 w-1/2 bg-[radial-gradient(circle_at_left,rgba(6,182,212,0.13),transparent_65%)] dark:bg-[radial-gradient(circle_at_left,rgba(34,211,238,0.10),transparent_65%)]" />
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3.5">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-violet-600 text-white shadow-[0_10px_28px_rgba(124,58,237,0.28)] sm:h-14 sm:w-14">
              <Braces className="h-6 w-6 sm:h-7 sm:w-7" />
            </span>
            <div className="min-w-0">
              <p dir="ltr" className="w-fit text-[10px] font-black tracking-[0.2em] text-violet-600 dark:text-violet-300 sm:text-xs">WINNIE DEVELOPERS</p>
              <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-950 dark:text-white sm:text-3xl">واجهة API</h1>
              <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400 sm:text-sm">بيانات الاتصال ودليل التكامل البرمجي</p>
            </div>
          </div>
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-xs font-black text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300">
            <CheckCircle2 className="h-4 w-4" />
            API مفعّل
          </span>
        </div>
      </section>

      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-700 dark:border-rose-400/20 dark:bg-rose-500/10 dark:text-rose-200">
          <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-black">تعذر الاتصال بخدمة API</p>
            <p className="mt-1 font-medium leading-6">{error}</p>
          </div>
        </div>
      )}

      <section className="developer-api-surface overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-[0_22px_65px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-[#0a1020]">
        <SectionHeader
          number="01"
          eyebrow="Credentials"
          title="بيانات الاتصال"
          description="هذه البيانات خاصة بحسابك. انسخها إلى إعدادات الخادم الذي سيجري عمليات الربط."
          icon={Fingerprint}
        />

        <div className="space-y-4 p-4 sm:p-6">
          <CredentialCard
            featured
            icon={KeyRound}
            label="API TOKEN"
            hint="X-API-Key"
            value={apiToken}
            placeholder="اضغط تغيير API Token لإنشاء توكن جديد وعرضه"
            secret
            visible={tokenVisible}
            onToggle={() => setTokenVisible((current) => !current)}
            onCopy={() => copyValue(apiToken, "API Token")}
          />
          <div className="developer-api-subcard grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.035] sm:grid-cols-3">
            <MetaItem label="Key prefix" value={access?.apiKeyPrefix || "-"} />
            <MetaItem label="Key last 4" value={access?.apiKeyLast4 || "-"} />
            <MetaItem label="Last used" value={formatDate(access?.lastUsedAt)} />
          </div>
          <CredentialCard
            icon={Link2}
            label="API URL"
            hint="Base URL"
            value={baseUrl}
            placeholder="لم يُرجع الخادم رابط API"
            onCopy={() => copyValue(baseUrl, "API URL")}
          />

          <div className="developer-api-subcard rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.035] sm:p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex min-w-0 items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-violet-100 text-violet-700 dark:bg-violet-400/10 dark:text-violet-300">
                  <RefreshCw className="h-4.5 w-4.5" />
                </span>
                <div>
                  <h2 className="text-sm font-black text-slate-950 dark:text-white">إنشاء أو تغيير API Token</h2>
                  <p className="mt-1 text-xs font-medium leading-6 text-slate-500 dark:text-slate-400">
                    التوكن الجديد يلغي الحالي فورًا؛ حدّثه في تطبيقك بعد الإنشاء.
                  </p>
                  <p className="mt-1 text-[11px] font-bold text-slate-400">
                    آخر تغيير: {formatDate(access?.lastRotatedAt || access?.createdAt)}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:flex">
                {confirmRotate && (
                  <button
                    type="button"
                    onClick={() => setConfirmRotate(false)}
                    className="order-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-black text-slate-700 transition hover:bg-slate-100 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10 sm:order-1"
                  >
                    إلغاء
                  </button>
                )}
                <button
                  type="button"
                  onClick={rotateToken}
                  disabled={rotating}
                  className={"order-1 inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-black text-white shadow-sm transition disabled:cursor-not-allowed disabled:opacity-50 sm:order-2 " + (confirmRotate ? "bg-rose-600 hover:bg-rose-700" : "bg-violet-600 hover:bg-violet-700")}
                >
                  <RefreshCw className={"h-4 w-4 " + (rotating ? "animate-spin" : "")} />
                  {rotating ? "جارٍ التغيير..." : confirmRotate ? "تأكيد تغيير التوكن" : "تغيير API Token"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="developer-api-surface overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-[0_22px_65px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-[#0a1020]">
        <SectionHeader
          number="02"
          eyebrow="Developer guide"
          title="دليل الربط للمبرمج"
          description="كل ما تحتاجه لإرسال أول طلب بنجاح، من التوثيق وحتى متابعة حالة الطلب."
          icon={BookOpenText}
        />

        <div className="space-y-6 p-4 sm:p-6">
          <div className="grid gap-3 lg:grid-cols-3">
            {guideSteps.map((step, index) => (
              <GuideStep
                key={step.title}
                number={String(index + 1).padStart(2, "0")}
                title={step.title}
                text={step.text}
              />
            ))}
          </div>

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
            <div className="min-w-0 space-y-4">
              <Subheading
                eyebrow="Ready to use"
                title="أمثلة جاهزة"
                description="استبدل القيم التجريبية ببيانات حسابك ثم شغّل الطلب من الخادم."
              />
              <CodeBlock
                language="cURL"
                title="قراءة قائمة المنتجات"
                code={curlExample}
                onCopy={() => copyValue(curlExample, "مثال cURL")}
              />
              <CodeBlock
                language="JavaScript"
                title="إنشاء طلب جديد"
                code={javascriptExample}
                onCopy={() => copyValue(javascriptExample, "مثال JavaScript")}
              />
            </div>

            <div className="min-w-0 space-y-4">
              <Subheading
                eyebrow="Endpoints"
                title="المسارات المتاحة"
                description="تُضاف هذه المسارات بعد API URL الظاهر أعلى الصفحة."
              />
              <div className="space-y-3">
                {endpointGroups.map((group) => (
                  <EndpointGroup key={group.title} group={group} />
                ))}
              </div>
              <div className="developer-api-security flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-400/20 dark:bg-amber-400/[0.08]">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-700 dark:text-amber-300" />
                <div className="text-xs font-medium leading-6 text-slate-600 dark:text-slate-300">
                  <p className="font-black text-slate-950 dark:text-white">حماية بيانات الربط</p>
                  <p className="mt-1">لا تضع التوكن في الواجهة الأمامية أو مستودع Git. خزّنه في متغيرات البيئة على الخادم، وأرسله في header باسم X-API-Key، واستخدم HTTPS فقط.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function SectionHeader({ description, eyebrow, icon: Icon, number, title }) {
  return (
    <header className="developer-api-section-header border-b border-slate-200/80 bg-slate-50/70 px-4 py-5 dark:border-white/10 dark:bg-white/[0.025] sm:px-6">
      <div className="flex items-start gap-3.5">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-violet-200 bg-white text-violet-700 shadow-sm dark:border-violet-400/20 dark:bg-violet-400/10 dark:text-violet-300">
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-black tracking-[0.16em] text-violet-600 uppercase dark:text-violet-300">{eyebrow}</span>
            <span className="h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-600" />
            <span className="text-[10px] font-black text-slate-400">{number}</span>
          </div>
          <h2 className="mt-1 text-lg font-black text-slate-950 dark:text-white sm:text-xl">{title}</h2>
          <p className="mt-1 max-w-3xl text-xs font-medium leading-6 text-slate-500 dark:text-slate-400 sm:text-sm">{description}</p>
        </div>
      </div>
    </header>
  );
}

function CredentialCard({
  featured = false,
  hint,
  icon: Icon,
  label,
  onCopy,
  onToggle,
  placeholder,
  secret = false,
  value,
  visible = true,
}) {
  const maskedValue = value
    ? value.slice(0, 7) + "•".repeat(Math.min(26, Math.max(12, value.length - 11))) + value.slice(-4)
    : "";
  const displayValue = value ? (secret && !visible ? maskedValue : value) : placeholder;

  return (
    <article className={featured
      ? "developer-api-token relative overflow-hidden rounded-2xl border border-slate-700 bg-[#0b1324] p-4 text-white shadow-[0_18px_45px_rgba(15,23,42,0.20)] sm:p-5"
      : "developer-api-credential rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.025] sm:p-5"
    }>
      {featured && <div className="pointer-events-none absolute -left-12 -top-16 h-40 w-40 rounded-full bg-violet-500/20 blur-3xl" />}
      <div className="relative flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className={featured
            ? "grid h-9 w-9 place-items-center rounded-xl bg-white/10 text-violet-200"
            : "grid h-9 w-9 place-items-center rounded-xl bg-violet-50 text-violet-700 dark:bg-violet-400/10 dark:text-violet-300"
          }>
            <Icon className="h-4.5 w-4.5" />
          </span>
          <div>
            <p className={featured ? "text-xs font-black text-white" : "text-xs font-black text-slate-900 dark:text-white"}>{label}</p>
            <p dir="ltr" className={featured ? "mt-0.5 text-[10px] font-bold text-slate-400" : "mt-0.5 text-[10px] font-bold text-slate-400"}>{hint}</p>
          </div>
        </div>
        {value && (
          <span className={featured
            ? "inline-flex items-center gap-1 rounded-full bg-emerald-400/10 px-2.5 py-1 text-[10px] font-black text-emerald-300"
            : "inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-black text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300"
          }>
            <Check className="h-3 w-3" />
            جاهز
          </span>
        )}
      </div>

      <div dir="ltr" className={featured
        ? "relative mt-4 rounded-xl border border-white/10 bg-black/20 p-3"
        : "mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-[#070d19]"
      }>
        <code className={"block min-h-6 break-all text-left font-mono text-[12px] font-semibold leading-6 sm:text-[13px] " + (
          value
            ? featured ? "text-slate-100" : "text-slate-800 dark:text-slate-100"
            : "text-slate-400"
        )}>
          {displayValue}
        </code>
      </div>

      <div className="relative mt-3 grid grid-cols-1 gap-2 min-[390px]:grid-cols-2 sm:flex sm:justify-end">
        {secret && value && (
          <button
            type="button"
            onClick={onToggle}
            className={featured
              ? "inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-xs font-black text-slate-200 transition hover:bg-white/10"
              : "inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-black text-slate-600 transition hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5"
            }
          >
            {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {visible ? "إخفاء التوكن" : "إظهار التوكن"}
          </button>
        )}
        <button
          type="button"
          onClick={onCopy}
          disabled={!value}
          className={featured
            ? "inline-flex items-center justify-center gap-2 rounded-xl bg-violet-500 px-4 py-2.5 text-xs font-black text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-40"
            : "inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-black text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-violet-600 dark:hover:bg-violet-500"
          }
        >
          <Copy className="h-4 w-4" />
          نسخ {label}
        </button>
      </div>
    </article>
  );
}

function GuideStep({ number, text, title }) {
  return (
    <article className="developer-api-subcard relative rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-white/10 dark:bg-white/[0.025] sm:p-5">
      <span className="grid h-8 w-8 place-items-center rounded-full bg-violet-600 text-[10px] font-black text-white shadow-sm">{number}</span>
      <h3 className="mt-4 text-sm font-black text-slate-950 dark:text-white">{title}</h3>
      <p className="mt-1.5 text-xs font-medium leading-6 text-slate-500 dark:text-slate-400">{text}</p>
    </article>
  );
}

function MetaItem({ label, value }) {
  return (
    <div>
      <p className="text-[10px] font-black uppercase text-slate-400">{label}</p>
      <strong dir="ltr" className="mt-1 block break-all text-sm font-black text-slate-900 dark:text-white">{value}</strong>
    </div>
  );
}

function Subheading({ description, eyebrow, title }) {
  return (
    <div>
      <p className="text-[10px] font-black tracking-[0.16em] text-violet-600 uppercase dark:text-violet-300">{eyebrow}</p>
      <h3 className="mt-1 text-base font-black text-slate-950 dark:text-white">{title}</h3>
      <p className="mt-1 text-xs font-medium leading-5 text-slate-500 dark:text-slate-400">{description}</p>
    </div>
  );
}

function CodeBlock({ code, language, onCopy, title }) {
  return (
    <article className="developer-api-code min-w-0 overflow-hidden rounded-2xl border border-slate-800 bg-[#080e1b] shadow-[0_16px_38px_rgba(2,6,23,0.18)]">
      <header className="flex items-center justify-between gap-3 border-b border-white/10 px-3.5 py-3 sm:px-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex gap-1.5" aria-hidden="true">
            <i className="h-2 w-2 rounded-full bg-rose-400" />
            <i className="h-2 w-2 rounded-full bg-amber-400" />
            <i className="h-2 w-2 rounded-full bg-emerald-400" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-[11px] font-black text-slate-200">{title}</p>
            <p dir="ltr" className="mt-0.5 w-fit text-[9px] font-bold text-slate-500">{language}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onCopy}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-[10px] font-black text-slate-200 transition hover:bg-white/10"
        >
          <Copy className="h-3.5 w-3.5" />
          نسخ
        </button>
      </header>
      <pre dir="ltr" className="max-h-[420px] overflow-auto p-4 text-left font-mono text-[11px] font-medium leading-6 text-slate-300 sm:text-xs"><code>{code}</code></pre>
    </article>
  );
}

function EndpointGroup({ group }) {
  const Icon = group.icon;

  return (
    <article className="developer-api-endpoint overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10">
      <header className="developer-api-endpoint-header flex items-center gap-3 bg-slate-50 px-4 py-3.5 dark:bg-white/[0.035]">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-white text-violet-700 shadow-sm dark:bg-white/5 dark:text-violet-300">
          <Icon className="h-4.5 w-4.5" />
        </span>
        <div>
          <p dir="ltr" className="w-fit text-[9px] font-black tracking-[0.14em] text-slate-400 uppercase">{group.eyebrow}</p>
          <h4 className="mt-0.5 text-sm font-black text-slate-950 dark:text-white">{group.title}</h4>
        </div>
      </header>
      <div className="divide-y divide-slate-200 dark:divide-white/10">
        {group.endpoints.map(([method, path, description]) => (
          <div key={method + "-" + path} className="p-4">
            <div dir="ltr" className="flex min-w-0 items-center gap-2 text-left">
              <span className={"shrink-0 rounded-md px-2 py-1 text-[9px] font-black " + (
                method === "POST"
                  ? "bg-violet-100 text-violet-700 dark:bg-violet-400/10 dark:text-violet-300"
                  : "bg-cyan-100 text-cyan-800 dark:bg-cyan-400/10 dark:text-cyan-300"
              )}>
                {method}
              </span>
              <code className="min-w-0 break-all font-mono text-[11px] font-bold text-slate-800 dark:text-slate-200">{path}</code>
            </div>
            <p className="mt-2 text-xs font-medium leading-5 text-slate-500 dark:text-slate-400">{description}</p>
          </div>
        ))}
      </div>
    </article>
  );
}
