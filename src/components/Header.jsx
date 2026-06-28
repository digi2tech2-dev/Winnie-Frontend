import { Bell, ChevronDown, Globe2, LogIn, Menu, WalletCards } from "lucide-react";
import Brand from "./Brand";
import GlobalSearch from "./GlobalSearch";
import ThemeToggle from "./ThemeToggle";

export default function Header({
  theme,
  onToggleTheme,
  walletBalance,
  onNavigate,
  onOpenSidebar,
  language,
  onToggleLanguage,
  searchQuery,
  onSearchChange,
  searchResults,
}) {
  return (
    <header className="fixed inset-x-0 top-0 z-[70] border-b border-[#8B5CF6]/18 bg-[linear-gradient(180deg,#050816,#070A1E)] px-4 py-4 text-white shadow-[0_18px_55px_rgba(5,8,22,0.62)] lg:px-6">
      <div className="mx-auto flex max-w-[1500px] items-center gap-3">
        <button type="button" onClick={() => onNavigate("home")} className="shrink-0 text-left">
          <Brand compact header />
        </button>

        <div className="mx-auto hidden w-full max-w-xl md:block">
          <GlobalSearch
            value={searchQuery}
            onChange={onSearchChange}
            results={searchResults}
            onNavigate={onNavigate}
          />
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleLanguage}
            className="hidden h-11 items-center gap-2 rounded-2xl border border-[#8B5CF6]/24 bg-[#11142A]/76 px-3 text-sm font-bold text-white transition hover:border-[#A855F7]/70 hover:bg-[#8B5CF6]/18 sm:inline-flex"
            title="تغيير اللغة"
          >
            <Globe2 className="h-5 w-5" />
            {language}
            <ChevronDown className="h-4 w-4" />
          </button>

          <ThemeToggle theme={theme} onToggle={onToggleTheme} />

          <button
            type="button"
            className="relative hidden h-11 w-11 items-center justify-center rounded-2xl border border-[#8B5CF6]/24 bg-[#11142A]/76 text-white transition hover:border-[#A855F7]/70 hover:bg-[#8B5CF6]/18 sm:inline-flex"
            aria-label="الإشعارات"
            title="الإشعارات"
            onClick={() => onNavigate("notifications")}
          >
            <Bell className="h-5 w-5" />
            <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-gradient-to-br from-royal to-pulse text-xs font-black text-white">
              3
            </span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate("wallet")}
            className="hidden h-11 items-center gap-2 rounded-2xl border border-[#8B5CF6]/24 bg-[#11142A]/76 px-3 text-sm font-black text-white transition hover:border-[#A855F7]/70 hover:bg-[#8B5CF6]/18 lg:inline-flex"
          >
            <WalletCards className="h-5 w-5" />
            {walletBalance}
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-royal to-pulse text-white">
              +
            </span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate("login")}
            className="inline-flex h-11 items-center gap-2 rounded-2xl bg-gradient-to-r from-[#8B5CF6] to-[#A855F7] px-4 text-sm font-black text-white shadow-[0_0_28px_rgba(139,92,246,0.45)] transition hover:-translate-y-0.5"
          >
            <LogIn className="h-4 w-4" />
            <span className="hidden sm:inline">تسجيل الدخول</span>
          </button>

          <button
            type="button"
            onClick={onOpenSidebar}
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[#8B5CF6]/24 bg-[#11142A]/76 text-white transition hover:border-[#A855F7]/70 hover:bg-[#8B5CF6]/18 xl:hidden"
            aria-label="فتح القائمة"
            title="فتح القائمة"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="mt-3 block md:hidden">
        <GlobalSearch
          value={searchQuery}
          onChange={onSearchChange}
          results={searchResults}
          onNavigate={onNavigate}
          compact
        />
      </div>
    </header>
  );
}
