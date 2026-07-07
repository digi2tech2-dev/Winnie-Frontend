import {
  ADMIN_SETTING_KEYS,
  getAdminSettings,
  updateAdminSetting,
} from "./adminSettings";
import {
  buildPaymentGroupSetting,
  buildPaymentMethodSetting,
  generatePaymentSettingId,
  normalizePaymentSettings,
  uploadPaymentImage,
} from "./paymentMethods";
import { asArray } from "./adapters";

export const PAYMENT_METHOD_DELETE_SUPPORTED = true;
export const PAYMENT_METHOD_STANDALONE_ROUTES_SUPPORTED = false;

function withSortedMethods(group = {}) {
  return {
    ...group,
    methods: asArray(group.methods)
      .map((method, index) => ({ ...method, sortOrder: method.sortOrder ?? index }))
      .sort((a, b) => a.sortOrder - b.sortOrder),
  };
}

function normalizeGroups(groups = []) {
  return asArray(groups)
    .map((group, index) => ({
      ...group,
      sortOrder: group.sortOrder ?? index,
      methods: asArray(group.methods),
    }))
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(withSortedMethods);
}

async function uploadGroupImages(token, groups = []) {
  const nextGroups = [];

  for (const group of groups) {
    const groupImage = await uploadPaymentImage(token, group.imageFile);
    const methods = [];

    for (const method of asArray(group.methods)) {
      const methodImage = await uploadPaymentImage(token, method.imageFile);
      methods.push({
        ...method,
        image: methodImage || method.image || "",
        imageFile: undefined,
      });
    }

    nextGroups.push({
      ...group,
      image: groupImage || group.image || "",
      imageFile: undefined,
      methods,
    });
  }

  return nextGroups;
}

async function savePaymentGroups(token, groups = []) {
  const uploaded = await uploadGroupImages(token, normalizeGroups(groups));
  const settingGroups = uploaded.map(buildPaymentGroupSetting);
  const response = await updateAdminSetting(token, ADMIN_SETTING_KEYS.paymentGroups, settingGroups);

  return {
    groups: normalizePaymentSettings({ paymentGroups: response.setting.value || settingGroups }).groups,
    message: response.message,
    setting: response.setting,
  };
}

function getPaymentSettingsFromSettings(settingsByKey = {}) {
  return normalizePaymentSettings({
    countryAccounts: settingsByKey[ADMIN_SETTING_KEYS.paymentCountryAccounts]?.value || [],
    instructions: settingsByKey[ADMIN_SETTING_KEYS.paymentInstructions]?.value || "",
    paymentGroups: settingsByKey[ADMIN_SETTING_KEYS.paymentGroups]?.value || [],
    whatsappNumber: settingsByKey[ADMIN_SETTING_KEYS.whatsappNumber]?.value || "",
  });
}

export async function getAdminPaymentMethods(token) {
  const response = await getAdminSettings(token);
  const settings = getPaymentSettingsFromSettings(response.settingsByKey);

  return {
    groups: settings.groups,
    methods: settings.methods,
    message: response.message,
    settings,
    settingsByKey: response.settingsByKey,
  };
}

export async function createAdminPaymentGroup(token, groups = [], values = {}) {
  const group = {
    ...values,
    id: values.id || generatePaymentSettingId("pay"),
    methods: [],
  };

  return savePaymentGroups(token, [...groups, group]);
}

export async function updateAdminPaymentGroup(token, groups = [], groupId, values = {}) {
  return savePaymentGroups(
    token,
    groups.map((group) => (String(group.id) === String(groupId) ? { ...group, ...values, id: group.id } : group)),
  );
}

export async function setAdminPaymentGroupActive(token, groups = [], groupId, isActive) {
  return updateAdminPaymentGroup(token, groups, groupId, { isActive, active: isActive });
}

export async function deleteAdminPaymentGroup(token, groups = [], groupId) {
  return savePaymentGroups(token, groups.filter((group) => String(group.id) !== String(groupId)));
}

export async function createAdminPaymentMethod(token, groups = [], values = {}) {
  const method = buildPaymentMethodSetting({
    ...values,
    id: values.id || generatePaymentSettingId("pm"),
  });
  method.imageFile = values.imageFile;

  return savePaymentGroups(
    token,
    groups.map((group) => {
      if (String(group.id) !== String(values.groupId)) return group;
      return { ...group, methods: [...asArray(group.methods), method] };
    }),
  );
}

export async function updateAdminPaymentMethod(token, groups = [], methodId, values = {}) {
  let updatedMethod = null;
  const groupsWithoutMethod = groups.map((group) => ({
    ...group,
    methods: asArray(group.methods).filter((method) => {
      const matches = String(method.id) === String(methodId);
      if (matches) {
        updatedMethod = {
          ...method,
          ...values,
          id: method.id,
          imageFile: values.imageFile,
        };
      }
      return !matches;
    }),
  }));

  if (!updatedMethod) {
    return savePaymentGroups(token, groupsWithoutMethod);
  }

  const targetGroupId = values.groupId || updatedMethod.groupId;
  return savePaymentGroups(
    token,
    groupsWithoutMethod.map((group) => (
      String(group.id) === String(targetGroupId)
        ? { ...group, methods: [...asArray(group.methods), updatedMethod] }
        : group
    )),
  );
}

export async function setAdminPaymentMethodActive(token, groups = [], methodId, isActive) {
  return updateAdminPaymentMethod(token, groups, methodId, { isActive, active: isActive });
}

export async function deleteAdminPaymentMethod(token, groups = [], methodId) {
  return savePaymentGroups(
    token,
    groups.map((group) => ({
      ...group,
      methods: asArray(group.methods).filter((method) => String(method.id) !== String(methodId)),
    })),
  );
}

export async function updatePaymentInstructions(token, value) {
  return updateAdminSetting(token, ADMIN_SETTING_KEYS.paymentInstructions, value || "");
}

export async function updatePaymentWhatsappNumber(token, value) {
  return updateAdminSetting(token, ADMIN_SETTING_KEYS.whatsappNumber, value || "");
}
