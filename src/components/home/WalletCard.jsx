import { motion } from "framer-motion";
import { Plus, WalletCards } from "lucide-react";

export default function WalletCard({ balance = "$ 24.60", onAdd }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="relative w-full max-w-[230px] overflow-hidden rounded-2xl border border-white/10 bg-[linear-gradient(135deg,rgba(139,92,246,0.2),rgba(168,85,247,0.1)_45%,rgba(255,255,255,0.045))] p-3 shadow-[0_14px_40px_rgba(139,92,246,0.14)] backdrop-blur-2xl"
    >
      <div className="relative z-10 flex min-h-[54px] items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-medium text-white/58">رصيد المحفظة</p>
          <div className="mt-1.5 flex items-center gap-2">
            <p className="text-2xl font-black tracking-tight text-white">{balance}</p>
            <button
              type="button"
              onClick={onAdd}
              aria-label="إضافة رصيد للمحفظة"
              className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#8B5CF6] to-[#A855F7] text-white shadow-[0_0_20px_rgba(139,92,246,0.5)] transition hover:scale-105"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="hidden h-12 w-12 shrink-0 place-items-center rounded-xl border border-white/10 bg-[#8B5CF6]/18 text-[#A855F7] shadow-[inset_0_1px_0_rgba(255,255,255,0.16),0_14px_32px_rgba(139,92,246,0.16)] sm:grid">
          <WalletCards className="h-6 w-6" />
        </div>
      </div>
    </motion.article>
  );
}
