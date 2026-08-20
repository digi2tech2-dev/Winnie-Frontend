import { apiRequest } from "./client";

function normalizeRating(value) {
  return Math.min(5, Math.max(1, Math.round(Number(value) || 0)));
}

function normalizePublicReview(review = {}) {
  const reviewer = review.reviewer || {};
  const displayName = reviewer.displayName || reviewer.name || review.displayName || "Winnie Customer";

  return {
    id: String(review.id || review._id || ""),
    rating: normalizeRating(review.rating),
    message: String(review.comment || review.message || "").trim(),
    createdAt: review.createdAt || "",
    reviewer: {
      name: displayName,
      nameAr: "",
      avatar: reviewer.avatar || "",
    },
    approved: true,
    verifiedPurchase: review.verifiedPurchase === true,
    verifiedCustomer: review.verifiedCustomer === true || review.verifiedPurchase === true,
    isFeatured: review.isFeatured === true,
  };
}

function normalizeStats(stats = {}) {
  const totalReviews = Number(stats.totalReviews || 0);
  const averageRating = totalReviews ? Number(Number(stats.averageRating || 0).toFixed(1)) : 0;

  return { averageRating, totalReviews };
}

export async function fetchPublicReviews({ limit = 10, page = 1, featured, signal } = {}) {
  const response = await apiRequest("/public/reviews", {
    query: { limit, page, featured },
    signal,
  });
  const data = response.data || {};

  return {
    reviews: Array.isArray(data.reviews) ? data.reviews.map(normalizePublicReview) : [],
    stats: normalizeStats(data.stats),
    pagination: data.pagination || null,
  };
}

export async function submitCustomerReview(token, { orderId, rating, message }) {
  const response = await apiRequest("/reviews", {
    method: "POST",
    token,
    body: {
      orderId,
      rating,
      comment: message || "",
    },
  });

  return response.data?.review || response.data || null;
}
