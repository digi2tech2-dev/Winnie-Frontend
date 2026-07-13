import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  Copy,
  Eye,
  Filter,
  KeyRound,
  MoreVertical,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  UserCheck,
  UserRound,
  Users,
  WalletCards,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import {
  approveUser,
  blockAdminUser,
  changeAdminUserPassword,
  deleteAdminUser,
  getAdminUser,
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
  { value: "nameAsc", label: "الاسم", sortBy: "name", sortOrder: "asc" },
  { value: "highestBalance", label: "الرصيد", sortBy: "walletBalance", sortOrder: "desc" },
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
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [openActionUserId, setOpenActionUserId] = useState(null);
  const [actionMenuAnchor, setActionMenuAnchor] = useState(null);
  const [confirmation, setConfirmation] = useState(null);
  const [passwordModal, setPasswordModal] = useState(null);
  const [passwordForm, setPasswordForm] = useState({ newPassword: "", confirmPassword: "" });
  const [actionKey, setActionKey] = useState("");

  const selectedUser = users.find((user) => user.id === selectedUserId) || null;
  const actionMenuUser = users.find((user) => user.id === openActionUserId) || null;
  const closeActionMenu = useCallback(() => {
    setOpenActionUserId(null);
    setActionMenuAnchor(null);
  }, []);
  const toggleActionMenu = (userId, anchor) => {
    if (openActionUserId === userId) {
      closeActionMenu();
      return;
    }
    setOpenActionUserId(userId);
    setActionMenuAnchor(anchor);
  };
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
      const trimmedSearch = appliedSearch.trim();
      const looksLikeUserId = /^[a-f\d]{24}$/i.test(trimmedSearch);

      if (looksLikeUserId) {
        const result = await getAdminUser(token, trimmedSearch);
        const matchesStatus = statusFilter === "all" || result.user.displayStatus.toLowerCase() === statusFilter.toLowerCase() || result.user.status === statusFilter;
        const nextUsers = matchesStatus ? [result.user] : [];
        setUsers(nextUsers);
        setPagination({ page: 1, limit: 20, total: nextUsers.length, pages: 1 });
        return;
      }

      const result = await getAdminUsers(token, {
        page: 1,
        limit: 20,
        email: trimmedSearch,
        status: statusFilter === "all" ? undefined : statusFilter,
        includeDeleted: statusFilter === "all" || statusFilter === "deleted",
        includeBlocked: true,
        ...getSortQuery(sortBy),
      });
      setUsers(result.users);
      setPagination(result.pagination);
    } catch (requestError) {
      const message = getErrorMessage(requestError, "تعذر تحميل المستخدمين، حاول مرة أخرى");
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

  const requestUserStateChange = (user, action) => {
    const copy = {
      block: {
        title: "حظر المستخدم",
        message: "هل أنت متأكد من حظر هذا المستخدم؟",
        confirmLabel: "حظر المستخدم",
        tone: "danger",
      },
      unblock: {
        title: "إلغاء حظر المستخدم",
        message: "هل تريد إلغاء حظر هذا المستخدم؟",
        confirmLabel: "إلغاء الحظر",
        tone: "success",
      },
      delete: {
        title: "حذف المستخدم",
        message: "هل أنت متأكد من حذف هذا المستخدم؟",
        confirmLabel: "حذف المستخدم",
        tone: "danger",
      },
      restore: {
        title: "استرجاع المستخدم",
        message: "هل تريد استرجاع هذا المستخدم؟",
        confirmLabel: "استرجاع المستخدم",
        tone: "success",
      },
    }[action];

    if (!copy) return;
    setOpenActionUserId(null);
    setConfirmation({
      action,
      userId: user.id,
      ...copy,
    });
  };

  const executeConfirmedAction = async () => {
    if (!confirmation || !token) return;
    const key = `${confirmation.action}:${confirmation.userId}`;
    setActionKey(key);

    try {
      let result = null;

      if (confirmation.action === "approve") {
        result = await approveUser(token, confirmation.userId);
      } else if (confirmation.action === "reject") {
        result = await rejectUser(token, confirmation.userId);
      } else if (confirmation.action === "block") {
        result = await blockAdminUser(token, confirmation.userId, "");
      } else if (confirmation.action === "unblock") {
        result = await unblockAdminUser(token, confirmation.userId, "");
      } else if (confirmation.action === "delete") {
        result = await deleteAdminUser(token, confirmation.userId);
      } else if (confirmation.action === "restore") {
        result = await restoreAdminUser(token, confirmation.userId);
      }

      showToast({
        type: confirmation.tone === "danger" ? "warning" : "success",
        title: result?.message || confirmation.confirmLabel,
      });
      setConfirmation(null);
      await loadUsers();
    } catch (requestError) {
      const message = getErrorMessage(requestError, "فشل تنفيذ الإجراء.");
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

  const handleBlockUser = async (user) => {
    requestUserStateChange(user, "block");
  };

  const handleUnblockUser = async (user) => {
    requestUserStateChange(user, "unblock");
  };

  const handleRestoreUser = async (user) => {
    requestUserStateChange(user, "restore");
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
          <p className="admin-users-kicker">إدارة المستخدمين</p>
          <h1>المستخدمون</h1>
        </div>
      </section>

      <section className="admin-users-stats">
        {stats.map((stat) => (
          <StatCard key={stat.id} stat={stat} />
        ))}
      </section>

      <form
        className="admin-users-filter-panel admin-users-toolbar"
        onSubmit={(event) => {
          event.preventDefault();
          setAppliedSearch(search.trim());
        }}
      >
        <label className="admin-users-search-field">
          <Search className="h-4 w-4" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="ابحث بالاسم أو البريد الإلكتروني أو رقم المستخدم"
            aria-label="ابحث بالاسم أو البريد الإلكتروني أو رقم المستخدم"
          />
          {search && (
            <button type="button" onClick={() => setSearch("")} title="مسح البحث" aria-label="مسح البحث">
              <X className="h-4 w-4" />
            </button>
          )}
        </label>
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
        <button type="submit" className="admin-users-reset admin-users-apply">
          <Filter className="h-4 w-4" />
          <span>تطبيق</span>
        </button>
        <button type="button" className="admin-users-reset" onClick={resetFilters}>
          <RotateCcw className="h-4 w-4" />
          <span>إعادة ضبط</span>
        </button>
        <button type="button" className="admin-users-icon-button" onClick={loadUsers} disabled={loading} title="تحديث" aria-label="تحديث">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </form>

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
            Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="admin-user-table-skeleton animate-pulse">
                <span />
                <strong />
              </div>
            ))
          ) : users.length ? (
            <>
              <div className="admin-users-table-wrap">
                <table className="admin-users-table">
                  <thead>
                    <tr>
                      <th>المستخدم</th>
                      <th>الرصيد</th>
                      <th>المجموعة</th>
                      <th>الحالة</th>
                      <th>آخر نشاط / تاريخ الإنشاء</th>
                      <th>الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td>
                          <UserIdentity user={user} onCopy={copyUserId} />
                        </td>
                        <td>
                          <strong className="admin-user-balance" dir="ltr">{user.walletBalanceLabel}</strong>
                          <span className="admin-user-muted">{user.currency}</span>
                        </td>
                        <td><GroupBadge user={user} /></td>
                        <td><StatusBadge status={user.displayStatus} label={user.displayStatusLabel} /></td>
                        <td><DateCell user={user} /></td>
                        <td>
                          <UserActionTrigger
                            isOpen={openActionUserId === user.id}
                            user={user}
                            onDetails={() => { closeActionMenu(); setSelectedUserId(user.id); }}
                            onToggle={(anchor) => toggleActionMenu(user.id, anchor)}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="admin-users-mobile-list">
                {users.map((user) => (
                  <article key={user.id} className="admin-user-mobile-card">
                    <div className="admin-user-mobile-head">
                      <UserIdentity user={user} onCopy={copyUserId} />
                      <StatusBadge status={user.displayStatus} label={user.displayStatusLabel} />
                    </div>
                    <div className="admin-user-mobile-meta">
                      <span dir="ltr">{user.walletBalanceLabel}</span>
                      <GroupBadge user={user} />
                      <DateCell user={user} />
                    </div>
                    <UserActionTrigger
                      isOpen={openActionUserId === user.id}
                      user={user}
                      onDetails={() => { closeActionMenu(); setSelectedUserId(user.id); }}
                      onToggle={(anchor) => toggleActionMenu(user.id, anchor)}
                    />
                  </article>
                ))}
              </div>
            </>
          ) : (
            <div className="admin-user-empty-log">لا يوجد مستخدمون مطابقون للفلاتر الحالية</div>
          )}
        </div>
      </section>

      {actionMenuUser && actionMenuAnchor && (
        <UserActionsMenu
          actionKey={actionKey}
          anchor={actionMenuAnchor}
          user={actionMenuUser}
          onApprove={() => requestUserReview(actionMenuUser, "approve")}
          onBlock={() => handleBlockUser(actionMenuUser)}
          onClose={closeActionMenu}
          onDelete={() => requestUserStateChange(actionMenuUser, "delete")}
          onPassword={() => openPasswordModal(actionMenuUser)}
          onReject={() => requestUserReview(actionMenuUser, "reject")}
          onRestore={() => handleRestoreUser(actionMenuUser)}
          onUnblock={() => handleUnblockUser(actionMenuUser)}
          onWallet={() => openUserWallet(actionMenuUser.id)}
        />
      )}

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
            onConfirm={executeConfirmedAction}
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

function UserIdentity({ user, onCopy }) {
  return (
    <div className="admin-user-identity-cell">
      <Avatar user={user} />
      <div className="min-w-0">
        <strong title={user.name}>{user.name}</strong>
        <span dir="ltr" title={user.email || "-"}>{user.email || "-"}</span>
        <button type="button" onClick={() => onCopy(user.id)} title="نسخ معرّف المستخدم" aria-label="نسخ معرّف المستخدم">
          <Copy className="h-3.5 w-3.5" />
          <small dir="ltr">{user.id}</small>
        </button>
      </div>
    </div>
  );
}

function GroupBadge({ user }) {
  return (
    <span className="admin-user-group" title={user.groupName}>
      {user.groupName || "Default"}
    </span>
  );
}

function DateCell({ user }) {
  const activityDate = user.lastSeenAt || user.updatedAt || user.createdAt;
  return (
    <span className="admin-user-date-cell" title={activityDate ? formatDate(activityDate) : "غير متاح"}>
      {activityDate ? formatDate(activityDate) : "غير متاح"}
    </span>
  );
}

export function RowActions({
  actionKey,
  isOpen,
  user,
  onApprove,
  onBlock,
  onDelete,
  onDetails,
  onOpenChange,
  onPassword,
  onReject,
  onRestore,
  onUnblock,
  onWallet,
}) {
  const menuTriggerRef = useRef(null);
  const [menuPosition, setMenuPosition] = useState(null);
  const busy = Boolean(actionKey);
  const isDeleted = user.displayStatus === "DELETED";
  const isBlocked = user.displayStatus === "BLOCKED";
  const canReview = !isDeleted && user.status === "PENDING";

  const run = (handler) => {
    onOpenChange(false);
    handler();
  };

  useEffect(() => {
    if (!isOpen) {
      setMenuPosition(null);
      return undefined;
    }

    const updatePosition = () => {
      const rect = menuTriggerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const menuWidth = 210;
      const menuHeight = 270;
      const spaceBelow = window.innerHeight - rect.bottom;
      setMenuPosition({
        left: Math.max(8, Math.min(rect.right - menuWidth, window.innerWidth - menuWidth - 8)),
        top: spaceBelow >= menuHeight ? rect.bottom + 6 : Math.max(8, rect.top - menuHeight - 6),
      });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [isOpen]);

  return (
    <div className="admin-user-row-actions">
      <button type="button" className="admin-user-primary-action" onClick={onDetails}>
        <Eye className="h-4 w-4" />
        <span>التفاصيل</span>
      </button>
      <div className="admin-user-actions-menu">
        <button
          ref={menuTriggerRef}
          type="button"
          className="admin-user-menu-trigger"
          onClick={() => onOpenChange(!isOpen)}
          aria-expanded={isOpen}
          aria-label="إجراءات المستخدم"
        >
          <MoreVertical className="h-4 w-4" />
        </button>
        {createPortal(
          <AnimatePresence>
          {isOpen && menuPosition && (
            <motion.div
              className="admin-user-menu-popover"
              style={menuPosition}
              initial={{ opacity: 0, y: -4, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.98 }}
              transition={{ duration: 0.14, ease: "easeOut" }}
            >
              {isDeleted ? (
                <MenuButton icon={RotateCcw} label="استرجاع المستخدم" onClick={() => run(onRestore)} disabled={busy} />
              ) : (
                <>
                  {canReview && (
                    <>
                      <MenuButton icon={CheckCircle2} label="قبول الحساب" onClick={() => run(onApprove)} disabled={busy} />
                      <MenuButton icon={Ban} label="رفض الحساب" onClick={() => run(onReject)} disabled={busy} danger />
                      <span className="admin-user-menu-separator" />
                    </>
                  )}
                  <MenuButton icon={WalletCards} label="المحفظة والتحكم" onClick={() => run(onWallet)} disabled={busy} />
                  <MenuButton icon={KeyRound} label="تغيير كلمة المرور" onClick={() => run(onPassword)} disabled={busy} />
                  <span className="admin-user-menu-separator" />
                  {isBlocked ? (
                    <MenuButton icon={ShieldCheck} label="فك الحظر" onClick={() => run(onUnblock)} disabled={busy} />
                  ) : (
                    <MenuButton icon={Ban} label="حظر المستخدم" onClick={() => run(onBlock)} disabled={busy} danger />
                  )}
                  <MenuButton icon={Trash2} label="حذف المستخدم" onClick={() => run(onDelete)} disabled={busy} danger />
                </>
              )}
            </motion.div>
          )}
          </AnimatePresence>,
          document.body,
        )}
      </div>
    </div>
  );
}

function UserActionTrigger({ isOpen, user, onDetails, onToggle }) {
  return (
    <div className="admin-user-row-actions">
      <button type="button" className="admin-user-primary-action" onClick={onDetails}>
        <Eye className="h-4 w-4" />
        <span>التفاصيل</span>
      </button>
      <div className="admin-user-actions-menu">
        <button type="button" className="admin-user-menu-trigger" onClick={(event) => onToggle(event.currentTarget)} aria-expanded={isOpen} aria-haspopup="menu" aria-label={`إجراءات ${user.name}`}>
          <MoreVertical className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function UserActionsMenu({ actionKey, anchor, user, onApprove, onBlock, onClose, onDelete, onPassword, onReject, onRestore, onUnblock, onWallet }) {
  const menuRef = useRef(null);
  const [position, setPosition] = useState(null);
  const busy = Boolean(actionKey);
  const isDeleted = user.displayStatus === "DELETED";
  const isBlocked = user.displayStatus === "BLOCKED";
  const canReview = !isDeleted && user.status === "PENDING";
  const run = (handler) => { onClose(); handler(); };

  useEffect(() => {
    const updatePosition = () => {
      if (!anchor?.isConnected) { onClose(); return; }
      const rect = anchor.getBoundingClientRect();
      const width = menuRef.current?.offsetWidth || 210;
      const height = menuRef.current?.offsetHeight || 220;
      const edge = 12;
      const offset = 6;
      const direction = window.getComputedStyle(anchor).direction;
      const preferredLeft = direction === "rtl" ? rect.right - width : rect.left;
      setPosition({
        left: Math.max(edge, Math.min(preferredLeft, window.innerWidth - width - edge)),
        top: window.innerHeight - rect.bottom >= height + offset ? rect.bottom + offset : Math.max(edge, rect.top - height - offset),
      });
    };
    const handleOutside = (event) => {
      if (anchor.contains(event.target) || menuRef.current?.contains(event.target)) return;
      onClose();
    };
    const handleKeyDown = (event) => {
      if (event.key !== "Escape") return;
      onClose();
      anchor.focus();
    };
    updatePosition();
    const frameId = window.requestAnimationFrame(updatePosition);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    document.addEventListener("pointerdown", handleOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
      document.removeEventListener("pointerdown", handleOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [anchor, onClose]);

  if (!position) return null;
  return createPortal(
    <motion.div ref={menuRef} className="admin-user-menu-popover" style={position} role="menu" initial={{ opacity: 0, y: -4, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.14, ease: "easeOut" }}>
      {isDeleted ? <MenuButton icon={RotateCcw} label="استرجاع المستخدم" onClick={() => run(onRestore)} disabled={busy} /> : <>
        {canReview && <><MenuButton icon={CheckCircle2} label="قبول الحساب" onClick={() => run(onApprove)} disabled={busy} /><MenuButton icon={Ban} label="رفض الحساب" onClick={() => run(onReject)} disabled={busy} danger /><span className="admin-user-menu-separator" /></>}
        <MenuButton icon={WalletCards} label="المحفظة والتحكم" onClick={() => run(onWallet)} disabled={busy} />
        <MenuButton icon={KeyRound} label="تغيير كلمة المرور" onClick={() => run(onPassword)} disabled={busy} />
        <span className="admin-user-menu-separator" />
        {isBlocked ? <MenuButton icon={ShieldCheck} label="فك الحظر" onClick={() => run(onUnblock)} disabled={busy} /> : <MenuButton icon={Ban} label="حظر المستخدم" onClick={() => run(onBlock)} disabled={busy} danger />}
        <MenuButton icon={Trash2} label="حذف المستخدم" onClick={() => run(onDelete)} disabled={busy} danger />
      </>}
    </motion.div>,
    document.body,
  );
}

function MenuButton({ danger = false, disabled = false, icon: Icon, label, onClick }) {
  return (
    <button type="button" className={danger ? "admin-user-menu-item admin-user-menu-danger" : "admin-user-menu-item"} onClick={onClick} disabled={disabled}>
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </button>
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

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previousOverflow; };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return createPortal(
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
              <InfoItem label="معرّف المستخدم" value={user.id} ltr />
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
              <InfoItem label="سبب الحظر" value={user.blockReason || "-"} />
              <InfoItem label="تاريخ الحذف" value={formatDate(user.deletedAt)} />
              <InfoItem label="تاريخ التسجيل" value={formatDate(user.createdAt)} />
              <InfoItem label="آخر تحديث" value={formatDate(user.updatedAt)} />
              <InfoItem label="آخر نشاط" value={formatDate(user.lastSeenAt)} />
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
            {user.displayStatus !== "DELETED" && (
              <button type="button" onClick={onOpenWallet} className="admin-user-details-button mt-3 w-full">
                <WalletCards className="h-4 w-4" />
                <span>المحفظة والتحكم</span>
              </button>
            )}
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
    </div>,
    document.body,
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
