import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, Loader2, MessageSquareText, Send, Sparkles, Star, X } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import "./ReviewModal.css";

export default function ReviewModal({ errorMessage = "", isOpen, onClose, onSubmit, submitting = false }) {
  const { i18n } = useTranslation();
  const isArabic = i18n.language?.startsWith("ar");
  const titleId = useId();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [message, setMessage] = useState("");
  const [localError, setLocalError] = useState("");

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !submitting) onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, submitting]);

  useEffect(() => {
    if (!isOpen) {
      setRating(0);
      setHoveredRating(0);
      setMessage("");
      setLocalError("");
    }
  }, [isOpen]);

  const submit = async (event) => {
    event.preventDefault();
    if (submitting) return;

    if (!rating) {
      setLocalError(isArabic ? "يرجى اختيار عدد النجوم." : "Please select a star rating.");
      return;
    }

    setLocalError("");
    await onSubmit({ rating, message: message.trim() });
  };

  const modal = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="review-modal-layer"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          onClick={() => {
            if (!submitting) onClose();
          }}
          dir={isArabic ? "rtl" : "ltr"}
        >
          <motion.form
            className="review-modal"
            initial={{ opacity: 0, y: 28, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 28, scale: 0.96 }}
            transition={{ duration: 0.24, ease: "easeOut" }}
            onClick={(event) => event.stopPropagation()}
            onSubmit={submit}
          >
            <button
              type="button"
              className="review-modal__close"
              onClick={onClose}
              disabled={submitting}
              aria-label={isArabic ? "إغلاق نافذة التقييم" : "Close review modal"}
              title={isArabic ? "إغلاق" : "Close"}
            >
              <X />
            </button>

            <header className="review-modal__header">
              <span className="review-modal__icon" aria-hidden="true"><Sparkles /></span>
              <div>
                <h2 id={titleId}>{isArabic ? "تقييم المنتج" : "Review Product"}</h2>
                <p>{isArabic ? "شاركنا تجربتك مع هذا المنتج." : "Share your experience with this product."}</p>
              </div>
            </header>

            <section className="review-modal__rating-card">
              <span>{isArabic ? "اختر تقييمك" : "Choose your rating"}</span>
              <fieldset className="review-modal__stars" aria-label={isArabic ? "اختر عدد النجوم" : "Select star rating"}>
                {[1, 2, 3, 4, 5].map((value) => {
                  const active = value <= (hoveredRating || rating);
                  return (
                    <button
                      key={value}
                      type="button"
                      className={active ? "is-active" : ""}
                      onClick={() => {
                        setRating(value);
                        setLocalError("");
                      }}
                      onMouseEnter={() => setHoveredRating(value)}
                      onMouseLeave={() => setHoveredRating(0)}
                      aria-label={isArabic ? `${value} نجوم` : `${value} star${value > 1 ? "s" : ""}`}
                      aria-pressed={rating === value}
                    >
                      <Star />
                    </button>
                  );
                })}
              </fieldset>
              <strong>{rating ? (isArabic ? `${rating} من 5 نجوم` : `${rating} out of 5 stars`) : (isArabic ? "اضغط على النجوم للتقييم" : "Tap the stars to rate")}</strong>
            </section>

            <label className="review-modal__message">
              <span className="review-modal__message-title">
                <MessageSquareText />
                <span>{isArabic ? "شارك تجربتك" : "Share your experience"}</span>
              </span>
              <div className="review-modal__textarea-wrap">
                <textarea
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder={isArabic ? "اكتب رأيك عن المنتج والخدمة..." : "Write your thoughts about the product and service..."}
                  maxLength={600}
                />
                <small dir="ltr">{message.length}/600</small>
              </div>
            </label>

            {(localError || errorMessage) && (
              <p className="review-modal__error" role="alert">
                <AlertCircle />
                <span>{localError || errorMessage}</span>
              </p>
            )}

            <button type="submit" className="review-modal__submit" disabled={submitting}>
              {submitting ? <Loader2 className="animate-spin" /> : <Send />}
              <span>{isArabic ? "إرسال التقييم" : "Submit Review"}</span>
            </button>
          </motion.form>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return typeof document === "undefined" ? modal : createPortal(modal, document.body);
}
