import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Coins, Eye, EyeOff, Globe2, Lock, Mail, MailCheck, Phone, UserRound } from "lucide-react";
import GoogleMark from "../../components/GoogleMark";
import PolicyAgreement, { PoliciesModal } from "../../components/PolicyAgreement";
import { useToast } from "../../components/ToastProvider";
import { useAuth } from "../../context/AuthContext";

const countries = ["الولايات المتحدة", "مصر", "السعودية", "الإمارات", "الكويت", "قطر"];
const currencies = ["USD", "EGP", "$", "AED", "KWD", "QAR"];
const countryDialCodes = {
  "الولايات المتحدة": "+1",
  "مصر": "+20",
  "السعودية": "+966",
  "الإمارات": "+971",
  "الكويت": "+965",
  "قطر": "+974",
};
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Register() {
  const [step, setStep] = useState("account");
  const [flow, setFlow] = useState("email");
  const [account, setAccount] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [details, setDetails] = useState({ country: countries[0], currency: currencies[0], phone: "", inviteCode: "" });
  const [acceptedPolicies, setAcceptedPolicies] = useState(true);
  const [policyModalOpen, setPolicyModalOpen] = useState(false);
  const { showToast } = useToast();
  const { loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const selectedDialCode = countryDialCodes[details.country] || "";
  const isGoogleFlow = flow === "google";

  const updateAccount = (key, value) => {
    setAccount((current) => ({ ...current, [key]: value }));
  };

  const updateDetails = (key, value) => {
    setDetails((current) => ({ ...current, [key]: value }));
  };

  const updateCountry = (country) => {
    setDetails((current) => ({ ...current, country }));
  };

  const ensurePolicyAgreement = () => {
    if (acceptedPolicies) return true;

    showToast({
      type: "error",
      title: "الموافقة مطلوبة",
      message: "يجب الموافقة على الشروط والأحكام وسياسات الموقع قبل المتابعة.",
    });
    return false;
  };

  const createAccount = () => {
    if (!ensurePolicyAgreement()) return;

    const normalizedAccount = {
      ...account,
      name: account.name.trim(),
      email: account.email.trim(),
    };

    if (!normalizedAccount.name || !normalizedAccount.email || !normalizedAccount.password || !normalizedAccount.confirmPassword) {
      showToast({ type: "error", title: "بيانات ناقصة", message: "اكتب الاسم والبريد الإلكتروني وكلمة المرور وتأكيدها." });
      return;
    }

    if (!emailPattern.test(normalizedAccount.email)) {
      showToast({ type: "error", title: "البريد الإلكتروني غير صحيح", message: "اكتب بريدًا إلكترونيًا صحيحًا لإنشاء الحساب." });
      return;
    }

    if (normalizedAccount.password.length < 6) {
      showToast({ type: "error", title: "كلمة المرور قصيرة", message: "كلمة المرور لازم تكون 6 أحرف على الأقل." });
      return;
    }

    if (normalizedAccount.password !== normalizedAccount.confirmPassword) {
      showToast({ type: "error", title: "كلمة المرور غير متطابقة", message: "اكتب كلمة المرور بنفس الشكل في خانة التأكيد." });
      return;
    }

    setAccount(normalizedAccount);
    setFlow("email");
    setStep("details");
  };

  const completeDetails = () => {
    if (!details.country || !details.currency) {
      showToast({ type: "error", title: "بيانات ناقصة", message: "اختار الدولة والعملة للمتابعة." });
      return;
    }

    showToast({ type: "success", title: "تم إرسال رابط التأكيد", message: account.email });
    setStep("verify");
  };

  const continueWithGoogle = () => {
    if (!ensurePolicyAgreement()) return;

    setFlow("google");
    setStep("details");
    showToast({ type: "info", title: "متابعة بجوجل", message: "أكمل بيانات الحساب للمتابعة." });
  };

  const completeGoogleDetails = () => {
    if (!details.country || !details.currency) {
      showToast({ type: "error", title: "بيانات ناقصة", message: "اختار الدولة والعملة للمتابعة." });
      return;
    }

    const result = loginWithGoogle({
      country: details.country,
      currency: details.currency,
      phone: details.phone ? `${selectedDialCode}${details.phone}` : "",
      inviteCode: details.inviteCode.trim(),
    });

    showToast({ type: "success", title: "تم الدخول", message: `مرحباً ${result.user.name}.` });
    navigate("/customer/dashboard", { replace: true });
  };

  return (
    <div className="mx-auto grid min-h-[calc(100vh-92px)] max-w-[1320px] place-items-center px-4 py-8">
      <div className="w-full max-w-[580px] rounded-[28px] bg-[linear-gradient(135deg,#22D3EE_0%,#2563EB_13%,#7C3AED_27%,#EC4899_41%,#F97316_55%,#FACC15_69%,#22C55E_83%,#06B6D4_100%)] p-[1px] shadow-[0_28px_85px_rgba(37,99,235,0.20),0_10px_35px_rgba(236,72,153,0.12)] dark:shadow-[0_32px_96px_rgba(124,58,237,0.26),0_12px_42px_rgba(34,211,238,0.12)]">
        <div className="relative overflow-hidden rounded-[27px] border border-white/70 bg-[linear-gradient(145deg,rgba(255,255,255,0.98)_0%,rgba(239,246,255,0.96)_36%,rgba(250,245,255,0.95)_70%,rgba(255,247,237,0.94)_100%)] p-5 text-slate-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(5,12,28,0.98)_0%,rgba(15,23,42,0.96)_38%,rgba(45,18,67,0.94)_72%,rgba(6,78,98,0.88)_100%)] dark:text-[#F8F9FA] sm:p-8">
          <span className="pointer-events-none absolute inset-x-0 top-0 h-1.5 bg-[linear-gradient(90deg,#22D3EE,#2563EB,#7C3AED,#EC4899,#F97316,#FACC15,#22C55E,#06B6D4)]" />

          <div className="text-center">
            <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl border border-white/75 bg-white shadow-[0_18px_40px_rgba(15,23,42,0.12)] dark:border-white/10 dark:bg-white/10 dark:shadow-[0_18px_46px_rgba(0,0,0,0.28)]">
              <img src="/logo.png" alt="Winnie Fun" className="h-12 w-12 object-contain" />
            </span>
            <span className="mx-auto mt-3 grid h-10 w-10 place-items-center rounded-full bg-[linear-gradient(135deg,#2563EB,#7C3AED,#EC4899)] text-white shadow-[0_14px_30px_rgba(124,58,237,0.28)]">
              {step === "verify" ? <MailCheck className="h-5 w-5" /> : <UserRound className="h-5 w-5" />}
            </span>
            <h1 className="mt-4 text-3xl font-black text-slate-950 dark:text-white">
              {step === "account" && "إنشاء حساب"}
              {step === "details" && (isGoogleFlow ? "أكمل بيانات Google" : "أكمل بيانات الحساب")}
              {step === "verify" && "تأكيد الحساب"}
            </h1>
            <p className="mt-2 text-sm font-bold text-slate-500 dark:text-slate-300">
              {step === "account" && "اكتب بيانات الدخول الأساسية للمتابعة."}
              {step === "details" && isGoogleFlow && "اختار الدولة والعملة قبل الدخول."}
              {step === "details" && !isGoogleFlow && (
                <>
                  البريد المسجل: <span dir="ltr" className="font-black text-royal dark:text-pulse">{account.email}</span>
                </>
              )}
              {step === "verify" && "تم إرسال رابط تأكيد الحساب إلى البريد الإلكتروني التالي."}
            </p>
          </div>

        {step === "account" && (
          <form
            className="mt-8 space-y-5"
            noValidate
            onSubmit={(event) => {
              event.preventDefault();
              createAccount();
            }}
          >
            <Field icon={UserRound} label="الاسم الكامل" value={account.name} onChange={(value) => updateAccount("name", value)} autoComplete="name" required />
            <Field icon={Mail} label="البريد الإلكتروني" type="email" value={account.email} onChange={(value) => updateAccount("email", value)} autoComplete="email" required />
            <PasswordField label="كلمة المرور" value={account.password} onChange={(value) => updateAccount("password", value)} autoComplete="new-password" />
            <PasswordField label="تأكيد كلمة المرور" value={account.confirmPassword} onChange={(value) => updateAccount("confirmPassword", value)} autoComplete="new-password" />

            <div className="rounded-2xl border border-white/70 bg-white/[0.58] px-3 py-2.5 shadow-[0_12px_30px_rgba(15,23,42,0.05)] backdrop-blur dark:border-white/10 dark:bg-white/[0.055]">
              <PolicyAgreement checked={acceptedPolicies} onChange={setAcceptedPolicies} onOpenPolicies={() => setPolicyModalOpen(true)} />
            </div>

            <button
              type="submit"
              className="interactive-ring h-[52px] min-h-[52px] w-full rounded-2xl bg-[linear-gradient(135deg,#2563EB,#7C3AED_45%,#EC4899)] text-sm font-black text-white shadow-[0_18px_42px_rgba(124,58,237,0.32)] transition hover:-translate-y-0.5 hover:shadow-[0_22px_52px_rgba(236,72,153,0.28)]"
            >
              إنشاء حساب
            </button>

            <button
              type="button"
              onClick={continueWithGoogle}
              className="group block w-full rounded-2xl bg-[linear-gradient(135deg,#4285F4,#34A853,#FBBC05,#EA4335)] p-[1px] shadow-[0_14px_34px_rgba(66,133,244,0.18)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_44px_rgba(66,133,244,0.28)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]/55 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#071226]"
            >
              <span className="flex h-12 items-center justify-center gap-3 rounded-[15px] bg-white px-4 text-sm font-black text-slate-800 transition group-hover:bg-[#F8FCFF] dark:bg-[#111827] dark:text-white dark:group-hover:bg-[#0D1324]">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white shadow-[0_8px_18px_rgba(15,23,42,0.12)]">
                  <GoogleMark className="h-5 w-5" />
                </span>
                <span>المتابعة باستخدام Google</span>
              </span>
            </button>
          </form>
        )}

        {step === "details" && (
          <form className="mt-8 space-y-5" onSubmit={(event) => event.preventDefault()}>
            <SelectField icon={Globe2} label="الدولة" value={details.country} options={countries} onChange={updateCountry} />
            <SelectField icon={Coins} label="العملة" value={details.currency} options={currencies} onChange={(value) => updateDetails("currency", value)} />
            <PhoneField label="رقم الهاتف (اختياري)" countryCode={selectedDialCode} value={details.phone} onChange={(value) => updateDetails("phone", value)} autoComplete="tel-national" />
            <Field icon={MailCheck} label="رمز الدعوة (اختياري)" value={details.inviteCode} onChange={(value) => updateDetails("inviteCode", value)} />

            <button
              type="button"
              onClick={isGoogleFlow ? completeGoogleDetails : completeDetails}
              className="interactive-ring h-[52px] min-h-[52px] w-full rounded-2xl bg-[linear-gradient(135deg,#2563EB,#7C3AED_45%,#EC4899)] text-sm font-black text-white shadow-[0_18px_42px_rgba(124,58,237,0.32)] transition hover:-translate-y-0.5 hover:shadow-[0_22px_52px_rgba(236,72,153,0.28)]"
            >
              {isGoogleFlow ? "دخول" : "إرسال رابط تأكيد الحساب"}
            </button>
            <button
              type="button"
              onClick={() => {
                setFlow("email");
                setStep("account");
              }}
              className="interactive-ring h-[52px] w-full rounded-2xl border border-white/70 bg-white/[0.72] text-sm font-black text-slate-700 shadow-[0_12px_30px_rgba(15,23,42,0.05)] transition hover:bg-white dark:border-white/10 dark:bg-white/[0.075] dark:text-[#F8F9FA] dark:hover:bg-white/[0.105]"
            >
              رجوع
            </button>
          </form>
        )}

        {step === "verify" && (
          <section className="mt-8 rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-5 text-center shadow-[0_18px_42px_rgba(16,185,129,0.12)]">
            <MailCheck className="mx-auto h-12 w-12 text-emerald-500 dark:text-emerald-300" />
            <h2 className="mt-4 text-xl font-black text-slate-950 dark:text-white">تم إرسال رابط تأكيد الحساب</h2>
            <p className="mt-3 text-sm font-semibold leading-6 text-slate-600 dark:text-slate-300">
              تم إرسال رابط تأكيد الحساب على الإيميل:
            </p>
            <p dir="ltr" className="mt-2 rounded-2xl bg-white px-3 py-2 text-sm font-black text-royal shadow-[0_10px_24px_rgba(15,23,42,0.06)] dark:bg-[#0D1324] dark:text-pulse">
              {account.email}
            </p>
            <p className="mt-3 text-sm font-semibold text-slate-600 dark:text-slate-300">
              تحقق من رسائل الإيميل لإكمال تفعيل الحساب.
            </p>
          </section>
        )}

          <p className="mt-7 text-center text-sm font-bold text-slate-500 dark:text-slate-300">
          لديك حساب بالفعل؟ <Link to="/login" className="font-black text-royal dark:text-pulse">تسجيل الدخول</Link>
        </p>
        </div>
      </div>

      {policyModalOpen && <PoliciesModal onClose={() => setPolicyModalOpen(false)} />}
    </div>
  );
}

function PhoneField({ label, countryCode, value, onChange, autoComplete }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-black text-slate-600 dark:text-slate-300">{label}</span>
      <span className="relative block">
        <Phone className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
        <input
          dir="ltr"
          type="tel"
          inputMode="numeric"
          value={value}
          onChange={(event) => onChange(event.target.value.replace(/\D/g, ""))}
          autoComplete={autoComplete}
          className="h-[54px] w-full rounded-2xl border border-white/80 bg-white/[0.82] px-4 pl-20 pr-12 text-left font-bold text-slate-900 shadow-[0_12px_28px_rgba(15,23,42,0.06)] outline-none transition focus:border-pulse focus:bg-white focus:ring-4 focus:ring-pulse/15 dark:border-white/10 dark:bg-white/[0.075] dark:text-white dark:focus:bg-white/[0.105]"
        />
        <span
          dir="ltr"
          className="pointer-events-none absolute left-3 top-1/2 grid h-9 min-w-14 -translate-y-1/2 select-none place-items-center rounded-xl border border-white/80 bg-white px-2 text-sm font-black text-slate-600 shadow-[0_8px_18px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-white/10 dark:text-slate-200"
          title="رمز الدولة يتغير حسب الدولة المختارة"
        >
          {countryCode}
        </span>
      </span>
    </label>
  );
}

function Field({ icon: Icon, label, value, onChange, type = "text", autoComplete, required = false }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-black text-slate-600 dark:text-slate-300">{label}</span>
      <span className="relative block">
        <Icon className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
        <input
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete={autoComplete}
          required={required}
          className="h-[54px] w-full rounded-2xl border border-white/80 bg-white/[0.82] px-4 pl-4 pr-12 text-right font-bold text-slate-900 shadow-[0_12px_28px_rgba(15,23,42,0.06)] outline-none transition focus:border-pulse focus:bg-white focus:ring-4 focus:ring-pulse/15 dark:border-white/10 dark:bg-white/[0.075] dark:text-white dark:focus:bg-white/[0.105]"
        />
      </span>
    </label>
  );
}

function PasswordField({ label, value, onChange, autoComplete }) {
  const [visible, setVisible] = useState(false);
  const VisibilityIcon = visible ? EyeOff : Eye;
  const visibilityLabel = visible ? "إخفاء كلمة المرور" : "إظهار كلمة المرور";

  return (
    <label className="block">
      <span className="mb-2 block text-sm font-black text-slate-600 dark:text-slate-300">{label}</span>
      <span className="relative block">
        <Lock className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
        <input
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete={autoComplete}
          className="h-[54px] w-full rounded-2xl border border-white/80 bg-white/[0.82] px-4 pl-12 pr-12 text-right font-bold text-slate-900 shadow-[0_12px_28px_rgba(15,23,42,0.06)] outline-none transition focus:border-pulse focus:bg-white focus:ring-4 focus:ring-pulse/15 dark:border-white/10 dark:bg-white/[0.075] dark:text-white dark:focus:bg-white/[0.105]"
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          className="absolute left-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full text-slate-400 transition hover:bg-[#F3E8FF] hover:text-royal dark:hover:bg-white/10 dark:hover:text-pulse"
          aria-label={visibilityLabel}
          title={visibilityLabel}
        >
          <VisibilityIcon className="h-5 w-5" />
        </button>
      </span>
    </label>
  );
}

function SelectField({ icon: Icon, label, value, options, onChange }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-black text-slate-600 dark:text-slate-300">{label}</span>
      <span className="relative block">
        <Icon className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-[54px] w-full rounded-2xl border border-white/80 bg-white/[0.82] px-4 pr-12 text-right font-bold text-slate-900 shadow-[0_12px_28px_rgba(15,23,42,0.06)] outline-none transition focus:border-pulse focus:bg-white focus:ring-4 focus:ring-pulse/15 dark:border-white/10 dark:bg-white/[0.075] dark:text-white dark:focus:bg-white/[0.105]"
        >
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </span>
    </label>
  );
}
