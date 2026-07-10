import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Plus, RefreshCw, UserMinus, Users, UsersRound } from "lucide-react";
import {
  createAdminGroup,
  deleteAdminGroup,
  getAdminGroups,
  updateAdminGroup,
} from "../../api/adminGroups";
import GroupCard from "../../components/admin/groups/GroupCard";
import GroupFormModal from "../../components/admin/groups/GroupFormModal";
import ConfirmDialog from "../../components/admin/products/ConfirmDialog";
import EmptyState from "../../components/EmptyState";
import { SkeletonBlock } from "../../components/Skeletons";
import { useToast } from "../../components/ToastProvider";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";

const COPY = {
  ar: {
    active: "نشطة",
    addGroup: "إضافة مجموعة",
    cannotDeleteMembers: "لا يمكن حذف مجموعة تحتوي على أعضاء. انقل الأعضاء إلى مجموعة أخرى أولاً.",
    currentMembers: "الأعضاء الحاليون",
    cancel: "إلغاء",
    delete: "حذف",
    deleteConfirm: "سيتم حذف {{name}} من الخلفية إذا لم يكن بها أعضاء.",
    deleteSuccess: "تم حذف المجموعة",
    deleteTitle: "حذف المجموعة؟",
    edit: "تعديل",
    emptyDescription: "أضف أول مجموعة لتحديد نسبة ربح المنصة للعملاء.",
    emptyTitle: "لا توجد مجموعات",
    errorTitle: "تعذر تحميل المجموعات",
    groupLabel: "المجموعة",
    groupName: "اسم المجموعة",
    groupsWithMembers: "مجموعات بها أعضاء",
    groupsWithoutMembers: "مجموعات بدون أعضاء",
    inactive: "غير نشطة",
    markupPercentage: "نسبة الإضافة",
    nameRequired: "اكتب اسم المجموعة.",
    percentageRequired: "نسبة الإضافة يجب أن تكون صفرًا أو أكبر.",
    retry: "إعادة المحاولة",
    save: "حفظ التعديل",
    saveSuccess: "تم حفظ المجموعة",
    subtitle: "إدارة نسب وأقسام مجموعات العملاء",
    title: "إدارة المجموعات",
    totalGroups: "إجمالي المجموعات",
  },
  en: {
    active: "Active",
    addGroup: "Add Group",
    cannotDeleteMembers: "Cannot delete a group that has members. Move users to another group first.",
    currentMembers: "Current Members",
    cancel: "Cancel",
    delete: "Delete",
    deleteConfirm: "{{name}} will be deleted from the backend if it has no members.",
    deleteSuccess: "Group deleted",
    deleteTitle: "Delete group?",
    edit: "Edit",
    emptyDescription: "Add the first group to define platform markup for customers.",
    emptyTitle: "No groups",
    errorTitle: "Could not load groups",
    groupLabel: "Group",
    groupName: "Group name",
    groupsWithMembers: "Groups With Members",
    groupsWithoutMembers: "Groups Without Members",
    inactive: "Inactive",
    markupPercentage: "Markup Percentage",
    nameRequired: "Group name is required.",
    percentageRequired: "Markup percentage must be zero or greater.",
    retry: "Retry",
    save: "Save Changes",
    saveSuccess: "Group saved",
    subtitle: "Manage customer pricing groups and percentages",
    title: "Groups Management",
    totalGroups: "Total Groups",
  },
};

const EMPTY_SUMMARY = {
  activeGroups: 0,
  groupsWithMembers: 0,
  groupsWithoutMembers: 0,
  totalGroups: 0,
  totalMembers: 0,
};

export default function GroupsManagementPage() {
  const { token } = useAuth();
  const { isArabic } = useLanguage();
  const { showToast } = useToast();
  const labels = COPY[isArabic ? "ar" : "en"];
  const dir = isArabic ? "rtl" : "ltr";
  const locale = isArabic ? "ar-EG-u-nu-latn" : "en-US";

  const [groups, setGroups] = useState([]);
  const [summary, setSummary] = useState(EMPTY_SUMMARY);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(undefined);
  const [deleting, setDeleting] = useState(null);

  const loadGroups = useCallback(async () => {
    if (!token) return;

    setLoading(true);
    setError("");

    try {
      const result = await getAdminGroups(token);
      setGroups(result.groups);
      setSummary(result.summary || EMPTY_SUMMARY);
    } catch (requestError) {
      setGroups([]);
      setSummary(EMPTY_SUMMARY);
      setError(requestError.userMessage || requestError.message || labels.errorTitle);
    } finally {
      setLoading(false);
    }
  }, [labels.errorTitle, token]);

  useEffect(() => {
    void loadGroups();
  }, [loadGroups]);

  const stats = useMemo(() => ([
    { label: labels.totalGroups, value: summary.totalGroups, icon: UsersRound, tone: "violet" },
    { label: labels.groupsWithMembers, value: summary.groupsWithMembers, icon: Users, tone: "sky" },
    { label: labels.groupsWithoutMembers, value: summary.groupsWithoutMembers, icon: UserMinus, tone: "orange" },
    { label: labels.currentMembers, value: summary.totalMembers, icon: Users, tone: "emerald" },
  ]), [labels, summary]);

  const toast = useCallback((type, title, message) => {
    showToast({ type, title, message });
  }, [showToast]);

  const saveGroup = async (values) => {
    if (busy || !token) return;

    setBusy(true);
    setError("");

    try {
      if (editing?.id) {
        await updateAdminGroup(token, editing.id, values);
      } else {
        await createAdminGroup(token, values);
      }

      await loadGroups();
      toast("success", labels.saveSuccess, values.name);
      setEditing(undefined);
    } catch (requestError) {
      const message = requestError.userMessage || requestError.message || labels.errorTitle;
      setError(message);
      toast("error", labels.errorTitle, message);
    } finally {
      setBusy(false);
    }
  };

  const runDelete = async () => {
    if (!deleting || busy || !token) return;

    setBusy(true);
    setError("");

    try {
      await deleteAdminGroup(token, deleting.id);
      await loadGroups();
      toast("success", labels.deleteSuccess, deleting.name);
      setDeleting(null);
    } catch (requestError) {
      const message = requestError.code === "GROUP_HAS_MEMBERS"
        ? labels.cannotDeleteMembers
        : requestError.userMessage || requestError.message || labels.errorTitle;
      setError(message);
      toast("warning", labels.deleteTitle, message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div dir={dir} className="space-y-4">
      <Header busy={busy} labels={labels} onCreate={() => setEditing(null)} onRefresh={loadGroups} />

      {error && (
        <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-xs font-bold text-amber-800 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-200">
          <span>{error}</span>
          <button type="button" onClick={loadGroups} className="inline-flex h-9 items-center gap-1 rounded-xl bg-amber-500 px-3 text-[10px] font-black text-white">
            <RefreshCw className="h-3.5 w-3.5" />
            {labels.retry}
          </button>
        </section>
      )}

      {loading ? (
        <Skeleton />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
            {stats.map((stat) => <Stat key={stat.label} locale={locale} {...stat} />)}
          </div>

          {groups.length ? (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {groups.map((group) => (
                <GroupCard
                  key={group.id}
                  group={group}
                  labels={labels}
                  locale={locale}
                  memberCount={group.membersCount}
                  onDelete={setDeleting}
                  onEdit={setEditing}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              title={labels.emptyTitle}
              description={labels.emptyDescription}
              actionLabel={labels.addGroup}
              onAction={() => setEditing(null)}
            />
          )}
        </>
      )}

      <GroupFormModal
        busy={busy}
        labels={labels}
        open={editing !== undefined}
        group={editing}
        onClose={() => setEditing(undefined)}
        onSave={saveGroup}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        busy={busy}
        title={labels.deleteTitle}
        message={labels.deleteConfirm.replace("{{name}}", deleting?.name || "")}
        confirmLabel={labels.delete}
        onCancel={() => setDeleting(null)}
        onConfirm={runDelete}
      />
    </div>
  );
}

function Header({ busy, labels, onCreate, onRefresh }) {
  return (
    <section className="flex flex-wrap items-center gap-3 rounded-[26px] border border-violet-200/70 bg-gradient-to-l from-white to-violet-50 p-5 dark:border-white/10 dark:bg-[linear-gradient(135deg,#111827,#17152A)]">
      <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-blue-500 text-white">
        <UsersRound className="h-5 w-5" />
      </span>
      <div className="min-w-[180px] flex-1">
        <h1 className="text-2xl font-black dark:text-white">{labels.title}</h1>
        <p className="text-[10px] font-bold text-slate-500">{labels.subtitle}</p>
      </div>
      <button
        type="button"
        onClick={onRefresh}
        disabled={busy}
        className="grid h-10 w-10 place-items-center rounded-xl bg-white text-violet-600 shadow-sm disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white/[0.07] dark:text-violet-200"
        aria-label={labels.retry}
      >
        <RefreshCw className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={onCreate}
        disabled={busy}
        className="inline-flex h-10 items-center gap-1 rounded-xl bg-violet-600 px-3 text-[9px] font-black text-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
        {labels.addGroup}
      </button>
    </section>
  );
}

function Stat({ label, value, icon: Icon, tone, locale }) {
  const colors = {
    emerald: "bg-emerald-500/10 text-emerald-600",
    orange: "bg-orange-500/10 text-orange-600",
    sky: "bg-sky-500/10 text-sky-600",
    violet: "bg-violet-500/10 text-violet-600",
  };

  return (
    <article className="rounded-[20px] border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-[#111827]">
      <Icon className={`h-8 w-8 rounded-xl p-2 ${colors[tone]}`} />
      <strong className="mt-2 block text-2xl font-black dark:text-white">{Number(value || 0).toLocaleString(locale)}</strong>
      <p className="text-[9px] font-black text-slate-400">{label}</p>
    </article>
  );
}

function Skeleton() {
  return (
    <div className="grid grid-cols-2 gap-3">
      {Array.from({ length: 6 }).map((_, index) => <SkeletonBlock key={index} className="h-40 rounded-[22px]" />)}
    </div>
  );
}
