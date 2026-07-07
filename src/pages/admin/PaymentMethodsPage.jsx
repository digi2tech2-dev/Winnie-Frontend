import { useCallback, useEffect, useMemo, useState } from "react";
import { CreditCard, Layers3, Loader2, Plus, WalletCards } from "lucide-react";
import {
  createAdminPaymentGroup,
  createAdminPaymentMethod,
  deleteAdminPaymentGroup,
  deleteAdminPaymentMethod,
  getAdminPaymentMethods,
  setAdminPaymentGroupActive,
  setAdminPaymentMethodActive,
  updateAdminPaymentGroup,
  updateAdminPaymentMethod,
} from "../../api/adminPaymentMethods";
import { getPublicCurrencies } from "../../api/currencies";
import PaymentGroupCard from "../../components/admin/payments/PaymentGroupCard";
import PaymentGroupFormModal from "../../components/admin/payments/PaymentGroupFormModal";
import PaymentMethodFormModal from "../../components/admin/payments/PaymentMethodFormModal";
import ConfirmDialog from "../../components/admin/products/ConfirmDialog";
import EmptyState from "../../components/EmptyState";
import { SkeletonBlock } from "../../components/Skeletons";
import { useToast } from "../../components/ToastProvider";
import { useAuth } from "../../context/AuthContext";

export default function PaymentMethodsPage() {
  const { token } = useAuth();
  const { showToast } = useToast();
  const [groups, setGroups] = useState([]);
  const [currencyOptions, setCurrencyOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [groupForm, setGroupForm] = useState(undefined);
  const [methodForm, setMethodForm] = useState(undefined);
  const [defaultGroup, setDefaultGroup] = useState("");
  const [action, setAction] = useState(null);
  const [busy, setBusy] = useState(false);
  const methods = useMemo(() => groups.flatMap((group) => group.methods || []), [groups]);

  const toast = useCallback((title, message, type = "success") => {
    showToast({ type, title, message });
  }, [showToast]);

  const load = useCallback(async () => {
    if (!token) return;

    setLoading(true);
    setError("");

    try {
      const [paymentResult, currencyResult] = await Promise.all([
        getAdminPaymentMethods(token),
        getPublicCurrencies().catch(() => ({ currencies: [] })),
      ]);
      setGroups(paymentResult.groups);
      setCurrencyOptions(currencyResult.currencies.map((currency) => currency.code).filter(Boolean));
    } catch (requestError) {
      setGroups([]);
      setError(requestError.userMessage || "تعذر تحميل طرق الدفع.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  const saveAndReload = async (request, successTitle, successMessage) => {
    if (busy) return;
    setBusy(true);
    setError("");

    try {
      await request();
      await load();
      toast(successTitle, successMessage);
    } catch (requestError) {
      const message = requestError.userMessage || requestError.message || "تعذر حفظ إعدادات الدفع.";
      setError(message);
      toast("تعذر الحفظ", message, "error");
    } finally {
      setBusy(false);
    }
  };

  const saveGroup = (data) => {
    if (busy) return;
    const request = groupForm?.id
      ? () => updateAdminPaymentGroup(token, groups, groupForm.id, data)
      : () => createAdminPaymentGroup(token, groups, data);

    void saveAndReload(request, "تم حفظ مجموعة الدفع", data.name);
    setGroupForm(undefined);
  };

  const saveMethod = (data) => {
    if (busy) return;
    const request = methodForm?.id
      ? () => updateAdminPaymentMethod(token, groups, methodForm.id, data)
      : () => createAdminPaymentMethod(token, groups, data);

    void saveAndReload(request, "تم حفظ طريقة الدفع", data.name);
    setMethodForm(undefined);
    setDefaultGroup("");
  };

  const deleteGroup = (group) => {
    if (methods.some((method) => method.groupId === group.id)) {
      toast("تعذر حذف المجموعة", "احذف طرق الدفع داخل المجموعة أولا.", "warning");
      return;
    }
    setAction({ kind: "deleteGroup", item: group });
  };

  const requestToggle = (kind, item) => {
    setAction({ kind, item });
  };

  const runAction = async () => {
    if (!action || busy) return;
    const { kind, item } = action;
    const isToggle = kind.startsWith("toggle");
    const nextActive = isToggle ? !item.active : undefined;

    await saveAndReload(
      () => {
        if (kind === "deleteGroup") return deleteAdminPaymentGroup(token, groups, item.id);
        if (kind === "deleteMethod") return deleteAdminPaymentMethod(token, groups, item.id);
        if (kind === "toggleGroup") return setAdminPaymentGroupActive(token, groups, item.id, nextActive);
        if (kind === "toggleMethod") return setAdminPaymentMethodActive(token, groups, item.id, nextActive);
        return Promise.resolve();
      },
      kind.startsWith("delete") ? "تم الحذف بنجاح" : "تم تحديث الحالة",
      item.name,
    );
    setAction(null);
  };

  const stats = [
    { label: "إجمالي المجموعات", value: groups.length, icon: Layers3 },
    { label: "المجموعات النشطة", value: groups.filter((group) => group.active).length, icon: WalletCards },
    { label: "إجمالي طرق الدفع", value: methods.length, icon: CreditCard },
    { label: "طرق الدفع النشطة", value: methods.filter((method) => method.active).length, icon: CreditCard },
  ];
  const formCurrencies = currencyOptions.length
    ? currencyOptions
    : [...new Set(groups.map((group) => group.currency).filter(Boolean))];

  return (
    <div dir="rtl" className="space-y-4">
      <section className="flex items-center gap-3 rounded-[26px] border border-violet-200 bg-gradient-to-l from-white to-violet-50 p-5 dark:border-white/10 dark:bg-[linear-gradient(135deg,#111827,#17152A)]">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-blue-500 text-white">
          <WalletCards className="h-5 w-5" />
        </span>
        <div className="flex-1">
          <h1 className="text-2xl font-black dark:text-white">إدارة طرق الدفع</h1>
          <p className="text-[9px] font-bold text-slate-400">البيانات محفوظة في إعدادات الدفع بالخادم وتظهر للعميل من مسار آمن.</p>
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={() => setGroupForm(null)}
          className="inline-flex h-10 items-center gap-1 rounded-xl bg-violet-600 px-3 text-[8px] font-black text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          إضافة مجموعة جديدة
        </button>
      </section>

      {error && (
        <p className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-xs font-bold text-amber-800 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-200">
          {error}
        </p>
      )}

      {loading ? (
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 6 }).map((_, index) => <SkeletonBlock key={index} className="h-44 rounded-[22px]" />)}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
            {stats.map(({ label, value, icon: Icon }) => (
              <article key={label} className="rounded-[20px] border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-[#111827]">
                <Icon className="h-8 w-8 rounded-xl bg-violet-500/10 p-2 text-violet-600" />
                <strong className="mt-2 block text-2xl font-black dark:text-white">{value.toLocaleString("ar-EG-u-nu-latn")}</strong>
                <p className="text-[8px] font-black text-slate-400">{label}</p>
              </article>
            ))}
          </div>

          {groups.length ? (
            <div className="grid gap-3 lg:grid-cols-2">
              {groups.map((group) => (
                <PaymentGroupCard
                  key={group.id}
                  group={group}
                  methods={methods.filter((method) => method.groupId === group.id)}
                  onAddMethod={(selectedGroup) => {
                    setDefaultGroup(selectedGroup.id);
                    setMethodForm(null);
                  }}
                  onDelete={deleteGroup}
                  onDeleteMethod={(item) => setAction({ kind: "deleteMethod", item })}
                  onEdit={setGroupForm}
                  onEditMethod={setMethodForm}
                  onRefresh={() => void load()}
                  onRefreshMethod={() => void load()}
                  onToggle={(item) => requestToggle("toggleGroup", item)}
                  onToggleMethod={(item) => requestToggle("toggleMethod", item)}
                />
              ))}
            </div>
          ) : (
            <EmptyState title="لا توجد مجموعات دفع من الخلفية" actionLabel="إضافة مجموعة" onAction={() => setGroupForm(null)} />
          )}
        </>
      )}

      <PaymentGroupFormModal
        open={groupForm !== undefined}
        group={groupForm}
        currencies={formCurrencies}
        onClose={() => setGroupForm(undefined)}
        onSave={saveGroup}
      />
      <PaymentMethodFormModal
        open={methodForm !== undefined}
        method={methodForm}
        defaultGroupId={defaultGroup}
        groups={groups}
        onClose={() => {
          setMethodForm(undefined);
          setDefaultGroup("");
        }}
        onSave={saveMethod}
      />
      <ConfirmDialog
        open={Boolean(action)}
        busy={busy}
        tone={action?.kind?.startsWith("toggle") ? "warning" : "danger"}
        title={action?.kind?.startsWith("toggle") ? "تأكيد تغيير الحالة" : "تأكيد الحذف"}
        message={action?.kind?.startsWith("toggle") ? "سيتم حفظ حالة طريقة الدفع أو المجموعة في إعدادات الخلفية." : "لا يمكن التراجع عن هذا الإجراء من الواجهة."}
        confirmLabel={action?.kind?.startsWith("toggle") ? (action?.item?.active ? "تعطيل" : "تفعيل") : "حذف"}
        onCancel={() => setAction(null)}
        onConfirm={runAction}
      />
    </div>
  );
}
