import { normalizeUserProfile } from "./adapters";
import { apiRequest } from "./client";

export async function getProfile(token) {
  const response = await apiRequest("/me", { token });
  return normalizeUserProfile(response.data || {});
}
