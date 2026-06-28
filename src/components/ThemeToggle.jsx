import { Moon, SunMedium } from "lucide-react";

export default function ThemeToggle({ theme, onToggle, compact = false }) {
  const isDark = theme === "dark";
  const buttonClass = compact
    ? "h-9 w-[70px] rounded-xl px-1.5"
    : "h-11 w-20 rounded-2xl px-2";
  const thumbClass = compact
    ? `top-1 h-7 w-7 rounded-lg ${isDark ? "right-1" : "left-1"}`
    : `top-1.5 h-8 w-8 rounded-xl ${isDark ? "right-1.5" : "left-1.5"}`;

  return (
    <button
      type="button"
      onClick={onToggle}
      className={`relative inline-flex items-center justify-between border border-sky-100 bg-white/85 text-slate-500 shadow-[0_10px_24px_rgba(14,165,233,0.10)] transition hover:border-[#C4B5FD] hover:bg-[#F5F3FF] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C4B5FD] dark:border-[rgba(255,255,255,0.08)] dark:bg-[#111827] dark:text-white dark:shadow-[0_0_16px_rgba(139,92,246,0.18)] dark:hover:border-[#A855F7]/70 dark:hover:bg-[#1A2335] dark:focus-visible:ring-[#A855F7]/70 ${buttonClass}`}
      aria-label="Toggle dark and light mode"
      title="Toggle theme"
    >
      <span
        className={`absolute bg-gradient-to-br from-[#8B5CF6] to-[#A855F7] shadow-[0_0_20px_rgba(168,85,247,0.48)] transition-all ${thumbClass}`}
      />
      <SunMedium className={`relative z-10 h-4 w-4 ${isDark ? "text-white/38" : "text-white"}`} />
      <Moon className={`relative z-10 h-4 w-4 ${isDark ? "text-white" : "text-slate-400"}`} />
    </button>
  );
}
