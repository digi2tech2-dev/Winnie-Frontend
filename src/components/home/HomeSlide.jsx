import { AnimatePresence, motion } from "framer-motion";
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

export default function HomeSlide({ categoriesPath = "/categories", subAgentPath }) {
  const { t } = useTranslation("home");
  const [{ activeSlide, direction }, setSlider] = useState({ activeSlide: 0, direction: 1 });
  const [paused, setPaused] = useState(false);
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

  return (
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
  );
}
