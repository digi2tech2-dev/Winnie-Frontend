import { useState } from "react";
import SettingsPage from "../SettingsPage";
import { useLanguage } from "../../context/LanguageContext";
import { useTheme } from "../../context/ThemeContext";

export default function CustomerSettings() {
  const { theme, setTheme } = useTheme();
  const { language, setLanguage } = useLanguage();
  const [currency, setCurrency] = useState(() => localStorage.getItem("winnie-currency") || "USD");

  const save = () => {
    localStorage.setItem("winnie-currency", currency);
  };

  return (
    <SettingsPage
      theme={theme}
      language={language}
      currency={currency}
      onThemeChange={setTheme}
      onLanguageChange={setLanguage}
      onCurrencyChange={setCurrency}
      onSave={save}
    />
  );
}
