import { compactObject, normalizeUserProfile } from "./adapters";
import { apiRequest } from "./client";

export const PROFILE_UPDATE_SUPPORTED = true;
export const AVATAR_UPLOAD_SUPPORTED = true;
export const PASSWORD_CHANGE_SUPPORTED = false;

export async function getProfile(token) {
  const response = await apiRequest("/me", { token });
  return normalizeUserProfile(response.data || {});
}

export async function updateMyProfile(token, payload = {}) {
  const response = await apiRequest("/users/me", {
    method: "PATCH",
    token,
    body: compactObject({
      name: payload.name,
      phone: payload.phone,
      username: payload.username,
    }),
  });

  return {
    message: response.message,
    user: normalizeUserProfile(response.data || {}),
  };
}

export async function uploadMyAvatar(token, file) {
  const formData = new FormData();
  formData.append("avatar", file);

  const response = await apiRequest("/users/me/avatar", {
    method: "PATCH",
    token,
    body: formData,
  });

  return {
    message: response.message,
    user: normalizeUserProfile(response.data || {}),
  };
}
