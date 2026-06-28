import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { getInitialReviews, getReviewTimestamp, persistReviews, REVIEW_CREATED_EVENT } from "../../utils/customerReviews";

function formatArabicDuration(value, forms) {
  if (value === 1) return `منذ ${forms.one}`;
  if (value === 2) return `منذ ${forms.two}`;
  if (value <= 10) return `منذ ${value} ${forms.few}`;
  return `منذ ${value} ${forms.many}`;
}

function formatReviewElapsedTime(createdAt, now) {
  const elapsedSeconds = Math.max(0, Math.floor((now - createdAt) / 1000));

  if (elapsedSeconds < 5) return "الآن";
  if (elapsedSeconds < 60) {
    return formatArabicDuration(elapsedSeconds, {
      one: "ثانية",
      two: "ثانيتين",
      few: "ثوانٍ",
      many: "ثانية",
    });
  }

  const elapsedMinutes = Math.floor(elapsedSeconds / 60);
  if (elapsedMinutes < 60) {
    return formatArabicDuration(elapsedMinutes, {
      one: "دقيقة",
      two: "دقيقتين",
      few: "دقائق",
      many: "دقيقة",
    });
  }

  const elapsedHours = Math.floor(elapsedMinutes / 60);
  if (elapsedHours < 24) {
    return formatArabicDuration(elapsedHours, {
      one: "ساعة",
      two: "ساعتين",
      few: "ساعات",
      many: "ساعة",
    });
  }

  const elapsedDays = Math.floor(elapsedHours / 24);
  if (elapsedDays < 7) {
    return formatArabicDuration(elapsedDays, {
      one: "يوم",
      two: "يومين",
      few: "أيام",
      many: "يوم",
    });
  }

  const elapsedWeeks = Math.floor(elapsedDays / 7);
  if (elapsedWeeks < 5) {
    return formatArabicDuration(elapsedWeeks, {
      one: "أسبوع",
      two: "أسبوعين",
      few: "أسابيع",
      many: "أسبوع",
    });
  }

  if (elapsedDays < 365) {
    const elapsedMonths = Math.max(1, Math.floor(elapsedDays / 30));
    return formatArabicDuration(elapsedMonths, {
      one: "شهر",
      two: "شهرين",
      few: "أشهر",
      many: "شهر",
    });
  }

  return formatArabicDuration(Math.floor(elapsedDays / 365), {
    one: "سنة",
    two: "سنتين",
    few: "سنوات",
    many: "سنة",
  });
}

function formatExactReviewDate(createdAt) {
  return new Intl.DateTimeFormat("ar-EG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(createdAt);
}

export default function CustomerReviews() {
  const [reviews, setReviews] = useState(getInitialReviews);
  const [now, setNow] = useState(Date.now);

  const averageRating = useMemo(() => {
    if (!reviews.length) return "0.0";
    const total = reviews.reduce((sum, review) => sum + review.rating, 0);
    return (total / reviews.length).toFixed(1);
  }, [reviews]);

  useEffect(() => {
    persistReviews(reviews);
  }, [reviews]);

  useEffect(() => {
    const intervalId = window.setInterval(() => setNow(Date.now()), 30 * 1000);
    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const syncReviews = () => setReviews(getInitialReviews());
    const handleReviewCreated = (event) => {
      const review = event.detail;
      if (!review?.id) {
        syncReviews();
        return;
      }

      setReviews((items) => [review, ...items.filter((item) => item.id !== review.id)]);
    };

    window.addEventListener("storage", syncReviews);
    window.addEventListener(REVIEW_CREATED_EVENT, handleReviewCreated);

    return () => {
      window.removeEventListener("storage", syncReviews);
      window.removeEventListener(REVIEW_CREATED_EVENT, handleReviewCreated);
    };
  }, []);

  return (
    <section className="reviews-section relative mx-auto max-w-[980px] overflow-hidden rounded-[30px] border border-slate-200/80 bg-[linear-gradient(135deg,#FFFFFF_0%,#F8FCFF_52%,#F5F3FF_100%)] p-4 shadow-[0_24px_70px_rgba(14,165,233,0.12)] backdrop-blur-2xl dark:border-[#263044] dark:bg-[linear-gradient(135deg,#0B1020_0%,#111827_58%,#151A2C_100%)] dark:shadow-[0_0_28px_rgba(15,23,42,0.55)] sm:p-5 lg:p-6">
      <div className="relative z-10">
        <div className="mb-5 text-center">
          <span className="mx-auto inline-flex items-center gap-1.5 rounded-full border border-[#DDD6FE] bg-[#F5F3FF] px-3 py-1 text-[11px] font-black text-[#7C3AED] shadow-[0_10px_24px_rgba(124,58,237,0.10)] dark:border-[#4C1D95]/60 dark:bg-[#1E1B3A] dark:text-[#D8B4FE]">
            <Star className="h-3.5 w-3.5 fill-current" />
            تقييمات العملاء
          </span>
          <h2 className="mt-3 text-2xl font-black tracking-normal text-slate-950 dark:text-white sm:text-3xl">
            آراء عملائنا
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-xs font-semibold leading-6 text-slate-500 dark:text-[#B8C2D6] sm:text-sm">
            تجارب العملاء بعد الشراء تظهر هنا مباشرة.
          </p>

          <div className="mx-auto mt-4 grid max-w-[360px] grid-cols-2 gap-2">
            <div className="rounded-[18px] border border-slate-200 bg-white px-3 py-2.5 text-center shadow-[0_12px_28px_rgba(14,165,233,0.08)] dark:border-[#2B3650] dark:bg-[#111827]">
              <p dir="ltr" className="text-xl font-black text-slate-950 dark:text-white">{averageRating}</p>
              <p className="text-[11px] font-bold text-slate-500 dark:text-[#AAB6CC]">متوسط التقييم</p>
            </div>
            <div className="rounded-[18px] border border-slate-200 bg-white px-3 py-2.5 text-center shadow-[0_12px_28px_rgba(14,165,233,0.08)] dark:border-[#2B3650] dark:bg-[#111827]">
              <p dir="ltr" className="text-xl font-black text-slate-950 dark:text-white">{reviews.length}</p>
              <p className="text-[11px] font-bold text-slate-500 dark:text-[#AAB6CC]">تقييم منشور</p>
            </div>
          </div>
        </div>

        <div className="reviews-grid grid max-h-[430px] gap-3 overflow-y-auto pr-1 md:grid-cols-2">
          {reviews.map((review, index) => (
            <ReviewCard key={review.id} review={review} index={index} now={now} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ReviewCard({ review, index, now }) {
  const createdAt = getReviewTimestamp(review.createdAt);
  const timeLabel = createdAt ? formatReviewElapsedTime(createdAt, now) : review.timeLabel || "الآن";

  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-30px" }}
      transition={{ duration: 0.28, delay: Math.min(index * 0.04, 0.2) }}
      className="review-card relative overflow-hidden rounded-[22px] border border-slate-200 bg-white p-3.5 shadow-[0_14px_34px_rgba(14,165,233,0.09)] backdrop-blur transition hover:-translate-y-1 hover:border-[#C4B5FD] hover:shadow-[0_18px_44px_rgba(124,58,237,0.12)] dark:border-[#2B3650] dark:bg-[#111827] dark:shadow-[0_0_18px_rgba(15,23,42,0.38)] dark:hover:border-[#A855F7]/55 dark:hover:bg-[#172033]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <ReviewAvatar review={review} />
          <div className="min-w-0">
            <h3 className="truncate text-sm font-black text-slate-950 dark:text-white">{review.name}</h3>
            <p
              className="mt-0.5 text-[11px] font-bold text-slate-500 dark:text-[#AAB6CC]"
              title={createdAt ? formatExactReviewDate(createdAt) : undefined}
            >
              {timeLabel}
            </p>
          </div>
        </div>
        <div dir="ltr" className="flex shrink-0 items-center gap-0.5">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={`h-3.5 w-3.5 ${
                star <= review.rating ? "fill-[#F59E0B] text-[#F59E0B] dark:fill-[#FBBF24] dark:text-[#FBBF24]" : "text-slate-300 dark:text-[#526078]"
              }`}
            />
          ))}
        </div>
      </div>
      <p className="relative mt-3 rounded-2xl border border-sky-100/80 bg-sky-50/75 px-3 py-2.5 text-xs font-semibold leading-6 text-slate-700 dark:border-[#2B3650] dark:bg-[#0B1220] dark:text-[#E5E7EB]">
        “{review.message}”
      </p>
    </motion.article>
  );
}

function ReviewAvatar({ review, compact = false }) {
  const sizeClass = compact ? "h-9 w-9 rounded-xl" : "h-10 w-10 rounded-2xl";
  const initial = String(review.avatarInitial || review.name?.slice(0, 1) || "W").slice(0, 1);

  if (review.avatarUrl) {
    return (
      <span className={`${sizeClass} shrink-0 overflow-hidden border border-white/70 bg-white shadow-[0_12px_24px_rgba(124,58,237,0.18)] dark:border-white/10 dark:bg-[#0B1220]`}>
        <img
          src={review.avatarUrl}
          alt=""
          className="h-full w-full object-cover"
          style={{ objectPosition: "72% 27%" }}
        />
      </span>
    );
  }

  return (
    <span className={`grid ${sizeClass} shrink-0 place-items-center bg-[linear-gradient(135deg,#7C3AED,#38BDF8)] text-sm font-black text-white shadow-[0_12px_24px_rgba(124,58,237,0.20)] dark:shadow-[0_12px_24px_rgba(56,189,248,0.13)]`}>
      {initial}
    </span>
  );
}
