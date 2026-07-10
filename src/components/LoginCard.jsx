import { Eye, Lock, Mail } from "lucide-react";
import Brand from "./Brand";
import { useFeedback } from "./FeedbackProvider";
import { useToast } from "./ToastProvider";
import { useAuth } from "../context/AuthContext";

export default function LoginCard({ onNavigate }) {
  const { showToast } = useToast();
  const { showFeedback } = useFeedback();
  const { loginWithGoogle } = useAuth();

  const login = (method = "Email") => {
    showToast({
      type: "success",
      title: `${method} login successful`,
      message: "Welcome back to Winnie Fun.",
    });
    showFeedback({
      type: "success",
      title: "Login complete",
      message: "You can now view dashboard, wallet and orders.",
      confirmLabel: "Open Dashboard",
      onConfirm: () => onNavigate?.("dashboard"),
    });
  };

  const continueWithGoogle = () => {
    const result = loginWithGoogle();
    if (!result.ok) {
      showToast({
        type: "error",
        title: "Google login",
        message: result.message,
      });
    }
  };

  return (
    <div className="glass-panel mx-auto w-full max-w-[520px] rounded-lg p-6 sm:p-8">
      <div className="flex flex-col items-center text-center">
        <Brand />
        <h1 className="mt-8 text-3xl font-black">Welcome Back!</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Login to your account and continue
        </p>
      </div>

      <form className="mt-8 space-y-4">
        <label className="relative block">
          <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            type="email"
            placeholder="Enter your email"
            className="h-12 w-full rounded-lg border border-slate-200 bg-white/80 px-4 py-4 pl-12 outline-none transition placeholder:text-slate-400 focus:border-pulse focus:ring-4 focus:ring-pulse/15 dark:border-white/10 dark:bg-white/[0.065]"
          />
        </label>

        <label className="relative block">
          <Lock className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            type="password"
            placeholder="Enter your password"
            className="h-12 w-full rounded-lg border border-slate-200 bg-white/80 px-4 py-4 pl-12 pr-12 outline-none transition placeholder:text-slate-400 focus:border-pulse focus:ring-4 focus:ring-pulse/15 dark:border-white/10 dark:bg-white/[0.065]"
          />
          <button
            type="button"
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-royal"
            aria-label="Show password"
            title="Show password"
          >
            <Eye className="h-5 w-5" />
          </button>
        </label>

        <div className="flex items-center justify-between gap-3 text-sm">
          <label className="flex items-center gap-2 font-semibold text-slate-600 dark:text-slate-300">
            <input
              type="checkbox"
              defaultChecked
              className="h-4 w-4 rounded border-slate-300 text-royal focus:ring-pulse"
            />
            Remember me
          </label>
          <button type="button" onClick={() => onNavigate?.("forgot-password")} className="font-black text-royal dark:text-pulse">
            Forgot Password?
          </button>
        </div>

        <button
          type="button"
          onClick={() => login("Email")}
          className="interactive-ring h-12 w-full rounded-lg bg-gradient-to-r from-royal to-pulse text-sm font-black text-white shadow-glow"
        >
          Login
        </button>

        <div className="flex items-center gap-4 py-2 text-xs font-bold text-slate-400">
          <span className="h-px flex-1 bg-slate-200 dark:bg-white/10" />
          or
          <span className="h-px flex-1 bg-slate-200 dark:bg-white/10" />
        </div>

        <button
          type="button"
          onClick={continueWithGoogle}
          className="interactive-ring flex h-12 w-full items-center justify-center gap-3 rounded-lg border border-slate-200 bg-white text-sm font-black text-slate-700 dark:border-white/10 dark:bg-[#151827] dark:text-[#F8F9FA]"
        >
          <span className="text-lg font-black text-blue-500">G</span>
          Continue with Google
        </button>
      </form>

      <p className="mt-7 text-center text-sm text-slate-500 dark:text-slate-400">
        Don't have an account?{" "}
        <button type="button" onClick={() => onNavigate?.("register")} className="font-black text-royal dark:text-pulse">
          Sign Up
        </button>
      </p>
    </div>
  );
}
