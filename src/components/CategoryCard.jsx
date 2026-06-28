import { iconMap } from "./icons";

export default function CategoryCard({ category, onClick }) {
  const Icon = iconMap[category.icon];

  return (
    <button
      type="button"
      onClick={() => onClick(category.id)}
      className="interactive-ring muted-panel group flex min-h-[142px] flex-col items-start justify-between rounded-lg p-4 text-right"
    >
      <span
        className={`grid h-12 w-12 place-items-center rounded-lg bg-gradient-to-br ${category.tone} text-white shadow-glow`}
      >
        <Icon className="h-6 w-6" />
      </span>
      <span>
        <span className="block text-base font-black">{category.title}</span>
        <span className="mt-1 block text-sm text-slate-500 dark:text-slate-400">
          {category.subtitle}
        </span>
      </span>
    </button>
  );
}
