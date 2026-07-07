import { motion } from "framer-motion";
import { BadgeCheck, ChevronLeft, ChevronRight, Star } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { getHomepageReviews, getReviewStats, subscribeToCustomerReviews } from "../../utils/customerReviews";
import "./CustomerReviews.css";

function getVisibleCount() {
  if (typeof window === "undefined") return 3;
  if (window.matchMedia("(max-width: 639px)").matches) return 1;
  if (window.matchMedia("(max-width: 1023px)").matches) return 2;
  return 3;
}

function getInitials(name = "") {
  return String(name || "WF")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function formatReviewDate(value, locale) {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export default function CustomerReviews() {
  const { i18n } = useTranslation();
  const isArabic = i18n.language?.startsWith("ar");
  const locale = isArabic ? "ar-EG-u-nu-latn" : "en-US";
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({ averageRating: 0, totalReviews: 0 });
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [visibleCount, setVisibleCount] = useState(getVisibleCount);
  const touchStartX = useRef(null);
  const canSlide = reviews.length > visibleCount;
  const maxIndex = Math.max(0, reviews.length - visibleCount);
  const averageLabel = stats.totalReviews ? stats.averageRating.toFixed(1) : "0.0";
  const text = isArabic ? {
    title: "⭐ تقييمات العملاء",
    subtitle: "شاهد آراء العملاء الذين اشتروا من Winnie Fun.",
    previous: "التقييم السابق",
    next: "التقييم التالي",
    dots: "صفحات التقييمات",
    showPage: "عرض صفحة التقييمات",
    empty: "ستظهر تقييمات العملاء الموثقة هنا بعد عمليات الشراء المكتملة.",
  } : {
    title: "⭐ Customer Reviews",
    subtitle: "See what customers who purchased from Winnie Fun are saying.",
    previous: "Previous review",
    next: "Next review",
    dots: "Review carousel pages",
    showPage: "Show review page",
    empty: "Verified customer reviews will appear here after completed purchases.",
  };

  useEffect(() => {
    let cancelled = false;
    const syncReviews = (nextReviews = getHomepageReviews()) => {
      if (cancelled) return;
      setReviews(nextReviews.filter(isApprovedReview));
      setStats(getReviewStats());
      setActiveIndex(0);
    };

    const loadingTimer = window.setTimeout(() => {
      syncReviews();
      setLoading(false);
    }, 420);

    const unsubscribe = subscribeToCustomerReviews((nextReviews) => {
      syncReviews(nextReviews);
      if (!cancelled) {
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
      window.clearTimeout(loadingTimer);
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    const handleResize = () => setVisibleCount(getVisibleCount());
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    setActiveIndex((index) => Math.min(index, maxIndex));
  }, [maxIndex]);

  useEffect(() => {
    if (!canSlide) return undefined;

    const intervalId = window.setInterval(() => {
      setActiveIndex((index) => (index >= maxIndex ? 0 : index + 1));
    }, 5200);

    return () => window.clearInterval(intervalId);
  }, [canSlide, maxIndex]);

  const dots = useMemo(() => Array.from({ length: maxIndex + 1 }, (_, index) => index), [maxIndex]);

  const move = (direction) => {
    if (!canSlide) return;
    setActiveIndex((index) => {
      if (direction > 0) return index >= maxIndex ? 0 : index + 1;
      return index <= 0 ? maxIndex : index - 1;
    });
  };

  const handleTouchStart = (event) => {
    touchStartX.current = event.touches[0]?.clientX ?? null;
  };

  const handleTouchEnd = (event) => {
    const startX = touchStartX.current;
    touchStartX.current = null;
    if (startX === null) return;

    const endX = event.changedTouches[0]?.clientX ?? startX;
    const delta = endX - startX;
    if (Math.abs(delta) < 42) return;

    move(delta < 0 ? 1 : -1);
  };

  return (
    <section className="wf-reviews-section" aria-labelledby="customer-reviews-title" dir={isArabic ? "rtl" : "ltr"}>
      <motion.div
        className="wf-reviews-shell"
        initial={{ opacity: 0, y: 22 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.42, ease: "easeOut" }}
      >
        <div className="wf-reviews-topline">
          <div>
            <h2 id="customer-reviews-title">{text.title}</h2>
            <p>{text.subtitle}</p>
          </div>
          <div
            className="wf-reviews-stats"
            aria-label={isArabic ? `${averageLabel} من 5` : `${averageLabel} out of 5`}
          >
            <strong><Star /> {averageLabel} / 5</strong>
          </div>
        </div>

        {loading ? (
          <div className="wf-reviews-grid">
            {[1, 2, 3].map((item) => <ReviewSkeleton key={item} />)}
          </div>
        ) : reviews.length ? (
          <div className="wf-reviews-carousel" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
            {canSlide && (
              <button type="button" className="wf-reviews-nav wf-reviews-nav--prev" onClick={() => move(-1)} aria-label={text.previous}>
                <ChevronLeft />
              </button>
            )}

            <div className="wf-reviews-viewport">
              <div
                className="wf-reviews-track"
                style={{
                  "--wf-review-visible": visibleCount,
                  transform: `translateX(calc(${activeIndex} * (-100% / var(--wf-review-visible))))`,
                }}
              >
                {reviews.map((review) => <ReviewCard key={review.id} review={review} isArabic={isArabic} locale={locale} />)}
              </div>
            </div>

            {canSlide && (
              <button type="button" className="wf-reviews-nav wf-reviews-nav--next" onClick={() => move(1)} aria-label={text.next}>
                <ChevronRight />
              </button>
            )}

            {canSlide && (
              <div className="wf-reviews-dots" aria-label={text.dots}>
                {dots.map((index) => (
                  <button
                    key={index}
                    type="button"
                    className={index === activeIndex ? "is-active" : ""}
                    onClick={() => setActiveIndex(index)}
                    aria-label={`${text.showPage} ${index + 1}`}
                    aria-current={index === activeIndex}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="wf-reviews-empty">{text.empty}</div>
        )}
      </motion.div>
    </section>
  );
}

function isApprovedReview(review = {}) {
  if (typeof review.approved === "boolean") return review.approved;
  if (typeof review.isApproved === "boolean") return review.isApproved;

  const status = String(review.moderationStatus || review.approvalStatus || review.status || "").toUpperCase();
  return !status || status === "APPROVED" || status === "PUBLISHED";
}

function ReviewCard({ review, isArabic, locale }) {
  const hasAvatar = Boolean(review.reviewer.avatar);
  const reviewerName = isArabic ? (review.reviewer.nameAr || review.reviewer.name) : review.reviewer.name;
  const message = isArabic ? (review.messageAr || review.message) : review.message;
  const verifiedText = isArabic ? "مشتري موثّق" : "Verified Buyer";
  const emptyMessage = isArabic ? "لم يكتب العميل رسالة." : "No written message provided.";

  return (
    <article className="wf-review-card">
      <div className="wf-review-card__header">
        <div className="wf-review-avatar">
          {hasAvatar ? (
            <img src={review.reviewer.avatar} alt="" loading="lazy" />
          ) : (
            <span>{getInitials(reviewerName)}</span>
          )}
        </div>
        <div className="wf-review-card__identity">
          <h3>{reviewerName}</h3>
          <span><BadgeCheck /> {verifiedText}</span>
        </div>
      </div>
      <StarRating rating={review.rating} isArabic={isArabic} />
      <p className="wf-review-card__message">{message || emptyMessage}</p>
      <time dateTime={review.createdAt || undefined}>{formatReviewDate(review.createdAt, locale) || review.dateLabel}</time>
    </article>
  );
}

function StarRating({ rating, isArabic }) {
  const value = Math.min(5, Math.max(1, Math.round(rating || 0)));
  return (
    <div className="wf-review-stars" aria-label={isArabic ? `${value} من 5 نجوم` : `${value} out of 5 stars`}>
      {"★".repeat(value)}{"☆".repeat(5 - value)}
    </div>
  );
}

function ReviewSkeleton() {
  return (
    <div className="wf-review-card wf-review-card--skeleton" aria-hidden="true">
      <div className="wf-review-card__header">
        <span className="wf-skeleton wf-skeleton--avatar" />
        <div>
          <span className="wf-skeleton wf-skeleton--line" />
          <span className="wf-skeleton wf-skeleton--pill" />
        </div>
      </div>
      <span className="wf-skeleton wf-skeleton--stars" />
      <span className="wf-skeleton wf-skeleton--copy" />
      <span className="wf-skeleton wf-skeleton--copy short" />
    </div>
  );
}
