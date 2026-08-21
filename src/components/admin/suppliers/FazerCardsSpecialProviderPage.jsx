import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowUpLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleDot,
  FolderOpen,
  Layers3,
  Link2,
  Loader2,
  PackageCheck,
  Plus,
  RefreshCw,
  Rocket,
  Search,
  Server,
  Trash2,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  getFazerCardsProviderProducts,
  launchFazerCardsProduct,
} from "../../../api/adminProviders";
import {
  groupFazerCardsCatalogs,
  readRetrievedFazerCardsCatalogs,
  removeRetrievedFazerCardsCatalog,
  saveRetrievedFazerCardsCatalog,
} from "../../../utils/fazerCardsCatalogs";
import FazerCardsImportModal from "./FazerCardsImportModal";
import "../../../styles/fazercards-special-provider.css";

const SEARCH_DELAY = 350;
const CATALOG_SEARCH_LIMIT = 100;
const OFFERS_PAGE_SIZE = 50;
const AUTO_PROVIDER_FAMILIES = new Set(["TOPUPS", "GIFTCARDS", "GAME_KEYS", "TELEGRAM", "STEAM_TOPUP", "STEAM_GIFTS", "MANUAL_SERVICES"]);
const EMPTY_IMPORT_STATE = {
  action: "",
  error: "",
  launchMessage: "",
  launchTone: "",
  loading: false,
  manualFieldWarning: "",
  product: null,
  warning: "",
};

export default function FazerCardsSpecialProviderPage({
  health,
  loadError,
  loading,
  onRefresh,
  refreshing = false,
  supplier,
  token,
}) {
  const [query, setQuery] = useState("");
  const [searchState, setSearchState] = useState({ error: "", loading: false, results: [], searched: false });
  const [retrievedCatalogs, setRetrievedCatalogs] = useState(() => readRetrievedFazerCardsCatalogs());
  const [retrievingKey, setRetrievingKey] = useState("");
  const [activeCatalog, setActiveCatalog] = useState(null);
  const requestRef = useRef(0);

  const retrievedKeys = useMemo(() => new Set(retrievedCatalogs.map((catalog) => catalog.key)), [retrievedCatalogs]);
  const connected = health?.api?.connectionOk === true || (!health && supplier?.active === true);

  useEffect(() => {
    const searchQuery = query.trim();
    const requestId = requestRef.current + 1;
    requestRef.current = requestId;

    if (searchQuery.length < 2) {
      setSearchState({ error: "", loading: false, results: [], searched: false });
      return undefined;
    }

    setSearchState((current) => ({ ...current, error: "", loading: true, searched: true }));
    const timer = window.setTimeout(async () => {
      try {
        const result = await getFazerCardsProviderProducts(token, {
          limit: CATALOG_SEARCH_LIMIT,
          page: 1,
          search: searchQuery,
        });
        if (requestRef.current !== requestId) return;
        setSearchState({ error: "", loading: false, results: groupFazerCardsCatalogs(result.products), searched: true });
      } catch (error) {
        if (requestRef.current !== requestId) return;
        setSearchState({
          error: error.userMessage || "تعذر البحث في كتالوج FazerCards.",
          loading: false,
          results: [],
          searched: true,
        });
      }
    }, SEARCH_DELAY);

    return () => window.clearTimeout(timer);
  }, [query, token]);

  const retrieveCatalog = async (catalog) => {
    if (!token || retrievingKey) return;
    setRetrievingKey(catalog.key);
    try {
      const result = await getFazerCardsProviderProducts(token, {
        category: catalog.category,
        familyKey: catalog.familyKey,
        limit: 1,
        page: 1,
      });
      setRetrievedCatalogs(saveRetrievedFazerCardsCatalog({
        ...catalog,
        offerCount: result.pagination?.total || catalog.offerCount,
      }));
    } catch (error) {
      setSearchState((current) => ({ ...current, error: error.userMessage || "تعذر استرداد الكتالوج." }));
    } finally {
      setRetrievingKey("");
    }
  };

  const removeCatalog = (catalog) => {
    setRetrievedCatalogs(removeRetrievedFazerCardsCatalog(catalog.key));
    if (activeCatalog?.key === catalog.key) setActiveCatalog(null);
  };

  if (loading) return <ProviderPageSkeleton />;

  if (loadError || !supplier) {
    return (
      <section className="fc-state fc-state--error">
        <AlertCircle />
        <h1>تعذر فتح FazerCards</h1>
        <p>{loadError || "لم يتم العثور على المورد ضمن الموردين المسجلين."}</p>
        <Link to="/admin/tools/suppliers"><ArrowLeft /> العودة إلى الموردين</Link>
      </section>
    );
  }

  return (
    <main dir="rtl" className="fc-page">
      <header className="fc-header">
        <div className="fc-header__main">
          <Link className="fc-icon-button" to="/admin/tools/suppliers" aria-label="العودة إلى الموردين"><ArrowLeft /></Link>
          <span className="fc-brand" aria-hidden="true">F</span>
          <div className="fc-header__copy">
            <div className="fc-title-line">
              <h1>FazerCards</h1>
              <span className={`fc-connection ${connected ? "is-online" : "is-offline"}`}>
                <i /> {connected ? "متصل" : health ? "غير متصل" : "نشط"}
              </span>
            </div>
            <p>اختر الكتالوج، ثم أضف Offer واحدًا كمنتج متجر مع مزامنة الاسم والسعر والحدود.</p>
          </div>
        </div>
        <button type="button" className="fc-refresh" onClick={onRefresh} disabled={refreshing}>
          <RefreshCw className={refreshing ? "animate-spin" : ""} /> تحديث
        </button>
      </header>

      <ol className="fc-flow" aria-label="خطوات ربط عرض FazerCards">
        <FlowStep icon={Search} label="بحث" active />
        <FlowStep icon={PackageCheck} label="استرداد Catalog" />
        <FlowStep icon={FolderOpen} label="اختيار Offer" />
        <FlowStep icon={Link2} label="إضافة ومزامنة" />
      </ol>

      <section className="fc-search-panel">
        <div className="fc-section-heading">
          <div><span>كتالوج المورد</span><h2>ابحث عن لعبة أو Catalog</h2></div>
          <small>لن يتم تحميل كل منتجات المورد</small>
        </div>

        <label className="fc-search-box">
          {searchState.loading ? <Loader2 className="animate-spin" /> : <Search />}
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="مثال: PUBG Mobile" autoComplete="off" />
          {query && <button type="button" onClick={() => setQuery("")} aria-label="مسح البحث"><X /></button>}
        </label>

        <div className="fc-search-results" aria-live="polite">
          {searchState.error ? (
            <InlineState icon={AlertCircle} tone="error" title="تعذر إكمال البحث" description={searchState.error} />
          ) : searchState.loading ? (
            <CatalogRowsSkeleton />
          ) : searchState.searched && !searchState.results.length ? (
            <InlineState icon={Search} title="لا توجد Catalogs مطابقة" description="جرّب اسم اللعبة أو المنصة بصيغة أخرى." />
          ) : searchState.results.length ? (
            searchState.results.map((catalog) => {
              const retrieved = retrievedKeys.has(catalog.key);
              return (
                <CatalogRow key={catalog.key} catalog={catalog} retrieved={retrieved}>
                  {retrieved ? (
                    <button type="button" className="fc-button fc-button--soft" onClick={() => setActiveCatalog(retrievedCatalogs.find((item) => item.key === catalog.key) || catalog)}>
                      <FolderOpen /> فتح الكتالوج
                    </button>
                  ) : (
                    <button type="button" className="fc-button fc-button--primary" onClick={() => retrieveCatalog(catalog)} disabled={Boolean(retrievingKey)}>
                      {retrievingKey === catalog.key ? <Loader2 className="animate-spin" /> : <PackageCheck />} استرداد
                    </button>
                  )}
                </CatalogRow>
              );
            })
          ) : (
            <div className="fc-search-hint"><Search /><span>اكتب حرفين على الأقل لبدء البحث في Catalogs.</span></div>
          )}
        </div>
      </section>

      <section className="fc-retrieved">
        <div className="fc-section-heading">
          <div><span>مساحة العمل</span><h2>Catalogs المستردة</h2></div>
          <small>{retrievedCatalogs.length.toLocaleString("ar-EG-u-nu-latn")} Catalog</small>
        </div>

        <div className="fc-retrieved-list">
          {retrievedCatalogs.length ? retrievedCatalogs.map((catalog) => (
            <CatalogRow key={catalog.key} catalog={catalog} retrieved>
              <button type="button" className="fc-button fc-button--soft" onClick={() => setActiveCatalog(catalog)}><FolderOpen /> فتح الكتالوج</button>
              <button type="button" className="fc-remove" onClick={() => removeCatalog(catalog)} aria-label={`إزالة استرداد ${catalog.name}`}><Trash2 /> إزالة الاسترداد</button>
            </CatalogRow>
          )) : (
            <InlineState icon={Layers3} title="لا توجد Catalogs مستردة" description="استخدم البحث أعلاه ثم استرد الكتالوج الذي تريد العمل عليه فقط." />
          )}
        </div>
      </section>

      {activeCatalog && <CatalogOffers catalog={activeCatalog} token={token} onClose={() => setActiveCatalog(null)} />}
    </main>
  );
}

function CatalogOffers({ catalog, onClose, token }) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [selectedOfferId, setSelectedOfferId] = useState("");
  const [state, setState] = useState({ error: "", loading: true, offers: [], pagination: null });
  const [importState, setImportState] = useState(EMPTY_IMPORT_STATE);
  const [importOffer, setImportOffer] = useState(null);
  const requestRef = useRef(0);

  useEffect(() => {
    const requestId = requestRef.current + 1;
    requestRef.current = requestId;
    const timer = window.setTimeout(async () => {
      setState((current) => ({ ...current, error: "", loading: true }));
      try {
        const result = await getFazerCardsProviderProducts(token, {
          category: catalog.category,
          familyKey: catalog.familyKey,
          limit: OFFERS_PAGE_SIZE,
          page,
          search: query.trim() || undefined,
        });
        if (requestRef.current !== requestId) return;
        setState({ error: "", loading: false, offers: result.products, pagination: result.pagination });
      } catch (error) {
        if (requestRef.current !== requestId) return;
        setState({ error: error.userMessage || "تعذر تحميل عروض الكتالوج.", loading: false, offers: [], pagination: null });
      }
    }, query ? SEARCH_DELAY : 0);
    return () => window.clearTimeout(timer);
  }, [catalog, page, query, token]);

  const selectedOffer = state.offers.find((offer) => offer.id === selectedOfferId);
  const selectedFamilyKey = String(selectedOffer?.familyKey || catalog.familyKey || "").toUpperCase();
  const autoProviderCapable = AUTO_PROVIDER_FAMILIES.has(selectedFamilyKey);
  const launchDisabled = !importState.product?.id || Boolean(importState.action) || importState.loading;

  const selectOffer = (offerId) => {
    const offer = state.offers.find((item) => item.id === offerId);
    setSelectedOfferId(offerId);
    setImportState(offer?.importedProduct ? {
      ...EMPTY_IMPORT_STATE,
      manualFieldWarning: offer.importedProduct.manualFieldWarning || "",
      product: offer.importedProduct,
    } : EMPTY_IMPORT_STATE);
  };

  const handleOfferImported = async (result) => {
    if (!result.product?.id || !selectedOffer) return;
    const importedOfferId = selectedOffer.id;
    setImportState({ ...EMPTY_IMPORT_STATE, product: result.product });
    setState((current) => ({
      ...current,
      offers: current.offers.map((offer) => offer.id === importedOfferId
        ? { ...offer, imported: true, importedProduct: result.product }
        : offer),
    }));

    try {
      const refreshed = await getFazerCardsProviderProducts(token, {
        category: catalog.category,
        familyKey: catalog.familyKey,
        limit: OFFERS_PAGE_SIZE,
        page,
        search: query.trim() || undefined,
      });
      const refreshedOffer = refreshed.products.find((offer) => offer.id === importedOfferId);
      if (!refreshedOffer) return;
      setState({ error: "", loading: false, offers: refreshed.products, pagination: refreshed.pagination });
      setImportState((current) => ({
        ...current,
        manualFieldWarning: refreshedOffer.importedProduct?.manualFieldWarning || "",
        product: refreshedOffer.importedProduct || current.product,
      }));
    } catch {
      // The import already succeeded. Keep the confirmed result shown by the legacy flow.
    }
  };

  const launchImportedProduct = async (providerExecutionMode) => {
    const productId = importState.product?.id;
    const isAuto = providerExecutionMode === "AUTO_PROVIDER";
    const familyKey = String(selectedOffer?.familyKey || catalog.familyKey || "").toUpperCase();
    if (!productId || importState.action) return;

    if (isAuto && !AUTO_PROVIDER_FAMILIES.has(familyKey)) {
      setImportState((current) => ({
        ...current,
        launchMessage: "هذه العائلة لا تدعم التنفيذ التلقائي حاليًا.",
        launchTone: "warning",
      }));
      return;
    }

    const confirmation = isAuto
      ? "نشر المنتج وتفعيل التنفيذ التلقائي من FazerCards؟ سيظل التنفيذ الحقيقي مرتبطًا بمفاتيح أمان المورد."
      : "نشر المنتج للعملاء مع تنفيذ الطلب يدويًا؟";
    if (!window.confirm(confirmation)) return;

    setImportState((current) => ({ ...current, action: isAuto ? "auto" : "manual", error: "", launchMessage: "", launchTone: "" }));
    try {
      const result = await launchFazerCardsProduct(token, productId, {
        customerPurchaseEnabled: true,
        isActive: true,
        providerExecutionEnabled: isAuto,
        providerExecutionMode,
        status: "available",
        visibleInStore: true,
      });
      const launchStatus = result.result?.launchStatus
        || result.result?.result?.customerVisibilityStatus
        || result.result?.customerVisibilityStatus
        || {};
      const visibleToCustomer = launchStatus.visibleToCustomer === true;
      const reasons = Array.isArray(launchStatus.reasons) ? launchStatus.reasons : [];

      setImportState((current) => ({
        ...current,
        action: "",
        launchMessage: visibleToCustomer
          ? isAuto ? "تم نشر المنتج وتفعيل التنفيذ التلقائي بنجاح." : "تم نشر المنتج للعملاء بنجاح."
          : `تم حفظ إعدادات التشغيل، لكن المنتج غير ظاهر للعملاء: ${reasons.join("، ") || "راجع جاهزية المنتج."}`,
        launchTone: visibleToCustomer ? "success" : "warning",
        product: {
          ...current.product,
          isActive: true,
          providerExecutionEnabled: isAuto,
          providerExecutionMode,
          status: "available",
          visibleInStore: visibleToCustomer,
        },
      }));
    } catch (error) {
      setImportState((current) => ({
        ...current,
        action: "",
        launchMessage: error.userMessage || (isAuto ? "تعذر تفعيل التنفيذ التلقائي." : "تعذر نشر المنتج."),
        launchTone: "error",
      }));
    }
  };

  return (
    <section className="fc-offers" aria-labelledby="fc-offers-title">
      <header className="fc-offers__header">
        <div><span>{catalog.familyKey || "FAZERCARDS"}</span><h2 id="fc-offers-title">{catalog.name}</h2><p>{state.pagination?.total ?? catalog.offerCount} Offers</p></div>
        <button type="button" className="fc-icon-button" onClick={onClose} aria-label="إغلاق الكتالوج"><X /></button>
      </header>

      <label className="fc-search-box fc-search-box--compact">
        {state.loading ? <Loader2 className="animate-spin" /> : <Search />}
        <input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="بحث داخل العروض" />
      </label>

      <div className="fc-offers-layout">
        <div className="fc-offer-list">
          {state.error ? (
            <InlineState icon={AlertCircle} tone="error" title="تعذر تحميل Offers" description={state.error} />
          ) : state.loading ? (
            <CatalogRowsSkeleton rows={4} />
          ) : state.offers.length ? state.offers.map((offer) => {
            const selected = selectedOfferId === offer.id;
            return (
              <button type="button" key={offer.id} className={`fc-offer ${selected ? "is-selected" : ""}`} onClick={() => selectOffer(offer.id)}>
                <span className="fc-radio">{selected ? <Check /> : <CircleDot />}</span>
                <span className="fc-offer__copy">
                  <strong>{offer.offerName || offer.name}</strong>
                  <small>{[offer.region, offer.platform].filter(Boolean).join(" · ") || offer.externalProductId}</small>
                </span>
                <span className="fc-offer__aside">
                  <b className="fc-offer__price">{offer.priceLabel}</b>
                  {offer.imported && <small><Check /> مضاف</small>}
                </span>
              </button>
            );
          }) : (
            <InlineState icon={Search} title="لا توجد عروض مطابقة" description="جرّب عبارة بحث أقصر داخل هذا الكتالوج." />
          )}
        </div>

        <aside className="fc-import-panel">
          {selectedOffer ? (
            <>
              <span className="fc-import-panel__eyebrow">العرض المختار</span>
              <h3>{selectedOffer.offerName || selectedOffer.name}</h3>
              <p dir="ltr">{selectedOffer.externalProductId || selectedOffer.offerId}</p>

              <div className="fc-import-summary">
                <SummaryDatum label="سعر المورد" value={selectedOffer.priceLabel || "—"} />
                <SummaryDatum label="الحد الأدنى" value={selectedOffer.minQty ?? "—"} />
                <SummaryDatum label="الحد الأقصى" value={selectedOffer.maxQty ?? "—"} />
              </div>

              <div className="fc-sync-options">
                <span><Check /> مزامنة الاسم</span>
                <span><Check /> مزامنة السعر</span>
                <span><Check /> مزامنة الحدود</span>
              </div>

              {importState.error && <div className="fc-import-message is-error"><AlertCircle /> {importState.error}</div>}
              {importState.product && (
                <div className={`fc-import-message ${importState.warning ? "is-warning" : "is-success"}`}>
                  {importState.warning ? <AlertCircle /> : <Check />}
                  <div>
                    <strong>{importState.warning ? "تمت الإضافة مع ملاحظة" : "تمت إضافة المنتج ومزامنته"}</strong>
                    <p>{importState.warning || importState.product.name}</p>
                  </div>
                </div>
              )}

              <button type="button" className="fc-import-action" onClick={() => setImportOffer(selectedOffer)}>
                {selectedOffer.imported || importState.product ? <RefreshCw /> : <Plus />}
                {selectedOffer.imported || importState.product ? "تحديث بيانات الاستيراد" : "إضافة المنتج ومزامنته"}
              </button>

              <div className="fc-launch-block">
                <div className="fc-launch-block__heading">
                  <div><span>بعد الإضافة</span><strong>تشغيل ونشر المنتج</strong></div>
                  <small>{importState.product?.id ? "تم الاستيراد" : "أضف المنتج أولًا"}</small>
                </div>
                <div className="fc-launch-actions">
                  <button
                    type="button"
                    className="fc-launch-action is-manual"
                    onClick={() => launchImportedProduct("MANUAL_FULFILLMENT")}
                    disabled={launchDisabled || Boolean(importState.manualFieldWarning)}
                  >
                    {importState.action === "manual" ? <Loader2 className="animate-spin" /> : <Rocket />}
                    <span><strong>نشر المنتج</strong><small>إظهار للعملاء · تنفيذ يدوي</small></span>
                  </button>
                  <button
                    type="button"
                    className="fc-launch-action is-auto"
                    onClick={() => launchImportedProduct("AUTO_PROVIDER")}
                    disabled={launchDisabled || !autoProviderCapable}
                  >
                    {importState.action === "auto" ? <Loader2 className="animate-spin" /> : <Server />}
                    <span><strong>تفعيل التنفيذ التلقائي</strong><small>نشر وتشغيل عبر FazerCards</small></span>
                  </button>
                </div>
                {!autoProviderCapable && <small className="fc-launch-hint">التنفيذ التلقائي غير مدعوم لهذه العائلة.</small>}
                {importState.manualFieldWarning && <small className="fc-launch-hint is-warning">{importState.manualFieldWarning}</small>}
              </div>

              {importState.launchMessage && (
                <div className={`fc-import-message is-${importState.launchTone || "warning"}`}>
                  {importState.launchTone === "success" ? <Check /> : <AlertCircle />}
                  <div><strong>{importState.launchTone === "success" ? "اكتمل التشغيل" : "حالة التشغيل"}</strong><p>{importState.launchMessage}</p></div>
                </div>
              )}

              {importState.product && (
                <Link className="fc-manage-product" to="/admin/tools/products">إدارة المنتجات <ArrowUpLeft /></Link>
              )}
              <small className="fc-import-note">لن تتم إضافة أي Offer آخر من هذا Catalog.</small>
            </>
          ) : (
            <div className="fc-import-empty"><CircleDot /><strong>اختر Offer واحدًا</strong><p>ستظهر هنا بيانات السعر والحدود وخيارات المزامنة قبل الإضافة.</p></div>
          )}
        </aside>
      </div>

      {state.pagination?.pages > 1 && (
        <div className="fc-pagination">
          <button type="button" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page <= 1 || state.loading}><ChevronRight /></button>
          <span>{page} / {state.pagination.pages}</span>
          <button type="button" onClick={() => setPage((value) => Math.min(state.pagination.pages, value + 1))} disabled={page >= state.pagination.pages || state.loading}><ChevronLeft /></button>
        </div>
      )}

      <FazerCardsImportModal
        onClose={() => setImportOffer(null)}
        onImported={handleOfferImported}
        product={importOffer}
        token={token}
      />

    </section>
  );
}

function SummaryDatum({ label, value }) {
  return <div><span>{label}</span><strong>{value}</strong></div>;
}

function CatalogRow({ catalog, children, retrieved = false }) {
  return (
    <article className="fc-catalog-row">
      <span className="fc-catalog-icon">{retrieved ? <PackageCheck /> : <Server />}</span>
      <div className="fc-catalog-copy">
        <strong>{catalog.name}</strong>
        <span>{retrieved && <b><Check /> مسترد</b>}{catalog.offerCount.toLocaleString("ar-EG-u-nu-latn")} Offers{catalog.familyKey && <em>{catalog.familyKey}</em>}</span>
      </div>
      <div className="fc-catalog-actions">{children}</div>
    </article>
  );
}

function FlowStep({ active = false, icon: Icon, label }) {
  return <li className={active ? "is-active" : ""}><span><Icon /></span><b>{label}</b></li>;
}

function InlineState({ description, icon: Icon, title, tone = "neutral" }) {
  return <div className="fc-inline-state" data-tone={tone}><Icon /><div><strong>{title}</strong><p>{description}</p></div></div>;
}

function CatalogRowsSkeleton({ rows = 3 }) {
  return <div className="fc-rows-skeleton" aria-busy="true">{Array.from({ length: rows }).map((_, index) => <span key={index} />)}</div>;
}

function ProviderPageSkeleton() {
  return <div className="fc-page-skeleton" aria-busy="true"><span /><span /><span /></div>;
}
