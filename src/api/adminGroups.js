import { apiRequest } from "./client";
import { asArray, getItemId, toNumber } from "./adapters";

export function normalizeAdminGroup(group = {}) {
  const id = getItemId(group);

  return {
    ...group,
    id,
    _id: group._id ?? id,
    isActive: group.isActive !== false,
    name: group.name || "Unnamed group",
    percentage: toNumber(group.percentage, 0),
  };
}

export async function getAdminGroups(token, query = {}) {
  const response = await apiRequest("/admin/groups", {
    query,
    token,
  });
  const groups = asArray(response.data?.groups || response.data)
    .map(normalizeAdminGroup)
    .filter((group) => group.isActive);

  return {
    groups,
    message: response.message,
  };
}
