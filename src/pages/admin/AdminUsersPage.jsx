import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  Copy,
  Eye,
  Filter,
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
import { approveUser, getAdminUsers, rejectUser } from "../../api/adminUsers";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../components/ToastProvider";

const statusOptions = [
  { value: "all", label: "All statuses" },
  { value: "PENDING", label: "Pending review" },
  { value: "ACTIVE", label: "Active" },
  { value: "REJECTED", label: "Rejected" },
];

const sortOptions = [
  { value: "newest", label: "Newest", sortBy: "createdAt", sortOrder: "desc" },
  { value: "oldest", label: "Oldest", sortBy: "createdAt", sortOrder: "asc" },
  { value: "nameAsc", label: "Name A-Z", sortBy: "name", sortOrder: "asc" },
  { value: "emailAsc", label: "Email A-Z", sortBy: "email", sortOrder: "asc" },
  { value: "highestBalance", label: "Highest balance", sortBy: "walletBalance", sortOrder: "desc" },
  { value: "lowestBalance", label: "Lowest balance", sortBy: "walletBalance", sortOrder: "asc" },
];

const statusTone = {
  ACTIVE: "admin-user-status-active",
  PENDING: "bg-amber-500/12 text-amber-700 dark:text-amber-300",
  REJECTED: "admin-user-status-blocked",
};

const statConfig = [
  { id: "total", label: "Total users", icon: Users, tone: "admin-users-stat-total" },
  { id: "pending", label: "Pending review", icon: ShieldAlert, tone: "admin-users-stat-active" },
  { id: "active", label: "Active accounts", icon: UserCheck, tone: "admin-users-stat-active" },
  { id: "rejected", label: "Rejected accounts", icon: Ban, tone: "admin-users-stat-total" },
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
  const [confirmation, setConfirmation] = useState(null);
  const [actionKey, setActionKey] = useState("");

  const selectedUser = users.find((user) => user.id === selectedUserId) || null;
  const openUserWallet = useCallback((userId) => {
    navigate(`/admin/tools/users/${userId}/wallet`);
  }, [navigate]);

  const loadUsers = useCallback(async () => {
    if (!token) {
      setUsers([]);
      setError("Admin session is required.");
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
        ...getSortQuery(sortBy),
      });
      setUsers(result.users);
      setPagination(result.pagination);
    } catch (requestError) {
      const message = getErrorMessage(requestError, "Unable to load users.");
      setError(message);
      showToast({ type: "error", title: "Users not loaded", message });
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
      active: users.filter((user) => user.status === "ACTIVE").length,
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
      showToast({ title: "Copied", message: userId, type: "success", duration: 1800 });
    } catch {
      showToast({ title: "Copy failed", message: userId, type: "error" });
    }
  };

  const requestUserReview = (user, action) => {
    setConfirmation({
      action,
      userId: user.id,
      title: action === "approve" ? "Approve user account" : "Reject user account",
      message: `${action === "approve" ? "Approve" : "Reject"} ${user.name} (${user.email})? The backend account status will be the source of truth.`,
      confirmLabel: action === "approve" ? "Approve account" : "Reject account",
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
        title: result.message || (confirmation.action === "approve" ? "User approved" : "User rejected"),
      });
      setConfirmation(null);
      await loadUsers();
    } catch (requestError) {
      const message = getErrorMessage(requestError, "User review action failed.");
      showToast({ type: "error", title: "Action failed", message });
    } finally {
      setActionKey("");
    }
  };

  return (
    <div dir="rtl" className="admin-users-page">
      <section className="admin-users-hero">
        <div className="min-w-0">
          <p className="admin-users-kicker">Users Review</p>
          <h1>Account approval review</h1>
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
            placeholder="Search by email"
            aria-label="Search users by email"
          />
          <button type="button" onClick={() => { setSearch(""); setAppliedSearch(""); }} title="Clear search" aria-label="Clear search">
            <X className="h-4 w-4" />
            <span>Clear</span>
          </button>
        </form>
      </section>

      <section className="admin-users-stats">
        {stats.map((stat) => (
          <StatCard key={stat.id} stat={stat} />
        ))}
      </section>

      <section className="admin-users-filterbar">
        <Filter className="h-5 w-5 text-amber-600 dark:text-amber-300" />
        <FilterField label="Status">
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </FilterField>
        <FilterField label="Sort">
          <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </FilterField>
        <button type="button" className="admin-users-reset" onClick={() => setAppliedSearch(search.trim())}>
          <Search className="h-4 w-4" />
          <span>Apply</span>
        </button>
        <button type="button" className="admin-users-reset" onClick={loadUsers} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </button>
        <button type="button" className="admin-users-reset" onClick={resetFilters}>
          <RotateCcw className="h-4 w-4" />
          <span>Reset</span>
        </button>
      </section>

      <section className="admin-users-table-card">
        <div className="admin-users-table-head">
          <div>
            <h2>Users</h2>
            <p>{numberFormat(users.length)} loaded from {numberFormat(pagination.total)} backend result(s)</p>
          </div>
          <span>{statusFilter === "all" ? "All" : statusFilter}</span>
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
                    <button type="button" className="admin-user-id" onClick={() => copyUserId(user.id)} title="Copy User ID">
                      <Copy className="h-3.5 w-3.5" />
                      <span dir="ltr">{user.id}</span>
                    </button>
                    <span className="admin-user-group">{user.groupName}</span>
                  </div>
                  <div className="admin-user-meta-card admin-user-money">
                    <strong dir="ltr">{user.walletBalanceLabel}</strong>
                    <span>{user.currency} wallet</span>
                  </div>
                  <div className="admin-user-meta-card admin-user-meta-status">
                    <span>{user.roleLabel}</span>
                    <StatusBadge status={user.status} label={user.statusLabel} />
                    <div className="admin-user-status-actions">
                      {user.status === "PENDING" && (
                        <>
                          <button
                            type="button"
                            className="rounded-xl bg-emerald-600 px-3 py-2 text-[10px] font-black text-white disabled:opacity-60"
                            onClick={() => requestUserReview(user, "approve")}
                            disabled={Boolean(actionKey)}
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            className="rounded-xl bg-rose-500/10 px-3 py-2 text-[10px] font-black text-rose-700 disabled:opacity-60 dark:text-rose-300"
                            onClick={() => requestUserReview(user, "reject")}
                            disabled={Boolean(actionKey)}
                          >
                            Reject
                          </button>
                        </>
                      )}
                      <button type="button" className="admin-user-details-button" onClick={() => openUserWallet(user.id)}>
                        <WalletCards className="h-4 w-4" />
                        <span>Wallet</span>
                      </button>
                      <button type="button" className="admin-user-details-button" onClick={() => setSelectedUserId(user.id)}>
                        <Eye className="h-4 w-4" />
                        <span>Details</span>
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))
          ) : (
            <div className="admin-user-empty-log">No users matched the current backend filters.</div>
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
            onClose={() => setSelectedUserId(null)}
            onCopy={copyUserId}
            onOpenWallet={() => openUserWallet(selectedUser.id)}
            onReject={() => requestUserReview(selectedUser, "reject")}
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
  return (
    <span className={`admin-user-status ${statusTone[status] || statusTone.PENDING}`}>
      {label || status}
    </span>
  );
}

function UserDrawer({ user, busy, onApprove, onClose, onCopy, onOpenWallet, onReject }) {
  const canReview = user.status === "PENDING";
  return (
    <div className="admin-user-drawer-layer">
      <button type="button" className="admin-user-drawer-backdrop" onClick={onClose} aria-label="Close user details" />
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
          <button type="button" className="admin-user-drawer-close" onClick={onClose} title="Close">
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="admin-user-drawer-body">
          <DrawerSection icon={UserRound} title="Account review">
            <div className="admin-user-info-grid">
              <InfoItem label="Name" value={user.name} />
              <InfoItem label="Email" value={user.email || "-"} ltr />
              <InfoItem label="Phone" value={user.phone || "-"} ltr />
              <InfoItem label="Country" value={user.country || "-"} />
              <InfoItem label="Currency" value={user.currency} ltr />
              <InfoItem label="Group" value={`${user.groupName}${user.groupPercentage !== null ? ` (${user.groupPercentage}%)` : ""}`} />
              <div className="admin-user-info-item">
                <span>Status</span>
                <StatusBadge status={user.status} label={user.statusLabel} />
              </div>
              <InfoItem label="Role" value={user.roleLabel} />
              <InfoItem label="Email verified" value={user.verified ? "Yes" : "No"} />
              <InfoItem label="Registered" value={formatDate(user.createdAt)} />
              <InfoItem label="Approved at" value={formatDate(user.approvedAt)} />
              <InfoItem label="Rejected at" value={formatDate(user.rejectedAt)} />
            </div>
          </DrawerSection>

          <DrawerSection icon={ShieldCheck} title="Sub-agent business status">
            <div className="admin-user-info-grid">
              <InfoItem label="Sub-agent" value={user.isSubAgent ? "Yes" : "No"} />
              <InfoItem label="Sub-agent status" value={user.subAgentStatus} />
              <InfoItem label="Supervisor role" value={user.role === "SUPERVISOR" ? "Supervisor" : "Not supervisor"} />
            </div>
          </DrawerSection>

          <DrawerSection icon={WalletCards} title="Wallet snapshot">
            <div className="admin-user-wallet-grid">
              <WalletItem label="Wallet balance" value={user.walletBalanceLabel} strong />
              <WalletItem label="Credit limit" value={`${user.creditLimit.toFixed(2)} ${user.currency}`} />
              <WalletItem label="Credit used" value={`${user.creditUsed.toFixed(2)} ${user.currency}`} />
            </div>
            <button type="button" onClick={onOpenWallet} className="admin-user-details-button mt-3 w-full">
              <WalletCards className="h-4 w-4" />
              <span>Wallet & Transactions</span>
            </button>
          </DrawerSection>
        </div>

        <footer className="admin-user-drawer-footer">
          {canReview ? (
            <>
              <button type="button" onClick={onApprove} className="admin-user-footer-primary" disabled={busy}>
                <CheckCircle2 className="h-4 w-4" />
                <span>Approve account</span>
              </button>
              <button type="button" onClick={onReject} className="admin-user-footer-danger" disabled={busy}>
                <Ban className="h-4 w-4" />
                <span>Reject account</span>
              </button>
            </>
          ) : (
            <button type="button" onClick={onClose}>
              <Eye className="h-4 w-4" />
              <span>Review only</span>
            </button>
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
          <button type="button" onClick={onCancel} disabled={busy}>Cancel</button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className={danger ? "admin-user-confirm-danger" : success ? "admin-user-confirm-success" : ""}
          >
            {busy ? <RefreshCw className="h-4 w-4 animate-spin" /> : danger ? <Ban className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
            <span>{busy ? "Working..." : confirmation.confirmLabel}</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
