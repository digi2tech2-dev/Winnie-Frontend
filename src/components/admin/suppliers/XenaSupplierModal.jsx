import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  AlertTriangle, ArrowLeft, Bot, Check, CheckCircle2, CloudCog, KeyRound,
  Loader2, LockKeyhole, Mail, RefreshCw, Save, Search, Settings2,
  ShieldCheck, Sparkles, X,
} from "lucide-react";
import {
  adminVerifyXenaTarget, challengeXena, getXenaProductConfig, getXenaStatus,
  reconnectXena, refreshXenaBalance, syncXenaProduct, updateXenaProductConfig,
  verifyXenaOtp,
} from "../../../api/adminProviders";
import { validateXenaTargetUid } from "../../../utils/xena";

const emptyStatus = {
  disabledByEnv: false, enabled: true, maskedUsername: "", needsReconnect: false,
  readinessBlockers: [], status: "unchecked", tokenExpiresAtLabel: "",
};
const emptyConfig = {
  isActive: true, maxAmount: "", minAmount: "",
  name: "شحن Xena الديناميكي (أي مبلغ)", providerUnitPrice: "",
};

export default function XenaSupplierModal({ onClose, onUpdated, supplier, token }) {
  const [status, setStatus] = useState(emptyStatus);
  const [balance, setBalance] = useState(null);
  const [config, setConfig] = useState(emptyConfig);
  const [connectionForm, setConnectionForm] = useState({ password: "", username: "" });
  const [dialog, setDialog] = useState(null);
  const [otpDigits, setOtpDigits] = useState(["", "", "", ""]);
  const otpRefs = useRef([]);
  const [targetUid, setTargetUid] = useState("");
  const [targetResult, setTargetResult] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busyKey, setBusyKey] = useState("");

  const clearSensitiveInput = () => {
    setConnectionForm((current) => ({ ...current, password: "" }));
    setOtpDigits(["", "", "", ""]);
  };

  const closeDialog = () => {
    if (busyKey) return;
    clearSensitiveInput();
    setError("");
    setDialog(null);
  };

  const loadStatus = useCallback(async ({ quiet = false } = {}) => {
    if (!token || !supplier) return null;
    setBusyKey("status");
    if (!quiet) setError("");
    try {
      const result = await getXenaStatus(token, supplier.id);
      setStatus(result.status);
      return result.status;
    } catch (apiError) {
      if (!quiet) setError(getXenaErrorMessage(apiError, "تعذر فحص حالة Xena."));
      return null;
    } finally {
      setBusyKey("");
    }
  }, [supplier, token]);

  useEffect(() => {
    if (!supplier) return;
    setBalance(null);
    setConfig(emptyConfig);
    setConnectionForm({ password: "", username: "" });
    setDialog(null);
    setError("");
    setNotice("");
    setOtpDigits(["", "", "", ""]);
    setStatus(emptyStatus);
    setTargetResult(null);
    setTargetUid("");
  }, [supplier]);

  if (!supplier) return null;

  const openDialog = (nextDialog) => {
    setError("");
    setNotice("");
    setDialog(nextDialog);
  };

  const beginConnection = async (event) => {
    event.preventDefault();
    const username = connectionForm.username.trim();
    const password = connectionForm.password;
    if (!username || !password) {
      setError("أدخل بريد Gmail وكلمة المرور للمتابعة.");
      return;
    }

    setBusyKey("connect");
    setError("");
    try {
      // Browser -> Winnie only. This avoids sending a password to a disabled integration.
      const readinessResult = await getXenaStatus(token, supplier.id);
      const readiness = readinessResult.status;
      setStatus(readiness);
      if (isServiceDisabled(readiness)) {
        setError("خدمة Xena متوقفة في الخادم الآن. فعّل إعداد الخدمة ثم أعد المحاولة؛ لم تُرسل كلمة المرور.");
        return;
      }

      const payload = { displayName: supplier.name || "Xena Recharge", password, username };
      const result = readiness.needsReconnect || readiness.status === "reauthentication_required"
        ? await reconnectXena(token, supplier.id, payload)
        : await challengeXena(token, supplier.id, payload);
      setStatus(result.status);
      setConnectionForm((current) => ({ ...current, password: "" }));
      await onUpdated?.();

      if (String(result.status?.status || "").toLowerCase() === "connected") {
        setDialog(null);
        setNotice("تم ربط حساب Xena بنجاح وهو جاهز للاستخدام.");
        return;
      }
      setDialog("otp");
      window.setTimeout(() => otpRefs.current[0]?.focus(), 120);
    } catch (apiError) {
      setError(getXenaErrorMessage(apiError, "تعذر بدء جلسة تسجيل الدخول."));
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
      setDialog(null);
      setNotice("تم التحقق من الرمز وربط Xena Recharge بنجاح.");
      setOtpDigits(["", "", "", ""]);
      await onUpdated?.();
    } catch (apiError) {
      setError(getXenaErrorMessage(apiError, "تعذر التحقق من الرمز."));
    } finally {
      setBusyKey("");
    }
  };

  const loadConfig = async () => {
    setBusyKey("config");
    setError("");
    try {
      const result = await getXenaProductConfig(token, supplier.id);
      setConfig(result.config);
    } catch (apiError) {
      setError(getXenaErrorMessage(apiError, "تعذر تحميل إعدادات خدمة الشحن."));
    } finally {
      setBusyKey("");
    }
  };

  const saveConfig = async (event) => {
    event.preventDefault();
    const validation = validateConfig(config);
    if (validation) return setError(validation);
    setBusyKey("save-config");
    setError("");
    try {
      const result = await updateXenaProductConfig(token, supplier.id, config);
      setConfig(result.config);
      setNotice("تم حفظ إعدادات خدمة الشحن.");
      await onUpdated?.();
    } catch (apiError) {
      setError(getXenaErrorMessage(apiError, "تعذر حفظ إعدادات خدمة الشحن."));
    } finally {
      setBusyKey("");
    }
  };

  const syncProduct = async () => {
    const validation = validateConfig(config);
    if (validation) return setError(validation);
    setBusyKey("sync-product");
    setError("");
    try {
      await syncXenaProduct(token, supplier.id);
      setNotice("تمت مزامنة منتج Xena الديناميكي.");
      await onUpdated?.();
    } catch (apiError) {
      setError(getXenaErrorMessage(apiError, "تعذرت مزامنة المنتج."));
    } finally {
      setBusyKey("");
    }
  };

  const refreshBalance = async () => {
    setBusyKey("balance");
    setError("");
    try {
      const result = await refreshXenaBalance(token, supplier.id);
      setBalance(result.balance);
    } catch (apiError) {
      setError(getXenaErrorMessage(apiError, "تعذر تحديث الرصيد."));
    } finally {
      setBusyKey("");
    }
  };

  const verifyTarget = async (event) => {
    event.preventDefault();
    const validation = validateXenaTargetUid(targetUid);
    if (!validation.valid) return setError(validation.message);
    setBusyKey("target");
    setError("");
    setTargetResult(null);
    try {
      const result = await adminVerifyXenaTarget(token, supplier.id, validation.targetUid);
      setTargetResult(result.verification);
    } catch (apiError) {
      setError(getXenaErrorMessage(apiError, "تعذر التحقق من معرّف Xena."));
    } finally {
      setBusyKey("");
    }
  };

  const setOtpDigit = (index, rawValue) => {
    const value = String(rawValue || "").replace(/\D/g, "").slice(-1);
    setOtpDigits((current) => current.map((digit, digitIndex) => (digitIndex === index ? value : digit)));
    if (value && index < 3) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpPaste = (event) => {
    const digits = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 4).split("");
    if (!digits.length) return;
    event.preventDefault();
    setOtpDigits([0, 1, 2, 3].map((index) => digits[index] || ""));
    otpRefs.current[Math.min(digits.length, 4) - 1]?.focus();
  };

  const primaryAction = status.status === "verification_required" || status.status === "pending"
    ? { label: "إدخال رمز التحقق", onClick: () => openDialog("otp") }
    : { label: status.needsReconnect ? "إعادة ربط الحساب" : "ربط حساب Xena", onClick: () => openDialog("login") };

  return createPortal(
    <div className="fixed inset-0 z-[140] flex items-end justify-center bg-[#07091a]/75 p-0 backdrop-blur-sm sm:items-center sm:p-5" dir="rtl">
      <section role="dialog" aria-modal="true" aria-labelledby="xena-console-title" className="xena-console w-full max-w-[760px] overflow-hidden bg-white dark:bg-[#0b1020]">
        <header className="xena-console-header flex items-center gap-3 px-4 py-3 sm:px-5">
          <span className="xena-console-logo"><Bot className="h-5 w-5" /></span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h2 id="xena-console-title" className="truncate text-sm font-black text-slate-950 dark:text-white">Xena Recharge</h2>
              <span className="xena-console-badge"><Sparkles className="h-3 w-3" /> بوت ذكي</span>
            </div>
            <p className="mt-0.5 truncate text-[10px] font-bold text-slate-500 dark:text-slate-400">إدارة الربط والخدمة من خلال Winnie بشكل آمن</p>
          </div>
          <button type="button" onClick={onClose} disabled={Boolean(busyKey)} aria-label="إغلاق" className="grid h-9 w-9 place-items-center rounded-xl text-slate-500 transition hover:bg-slate-100 disabled:opacity-50 dark:text-slate-300 dark:hover:bg-white/10"><X className="h-5 w-5" /></button>
        </header>

        <div className="xena-console-body overflow-y-auto p-4 sm:p-5">
          <section className="xena-console-hero">
            <div>
              <span className="xena-console-kicker"><ShieldCheck className="h-3.5 w-3.5" /> ربط مزوّد محمي</span>
              <h3>كل ما تحتاجه لتشغيل<br />خدمة Xena.</h3>
              <p>بيانات الحساب تستخدم لبدء جلسة الربط فقط ولا يتم حفظ كلمة المرور في المتصفح.</p>
            </div>
            <div className="xena-console-hero-icon"><KeyRound className="h-9 w-9" /></div>
          </section>

          {(error || notice) && <Message tone={error ? "error" : "success"} message={error || notice} />}

          <section className="xena-connection-overview" aria-label="حالة اتصال Xena">
            <div className="min-w-0">
              <p className="xena-section-eyebrow">حالة الاتصال</p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <StatusBadge status={status.status} />
                {status.maskedUsername && <span dir="ltr" className="text-[10px] font-black text-slate-500 dark:text-slate-400">{status.maskedUsername}</span>}
              </div>
              <p className="mt-2 text-[10px] font-bold text-slate-500 dark:text-slate-400">{getConnectionHint(status)}</p>
            </div>
            <button type="button" onClick={() => void loadStatus()} disabled={busyKey === "status"} className="xena-quiet-button">
              {busyKey === "status" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />} فحص
            </button>
          </section>

          <div className="xena-console-actions">
            <ActionCard icon={KeyRound} title={primaryAction.label} description={status.needsReconnect ? "ابدأ جلسة ربط جديدة للحساب." : "Gmail وكلمة المرور في نافذة خاصة."} accent="violet" onClick={primaryAction.onClick} />
            <ActionCard icon={Settings2} title="إعدادات الخدمة" description="الحدود، السعر، والمنتج الديناميكي." accent="cyan" onClick={() => openDialog("config")} />
            <ActionCard icon={Search} title="تشخيص الخدمة" description="الرصيد والتحقق من Xena ID." accent="slate" onClick={() => openDialog("diagnostics")} />
          </div>

          <p className="xena-console-footnote">تتصل هذه الواجهة بـ Winnie فقط. مفاتيح Xena واتصالاته الداخلية تبقى في الخادم.</p>
        </div>
      </section>

      {dialog === "login" && (
        <DialogShell title={status.needsReconnect ? "إعادة ربط حساب Xena" : "ربط حساب Xena"} subtitle="أدخل بيانات حساب الوكالة لطلب رمز التحقق." icon={LockKeyhole} busy={busyKey === "connect"} onClose={closeDialog}>
          <form onSubmit={beginConnection} className="xena-dialog-form">
            <InputLabel icon={Mail} label="بريد Gmail"><input dir="ltr" type="email" value={connectionForm.username} onChange={(event) => setConnectionForm((current) => ({ ...current, username: event.target.value }))} placeholder="name@gmail.com" autoComplete="username" required /></InputLabel>
            <InputLabel icon={LockKeyhole} label="كلمة المرور"><input dir="ltr" type="password" value={connectionForm.password} onChange={(event) => setConnectionForm((current) => ({ ...current, password: event.target.value }))} placeholder="••••••••" autoComplete="current-password" required /></InputLabel>
            <SecurityNote />
            {error && <Message tone="error" message={error} compact />}
            <button type="submit" disabled={busyKey === "connect"} className="xena-primary-button">{busyKey === "connect" ? <Loader2 className="h-4 w-4 animate-spin" /> : <>متابعة <ArrowLeft className="h-4 w-4" /></>}</button>
          </form>
        </DialogShell>
      )}

      {dialog === "otp" && (
        <DialogShell title="تأكيد رمز التحقق" subtitle="أدخل الرمز المكوّن من 4 أرقام الذي وصلك من Xena." icon={ShieldCheck} busy={busyKey === "otp"} onClose={closeDialog}>
          <form onSubmit={verifyOtp} className="xena-dialog-form text-center">
            <div dir="ltr" className="xena-otp-grid" onPaste={handleOtpPaste}>
              {otpDigits.map((digit, index) => <input key={index} ref={(element) => { otpRefs.current[index] = element; }} value={digit} onChange={(event) => setOtpDigit(index, event.target.value)} onKeyDown={(event) => { if (event.key === "Backspace" && !otpDigits[index] && index > 0) otpRefs.current[index - 1]?.focus(); }} inputMode="numeric" autoComplete={index === 0 ? "one-time-code" : "off"} maxLength={1} aria-label={"رقم " + (index + 1) + " من رمز التحقق"} />)}
            </div>
            {error && <Message tone="error" message={error} compact />}
            <button type="submit" disabled={busyKey === "otp" || otpDigits.join("").length !== 4} className="xena-primary-button">{busyKey === "otp" ? <Loader2 className="h-4 w-4 animate-spin" /> : <><CheckCircle2 className="h-4 w-4" /> تأكيد وربط الحساب</>}</button>
            <button type="button" className="xena-text-button" onClick={() => { setError(""); setDialog("login"); setOtpDigits(["", "", "", ""]); }}>تعديل بيانات الدخول</button>
          </form>
        </DialogShell>
      )}

      {dialog === "config" && (
        <DialogShell title="إعدادات خدمة الشحن" subtitle="هذه الإعدادات تخص المنتج الديناميكي داخل Winnie." icon={Settings2} busy={Boolean(busyKey)} onClose={closeDialog} wide>
          <form onSubmit={saveConfig} className="xena-dialog-form">
            <button type="button" onClick={loadConfig} disabled={busyKey === "config"} className="xena-load-button">{busyKey === "config" ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} تحميل الإعدادات الحالية</button>
            <div className="grid gap-3 sm:grid-cols-2">
              <InputLabel label="اسم المنتج" wide><input value={config.name} onChange={(event) => setConfig((current) => ({ ...current, name: event.target.value }))} /></InputLabel>
              <InputLabel label="الحد الأدنى للمبلغ"><input dir="ltr" value={config.minAmount} onChange={(event) => setConfig((current) => ({ ...current, minAmount: event.target.value.replace(/[^\d]/g, "") }))} inputMode="numeric" /></InputLabel>
              <InputLabel label="الحد الأقصى للمبلغ"><input dir="ltr" value={config.maxAmount} onChange={(event) => setConfig((current) => ({ ...current, maxAmount: event.target.value.replace(/[^\d]/g, "") }))} inputMode="numeric" /></InputLabel>
              <InputLabel label="سعر وحدة المورد"><input dir="ltr" value={config.providerUnitPrice} onChange={(event) => setConfig((current) => ({ ...current, providerUnitPrice: event.target.value }))} inputMode="decimal" /></InputLabel>
              <label className="xena-toggle-row"><span>الخدمة مفعّلة</span><input type="checkbox" checked={config.isActive} onChange={(event) => setConfig((current) => ({ ...current, isActive: event.target.checked }))} /></label>
            </div>
            {error && <Message tone="error" message={error} compact />}
            <div className="grid grid-cols-2 gap-2">
              <button type="submit" disabled={busyKey === "save-config"} className="xena-primary-button">{busyKey === "save-config" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} حفظ</button>
              <button type="button" onClick={syncProduct} disabled={busyKey === "sync-product"} className="xena-secondary-button">{busyKey === "sync-product" ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} مزامنة المنتج</button>
            </div>
          </form>
        </DialogShell>
      )}

      {dialog === "diagnostics" && (
        <DialogShell title="تشخيص خدمة Xena" subtitle="أدوات المدير لفحص الرصيد والتحقق من معرّف اللاعب." icon={CloudCog} busy={Boolean(busyKey)} onClose={closeDialog}>
          <div className="xena-dialog-form">
            <div className="xena-balance-box"><div><span>رصيد Xena</span><strong dir="ltr">{balance?.balance ?? "—"}{balance?.currency ? " " + balance.currency : ""}</strong></div><button type="button" onClick={refreshBalance} disabled={busyKey === "balance"} className="xena-quiet-button">{busyKey === "balance" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />} تحديث</button></div>
            <form onSubmit={verifyTarget} className="xena-dialog-form rounded-2xl border border-slate-200 p-3 dark:border-white/10">
              <InputLabel label="Xena ID"><input dir="ltr" type="text" value={targetUid} onChange={(event) => { setTargetUid(event.target.value.replace(/\D/g, "").slice(0, 50)); setTargetResult(null); }} inputMode="numeric" pattern="[0-9]*" maxLength={50} placeholder="123456" /></InputLabel>
              <button type="submit" disabled={busyKey === "target" || !targetUid} className="xena-secondary-button">{busyKey === "target" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />} تحقق من المعرّف</button>
              {targetResult?.valid && <Message tone="success" compact message={"تم التحقق من " + targetResult.targetUid + (targetResult.user?.nickname ? " — " + targetResult.user.nickname : "")} />}
            </form>
            {error && <Message tone="error" message={error} compact />}
          </div>
        </DialogShell>
      )}
    </div>,
    document.body,
  );
}

function DialogShell({ busy, children, icon: Icon, onClose, subtitle, title, wide = false }) {
  return (
    <div className="xena-dialog-backdrop" role="presentation">
      <section role="dialog" aria-modal="true" aria-label={title} className={"xena-dialog" + (wide ? " xena-dialog-wide" : "")}>
        <header className="flex items-start gap-3 border-b border-slate-100 px-4 py-4 dark:border-white/10">
          <span className="xena-dialog-icon"><Icon className="h-5 w-5" /></span>
          <div className="min-w-0 flex-1"><h3>{title}</h3><p>{subtitle}</p></div>
          <button type="button" onClick={onClose} disabled={busy} aria-label="إغلاق النافذة" className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 disabled:opacity-50 dark:hover:bg-white/10"><X className="h-4 w-4" /></button>
        </header>
        <div className="p-4 sm:p-5">{children}</div>
      </section>
    </div>
  );
}

function ActionCard({ accent, description, icon: Icon, onClick, title }) {
  return <button type="button" onClick={onClick} className={"xena-action-card xena-action-" + accent}><span className="xena-action-icon"><Icon className="h-5 w-5" /></span><span><strong>{title}</strong><small>{description}</small></span><ArrowLeft className="xena-action-arrow h-4 w-4" /></button>;
}

function InputLabel({ children, icon: Icon, label, wide = false }) {
  return <label className={"xena-input-label" + (wide ? " sm:col-span-2" : "")}><span>{Icon && <Icon className="h-3.5 w-3.5" />}{label}</span>{children}</label>;
}

function Message({ compact = false, message, tone }) {
  const isSuccess = tone === "success";
  return <div className={"xena-message " + (isSuccess ? "is-success" : "is-error") + (compact ? " is-compact" : "")}>{isSuccess ? <Check className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}<span>{message}</span></div>;
}

function SecurityNote() {
  return <p className="xena-security-note"><ShieldCheck className="h-4 w-4" /><span>لن تُحفظ كلمة المرور في المتصفح أو مع بيانات المورد؛ تُرسل مرة واحدة لبدء جلسة التحقق الآمنة.</span></p>;
}

function StatusBadge({ status }) {
  const state = String(status || "unchecked").toLowerCase();
  const labels = {
    connected: "متصل", connection_required: "لم يتم الربط", disabled: "الخدمة متوقفة",
    pending: "بانتظار الرمز", reauthentication_required: "يلزم إعادة الربط",
    unchecked: "لم يُفحص بعد", verification_required: "بانتظار الرمز",
  };
  const tone = state === "connected" ? "success" : state === "disabled" ? "danger" : state === "unchecked" ? "muted" : "warning";
  return <span className={"xena-status-badge is-" + tone}><i />{labels[state] || "قيد المراجعة"}</span>;
}

function isServiceDisabled(status = {}) {
  return status.disabledByEnv || status.enabled === false || status.status === "disabled";
}

function getConnectionHint(status = {}) {
  if (isServiceDisabled(status)) return "الخدمة تحتاج تفعيلًا في إعدادات الخادم قبل الربط.";
  if (status.status === "connected") return status.tokenExpiresAtLabel ? "الجلسة صالحة حتى " + status.tokenExpiresAtLabel : "الاتصال جاهز لخدمة الشحن.";
  if (status.status === "verification_required" || status.status === "pending") return "رمز التحقق جاهز للإدخال لإكمال الربط.";
  if (status.needsReconnect) return "يلزم تسجيل الدخول مجددًا لاستعادة الجلسة.";
  return "افحص الحالة أو ابدأ ربط حساب الوكالة.";
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
  const messages = {
    INVALID_XENA_PROVIDER: "هذا المورد غير مهيأ لخدمة Xena Recharge.",
    XENA_CONNECTION_REQUIRED: "يجب ربط حساب Xena أولًا.",
    XENA_INTEGRATION_UNAVAILABLE: "خدمة Xena غير متاحة من الخادم حاليًا.",
    XENA_INVALID_CREDENTIALS: "بيانات الدخول غير صحيحة. راجع البريد وكلمة المرور.",
    XENA_MALFORMED_RESPONSE: "أعادت الخدمة استجابة غير متوقعة. أعد المحاولة لاحقًا.",
    XENA_OTP_EXPIRED: "انتهت صلاحية الرمز. ابدأ جلسة ربط جديدة.",
    XENA_OTP_INVALID: "رمز التحقق غير صحيح.",
    XENA_PROVIDER_AUTH_FAILED: "إعداد مفتاح خدمة Xena في المورد غير صحيح.",
    XENA_PROVIDER_CREDENTIALS_MISSING: "مفتاح ربط Xena غير مضاف لدى المورد في الخادم.",
    XENA_PROVIDER_INACTIVE: "مورد Xena غير نشط. فعّله أولًا.",
    XENA_RATE_LIMITED: "تم تجاوز عدد المحاولات. انتظر قليلًا ثم أعد المحاولة.",
    XENA_RECHARGE_DISABLED: "خدمة Xena معطلة من إعدادات الخادم.",
    XENA_REAUTHENTICATION_REQUIRED: "انتهت الجلسة. أعد ربط حساب Xena.",
    XENA_TARGET_INVALID: "معرّف Xena غير صحيح.",
    XENA_VERIFICATION_UNAVAILABLE: "خدمة التحقق غير متاحة مؤقتًا.",
  };
  return messages[code] || error.userMessage || fallback;
}
