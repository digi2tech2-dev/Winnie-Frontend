import { useCallback, useEffect, useRef, useState } from "react";
import { Bookmark, Eye, EyeOff, Globe2, KeyRound, LockKeyhole, LogOut, MoreHorizontal, Pencil, Phone, Save, Settings, Share2, ShieldCheck, UserRound, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { resolveBackendAssetUrl } from "../api/adapters";
import { normalizeApiError } from "../api/errors";
import { changeMyPassword, getProfile, updateMyProfile, uploadMyAvatar } from "../api/profile";
import { getMyReferrals } from "../api/referrals";
import BackButton from "../components/BackButton";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/ToastProvider";

const profileCountries = ["United States", "Egypt", "Saudi Arabia", "United Arab Emirates", "Kuwait", "Qatar"];
const countryDialCodes = {
  "United States": "+1",
  Egypt: "+20",
  "Saudi Arabia": "+966",
  "United Arab Emirates": "+971",
  Kuwait: "+965",
  Qatar: "+974",
  "الولايات المتحدة": "+1",
  "مصر": "+20",
  "السعودية": "+966",
  "الإمارات": "+971",
  "الكويت": "+965",
  "قطر": "+974",
};

const countryAliases = {
  "الولايات المتحدة": "United States",
  "مصر": "Egypt",
  "السعودية": "Saudi Arabia",
  "الإمارات": "United Arab Emirates",
  "الكويت": "Kuwait",
  "قطر": "Qatar",
};

function normalizeCountryValue(value) {
  if (!value) return "";
  return countryAliases[value] || value;
}

export default function ProfilePage({ basePath = "/customer" }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(true);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [pendingMenuAction, setPendingMenuAction] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarInputRef = useRef(null);
  const navigate = useNavigate();
  const { token, user, logout, refreshCurrentUser } = useAuth();
  const { showToast } = useToast();
  const { t } = useTranslation("profile");
  const activeProfile = profileData || user || {};
  const displayName = activeProfile.name || t("defaultName");
  const email = activeProfile.email || "";
  const avatarUrl = resolveBackendAssetUrl(activeProfile.avatar) || "/hero-winnie-fun.png";
  const tier = activeProfile.group?.name || activeProfile.tier || t("member");
  const country = activeProfile.country || "";
  const currency = activeProfile.currency || "USD";
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
          setProfileError(requestError.userMessage || t("loadError"));
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
        title: t("inviteCustomerOnlyTitle"),
        message: t("inviteCustomerOnlyMessage"),
      });
      return;
    }

    if (!token) {
      showToast({ type: "error", title: t("avatarLoginRequiredTitle"), message: t("inviteLoginRequiredMessage") });
      return;
    }

    try {
      const result = await getMyReferrals(token);
      const inviteText = result.summary?.referralLink || result.summary?.inviteLink || result.summary?.referralCode || "";

      if (!inviteText) {
        showToast({ type: "warning", title: t("inviteUnavailableTitle"), message: t("inviteUnavailableMessage") });
        return;
      }

      if (!navigator.clipboard?.writeText) {
        throw new Error(t("clipboardUnavailable"));
      }

      await navigator.clipboard.writeText(inviteText);
      showToast({ type: "success", title: t("inviteCopiedTitle"), message: inviteText });
    } catch (requestError) {
      showToast({
        type: "error",
        title: t("inviteCopyFailedTitle"),
        message: requestError.userMessage || requestError.message || t("common:errors.tryAgain"),
      });
    }
  }, [basePath, showToast, t, token]);

  const refreshProfileSnapshot = useCallback(async () => {
    if (!token) return null;

    const result = await getProfile(token);
    setProfileData(result);
    return result;
  }, [token]);

  const refreshSessionAndProfile = useCallback(async () => {
    if (!token) throw new Error(t("profileUpdateLoginMessage"));

    const refreshed = await refreshCurrentUser(token);
    if (!refreshed.ok) {
      throw new Error(refreshed.message || t("refreshFailed"));
    }

    await refreshProfileSnapshot();
  }, [refreshCurrentUser, refreshProfileSnapshot, t, token]);

  const handleProfileSave = useCallback(
    async (payload) => {
      if (!token) {
        showToast({ type: "error", title: t("avatarLoginRequiredTitle"), message: t("profileUpdateLoginMessage") });
        return;
      }

      setProfileSaving(true);

      try {
        const result = await updateMyProfile(token, payload);
        await refreshSessionAndProfile();
        showToast({
          type: "success",
          title: t("profileUpdatedTitle"),
          message: result.message || t("profileUpdatedMessage"),
        });
      } catch (requestError) {
        const normalized = normalizeApiError(requestError, t("profileUpdateFailedMessage"));
        showToast({
          type: "error",
          title: t("profileUpdateFailedTitle"),
          message: normalized.userMessage,
        });
      } finally {
        setProfileSaving(false);
      }
    },
    [refreshSessionAndProfile, showToast, t, token],
  );

  const handlePasswordChange = useCallback(
    async ({ currentPassword, newPassword }) => {
      if (!token) {
        showToast({ type: "error", title: t("avatarLoginRequiredTitle"), message: t("passwordLoginMessage") });
        return false;
      }

      try {
        const result = await changeMyPassword(token, { currentPassword, newPassword });
        showToast({
          type: "success",
          title: t("passwordUpdatedTitle"),
          message: result.message || t("passwordUpdatedMessage"),
        });
        return true;
      } catch (requestError) {
        const normalized = normalizeApiError(requestError, t("passwordUpdateFailedMessage"));
        showToast({
          type: "error",
          title: t("passwordUpdateFailedTitle"),
          message: normalized.userMessage,
        });
        return false;
      }
    },
    [showToast, t, token],
  );

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
      setPasswordOpen(true);
      return;
    }

    if (action === "settings") {
      navigate(`${basePath}/settings`);
      return;
    }

    if (action === "logout") {
      handleLogout();
    }
  }, [basePath, handleLogout, menuOpen, navigate, pendingMenuAction, shareInvite]);

  const closeMenu = () => {
    setPendingMenuAction(null);
    setMenuOpen(false);
  };

  const runAfterMenuCloses = (action) => {
    setPendingMenuAction(action);
    setMenuOpen(false);
  };

  const openAvatarPicker = () => {
    if (avatarUploading) return;
    avatarInputRef.current?.click();
  };

  const changeAvatar = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;
    if (!token) {
      showToast({ type: "error", title: t("avatarLoginRequiredTitle"), message: t("avatarLoginRequiredMessage") });
      return;
    }

    setAvatarUploading(true);

    try {
      const result = await uploadMyAvatar(token, file);
      await refreshSessionAndProfile();
      showToast({
        type: "success",
        title: t("avatarUpdatedTitle"),
        message: result.message || t("avatarUpdatedMessage"),
      });
    } catch (requestError) {
      const normalized = normalizeApiError(requestError, t("avatarFailedMessage"));
      showToast({
        type: "error",
        title: t("avatarFailedTitle"),
        message: normalized.userMessage,
      });
    } finally {
      setAvatarUploading(false);
    }
  };

  return (
    <div
      dir="rtl"
      className="customer-profile-page -mx-4 -mt-6 min-h-[calc(100vh-120px)] overflow-hidden bg-[linear-gradient(180deg,#FFFFFF_0%,#F8FCFF_100%)] text-slate-950 dark:bg-[linear-gradient(180deg,#050816_0%,#0A1120_45%,#0D1324_100%)] dark:text-[#C4C9D4] sm:-mx-6 lg:-mx-8"
    >
      <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={changeAvatar} />
      <section className="customer-profile-hero relative min-h-[390px] overflow-hidden bg-[linear-gradient(135deg,#BAF1FF_0%,#E8E0FF_48%,#FFC2DC_100%)] px-4 pb-7 pt-5 dark:bg-[linear-gradient(135deg,#070A1E_0%,#111827_48%,#24133D_100%)] sm:min-h-[460px] sm:px-8 sm:pb-8 sm:pt-7">
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.34)_0%,rgba(255,255,255,0.06)_58%,rgba(248,252,255,0)_100%),linear-gradient(90deg,rgba(125,211,252,0.34)_0%,rgba(255,255,255,0)_42%,rgba(244,114,182,0.34)_100%)] dark:bg-[linear-gradient(180deg,rgba(139,92,246,0.24)_0%,rgba(56,189,248,0.08)_58%,rgba(5,8,22,0)_100%),linear-gradient(90deg,rgba(56,189,248,0.18)_0%,rgba(5,8,22,0)_44%,rgba(168,85,247,0.24)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-28 bg-[linear-gradient(180deg,rgba(248,252,255,0)_0%,rgba(248,252,255,1)_100%)] dark:bg-[linear-gradient(180deg,rgba(5,8,22,0)_0%,rgba(5,8,22,0.94)_100%)]" />
        <BackButton
          className="profile-hero-back absolute right-4 top-5 z-20 mb-0 sm:right-8 sm:top-7"
          fallbackPath={`${basePath}/dashboard`}
          hiddenPaths={[`${basePath}/dashboard`]}
        />
        <div className="relative z-10 mx-auto mt-12 grid max-w-[760px] grid-cols-[92px_minmax(0,1fr)_92px] items-center gap-2 sm:mt-14 sm:grid-cols-[150px_minmax(0,1fr)_150px] sm:gap-3">
          <button
            type="button"
            onClick={() => setEditing((value) => !value)}
            className="interactive-ring grid h-11 w-11 place-items-center justify-self-start rounded-full border border-white/70 bg-white/82 text-slate-800 shadow-[0_12px_28px_rgba(14,165,233,0.12)] backdrop-blur-xl dark:border-white/10 dark:bg-[#111827]/86 dark:text-[#E9D5FF] dark:shadow-[0_0_20px_rgba(139,92,246,0.20)] sm:h-14 sm:w-14"
            aria-label={t("editProfile")}
            title={t("editProfile")}
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
              aria-label={t("profileSettings")}
              title={t("profileSettings")}
            >
              <Settings className="h-5 w-5 sm:h-7 sm:w-7" />
            </button>
            <button
              type="button"
              className="interactive-ring hidden h-14 w-14 place-items-center rounded-full border border-white/70 bg-white/82 text-slate-800 shadow-[0_16px_38px_rgba(14,165,233,0.14)] backdrop-blur-xl dark:border-white/10 dark:bg-[#111827]/86 dark:text-[#E9D5FF] dark:shadow-[0_0_20px_rgba(139,92,246,0.20)] md:grid"
              aria-label={t("savedItems")}
              title={t("savedItems")}
            >
              <Bookmark className="h-7 w-7" />
            </button>
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="interactive-ring grid h-11 w-11 place-items-center rounded-full border border-white/70 bg-white/82 text-slate-800 shadow-[0_12px_28px_rgba(14,165,233,0.12)] backdrop-blur-xl dark:border-white/10 dark:bg-[#111827]/86 dark:text-[#E9D5FF] dark:shadow-[0_0_20px_rgba(139,92,246,0.20)] sm:h-14 sm:w-14"
              aria-label={t("more")}
              title={t("more")}
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
              disabled={avatarUploading}
              aria-busy={avatarUploading}
              className="interactive-ring absolute bottom-1 right-1 grid h-11 w-11 place-items-center rounded-full border border-white/80 bg-white text-[#7C3AED] shadow-[0_12px_26px_rgba(139,92,246,0.20)] disabled:cursor-not-allowed disabled:opacity-60 dark:border-[#8B5CF6]/34 dark:bg-[#111827] dark:text-[#E9D5FF] dark:shadow-[0_0_18px_rgba(139,92,246,0.24)]"
              aria-label={t("editAvatar")}
              title={t("editAvatar")}
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
          {profileLoading ? t("loading") : profileError}
        </section>
      )}

      {editing && (
        <EditProfilePanel
          key={`${displayName}-${email}-${country}-${phone}`}
          countryValue={country}
          currencyValue={currency}
          displayName={displayName}
          email={email}
          onChangePassword={() => setPasswordOpen(true)}
          onSave={handleProfileSave}
          phoneValue={phone}
          saving={profileSaving}
          usernameValue={activeProfile.username || ""}
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

      {passwordOpen && (
        <PasswordModal
          onClose={() => setPasswordOpen(false)}
          onSubmit={handlePasswordChange}
          showToast={showToast}
        />
      )}
    </div>
  );
}

function EditProfilePanel({
  countryValue,
  currencyValue,
  displayName,
  email,
  onChangePassword,
  onSave,
  phoneValue,
  saving = false,
  usernameValue = "",
}) {
  const { t } = useTranslation("profile");
  const initialCountry = normalizeCountryValue(countryValue) || profileCountries[0];
  const [country, setCountry] = useState(initialCountry);
  const [form, setForm] = useState({
    name: displayName || "",
    phone: phoneValue || "",
    username: usernameValue || "",
  });
  const selectedDialCode = countryDialCodes[country] || "";
  const dirty =
    form.name.trim() !== (displayName || "").trim() ||
    form.phone.trim() !== (phoneValue || "").trim() ||
    form.username.trim() !== (usernameValue || "").trim() ||
    country !== initialCountry;

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };
  const phone = form.phone;
  const setPhone = (value) => updateField("phone", value);

  const submitProfile = async (event) => {
    event.preventDefault();
    if (!dirty || saving) return;
    await onSave({
      name: form.name.trim(),
      phone: form.phone.trim(),
      username: form.username.trim(),
      country,
    });
  };

  return (
    <section className="relative z-10 mx-auto mt-4 w-[calc(100%-32px)] max-w-[760px] overflow-hidden rounded-[24px] border border-violet-300/55 bg-[radial-gradient(circle_at_top_right,rgba(139,92,246,0.16),transparent_38%),radial-gradient(circle_at_bottom_left,rgba(56,189,248,0.14),transparent_40%),linear-gradient(180deg,rgba(255,255,255,0.96),rgba(245,243,255,0.92))] p-4 shadow-[0_24px_64px_rgba(91,33,182,0.16),inset_0_1px_0_rgba(255,255,255,0.92)] backdrop-blur-2xl dark:border-violet-400/25 dark:bg-[radial-gradient(circle_at_top_right,rgba(139,92,246,0.24),transparent_42%),radial-gradient(circle_at_bottom_left,rgba(56,189,248,0.13),transparent_44%),linear-gradient(180deg,#0D1324_0%,#070B19_100%)] dark:shadow-[0_24px_70px_rgba(0,0,0,0.34),0_0_30px_rgba(124,58,237,0.12)] sm:p-5">
      <span className="pointer-events-none absolute inset-x-16 top-0 h-px bg-gradient-to-r from-transparent via-fuchsia-400/80 to-transparent" />
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-2xl border border-white/35 bg-gradient-to-br from-violet-600 via-fuchsia-500 to-blue-500 text-white shadow-[0_12px_28px_rgba(124,58,237,0.30),0_0_18px_rgba(59,130,246,0.12)]">
          <UserRound className="h-5 w-5" />
        </span>
        <div>
          <h2 className="bg-gradient-to-l from-violet-800 via-fuchsia-600 to-blue-600 bg-clip-text text-xl font-black text-transparent dark:from-violet-200 dark:via-fuchsia-300 dark:to-sky-300">{t("panel.title")}</h2>
          <p className="text-sm font-semibold text-slate-600 dark:text-[#8A94A7]">{t("panel.description")}</p>
        </div>
      </div>

      <form className="mt-5 grid gap-3 sm:grid-cols-2" onSubmit={submitProfile}>
        <Field
          label={t("panel.name")}
          value={form.name}
          onChange={(value) => updateField("name", value)}
          helper={t("panel.nameHelper")}
        />
        <Field
          label={t("panel.username")}
          value={form.username}
          onChange={(value) => updateField("username", value)}
          helper={t("panel.usernameHelper")}
        />
        <Field label={t("panel.email")} defaultValue={email} readOnly helper={t("panel.emailHelper")} />
        <CountrySelectField label={t("panel.country")} value={country} options={profileCountries} onChange={setCountry} />
        <Field label={t("panel.currency")} defaultValue={currencyValue} readOnly helper={t("panel.currencyHelper")} />
        <ProfilePhoneField
          label={t("panel.phone")}
          countryCode={selectedDialCode}
          value={form.phone}
          onChange={(value) => updateField("phone", value)}
        />
        <button
          type="submit"
          disabled={saving || !dirty}
          className="mt-2 inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-white/25 bg-gradient-to-r from-violet-600 via-fuchsia-500 to-blue-500 text-sm font-black text-white shadow-[0_14px_32px_rgba(124,58,237,0.28)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_38px_rgba(124,58,237,0.36)] disabled:cursor-not-allowed disabled:border-transparent disabled:bg-none disabled:bg-slate-200 disabled:text-slate-500 disabled:shadow-none disabled:hover:translate-y-0 dark:disabled:bg-white/10 dark:disabled:text-white/40 sm:col-span-2"
        >
          <Save className="h-5 w-5" />
          {saving ? t("panel.saving") : t("panel.saveChanges")}
        </button>
        <button
          type="button"
          onClick={onChangePassword}
          className="interactive-ring inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-violet-300/65 bg-gradient-to-r from-white/85 to-violet-50/85 text-sm font-black text-violet-700 shadow-[0_10px_28px_rgba(91,33,182,0.12)] backdrop-blur-xl transition duration-300 hover:-translate-y-0.5 hover:border-fuchsia-400/70 hover:text-fuchsia-700 dark:border-violet-400/25 dark:bg-[linear-gradient(90deg,rgba(124,58,237,0.12),rgba(59,130,246,0.08))] dark:text-violet-200 dark:shadow-[0_0_20px_rgba(139,92,246,0.14)] dark:hover:border-fuchsia-400/45 dark:hover:text-fuchsia-200 sm:col-span-2"
        >
          <LockKeyhole className="h-5 w-5" />
          {t("panel.changePassword")}
        </button>
      </form>

      <form className="hidden">
        <Field label={t("panel.name")} defaultValue={displayName} readOnly helper={t("panel.nameHelper")} />
        <Field
          label={t("panel.email")}
          defaultValue={email}
          readOnly
          helper={t("panel.emailHelper")}
        />
        <CountrySelectField disabled label={t("panel.country")} value={country} options={profileCountries} onChange={setCountry} />
        <Field label={t("panel.currency")} defaultValue={currencyValue} readOnly helper={t("panel.currencyHelper")} />
        <ProfilePhoneField label={t("panel.phone")} countryCode={selectedDialCode} readOnly value={phone} onChange={setPhone} />
        <button
          type="button"
          disabled
          className="mt-2 inline-flex h-12 cursor-not-allowed items-center justify-center gap-2 rounded-xl bg-slate-200 text-sm font-black text-slate-500 dark:bg-white/10 dark:text-white/40 sm:col-span-2"
        >
          <Save className="h-5 w-5" />
          {t("panel.saveChanges")}
        </button>
        <button
          type="button"
          onClick={onChangePassword}
          className="interactive-ring inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-[#C4B5FD]/55 bg-white text-sm font-black text-[#7C3AED] shadow-[0_12px_28px_rgba(14,165,233,0.12)] dark:border-[#8B5CF6]/32 dark:bg-[#0D1324] dark:text-[#E9D5FF] dark:shadow-[0_0_18px_rgba(139,92,246,0.18)] sm:col-span-2"
          aria-label={t("panel.changePassword")}
        >
          <LockKeyhole className="h-5 w-5" />
          {t("panel.changePassword")}
        </button>
      </form>
    </section>
  );
}

function ProfileMenu({ displayName, avatarUrl, onClose, onShareInvite, onChangePassword, onSettings, onLogout }) {
  const { t } = useTranslation("profile");

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
            <MenuButton icon={Share2} label={t("menu.shareInvite")} onClick={onShareInvite} />
            <MenuButton icon={LockKeyhole} label={t("menu.changePassword")} onClick={onChangePassword} />
            <MenuButton icon={Settings} label={t("menu.settings")} onClick={onSettings} />
            <MenuButton icon={LogOut} label={t("menu.logout")} onClick={onLogout} danger />
          </div>

          <button
            type="button"
            onClick={onClose}
            className="mx-auto mt-5 inline-flex h-14 w-full max-w-[760px] items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#7C3AED] to-[#A855F7] px-8 text-base font-black text-white shadow-[0_16px_38px_rgba(139,92,246,0.34)] transition hover:-translate-y-0.5 dark:from-[#8B5CF6] dark:to-[#A855F7] dark:shadow-[0_0_26px_rgba(139,92,246,0.32)]"
          >
            <X className="h-5 w-5" />
            {t("menu.close")}
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

function PasswordModal({ onClose, onSubmit, showToast }) {
  const [form, setForm] = useState({ current: "", next: "", repeat: "" });
  const [confirming, setConfirming] = useState(false);
  const [saving, setSaving] = useState(false);
  const { t } = useTranslation("profile");

  const updateField = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const requestSave = (event) => {
    event.preventDefault();

    if (!form.current || !form.next || !form.repeat) {
      showToast({ type: "error", title: t("password.missingTitle"), message: t("password.missingMessage") });
      return;
    }

    if (form.next.length < 8 || !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(form.next)) {
      showToast({ type: "error", title: t("password.weakTitle"), message: t("password.weakMessage") });
      return;
    }

    if (form.next.length < 0) {
      showToast({ type: "error", title: t("password.weakTitle"), message: t("password.weakMessage") });
      return;
    }

    if (form.next === form.current) {
      showToast({ type: "error", title: t("password.unchangedTitle"), message: t("password.unchangedMessage") });
      return;
    }

    if (form.next !== form.repeat) {
      showToast({ type: "error", title: t("password.mismatchTitle"), message: t("password.mismatchMessage") });
      return;
    }

    setConfirming(true);
  };

  const confirmSave = async () => {
    if (saving) return;

    setSaving(true);
    const saved = await onSubmit({
      currentPassword: form.current,
      newPassword: form.next,
    });
    setSaving(false);

    if (!saved) {
      setConfirming(false);
      return;
    }

    setForm({ current: "", next: "", repeat: "" });
    setConfirming(false);
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
              <h2 className="text-xl font-black">{t("password.title")}</h2>
              <p className="text-sm font-semibold text-slate-600 dark:text-[#8A94A7]">
                {confirming ? t("password.confirmSubtitle") : t("password.subtitle")}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="interactive-ring grid h-10 w-10 place-items-center rounded-full border border-white bg-white text-slate-700 shadow-[0_10px_22px_rgba(14,165,233,0.12)] dark:border-white/10 dark:bg-[#111827] dark:text-[#E9D5FF]"
            aria-label={t("password.close")}
            title={t("password.close")}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {confirming ? (
          <section className="relative mt-7 rounded-[24px] border border-[#C4B5FD]/45 bg-white p-5 text-center shadow-[0_22px_58px_rgba(14,165,233,0.18)] dark:border-[#8B5CF6]/28 dark:bg-[#0D1324] dark:shadow-[0_0_26px_rgba(139,92,246,0.22)]">
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#F5F3FF] text-[#7C3AED] dark:bg-[#1A2335] dark:text-[#E9D5FF]">
                <ShieldCheck className="h-7 w-7" />
              </span>
              <h3 className="mt-4 text-xl font-black text-slate-950 dark:text-white">{t("password.confirmTitle")}</h3>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={confirmSave}
                  disabled={saving}
                  aria-busy={saving}
                  className="interactive-ring h-11 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#A855F7] text-sm font-black text-white shadow-[0_12px_28px_rgba(139,92,246,0.28)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {t("password.approve")}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirming(false)}
                  disabled={saving}
                  className="interactive-ring h-11 rounded-xl border border-sky-100 bg-white text-sm font-black text-slate-700 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-[#0D1324] dark:text-[#C4C9D4]"
                >
                  {t("password.cancel")}
                </button>
              </div>
          </section>
        ) : (
          <form className="relative mt-7 space-y-3" onSubmit={requestSave}>
            <PasswordInput label={t("password.current")} value={form.current} onChange={(value) => updateField("current", value)} />
            <PasswordInput label={t("password.next")} value={form.next} onChange={(value) => updateField("next", value)} />
            <PasswordInput label={t("password.repeat")} value={form.repeat} onChange={(value) => updateField("repeat", value)} />
            <button
              type="submit"
              className="interactive-ring mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#A855F7] text-sm font-black text-white shadow-[0_14px_34px_rgba(139,92,246,0.30)] dark:from-[#8B5CF6] dark:to-[#A855F7] dark:shadow-[0_0_22px_rgba(139,92,246,0.28)]"
            >
              <Save className="h-5 w-5" />
              {t("password.save")}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function PasswordInput({ label, value, onChange }) {
  const [visible, setVisible] = useState(false);
  const { t } = useTranslation("profile");
  const VisibilityIcon = visible ? EyeOff : Eye;
  const visibilityLabel = visible ? t("password.hide") : t("password.show");

  return (
    <label className="block">
      <span className="mb-2 block text-sm font-black text-violet-800 dark:text-violet-200">{label}</span>
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

function Field({ label, defaultValue, value, onChange, readOnly = false, helper }) {
  const { t } = useTranslation("profile");
  const inputProps = value === undefined
    ? { defaultValue: defaultValue || "" }
    : { value, onChange: (event) => onChange?.(event.target.value) };

  return (
    <label className="block">
      <span className="mb-2 block text-sm font-black text-slate-700 dark:text-[#C4C9D4]">{label}</span>
      <span className="relative block">
        <input
          type="text"
          {...inputProps}
          readOnly={readOnly}
          aria-readonly={readOnly}
          className={`h-12 w-full rounded-xl border px-4 text-right font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.80)] outline-none transition placeholder:text-slate-400 dark:border-white/10 dark:shadow-none dark:placeholder:text-[#8A94A7] ${
            readOnly
              ? "cursor-default border-violet-300/60 bg-gradient-to-r from-violet-50 to-blue-50/70 pl-28 text-violet-700 focus:border-violet-400/70 focus:ring-4 focus:ring-violet-500/10 dark:bg-[linear-gradient(90deg,rgba(124,58,237,0.14),rgba(59,130,246,0.08))] dark:text-violet-200"
              : "border-violet-200/80 bg-white/80 text-slate-950 focus:border-violet-500/75 focus:ring-4 focus:ring-violet-500/15 dark:border-violet-400/20 dark:bg-[#050816]/85 dark:text-white dark:focus:border-violet-400/60"
          }`}
        />
        {readOnly && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 rounded-full border border-fuchsia-300/60 bg-gradient-to-r from-violet-600 to-fuchsia-500 px-3 py-1 text-[11px] font-black text-white shadow-[0_5px_14px_rgba(168,85,247,0.22)] dark:border-fuchsia-300/25">
            {t("panel.readonly")}
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
  const { t } = useTranslation("profile");

  return (
    <label className="block">
      <span className="mb-2 block text-sm font-black text-violet-800 dark:text-violet-200">{label}</span>
      <span className="relative block">
        <Globe2 className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-blue-500 dark:text-sky-300" />
        <select
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          className="h-12 w-full rounded-xl border border-violet-200/80 bg-white/80 px-4 pr-12 text-right font-semibold text-slate-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.80)] outline-none transition disabled:cursor-not-allowed disabled:border-violet-300/60 disabled:bg-gradient-to-r disabled:from-violet-50 disabled:to-blue-50/70 disabled:text-violet-700 focus:border-violet-500/75 focus:ring-4 focus:ring-violet-500/15 dark:border-violet-400/20 dark:bg-[#050816]/85 dark:text-white dark:shadow-none dark:disabled:bg-[#1A1730] dark:disabled:text-violet-200"
        >
          {options.map((option) => (
            <option key={option} value={option}>
              {t(`countries.${option}`, { defaultValue: option })}
            </option>
          ))}
        </select>
      </span>
    </label>
  );
}

function ProfilePhoneField({ label, countryCode, readOnly = false, value, onChange }) {
  const { t } = useTranslation("profile");

  return (
    <label className="block">
      <span className="mb-2 block text-sm font-black text-violet-800 dark:text-violet-200">{label}</span>
      <span className="relative block">
        <Phone className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-fuchsia-500 dark:text-fuchsia-300" />
        <input
          dir="ltr"
          type="tel"
          inputMode="tel"
          readOnly={readOnly}
          aria-readonly={readOnly}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-12 w-full rounded-xl border border-violet-200/80 bg-white/80 px-4 pl-20 pr-12 text-left font-semibold text-slate-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.80)] outline-none transition read-only:cursor-default read-only:bg-violet-50 read-only:text-violet-700 placeholder:text-slate-400 focus:border-violet-500/75 focus:ring-4 focus:ring-violet-500/15 dark:border-violet-400/20 dark:bg-[#050816]/85 dark:text-white dark:shadow-none dark:read-only:bg-[#1A1730] dark:read-only:text-violet-200 dark:placeholder:text-[#8A94A7]"
        />
        <span
          dir="ltr"
          className="pointer-events-none absolute left-3 top-1/2 grid h-8 min-w-14 -translate-y-1/2 select-none place-items-center rounded-lg border border-blue-300/55 bg-gradient-to-r from-blue-50 to-violet-50 px-2 text-sm font-black text-blue-700 dark:border-blue-400/20 dark:bg-[linear-gradient(90deg,rgba(59,130,246,0.16),rgba(124,58,237,0.12))] dark:text-sky-200"
          title={t("panel.countryCodeTitle")}
        >
          {countryCode}
        </span>
      </span>
    </label>
  );
}
