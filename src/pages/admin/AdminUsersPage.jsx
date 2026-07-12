import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  ChevronDown,
  Copy,
  Eye,
  Filter,
  KeyRound,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  UserRound,
  Users,
  WalletCards,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  approveUser,
  blockAdminUser,
  changeAdminUserPassword,
  getAdminUsers,
  rejectUser,
  restoreAdminUser,
  unblockAdminUser,
  updateUserIdentityVerification,
} from "../../api/adminUsers";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../components/ToastProvider";

const statusOptions = [
  { value: "all", label: "الكل" },
  { value: "active", label: "النشطون" },
  { value: "blocked", label: "المحظورون" },
  { value: "deleted", label: "المحذوفون" },
  { value: "PENDING", label: "بانتظار المراجعة" },
];

const sortOptions = [
  { value: "newest", label: "الأحدث", sortBy: "createdAt", sortOrder: "desc" },
  { value: "oldest", label: "الأقدم", sortBy: "createdAt", sortOrder: "asc" },
  { value: "nameAsc", label: "الاسم أبجديًا", sortBy: "name", sortOrder: "asc" },
  { value: "emailAsc", label: "البريد أبجديًا", sortBy: "email", sortOrder: "asc" },
  { value: "highestBalance", label: "الرصيد الأعلى", sortBy: "walletBalance", sortOrder: "desc" },
  { value: "lowestBalance", label: "الرصيد الأقل", sortBy: "walletBalance", sortOrder: "asc" },
];

const statusTone = {
  ACTIVE: "admin-user-status-active",
  BLOCKED: "admin-user-status-blocked",
  DELETED: "bg-slate-500/12 text-slate-700 dark:text-slate-300",
  PENDING: "bg-amber-500/12 text-amber-700 dark:text-amber-300",
  REJECTED: "admin-user-status-blocked",
};

const statConfig = [
  { id: "total", label: "إجمالي المستخدمين", icon: Users, tone: "admin-users-stat-total" },
  { id: "active", label: "الحسابات النشطة", icon: UserCheck, tone: "admin-users-stat-active" },
  { id: "blocked", label: "المحظورون", icon: Ban, tone: "admin-users-stat-total" },
  { id: "deleted", label: "المحذوفون", icon: RotateCcw, tone: "admin-users-stat-total" },
];

const avatarTones = [
  "from-amber-400 via-orange-400 to-rose-400",
  "from-sky-400 via-cyan-400 to-emerald-400",
  "from-violet-400 via-fuchsia-400 to-pink-400",
  "from-blue-400 via-indigo-400 to-violet-400",
  "from-emerald-400 via-teal-400 to-cyan-400",
];

function getAvatarTone(id) {
  const index = String(id || "").split("").reduce((sum, letter) => sum + letter.charCodeAt(0), 0) % avatarTones.length;
  return avatarTones[index];
}

function getInitials(name) {
  const parts = String(name || "WF").trim().split(/\s+/).filter(Boolean);
  return parts.map((part) => part[0]).join("").slice(0, 2).toUpperCase() || "WF";
}

function numberFormat(value) {
  return new Intl.NumberFormat("ar-EG-u-nu-latn").format(value || 0);
}

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("ar-EG-u-nu-latn", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getSortQuery(sortBy) {
  const option = sortOptions.find((item) => item.value === sortBy) || sortOptions[0];
  return { sortBy: option.sortBy, sortOrder: option.sortOrder };
}

function getErrorMessage(error, fallback) {
  return error?.userMessage || error?.message || fallback;
}

export default function AdminUsersPage() {
  const { token } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [confirmation, setConfirmation] = useState(null);
  const [passwordModal, setPasswordModal] = useState(null);
  const [passwordForm, setPasswordForm] = useState({ newPassword: "", confirmPassword: "" });
  const [actionKey, setActionKey] = useState("");

  const selectedUser = users.find((user) => user.id === selectedUserId) || null;
  const openUserWallet = useCallback((userId) => {
    navigate(`/admin/tools/users/${userId}/wallet`);
  }, [navigate]);

  const loadUsers = useCallback(async () => {
    if (!token) {
      setUsers([]);
      setError("يلزم تسجيل الدخول بحساب مدير.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const result = await getAdminUsers(token, {
        page: 1,
        limit: 20,
        email: appliedSearch.trim(),
        status: statusFilter === "all" ? undefined : statusFilter,
        includeDeleted: statusFilter === "all" || statusFilter === "deleted",
        includeBlocked: true,
        ...getSortQuery(sortBy),
      });
      setUsers(result.users);
      setPagination(result.pagination);
    } catch (requestError) {
      const message = getErrorMessage(requestError, "تعذر تحميل المستخدمين.");
      setError(message);
      showToast({ type: "error", title: "لم يتم تحميل المستخدمين", message });
    } finally {
      setLoading(false);
    }
  }, [appliedSearch, showToast, sortBy, statusFilter, token]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const stats = useMemo(() => {
    const counts = {
      total: pagination.total || users.length,
      pending: users.filter((user) => user.status === "PENDING").length,
      active: users.filter((user) => user.displayStatus === "ACTIVE").length,
      blocked: users.filter((user) => user.displayStatus === "BLOCKED").length,
      deleted: users.filter((user) => user.displayStatus === "DELETED").length,
      rejected: users.filter((user) => user.status === "REJECTED").length,
    };

    return statConfig.map((item) => ({ ...item, value: counts[item.id] }));
  }, [pagination.total, users]);

  const resetFilters = () => {
    setSearch("");
    setAppliedSearch("");
    setStatusFilter("all");
    setSortBy("newest");
  };

  const copyUserId = async (userId) => {
    try {
      await navigator.clipboard?.writeText(userId);
      showToast({ title: "تم النسخ", message: userId, type: "success", duration: 1800 });
    } catch {
      showToast({ title: "فشل النسخ", message: userId, type: "error" });
    }
  };

  const requestUserReview = (user, action) => {
    setConfirmation({
      action,
      userId: user.id,
      title: action === "approve" ? "قبول حساب المستخدم" : "رفض حساب المستخدم",
      message: `هل تريد ${action === "approve" ? "قبول" : "رفض"} حساب ${user.name} (${user.email})؟`,
      confirmLabel: action === "approve" ? "قبول الحساب" : "رفض الحساب",
      tone: action === "approve" ? "success" : "danger",
    });
  };

  const executeReview = async () => {
    if (!confirmation || !token) return;
    const key = `${confirmation.action}:${confirmation.userId}`;
    setActionKey(key);

    try {
      const result = confirmation.action === "approve"
        ? await approveUser(token, confirmation.userId)
        : await rejectUser(token, confirmation.userId);

      showToast({
        type: confirmation.action === "approve" ? "success" : "warning",
        title: result.message || (confirmation.action === "approve" ? "تم قبول المستخدم" : "تم رفض المستخدم"),
      });
      setConfirmation(null);
      await loadUsers();
    } catch (requestError) {
      const message = getErrorMessage(requestError, "فشلت مراجعة المستخدم.");
      showToast({ type: "error", title: "فشل الإجراء", message });
    } finally {
      setActionKey("");
    }
  };

  const handleIdentityVerificationUpdate = async (user, required, reason) => {
    if (!token || !user?.id) return;
    const key = `identity:${user.id}`;
    setActionKey(key);

    try {
      const result = await updateUserIdentityVerification(token, user.id, { required, reason });
      showToast({
        type: required ? "warning" : "success",
        title: result.message || (required ? "تم تفعيل طلب التحقق" : "تم إلغاء طلب التحقق"),
      });
      setUsers((current) => current.map((item) => (item.id === user.id ? result.user : item)));
      await loadUsers();
    } catch (requestError) {
      const message = getErrorMessage(requestError, "تعذر تحديث طلب تأكيد الهوية.");
      showToast({ type: "error", title: "فشل تحديث التحقق", message });
    } finally {
      setActionKey("");
    }
  };

  const refreshAfterUserAction = async (title, type = "success") => {
    showToast({ type, title });
    await loadUsers();
  };

  const handleBlockUser = async (user) => {
    if (!token || !user?.id) return;
    const reason = window.prompt("سبب الحظر", user.blockReason || "");
    if (reason === null) return;
    setActionKey(`block:${user.id}`);
    try {
      await blockAdminUser(token, user.id, reason);
      await refreshAfterUserAction("تم حظر المستخدم بنجاح", "warning");
    } catch (requestError) {
      showToast({ type: "error", title: "فشل حظر المستخدم", message: getErrorMessage(requestError, "تعذر حظر المستخدم.") });
    } finally {
      setActionKey("");
    }
  };

  const handleUnblockUser = async (user) => {
    if (!token || !user?.id) return;
    const reason = window.prompt("سبب إلغاء الحظر", "");
    if (reason === null) return;
    setActionKey(`unblock:${user.id}`);
    try {
      await unblockAdminUser(token, user.id, reason);
      await refreshAfterUserAction("تم إلغاء حظر المستخدم");
    } catch (requestError) {
      showToast({ type: "error", title: "فشل إلغاء الحظر", message: getErrorMessage(requestError, "تعذر إلغاء حظر المستخدم.") });
    } finally {
      setActionKey("");
    }
  };

  const handleRestoreUser = async (user) => {
    if (!token || !user?.id) return;
    if (!window.confirm(`هل تريد استرجاع المستخدم ${user.name}؟`)) return;
    setActionKey(`restore:${user.id}`);
    try {
      await restoreAdminUser(token, user.id);
      await refreshAfterUserAction("تم استرجاع المستخدم");
    } catch (requestError) {
      showToast({ type: "error", title: "فشل استرجاع المستخدم", message: getErrorMessage(requestError, "تعذر استرجاع المستخدم.") });
    } finally {
      setActionKey("");
    }
  };

  const openPasswordModal = (user) => {
    setPasswordModal(user);
    setPasswordForm({ newPassword: "", confirmPassword: "" });
  };

  const submitPasswordChange = async () => {
    if (!token || !passwordModal?.id) return;
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showToast({ type: "error", title: "كلمة المرور غير متطابقة", message: "تأكد من كتابة كلمة المرور نفسها في خانة التأكيد." });
      return;
    }
    setActionKey(`password:${passwordModal.id}`);
    try {
      await changeAdminUserPassword(token, passwordModal.id, passwordForm.newPassword);
      showToast({ type: "success", title: "تم تغيير كلمة المرور بنجاح" });
      setPasswordModal(null);
      setPasswordForm({ newPassword: "", confirmPassword: "" });
      await loadUsers();
    } catch (requestError) {
      showToast({ type: "error", title: "فشل تغيير كلمة المرور", message: getErrorMessage(requestError, "تعذر تغيير كلمة المرور.") });
    } finally {
      setActionKey("");
    }
  };

  return (
    <div dir="rtl" className="admin-users-page">
      <section className="admin-users-hero">
        <div className="min-w-0">
          <p className="admin-users-kicker">مراجعة المستخدمين</p>
          <h1>مراجعة واعتماد الحسابات</h1>
        </div>
        <form
          className="admin-users-search-shell"
          onSubmit={(event) => {
            event.preventDefault();
            setAppliedSearch(search.trim());
          }}
        >
          <Search className="h-5 w-5" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="ابحث بالبريد الإلكتروني"
            aria-label="البحث عن المستخدمين بالبريد الإلكتروني"
          />
          <button type="button" onClick={() => { setSearch(""); setAppliedSearch(""); }} title="مسح البحث" aria-label="مسح البحث">
            <X className="h-4 w-4" />
            <span>مسح</span>
          </button>
        </form>
      </section>

      <section className="admin-users-stats">
        {stats.map((stat) => (
          <StatCard key={stat.id} stat={stat} />
        ))}
      </section>

      <section className="admin-users-filter-panel">
        <button
          type="button"
          className="admin-users-filter-toggle"
          onClick={() => setFiltersOpen((open) => !open)}
          aria-expanded={filtersOpen}
          aria-controls="admin-users-filters"
        >
          <span className="admin-users-filter-title">
            <Filter className="h-5 w-5" />
            <span>فلترة</span>
          </span>
          <ChevronDown className={`h-5 w-5 transition-transform duration-200 ${filtersOpen ? "rotate-180" : ""}`} />
        </button>

        <AnimatePresence initial={false}>
          {filtersOpen && (
            <motion.div
              id="admin-users-filters"
              className="admin-users-filter-content"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              <div className="admin-users-filterbar">
                <FilterField label="الحالة">
                  <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                    {statusOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </FilterField>
                <FilterField label="الترتيب">
                  <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
                    {sortOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </FilterField>
                <button type="button" className="admin-users-reset" onClick={() => setAppliedSearch(search.trim())}>
                  <Search className="h-4 w-4" />
                  <span>تطبيق</span>
                </button>
                <button type="button" className="admin-users-reset" onClick={loadUsers} disabled={loading}>
                  <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                  <span>تحديث</span>
                </button>
                <button type="button" className="admin-users-reset" onClick={resetFilters}>
                  <RotateCcw className="h-4 w-4" />
                  <span>إعادة ضبط</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      <section className="admin-users-table-card">
        <div className="admin-users-table-head">
          <div>
            <h2>المستخدمون</h2>
            <p>تم تحميل {numberFormat(users.length)} من أصل {numberFormat(pagination.total)} نتيجة</p>
          </div>
          <span>{statusFilter === "all" ? "الكل" : statusOptions.find((option) => option.value === statusFilter)?.label}</span>
        </div>

        {error && (
          <div className="m-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-700 dark:border-rose-400/20 dark:bg-rose-500/10 dark:text-rose-200">
            {error}
          </div>
        )}

        <div className="admin-users-list">
          {loading ? (
            Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="admin-user-row animate-pulse">
                <span className="h-12 w-12 rounded-full bg-slate-200 dark:bg-white/10" />
                <div className="h-10 flex-1 rounded-xl bg-slate-100 dark:bg-white/10" />
              </div>
            ))
          ) : users.length ? (
            users.map((user) => (
              <article key={user.id} className="admin-user-row">
                <Avatar user={user} />
                <div className="admin-user-main">
                  <div className="admin-user-name-line">
                    <h3>{user.name}</h3>
                  </div>
                  <p dir="ltr">{user.email || "-"}</p>
                </div>
                <div className="admin-user-meta-grid">
                  <div className="admin-user-meta-card admin-user-meta-identity">
                    <button type="button" className="admin-user-id" onClick={() => copyUserId(user.id)} title="نسخ معرّف المستخدم">
                      <Copy className="h-3.5 w-3.5" />
                      <span dir="ltr">{user.id}</span>
                    </button>
                    <span className="admin-user-group">{user.groupName}</span>
                  </div>
                  <div className="admin-user-meta-card admin-user-money">
                    <strong dir="ltr">{user.walletBalanceLabel}</strong>
                    <span>محفظة {user.currency}</span>
                  </div>
                  <div className="admin-user-meta-card admin-user-meta-status">
                    <span>{user.role === "SUPERVISOR" ? "مشرف" : "مستخدم"}</span>
                    <StatusBadge status={user.displayStatus} label={user.displayStatusLabel} />
                    <div className="admin-user-status-actions">
                      {user.displayStatus !== "DELETED" && user.status === "PENDING" && (
                        <>
                          <button
                            type="button"
                            className="rounded-xl bg-emerald-600 px-3 py-2 text-[10px] font-black text-white disabled:opacity-60"
                            onClick={() => requestUserReview(user, "approve")}
                            disabled={Boolean(actionKey)}
                          >
                            قبول
                          </button>
                          <button
                            type="button"
                            className="rounded-xl bg-rose-500/10 px-3 py-2 text-[10px] font-black text-rose-700 disabled:opacity-60 dark:text-rose-300"
                            onClick={() => requestUserReview(user, "reject")}
                            disabled={Boolean(actionKey)}
                          >
                            رفض
                          </button>
                        </>
                      )}
                      {user.displayStatus === "DELETED" ? (
                        <button
                          type="button"
                          className="admin-user-details-button"
                          onClick={() => handleRestoreUser(user)}
                          disabled={Boolean(actionKey)}
                        >
                          <RotateCcw className="h-4 w-4" />
                          <span>استرجاع المستخدم</span>
                        </button>
                      ) : user.displayStatus === "BLOCKED" ? (
                        <button
                          type="button"
                          className="admin-user-details-button"
                          onClick={() => handleUnblockUser(user)}
                          disabled={Boolean(actionKey)}
                        >
                          <ShieldCheck className="h-4 w-4" />
                          <span>إلغاء الحظر</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="admin-user-details-button"
                          onClick={() => handleBlockUser(user)}
                          disabled={Boolean(actionKey)}
                        >
                          <Ban className="h-4 w-4" />
                          <span>حظر</span>
                        </button>
                      )}
                      <button type="button" className="admin-user-details-button" onClick={() => openPasswordModal(user)} disabled={Boolean(actionKey) || user.displayStatus === "DELETED"}>
                        <KeyRound className="h-4 w-4" />
                        <span>تغيير كلمة المرور</span>
                      </button>
                      <button type="button" className="admin-user-details-button" onClick={() => openUserWallet(user.id)}>
                        <WalletCards className="h-4 w-4" />
                        <span>المحفظة والتحكم</span>
                      </button>
                      <button type="button" className="admin-user-details-button" onClick={() => setSelectedUserId(user.id)}>
                        <Eye className="h-4 w-4" />
                        <span>التفاصيل</span>
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))
          ) : (
            <div className="admin-user-empty-log">لا يوجد مستخدمون مطابقون للفلاتر الحالية.</div>
          )}
        </div>
      </section>

      <AnimatePresence>
        {selectedUser && (
          <UserDrawer
            key={selectedUser.id}
            user={selectedUser}
            busy={Boolean(actionKey)}
            onApprove={() => requestUserReview(selectedUser, "approve")}
            onBlock={() => handleBlockUser(selectedUser)}
            onClose={() => setSelectedUserId(null)}
            onCopy={copyUserId}
            onOpenWallet={() => openUserWallet(selectedUser.id)}
            onPassword={() => openPasswordModal(selectedUser)}
            onReject={() => requestUserReview(selectedUser, "reject")}
            onRestore={() => handleRestoreUser(selectedUser)}
            onUnblock={() => handleUnblockUser(selectedUser)}
            onUpdateIdentityVerification={handleIdentityVerificationUpdate}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {confirmation && (
          <ConfirmDialog
            confirmation={confirmation}
            busy={actionKey === `${confirmation.action}:${confirmation.userId}`}
            onCancel={() => setConfirmation(null)}
            onConfirm={executeReview}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {passwordModal && (
          <PasswordDialog
            busy={actionKey === `password:${passwordModal.id}`}
            form={passwordForm}
            user={passwordModal}
            onCancel={() => setPasswordModal(null)}
            onChange={setPasswordForm}
            onConfirm={submitPasswordChange}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function StatCard({ stat }) {
  const Icon = stat.icon;
  return (
    <article className={`admin-users-stat ${stat.tone}`}>
      <div>
        <span className="admin-users-stat-icon">
          <Icon className="h-5 w-5" />
        </span>
        <p>{stat.label}</p>
      </div>
      <strong>{numberFormat(stat.value)}</strong>
    </article>
  );
}

function FilterField({ label, children }) {
  return (
    <label className="admin-users-filter-field">
      <span>{label}</span>
      {children}
    </label>
  );
}

function Avatar({ user, large = false }) {
  return (
    <span className={`admin-user-avatar ${large ? "admin-user-avatar-large" : ""} bg-gradient-to-br ${getAvatarTone(user.id)}`}>
      {getInitials(user.name)}
    </span>
  );
}

function StatusBadge({ status, label }) {
  const arabicStatus = { ACTIVE: "نشط", BLOCKED: "محظور", DELETED: "محذوف", PENDING: "بانتظار المراجعة", REJECTED: "مرفوض" }[status];
  return (
    <span className={`admin-user-status ${statusTone[status] || statusTone.PENDING}`}>
      {arabicStatus || label || status}
    </span>
  );
}

function UserDrawer({ user, busy, onApprove, onBlock, onClose, onCopy, onOpenWallet, onPassword, onReject, onRestore, onUnblock, onUpdateIdentityVerification }) {
  const canReview = user.displayStatus !== "DELETED" && user.status === "PENDING";
  const [identityReason, setIdentityReason] = useState(user.identityVerificationReason || "");

  useEffect(() => {
    setIdentityReason(user.identityVerificationReason || "");
  }, [user.id, user.identityVerificationReason]);

  return (
    <div className="admin-user-drawer-layer">
      <button type="button" className="admin-user-drawer-backdrop" onClick={onClose} aria-label="إغلاق تفاصيل المستخدم" />
      <motion.aside
        className="admin-user-drawer"
        initial={{ x: 48, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 48, opacity: 0 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      >
        <header className="admin-user-drawer-header">
          <Avatar user={user} large />
          <div className="min-w-0 flex-1">
            <h2>{user.name}</h2>
            <button type="button" onClick={() => onCopy(user.id)} className="admin-user-drawer-id">
              <Copy className="h-3.5 w-3.5" />
              <span dir="ltr">{user.id}</span>
            </button>
          </div>
          <button type="button" className="admin-user-drawer-close" onClick={onClose} title="إغلاق">
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="admin-user-drawer-body">
          <DrawerSection icon={UserRound} title="مراجعة الحساب">
            <div className="admin-user-info-grid">
              <InfoItem label="الاسم" value={user.name} />
              <InfoItem label="البريد الإلكتروني" value={user.email || "-"} ltr />
              <InfoItem label="الهاتف" value={user.phone || "-"} ltr />
              <InfoItem label="الدولة" value={user.country || "-"} />
              <InfoItem label="العملة" value={user.currency} ltr />
              <InfoItem label="المجموعة" value={`${user.groupName}${user.groupPercentage !== null ? ` (${user.groupPercentage}%)` : ""}`} />
              <div className="admin-user-info-item">
                <span>الحالة</span>
                <StatusBadge status={user.displayStatus} label={user.displayStatusLabel} />
              </div>
              <InfoItem label="الدور" value={user.role === "SUPERVISOR" ? "مشرف" : "مستخدم"} />
              <InfoItem label="البريد موثّق" value={user.verified ? "نعم" : "لا"} />
              <InfoItem label="تاريخ التسجيل" value={formatDate(user.createdAt)} />
              <InfoItem label="تاريخ القبول" value={formatDate(user.approvedAt)} />
              <InfoItem label="تاريخ الرفض" value={formatDate(user.rejectedAt)} />
            </div>
          </DrawerSection>

          <DrawerSection icon={ShieldCheck} title="حالة الوكيل الفرعي">
            <div className="admin-user-info-grid">
              <InfoItem label="وكيل فرعي" value={user.isSubAgent ? "نعم" : "لا"} />
              <InfoItem label="حالة الوكيل الفرعي" value={user.subAgentStatus || "-"} />
              <InfoItem label="صلاحية المشرف" value={user.role === "SUPERVISOR" ? "مشرف" : "ليس مشرفًا"} />
            </div>
          </DrawerSection>

          <DrawerSection icon={ShieldAlert} title="طلب تأكيد الهوية">
            <div className="rounded-3xl border border-amber-200/70 bg-amber-50/70 p-4 dark:border-amber-400/20 dark:bg-amber-400/10">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-black text-slate-950 dark:text-white">طلب تأكيد الهوية</p>
                  <p className="mt-1 text-xs font-bold leading-6 text-slate-600 dark:text-slate-300">
                    فعّل هذا الخيار إذا كان المستخدم يحتاج إلى التواصل مع الدعم لتأكيد الهوية قبل الشراء أو الشحن.
                  </p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-black ${user.identityVerificationRequired ? "bg-amber-500 text-white" : "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300"}`}>
                  {user.identityVerificationRequired ? "مطلوب التحقق" : "لا يوجد طلب تحقق"}
                </span>
              </div>
              <label className="mt-4 block">
                <span className="text-xs font-black text-slate-500 dark:text-slate-400">سبب الطلب</span>
                <textarea
                  value={identityReason}
                  onChange={(event) => setIdentityReason(event.target.value)}
                  maxLength={500}
                  rows={3}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-900 outline-none transition focus:border-amber-400 focus:ring-4 focus:ring-amber-400/15 dark:border-white/10 dark:bg-white/5 dark:text-white"
                  placeholder="Payment gateway requested identity confirmation"
                />
              </label>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => onUpdateIdentityVerification(user, true, identityReason)}
                  disabled={busy}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-500 px-4 py-2.5 text-sm font-black text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <ShieldAlert className="h-4 w-4" />
                  <span>تفعيل طلب التحقق</span>
                </button>
                <button
                  type="button"
                  onClick={() => onUpdateIdentityVerification(user, false, identityReason)}
                  disabled={busy}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-4 py-2.5 text-sm font-black text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <ShieldCheck className="h-4 w-4" />
                  <span>إلغاء طلب التحقق</span>
                </button>
              </div>
            </div>
          </DrawerSection>

          <DrawerSection icon={WalletCards} title="ملخص المحفظة">
            <div className="admin-user-wallet-grid">
              <WalletItem label="رصيد المحفظة" value={user.walletBalanceLabel} strong />
              <WalletItem label="حد الائتمان" value={`${user.creditLimit.toFixed(2)} ${user.currency}`} />
              <WalletItem label="الائتمان المستخدم" value={`${user.creditUsed.toFixed(2)} ${user.currency}`} />
            </div>
            <button type="button" onClick={onOpenWallet} className="admin-user-details-button mt-3 w-full">
              <WalletCards className="h-4 w-4" />
              <span>المحفظة والتحكم</span>
            </button>
          </DrawerSection>
        </div>

        <footer className="admin-user-drawer-footer">
          {user.displayStatus === "DELETED" ? (
            <button type="button" onClick={onRestore} disabled={busy}>
              <RotateCcw className="h-4 w-4" />
              <span>استرجاع المستخدم</span>
            </button>
          ) : canReview ? (
            <>
              <button type="button" onClick={onApprove} className="admin-user-footer-primary" disabled={busy}>
                <CheckCircle2 className="h-4 w-4" />
                <span>قبول الحساب</span>
              </button>
              <button type="button" onClick={onReject} className="admin-user-footer-danger" disabled={busy}>
                <Ban className="h-4 w-4" />
                <span>رفض الحساب</span>
              </button>
            </>
          ) : (
            <>
              {user.displayStatus === "BLOCKED" ? (
                <button type="button" onClick={onUnblock} disabled={busy}>
                  <ShieldCheck className="h-4 w-4" />
                  <span>إلغاء الحظر</span>
                </button>
              ) : (
                <button type="button" onClick={onBlock} disabled={busy}>
                  <Ban className="h-4 w-4" />
                  <span>حظر المستخدم</span>
                </button>
              )}
              <button type="button" onClick={onPassword} disabled={busy}>
                <KeyRound className="h-4 w-4" />
                <span>تغيير كلمة المرور</span>
              </button>
            </>
          )}
        </footer>
      </motion.aside>
    </div>
  );
}

function DrawerSection({ icon: Icon, title, children }) {
  return (
    <section className="admin-user-drawer-section">
      <div className="admin-user-section-title">
        <span><Icon className="h-4 w-4" /></span>
        <h3>{title}</h3>
      </div>
      {children}
    </section>
  );
}

function InfoItem({ label, value, ltr = false }) {
  return (
    <div className="admin-user-info-item">
      <span>{label}</span>
      <strong dir={ltr ? "ltr" : undefined}>{value}</strong>
    </div>
  );
}

function WalletItem({ label, value, strong = false }) {
  return (
    <article className={strong ? "admin-user-wallet-item admin-user-wallet-strong" : "admin-user-wallet-item"}>
      <span>{label}</span>
      <strong dir="ltr">{value}</strong>
    </article>
  );
}

function PasswordDialog({ busy, form, user, onCancel, onChange, onConfirm }) {
  return (
    <div className="admin-user-confirm-layer">
      <motion.div
        className="admin-user-confirm"
        initial={{ opacity: 0, y: 14, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 14, scale: 0.98 }}
      >
        <span className="admin-user-confirm-icon">
          <KeyRound className="h-6 w-6" />
        </span>
        <h2>تغيير كلمة المرور</h2>
        <p>{user.name} - لا يتم عرض كلمة المرور بعد الحفظ.</p>
        <label className="mt-4 block text-right">
          <span className="mb-1 block text-[10px] font-black text-slate-500">كلمة المرور الجديدة</span>
          <input
            dir="ltr"
            type="password"
            value={form.newPassword}
            onChange={(event) => onChange((current) => ({ ...current, newPassword: event.target.value }))}
            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold outline-none focus:border-violet-400 dark:border-white/10 dark:bg-white/5 dark:text-white"
          />
        </label>
        <label className="mt-3 block text-right">
          <span className="mb-1 block text-[10px] font-black text-slate-500">تأكيد كلمة المرور</span>
          <input
            dir="ltr"
            type="password"
            value={form.confirmPassword}
            onChange={(event) => onChange((current) => ({ ...current, confirmPassword: event.target.value }))}
            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold outline-none focus:border-violet-400 dark:border-white/10 dark:bg-white/5 dark:text-white"
          />
        </label>
        <div>
          <button type="button" onClick={onCancel} disabled={busy}>إلغاء</button>
          <button type="button" onClick={onConfirm} disabled={busy || !form.newPassword || !form.confirmPassword}>
            {busy ? <RefreshCw className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
            <span>{busy ? "جارٍ الحفظ..." : "حفظ كلمة المرور"}</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function ConfirmDialog({ confirmation, busy, onCancel, onConfirm }) {
  const danger = confirmation.tone === "danger";
  const success = confirmation.tone === "success";
  return (
    <div className="admin-user-confirm-layer">
      <motion.div
        className="admin-user-confirm"
        initial={{ opacity: 0, y: 14, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 14, scale: 0.98 }}
      >
        <span className={danger ? "admin-user-confirm-icon-danger" : success ? "admin-user-confirm-icon-success" : "admin-user-confirm-icon"}>
          {danger ? <AlertTriangle className="h-6 w-6" /> : <ShieldCheck className="h-6 w-6" />}
        </span>
        <h2>{confirmation.title}</h2>
        <p>{confirmation.message}</p>
        <div>
          <button type="button" onClick={onCancel} disabled={busy}>إلغاء</button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className={danger ? "admin-user-confirm-danger" : success ? "admin-user-confirm-success" : ""}
          >
            {busy ? <RefreshCw className="h-4 w-4 animate-spin" /> : danger ? <Ban className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
            <span>{busy ? "جارٍ التنفيذ..." : confirmation.confirmLabel}</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
