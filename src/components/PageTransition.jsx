import { motion } from "framer-motion";

export default function PageTransition({ children }) {
  return (
    <motion.div
      className="winnie-page-stage"
      initial={{ opacity: 0, y: 18, scale: 0.992, rotateX: 1.2 }}
      animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
      exit={{ opacity: 0, y: -10, scale: 0.995 }}
      transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
      style={{ transformOrigin: "50% 0%", transformPerspective: 1400 }}
    >
      {children}
    </motion.div>
  );
}
