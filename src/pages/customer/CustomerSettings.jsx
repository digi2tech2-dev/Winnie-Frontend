import { useEffect, useState } from "react";
import { getPublicCurrencies, updateMyCurrency, USER_CURRENCY_UPDATE_SUPPORTED } from "../../api/currencies";
import SettingsPage from "../SettingsPage";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import { useTheme } from "../../context/ThemeContext";
import { useToast } from "../../components/ToastProvider";

export default function CustomerSettings() {
  const { refreshCurrentUser, token, user } = useAuth();
  const { theme, setTheme } = useTheme();
  const { language, setLanguage } = useLanguage();
  const { showToast } = useToast();
  const [currencyOptions, setCurrencyOptions] = useState([]);
  const [currencyError, setCurrencyError] = useState("");
  const [currenciesLoading, setCurrenciesLoading] = useState(true);
  const [selectedCurrency, setSelectedCurrency] = useState("");
  const [savingCurrency, setSavingCurrency] = useState(false);
  const currency = String(user?.currency || "USD").toUpperCase();

  useEffect(() => {
    setSelectedCurrency(currency);
  }, [currency]);

  useEffect(() => {
    let cancelled = false;

    const loadCurrencies = async () => {
      setCurrenciesLoading(true);
      setCurrencyError("");

      try {
        const result = await getPublicCurrencies();
        if (!cancelled) {
          setCurrencyOptions(result.currencies.map((item) => item.code).filter(Boolean));
        }
      } catch (requestError) {
        if (!cancelled) {
          setCurrencyOptions([]);
          setCurrencyError(requestError.userMessage || "Unable to load supported currencies.");
        }
      } finally {
        if (!cancelled) setCurrenciesLoading(false);
      }
    };

    void loadCurrencies();

    return () => {
      cancelled = true;
    };
  }, [currency]);

  const save = async ({ preferences }) => {
    localStorage.setItem("winnie-user-preferences", JSON.stringify(preferences));

    if (selectedCurrency === currency) {
      return {
        title: "Currency unchanged",
        message: "Choose a different active currency before saving.",
      };
    }

    setSavingCurrency(true);

    try {
      const result = await updateMyCurrency(selectedCurrency, token);
      const refreshResult = await refreshCurrentUser(token);

      if (!refreshResult.ok) {
        throw new Error(refreshResult.message || "Currency was saved, but the session could not be refreshed.");
      }

      return {
        title: "Currency updated",
        message: result.message || `Currency updated to ${result.currency}.`,
      };
    } finally {
      setSavingCurrency(false);
    }
  };

  const handleCurrencyChange = (nextCurrency) => {
    const code = String(nextCurrency || "").trim().toUpperCase();

    if (!USER_CURRENCY_UPDATE_SUPPORTED) {
      showToast({
        type: "info",
        title: "Currency is backend-controlled",
        message: "A self-service currency update route is not available yet.",
      });
      return;
    }

    if (!currencyOptions.includes(code)) {
      showToast({
        type: "error",
        title: "Unsupported currency",
        message: "Choose one of the active currencies loaded from the backend.",
      });
      return;
    }

    setSelectedCurrency(code);
  };

  const currencyDisabled = !USER_CURRENCY_UPDATE_SUPPORTED || currenciesLoading || savingCurrency || currencyOptions.length === 0;
  const saveDisabled = currencyDisabled || selectedCurrency === currency;
  const visibleCurrencyOptions = currencyOptions.length ? currencyOptions : [currency];
  const currencyNote = currencyError
    || (currenciesLoading
      ? "Loading active currencies..."
      : currencyOptions.length === 0
        ? "No active currencies are available for self-service updates."
        : selectedCurrency === currency
          ? "Select a different active currency to enable saving."
          : "Currency will be saved through the backend and your session will be refreshed.");

  return (
    <SettingsPage
      theme={theme}
      language={language}
      currency={selectedCurrency || currency}
      currencyDisabled={currencyDisabled}
      currencyNote={currencyNote}
      currencyOptions={visibleCurrencyOptions}
      isSaving={savingCurrency}
      onCurrencyChange={handleCurrencyChange}
      onLanguageChange={setLanguage}
      onSave={save}
      saveDisabled={saveDisabled}
      onThemeChange={setTheme}
    />
  );
}
