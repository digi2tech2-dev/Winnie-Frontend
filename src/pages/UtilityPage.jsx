import { iconMap } from "../components/icons";

const content = {
  notifications: {
    title: "Notifications",
    description: "Latest account updates and order alerts.",
    icon: "Bell",
    items: ["Order #WF-9041 was delivered.", "New AI subscription deals are available.", "Wallet top-up completed successfully."],
  },
  support: {
    title: "Support",
    description: "Fast help for payments, delivery, and account questions.",
    icon: "Headphones",
    items: ["Live chat response time: under 2 minutes.", "Email support is available 24/7.", "Priority support enabled for premium members."],
  },
  settings: {
    title: "Settings",
    description: "Manage account preferences and platform controls.",
    icon: "Settings",
    items: ["Secure checkout enabled.", "Order email updates enabled.", "Marketing messages disabled."],
  },
  language: {
    title: "Language",
    description: "Switch between available display languages.",
    icon: "Languages",
    items: ["English is active.", "Arabic interface support ready.", "Currency display follows account region."],
  },
};

export default function UtilityPage({ page }) {
  const data = content[page] || content.notifications;
  const Icon = iconMap[data.icon];

  return (
    <section className="glass-panel rounded-lg p-6">
      <span className="grid h-14 w-14 place-items-center rounded-lg bg-gradient-to-br from-royal to-pulse text-white shadow-glow">
        <Icon className="h-7 w-7" />
      </span>
      <h1 className="mt-6 text-3xl font-black">{data.title}</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
        {data.description}
      </p>
      <div className="mt-6 grid gap-3">
        {data.items.map((item) => (
          <div
            key={item}
            className="rounded-lg border border-slate-200 bg-white/70 p-4 text-sm font-semibold dark:border-white/10 dark:bg-white/[0.045]"
          >
            {item}
          </div>
        ))}
      </div>
    </section>
  );
}
