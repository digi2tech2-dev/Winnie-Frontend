import ProductCard from "../components/ProductCard";

export default function ProductPage({ group }) {
  return (
    <div className="space-y-6">
      <section className="glass-panel rounded-lg p-6">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-royal dark:text-pulse">
          {group.eyebrow}
        </p>
        <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-black sm:text-4xl">{group.title}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
              {group.description}
            </p>
          </div>
          <button
            type="button"
            className="interactive-ring h-11 rounded-lg bg-gradient-to-r from-royal to-pulse px-5 text-sm font-black text-white shadow-glow"
          >
            Top Up Now
          </button>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        {group.products.map((product) => (
          <ProductCard key={product.name} product={product} />
        ))}
      </section>
    </div>
  );
}
