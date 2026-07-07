import { useEffect, useMemo, useState } from "react";
import { Plus, UserMinus, Users, UsersRound } from "lucide-react";
import GroupCard from "../../components/admin/groups/GroupCard";
import GroupFormModal from "../../components/admin/groups/GroupFormModal";
import TransferMemberModal from "../../components/admin/groups/TransferMemberModal";
import ConfirmDialog from "../../components/admin/products/ConfirmDialog";
import EmptyState from "../../components/EmptyState";
import { SkeletonBlock } from "../../components/Skeletons";
import { useToast } from "../../components/ToastProvider";
import { groupMembersSeed,groupsSeed } from "../../data/adminManagement";

export default function GroupsManagementPage(){
 const [groups,setGroups]=useState(groupsSeed),[members,setMembers]=useState(groupMembersSeed),[loading,setLoading]=useState(true),[editing,setEditing]=useState(undefined),[transferMember,setTransferMember]=useState(null),[deleting,setDeleting]=useState(null);const{showToast}=useToast();
 useEffect(()=>{const t=setTimeout(()=>setLoading(false),550);return()=>clearTimeout(t)},[]);
 const counts=useMemo(()=>Object.fromEntries(groups.map(g=>[g.id,members.filter(m=>m.groupId===g.id).length])),[groups,members]);
 const saveGroup=data=>{if(editing?.id)setGroups(c=>c.map(g=>g.id===editing.id?{...g,...data}:g));else setGroups(c=>[...c,{...data,id:`grp-${Date.now()}`}]);showToast({type:"success",title:"تم حفظ المجموعة",message:data.name});setEditing(undefined)};
 const requestDelete=g=>{if(counts[g.id]>0){showToast({type:"warning",title:"تعذر حذف المجموعة",message:"لا يمكن حذف هذه المجموعة لأن بها أعضاء. يجب نقل الأعضاء أولًا إلى مجموعة أخرى."});return}setDeleting(g)};
 const transfer=target=>{setMembers(c=>c.map(m=>m.id===transferMember.id?{...m,groupId:target}:m));setTransferMember(null);showToast({type:"success",title:"تم نقل العضو بنجاح"})};
 const stats=[{label:"إجمالي المجموعات",value:groups.length,icon:UsersRound,tone:"violet"},{label:"مجموعات بها أعضاء",value:groups.filter(g=>counts[g.id]>0).length,icon:Users,tone:"sky"},{label:"مجموعات بدون أعضاء",value:groups.filter(g=>!counts[g.id]).length,icon:UserMinus,tone:"orange"},{label:"الأعضاء الحاليون",value:members.length,icon:Users,tone:"emerald"}];
 return <div dir="rtl" className="space-y-4"><Header title="إدارة المجموعات" action={()=>setEditing(null)}/>{loading?<Skeleton/>:<><div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">{stats.map(s=><Stat key={s.label}{...s}/>)}</div>{groups.length?<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{groups.map(g=><GroupCard key={g.id} group={g} memberCount={counts[g.id]||0} onEdit={setEditing} onDelete={requestDelete}/>)}</div>:<EmptyState title="لا توجد مجموعات" description="أضف أول مجموعة لبدء تنظيم المستخدمين." actionLabel="إضافة مجموعة" onAction={()=>setEditing(null)}/>}</>}
 <GroupFormModal open={editing!==undefined} group={editing} members={editing?members.filter(m=>m.groupId===editing.id):[]} onClose={()=>setEditing(undefined)} onSave={saveGroup} onTransfer={setTransferMember}/><TransferMemberModal member={transferMember} groups={groups} onClose={()=>setTransferMember(null)} onTransfer={transfer}/><ConfirmDialog open={Boolean(deleting)} title="حذف المجموعة؟" message={`سيتم حذف “${deleting?.name||""}” نهائيًا.`} onCancel={()=>setDeleting(null)} onConfirm={()=>{setGroups(c=>c.filter(g=>g.id!==deleting.id));showToast({type:"success",title:"تم حذف المجموعة"});setDeleting(null)}}/></div>
}
function Header({title,action}){return <section className="flex items-center gap-3 rounded-[26px] border border-violet-200/70 bg-gradient-to-l from-white to-violet-50 p-5 dark:border-white/10 dark:bg-[linear-gradient(135deg,#111827,#17152A)]"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-blue-500 text-white"><UsersRound className="h-5 w-5"/></span><div className="flex-1"><h1 className="text-2xl font-black dark:text-white">{title}</h1><p className="text-[10px] font-bold text-slate-500">إدارة نسب وأعضاء مجموعات العملاء</p></div><button onClick={action} className="inline-flex h-10 items-center gap-1 rounded-2xl bg-violet-600 px-3 text-[9px] font-black text-white"><Plus className="h-4 w-4"/>إضافة مجموعة</button></section>}
function Stat({label,value,icon:Icon,tone}){const c={violet:"bg-violet-500/10 text-violet-600",sky:"bg-sky-500/10 text-sky-600",orange:"bg-orange-500/10 text-orange-600",emerald:"bg-emerald-500/10 text-emerald-600"}[tone];return <article className="rounded-[20px] border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-[#111827]"><Icon className={`h-8 w-8 rounded-xl p-2 ${c}`}/><strong className="mt-2 block text-2xl font-black dark:text-white">{value.toLocaleString("ar-EG-u-nu-latn")}</strong><p className="text-[9px] font-black text-slate-400">{label}</p></article>}
function Skeleton(){return <div className="grid grid-cols-2 gap-3">{Array.from({length:6}).map((_,i)=><SkeletonBlock key={i} className="h-40 rounded-[22px]"/>)}</div>}
