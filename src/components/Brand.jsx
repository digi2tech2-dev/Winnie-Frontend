import { useTranslation } from "react-i18next";

const sizeClasses = {
  inline: {
    name: "text-[1em]",
    fun: "ml-1 text-[0.82em] tracking-[0.16em]",
  },
  tiny: {
    name: "text-sm",
    fun: "mt-0.5 text-[8px] tracking-[0.24em]",
  },
  small: {
    name: "text-base",
    fun: "mt-0.5 text-[8px] tracking-[0.28em]",
  },
  compact: {
    name: "text-lg",
    fun: "mt-0.5 text-[9px] tracking-[0.32em]",
  },
  default: {
    name: "text-2xl",
    fun: "mt-1 text-[11px] tracking-[0.38em]",
  },
  header: {
    name: "text-xl sm:text-3xl",
    fun: "mt-0.5 text-[8px] tracking-[0.3em] sm:text-[11px] sm:tracking-[0.34em]",
  },
  customerHeader: {
    name: "text-2xl sm:text-3xl",
    fun: "mt-0.5 text-[9px] tracking-[0.3em] sm:text-[11px] sm:tracking-[0.34em]",
  },
  adminHeader: {
    name: "text-3xl sm:text-4xl",
    fun: "mt-0.5 text-[11px] tracking-[0.3em] sm:text-sm sm:tracking-[0.34em]",
  },
};

export function BrandName({
  className = "",
  forceArabic = false,
  fullName = false,
  inline = false,
  size = "compact",
}) {
  const classes = sizeClasses[size] || sizeClasses.compact;
  const wrapperClass = inline
    ? "inline-flex items-baseline gap-1 align-baseline leading-none"
    : "inline-block text-center leading-none";

  return (
    <span dir="ltr" className={`${wrapperClass} ${className}`.trim()} aria-label={forceArabic ? "ويني فن" : "Winnie Fun"}>
      <span className={`${classes.name} winnie-brand-name ${inline ? "inline-block" : "block"} truncate font-black italic tracking-wide`}>
        {forceArabic ? "ويني" : fullName ? "winnie" : "innie"}
      </span>
      <span className={`${classes.fun} winnie-brand-name winnie-brand-fun ${inline ? "inline-block" : "block"} font-black uppercase text-[#A855F7]`}>
        {forceArabic ? "فن" : "Fun"}
      </span>
    </span>
  );
}

export function BrandLockup({
  className = "",
  forceArabic = false,
  fullName = true,
  logoClassName = "h-7 w-7",
  nameSize = "inline",
}) {
  const { t } = useTranslation("common");

  return (
    <span dir="ltr" className={`inline-flex items-center gap-1.5 align-middle leading-none ${className}`.trim()}>
      <img
        src="/logo.png"
        alt={forceArabic ? "شعار ويني فن" : t("app.logoAlt")}
        className={`${logoClassName} shrink-0 object-contain`}
      />
      <BrandName forceArabic={forceArabic} fullName={fullName} inline size={nameSize} />
    </span>
  );
}

export default function Brand({ compact = false, forceArabic = false, header = false, small = false, tagline = true }) {
  const { t } = useTranslation("common");
  const logoClass = header ? "h-10 w-10 sm:h-14 sm:w-14" : small ? "h-9 w-9" : compact ? "h-10 w-10" : "h-12 w-12";
  const brandSize = header ? "header" : small ? "small" : compact ? "compact" : "default";

  return (
    <div dir="ltr" className="flex items-center gap-0.5">
      <img
        src="/logo.png"
        alt={forceArabic ? "شعار ويني فن" : t("app.logoAlt")}
        className={`${logoClass} object-contain`}
      />
      <div className="-ml-0.5 w-fit text-center leading-none">
        <BrandName forceArabic={forceArabic} size={brandSize} />
        {!compact && !header && tagline && (
          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.28em] text-slate-400 dark:text-slate-500">
            {t("app.tagline")}
          </p>
        )}
      </div>
    </div>
  );
}
