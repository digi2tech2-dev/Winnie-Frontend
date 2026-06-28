import { Link, useLocation } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import Brand from "./Brand";
import { importantLinks } from "../data/importantLinks";

const footerText =
  "العلامة التجارية التابعة لشركة ويني، متخصصون في تقديم خدمات شحن الألعاب، البرامج، والبطاقات الرقمية بجودة وموثوقية عالية.";
const commercialRegistration = "4423622.01";
const taxNumber = "105156169200001";

export default function SiteFooter({ className = "", innerClassName = "max-w-[1120px]", simple = false }) {
  const location = useLocation();
  const accountPrefix = location.pathname.startsWith("/customer")
    ? "/customer"
    : location.pathname.startsWith("/admin")
      ? "/admin/user"
      : "";

  if (simple) {
    return (
      <footer
        dir="rtl"
        className={`border-t border-[#8B5CF6]/15 bg-white/90 px-4 py-6 text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.78)] dark:border-white/[0.08] dark:bg-[#050918]/95 dark:text-white/70 sm:px-6 lg:px-8 ${className}`}
      >
        <div className={`mx-auto flex flex-col items-center gap-3 text-center ${innerClassName}`}>
          <Brand compact tagline={false} />
          <p className="text-sm font-black text-slate-600 dark:text-white/60">
            جميع الحقوق محفوظة لدى © ويني 2026
          </p>
          <FooterLegalNumbers compact />
        </div>
      </footer>
    );
  }

  return (
    <footer
      dir="rtl"
      className={`border-t border-[#F59E0B]/25 bg-[linear-gradient(135deg,#FFFBEB_0%,#FFF7ED_46%,#ECFDF5_100%)] px-4 py-8 text-[#4B3A22] shadow-[inset_0_1px_0_rgba(255,255,255,0.76),0_-18px_45px_rgba(120,53,15,0.06)] dark:border-[#FBBF24]/15 dark:bg-[linear-gradient(135deg,#120F0A_0%,#172016_54%,#0B1F1A_100%)] dark:text-[#D8C7A8] sm:px-6 lg:px-8 ${className}`}
    >
      <div className={`mx-auto ${innerClassName}`}>
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="shrink-0">
            <Brand header tagline={false} />
          </div>
          <div className="h-20 w-px shrink-0 bg-gradient-to-b from-transparent via-[#F59E0B]/55 to-transparent dark:via-[#FBBF24]/35 sm:h-24" />
          <p className="min-w-0 flex-[1.45] text-left text-sm font-semibold leading-7 sm:max-w-2xl sm:text-base sm:leading-8">
            {footerText}
          </p>
        </div>

        <div className="mt-7 border-t border-[#F59E0B]/20 pt-6 text-center dark:border-[#FBBF24]/15">
          <div className="mx-auto flex max-w-[520px] items-center gap-3">
            <span className="h-px flex-1 bg-gradient-to-l from-transparent via-[#F59E0B]/65 to-[#10B981]/35 dark:via-[#FBBF24]/40 dark:to-[#10B981]/20" />
            <h2 className="shrink-0 bg-gradient-to-r from-[#D97706] via-[#059669] to-[#EF4444] bg-clip-text text-base font-black text-transparent">
              روابط مهمة
            </h2>
            <span className="h-px flex-1 bg-gradient-to-r from-transparent via-[#F59E0B]/65 to-[#10B981]/35 dark:via-[#FBBF24]/40 dark:to-[#10B981]/20" />
          </div>
          <nav className="mx-auto mt-5 grid max-w-[680px] grid-cols-2 gap-x-7 gap-y-3 sm:gap-x-12" aria-label="روابط مهمة">
            {importantLinks.map((link, index) => {
              const centerLast = importantLinks.length % 2 === 1 && index === importantLinks.length - 1;

              return (
                <Link
                  key={link.slug}
                  to={accountPrefix ? `${accountPrefix}/${link.slug}` : link.path}
                  className={`group relative inline-flex min-h-10 items-center justify-center gap-1.5 text-center text-xs font-black leading-6 text-[#59452B] transition hover:text-[#B45309] dark:text-[#E7D7B8] dark:hover:text-[#FBBF24] sm:text-sm ${
                    centerLast ? "col-span-2 mx-auto min-w-[150px]" : ""
                  }`}
                >
                  <ChevronLeft className="h-4 w-4 shrink-0 text-[#D97706] transition group-hover:-translate-x-0.5 group-hover:text-[#059669] dark:text-[#FBBF24] dark:group-hover:text-[#34D399]" />
                  <span className="relative min-w-0 pb-1 after:absolute after:inset-x-0 after:bottom-0 after:h-px after:origin-center after:scale-x-0 after:bg-gradient-to-l after:from-[#D97706] after:to-[#059669] after:transition-transform after:duration-200 group-hover:after:scale-x-100">
                    {link.label}
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>

        <p className="mt-7 text-center text-sm font-bold text-[#6B5636] dark:text-[#BDAF95]">
          جميع الحقوق محفوظة لدى © ويني 2026
        </p>
        <FooterLegalNumbers />
      </div>
    </footer>
  );
}

function FooterLegalNumbers({ compact = false }) {
  return (
    <p
      dir="rtl"
      className={`flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center font-semibold text-[#8B7A61] dark:text-[#AFA48F] ${
        compact ? "text-[10px]" : "mt-1.5 text-[10px] sm:text-xs"
      }`}
    >
      <span>
        رقم السجل التجاري :
        <span dir="ltr" className="mx-1 inline-block font-bold">
          {commercialRegistration}
        </span>
      </span>
      <span className="font-black opacity-70">-</span>
      <span>
        الرقم الضريبي :
        <span dir="ltr" className="mx-1 inline-block font-bold">
          {taxNumber}
        </span>
      </span>
    </p>
  );
}
