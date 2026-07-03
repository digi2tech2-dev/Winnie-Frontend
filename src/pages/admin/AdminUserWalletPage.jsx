import { useCallback, useEffect, useMemo, useState } from "react";
import {
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
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { getAdminGroups } from "../../api/adminGroups";
import {
  adjustAdminUserWallet,
  getAdminUserWallet,
  getAdminUserWalletTransactions,
  updateAdminUserCreditLimit,
} from "../../api/adminWallet";
import { updateAdminUserGroup } from "../../api/adminUsers";
import { formatCurrency } from "../../api/adapters";
import { useToast } from "../../components/ToastProvider";
import { useAuth } from "../../context/AuthContext";

const pageSize = 20;
const walletReasonPresets = [
  { value: "MANUAL_TOPUP", label: "شحن يدوي", english: "Manual top-up" },
  { value: "BALANCE_SETTLEMENT", label: "تسوية رصيد", english: "Balance settlement" },
  { value: "ORDER_COMPENSATION", label: "تعويض طلب", english: "Order compensation" },
  { value: "ADMIN_DEDUCTION", label: "خصم إداري", english: "Administrative deduction" },
  { value: "CORRECTION", label: "تصحيح خطأ", english: "Correction" },
  { value: "OTHER", label: "أخرى", english: "Other" },
];
const creditReasonPresets = [
  { value: "TRUSTED_CUSTOMER", label: "عميل موثوق", english: "Trusted customer" },
  { value: "RESELLER", label: "وكيل / موزع", english: "Agent / reseller" },
  { value: "ADMIN_SETTLEMENT", label: "تسوية إدارية", english: "Administrative settlement" },
  { value: "LIMIT_REDUCTION", label: "تخفيض الحد", english: "Limit reduction" },
  { value: "OTHER", label: "أخرى", english: "Other" },
];
const groupReasonPresets = [
  { value: "VIP_UPGRADE", label: "ترقية لعميل مميز", english: "Upgrade to premium customer" },
  { value: "RESELLER_TRANSFER", label: "تحويل لموزع", english: "Move to reseller" },
  { value: "GROUP_CORRECTION", label: "تصحيح مجموعة", english: "Group correction" },
  { value: "ADMIN_REQUEST", label: "طلب إداري", english: "Administrative request" },
  { value: "OTHER", label: "أخرى", english: "Other" },
];

const defaultAdjustmentForm = { amount: "", reasonPreset: "MANUAL_TOPUP", reasonNote: "" };
const defaultCreditForm = { creditLimit: "", reasonPreset: "TRUSTED_CUSTOMER", reasonNote: "" };
const defaultGroupForm = { groupId: "", reasonPreset: "VIP_UPGRADE", reasonNote: "" };

function getErrorMessage(error, fallback) {
  return error?.userMessage || error?.message || fallback;
}

function parsePositiveAmount(value) {
  const amount = Number(value);
  return Number.isFinite(amount) && amount > 0 ? amount : null;
}

function parseNonNegativeAmount(value) {
  const amount = Number(value);
  return Number.isFinite(amount) && amount >= 0 ? amount : null;
}

function buildPresetReason(form, options, contextLabel) {
  const preset = options.find((item) => item.value === form.reasonPreset);
  const note = String(form.reasonNote || "").trim();

  if (!preset) {
    return { error: `Choose a reason preset for ${contextLabel}.` };
  }

  if (preset.value === "OTHER" && note.length < 3) {
    return { error: "Additional note is required when the reason is أخرى." };
  }

  const reason = preset.value === "OTHER"
    ? `${preset.english} - ${preset.label}: ${note}`
    : `${preset.english} - ${preset.label}${note ? `: ${note}` : ""}`;

  if (reason.length > 255) {
    return { error: "Reason is too long. Keep the additional note shorter." };
  }

  return { reason };
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
  const [actionKey, setActionKey] = useState("");
  const [adjustmentForm, setAdjustmentForm] = useState(defaultAdjustmentForm);
  const [creditForm, setCreditForm] = useState(defaultCreditForm);
  const [groupForm, setGroupForm] = useState(defaultGroupForm);

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
        ...current,
        creditLimit: current.reasonNote || current.reasonPreset !== defaultCreditForm.reasonPreset
          ? current.creditLimit
          : String(nextWallet.creditLimit || 0),
      }));
      setGroupForm((current) => ({
        ...current,
        groupId: current.reasonNote || current.reasonPreset !== defaultGroupForm.reasonPreset
          ? current.groupId
          : (nextWallet.user?.group?.id || ""),
      }));
    } catch (requestError) {
      setWallet(null);
      setTransactions([]);
      setPagination({ page, limit: pageSize, total: 0, pages: 1 });
      setError(getErrorMessage(requestError, "Unable to load this user's wallet history."));
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
      setGroupsError(getErrorMessage(requestError, "Unable to load active pricing groups."));
    } finally {
      setGroupsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    void loadGroups();
  }, [loadGroups]);

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

    const amount = parsePositiveAmount(adjustmentForm.amount);
    const reasonResult = buildPresetReason(adjustmentForm, walletReasonPresets, "wallet adjustment");
    if (!amount) {
      showToast({ type: "error", title: "Invalid amount", message: "Amount must be greater than zero." });
      return;
    }
    if (reasonResult.error) {
      showToast({ type: "error", title: "Reason required", message: reasonResult.error });
      return;
    }
    const { reason } = reasonResult;

    const actionLabel = type === "DEDUCT" ? "deduct" : "add";
    const confirmMessage = `${actionLabel === "deduct" ? "Deduct" : "Add"} ${amount} ${currency} ${actionLabel === "deduct" ? "from" : "to"} ${user?.name || "this user"}?`;
    if (!window.confirm(confirmMessage)) return;

    setActionKey(`wallet:${type}`);
    try {
      const result = await adjustAdminUserWallet(token, id, { type, amount, reason });
      showToast({ type: "success", title: result.message || "Wallet adjusted" });
      setAdjustmentForm(defaultAdjustmentForm);
      await load();
    } catch (requestError) {
      showToast({
        type: "error",
        title: "Wallet adjustment failed",
        message: getErrorMessage(requestError, "Could not adjust this wallet."),
      });
    } finally {
      setActionKey("");
    }
  };

  const handleCreditLimit = async () => {
    if (!token || !id) return;

    const creditLimit = parseNonNegativeAmount(creditForm.creditLimit);
    const reasonResult = buildPresetReason(creditForm, creditReasonPresets, "credit limit");
    if (creditLimit === null) {
      showToast({ type: "error", title: "Invalid credit limit", message: "Credit limit cannot be negative." });
      return;
    }
    if (reasonResult.error) {
      showToast({ type: "error", title: "Reason required", message: reasonResult.error });
      return;
    }
    const { reason } = reasonResult;
    if (!window.confirm(`Set credit limit to ${creditLimit} ${currency} for ${user?.name || "this user"}?`)) return;

    setActionKey("credit-limit");
    try {
      const result = await updateAdminUserCreditLimit(token, id, { creditLimit, reason });
      showToast({ type: "success", title: result.message || "Credit limit updated" });
      setCreditForm({ ...defaultCreditForm, creditLimit: String(creditLimit) });
      await load();
    } catch (requestError) {
      showToast({
        type: "error",
        title: "Credit limit not updated",
        message: getErrorMessage(requestError, "Could not update this user's credit limit."),
      });
    } finally {
      setActionKey("");
    }
  };

  const handleGroupChange = async () => {
    if (!token || !id) return;

    const groupId = groupForm.groupId;
    const reasonResult = buildPresetReason(groupForm, groupReasonPresets, "group assignment");
    const nextGroup = groups.find((group) => group.id === groupId);
    if (!groupId) {
      showToast({ type: "error", title: "Group required", message: "Choose an active pricing group." });
      return;
    }
    if (reasonResult.error) {
      showToast({ type: "error", title: "Reason required", message: reasonResult.error });
      return;
    }
    const { reason } = reasonResult;
    if (!window.confirm(`Move ${user?.name || "this user"} to ${nextGroup?.name || "the selected group"}?`)) return;

    setActionKey("group");
    try {
      const result = await updateAdminUserGroup(token, id, { groupId, reason });
      showToast({ type: "success", title: result.message || "User group updated" });
      setGroupForm({ ...defaultGroupForm, groupId });
      await load();
    } catch (requestError) {
      showToast({
        type: "error",
        title: "Group not updated",
        message: getErrorMessage(requestError, "Could not change this user's group."),
      });
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
          <p className="text-[9px] font-black uppercase text-violet-500">Wallet & Controls</p>
          <h1 className="truncate text-2xl font-black text-slate-950 dark:text-white">
            {user?.name || "Wallet and transactions"}
          </h1>
          <p dir="ltr" className="mt-1 text-left text-[10px] font-bold text-slate-400">{user?.email || id}</p>
        </div>
        <button
          type="button"
          onClick={() => { void load(); void loadGroups(); }}
          disabled={loading || groupsLoading}
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-[10px] font-black text-slate-600 disabled:opacity-60 dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-300"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Refresh
        </button>
        <Link to="/admin/tools/users" className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-900 px-3 text-[10px] font-black text-white dark:bg-white dark:text-slate-950">
          <ArrowLeft className="h-4 w-4" />
          Users
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

      <section className="grid gap-3 md:grid-cols-4">
        <SummaryCard icon={CircleDollarSign} label="Wallet balance" value={wallet?.balanceLabel || formatCurrency(0, currency, "ar-EG-u-nu-latn")} />
        <SummaryCard icon={ShieldCheck} label="Credit limit" value={wallet?.creditLimitLabel || formatCurrency(0, currency, "ar-EG-u-nu-latn")} />
        <SummaryCard label="Credit used" value={wallet?.creditUsedLabel || formatCurrency(0, currency, "ar-EG-u-nu-latn")} />
        <SummaryCard icon={ReceiptText} label="Ledger movements" value={`${pagination.total || 0}`} />
      </section>

      <section className="grid gap-3 xl:grid-cols-3">
        <ControlCard icon={WalletCards} title="تعديل الرصيد" subtitle={`Amounts use ${currency}. Every change creates a ledger movement.`}>
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField label="Amount">
              <input
                dir="ltr"
                min="0"
                step="0.01"
                type="number"
                value={adjustmentForm.amount}
                onChange={(event) => setAdjustmentForm((current) => ({ ...current, amount: event.target.value }))}
                placeholder="0.00"
              />
            </FormField>
            <FormField label="سبب العملية">
              <select
                value={adjustmentForm.reasonPreset}
                onChange={(event) => setAdjustmentForm((current) => ({ ...current, reasonPreset: event.target.value }))}
              >
                {walletReasonPresets.map((preset) => (
                  <option key={preset.value} value={preset.value}>{preset.label}</option>
                ))}
              </select>
            </FormField>
            <FormField label={adjustmentForm.reasonPreset === "OTHER" ? "ملاحظة إضافية (مطلوبة)" : "ملاحظة إضافية (اختياري)"} wide>
              <input
                value={adjustmentForm.reasonNote}
                onChange={(event) => setAdjustmentForm((current) => ({ ...current, reasonNote: event.target.value }))}
                placeholder="اكتب ملاحظة قصيرة عند الحاجة"
                maxLength={170}
              />
            </FormField>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
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

        <ControlCard icon={ShieldCheck} title="تعيين حد الدين / حد الائتمان" subtitle="Changing the limit does not create a money transaction.">
          <div className="mb-3 grid grid-cols-2 gap-2 text-[10px] font-black text-slate-500 dark:text-slate-300">
            <span>Available credit</span>
            <strong dir="ltr" className="text-left text-slate-950 dark:text-white">{wallet?.availableCreditLabel || "-"}</strong>
            <span>Available to spend</span>
            <strong dir="ltr" className="text-left text-slate-950 dark:text-white">{wallet?.availableToSpendLabel || "-"}</strong>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField label="New limit">
              <input
                dir="ltr"
                min="0"
                step="0.01"
                type="number"
                value={creditForm.creditLimit}
                onChange={(event) => setCreditForm((current) => ({ ...current, creditLimit: event.target.value }))}
              />
            </FormField>
            <FormField label="سبب تغيير الحد">
              <select
                value={creditForm.reasonPreset}
                onChange={(event) => setCreditForm((current) => ({ ...current, reasonPreset: event.target.value }))}
              >
                {creditReasonPresets.map((preset) => (
                  <option key={preset.value} value={preset.value}>{preset.label}</option>
                ))}
              </select>
            </FormField>
            <FormField label={creditForm.reasonPreset === "OTHER" ? "ملاحظة إضافية (مطلوبة)" : "ملاحظة إضافية (اختياري)"} wide>
              <input
                value={creditForm.reasonNote}
                onChange={(event) => setCreditForm((current) => ({ ...current, reasonNote: event.target.value }))}
                placeholder="اكتب ملاحظة قصيرة عند الحاجة"
                maxLength={170}
              />
            </FormField>
          </div>
          <ActionButton
            className="mt-3 w-full"
            icon={Save}
            busy={actionKey === "credit-limit"}
            disabled={Boolean(actionKey) || loading}
            label="Save credit limit"
            onClick={() => void handleCreditLimit()}
          />
        </ControlCard>

        <ControlCard icon={UsersRound} title="تغيير مجموعة التسعير" subtitle="Pricing changes apply to future orders only.">
          <div className="mb-3 rounded-2xl bg-slate-50 p-3 text-[10px] font-black text-slate-500 dark:bg-[#0B1220] dark:text-slate-300">
            Current group:
            <strong className="ms-2 text-slate-950 dark:text-white">
              {currentGroup?.name || user?.groupName || "Unassigned"}
              {currentGroup?.percentage !== null && currentGroup?.percentage !== undefined ? ` (${currentGroup.percentage}%)` : ""}
            </strong>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField label="Active group">
              <select
                value={groupForm.groupId}
                onChange={(event) => setGroupForm((current) => ({ ...current, groupId: event.target.value }))}
                disabled={groupsLoading}
              >
                <option value="">{groupsLoading ? "Loading groups..." : "Choose group"}</option>
                {groups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name} ({group.percentage}%)
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="سبب تغيير المجموعة">
              <select
                value={groupForm.reasonPreset}
                onChange={(event) => setGroupForm((current) => ({ ...current, reasonPreset: event.target.value }))}
              >
                {groupReasonPresets.map((preset) => (
                  <option key={preset.value} value={preset.value}>{preset.label}</option>
                ))}
              </select>
            </FormField>
            <FormField label={groupForm.reasonPreset === "OTHER" ? "ملاحظة إضافية (مطلوبة)" : "ملاحظة إضافية (اختياري)"} wide>
              <input
                value={groupForm.reasonNote}
                onChange={(event) => setGroupForm((current) => ({ ...current, reasonNote: event.target.value }))}
                placeholder="اكتب ملاحظة قصيرة عند الحاجة"
                maxLength={170}
              />
            </FormField>
          </div>
          <ActionButton
            className="mt-3 w-full"
            icon={Save}
            busy={actionKey === "group"}
            disabled={Boolean(actionKey) || loading || groupsLoading || !groups.length}
            label="Change group"
            onClick={() => void handleGroupChange()}
          />
        </ControlCard>
      </section>

      <section className="rounded-[22px] border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-[#111827]">
        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-black text-slate-950 dark:text-white">Transaction history</h2>
            <p className="text-[9px] font-bold text-slate-400">{pagination.total} backend ledger movement(s)</p>
          </div>
          <label className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-violet-500" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search loaded transactions"
              className="h-11 w-full rounded-2xl bg-slate-50 pe-9 ps-3 text-[10px] font-black outline-none dark:bg-[#0B1220] dark:text-white"
            />
          </label>
        </div>

        <div className="mt-4 space-y-2">
          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm font-black text-slate-500 dark:border-white/10 dark:bg-[#0B1220] dark:text-slate-300">
              Loading wallet movements...
            </div>
          ) : filteredTransactions.length ? (
            filteredTransactions.map((transaction) => (
              <TransactionRow key={transaction.id} transaction={transaction} />
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-10 text-center dark:border-white/10">
              <ReceiptText className="mx-auto h-8 w-8 text-slate-300 dark:text-white/20" />
              <p className="mt-3 text-sm font-black text-slate-500 dark:text-white/50">No wallet transactions found.</p>
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
              Previous
            </button>
            <span className="text-[10px] font-black text-slate-500 dark:text-slate-300">
              Page {pagination.page} of {pagination.pages}
            </span>
            <button
              type="button"
              disabled={page >= pagination.pages}
              onClick={() => setPage((current) => Math.min(pagination.pages, current + 1))}
              className="h-10 rounded-xl border border-slate-200 px-4 text-[10px] font-black disabled:opacity-45 dark:border-white/10 dark:text-white"
            >
              Next
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

function SummaryCard({ icon: Icon = WalletCards, label, value }) {
  return (
    <article className="rounded-[20px] border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-[#111827]">
      <Icon className="h-8 w-8 rounded-xl bg-violet-500/10 p-2 text-violet-600 dark:text-violet-300" />
      <p className="mt-3 text-[9px] font-black text-slate-400">{label}</p>
      <strong dir="ltr" className="mt-1 block text-right text-xl font-black text-slate-950 dark:text-white">{value}</strong>
    </article>
  );
}

function ControlCard({ icon: Icon, title, subtitle, children }) {
  return (
    <section className="rounded-[22px] border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-[#111827]">
      <div className="mb-4 flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-violet-500/10 text-violet-600 dark:text-violet-300">
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-sm font-black text-slate-950 dark:text-white">{title}</h2>
          <p className="mt-1 text-[9px] font-bold leading-4 text-slate-400">{subtitle}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function FormField({ label, wide = false, children }) {
  return (
    <label className={wide ? "block sm:col-span-2" : "block"}>
      <span className="mb-1 block text-[9px] font-black text-slate-400">{label}</span>
      <span className="block [&>input]:h-11 [&>input]:w-full [&>input]:rounded-2xl [&>input]:bg-slate-50 [&>input]:px-3 [&>input]:text-[11px] [&>input]:font-black [&>input]:outline-none [&>input]:dark:bg-[#0B1220] [&>input]:dark:text-white [&>select]:h-11 [&>select]:w-full [&>select]:rounded-2xl [&>select]:bg-slate-50 [&>select]:px-3 [&>select]:text-[11px] [&>select]:font-black [&>select]:outline-none [&>select]:dark:bg-[#0B1220] [&>select]:dark:text-white">
        {children}
      </span>
    </label>
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
      className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl px-4 text-[10px] font-black transition disabled:cursor-not-allowed disabled:opacity-60 ${toneClass} ${className}`}
    >
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />}
      {busy ? "Saving..." : label}
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
          {transaction.semanticTypeLabel} - {transaction.sourceType || "WALLET"} - {transaction.dateLabel}
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
