import { BadgePercent, ShieldCheck, Zap } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function HomePromoBanners() {
  const { t, i18n } = useTranslation("home");
  const isArabic = i18n.language?.startsWith("ar");
  const banners = [
    {
      id: "games",
      icon: Zap,
      title: t("homePage.promoGamesTitle"),
      description: t("homePage.promoGamesDescription"),
      cta: t("homePage.promoGamesCta"),
      className: "from-violet-600 via-blue-600 to-cyan-500",
    },
    {
      id: "value",
      icon: BadgePercent,
      title: t("homePage.promoValueTitle"),
      description: t("homePage.promoValueDescription"),
      cta: t("homePage.promoValueCta"),
      className: "from-fuchsia-500 via-violet-600 to-blue-600",
    },
    {
      id: "trust",
      icon: ShieldCheck,
      title: t("homePage.promoTrustTitle"),
      description: t("homePage.promoTrustDescription"),
      cta: t("homePage.promoTrustCta"),
      className: "from-cyan-500 via-sky-600 to-violet-600",
    },
  ];

  return (
    <section dir={isArabic ? "rtl" : "ltr"} aria-label={t("homePage.promotions")} className="hidden overflow-hidden md:block">
      <div className="grid grid-cols-3 gap-3">
        {banners.map((banner) => {
          const Icon = banner.icon;
          return (
            <div
              key={banner.id}
              className={["relative flex min-h-[7.25rem] overflow-hidden rounded-[22px] bg-gradient-to-br p-4 text-white shadow-[0_16px_34px_rgba(37,99,235,0.16)]", banner.className].join(" ")}
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(255,255,255,0.32),transparent_30%),radial-gradient(circle_at_92%_86%,rgba(34,211,238,0.20),transparent_36%)]" />
              <div className="absolute -bottom-7 end-4 h-24 w-24 rounded-full bg-white/[0.18] blur-2xl" />
              <div className="relative flex h-full min-w-0 flex-1 items-start gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-white/25 bg-white/[0.18] shadow-[0_10px_20px_rgba(15,23,42,0.16)] backdrop-blur">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <strong className="line-clamp-1 text-sm font-black leading-5">{banner.title}</strong>
                  <span className="mt-1 line-clamp-2 text-xs font-bold leading-5 text-white/[0.82]">{banner.description}</span>
                  <span className="mt-auto inline-flex h-8 w-fit items-center rounded-full border border-white/25 bg-white/[0.16] px-3 text-[11px] font-black text-white shadow-[0_8px_18px_rgba(15,23,42,0.12)] backdrop-blur">
                    {banner.cta}
                  </span>
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
