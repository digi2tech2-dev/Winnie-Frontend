import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowUp, MousePointer2 } from "lucide-react";
import { useLocation } from "react-router-dom";

function getScrollPercent() {
  if (typeof window === "undefined") return 0;

  const page = document.documentElement;
  const scrollableHeight = page.scrollHeight - window.innerHeight;

  if (scrollableHeight <= 0) return 0;

  return Math.min(100, Math.max(0, Math.round((window.scrollY / scrollableHeight) * 100)));
}

export default function FloatingScrollProgress() {
  const location = useLocation();
  const [progress, setProgress] = useState(() => getScrollPercent());
  const degrees = progress * 3.6;

  useEffect(() => {
    let ticking = false;

    const updateProgress = () => {
      if (ticking) return;

      ticking = true;
      window.requestAnimationFrame(() => {
        setProgress(getScrollPercent());
        ticking = false;
      });
    };

    updateProgress();
    window.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress);

    return () => {
      window.removeEventListener("scroll", updateProgress);
      window.removeEventListener("resize", updateProgress);
    };
  }, [location.pathname, location.hash]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <motion.button
      type="button"
      aria-label={`نسبة التمرير ${progress}% - اضغط للعودة لأعلى الصفحة`}
      title={`تم تمرير ${progress}% من الصفحة`}
      initial={{ opacity: 0, y: 18, scale: 0.92 }}
      animate={{
        opacity: progress <= 0 ? 0 : 1,
        y: progress <= 0 ? 14 : 0,
        scale: progress <= 0 ? 0.94 : 1,
      }}
      transition={{ duration: 0.35, ease: "easeOut", delay: 0.2 }}
      whileHover={{ y: -4, scale: 1.04 }}
      whileTap={{ scale: 0.96 }}
      onClick={scrollToTop}
      className={`group fixed bottom-[104px] left-4 z-[75] flex items-center gap-2 rounded-full border border-[#C4B5FD]/70 bg-white/95 p-1.5 shadow-[0_20px_48px_rgba(124,58,237,0.26)] backdrop-blur-xl transition hover:border-[#22D3EE]/70 hover:shadow-[0_24px_58px_rgba(34,211,238,0.20)] dark:border-white/15 dark:bg-[#0B1020]/94 dark:shadow-[0_0_30px_rgba(168,85,247,0.22)] sm:bottom-10 ${
        progress <= 0 ? "pointer-events-none" : ""
      }`}
    >
      <span
        className="relative grid h-[70px] w-[70px] place-items-center rounded-full p-[3px] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.28)] sm:h-[80px] sm:w-[80px]"
        style={{
          background: `conic-gradient(from 215deg, #7C3AED 0deg, #A855F7 ${Math.max(
            degrees * 0.48,
            0,
          )}deg, #22D3EE ${degrees}deg, #EDE9FE ${degrees}deg, #EDE9FE 360deg)`,
        }}
      >
        <span className="absolute -right-0.5 -top-1 grid h-6 w-6 place-items-center rounded-full border border-white/60 bg-[#22D3EE] text-[#083344] shadow-[0_8px_20px_rgba(34,211,238,0.26)] transition group-hover:-translate-y-0.5">
          <MousePointer2 className="h-3.5 w-3.5" />
        </span>
        <span className="grid h-full w-full place-items-center rounded-full bg-white text-center shadow-[inset_0_0_18px_rgba(124,58,237,0.10)] dark:bg-[#111827] dark:shadow-[inset_0_0_18px_rgba(168,85,247,0.18)]">
          <span className="leading-none">
            <span dir="ltr" className="block text-[21px] font-black text-[#7C3AED] sm:text-2xl dark:text-[#C084FC]">
              {progress}%
            </span>
            <span className="mt-1 block text-[10px] font-black text-slate-500 dark:text-[#9CA3AF]">تمرير</span>
          </span>
        </span>
      </span>

      <span className="hidden min-w-0 flex-col items-start pl-3 pr-1 sm:flex">
        <span className="inline-flex items-center gap-1 text-[11px] font-black text-[#0891B2] dark:text-[#22D3EE]">
          <ArrowUp className="h-3.5 w-3.5" />
          لأعلى
        </span>
        <span className="mt-0.5 whitespace-nowrap text-sm font-black text-slate-950 dark:text-white">نسبة التمرير</span>
      </span>
    </motion.button>
  );
}
