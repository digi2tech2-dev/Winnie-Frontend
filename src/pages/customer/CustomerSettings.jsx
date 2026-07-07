import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
import { getPublicCurrencies, updateMyCurrency, USER_CURRENCY_UPDATE_SUPPORTED } from "../../api/currencies";
import SettingsPage from "../SettingsPage";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import { useTheme } from "../../context/ThemeContext";
import { useToast } from "../../components/ToastProvider";

export default function CustomerSettings() {
  const location = useLocation();
  const { refreshCurrentUser, token, user } = useAuth();
  const { theme, setTheme } = useTheme();
  const { language, setLanguage } = useLanguage();
  const { showToast } = useToast();
  const { t } = useTranslation("settings");
  const [currencyOptions, setCurrencyOptions] = useState([]);
  const [currencyError, setCurrencyError] = useState("");
  const [currenciesLoading, setCurrenciesLoading] = useState(true);
  const [selectedCurrency, setSelectedCurrency] = useState("");
  const [savingCurrency, setSavingCurrency] = useState(false);
  const currency = String(user?.currency || "USD").toUpperCase();
  const isAdminArea = location.pathname.startsWith("/admin/");

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
          setCurrencyError(requestError.userMessage || t("currenciesLoadError"));
        }
      } finally {
        if (!cancelled) setCurrenciesLoading(false);
      }
    };

    void loadCurrencies();

    return () => {
      cancelled = true;
    };
  }, [currency, t]);

  const save = async () => {
    if (selectedCurrency === currency) {
      return undefined;
    }

    setSavingCurrency(true);

    try {
      const result = await updateMyCurrency(selectedCurrency, token);
      const refreshResult = await refreshCurrentUser(token);

      if (!refreshResult.ok) {
        throw new Error(refreshResult.message || t("currencySavedRefreshFailed"));
      }

      return {
        title: t("currencyUpdatedTitle"),
        message: result.message || t("currencyUpdatedMessage", { currency: result.currency }),
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
        title: t("controlledCurrencyTitle"),
        message: t("controlledCurrencyMessage"),
      });
      return;
    }

    if (!currencyOptions.includes(code)) {
      showToast({
        type: "error",
        title: t("unsupportedCurrencyTitle"),
        message: t("unsupportedCurrencyMessage"),
      });
      return;
    }

    setSelectedCurrency(code);
  };

  const currencyDisabled = !USER_CURRENCY_UPDATE_SUPPORTED || currenciesLoading || savingCurrency || currencyOptions.length === 0;
  const saveDisabled = savingCurrency;
  const visibleCurrencyOptions = currencyOptions.length ? currencyOptions : [currency];
  const currencyNote = currencyError
    || (currenciesLoading
      ? t("loadingCurrencies")
      : currencyOptions.length === 0
        ? t("noCurrencies")
        : selectedCurrency === currency
          ? t("selectDifferentCurrency")
          : t("currencyBackendNote"));

  return (
    <SettingsPage
      theme={theme}
      language={language}
      currency={selectedCurrency || currency}
      currencyDisabled={currencyDisabled}
      currencyNote={currencyNote}
      currencyOptions={visibleCurrencyOptions}
      isSaving={savingCurrency}
      languageLocked={isAdminArea}
      onCurrencyChange={handleCurrencyChange}
      onLanguageChange={setLanguage}
      onSave={save}
      saveDisabled={saveDisabled}
      onThemeChange={setTheme}
    />
  );
}
