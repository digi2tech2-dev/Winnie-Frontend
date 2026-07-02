import { Outlet } from "react-router-dom";
import BackButton from "../components/BackButton";
import PublicHeader from "../components/PublicHeader";
import PublicBottomNav from "../components/PublicBottomNav";
import SiteFooter from "../components/SiteFooter";

export default function PublicLayout() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_top_left,rgba(224,242,254,0.9),transparent_34%),linear-gradient(135deg,#FFFFFF_0%,#F8FCFF_46%,#FDF2F8_100%)] text-slate-900 selection:bg-[#C4B5FD]/45 selection:text-slate-950 dark:bg-[linear-gradient(180deg,#050816_0%,#0A1120_35%,#0D1324_100%)] dark:text-[#C4C9D4] dark:selection:bg-[#8B5CF6]/35 dark:selection:text-white">
      <PublicHeader />
      <main className="pt-[88px]">
        <BackButton className="page-frame pt-4" fallbackPath="/" />
        <Outlet />
      </main>
      <SiteFooter className="pb-28 lg:pb-8" />
      <PublicBottomNav />
    </div>
  );
}
