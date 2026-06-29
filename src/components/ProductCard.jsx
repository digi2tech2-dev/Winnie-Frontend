import { ShoppingCart } from "lucide-react";
import { iconMap } from "./icons";
import { useToast } from "./ToastProvider";

export default function ProductCard({ product, onAction }) {
  const Icon = iconMap[product.icon] || iconMap.Gift;
  const { showToast } = useToast();

  const handleTopUp = () => {
    if (onAction) {
      onAction(product);
      return;
    }

    showToast({
      type: "info",
      title: "Customer catalog required",
      message: "Open a backend customer catalog product to create an order.",
    });
  };

  return (
    <article className="interactive-ring group overflow-hidden rounded-lg border border-slate-200 bg-white shadow-soft dark:border-[rgba(255,255,255,0.08)] dark:bg-[#111827] dark:shadow-[0_0_20px_rgba(139,92,246,0.20)] dark:hover:bg-[#1A2335]">
      <div className={`relative grid aspect-[4/3] place-items-center overflow-hidden bg-gradient-to-br ${product.tone}`}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_15%,rgba(255,255,255,0.45),transparent_30%),radial-gradient(circle_at_80%_75%,rgba(255,255,255,0.18),transparent_35%)]" />
        <Icon className="relative h-16 w-16 text-white drop-shadow-2xl transition duration-300 group-hover:scale-110" />
      </div>
      <div className="p-4">
        <h3 className="line-clamp-1 text-base font-black">{product.name}</h3>
        <div className="mt-2 flex items-center justify-between gap-3">
          <p className="text-sm font-bold text-slate-500 dark:text-[#A78BFA]">{product.price}</p>
          <button
            type="button"
            onClick={handleTopUp}
            className="grid h-9 w-9 place-items-center rounded-lg bg-slate-100 text-royal transition hover:bg-royal hover:text-white dark:bg-[linear-gradient(135deg,#7C3AED,#A855F7)] dark:text-white dark:shadow-[0_0_20px_rgba(139,92,246,0.20)] dark:hover:bg-[linear-gradient(135deg,#8B5CF6,#A855F7)] dark:hover:text-white"
            aria-label={`Top up ${product.name}`}
            title="Top up"
          >
            <ShoppingCart className="h-4 w-4" />
          </button>
        </div>
      </div>
    </article>
  );
}
