import { apiRequest } from "./client";
import { asArray, compactObject, getItemId, resolveBackendAssetUrl, toNumber } from "./adapters";

function isFileLike(value) {
  return typeof File !== "undefined" && value instanceof File;
}

function getParentCategoryId(category = {}) {
  const parent = category.parentCategory ?? category.parentId ?? null;
  if (!parent) return "";
  if (typeof parent === "object") return getItemId(parent);
  return String(parent);
}

export function normalizeAdminCategory(category = {}, index = 0) {
  const id = getItemId(category, `category-${index}`);
  const parentId = getParentCategoryId(category);
  const sortOrder = toNumber(category.sortOrder ?? category.displayOrder, index + 1);
  const isActive = category.isActive !== false && category.visible !== false;

  return {
    ...category,
    id,
    _id: category._id ?? id,
    displayOrder: sortOrder,
    image: resolveBackendAssetUrl(category.image) || "/logo.png",
    isActive,
    name: category.name || category.title || "Untitled category",
    nameAr: category.nameAr || "",
    parentCategory: parentId || null,
    parentId,
    productCount: toNumber(category.productCount ?? category.productsCount, 0),
    sortOrder,
    visible: isActive,
  };
}

export function splitCategoryTree(categories = []) {
  const normalized = categories.map(normalizeAdminCategory);
  return {
    allCategories: normalized,
    mainCategories: normalized.filter((category) => !category.parentId),
    subCategories: normalized.filter((category) => Boolean(category.parentId)),
  };
}

async function uploadAdminCategoryImage(token, file) {
  if (!isFileLike(file)) return "";

  const formData = new FormData();
  formData.append("image", file);

  const response = await apiRequest("/upload/categories", {
    body: formData,
    token,
  });

  return response.data?.path || "";
}

async function buildCategoryPayload(token, values = {}) {
  const uploadedImage = await uploadAdminCategoryImage(token, values.imageFile);
  const image = uploadedImage || values.imagePath || values.image || "";

  return compactObject({
    image: /^data:/i.test(image) ? undefined : image,
    isActive: values.isActive ?? values.visible,
    name: values.name,
    nameAr: values.nameAr,
    parentCategory: values.parentCategory ?? values.parentId,
    sortOrder: values.sortOrder ?? values.displayOrder,
  });
}

export async function getAdminCategories(token) {
  const response = await apiRequest("/admin/categories", { token });
  const categories = asArray(response.data?.categories || response.data).map(normalizeAdminCategory);

  return {
    categories,
    message: response.message,
    tree: splitCategoryTree(categories),
  };
}

export async function createAdminCategory(token, values = {}) {
  const response = await apiRequest("/admin/categories", {
    body: await buildCategoryPayload(token, values),
    token,
  });

  return {
    category: normalizeAdminCategory(response.data?.category || response.data || {}),
    message: response.message,
  };
}

export async function updateAdminCategory(token, id, values = {}) {
  const response = await apiRequest(`/admin/categories/${id}`, {
    body: await buildCategoryPayload(token, values),
    method: "PATCH",
    token,
  });

  return {
    category: normalizeAdminCategory(response.data?.category || response.data || {}),
    message: response.message,
  };
}

export async function toggleAdminCategory(token, id) {
  const response = await apiRequest(`/admin/categories/${id}/toggle`, {
    method: "PATCH",
    token,
  });

  return {
    category: normalizeAdminCategory(response.data?.category || response.data || {}),
    message: response.message,
  };
}

export async function deleteAdminCategory(token, id) {
  const response = await apiRequest(`/admin/categories/${id}`, {
    method: "DELETE",
    token,
  });

  return {
    deletedId: response.data?.deletedId || id,
    message: response.message,
  };
}
