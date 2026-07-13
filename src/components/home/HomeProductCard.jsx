import { motion } from "framer-motion";
import { useState } from "react";
import FavoriteButton from "../FavoriteButton";
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

export default function HomeProductCard({ product, index = 0, onSelect, reservePriceSpace = false, favoriteEnabled = true }) {
  const [imageFailed, setImageFailed] = useState(false);
  const Icon = typeof product.icon === "function" ? product.icon : iconMap[product.icon] || iconMap.ShoppingBag;
  const priceLabel = getPriceLabel(product);

  const handleSelect = () => onSelect?.(product);
  const handleKeyDown = (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    handleSelect();
  };

  return (
    <motion.article
      role="button"
      tabIndex={0}
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-30px" }}
      transition={{ duration: 0.2, delay: Math.min(index, 8) * 0.025 }}
      whileTap={{ scale: 0.985 }}
      onClick={handleSelect}
      onKeyDown={handleKeyDown}
      className="group flex min-w-0 cursor-pointer flex-col items-center text-center outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-4 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-950"
    >
      <div className="flex aspect-square w-full items-center justify-center">
        {product.image && !imageFailed ? (
          <img
            src={product.image}
            alt={product.name || product.title || ""}
            className="h-auto max-h-full w-full object-contain transition-[transform,filter] duration-200 ease-out motion-safe:group-hover:-translate-y-[3px] motion-safe:group-hover:scale-[1.03] motion-safe:group-hover:brightness-105"
            loading="lazy"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <Icon className="h-1/2 w-1/2 text-violet-500 transition-transform duration-200 motion-safe:group-hover:-translate-y-[3px] motion-safe:group-hover:scale-[1.03] dark:text-violet-300" />
        )}
      </div>

      <div className="mt-2 flex min-h-[2.25rem] w-full items-start justify-center gap-1.5">
        <h3 className="line-clamp-2 min-w-0 text-center text-[11px] font-bold leading-[1.125rem] text-slate-900 transition-colors group-hover:text-violet-700 dark:text-slate-100 dark:group-hover:text-violet-300 sm:text-sm sm:leading-5">
          {product.name || product.title}
        </h3>
        {favoriteEnabled ? (
          <FavoriteButton product={product} compact className="mt-0.5" />
        ) : null}
      </div>
      {priceLabel ? (
        <p dir="ltr" className="mt-1 w-full truncate text-center text-[10px] font-extrabold text-violet-700 dark:text-violet-300 sm:text-sm">
          {priceLabel}
        </p>
      ) : reservePriceSpace ? (
        <span aria-hidden="true" className="mt-1 block h-[15px] w-full sm:h-5" />
      ) : null}
    </motion.article>
  );
}
