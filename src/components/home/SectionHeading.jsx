import { ArrowRight } from "lucide-react";

export default function SectionHeading({ title, action = "عرض الكل", onAction }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-4">
      <h2 className="text-xl font-black tracking-tight text-slate-950 dark:text-white sm:text-2xl">{title}</h2>
      {onAction && (
        <button
          type="button"
          onClick={onAction}
          className="inline-flex items-center gap-2 rounded-2xl px-2 py-2 text-sm font-bold text-[#8B5CF6] transition hover:bg-[#F5F3FF] hover:text-[#A855F7] dark:text-[#C084FC] dark:hover:bg-[#8B5CF6]/14 dark:hover:text-white dark:hover:shadow-[0_0_20px_rgba(168,85,247,0.22)]"
        >
          {action}
          <ArrowRight className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
