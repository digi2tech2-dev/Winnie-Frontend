import { motion } from "framer-motion";
import { AudioLines, CreditCard, Headphones, ShieldCheck } from "lucide-react";
import { paymentMethods } from "../../data/homeContent";

export default function PromoBanners() {
  return (
    <section id="deals" className="grid gap-4 lg:grid-cols-2">
      <motion.article
        id="voice-chat"
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-40px" }}
        whileHover={{ y: -5 }}
        className="relative min-h-[190px] overflow-hidden rounded-[28px] border border-[#A855F7]/24 bg-[linear-gradient(135deg,#5B21B6,#7E22CE_48%,#1E1B4B)] p-6 shadow-[0_24px_80px_rgba(139,92,246,0.25)]"
      >
        <div className="relative z-10 max-w-[250px]">
          <h3 className="text-2xl font-black text-white">المحادثة الصوتية متاحة الآن!</h3>
          <p className="mt-3 text-base leading-7 text-white/74">صوت واضح، بدون تأخير، وشحن فوري لعملات الغرف والمجتمعات.</p>
          <AudioLines className="mt-4 h-9 w-24 text-[#A855F7]" />
        </div>
        <Headphones className="absolute bottom-4 right-5 h-32 w-32 text-white/90 drop-shadow-[0_0_28px_rgba(168,85,247,0.58)] sm:h-40 sm:w-40" />
      </motion.article>

      <motion.article
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-40px" }}
        whileHover={{ y: -5 }}
        className="relative min-h-[190px] overflow-hidden rounded-[28px] border border-[#3B82F6]/24 bg-[linear-gradient(135deg,#0F2B61,#1D4ED8_48%,#08142F)] p-6 shadow-[0_24px_80px_rgba(59,130,246,0.18)]"
      >
        <div className="relative z-10 max-w-[300px]">
          <div className="mb-2 flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-white/76" />
            <h3 className="text-2xl font-black text-white">مدفوعات آمنة</h3>
          </div>
          <p className="text-base leading-7 text-white/74">حماية كاملة مع طرق دفع عالمية.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {paymentMethods.slice(0, 3).map((method) => (
              <span key={method} className="rounded-lg bg-white/12 px-3 py-1.5 text-xs font-black text-white backdrop-blur-xl">
                {method}
              </span>
            ))}
          </div>
        </div>
        <ShieldCheck className="absolute bottom-4 right-5 h-32 w-32 text-white/86 drop-shadow-[0_0_30px_rgba(59,130,246,0.54)] sm:h-40 sm:w-40" />
      </motion.article>
    </section>
  );
}
