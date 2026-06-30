import { useEffect, useState } from "react";
import { ChevronDown, ChevronLeft, CreditCard, Plus, ReceiptText, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getCustomerPaymentMethods } from "../api/paymentMethods";
import { getWalletSummary } from "../api/wallet";
import { useAuth } from "../context/AuthContext";

export default function WalletPage({ basePath = "/customer" }) {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [globalGroupOpen, setGlobalGroupOpen] = useState(true);
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [paymentMethodsLoading, setPaymentMethodsLoading] = useState(true);
  const [paymentMethodsError, setPaymentMethodsError] = useState("");
  const groupSubtitle =
    paymentMethods.length > 0
      ? paymentMethods.slice(0, 3).map((method) => method.title).join("، ")
      : "لا توجد طرق دفع نشطة حاليا";

  const showTransactions = () => {
    navigate(`${basePath}/wallet/transactions`);
  };

  const addPaymentMethod = (method) => {
    navigate(`${basePath}/wallet/top-up/${method.id}`);
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
          setError(requestError.userMessage || "Unable to load wallet balance.");
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
  }, [token]);

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
          setPaymentMethodsError(requestError.userMessage || "Unable to load payment methods.");
        }
      } finally {
        if (!cancelled) setPaymentMethodsLoading(false);
      }
    };

    void loadPaymentMethods();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div
      dir="rtl"
      className="-mx-4 -mt-6 min-h-[calc(100vh-124px)] overflow-hidden bg-[#F8FCFF] px-4 pb-10 pt-5 text-slate-950 dark:bg-[#020615] dark:text-white sm:-mx-6 sm:px-6 lg:-mx-8"
    >
      <div className="mx-auto w-full max-w-[760px] space-y-5">
        <BalancePanel error={error} loading={loading} onShowTransactions={showTransactions} wallet={wallet} />

        <section className="space-y-4">
          <div className="space-y-2 text-right">
            <div className="inline-flex items-center gap-3">
              <CreditCard className="h-8 w-8 text-[#8B5CF6]" />
              <h2 className="text-2xl font-black text-slate-950 dark:text-white">طرق الدفع المتاحة</h2>
            </div>
            <p className="text-base font-semibold leading-7 text-slate-500 dark:text-white/[0.46]">
              اختر طريقة الدفع المفضلة لديك أو أضف طريقة جديدة
            </p>
          </div>

          <div className="overflow-hidden rounded-[18px] border border-slate-200 bg-white/90 shadow-soft backdrop-blur-xl dark:border-white/[0.07] dark:bg-[#080d1e]/[0.96] dark:shadow-[0_16px_42px_rgba(0,0,0,0.26)]">
            <button
              type="button"
              onClick={() => setGlobalGroupOpen((isOpen) => !isOpen)}
              className="interactive-ring flex w-full items-center justify-between gap-4 px-4 py-3.5 text-right"
              aria-expanded={globalGroupOpen}
            >
              <span className="flex min-w-0 items-center gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#F5F3FF] text-[#8B5CF6] dark:bg-[#8B5CF6]/16 dark:text-[#E9D5FF]">
                  <CreditCard className="h-5 w-5" />
                </span>
                <span className="min-w-0">
                  <span className="block text-xl font-black text-slate-950 dark:text-white">عالمي</span>
                  <span className="mt-0.5 block text-xs font-semibold text-slate-500 dark:text-white/[0.48]">
                    {groupSubtitle}
                  </span>
                </span>
              </span>
              <span className="flex shrink-0 items-center gap-2">
                <span className="rounded-full bg-[#F5F3FF] px-2.5 py-1 text-xs font-black text-[#8B5CF6] dark:bg-[#8B5CF6]/16 dark:text-[#E9D5FF]">
                  {paymentMethods.length}
                </span>
                <ChevronDown className={`h-5 w-5 text-slate-400 transition ${globalGroupOpen ? "rotate-180" : ""}`} />
              </span>
            </button>

            {globalGroupOpen && (
              <div className="space-y-3 border-t border-slate-200 p-3 dark:border-white/10">
                {paymentMethodsLoading ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-7 text-center dark:border-white/10 dark:bg-white/[0.03]">
                    <p className="text-sm font-black text-slate-600 dark:text-white/70">Loading payment methods...</p>
                  </div>
                ) : paymentMethods.length > 0 ? (
                  paymentMethods.map((method) => (
                    <PaymentMethodRow key={method.id} method={method} onAdd={() => addPaymentMethod(method)} />
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-7 text-center dark:border-white/10 dark:bg-white/[0.03]">
                    <CreditCard className="mx-auto h-8 w-8 text-slate-300 dark:text-white/25" />
                    <p className="mt-3 text-sm font-black text-slate-600 dark:text-white/70">لا توجد طرق دفع نشطة حاليا</p>
                    <p className="mt-1 text-xs font-semibold text-slate-400 dark:text-white/40">
                      {paymentMethodsError || "يمكن تفعيل طريقة دفع من لوحة الإدارة."}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        <SecurityPanel />
      </div>
    </div>
  );
}

function BalancePanel({ error, loading, onShowTransactions, wallet }) {
  const balanceLabel = wallet?.balanceLabel || "$0.00";
  const currency = wallet?.currency || "";

  return (
    <section className="relative overflow-hidden rounded-[18px] border border-[#8B5CF6]/[0.16] bg-white/90 p-3 shadow-soft backdrop-blur-xl dark:border-[#8B5CF6]/[0.24] dark:bg-[#080b1d] dark:shadow-[0_14px_42px_rgba(0,0,0,0.34)] sm:p-4">
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(139,92,246,0.28),rgba(4,8,24,0)_42%),linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0))]" />
      <div className="relative flex flex-row items-center justify-between gap-3 sm:gap-5">
        <div className="min-w-0 flex-1 text-right">
          <p className="text-sm font-bold text-slate-500 dark:text-white/[0.68] sm:text-base">الرصيد الحالي</p>
          <div className="mt-2">
            <p dir="ltr" className="text-[clamp(2rem,8vw,3.25rem)] font-black leading-none text-slate-950 dark:text-white">{loading ? "..." : balanceLabel}</p>
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
            عرض سجل المعاملات
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

function PaymentMethodRow({ method, onAdd }) {
  return (
    <article
      dir="rtl"
      className="flex flex-wrap items-center gap-3 rounded-[16px] border border-slate-200 bg-white/90 p-3 shadow-soft backdrop-blur-xl dark:border-white/[0.07] dark:bg-[#080d1e]/[0.96] dark:shadow-[0_16px_42px_rgba(0,0,0,0.26)] sm:flex-nowrap sm:gap-4 sm:p-4"
    >
      <PaymentCardVisual method={method} />

      <div className="order-2 min-w-0 flex-1 text-right">
        <h3 className="text-base font-black leading-7 text-slate-950 dark:text-white sm:text-xl sm:leading-8">{method.title}</h3>
        <p className="mt-0.5 text-xs font-semibold leading-5 text-slate-500 dark:text-white/[0.48] sm:mt-1 sm:text-sm sm:leading-6">{method.description}</p>
      </div>

      <button
        type="button"
        onClick={onAdd}
        className="interactive-ring order-3 flex h-10 w-[86px] shrink-0 items-center justify-center gap-2 rounded-xl border border-[#8B5CF6]/[0.42] bg-white px-3 text-xs font-black text-[#8B5CF6] shadow-[inset_0_0_0_1px_rgba(168,85,247,0.10)] dark:border-[#8B5CF6]/[0.70] dark:bg-[#090d20] dark:text-[#A855F7] sm:h-12 sm:w-[112px] sm:gap-3 sm:px-4 sm:text-sm"
      >
        <span>إضافة</span>
        <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
      </button>
    </article>
  );
}

function PaymentCardVisual({ method }) {
  const type = getPaymentVisualType(method);

  if (type === "apple") {
    return (
      <div className="order-1 flex h-[64px] w-[126px] shrink-0 items-center justify-center rounded-xl border border-white/[0.18] bg-[linear-gradient(145deg,#ffffff,#d9dbe2)] text-2xl font-black text-[#111827] shadow-[0_16px_34px_rgba(0,0,0,0.25)] sm:h-[82px] sm:w-[198px] sm:text-4xl">
        Apple Pay
      </div>
    );
  }

  if (type === "mastercard") {
    return (
      <div className="order-1 h-[64px] w-[126px] shrink-0 overflow-hidden rounded-xl border border-white/[0.12] bg-[linear-gradient(145deg,#27304f,#11172c)] p-3 shadow-[0_16px_34px_rgba(0,0,0,0.25)] sm:h-[82px] sm:w-[198px] sm:p-4">
        <div className="flex items-start justify-between">
          <span className="relative h-7 w-14 sm:h-10 sm:w-20">
            <span className="absolute left-0 top-1 h-7 w-7 rounded-full bg-[#eb001b] sm:h-10 sm:w-10" />
            <span className="absolute left-5 top-1 h-7 w-7 rounded-full bg-[#f79e1b] mix-blend-screen sm:left-7 sm:h-10 sm:w-10" />
          </span>
          <span className="text-base font-black leading-none text-white/[0.82] sm:text-xl">)))</span>
        </div>
        <p className="mt-2 text-[9px] font-bold text-white/60 sm:mt-3 sm:text-[11px]">**** **** **** 4242</p>
      </div>
    );
  }

  if (type === "visa") {
    return (
      <div className="order-1 h-[64px] w-[126px] shrink-0 overflow-hidden rounded-xl border border-blue-300/25 bg-[linear-gradient(145deg,#0d67ff,#082b9f)] p-3 shadow-[0_16px_34px_rgba(0,0,0,0.25)] sm:h-[82px] sm:w-[198px] sm:p-4">
        <div className="flex items-start justify-between">
          <span className="h-5 w-7 rounded bg-[linear-gradient(145deg,#f7d66a,#d69f22)] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.35)] sm:h-7 sm:w-9 sm:rounded-md" />
          <span className="text-lg font-black italic leading-none text-white sm:text-2xl">VISA</span>
        </div>
        <div className="mt-2 flex items-end justify-between text-white/75 sm:mt-3">
          <p className="text-[9px] font-bold sm:text-[11px]">{method.account || "**** 4242"}</p>
          <span className="text-base font-black leading-none sm:text-xl">)))</span>
        </div>
      </div>
    );
  }

  return (
    <div className="order-1 h-[64px] w-[126px] shrink-0 overflow-hidden rounded-xl border border-blue-300/25 bg-[linear-gradient(145deg,#0d67ff,#082b9f)] p-3 shadow-[0_16px_34px_rgba(0,0,0,0.25)] sm:h-[82px] sm:w-[198px] sm:p-4">
      <div className="flex h-full flex-col justify-between">
        <div className="flex items-start justify-between gap-2">
          <span className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-lg bg-white/15 text-white sm:h-10 sm:w-10">
            {method.imageUrl || method.image ? <img src={method.imageUrl || method.image} alt="" className="h-full w-full object-contain p-1" /> : <CreditCard className="h-4 w-4" />}
          </span>
          <span className="min-w-0 truncate text-right text-[11px] font-black leading-4 text-white sm:text-sm">{method.title}</span>
        </div>
        <p className="truncate text-[9px] font-bold text-white/70 sm:text-[11px]">{method.bank || method.account || "Winnie Pay"}</p>
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

function SecurityPanel() {
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
        <h2 className="text-xl font-black text-slate-950 dark:text-white sm:text-2xl">أمان عالي وموثوق</h2>
        <p className="mt-2 text-sm font-semibold leading-7 text-slate-500 dark:text-white/[0.58]">
          نضمن لك أمان جميع معاملاتك وحماية بياناتك الشخصية بأعلى معايير الأمان
        </p>
      </div>

      <button
        type="button"
        className="interactive-ring grid h-12 w-12 shrink-0 place-items-center rounded-full border border-[#8B5CF6]/20 bg-white text-[#8B5CF6] dark:bg-[#080d20]"
        aria-label="تفاصيل الأمان"
        title="تفاصيل الأمان"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>
    </section>
  );
}
