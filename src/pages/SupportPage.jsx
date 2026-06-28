import { useState } from "react";
import { Mail, MessageSquareText, Phone, SendHorizontal, Ticket } from "lucide-react";
import { faqs, supportTickets } from "../data/catalog";
import { useToast } from "../components/ToastProvider";

export default function SupportPage() {
  const [message, setMessage] = useState("");
  const { showToast } = useToast();

  const sendMessage = () => {
    showToast({ type: "success", title: "Message sent", message: "Support received your mock live chat message." });
    setMessage("");
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
      <section className="space-y-6">
        <div className="glass-panel rounded-lg p-6">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-royal dark:text-pulse">Support center</p>
          <h1 className="mt-2 text-3xl font-black">Live Chat & Tickets</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Fast help for payments, delivery, account security and product activation.</p>
        </div>

        <div className="glass-panel rounded-lg p-5">
          <div className="mb-4 flex items-center gap-3">
            <MessageSquareText className="h-6 w-6 text-royal dark:text-pulse" />
            <h2 className="text-xl font-black">Live Chat UI</h2>
          </div>
          <div className="space-y-3">
            <ChatBubble side="left" text="Hi Winnie User, how can we help today?" />
            <ChatBubble side="right" text="I need help tracking my ChatGPT Plus order." />
            <ChatBubble side="left" text="We found it. Provider activation is currently processing." />
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

        <div className="glass-panel rounded-lg p-5">
          <div className="mb-4 flex items-center gap-3">
            <Ticket className="h-6 w-6 text-royal dark:text-pulse" />
            <h2 className="text-xl font-black">Tickets</h2>
          </div>
          <div className="grid gap-3">
            {supportTickets.map((ticket) => (
              <div key={ticket.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white/65 p-4 dark:border-white/10 dark:bg-white/[0.045]">
                <div>
                  <p className="font-black">{ticket.subject}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{ticket.id} - {ticket.updated}</p>
                </div>
                <span className="rounded-md bg-royal/12 px-2.5 py-1 text-xs font-black text-royal dark:text-pulse">{ticket.status}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <aside className="space-y-6">
        <div className="glass-panel rounded-lg p-5">
          <h2 className="text-xl font-black">FAQ</h2>
          <div className="mt-4 space-y-3">
            {faqs.map((faq) => (
              <details key={faq.question} className="rounded-lg border border-slate-200 bg-white/65 p-4 dark:border-white/10 dark:bg-white/[0.045]">
                <summary className="cursor-pointer font-black">{faq.question}</summary>
                <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>

        <div className="glass-panel rounded-lg p-5">
          <h2 className="text-xl font-black">Contact Us</h2>
          <div className="mt-4 grid gap-3">
            <Contact icon={Mail} label="Email" value="support@winniefun.com" />
            <Contact icon={Phone} label="Phone" value="+1 555 0104" />
            <Contact icon={MessageSquareText} label="Live Chat" value="Available 24/7" />
          </div>
        </div>
      </aside>
    </div>
  );
}

function ChatBubble({ side, text }) {
  return (
    <div className={`flex ${side === "right" ? "justify-end" : "justify-start"}`}>
      <p className={`max-w-[78%] rounded-lg px-4 py-3 text-sm leading-6 ${side === "right" ? "bg-gradient-to-r from-royal to-pulse text-white" : "bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-200"}`}>
        {text}
      </p>
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
