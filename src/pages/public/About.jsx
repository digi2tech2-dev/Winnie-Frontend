import { useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import {
  ArrowUpRight,
  BadgeCheck,
  Banknote,
  Building2,
  Clock3,
  CreditCard,
  Gem,
  Globe2,
  Headphones,
  Landmark,
  LockKeyhole,
  Mail,
  MapPin,
  MessageCircle,
  Rocket,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Trophy,
  WalletCards,
  Zap,
} from "lucide-react";
import GoogleMark from "../../components/GoogleMark";
import { BrandName } from "../../components/Brand";

const company = {
  name: "Winnie FZE",
  registration: "4423622.01",
  tax: "105156169200001",
  email: "Support.winniefun@gmail.com",
};

const serviceIcons = [MessageCircle, Trophy, CreditCard, Smartphone, Sparkles, Globe2];
const whyIcons = [Zap, Headphones, Globe2, BadgeCheck, ShieldCheck, Clock3, WalletCards];
const securityIcons = [ShieldCheck, LockKeyhole, BadgeCheck, Headphones];
const paymentMethods = ["VISA", "Mastercard", "Apple Pay", "Google Pay", "Wallets", "Bank Transfer", "Local Pay"];

const fadeUp = {
  hidden: { opacity: 0, y: 28, filter: "blur(10px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)" },
};

const stagger = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

export default function About() {
  const { t: translate } = useTranslation("about");
  const t = translate("page", { returnObjects: true });
  const location = t.location;

  const headquarters = useMemo(
    () => [
      { label: t.companyName, value: company.name, icon: Building2 },
      { label: t.address, value: location, icon: MapPin },
      { label: t.registration, value: company.registration, icon: BadgeCheck },
      { label: t.tax, value: company.tax, icon: Landmark },
      { label: t.email, value: company.email, icon: Mail },
    ],
    [location, t],
  );

  const marqueeItems = useMemo(() => [...t.marquee, ...t.marquee], [t]);

  return (
    <div dir="rtl" className="about-lux-page overflow-hidden">
      <section className="about-lux-hero relative isolate px-4 pb-14 pt-12 text-[#111715] dark:text-[#F8F4E8] sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1180px]">
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="visible"
            className="grid min-h-[620px] items-center gap-10 py-8 lg:grid-cols-[1.04fr_0.96fr]"
          >
            <div className="text-right">
              <motion.span
                variants={fadeUp}
                transition={{ duration: 0.55, ease: "easeOut" }}
                className="inline-flex items-center gap-2 rounded-lg border border-[var(--about-line)] bg-white/[0.58] px-4 py-2 text-xs font-black text-[#8B6818] shadow-[0_10px_28px_rgba(184,137,45,0.11)] backdrop-blur-xl dark:bg-white/[0.06] dark:text-[#E4C46B]"
              >
                <Sparkles className="h-4 w-4" />
                {t.eyebrow}
              </motion.span>

              <motion.p variants={fadeUp} transition={{ duration: 0.55, ease: "easeOut" }} className="mt-6 text-sm font-black uppercase text-[var(--about-emerald)]">
                {t.signature}
              </motion.p>
              <motion.h1 variants={fadeUp} transition={{ duration: 0.65, ease: "easeOut" }} className="mt-4 max-w-3xl text-5xl font-black leading-[1.08] tracking-normal sm:text-6xl lg:text-7xl">
                {t.title}
              </motion.h1>
              <motion.p variants={fadeUp} transition={{ duration: 0.65, ease: "easeOut" }} className="mt-6 max-w-2xl text-base font-semibold leading-8 text-[var(--about-muted)] sm:text-lg">
                {t.subtitle}
              </motion.p>

              <motion.div variants={fadeUp} transition={{ duration: 0.65, ease: "easeOut" }} className="mt-7 grid gap-2 sm:grid-cols-3">
                {t.highlights.map((item) => (
                  <span key={item} className="rounded-lg border border-[var(--about-border)] bg-white/50 px-3 py-3 text-sm font-black text-[#15231F] backdrop-blur-xl dark:bg-white/[0.055] dark:text-[#F8F4E8]">
                    {item}
                  </span>
                ))}
              </motion.div>

              <motion.div variants={fadeUp} transition={{ duration: 0.65, ease: "easeOut" }} className="mt-8 flex flex-wrap gap-3">
                <Link
                  to="/register"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-[#111715] px-6 text-sm font-black text-[#FFF8E8] shadow-[0_18px_46px_rgba(17,23,21,0.22)] transition hover:-translate-y-0.5 hover:bg-[#17342E] dark:bg-[#E4C46B] dark:text-[#111715] dark:hover:bg-[#F3D985]"
                >
                  {t.startNow}
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
                <a
                  href={`mailto:${company.email}`}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-[var(--about-border)] bg-white/[0.48] px-6 text-sm font-black text-[#111715] backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-[var(--about-line)] dark:bg-white/[0.06] dark:text-[#F8F4E8]"
                >
                  {t.contactUs}
                  <Mail className="h-4 w-4" />
                </a>
              </motion.div>
            </div>

            <motion.aside
              variants={fadeUp}
              transition={{ duration: 0.75, ease: "easeOut" }}
              animate={{ y: [0, -7, 0] }}
              className="about-lux-identity relative overflow-hidden rounded-lg border p-5 backdrop-blur-2xl sm:p-6"
            >
              <span className="about-lux-line absolute inset-x-0 top-0" />
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <span className="grid h-16 w-16 shrink-0 place-items-center rounded-lg bg-white shadow-[0_18px_42px_rgba(15,35,30,0.12)] dark:bg-[#F8F4E8]">
                    <img src="/logo.png" alt="Winnie" className="h-14 w-14 object-contain" />
                  </span>
                  <div>
                    <BrandName fullName size="tiny" />
                    <h2 className="mt-1 text-2xl font-black text-[#111715] dark:text-[#F8F4E8]">{t.identityTitle}</h2>
                    <p className="mt-1 text-sm font-semibold leading-6 text-[var(--about-muted)]">{t.identitySubtitle}</p>
                  </div>
                </div>
                <motion.span
                  animate={{ rotate: [0, 8, 0], scale: [1, 1.04, 1] }}
                  transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-[var(--about-line)] bg-white/[0.48] text-[var(--about-gold)] dark:bg-white/[0.06]"
                >
                  <Gem className="h-5 w-5" />
                </motion.span>
              </div>

              <div className="mt-6 divide-y divide-[var(--about-border)]">
                {headquarters.map(({ label, value, icon: Icon }, index) => (
                  <motion.div
                    key={label}
                    initial={{ opacity: 0, x: 18 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.48, delay: 0.25 + index * 0.07, ease: "easeOut" }}
                    className="grid gap-3 py-4 sm:grid-cols-[170px_1fr] sm:items-center"
                  >
                    <div className="flex items-center gap-3 text-[var(--about-muted)]">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#12342E] text-[#E4C46B] dark:bg-[#E4C46B] dark:text-[#101614]">
                        <Icon className="h-4 w-4" />
                      </span>
                      <p className="text-xs font-black">{label}</p>
                    </div>
                    <p className="break-words text-sm font-black leading-6 text-[#111715] dark:text-[#F8F4E8]">{value}</p>
                  </motion.div>
                ))}
              </div>

              <div className="about-lux-marquee mt-5 border-y border-[var(--about-border)]">
                <div className="about-lux-marquee-row flex gap-6 py-3 text-xs font-black uppercase text-[var(--about-muted)]">
                  {marqueeItems.map((item, index) => (
                    <span key={`${item}-${index}`} className="inline-flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-[var(--about-gold)]" />
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </motion.aside>
          </motion.div>
        </div>
      </section>

      <main className="about-lux-main">
        <section className="px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-[1180px] space-y-14">
            <Reveal className="grid gap-4 lg:grid-cols-3">
              <StoryCard icon={Rocket} title={t.introTitle} text={t.intro} />
              <StoryCard icon={Gem} title={t.visionTitle} text={t.vision} />
              <StoryCard icon={ShieldCheck} title={t.missionTitle} text={t.mission} />
            </Reveal>

            <div>
              <SectionTitle title={t.servicesTitle} subtitle={t.servicesSubtitle} />
              <Reveal className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {t.services.map((service, index) => (
                  <FeatureCard key={service} icon={serviceIcons[index]} title={service} />
                ))}
              </Reveal>
            </div>

            <div>
              <SectionTitle title={t.paymentTitle} subtitle={t.paymentSubtitle} />
              <Reveal className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {paymentMethods.map((method, index) => (
                  <PaymentCard key={method} method={method} index={index} label={t.paymentBadge} />
                ))}
              </Reveal>
            </div>

            <div>
              <SectionTitle title={t.whyTitle} />
              <Reveal className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {t.why.map((item, index) => (
                  <FeatureCard key={item} icon={whyIcons[index]} title={item} compact />
                ))}
              </Reveal>
            </div>
          </div>
        </section>

        <section className="px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-[1180px] space-y-14">
            <Reveal className="grid gap-4 lg:grid-cols-[0.92fr_1.08fr]">
              <div className="about-lux-card rounded-lg border p-5 sm:p-6">
                <span className="grid h-12 w-12 place-items-center rounded-lg bg-[#12342E] text-[#E4C46B] dark:bg-[#E4C46B] dark:text-[#101614]">
                  <Building2 className="h-6 w-6" />
                </span>
                <h2 className="mt-4 text-2xl font-black text-[#111715] dark:text-[#F8F4E8]">{t.headquartersTitle}</h2>
                <div className="mt-5 divide-y divide-[var(--about-border)]">
                  {headquarters.map((item) => (
                    <InfoRow key={item.label} {...item} />
                  ))}
                </div>
              </div>

              <div className="about-lux-card overflow-hidden rounded-lg border">
                <div className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div className="flex items-center gap-3">
                    <span className="grid h-11 w-11 place-items-center rounded-lg bg-[#E7F4EF] text-[#0F766E] dark:bg-white/[0.07] dark:text-[#E4C46B]">
                      <MapPin className="h-5 w-5" />
                    </span>
                    <h2 className="text-lg font-black text-[#111715] dark:text-[#F8F4E8]">{t.mapTitle}</h2>
                  </div>
                  <a
                    href="https://www.google.com/maps/search/?api=1&query=Sharjah+Publishing+City,+Sharjah,+United+Arab+Emirates"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#111715] px-4 text-xs font-black text-[#FFF8E8] transition hover:-translate-y-0.5 hover:bg-[#17342E] dark:bg-[#E4C46B] dark:text-[#101614]"
                  >
                    {t.openMap}
                    <ArrowUpRight className="h-4 w-4" />
                  </a>
                </div>
                <iframe
                  title={t.mapTitle}
                  src="https://www.google.com/maps?q=Sharjah%20Publishing%20City%2C%20Sharjah%2C%20United%20Arab%20Emirates&output=embed"
                  className="h-[360px] w-full border-0 grayscale-[20%] contrast-[1.02]"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </Reveal>

            <div>
              <SectionTitle title={t.securityTitle} />
              <Reveal className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {t.security.map((item, index) => (
                  <TrustBadge key={item} icon={securityIcons[index]} title={item} />
                ))}
              </Reveal>
            </div>
          </div>
        </section>

        <section className="about-lux-band px-4 py-12 text-white sm:px-6 lg:px-8">
          <Reveal className="relative mx-auto grid max-w-[1180px] gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <motion.div variants={fadeUp}>
              <p className="text-sm font-black uppercase text-[#E4C46B]">{t.signature}</p>
              <h2 className="mt-3 text-3xl font-black leading-tight sm:text-4xl">{t.ctaTitle}</h2>
              <p className="mt-3 max-w-2xl text-sm font-semibold leading-7 text-white/[0.72] sm:text-base">{t.ctaText}</p>
            </motion.div>
            <motion.div variants={fadeUp} className="flex flex-wrap gap-3">
              <Link to="/register" className="inline-flex h-12 items-center gap-2 rounded-lg bg-[#E4C46B] px-6 text-sm font-black text-[#111715] transition hover:-translate-y-0.5 hover:bg-[#F3D985]">
                {t.startNow}
                <ArrowUpRight className="h-4 w-4" />
              </Link>
              <a href={`mailto:${company.email}`} className="inline-flex h-12 items-center gap-2 rounded-lg border border-white/[0.18] bg-white/10 px-6 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-white/[0.14]">
                {t.contactUs}
                <Mail className="h-4 w-4" />
              </a>
            </motion.div>
          </Reveal>
        </section>
      </main>
    </div>
  );
}

function Reveal({ children, className = "" }) {
  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.18 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function SectionTitle({ title, subtitle, inverted = false }) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.32 }}
      variants={fadeUp}
      transition={{ duration: 0.55, ease: "easeOut" }}
      className="mb-6"
    >
      <span className={`about-lux-line block w-20 ${inverted ? "opacity-80" : ""}`} />
      <h2 className={`mt-4 text-2xl font-black leading-tight sm:text-3xl ${inverted ? "text-white" : "text-[#111715] dark:text-[#F8F4E8]"}`}>{title}</h2>
      {subtitle && <p className={`mt-2 max-w-2xl text-sm font-semibold leading-7 ${inverted ? "text-white/[0.70]" : "text-[var(--about-muted)]"}`}>{subtitle}</p>}
    </motion.div>
  );
}

function StoryCard({ icon: Icon, title, text }) {
  return (
    <motion.article variants={fadeUp} transition={{ duration: 0.55, ease: "easeOut" }} whileHover={{ y: -6 }} className="about-lux-card rounded-lg border p-5 sm:p-6">
      <span className="grid h-12 w-12 place-items-center rounded-lg bg-[#12342E] text-[#E4C46B] dark:bg-[#E4C46B] dark:text-[#101614]">
        <Icon className="h-6 w-6" />
      </span>
      <h2 className="mt-5 text-xl font-black text-[#111715] dark:text-[#F8F4E8]">{title}</h2>
      <p className="mt-3 text-sm font-semibold leading-7 text-[var(--about-muted)]">{text}</p>
    </motion.article>
  );
}

function FeatureCard({ icon: Icon, title, compact = false }) {
  return (
    <motion.article variants={fadeUp} transition={{ duration: 0.55, ease: "easeOut" }} whileHover={{ y: -5, scale: 1.01 }} className="about-lux-card group min-h-36 rounded-lg border p-4">
      <motion.span whileHover={{ rotate: -4 }} className="grid h-11 w-11 place-items-center rounded-lg bg-[#E7F4EF] text-[#0F766E] transition group-hover:bg-[#12342E] group-hover:text-[#E4C46B] dark:bg-white/[0.07] dark:text-[#E4C46B]">
        <Icon className="h-5 w-5" />
      </motion.span>
      <h3 className={`mt-4 font-black leading-7 text-[#111715] dark:text-[#F8F4E8] ${compact ? "text-sm" : "text-base"}`}>{title}</h3>
    </motion.article>
  );
}

function PaymentCard({ method, index, label }) {
  const isMastercard = method === "Mastercard";
  const isGoogle = method === "Google Pay";

  return (
    <motion.article variants={fadeUp} transition={{ duration: 0.55, ease: "easeOut" }} whileHover={{ y: -5 }} className="about-lux-card flex min-h-24 items-center justify-between gap-3 rounded-lg border p-4">
      <div>
        <p className="text-xs font-black uppercase text-[var(--about-muted)]">{label}</p>
        <h3 className="mt-1 text-base font-black text-[#111715] dark:text-[#F8F4E8]">{method}</h3>
      </div>
      <motion.span
        animate={{ scale: [1, 1.035, 1], opacity: [0.86, 1, 0.86] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut", delay: index * 0.11 }}
        className="grid h-12 w-16 place-items-center rounded-lg border border-[var(--about-border)] bg-white/[0.58] text-sm font-black text-[#111715] dark:bg-white/[0.06] dark:text-[#F8F4E8]"
      >
        {isMastercard ? (
          <span className="relative h-7 w-11">
            <span className="absolute left-1 top-1 h-6 w-6 rounded-full bg-[#EB001B]" />
            <span className="absolute right-1 top-1 h-6 w-6 rounded-full bg-[#F79E1B] mix-blend-multiply" />
          </span>
        ) : isGoogle ? (
          <GoogleMark className="h-7 w-7" />
        ) : index === 4 ? (
          <WalletCards className="h-6 w-6 text-[var(--about-emerald)]" />
        ) : index === 5 ? (
          <Landmark className="h-6 w-6 text-[var(--about-blue)]" />
        ) : index === 6 ? (
          <Banknote className="h-6 w-6 text-[var(--about-gold)]" />
        ) : (
          method
        )}
      </motion.span>
    </motion.article>
  );
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="grid gap-3 py-4 sm:grid-cols-[170px_1fr] sm:items-center">
      <div className="flex items-center gap-3 text-[var(--about-muted)]">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#E7F4EF] text-[#0F766E] dark:bg-white/[0.07] dark:text-[#E4C46B]">
          <Icon className="h-4 w-4" />
        </span>
        <p className="text-xs font-black">{label}</p>
      </div>
      <p className="break-words text-sm font-black leading-6 text-[#111715] dark:text-[#F8F4E8]">{value}</p>
    </div>
  );
}

function TrustBadge({ icon: Icon, title }) {
  return (
    <motion.article variants={fadeUp} transition={{ duration: 0.55, ease: "easeOut" }} whileHover={{ y: -4 }} className="about-lux-card flex min-h-20 items-center gap-3 rounded-lg border p-4">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-[#111715] text-[#E4C46B] dark:bg-[#E4C46B] dark:text-[#101614]">
        <Icon className="h-5 w-5" />
      </span>
      <h3 className="text-sm font-black text-[#111715] dark:text-[#F8F4E8]">{title}</h3>
    </motion.article>
  );
}
