import { useEffect, useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, Clock3, Loader2, RefreshCw, WalletCards, XCircle } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { syncPaymentStatus } from "../api/payments";
import { useAuth } from "../context/AuthContext";

const variantMeta = {
  success: {
    icon: Clock3,
    tone: "sky",
  },
  cancel: {
    icon: XCircle,
    tone: "amber",
  },
  pending: {
    icon: Clock3,
    tone: "sky",
  },
};

export default function PaymentReturnPage({ variant = "success" }) {
  const { token } = useAuth();
  const { t } = useTranslation("checkout");
  const [searchParams] = useSearchParams();
  const paymentId = searchParams.get("paymentId") || searchParams.get("payment_id") || "";
  const [syncState, setSyncState] = useState("idle");
  const [syncResult, setSyncResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const copy = variantMeta[variant] || variantMeta.success;
  const Icon = copy.icon;

  const runSync = useMemo(() => async () => {
    if (!token || !paymentId) return;

    setSyncState("loading");
    setErrorMessage("");

    try {
      const result = await syncPaymentStatus(token, paymentId);
      setSyncResult(result);
      setSyncState("synced");
    } catch (requestError) {
      setSyncState("error");
      setErrorMessage(requestError.userMessage || t("refreshError"));
    }
  }, [paymentId, token]);

  useEffect(() => {
    void runSync();
  }, [runSync]);

  const payment = syncResult?.payment;
  const verifiedCredit = payment?.status === "SUCCEEDED" && payment?.creditedAt;
  const statusText = payment
    ? verifiedCredit
      ? t("verified")
      : t("latestStatus", { status: payment.statusLabel })
    : token && paymentId
      ? t("checking")
      : t("openHistory");

  return (
    <div className="page-frame py-8 text-slate-950 dark:text-white sm:py-12">
      <section className="mx-auto max-w-[560px] rounded-[20px] border border-slate-200 bg-white/92 p-5 text-center shadow-soft backdrop-blur-xl dark:border-white/10 dark:bg-[#080d1e]/[0.96] sm:p-7">
        <span className={`mx-auto grid h-14 w-14 place-items-center rounded-2xl ${copy.tone === "amber" ? "bg-amber-500/12 text-amber-600 dark:text-amber-300" : "bg-sky-500/12 text-sky-600 dark:text-sky-300"}`}>
          <Icon className="h-7 w-7" />
        </span>

        <h1 className="mt-4 text-2xl font-black sm:text-3xl">{t(`${variant}.title`)}</h1>
        <p className="mx-auto mt-3 max-w-[440px] text-sm font-semibold leading-6 text-slate-600 dark:text-white/60">
          {t(`${variant}.body`)}
        </p>

        <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black text-slate-700 dark:border-white/10 dark:bg-[#050918] dark:text-white/70">
          {syncState === "loading" ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t("refreshing")}
            </span>
          ) : syncState === "error" ? (
            <span className="text-amber-700 dark:text-amber-300">{errorMessage}</span>
          ) : verifiedCredit ? (
            <span className="inline-flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="h-4 w-4" />
              {statusText}
            </span>
          ) : (
            statusText
          )}
        </div>

        {!token && (
          <p className="mt-3 rounded-2xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-xs font-bold leading-5 text-amber-700 dark:text-amber-300">
            {t("signInToRefresh")}
          </p>
        )}

        <div className="mt-6 grid gap-2 sm:grid-cols-2">
          <Link
            to="/customer/wallet"
            className="interactive-ring inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#8B5CF6] px-4 text-sm font-black text-white shadow-[0_12px_30px_rgba(139,92,246,0.26)]"
          >
            <WalletCards className="h-4 w-4" />
            {t("wallet")}
          </Link>
          <Link
            to="/customer/wallet/transactions"
            className="interactive-ring inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 dark:border-white/10 dark:bg-[#050918] dark:text-white/80"
          >
            <ArrowRight className="h-4 w-4" />
            {t("transactions")}
          </Link>
        </div>

        {token && paymentId && (
          <button
            type="button"
            onClick={() => void runSync()}
            disabled={syncState === "loading"}
            className="interactive-ring mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-sky-500/25 bg-sky-500/10 px-4 text-xs font-black text-sky-700 disabled:cursor-not-allowed disabled:opacity-60 dark:text-sky-300"
          >
            {syncState === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            {t("refresh")}
          </button>
        )}
      </section>
    </div>
  );
}
