import { useEffect, useMemo, useState } from "react";
import { Activity, Check, ChevronDown, ClipboardList, Eye, Mail, Pencil, Plus, Search, ShieldCheck, Trash2, UserCog, Users } from "lucide-react";
import { adminUsers } from "../../data/adminUsers";
import { permissionGroups, supervisorLogsSeed, supervisorsSeed } from "../../data/adminExtended";
import { useToast } from "../../components/ToastProvider";
import { SkeletonBlock } from "../../components/Skeletons";
import EmptyState from "../../components/EmptyState";
import ConfirmDialog from "../../components/admin/products/ConfirmDialog";

export default function AdminSupervisorsPage() {
  const [supervisors, setSupervisors] = useState(supervisorsSeed);
  const [loading, setLoading] = useState(true);
  const [wizard, setWizard] = useState(null);
  const [logsFor, setLogsFor] = useState(undefined);
  const [deleting, setDeleting] = useState(null);
  const { showToast } = useToast();

  useEffect(() => { const timer = setTimeout(() => setLoading(false), 550); return () => clearTimeout(timer); }, []);

  const saveSupervisor = (candidate, permissions) => {
    if (candidate.id?.startsWith("SUP-")) {
      setSupervisors((current) => current.map((item) => item.id === candidate.id ? { ...item, permissions } : item));
      showToast({ type: "success", title: "تم حفظ الصلاحيات", message: candidate.name });
    } else {
      setSupervisors((current) => [...current, { id: `SUP-${Date.now().toString().slice(-5)}`, userId: candidate.id, name: candidate.name, email: candidate.email, status: "active", lastSeen: "الآن", permissions }]);
      showToast({ type: "success", title: "تمت إضافة المشرف", message: candidate.name });
    }
    setWizard(null);
  };

  return (
    <div dir="rtl" className="space-y-4">
      <PageHeader onAdd={() => setWizard({ stage: "search" })} />
      {loading ? <Loading /> : supervisors.length ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {supervisors.map((supervisor) => (
              <SupervisorCard key={supervisor.id} supervisor={supervisor} logCount={supervisorLogsSeed.filter((log) => log.supervisorId === supervisor.id).length} onPermissions={() => setWizard({ stage: "permissions", candidate: supervisor })} onLogs={() => setLogsFor(supervisor)} onDelete={() => setDeleting(supervisor)} />
            ))}
          </div>
          <button type="button" onClick={() => setLogsFor(null)} className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-violet-200 bg-violet-50 text-xs font-black text-violet-700 dark:border-violet-400/20 dark:bg-violet-500/10 dark:text-violet-300"><ClipboardList className="h-4 w-4" />سجلات عمليات المشرفين كلها</button>
        </>
      ) : <EmptyState icon={ShieldCheck} title="لا يوجد مشرفون" actionLabel="إضافة مشرف" onAction={() => setWizard({ stage: "search" })} />}

      <SupervisorWizard key={wizard?.candidate?.id || wizard?.stage || "closed"} state={wizard} supervisors={supervisors} onClose={() => setWizard(null)} onStage={setWizard} onSave={saveSupervisor} />
      <LogsModal supervisor={logsFor} open={logsFor !== undefined} logs={logsFor ? supervisorLogsSeed.filter((log) => log.supervisorId === logsFor.id) : supervisorLogsSeed} supervisors={supervisors} onClose={() => setLogsFor(undefined)} />
      <ConfirmDialog open={Boolean(deleting)} title="حذف المشرف؟" message={`سيتم سحب كل صلاحيات “${deleting?.name || ""}”.`} onCancel={() => setDeleting(null)} onConfirm={() => { setSupervisors((current) => current.filter((item) => item.id !== deleting.id)); showToast({ type: "success", title: "تم حذف المشرف" }); setDeleting(null); }} />
    </div>
  );
}

function PageHeader({ onAdd }) {
  return <section className="flex items-center gap-3 rounded-[26px] border border-violet-200/70 bg-gradient-to-l from-white to-violet-50 p-5 shadow-[0_16px_40px_rgba(124,58,237,0.08)] dark:border-white/10 dark:bg-[linear-gradient(135deg,#111827,#17152A)]"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-blue-500 text-white"><UserCog className="h-5 w-5" /></span><div className="min-w-0 flex-1"><h1 className="text-2xl font-black dark:text-white">إدارة المشرفين</h1><p className="mt-0.5 text-[9px] font-bold text-slate-400">الصلاحيات وسجلات عمليات فريق الإدارة</p></div><button type="button" onClick={onAdd} className="inline-flex h-10 shrink-0 items-center gap-1 rounded-xl bg-violet-600 px-3 text-[9px] font-black text-white"><Plus className="h-4 w-4" />إضافة مشرف</button></section>;
}

function SupervisorCard({ supervisor, logCount, onPermissions, onLogs, onDelete }) {
  return <article className="rounded-[23px] border border-slate-200 bg-white p-4 shadow-[0_14px_34px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-[#111827]"><div className="flex items-start gap-3"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-sky-500 text-sm font-black text-white">{supervisor.name.slice(0, 1)}</span><div className="min-w-0 flex-1"><h2 className="truncate text-sm font-black dark:text-white">{supervisor.name}</h2><p dir="ltr" className="mt-0.5 truncate text-right text-[9px] font-bold text-slate-400">{supervisor.email}</p></div><span className="rounded-full bg-emerald-500/10 px-2 py-1 text-[8px] font-black text-emerald-700 dark:text-emerald-300">مفعل</span></div><div className="mt-3 grid grid-cols-3 gap-2"><Mini label="الصلاحيات" value={supervisor.permissions.length} /><Mini label="آخر ظهور" value={supervisor.lastSeen} /><Mini label="السجلات" value={logCount} /></div><div className="mt-3 grid grid-cols-3 gap-1.5"><CardButton icon={Pencil} label="الصلاحيات" onClick={onPermissions} /><CardButton icon={Activity} label="السجلات" onClick={onLogs} /><CardButton icon={Trash2} label="حذف" danger onClick={onDelete} /></div></article>;
}
function Mini({ label, value }) { return <div className="min-w-0 rounded-xl bg-slate-50 p-2 dark:bg-[#0B1220]"><p className="text-[7px] font-black text-slate-400">{label}</p><p className="mt-1 truncate text-[9px] font-black dark:text-white">{typeof value === "number" ? value.toLocaleString("ar-EG") : value}</p></div>; }
function CardButton({ icon: Icon, label, danger, onClick }) { return <button type="button" onClick={onClick} className={`inline-flex h-9 items-center justify-center gap-1 rounded-xl text-[8px] font-black ${danger ? "bg-rose-500/10 text-rose-700 dark:text-rose-300" : "bg-violet-500/10 text-violet-700 dark:text-violet-300"}`}><Icon className="h-3.5 w-3.5" />{label}</button>; }

function SupervisorWizard({ state, supervisors, onClose, onStage, onSave }) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null);
  const [permissions, setPermissions] = useState(state?.candidate?.permissions || []);
  if (!state) return null;
  const existingIds = new Set(supervisors.map((item) => item.userId));
  const results = adminUsers.filter((user) => !existingIds.has(user.id) && `${user.name} ${user.email} ${user.id}`.toLowerCase().includes(query.toLowerCase()));
  const candidate = state.candidate;
  const toggle = (permission) => setPermissions((current) => current.includes(permission) ? current.filter((item) => item !== permission) : [...current, permission]);
  return <div className="fixed inset-0 z-[130] flex items-end justify-center bg-slate-950/60 sm:items-center sm:p-4"><section className="flex max-h-[94dvh] w-full max-w-[680px] flex-col rounded-t-[28px] bg-white sm:rounded-[28px] dark:bg-[#111827]"><header className="flex items-center gap-3 border-b border-slate-100 p-4 dark:border-white/10"><ShieldCheck className="h-5 w-5 text-violet-500" /><div className="flex-1"><h2 className="text-sm font-black dark:text-white">{state.stage === "search" ? "إضافة مشرف" : state.stage === "confirm" ? "تأكيد المشرف" : "صلاحيات المشرف"}</h2><p className="text-[8px] font-bold text-slate-400">{candidate?.name || "ابحث عن المستخدم ثم حدد صلاحياته"}</p></div><button onClick={onClose}>✕</button></header><div className="overflow-y-auto p-4">{state.stage === "search" && <><label className="relative block"><Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-violet-500" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ابحث بالاسم أو البريد أو ID" className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 pe-9 ps-3 text-xs font-black dark:border-white/10 dark:bg-[#0B1220] dark:text-white" /></label><div className="mt-3 space-y-2">{query && results.map((user) => <button key={user.id} onClick={() => setSelected(user)} className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-right ${selected?.id === user.id ? "border-violet-400 bg-violet-50 dark:bg-violet-500/10" : "border-slate-100 dark:border-white/10"}`}><span className="grid h-9 w-9 place-items-center rounded-xl bg-violet-500/10 text-violet-600"><Users className="h-4 w-4" /></span><span className="min-w-0 flex-1"><b className="block truncate text-[10px] dark:text-white">{user.name}</b><small dir="ltr" className="block truncate text-right text-[8px] text-slate-400">{user.email} · {user.id}</small></span>{selected?.id === user.id && <Check className="h-4 w-4 text-emerald-500" />}</button>)}</div></>}{state.stage === "confirm" && <div className="rounded-2xl border border-violet-200 bg-violet-50 p-4 text-center dark:border-violet-400/20 dark:bg-violet-500/10"><span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-violet-600 text-xl font-black text-white">{candidate.name.slice(0, 1)}</span><h3 className="mt-3 font-black dark:text-white">{candidate.name}</h3><p dir="ltr" className="text-xs text-slate-400">{candidate.email}</p><p dir="ltr" className="mt-1 text-[9px] font-black text-violet-600">{candidate.id}</p></div>}{state.stage === "permissions" && <div className="space-y-3">{permissionGroups.map((group) => <section key={group.title} className="rounded-2xl border border-slate-200 p-3 dark:border-white/10"><h3 className="text-[11px] font-black dark:text-white">{group.title}</h3><div className="mt-2 grid gap-2 sm:grid-cols-2">{group.items.map((item) => <label key={item} className="flex items-center gap-2 rounded-xl bg-slate-50 p-2.5 text-[9px] font-black dark:bg-[#0B1220] dark:text-slate-200"><input type="checkbox" checked={permissions.includes(item)} onChange={() => toggle(item)} className="h-4 w-4 accent-violet-600" />{item}</label>)}</div></section>)}</div>}</div><footer className="sticky bottom-0 grid grid-cols-2 gap-2 border-t bg-white p-3 dark:border-white/10 dark:bg-[#111827]"><button onClick={onClose} className="h-11 rounded-xl border text-[10px] font-black dark:border-white/10 dark:text-white">إلغاء</button>{state.stage === "search" && <button disabled={!selected} onClick={() => onStage({ stage: "confirm", candidate: selected })} className="h-11 rounded-xl bg-violet-600 text-[10px] font-black text-white disabled:opacity-40">متابعة</button>}{state.stage === "confirm" && <button onClick={() => onStage({ stage: "permissions", candidate })} className="h-11 rounded-xl bg-violet-600 text-[10px] font-black text-white">تأكيد واختيار الصلاحيات</button>}{state.stage === "permissions" && <button onClick={() => onSave(candidate, permissions)} className="h-11 rounded-xl bg-violet-600 text-[10px] font-black text-white">حفظ الصلاحيات</button>}</footer></section></div>;
}

function LogsModal({ open, supervisor, logs, supervisors, onClose }) {
  const [expanded, setExpanded] = useState(null);
  if (!open) return null;
  const names = Object.fromEntries(supervisors.map((item) => [item.id, item.name]));
  return <div className="fixed inset-0 z-[130] flex items-end justify-center bg-slate-950/60 sm:items-center sm:p-4"><section className="flex max-h-[90dvh] w-full max-w-[720px] flex-col rounded-t-[28px] bg-white sm:rounded-[28px] dark:bg-[#111827]"><header className="flex items-center gap-3 border-b p-4 dark:border-white/10"><Activity className="h-5 w-5 text-violet-500" /><div className="flex-1"><h2 className="text-sm font-black dark:text-white">{supervisor ? `سجلات ${supervisor.name}` : "سجلات عمليات المشرفين"}</h2><p className="text-[8px] text-slate-400">كل عملية منفذة بواسطة فريق الإدارة</p></div><button onClick={onClose}>✕</button></header><div className="space-y-2 overflow-y-auto p-4">{logs.map((log) => <article key={log.id} className="rounded-2xl border border-slate-200 p-3 dark:border-white/10"><div className="flex items-start gap-2"><span className={`mt-1 h-2 w-2 rounded-full ${log.status === "completed" ? "bg-emerald-500" : "bg-orange-500"}`} /><div className="min-w-0 flex-1"><h3 className="text-[10px] font-black dark:text-white">{log.action}</h3><p className="mt-0.5 text-[8px] font-bold text-slate-400">المشرف المنفذ: {names[log.supervisorId]} · {log.date} · {log.time}</p></div><span className={`rounded-full px-2 py-1 text-[8px] font-black ${log.status === "completed" ? "bg-emerald-500/10 text-emerald-700" : "bg-orange-500/10 text-orange-700"}`}>{log.status === "completed" ? "مكتملة" : "لسه قيد التنفيذ"}</span></div><button onClick={() => setExpanded(expanded === log.id ? null : log.id)} className="mt-2 inline-flex items-center gap-1 text-[8px] font-black text-violet-600">عرض المزيد <ChevronDown className={`h-3 w-3 ${expanded === log.id ? "rotate-180" : ""}`} /></button>{expanded === log.id && <div className="mt-2 rounded-xl bg-slate-50 p-3 text-[9px] leading-5 text-slate-600 dark:bg-[#0B1220] dark:text-slate-300"><p>{log.details}</p><p dir="ltr" className="mt-2 text-right font-black">ID: {log.id} · Target: {log.target} · IP: {log.ip}</p></div>}</article>)}</div></section></div>;
}

function Loading() { return <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }).map((_, index) => <SkeletonBlock key={index} className="h-48 rounded-[23px]" />)}</div>; }
