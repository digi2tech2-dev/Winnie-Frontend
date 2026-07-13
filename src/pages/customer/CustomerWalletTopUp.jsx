import { useEffect, useState } from "react";
import { ArrowRight, CheckCircle2, Copy, CreditCard, ExternalLink, Hash, Loader2, ReceiptText, Upload } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link, useLocation, useParams } from "react-router-dom";
import { createDepositRequest } from "../../api/deposits";
import { getCustomerPaymentMethod } from "../../api/paymentMethods";
import { createPaymentIntent, isAntiScamConfirmationRequiredError, isPaymentCurrencyConversionError, isPaymentRiskLimitError } from "../../api/payments";
import { getWalletSummary, getWalletTransactions } from "../../api/wallet";
import AntiScamSafetyConfirmationModal from "../../components/AntiScamSafetyConfirmationModal";
import { useToast } from "../../components/ToastProvider";
import { useAuth } from "../../context/AuthContext";

const methodAccent = {
  visa: "from-blue-500 to-indigo-700",
  mastercard: "from-rose-500 to-amber-500",
  apple: "from-slate-950 to-slate-600",
  generic: "from-violet-500 to-sky-500",
};

function makeIdempotencyKey(prefix) {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export default function CustomerWalletTopUp({ basePath = "/customer" }) {
  const { methodId } = useParams();
  const location = useLocation();
  const { refreshCurrentUser, token, user } = useAuth();
  const { showToast } = useToast();
  const { t } = useTranslation("wallet");
  const [antiScamConfirmed, setAntiScamConfirmed] = useState(location.state?.antiScamConfirmed === true);
  const [antiScamConfirmedAt, setAntiScamConfirmedAt] = useState(location.state?.antiScamConfirmedAt || null);
  const [antiScamModalOpen, setAntiScamModalOpen] = useState(location.state?.antiScamConfirmed !== true);
  const [method, setMethod] = useState(null);
  const [methodLoading, setMethodLoading] = useState(true);
  const [methodError, setMethodError] = useState("");
  const [amount, setAmount] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [paymentIntent, setPaymentIntent] = useState(null);
  const [pendingMessage, setPendingMessage] = useState("");
  const [riskBlockedMessage, setRiskBlockedMessage] = useState("");
  const [receiptFile, setReceiptFile] = useState(null);
  const [receiptInputKey, setReceiptInputKey] = useState(0);
  const [redirecting, setRedirecting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadMethod = async () => {
      setMethodLoading(true);
      setMethodError("");

      try {
        const result = await getCustomerPaymentMethod(methodId);
        if (!cancelled) setMethod(result.method);
      } catch (requestError) {
        if (!cancelled) {
          setMethod(null);
          setMethodError(requestError.userMessage || t("topUp.methodLoadError"));
        }
      } finally {
        if (!cancelled) setMethodLoading(false);
      }
    };

    void loadMethod();

    return () => {
      cancelled = true;
    };
  }, [methodId, t]);

  if (methodLoading) {
    return <TopUpLoading basePath={basePath} />;
  }

  if (!method) {
    return <NoPaymentMethods basePath={basePath} message={methodError} />;
  }

  const visualType = getPaymentVisualType(method);
  const topUpFlow = getTopUpFlow(method);
  const amountValue = Math.max(0, Number(amount) || 0);
  const isManual = topUpFlow === "manual";
  const isOnline = topUpFlow === "online";
  const hostedCheckoutName = getHostedCheckoutName(method.gateway);
  const walletCurrency = String(user?.currency || "USD").toUpperCase();
  const currency = isOnline ? walletCurrency : String(method.currency || method.groupCurrency || walletCurrency).toUpperCase();
  const feePercent = Math.max(0, Number(method.fee) || 0);
  const estimatedFeeAmount = amountValue * feePercent / 100;
  const estimatedPayableAmount = amountValue + estimatedFeeAmount;
  const amountBreakdown = paymentIntent
    ? {
        topUpAmountLabel: paymentIntent.requestedAmountLabel || paymentIntent.amountLabel,
        feeAmountLabel: paymentIntent.feeAmountLabel || formatCurrencyValue(paymentIntent.feeAmount, paymentIntent.payableCurrency || currency),
        feePercent: paymentIntent.feePercent ?? feePercent,
        payableAmountLabel: paymentIntent.payableAmountLabel || paymentIntent.totalAmountLabel,
        walletCreditLabel: paymentIntent.requestedAmountLabel || paymentIntent.amountLabel,
        gatewayAmountLabel: paymentIntent.gatewayAmountLabel,
        hasGatewayCharge: paymentIntent.hasGatewayCharge,
      }
    : {
        topUpAmountLabel: `${formatMoney(amountValue)} ${currency}`,
        feeAmountLabel: `${formatMoney(estimatedFeeAmount)} ${currency}`,
        feePercent,
        payableAmountLabel: `${formatMoney(estimatedPayableAmount)} ${currency}`,
        walletCreditLabel: `${formatMoney(amountValue)} ${currency}`,
        gatewayAmountLabel: "",
        hasGatewayCharge: false,
      };

  const updateAmount = (nextValue) => {
    const cleanedValue = nextValue
      .replace(/[^\d.]/g, "")
      .replace(/(\..*)\./g, "$1");
    setAmount(cleanedValue);
    setErrorMessage("");
    setPendingMessage("");
    setRiskBlockedMessage("");
    setSuccessMessage("");
    setPaymentIntent(null);
    setRedirecting(false);
  };

  const copyPaymentAccount = async () => {
    if (!method?.account) return;

    try {
      await navigator.clipboard.writeText(method.account);
      showToast({
        type: "success",
        title: t("topUp.copyAccountSuccess"),
        message: method.account,
      });
    } catch {
      showToast({
        type: "error",
        title: t("topUp.copyFailedTitle"),
        message: t("topUp.copyFailedMessage"),
      });
    }
  };

  const refreshWalletReads = async () => {
    if (!token) return;

    await Promise.allSettled([
      refreshCurrentUser?.(),
      getWalletSummary(token),
      getWalletTransactions(token, { page: 1, limit: 5 }),
    ]);
  };

  const submitTopUp = async (event) => {
    event.preventDefault();
    if (submitting) return;
    let shouldRedirect = false;

    setErrorMessage("");
    setPendingMessage("");
    setPaymentIntent(null);
    setRedirecting(false);
    setRiskBlockedMessage("");
    setSuccessMessage("");

    if (!antiScamConfirmed) {
      setErrorMessage(t("antiScamRequiredError"));
      setAntiScamModalOpen(true);
      return;
    }

    if (amountValue <= 0) {
      setErrorMessage(t("topUp.amountGreaterZero"));
      return;
    }

    if (method.minAmount && amountValue < method.minAmount) {
      setErrorMessage(t("topUp.minimumAmount", { amount: formatMoney(method.minAmount), currency }));
      return;
    }

    if (method.maxAmount && amountValue > method.maxAmount) {
      setErrorMessage(t("topUp.maximumAmount", { amount: formatMoney(method.maxAmount), currency }));
      return;
    }

    if (!["/customer", "/admin/user"].includes(basePath)) {
      setErrorMessage(t("topUp.customerOnly"));
      return;
    }

    if (topUpFlow === "unsupported") {
      setErrorMessage(t("topUp.unsupportedMethod"));
      return;
    }

    if (isManual && !receiptFile) {
      setErrorMessage(t("topUp.receiptRequired"));
      return;
    }

    setSubmitting(true);

    try {
      if (isManual) {
        const formData = new FormData();
        formData.append("requestedAmount", String(amountValue));
        formData.append("currency", currency);
        formData.append("paymentMethodId", method.id);
        formData.append("receipt", receiptFile);
        formData.append("notes", t("topUp.manualNotes", { method: method.title }));
        formData.append("antiScamConfirmed", "true");
        formData.append("termsAccepted", "true");
        if (antiScamConfirmedAt) formData.append("antiScamConfirmedAt", antiScamConfirmedAt);

        const result = await createDepositRequest(token, formData);
        setAmount("");
        setReceiptFile(null);
        setReceiptInputKey((current) => current + 1);
        setRiskBlockedMessage("");
        setSuccessMessage(t("topUp.depositSubmitted", { amount: result.deposit.amountLabel }));
        await refreshWalletReads();
        showToast({
          type: "success",
          title: t("topUp.depositSubmittedTitle"),
          message: result.deposit.statusLabel,
        });
        return;
      }

      const returnUrl = `${window.location.origin}${basePath}/wallet/transactions`;
      const cancelUrl = `${window.location.origin}${basePath}/wallet`;
      const result = await createPaymentIntent(token, {
        amount: amountValue,
        currency,
        gateway: method.gateway || undefined,
        paymentMethodId: method.id,
        returnUrl,
        cancelUrl,
        antiScamConfirmed: true,
        termsAccepted: true,
        antiScamConfirmedAt,
      }, {
        idempotencyKey: makeIdempotencyKey("payment"),
      });

      setPaymentIntent(result.payment);
      if (result.payment.checkoutUrl) {
        shouldRedirect = true;
        const gatewayChargeText = formatGatewayChargeText(result.payment, t);
        const hostedCheckoutText = hostedCheckoutName ? `${hostedCheckoutName} secure checkout` : "";
        const redirectSummary = [hostedCheckoutText, gatewayChargeText].filter(Boolean).join(". ");
        setRedirecting(true);
        setPendingMessage(redirectSummary
          ? `${redirectSummary}. ${t("topUp.redirectingPending")}`
          : t("topUp.redirectingPending"));
        showToast({
          type: "success",
          title: t("topUp.redirectingTitle"),
          message: redirectSummary || t("topUp.redirectingMessage"),
        });
        window.setTimeout(() => {
          window.location.assign(result.payment.checkoutUrl);
        }, redirectSummary ? 1200 : 0);
        return;
      }

      setPendingMessage(t("topUp.paymentIntentCreated", { status: result.payment.statusLabel }));
      await refreshWalletReads();
      showToast({
        type: "success",
        title: t("topUp.intentCreatedTitle"),
        message: result.payment.statusLabel,
      });
    } catch (requestError) {
      if (isPaymentRiskLimitError(requestError) || isPaymentCurrencyConversionError(requestError)) {
        const message = requestError.userMessage || t("topUp.topUpUnavailable");
        setRiskBlockedMessage(message);
        setErrorMessage(message);
        showToast({
          type: "warning",
          title: isPaymentRiskLimitError(requestError) ? t("topUp.onlineLimitedTitle") : t("topUp.onlineUnavailableTitle"),
          message,
        });
      } else {
        if (isAntiScamConfirmationRequiredError(requestError)) {
          setAntiScamConfirmed(false);
          setAntiScamModalOpen(true);
          setErrorMessage(t("antiScamRequiredError"));
        } else {
          setErrorMessage(requestError.userMessage || t("topUp.requestFailed"));
        }
      }
    } finally {
      if (!shouldRedirect) setSubmitting(false);
    }
  };

  return (
    <div
      dir="rtl"
      className="-mx-4 -mt-6 min-h-[calc(100vh-124px)] overflow-hidden bg-[#F8FCFF] px-4 pb-10 pt-5 text-slate-950 dark:bg-[#020615] dark:text-white sm:-mx-6 sm:px-6 lg:-mx-8"
    >
      <div className="mx-auto w-full max-w-[620px] space-y-3">
        <header className="rounded-[16px] border border-[#8B5CF6]/[0.14] bg-white/90 p-3 shadow-soft backdrop-blur-xl dark:border-white/[0.08] dark:bg-[#080d1e]/[0.96] dark:shadow-[0_16px_42px_rgba(0,0,0,0.28)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${methodAccent[visualType] || methodAccent.generic} text-white shadow-[0_12px_28px_rgba(139,92,246,0.24)]`}>
                <CreditCard className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#8B5CF6] dark:text-[#C084FC]">{t("topUp.walletTopUp")}</p>
                <h1 className="mt-0.5 text-xl font-black text-slate-950 dark:text-white">{t("topUp.confirmDetails")}</h1>
              </div>
            </div>

            <Link
              to={`${basePath}/wallet`}
              className="interactive-ring inline-flex h-9 items-center justify-center gap-1.5 rounded-full border border-slate-200 bg-white/80 px-3 text-xs font-black text-slate-600 dark:border-white/10 dark:bg-[#060a18]/[0.82] dark:text-white/70"
            >
              <ArrowRight className="h-3.5 w-3.5" />
              {t("topUp.wallet")}
            </Link>
          </div>
        </header>

        <form onSubmit={submitTopUp} className="rounded-[18px] border border-slate-200 bg-white/92 p-2.5 shadow-[0_16px_40px_rgba(14,165,233,0.10)] backdrop-blur-xl dark:border-white/[0.08] dark:bg-[#080d1e]/[0.96] dark:shadow-[0_18px_48px_rgba(0,0,0,0.30)] sm:p-3">
          <section className="overflow-hidden rounded-[16px] border border-[#8B5CF6]/[0.14] bg-[linear-gradient(145deg,#F8FCFF,#FFFFFF_42%,#F5F3FF)] dark:border-[#8B5CF6]/[0.24] dark:bg-[linear-gradient(145deg,#111827,#080d1e_48%,#120a2e)]">
            <div className="grid gap-3 p-3 sm:grid-cols-[minmax(0,1fr)_180px] sm:p-4">
              <div className="flex min-w-0 flex-col justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white text-[#8B5CF6] shadow-[0_10px_24px_rgba(139,92,246,0.12)] dark:bg-[#050918] dark:text-[#C084FC]">
                    <CreditCard className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[11px] font-black text-slate-500 dark:text-white/[0.48]">{t("topUp.selectedMethod")}</p>
                    <h2 className="mt-0.5 truncate text-xl font-black text-slate-950 dark:text-white">{method.title}</h2>
                    <p className="mt-1 text-xs font-bold text-slate-500 dark:text-white/50">
                      {isOnline ? t("topUp.onlineIntent") : isManual ? t("topUp.manualRequest") : t("topUp.notConnected")}
                    </p>
                  </div>
                </div>
              </div>

              <SelectedPaymentCard method={method} />
            </div>
          </section>

          {isManual && <PaymentDetails method={method} onCopyAccount={copyPaymentAccount} />}

          <section className="mt-3 rounded-[18px] border border-[#8B5CF6]/[0.14] bg-[linear-gradient(145deg,rgba(255,255,255,0.96),rgba(248,250,252,0.92))] p-3 shadow-[0_16px_36px_rgba(139,92,246,0.09)] dark:border-white/[0.08] dark:bg-[linear-gradient(145deg,rgba(8,13,30,0.96),rgba(5,9,24,0.92))] dark:shadow-[0_18px_42px_rgba(0,0,0,0.26)]">
            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-xs font-black text-slate-700 dark:text-white/80">
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-[#8B5CF6]/10 text-[#8B5CF6] dark:bg-[#C084FC]/10 dark:text-[#C084FC]">
                  <Hash className="h-3.5 w-3.5" />
                </span>
                <span>{t("topUp.amount")}</span>
              </span>
              <div className="relative">
                <input
                  type="text"
                  inputMode="decimal"
                  value={amount}
                  onChange={(event) => updateAmount(event.target.value)}
                  placeholder="0.00"
                  aria-label={t("topUp.amountAria")}
                  className="peer h-12 w-full rounded-xl border border-slate-200 bg-white px-4 pl-20 text-right text-2xl font-black text-slate-950 outline-none shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] transition placeholder:text-slate-300 focus:border-[#8B5CF6]/70 focus:ring-4 focus:ring-[#8B5CF6]/15 dark:border-white/10 dark:bg-[#050918] dark:text-white dark:placeholder:text-white/20"
                />
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[11px] font-black text-slate-500 transition peer-focus:border-[#8B5CF6]/30 peer-focus:bg-[#8B5CF6]/10 peer-focus:text-[#8B5CF6] dark:border-white/10 dark:bg-white/[0.04] dark:text-white/50 dark:peer-focus:text-[#C084FC]">
                  {currency}
                </span>
              </div>
            </label>
          </section>

          {isManual && (
            <section className="mt-3 rounded-[18px] border border-dashed border-[#8B5CF6]/30 bg-white/86 p-3 dark:border-[#A855F7]/25 dark:bg-[#050918]/70">
              <label className="flex cursor-pointer items-center gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#8B5CF6]/10 text-[#8B5CF6] dark:bg-[#C084FC]/10 dark:text-[#C084FC]">
                  <Upload className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1 text-right">
                  <span className="block text-xs font-black text-slate-700 dark:text-white/80">{t("topUp.receiptImage")}</span>
                  <span className="mt-1 block truncate text-[11px] font-bold text-slate-500 dark:text-white/45">
                    {receiptFile ? receiptFile.name : t("topUp.uploadReceipt")}
                  </span>
                </span>
                <input
                  key={receiptInputKey}
                  type="file"
                  accept="image/*,application/pdf"
                  className="sr-only"
                  onChange={(event) => {
                    setReceiptFile(event.target.files?.[0] || null);
                    setErrorMessage("");
                    setSuccessMessage("");
                  }}
                />
              </label>
            </section>
          )}

          <section className="mt-3 rounded-[16px] border border-[#8B5CF6]/[0.16] bg-[linear-gradient(135deg,rgba(139,92,246,0.12),rgba(255,255,255,0.94)_44%)] p-3 dark:border-[#8B5CF6]/[0.24] dark:bg-[linear-gradient(135deg,rgba(67,30,154,0.46),rgba(8,13,30,0.98)_44%)]">
            <div className="rounded-xl bg-white/85 p-3 dark:bg-[#050918]/80">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] font-bold text-slate-500 dark:text-white/[0.48]">{t("topUp.totalPayable")}</p>
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#151136] text-white shadow-[0_12px_28px_rgba(139,92,246,0.24)]">
                  <ReceiptText className="h-5 w-5" />
                </span>
              </div>
              <p dir="ltr" className="mt-1 text-3xl font-black leading-none text-slate-950 dark:text-white">
                {amountBreakdown.payableAmountLabel}
              </p>
              <div className="mt-3 grid gap-2 text-right">
                <AmountBreakdownRow label={t("topUp.topUpAmount")} value={amountBreakdown.topUpAmountLabel} />
                <AmountBreakdownRow
                  label={t("topUp.paymentFeeWithPercent", { percent: formatPercent(amountBreakdown.feePercent) })}
                  value={amountBreakdown.feeAmountLabel}
                />
                <AmountBreakdownRow label={t("topUp.walletCreditAmount")} value={amountBreakdown.walletCreditLabel} />
                {amountBreakdown.hasGatewayCharge && amountBreakdown.gatewayAmountLabel && (
                  <AmountBreakdownRow label={t("topUp.gatewayCharge")} value={amountBreakdown.gatewayAmountLabel} tone="sky" />
                )}
              </div>
            </div>

            {errorMessage && (
              <div className="mt-3 rounded-2xl border border-amber-500/30 bg-amber-500/12 px-3 py-2 text-xs font-bold leading-5 text-amber-800 dark:text-amber-300">
                <p>{errorMessage}</p>
                {riskBlockedMessage && (
                  <Link
                    to={`${basePath}/wallet`}
                    className="interactive-ring mt-2 inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-amber-500/25 bg-white/70 px-3 text-[11px] font-black text-amber-800 dark:bg-[#050918]/70 dark:text-amber-200"
                  >
                    <ArrowRight className="h-3.5 w-3.5" />
                    {t("topUp.chooseManualDeposit")}
                  </Link>
                )}
              </div>
            )}

            {successMessage && (
              <p className="mt-3 rounded-2xl border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-xs font-bold leading-5 text-emerald-700 dark:text-emerald-300">
                {successMessage}
              </p>
            )}

            {paymentIntent?.hasGatewayCharge && (
              <div className="mt-3 grid gap-2 rounded-2xl border border-sky-500/25 bg-sky-500/10 p-3 text-right dark:border-sky-400/20 dark:bg-sky-400/10">
                <div className="flex items-center justify-between gap-3 rounded-xl bg-white/75 px-3 py-2 dark:bg-[#050918]/70">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-white/50">{t("topUp.walletCreditAmount")}</span>
                  <span dir="ltr" className="text-sm font-black text-slate-900 dark:text-white">{paymentIntent.requestedAmountLabel}</span>
                </div>
                <div className="flex items-center justify-between gap-3 rounded-xl bg-white/75 px-3 py-2 dark:bg-[#050918]/70">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-white/50">{t("topUp.secureChargeShort")}</span>
                  <span dir="ltr" className="text-sm font-black text-sky-700 dark:text-sky-300">{paymentIntent.gatewayAmountLabel}</span>
                </div>
              </div>
            )}

            {pendingMessage && (
              <p className="mt-3 rounded-2xl border border-sky-500/25 bg-sky-500/10 px-3 py-2 text-xs font-bold leading-5 text-sky-700 dark:text-sky-300">
                {pendingMessage}
              </p>
            )}

            {paymentIntent?.checkoutUrl && (
              <a
                href={paymentIntent.checkoutUrl}
                className="interactive-ring mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-sky-500/20 bg-sky-500/10 px-4 text-xs font-black text-sky-700 dark:text-sky-300"
              >
                <ExternalLink className="h-4 w-4" />
                {t("topUp.secureCheckout")}
              </a>
            )}

            <button
              type="submit"
              disabled={submitting || redirecting}
              className="interactive-ring mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#A855F7] px-4 text-sm font-black text-white shadow-[0_12px_30px_rgba(139,92,246,0.30)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting || redirecting ? <Loader2 className="h-[18px] w-[18px] animate-spin" /> : <CheckCircle2 className="h-[18px] w-[18px]" />}
              {redirecting ? t("common:states.redirecting") : submitting ? t("common:states.submitting") : isManual ? t("topUp.submitDeposit") : isOnline ? t("topUp.continueSecureCheckout") : t("topUp.notConnected")}
            </button>
          </section>
        </form>
      </div>

      {antiScamModalOpen && !antiScamConfirmed && (
        <AntiScamSafetyConfirmationModal
          onCancel={() => {
            setAntiScamModalOpen(false);
            setErrorMessage(t("antiScamRequiredError"));
          }}
          onConfirm={() => {
            const confirmedAt = new Date().toISOString();
            setAntiScamConfirmed(true);
            setAntiScamConfirmedAt(confirmedAt);
            setAntiScamModalOpen(false);
            setErrorMessage("");
          }}
        />
      )}
    </div>
  );
}

function TopUpLoading({ basePath }) {
  const { t } = useTranslation("wallet");

  return (
    <div
      dir="rtl"
      className="-mx-4 -mt-6 grid min-h-[calc(100vh-124px)] place-items-center bg-[#F8FCFF] px-4 py-10 text-slate-950 dark:bg-[#020615] dark:text-white sm:-mx-6 sm:px-6 lg:-mx-8"
    >
      <section className="w-full max-w-[440px] rounded-[20px] border border-slate-200 bg-white/90 p-6 text-center shadow-soft dark:border-white/10 dark:bg-[#080d1e]">
        <Loader2 className="mx-auto h-10 w-10 animate-spin text-[#8B5CF6]" />
        <h1 className="mt-4 text-xl font-black">{t("topUp.loadingMethod")}</h1>
        <Link
          to={`${basePath}/wallet`}
          className="interactive-ring mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#8B5CF6] px-4 text-sm font-black text-white"
        >
          <ArrowRight className="h-4 w-4" />
          {t("topUp.backToWallet")}
        </Link>
      </section>
    </div>
  );
}

function NoPaymentMethods({ basePath, message }) {
  const { t } = useTranslation("wallet");

  return (
    <div
      dir="rtl"
      className="-mx-4 -mt-6 grid min-h-[calc(100vh-124px)] place-items-center bg-[#F8FCFF] px-4 py-10 text-slate-950 dark:bg-[#020615] dark:text-white sm:-mx-6 sm:px-6 lg:-mx-8"
    >
      <section className="w-full max-w-[440px] rounded-[20px] border border-dashed border-slate-200 bg-white/90 p-6 text-center shadow-soft dark:border-white/10 dark:bg-[#080d1e]">
        <CreditCard className="mx-auto h-10 w-10 text-[#8B5CF6]" />
        <h1 className="mt-4 text-xl font-black">{t("topUp.noMethodsTitle")}</h1>
        <p className="mt-2 text-sm font-semibold leading-6 text-slate-500 dark:text-white/50">{message || t("topUp.noMethodsDescription")}</p>
        <Link
          to={`${basePath}/wallet`}
          className="interactive-ring mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#8B5CF6] px-4 text-sm font-black text-white"
        >
          <ArrowRight className="h-4 w-4" />
          {t("topUp.backToWallet")}
        </Link>
      </section>
    </div>
  );
}

function AmountBreakdownRow({ label, value, tone = "slate" }) {
  const valueClass = tone === "sky" ? "text-sky-700 dark:text-sky-300" : "text-slate-900 dark:text-white";

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2 dark:bg-white/[0.04]">
      <span className="text-[11px] font-bold text-slate-500 dark:text-white/50">{label}</span>
      <span dir="ltr" className={`text-sm font-black ${valueClass}`}>{value}</span>
    </div>
  );
}

function PaymentDetails({ method, onCopyAccount }) {
  const { t } = useTranslation("wallet");
  const details = [
    [t("topUp.account"), method.account, "account"],
    [t("topUp.bank"), method.bank, "bank"],
    [t("topUp.owner"), method.owner, "owner"],
    [t("topUp.fee"), method.fee ? `${method.fee}%` : "", "fee"],
    [t("topUp.min"), method.minAmount ? `${formatMoney(method.minAmount)} ${method.currency}` : "", "min"],
    [t("topUp.max"), method.maxAmount ? `${formatMoney(method.maxAmount)} ${method.currency}` : "", "max"],
  ].filter(([, value]) => Boolean(value));

  if (!details.length && !method.instructions) return null;

  return (
    <section className="mt-3 rounded-[16px] border border-slate-200 bg-white/90 p-3 shadow-[0_16px_36px_rgba(139,92,246,0.08)] dark:border-white/[0.08] dark:bg-[#080d1e]/[0.96]">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-black text-slate-950 dark:text-white">{t("topUp.paymentDetails")}</h2>
        {method.account && (
          <button
            type="button"
            onClick={onCopyAccount}
            className="interactive-ring inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-[#8B5CF6]/20 bg-[#8B5CF6]/10 px-3 text-[11px] font-black text-[#8B5CF6] dark:border-[#C084FC]/20 dark:text-[#C084FC]"
          >
            <Copy className="h-3.5 w-3.5" />
            {t("common:actions.copy")}
          </button>
        )}
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        {details.map(([label, value, key]) => (
          <div key={label} className="rounded-xl bg-slate-50 px-3 py-2 dark:bg-[#050918]">
            <p className="text-[10px] font-black text-slate-400 dark:text-white/35">{label}</p>
            <p dir={key === "account" ? "ltr" : "rtl"} className="mt-1 truncate text-sm font-black text-slate-800 dark:text-white">
              {value}
            </p>
          </div>
        ))}
      </div>
      {method.instructions && (
        <p className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-xs font-bold leading-5 text-slate-600 dark:bg-[#050918] dark:text-white/60">
          {method.instructions}
        </p>
      )}
    </section>
  );
}

function SelectedPaymentCard({ method }) {
  const { t } = useTranslation("wallet");
  const type = getPaymentVisualType(method);

  if (type === "apple") {
    return (
      <div className="relative min-h-[112px] overflow-hidden rounded-[18px] border border-slate-200 bg-[linear-gradient(145deg,#ffffff,#d9dbe2)] p-4 text-[#111827] shadow-[0_16px_34px_rgba(15,23,42,0.16)]">
        <span className="absolute -left-7 -top-7 h-20 w-20 rounded-full bg-white/60" />
        <p className="relative text-2xl font-black">Apple Pay</p>
        <p className="relative mt-8 text-xs font-black text-slate-500">{t("topUp.onlineIntent")}</p>
      </div>
    );
  }

  if (type === "mastercard") {
    return (
      <div className="relative min-h-[112px] overflow-hidden rounded-[18px] border border-white/[0.12] bg-[linear-gradient(145deg,#27304f,#11172c)] p-4 text-white shadow-[0_16px_34px_rgba(15,23,42,0.22)]">
        <span className="absolute -left-7 -bottom-7 h-24 w-24 rounded-full bg-[#eb001b]/16" />
        <span className="absolute -right-7 -top-7 h-24 w-24 rounded-full bg-[#f79e1b]/16" />
        <div className="relative flex items-start justify-between">
          <span className="relative h-10 w-20">
            <span className="absolute left-0 top-1 h-9 w-9 rounded-full bg-[#eb001b]" />
            <span className="absolute left-7 top-1 h-9 w-9 rounded-full bg-[#f79e1b] mix-blend-screen" />
          </span>
          <span className="text-lg font-black leading-none text-white/[0.82]">)))</span>
        </div>
        <p className="relative mt-7 text-[11px] font-bold text-white/60">{method.account || "**** **** **** 4242"}</p>
      </div>
    );
  }

  if (type === "visa") {
    return (
      <div className="relative min-h-[112px] overflow-hidden rounded-[18px] border border-blue-300/25 bg-[linear-gradient(145deg,#0d67ff,#082b9f)] p-4 text-white shadow-[0_16px_34px_rgba(15,23,42,0.22)]">
        <span className="absolute -left-8 -bottom-8 h-24 w-24 rounded-full bg-white/12" />
        <span className="absolute right-4 top-4 text-2xl font-black italic leading-none">VISA</span>
        <span className="relative block h-7 w-10 rounded-md bg-[linear-gradient(145deg,#f7d66a,#d69f22)] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.35)]" />
        <div className="relative mt-7 flex items-end justify-between text-white/75">
          <p className="text-[11px] font-bold">{method.account || "**** 4242"}</p>
          <span className="text-lg font-black leading-none">)))</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-[112px] overflow-hidden rounded-[18px] border border-blue-300/25 bg-[linear-gradient(145deg,#0d67ff,#082b9f)] p-4 text-white shadow-[0_16px_34px_rgba(15,23,42,0.22)]">
      <span className="absolute -left-8 -bottom-8 h-24 w-24 rounded-full bg-white/12" />
      <div className="relative flex items-start justify-between gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-xl bg-white/15">
          {method.imageUrl || method.image ? <img src={method.imageUrl || method.image} alt="" className="h-full w-full object-contain p-1.5" /> : <CreditCard className="h-5 w-5" />}
        </span>
        <p className="min-w-0 truncate text-right text-lg font-black">{method.title}</p>
      </div>
      <div className="relative mt-7 flex items-end justify-between gap-3 text-white/75">
        <p className="truncate text-[11px] font-bold">{method.account || method.bank || "Winnie Pay"}</p>
        <span className="text-lg font-black leading-none">)))</span>
      </div>
    </div>
  );
}

function getPaymentVisualType(method) {
  const value = `${method.id || ""} ${method.title || ""} ${method.bank || ""}`.toLowerCase();

  if (value.includes("apple")) return "apple";
  if (value.includes("mastercard") || value.includes("master card")) return "mastercard";
  if (value.includes("visa")) return "visa";
  return "generic";
}

function getTopUpFlow(method) {
  const visualType = getPaymentVisualType(method);
  const configuredType = String(method.type || "").toUpperCase();
  if (method.gateway || ["ONLINE", "CARD"].includes(configuredType) || ["apple", "mastercard", "visa"].includes(visualType)) return "online";
  if (["MANUAL", "BANK_TRANSFER", "WALLET", "CRYPTO"].includes(configuredType)) return "manual";
  if (method.account || method.bank) return "manual";
  return "unsupported";
}

function getHostedCheckoutName(gateway) {
  return {
    PAYMENTO: "Paymento / USDT",
    ZIINA: "Ziina",
    NETWORK_INTERNATIONAL: "Network International",
    TAP: "Tap",
  }[String(gateway || "").toUpperCase()] || "";
}

function formatMoney(value) {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatCurrencyValue(value, currency) {
  return `${formatMoney(Number(value) || 0)} ${String(currency || "USD").toUpperCase()}`;
}

function formatPercent(value) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 4,
  }).format(Number(value) || 0);
}

function formatGatewayChargeText(payment, t) {
  if (!payment?.hasGatewayCharge || !payment.gatewayAmountLabel || !payment.requestedAmountLabel) return "";
  return t("topUp.secureCharge", {
    requested: payment.requestedAmountLabel,
    gateway: payment.gatewayAmountLabel,
  });
}
