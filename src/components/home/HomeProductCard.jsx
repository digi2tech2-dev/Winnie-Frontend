import { motion } from "framer-motion";
import { BadgeCheck, PackageCheck, PackageX, ShoppingCart, Sparkles } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { iconMap } from "../icons";

function getPriceLabel(product = {}) {
  const rawLabel = product.displayPriceLabel || product.minTotalDisplay || product.unitPriceDisplay || product.price || "";
  const label = String(rawLabel || "").trim();
  if (!/[=\u2013\u2014]| - /.test(label)) return label;

  const parts = label.split(/\s*(?:=| - |\u2013|\u2014)\s*/).map((part) => part.trim()).filter(Boolean);
  const pricePart = parts.find((part) => /[A-Z]{3}|\$|€|£|¥|د\.|ريال|درهم/i.test(part))
    || parts.find((part) => /\d+[.,]\d+/.test(part));
  return pricePart || parts[0] || label;
}

function getDiscountLabel(product = {}) {
  if (product.hasDiscount !== true) return "";
  const value = Number(product.discountPercent ?? product.discountPercentage);
  if (!Number.isFinite(value) || value <= 0) return "";
  return `${Math.round(value)}%`;
}

function getMinimumQuantity(product = {}) {
  const value = Number(product.minQty ?? product.minimumQuantity ?? product.minQuantity);
  return Number.isFinite(value) && value > 0 ? value : null;
}

function formatQuantity(value) {
  if (!value) return "";
  return value.toLocaleString("en-US");
}

export default function HomeProductCard({ product, index = 0, onSelect, variant = "compact" }) {
  const { t } = useTranslation("home");
  const [imageFailed, setImageFailed] = useState(false);
  const isFeatured = variant === "featured";
  const Icon = typeof product.icon === "function" ? product.icon : iconMap[product.icon] || iconMap.ShoppingBag;
  const tone = product.cover || product.tone || "from-[#7C3AED] via-[#2563EB] to-[#06B6D4]";
  const priceLabel = getPriceLabel(product);
  const minimumQuantity = getMinimumQuantity(product);
  const isAvailable = product.isPurchasable !== false && product.isActive !== false && product.status !== "unavailable";
  const discountLabel = getDiscountLabel(product);

  const handleSelect = () => {
    onSelect?.(product);
  };

  const handleKeyDown = (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    handleSelect();
  };

  return (
    <motion.article
      role="button"
      tabIndex={0}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.24, delay: Math.min(index, 8) * 0.035 }}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.985 }}
      onClick={handleSelect}
      onKeyDown={handleKeyDown}
      className={[
        "group flex min-w-0 cursor-pointer flex-col overflow-hidden rounded-[14px] border border-white/80 bg-white/[0.92] text-start shadow-[0_8px_18px_rgba(76,29,149,0.08)] outline-none backdrop-blur-xl transition duration-200 hover:border-violet-200 hover:shadow-[0_16px_34px_rgba(14,165,233,0.14)] focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-white/10 dark:bg-slate-900/90 dark:shadow-[0_12px_28px_rgba(0,0,0,0.24)] dark:focus-visible:ring-offset-slate-950 sm:rounded-[22px] sm:shadow-[0_16px_34px_rgba(76,29,149,0.10)]",
        isFeatured ? "min-h-[11.5rem] sm:min-h-[23rem]" : "min-h-[10.75rem] sm:min-h-[19.5rem]",
      ].join(" ")}
    >
      <div className={["relative aspect-square overflow-hidden bg-gradient-to-br", tone, isFeatured ? "sm:aspect-[4/3]" : ""].join(" ")}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_24%_18%,rgba(255,255,255,0.46),transparent_30%),radial-gradient(circle_at_82%_72%,rgba(34,211,238,0.34),transparent_35%),linear-gradient(180deg,rgba(255,255,255,0.04),rgba(15,23,42,0.42))]" />
        <div className="absolute inset-x-4 bottom-0 h-14 rounded-t-full bg-cyan-200/30 blur-2xl" />

        {discountLabel ? (
          <span className="absolute start-1.5 top-1.5 z-20 inline-flex items-center gap-1 rounded-full bg-white/[0.92] px-1.5 py-0.5 text-[8px] font-black text-fuchsia-700 shadow-[0_8px_18px_rgba(124,58,237,0.16)] sm:start-3 sm:top-3 sm:px-2.5 sm:py-1 sm:text-[10px]">
            <Sparkles className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
            {discountLabel}
          </span>
        ) : null}

        <div className="absolute end-1.5 top-1.5 z-20 sm:end-3 sm:top-3">
          <span
            className={[
              "inline-flex max-w-[3.8rem] items-center justify-center gap-1 truncate rounded-full px-1.5 py-0.5 text-[0px] font-black shadow-[0_8px_18px_rgba(15,23,42,0.12)] sm:max-w-none sm:px-2.5 sm:py-1 sm:text-[10px]",
              isAvailable ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700",
            ].join(" ")}
          >
            {isAvailable ? <PackageCheck className="h-2.5 w-2.5 sm:h-3 sm:w-3" /> : <PackageX className="h-2.5 w-2.5 sm:h-3 sm:w-3" />}
            <span className="hidden sm:inline">{isAvailable ? t("homePage.available") : t("homePage.unavailable")}</span>
          </span>
        </div>

        <div className="relative grid h-full w-full place-items-center p-2 sm:p-4">
          <div className={["relative grid place-items-center overflow-hidden rounded-[16px] border border-white/30 bg-white/[0.14] text-white shadow-[0_14px_28px_rgba(15,23,42,0.24)] backdrop-blur transition duration-300 group-hover:scale-[1.035] sm:rounded-[24px] sm:shadow-[0_22px_46px_rgba(15,23,42,0.28)]", isFeatured ? "h-[84%] w-[84%] sm:h-[82%] sm:w-[82%]" : "h-[82%] w-[82%] sm:h-[78%] sm:w-[78%]"].join(" ")}>
            {!product.image || imageFailed ? (
              <div className="absolute inset-0 grid place-items-center bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.28),transparent_30%),linear-gradient(135deg,rgba(124,58,237,0.24),rgba(14,165,233,0.24))]">
                <Icon className={isFeatured ? "h-9 w-9 drop-shadow-[0_0_18px_rgba(255,255,255,0.55)] sm:h-16 sm:w-16 sm:drop-shadow-[0_0_22px_rgba(255,255,255,0.55)]" : "h-8 w-8 drop-shadow-[0_0_14px_rgba(255,255,255,0.55)] sm:h-12 sm:w-12 sm:drop-shadow-[0_0_18px_rgba(255,255,255,0.55)]"} />
              </div>
            ) : (
              <img
                src={product.image}
                alt={product.name || product.title || ""}
                className="h-full w-full object-cover object-center transition duration-300 group-hover:scale-105"
                loading="lazy"
                onError={() => setImageFailed(true)}
              />
            )}
          </div>
        </div>
      </div>

      <div className={["flex flex-1 flex-col p-1.5 sm:p-3.5", isFeatured ? "gap-1.5 sm:gap-3 sm:p-4" : "gap-1.5 sm:gap-2.5"].join(" ")}>
        <div className="min-w-0">
          <h3 className={["line-clamp-2 font-black leading-[1.15] text-slate-950 dark:text-white sm:leading-5", isFeatured ? "text-[11px] sm:text-lg sm:leading-6" : "text-[10.5px] sm:text-[15px]"].join(" ")}>
            {product.name || product.title}
          </h3>
          {product.categoryTitle ? (
            <p className="mt-1 hidden truncate text-xs font-bold text-slate-500 dark:text-slate-400 sm:block">{product.categoryTitle}</p>
          ) : null}
        </div>

        <div className="mt-auto grid gap-1 sm:gap-2">
          <div className="grid gap-0.5 text-[9px] font-bold leading-tight text-slate-600 dark:text-slate-300 sm:gap-1.5 sm:text-xs">
            {minimumQuantity ? (
              <span className="hidden items-center gap-1.5 sm:inline-flex">
                <BadgeCheck className="h-3.5 w-3.5 text-violet-500" />
                {t("homePage.minimum")}: <span dir="ltr">{formatQuantity(minimumQuantity)}</span>
              </span>
            ) : null}
            <span className="inline-flex min-w-0 items-center gap-1 sm:gap-1.5">
              <Sparkles className="hidden h-3.5 w-3.5 shrink-0 text-cyan-500 sm:block" />
              <span className="hidden shrink-0 sm:inline">{t("homePage.startsFrom")}:</span>
              <span dir="ltr" className="min-w-0 truncate font-black text-violet-700 dark:text-violet-300">
                {priceLabel || t("showcase.priceUnavailable")}
              </span>
            </span>
          </div>

          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              handleSelect();
            }}
            className="inline-flex h-7 w-full items-center justify-center gap-1 rounded-[10px] bg-[linear-gradient(135deg,#7C3AED,#2563EB,#06B6D4)] px-1.5 text-[10px] font-black text-white shadow-[0_8px_16px_rgba(37,99,235,0.18)] transition hover:shadow-[0_16px_30px_rgba(124,58,237,0.28)] focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950 sm:h-10 sm:gap-2 sm:rounded-[14px] sm:px-3 sm:text-sm sm:shadow-[0_12px_24px_rgba(37,99,235,0.22)]"
          >
            <ShoppingCart className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="truncate">{t("homePage.topUpNow")}</span>
          </button>
        </div>
      </div>
    </motion.article>
  );
}
