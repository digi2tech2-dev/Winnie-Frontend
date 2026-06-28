import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

export default function PubgPromoBanner({ gamesPath = "/customer/categories/games" }) {
  const navigate = useNavigate();

  return (
    <motion.section
      id="pubg-promo-banner"
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.32, ease: "easeOut" }}
      className="overflow-hidden rounded-[22px] border border-sky-100 bg-white shadow-[0_18px_42px_rgba(14,165,233,0.12)] dark:border-white/10 dark:bg-[#111827] dark:shadow-[0_0_22px_rgba(139,92,246,0.16)]"
    >
      <button
        type="button"
        onClick={() => navigate(gamesPath)}
        className="block w-full cursor-pointer overflow-hidden text-left outline-none focus-visible:ring-2 focus-visible:ring-[#A855F7] focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#050816]"
        aria-label="فتح شحن الألعاب"
        title="شحن الألعاب"
      >
        <img
          src="/ببجي.jpg"
          alt="شحن ببجي موبايل من Winnie Fun"
          loading="lazy"
          draggable="false"
          className="block w-full object-cover transition duration-300 hover:scale-[1.01]"
        />
      </button>
    </motion.section>
  );
}
