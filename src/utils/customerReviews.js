const now = Date.now();

const mockReviews = [
  {
    id: "review-1006",
    orderId: "WF-2026-1006",
    productId: "winnie-premium-topup",
    userId: "customer-1006",
    rating: 5,
    message: "Fast delivery and a very smooth purchase experience. Everything worked perfectly.",
    messageAr: "تسليم سريع وتجربة شراء سلسة جدًا. كل شيء اشتغل بشكل ممتاز.",
    createdAt: new Date(now - 1000 * 60 * 45).toISOString(),
    reviewer: {
      name: "Ahmed Mohamed",
      nameAr: "أحمد محمد",
      avatar: "https://i.pravatar.cc/120?img=12",
    },
    approved: true,
  },
  {
    id: "review-1005",
    orderId: "WF-2026-1005",
    productId: "winnie-game-credit",
    userId: "customer-1005",
    rating: 5,
    message: "Professional service, quick confirmation, and the product arrived exactly as expected.",
    messageAr: "خدمة احترافية وتأكيد سريع، والمنتج وصل بالضبط كما توقعت.",
    createdAt: new Date(now - 1000 * 60 * 60 * 8).toISOString(),
    reviewer: {
      name: "Sara Ali",
      nameAr: "سارة علي",
      avatar: "https://i.pravatar.cc/120?img=47",
    },
    approved: true,
  },
  {
    id: "review-1004",
    orderId: "WF-2026-1004",
    productId: "winnie-digital-card",
    userId: "customer-1004",
    rating: 4,
    message: "Great website and reliable checkout. I liked how clear the order status was.",
    messageAr: "موقع ممتاز ودفع موثوق. أعجبني وضوح حالة الطلب.",
    createdAt: new Date(now - 1000 * 60 * 60 * 21).toISOString(),
    reviewer: {
      name: "Mohamed Gamal",
      nameAr: "محمد جمال",
      avatar: "https://i.pravatar.cc/120?img=68",
    },
    approved: true,
  },
  {
    id: "review-1003",
    orderId: "WF-2026-1003",
    productId: "winnie-fast-charge",
    userId: "customer-1003",
    rating: 5,
    message: "Excellent support and very fast processing. I will definitely order again.",
    messageAr: "دعم ممتاز وتنفيذ سريع جدًا. سأطلب مرة أخرى بالتأكيد.",
    createdAt: new Date(now - 1000 * 60 * 60 * 34).toISOString(),
    reviewer: {
      name: "Nour Hassan",
      nameAr: "نور حسن",
      avatar: "https://i.pravatar.cc/120?img=32",
    },
    approved: true,
  },
  {
    id: "review-1002",
    orderId: "WF-2026-1002",
    productId: "winnie-manual-product",
    userId: "customer-1002",
    rating: 5,
    message: "The experience felt secure from start to finish. Clean UI and quick service.",
    messageAr: "التجربة كانت آمنة من البداية للنهاية. واجهة مرتبة وخدمة سريعة.",
    createdAt: new Date(now - 1000 * 60 * 60 * 49).toISOString(),
    reviewer: {
      name: "Omar Khaled",
      nameAr: "عمر خالد",
      avatar: "https://i.pravatar.cc/120?img=15",
    },
    approved: true,
  },
  {
    id: "review-1001",
    orderId: "WF-2026-1001",
    productId: "winnie-topup",
    userId: "customer-1001",
    rating: 4,
    message: "Easy purchase flow and the order completed without any confusion.",
    messageAr: "خطوات الشراء سهلة والطلب اكتمل بدون أي تعقيد.",
    createdAt: new Date(now - 1000 * 60 * 60 * 70).toISOString(),
    reviewer: {
      name: "Laila Samir",
      nameAr: "ليلى سمير",
      avatar: "https://i.pravatar.cc/120?img=49",
    },
    approved: true,
  },
];

let reviews = [...mockReviews];
const listeners = new Set();

function notify() {
  const snapshot = getHomepageReviews();
  listeners.forEach((listener) => listener(snapshot));
}

function normalizeRating(value) {
  return Math.min(5, Math.max(1, Math.round(Number(value) || 0)));
}

function normalizeId(value, fallback = "") {
  return String(value || fallback).replace(/^#/, "").trim();
}

function formatDateLabel(value) {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function normalizeReview(review = {}) {
  const createdAt = review.createdAt || new Date().toISOString();
  const reviewer = review.reviewer || {};

  return {
    id: normalizeId(review.id, `review-${Date.now()}`),
    orderId: normalizeId(review.orderId),
    productId: normalizeId(review.productId, "local-product"),
    userId: normalizeId(review.userId, "local-user"),
    rating: normalizeRating(review.rating),
    message: String(review.message || "").trim(),
    messageAr: String(review.messageAr || "").trim(),
    createdAt,
    dateLabel: review.dateLabel || formatDateLabel(createdAt),
    reviewer: {
      name: reviewer.name || review.customerName || "Winnie Fun Customer",
      nameAr: reviewer.nameAr || review.customerNameAr || "",
      avatar: reviewer.avatar || review.avatar || "",
    },
    approved: review.approved !== false,
  };
}

export function getHomepageReviews() {
  return reviews
    .filter((review) => review.approved !== false)
    .map(normalizeReview)
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .slice(0, 10);
}

export function getReviewStats() {
  const approvedReviews = reviews.filter((review) => review.approved !== false);
  const totalReviews = approvedReviews.length;
  const averageRating = totalReviews
    ? approvedReviews.reduce((sum, review) => sum + normalizeRating(review.rating), 0) / totalReviews
    : 0;

  return {
    averageRating: Number(averageRating.toFixed(1)),
    totalReviews,
  };
}

export function hasReviewForOrder(orderId) {
  const targetOrderId = normalizeId(orderId);
  if (!targetOrderId) return false;
  return reviews.some((review) => normalizeId(review.orderId) === targetOrderId);
}

export function addCustomerReview(review) {
  const normalizedReview = normalizeReview({
    ...review,
    id: review.id || `review-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    createdAt: review.createdAt || new Date().toISOString(),
    approved: true,
  });

  if (hasReviewForOrder(normalizedReview.orderId)) {
    return { review: reviews.find((item) => normalizeId(item.orderId) === normalizedReview.orderId), duplicate: true };
  }

  reviews = [normalizedReview, ...reviews];
  notify();
  return { review: normalizedReview, duplicate: false };
}

export function subscribeToCustomerReviews(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
