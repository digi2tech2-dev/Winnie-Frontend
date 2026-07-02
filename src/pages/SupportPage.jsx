import { useState } from "react";
import { Mail, MessageSquareText, Phone, SendHorizontal } from "lucide-react";
import { useToast } from "../components/ToastProvider";

export default function SupportPage() {
  const [message, setMessage] = useState("");
  const { showToast } = useToast();

  const sendMessage = () => {
    showToast({
      type: "info",
      title: "Support message",
      message: "Connect a backend support service before sending support messages from this page.",
    });
    setMessage("");
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
      <section className="space-y-6">
        <div className="glass-panel rounded-lg p-6">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-royal dark:text-pulse">Support center</p>
          <h1 className="mt-2 text-3xl font-black">Support</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Support tickets and conversation history will appear when a backend support service is connected.
          </p>
        </div>

        <div className="glass-panel rounded-lg p-5">
          <div className="mb-4 flex items-center gap-3">
            <MessageSquareText className="h-6 w-6 text-royal dark:text-pulse" />
            <h2 className="text-xl font-black">Message support</h2>
          </div>
          <div className="mt-4 flex gap-2">
            <input
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Write a message..."
              className="h-12 min-w-0 flex-1 rounded-lg border border-slate-200 bg-white/80 px-4 outline-none focus:border-pulse focus:ring-4 focus:ring-pulse/15 dark:border-white/10 dark:bg-white/[0.065]"
            />
            <button
              type="button"
              onClick={sendMessage}
              className="interactive-ring grid h-12 w-12 place-items-center rounded-lg bg-gradient-to-r from-royal to-pulse text-white shadow-glow"
              aria-label="Send message"
              title="Send"
            >
              <SendHorizontal className="h-5 w-5" />
            </button>
          </div>
        </div>
      </section>

      <aside className="space-y-6">
        <div className="glass-panel rounded-lg p-5">
          <h2 className="text-xl font-black">Contact</h2>
          <div className="mt-4 grid gap-3">
            <Contact icon={Mail} label="Email" value="support@winniefun.com" />
            <Contact icon={Phone} label="Phone" value="Contact support" />
            <Contact icon={MessageSquareText} label="Live chat" value="Unavailable" />
          </div>
        </div>
      </aside>
    </div>
  );
}

function Contact({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white/65 p-4 dark:border-white/10 dark:bg-white/[0.045]">
      <Icon className="h-5 w-5 text-royal dark:text-pulse" />
      <span>
        <span className="block text-xs font-black uppercase tracking-[0.16em] text-slate-400">{label}</span>
        <span className="font-black">{value}</span>
      </span>
    </div>
  );
}
