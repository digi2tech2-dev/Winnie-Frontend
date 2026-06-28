import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import GoogleMark from "../../components/GoogleMark";
import PolicyAgreement, { PoliciesModal } from "../../components/PolicyAgreement";
import { useToast } from "../../components/ToastProvider";
import { useAuth } from "../../context/AuthContext";
import { canUseRedirectPath, getDefaultRouteForRole } from "../../utils/authRoles";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [fieldErrors, setFieldErrors] = useState({});
  const [acceptedPolicies, setAcceptedPolicies] = useState(true);
  const [policyModalOpen, setPolicyModalOpen] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { isLoading, login, loginWithGoogle, user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  if (!isLoading && user) {
    return <Navigate to={getDefaultRouteForRole(user.role)} replace />;
  }

  const updateField = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
    setError("");
    setFieldErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  };

  const validateForm = () => {
    const errors = {};
    const email = form.email.trim();

    if (!email) {
      errors.email = "اكتب البريد الإلكتروني.";
    } else if (!emailPattern.test(email)) {
      errors.email = "البريد الإلكتروني غير صحيح.";
    }

    if (!form.password) {
      errors.password = "اكتب كلمة المرور.";
    }

    return errors;
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

  const submit = async () => {
    if (!ensurePolicyAgreement()) return;

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setError("");
      setFieldErrors(validationErrors);
      showToast({ type: "error", title: "راجع بيانات الدخول", message: "اكمل الحقول المحددة بالأحمر." });
      return;
    }

    setError("");
    setFieldErrors({});
    setLoading(true);
    const result = await login({ email: form.email.trim(), password: form.password });
    setLoading(false);

    if (!result.ok) {
      const message = result.message || "تعذر تسجيل الدخول. راجع البيانات وحاول مرة أخرى.";
      setError(message);
      setFieldErrors({
        ...(result.fieldErrors || {}),
        ...(result.code === "AUTHENTICATION_ERROR"
          ? {
              email: "تأكد من البريد الإلكتروني.",
              password: "تأكد من كلمة المرور.",
            }
          : {}),
      });
      showToast({
        type: result.requires2FA ? "info" : "error",
        title: result.requires2FA ? "التحقق الثنائي مطلوب" : "فشل تسجيل الدخول",
        message,
      });
      return;
    }

    showToast({ type: "success", title: "تم تسجيل الدخول", message: `مرحبا ${result.user.name}.` });
    const fallback = result.redirectTo || getDefaultRouteForRole(result.user.role);
    const from = location.state?.from;
    const nextPath = from && canUseRedirectPath(result.user.role, from) ? from : fallback;

    navigate(nextPath, { replace: true });
  };

  const continueWithGoogle = () => {
    if (!ensurePolicyAgreement()) return;

    const result = loginWithGoogle();
    showToast({ type: "info", title: "تسجيل الدخول بجوجل", message: result.message });
  };

  return (
    <div className="mx-auto grid min-h-[calc(100vh-92px)] max-w-[1320px] place-items-center px-4 py-8">
      <div className="w-full max-w-[550px] rounded-[28px] bg-[linear-gradient(135deg,#22D3EE_0%,#2563EB_13%,#7C3AED_27%,#EC4899_41%,#F97316_55%,#FACC15_69%,#22C55E_83%,#06B6D4_100%)] p-[1px] shadow-[0_28px_85px_rgba(37,99,235,0.20),0_10px_35px_rgba(236,72,153,0.12)] dark:shadow-[0_32px_96px_rgba(124,58,237,0.26),0_12px_42px_rgba(34,211,238,0.12)]">
        <div className="relative overflow-hidden rounded-[27px] border border-white/70 bg-[linear-gradient(145deg,rgba(255,255,255,0.98)_0%,rgba(239,246,255,0.96)_36%,rgba(250,245,255,0.95)_70%,rgba(255,247,237,0.94)_100%)] p-5 text-slate-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(5,12,28,0.98)_0%,rgba(15,23,42,0.96)_38%,rgba(45,18,67,0.94)_72%,rgba(6,78,98,0.88)_100%)] dark:text-[#F8F9FA] sm:p-8">
          <span className="pointer-events-none absolute inset-x-0 top-0 h-1.5 bg-[linear-gradient(90deg,#22D3EE,#2563EB,#7C3AED,#EC4899,#F97316,#FACC15,#22C55E,#06B6D4)]" />

          <div className="flex flex-col items-center text-center">
            <span className="grid h-16 w-16 place-items-center rounded-2xl border border-white/75 bg-white shadow-[0_18px_40px_rgba(15,23,42,0.12)] dark:border-white/10 dark:bg-white/10 dark:shadow-[0_18px_46px_rgba(0,0,0,0.28)]">
              <img src="/logo.png" alt="Winnie Fun" className="h-12 w-12 object-contain" />
            </span>
            <h1 className="mt-5 text-3xl font-black text-slate-950 dark:text-white">تسجيل الدخول إلى Winnie Fun</h1>
            <p className="mt-2 text-sm font-bold text-slate-500 dark:text-slate-300">ادخل إلى لوحة حسابك بأمان.</p>
          </div>

          <form className="mt-8 space-y-5" onSubmit={(event) => event.preventDefault()}>
            <Field icon={Mail} type="email" placeholder="البريد الإلكتروني" value={form.email} error={fieldErrors.email} onChange={(email) => updateField("email", email)} />
            <Field icon={Lock} type="password" placeholder="كلمة المرور" value={form.password} error={fieldErrors.password} onChange={(password) => updateField("password", password)} hasEye />

            {error && (
              <p className="rounded-2xl border border-rose-500/25 bg-rose-500/10 p-3 text-sm font-bold text-rose-500">
                {error}
              </p>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/70 bg-white/[0.58] px-3 py-2.5 text-sm shadow-[0_12px_30px_rgba(15,23,42,0.05)] backdrop-blur dark:border-white/10 dark:bg-white/[0.055]">
              <PolicyAgreement id="login-policy-agreement" checked={acceptedPolicies} onChange={setAcceptedPolicies} onOpenPolicies={() => setPolicyModalOpen(true)} />
              <Link to="/forgot-password" className="shrink-0 whitespace-nowrap font-black text-royal dark:text-pulse">
                نسيت كلمة المرور؟
              </Link>
            </div>

            <button
              type="button"
              onClick={submit}
              disabled={loading || isLoading}
              className="interactive-ring h-[52px] min-h-[52px] w-full rounded-2xl bg-[linear-gradient(135deg,#2563EB,#7C3AED_45%,#EC4899)] text-sm font-black text-white shadow-[0_18px_42px_rgba(124,58,237,0.32)] transition hover:-translate-y-0.5 hover:shadow-[0_22px_52px_rgba(236,72,153,0.28)] disabled:cursor-wait disabled:opacity-70"
            >
              {loading || isLoading ? "جار التحقق..." : "تسجيل الدخول"}
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

          <p className="mt-7 text-center text-sm font-bold text-slate-500 dark:text-slate-300">
            جديد في Winnie Fun؟{" "}
            <Link to="/register" className="font-black text-royal dark:text-pulse">
              إنشاء حساب
            </Link>
          </p>
        </div>
      </div>

      {policyModalOpen && <PoliciesModal onClose={() => setPolicyModalOpen(false)} />}
    </div>
  );
}

function Field({ icon: Icon, type, placeholder, value, onChange, error, hasEye = false }) {
  const [visible, setVisible] = useState(false);
  const hasError = Boolean(error);
  const inputType = hasEye ? (visible ? "text" : "password") : type;
  const VisibilityIcon = visible ? EyeOff : Eye;
  const visibilityLabel = visible ? "إخفاء كلمة المرور" : "إظهار كلمة المرور";

  return (
    <label className="block">
      <span className="relative block">
        <Icon className={`pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 ${hasError ? "text-rose-500" : "text-slate-400"}`} />
        <input
          type={inputType}
          placeholder={placeholder}
          value={value}
          aria-invalid={hasError}
          onChange={(event) => onChange(event.target.value)}
          className={`h-[54px] w-full rounded-2xl border bg-white/[0.82] px-4 pl-12 pr-12 text-right font-bold text-slate-900 shadow-[0_12px_28px_rgba(15,23,42,0.06)] outline-none transition placeholder:font-bold placeholder:text-slate-400 dark:bg-white/[0.075] dark:text-white ${
            hasError
              ? "border-rose-400 text-rose-950 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/15 dark:border-rose-400/60 dark:text-rose-100"
              : "border-white/80 focus:border-pulse focus:bg-white focus:ring-4 focus:ring-pulse/15 dark:border-white/10 dark:focus:bg-white/[0.105]"
          }`}
        />
        {hasEye && (
          <button
            type="button"
            onClick={() => setVisible((current) => !current)}
            className={`absolute left-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full transition hover:bg-[#F3E8FF] hover:text-royal dark:hover:bg-white/10 dark:hover:text-pulse ${hasError ? "text-rose-500" : "text-slate-400"}`}
            aria-label={visibilityLabel}
            title={visibilityLabel}
          >
            <VisibilityIcon className="h-5 w-5" />
          </button>
        )}
      </span>
      {hasError && (
        <span className="mt-2 block text-right text-xs font-black text-rose-500">
          {error}
        </span>
      )}
    </label>
  );
}
