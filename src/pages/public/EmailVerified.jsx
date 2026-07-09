import { CircleX, MailCheck } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function EmailVerified() {
  const { i18n } = useTranslation();
  const [searchParams] = useSearchParams();
  const succeeded = searchParams.get("status") === "success";
  const isArabic = i18n.language?.startsWith("ar");
  const errorMessage = searchParams.get("message");
  const Icon = succeeded ? MailCheck : CircleX;

  const title = succeeded
    ? (isArabic ? "تم تفعيل حسابك بنجاح" : "Your account has been activated")
    : (isArabic ? "تعذر تفعيل الحساب" : "Account activation failed");
  const message = succeeded
    ? (isArabic ? "تم تفعيل حسابك بنجاح ويمكنك تسجيل الدخول الآن" : "Your account is active and you can log in now.")
    : (errorMessage || (isArabic ? "رابط التفعيل غير صالح أو منتهي الصلاحية." : "The activation link is invalid or has expired."));

  return (
    <div className="mx-auto grid min-h-[60vh] max-w-xl place-items-center px-4 py-10 text-center">
      <section className="w-full rounded-[28px] border border-slate-200 bg-white/90 p-7 shadow-[0_20px_55px_rgba(15,23,42,0.10)] dark:border-white/10 dark:bg-[#111827]">
        <Icon className={`mx-auto h-14 w-14 ${succeeded ? "text-emerald-500" : "text-rose-500"}`} />
        <h1 className="mt-5 text-2xl font-black text-slate-950 dark:text-white">{title}</h1>
        <p className="mt-3 text-sm font-semibold leading-7 text-slate-600 dark:text-slate-300">{message}</p>
        <Link
          to={succeeded ? "/login" : "/register"}
          className="interactive-ring mt-7 inline-flex h-12 items-center justify-center rounded-2xl bg-gradient-to-r from-violet-600 to-cyan-500 px-7 text-sm font-black text-white"
        >
          {succeeded
            ? (isArabic ? "تسجيل الدخول" : "Log in")
            : (isArabic ? "العودة إلى التسجيل" : "Back to registration")}
        </Link>
      </section>
    </div>
  );
}
