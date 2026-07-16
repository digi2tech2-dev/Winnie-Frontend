import { AnimatePresence, motion } from "framer-motion";
import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import slideOneImage from "../../../photo/اسلايد1.jpg";
import slideTwoImage from "../../../photo/اسلايد2.jpg";
import subAgentSlideImage from "../../../photo/اسلايد وكيل.jpg";

const slideImages = [slideOneImage, slideTwoImage, subAgentSlideImage];
const AUTO_PLAY_DELAY = 5000;
const slideVariants = {
  enter: (direction) => ({
    opacity: 0.35,
    scale: 1.025,
    x: direction > 0 ? "100%" : "-100%",
  }),
  center: {
    opacity: 1,
    scale: 1,
    x: "0%",
  },
  exit: (direction) => ({
    opacity: 0.2,
    scale: 0.99,
    x: direction > 0 ? "-28%" : "28%",
  }),
};

function resolveSubAgentPath(categoriesPath) {
  if (String(categoriesPath).startsWith("/admin/user")) return "/admin/user/sub-agent";
  return "/customer/sub-agent";
}

function openHeaderSearch(query = "") {
  window.dispatchEvent(new CustomEvent("winnie-open-search", { detail: { query } }));
}

export default function HomeSlide({ categoriesPath = "/categories", subAgentPath }) {
  const { t } = useTranslation("home");
  const [{ activeSlide, direction }, setSlider] = useState({ activeSlide: 0, direction: 1 });
  const [paused, setPaused] = useState(false);
  const [focused, setFocused] = useState(false);
  const slides = [
    { image: slideImages[0], path: categoriesPath },
    { image: slideImages[1], path: categoriesPath },
    { image: slideImages[2], path: subAgentPath || resolveSubAgentPath(categoriesPath) },
  ];

  useEffect(() => {
    if (paused) return undefined;

    const timer = window.setInterval(() => {
      setSlider(({ activeSlide: current }) => {
        const nextSlide = (current + 1) % slideImages.length;
        return {
          activeSlide: nextSlide,
          direction: nextSlide === 0 ? 1 : -1,
        };
      });
    }, AUTO_PLAY_DELAY);

    return () => window.clearInterval(timer);
  }, [paused]);

  const handleSearchOpen = () => {
    openHeaderSearch("");
  };

  const handleSearchKeyDown = (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    openHeaderSearch("");
  };

  return (
    <div className="space-y-3">
      <section
        aria-label={t("slider.label")}
        aria-roledescription="carousel"
        className="group relative isolate aspect-[1024/364] w-full overflow-hidden rounded-lg bg-slate-950 shadow-xl shadow-royal/10"
        onBlur={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <AnimatePresence custom={direction} initial={false} mode="sync">
          <motion.div
            key={activeSlide}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { duration: 0.9, ease: [0.22, 1, 0.36, 1] },
              opacity: { duration: 0.7, ease: "easeOut" },
              scale: { duration: 0.9, ease: "easeOut" },
            }}
            className="absolute inset-0 will-change-transform"
          >
            <Link to={slides[activeSlide].path} className="block h-full w-full">
              <img
                src={slides[activeSlide].image}
                alt={t("slider.slideAlt", { number: activeSlide + 1 })}
                className="h-full w-full object-cover"
                loading={activeSlide === 0 ? "eager" : "lazy"}
              />
            </Link>
          </motion.div>
        </AnimatePresence>
      </section>

      <motion.button
        dir="rtl"
        type="button"
        onClick={handleSearchOpen}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onKeyDown={handleSearchKeyDown}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        aria-label={t("slider.searchAction")}
        className={`group relative flex h-12 w-full items-center gap-2.5 overflow-hidden rounded-[20px] border px-3 text-right shadow-[0_16px_34px_rgba(76,29,149,0.10)] transition-all duration-300 dark:border-white/10 dark:shadow-[0_16px_34px_rgba(2,6,23,0.18)] ${
          focused
            ? "border-violet-300/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(240,249,255,0.94)_48%,rgba(245,243,255,0.98))] shadow-[0_0_0_1px_rgba(139,92,246,0.16),0_0_24px_rgba(124,58,237,0.12),0_16px_34px_rgba(76,29,149,0.12)] dark:border-cyan-300/40 dark:bg-[linear-gradient(135deg,rgba(15,23,42,0.98),rgba(7,10,24,0.96)_48%,rgba(124,58,237,0.24))] dark:shadow-[0_0_0_1px_rgba(56,189,248,0.20),0_0_24px_rgba(124,58,237,0.28),0_16px_34px_rgba(2,6,23,0.22)]"
            : "border-violet-100/90 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(248,250,252,0.94)_48%,rgba(245,243,255,0.92))] dark:border-white/10 dark:bg-[linear-gradient(135deg,rgba(15,23,42,0.98),rgba(7,10,24,0.96)_48%,rgba(124,58,237,0.18))]"
        }`}
      >
        <span aria-hidden="true" className={`pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-rose-300/30 to-transparent blur-2xl transition-opacity duration-300 dark:from-rose-400/18 ${focused ? "opacity-100" : "opacity-60"}`} />
        <span aria-hidden="true" className={`pointer-events-none absolute -left-8 bottom-[-18px] h-24 w-24 rounded-full bg-fuchsia-300/25 blur-2xl transition-opacity duration-300 dark:bg-fuchsia-400/18 ${focused ? "opacity-100" : "opacity-50"}`} />

        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-[linear-gradient(135deg,#F43F5E,#D946EF_52%,#7C3AED)] text-white shadow-[0_7px_18px_rgba(217,70,239,0.38),0_0_0_1px_rgba(244,63,94,0.12)] transition duration-300 group-hover:scale-105 group-hover:shadow-[0_9px_22px_rgba(217,70,239,0.48),0_0_14px_rgba(244,114,182,0.30)]">
          <Search className="h-4 w-4" />
        </span>
        <span className="min-w-0 flex-1 truncate text-[15px] font-black leading-none tracking-[-0.01em] text-slate-900 drop-shadow-[0_1px_0_rgba(255,255,255,0.75)] sm:text-base dark:text-white dark:drop-shadow-[0_0_12px_rgba(168,85,247,0.28)]">
          {t("slider.searchPlaceholder")}
        </span>
      </motion.button>
    </div>
  );
}
