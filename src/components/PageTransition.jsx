import { useState } from "react";
import { createPortal } from "react-dom";
import { motion, useReducedMotion } from "framer-motion";
import { useTheme } from "../context/ThemeContext";

export default function PageTransition({ children }) {
  const { theme } = useTheme();
  const shouldReduceMotion = useReducedMotion();
  const [transitionFinished, setTransitionFinished] = useState(false);

  if (shouldReduceMotion) {
    return <div className="winnie-page-stage">{children}</div>;
  }

  return (
    <>
      {createPortal(<motion.div
        aria-hidden="true"
        className={`winnie-logo-transition winnie-logo-transition--${theme}`}
        onAnimationStart={() => setTransitionFinished(false)}
        onAnimationComplete={() => setTransitionFinished(true)}
        style={{ pointerEvents: transitionFinished ? "none" : "auto" }}
        initial={{ clipPath: "circle(150vmax at 50% 50%)" }}
        animate={{
          clipPath: "circle(0 at 50% 50%)",
          transition: { duration: 0.58, delay: 0.28, ease: [0.76, 0, 0.24, 1] },
        }}
        exit={{
          clipPath: "circle(150vmax at 50% 50%)",
          transition: { duration: 0.38, ease: [0.76, 0, 0.24, 1] },
        }}
      >
        <div className="winnie-logo-transition__pattern" />
        <div className="winnie-logo-transition__aura" />
        <div className="winnie-logo-transition__orbit winnie-logo-transition__orbit--outer" />
        <div className="winnie-logo-transition__orbit winnie-logo-transition__orbit--inner" />

        <motion.div
          className="winnie-logo-transition__scene"
          initial={{ opacity: 1, scale: 0.82, y: 8 }}
          animate={{
            opacity: 0,
            scale: 1.08,
            y: 0,
            transition: { duration: 0.2, delay: 0.2, ease: "easeOut" },
          }}
          exit={{
            opacity: 1,
            scale: 1,
            y: 0,
            transition: { duration: 0.18, delay: 0.14, ease: "easeOut" },
          }}
        >
          <div className="winnie-logo-transition__mark">
            <img src="/logo.png" alt="" />
            <span className="winnie-logo-transition__shine" />
          </div>

          <div className="winnie-logo-transition__wordmark">
            <strong>WINNIE</strong>
            <span>HUB</span>
          </div>

          <div className="winnie-logo-transition__pulse">
            <i />
          </div>
        </motion.div>
      </motion.div>, document.body)}

      <motion.div
        className="winnie-page-stage"
        initial={{ opacity: 0, y: 14, scale: 0.994, filter: "blur(4px)" }}
        animate={{
          opacity: 1,
          y: 0,
          scale: 1,
          filter: "blur(0px)",
          transition: { duration: 0.5, delay: 0.18, ease: [0.22, 1, 0.36, 1] },
        }}
        exit={{
          opacity: 0,
          y: -8,
          scale: 0.996,
          filter: "blur(3px)",
          transition: { duration: 0.22, ease: "easeIn" },
        }}
        style={{ transformOrigin: "50% 0%", transformPerspective: 1400 }}
      >
        {children}
      </motion.div>
    </>
  );
}
