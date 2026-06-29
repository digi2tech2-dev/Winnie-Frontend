import { useCallback, useEffect, useRef, useState } from "react";
import { Bookmark, Eye, EyeOff, Globe2, KeyRound, LockKeyhole, LogOut, MoreHorizontal, Pencil, Phone, Save, Settings, Share2, ShieldCheck, UserRound, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getProfile } from "../api/profile";
import { getMyReferrals } from "../api/referrals";
import BackButton from "../components/BackButton";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/ToastProvider";

const profileCountries = ["الولايات المتحدة", "مصر", "السعودية", "الإمارات", "الكويت", "قطر"];
const countryDialCodes = {
  "الولايات المتحدة": "+1",
  "مصر": "+20",
  "السعودية": "+966",
  "الإمارات": "+971",
  "الكويت": "+965",
  "قطر": "+974",
};

function getNationalPhone(phone, country) {
  const dialCode = countryDialCodes[country] || "";
  const withoutDialCode = phone.trim().startsWith(dialCode) ? phone.trim().slice(dialCode.length) : phone;

  return withoutDialCode.replace(/\D/g, "");
}

export default function ProfilePage({ basePath = "/customer" }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(true);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [pendingMenuAction, setPendingMenuAction] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState("");
  const avatarInputRef = useRef(null);
  const navigate = useNavigate();
  const { token, user, logout } = useAuth();
  const { showToast } = useToast();
  const activeProfile = profileData || user || {};
  const displayName = activeProfile.name || "Winnie user";
  const email = activeProfile.email || "";
  const avatarUrl = activeProfile.avatar || "/hero-winnie-fun.png";
  const tier = activeProfile.group?.name || activeProfile.tier || "Member";
  const country = activeProfile.country || "";
  const phone = activeProfile.phone || "";
  const handle = `@${email.split("@")[0].replace(/[^a-zA-Z0-9]/g, "").slice(0, 10) || "winnie"}`;

  useEffect(() => {
    if (!token) return undefined;

    let cancelled = false;

    const loadProfile = async () => {
      setProfileLoading(true);
      setProfileError("");

      try {
        const result = await getProfile(token);
        if (!cancelled) setProfileData(result);
      } catch (requestError) {
        if (!cancelled) {
          setProfileError(requestError.userMessage || "Unable to load profile.");
          setProfileData(null);
        }
      } finally {
        if (!cancelled) setProfileLoading(false);
      }
    };

    void loadProfile();

    return () => {
      cancelled = true;
    };
  }, [token]);

  const shareInvite = useCallback(async () => {
    if (basePath !== "/customer") {
      showToast({
        type: "info",
        title: "Customer action only",
        message: "Referral invite links are available from the customer workspace only.",
      });
      return;
    }

    if (!token) {
      showToast({ type: "error", title: "Login required", message: "Please sign in before copying your invite link." });
      return;
    }

    try {
      const result = await getMyReferrals(token);
      const inviteText = result.summary?.referralLink || result.summary?.inviteLink || result.summary?.referralCode || "";

      if (!inviteText) {
        showToast({ type: "warning", title: "Invite unavailable", message: "Referral data is not available yet." });
        return;
      }

      if (!navigator.clipboard?.writeText) {
        throw new Error("Clipboard is not available");
      }

      await navigator.clipboard.writeText(inviteText);
      showToast({ type: "success", title: "Invite link copied", message: inviteText });
    } catch (requestError) {
      showToast({
        type: "error",
        title: "Unable to copy invite",
        message: requestError.userMessage || requestError.message || "Please try again.",
      });
    }
  }, [basePath, showToast, token]);

  const showProfileWriteNotice = useCallback(() => {
    showToast({
      type: "info",
      title: "Read-only profile",
      message: "Profile updates will be connected in a later phase.",
    });
  }, [showToast]);

  const handleLogout = useCallback(() => {
    logout();
    navigate("/");
  }, [logout, navigate]);

  useEffect(() => {
    if (menuOpen || !pendingMenuAction) return;

    const action = pendingMenuAction;
    setPendingMenuAction(null);

    if (action === "shareInvite") {
      void shareInvite();
      return;
    }

    if (action === "changePassword") {
      showProfileWriteNotice();
      return;
    }

    if (action === "settings") {
      navigate(`${basePath}/settings`);
      return;
    }

    if (action === "logout") {
      handleLogout();
    }
  }, [basePath, handleLogout, menuOpen, navigate, pendingMenuAction, shareInvite, showProfileWriteNotice]);

  const closeMenu = () => {
    setPendingMenuAction(null);
    setMenuOpen(false);
  };

  const runAfterMenuCloses = (action) => {
    setPendingMenuAction(action);
    setMenuOpen(false);
  };

  const openAvatarPicker = () => {
    showProfileWriteNotice();
  };

  const changeAvatar = (event) => {
    showProfileWriteNotice();
    event.target.value = "";
  };

  return (
    <div
      dir="rtl"
      className="-mx-4 -mt-6 min-h-[calc(100vh-120px)] overflow-hidden bg-[linear-gradient(180deg,#FFFFFF_0%,#F8FCFF_100%)] text-slate-950 dark:bg-[linear-gradient(180deg,#050816_0%,#0A1120_45%,#0D1324_100%)] dark:text-[#C4C9D4] sm:-mx-6 lg:-mx-8"
    >
      <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={changeAvatar} />
      <section className="relative min-h-[390px] overflow-hidden bg-[linear-gradient(135deg,#BAF1FF_0%,#E8E0FF_48%,#FFC2DC_100%)] px-4 pb-7 pt-4 dark:bg-[linear-gradient(135deg,#070A1E_0%,#111827_48%,#24133D_100%)] sm:min-h-[460px] sm:px-8 sm:pb-8 sm:pt-7">
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.34)_0%,rgba(255,255,255,0.06)_58%,rgba(248,252,255,0)_100%),linear-gradient(90deg,rgba(125,211,252,0.34)_0%,rgba(255,255,255,0)_42%,rgba(244,114,182,0.34)_100%)] dark:bg-[linear-gradient(180deg,rgba(139,92,246,0.24)_0%,rgba(56,189,248,0.08)_58%,rgba(5,8,22,0)_100%),linear-gradient(90deg,rgba(56,189,248,0.18)_0%,rgba(5,8,22,0)_44%,rgba(168,85,247,0.24)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-28 bg-[linear-gradient(180deg,rgba(248,252,255,0)_0%,rgba(248,252,255,1)_100%)] dark:bg-[linear-gradient(180deg,rgba(5,8,22,0)_0%,rgba(5,8,22,0.94)_100%)]" />
        <BackButton
          className="absolute right-4 top-4 z-20 mb-0 sm:right-8 sm:top-7"
          fallbackPath={`${basePath}/dashboard`}
          hiddenPaths={[`${basePath}/dashboard`]}
        />
        <div className="relative z-10 mx-auto mt-12 grid max-w-[760px] grid-cols-[92px_minmax(0,1fr)_92px] items-center gap-2 sm:mt-14 sm:grid-cols-[150px_minmax(0,1fr)_150px] sm:gap-3">
          <button
            type="button"
            onClick={() => setEditing((value) => !value)}
            className="interactive-ring grid h-11 w-11 place-items-center justify-self-start rounded-full border border-white/70 bg-white/82 text-slate-800 shadow-[0_12px_28px_rgba(14,165,233,0.12)] backdrop-blur-xl dark:border-white/10 dark:bg-[#111827]/86 dark:text-[#E9D5FF] dark:shadow-[0_0_20px_rgba(139,92,246,0.20)] sm:h-14 sm:w-14"
            aria-label="تعديل الملف الشخصي"
            title="تعديل الملف الشخصي"
          >
            <Pencil className="h-5 w-5 sm:h-7 sm:w-7" />
          </button>

          <h1 className="min-w-0 truncate px-1 text-center text-xl font-black text-slate-950 drop-shadow-[0_2px_14px_rgba(255,255,255,0.50)] dark:text-white dark:drop-shadow-[0_4px_18px_rgba(139,92,246,0.28)] sm:px-2 sm:text-3xl">
            {displayName}
          </h1>

          <div className="flex items-center justify-self-end gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => navigate(`${basePath}/settings`)}
              className="interactive-ring grid h-11 w-11 place-items-center rounded-full border border-white/70 bg-white/82 text-slate-800 shadow-[0_12px_28px_rgba(14,165,233,0.12)] backdrop-blur-xl dark:border-white/10 dark:bg-[#111827]/86 dark:text-[#E9D5FF] dark:shadow-[0_0_20px_rgba(139,92,246,0.20)] sm:h-14 sm:w-14"
              aria-label="إعدادات الملف"
              title="إعدادات الملف"
            >
              <Settings className="h-5 w-5 sm:h-7 sm:w-7" />
            </button>
            <button
              type="button"
              className="interactive-ring hidden h-14 w-14 place-items-center rounded-full border border-white/70 bg-white/82 text-slate-800 shadow-[0_16px_38px_rgba(14,165,233,0.14)] backdrop-blur-xl dark:border-white/10 dark:bg-[#111827]/86 dark:text-[#E9D5FF] dark:shadow-[0_0_20px_rgba(139,92,246,0.20)] md:grid"
              aria-label="المحفوظات"
              title="المحفوظات"
            >
              <Bookmark className="h-7 w-7" />
            </button>
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="interactive-ring grid h-11 w-11 place-items-center rounded-full border border-white/70 bg-white/82 text-slate-800 shadow-[0_12px_28px_rgba(14,165,233,0.12)] backdrop-blur-xl dark:border-white/10 dark:bg-[#111827]/86 dark:text-[#E9D5FF] dark:shadow-[0_0_20px_rgba(139,92,246,0.20)] sm:h-14 sm:w-14"
              aria-label="المزيد"
              title="المزيد"
            >
              <MoreHorizontal className="h-6 w-6 sm:h-8 sm:w-8" />
            </button>
          </div>
        </div>

        <div className="relative z-10 mx-auto mt-7 flex max-w-[760px] flex-col items-center text-center sm:mt-12">
          <div className="relative">
            <AvatarPicture src={avatarUrl} className="h-28 w-28 border-4 border-white/76 shadow-[0_20px_48px_rgba(14,165,233,0.18)] dark:border-white/16 dark:shadow-[0_0_34px_rgba(139,92,246,0.22)] sm:h-36 sm:w-36" />
            <button
              type="button"
              onClick={openAvatarPicker}
              className="interactive-ring absolute bottom-1 right-1 grid h-11 w-11 place-items-center rounded-full border border-white/80 bg-white text-[#7C3AED] shadow-[0_12px_26px_rgba(139,92,246,0.20)] dark:border-[#8B5CF6]/34 dark:bg-[#111827] dark:text-[#E9D5FF] dark:shadow-[0_0_18px_rgba(139,92,246,0.24)]"
              aria-label="تعديل صورة الحساب"
              title="تعديل صورة الحساب"
            >
              <Pencil className="h-5 w-5" />
            </button>
          </div>
          <p dir="ltr" className="mt-4 text-2xl font-black text-slate-950 drop-shadow-[0_2px_14px_rgba(255,255,255,0.55)] dark:text-white dark:drop-shadow-[0_4px_18px_rgba(139,92,246,0.24)] sm:mt-6 sm:text-3xl">{handle}</p>
          <span className="mt-2 inline-flex rounded-full border border-[#C4B5FD]/55 bg-white/78 px-4 py-1.5 text-xs font-black text-[#7C3AED] shadow-[0_12px_28px_rgba(14,165,233,0.12)] backdrop-blur-xl dark:border-[#8B5CF6]/32 dark:bg-[#111827]/78 dark:text-[#E9D5FF] sm:mt-4 sm:py-2 sm:text-sm">
            {tier}
          </span>
        </div>
      </section>

      {(profileLoading || profileError) && (
        <section className="relative z-10 mx-auto mt-4 w-[calc(100%-32px)] max-w-[760px] rounded-2xl border border-sky-100 bg-white/80 px-4 py-3 text-sm font-bold text-slate-600 shadow-[0_12px_28px_rgba(14,165,233,0.10)] dark:border-white/10 dark:bg-[#111827] dark:text-[#C4C9D4]">
          {profileLoading ? "Loading backend profile..." : profileError}
        </section>
      )}

      {editing && (
        <EditProfilePanel
          key={`${displayName}-${email}-${country}-${phone}`}
          countryValue={country}
          displayName={displayName}
          email={email}
          onChangePassword={showProfileWriteNotice}
          phoneValue={phone}
        />
      )}

      {menuOpen && (
        <ProfileMenu
          displayName={displayName}
          avatarUrl={avatarUrl}
          onClose={closeMenu}
          onShareInvite={() => runAfterMenuCloses("shareInvite")}
          onChangePassword={() => runAfterMenuCloses("changePassword")}
          onSettings={() => runAfterMenuCloses("settings")}
          onLogout={() => runAfterMenuCloses("logout")}
        />
      )}

      {passwordOpen && <PasswordModal onClose={() => setPasswordOpen(false)} showToast={showToast} />}
    </div>
  );
}

function EditProfilePanel({ countryValue, displayName, email, onChangePassword, phoneValue }) {
  const initialCountry = countryValue || profileCountries[0];
  const [country, setCountry] = useState(initialCountry);
  const [phone, setPhone] = useState(() => getNationalPhone(phoneValue || "", initialCountry));
  const selectedDialCode = countryDialCodes[country] || "";

  return (
    <section className="relative z-10 mx-auto mt-4 w-[calc(100%-32px)] max-w-[760px] rounded-[24px] border border-[#C4B5FD]/45 bg-[linear-gradient(180deg,#FFFFFF_0%,#F8FCFF_100%)] p-4 shadow-[0_22px_58px_rgba(14,165,233,0.16)] backdrop-blur-xl dark:border-[#8B5CF6]/24 dark:bg-[linear-gradient(180deg,#111827_0%,#0D1324_100%)] dark:shadow-[0_0_28px_rgba(139,92,246,0.20)] sm:p-5">
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-2xl border border-[#C4B5FD]/45 bg-[linear-gradient(145deg,#F5F3FF,#E0F2FE)] text-[#7C3AED] shadow-[0_10px_24px_rgba(139,92,246,0.12)] dark:border-[#8B5CF6]/34 dark:bg-[linear-gradient(145deg,#1A2335,#111827)] dark:text-[#E9D5FF] dark:shadow-[0_0_18px_rgba(139,92,246,0.18)]">
          <UserRound className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-xl font-black text-slate-950 dark:text-[#F8F9FA]">إعدادات الملف الشخصي</h2>
          <p className="text-sm font-semibold text-slate-600 dark:text-[#8A94A7]">تعديل بيانات حسابك الأساسية</p>
        </div>
      </div>

      <form className="mt-5 grid gap-3 sm:grid-cols-2">
        <Field label="الاسم" defaultValue={displayName} readOnly helper="Profile editing is read-only in this phase." />
        <Field
          label="البريد الإلكتروني"
          defaultValue={email}
          readOnly
          helper="لا يمكن تغيير البريد الإلكتروني المرتبط بالحساب."
        />
        <CountrySelectField disabled label="الدولة" value={country} options={profileCountries} onChange={setCountry} />
        <ProfilePhoneField label="الهاتف" countryCode={selectedDialCode} readOnly value={phone} onChange={setPhone} />
        <button
          type="button"
          disabled
          className="mt-2 inline-flex h-12 cursor-not-allowed items-center justify-center gap-2 rounded-xl bg-slate-200 text-sm font-black text-slate-500 dark:bg-white/10 dark:text-white/40 sm:col-span-2"
        >
          <Save className="h-5 w-5" />
          حفظ التعديلات
        </button>
        <button
          type="button"
          onClick={onChangePassword}
          className="interactive-ring inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-[#C4B5FD]/55 bg-white text-sm font-black text-[#7C3AED] shadow-[0_12px_28px_rgba(14,165,233,0.12)] dark:border-[#8B5CF6]/32 dark:bg-[#0D1324] dark:text-[#E9D5FF] dark:shadow-[0_0_18px_rgba(139,92,246,0.18)] sm:col-span-2"
          aria-label="تغيير كلمة السر"
        >
          <LockKeyhole className="h-5 w-5" />
          تغيير كلمة السر
        </button>
      </form>
    </section>
  );
}

function ProfileMenu({ displayName, avatarUrl, onClose, onShareInvite, onChangePassword, onSettings, onLogout }) {
  return (
    <div className="fixed inset-0 z-[150] flex items-end bg-[#050816]" role="dialog" aria-modal="true" onClick={onClose}>
      <div
        className="max-h-[92vh] w-full overflow-y-auto rounded-t-[30px] border-t border-[#C4B5FD]/45 bg-white px-5 pb-6 pt-3 text-center text-slate-950 shadow-[0_-24px_70px_rgba(14,165,233,0.16)] dark:border-[#8B5CF6]/24 dark:bg-[#111827] dark:text-[#F8F9FA] dark:shadow-[0_0_28px_rgba(139,92,246,0.20)] sm:px-8"
        onClick={(event) => event.stopPropagation()}
      >
        <span className="mx-auto mb-4 block h-1.5 w-12 rounded-full bg-[#C4B5FD]/55 dark:bg-[#8B5CF6]/34" />
        <div className="mx-auto w-full max-w-[760px]">
          <AvatarPicture src={avatarUrl} className="mx-auto h-24 w-24 border-4 border-[#E9D5FF] shadow-[0_16px_38px_rgba(139,92,246,0.16)] dark:border-[#8B5CF6]/32 dark:shadow-[0_0_24px_rgba(139,92,246,0.22)]" />
          <h2 className="mt-4 text-2xl font-black text-slate-950 dark:text-[#F8F9FA]">{displayName}</h2>

          <div className="mx-auto mt-6 w-full max-w-[760px] space-y-2 rounded-[22px] bg-white p-2 text-right shadow-[0_14px_34px_rgba(14,165,233,0.10)] dark:bg-[#0D1324] dark:shadow-[0_0_22px_rgba(139,92,246,0.16)]">
            <MenuButton icon={Share2} label="مشاركة رمز الدعوة" onClick={onShareInvite} />
            <MenuButton icon={LockKeyhole} label="تغيير كلمة السر" onClick={onChangePassword} />
            <MenuButton icon={Settings} label="الإعدادات" onClick={onSettings} />
            <MenuButton icon={LogOut} label="تسجيل الخروج" onClick={onLogout} danger />
          </div>

          <button
            type="button"
            onClick={onClose}
            className="mx-auto mt-5 inline-flex h-14 w-full max-w-[760px] items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#7C3AED] to-[#A855F7] px-8 text-base font-black text-white shadow-[0_16px_38px_rgba(139,92,246,0.34)] transition hover:-translate-y-0.5 dark:from-[#8B5CF6] dark:to-[#A855F7] dark:shadow-[0_0_26px_rgba(139,92,246,0.32)]"
          >
            <X className="h-5 w-5" />
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
}

function AvatarPicture({ className, src = "/hero-winnie-fun.png" }) {
  return (
    <div className={`${className} overflow-hidden rounded-full bg-white/84 dark:bg-[#111827]`}>
      <img
        src={src}
        alt=""
        className="h-full w-full object-cover"
        style={{ objectPosition: "72% 27%" }}
      />
    </div>
  );
}

function MenuButton({ icon: Icon, label, onClick, danger = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-12 w-full items-center gap-3 rounded-2xl border px-4 text-sm font-black transition ${
        danger
          ? "border-rose-100 bg-rose-50 text-rose-600 hover:bg-rose-100 dark:border-rose-400/24 dark:bg-[#2A111A] dark:text-rose-200 dark:hover:bg-[#351520]"
          : "border-sky-100 bg-white text-slate-700 shadow-[0_8px_20px_rgba(14,165,233,0.08)] hover:border-[#C4B5FD] hover:bg-[#F5F3FF] hover:text-[#7C3AED] dark:border-white/10 dark:bg-[#111827] dark:text-[#C4C9D4] dark:shadow-none dark:hover:border-[#A855F7]/45 dark:hover:bg-[#1A2335] dark:hover:text-[#E9D5FF]"
      }`}
    >
      <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl ${danger ? "bg-rose-100 dark:bg-[#3B1823]" : "bg-[#F5F3FF] dark:bg-[#1A2335]"}`}>
        <Icon className="h-4 w-4" />
      </span>
      <span className="flex-1">{label}</span>
    </button>
  );
}

function PasswordModal({ onClose, showToast }) {
  const [form, setForm] = useState({ current: "", next: "", repeat: "" });
  const [confirming, setConfirming] = useState(false);

  const updateField = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const requestSave = (event) => {
    event.preventDefault();

    if (!form.current || !form.next || !form.repeat) {
      showToast({ type: "error", title: "بيانات ناقصة", message: "اكتب كلمة السر الحالية والجديدة مرتين." });
      return;
    }

    if (form.next.length < 6) {
      showToast({ type: "error", title: "كلمة السر قصيرة", message: "كلمة السر الجديدة لازم تكون 6 أحرف على الأقل." });
      return;
    }

    if (form.next !== form.repeat) {
      showToast({ type: "error", title: "كلمة السر غير متطابقة", message: "اكتب كلمة السر الجديدة بنفس الشكل في الخانتين." });
      return;
    }

    setConfirming(true);
  };

  const confirmSave = () => {
    setConfirming(false);
    showToast({ type: "info", title: "Read-only profile", message: "Password changes will be connected in a later phase." });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[220] grid place-items-center bg-[#050816] px-4" role="dialog" aria-modal="true" onClick={onClose}>
      <div
        className="relative w-full max-w-[560px] overflow-hidden rounded-[28px] border border-[#C4B5FD]/45 bg-white p-5 text-right text-slate-950 shadow-[0_28px_90px_rgba(14,165,233,0.22)] dark:border-[#8B5CF6]/24 dark:bg-[#111827] dark:text-[#F8F9FA] dark:shadow-[0_0_34px_rgba(139,92,246,0.24)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="absolute inset-x-0 top-0 h-24 bg-[linear-gradient(135deg,#BAF1FF,#FFC2DC)]" />
        <div className="relative flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white text-[#7C3AED] shadow-[0_12px_28px_rgba(139,92,246,0.16)] dark:bg-[#0D1324] dark:text-[#E9D5FF] dark:shadow-[0_0_20px_rgba(139,92,246,0.20)]">
              <KeyRound className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-xl font-black">تغيير كلمة السر</h2>
              <p className="text-sm font-semibold text-slate-600 dark:text-[#8A94A7]">
                {confirming ? "راجع التأكيد قبل الحفظ" : "اكتب كلمة السر الحالية والجديدة"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="interactive-ring grid h-10 w-10 place-items-center rounded-full border border-white bg-white text-slate-700 shadow-[0_10px_22px_rgba(14,165,233,0.12)] dark:border-white/10 dark:bg-[#111827] dark:text-[#E9D5FF]"
            aria-label="إغلاق"
            title="إغلاق"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {confirming ? (
          <section className="relative mt-7 rounded-[24px] border border-[#C4B5FD]/45 bg-white p-5 text-center shadow-[0_22px_58px_rgba(14,165,233,0.18)] dark:border-[#8B5CF6]/28 dark:bg-[#0D1324] dark:shadow-[0_0_26px_rgba(139,92,246,0.22)]">
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#F5F3FF] text-[#7C3AED] dark:bg-[#1A2335] dark:text-[#E9D5FF]">
                <ShieldCheck className="h-7 w-7" />
              </span>
              <h3 className="mt-4 text-xl font-black text-slate-950 dark:text-white">هل أنت متأكد من تغيير كلمة السر؟</h3>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={confirmSave}
                  className="interactive-ring h-11 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#A855F7] text-sm font-black text-white shadow-[0_12px_28px_rgba(139,92,246,0.28)]"
                >
                  موافق
                </button>
                <button
                  type="button"
                  onClick={() => setConfirming(false)}
                  className="interactive-ring h-11 rounded-xl border border-sky-100 bg-white text-sm font-black text-slate-700 dark:border-white/10 dark:bg-[#0D1324] dark:text-[#C4C9D4]"
                >
                  إلغاء
                </button>
              </div>
          </section>
        ) : (
          <form className="relative mt-7 space-y-3" onSubmit={requestSave}>
            <PasswordInput label="كلمة السر الحالية" value={form.current} onChange={(value) => updateField("current", value)} />
            <PasswordInput label="كلمة السر الجديدة" value={form.next} onChange={(value) => updateField("next", value)} />
            <PasswordInput label="تأكيد كلمة السر الجديدة" value={form.repeat} onChange={(value) => updateField("repeat", value)} />
            <button
              type="submit"
              className="interactive-ring mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#A855F7] text-sm font-black text-white shadow-[0_14px_34px_rgba(139,92,246,0.30)] dark:from-[#8B5CF6] dark:to-[#A855F7] dark:shadow-[0_0_22px_rgba(139,92,246,0.28)]"
            >
              <Save className="h-5 w-5" />
              حفظ
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function PasswordInput({ label, value, onChange }) {
  const [visible, setVisible] = useState(false);
  const VisibilityIcon = visible ? EyeOff : Eye;
  const visibilityLabel = visible ? "إخفاء كلمة السر" : "إظهار كلمة السر";

  return (
    <label className="block">
      <span className="mb-2 block text-sm font-black text-slate-700 dark:text-[#C4C9D4]">{label}</span>
      <span className="relative block">
        <input
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-12 w-full rounded-xl border border-sky-100 bg-white px-4 pl-12 text-right font-semibold text-slate-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.80)] outline-none transition placeholder:text-slate-400 focus:border-[#8B5CF6]/70 focus:ring-4 focus:ring-[#8B5CF6]/15 dark:border-white/10 dark:bg-[#050816] dark:text-white dark:shadow-none dark:placeholder:text-[#8A94A7]"
        />
        <button
          type="button"
          onClick={(event) => {
            event.preventDefault();
            setVisible((current) => !current);
          }}
          className="interactive-ring absolute left-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-xl border border-sky-100 bg-[#F8FCFF] text-slate-600 dark:border-white/10 dark:bg-[#111827] dark:text-[#E9D5FF]"
          aria-label={visibilityLabel}
          title={visibilityLabel}
        >
          <VisibilityIcon className="h-4 w-4" />
        </button>
      </span>
    </label>
  );
}

function Field({ label, defaultValue, readOnly = false, helper }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-black text-slate-700 dark:text-[#C4C9D4]">{label}</span>
      <span className="relative block">
        <input
          type="text"
          defaultValue={defaultValue}
          readOnly={readOnly}
          aria-readonly={readOnly}
          className={`h-12 w-full rounded-xl border px-4 text-right font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.80)] outline-none transition placeholder:text-slate-400 dark:border-white/10 dark:shadow-none dark:placeholder:text-[#8A94A7] ${
            readOnly
              ? "cursor-default border-[#C4B5FD]/55 bg-[#F5F3FF] pl-28 text-[#6D28D9] focus:border-[#C4B5FD]/70 focus:ring-4 focus:ring-[#8B5CF6]/10 dark:bg-[#1A2335] dark:text-[#E9D5FF]"
              : "border-sky-100 bg-white text-slate-950 focus:border-[#8B5CF6]/70 focus:ring-4 focus:ring-[#8B5CF6]/15 dark:bg-[#050816] dark:text-white"
          }`}
        />
        {readOnly && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 rounded-full border border-[#C4B5FD]/55 bg-white px-3 py-1 text-[11px] font-black text-[#7C3AED] dark:border-white/10 dark:bg-[#0D1324] dark:text-[#E9D5FF]">
            ثابت
          </span>
        )}
      </span>
      {helper && (
        <span className="mt-2 block text-xs font-black text-slate-500 dark:text-[#8A94A7]">
          {helper}
        </span>
      )}
    </label>
  );
}

function CountrySelectField({ disabled = false, label, value, options, onChange }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-black text-slate-700 dark:text-[#C4C9D4]">{label}</span>
      <span className="relative block">
        <Globe2 className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
        <select
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          className="h-12 w-full rounded-xl border border-sky-100 bg-white px-4 pr-12 text-right font-semibold text-slate-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.80)] outline-none transition disabled:cursor-not-allowed disabled:bg-[#F5F3FF] disabled:text-[#6D28D9] focus:border-[#8B5CF6]/70 focus:ring-4 focus:ring-[#8B5CF6]/15 dark:border-white/10 dark:bg-[#050816] dark:text-white dark:shadow-none dark:disabled:bg-[#1A2335] dark:disabled:text-[#E9D5FF]"
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

function ProfilePhoneField({ label, countryCode, readOnly = false, value, onChange }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-black text-slate-700 dark:text-[#C4C9D4]">{label}</span>
      <span className="relative block">
        <Phone className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
        <input
          dir="ltr"
          type="tel"
          inputMode="numeric"
          readOnly={readOnly}
          aria-readonly={readOnly}
          value={value}
          onChange={(event) => onChange(event.target.value.replace(/\D/g, ""))}
          className="h-12 w-full rounded-xl border border-sky-100 bg-white px-4 pl-20 pr-12 text-left font-semibold text-slate-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.80)] outline-none transition read-only:cursor-default read-only:bg-[#F5F3FF] read-only:text-[#6D28D9] placeholder:text-slate-400 focus:border-[#8B5CF6]/70 focus:ring-4 focus:ring-[#8B5CF6]/15 dark:border-white/10 dark:bg-[#050816] dark:text-white dark:shadow-none dark:read-only:bg-[#1A2335] dark:read-only:text-[#E9D5FF] dark:placeholder:text-[#8A94A7]"
        />
        <span
          dir="ltr"
          className="pointer-events-none absolute left-3 top-1/2 grid h-8 min-w-14 -translate-y-1/2 select-none place-items-center rounded-lg border border-sky-100 bg-sky-50 px-2 text-sm font-black text-slate-600 dark:border-white/10 dark:bg-[#111827] dark:text-[#C4C9D4]"
          title="رمز الدولة يتغير حسب الدولة المختارة ولا يمكن تعديله"
        >
          {countryCode}
        </span>
      </span>
    </label>
  );
}
