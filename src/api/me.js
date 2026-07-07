import { apiRequest } from "./client";

export async function getCurrentUser(token) {
  const response = await apiRequest("/me", { token });
  return response.data;
}
