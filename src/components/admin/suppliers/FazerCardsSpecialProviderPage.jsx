import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  Bot,
  Boxes,
  CheckCircle2,
  CircleDollarSign,
  CloudCog,
  Gamepad2,
  Gift,
  KeyRound,
  Layers3,
  MessageCircleMore,
  RefreshCw,
  Rocket,
  Search,
  ShieldCheck,
  Smartphone,
  Sparkles,
  UserRoundCheck,
  Webhook,
  Zap,
} from "lucide-react";
import { Link } from "react-router-dom";
import FazerCardsLaunchOpsPanel from "./FazerCardsLaunchOpsPanel";
import "../../../styles/fazercards-special-provider.css";

const familyGroups = [
  {
    key: "instant",
    eyebrow: "كتالوج فوري",
    title: "المنتجات الرقمية المباشرة",
    description: "عائلات سريعة ذات كتالوج واضح وتسليم أو تنفيذ مباشر.",
    families: ["TOPUPS", "GIFTCARDS", "GAME_KEYS"],
  },
  {
    key: "account",
    eyebrow: "بيانات العميل",
    title: "خدمات مرتبطة بالحساب",
    description: "تحتاج بيانات مستهدفة والتحقق منها قبل إنشاء الطلب.",
    families: ["TELEGRAM", "STEAM_TOPUP"],
  },
  {
    key: "special",
    eyebrow: "تدفقات خاصة",
    title: "الخدمات المرنة والكتالوجات الكبيرة",
    description: "مسارات تشغيل مخصصة للمتابعة اليدوية أو الاستيراد عند الطلب.",
    families: ["MANUAL_SERVICES", "STEAM_GIFTS"],
  },
];

const familyMeta = {
  TOPUPS: {
    title: "الشحن المباشر",
    description: "شحن الرصيد والخدمات الرقمية ذات التنفيذ السريع.",
    icon: Smartphone,
    tone: "violet",
  },
  GIFTCARDS: {
    title: "بطاقات الهدايا",
    description: "أكواد رقمية مع حفظ وتسليم آمن للعميل.",
    icon: Gift,
    tone: "rose",
  },
  GAME_KEYS: {
    title: "مفاتيح الألعاب",
    description: "مفاتيح تفعيل الألعاب والمنصات حسب المنطقة.",
    icon: KeyRound,
    tone: "amber",
  },
  TELEGRAM: {
    title: "خدمات تيليجرام",
    description: "تنفيذ موجه باستخدام اسم المستخدم المستهدف.",
    icon: MessageCircleMore,
    tone: "sky",
  },
  STEAM_TOPUP: {
    title: "شحن Steam",
    description: "تحقق من Steam Login قبل إرسال طلب الشحن.",
    icon: UserRoundCheck,
    tone: "emerald",
  },
  MANUAL_SERVICES: {
    title: "الخدمات اليدوية",
    description: "طلبات مرنة تحتاج متابعة ومحادثة أثناء التنفيذ.",
    icon: Bot,
    tone: "fuchsia",
  },
  STEAM_GIFTS: {
    title: "هدايا Steam",
    description: "بحث محلي واستيراد لعبة واحدة حسب AppID والمنطقة.",
    icon: Gamepad2,
    tone: "indigo",
  },
};

function formatNumber(value) {
  return Number(value || 0).toLocaleString("ar-EG-u-nu-latn");
}

function formatBalance(balance) {
  if (balance === null || balance === undefined || balance === "") return "—";
  if (typeof balance === "object") {
    const amount = balance.amount ?? balance.balance ?? balance.available ?? balance.value;
    const currency = balance.currency || "USD";
    return amount === undefined || amount === null ? "—" : `${formatNumber(amount)} ${currency}`;
  }
  return `${formatNumber(balance)} USD`;
}

export default function FazerCardsSpecialProviderPage({
  actionKey,
  catalog,
  launchOps,
  loadError,
  loading,
  onBulkLaunch,
  onCompleteManual,
  onFailManual,
  onLoadOperations,
  onManualFilterChange,
  onNoteManual,
  onOpenFamily,
  onPublishEligible,
  onRefresh,
  onSyncAll,
  onSyncFamily,
  supplier,
}) {
  const health = launchOps.health;
  const connected = Boolean(health?.api?.connectionOk);
  const busy = Boolean(actionKey) || catalog.loading || launchOps.loading;

  if (loading) {
    return <SpecialProviderSkeleton />;
  }

  if (loadError || !supplier) {
    return (
      <section className="fazer-special-empty">
        <span><AlertTriangle /></span>
        <h1>تعذر فتح صفحة المورد الخاص</h1>
        <p>{loadError || "لم يتم العثور على مورد FazerCards ضمن الموردين المسجلين."}</p>
        <Link to="/admin/tools/suppliers"><ArrowLeft /> الرجوع إلى الموردين</Link>
      </section>
    );
  }

  const catalogTotal = catalog.summary?.totalProviderProducts || 0;
  const supportedTotal = Object.values(catalog.summary?.byFamily || {}).reduce((total, item) => total + Number(item.supported || 0), 0);
  const importedTotal = Object.values(catalog.summary?.byFamily || {}).reduce((total, item) => total + Number(item.imported || 0), 0);
  const pendingOrders = launchOps.manualOrders.filter((order) => ["PENDING", "PROCESSING", "IN_PROGRESS"].includes(String(order.status || "").toUpperCase())).length;

  return (
    <div dir="rtl" className="fazer-special-page">
      <section className="fazer-special-hero">
        <div className="fazer-special-hero-glow fazer-special-hero-glow--one" />
        <div className="fazer-special-hero-glow fazer-special-hero-glow--two" />

        <div className="fazer-special-hero-top">
          <Link className="fazer-special-back" to="/admin/tools/suppliers">
            <ArrowLeft />
            <span>كل الموردين</span>
          </Link>
          <div className="fazer-special-statuses">
            <span className={connected ? "is-online" : "is-offline"}>
              <i /> {connected ? "متصل" : "غير متصل"}
            </span>
            <span><ShieldCheck /> تكامل محمي</span>
          </div>
        </div>

        <div className="fazer-special-hero-content">
          <div className="fazer-special-brand-mark" aria-hidden="true">
            <span>F</span>
            <Sparkles />
          </div>
          <div className="fazer-special-hero-copy">
            <p className="fazer-special-kicker">صفحة مورد خاص</p>
            <h1>مركز FazerCards</h1>
            <p>مساحة موحدة لإدارة عائلات المنتجات، سلامة التشغيل، الطلبات، والمزامنة بدون ازدحام صفحة الموردين الأساسية.</p>
          </div>
          <div className="fazer-special-hero-actions">
            <button type="button" onClick={onRefresh} disabled={busy} className="fazer-special-button fazer-special-button--glass">
              <RefreshCw className={busy ? "animate-spin" : ""} />
              تحديث البيانات
            </button>
            <button type="button" onClick={() => onOpenFamily("")} disabled={busy} className="fazer-special-button fazer-special-button--light">
              <Boxes />
              فتح الكتالوج
            </button>
          </div>
        </div>
      </section>

      {(catalog.error || launchOps.error) && (
        <div className="fazer-special-alert">
          <AlertTriangle />
          <p>{catalog.error || launchOps.error}</p>
        </div>
      )}

      <nav className="fazer-special-nav" aria-label="أقسام صفحة المورد الخاص">
        <a href="#fazer-overview"><Activity /> نظرة عامة</a>
        <a href="#fazer-families"><Layers3 /> عائلات المنتجات</a>
        <a href="#fazer-operations"><Rocket /> مركز التشغيل</a>
        <a href="#fazer-safety"><ShieldCheck /> الحماية والجاهزية</a>
      </nav>

      <section id="fazer-overview" className="fazer-special-metrics" aria-label="ملخص المورد">
        <Metric icon={CloudCog} label="حالة الاتصال" value={connected ? "متصل" : "بحاجة لمراجعة"} tone={connected ? "emerald" : "amber"} />
        <Metric icon={CircleDollarSign} label="رصيد المورد" value={formatBalance(health?.api?.balance)} tone="sky" />
        <Metric icon={Boxes} label="منتجات الكتالوج" value={formatNumber(catalogTotal)} tone="violet" />
        <Metric icon={CheckCircle2} label="مدعوم للاستيراد" value={formatNumber(supportedTotal)} tone="emerald" />
        <Metric icon={Zap} label="تم استيراده" value={formatNumber(importedTotal)} tone="indigo" />
        <Metric icon={Activity} label="طلبات تحت التنفيذ" value={formatNumber(pendingOrders)} tone={pendingOrders ? "amber" : "slate"} />
      </section>

      <section id="fazer-families" className="fazer-special-section fazer-special-catalog">
        <SectionHeading
          eyebrow="تصنيف واضح حسب طريقة التنفيذ"
          title="عائلات منتجات FazerCards"
          description="كل مجموعة لها مدخلات وتسليم ومخاطر تشغيل مختلفة؛ لذلك تم فصلها إلى مساحات سهلة الإدارة."
          icon={Layers3}
        >
          <button type="button" onClick={onSyncAll} disabled={busy} className="fazer-special-section-action">
            <RefreshCw className={actionKey === "fazercards:sync-all" ? "animate-spin" : ""} />
            مزامنة العائلات
          </button>
        </SectionHeading>

        <div className="fazer-special-family-groups">
          {familyGroups.map((group) => (
            <div key={group.key} className="fazer-special-family-group">
              <header>
                <div>
                  <span>{group.eyebrow}</span>
                  <h3>{group.title}</h3>
                </div>
                <p>{group.description}</p>
              </header>
              <div className="fazer-special-family-grid">
                {group.families.map((familyKey) => (
                  <FamilyCard
                    key={familyKey}
                    familyKey={familyKey}
                    family={catalog.families.find((item) => item.familyKey === familyKey)}
                    summary={catalog.summary?.byFamily?.[familyKey]}
                    contract={catalog.contractsSummary?.families?.[familyKey]}
                    busy={busy}
                    onOpen={() => onOpenFamily(familyKey)}
                    onSync={() => onSyncFamily(familyKey)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="fazer-operations" className="fazer-special-section fazer-special-operations">
        <SectionHeading
          eyebrow="تشغيل ومتابعة"
          title="مركز التشغيل"
          description="نشر المنتجات المؤهلة، متابعة الطلبات اليدوية، وفحص آخر إشعارات المورد."
          icon={Rocket}
        />
        <FazerCardsLaunchOpsPanel
          bulkResult={launchOps.bulkResult}
          error={launchOps.error}
          filters={launchOps.manualFilters}
          health={launchOps.health}
          loading={launchOps.loading}
          manualOrders={launchOps.manualOrders}
          webhookDeliveries={launchOps.webhookDeliveries}
          onBulkLaunch={onBulkLaunch}
          onCompleteManual={onCompleteManual}
          onFailManual={onFailManual}
          onLoad={onLoadOperations}
          onManualFilterChange={onManualFilterChange}
          onNoteManual={onNoteManual}
          onPublishEligible={onPublishEligible}
        />
      </section>

      <section id="fazer-safety" className="fazer-special-section fazer-special-safety">
        <SectionHeading
          eyebrow="تشغيل آمن"
          title="الحماية والجاهزية"
          description="حالة مفاتيح الأمان التي تمنع التنفيذ الحقيقي أو التسليم قبل اكتمال الإعدادات."
          icon={ShieldCheck}
        />
        <div className="fazer-special-gates">
          <Gate icon={CloudCog} label="واجهة المورد" enabled={health?.api?.enabled && health?.api?.connectionOk} />
          <Gate icon={Webhook} label="Webhooks" enabled={health?.webhooks?.enabled && health?.webhooks?.secretConfigured} />
          <Gate icon={UserRoundCheck} label="شراء العملاء" enabled={health?.gates?.customerPurchaseEnabled} />
          <Gate icon={Rocket} label="الطلبات الحقيقية" enabled={health?.gates?.realOrdersEnabled} />
          <Gate icon={KeyRound} label="تسليم الأكواد" enabled={health?.gates?.codeDeliveryEnabled} />
        </div>
        {!!health?.warnings?.length && (
          <div className="fazer-special-warnings">
            <AlertTriangle />
            <div>
              <h3>ملاحظات قبل التشغيل الحي</h3>
              {health.warnings.slice(0, 5).map((warning) => <p key={warning}>{warning}</p>)}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function Metric({ icon: Icon, label, value, tone }) {
  return (
    <article className="fazer-special-metric" data-tone={tone}>
      <span><Icon /></span>
      <div>
        <p>{label}</p>
        <strong dir={label === "رصيد المورد" ? "ltr" : undefined}>{value}</strong>
      </div>
    </article>
  );
}

function SectionHeading({ children, description, eyebrow, icon: Icon, title }) {
  return (
    <div className="fazer-special-section-heading">
      <span className="fazer-special-section-icon"><Icon /></span>
      <div>
        <p>{eyebrow}</p>
        <h2>{title}</h2>
        <span>{description}</span>
      </div>
      {children && <div className="fazer-special-section-heading-actions">{children}</div>}
    </div>
  );
}

function FamilyCard({ busy, contract = {}, family = {}, familyKey, onOpen, onSync, summary = {} }) {
  const meta = familyMeta[familyKey];
  const Icon = meta.icon;
  const available = family.catalogAvailable !== false;
  const steamGifts = familyKey === "STEAM_GIFTS";

  return (
    <article className="fazer-special-family-card" data-tone={meta.tone} data-family={familyKey}>
      <div className="fazer-special-family-card-top">
        <span className="fazer-special-family-icon"><Icon /></span>
        <span className={`fazer-special-family-status ${available ? "is-ready" : "is-blocked"}`}>
          <i /> {available ? "الكتالوج متاح" : "غير متاح"}
        </span>
      </div>
      <div className="fazer-special-family-copy">
        <p dir="ltr">{familyKey}</p>
        <h4>{meta.title}</h4>
        <span>{meta.description}</span>
      </div>
      <div className="fazer-special-family-counts">
        <span><small>الإجمالي</small><b>{formatNumber(summary.total)}</b></span>
        <span><small>مدعوم</small><b>{formatNumber(summary.supported)}</b></span>
        <span><small>مستورد</small><b>{formatNumber(summary.imported)}</b></span>
      </div>
      <div className="fazer-special-family-contract">
        <span>{contract.supportStage || family.supportLevel || "CATALOG"}</span>
        <span>{contract.executionStage || family.fulfillmentMode || "—"}</span>
      </div>
      <div className="fazer-special-family-actions">
        <button type="button" onClick={onOpen} disabled={busy}><Search /> {steamGifts ? "بحث واستيراد" : "فتح المنتجات"}</button>
        {!steamGifts && <button type="button" onClick={onSync} disabled={busy || !available}><RefreshCw /> مزامنة</button>}
      </div>
    </article>
  );
}

function Gate({ enabled, icon: Icon, label }) {
  return (
    <article className={enabled ? "is-enabled" : "is-disabled"}>
      <span><Icon /></span>
      <div><strong>{label}</strong><p>{enabled ? "جاهز ومفعل" : "بحاجة إلى إعداد"}</p></div>
      {enabled ? <CheckCircle2 /> : <AlertTriangle />}
    </article>
  );
}

function SpecialProviderSkeleton() {
  return (
    <div className="fazer-special-skeleton" aria-busy="true">
      <div className="fazer-special-skeleton-hero" />
      <div className="fazer-special-skeleton-metrics">{Array.from({ length: 6 }).map((_, index) => <span key={index} />)}</div>
      <div className="fazer-special-skeleton-panel" />
    </div>
  );
}
