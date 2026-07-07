import { Eye, PauseCircle, ShieldCheck } from "lucide-react";
import { Section } from "./BasicProductInfo";

export default function ProductSettings({ value, onChange }) {
  return (
    <Section title="إعدادات المنتج" description="تحكم في الظهور وإتاحة الشراء داخل المتجر">
      <div className="space-y-4">
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
  return <div className="flex flex-col items-stretch gap-3 rounded-2xl border border-[#203664] bg-[#071126] p-4 sm:flex-row sm:items-center"><div className="flex min-w-0 flex-1 items-center gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-violet-400/20 bg-violet-500/10 text-violet-300"><Icon className="h-4.5 w-4.5" /></span><span className="min-w-0 flex-1"><strong className="block text-xs text-white">{title}</strong><span className="mt-1 block text-[9px] font-bold leading-5 text-slate-400">{description}</span></span></div>{children}</div>;
}

function YesNo({ value, onChange }) {
  return <select value={value ? "yes" : "no"} onChange={(event) => onChange(event.target.value === "yes")} className={selectClassName}><option value="yes">نعم</option><option value="no">لا</option></select>;
}

const selectClassName = "h-10 w-full shrink-0 rounded-xl border border-[#294474] bg-[#050d20] px-3 text-[10px] font-black text-white outline-none focus:border-violet-400 sm:w-32";
