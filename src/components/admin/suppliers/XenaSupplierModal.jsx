import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  AlertTriangle,
  ArrowLeft,
  Bot,
  CheckCircle2,
  CircleDollarSign,
  CloudCog,
  LockKeyhole,
  Mail,
  KeyRound,
  Loader2,
  RefreshCw,
  Save,
  Search,
  ShieldCheck,
  X,
} from "lucide-react";
import {
  adminVerifyXenaTarget,
  challengeXena,
  getXenaProductConfig,
  getXenaStatus,
  reconnectXena,
  refreshXenaBalance,
  syncXenaProduct,
  updateXenaProductConfig,
  verifyXenaOtp,
} from "../../../api/adminProviders";
import { validateXenaTargetUid } from "../../../utils/xena";

const inputClassName = "h-10 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 text-[10px] font-black outline-none focus:border-violet-300 focus:ring-4 focus:ring-violet-500/10 dark:border-white/10 dark:bg-[#0B1220] dark:text-white";

const emptyStatus = {
  displayName: "",
  lastCheckedAtLabel: "-",
  lastErrorCode: "",
  lastErrorMessage: "",
  maskedUsername: "",
  needsReconnect: false,
  status: "unknown",
  tokenExpiresAtLabel: "-",
};

const emptyConfig = {
  externalProductId: "xena-dynamic-recharge",
  isActive: true,
  maxAmount: "",
  minAmount: "",
  name: "شحن Xena الديناميكي (أي مبلغ)",
  providerUnitPrice: "",
};

export default function XenaSupplierModal({ onClose, onUpdated, supplier, token }) {
  const [status, setStatus] = useState(emptyStatus);
  const [balance, setBalance] = useState(null);
  const [config, setConfig] = useState(emptyConfig);
  const [connectionForm, setConnectionForm] = useState({ displayName: "", password: "", username: "" });
  const [loginStep, setLoginStep] = useState("credentials");
  const [otpDigits, setOtpDigits] = useState(["", "", "", ""]);
  const otpRefs = useRef([]);
  const [targetUid, setTargetUid] = useState("");
  const [targetResult, setTargetResult] = useState(null);
  const [error, setError] = useState("");
  const [busyKey, setBusyKey] = useState("");

  const loadStatus = useCallback(async () => {
    if (!token || !supplier) return;
    setBusyKey("status");
    setError("");
    try {
      const result = await getXenaStatus(token, supplier.id);
      setStatus(result.status);
      setConnectionForm((current) => ({
        ...current,
        displayName: current.displayName || result.status.displayName || supplier.name || "",
      }));
    } catch (apiError) {
      setError(getXenaErrorMessage(apiError, "تعذر تحميل حالة Xena."));
    } finally {
      setBusyKey("");
    }
  }, [supplier, token]);

  const loadConfig = useCallback(async () => {
    if (!token || !supplier) return;
    setBusyKey((current) => current || "config");
    setError("");
    try {
      const result = await getXenaProductConfig(token, supplier.id);
      setConfig(result.config);
    } catch (apiError) {
      setError(getXenaErrorMessage(apiError, "تعذر تحميل إعدادات منتج Xena."));
    } finally {
      setBusyKey((current) => (current === "config" ? "" : current));
    }
  }, [supplier, token]);

  useEffect(() => {
    if (!supplier) return;
    setBalance(null);
    setError("");
    setTargetResult(null);
    setTargetUid("");
    setConnectionForm({ displayName: supplier.name || "", password: "", username: "" });
    setLoginStep("credentials");
    setOtpDigits(["", "", "", ""]);
    void loadStatus();
    void loadConfig();
  }, [loadConfig, loadStatus, supplier]);

  if (!supplier) return null;

  const beginConnection = async (event) => {
    event.preventDefault();
    const displayName = connectionForm.displayName.trim() || "Xena Recharge";
    const username = connectionForm.username.trim();
    const password = connectionForm.password;

    if (!username || !password) {
      setError("أدخل بريد Gmail وكلمة المرور للمتابعة.");
      return;
    }

    setBusyKey("connect");
    setError("");
    try {
      const result = status.needsReconnect
        ? await reconnectXena(token, supplier.id, { displayName, password, username })
        : await challengeXena(token, supplier.id, { displayName, password, username });
      setStatus(result.status);
      setLoginStep(String(result.status?.status || "").toLowerCase() === "connected" ? "complete" : "otp");
      window.setTimeout(() => otpRefs.current[0]?.focus(), 120);
      await onUpdated?.();
    } catch (apiError) {
      setError(getXenaErrorMessage(apiError, "تعذر بدء اتصال Xena."));
    } finally {
      setConnectionForm((current) => ({ ...current, password: "" }));
      setBusyKey("");
    }
  };

  const verifyOtp = async (event) => {
    event.preventDefault();
    const code = otpDigits.join("");
    if (!/^\d{4}$/.test(code)) {
      setError("أدخل رمز التحقق المكوّن من 4 أرقام.");
      return;
    }

    setBusyKey("otp");
    setError("");
    try {
      const result = await verifyXenaOtp(token, supplier.id, code);
      setStatus(result.status);
      setLoginStep("complete");
      await onUpdated?.();
    } catch (apiError) {
      setError(getXenaErrorMessage(apiError, "تعذر التحقق من رمز Xena."));
    } finally {
      setOtpDigits(["", "", "", ""]);
      setBusyKey("");
    }
  };

  const setOtpDigit = (index, rawValue) => {
    const value = String(rawValue || "").replace(/\D/g, "").slice(-1);
    setOtpDigits((current) => current.map((digit, digitIndex) => (digitIndex === index ? value : digit)));
    if (value && index < 3) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index, event) => {
    if (event.key === "Backspace" && !otpDigits[index] && index > 0) otpRefs.current[index - 1]?.focus();
  };

  const handleOtpPaste = (event) => {
    const digits = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 4).split("");
    if (!digits.length) return;
    event.preventDefault();
    setOtpDigits([0, 1, 2, 3].map((index) => digits[index] || ""));
    otpRefs.current[Math.min(digits.length, 4) - 1]?.focus();
  };

  const refreshBalance = async () => {
    setBusyKey("balance");
    setError("");
    try {
      const result = await refreshXenaBalance(token, supplier.id);
      setBalance(result.balance);
    } catch (apiError) {
      setBalance(null);
      setError(getXenaErrorMessage(apiError, "تعذر تحديث رصيد Xena."));
    } finally {
      setBusyKey("");
    }
  };

  const saveConfig = async (event) => {
    event.preventDefault();
    const validation = validateConfig(config);
    if (validation) {
      setError(validation);
      return;
    }

    setBusyKey("save-config");
    setError("");
    try {
      const result = await updateXenaProductConfig(token, supplier.id, config);
      setConfig(result.config);
      await onUpdated?.();
    } catch (apiError) {
      setError(getXenaErrorMessage(apiError, "تعذر حفظ إعدادات منتج Xena."));
    } finally {
      setBusyKey("");
    }
  };

  const syncProduct = async () => {
    const validation = validateConfig(config);
    if (validation) {
      setError(validation);
      return;
    }

    setBusyKey("sync-product");
    setError("");
    try {
      await syncXenaProduct(token, supplier.id);
      await onUpdated?.();
    } catch (apiError) {
      setError(getXenaErrorMessage(apiError, "تعذر مزامنة منتج Xena."));
    } finally {
      setBusyKey("");
    }
  };

  const verifyTarget = async (event) => {
    event.preventDefault();
    const validation = validateXenaTargetUid(targetUid);
    if (!validation.valid) {
      setTargetResult(null);
      setError(validation.message);
      return;
    }

    setBusyKey("target");
    setError("");
    try {
      const result = await adminVerifyXenaTarget(token, supplier.id, validation.targetUid);
      setTargetResult(result.verification);
      setTargetUid(validation.targetUid);
    } catch (apiError) {
      setTargetResult(null);
      setError(getXenaErrorMessage(apiError, "تعذر التحقق من معرّف Xena."));
    } finally {
      setBusyKey("");
    }
  };

  const modal = (
    <div className="fixed inset-0 z-[140] flex items-end justify-center bg-slate-950/60 sm:items-center sm:p-4">
      <section className="xena-recharge-modal flex max-h-[94dvh] w-full max-w-[760px] flex-col overflow-hidden rounded-t-[28px] bg-white sm:rounded-[28px] dark:bg-[#111827]">
        <header className="xena-recharge-modal-header flex items-center gap-3 border-b border-slate-100 p-4 dark:border-white/10">
          <span className="xena-recharge-brand-icon"><Bot className="h-5 w-5" /></span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-black dark:text-white">Xena Recharge</h2>
              <span className="xena-recharge-bot-badge">بوت ذكي</span>
            </div>
            <p className="truncate text-[9px] font-bold text-slate-400">ربط آمن وسريع مع حساب الشحن الخاص بك</p>
          </div>
          <button type="button" onClick={onClose} disabled={Boolean(busyKey)} className="grid h-9 w-9 place-items-center rounded-xl text-slate-400 hover:bg-slate-100 disabled:opacity-60 dark:hover:bg-white/[0.07]">
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="grid gap-3 overflow-y-auto p-4">
          {error && <ErrorMessage message={error} />}

          <section className="grid gap-3 rounded-2xl border border-slate-200 p-3 dark:border-white/10">
            <SectionTitle icon={CloudCog} title="حالة الاتصال" />
            <dl className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              <Info label="الحالة" value={translateXenaStatus(status.status)} />
              <Info label="اسم العرض" value={status.displayName || "-"} />
              <Info label="اسم المستخدم" value={status.maskedUsername || "-"} dir="ltr" />
              <Info label="انتهاء الرمز" value={status.tokenExpiresAtLabel || "-"} />
              <Info label="آخر فحص" value={status.lastCheckedAtLabel || "-"} />
              <Info label="يتطلب إعادة اتصال" value={status.needsReconnect ? "نعم" : "لا"} />
              {(status.lastErrorCode || status.lastErrorMessage) && (
                <Info label="آخر خطأ" value={[status.lastErrorCode, status.lastErrorMessage].filter(Boolean).join(" - ")} wide />
              )}
            </dl>
            <ActionButton busy={busyKey === "status"} icon={RefreshCw} label="تحديث الحالة" onClick={loadStatus} />
          </section>

          <section className="xena-login-card">
            <div className="xena-login-card-top">
              <span className="xena-login-step">{loginStep === "credentials" ? "1" : "✓"}</span>
              <div>
                <p className="xena-login-eyebrow">ربط بوت الشحن</p>
                <h3>{loginStep === "credentials" ? "سجّل دخولك إلى Xena Recharge" : loginStep === "otp" ? "أدخل رمز التحقق" : "تم ربط البوت بنجاح"}</h3>
              </div>
              <span className="xena-login-secure"><ShieldCheck className="h-3.5 w-3.5" /> اتصال آمن</span>
            </div>

            <div className="xena-login-progress" aria-label="خطوات ربط Xena">
              <span className={loginStep === "credentials" ? "is-current" : "is-done"}>بيانات الدخول</span>
              <i />
              <span className={loginStep === "otp" ? "is-current" : loginStep === "complete" ? "is-done" : ""}>رمز التأكيد</span>
              <i />
              <span className={loginStep === "complete" ? "is-current is-done" : ""}>تم الربط</span>
            </div>

            {loginStep === "credentials" && (
              <form onSubmit={beginConnection} className="xena-login-form">
                <label>
                  <span><Mail className="h-4 w-4" /> بريد Gmail</span>
                  <input dir="ltr" type="email" value={connectionForm.username} onChange={(event) => setConnectionForm((current) => ({ ...current, username: event.target.value }))} placeholder="name@gmail.com" className="xena-login-input" autoComplete="username" required />
                </label>
                <label>
                  <span><LockKeyhole className="h-4 w-4" /> كلمة المرور</span>
                  <input dir="ltr" type="password" value={connectionForm.password} onChange={(event) => setConnectionForm((current) => ({ ...current, password: event.target.value }))} placeholder="••••••••" className="xena-login-input" autoComplete="current-password" required />
                </label>
                <button type="submit" disabled={busyKey === "connect"} className="xena-login-next">
                  {busyKey === "connect" ? <Loader2 className="h-4 w-4 animate-spin" /> : <>التالي <ArrowLeft className="h-4 w-4" /></>}
                </button>
                <p className="xena-login-note">لن نخزن كلمة المرور؛ تُستخدم فقط لبدء جلسة الربط الآمنة.</p>
              </form>
            )}

            {loginStep === "otp" && (
              <form onSubmit={verifyOtp} className="xena-otp-form">
                <p>أرسلنا رمز تحقق مكوّنًا من 4 أرقام إلى حساب Xena الخاص بك.</p>
                <div dir="ltr" className="xena-otp-boxes" onPaste={handleOtpPaste}>
                  {otpDigits.map((digit, index) => (
                    <input key={index} ref={(element) => { otpRefs.current[index] = element; }} value={digit} onChange={(event) => setOtpDigit(index, event.target.value)} onKeyDown={(event) => handleOtpKeyDown(index, event)} inputMode="numeric" autoComplete={index === 0 ? "one-time-code" : "off"} maxLength={1} aria-label={`رقم ${index + 1} من رمز التحقق`} />
                  ))}
                </div>
                <button type="submit" disabled={busyKey === "otp" || otpDigits.join("").length !== 4} className="xena-login-next">
                  {busyKey === "otp" ? <Loader2 className="h-4 w-4 animate-spin" /> : <><CheckCircle2 className="h-4 w-4" /> تأكيد وربط البوت</>}
                </button>
                <button type="button" className="xena-login-back" onClick={() => { setLoginStep("credentials"); setOtpDigits(["", "", "", ""]); }}>تعديل بيانات الدخول</button>
              </form>
            )}

            {loginStep === "complete" && (
              <div className="xena-login-success">
                <CheckCircle2 className="h-8 w-8" />
                <div><strong>تم تسجيل الدخول وربط Xena Recharge</strong><p>البوت جاهز الآن لتنفيذ عمليات الشحن والمتابعة.</p></div>
              </div>
            )}
          </section>

          <section className="grid gap-3 rounded-2xl border border-slate-200 p-3 dark:border-white/10">
            <SectionTitle icon={CircleDollarSign} title="الرصيد" />
            <ActionButton busy={busyKey === "balance"} icon={CircleDollarSign} label="تحديث الرصيد" onClick={refreshBalance} tone="emerald" />
            <div className="rounded-xl bg-slate-50 p-2 text-[10px] font-black text-slate-600 dark:bg-[#0B1220] dark:text-slate-300">
              <p dir="ltr" className="text-right">{balance?.balance || "غير متاح"}{balance?.currency ? ` ${balance.currency}` : ""}</p>
              {balance?.checkedAtLabel && <p className="mt-1 text-slate-400">تم الفحص: {balance.checkedAtLabel}</p>}
            </div>
          </section>

          <form onSubmit={saveConfig} className="grid gap-3 rounded-2xl border border-slate-200 p-3 dark:border-white/10">
            <SectionTitle icon={Save} title="إعدادات المنتج" />
            <div className="grid gap-2 sm:grid-cols-2">
              <Field label="الاسم" wide>
                <input value={config.name} onChange={(event) => setConfig((current) => ({ ...current, name: event.target.value }))} className={inputClassName} />
              </Field>
              <Field label="الحد الأدنى للمبلغ">
                <input dir="ltr" value={config.minAmount} onChange={(event) => setConfig((current) => ({ ...current, minAmount: event.target.value.replace(/[^\d]/g, "") }))} className={inputClassName} inputMode="numeric" />
              </Field>
              <Field label="الحد الأقصى للمبلغ">
                <input dir="ltr" value={config.maxAmount} onChange={(event) => setConfig((current) => ({ ...current, maxAmount: event.target.value.replace(/[^\d]/g, "") }))} className={inputClassName} inputMode="numeric" />
              </Field>
              <Field label="سعر وحدة المورد">
                <input dir="ltr" value={config.providerUnitPrice} onChange={(event) => setConfig((current) => ({ ...current, providerUnitPrice: event.target.value }))} className={inputClassName} inputMode="decimal" />
              </Field>
              <label className="flex h-10 items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-3 text-[10px] font-black text-slate-600 dark:border-white/10 dark:bg-[#0B1220] dark:text-white">
                <span>مفعّل</span>
                <input type="checkbox" checked={config.isActive} onChange={(event) => setConfig((current) => ({ ...current, isActive: event.target.checked }))} className="h-4 w-4 accent-violet-600" />
              </label>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button type="submit" disabled={busyKey === "save-config"} className="inline-flex h-10 items-center justify-center gap-1 rounded-xl bg-violet-600 px-4 text-[9px] font-black text-white disabled:opacity-60">
                {busyKey === "save-config" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                حفظ الإعدادات
              </button>
              <ActionButton busy={busyKey === "sync-product"} icon={RefreshCw} label="مزامنة المنتج" onClick={syncProduct} tone="sky" />
            </div>
          </form>

          <section className="grid gap-3 rounded-2xl border border-slate-200 p-3 dark:border-white/10">
            <SectionTitle icon={Search} title="التحقق من معرّف Xena" />
            <form onSubmit={verifyTarget} className="flex gap-2">
              <input dir="ltr" value={targetUid} onChange={(event) => { setTargetUid(event.target.value); setTargetResult(null); }} placeholder="001234" className={inputClassName} inputMode="numeric" />
              <button type="submit" disabled={busyKey === "target" || !targetUid.trim()} className="inline-flex h-10 items-center justify-center gap-1 rounded-xl bg-slate-900 px-4 text-[9px] font-black text-white disabled:opacity-60 dark:bg-white dark:text-slate-950">
                {busyKey === "target" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
                تحقق
              </button>
            </form>
            {targetResult?.valid && (
              <div className="rounded-xl bg-emerald-50 p-2 text-[10px] font-black text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                <p dir="ltr" className="text-right">UID: {targetResult.targetUid}</p>
                {targetResult.user?.nickname && <p>{targetResult.user.nickname}</p>}
                {targetResult.user?.country && <p>{targetResult.user.country}</p>}
              </div>
            )}
          </section>
        </div>
      </section>
    </div>
  );

  return typeof document === "undefined" ? modal : createPortal(modal, document.body);
}

function SectionTitle({ icon: Icon, title }) {
  return (
    <div className="flex items-center gap-2">
      <span className="grid h-8 w-8 place-items-center rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-300">
        <Icon className="h-4 w-4" />
      </span>
      <h3 className="text-xs font-black text-slate-950 dark:text-white">{title}</h3>
    </div>
  );
}

function Field({ children, label, wide }) {
  return (
    <label className={wide ? "sm:col-span-2" : ""}>
      <span className="mb-1 block text-[9px] font-black text-slate-500 dark:text-slate-300">{label}</span>
      {children}
    </label>
  );
}

function Info({ dir, label, value, wide }) {
  return (
    <div className={`min-w-0 rounded-xl bg-slate-50 p-2 dark:bg-[#0B1220] ${wide ? "col-span-2 sm:col-span-3" : ""}`}>
      <dt className="text-[8px] font-black text-slate-400">{label}</dt>
      <dd dir={dir} title={String(value || "-")} className={`mt-1 break-words text-[10px] font-black text-slate-700 dark:text-slate-200 ${dir === "ltr" ? "text-right" : ""}`}>
        {value || "-"}
      </dd>
    </div>
  );
}

function ActionButton({ busy, icon: Icon, label, onClick, tone = "violet" }) {
  const toneClass = {
    emerald: "bg-emerald-600 text-white",
    sky: "bg-sky-600 text-white",
    violet: "bg-violet-600 text-white",
  }[tone];

  return (
    <button type="button" onClick={onClick} disabled={busy} className={`inline-flex h-10 items-center justify-center gap-1 rounded-xl px-4 text-[9px] font-black disabled:opacity-60 ${toneClass}`}>
      {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Icon className="h-3.5 w-3.5" />}
      {label}
    </button>
  );
}

function ErrorMessage({ message }) {
  return (
    <p className="flex items-start gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-[10px] font-black text-rose-700 dark:border-rose-400/20 dark:bg-rose-500/10 dark:text-rose-300">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{message}</span>
    </p>
  );
}

function validateConfig(config = {}) {
  const minAmount = Number(config.minAmount);
  const maxAmount = Number(config.maxAmount);
  const providerUnitPrice = Number(config.providerUnitPrice);

  if (!String(config.name || "").trim()) return "اسم المنتج مطلوب.";
  if (!Number.isSafeInteger(minAmount) || minAmount <= 0) return "الحد الأدنى يجب أن يكون عددًا صحيحًا موجبًا.";
  if (!Number.isSafeInteger(maxAmount) || maxAmount <= 0) return "الحد الأقصى يجب أن يكون عددًا صحيحًا موجبًا.";
  if (maxAmount < minAmount) return "الحد الأقصى يجب أن يكون أكبر من أو يساوي الحد الأدنى.";
  if (!Number.isFinite(providerUnitPrice) || providerUnitPrice <= 0) return "سعر وحدة المورد يجب أن يكون موجبًا.";
  return "";
}

function getXenaErrorMessage(error = {}, fallback) {
  const code = String(error.code || error.payload?.code || "").toUpperCase();
  const map = {
    XENA_CONNECTION_REQUIRED: "اتصال Xena مطلوب.",
    XENA_INTEGRATION_UNAVAILABLE: "خدمة Xena غير متاحة مؤقتًا.",
    XENA_MALFORMED_RESPONSE: "أعادت Xena استجابة غير متوقعة.",
    XENA_PROVIDER_AUTH_FAILED: "تحقق من مفتاح Digiteech API أو أعد ربط Xena.",
    XENA_RATE_LIMITED: "يرجى المحاولة لاحقًا.",
    XENA_REAUTHENTICATION_REQUIRED: "أعد ربط Xena.",
    XENA_TARGET_INVALID: "معرّف Xena غير صالح.",
    XENA_VERIFICATION_UNAVAILABLE: "خدمة التحقق غير متاحة مؤقتًا.",
  };

  return map[code] || error.userMessage || fallback;
}

function translateXenaStatus(status) {
  const labels = {
    challenge_required: "يتطلب التحقق",
    connected: "متصل",
    connecting: "جارٍ الاتصال",
    disconnected: "غير متصل",
    expired: "انتهت الصلاحية",
    failed: "فشل",
    reauthentication_required: "يلزم إعادة الربط",
    unknown: "غير معروف",
  };
  const value = String(status || "").trim();
  return labels[value.toLowerCase()] || value || "غير معروف";
}
