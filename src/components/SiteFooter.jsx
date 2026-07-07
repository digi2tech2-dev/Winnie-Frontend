import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowUpLeft,
  FileCheck2,
  FileText,
  Instagram,
  Landmark,
  Lightbulb,
  Mail,
  MessagesSquare,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  UsersRound,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import Brand from "./Brand";
import { importantLinks } from "../data/importantLinks";

const commercialRegistration = "4423622.01";
const taxNumber = "105156169200001";
const supportEmail = "Support.winniefun@gmail.com";
const instagramUrl = "https://www.instagram.com/winnie.cards?utm_source=qr";
const whatsappUrl = "https://wa.me/971527715868";

const linkIcons = {
  "privacy-policy": ShieldCheck,
  "terms-and-conditions": FileText,
  "aml-policy": Landmark,
  "replacement-cancellation-policy": RefreshCcw,
  "contact-methods": MessagesSquare,
  "suggestions-complaints": Lightbulb,
  "affiliate-marketing": UsersRound,
};

const linkIconStyles = {
  "privacy-policy": "border-sky-300/70 from-sky-100 to-blue-50 text-sky-600 shadow-[0_5px_16px_rgba(14,165,233,0.16)] dark:border-sky-400/25 dark:from-sky-500/20 dark:to-blue-500/10 dark:text-sky-300",
  "affiliate-marketing": "border-fuchsia-300/70 from-fuchsia-100 to-violet-50 text-fuchsia-600 shadow-[0_5px_16px_rgba(217,70,239,0.16)] dark:border-fuchsia-400/25 dark:from-fuchsia-500/20 dark:to-violet-500/10 dark:text-fuchsia-300",
  "terms-and-conditions": "border-orange-300/70 from-orange-100 to-amber-50 text-orange-600 shadow-[0_5px_16px_rgba(249,115,22,0.16)] dark:border-orange-400/25 dark:from-orange-500/20 dark:to-amber-500/10 dark:text-orange-300",
  "aml-policy": "border-emerald-300/70 from-emerald-100 to-teal-50 text-emerald-600 shadow-[0_5px_16px_rgba(16,185,129,0.16)] dark:border-emerald-400/25 dark:from-emerald-500/20 dark:to-teal-500/10 dark:text-emerald-300",
  "replacement-cancellation-policy": "border-rose-300/70 from-rose-100 to-pink-50 text-rose-600 shadow-[0_5px_16px_rgba(244,63,94,0.16)] dark:border-rose-400/25 dark:from-rose-500/20 dark:to-pink-500/10 dark:text-rose-300",
  "contact-methods": "border-cyan-300/70 from-cyan-100 to-sky-50 text-cyan-600 shadow-[0_5px_16px_rgba(6,182,212,0.16)] dark:border-cyan-400/25 dark:from-cyan-500/20 dark:to-sky-500/10 dark:text-cyan-300",
  "suggestions-complaints": "border-amber-300/70 from-amber-100 to-yellow-50 text-amber-600 shadow-[0_5px_16px_rgba(245,158,11,0.16)] dark:border-amber-400/25 dark:from-amber-500/20 dark:to-yellow-500/10 dark:text-amber-300",
};

const reveal = {
  hidden: { opacity: 0, y: 14 },
  visible: (index = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: Math.min(index * 0.045, 0.25), duration: 0.45, ease: "easeOut" },
  }),
};

export default function SiteFooter({ className = "", innerClassName = "max-w-[1120px]", simple = false, legalOnly = false }) {
  const location = useLocation();
  const { t } = useTranslation(["common", "policies"]);
  const translatedArticles = t("articles", { ns: "policies", returnObjects: true });
  const policyArticles = Array.isArray(translatedArticles) ? translatedArticles : [];
  const accountPrefix = location.pathname.startsWith("/customer")
    ? "/customer"
    : location.pathname.startsWith("/admin")
      ? "/admin/user"
      : "";

  if (legalOnly) {
    return (
      <footer
        dir="rtl"
        className={`relative overflow-hidden border-t border-violet-200/60 bg-[linear-gradient(180deg,#F8FAFF_0%,#F2F0FF_100%)] px-4 py-4 text-slate-700 dark:border-violet-400/15 dark:bg-[radial-gradient(circle_at_50%_-40%,#17153A_0%,#070B1A_58%,#030611_100%)] dark:text-white/75 sm:px-6 ${className}`}
      >
        <FooterGlow />
        <div className={`relative mx-auto rounded-[20px] border border-violet-200/70 bg-white/55 px-4 pb-4 text-center shadow-[0_16px_44px_rgba(76,29,149,0.08)] backdrop-blur-2xl dark:border-violet-400/20 dark:bg-[#070B19]/70 ${innerClassName}`}>
          <CopyrightBlock compact t={t} />
        </div>
      </footer>
    );
  }

  if (simple) {
    return (
      <footer
        dir="rtl"
        className={`relative overflow-hidden border-t border-violet-200/60 bg-slate-50 px-4 py-7 text-slate-700 dark:border-violet-400/15 dark:bg-[#050817] dark:text-white/75 sm:px-6 lg:px-8 ${className}`}
      >
        <FooterGlow />
        <div className={`relative mx-auto overflow-hidden rounded-[28px] border border-white/80 bg-white/65 p-5 text-center shadow-[0_20px_60px_rgba(76,29,149,0.08)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.035] dark:shadow-[0_20px_70px_rgba(0,0,0,0.28)] ${innerClassName}`}>
          <div className="flex flex-col items-center gap-3">
            <Brand compact tagline={false} />
            <p className="inline-flex items-center gap-2 rounded-full border border-violet-400/30 bg-gradient-to-l from-violet-600 via-fuchsia-500 to-blue-500 px-4 py-1.5 text-[10px] font-black text-white shadow-[0_8px_24px_rgba(124,58,237,0.28),0_0_18px_rgba(59,130,246,0.12)] ring-1 ring-white/30 sm:text-xs dark:border-violet-300/25 dark:shadow-[0_8px_26px_rgba(124,58,237,0.35),0_0_22px_rgba(59,130,246,0.18)]">
              <Sparkles className="h-3 w-3 text-white/90" />
              {t("footer.followUs")}
              <Sparkles className="h-3 w-3 text-white/90" />
            </p>
            <FooterSocialLinks compact />
            <CopyrightBlock compact t={t} />
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer
      dir="rtl"
      className={`relative overflow-hidden border-t border-violet-200/60 bg-[linear-gradient(180deg,#F8FAFF_0%,#F2F0FF_48%,#EEF6FF_100%)] px-3 py-6 text-slate-800 dark:border-violet-400/15 dark:bg-[radial-gradient(circle_at_50%_-20%,#17153A_0%,#070B1A_45%,#030611_100%)] dark:text-white sm:px-6 sm:py-9 lg:px-8 ${className}`}
    >
      <FooterGlow />
      <div className={`relative mx-auto ${innerClassName}`}>
        <div className="relative overflow-hidden rounded-[30px] border border-violet-200/70 bg-white/55 p-3 shadow-[0_30px_90px_rgba(76,29,149,0.12),inset_0_1px_0_rgba(255,255,255,0.95)] backdrop-blur-2xl dark:border-violet-400/25 dark:bg-[#070B19]/70 dark:shadow-[0_30px_100px_rgba(0,0,0,0.42),0_0_45px_rgba(124,58,237,0.08),inset_0_1px_0_rgba(255,255,255,0.07)] sm:p-5 lg:p-7">
          <span className="pointer-events-none absolute inset-x-12 top-0 h-px bg-gradient-to-r from-transparent via-fuchsia-400/80 to-transparent" />

          <motion.section
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.25 }}
            variants={reveal}
            className="relative grid overflow-hidden rounded-[20px] border border-violet-200/70 bg-white/60 shadow-[0_10px_30px_rgba(79,70,229,0.07)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.035] md:grid-cols-[0.7fr_1px_1.3fr]"
            aria-label={t("footer.companyAria")}
          >
            <div className="relative flex min-h-[78px] items-center justify-center p-3 md:order-1 sm:min-h-[92px] lg:p-4">
              <span className="absolute h-16 w-16 rounded-full bg-violet-500/15 blur-2xl dark:bg-violet-500/25" />
              <div className="relative scale-75 sm:scale-90">
                <Brand header tagline={false} />
              </div>
              <Sparkles className="absolute left-3 top-3 h-3 w-3 text-fuchsia-500/55" aria-hidden="true" />
            </div>
            <div className="mx-4 h-px bg-gradient-to-r from-transparent via-violet-300 to-transparent dark:via-violet-400/35 md:order-2 md:mx-0 md:h-auto md:w-px md:bg-gradient-to-b" />
            <div className="flex items-center p-3 text-start md:order-3 sm:p-4 lg:p-5">
              <div>
                <span className="mb-1.5 inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50/80 px-2 py-0.5 text-[8px] font-black text-violet-700 dark:border-violet-400/20 dark:bg-violet-500/10 dark:text-violet-200 sm:text-[9px]">
                  <Sparkles className="h-3 w-3" />
                  {t("footer.companyBadge")}
                </span>
                <p className="max-w-2xl text-[11px] font-bold leading-5 text-slate-600 dark:text-slate-300 sm:text-xs sm:leading-6">
                  {t("footer.description")}
                </p>
              </div>
            </div>
          </motion.section>

          <FooterSectionTitle title={t("footer.importantLinks")} />
          <nav className="grid grid-cols-3 gap-1.5 sm:gap-2.5" aria-label={t("footer.importantLinksAria")}>
            {[
              { type: "link", slug: "privacy-policy" },
              { type: "link", slug: "affiliate-marketing" },
              { type: "link", slug: "terms-and-conditions" },
              { type: "link", slug: "aml-policy" },
              { type: "shield" },
              { type: "link", slug: "replacement-cancellation-policy" },
              { type: "link", slug: "contact-methods" },
              { type: "empty" },
              { type: "link", slug: "suggestions-complaints" },
            ].map((item, index) => {
              if (item.type === "empty") {
                return (
                  <div key={`empty-${index}`} className="pointer-events-none opacity-0 select-none" aria-hidden="true" />
                );
              }
              if (item.type === "shield") {
                return (
                  <motion.div
                    key="shield"
                    custom={index}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.15 }}
                    variants={reveal}
                  >
                    <GlowingShield />
                  </motion.div>
                );
              }

              const link = importantLinks.find((l) => l.slug === item.slug);
              if (!link) return null;

              const article = policyArticles.find((p) => p.slug === link.slug);
              const Icon = linkIcons[link.slug] || FileCheck2;
              const iconStyle = linkIconStyles[link.slug] || linkIconStyles["privacy-policy"];

              return (
                <motion.div
                  key={link.slug}
                  custom={index}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.15 }}
                  variants={reveal}
                  className="h-full"
                >
                  <Link
                    to={accountPrefix ? `${accountPrefix}/${link.slug}` : link.path}
                    className="group relative flex h-full min-h-[48px] items-center gap-1.5 overflow-hidden rounded-[12px] border border-slate-200/80 bg-white/70 p-1.5 text-start shadow-[0_6px_20px_rgba(15,23,42,0.04)] transition duration-300 hover:-translate-y-0.5 hover:scale-[1.015] hover:border-violet-400/70 hover:shadow-[0_12px_30px_rgba(124,58,237,0.13)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 dark:border-white/[0.08] dark:bg-white/[0.035] dark:hover:border-violet-400/55 dark:hover:bg-violet-500/[0.07] sm:min-h-[58px] sm:gap-2 sm:rounded-[16px] sm:p-2.5"
                  >
                    <span className="pointer-events-none absolute inset-x-8 top-0 h-px scale-x-0 bg-gradient-to-r from-transparent via-fuchsia-400 to-transparent transition-transform duration-300 group-hover:scale-x-100" />
                    <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-[9px] border bg-gradient-to-br transition duration-300 group-hover:rotate-[-3deg] group-hover:scale-110 sm:h-9 sm:w-9 sm:rounded-[12px] ${iconStyle}`}>
                      <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </span>
                    <span className="min-w-0 flex-1 text-[8px] font-black leading-tight text-slate-700 dark:text-slate-100 min-[380px]:text-[9px] min-[420px]:text-[10px] sm:text-xs">
                      {article?.label || link.slug}
                    </span>
                    <ArrowUpLeft className="h-2.5 w-2.5 shrink-0 text-slate-300 transition duration-300 group-hover:-translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-violet-500 dark:text-slate-600 dark:group-hover:text-violet-300 sm:h-3 sm:w-3" />
                  </Link>
                </motion.div>
              );
            })}
          </nav>

          <FooterSocialLinks />

          <CopyrightBlock t={t} />
        </div>
      </div>
    </footer>
  );
}

function FooterGlow() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <span className="absolute -right-20 top-10 h-64 w-64 rounded-full bg-violet-400/15 blur-[90px] dark:bg-violet-600/15" />
      <span className="absolute -left-24 bottom-10 h-72 w-72 rounded-full bg-blue-400/15 blur-[100px] dark:bg-blue-600/10" />
      <span className="absolute left-1/2 top-1/3 h-40 w-40 -translate-x-1/2 rounded-full bg-fuchsia-400/10 blur-[80px] dark:bg-fuchsia-500/10" />
    </div>
  );
}

function FooterSectionTitle({ title }) {
  return (
    <div className="my-4 flex items-center justify-center gap-2 sm:my-5" aria-hidden="true">
      <span className="h-px w-full max-w-28 bg-gradient-to-l from-violet-400/60 to-transparent" />
      <Sparkles className="h-3.5 w-3.5 shrink-0 text-violet-500" />
      <h2 className="shrink-0 bg-gradient-to-l from-violet-700 via-fuchsia-600 to-blue-600 bg-clip-text text-xs font-black text-transparent dark:from-violet-200 dark:via-fuchsia-300 dark:to-blue-300 sm:text-sm">
        {title}
      </h2>
      <Sparkles className="h-3.5 w-3.5 shrink-0 text-fuchsia-500" />
      <span className="h-px w-full max-w-28 bg-gradient-to-r from-fuchsia-400/60 to-transparent" />
    </div>
  );
}

function FooterSocialLinks({ compact = false }) {
  const { t } = useTranslation("common");
  const links = [
    {
      href: whatsappUrl,
      icon: WhatsAppIcon,
      label: t("footer.whatsapp"),
      iconClass: "from-emerald-400 to-green-600 shadow-[0_10px_28px_rgba(34,197,94,0.28)]",
      glowClass: "group-hover:border-emerald-400/50 group-hover:shadow-[0_18px_45px_rgba(34,197,94,0.13)]",
    },
    {
      href: instagramUrl,
      icon: Instagram,
      label: t("footer.instagram"),
      iconClass: "from-orange-400 via-pink-500 to-violet-600 shadow-[0_10px_28px_rgba(236,72,153,0.28)]",
      glowClass: "group-hover:border-pink-400/50 group-hover:shadow-[0_18px_45px_rgba(236,72,153,0.13)]",
    },
    {
      href: `mailto:${supportEmail}`,
      icon: Mail,
      label: t("footer.email"),
      iconClass: "from-sky-400 to-blue-600 shadow-[0_10px_28px_rgba(59,130,246,0.28)]",
      glowClass: "group-hover:border-blue-400/50 group-hover:shadow-[0_18px_45px_rgba(59,130,246,0.13)]",
    },
  ];

  if (compact) {
    return (
      <section className="flex flex-wrap items-center justify-center gap-2.5" aria-label={t("footer.socialAria")}>
        {links.map(({ href, icon: Icon, label, iconClass, glowClass }) => (
          <a
            key={href}
            href={href}
            target={href.startsWith("http") ? "_blank" : undefined}
            rel={href.startsWith("http") ? "noreferrer noopener" : undefined}
            aria-label={label}
            title={label}
            className={`group relative grid h-11 w-11 place-items-center overflow-hidden rounded-2xl border border-white/80 bg-white/65 shadow-[0_7px_20px_rgba(15,23,42,0.08)] transition duration-300 hover:-translate-y-1 hover:scale-105 dark:border-white/10 dark:bg-white/[0.045] ${glowClass}`}
          >
            <span className="pointer-events-none absolute inset-x-2 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent opacity-80" />
            <span className={`relative grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br text-white ring-1 ring-white/35 transition duration-300 before:absolute before:inset-[-5px] before:rounded-2xl before:bg-inherit before:opacity-20 before:blur-md group-hover:rotate-3 group-hover:scale-105 ${iconClass}`}>
              <Icon className="relative h-[17px] w-[17px] drop-shadow-[0_2px_4px_rgba(0,0,0,0.20)]" />
            </span>
          </a>
        ))}
      </section>
    );
  }

  return (
    <section
      className="relative mx-auto mt-4 max-w-[320px] overflow-hidden rounded-[16px] border border-slate-200/80 bg-white/55 p-2 shadow-[0_8px_26px_rgba(15,23,42,0.05),inset_0_1px_0_rgba(255,255,255,0.85)] backdrop-blur-2xl dark:border-white/[0.09] dark:bg-white/[0.03] dark:shadow-[0_10px_30px_rgba(0,0,0,0.20),0_0_18px_rgba(124,58,237,0.05),inset_0_1px_0_rgba(255,255,255,0.06)]"
      aria-label={t("footer.socialAria")}
    >
      <span className="pointer-events-none absolute inset-x-12 top-0 h-px bg-gradient-to-r from-transparent via-violet-400/70 to-transparent" />
      <span className="pointer-events-none absolute left-1/2 top-3 h-12 w-12 -translate-x-1/2 rounded-full bg-fuchsia-400/10 blur-2xl dark:bg-fuchsia-500/10" />
      <div className="mb-1.5 flex items-center justify-center gap-1.5 text-center">
        <span className="h-px w-6 bg-gradient-to-l from-violet-400/70 to-transparent" />
        <Sparkles className="h-2.5 w-2.5 text-violet-500" />
        <h2 className="bg-gradient-to-l from-violet-700 via-fuchsia-600 to-blue-600 bg-clip-text text-[9px] font-black text-transparent dark:from-violet-100 dark:via-fuchsia-200 dark:to-blue-200 sm:text-[10px]">
          {t("footer.followUs")}
        </h2>
        <Sparkles className="h-2.5 w-2.5 text-fuchsia-500" />
        <span className="h-px w-6 bg-gradient-to-r from-fuchsia-400/70 to-transparent" />
      </div>
      <div className="grid grid-cols-3 gap-2">
        {links.map(({ href, icon: Icon, label, iconClass, glowClass }, index) => (
          <motion.a
            key={href}
            href={href}
            target={href.startsWith("http") ? "_blank" : undefined}
            rel={href.startsWith("http") ? "noreferrer noopener" : undefined}
            custom={index}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.15 }}
            variants={reveal}
            aria-label={label}
            title={label}
            className={`group relative grid h-[48px] place-items-center overflow-hidden rounded-[12px] border border-slate-200/70 bg-white/60 shadow-[0_6px_18px_rgba(15,23,42,0.04)] transition duration-300 hover:-translate-y-0.5 hover:scale-[1.025] dark:border-white/[0.07] dark:bg-[#070B19]/30 sm:h-[58px] sm:rounded-[16px] ${glowClass}`}
          >
            <span className="pointer-events-none absolute inset-x-4 top-0 h-px scale-x-0 bg-gradient-to-r from-transparent via-white/70 to-transparent opacity-0 transition duration-300 group-hover:scale-x-100 group-hover:opacity-100" />
            <span className={`relative grid h-8 w-8 shrink-0 place-items-center rounded-[10px] bg-gradient-to-br text-white ring-1 ring-white/25 transition duration-300 before:absolute before:inset-[-5px] before:rounded-[12px] before:bg-inherit before:opacity-20 before:blur-lg group-hover:scale-105 group-hover:rotate-3 sm:h-9 sm:w-9 sm:rounded-[12px] ${iconClass}`}>
              <Icon className="relative h-4 w-4 sm:h-[18px] sm:w-[18px]" />
            </span>
          </motion.a>
        ))}
      </div>
    </section>
  );
}

function WhatsAppIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        fill="currentColor"
        d="M12.04 3.5a8.42 8.42 0 0 0-7.2 12.8l-.9 3.32 3.4-.89A8.42 8.42 0 1 0 12.04 3.5Zm0 1.5a6.92 6.92 0 0 1 5.92 10.49 6.91 6.91 0 0 1-9.97 1.91l-.26-.16-2.01.53.54-1.96-.17-.27A6.92 6.92 0 0 1 12.04 5Z"
      />
      <path
        fill="currentColor"
        d="M9.13 8.2c-.16-.36-.33-.37-.48-.38h-.4c-.14 0-.36.05-.55.26-.19.2-.72.7-.72 1.72s.74 2 1.03 2.14c.28.14 1.45 2.32 3.6 3.15 1.78.7 2.15.56 2.54.52.39-.04 1.27-.52 1.45-1.02.18-.5.18-.94.13-1.03-.06-.1-.2-.15-.42-.26-.23-.12-1.35-.67-1.56-.74-.2-.08-.36-.12-.51.11-.15.23-.58.74-.72.9-.13.15-.26.17-.49.05-.23-.11-.95-.35-1.82-1.12-.67-.6-1.13-1.34-1.26-1.57-.13-.23-.01-.35.1-.47.1-.1.23-.27.34-.4.11-.14.15-.23.22-.38.08-.15.04-.28-.02-.4-.05-.11-.47-1.16-.66-1.58Z"
      />
    </svg>
  );
}

function CopyrightBlock({ compact = false, t }) {
  return (
    <div className={`${compact ? "w-full border-t border-violet-200/50 pt-4 dark:border-white/10" : "mt-7 border-t border-violet-200/60 px-2 pt-6 text-center dark:border-white/10"}`}>
      <p className="bg-gradient-to-l from-violet-700 via-fuchsia-600 to-blue-600 bg-clip-text text-xs font-black text-transparent dark:from-violet-200 dark:via-fuchsia-300 dark:to-blue-300 sm:text-sm">
        {t("footer.rights")}
      </p>
      <FooterLegalNumbers compact={compact} t={t} />
    </div>
  );
}

function FooterLegalNumbers({ compact = false, t }) {
  return (
    <p dir="rtl" className={`flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-center font-semibold text-slate-500 dark:text-slate-400 ${compact ? "mt-1.5 text-[9px]" : "mt-2 text-[10px] sm:text-xs"}`}>
      <span>{t("footer.commercialRegistration")}<span dir="ltr" className="mx-1 inline-block font-bold text-slate-600 dark:text-slate-300">{commercialRegistration}</span></span>
      <span className="h-1 w-1 rounded-full bg-violet-500" aria-hidden="true" />
      <span>{t("footer.taxNumber")}<span dir="ltr" className="mx-1 inline-block font-bold text-slate-600 dark:text-slate-300">{taxNumber}</span></span>
    </p>
  );
}

function GlowingShield() {
  return (
    <div className="relative flex h-full min-h-[48px] items-center justify-center overflow-hidden rounded-[12px] border border-slate-200/80 bg-white/70 shadow-[0_6px_20px_rgba(15,23,42,0.04)] dark:border-white/[0.08] dark:bg-white/[0.035] sm:min-h-[58px] sm:rounded-[16px]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(124,58,237,0.12)_0%,transparent_72%)]" />
      <motion.div
        animate={{ y: [0, -2, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="relative grid h-7 w-7 place-items-center rounded-[9px] border border-violet-200/80 bg-gradient-to-br from-violet-600/15 to-blue-500/15 p-1 shadow-[0_6px_18px_rgba(124,58,237,0.24)] sm:h-9 sm:w-9 sm:rounded-[12px] sm:p-1.5"
      >
        <img src="/logo.png" alt="" className="h-full w-full object-contain drop-shadow-[0_0_8px_rgba(124,58,237,0.45)]" />
      </motion.div>
    </div>
  );
}
