import { useEffect, useMemo, useState } from "react";
import { Coins, Globe2, MailCheck, Phone, UserRound } from "lucide-react";
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

const countries = ["الولايات المتحدة", "مصر", "السعودية", "الإمارات", "الكويت", "قطر"];
const countryDialCodes = {
  "الولايات المتحدة": "+1",
  مصر: "+20",
  السعودية: "+966",
  الإمارات: "+971",
  الكويت: "+965",
  قطر: "+974",
};
const countryLabelKeys = {
  "الولايات المتحدة": "United States",
  مصر: "Egypt",
  السعودية: "Saudi Arabia",
  الإمارات: "United Arab Emirates",
  الكويت: "Kuwait",
  قطر: "Qatar",
};

function initialCountry(value) {
  const normalized = String(value || "").trim();
  if (countries.includes(normalized)) return normalized;
  const match = Object.entries(countryLabelKeys).find(([, label]) => label.toLowerCase() === normalized.toLowerCase());
  return match?.[0] || countries[0];
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
  const selectedDialCode = countryDialCodes[details.country] || "";
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
            : active.find((currency) => currency.code === "AED")?.code || active[0]?.code || "",
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
        phone: details.phone ? `${selectedDialCode}${details.phone}` : undefined,
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
              <img src="/logo.png" alt="Winnie Fun" className="h-12 w-12 object-contain" />
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
            <SelectField icon={Globe2} label={t("register.country")} value={details.country} error={fieldErrors.country} options={countries} getOptionLabel={(value) => t(`register.countries.${countryLabelKeys[value]}`, { defaultValue: value })} onChange={(value) => updateDetails("country", value)} />
            <SelectField icon={Coins} label={t("register.currency")} value={details.currency} error={fieldErrors.currency} options={currencyCodes} onChange={(value) => updateDetails("currency", value)} />
            <PhoneField label={t("register.phone")} countryCode={selectedDialCode} value={details.phone} error={fieldErrors.phone} onChange={(value) => updateDetails("phone", value)} />
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

function PhoneField({ label, countryCode, value, onChange, error }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-black text-slate-600 dark:text-slate-300">{label}</span>
      <span className="relative block">
        <Phone className={`pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 ${error ? "text-rose-500" : "text-slate-400"}`} />
        <input dir="ltr" type="tel" inputMode="numeric" autoComplete="tel-national" value={value} onChange={(event) => onChange(event.target.value.replace(/\D/g, "").slice(0, 14))} aria-invalid={Boolean(error)} className={`h-[54px] w-full rounded-2xl border bg-white/80 px-4 pl-20 pr-12 text-left font-bold outline-none transition focus:ring-4 dark:bg-white/[0.075] dark:text-white ${error ? "border-rose-400 focus:ring-rose-500/15" : "border-white/80 focus:border-pulse focus:ring-pulse/15 dark:border-white/10"}`} />
        <span dir="ltr" className="pointer-events-none absolute left-3 top-1/2 grid h-9 min-w-14 -translate-y-1/2 place-items-center rounded-xl border border-white/80 bg-white px-2 text-sm font-black text-slate-600 shadow-sm dark:border-white/10 dark:bg-white/10 dark:text-slate-200">{countryCode}</span>
      </span>
      {error && <span className="mt-2 block text-right text-xs font-black text-rose-500">{error}</span>}
    </label>
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
