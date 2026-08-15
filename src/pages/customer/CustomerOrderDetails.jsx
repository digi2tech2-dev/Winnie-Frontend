import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router-dom";
import { Copy, Eye, PackageCheck } from "lucide-react";
import { getCustomerOrder, revealCustomerOrderDeliveredCodes } from "../../api/orders";
import EmptyState from "../../components/EmptyState";
import { useAuth } from "../../context/AuthContext";

const timelineSteps = [
  ["PENDING", "created", "createdText"],
  ["PROCESSING", "processing", "processingText"],
  ["COMPLETED", "completed", "completedText"],
];

function getStepState(orderStatus, stepStatus) {
  const orderIndex = timelineSteps.findIndex(([status]) => status === orderStatus);
  const stepIndex = timelineSteps.findIndex(([status]) => status === stepStatus);

  if (orderStatus === "FAILED" || orderStatus === "CANCELED" || orderStatus === "CANCELLED") {
    return stepIndex === 0 ? "done" : "pending";
  }

  if (orderIndex < 0) return stepIndex === 0 ? "active" : "pending";
  if (stepIndex < orderIndex) return "done";
  if (stepIndex === orderIndex) return "active";
  return "pending";
}

export default function CustomerOrderDetails({ basePath = "/customer" }) {
  const { id } = useParams();
  const { token } = useAuth();
  const { t, i18n } = useTranslation("orders");
  const isArabic = i18n.language?.startsWith("ar");
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revealState, setRevealState] = useState({
    busy: false,
    error: "",
    result: null,
    copied: "",
  });

  useEffect(() => {
    if (!token || !id) return undefined;

    let cancelled = false;

    const loadOrder = async () => {
      setLoading(true);
      setError("");

      try {
        const result = await getCustomerOrder(token, id);
        if (!cancelled) setOrder(result);
      } catch (requestError) {
        if (!cancelled) {
          setError(requestError.userMessage || t("details.loadError"));
          setOrder(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadOrder();

    return () => {
      cancelled = true;
    };
  }, [id, t, token]);

  if (loading) {
    return (
      <div className="glass-panel rounded-lg p-8 text-center text-sm font-black text-slate-500 dark:text-slate-400">
        {t("details.loading")}
      </div>
    );
  }

  if (error || !order) {
    return (
      <EmptyState
        title={t("details.notFoundTitle")}
        description={error || t("details.notFoundDescription")}
        actionLabel={t("details.backToOrders")}
        onAction={() => window.history.back()}
      />
    );
  }

  const customerValues = order.customerInput?.values || {};
  const canRevealCodes = order.status === "COMPLETED" && order.hasDeliveredCodes === true;
  const customerStatusMessage = getCustomerStatusMessage(order, isArabic);
  const fulfillmentNotice = order.fulfillmentNotice
    ? getManualFulfillmentMessage(isArabic)
    : "";
  const revealLabels = getCodeRevealLabels(isArabic);

  const revealCodes = async () => {
    if (!token || !id || revealState.busy) return;
    setRevealState((current) => ({ ...current, busy: true, error: "", copied: "" }));
    try {
      const result = await revealCustomerOrderDeliveredCodes(token, id);
      setRevealState({ busy: false, error: "", result, copied: "" });
    } catch (requestError) {
      setRevealState((current) => ({
        ...current,
        busy: false,
        error: requestError.userMessage || requestError.message || "Could not reveal delivered codes.",
      }));
    }
  };

  const copyValue = async (label, value) => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setRevealState((current) => ({ ...current, copied: label }));
    } catch {
      setRevealState((current) => ({ ...current, copied: "" }));
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
      <section className="glass-panel rounded-lg p-6">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-royal dark:text-pulse">{t("details.eyebrow")}</p>
        <h1 className="mt-2 text-3xl font-black">{order.displayId}</h1>
        <p className="mt-2 text-sm text-slate-400 dark:text-[#8A94A7]">{order.productName} - {order.dateTimeLabel}</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <Info
            label={t("details.status")}
            value={t(`statuses.${order.status}`, { defaultValue: order.statusLabel })}
          />
          <Info label={t("details.price")} value={order.price} />
          <Info label={t("details.quantity")} value={String(order.quantity)} />
        </div>
        <div className="mt-8 h-3 overflow-hidden rounded-full bg-slate-200 dark:bg-[#0D1324]">
          <div className="h-full rounded-full bg-gradient-to-r from-royal to-aqua" style={{ width: `${order.progress}%` }} />
        </div>
        {order.rejectionReason && (
          <p className="mt-5 rounded-2xl border border-rose-400/25 bg-rose-400/12 px-4 py-3 text-sm font-bold text-rose-700 dark:text-rose-300">
            {order.rejectionReason}
          </p>
        )}
        {customerStatusMessage && (
          <p className="mt-5 rounded-2xl border border-sky-400/25 bg-sky-400/12 px-4 py-3 text-sm font-bold text-sky-700 dark:text-sky-200">
            {customerStatusMessage}
          </p>
        )}
        {Object.keys(customerValues).length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-black">{t("details.submittedDetails")}</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {Object.entries(customerValues).map(([key, value]) => (
                <Info key={key} label={key} value={String(value)} />
              ))}
            </div>
          </div>
        )}
        {fulfillmentNotice && (
          <p className="mt-5 rounded-2xl border border-amber-400/25 bg-amber-400/12 px-4 py-3 text-sm font-bold text-amber-700 dark:text-amber-200">
            {fulfillmentNotice}
          </p>
        )}
        {canRevealCodes && (
          <div className="mt-8 rounded-lg border border-emerald-300 bg-emerald-50 p-4 dark:border-emerald-400/20 dark:bg-emerald-500/10">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-black">{revealLabels.title}</h2>
                <p className="mt-1 text-sm font-bold text-emerald-700 dark:text-emerald-200">{revealLabels.ready}</p>
              </div>
              <button
                type="button"
                onClick={revealCodes}
                disabled={revealState.busy}
                className="interactive-ring inline-flex h-10 items-center gap-2 rounded-lg bg-emerald-600 px-4 text-xs font-black text-white disabled:opacity-60"
              >
                <Eye className="h-4 w-4" />
                {revealState.busy ? revealLabels.revealing : revealLabels.reveal}
              </button>
            </div>
            {revealState.error && (
              <p className="mt-3 rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-sm font-bold text-rose-700 dark:border-rose-400/20 dark:bg-rose-500/10 dark:text-rose-200">{revealState.error}</p>
            )}
            {revealState.result?.items?.length > 0 && (
              <div className="mt-4 grid gap-3">
                {revealState.result.items.map((item, index) => (
                  <div key={item.id || index} className="rounded-lg border border-emerald-200 bg-white/80 p-3 dark:border-emerald-400/20 dark:bg-[#111827]">
                    {item.code && <SecretLine label={revealLabels.code} value={item.code} copied={revealState.copied} onCopy={copyValue} copyLabel={revealLabels.copy} copiedLabel={revealLabels.copied} />}
                    {item.pin && <SecretLine label={revealLabels.pin} value={item.pin} copied={revealState.copied} onCopy={copyValue} copyLabel={revealLabels.copy} copiedLabel={revealLabels.copied} />}
                    {item.serial && <SecretLine label={revealLabels.serial} value={item.serial} copied={revealState.copied} onCopy={copyValue} copyLabel={revealLabels.copy} copiedLabel={revealLabels.copied} />}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        <Link to={`${basePath}/orders`} className="interactive-ring mt-6 inline-flex h-11 items-center gap-2 rounded-lg bg-gradient-to-r from-royal to-pulse px-5 text-sm font-black text-white shadow-glow">
          <PackageCheck className="h-5 w-5" />
          {t("details.backToOrders")}
        </Link>
      </section>
      <aside className="glass-panel rounded-lg p-6">
        <h2 className="text-xl font-black">{t("details.timeline")}</h2>
        <div className="mt-5 space-y-4">
          {timelineSteps.map(([status, titleKey, textKey]) => {
            const state = getStepState(order.status, status);
            return (
              <div key={status} className="flex gap-3">
                <span className={`mt-1 h-3 w-3 shrink-0 rounded-full ${state === "done" ? "bg-emerald-400" : state === "active" ? "bg-pulse" : "bg-slate-300 dark:bg-[#7C8598]"}`} />
                <span>
                  <span className="block font-black">{t(`details.steps.${titleKey}`)}</span>
                  <span className="text-sm text-slate-400 dark:text-[#8A94A7]">{t(`details.steps.${textKey}`)}</span>
                </span>
              </div>
            );
          })}
        </div>
      </aside>
    </div>
  );
}

function SecretLine({ copied, copiedLabel, copyLabel, label, onCopy, value }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 py-1">
      <span>
        <span className="block text-xs font-black uppercase tracking-[0.16em] text-slate-400">{label}</span>
        <span className="break-all font-mono text-sm font-black" dir="ltr">{value}</span>
      </span>
      <button
        type="button"
        onClick={() => onCopy(label, value)}
        className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 px-3 text-xs font-black text-slate-600 dark:border-white/10 dark:text-slate-200"
      >
        <Copy className="h-3.5 w-3.5" />
        {copied === label ? copiedLabel : copyLabel}
      </button>
    </div>
  );
}

function getManualFulfillmentMessage(isArabic) {
  return isArabic ? "طلبك قيد المراجعة والتنفيذ اليدوي" : "Your order is being processed manually.";
}

function getCustomerStatusMessage(order = {}, isArabic) {
  const status = String(order.status || "").toUpperCase();
  const refunded = order.refunded === true;
  const hasCodes = order.hasDeliveredCodes === true;

  if (isArabic) {
    if (status === "COMPLETED" && hasCodes) return "الكود الرقمي جاهز للعرض";
    if (status === "MANUAL_REVIEW") return "طلبك قيد المراجعة والتنفيذ اليدوي";
    if (status === "PROCESSING" || status === "PENDING") return "طلبك قيد التنفيذ";
    if (status === "COMPLETED") return "تم إكمال الطلب";
    if ((status === "FAILED" || status === "CANCELED" || status === "CANCELLED") && refunded) return "تم رد الرصيد";
    if (status === "FAILED" || status === "CANCELED" || status === "CANCELLED") return "فشل الطلب";
    return order.customerStatusMessage || "";
  }

  if (status === "COMPLETED" && hasCodes) return "Your digital code is ready to reveal";
  if (status === "MANUAL_REVIEW") return "Your order is under manual review and fulfillment.";
  if (status === "PROCESSING" || status === "PENDING") return "Your order is being processed.";
  if (status === "COMPLETED") return "Your order is complete.";
  if ((status === "FAILED" || status === "CANCELED" || status === "CANCELLED") && refunded) return "Your balance has been refunded.";
  if (status === "FAILED" || status === "CANCELED" || status === "CANCELLED") return "Your order failed.";
  return order.customerStatusMessage || "";
}

function getCodeRevealLabels(isArabic) {
  if (isArabic) {
    return {
      copied: "تم النسخ",
      copy: "نسخ",
      code: "الكود",
      pin: "الرقم السري",
      ready: "الكود الرقمي جاهز للعرض",
      reveal: "عرض الكود",
      revealing: "جار عرض الكود...",
      serial: "السيريال",
      title: "الكود المُسلّم",
    };
  }

  return {
    copied: "Copied",
    copy: "Copy",
    code: "CODE",
    pin: "PIN",
    ready: "Your digital code is ready to reveal",
    reveal: "Reveal code",
    revealing: "Revealing...",
    serial: "SERIAL",
    title: "Delivered code",
  };
}

function Info({ label, value }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white/65 p-4 dark:border-[rgba(255,255,255,0.08)] dark:bg-[#111827] dark:shadow-[0_0_20px_rgba(139,92,246,0.20)]">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400 dark:text-[#8A94A7]">{label}</p>
      <p className="mt-2 break-words font-black">{value}</p>
    </div>
  );
}
