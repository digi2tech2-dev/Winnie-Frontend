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

function normalizePagination(pagination = {}, fallback = {}) {
  const source = pagination || {};
  const page = Number(source.page || fallback.page || 1);
  const limit = Number(source.limit || fallback.limit || 20);
  const total = Number(source.total || 0);
  const pages = Number(source.pages || Math.ceil(total / limit) || 1);

  return { page, limit, total, pages: Math.max(1, pages) };
}

function normalizeAdminReview(review = {}) {
  const reviewer = review.reviewer || {};
  const product = review.product || {};

  return {
    id: String(review.id || review._id || ""),
    rating: normalizeRating(review.rating),
    comment: String(review.comment || review.message || "").trim(),
    status: String(review.status || "PENDING").toUpperCase(),
    createdAt: review.createdAt || "",
    updatedAt: review.updatedAt || "",
    moderatedAt: review.moderatedAt || "",
    reviewer: {
      displayName: reviewer.displayName || reviewer.name || review.displayName || "Winnie Customer",
    },
    product: {
      name: product.name || review.productName || "",
    },
    verifiedPurchase: review.verifiedPurchase === true,
    verifiedCustomer: review.verifiedCustomer === true || review.verifiedPurchase === true,
    isFeatured: review.isFeatured === true,
  };
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

export async function fetchAdminReviews(token, { limit = 20, page = 1, status, featured, signal } = {}) {
  const response = await apiRequest("/admin/reviews", {
    token,
    query: {
      limit,
      page,
      status,
      featured,
    },
    signal,
  });
  const data = response.data || {};

  return {
    reviews: Array.isArray(data.reviews) ? data.reviews.map(normalizeAdminReview) : [],
    pagination: normalizePagination(data.pagination || response.pagination, { page, limit }),
  };
}

export async function updateAdminReview(token, reviewId, payload) {
  const response = await apiRequest(`/admin/reviews/${reviewId}`, {
    method: "PATCH",
    token,
    body: payload,
  });

  return normalizeAdminReview(response.data?.review || response.data || {});
}
