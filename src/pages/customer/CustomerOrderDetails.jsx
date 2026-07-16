import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router-dom";
import { PackageCheck } from "lucide-react";
import { getCustomerOrder } from "../../api/orders";
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
  const { t } = useTranslation("orders");
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

function Info({ label, value }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white/65 p-4 dark:border-[rgba(255,255,255,0.08)] dark:bg-[#111827] dark:shadow-[0_0_20px_rgba(139,92,246,0.20)]">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400 dark:text-[#8A94A7]">{label}</p>
      <p className="mt-2 break-words font-black">{value}</p>
    </div>
  );
}
