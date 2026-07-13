import { useTranslation } from "react-i18next";

const supportNumber = "971527715868";

export default function WhatsAppSupportButton({ className = "", topic = "currency" }) {
  const { t, i18n } = useTranslation("common");
  const isCountryRequest = topic === "country";
  const message = i18n.language?.startsWith("ar")
    ? isCountryRequest ? "مرحباً، أريد تغيير دولة الحساب." : "مرحباً، أريد تغيير عملة الحساب."
    : isCountryRequest ? "Hello, I would like to change my account country." : "Hello, I would like to change my account currency.";
  const url = `https://wa.me/${supportNumber}?text=${encodeURIComponent(message)}`;

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className={`inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-full bg-[#25D366] px-3 text-[11px] font-black text-white shadow-[0_8px_20px_rgba(37,211,102,0.24)] transition hover:-translate-y-0.5 hover:bg-[#1fbd5b] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366]/50 ${className}`}
      aria-label={t("footer.whatsapp")}
    >
      <WhatsAppIcon className="h-4 w-4" />
      <span>{t("footer.whatsapp")}</span>
    </a>
  );
}

function WhatsAppIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path fill="currentColor" d="M12.04 3.5a8.42 8.42 0 0 0-7.2 12.8l-.9 3.32 3.4-.89A8.42 8.42 0 1 0 12.04 3.5Zm0 1.5a6.92 6.92 0 0 1 5.92 10.49 6.91 6.91 0 0 1-9.97 1.91l-.26-.16-2.01.53.54-1.96-.17-.27A6.92 6.92 0 0 1 12.04 5Z" />
      <path fill="currentColor" d="M9.13 8.2c-.16-.36-.33-.37-.48-.38h-.4c-.14 0-.36.05-.55.26-.19.2-.72.7-.72 1.72s.74 2 1.03 2.14c.28.14 1.45 2.32 3.6 3.15 1.78.7 2.15.56 2.54.52.39-.04 1.27-.52 1.45-1.02.18-.5.18-.94.13-1.03-.06-.1-.2-.15-.42-.26-.23-.12-1.35-.67-1.56-.74-.2-.08-.36-.12-.51.11-.15.23-.58.74-.72.9-.13.15-.26.17-.49.05-.23-.11-.95-.35-1.82-1.12-.67-.6-1.13-1.34-1.26-1.57-.13-.23-.01-.35.1-.47.1-.1.23-.27.34-.4.11-.14.15-.23.22-.38.08-.15.04-.28-.02-.4-.05-.11-.47-1.16-.66-1.58Z" />
    </svg>
  );
}
