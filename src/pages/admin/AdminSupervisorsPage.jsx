import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { createPortal } from "react-dom";
import { Activity, Check, ChevronDown, ClipboardList, Pencil, Plus, Search, ShieldCheck, Trash2, UserCog, Users } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import {
  assignSupervisor,
  getAllSupervisorLogs,
  getSupervisorLogs,
  listEligibleSupervisorUsers,
  listSupervisorPermissions,
  listSupervisors,
  removeSupervisor,
  updateSupervisorPermissions,
} from "../../api/adminSupervisors";
import { useToast } from "../../components/ToastProvider";
import { SkeletonBlock } from "../../components/Skeletons";
import EmptyState from "../../components/EmptyState";
import ConfirmDialog from "../../components/admin/products/ConfirmDialog";

export default function AdminSupervisorsPage() {
  const [supervisors, setSupervisors] = useState([]);
  const [permissionGroups, setPermissionGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [wizard, setWizard] = useState(null);
  const [logsFor, setLogsFor] = useState(undefined);
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsError, setLogsError] = useState("");
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);
  const { token } = useAuth();
  const { showToast } = useToast();

  const loadSupervisors = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const result = await listSupervisors(token, { page: 1, limit: 20, status: "active" });
      setSupervisors(result.supervisors);
    } catch (err) {
      setError(err.userMessage || err.message || "تعذر تحميل المشرفين");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadSupervisors();
  }, [loadSupervisors]);

  useEffect(() => {
    if (!token) return undefined;
    let cancelled = false;
    listSupervisorPermissions(token)
      .then((result) => {
        if (!cancelled) setPermissionGroups(result.groups);
      })
      .catch(() => {
        if (!cancelled) setPermissionGroups([]);
      });
    return () => { cancelled = true; };
  }, [token]);

  useEffect(() => {
    if (logsFor === undefined || !token) return undefined;
    let cancelled = false;
    setLogsLoading(true);
    setLogsError("");
    setLogs([]);
    const request = logsFor ? getSupervisorLogs(token, logsFor.id, { page: 1, limit: 50 }) : getAllSupervisorLogs(token, { page: 1, limit: 50 });
    request
      .then((result) => {
        if (!cancelled) setLogs(result.logs);
      })
      .catch((err) => {
        if (!cancelled) setLogsError(err.userMessage || err.message || "تعذر تحميل السجلات");
      })
      .finally(() => {
        if (!cancelled) setLogsLoading(false);
      });
    return () => { cancelled = true; };
  }, [logsFor, token]);

  const saveSupervisor = async (candidate, permissions) => {
    if (!token || busy) return;
    setBusy(true);
    try {
      const isExistingSupervisor = supervisors.some((item) => item.id === candidate.id);
      if (isExistingSupervisor) {
        await updateSupervisorPermissions(token, candidate.id, permissions);
        showToast({ type: "success", title: "تم حفظ الصلاحيات", message: candidate.name });
      } else {
        await assignSupervisor(token, { userId: candidate.id, permissions });
        showToast({ type: "success", title: "تم تعيين المستخدم كمشرف بنجاح", message: candidate.name });
      }
      setWizard(null);
      await loadSupervisors();
    } catch (err) {
      showToast({ type: "error", title: "تعذر حفظ المشرف", message: err.userMessage || err.message });
    } finally {
      setBusy(false);
    }
  };

  const confirmRemove = async () => {
    if (!token || !deleting || busy) return;
    setBusy(true);
    try {
      await removeSupervisor(token, deleting.id);
      showToast({ type: "success", title: "تمت إزالة صلاحيات المشرف" });
      setDeleting(null);
      await loadSupervisors();
    } catch (err) {
      showToast({ type: "error", title: "تعذر إزالة صلاحيات المشرف", message: err.userMessage || err.message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div dir="rtl" className="space-y-4">
      <PageHeader onAdd={() => setWizard({ stage: "search" })} />
      {loading ? <Loading /> : error ? (
        <EmptyState icon={ShieldCheck} title="تعذر تحميل المشرفين" description={error} actionLabel="إعادة المحاولة" onAction={loadSupervisors} />
      ) : supervisors.length ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {supervisors.map((supervisor) => (
              <SupervisorCard key={supervisor.id} supervisor={supervisor} logCount={supervisor.logsCount} onPermissions={() => setWizard({ stage: "permissions", candidate: supervisor })} onLogs={() => setLogsFor(supervisor)} onDelete={() => setDeleting(supervisor)} />
            ))}
          </div>
          <button type="button" onClick={() => setLogsFor(null)} className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-violet-200 bg-violet-50 text-xs font-black text-violet-700 dark:border-violet-400/20 dark:bg-violet-500/10 dark:text-violet-300"><ClipboardList className="h-4 w-4" />سجلات عمليات المشرفين كلها</button>
        </>
      ) : <EmptyState icon={ShieldCheck} title="لا يوجد مشرفون" actionLabel="إضافة مشرف" onAction={() => setWizard({ stage: "search" })} />}

      <AnimatePresence>
        {wizard && <SupervisorWizard key={wizard?.candidate?.id || wizard?.stage} state={wizard} permissionGroups={permissionGroups} token={token} onClose={() => setWizard(null)} onStage={setWizard} onSave={saveSupervisor} saving={busy} />}
      </AnimatePresence>
      <LogsModal supervisor={logsFor} open={logsFor !== undefined} logs={logs} supervisors={supervisors} loading={logsLoading} error={logsError} onClose={() => setLogsFor(undefined)} />
      <ConfirmDialog open={Boolean(deleting)} title="إزالة صلاحيات المشرف؟" message="هل أنت متأكد من إزالة صلاحيات المشرف من هذا المستخدم؟ لن يتم حذف حساب المستخدم." confirmLabel="إزالة الصلاحيات" onCancel={() => setDeleting(null)} onConfirm={confirmRemove} busy={busy} />
    </div>
  );
}

function PageHeader({ onAdd }) {
  return <section className="flex items-center gap-3 rounded-[26px] border border-violet-200/70 bg-gradient-to-l from-white to-violet-50 p-5 shadow-[0_16px_40px_rgba(124,58,237,0.08)] dark:border-white/10 dark:bg-[linear-gradient(135deg,#111827,#17152A)]"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-blue-500 text-white"><UserCog className="h-5 w-5" /></span><div className="min-w-0 flex-1"><h1 className="text-2xl font-black dark:text-white">إدارة المشرفين</h1><p className="mt-0.5 text-[9px] font-bold text-slate-400">الصلاحيات وسجلات عمليات فريق الإدارة</p></div><button type="button" onClick={onAdd} className="inline-flex h-10 shrink-0 items-center gap-1 rounded-xl bg-violet-600 px-3 text-[9px] font-black text-white"><Plus className="h-4 w-4" />إضافة مشرف</button></section>;
}

function SupervisorCard({ supervisor, logCount, onPermissions, onLogs, onDelete }) {
  return <article className="rounded-[23px] border border-slate-200 bg-white p-4 shadow-[0_14px_34px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-[#111827]"><div className="flex items-start gap-3"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-sky-500 text-sm font-black text-white">{supervisor.avatarInitial || supervisor.name.slice(0, 1)}</span><div className="min-w-0 flex-1"><h2 className="truncate text-sm font-black dark:text-white">{supervisor.name}</h2><p dir="ltr" className="mt-0.5 truncate text-right text-[9px] font-bold text-slate-400">{supervisor.email}</p></div><span className="rounded-full bg-emerald-500/10 px-2 py-1 text-[8px] font-black text-emerald-700 dark:text-emerald-300">{supervisor.isActive ? "مفعل" : "غير مفعل"}</span></div><div className="mt-3 grid grid-cols-3 gap-2"><Mini label="الصلاحيات" value={supervisor.permissionsCount ?? supervisor.permissions.length} /><Mini label="آخر ظهور" value={supervisor.lastSeen} /><Mini label="السجلات" value={logCount} /></div><div className="mt-3 grid grid-cols-3 gap-1.5"><CardButton icon={Pencil} label="الصلاحيات" onClick={onPermissions} /><CardButton icon={Activity} label="السجلات" onClick={onLogs} /><CardButton icon={Trash2} label="حذف" danger onClick={onDelete} /></div></article>;
}
function Mini({ label, value }) { return <div className="min-w-0 rounded-xl bg-slate-50 p-2 dark:bg-[#0B1220]"><p className="text-[7px] font-black text-slate-400">{label}</p><p className="mt-1 truncate text-[9px] font-black dark:text-white">{typeof value === "number" ? value.toLocaleString("ar-EG-u-nu-latn") : value}</p></div>; }
function CardButton({ icon: Icon, label, danger, onClick }) { return <button type="button" onClick={onClick} className={`inline-flex h-9 items-center justify-center gap-1 rounded-xl text-[8px] font-black ${danger ? "bg-rose-500/10 text-rose-700 dark:text-rose-300" : "bg-violet-500/10 text-violet-700 dark:text-violet-300"}`}><Icon className="h-3.5 w-3.5" />{label}</button>; }

function SupervisorWizard(props) {
  if (props.state?.stage === "permissions") return <SupervisorPermissionsModal {...props} />;
  return <SupervisorWizardLegacy {...props} />;
}

function SupervisorPermissionsModal({ state, permissionGroups, onClose, onSave, saving }) {
  const candidate = state.candidate;
  const [permissions, setPermissions] = useState(candidate?.permissions || []);
  const isExistingSupervisor = Boolean(candidate?.permissions);
  const toggle = (permission) => setPermissions((current) => current.includes(permission) ? current.filter((item) => item !== permission) : [...current, permission]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previousOverflow; };
  }, []);

  return createPortal(
    <motion.div
      className="supervisor-permissions-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
    >
      <motion.section
        className="supervisor-permissions-modal"
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
      >
        <header className="supervisor-permissions-header">
          <button type="button" onClick={onClose} className="supervisor-permissions-close" aria-label="إغلاق">✕</button>
          <div className="supervisor-permissions-identity">
            <span>{candidate.name.slice(0, 1)}</span>
            <div>
              <h2>{candidate.name}</h2>
              <p dir="ltr">{candidate.email}</p>
              <strong dir="ltr">{candidate.id}</strong>
            </div>
          </div>
        </header>

        <div className="supervisor-permissions-content">
          {permissionGroups.map((group) => (
            <section key={group.group || group.title} className="supervisor-permission-card">
              <h3>{group.title}</h3>
              <div className="supervisor-permission-grid">
                {group.items.map((item) => {
                  const checked = permissions.includes(item.key);
                  return (
                    <label key={item.key} className="supervisor-permission-row">
                      <span>{item.label}</span>
                      <input type="checkbox" checked={checked} onChange={() => toggle(item.key)} className="sr-only" />
                      <span className={`supervisor-permission-toggle ${checked ? "is-active" : ""}`} aria-hidden="true"><i /></span>
                    </label>
                  );
                })}
              </div>
            </section>
          ))}
          {!permissionGroups.length && <p className="rounded-2xl border border-slate-200 p-3 text-center text-[10px] font-black text-slate-400 dark:border-white/10">تعذر تحميل قائمة الصلاحيات</p>}
        </div>

        <footer className="supervisor-permissions-footer">
          <button type="button" disabled={saving || !candidate} onClick={() => onSave(candidate, permissions)} className="supervisor-permissions-save">
            {saving ? "جارٍ الحفظ..." : isExistingSupervisor ? "حفظ الصلاحيات" : "تعيين كمشرف"}
          </button>
          <button type="button" onClick={onClose} disabled={saving} className="supervisor-permissions-cancel">إلغاء</button>
        </footer>
      </motion.section>
    </motion.div>,
    document.body,
  );
}

function SupervisorWizardLegacy({ state, permissionGroups, token, onClose, onStage, onSave, saving }) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null);
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState("");
  const [permissions, setPermissions] = useState(state?.candidate?.permissions || []);

  useEffect(() => {
    if (!state || state.stage !== "search" || !token) return undefined;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      setUsersLoading(true);
      setUsersError("");
      listEligibleSupervisorUsers(token, { search: query, page: 1, limit: 10 })
        .then((result) => {
          if (!cancelled) setUsers(result.users);
        })
        .catch((err) => {
          if (!cancelled) setUsersError(err.userMessage || err.message || "تعذر تحميل المستخدمين");
        })
        .finally(() => {
          if (!cancelled) setUsersLoading(false);
        });
    }, 300);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [query, state, token]);

  if (!state) return null;
  const candidate = state.candidate || selected;
  const isExistingSupervisor = Boolean(state.candidate?.permissions);
  const toggle = (permission) => setPermissions((current) => current.includes(permission) ? current.filter((item) => item !== permission) : [...current, permission]);

  return <div className="fixed inset-0 z-[130] flex items-end justify-center bg-slate-950/60 sm:items-center sm:p-4"><section className="flex max-h-[94dvh] w-full max-w-[680px] flex-col rounded-t-[28px] bg-white sm:rounded-[28px] dark:bg-[#111827]"><header className="flex items-center gap-3 border-b border-slate-100 p-4 dark:border-white/10"><ShieldCheck className="h-5 w-5 text-violet-500" /><div className="flex-1"><h2 className="text-sm font-black dark:text-white">{state.stage === "search" ? "إضافة مشرف" : "صلاحيات المشرف"}</h2><p className="text-[8px] font-bold text-slate-400">{candidate?.name || "ابحث عن مستخدم ثم حدد صلاحياته"}</p></div><button onClick={onClose}>✕</button></header><div className="overflow-y-auto p-4">{state.stage === "search" && <><label className="relative block"><Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-violet-500" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ابحث عن مستخدم بالاسم أو البريد الإلكتروني" className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 pe-9 ps-3 text-xs font-black dark:border-white/10 dark:bg-[#0B1220] dark:text-white" /></label><div className="mt-3 space-y-2">{usersLoading && Array.from({ length: 3 }).map((_, index) => <SkeletonBlock key={index} className="h-16 rounded-2xl" />)}{!usersLoading && usersError && <p className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-center text-[10px] font-black text-rose-700 dark:border-rose-400/20 dark:bg-rose-500/10 dark:text-rose-300">{usersError}</p>}{!usersLoading && !usersError && !users.length && <p className="rounded-2xl border border-slate-200 p-3 text-center text-[10px] font-black text-slate-400 dark:border-white/10">لا يوجد مستخدمون مطابقون</p>}{!usersLoading && !usersError && users.map((user) => <button key={user.id} onClick={() => setSelected(user)} className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-right ${selected?.id === user.id ? "border-violet-400 bg-violet-50 dark:bg-violet-500/10" : "border-slate-100 dark:border-white/10"}`}><span className="grid h-9 w-9 place-items-center rounded-xl bg-violet-500/10 text-violet-600"><Users className="h-4 w-4" /></span><span className="min-w-0 flex-1"><b className="block truncate text-[10px] dark:text-white">{user.name}</b><small dir="ltr" className="block truncate text-right text-[8px] text-slate-400">{user.email} · {user.status}</small></span>{selected?.id === user.id && <Check className="h-4 w-4 text-emerald-500" />}</button>)}</div></>}{state.stage === "permissions" && <><div className="mb-3 rounded-2xl border border-violet-200 bg-violet-50 p-4 text-center dark:border-violet-400/20 dark:bg-violet-500/10"><span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-violet-600 text-xl font-black text-white">{candidate.name.slice(0, 1)}</span><h3 className="mt-3 font-black dark:text-white">{candidate.name}</h3><p dir="ltr" className="text-xs text-slate-400">{candidate.email}</p><p dir="ltr" className="mt-1 text-[9px] font-black text-violet-600">{candidate.id}</p></div><div className="space-y-3">{permissionGroups.map((group) => <section key={group.group || group.title} className="rounded-2xl border border-slate-200 p-3 dark:border-white/10"><h3 className="text-[11px] font-black dark:text-white">{group.title}</h3><div className="mt-2 grid gap-2 sm:grid-cols-2">{group.items.map((item) => <label key={item.key} className="flex items-center gap-2 rounded-xl bg-slate-50 p-2.5 text-[9px] font-black dark:bg-[#0B1220] dark:text-slate-200"><input type="checkbox" checked={permissions.includes(item.key)} onChange={() => toggle(item.key)} className="h-4 w-4 accent-violet-600" />{item.label}</label>)}</div></section>)}{!permissionGroups.length && <p className="rounded-2xl border border-slate-200 p-3 text-center text-[10px] font-black text-slate-400 dark:border-white/10">تعذر تحميل قائمة الصلاحيات</p>}</div></>}</div><footer className="sticky bottom-0 grid grid-cols-2 gap-2 border-t bg-white p-3 dark:border-white/10 dark:bg-[#111827]"><button onClick={onClose} disabled={saving} className="h-11 rounded-xl border text-[10px] font-black dark:border-white/10 dark:text-white">إلغاء</button>{state.stage === "search" && <button disabled={!selected || saving} onClick={() => onStage({ stage: "permissions", candidate: selected })} className="h-11 rounded-xl bg-violet-600 text-[10px] font-black text-white disabled:opacity-40">متابعة</button>}{state.stage === "permissions" && <button disabled={saving || !candidate} onClick={() => onSave(candidate, permissions)} className="h-11 rounded-xl bg-violet-600 text-[10px] font-black text-white disabled:opacity-40">{saving ? "جارٍ الحفظ..." : isExistingSupervisor ? "حفظ الصلاحيات" : "تعيين كمشرف"}</button>}</footer></section></div>;
}

function LogsModal({ open, supervisor, logs, supervisors, loading, error, onClose }) {
  const [expanded, setExpanded] = useState(null);
  if (!open) return null;
  const names = Object.fromEntries(supervisors.map((item) => [item.id, item.name]));
  return <div className="fixed inset-0 z-[130] flex items-end justify-center bg-slate-950/60 sm:items-center sm:p-4"><section className="flex max-h-[90dvh] w-full max-w-[720px] flex-col rounded-t-[28px] bg-white sm:rounded-[28px] dark:bg-[#111827]"><header className="flex items-center gap-3 border-b p-4 dark:border-white/10"><Activity className="h-5 w-5 text-violet-500" /><div className="flex-1"><h2 className="text-sm font-black dark:text-white">{supervisor ? `سجلات ${supervisor.name}` : "سجلات عمليات المشرفين"}</h2><p className="text-[8px] text-slate-400">كل عملية منفذة بواسطة فريق الإدارة</p></div><button onClick={onClose}>✕</button></header><div className="space-y-2 overflow-y-auto p-4">{loading && <Loading />}{!loading && error && <p className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-center text-[10px] font-black text-rose-700 dark:border-rose-400/20 dark:bg-rose-500/10 dark:text-rose-300">{error}</p>}{!loading && !error && !logs.length && <p className="rounded-2xl border border-slate-200 p-3 text-center text-[10px] font-black text-slate-400 dark:border-white/10">لا توجد سجلات</p>}{!loading && !error && logs.map((log) => <article key={log.id} className="rounded-2xl border border-slate-200 p-3 dark:border-white/10"><div className="flex items-start gap-2"><span className={`mt-1 h-2 w-2 rounded-full ${log.status === "completed" ? "bg-emerald-500" : "bg-orange-500"}`} /><div className="min-w-0 flex-1"><h3 className="text-[10px] font-black dark:text-white">{log.action}</h3><p className="mt-0.5 text-[8px] font-bold text-slate-400">المشرف المنفذ: {names[log.supervisorId] || log.supervisorId || "مشرف"} · {log.date} · {log.time}</p></div><span className={`rounded-full px-2 py-1 text-[8px] font-black ${log.status === "completed" ? "bg-emerald-500/10 text-emerald-700" : "bg-orange-500/10 text-orange-700"}`}>{log.status === "completed" ? "مكتملة" : "لسه قيد التنفيذ"}</span></div><button onClick={() => setExpanded(expanded === log.id ? null : log.id)} className="mt-2 inline-flex items-center gap-1 text-[8px] font-black text-violet-600">عرض المزيد <ChevronDown className={`h-3 w-3 ${expanded === log.id ? "rotate-180" : ""}`} /></button>{expanded === log.id && <div className="mt-2 rounded-xl bg-slate-50 p-3 text-[9px] leading-5 text-slate-600 dark:bg-[#0B1220] dark:text-slate-300"><p>{log.details}</p><p dir="ltr" className="mt-2 text-right font-black">المعرّف: {log.id} · الهدف: {log.target} · عنوان الشبكة: {log.ip}</p></div>}</article>)}</div></section></div>;
}

function Loading() { return <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }).map((_, index) => <SkeletonBlock key={index} className="h-48 rounded-[23px]" />)}</div>; }
