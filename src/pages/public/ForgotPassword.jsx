import { Link } from "react-router-dom";
import { KeyRound } from "lucide-react";
import Brand from "../../components/Brand";
import { useToast } from "../../components/ToastProvider";

export default function ForgotPassword() {
  const { showToast } = useToast();

  return (
    <div className="mx-auto grid min-h-[calc(100vh-92px)] max-w-[1320px] place-items-center px-4 py-8">
      <div className="glass-panel w-full max-w-[520px] rounded-lg p-6 sm:p-8">
        <div className="text-center">
          <Brand />
          <span className="mx-auto mt-8 grid h-14 w-14 place-items-center rounded-lg bg-gradient-to-br from-royal to-pulse text-white shadow-glow">
            <KeyRound className="h-7 w-7" />
          </span>
          <h1 className="mt-5 text-3xl font-black">نسيت كلمة المرور</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">أدخل بريدك الإلكتروني لاستلام خطوات استعادة تجريبية.</p>
        </div>
        <form className="mt-8 space-y-4">
          <label className="block">
            <span className="mb-2 block text-sm font-black text-slate-600 dark:text-slate-300">البريد الإلكتروني</span>
            <input className="h-12 w-full rounded-lg border border-slate-200 bg-white/80 px-4 text-right outline-none transition focus:border-pulse focus:ring-4 focus:ring-pulse/15 dark:border-white/10 dark:bg-white/[0.065]" />
          </label>
          <button
            type="button"
            onClick={() => showToast({ type: "success", title: "تم إرسال رابط الاستعادة", message: "بدأت خطوات التحقق التجريبية عبر البريد." })}
            className="interactive-ring h-12 w-full rounded-lg bg-gradient-to-r from-royal to-pulse text-sm font-black text-white shadow-glow"
          >
            إرسال رابط الاستعادة
          </button>
        </form>
        <p className="mt-7 text-center text-sm text-slate-500 dark:text-slate-400">
          تذكرت كلمة المرور؟ <Link to="/login" className="font-black text-royal dark:text-pulse">تسجيل الدخول</Link>
        </p>
      </div>
    </div>
  );
}
