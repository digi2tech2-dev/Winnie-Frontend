import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  AlertTriangle,
  CheckCircle2,
  CircleDollarSign,
  CloudCog,
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
  name: "Xena Dynamic Recharge (Any Amount)",
  providerUnitPrice: "",
};

export default function XenaSupplierModal({ onClose, onUpdated, supplier, token }) {
  const [status, setStatus] = useState(emptyStatus);
  const [balance, setBalance] = useState(null);
  const [config, setConfig] = useState(emptyConfig);
  const [connectionForm, setConnectionForm] = useState({ displayName: "", password: "", username: "" });
  const [otpCode, setOtpCode] = useState("");
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
      setError(getXenaErrorMessage(apiError, "Could not load Xena status."));
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
      setError(getXenaErrorMessage(apiError, "Could not load Xena product config."));
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
    void loadStatus();
    void loadConfig();
  }, [loadConfig, loadStatus, supplier]);

  if (!supplier) return null;

  const challenge = async (kind) => {
    const displayName = connectionForm.displayName.trim();
    const username = connectionForm.username.trim();
    const password = connectionForm.password;

    if (!displayName || !username || !password) {
      setError("Display name, username, and password are required.");
      return;
    }

    setBusyKey(kind);
    setError("");
    try {
      const result = kind === "reconnect"
        ? await reconnectXena(token, supplier.id, { displayName, password, username })
        : await challengeXena(token, supplier.id, { displayName, password, username });
      setStatus(result.status);
      await onUpdated?.();
    } catch (apiError) {
      setError(getXenaErrorMessage(apiError, "Could not start Xena connection."));
    } finally {
      setConnectionForm((current) => ({ ...current, password: "" }));
      setBusyKey("");
    }
  };

  const verifyOtp = async (event) => {
    event.preventDefault();
    const code = otpCode.trim();
    if (!code) return;

    setBusyKey("otp");
    setError("");
    try {
      const result = await verifyXenaOtp(token, supplier.id, code);
      setStatus(result.status);
      await onUpdated?.();
    } catch (apiError) {
      setError(getXenaErrorMessage(apiError, "Could not verify the Xena code."));
    } finally {
      setOtpCode("");
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
      setBalance(null);
      setError(getXenaErrorMessage(apiError, "Could not refresh Xena balance."));
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
      setError(getXenaErrorMessage(apiError, "Could not save Xena product config."));
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
      setError(getXenaErrorMessage(apiError, "Could not sync Xena product."));
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
      setError(getXenaErrorMessage(apiError, "Could not verify this Xena ID."));
    } finally {
      setBusyKey("");
    }
  };

  const modal = (
    <div className="fixed inset-0 z-[140] flex items-end justify-center bg-slate-950/60 sm:items-center sm:p-4">
      <section className="flex max-h-[94dvh] w-full max-w-[760px] flex-col overflow-hidden rounded-t-[28px] bg-white sm:rounded-[28px] dark:bg-[#111827]">
        <header className="flex items-center gap-3 border-b border-slate-100 p-4 dark:border-white/10">
          <ShieldCheck className="h-5 w-5 text-violet-500" />
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-black dark:text-white">Xena Recharge</h2>
            <p className="truncate text-[9px] font-bold text-slate-400">{supplier.name}</p>
          </div>
          <button type="button" onClick={onClose} disabled={Boolean(busyKey)} className="grid h-9 w-9 place-items-center rounded-xl text-slate-400 hover:bg-slate-100 disabled:opacity-60 dark:hover:bg-white/[0.07]">
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="grid gap-3 overflow-y-auto p-4">
          {error && <ErrorMessage message={error} />}

          <section className="grid gap-3 rounded-2xl border border-slate-200 p-3 dark:border-white/10">
            <SectionTitle icon={CloudCog} title="Connection Status" />
            <dl className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              <Info label="Status" value={status.status} dir="ltr" />
              <Info label="Display name" value={status.displayName || "-"} />
              <Info label="Username" value={status.maskedUsername || "-"} dir="ltr" />
              <Info label="Token expires" value={status.tokenExpiresAtLabel || "-"} />
              <Info label="Last checked" value={status.lastCheckedAtLabel || "-"} />
              <Info label="Needs reconnect" value={status.needsReconnect ? "Yes" : "No"} />
              {(status.lastErrorCode || status.lastErrorMessage) && (
                <Info label="Last error" value={[status.lastErrorCode, status.lastErrorMessage].filter(Boolean).join(" - ")} wide />
              )}
            </dl>
            <ActionButton busy={busyKey === "status"} icon={RefreshCw} label="Refresh status" onClick={loadStatus} />
          </section>

          <section className="grid gap-3 rounded-2xl border border-slate-200 p-3 dark:border-white/10">
            <SectionTitle icon={KeyRound} title="Challenge / Reconnect" />
            <div className="grid gap-2 sm:grid-cols-3">
              <Field label="Display name">
                <input value={connectionForm.displayName} onChange={(event) => setConnectionForm((current) => ({ ...current, displayName: event.target.value }))} className={inputClassName} />
              </Field>
              <Field label="Xena email / username">
                <input dir="ltr" value={connectionForm.username} onChange={(event) => setConnectionForm((current) => ({ ...current, username: event.target.value }))} className={inputClassName} autoComplete="off" />
              </Field>
              <Field label="Xena password">
                <input dir="ltr" type="password" value={connectionForm.password} onChange={(event) => setConnectionForm((current) => ({ ...current, password: event.target.value }))} className={inputClassName} autoComplete="new-password" />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <ActionButton busy={busyKey === "challenge"} icon={ShieldCheck} label="Start connection" onClick={() => challenge("challenge")} />
              <ActionButton busy={busyKey === "reconnect"} icon={RefreshCw} label="Reconnect Xena" onClick={() => challenge("reconnect")} tone="sky" />
            </div>
          </section>

          <section className="grid gap-3 rounded-2xl border border-slate-200 p-3 dark:border-white/10">
            <SectionTitle icon={CheckCircle2} title="OTP Verification" />
            <form onSubmit={verifyOtp} className="flex gap-2">
              <input dir="ltr" value={otpCode} onChange={(event) => setOtpCode(event.target.value)} placeholder="1234" className={inputClassName} autoComplete="one-time-code" />
              <button type="submit" disabled={busyKey === "otp" || !otpCode.trim()} className="inline-flex h-10 items-center justify-center gap-1 rounded-xl bg-violet-600 px-4 text-[9px] font-black text-white disabled:opacity-60">
                {busyKey === "otp" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                Verify
              </button>
            </form>
          </section>

          <section className="grid gap-3 rounded-2xl border border-slate-200 p-3 dark:border-white/10">
            <SectionTitle icon={CircleDollarSign} title="Balance" />
            <ActionButton busy={busyKey === "balance"} icon={CircleDollarSign} label="Refresh balance" onClick={refreshBalance} tone="emerald" />
            <div className="rounded-xl bg-slate-50 p-2 text-[10px] font-black text-slate-600 dark:bg-[#0B1220] dark:text-slate-300">
              <p dir="ltr" className="text-right">{balance?.balance || "Not available"}{balance?.currency ? ` ${balance.currency}` : ""}</p>
              {balance?.checkedAtLabel && <p className="mt-1 text-slate-400">Checked {balance.checkedAtLabel}</p>}
            </div>
          </section>

          <form onSubmit={saveConfig} className="grid gap-3 rounded-2xl border border-slate-200 p-3 dark:border-white/10">
            <SectionTitle icon={Save} title="Product Config" />
            <div className="grid gap-2 sm:grid-cols-2">
              <Field label="Name" wide>
                <input value={config.name} onChange={(event) => setConfig((current) => ({ ...current, name: event.target.value }))} className={inputClassName} />
              </Field>
              <Field label="Min amount">
                <input dir="ltr" value={config.minAmount} onChange={(event) => setConfig((current) => ({ ...current, minAmount: event.target.value.replace(/[^\d]/g, "") }))} className={inputClassName} inputMode="numeric" />
              </Field>
              <Field label="Max amount">
                <input dir="ltr" value={config.maxAmount} onChange={(event) => setConfig((current) => ({ ...current, maxAmount: event.target.value.replace(/[^\d]/g, "") }))} className={inputClassName} inputMode="numeric" />
              </Field>
              <Field label="Provider unit price">
                <input dir="ltr" value={config.providerUnitPrice} onChange={(event) => setConfig((current) => ({ ...current, providerUnitPrice: event.target.value }))} className={inputClassName} inputMode="decimal" />
              </Field>
              <label className="flex h-10 items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-3 text-[10px] font-black text-slate-600 dark:border-white/10 dark:bg-[#0B1220] dark:text-white">
                <span>Active</span>
                <input type="checkbox" checked={config.isActive} onChange={(event) => setConfig((current) => ({ ...current, isActive: event.target.checked }))} className="h-4 w-4 accent-violet-600" />
              </label>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button type="submit" disabled={busyKey === "save-config"} className="inline-flex h-10 items-center justify-center gap-1 rounded-xl bg-violet-600 px-4 text-[9px] font-black text-white disabled:opacity-60">
                {busyKey === "save-config" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                Save config
              </button>
              <ActionButton busy={busyKey === "sync-product"} icon={RefreshCw} label="Sync product" onClick={syncProduct} tone="sky" />
            </div>
          </form>

          <section className="grid gap-3 rounded-2xl border border-slate-200 p-3 dark:border-white/10">
            <SectionTitle icon={Search} title="Verify Xena ID" />
            <form onSubmit={verifyTarget} className="flex gap-2">
              <input dir="ltr" value={targetUid} onChange={(event) => { setTargetUid(event.target.value); setTargetResult(null); }} placeholder="001234" className={inputClassName} inputMode="numeric" />
              <button type="submit" disabled={busyKey === "target" || !targetUid.trim()} className="inline-flex h-10 items-center justify-center gap-1 rounded-xl bg-slate-900 px-4 text-[9px] font-black text-white disabled:opacity-60 dark:bg-white dark:text-slate-950">
                {busyKey === "target" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
                Verify
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

  if (!String(config.name || "").trim()) return "Product name is required.";
  if (!Number.isSafeInteger(minAmount) || minAmount <= 0) return "Min amount must be a positive integer.";
  if (!Number.isSafeInteger(maxAmount) || maxAmount <= 0) return "Max amount must be a positive integer.";
  if (maxAmount < minAmount) return "Max amount must be greater than or equal to min amount.";
  if (!Number.isFinite(providerUnitPrice) || providerUnitPrice <= 0) return "Provider unit price must be positive.";
  return "";
}

function getXenaErrorMessage(error = {}, fallback) {
  const code = String(error.code || error.payload?.code || "").toUpperCase();
  const map = {
    XENA_CONNECTION_REQUIRED: "Xena connection is required.",
    XENA_INTEGRATION_UNAVAILABLE: "Xena is temporarily unavailable.",
    XENA_MALFORMED_RESPONSE: "Xena returned an unexpected response.",
    XENA_PROVIDER_AUTH_FAILED: "Check the Digiteech API key or reconnect Xena.",
    XENA_RATE_LIMITED: "Please try again later.",
    XENA_REAUTHENTICATION_REQUIRED: "Reconnect Xena.",
    XENA_TARGET_INVALID: "Xena ID is invalid.",
    XENA_VERIFICATION_UNAVAILABLE: "Verification is temporarily unavailable.",
  };

  return map[code] || error.userMessage || fallback;
}
