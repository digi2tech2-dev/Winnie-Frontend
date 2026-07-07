import HeroSection from "../components/HeroSection";

export default function HomePage({ onNavigate }) {
  return (
    <div className="space-y-8">
      <HeroSection onTopUp={() => onNavigate?.("wallet")} />

      <section className="glass-panel rounded-lg p-6 text-center">
        <h2 className="text-2xl font-black">Catalog unavailable here</h2>
        <p className="mx-auto mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-500 dark:text-slate-400">
          Open the categories page to browse currently available services.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={() => onNavigate?.("categories")}
            className="interactive-ring h-11 rounded-lg bg-gradient-to-r from-royal to-pulse px-5 text-sm font-black text-white shadow-glow"
          >
            Open categories
          </button>
          <button
            type="button"
            onClick={() => onNavigate?.("wallet")}
            className="interactive-ring h-11 rounded-lg border border-slate-200 bg-white px-5 text-sm font-black text-slate-600 dark:border-white/10 dark:bg-white/[0.055] dark:text-slate-200"
          >
            Open wallet
          </button>
        </div>
      </section>
    </div>
  );
}
