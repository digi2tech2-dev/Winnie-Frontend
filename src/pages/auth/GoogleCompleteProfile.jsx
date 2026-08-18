import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Coins, Globe2, MailCheck, UserRound } from "lucide-react";
import { FlagImage, PhoneInput, defaultCountries, parseCountry } from "react-international-phone";
import "react-international-phone/style.css";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { completeGoogleProfile as completeGoogleProfileRequest } from "../../api/auth";
import { getPublicCurrencies } from "../../api/currencies";
import { validateReferralCode } from "../../api/referrals";
import { useToast } from "../../components/ToastProvider";
import { useAuth } from "../../context/AuthContext";
import { getDefaultRouteForRole } from "../../utils/authRoles";
import { markGoogleProfileCompleted } from "../../utils/googleOnboarding";
const REFERRAL_STORAGE_KEY = "winnie-referral-code";

const allCountries = defaultCountries.map(parseCountry).sort((first, second) => first.name.localeCompare(second.name));
const countryAliases = {
  "الولايات المتحدة": "United States",
  مصر: "Egypt",
  السعودية: "Saudi Arabia",
  الإمارات: "United Arab Emirates",
  الكويت: "Kuwait",
  قطر: "Qatar",
};
const countryNames = typeof Intl.DisplayNames === "function"
  ? new Intl.DisplayNames(["ar"], { type: "region" })
  : null;

function getCountryOption(value) {
  const normalized = countryAliases[String(value || "").trim()] || String(value || "").trim();
  return allCountries.find((country) => country.name.toLowerCase() === normalized.toLowerCase() || country.iso2 === normalized.toLowerCase())
    || allCountries.find((country) => country.iso2 === "us");
}

function getCountryLabel(country) {
  return countryNames?.of(country.iso2.toUpperCase()) || country.name;
}

function initialCountry(value) {
  return getCountryOption(value)?.name || "United States";
}

function hasSubscriberNumber(phone) {
  return String(phone || "").replace(/\D/g, "").length > 4;
}

function readStoredReferralCode() {
  try {
    return String(sessionStorage.getItem(REFERRAL_STORAGE_KEY) || "").trim();
  } catch {
    return "";
  }
}

function clearStoredReferralCode() {
  try {
    sessionStorage.removeItem(REFERRAL_STORAGE_KEY);
  } catch {
    // Ignore storage failures.
  }
}

export default function GoogleCompleteProfile() {
  const { t } = useTranslation("auth");
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { isAuthenticated, isLoading: authLoading, refreshCurrentUser, token, user } = useAuth();
  const storedInviteCode = readStoredReferralCode();
  const [details, setDetails] = useState(() => ({
    country: initialCountry(user?.country),
    currency: String(user?.currency || "").toUpperCase(),
    phone: "",
    inviteCode: storedInviteCode,
  }));
  const [currencies, setCurrencies] = useState([]);
  const [currenciesLoading, setCurrenciesLoading] = useState(true);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const currencyCodes = useMemo(() => currencies.map((currency) => currency.code), [currencies]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) navigate("/login", { replace: true });
  }, [authLoading, isAuthenticated, navigate]);

  useEffect(() => {
    let cancelled = false;

    const loadCurrencies = async () => {
      try {
        const result = await getPublicCurrencies();
        if (cancelled) return;
        const active = result.currencies.filter((currency) => currency.code && currency.isActive !== false);
        setCurrencies(active);
        setDetails((current) => ({
          ...current,
          currency: active.some((currency) => currency.code === current.currency)
            ? current.currency
            : active.find((currency) => currency.code === "USD")?.code || active[0]?.code || "",
        }));
        if (!active.length) setFormError(t("register.currenciesUnavailable"));
      } catch (error) {
        if (!cancelled) setFormError(error.userMessage || t("register.currenciesLoadError"));
      } finally {
        if (!cancelled) setCurrenciesLoading(false);
      }
    };

    void loadCurrencies();
    return () => {
      cancelled = true;
    };
  }, [t]);

  const updateDetails = (key, value) => {
    setDetails((current) => ({ ...current, [key]: value }));
    setFormError("");
    setFieldErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  };

  const completeProfile = async (event) => {
    event.preventDefault();
    const nextErrors = {};
    if (!details.country) nextErrors.country = t("register.countryRequired");
    if (!details.currency) nextErrors.currency = t("register.currencyRequired");
    if (Object.keys(nextErrors).length) {
      setFieldErrors(nextErrors);
      setFormError(t("register.missingDataMessage"));
      return;
    }

    setSaving(true);
    setFormError("");
    try {
      const inviteCode = details.inviteCode.trim();
      if (inviteCode) {
        const validation = await validateReferralCode(inviteCode, { email: user?.email });
        if (!validation.result.valid) {
          setFieldErrors({ inviteCode: validation.result.reason || t("googleComplete.invalidInviteCode") });
          setSaving(false);
          return;
        }
      }

      await completeGoogleProfileRequest(token, {
        country: details.country,
        currency: details.currency,
        phone: hasSubscriberNumber(details.phone) ? details.phone : undefined,
        inviteCode: inviteCode || undefined,
      });
      const refreshed = await refreshCurrentUser();
      if (!refreshed.ok) throw new Error(refreshed.message);

      markGoogleProfileCompleted(refreshed.user || user);
      clearStoredReferralCode();
      showToast({
        type: "success",
        title: t("googleComplete.successTitle"),
        message: t("googleComplete.successMessage"),
      });
      navigate(getDefaultRouteForRole(refreshed.user?.role || user?.role), { replace: true });
    } catch (error) {
      const errors = error.fieldErrors || error.details?.fieldErrors || {};
      setFieldErrors(errors.referralCode && !errors.inviteCode ? { ...errors, inviteCode: errors.referralCode } : errors);
      setFormError(error.userMessage || error.message || t("googleComplete.failureMessage"));
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || !isAuthenticated) return null;

  return (
    <div className="mx-auto grid min-h-[calc(100vh-92px)] max-w-[1320px] place-items-center px-4 py-8">
      <div className="w-full max-w-[580px] rounded-[28px] bg-[linear-gradient(135deg,#22D3EE_0%,#2563EB_18%,#7C3AED_36%,#EC4899_55%,#F97316_72%,#22C55E_100%)] p-px shadow-[0_28px_85px_rgba(37,99,235,0.20)]">
        <div className="relative overflow-hidden rounded-[27px] border border-white/70 bg-[linear-gradient(145deg,rgba(255,255,255,0.98),rgba(239,246,255,0.96)_42%,rgba(250,245,255,0.95))] p-5 text-slate-950 dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(5,12,28,0.98),rgba(15,23,42,0.96)_45%,rgba(45,18,67,0.94))] dark:text-white sm:p-8">
          <span className="pointer-events-none absolute inset-x-0 top-0 h-1.5 bg-[linear-gradient(90deg,#22D3EE,#2563EB,#7C3AED,#EC4899,#F97316,#22C55E)]" />

          <div className="text-center">
            <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl border border-white/75 bg-white shadow-[0_18px_40px_rgba(15,23,42,0.12)] dark:border-white/10 dark:bg-white/10">
              <img src="/logo.png" alt="Winnie HUB" className="h-12 w-12 object-contain" />
            </span>
            <span className="mx-auto mt-3 grid h-10 w-10 place-items-center rounded-full bg-[linear-gradient(135deg,#2563EB,#7C3AED,#EC4899)] text-white shadow-[0_14px_30px_rgba(124,58,237,0.28)]">
              <UserRound className="h-5 w-5" />
            </span>
            <h1 className="mt-4 text-3xl font-black">{t("register.stepDetailsTitle")}</h1>
            <p className="mt-2 text-sm font-bold text-slate-500 dark:text-slate-300">
              {t("register.registeredEmail")} <span dir="ltr" className="font-black text-royal dark:text-pulse">{user?.email}</span>
            </p>
          </div>

          {formError && (
            <p className="mt-5 rounded-2xl border border-rose-500/25 bg-rose-500/10 p-3 text-sm font-bold text-rose-500">{formError}</p>
          )}

          <form className="mt-8 space-y-5" onSubmit={completeProfile} noValidate>
            <CountrySelectField label={t("register.country")} value={details.country} error={fieldErrors.country} onChange={(value) => updateDetails("country", value)} />
            <SelectField icon={Coins} label={t("register.currency")} value={details.currency} error={fieldErrors.currency} options={currencyCodes} onChange={(value) => updateDetails("currency", value)} />
            <PhoneField label={t("register.phone")} defaultCountry={getCountryOption(details.country)?.iso2 || "eg"} value={details.phone} error={fieldErrors.phone} onChange={(value) => updateDetails("phone", value)} />
            <Field icon={MailCheck} label={t("register.inviteCode")} value={details.inviteCode} error={fieldErrors.inviteCode} onChange={(value) => updateDetails("inviteCode", value)} />

            <button type="submit" disabled={saving || currenciesLoading || !currencyCodes.length} className="interactive-ring h-[52px] min-h-[52px] w-full rounded-2xl bg-[linear-gradient(135deg,#2563EB,#7C3AED_45%,#EC4899)] text-sm font-black text-white shadow-[0_18px_42px_rgba(124,58,237,0.32)] transition hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-70">
              {saving ? t("googleComplete.saving") : t("googleComplete.enter")}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function Field({ icon: Icon, label, value, onChange, error }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-black text-slate-600 dark:text-slate-300">{label}</span>
      <span className="relative block">
        <Icon className={`pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 ${error ? "text-rose-500" : "text-slate-400"}`} />
        <input value={value} onChange={(event) => onChange(event.target.value)} aria-invalid={Boolean(error)} className={`h-[54px] w-full rounded-2xl border bg-white/80 px-4 pr-12 text-right font-bold outline-none transition focus:ring-4 dark:bg-white/[0.075] dark:text-white ${error ? "border-rose-400 focus:ring-rose-500/15" : "border-white/80 focus:border-pulse focus:ring-pulse/15 dark:border-white/10"}`} />
      </span>
      {error && <span className="mt-2 block text-right text-xs font-black text-rose-500">{error}</span>}
    </label>
  );
}

function CountrySelectField({ label, value, onChange, error }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const selectedCountry = getCountryOption(value);
  const normalizedSearch = search.trim().toLocaleLowerCase("ar");
  const visibleCountries = useMemo(() => allCountries.filter((country) => {
    if (!normalizedSearch) return true;
    return `${country.name} ${country.iso2} ${country.dialCode} ${getCountryLabel(country)}`.toLocaleLowerCase("ar").includes(normalizedSearch);
  }), [normalizedSearch]);

  const close = () => {
    setIsOpen(false);
    setSearch("");
  };

  return (
    <div className="block">
      <span className="mb-2 block text-sm font-black text-slate-600 dark:text-slate-300">{label}</span>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        className={`flex h-[54px] w-full items-center gap-3 rounded-2xl border bg-white/80 px-4 text-right font-bold outline-none transition hover:border-pulse focus:ring-4 dark:bg-[#172033] dark:text-white ${error ? "border-rose-400 focus:ring-rose-500/15" : "border-white/80 focus:ring-pulse/15 dark:border-white/10"}`}
      >
        <span className="grid h-8 w-10 shrink-0 place-items-center rounded-xl bg-slate-100 dark:bg-white/10">
          <FlagImage iso2={selectedCountry?.iso2} size={24} />
        </span>
        <span className="min-w-0 flex-1 truncate">{selectedCountry ? getCountryLabel(selectedCountry) : "-"}</span>
        <Globe2 className="h-5 w-5 shrink-0 text-slate-400" />
      </button>
      {error && <span className="mt-2 block text-right text-xs font-black text-rose-500">{error}</span>}

      {isOpen && createPortal(
        <div className="fixed inset-0 z-[2600] flex items-end bg-slate-950/55 p-3 backdrop-blur-sm sm:items-center sm:justify-center" onMouseDown={(event) => event.target === event.currentTarget && close()}>
          <section role="dialog" aria-modal="true" aria-label={label} className="flex max-h-[min(82dvh,42rem)] w-full max-w-[34rem] flex-col overflow-hidden rounded-[26px] border border-violet-200 bg-white shadow-2xl dark:border-violet-400/25 dark:bg-[#10192b]" onMouseDown={(event) => event.stopPropagation()}>
            <header className="flex items-center gap-3 border-b border-slate-100 p-4 dark:border-white/10">
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-violet-500/10 text-violet-600 dark:text-violet-300"><Globe2 className="h-5 w-5" /></span>
              <div className="min-w-0 flex-1">
                <h2 className="font-black text-slate-950 dark:text-white">اختر الدولة</h2>
                <p className="mt-0.5 text-xs font-bold text-slate-500 dark:text-slate-400">جميع الدول متاحة مع علم الدولة ومفتاح الاتصال.</p>
              </div>
              <button type="button" onClick={close} className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5" aria-label="إغلاق">
                <span className="text-xl leading-none">×</span>
              </button>
            </header>
            <div className="border-b border-slate-100 p-3 dark:border-white/10">
              <label className="relative block">
                <span className="sr-only">ابحث عن دولة</span>
                <input autoFocus value={search} onChange={(event) => setSearch(event.target.value)} placeholder="ابحث عن دولة أو مفتاح الاتصال" className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-950 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10 dark:border-white/10 dark:bg-[#091321] dark:text-white" />
              </label>
            </div>
            <div className="min-h-0 overflow-y-auto p-2">
              {visibleCountries.map((country) => {
                const selected = country.iso2 === selectedCountry?.iso2;
                return (
                  <button
                    key={country.iso2}
                    type="button"
                    onClick={() => {
                      onChange(country.name);
                      close();
                    }}
                    className={`flex min-h-12 w-full items-center gap-3 rounded-xl px-3 text-right transition ${selected ? "bg-violet-100 text-violet-800 dark:bg-violet-500/20 dark:text-violet-100" : "text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-white/[0.06]"}`}
                  >
                    <FlagImage iso2={country.iso2} size={25} />
                    <span className="min-w-0 flex-1 truncate text-sm font-black">{getCountryLabel(country)}</span>
                    <span dir="ltr" className="text-xs font-black text-violet-600 dark:text-violet-300">+{country.dialCode}</span>
                  </button>
                );
              })}
              {!visibleCountries.length && <p className="p-5 text-center text-sm font-bold text-slate-500 dark:text-slate-400">لا توجد دولة مطابقة.</p>}
            </div>
          </section>
        </div>,
        document.body,
      )}
    </div>
  );
}

function PhoneField({ label, defaultCountry = "eg", value, onChange, error }) {
  const [countryPickerKey, setCountryPickerKey] = useState(0);

  const handlePhoneChange = (phone, meta) => {
    onChange(phone);
    if (phone === `+${meta.country.dialCode}`) setCountryPickerKey((current) => current + 1);
  };

  return (
    <div className="block">
      <span className="mb-2 block text-sm font-black text-slate-600 dark:text-slate-300">{label}</span>
      <div onClickCapture={(event) => {
        if (event.target.closest(".react-international-phone-country-selector-button")) event.preventDefault();
      }}>
        <PhoneInput
          key={countryPickerKey}
          defaultCountry={defaultCountry}
          preferredCountries={["eg", "sa", "ae", "kw", "qa", "us"]}
          value={value}
          onChange={handlePhoneChange}
          forceDialCode
          inputProps={{ dir: "ltr", inputMode: "tel", autoComplete: "tel", "aria-label": label, "aria-invalid": Boolean(error) }}
          className="international-phone-field w-full [--react-international-phone-border-radius:1rem] [--react-international-phone-height:3.375rem]"
          inputClassName={`!h-[54px] !min-w-0 !flex-1 !rounded-l-2xl !border !bg-white/80 !px-4 !text-left !font-bold !text-slate-950 focus:!ring-4 dark:!bg-white/[0.075] dark:!text-white ${error ? "!border-rose-400 focus:!ring-rose-500/15" : "!border-white/80 focus:!border-pulse focus:!ring-pulse/15 dark:!border-white/10"}`}
          countrySelectorStyleProps={{
            buttonClassName: `!h-[54px] !rounded-r-2xl !border !px-2 ${error ? "!border-rose-400 !bg-rose-50 dark:!bg-rose-500/10" : "!border-white/80 !bg-slate-50 dark:!border-white/10 dark:!bg-white/10"}`,
            flagClassName: "!h-6 !w-6",
            dropdownArrowClassName: "!border-t-slate-500 dark:!border-t-slate-300",
            dropdownStyleProps: {
              className: "!z-[1000] !max-h-[min(60vh,30rem)] !w-[calc(100vw-2rem)] !rounded-2xl !border !border-violet-200 !bg-white !py-1 !shadow-2xl sm:!w-[19rem] dark:!border-violet-400/25 dark:!bg-[#11182B] dark:!text-white",
              listItemClassName: "!min-h-10 !px-3 hover:!bg-violet-50 dark:hover:!bg-violet-500/15",
              listItemCountryNameClassName: "!text-sm !font-semibold",
              listItemDialCodeClassName: "!font-bold !text-violet-600 dark:!text-violet-300",
              listItemSelectedClassName: "!bg-violet-100 dark:!bg-violet-500/20",
              listItemFocusedClassName: "!bg-violet-100 dark:!bg-violet-500/20",
            },
          }}
        />
      </div>
      {error && <span className="mt-2 block text-right text-xs font-black text-rose-500">{error}</span>}
    </div>
  );
}

function SelectField({ icon: Icon, label, value, options, onChange, error, getOptionLabel }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-black text-slate-600 dark:text-slate-300">{label}</span>
      <span className="relative block">
        <Icon className={`pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 ${error ? "text-rose-500" : "text-slate-400"}`} />
        <select value={value} onChange={(event) => onChange(event.target.value)} disabled={!options.length} aria-invalid={Boolean(error)} className={`h-[54px] w-full rounded-2xl border bg-white/80 px-4 pr-12 text-right font-bold outline-none transition focus:ring-4 dark:bg-[#172033] dark:text-white ${error ? "border-rose-400 focus:ring-rose-500/15" : "border-white/80 focus:border-pulse focus:ring-pulse/15 dark:border-white/10"}`}>
          {!options.length && <option value="">-</option>}
          {options.map((option) => <option key={option} value={option}>{getOptionLabel?.(option) || option}</option>)}
        </select>
      </span>
      {error && <span className="mt-2 block text-right text-xs font-black text-rose-500">{error}</span>}
    </label>
  );
}
