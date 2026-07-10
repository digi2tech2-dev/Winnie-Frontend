import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useToast } from "../../components/ToastProvider";
import { useAuth } from "../../context/AuthContext";
import { getDefaultRouteForRole } from "../../utils/authRoles";

function getQueryParam(params, key) {
  return String(params.get(key) || "").trim();
}

export default function GoogleCallback() {
  const [message, setMessage] = useState("Completing Google login...");
  const handledRef = useRef(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { refreshCurrentUser } = useAuth();

  useEffect(() => {
    if (handledRef.current) return;
    handledRef.current = true;

    let cancelled = false;
    const params = new URLSearchParams(location.search);
    const error = getQueryParam(params, "error");
    const status = getQueryParam(params, "status");
    const responseMessage = getQueryParam(params, "message");
    const token = getQueryParam(params, "token") || getQueryParam(params, "accessToken");

    const fail = (nextMessage) => {
      if (cancelled) return;
      setMessage(nextMessage);
      showToast({ type: "error", title: "Google login failed", message: nextMessage });
      navigate("/login", { replace: true });
    };

    if (error) {
      fail(responseMessage || error);
      return () => {
        cancelled = true;
      };
    }

    if (!token) {
      fail(responseMessage || (status === "pending" ? "Your account is awaiting approval." : "Google login did not return a valid session."));
      return () => {
        cancelled = true;
      };
    }

    const completeLogin = async () => {
      const result = await refreshCurrentUser(token);
      if (cancelled) return;

      if (!result.ok) {
        fail(result.message || "Google login did not return a valid session.");
        return;
      }

      showToast({ type: "success", title: "Google login", message: "Logged in successfully." });
      navigate(getDefaultRouteForRole(result.user?.role), { replace: true });
    };

    void completeLogin();

    return () => {
      cancelled = true;
    };
  }, [location.search, navigate, refreshCurrentUser, showToast]);

  return (
    <div className="mx-auto grid min-h-[calc(100vh-92px)] max-w-[720px] place-items-center px-4 py-8 text-center">
      <div className="w-full rounded-2xl border border-white/70 bg-white/[0.82] p-6 shadow-[0_18px_44px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-white/[0.075]">
        <p className="text-sm font-black text-slate-700 dark:text-slate-200">{message}</p>
      </div>
    </div>
  );
}
