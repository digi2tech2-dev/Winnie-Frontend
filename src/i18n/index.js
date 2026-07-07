import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import arAbout from "./ar/about.json";
import arAuth from "./ar/auth.json";
import arCheckout from "./ar/checkout.json";
import arCommon from "./ar/common.json";
import arHome from "./ar/home.json";
import arNotifications from "./ar/notifications.json";
import arOrders from "./ar/orders.json";
import arPolicies from "./ar/policies.json";
import arProducts from "./ar/products.json";
import arProfile from "./ar/profile.json";
import arSettings from "./ar/settings.json";
import arSubAgent from "./ar/subAgent.json";
import arWallet from "./ar/wallet.json";

import enAbout from "./en/about.json";
import enAuth from "./en/auth.json";
import enCheckout from "./en/checkout.json";
import enCommon from "./en/common.json";
import enHome from "./en/home.json";
import enNotifications from "./en/notifications.json";
import enOrders from "./en/orders.json";
import enPolicies from "./en/policies.json";
import enProducts from "./en/products.json";
import enProfile from "./en/profile.json";
import enSettings from "./en/settings.json";
import enSubAgent from "./en/subAgent.json";
import enWallet from "./en/wallet.json";

const languageStorageKey = "winnie-language";
const legacyPublicLanguageKey = "winnie-public-language";

function getInitialLanguage() {
  if (typeof window === "undefined") return "ar";

  try {
    const stored = window.localStorage.getItem(languageStorageKey) || window.localStorage.getItem(legacyPublicLanguageKey);
    return stored === "en" || stored === "EN" ? "en" : "ar";
  } catch {
    return "ar";
  }
}

i18n.use(initReactI18next).init({
  fallbackLng: "ar",
  lng: getInitialLanguage(),
  ns: [
    "common",
    "home",
    "products",
    "auth",
    "profile",
    "orders",
    "wallet",
    "checkout",
    "settings",
    "notifications",
    "subAgent",
    "about",
    "policies",
  ],
  defaultNS: "common",
  interpolation: {
    escapeValue: false,
  },
  resources: {
    ar: {
      about: arAbout,
      auth: arAuth,
      checkout: arCheckout,
      common: arCommon,
      home: arHome,
      notifications: arNotifications,
      orders: arOrders,
      policies: arPolicies,
      products: arProducts,
      profile: arProfile,
      settings: arSettings,
      subAgent: arSubAgent,
      wallet: arWallet,
    },
    en: {
      about: enAbout,
      auth: enAuth,
      checkout: enCheckout,
      common: enCommon,
      home: enHome,
      notifications: enNotifications,
      orders: enOrders,
      policies: enPolicies,
      products: enProducts,
      profile: enProfile,
      settings: enSettings,
      subAgent: enSubAgent,
      wallet: enWallet,
    },
  },
});

export default i18n;
