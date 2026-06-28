import { motion } from "framer-motion";
import { bottomNavItems } from "../../data/homeContent";

export default function MobileBottomNav({ onNavigate }) {
  const firstItems = bottomNavItems.slice(0, 2);
  const lastItems = bottomNavItems.slice(2);

  return (
    <div className="fixed inset-x-4 bottom-3 z-50 lg:hidden">
      <nav className="grid grid-cols-5 items-end rounded-[26px] border border-white/10 bg-[#0B0F1A]/94 px-2 pb-2 pt-2.5 shadow-[0_0_34px_rgba(0,0,0,0.30),0_0_20px_rgba(168,85,247,0.10)] backdrop-blur-2xl">
        {firstItems.map((item) => (
          <NavButton key={item.label} item={item} onNavigate={onNavigate} />
        ))}

        <motion.button
          type="button"
          whileTap={{ scale: 0.94 }}
          onClick={() => onNavigate?.("home")}
          className="relative mx-auto -mt-8 grid h-16 w-16 place-items-center rounded-full border border-[#A855F7]/45 bg-[#131827] shadow-[0_0_26px_rgba(168,85,247,0.24)]"
          aria-label="الرئيسية"
        >
          <span className="absolute inset-1 rounded-full border border-white/10" />
          <img src="/logo.png" alt="" className="relative h-10 w-10 object-contain" />
        </motion.button>

        {lastItems.map((item) => (
          <NavButton key={item.label} item={item} onNavigate={onNavigate} />
        ))}
      </nav>
    </div>
  );
}

function NavButton({ item, onNavigate }) {
  const Icon = item.icon;

  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.94 }}
      onClick={() => onNavigate?.(item.target)}
      className={`flex min-w-0 flex-col items-center gap-1 rounded-xl px-0.5 py-1 text-[10px] font-bold transition ${
        item.active ? "text-white" : "text-white/48"
      }`}
    >
      <Icon className={`h-5 w-5 ${item.active ? "text-[#8B5CF6] drop-shadow-[0_0_10px_rgba(139,92,246,0.9)]" : ""}`} />
      <span className="truncate">{item.label}</span>
    </motion.button>
  );
}
