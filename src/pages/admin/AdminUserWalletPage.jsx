import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  CircleDollarSign,
  Loader2,
  MinusCircle,
  PlusCircle,
  ReceiptText,
  RefreshCw,
  Save,
  Search,
  ShieldCheck,
  UsersRound,
  WalletCards,
  X,
} from "lucide-react";
import { createPortal } from "react-dom";
import { Link, useParams } from "react-router-dom";
import { getAdminGroups } from "../../api/adminGroups";
import {
  adjustAdminUserWallet,
  getAdminUserWallet,
  getAdminUserWalletTransactions,
  updateAdminUserCreditLimit,
} from "../../api/adminWallet";
import { updateAdminUserCurrency, updateAdminUserGroup } from "../../api/adminUsers";
import { getPublicCurrencies } from "../../api/currencies";
import { formatCurrency } from "../../api/adapters";
import { useToast } from "../../components/ToastProvider";
import { useAuth } from "../../context/AuthContext";

const pageSize = 20;
const creditChangeReason = "عميل موثوق";
const groupChangeReason = "ترقية لعميل مميز";
const defaultAdjustmentForm = { amount: "", reason: "" };
const defaultCreditForm = { creditLimit: "" };
const defaultGroupForm = { groupId: "" };
const defaultFormErrors = { account: "", adjustment: "" };

function getErrorMessage(error, fallback) {
  return error?.userMessage || error?.message || fallback;
}

function getErrorStatus(error) {
  return Number(error?.status || error?.response?.status || error?.statusCode || 0);
}

function cleanErrorDetail(message = "") {
  const detail = String(message || "").trim();
  if (!detail) return "";

  return detail
    .replace(/\s+/g, " ")
    .replace(/_/g, " ")
    .replace(/^error:\s*/i, "");
}

function buildAdminActionError(error, actionLabel) {
  const status = getErrorStatus(error);
  const detail = cleanErrorDetail(getErrorMessage(error, ""));

  if (status === 401 || status === 403) {
    return `ليس لديك صلاحية كافية لتنفيذ ${actionLabel}. تأكد من صلاحيات الحساب ثم حاول مرة أخرى.`;
  }

  if (status === 404) {
    return `تعذر العثور على المستخدم أو البيانات المطلوبة لتنفيذ ${actionLabel}. حدّث الصفحة ثم حاول مرة أخرى.`;
  }

  if (status === 409) {
    return `لا يمكن تنفيذ ${actionLabel} حاليًا بسبب تعارض في البيانات. حدّث بيانات المستخدم ثم أعد المحاولة.`;
  }

  if (status === 400 || status === 422) {
    return detail
      ? `راجع البيانات المدخلة قبل تنفيذ ${actionLabel}. السبب: ${detail}`
      : `راجع البيانات المدخلة قبل تنفيذ ${actionLabel} ثم حاول مرة أخرى.`;
  }

  if (status >= 500) {
    return `حدث عطل مؤقت أثناء تنفيذ ${actionLabel}. حاول مرة أخرى بعد لحظات.`;
  }

  return detail
    ? `لم يكتمل ${actionLabel}. السبب: ${detail}`
    : `لم يكتمل ${actionLabel}. راجع البيانات وحاول مرة أخرى.`;
}

function parsePositiveAmount(value) {
  const amount = Number(value);
  return Number.isFinite(amount) && amount > 0 ? amount : null;
}

function parseNonNegativeAmount(value) {
  const amount = Number(value);
  return Number.isFinite(amount) && amount >= 0 ? amount : null;
}

export default function AdminUserWalletPage() {
  const { id } = useParams();
  const { token } = useAuth();
  const { showToast } = useToast();
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: pageSize, total: 0, pages: 1 });
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [groups, setGroups] = useState([]);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [groupsError, setGroupsError] = useState("");
  const [currencies, setCurrencies] = useState([]);
  const [currenciesLoading, setCurrenciesLoading] = useState(false);
  const [currencyCode, setCurrencyCode] = useState("");
  const [actionKey, setActionKey] = useState("");
  const [walletConfirmation, setWalletConfirmation] = useState(null);
  const [adjustmentForm, setAdjustmentForm] = useState(defaultAdjustmentForm);
  const [creditForm, setCreditForm] = useState(defaultCreditForm);
  const [groupForm, setGroupForm] = useState(defaultGroupForm);
  const [formErrors, setFormErrors] = useState(defaultFormErrors);

  const load = useCallback(async () => {
    if (!token || !id) return;

    setLoading(true);
    setError("");

    try {
      const [walletResult, transactionResult] = await Promise.all([
        getAdminUserWallet(token, id),
        getAdminUserWalletTransactions(token, id, { page, limit: pageSize }),
      ]);
      const nextWallet = walletResult.wallet;
      setWallet(nextWallet);
      setTransactions(transactionResult.transactions);
      setPagination(transactionResult.pagination);
      setCreditForm((current) => ({
        creditLimit: current.creditLimit === "" ? String(nextWallet.creditLimit || 0) : current.creditLimit,
      }));
      setGroupForm((current) => ({
        groupId: current.groupId || nextWallet.user?.group?.id || "",
      }));
      setCurrencyCode((current) => current || nextWallet.currency || "USD");
    } catch (requestError) {
      setWallet(null);
      setTransactions([]);
      setPagination({ page, limit: pageSize, total: 0, pages: 1 });
      setError(getErrorMessage(requestError, "تعذر تحميل سجل محفظة هذا المستخدم."));
    } finally {
      setLoading(false);
    }
  }, [id, page, token]);

  const loadGroups = useCallback(async () => {
    if (!token) return;

    setGroupsLoading(true);
    setGroupsError("");
    try {
      const result = await getAdminGroups(token);
      setGroups(result.groups);
    } catch (requestError) {
      setGroups([]);
      setGroupsError(getErrorMessage(requestError, "تعذر تحميل مجموعات التسعير النشطة."));
    } finally {
      setGroupsLoading(false);
    }
  }, [token]);

  const loadCurrencies = useCallback(async () => {
    setCurrenciesLoading(true);
    try {
      const result = await getPublicCurrencies();
      setCurrencies(result.currencies.filter((item) => item.isActive && item.code));
    } catch (requestError) {
      setCurrencies([]);
      setGroupsError(getErrorMessage(requestError, "تعذر تحميل العملات النشطة."));
    } finally {
      setCurrenciesLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    void loadGroups();
  }, [loadGroups]);

  useEffect(() => {
    void loadCurrencies();
  }, [loadCurrencies]);

  const filteredTransactions = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return transactions;

    return transactions.filter((transaction) => [
      transaction.id,
      transaction.description,
      transaction.semanticTypeLabel,
      transaction.sourceType,
      transaction.statusLabel,
      transaction.directionLabel,
    ].join(" ").toLowerCase().includes(needle));
  }, [query, transactions]);

  const user = wallet?.user;
  const currency = wallet?.currency || user?.currency || "USD";
  const currentGroup = user?.group;

  const handleAdjustment = async (type) => {
    if (!token || !id) return;
    setFormErrors((current) => ({ ...current, adjustment: "" }));

    const amount = parsePositiveAmount(adjustmentForm.amount);
    if (!amount) {
      const message = "اكتب مبلغًا صحيحًا أكبر من صفر قبل تنفيذ العملية.";
      setFormErrors((current) => ({ ...current, adjustment: message }));
      showToast({ type: "error", title: "المبلغ غير صالح", message });
      return;
    }

    const reason = adjustmentForm.reason.trim();
    if (!reason) {
      const message = "يجب كتابة سبب التعديل قبل تنفيذ العملية";
      setFormErrors((current) => ({ ...current, adjustment: message }));
      showToast({ type: "error", title: "سبب التعديل مطلوب", message });
      return;
    }

    const balanceBefore = Number(wallet?.balance || 0);
    const balanceAfter = type === "DEDUCT" ? balanceBefore - amount : balanceBefore + amount;
    setWalletConfirmation({ type, amount, reason, balanceBefore, balanceAfter });
  };

  const confirmWalletAdjustment = async () => {
    if (!walletConfirmation || !token || !id) return;

    const { type, amount, reason } = walletConfirmation;

    setActionKey(`wallet:${type}`);
    try {
      const result = await adjustAdminUserWallet(token, id, { type, amount, reason });
      showToast({
        type: "success",
        title: type === "DEDUCT" ? "تم خصم الرصيد" : "تمت زيادة الرصيد",
        message: result.message || `تم تنفيذ العملية بقيمة ${formatCurrency(amount, currency, "ar-EG-u-nu-latn")}.`,
      });
      setWalletConfirmation(null);
      setAdjustmentForm(defaultAdjustmentForm);
      setFormErrors((current) => ({ ...current, adjustment: "" }));
      await load();
    } catch (requestError) {
      const missingReason = requestError?.code === "ADJUSTMENT_REASON_REQUIRED" ||
        requestError?.fieldErrors?.reason ||
        /reason/i.test(String(requestError?.message || requestError?.userMessage || ""));
      const message = missingReason
        ? "يجب كتابة سبب التعديل قبل تنفيذ العملية"
        : buildAdminActionError(requestError, type === "DEDUCT" ? "خصم الرصيد" : "زيادة الرصيد");
      setFormErrors((current) => ({ ...current, adjustment: message }));
      showToast({
        type: "error",
        title: "فشل تعديل المحفظة",
        message,
      });
    } finally {
      setActionKey("");
    }
  };

  const handleAccountSettings = async () => {
    if (!token || !id) return;
    setFormErrors((current) => ({ ...current, account: "" }));

    const creditLimit = parseNonNegativeAmount(creditForm.creditLimit);
    const groupId = groupForm.groupId;
    const nextCurrency = String(currencyCode || "").trim().toUpperCase();
    if (creditLimit === null) {
      const message = "اكتب قيمة صحيحة لحد الائتمان. لا يمكن أن يكون الحد فارغًا أو سالبًا.";
      setFormErrors((current) => ({ ...current, account: message }));
      showToast({ type: "error", title: "تعذر حفظ الإعدادات", message });
      return;
    }
    if (!groupId) {
      const message = "اختر مجموعة تسعير نشطة قبل حفظ التغيير.";
      setFormErrors((current) => ({ ...current, account: message }));
      showToast({ type: "error", title: "تعذر حفظ الإعدادات", message });
      return;
    }
    if (!nextCurrency) {
      const message = "اختر عملة نشطة للمستخدم قبل حفظ التغيير.";
      setFormErrors((current) => ({ ...current, account: message }));
      showToast({ type: "error", title: "تعذر حفظ الإعدادات", message });
      return;
    }

    const creditChanged = creditLimit !== Number(wallet?.creditLimit || 0);
    const groupChanged = groupId !== (currentGroup?.id || "");
    const currencyChanged = nextCurrency !== currency;
    if (!creditChanged && !groupChanged && !currencyChanged) {
      showToast({ type: "info", title: "لا توجد تغييرات", message: "الإعدادات المحددة محفوظة بالفعل." });
      return;
    }
    if (!window.confirm(`هل تريد حفظ إعدادات حساب ${user?.name || "هذا المستخدم"}؟`)) return;

    setActionKey("account-settings");
    try {
      if (creditChanged) {
        await updateAdminUserCreditLimit(token, id, { creditLimit, reason: creditChangeReason });
      }
      if (groupChanged) {
        await updateAdminUserGroup(token, id, { groupId, reason: groupChangeReason });
      }
      if (currencyChanged) {
        await updateAdminUserCurrency(token, id, nextCurrency);
      }

      showToast({ type: "success", title: "تم حفظ إعدادات الحساب", message: "تم تحديث البيانات بنجاح." });
      setCreditForm({ ...defaultCreditForm, creditLimit: String(creditLimit) });
      setGroupForm({ ...defaultGroupForm, groupId });
      setCurrencyCode(nextCurrency);
      setFormErrors((current) => ({ ...current, account: "" }));
      await load();
    } catch (requestError) {
      const message = buildAdminActionError(requestError, "حفظ إعدادات الحساب");
      setFormErrors((current) => ({ ...current, account: message }));
      showToast({
        type: "error",
        title: "تعذر حفظ إعدادات الحساب",
        message,
      });
      await load();
    } finally {
      setActionKey("");
    }
  };

  return (
    <div dir="rtl" className="space-y-4">
      <section className="flex flex-wrap items-center gap-3 rounded-[24px] border border-violet-200 bg-white p-4 dark:border-white/10 dark:bg-[#111827]">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-violet-600 text-white">
          <WalletCards className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[9px] font-black text-violet-500">المحفظة والتحكم</p>
          <h1 className="truncate text-2xl font-black text-slate-950 dark:text-white">
            {user?.name || "المحفظة والمعاملات"}
          </h1>
          <p dir="ltr" className="mt-1 text-left text-[10px] font-bold text-slate-400">{user?.email || id}</p>
        </div>
        <button
          type="button"
          onClick={() => { void load(); void loadGroups(); void loadCurrencies(); }}
          disabled={loading || groupsLoading || currenciesLoading}
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-[10px] font-black text-slate-600 disabled:opacity-60 dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-300"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          تحديث
        </button>
        <Link to="/admin/tools/users" className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-900 px-3 text-[10px] font-black text-white dark:bg-white dark:text-slate-950">
          <ArrowLeft className="h-4 w-4" />
          المستخدمون
        </Link>
      </section>

      {error && (
        <p className="rounded-2xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700 dark:border-rose-400/20 dark:bg-rose-500/10 dark:text-rose-200">
          {error}
        </p>
      )}

      {groupsError && (
        <p className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800 dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-200">
          {groupsError}
        </p>
      )}

      <section className="grid grid-cols-3 gap-2 sm:gap-3">
        <SummaryCard icon={CircleDollarSign} label="رصيد المحفظة" value={wallet?.balanceLabel || formatCurrency(0, currency, "ar-EG-u-nu-latn")} />
        <SummaryCard icon={ShieldCheck} label="حد الائتمان" value={wallet?.creditLimitLabel || formatCurrency(0, currency, "ar-EG-u-nu-latn")} />
        <SummaryCard label="الائتمان المستخدم" value={wallet?.creditUsedLabel || formatCurrency(0, currency, "ar-EG-u-nu-latn")} />
        <SummaryCard icon={ReceiptText} label="حركات السجل المالي" value={`${pagination.total || 0}`} />
      </section>

      <section className="grid items-stretch gap-4 xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <ControlCard icon={WalletCards} title="تعديل الرصيد" subtitle={`تُحتسب المبالغ بعملة ${currency}، وكل تعديل ينشئ حركة في السجل المالي.`}>
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3 dark:border-white/10 dark:bg-[#0B1220]">
            <FormField label="المبلغ">
              <input
                dir="ltr"
                min="0"
                step="0.01"
                type="number"
                value={adjustmentForm.amount}
                onChange={(event) => {
                  setAdjustmentForm((current) => ({ ...current, amount: event.target.value }));
                  setFormErrors((current) => ({ ...current, adjustment: "" }));
                }}
                placeholder="0.00"
              />
            </FormField>
            <FormField label="سبب التعديل">
              <textarea
                value={adjustmentForm.reason}
                onChange={(event) => {
                  setAdjustmentForm((current) => ({ ...current, reason: event.target.value }));
                  setFormErrors((current) => ({ ...current, adjustment: "" }));
                }}
                maxLength={500}
                placeholder="اكتب سبب الزيادة أو الخصم"
                rows={3}
              />
            </FormField>
          </div>
          <InlineActionError message={formErrors.adjustment} title="لم يتم تنفيذ العملية" />
          <div className="mt-auto grid grid-cols-2 gap-2 pt-4">
            <ActionButton
              icon={PlusCircle}
              busy={actionKey === "wallet:ADD"}
              disabled={Boolean(actionKey) || loading}
              label="زيادة"
              tone="success"
              onClick={() => void handleAdjustment("ADD")}
            />
            <ActionButton
              icon={MinusCircle}
              busy={actionKey === "wallet:DEDUCT"}
              disabled={Boolean(actionKey) || loading}
              label="خصم"
              tone="danger"
              onClick={() => void handleAdjustment("DEDUCT")}
            />
          </div>
        </ControlCard>

        <ControlCard icon={UsersRound} title="إعدادات الحساب">
          <div className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-3 dark:border-white/10 dark:bg-[#0B1220] sm:grid-cols-3">
            <FormField label="حد الائتمان">
              <input
                dir="ltr"
                min="0"
                step="0.01"
                type="number"
                value={creditForm.creditLimit}
                onChange={(event) => {
                  setCreditForm((current) => ({ ...current, creditLimit: event.target.value }));
                  setFormErrors((current) => ({ ...current, account: "" }));
                }}
              />
            </FormField>
            <FormField label="مجموعة التسعير">
              <select
                value={groupForm.groupId}
                onChange={(event) => {
                  setGroupForm((current) => ({ ...current, groupId: event.target.value }));
                  setFormErrors((current) => ({ ...current, account: "" }));
                }}
                disabled={groupsLoading}
              >
                <option value="">{groupsLoading ? "جارٍ تحميل المجموعات..." : "اختر مجموعة"}</option>
                {groups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name} ({group.percentage}%)
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="العملة">
              <select
                dir="ltr"
                value={currencyCode}
                onChange={(event) => {
                  setCurrencyCode(event.target.value);
                  setFormErrors((current) => ({ ...current, account: "" }));
                }}
                disabled={currenciesLoading}
              >
                {!currencies.some((item) => item.code === currencyCode) && currencyCode && (
                  <option value={currencyCode}>{currencyCode}</option>
                )}
                {currencies.map((item) => (
                  <option key={item.code} value={item.code}>{item.code}</option>
                ))}
              </select>
            </FormField>
          </div>
          <InlineActionError message={formErrors.account} />
          <div className="mt-auto pt-4">
            <ActionButton
              className="w-full"
              icon={Save}
              busy={actionKey === "account-settings"}
              disabled={Boolean(actionKey) || loading || groupsLoading || currenciesLoading || !groups.length || !currencyCode}
              label="حفظ الإعدادات"
              onClick={() => void handleAccountSettings()}
            />
          </div>
        </ControlCard>
      </section>

      <WalletAdjustmentDialog
        busy={Boolean(actionKey)}
        confirmation={walletConfirmation}
        currency={currency}
        userName={user?.name || "هذا المستخدم"}
        onCancel={() => {
          if (!actionKey) setWalletConfirmation(null);
        }}
        onConfirm={() => void confirmWalletAdjustment()}
      />

      <section className="rounded-[22px] border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-[#111827]">
        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-black text-slate-950 dark:text-white">سجل المعاملات</h2>
            <p className="text-[9px] font-bold text-slate-400">{pagination.total} حركة في السجل المالي</p>
          </div>
          <label className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-violet-500" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="ابحث في المعاملات المحملة"
              className="h-11 w-full rounded-2xl bg-slate-50 pe-9 ps-3 text-[10px] font-black outline-none dark:bg-[#0B1220] dark:text-white"
            />
          </label>
        </div>

        <div className="mt-4 space-y-2">
          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm font-black text-slate-500 dark:border-white/10 dark:bg-[#0B1220] dark:text-slate-300">
              جارٍ تحميل حركات المحفظة...
            </div>
          ) : filteredTransactions.length ? (
            filteredTransactions.map((transaction) => (
              <TransactionRow key={transaction.id} transaction={transaction} />
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-10 text-center dark:border-white/10">
              <ReceiptText className="mx-auto h-8 w-8 text-slate-300 dark:text-white/20" />
              <p className="mt-3 text-sm font-black text-slate-500 dark:text-white/50">لا توجد معاملات في المحفظة.</p>
            </div>
          )}
        </div>

        {!loading && !error && pagination.pages > 1 && (
          <div className="mt-4 flex items-center justify-between gap-3">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              className="h-10 rounded-xl border border-slate-200 px-4 text-[10px] font-black disabled:opacity-45 dark:border-white/10 dark:text-white"
            >
              السابق
            </button>
            <span className="text-[10px] font-black text-slate-500 dark:text-slate-300">
              صفحة {pagination.page} من {pagination.pages}
            </span>
            <button
              type="button"
              disabled={page >= pagination.pages}
              onClick={() => setPage((current) => Math.min(pagination.pages, current + 1))}
              className="h-10 rounded-xl border border-slate-200 px-4 text-[10px] font-black disabled:opacity-45 dark:border-white/10 dark:text-white"
            >
              التالي
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

function WalletAdjustmentDialog({ busy, confirmation, currency, userName, onCancel, onConfirm }) {
  if (!confirmation) return null;

  const deduct = confirmation.type === "DEDUCT";
  const amountLabel = formatCurrency(confirmation.amount, currency, "ar-EG-u-nu-latn");
  const beforeLabel = formatCurrency(confirmation.balanceBefore, currency, "ar-EG-u-nu-latn");
  const afterLabel = formatCurrency(confirmation.balanceAfter, currency, "ar-EG-u-nu-latn");
  const negativeBalance = confirmation.balanceAfter < 0;

  return createPortal(
    <div
      className="fixed inset-0 z-[100200] grid place-items-center bg-slate-950/65 p-4 backdrop-blur-md"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) onCancel();
      }}
    >
      <section
        dir="rtl"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="wallet-adjustment-confirm-title"
        className={`w-full max-w-[460px] overflow-hidden rounded-[24px] border bg-white shadow-[0_30px_90px_rgba(15,23,42,0.36)] dark:bg-[#111827] ${deduct ? "border-rose-200 dark:border-rose-400/20" : "border-emerald-200 dark:border-emerald-400/20"}`}
      >
        <div className={`h-1 w-full ${deduct ? "bg-gradient-to-l from-rose-600 to-orange-400" : "bg-gradient-to-l from-emerald-600 to-cyan-400"}`} />
        <div className="p-5">
          <div className="flex items-start gap-3">
            <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${deduct ? "bg-rose-500/10 text-rose-600 dark:text-rose-300" : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"}`}>
              {deduct ? <AlertTriangle className="h-6 w-6" /> : <PlusCircle className="h-6 w-6" />}
            </span>
            <div className="min-w-0 flex-1">
              <h2 id="wallet-adjustment-confirm-title" className="text-lg font-black text-slate-950 dark:text-white">
                {deduct ? "تحذير: تأكيد خصم الرصيد" : "تأكيد زيادة الرصيد"}
              </h2>
              <p className="mt-1 text-xs font-bold leading-6 text-slate-500 dark:text-slate-300">
                {deduct
                  ? `سيتم خصم ${amountLabel} من محفظة ${userName} وإنشاء حركة في السجل المالي.`
                  : `سيتم إضافة ${amountLabel} إلى محفظة ${userName} وإنشاء حركة في السجل المالي.`}
              </p>
            </div>
            <button
              type="button"
              onClick={onCancel}
              disabled={busy}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50 dark:hover:bg-white/[0.07] dark:hover:text-white"
              aria-label="إغلاق"
              title="إغلاق"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-2">
            <AdjustmentValue label="الرصيد الحالي" value={beforeLabel} />
            <AdjustmentValue label={deduct ? "قيمة الخصم" : "قيمة الزيادة"} value={`${deduct ? "-" : "+"}${amountLabel}`} tone={deduct ? "danger" : "success"} />
            <AdjustmentValue label="الرصيد بعد العملية" value={afterLabel} tone={negativeBalance ? "danger" : "default"} />
          </div>

          {deduct && (
            <p className={`mt-3 rounded-2xl border px-3 py-2.5 text-xs font-black leading-6 ${negativeBalance ? "border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-400/20 dark:bg-rose-500/10 dark:text-rose-200" : "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-200"}`}>
              {negativeBalance
                ? "تنبيه: قيمة الخصم أكبر من الرصيد الحالي وستجعل الرصيد سالبًا. قد يرفض الخادم العملية."
                : "راجع المبلغ جيدًا؛ عملية الخصم ستؤثر مباشرة في رصيد المستخدم."}
            </p>
          )}

          <div className="mt-5 grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={onCancel}
              disabled={busy}
              className="h-11 rounded-2xl border border-slate-200 bg-white text-xs font-black text-slate-600 transition hover:bg-slate-50 disabled:opacity-50 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300"
            >
              إلغاء
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={busy}
              className={`inline-flex h-11 items-center justify-center gap-2 rounded-2xl text-xs font-black text-white shadow-lg transition hover:-translate-y-0.5 disabled:opacity-60 disabled:hover:translate-y-0 ${deduct ? "bg-gradient-to-l from-rose-600 to-red-500 shadow-rose-500/20" : "bg-gradient-to-l from-emerald-600 to-teal-500 shadow-emerald-500/20"}`}
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : deduct ? <MinusCircle className="h-4 w-4" /> : <PlusCircle className="h-4 w-4" />}
              {busy ? "جارٍ التنفيذ..." : deduct ? "تأكيد الخصم" : "تأكيد الزيادة"}
            </button>
          </div>
        </div>
      </section>
    </div>,
    document.body,
  );
}

function AdjustmentValue({ label, value, tone = "default" }) {
  const toneClass = tone === "danger"
    ? "text-rose-600 dark:text-rose-300"
    : tone === "success"
      ? "text-emerald-600 dark:text-emerald-300"
      : "text-slate-950 dark:text-white";

  return (
    <div className="min-w-0 rounded-2xl border border-slate-200 bg-slate-50 p-2.5 text-center dark:border-white/10 dark:bg-[#0B1220]">
      <span className="block text-[8px] font-black leading-4 text-slate-400">{label}</span>
      <strong dir="ltr" className={`mt-1 block break-words text-[11px] font-black ${toneClass}`}>{value}</strong>
    </div>
  );
}

function SummaryCard({ icon: Icon = WalletCards, label, value }) {
  return (
    <article className="min-w-0 rounded-[16px] border border-slate-200 bg-white p-2.5 dark:border-white/10 dark:bg-[#111827] sm:rounded-[20px] sm:p-4">
      <Icon className="h-7 w-7 rounded-lg bg-violet-500/10 p-1.5 text-violet-600 dark:text-violet-300 sm:h-8 sm:w-8 sm:rounded-xl sm:p-2" />
      <p className="mt-2 min-h-8 text-[8px] font-black leading-4 text-slate-400 sm:mt-3 sm:min-h-0 sm:text-[9px]">{label}</p>
      <strong dir="ltr" className="mt-1 block break-words text-right text-[11px] font-black leading-4 text-slate-950 dark:text-white sm:text-xl sm:leading-normal">{value}</strong>
    </article>
  );
}

function ControlCard({ icon: Icon, title, subtitle, children }) {
  return (
    <section className="flex h-full min-w-0 flex-col rounded-[22px] border border-slate-200 bg-white p-4 shadow-[0_16px_38px_rgba(15,23,42,0.05)] dark:border-white/10 dark:bg-[#111827] dark:shadow-[0_18px_42px_rgba(0,0,0,0.18)]">
      <div className="mb-4 flex min-h-[58px] items-start gap-3 border-b border-slate-100 pb-4 dark:border-white/[0.07]">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-violet-500/10 text-violet-600 dark:text-violet-300">
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <h2 className="text-sm font-black leading-6 text-slate-950 dark:text-white">{title}</h2>
          {subtitle && <p className="mt-1 text-[10px] font-bold leading-5 text-slate-400">{subtitle}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

function FormField({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[10px] font-black text-slate-500 dark:text-slate-300">{label}</span>
      <span className="block [&>input]:h-12 [&>input]:w-full [&>input]:rounded-xl [&>input]:border [&>input]:border-slate-200 [&>input]:bg-white [&>input]:px-3.5 [&>input]:text-base [&>input]:font-black [&>input]:text-slate-950 [&>input]:outline-none [&>input]:transition [&>input]:focus:border-violet-400 [&>input]:focus:ring-4 [&>input]:focus:ring-violet-500/10 [&>input]:dark:border-white/10 [&>input]:dark:bg-[#111827] [&>input]:dark:text-white [&>select]:h-12 [&>select]:w-full [&>select]:rounded-xl [&>select]:border [&>select]:border-slate-200 [&>select]:bg-white [&>select]:px-3.5 [&>select]:text-sm [&>select]:font-black [&>select]:text-slate-950 [&>select]:outline-none [&>select]:transition [&>select]:focus:border-violet-400 [&>select]:focus:ring-4 [&>select]:focus:ring-violet-500/10 [&>select]:dark:border-white/10 [&>select]:dark:bg-[#111827] [&>select]:dark:text-white [&>textarea]:min-h-24 [&>textarea]:w-full [&>textarea]:resize-y [&>textarea]:rounded-xl [&>textarea]:border [&>textarea]:border-slate-200 [&>textarea]:bg-white [&>textarea]:px-3.5 [&>textarea]:py-3 [&>textarea]:text-sm [&>textarea]:font-bold [&>textarea]:leading-6 [&>textarea]:text-slate-950 [&>textarea]:outline-none [&>textarea]:transition [&>textarea]:focus:border-violet-400 [&>textarea]:focus:ring-4 [&>textarea]:focus:ring-violet-500/10 [&>textarea]:dark:border-white/10 [&>textarea]:dark:bg-[#111827] [&>textarea]:dark:text-white">
        {children}
      </span>
    </label>
  );
}

function InlineActionError({ message, title = "لم يتم حفظ التغيير" }) {
  if (!message) return null;

  return (
    <div className="mt-3 flex items-start gap-2.5 rounded-2xl border border-rose-200 bg-rose-50/90 px-3 py-2.5 text-right shadow-[0_14px_32px_rgba(225,29,72,0.08)] dark:border-rose-400/20 dark:bg-rose-500/10">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-300">
        <AlertTriangle className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-black text-rose-700 dark:text-rose-200">{title}</p>
        <p className="mt-0.5 text-[11px] font-bold leading-5 text-rose-600 dark:text-rose-200/85">{message}</p>
      </div>
    </div>
  );
}

function ActionButton({ icon: Icon, label, busy, disabled, tone = "default", className = "", onClick }) {
  const toneClass = tone === "success"
    ? "bg-emerald-600 text-white hover:bg-emerald-700"
    : tone === "danger"
      ? "bg-rose-600 text-white hover:bg-rose-700"
      : "bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || busy}
      className={`inline-flex h-12 items-center justify-center gap-2 rounded-xl px-4 text-[11px] font-black shadow-sm transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 ${toneClass} ${className}`}
    >
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />}
      {busy ? "جارٍ الحفظ..." : label}
    </button>
  );
}

function TransactionRow({ transaction }) {
  const credit = transaction.direction === "CREDIT";

  return (
    <article className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-[#0B1220] sm:grid-cols-[1fr_auto]">
      <div className="min-w-0">
        <p className="truncate text-sm font-black text-slate-900 dark:text-white">{transaction.description}</p>
        <p className="mt-1 text-[9px] font-bold text-slate-400">
          {translateWalletType(transaction.semanticTypeLabel)} - {translateWalletType(transaction.sourceType || "WALLET")} - {transaction.dateLabel}
        </p>
      </div>
      <div className="text-left">
        <strong dir="ltr" className={credit ? "text-sm font-black text-emerald-600" : "text-sm font-black text-rose-600"}>
          {transaction.amountLabel}
        </strong>
        <p dir="ltr" className="mt-1 text-[9px] font-bold text-slate-400">
          {transaction.balanceBefore.toFixed(2)} {"->"} {transaction.balanceAfter.toFixed(2)} {transaction.currency}
        </p>
      </div>
    </article>
  );
}

function translateWalletType(value) {
  const key = String(value || "").toUpperCase().replace(/[ -]+/g, "_");
  return {
    WALLET: "المحفظة",
    CREDIT: "إضافة رصيد",
    DEBIT: "خصم رصيد",
    ADMIN_ADJUSTMENT: "تعديل إداري",
    MANUAL_TOPUP: "شحن يدوي",
    ORDER: "طلب",
    PAYMENT: "دفعة",
    REFUND: "استرداد",
  }[key] || value;
}
