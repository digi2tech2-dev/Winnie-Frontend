import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { heroSlides } from "../../data/homeContent";

export default function HeroBanner({ onTopUp }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.42, ease: "easeOut", delay: 0.04 }}
      className="relative min-h-[310px] overflow-hidden rounded-[30px] border border-white/10 bg-[#0A0D24] shadow-[0_28px_90px_rgba(59,130,246,0.15)] sm:min-h-[360px] lg:min-h-[410px]"
    >
      <img
        src="/hero-winnie-fun.png"
        alt="شخصية ألعاب تستخدم محفظة رقمية"
        className="absolute inset-0 h-full w-full object-cover"
        style={{ objectPosition: "57% center" }}
      />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,8,22,0.98)_0%,rgba(8,11,34,0.92)_34%,rgba(8,11,34,0.36)_66%,rgba(5,8,22,0.06)_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(139,92,246,0.08),rgba(5,8,22,0.1)_58%,rgba(5,8,22,0.45))]" />

      <div className="relative z-10 flex min-h-[310px] flex-col justify-center px-6 py-8 sm:min-h-[360px] sm:px-9 lg:min-h-[410px] lg:px-10">
        <p className="mb-3 w-fit rounded-full border border-white/10 bg-white/[0.07] px-3 py-1 text-[11px] font-black uppercase tracking-[0.22em] text-white/64 backdrop-blur-xl">
          محفظة ألعاب فورية
        </p>
        <h1 className="max-w-[610px] text-4xl font-black leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl">
          اشحن. العب أكثر.
          <span className="block bg-gradient-to-r from-[#8B5CF6] via-[#A855F7] to-[#3B82F6] bg-clip-text text-transparent">
            أي لعبة، في أي وقت.
          </span>
        </h1>
        <p className="mt-5 max-w-md text-base leading-7 text-white/68 sm:text-lg">
          شحن فوري، مدفوعات آمنة، ودعم متواصل لألعابك المفضلة وتطبيقات المحادثة والبطاقات الرقمية.
        </p>
        <button
          type="button"
          onClick={onTopUp}
          className="mt-7 inline-flex h-14 w-fit items-center gap-5 rounded-2xl bg-gradient-to-r from-[#7C3AED] via-[#8B5CF6] to-[#A855F7] px-7 text-base font-black text-white shadow-[0_0_36px_rgba(139,92,246,0.5)] transition hover:-translate-y-0.5 hover:shadow-[0_0_46px_rgba(168,85,247,0.65)]"
        >
          اشحن الآن
          <ArrowRight className="h-5 w-5" />
        </button>
      </div>

      <div className="absolute bottom-5 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2">
        {heroSlides.map((slide) => (
          <span
            key={slide}
            className={`h-2 rounded-full transition-all ${slide === 0 ? "w-9 bg-white/82" : "w-7 bg-white/16"}`}
          />
        ))}
      </div>
    </motion.section>
  );
}
