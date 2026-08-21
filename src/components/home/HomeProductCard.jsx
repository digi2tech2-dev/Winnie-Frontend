import { motion } from "framer-motion";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import FavoriteButton from "../FavoriteButton";
import { iconMap } from "../icons";
import { isProductUnavailable } from "../../utils/productAvailability";

function getPriceLabel(product = {}) {
  const rawLabel = product.displayPriceLabel || product.minTotalDisplay || product.unitPriceDisplay || product.price || "";
  const label = String(rawLabel || "").trim();
  if (!/[=\u2013\u2014]| - /.test(label)) return label;

  const parts = label.split(/\s*(?:=| - |\u2013|\u2014)\s*/).map((part) => part.trim()).filter(Boolean);
  const pricePart = parts.find((part) => /[A-Z]{3}|\$|€|£|¥|د\.|ريال|درهم/i.test(part))
    || parts.find((part) => /\d+[.,]\d+/.test(part));
  return pricePart || parts[0] || label;
}

export default function HomeProductCard({ product, index = 0, onSelect, reservePriceSpace = false, favoriteEnabled = true, href = "" }) {
  const { t } = useTranslation("products");
  const [imageFailed, setImageFailed] = useState(false);
  const Icon = typeof product.icon === "function" ? product.icon : iconMap[product.icon] || iconMap.ShoppingBag;
  const priceLabel = getPriceLabel(product);
  const isUnavailable = isProductUnavailable(product);

  const handleSelect = () => {
    if (isUnavailable) return;
    onSelect?.(product);
  };
  const handleKeyDown = (event) => {
    if (isUnavailable) return;
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    handleSelect();
  };

  return (
    <motion.article
      role="button"
      tabIndex={isUnavailable ? -1 : 0}
      aria-disabled={isUnavailable || undefined}
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-30px" }}
      transition={{ duration: 0.2, delay: Math.min(index, 8) * 0.025 }}
      whileTap={isUnavailable ? undefined : { scale: 0.985 }}
      onClick={handleSelect}
      onKeyDown={handleKeyDown}
      className={`homepage-product-card group flex min-w-0 flex-col items-center text-center outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-4 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-950 ${
        isUnavailable ? "cursor-not-allowed" : "cursor-pointer"
      }`}
    >
      <div className="homepage-product-card__visual relative flex aspect-square w-full items-center justify-center overflow-hidden">
        {product.image && !imageFailed ? (
          <img
            src={product.image}
            alt={product.name || product.title || ""}
            className={`homepage-product-card__image h-auto max-h-full w-full object-contain transition-[transform,filter,opacity] duration-200 ease-out ${
              isUnavailable
                ? "opacity-70 grayscale-[35%]"
                : "motion-safe:group-hover:-translate-y-[3px] motion-safe:group-hover:scale-[1.03] motion-safe:group-hover:brightness-105"
            }`}
            loading="lazy"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <Icon className={`h-1/2 w-1/2 text-violet-500 transition-transform duration-200 dark:text-violet-300 ${
            isUnavailable
              ? "opacity-60"
              : "motion-safe:group-hover:-translate-y-[3px] motion-safe:group-hover:scale-[1.03]"
          }`} />
        )}
        {isUnavailable ? (
          <>
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 z-10 bg-slate-950/15"
            />
            <span className="pointer-events-none absolute left-1/2 top-2 z-20 -translate-x-1/2 whitespace-nowrap rounded-full border border-white/70 bg-rose-600 px-2.5 py-1 text-[9px] font-black text-white shadow-[0_5px_18px_rgba(225,29,72,0.5)] sm:top-3 sm:px-3 sm:text-[10px]">
              {t("purchase.productUnavailableBadge")}
            </span>
          </>
        ) : null}
      </div>

      <div className="mt-2 flex min-h-[2.25rem] w-full items-start justify-center gap-1.5">
        <h3 className="line-clamp-2 min-w-0 text-center text-[11px] font-bold leading-[1.125rem] text-slate-900 transition-colors group-hover:text-violet-700 dark:text-slate-100 dark:group-hover:text-violet-300 sm:text-sm sm:leading-5">
          {href ? (
            <Link to={href} onClick={(event) => event.stopPropagation()}>
              {product.name || product.title}
            </Link>
          ) : product.name || product.title}
        </h3>
        {favoriteEnabled ? (
          <FavoriteButton product={product} compact className="mt-0.5" />
        ) : null}
      </div>
      {priceLabel ? (
        <p dir="ltr" className={`mt-1 w-full truncate text-center text-[10px] font-extrabold sm:text-sm ${
          isUnavailable
            ? "text-slate-400 line-through decoration-rose-500 decoration-2 dark:text-slate-500"
            : "text-violet-700 dark:text-violet-300"
        }`}>
          {priceLabel}
        </p>
      ) : reservePriceSpace ? (
        <span aria-hidden="true" className="mt-1 block h-[15px] w-full sm:h-5" />
      ) : null}
    </motion.article>
  );
}
