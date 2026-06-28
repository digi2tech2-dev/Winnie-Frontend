export const REVIEW_STORAGE_KEY = "winnie-customer-reviews";
export const REVIEW_CREATED_EVENT = "winnie-customer-review-created";
export const PROFILE_AVATAR_KEY = "winnie-profile-avatar";

const defaultReviewSeeds = [
  {
    id: "default-ahmed",
    name: "أحمد محمد",
    rating: 5,
    message: "خدمة ممتازة وسرعة في تنفيذ الطلب.",
    ageMs: 3 * 60 * 1000,
  },
  {
    id: "default-sara",
    name: "سارة علي",
    rating: 5,
    message: "الموقع منظم والتعامل سهل جدًا.",
    ageMs: 9 * 60 * 1000,
  },
  {
    id: "default-mohamed",
    name: "محمد خالد",
    rating: 4,
    message: "تجربة جميلة والدعم سريع.",
    ageMs: 18 * 60 * 1000,
  },
];

export function createDefaultReviews(now = Date.now()) {
  return defaultReviewSeeds.map(({ ageMs, ...review }) => ({
    ...review,
    createdAt: now - ageMs,
  }));
}

export function getReviewTimestamp(value) {
  const numericValue = Number(value);
  if (Number.isFinite(numericValue) && numericValue > 0) return numericValue;

  const parsedValue = Date.parse(value);
  return Number.isFinite(parsedValue) ? parsedValue : null;
}

export function normalizeReviews(items, now = Date.now()) {
  return items.map((review, index) => ({
    ...review,
    createdAt: getReviewTimestamp(review.createdAt) || now - (index + 1) * 60 * 1000,
  }));
}

export function getInitialReviews() {
  if (typeof window === "undefined") return createDefaultReviews();

  try {
    const stored = window.localStorage.getItem(REVIEW_STORAGE_KEY);
    if (!stored) return createDefaultReviews();

    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) && parsed.length ? normalizeReviews(parsed) : createDefaultReviews();
  } catch {
    return createDefaultReviews();
  }
}

export function persistReviews(reviews) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(REVIEW_STORAGE_KEY, JSON.stringify(reviews));
  } catch {
    // Storage can fail in private mode; the UI still updates for this session.
  }
}

export function addCustomerReview(review) {
  const nextReviews = [review, ...getInitialReviews().filter((item) => item.id !== review.id)];
  persistReviews(nextReviews);

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(REVIEW_CREATED_EVENT, { detail: review }));
  }

  return nextReviews;
}

export function getStoredProfileAvatar() {
  if (typeof window === "undefined") return "";

  try {
    return window.localStorage.getItem(PROFILE_AVATAR_KEY) || "";
  } catch {
    return "";
  }
}

export function isImageAvatar(value) {
  return typeof value === "string" && /^(data:image\/|https?:\/\/|\/)/.test(value);
}

export function getReviewerAvatarUrl(user, storedAvatarUrl) {
  if (storedAvatarUrl) return storedAvatarUrl;
  if (isImageAvatar(user?.avatar)) return user.avatar;
  return "/hero-winnie-fun.png";
}

export function getReviewerInitial(user, name) {
  if (user?.avatar && !isImageAvatar(user.avatar)) return String(user.avatar).slice(0, 1);
  return String(name || "W").slice(0, 1);
}
