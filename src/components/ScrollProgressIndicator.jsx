import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollProgressIndicator() {
  const location = useLocation();
  const [progress, setProgress] = useState(0);
  const roundedProgress = Math.round(progress);
  const isVisible = roundedProgress > 0;
  const mobileRingStyle = {
    background: `conic-gradient(from -90deg, #38BDF8 0deg, #8B5CF6 ${progress * 3.6}deg, rgba(226,232,240,0.92) ${progress * 3.6}deg, rgba(226,232,240,0.92) 360deg)`,
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  };

  useEffect(() => {
    let frameId = 0;

    const updateProgress = () => {
      window.cancelAnimationFrame(frameId);
      frameId = window.requestAnimationFrame(() => {
        const scrollTop = window.scrollY || document.documentElement.scrollTop || 0;
        const maxScroll = Math.max(
          0,
          document.documentElement.scrollHeight - window.innerHeight,
        );

        setProgress(maxScroll ? Math.min(100, Math.max(0, (scrollTop / maxScroll) * 100)) : 0);
      });
    };

    updateProgress();
    window.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("scroll", updateProgress);
      window.removeEventListener("resize", updateProgress);
    };
  }, [location.pathname]);

  return (
    <>
      <button
        type="button"
        onClick={scrollToTop}
        disabled={!isVisible}
        className={`site-scroll-progress fixed left-4 z-[90] flex flex-col items-center gap-1.5 border-0 bg-transparent p-0 transition duration-300 sm:hidden ${
          isVisible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0"
        }`}
        style={{ bottom: "calc(5.7rem + env(safe-area-inset-bottom))" }}
        aria-label="العودة إلى أعلى الصفحة"
        title="العودة إلى أعلى الصفحة"
      >
        <div className="rounded-full border border-white/70 bg-white/80 px-2.5 py-1 text-[10px] font-black leading-none text-[#7C3AED] shadow-[0_12px_28px_rgba(15,23,42,0.14)] backdrop-blur-xl dark:border-white/10 dark:bg-[#111827]/82 dark:text-[#C084FC]">
          تمرير
        </div>
        <div className="relative grid h-[70px] w-[70px] place-items-center rounded-full p-[4px] shadow-[0_18px_42px_rgba(124,58,237,0.30)]" style={mobileRingStyle}>
          <div className="grid h-full w-full place-items-center rounded-full border border-white/70 bg-white/92 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.86)] backdrop-blur-xl dark:border-white/10 dark:bg-[#111827]/94">
            <div className="leading-none">
              <strong className="block text-[19px] font-black tracking-normal text-[#7C3AED] dark:text-[#E9D5FF]">{roundedProgress}%</strong>
              <span className="mt-1 block text-[8px] font-black text-slate-400 dark:text-white/45">SCROLL</span>
            </div>
          </div>
          <span className="absolute -right-1.5 top-2 h-3 w-3 rounded-full border-2 border-white bg-[#38BDF8] shadow-[0_0_16px_rgba(56,189,248,0.85)] dark:border-[#111827]" />
        </div>
      </button>

      <button
        type="button"
        onClick={scrollToTop}
        disabled={!isVisible}
        className={`site-scroll-progress fixed left-2 top-1/2 z-[90] hidden -translate-y-1/2 flex-col items-center gap-2 border-0 bg-transparent p-0 transition duration-300 sm:flex ${
          isVisible ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-label="العودة إلى أعلى الصفحة"
        title="العودة إلى أعلى الصفحة"
      >
        <div className="relative h-[34vh] min-h-[180px] w-2 overflow-hidden rounded-full border border-white/70 bg-white/65 shadow-[0_18px_46px_rgba(15,23,42,0.18)] backdrop-blur-xl dark:border-white/10 dark:bg-[#111827]/72 dark:shadow-[0_0_24px_rgba(139,92,246,0.22)]">
          <span className="absolute inset-x-0 bottom-0 rounded-full bg-[linear-gradient(180deg,#38BDF8,#8B5CF6,#A855F7)] shadow-[0_0_22px_rgba(139,92,246,0.55)]" style={{ height: `${progress}%` }} />
        </div>
        <div className="min-w-12 rounded-full border border-white/70 bg-white/78 px-2.5 py-1 text-center text-[11px] font-black text-[#7C3AED] shadow-[0_14px_32px_rgba(15,23,42,0.16)] backdrop-blur-xl dark:border-white/10 dark:bg-[#111827]/78 dark:text-[#C084FC]">
          {roundedProgress}%
        </div>
      </button>
    </>
  );
}
