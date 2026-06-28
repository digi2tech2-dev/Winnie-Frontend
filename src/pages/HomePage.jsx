import CategoryCard from "../components/CategoryCard";
import HeroSection from "../components/HeroSection";
import ProductCard from "../components/ProductCard";
import { categories, productGroups, stats } from "../data/catalog";
import { iconMap } from "../components/icons";

export default function HomePage({ onNavigate }) {
  const games = productGroups.games.products;
  const voice = productGroups.voice.products;

  return (
    <div className="space-y-8">
      <HeroSection onTopUp={() => onNavigate("games")} />

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-black">Top Categories</h2>
          <button
            type="button"
            className="text-sm font-black text-royal dark:text-pulse"
            onClick={() => onNavigate("deals")}
          >
            View deals
          </button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-7">
          {categories.map((category) => (
            <CategoryCard key={category.id} category={category} onClick={onNavigate} />
          ))}
        </div>
      </section>

      <section>
        <SectionHeader title="Popular Games" onViewAll={() => onNavigate("games")} />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {games.slice(0, 4).map((product) => (
            <ProductCard key={product.name} product={product} />
          ))}
        </div>
      </section>

      <ProductShelf
        title="Best Selling Social Media"
        products={productGroups.social.products.slice(0, 4)}
        onViewAll={() => onNavigate("social")}
      />

      <ProductShelf
        title="AI Subscriptions"
        products={productGroups.ai.products.slice(0, 4)}
        onViewAll={() => onNavigate("ai")}
      />

      <ProductShelf
        title="Gift Cards"
        products={productGroups["gift-cards"].products.slice(0, 4)}
        onViewAll={() => onNavigate("gift-cards")}
      />

      <ProductShelf
        title="Daily Deals"
        products={productGroups.deals.products.slice(0, 4)}
        onViewAll={() => onNavigate("deals")}
      />

      <section className="grid gap-4 lg:grid-cols-2">
        <MiniShelf
          title="New Products"
          products={[productGroups.ai.products[4], productGroups.subscriptions.products[4], productGroups.voice.products[8]]}
          onViewAll={() => onNavigate("subscriptions")}
        />
        <MiniShelf
          title="Most Requested"
          products={[productGroups.games.products[0], productGroups.ai.products[0], productGroups["gift-cards"].products[1]]}
          onViewAll={() => onNavigate("dashboard")}
        />
      </section>

      <section>
        <SectionHeader title="Popular Voice Chat Apps" onViewAll={() => onNavigate("voice")} />
        <div className="no-scrollbar flex gap-4 overflow-x-auto pb-2">
          {voice.map((product) => {
            const Icon = iconMap[product.icon];
            return (
              <button
                key={product.name}
                type="button"
                className="interactive-ring min-w-[110px] rounded-lg border border-slate-200 bg-white p-3 text-center shadow-soft dark:border-white/10 dark:bg-white/[0.055]"
              >
                <span className={`mx-auto grid h-14 w-14 place-items-center rounded-lg bg-gradient-to-br ${product.tone} text-white`}>
                  <Icon className="h-7 w-7" />
                </span>
                <span className="mt-2 block text-sm font-bold">{product.name}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <PromoCard
          title="Voice Chat Now Live!"
          text="Crystal clear voice packages for communities and creators."
          icon="Headphones"
          tone="from-royal via-fuchsia-600 to-slate-950"
        />
        <PromoCard
          title="Secure Payments"
          text="100% safe with Visa and Mastercard."
          icon="Shield"
          tone="from-blue-700 via-cyan-700 to-slate-950"
        />
      </section>

      <section className="glass-panel grid gap-4 rounded-lg p-4 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map((stat) => {
          const Icon = iconMap[stat.icon];
          return (
            <div key={stat.label} className="flex items-center gap-3 p-2">
              <span className="grid h-11 w-11 place-items-center rounded-lg bg-royal/12 text-royal dark:bg-pulse/15 dark:text-pulse">
                <Icon className="h-5 w-5" />
              </span>
              <span>
                <span className="block text-xl font-black">{stat.value}</span>
                <span className="text-sm text-slate-500 dark:text-slate-400">{stat.label}</span>
              </span>
            </div>
          );
        })}
      </section>
    </div>
  );
}

function SectionHeader({ title, onViewAll }) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <h2 className="text-xl font-black">{title}</h2>
      <button type="button" onClick={onViewAll} className="text-sm font-black text-royal dark:text-pulse">
        View All
      </button>
    </div>
  );
}

function ProductShelf({ title, products, onViewAll }) {
  return (
    <section>
      <SectionHeader title={title} onViewAll={onViewAll} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.name} product={product} />
        ))}
      </div>
    </section>
  );
}

function MiniShelf({ title, products, onViewAll }) {
  return (
    <section className="glass-panel rounded-lg p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-black">{title}</h2>
        <button type="button" onClick={onViewAll} className="text-sm font-black text-royal dark:text-pulse">
          Open
        </button>
      </div>
      <div className="grid gap-3">
        {products.map((product) => {
          const Icon = iconMap[product.icon];
          return (
            <div key={product.name} className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white/65 p-3 dark:border-white/10 dark:bg-white/[0.045]">
              <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-gradient-to-br ${product.tone} text-white`}>
                <Icon className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-black">{product.name}</span>
                <span className="text-sm text-slate-500 dark:text-slate-400">{product.price}</span>
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function PromoCard({ title, text, icon, tone }) {
  const Icon = iconMap[icon];

  return (
    <article className={`relative overflow-hidden rounded-lg bg-gradient-to-br ${tone} p-6 text-white shadow-glow`}>
      <div className="absolute -right-8 -top-10 h-36 w-36 rounded-full bg-white/15 blur-2xl" />
      <Icon className="relative mb-8 h-14 w-14" />
      <h3 className="relative text-2xl font-black">{title}</h3>
      <p className="relative mt-2 max-w-sm text-sm leading-6 text-white/80">{text}</p>
    </article>
  );
}
