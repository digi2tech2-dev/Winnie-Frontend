import { useEffect, useState } from "react";
import { CreditCard, Layers3, Plus, WalletCards } from "lucide-react";
import PaymentGroupCard from "../../components/admin/payments/PaymentGroupCard";
import PaymentGroupFormModal from "../../components/admin/payments/PaymentGroupFormModal";
import PaymentMethodFormModal from "../../components/admin/payments/PaymentMethodFormModal";
import ConfirmDialog from "../../components/admin/products/ConfirmDialog";
import EmptyState from "../../components/EmptyState";
import { SkeletonBlock } from "../../components/Skeletons";
import { useToast } from "../../components/ToastProvider";
import { currencies } from "../../data/catalog";
import { paymentGroupsSeed, paymentMethodsSeed } from "../../data/adminManagement";
import {
  PAYMENT_GROUPS_STORAGE_KEY,
  PAYMENT_METHODS_STORAGE_KEY,
  WALLET_PAYMENT_GROUP_ID,
} from "../../data/paymentMethods";

function loadStoredList(key, fallback) {
  try {
    const stored = window.localStorage.getItem(key);
    if (!stored) return fallback;
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

export default function PaymentMethodsPage() {
  const [groups, setGroups] = useState(() => loadStoredList(PAYMENT_GROUPS_STORAGE_KEY, paymentGroupsSeed));
  const [methods, setMethods] = useState(() => loadStoredList(PAYMENT_METHODS_STORAGE_KEY, paymentMethodsSeed));
  const [loading, setLoading] = useState(true);
  const [groupForm, setGroupForm] = useState(undefined);
  const [methodForm, setMethodForm] = useState(undefined);
  const [defaultGroup, setDefaultGroup] = useState("");
  const [action, setAction] = useState(null);
  const { showToast } = useToast();

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 420);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    window.localStorage.setItem(PAYMENT_GROUPS_STORAGE_KEY, JSON.stringify(groups));
  }, [groups]);

  useEffect(() => {
    window.localStorage.setItem(PAYMENT_METHODS_STORAGE_KEY, JSON.stringify(methods));
  }, [methods]);

  const toast = (title, message, type = "success") => showToast({ type, title, message });

  const saveGroup = (data) => {
    if (groupForm?.id) {
      setGroups((current) => current.map((group) => (group.id === groupForm.id ? { ...group, ...data } : group)));
    } else {
      setGroups((current) => [...current, { ...data, id: `pay-${Date.now()}` }]);
    }
    toast("تم حفظ مجموعة الدفع", data.name);
    setGroupForm(undefined);
  };

  const saveMethod = (data) => {
    const normalizedData = {
      ...data,
      walletMethod: data.groupId === WALLET_PAYMENT_GROUP_ID,
    };

    if (methodForm?.id) {
      setMethods((current) => current.map((method) => (method.id === methodForm.id ? { ...method, ...normalizedData } : method)));
    } else {
      setMethods((current) => [
        ...current,
        {
          ...normalizedData,
          id: `pm-${Date.now()}`,
        },
      ]);
    }
    toast("تم حفظ طريقة الدفع", data.name);
    setMethodForm(undefined);
    setDefaultGroup("");
  };

  const deleteGroup = (group) => {
    if (methods.some((method) => method.groupId === group.id)) {
      toast("تعذر حذف المجموعة", "لا يمكن حذف مجموعة دفع بها طرق دفع. احذف أو انقل طرق الدفع أولًا.", "warning");
      return;
    }
    setAction({ kind: "deleteGroup", item: group });
  };

  const requestToggle = (kind, item) => {
    const setter = kind === "toggleGroup" ? setGroups : setMethods;
    if (item.active) {
      setAction({ kind, item });
      return;
    }
    setter((current) => current.map((entry) => (entry.id === item.id ? { ...entry, active: true } : entry)));
    toast("تم التفعيل بنجاح", item.name);
  };

  const runAction = () => {
    const { kind, item } = action;
    if (kind === "deleteGroup") setGroups((current) => current.filter((group) => group.id !== item.id));
    if (kind === "deleteMethod") setMethods((current) => current.filter((method) => method.id !== item.id));
    if (kind === "toggleGroup") setGroups((current) => current.map((group) => (group.id === item.id ? { ...group, active: false } : group)));
    if (kind === "toggleMethod") setMethods((current) => current.map((method) => (method.id === item.id ? { ...method, active: false } : method)));
    toast(kind.startsWith("delete") ? "تم الحذف بنجاح" : "تم التعطيل بنجاح", item.name, kind.startsWith("toggle") ? "warning" : "success");
    setAction(null);
  };

  const stats = [
    { label: "إجمالي المجموعات", value: groups.length, icon: Layers3 },
    { label: "المجموعات النشطة", value: groups.filter((group) => group.active).length, icon: WalletCards },
    { label: "إجمالي طرق الدفع", value: methods.length, icon: CreditCard },
    { label: "طرق الدفع النشطة", value: methods.filter((method) => method.active).length, icon: CreditCard },
  ];

  return (
    <div dir="rtl" className="space-y-4">
      <section className="flex items-center gap-3 rounded-[26px] border border-violet-200 bg-gradient-to-l from-white to-violet-50 p-5 dark:border-white/10 dark:bg-[linear-gradient(135deg,#111827,#17152A)]">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-blue-500 text-white"><WalletCards className="h-5 w-5" /></span>
        <div className="flex-1">
          <h1 className="text-2xl font-black dark:text-white">إدارة طرق الدفع</h1>
          <p className="text-[9px] font-bold text-slate-400">التعديلات على مجموعة «عالمي» تظهر مباشرة في محفظة العميل</p>
        </div>
        <button type="button" onClick={() => setGroupForm(null)} className="inline-flex h-10 items-center gap-1 rounded-xl bg-violet-600 px-3 text-[8px] font-black text-white"><Plus className="h-4 w-4" />إضافة مجموعة جديدة</button>
      </section>

      {loading ? (
        <div className="grid grid-cols-2 gap-3">{Array.from({ length: 6 }).map((_, index) => <SkeletonBlock key={index} className="h-44 rounded-[22px]" />)}</div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
            {stats.map(({ label, value, icon: Icon }) => (
              <article key={label} className="rounded-[20px] border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-[#111827]">
                <Icon className="h-8 w-8 rounded-xl bg-violet-500/10 p-2 text-violet-600" />
                <strong className="mt-2 block text-2xl font-black dark:text-white">{value.toLocaleString("ar-EG")}</strong>
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
                  onAddMethod={(selectedGroup) => { setDefaultGroup(selectedGroup.id); setMethodForm(null); }}
                  onEdit={setGroupForm}
                  onDelete={deleteGroup}
                  onRefresh={(item) => toast("تم تحديث المجموعة", item.name)}
                  onToggle={(item) => requestToggle("toggleGroup", item)}
                  onEditMethod={setMethodForm}
                  onDeleteMethod={(item) => setAction({ kind: "deleteMethod", item })}
                  onRefreshMethod={(item) => toast("تم تحديث طريقة الدفع", item.name)}
                  onToggleMethod={(item) => requestToggle("toggleMethod", item)}
                />
              ))}
            </div>
          ) : (
            <EmptyState title="لا توجد مجموعات دفع" actionLabel="إضافة مجموعة" onAction={() => setGroupForm(null)} />
          )}
        </>
      )}

      <PaymentGroupFormModal open={groupForm !== undefined} group={groupForm} currencies={currencies} onClose={() => setGroupForm(undefined)} onSave={saveGroup} />
      <PaymentMethodFormModal open={methodForm !== undefined} method={methodForm} defaultGroupId={defaultGroup} groups={groups} onClose={() => { setMethodForm(undefined); setDefaultGroup(""); }} onSave={saveMethod} />
      <ConfirmDialog
        open={Boolean(action)}
        tone={action?.kind?.startsWith("toggle") ? "warning" : "danger"}
        title={action?.kind?.startsWith("toggle") ? "تأكيد التعطيل" : "تأكيد الحذف"}
        message={action?.kind === "toggleGroup" ? "عند تعطيل المجموعة لن تظهر طرق الدفع التابعة لها للعملاء." : action?.kind === "toggleMethod" ? "لن تظهر طريقة الدفع للعميل بعد تعطيلها." : "لا يمكن التراجع عن هذا الإجراء."}
        confirmLabel={action?.kind?.startsWith("toggle") ? "تعطيل" : "حذف"}
        onCancel={() => setAction(null)}
        onConfirm={runAction}
      />
    </div>
  );
}
