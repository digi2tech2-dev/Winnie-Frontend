import { useEffect, useState } from "react";
import { AlertTriangle, Check, ChevronLeft, CreditCard, ReceiptText, ShieldCheck } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";
import { getCustomerPaymentMethods } from "../api/paymentMethods";
import { getWalletSummary } from "../api/wallet";
import AntiScamSafetyConfirmationModal from "../components/AntiScamSafetyConfirmationModal";
import { useAuth } from "../context/AuthContext";

export default function WalletPage({ basePath = "/customer" }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { token } = useAuth();
  const { t } = useTranslation("wallet");
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [paymentMethodsLoading, setPaymentMethodsLoading] = useState(true);
  const [paymentMethodsError, setPaymentMethodsError] = useState("");
  const [pendingTopUpMethod, setPendingTopUpMethod] = useState(null);
  const insufficientFunds = location.state?.insufficientFunds || null;
  const showTransactions = () => {
    navigate(`${basePath}/wallet/transactions`);
  };

  const addPaymentMethod = (method) => {
    setPendingTopUpMethod(method);
  };

  const continueTopUp = () => {
    if (!pendingTopUpMethod) return;
    const methodId = pendingTopUpMethod.id;
    setPendingTopUpMethod(null);
    navigate(`${basePath}/wallet/top-up/${methodId}`, {
      state: {
        antiScamConfirmed: true,
        antiScamConfirmedAt: new Date().toISOString(),
      },
    });
  };

  useEffect(() => {
    if (!token) return undefined;

    let cancelled = false;

    const loadWallet = async () => {
      setLoading(true);
      setError("");

      try {
        const summary = await getWalletSummary(token);
        if (!cancelled) setWallet(summary);
      } catch (requestError) {
        if (!cancelled) {
          setError(requestError.userMessage || t("summary.loadError"));
          setWallet(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadWallet();

    return () => {
      cancelled = true;
    };
  }, [t, token]);

  useEffect(() => {
    let cancelled = false;

    const loadPaymentMethods = async () => {
      setPaymentMethodsLoading(true);
      setPaymentMethodsError("");

      try {
        const result = await getCustomerPaymentMethods();
        if (!cancelled) setPaymentMethods(result.methods);
      } catch (requestError) {
        if (!cancelled) {
          setPaymentMethods([]);
          setPaymentMethodsError(requestError.userMessage || t("summary.paymentMethodsLoadError"));
        }
      } finally {
        if (!cancelled) setPaymentMethodsLoading(false);
      }
    };

    void loadPaymentMethods();

    return () => {
      cancelled = true;
    };
  }, [t]);

  return (
    <div
      dir="rtl"
      className="-mx-4 -mt-3 min-h-[calc(100vh-112px)] overflow-hidden bg-[#F8FCFF] px-4 pb-10 pt-5 text-slate-950 dark:bg-[#020615] dark:text-white sm:-mx-6 sm:px-6 lg:-mx-8"
    >
      <div className="mx-auto w-full max-w-[900px] space-y-5">
        {insufficientFunds && (
          <InsufficientFundsNotice
            currency={wallet?.currency}
            details={insufficientFunds}
          />
        )}
        <BalancePanel error={error} loading={loading} onShowTransactions={showTransactions} wallet={wallet} />

        <section className="space-y-4">
          <div className="space-y-1.5 text-right">
            <div className="inline-flex items-center gap-2.5">
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#F5F3FF] text-[#8B5CF6] dark:bg-[#8B5CF6]/16 dark:text-[#E9D5FF]">
                <CreditCard className="h-5 w-5" />
              </span>
              <h2 className="text-2xl font-black text-slate-950 dark:text-white">{t("summary.paymentMethodsTitle")}</h2>
            </div>
            <p className="max-w-2xl text-sm font-semibold leading-7 text-slate-500 dark:text-white/[0.46] sm:text-base">
              {t("summary.paymentMethodsDescription")}
            </p>
          </div>

          {paymentMethodsLoading ? (
            <div className="rounded-[18px] border border-dashed border-slate-200 bg-white/80 px-4 py-10 text-center dark:border-white/10 dark:bg-white/[0.03]">
              <p className="text-sm font-black text-slate-600 dark:text-white/70">{t("summary.loadingPaymentMethods")}</p>
            </div>
          ) : paymentMethods.length > 0 ? (
            <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-2 sm:gap-3 lg:grid-cols-3 xl:grid-cols-4">
              {paymentMethods.map((method) => (
                <PaymentMethodCard
                  key={method.id}
                  method={method}
                  selected={pendingTopUpMethod?.id === method.id}
                  onSelect={() => addPaymentMethod(method)}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-[18px] border border-dashed border-slate-200 bg-white/80 px-4 py-10 text-center dark:border-white/10 dark:bg-white/[0.03]">
              <CreditCard className="mx-auto h-8 w-8 text-slate-300 dark:text-white/25" />
              <p className="mt-3 text-sm font-black text-slate-600 dark:text-white/70">{t("summary.noPaymentMethods")}</p>
              <p className="mt-1 text-xs font-semibold text-slate-400 dark:text-white/40">
                {paymentMethodsError || t("summary.adminCanActivate")}
              </p>
            </div>
          )}
        </section>

        <SecurityPanel />
      </div>

      {pendingTopUpMethod && (
        <AntiScamSafetyConfirmationModal
          onCancel={() => setPendingTopUpMethod(null)}
          onConfirm={continueTopUp}
        />
      )}
    </div>
  );
}

function InsufficientFundsNotice({ currency, details }) {
  const { t } = useTranslation("wallet");
  const amount = Number(details?.shortfall);
  const hasShortfall = Number.isFinite(amount) && amount > 0;
  const amountLabel = hasShortfall
    ? `${formatWalletAmount(amount)}${currency ? ` ${currency}` : ""}`
    : "";

  return (
    <section
      className="flex items-start gap-3 rounded-[18px] border border-amber-300/60 bg-amber-50/95 p-4 text-right shadow-[0_14px_34px_rgba(245,158,11,0.12)] dark:border-amber-300/20 dark:bg-amber-300/10"
      role="alert"
    >
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-300/15 dark:text-amber-300">
        <AlertTriangle className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <h2 className="text-base font-black text-amber-950 dark:text-amber-100">{t("summary.insufficientPurchaseTitle")}</h2>
        <p className="mt-1 text-sm font-bold leading-6 text-amber-800 dark:text-amber-200">
          {hasShortfall
            ? t("summary.insufficientPurchaseAmount", { amount: amountLabel })
            : details.message || t("summary.insufficientPurchaseDescription")}
        </p>
      </div>
    </section>
  );
}

function formatWalletAmount(value) {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

function BalancePanel({ error, loading, onShowTransactions, wallet }) {
  const { t } = useTranslation("wallet");
  const balanceLabel = wallet?.balanceLabel || "$0.00";
  const currency = wallet?.currency || "";

  return (
    <section className="relative overflow-hidden rounded-[20px] border border-[#8B5CF6]/[0.16] bg-white/90 p-4 shadow-soft backdrop-blur-xl dark:border-[#8B5CF6]/[0.24] dark:bg-[#080b1d] dark:shadow-[0_14px_42px_rgba(0,0,0,0.34)] sm:p-5">
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(139,92,246,0.28),rgba(4,8,24,0)_42%),linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0))]" />
      <div className="relative flex flex-row items-center justify-between gap-4 sm:gap-6">
        <div className="min-w-0 flex-1 text-right">
          <p className="text-sm font-bold text-slate-500 dark:text-white/[0.68] sm:text-base">{t("summary.currentBalance")}</p>
          <div className="mt-2">
            <p dir="ltr" className="text-[clamp(2rem,6vw,3.25rem)] font-black leading-none text-slate-950 dark:text-white">{loading ? "..." : balanceLabel}</p>
            <p className="mt-1.5 text-base font-bold text-slate-500 dark:text-white/70 sm:text-lg">{currency}</p>
          </div>
          {error && (
            <p className="mt-3 rounded-2xl border border-amber-400/30 bg-amber-400/12 px-3 py-2 text-xs font-bold leading-5 text-amber-700 dark:text-amber-300">
              {error}
            </p>
          )}
          <button
            type="button"
            onClick={onShowTransactions}
            className="interactive-ring mt-4 inline-flex h-10 min-w-[176px] items-center justify-center gap-2 rounded-full border border-slate-200 bg-white/75 px-4 text-xs font-black text-slate-600 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.32)] backdrop-blur dark:border-white/10 dark:bg-[#060a18]/[0.82] dark:text-white/60 sm:text-sm"
          >
            <ReceiptText className="h-4 w-4 text-[#8B5CF6]" />
            {t("summary.showTransactions")}
          </button>
        </div>

        <WalletIllustration />
      </div>
    </section>
  );
}

function WalletIllustration() {
  return (
    <div className="relative h-[132px] w-[156px] shrink-0 sm:h-[158px] sm:w-[206px]" aria-hidden="true">
      <div className="absolute left-[38px] top-1 h-[56px] w-[98px] -rotate-12 overflow-hidden rounded-[13px] border border-white/[0.12] bg-[linear-gradient(140deg,#342082,#101936)] shadow-[0_12px_28px_rgba(74,31,189,0.42)] sm:left-[48px] sm:h-[66px] sm:w-[116px]">
        <span className="absolute right-4 top-3 text-xl font-black text-white/[0.55]">W</span>
        <span className="absolute bottom-3 left-3 h-5 w-14 rounded-lg bg-white/10 sm:w-[72px]" />
        <span className="absolute left-3 top-3 h-4 w-10 rounded-lg bg-[#6552d9]/[0.45]" />
      </div>

      <div className="absolute bottom-4 left-[22px] h-[88px] w-[128px] -rotate-6 rounded-[18px] border border-[#bd8cff]/[0.45] bg-[linear-gradient(145deg,#8a32ff,#5d24e8_58%,#32106e)] shadow-[0_16px_34px_rgba(119,44,255,0.48)] sm:left-[28px] sm:h-[106px] sm:w-[156px]">
        <span className="absolute inset-x-3 top-3 h-4 rounded-full bg-white/10" />
        <span className="absolute bottom-2.5 left-4 h-3.5 w-20 rounded-full bg-black/[0.12] sm:w-28" />
        <span className="absolute -right-1.5 top-9 flex h-9 w-[46px] items-center rounded-xl border border-white/[0.14] bg-[linear-gradient(135deg,#b557ff,#7132da)] p-1.5 shadow-[0_10px_20px_rgba(68,25,150,0.35)] sm:top-11 sm:h-10 sm:w-[52px]">
          <span className="grid h-6 w-6 place-items-center rounded-full border border-white/[0.16] bg-white/[0.14] sm:h-7 sm:w-7" />
        </span>
      </div>

      <WalletCoin className="absolute bottom-3 left-0 h-9 w-9 text-[9px] sm:h-10 sm:w-10" />
      <WalletCoin className="absolute left-[168px] top-14 hidden h-9 w-9 text-[9px] sm:grid" />
      <WalletCoin className="absolute bottom-9 left-[140px] h-8 w-8 text-[8px] sm:bottom-10 sm:left-[154px] sm:h-9 sm:w-9 sm:text-[9px]" />
    </div>
  );
}

function WalletCoin({ className }) {
  return (
    <span
      className={`${className} grid place-items-center rounded-full border border-white/[0.18] bg-[linear-gradient(145deg,#a855f7,#5b21b6)] text-[12px] font-black text-white shadow-[0_14px_34px_rgba(139,92,246,0.5)]`}
    >
      $
    </span>
  );
}

function PaymentMethodCard({ method, onSelect, selected = false }) {
  const imageUrl = method.image ? (method.imageUrl || method.image) : "";
  const tone = getPaymentMethodTone(method);

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`payment-method-card payment-method-tone-${tone} group relative flex min-h-[122px] min-w-0 cursor-pointer flex-col items-center gap-1.5 overflow-hidden rounded-[18px] border p-1.5 text-center outline-none transition duration-200 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#F8FCFF] dark:focus-visible:ring-offset-[#020615] sm:min-h-[78px] sm:flex-row sm:gap-3 sm:rounded-[20px] sm:p-2.5 sm:text-start ${selected ? "payment-method-selected" : ""}`}
    >
      <span className="payment-method-logo-shell flex h-[68px] w-full shrink-0 items-center justify-center rounded-[13px] p-1.5 sm:h-16 sm:w-[72px] sm:rounded-[15px] sm:p-2">
        {imageUrl ? <img src={imageUrl} alt="" aria-hidden="true" loading="lazy" className="payment-method-image h-full w-full object-contain" /> : null}
      </span>
      <span className="payment-method-label-shell flex min-w-0 w-full flex-1 flex-col justify-center sm:block sm:flex-1">
        <span className={`payment-method-name line-clamp-2 block text-[13px] font-black leading-[17px] sm:truncate sm:text-[15px] sm:leading-normal ${selected ? "payment-method-selected-name" : ""}`}>
          {method.title || method.name}
        </span>
        <span className="mt-1 flex items-center justify-center gap-1 sm:mt-2 sm:justify-start sm:gap-1.5" aria-hidden="true">
          <span className="payment-method-dot h-1.5 w-1.5 shrink-0 rounded-full" />
          <span className="h-px w-4 rounded-full bg-slate-200 dark:bg-white/10 sm:w-7" />
        </span>
      </span>
      <span className={`payment-method-check absolute left-2 top-2 grid h-5 w-5 shrink-0 place-items-center rounded-full sm:static sm:h-7 sm:w-7 ${selected ? "payment-method-check-selected" : ""}`} aria-hidden="true">
        {selected ? <Check className="h-3 w-3 sm:h-4 sm:w-4" strokeWidth={3} /> : <span className="h-1.5 w-1.5 rounded-full sm:h-2 sm:w-2" />}
      </span>
    </button>
  );
}

function getPaymentMethodTone(method = {}) {
  const value = `${method.title || ""} ${method.name || ""}`.toLowerCase();
  if (value.includes("apple")) return "apple";
  if (value.includes("paypal")) return "paypal";
  if (value.includes("vodafone") || value.includes("فودافون")) return "vodafone";
  if (value.includes("insta") || value.includes("انيستا") || value.includes("انستا")) return "instapay";
  return "default";
}

function SecurityPanel() {
  const { t } = useTranslation("wallet");

  return (
    <section
      dir="ltr"
      className="flex items-center gap-4 rounded-[16px] border border-[#8B5CF6]/[0.12] bg-[linear-gradient(135deg,rgba(139,92,246,0.14),rgba(255,255,255,0.96)_44%,rgba(255,255,255,0.96))] p-5 shadow-soft dark:bg-[linear-gradient(135deg,rgba(67,30,154,0.58),rgba(8,13,30,0.98)_44%,rgba(8,13,30,0.98))] dark:shadow-[0_16px_42px_rgba(0,0,0,0.3)]"
    >
      <span className="grid h-20 w-20 shrink-0 place-items-center rounded-2xl bg-[#151136] shadow-[inset_0_0_26px_rgba(139,92,246,0.28)]">
        <span className="grid h-14 w-14 place-items-center rounded-[18px] bg-[linear-gradient(145deg,#a855f7,#5b21b6)] text-white shadow-[0_16px_34px_rgba(139,92,246,0.38)]">
          <ShieldCheck className="h-8 w-8" />
        </span>
      </span>

      <div dir="rtl" className="min-w-0 flex-1 text-center sm:text-right">
        <h2 className="text-xl font-black text-slate-950 dark:text-white sm:text-2xl">{t("summary.securityTitle")}</h2>
        <p className="mt-2 text-sm font-semibold leading-7 text-slate-500 dark:text-white/[0.58]">
          {t("summary.securityDescription")}
        </p>
      </div>

      <button
        type="button"
        className="interactive-ring grid h-12 w-12 shrink-0 place-items-center rounded-full border border-[#8B5CF6]/20 bg-white text-[#8B5CF6] dark:bg-[#080d20]"
        aria-label={t("summary.securityDetails")}
        title={t("summary.securityDetails")}
      >
        <ChevronLeft className="h-6 w-6" />
      </button>
    </section>
  );
}
