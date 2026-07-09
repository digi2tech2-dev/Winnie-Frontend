import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
import SettingsPage from "../SettingsPage";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import { useTheme } from "../../context/ThemeContext";

export default function CustomerSettings() {
  const location = useLocation();
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const { language, setLanguage } = useLanguage();
  const { t } = useTranslation("settings");
  const currency = String(user?.currency || "USD").toUpperCase();
  const isAdminArea = location.pathname.startsWith("/admin/");

  return (
    <SettingsPage
      theme={theme}
      language={language}
      currency={currency}
      currencyNote={t("adminManagedCurrency")}
      languageLocked={isAdminArea}
      onLanguageChange={setLanguage}
      onThemeChange={setTheme}
    />
  );
}
