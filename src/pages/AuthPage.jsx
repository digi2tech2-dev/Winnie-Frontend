import { Mail, MailCheck, KeyRound, UserPlus, ShieldCheck } from "lucide-react";
import Brand from "../components/Brand";
import { useFeedback } from "../components/FeedbackProvider";
import { useToast } from "../components/ToastProvider";

const authConfig = {
  register: {
    icon: UserPlus,
    title: "Create your account",
    subtitle: "Join Winnie Fun and manage global top-ups from one premium wallet.",
    button: "Create Account",
    footer: "Already have an account?",
    footerAction: "Login",
    target: "login",
  },
  forgot: {
    icon: KeyRound,
    title: "Reset your password",
    subtitle: "Enter your email and we will send a secure recovery link.",
    button: "Send Reset Link",
    footer: "Remembered it?",
    footerAction: "Login",
    target: "login",
  },
  verify: {
    icon: MailCheck,
    title: "Verify your email",
    subtitle: "Enter the verification code sent to user@winniefun.com.",
    button: "Verify Email",
    footer: "Need another code?",
    footerAction: "Resend",
    target: "verify-email",
  },
  setup: {
    icon: ShieldCheck,
    title: "Setup your profile",
    subtitle: "Complete your account details to unlock wallet and order features.",
    button: "Finish Setup",
    footer: "Want to edit later?",
    footerAction: "Dashboard",
    target: "dashboard",
  },
};

export default function AuthPage({ mode = "register", onNavigate }) {
  const config = authConfig[mode] || authConfig.register;
  const Icon = config.icon;
  const { showToast } = useToast();
  const { showFeedback } = useFeedback();

  const handleSubmit = () => {
    showToast({ type: "success", title: config.button, message: "Mock authentication action completed." });
    showFeedback({
      type: "success",
      title: "Authentication ready",
      message: "This flow is wired with mock UX and ready for backend integration.",
      confirmLabel: "Continue",
      onConfirm: () => onNavigate(mode === "forgot" ? "verify-email" : "dashboard"),
    });
  };

  return (
    <div className="grid min-h-[calc(100vh-140px)] place-items-center py-8">
      <div className="glass-panel w-full max-w-[560px] rounded-lg p-6 sm:p-8">
        <div className="flex flex-col items-center text-center">
          <Brand />
          <span className="mt-8 grid h-14 w-14 place-items-center rounded-lg bg-gradient-to-br from-royal to-pulse text-white shadow-glow">
            <Icon className="h-7 w-7" />
          </span>
          <h1 className="mt-5 text-3xl font-black">{config.title}</h1>
          <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500 dark:text-slate-400">
            {config.subtitle}
          </p>
        </div>

        <form className="mt-8 space-y-4">
          {mode === "register" && <Input label="Full Name" placeholder="Winnie User" />}
          {mode === "setup" && (
            <>
              <Input label="Display Name" placeholder="Winnie User" />
              <Input label="Phone Number" placeholder="+1 555 0148" />
            </>
          )}
          {mode !== "verify" && <Input label="Email" type="email" placeholder="user@winniefun.com" icon={Mail} />}
          {mode === "register" && <Input label="Password" type="password" placeholder="Create a strong password" icon={KeyRound} />}
          {mode === "verify" && <Input label="Verification Code" placeholder="6 digit code" />}
          <button
            type="button"
            onClick={handleSubmit}
            className="interactive-ring h-12 w-full rounded-lg bg-gradient-to-r from-royal to-pulse text-sm font-black text-white shadow-glow"
          >
            {config.button}
          </button>
        </form>

        <p className="mt-7 text-center text-sm text-slate-500 dark:text-slate-400">
          {config.footer}{" "}
          <button type="button" onClick={() => onNavigate(config.target)} className="font-black text-royal dark:text-pulse">
            {config.footerAction}
          </button>
        </p>
      </div>
    </div>
  );
}

function Input({ label, type = "text", placeholder, icon: Icon }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-black text-slate-600 dark:text-slate-300">{label}</span>
      <div className="relative">
        {Icon && <Icon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />}
        <input
          type={type}
          placeholder={placeholder}
          className={`h-12 w-full rounded-lg border border-slate-200 bg-white/80 px-4 outline-none transition placeholder:text-slate-400 focus:border-pulse focus:ring-4 focus:ring-pulse/15 dark:border-white/10 dark:bg-white/[0.065] ${Icon ? "pl-12" : ""}`}
        />
      </div>
    </label>
  );
}
