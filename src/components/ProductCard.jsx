import { ShoppingCart } from "lucide-react";
import { useTranslation } from "react-i18next";
import { iconMap } from "./icons";
import { useToast } from "./ToastProvider";

export default function ProductCard({ product, onAction }) {
  const Icon = iconMap[product.icon] || iconMap.Gift;
  const { showToast } = useToast();
  const { t } = useTranslation("products");
  const priceLabel = product.displayPriceLabel || product.price || "";

  const handleTopUp = () => {
    if (onAction) {
      onAction(product);
      return;
    }

    showToast({
      type: "info",
      title: t("purchase.catalogRequiredTitle"),
      message: t("purchase.catalogRequiredMessage"),
    });
  };

  return (
    <article className="interactive-ring group overflow-hidden rounded-lg border border-slate-200 bg-white shadow-soft dark:border-[rgba(255,255,255,0.08)] dark:bg-[#111827] dark:shadow-[0_0_20px_rgba(139,92,246,0.20)] dark:hover:bg-[#1A2335]">
      <div className={`relative grid aspect-[4/3] place-items-center overflow-hidden bg-gradient-to-br ${product.tone}`}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_15%,rgba(255,255,255,0.45),transparent_30%),radial-gradient(circle_at_80%_75%,rgba(255,255,255,0.18),transparent_35%)]" />
        <Icon className="relative h-16 w-16 text-white drop-shadow-2xl transition duration-300 group-hover:scale-110" />
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="absolute inset-0 h-full w-full object-cover transition duration-300 group-hover:scale-105"
            loading="lazy"
            onError={(event) => event.currentTarget.remove()}
          />
        ) : null}
      </div>
      <div className="p-4">
        <h3 className="line-clamp-1 text-base font-black">{product.name}</h3>
        <div className="mt-2 flex items-center justify-between gap-3">
          {priceLabel ? (
            <p className="text-sm font-bold text-slate-500 dark:text-[#A78BFA]">{priceLabel}</p>
          ) : null}
          <button
            type="button"
            onClick={handleTopUp}
            className="grid h-9 w-9 place-items-center rounded-lg bg-slate-100 text-royal transition hover:bg-royal hover:text-white dark:bg-[linear-gradient(135deg,#7C3AED,#A855F7)] dark:text-white dark:shadow-[0_0_20px_rgba(139,92,246,0.20)] dark:hover:bg-[linear-gradient(135deg,#8B5CF6,#A855F7)] dark:hover:text-white"
            aria-label={t("purchase.topUpTitle", { name: product.name || t("purchase.topUpTitleFallback") })}
            title={t("purchase.topUpTitleFallback")}
          >
            <ShoppingCart className="h-4 w-4" />
          </button>
        </div>
      </div>
    </article>
  );
}
