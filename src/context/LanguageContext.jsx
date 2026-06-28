import { createContext, useContext, useEffect, useMemo, useState } from "react";

const languageStorageKey = "winnie-language";
const legacyPublicLanguageKey = "winnie-public-language";
const LanguageContext = createContext(null);

function getStoredLanguage() {
  if (typeof window === "undefined") return "ar";

  try {
    const stored = window.localStorage.getItem(languageStorageKey) || window.localStorage.getItem(legacyPublicLanguageKey);
    return stored === "en" || stored === "EN" ? "en" : "ar";
  } catch {
    return "ar";
  }
}

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(getStoredLanguage);

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = "ltr";

    try {
      window.localStorage.setItem(languageStorageKey, language);
      window.localStorage.setItem(legacyPublicLanguageKey, language);
    } catch {
      // Language switching should keep working even if storage is unavailable.
    }

    window.dispatchEvent(new CustomEvent("winnie-language-change", { detail: { language } }));
    window.dispatchEvent(new CustomEvent("winnie-public-language-change", { detail: { language } }));
  }, [language]);

  const value = useMemo(
    () => ({
      language,
      isArabic: language === "ar",
      setLanguage,
      toggleLanguage: () => setLanguage((value) => (value === "ar" ? "en" : "ar")),
    }),
    [language],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }

  return context;
}
