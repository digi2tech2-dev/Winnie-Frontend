import { motion } from "framer-motion";
import { paymentMethods } from "../../data/homeContent";

export default function TrustedPayments() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      className="rounded-[28px] border border-white/10 bg-white/[0.055] p-5 shadow-[0_18px_60px_rgba(0,0,0,0.24)] backdrop-blur-2xl dark:border-[rgba(255,255,255,0.08)] dark:bg-[#111827] dark:shadow-[0_0_20px_rgba(139,92,246,0.20)]"
    >
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 className="text-xl font-black text-white">موثوق من ملايين المستخدمين</h3>
          <p className="mt-2 text-sm leading-6 text-white/48">ندعم أشهر طرق الدفع العالمية</p>
        </div>
        <div className="flex flex-wrap items-center gap-x-7 gap-y-3 text-2xl font-black text-white sm:text-3xl">
          {paymentMethods.map((method) => (
            <span key={method} className="text-white">
              {method}
            </span>
          ))}
        </div>
      </div>
    </motion.section>
  );
}
