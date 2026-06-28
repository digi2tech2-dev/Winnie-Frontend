import { Eye, PauseCircle, ShieldCheck } from "lucide-react";
import { Section } from "./BasicProductInfo";

export default function ProductSettings({ value, onChange }) {
  return (
    <Section title="إعدادات المنتج" description="تحكم في الظهور وإتاحة الشراء داخل المتجر">
      <div className="space-y-3">
        <SettingRow icon={ShieldCheck} title="حالة المنتج" description="غير متوفر يظهر للعميل مع سعر مشطوب">
          <select value={value.status} onChange={(event) => onChange("status", event.target.value)} className={selectClassName}>
            <option value="available">متوفر</option><option value="unavailable">غير متوفر</option>
          </select>
        </SettingRow>
        <SettingRow icon={Eye} title="إظهار المنتج في المتجر" description="إخفاؤه يزيله من قوائم العملاء">
          <YesNo value={value.visible} onChange={(next) => onChange("visible", next)} />
        </SettingRow>
        <SettingRow icon={PauseCircle} title="وقف البيع مؤقتًا" description="يبقى المنتج ظاهرًا لكن الشراء متوقف">
          <YesNo value={value.paused} onChange={(next) => onChange("paused", next)} />
        </SettingRow>
      </div>

      {value.status === "unavailable" && (
        <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-[10px] font-bold leading-6 text-rose-700 dark:border-rose-400/15 dark:bg-rose-500/10 dark:text-rose-300">
          سيظهر المنتج بوسم أحمر “غير متوفر”، وسيكون السعر مشطوبًا ولن يُسمح بفتح صفحة الطلب أو الشراء.
        </div>
      )}
    </Section>
  );
}

function SettingRow({ icon: Icon, title, description, children }) {
  return <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-3 dark:border-white/10 dark:bg-[#0B1220]"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-violet-500/10 text-violet-700 dark:text-violet-300"><Icon className="h-4.5 w-4.5" /></span><span className="min-w-0 flex-1"><strong className="block text-[11px] text-slate-800 dark:text-white">{title}</strong><span className="mt-0.5 block text-[8px] font-bold leading-4 text-slate-400">{description}</span></span>{children}</div>;
}

function YesNo({ value, onChange }) {
  return <select value={value ? "yes" : "no"} onChange={(event) => onChange(event.target.value === "yes")} className={selectClassName}><option value="yes">نعم</option><option value="no">لا</option></select>;
}

const selectClassName = "h-9 shrink-0 rounded-xl border border-slate-200 bg-white px-2 text-[10px] font-black text-slate-800 outline-none dark:border-white/10 dark:bg-[#111827] dark:text-white";
