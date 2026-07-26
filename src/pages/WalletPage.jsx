import { useEffect, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Check,
  Clock3,
  CreditCard,
  LockKeyhole,
  ReceiptText,
  ShieldCheck,
  WalletCards,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";
import { formatDateTime } from "../api/adapters";
import { getCustomerPaymentMethods } from "../api/paymentMethods";
import { getWalletSummary } from "../api/wallet";
import AntiScamSafetyConfirmationModal from "../components/AntiScamSafetyConfirmationModal";
import { useAuth } from "../context/AuthContext";
import "./WalletPage.css";

export default function WalletPage({ basePath = "/customer" }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { token } = useAuth();
  const { t, i18n } = useTranslation("wallet");
  const direction = i18n.dir(i18n.resolvedLanguage);
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
        insufficientFunds,
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
      dir={direction}
      className="wallet-page -mx-4 px-3 pb-0 pt-2 text-slate-950 dark:text-white sm:-mx-6 sm:px-6 sm:pt-3 lg:-mx-8 lg:px-8"
    >
      <div className="mx-auto w-full max-w-[820px] space-y-3 sm:space-y-4">
        {insufficientFunds && (
          <InsufficientFundsNotice
            currency={wallet?.currency}
            details={insufficientFunds}
          />
        )}
        <BalancePanel error={error} loading={loading} onShowTransactions={showTransactions} wallet={wallet} />
        <WalletStatistics loading={loading} wallet={wallet} />

        <section className="space-y-2.5 sm:space-y-3">
          <div className="wallet-section-card wallet-payment-heading relative overflow-hidden rounded-[18px] px-3 py-3 text-center sm:px-4 sm:py-3.5">
            <span className="wallet-accent-line" aria-hidden="true" />
            <div className="wallet-payment-heading-content relative mx-auto min-w-0">
              <h2 className="text-sm font-black leading-5 text-slate-950 dark:text-white sm:text-base">{t("summary.paymentMethodsTitle")}</h2>
              <p className="mt-0.5 text-[10px] font-semibold leading-4 text-slate-500 dark:text-white/55 sm:text-xs">
                {t("summary.paymentMethodsDescription")}
              </p>
            </div>
          </div>

          {paymentMethodsLoading ? (
            <div className="rounded-[18px] border border-dashed border-slate-200 bg-white/80 px-4 py-10 text-center dark:border-white/10 dark:bg-white/[0.03]">
              <p className="text-sm font-black text-slate-600 dark:text-white/70">{t("summary.loadingPaymentMethods")}</p>
            </div>
          ) : paymentMethods.length > 0 ? (
            <div className="wallet-payment-grid grid grid-cols-4 gap-1.5 sm:gap-2.5">
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
      className="relative flex items-center gap-2.5 overflow-hidden rounded-[14px] border border-amber-300/45 bg-[linear-gradient(135deg,rgba(255,251,235,0.96),rgba(255,255,255,0.92))] px-3 py-2.5 text-right shadow-[0_8px_24px_rgba(245,158,11,0.09)] dark:border-amber-300/15 dark:bg-[linear-gradient(135deg,rgba(245,158,11,0.12),rgba(8,13,30,0.96))]"
      role="alert"
    >
      <span className="absolute inset-y-2 right-0 w-[3px] rounded-l-full bg-gradient-to-b from-amber-400 to-orange-500" aria-hidden="true" />
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[10px] bg-amber-100/90 text-amber-600 shadow-[inset_0_0_0_1px_rgba(245,158,11,0.08)] dark:bg-amber-400 dark:text-[#241500] dark:shadow-[0_0_18px_rgba(251,191,36,0.34),inset_0_0_0_1px_rgba(255,255,255,0.34)]">
        <AlertTriangle className="h-4 w-4" strokeWidth={2.8} />
      </span>
      <div className="min-w-0 flex-1">
        <h2 className="text-[13px] font-black leading-5 text-amber-950 dark:text-amber-100">{t("summary.insufficientPurchaseTitle")}</h2>
        <p className="mt-0.5 text-[11px] font-bold leading-5 text-amber-700 dark:text-amber-200/85 sm:text-xs">
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
  const balanceLabel = wallet?.balanceLabel || t("summary.unavailable");
  const currency = wallet?.currency || "";

  return (
    <section className="wallet-balance-card relative overflow-hidden rounded-[18px] p-3 sm:p-4">
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(139,92,246,0.22),rgba(4,8,24,0)_44%),linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0))]" />
      <div className="wallet-balance-layout relative">
        <button
          type="button"
          onClick={onShowTransactions}
          className="wallet-history-button interactive-ring inline-flex h-8 min-w-0 items-center justify-center gap-1.5 rounded-full border border-slate-200 bg-white/75 px-2.5 text-[9px] font-black text-slate-600 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.32)] backdrop-blur dark:border-white/10 dark:bg-[#060a18]/[0.82] dark:text-white/60 sm:h-9 sm:px-3 sm:text-[11px]"
        >
          <ReceiptText className="h-3.5 w-3.5 shrink-0 text-[#8B5CF6]" />
          <span className="line-clamp-2">{t("summary.showTransactions")}</span>
        </button>

        <div className="wallet-balance-info min-w-0 text-center">
          <p className="text-[13px] font-bold text-slate-500 dark:text-white/[0.68] sm:text-sm">{t("summary.currentBalance")}</p>
          <div className="mt-1.5">
            <p dir="ltr" className="break-words text-[clamp(1.65rem,5vw,2.55rem)] font-black leading-none text-slate-950 dark:text-white">{loading ? t("summary.loadingShort") : balanceLabel}</p>
            <p className="mt-1 text-xs font-bold text-slate-500 dark:text-white/70 sm:text-sm">{currency}</p>
          </div>
        </div>

        <WalletIllustration />
      </div>
      {error && (
        <p className="relative mt-2 rounded-xl border border-amber-400/30 bg-amber-400/12 px-3 py-2 text-xs font-bold leading-5 text-amber-700 dark:text-amber-300">
          {error}
        </p>
      )}
    </section>
  );
}

function WalletStatistics({ loading, wallet }) {
  const { t, i18n } = useTranslation("wallet");
  const lastTransaction = wallet?.recentTransactions?.[0];
  const dateLocale = i18n.resolvedLanguage?.startsWith("ar") ? "ar-EG-u-nu-latn" : "en-US";
  const items = [
    {
      icon: Clock3,
      label: t("summary.lastTransaction"),
      value: lastTransaction?.date
        ? formatDateTime(lastTransaction.date, dateLocale, {
            day: "numeric",
            month: "long",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
          })
        : t("summary.unavailable"),
    },
    {
      icon: WalletCards,
      label: t("summary.totalDeposits"),
      value: wallet?.totalDepositsLabel || t("summary.unavailable"),
    },
    {
      icon: ReceiptText,
      label: t("summary.transactionCount"),
      value: wallet?.transactionCount ?? t("summary.unavailable"),
    },
  ];

  return (
    <section className="wallet-stat-grid grid grid-cols-3 gap-2 sm:gap-3" aria-label={t("summary.walletStatistics")}>
      {items.map(({ icon: Icon, label, value }) => (
        <article key={label} className="wallet-stat-card relative min-w-0 overflow-hidden rounded-[16px] px-2.5 py-2.5 sm:px-3 sm:py-3">
          <div className="wallet-stat-content relative flex min-w-0 items-center gap-2 sm:gap-2.5">
            <span className="wallet-icon-box wallet-stat-icon grid h-8 w-8 shrink-0 place-items-center rounded-[10px] sm:h-9 sm:w-9">
              <Icon className="h-4 w-4" />
            </span>
            <div className="min-w-0 text-start">
              <p className="wallet-stat-label line-clamp-1 text-[9px] font-bold leading-4 text-slate-500 dark:text-white/55 sm:text-[11px]">{label}</p>
              <p
                className={`wallet-stat-value mt-0.5 line-clamp-2 text-[10px] font-black leading-[1.35] sm:text-[11px] ${value === t("summary.unavailable") ? "wallet-stat-value--unavailable" : "text-slate-950 dark:text-white"}`}
                title={String(value)}
              >
                {loading ? t("summary.loadingShort") : value}
              </p>
            </div>
          </div>
        </article>
      ))}
    </section>
  );
}

function WalletIllustration() {
  return (
    <span className="wallet-illustration" aria-hidden="true">
      <img
        src="/wallet-3d.png"
        alt=""
        className="h-full w-full object-contain"
        decoding="async"
      />
    </span>
  );
}

function PaymentMethodCard({ method, onSelect, selected = false }) {
  const imageUrl =
    method.imageUrl ||
    method.logoUrl ||
    method.providerLogo ||
    method.image ||
    method.icon ||
    method.logo ||
    "";
  const providerName = method.title || method.name;

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      aria-label={providerName}
      title={providerName}
      disabled={method.active === false || method.enabled === false}
      className={`payment-method-card ${imageUrl ? "payment-method-card--image" : "payment-method-card--fallback"} group relative flex min-w-0 cursor-pointer flex-col items-center overflow-hidden rounded-[14px] border text-center outline-none transition duration-200 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#F8FCFF] disabled:cursor-not-allowed disabled:opacity-50 dark:focus-visible:ring-offset-[#020615] ${selected ? "payment-method-selected" : ""}`}
    >
      <span className="payment-method-logo-shell relative flex w-full min-h-0 flex-1 items-center justify-center rounded-[11px]">
        <span className="payment-method-fallback absolute inset-0 rounded-[10px]" aria-hidden="true" />
        {imageUrl ? (
          <img
            src={imageUrl}
            alt=""
            aria-hidden="true"
            loading="lazy"
            className="payment-method-image relative z-[1] h-full w-full object-contain"
            onError={(event) => {
              event.currentTarget.hidden = true;
            }}
          />
        ) : null}
      </span>
      <span className="payment-method-label-shell relative flex min-w-0 w-full flex-col justify-center px-1.5 py-1.5">
        <span className="payment-method-label-accent mx-auto mb-1 h-px w-5 rounded-full" aria-hidden="true" />
        <span className={`payment-method-name line-clamp-2 block text-[clamp(0.55rem,2.5vw,0.68rem)] font-black leading-[1.2] sm:text-xs ${selected ? "payment-method-selected-name" : ""}`}>
          {providerName}
        </span>
      </span>
      {selected ? (
        <span className="payment-method-check payment-method-check-selected absolute inset-inline-end-1.5 top-1.5 grid h-4 w-4 shrink-0 place-items-center rounded-full" aria-hidden="true">
          <Check className="h-2.5 w-2.5" strokeWidth={3} />
        </span>
      ) : null}
    </button>
  );
}

function SecurityPanel() {
  const { t } = useTranslation("wallet");

  return (
    <section className="wallet-security-card rounded-[18px] p-3 sm:p-3.5">
      <div className="flex items-center gap-3">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-[12px] bg-[#151136] shadow-[inset_0_0_18px_rgba(139,92,246,0.24)] sm:h-14 sm:w-14">
          <span className="grid h-9 w-9 place-items-center rounded-[11px] bg-[linear-gradient(145deg,#a855f7,#5b21b6)] text-white shadow-[0_10px_22px_rgba(139,92,246,0.28)] sm:h-11 sm:w-11 sm:rounded-[13px]">
            <ShieldCheck className="h-5 w-5 sm:h-6 sm:w-6" />
          </span>
        </span>

        <div className="min-w-0 flex-1 text-start">
          <h2 className="text-sm font-black text-slate-950 dark:text-white sm:text-base">{t("summary.securityTitle")}</h2>
          <p className="mt-0.5 max-w-[34rem] text-[9px] font-semibold leading-4 text-slate-500 dark:text-white/[0.58] sm:text-[11px]">
            {t("summary.securityDescription")}
          </p>
        </div>

        <span className="wallet-security-illustration shrink-0" aria-hidden="true">
          <img src="/security-3d.png" alt="" className="h-full w-full object-contain" decoding="async" />
        </span>
      </div>
      <div className="mt-2.5 grid grid-cols-3 gap-1.5 sm:gap-2">
        {[
          [LockKeyhole, t("summary.securityPrivacy"), t("summary.securityPrivacyDescription")],
          [Activity, t("summary.securityMonitoring"), t("summary.securityMonitoringDescription")],
          [ShieldCheck, t("summary.securityEncryption"), t("summary.securityEncryptionDescription")],
        ].map(([Icon, title, description]) => (
          <article key={title} className="wallet-security-feature min-w-0 p-2 text-start">
            <Icon className="h-4 w-4 text-violet-500" />
            <h3 className="mt-1.5 text-[10px] font-black text-slate-900 dark:text-white sm:text-xs">{title}</h3>
            <p className="mt-0.5 line-clamp-2 text-[8px] font-semibold leading-3.5 text-slate-500 dark:text-white/50 sm:text-[10px]">{description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
