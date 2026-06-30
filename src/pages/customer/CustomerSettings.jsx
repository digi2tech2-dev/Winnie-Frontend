import { useEffect, useState } from "react";
import { getPublicCurrencies } from "../../api/currencies";
import SettingsPage from "../SettingsPage";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import { useTheme } from "../../context/ThemeContext";
import { useToast } from "../../components/ToastProvider";

export default function CustomerSettings() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const { language, setLanguage } = useLanguage();
  const { showToast } = useToast();
  const [currencyOptions, setCurrencyOptions] = useState([]);
  const [currencyError, setCurrencyError] = useState("");
  const currency = String(user?.currency || "USD").toUpperCase();

  useEffect(() => {
    let cancelled = false;

    const loadCurrencies = async () => {
      setCurrencyError("");

      try {
        const result = await getPublicCurrencies();
        if (!cancelled) setCurrencyOptions(result.currencies.map((item) => item.code).filter(Boolean));
      } catch (requestError) {
        if (!cancelled) {
          setCurrencyOptions([currency]);
          setCurrencyError(requestError.userMessage || "Unable to load supported currencies.");
        }
      }
    };

    void loadCurrencies();

    return () => {
      cancelled = true;
    };
  }, [currency]);

  const save = ({ preferences }) => {
    localStorage.setItem("winnie-user-preferences", JSON.stringify(preferences));
  };

  const handleCurrencyChange = () => {
    showToast({
      type: "info",
      title: "Currency is backend-controlled",
      message: "A self-service currency update route is not available yet.",
    });
  };

  return (
    <SettingsPage
      theme={theme}
      language={language}
      currency={currency}
      currencyDisabled
      currencyNote={currencyError || "Currency selection is read-only until a safe profile currency update route exists."}
      currencyOptions={currencyOptions.length ? currencyOptions : [currency]}
      onCurrencyChange={handleCurrencyChange}
      onLanguageChange={setLanguage}
      onSave={save}
      onThemeChange={setTheme}
    />
  );
}
