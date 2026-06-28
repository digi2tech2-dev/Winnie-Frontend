import { AlertTriangle, Home, ServerCrash } from "lucide-react";

export default function ErrorPage({ code = 404, onNavigate }) {
  const isServer = code === 500;
  const Icon = isServer ? ServerCrash : AlertTriangle;

  return (
    <div className="grid min-h-[calc(100vh-180px)] place-items-center py-10">
      <section className="glass-panel w-full max-w-2xl rounded-lg p-8 text-center">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-lg bg-gradient-to-br from-royal to-pulse text-white shadow-glow">
          <Icon className="h-8 w-8" />
        </span>
        <p className="mt-6 text-sm font-black uppercase tracking-[0.22em] text-royal dark:text-pulse">
          خطأ {code}
        </p>
        <h1 className="mt-2 text-4xl font-black">
          {isServer ? "هناك شيء يحتاج إلى مراجعة" : "الصفحة غير موجودة"}
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
          {isServer
            ? "هذه الصفحة جاهزة لعرض أعطال الخادم أو حالات التشغيل الفعلية."
            : "الصفحة المطلوبة غير موجودة ضمن خريطة تنقل Winnie Fun الحالية."}
        </p>
        <button
          type="button"
          onClick={() => onNavigate("dashboard")}
          className="interactive-ring mt-7 inline-flex h-12 items-center gap-2 rounded-lg bg-gradient-to-r from-royal to-pulse px-5 text-sm font-black text-white shadow-glow"
        >
          <Home className="h-5 w-5" />
          العودة إلى الرئيسية
        </button>
      </section>
    </div>
  );
}
