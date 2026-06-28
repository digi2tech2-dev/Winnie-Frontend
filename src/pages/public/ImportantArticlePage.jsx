import { Link, Navigate, useLocation, useParams } from "react-router-dom";
import { ArrowRight, CalendarDays, CheckCircle2, Mail, Sparkles } from "lucide-react";
import { getImportantArticle } from "../../data/importantLinks";

export default function ImportantArticlePage({ articleSlug }) {
  const { slug } = useParams();
  const location = useLocation();
  const article = getImportantArticle(articleSlug || slug);
  const homePath = location.pathname.startsWith("/customer")
    ? "/customer/dashboard"
    : location.pathname.startsWith("/admin")
      ? "/admin/user/dashboard"
      : "/";

  if (!article) {
    return <Navigate to={homePath} replace />;
  }

  return (
    <article dir="rtl" className="mx-auto max-w-[1120px] px-4 py-8 sm:px-6 lg:px-8">
      <Link
        to={homePath}
        className="inline-flex items-center gap-2 text-sm font-black text-[#7C3AED] transition hover:text-[#0369A1] dark:text-[#A78BFA] dark:hover:text-[#38BDF8]"
      >
        <ArrowRight className="h-4 w-4" />
        {homePath === "/" ? "العودة للرئيسية" : "العودة للحساب"}
      </Link>

      <header className="mt-5 rounded-lg border border-sky-100/90 bg-white/[0.82] p-5 shadow-soft backdrop-blur-2xl dark:border-white/10 dark:bg-[#111827] sm:p-7">
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-2 rounded-lg bg-[#F5F3FF] px-3 py-2 text-xs font-black text-[#7C3AED] dark:bg-[#1A2335] dark:text-[#A78BFA]">
            <Sparkles className="h-4 w-4" />
            {article.badge}
          </span>
          <span className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-[#8A94A7]">
            <CalendarDays className="h-4 w-4" />
            آخر تحديث: {article.updated}
          </span>
        </div>

        <h1 className="mt-5 max-w-4xl text-3xl font-black leading-tight text-slate-950 dark:text-white sm:text-5xl">
          {article.title}
        </h1>
        <p className="mt-4 max-w-3xl text-sm font-semibold leading-8 text-slate-600 dark:text-[#C4C9D4] sm:text-base">
          {article.intro}
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {article.highlights.map((item) => (
            <div
              key={item}
              className="flex min-h-14 items-center gap-2 rounded-lg border border-sky-100 bg-sky-50/70 px-3 text-sm font-black text-slate-800 dark:border-white/10 dark:bg-[#0D1324] dark:text-white"
            >
              <CheckCircle2 className="h-4 w-4 shrink-0 text-[#0EA5E9] dark:text-[#38BDF8]" />
              {item}
            </div>
          ))}
        </div>
      </header>

      <div className="mt-6 grid gap-4">
        {article.sections.map((section, index) => (
          <section
            key={section.heading}
            className="rounded-lg border border-sky-100/90 bg-white/[0.74] p-5 shadow-[0_14px_36px_rgba(15,23,42,0.07)] backdrop-blur-xl dark:border-white/10 dark:bg-[#111827] sm:p-6"
          >
            <p className="text-xs font-black text-[#8B5CF6] dark:text-[#A78BFA]">0{index + 1}</p>
            <h2 className="mt-2 text-2xl font-black text-slate-950 dark:text-white">{section.heading}</h2>
            <div className="mt-3 space-y-3">
              {section.body.map((paragraph) => (
                <p key={paragraph} className="text-sm font-semibold leading-8 text-slate-600 dark:text-[#C4C9D4]">
                  {paragraph}
                </p>
              ))}
            </div>
            {section.email && (
              <div className="mt-4 rounded-lg border border-[#DDD6FE] bg-[#F5F3FF]/80 p-4 dark:border-[#8B5CF6]/30 dark:bg-[#1A1024]">
                <p className="text-sm font-black text-slate-950 dark:text-white">الايميل :</p>
                <a
                  href={`mailto:${section.email}`}
                  className="mt-2 inline-flex items-center gap-2 text-sm font-black text-[#7C3AED] transition hover:text-[#0369A1] dark:text-[#A78BFA] dark:hover:text-[#38BDF8]"
                >
                  <Mail className="h-4 w-4" />
                  {section.email}
                </a>
              </div>
            )}
            {section.bullets && (
              <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                {section.bullets.map((bullet) => (
                  <li
                    key={bullet}
                    className="flex items-start gap-2 rounded-lg bg-sky-50/80 px-3 py-2 text-sm font-bold leading-6 text-slate-700 dark:bg-[#0D1324] dark:text-[#C4C9D4]"
                  >
                    <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-[#0EA5E9] dark:text-[#38BDF8]" />
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>

      <footer className="mt-6 rounded-lg border border-[#DDD6FE] bg-[#F5F3FF]/80 p-5 text-sm font-bold leading-8 text-slate-700 dark:border-[#8B5CF6]/30 dark:bg-[#1A1024] dark:text-[#E9D5FF]">
        {article.closing}
      </footer>

      <section className="mt-5 rounded-lg border border-sky-100/90 bg-white/[0.82] p-5 text-center shadow-[0_14px_36px_rgba(14,165,233,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-[#111827] sm:p-6">
        <h2 className="text-xl font-black text-slate-950 dark:text-white">لم تجد ماتبحث عنه؟</h2>
        <p className="mt-2 text-sm font-semibold leading-7 text-slate-600 dark:text-[#C4C9D4]">
          تحدث معنا أو تواصل عبر البريد الإلكتروني
        </p>
        <a
          href="mailto:Support.winniefun@gmail.com"
          className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[linear-gradient(135deg,#7C3AED,#38BDF8)] px-5 text-sm font-black text-white shadow-[0_14px_34px_rgba(124,58,237,0.18)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_42px_rgba(14,165,233,0.24)]"
        >
          <Mail className="h-4 w-4" />
          تواصل عبر البريد الإلكتروني
        </a>
      </section>
    </article>
  );
}
