export default function Brand({ compact = false, header = false, small = false, tagline = true }) {
  const logoClass = header ? "h-10 w-10 sm:h-14 sm:w-14" : small ? "h-9 w-9" : compact ? "h-10 w-10" : "h-12 w-12";
  const nameClass = header ? "text-xl sm:text-3xl" : small ? "text-base" : compact ? "text-lg" : "text-2xl";
  const funClass = header
    ? "mt-0.5 text-[8px] tracking-[0.3em] sm:text-[11px] sm:tracking-[0.34em]"
    : small
      ? "mt-0.5 text-[8px] tracking-[0.28em]"
      : compact
        ? "mt-0.5 text-[9px] tracking-[0.32em]"
        : "mt-1 text-[11px] tracking-[0.38em]";

  return (
    <div dir="ltr" className="flex items-center gap-0.5">
      <img
        src="/logo.png"
        alt="شعار Winnie Fun"
        className={`${logoClass} object-contain`}
      />
      <div className="-ml-0.5 w-fit text-center leading-none">
        <p className={`${nameClass} font-black`}>innie</p>
        <p className={`${funClass} font-black uppercase text-[#A855F7]`}>
          Fun
        </p>
        {!compact && !header && tagline && (
          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.28em] text-slate-400 dark:text-slate-500">
            شحن عالمي
          </p>
        )}
      </div>
    </div>
  );
}
