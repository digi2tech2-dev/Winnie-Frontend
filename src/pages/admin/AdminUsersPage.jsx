import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  BadgeDollarSign,
  Ban,
  CheckCircle2,
  Copy,
  Eye,
  Filter,
  KeyRound,
  LockKeyhole,
  LogOut,
  Mail,
  RotateCcw,
  Save,
  Search,
  Settings2,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  UserCheck,
  UserRound,
  Users,
  WalletCards,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useToast } from "../../components/ToastProvider";
import {
  adminUsers,
  formatUserDate,
  formatUserMoney,
  userCurrencies,
  userGroupRates,
  userGroups,
  userSortOptions,
  userStatusLabels,
  userStatusOptions,
} from "../../data/adminUsers";

const statConfig = [
  { id: "total", label: "إجمالي المستخدمين", icon: Users, tone: "admin-users-stat-total", change: 12.8 },
  { id: "active", label: "الحسابات المفعلة", icon: UserCheck, tone: "admin-users-stat-active", change: 9.4 },
];

const statusTone = {
  active: "admin-user-status-active",
  blocked: "admin-user-status-blocked",
};

const settingLabels = [
  { key: "apiEnabled", label: "تفعيل ربط API" },
  { key: "loginSuspended", label: "إيقاف تسجيل الدخول" },
  { key: "purchaseSuspended", label: "إيقاف الشراء" },
  { key: "topupSuspended", label: "إيقاف شحن الرصيد" },
  { key: "withdrawalSuspended", label: "إيقاف السحب" },
];

const balanceModes = [
  { value: "increase", label: "زيادة الرصيد", icon: ArrowUp },
  { value: "decrease", label: "خصم الرصيد", icon: ArrowDown },
  { value: "set", label: "تعيين رصيد جديد", icon: BadgeDollarSign },
];

function numberFormat(value) {
  return new Intl.NumberFormat("ar-EG-u-nu-latn").format(value);
}

function getInitials(name) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function parseAmount(value) {
  if (typeof value !== "string") return Number(value);
  const normalized = value
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
    .replace(/,/g, "")
    .trim();
  return Number(normalized);
}

function sortUsers(items, sortBy) {
  const sorted = [...items];
  const dateValue = (user) => new Date(user.registeredAt).getTime();

  if (sortBy === "oldest") return sorted.sort((a, b) => dateValue(a) - dateValue(b));
  if (sortBy === "highestBalance") return sorted.sort((a, b) => b.balance - a.balance);
  if (sortBy === "lowestBalance") return sorted.sort((a, b) => a.balance - b.balance);
  if (sortBy === "highestDebt") return sorted.sort((a, b) => b.debt - a.debt);
  if (sortBy === "lowestDebt") return sorted.sort((a, b) => a.debt - b.debt);
  return sorted.sort((a, b) => dateValue(b) - dateValue(a));
}

export default function AdminUsersPage() {
  const { showToast } = useToast();
  const [users, setUsers] = useState(adminUsers);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [groupFilter, setGroupFilter] = useState("");
  const [currencyFilter, setCurrencyFilter] = useState("all");
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [transactionFilter, setTransactionFilter] = useState("");
  const [balanceForm, setBalanceForm] = useState({ amount: "", mode: "increase", reason: "" });
  const [passwordForm, setPasswordForm] = useState({ password: "" });
  const [confirmation, setConfirmation] = useState(null);

  const selectedUser = users.find((user) => user.id === selectedUserId) || null;

  const selectedInvitedUsers = useMemo(() => {
    if (!selectedUser) return [];
    return users.filter((user) => user.id !== selectedUser.id && user.invitedBy?.name === selectedUser.name);
  }, [selectedUser, users]);

  const stats = useMemo(() => {
    const counts = {
      total: users.length,
      active: users.filter((user) => user.status === "active").length,
    };

    return statConfig.map((item) => ({
      ...item,
      value: counts[item.id],
    }));
  }, [users]);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = users.filter((user) => {
      const matchesSearch = !query || [user.name, user.email, user.id].some((value) => value.toLowerCase().includes(query));
      const matchesStatus = statusFilter === "all" || user.status === statusFilter;
      const matchesGroup = !groupFilter || user.group.toLowerCase().includes(groupFilter.toLowerCase());
      const matchesCurrency = currencyFilter === "all" || user.currency === currencyFilter;
      return matchesSearch && matchesStatus && matchesGroup && matchesCurrency;
    });

    return sortUsers(filtered, sortBy);
  }, [currencyFilter, groupFilter, search, sortBy, statusFilter, users]);

  const filteredTransactions = useMemo(() => {
    if (!selectedUser) return [];
    const query = transactionFilter.trim().toLowerCase();
    if (!query) return selectedUser.transactions;
    return selectedUser.transactions.filter((item) =>
      [item.id, item.type, item.reason, item.actor, item.status].some((value) => String(value).toLowerCase().includes(query)),
    );
  }, [selectedUser, transactionFilter]);

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setSortBy("newest");
    setGroupFilter("");
    setCurrencyFilter("all");
  };

  const copyUserId = async (userId) => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(userId);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = userId;
        textarea.setAttribute("readonly", "");
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      showToast({ title: "Copied Successfully", message: userId, type: "success", duration: 1800 });
    } catch {
      showToast({ title: "تعذر النسخ", message: userId, type: "error" });
    }
  };

  const updateUser = (userId, updater) => {
    setUsers((items) => items.map((user) => (user.id === userId ? updater(user) : user)));
  };

  const toggleSetting = (key) => {
    if (!selectedUser) return;
    updateUser(selectedUser.id, (user) => ({
      ...user,
      settings: {
        ...user.settings,
        [key]: !user.settings[key],
      },
    }));
  };

  const requestBalanceOperation = (event) => {
    event.preventDefault();
    if (!selectedUser) return;
    const amount = parseAmount(balanceForm.amount);
    const reason = balanceForm.reason.trim();
    if (!Number.isFinite(amount) || amount < 0 || !reason) {
      showToast({ title: "راجع بيانات العملية", message: "اكتب مبلغ صحيح وسبب واضح قبل التنفيذ.", type: "warning" });
      return;
    }

    const modeLabel = balanceModes.find((item) => item.value === balanceForm.mode)?.label || "تعديل الرصيد";
    setConfirmation({
      type: "balance",
      title: "تأكيد عملية الرصيد",
      message: `${modeLabel} بقيمة ${formatUserMoney(amount, selectedUser.currency)} للمستخدم ${selectedUser.name}.`,
      confirmLabel: "تنفيذ العملية",
      tone: "info",
      payload: { userId: selectedUser.id, amount, mode: balanceForm.mode, reason },
    });
  };

  const executeBalanceOperation = ({ userId, amount, mode, reason }) => {
    updateUser(userId, (user) => {
      const before = user.balance;
      const after = mode === "increase" ? before + amount : mode === "decrease" ? Math.max(0, before - amount) : amount;
      const type = mode === "increase" ? "إيداع" : mode === "decrease" ? "خصم" : "تعيين";
      return {
        ...user,
        balance: after,
        totalDeposits: mode === "increase" ? user.totalDeposits + amount : user.totalDeposits,
        totalDeductions: mode === "decrease" ? user.totalDeductions + amount : user.totalDeductions,
        totalTransactions: user.totalTransactions + 1,
        transactions: [
          {
            id: `TX-${Date.now().toString().slice(-5)}`,
            type,
            amount,
            before,
            after,
            reason,
            actor: "Admin",
            date: new Date().toISOString(),
            status: "مكتملة",
          },
          ...user.transactions,
        ],
        activity: [
          {
            type: type === "إيداع" ? "إضافة رصيد" : type === "خصم" ? "خصم رصيد" : "تعيين رصيد",
            time: "الآن",
            ip: user.lastIp,
            device: user.device,
            browser: user.browser,
          },
          ...user.activity,
        ],
      };
    });
    setBalanceForm({ amount: "", mode: "increase", reason: "" });
    showToast({ title: "تم تنفيذ العملية", message: "تم تحديث محفظة المستخدم بنجاح.", type: "success" });
  };

  const submitPassword = (event) => {
    event.preventDefault();
    if (!selectedUser) return;
    if (!passwordForm.password || passwordForm.password.length < 8) {
      showToast({ title: "كلمة المرور غير صحيحة", message: "اكتب كلمة مرور من 8 أحرف على الأقل.", type: "warning" });
      return;
    }
    setPasswordForm({ password: "" });
    showToast({ title: "تم تعيين كلمة المرور", message: selectedUser.name, type: "success" });
  };

  const updateAccountManagement = ({ debtLimit, group }) => {
    if (!selectedUser) return;
    const parsedDebtLimit = parseAmount(debtLimit);
    const groupPercentage = userGroupRates[group] ?? 0;

    if (!Number.isFinite(parsedDebtLimit) || parsedDebtLimit < 0) {
      showToast({ title: "حد الدين غير صحيح", message: "اكتب قيمة تساوي صفر أو أكبر.", type: "warning" });
      return;
    }
    if (!userGroups.includes(group)) {
      showToast({ title: "المجموعة غير صحيحة", message: "اختار مجموعة من القائمة.", type: "warning" });
      return;
    }
    updateUser(selectedUser.id, (user) => ({
      ...user,
      debtLimit: parsedDebtLimit,
      group,
      groupPercentage,
    }));
    showToast({ title: "تم تحديث إعدادات الحساب", message: `${group} · ${numberFormat(groupPercentage)}%`, type: "success" });
  };

  const updateUserCurrency = (currency) => {
    if (!selectedUser) return;
    if (!userCurrencies.includes(currency)) {
      showToast({ title: "العملة غير صحيحة", message: "اختار عملة من القائمة.", type: "warning" });
      return;
    }

    updateUser(selectedUser.id, (user) => ({
      ...user,
      currency,
      activity: [
        {
          type: `تغيير العملة إلى ${currency}`,
          time: "الآن",
          ip: user.lastIp,
          device: user.device,
          browser: user.browser,
        },
        ...user.activity,
      ],
    }));
    showToast({ title: "تم تغيير العملة", message: `${selectedUser.name} · ${currency}`, type: "success" });
  };

  const confirmAccountStatusChange = () => {
    if (!selectedUser) return;
    const willBlock = selectedUser.status !== "blocked";
    setConfirmation({
      type: "accountStatus",
      title: willBlock ? "حظر الحساب" : "استرجاع الحساب",
      message: willBlock
        ? `سيتم حظر ${selectedUser.name} وإيقاف تسجيل الدخول والشراء والشحن والسحب، مع بقاء بيانات الحساب قابلة للاسترجاع.`
        : `سيتم استرجاع ${selectedUser.name} وتفعيل الحساب مرة أخرى داخل هذه الواجهة.`,
      confirmLabel: willBlock ? "حظر الحساب" : "استرجاع الحساب",
      tone: willBlock ? "danger" : "success",
      payload: { userId: selectedUser.id, status: willBlock ? "blocked" : "active" },
    });
  };

  const executeConfirmation = () => {
    if (!confirmation) return;
    if (confirmation.type === "balance") {
      executeBalanceOperation(confirmation.payload);
    }
    if (confirmation.type === "accountStatus") {
      const targetStatus = confirmation.payload.status;
      const blocked = targetStatus === "blocked";
      const changedUser = users.find((user) => user.id === confirmation.payload.userId);
      updateUser(confirmation.payload.userId, (user) => ({
        ...user,
        status: targetStatus,
        settings: {
          ...user.settings,
          enabled: !blocked,
          disabled: blocked,
          loginSuspended: blocked,
          purchaseSuspended: blocked,
          topupSuspended: blocked,
          withdrawalSuspended: blocked,
        },
        activity: [
          {
            type: blocked ? "حظر الحساب" : "استرجاع الحساب",
            time: "الآن",
            ip: user.lastIp,
            device: user.device,
            browser: user.browser,
          },
          ...user.activity,
        ],
      }));
      showToast({
        title: blocked ? "تم حظر الحساب" : "تم استرجاع الحساب",
        message: changedUser?.name || "المستخدم",
        type: blocked ? "warning" : "success",
      });
    }
    setConfirmation(null);
  };

  return (
    <div dir="rtl" className="admin-users-page">
      <section className="admin-users-hero">
        <div className="min-w-0">
          <p className="admin-users-kicker">Users Management</p>
          <h1>إدارة المستخدمين</h1>
        </div>
        <div className="admin-users-search-shell">
          <Search className="h-5 w-5" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="ابحث بالاسم أو البريد الإلكتروني أو ID…"
            aria-label="البحث في المستخدمين"
          />
          <button type="button" onClick={() => setSearch("")} title="مسح البحث" aria-label="مسح البحث">
            <X className="h-4 w-4" />
            <span>مسح</span>
          </button>
        </div>
      </section>

      <section className="admin-users-stats">
        {stats.map((stat) => (
          <StatCard key={stat.id} stat={stat} />
        ))}
      </section>

      <section className="admin-users-filterbar">
        <Filter className="h-5 w-5 text-amber-600 dark:text-amber-300" />
        <FilterField label="الحالة">
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            {userStatusOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </FilterField>
        <FilterField label="الترتيب">
          <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
            {userSortOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </FilterField>
        <FilterField label="المجموعة">
          <input
            list="admin-user-groups"
            value={groupFilter}
            onChange={(event) => setGroupFilter(event.target.value)}
            placeholder="كل المجموعات"
          />
          <datalist id="admin-user-groups">
            {userGroups.map((group) => (
              <option key={group} value={group} />
            ))}
          </datalist>
        </FilterField>
        <FilterField label="العملة">
          <select value={currencyFilter} onChange={(event) => setCurrencyFilter(event.target.value)}>
            <option value="all">كل العملات</option>
            {userCurrencies.map((currency) => (
              <option key={currency} value={currency}>{currency}</option>
            ))}
          </select>
        </FilterField>
        <button type="button" className="admin-users-reset" onClick={resetFilters}>
          <RotateCcw className="h-4 w-4" />
          <span>Reset Filters</span>
        </button>
      </section>

      <section className="admin-users-table-card">
        <div className="admin-users-table-head">
          <div>
            <h2>المستخدمون</h2>
            <p>{numberFormat(filteredUsers.length)} نتيجة حسب الفلاتر الحالية</p>
          </div>
          <span>{numberFormat(users.length)} حساب</span>
        </div>

        <div className="admin-users-list">
          {filteredUsers.map((user) => (
            <article key={user.id} className="admin-user-row">
              <Avatar user={user} />
              <div className="admin-user-main">
                <div className="admin-user-name-line">
                  <h3>{user.name}</h3>
                  <InviterBadge inviter={user.invitedBy} />
                </div>
                <p>{user.email}</p>
              </div>
              <div className="admin-user-meta-grid">
                <div className="admin-user-meta-card admin-user-meta-identity">
                  <button type="button" className="admin-user-id" onClick={() => copyUserId(user.id)} title="Copy User ID">
                    <span dir="ltr">{user.id}</span>
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                  <span className="admin-user-group">{user.group}</span>
                </div>
                <div className="admin-user-meta-card admin-user-money">
                  <strong dir="ltr">{formatUserMoney(user.balance, user.currency)}</strong>
                  <span>{user.currency}</span>
                </div>
                <div className="admin-user-meta-card admin-user-meta-status">
                  <span>الحالة</span>
                  <div className="admin-user-status-actions">
                    <StatusBadge status={user.status} />
                    <button type="button" className="admin-user-details-button" onClick={() => setSelectedUserId(user.id)}>
                      <Eye className="h-4 w-4" />
                      <span>عرض التفاصيل</span>
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <AnimatePresence>
        {selectedUser && (
          <UserDrawer
            key={selectedUser.id}
            user={selectedUser}
            invitedUsers={selectedInvitedUsers}
            transactionFilter={transactionFilter}
            filteredTransactions={filteredTransactions}
            balanceForm={balanceForm}
            passwordForm={passwordForm}
            onClose={() => setSelectedUserId(null)}
            onTransactionFilter={setTransactionFilter}
            onBalanceForm={setBalanceForm}
            onBalanceSubmit={requestBalanceOperation}
            onPasswordForm={setPasswordForm}
            onPasswordSubmit={submitPassword}
            onToggleSetting={toggleSetting}
            onUpdateAccount={updateAccountManagement}
            onCurrencyChange={updateUserCurrency}
            onCopy={copyUserId}
            onAction={(type) => {
              const messages = {
                save: "تم حفظ التعديلات",
                reset: "تم إرسال رابط إعادة التعيين",
                email: "تم تجهيز بريد للمستخدم",
                logout: "تم تسجيل الخروج من جميع الأجهزة",
              };
              showToast({ title: messages[type], message: selectedUser.name, type: type === "logout" ? "warning" : "success" });
            }}
            onStatusChange={confirmAccountStatusChange}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {confirmation && (
          <ConfirmDialog
            confirmation={confirmation}
            onCancel={() => setConfirmation(null)}
            onConfirm={executeConfirmation}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function StatCard({ stat }) {
  const Icon = stat.icon;
  const positive = stat.change >= 0;
  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`admin-users-stat ${stat.tone}`}
    >
      <div>
        <span className="admin-users-stat-icon">
          <Icon className="h-5 w-5" />
        </span>
        <p>{stat.label}</p>
      </div>
      <strong>{numberFormat(stat.value)}</strong>
      <span className={positive ? "admin-users-change-positive" : "admin-users-change-negative"} dir="ltr">
        {positive ? "+" : ""}{stat.change.toFixed(1)}%
      </span>
    </motion.article>
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
    <span className={`admin-user-avatar ${large ? "admin-user-avatar-large" : ""} bg-gradient-to-br ${user.avatarTone}`}>
      {getInitials(user.name)}
    </span>
  );
}

function MiniAvatar({ person }) {
  if (!person) return null;
  if (person.avatarUrl) {
    return <img className="admin-user-mini-avatar" src={person.avatarUrl} alt={person.name} loading="lazy" />;
  }
  return (
    <span className={`admin-user-mini-avatar bg-gradient-to-br ${person.avatarTone || "from-slate-400 to-slate-600"}`}>
      {getInitials(person.name)}
    </span>
  );
}

function InviterBadge({ inviter }) {
  if (!inviter) return null;
  return (
    <span className="admin-user-inviter-badge" title={`مدعو بواسطة ${inviter.name}`}>
      <MiniAvatar person={inviter} />
      <span>مدعو من {inviter.name}</span>
    </span>
  );
}

function InviterInfo({ inviter }) {
  if (!inviter) return <strong>تسجيل مباشر</strong>;
  return (
    <span className="admin-user-inviter-info">
      <MiniAvatar person={inviter} />
      <strong>{inviter.name}</strong>
    </span>
  );
}

function InvitedAccountsList({ users, currency, onCopy }) {
  if (!users.length) {
    return <div className="admin-user-invited-empty">لا توجد حسابات دعوة ظاهرة في القائمة الحالية.</div>;
  }

  return (
    <div className="admin-user-invited-list">
      {users.map((user) => (
        <article key={user.id} className="admin-user-invited-row">
          <MiniAvatar person={user} />
          <div>
            <strong>{user.name}</strong>
            <button type="button" onClick={() => onCopy(user.id)} title="نسخ ID">
              <span dir="ltr">{user.id}</span>
              <Copy className="h-3 w-3" />
            </button>
          </div>
          <div className="admin-user-invited-earning">
            <span>الأرباح منه</span>
            <strong dir="ltr">{formatUserMoney(user.referralEarningGenerated || 0, currency)}</strong>
          </div>
        </article>
      ))}
    </div>
  );
}

function StatusBadge({ status }) {
  return (
    <span className={`admin-user-status ${statusTone[status] || statusTone.blocked}`}>
      {userStatusLabels[status] || status}
    </span>
  );
}

function UserDrawer({
  user,
  invitedUsers,
  transactionFilter,
  filteredTransactions,
  balanceForm,
  passwordForm,
  onClose,
  onTransactionFilter,
  onBalanceForm,
  onBalanceSubmit,
  onPasswordForm,
  onPasswordSubmit,
  onToggleSetting,
  onUpdateAccount,
  onCurrencyChange,
  onCopy,
  onAction,
  onStatusChange,
}) {
  const currentGroupPercentage = user.groupPercentage ?? userGroupRates[user.group] ?? 0;
  const [accountForm, setAccountForm] = useState({
    debtLimit: String(user.debtLimit),
    group: user.group,
  });
  const [transactionsOpen, setTransactionsOpen] = useState(false);

  useEffect(() => {
    setAccountForm({
      debtLimit: String(user.debtLimit),
      group: user.group,
    });
  }, [user.id, user.debtLimit, user.group, user.groupPercentage]);

  const availableBalance = Math.max(0, user.balance - user.frozenBalance) + Math.max(0, user.debtLimit - user.debt);

  return (
    <div className="admin-user-drawer-layer">
      <motion.button
        type="button"
        className="admin-user-drawer-backdrop"
        onClick={onClose}
        aria-label="إغلاق"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />
      <motion.aside
        className="admin-user-drawer"
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ duration: 0.24, ease: "easeOut" }}
      >
        <header className="admin-user-drawer-header">
          <div className="flex min-w-0 items-center gap-3">
            <Avatar user={user} large />
            <div className="min-w-0">
              <h2>{user.name}</h2>
              <button type="button" onClick={() => onCopy(user.id)} className="admin-user-drawer-id">
                <span dir="ltr">{user.id}</span>
                <Copy className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          <button type="button" className="admin-user-drawer-close" onClick={onClose} title="إغلاق">
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="admin-user-drawer-body">
          <DrawerSection icon={UserRound} title="معلومات الحساب">
            <div className="admin-account-info-groups">
              <div className="admin-account-info-group">
                <h4>بيانات التواصل</h4>
                <div className="admin-user-info-grid">
                  <InfoItem label="اسم صاحب الحساب" value={user.name} />
                  <InfoItem label="البريد الإلكتروني" value={user.email} />
                  <InfoItem label="رقم الهاتف" value={user.phone} />
                  <InfoItem label="الدولة" value={user.country} />
                </div>
              </div>

              <div className="admin-account-info-group">
                <h4>التصنيف والحالة</h4>
                <div className="admin-user-info-grid">
                  <InfoItem label="العملة" value={user.currency} />
                  <InfoItem label="المجموعة" value={`${user.group} · ${numberFormat(currentGroupPercentage)}%`} />
                  <div className="admin-user-info-item">
                    <span>الحالة</span>
                    <StatusBadge status={user.status} />
                  </div>
                </div>
              </div>

              <div className="admin-account-info-group">
                <h4>الأمان والجهاز</h4>
                <div className="admin-user-info-grid">
                  <InfoItem label="تاريخ التسجيل" value={formatUserDate(user.registeredAt)} />
                  <InfoItem label="آخر دخول" value={formatUserDate(user.lastLoginAt)} />
                  <InfoItem label="IP آخر تسجيل" value={user.lastIp} ltr />
                  <InfoItem label="الجهاز المستخدم" value={user.device} />
                  <InfoItem label="المتصفح" value={user.browser} />
                </div>
              </div>

              <div className="admin-account-info-group">
                <h4>الدعوات والأرباح</h4>
                <div className="admin-user-info-grid">
                  <div className="admin-user-info-item">
                    <span>مدعو بواسطة</span>
                    <InviterInfo inviter={user.invitedBy} />
                  </div>
                  <InfoItem label="كود الدعوة" value={user.referralCode || "—"} ltr />
                  <InfoItem label="عدد حسابات الدعوة" value={`${numberFormat(invitedUsers.length)} حساب`} />
                  <InfoItem label="أرباح الدعوات" value={formatUserMoney(user.referralEarnings || 0, user.currency)} ltr />
                </div>
                <div className="admin-user-invited-panel">
                  <div className="admin-user-invited-head">
                    <span>الحسابات التي دعاها</span>
                    <strong>{numberFormat(invitedUsers.length)}</strong>
                  </div>
                  <InvitedAccountsList users={invitedUsers} currency={user.currency} onCopy={onCopy} />
                </div>
              </div>
            </div>
          </DrawerSection>

          <DrawerSection icon={WalletCards} title="المحفظة">
            <div className="admin-user-wallet-grid">
              <WalletItem label="الرصيد الحالي" value={formatUserMoney(user.balance, user.currency)} strong />
              <WalletItem label="إجمالي الإيداعات" value={formatUserMoney(user.totalDeposits, user.currency)} />
              <WalletItem label="إجمالي الخصومات" value={formatUserMoney(user.totalDeductions, user.currency)} />
              <WalletItem label="إجمالي العمليات" value={numberFormat(user.totalTransactions)} />
              <WalletItem label="الرصيد المجمد" value={formatUserMoney(user.frozenBalance, user.currency)} />
              <WalletItem label="حد الدين" value={formatUserMoney(user.debtLimit, user.currency)} />
              <WalletItem label="الرصيد المتاح" value={formatUserMoney(availableBalance, user.currency)} strong />
            </div>
          </DrawerSection>

          <DrawerSection icon={BadgeDollarSign} title="تعديل الرصيد">
            <form className="admin-user-balance-form" onSubmit={onBalanceSubmit}>
              <div className="admin-user-balance-current">
                <div>
                  <span>الرصيد الحالي</span>
                  <strong dir="ltr">{formatUserMoney(user.balance, user.currency)}</strong>
                </div>
                <label className="admin-user-balance-currency">
                  <span>العملة</span>
                  <select value={user.currency} onChange={(event) => onCurrencyChange(event.target.value)}>
                    {userCurrencies.map((currency) => (
                      <option key={currency} value={currency}>{currency}</option>
                    ))}
                  </select>
                </label>
              </div>
              <label className="admin-user-balance-field admin-user-balance-mode-field">
                <span>نوع العملية</span>
                <select
                  value={balanceForm.mode}
                  onChange={(event) => onBalanceForm((current) => ({ ...current, mode: event.target.value }))}
                >
                  {balanceModes.map((mode) => (
                    <option key={mode.value} value={mode.value}>{mode.label}</option>
                  ))}
                </select>
              </label>
              <label className="admin-user-balance-field">
                <span>المبلغ</span>
                <input
                  inputMode="decimal"
                  placeholder={`0.00 ${user.currency}`}
                  value={balanceForm.amount}
                  onChange={(event) => onBalanceForm((current) => ({ ...current, amount: event.target.value }))}
                />
              </label>
              <label className="admin-user-balance-field admin-user-balance-reason-field">
                <span>سبب العملية</span>
                <textarea
                  placeholder="مثال: تعويض طلب أو تسوية يدوية"
                  value={balanceForm.reason}
                  onChange={(event) => onBalanceForm((current) => ({ ...current, reason: event.target.value }))}
                />
              </label>
              <button type="submit">
                <CheckCircle2 className="h-5 w-5" />
                <span>تنفيذ العملية</span>
              </button>
            </form>
          </DrawerSection>

          <button
            type="button"
            className="admin-user-transactions-trigger"
            onClick={() => {
              onTransactionFilter("");
              setTransactionsOpen(true);
            }}
          >
            <span className="admin-user-transactions-trigger-icon"><WalletCards className="h-5 w-5" /></span>
            <span className="admin-user-transactions-trigger-copy">
              <strong>سجل العمليات المالية</strong>
              <small>{numberFormat(user.transactions.length)} عملية</small>
            </span>
            <Eye className="h-5 w-5" />
          </button>

          <DrawerSection icon={Smartphone} title="سجل النشاط">
            <div className="admin-user-timeline">
              {user.activity.map((item) => (
                <article key={`${item.type}-${item.time}`}>
                  <span />
                  <div>
                    <h3>{item.type}</h3>
                    <p>{item.time} · {item.ip} · {item.device} · {item.browser}</p>
                  </div>
                </article>
              ))}
            </div>
          </DrawerSection>

          <DrawerSection icon={LockKeyhole} title="تغيير كلمة المرور">
            <form className="admin-user-password-form" onSubmit={onPasswordSubmit}>
              <input
                type="password"
                placeholder="كلمة المرور الجديدة"
                value={passwordForm.password}
                onChange={(event) => onPasswordForm((current) => ({ ...current, password: event.target.value }))}
              />
              <button type="submit">
                <KeyRound className="h-4 w-4" />
                <span>تعيين كلمة مرور جديدة</span>
              </button>
            </form>
          </DrawerSection>

          <DrawerSection icon={Settings2} title="إعدادات الحساب">
            <form
              className="admin-user-account-form"
              onSubmit={(event) => {
                event.preventDefault();
                onUpdateAccount(accountForm);
              }}
            >
              <label>
                <span>المجموعة الحالية</span>
                <select
                  value={accountForm.group}
                  onChange={(event) => {
                    const group = event.target.value;
                    setAccountForm((current) => ({ ...current, group }));
                  }}
                >
                  {userGroups.map((group) => (
                    <option key={group} value={group}>{group} · {numberFormat(userGroupRates[group] ?? 0)}%</option>
                  ))}
                </select>
              </label>
              <label className="admin-user-debt-limit-field">
                <span>حد الدين للحساب</span>
                <span className="admin-user-currency-field">
                  <input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="0.01"
                    value={accountForm.debtLimit}
                    onChange={(event) => setAccountForm((current) => ({ ...current, debtLimit: event.target.value }))}
                  />
                  <b>{user.currency}</b>
                </span>
              </label>
              <button type="submit">
                <Save className="h-4 w-4" />
                <span>حفظ المجموعة وحد الدين</span>
              </button>
            </form>
            <div className="admin-user-switch-grid">
              {settingLabels.map((setting) => (
                <label key={setting.key} className="admin-user-switch">
                  <span>{setting.label}</span>
                  <input
                    type="checkbox"
                    checked={Boolean(user.settings[setting.key])}
                    onChange={() => onToggleSetting(setting.key)}
                  />
                  <i />
                </label>
              ))}
            </div>
          </DrawerSection>
        </div>

        <footer className="admin-user-drawer-footer">
          <button type="button" onClick={() => onAction("save")} className="admin-user-footer-primary">
            <Save className="h-4 w-4" />
            <span>حفظ التعديلات</span>
          </button>
          <button type="button" onClick={() => onAction("reset")}>
            <KeyRound className="h-4 w-4" />
            <span>إعادة تعيين كلمة المرور</span>
          </button>
          <button type="button" onClick={() => onAction("email")}>
            <Mail className="h-4 w-4" />
            <span>إرسال بريد للمستخدم</span>
          </button>
          <button type="button" onClick={() => onAction("logout")}>
            <LogOut className="h-4 w-4" />
            <span>تسجيل خروج من جميع الأجهزة</span>
          </button>
          <button
            type="button"
            onClick={onStatusChange}
            className={user.status === "blocked" ? "admin-user-footer-restore" : "admin-user-footer-danger"}
          >
            {user.status === "blocked" ? <UserCheck className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
            <span>{user.status === "blocked" ? "استرجاع الحساب" : "حظر الحساب"}</span>
          </button>
        </footer>
      </motion.aside>

      <AnimatePresence>
        {transactionsOpen && (
          <TransactionsDialog
            user={user}
            transactions={filteredTransactions}
            filter={transactionFilter}
            onFilter={onTransactionFilter}
            onClose={() => setTransactionsOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function TransactionsDialog({ user, transactions, filter, onFilter, onClose }) {
  return (
    <motion.div
      className="admin-user-transactions-layer"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <button type="button" className="admin-user-transactions-backdrop" onClick={onClose} aria-label="إغلاق سجل العمليات" />
      <motion.section
        className="admin-user-transactions-dialog"
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 18, scale: 0.98 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      >
        <header>
          <div>
            <h2>سجل العمليات المالية</h2>
            <p>{user.name} · {numberFormat(user.transactions.length)} عملية</p>
          </div>
          <button type="button" onClick={onClose} title="إغلاق" aria-label="إغلاق">
            <X className="h-5 w-5" />
          </button>
        </header>
        <div className="admin-user-transactions-dialog-body">
          <div className="admin-user-log-filter">
            <Search className="h-4 w-4" />
            <input
              value={filter}
              onChange={(event) => onFilter(event.target.value)}
              placeholder="فلترة السجل بالرقم أو النوع أو السبب…"
              autoFocus
            />
          </div>
          {transactions.length ? (
            <div className="admin-user-transactions">
              <table>
                <thead>
                  <tr>
                    <th>رقم العملية</th>
                    <th>النوع</th>
                    <th>المبلغ</th>
                    <th>قبل</th>
                    <th>بعد</th>
                    <th>السبب</th>
                    <th>بواسطة</th>
                    <th>التاريخ</th>
                    <th>الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((transaction) => (
                    <tr key={transaction.id}>
                      <td dir="ltr">{transaction.id}</td>
                      <td>{transaction.type}</td>
                      <td dir="ltr">{formatUserMoney(transaction.amount, user.currency)}</td>
                      <td dir="ltr">{formatUserMoney(transaction.before, user.currency)}</td>
                      <td dir="ltr">{formatUserMoney(transaction.after, user.currency)}</td>
                      <td>{transaction.reason}</td>
                      <td>{transaction.actor}</td>
                      <td>{formatUserDate(transaction.date)}</td>
                      <td><span>{transaction.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="admin-user-empty-log">لا توجد عمليات مالية مطابقة.</div>
          )}
        </div>
      </motion.section>
    </motion.div>
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

function ConfirmDialog({ confirmation, onCancel, onConfirm }) {
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
          {danger ? <ShieldAlert className="h-6 w-6" /> : <ShieldCheck className="h-6 w-6" />}
        </span>
        <h2>{confirmation.title}</h2>
        <p>{confirmation.message}</p>
        <div>
          <button type="button" onClick={onCancel}>إلغاء</button>
          <button
            type="button"
            onClick={onConfirm}
            className={danger ? "admin-user-confirm-danger" : success ? "admin-user-confirm-success" : ""}
          >
            {danger && <Ban className="h-4 w-4" />}
            <span>{confirmation.confirmLabel}</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
