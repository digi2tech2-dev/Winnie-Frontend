import { motion } from "framer-motion";
import {
  ArrowLeft,
  BadgeInfo,
  Box,
  CalendarDays,
  Check,
  CheckCircle2,
  Clipboard,
  ClipboardCheck,
  ClipboardList,
  Home,
  ShoppingBag,
  ShoppingCart,
  WalletCards,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { addCustomerReview, hasReviewForOrder } from "../utils/customerReviews";
import { useToast } from "./ToastProvider";
import ReviewModal from "./ReviewModal";
import "./PurchaseSuccessModal.css";

export default function PurchaseSuccessModal({ receipt, onClose, onViewOrder }) {
  const { i18n } = useTranslation("products");
  const { user } = useAuth();
  const { showToast } = useToast();
  const isArabic = i18n.language?.startsWith("ar");
  const [copied, setCopied] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(isOrderAlreadyReviewed(receipt?.order));
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const screenRef = useRef(null);
  const screenScale = useViewportFitScale(screenRef, 8, 0.45);
  const orderNumber = String(receipt.orderId || "");
  const displayOrderNumber = orderNumber.startsWith("#") ? orderNumber : `#${orderNumber}`;
  const statusLabel = receipt.statusLabel || receipt.status || (isArabic ? "تم الشحن بنجاح" : "Top-up successful");
  const orderRecordId = getOrderRecordId(receipt);
  const productId = getProductId(receipt);
  const canReviewOrder = Boolean(
    orderRecordId
    && isOwnedOrder(receipt?.order, user)
    && !reviewSubmitted
  );

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    setReviewSubmitted(isOrderAlreadyReviewed(receipt?.order) || hasReviewForOrder(orderRecordId));
  }, [orderRecordId, receipt?.order]);

  const copyOrderNumber = async () => {
    try {
      await navigator.clipboard.writeText(orderNumber);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  const handleSubmitReview = async ({ rating, message }) => {
    setReviewSubmitting(true);
    setReviewError("");

    try {
      const result = addCustomerReview({
        orderId: orderRecordId,
        productId: productId || receipt.productName || "winnie-product",
        userId: getUserId(user) || "local-customer",
        rating,
        message,
        reviewer: {
          name: user?.name || user?.username || "Winnie Fun Customer",
          avatar: user?.avatar || user?.image || "",
        },
      });

      if (result.duplicate) {
        setReviewModalOpen(false);
        setReviewSubmitted(true);
        showToast({
          type: "info",
          title: isArabic ? "تم إرسال التقييم مسبقًا" : "Review already submitted",
          message: isArabic ? "تم إرسال تقييمك لهذا الطلب من قبل." : "Your review has already been submitted successfully.",
        });
        return;
      }

      setReviewModalOpen(false);
      setReviewSubmitted(true);
      showToast({
        type: "success",
        title: isArabic ? "شكرًا لك!" : "Thank you!",
        message: isArabic ? "تم نشر تقييمك بنجاح." : "Your review has been published.",
      });
    } catch {
      const messageText = isArabic ? "تعذر إرسال تقييمك. حاول مرة أخرى." : "Unable to submit your review. Please try again.";
      setReviewError(messageText);
      showToast({
        type: "error",
        title: isArabic ? "لم يتم إرسال التقييم" : "Review not submitted",
        message: messageText,
      });
    } finally {
      setReviewSubmitting(false);
    }
  };

  const modal = (
    <motion.div
      className="charge-success-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="charge-success-title"
      onClick={onClose}
    >
      <motion.main
        ref={screenRef}
        className="charge-success-screen"
        style={{ "--charge-success-scale": screenScale }}
        dir={isArabic ? "rtl" : "ltr"}
        initial={{ opacity: 0, y: 28, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 28, scale: 0.97 }}
        transition={{ duration: 0.26, ease: "easeOut" }}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="charge-success-nav" dir="ltr">
          <button type="button" onClick={onClose} aria-label={isArabic ? "رجوع" : "Back"}>
            <ArrowLeft />
          </button>
          <h1 id="charge-success-title">{isArabic ? "تم الشحن" : "Top-up complete"}</h1>
          <button type="button" onClick={onClose} aria-label={isArabic ? "الرئيسية" : "Home"}>
            <Home />
          </button>
        </header>

        <section className="charge-success-card">
          <div className="charge-success-hero">
            <div className="charge-success-check" aria-hidden="true">
              <span className="charge-success-check__halo" />
              <span className="charge-success-check__circle"><Check /></span>
              <i className="spark spark--one" />
              <i className="spark spark--two" />
              <i className="spark spark--three" />
              <i className="spark spark--four" />
              <i className="spark spark--five" />
              <i className="spark spark--six" />
            </div>
            <h2>{isArabic ? "تم الشحن بنجاح!" : "Top-up successful!"}</h2>
            <p>{isArabic ? "تم إضافة الطلب بنجاح" : "Your order was added successfully"}</p>
          </div>

          <div className="charge-success-details">
            <DetailRow icon={ClipboardList} label={isArabic ? "رقم الطلب" : "Order number"}>
              <button className="charge-order-number" type="button" onClick={copyOrderNumber} title={isArabic ? "نسخ رقم الطلب" : "Copy order number"}>
                {copied ? <ClipboardCheck /> : <Clipboard />}
                <strong dir="ltr">{displayOrderNumber}</strong>
              </button>
            </DetailRow>

            <DetailRow icon={ShoppingBag} label={isArabic ? "المنتج" : "Product"}>
              <strong>{receipt.productName}</strong>
            </DetailRow>

            <DetailRow icon={Box} tone="violet" label={isArabic ? "الكمية" : "Quantity"}>
              <strong dir="ltr">{receipt.quantity}</strong>
            </DetailRow>

            <DetailRow icon={WalletCards} tone="green" label={isArabic ? "طريقة الدفع" : "Payment method"}>
              <strong>{isArabic ? "رصيد المحفظة" : "Wallet balance"}</strong>
            </DetailRow>

            <DetailRow icon={CalendarDays} label={isArabic ? "تاريخ ووقت الشراء" : "Purchase date and time"}>
              <strong>{receipt.createdAt}</strong>
            </DetailRow>
          </div>

          <section className="charge-total-card">
            <div className="charge-total-wallet" aria-hidden="true">
              <span className="charge-total-wallet__coin charge-total-wallet__coin--one" />
              <span className="charge-total-wallet__coin charge-total-wallet__coin--two" />
              <span className="charge-total-wallet__body"><WalletCards /></span>
              <span className="charge-total-wallet__check"><Check /></span>
            </div>
            <div>
              <span>{isArabic ? "المبلغ الإجمالي" : "Total amount"}</span>
              <strong dir="ltr">{receipt.totalLabel}</strong>
            </div>
          </section>

          <section className="charge-order-status">
            <div className="charge-order-status__heading">
              <span className="charge-detail-icon"><BadgeInfo /></span>
              <strong>{isArabic ? "حالة الطلب" : "Order status"}</strong>
              <span className="charge-order-status__badge">{statusLabel}</span>
            </div>
            <p>{isArabic ? "تم إرسال الطلب إلى مزود الخدمة، وسيتم تنفيذه خلال دقائق." : "The order was sent to the service provider and will be completed within minutes."}</p>
            {(canReviewOrder || reviewSubmitted) && (
              <section className="charge-review-gate charge-review-gate--status">
                {reviewSubmitted ? (
                  <p className="charge-review-gate__submitted">
                    <CheckCircle2 />
                    <span>{isArabic ? "تم إرسال تقييمك بنجاح." : "Your review has been submitted successfully."}</span>
                  </p>
                ) : (
                  <button
                    type="button"
                    className="charge-review-gate__button"
                    onClick={() => setReviewModalOpen(true)}
                  >
                    <span className="charge-review-gate__stars" aria-hidden="true">★★★★★</span>
                    <span>{isArabic ? "قيّم الطلب" : "Review order"}</span>
                  </button>
                )}
              </section>
            )}
          </section>

          <div className="charge-success-actions">
            <button className="charge-success-actions__orders" type="button" onClick={onViewOrder || onClose}>
              <Clipboard />
              <span>{isArabic ? "عرض الطلبات" : "View orders"}</span>
            </button>
            <button className="charge-success-actions__new" type="button" onClick={onClose}>
              <ShoppingCart />
              <span>{isArabic ? "طلب جديد" : "New order"}</span>
            </button>
          </div>
        </section>
        <ReviewModal
          errorMessage={reviewError}
          isOpen={reviewModalOpen}
          onClose={() => {
            if (!reviewSubmitting) {
              setReviewModalOpen(false);
              setReviewError("");
            }
          }}
          onSubmit={handleSubmitReview}
          submitting={reviewSubmitting}
        />
      </motion.main>
    </motion.div>
  );

  return typeof document === "undefined" ? modal : createPortal(modal, document.body);
}

function DetailRow({ children, icon: Icon, label, tone = "blue" }) {
  return (
    <div className="charge-detail-row">
      <div className="charge-detail-row__label">
        <span className={`charge-detail-icon charge-detail-icon--${tone}`}><Icon /></span>
        <span>{label}</span>
      </div>
      <div className="charge-detail-row__value">{children}</div>
    </div>
  );
}

function useViewportFitScale(ref, margin = 8, minScale = 0.45) {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const element = ref.current;
    if (!element) return undefined;

    let frameId = 0;

    const fit = () => {
      window.cancelAnimationFrame(frameId);
      frameId = window.requestAnimationFrame(() => {
        const viewport = window.visualViewport;
        const viewportWidth = viewport?.width || window.innerWidth;
        const viewportHeight = viewport?.height || window.innerHeight;
        const availableWidth = Math.max(260, viewportWidth - margin * 2);
        const availableHeight = Math.max(320, viewportHeight - margin * 2);
        const width = element.scrollWidth || element.offsetWidth || 1;
        const height = element.scrollHeight || element.offsetHeight || 1;
        const nextScale = Math.min(1, availableWidth / width, availableHeight / height);

        setScale(Number(Math.max(minScale, nextScale).toFixed(3)));
      });
    };

    fit();

    const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(fit) : null;
    observer?.observe(element);
    window.addEventListener("resize", fit);
    window.visualViewport?.addEventListener("resize", fit);
    window.visualViewport?.addEventListener("scroll", fit);

    return () => {
      window.cancelAnimationFrame(frameId);
      observer?.disconnect();
      window.removeEventListener("resize", fit);
      window.visualViewport?.removeEventListener("resize", fit);
      window.visualViewport?.removeEventListener("scroll", fit);
    };
  }, [margin, minScale, ref]);

  return scale;
}

function getOrderRecordId(receipt = {}) {
  return String(receipt.orderRecordId || receipt.order?.id || receipt.order?._id || receipt.orderId || "").replace(/^#/, "");
}

function getProductId(receipt = {}) {
  const product = receipt.product || receipt.order?.product || receipt.order?.productId || {};
  return String(product._id || product.id || product.productId || receipt.order?.productId || "").trim();
}

function isOrderAlreadyReviewed(order = {}) {
  return Boolean(order?.review || order?.reviewId || order?.reviewedAt || order?.hasReview || order?.hasReviewed || order?.reviewSubmitted);
}

function getUserId(user = {}) {
  return String(user?._id || user?.id || user?.userId || "").trim();
}

function isOwnedOrder(order = {}, user = {}) {
  const currentUserId = getUserId(user);
  const ownerIds = [
    order?.userId,
    order?.customerId,
    order?.customer?._id,
    order?.customer?.id,
    order?.user?._id,
    order?.user?.id,
  ].map((value) => String(value || "").trim()).filter(Boolean);

  if (!currentUserId || !ownerIds.length) return true;
  return ownerIds.length ? ownerIds.includes(currentUserId) : true;
}
