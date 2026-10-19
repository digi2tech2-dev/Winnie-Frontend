import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import PublicHeader from "../components/PublicHeader";
import PublicBottomNav from "../components/PublicBottomNav";

const SiteFooter = lazy(() => import("../components/SiteFooter"));

function DeferredFooter({ simple }) {
  const [visible, setVisible] = useState(false);
  const footerRef = useRef(null);

  useEffect(() => {
    const footer = footerRef.current;
    if (!footer || typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return undefined;
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVisible(true);
        observer.disconnect();
      }
    }, { rootMargin: "700px 0px" });
    observer.observe(footer);
    return () => observer.disconnect();
  }, []);

  return <div ref={footerRef} style={{ minHeight: visible ? undefined : 240 }}>
    {visible && <Suspense fallback={null}><SiteFooter simple={simple} className="pb-28 lg:pb-8" /></Suspense>}
  </div>;
}

export default function PublicLayout() {
  const location = useLocation();
  const usesFullFooter =
    location.pathname === "/" ||
    location.pathname === "/about" ||
    location.pathname === "/best-selling" ||
    location.pathname.startsWith("/categories");

  return (
    <div className="winnie-app-shell min-h-screen overflow-x-hidden text-slate-900 selection:bg-[#C4B5FD]/45 selection:text-slate-950 dark:text-[#C4C9D4] dark:selection:bg-[#8B5CF6]/35 dark:selection:text-white">
      <PublicHeader />
      <main className="public-app-main winnie-app-content winnie-page-canvas pt-[96px]">
        <div className="winnie-page-stage">
          <Outlet />
        </div>
      </main>
      <DeferredFooter simple={!usesFullFooter} />
      <PublicBottomNav />
    </div>
  );
}
