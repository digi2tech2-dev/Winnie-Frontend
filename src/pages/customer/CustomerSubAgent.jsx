import { useState } from "react";
import { Copy, Link2, Send, Share2, UserPlus, WalletCards } from "lucide-react";
import { useToast } from "../../components/ToastProvider";

const inviteCode = "WINNIE-333";
const subAgentSlide = "/اسلايد وكيل.jpg";

const activeAgents = [
  {
    id: "ref-001",
    name: "Mona Ahmed",
    avatar: "/hero-winnie-fun.png",
    profit: 12.5,
    status: "إحالة مكتملة",
  },
  {
    id: "ref-002",
    name: "Omar Hassan",
    avatar: "/hero-winnie-fun.png",
    profit: 8.75,
    status: "إحالة مكتملة",
  },
  {
    id: "ref-003",
    name: "Sara Ali",
    avatar: "/hero-winnie-fun.png",
    profit: 6.25,
    status: "إحالة مكتملة",
  },
];

const formatProfit = (value) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);

export default function CustomerSubAgent() {
  const { showToast } = useToast();
  const [requestMessage, setRequestMessage] = useState("");
  const referralLink = `https://winniefun.com/?ref=${encodeURIComponent(inviteCode)}`;
  const totalProfit = activeAgents.reduce((sum, agent) => sum + agent.profit, 0);

  const copyText = async (text, title) => {
    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error("Clipboard is not available");
      }
      await navigator.clipboard.writeText(text);
      showToast({ type: "success", title, message: text });
    } catch {
      showToast({ type: "info", title: "انسخها يدويًا", message: text });
    }
  };

  const withdrawToWallet = () => {
    if (totalProfit <= 0) {
      showToast({ type: "info", title: "لا توجد أرباح", message: "لا يوجد رصيد إحالة متاح للسحب حالياً." });
      return;
    }

    showToast({
      type: "info",
      title: "سحب الإحالات غير متصل بعد",
      message: "Referral payouts will be connected in a later phase. No wallet transaction was created.",
    });
  };

  const submitSubAgentRequest = () => {
    if (!requestMessage.trim()) {
      showToast({ type: "warning", title: "اكتب رسالتك أولًا", message: "عرّفنا بنشاطك ولماذا تريد أن تصبح وكيلًا فرعيًا." });
      return;
    }
    showToast({
      type: "info",
      title: "طلب الوكيل غير متصل بعد",
      message: "Sub-agent requests will be connected in a later phase. No request was submitted.",
    });
  };

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-lg border border-[#8B5CF6]/20 bg-[#050816] shadow-[0_20px_60px_rgba(139,92,246,0.18)] dark:border-white/10 dark:shadow-[0_0_28px_rgba(139,92,246,0.22)]">
        <img
          src={subAgentSlide}
          alt="وكيل فرعي من Winnie"
          className="block h-auto w-full"
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <article className="glass-panel rounded-lg p-5 lg:col-span-3">
          <div className="flex items-start gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-royal/12 text-royal dark:bg-pulse/15 dark:text-pulse"><Send className="h-5 w-5" /></span>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-black text-slate-950 dark:text-white">طلب الانضمام كوكيل فرعي</h2>
              <p className="mt-1 text-xs font-semibold leading-5 text-slate-500 dark:text-[#8A94A7]">اكتب رسالتك ونشاطك، وسيحدد الأدمن المجموعة ونسبة الأسعار المناسبة بعد المراجعة.</p>
            </div>
          </div>
          <textarea value={requestMessage} onChange={(event) => setRequestMessage(event.target.value)} placeholder="مثال: أنا وكيل وأبيع خدمات رقمية وكنت حابب أكون وكيل فرعي عندكم..." className="mt-4 min-h-[100px] w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm font-bold text-slate-950 outline-none focus:border-[#8B5CF6] focus:ring-4 focus:ring-[#8B5CF6]/10 dark:border-white/10 dark:bg-[#0D1324] dark:text-white" />
          <button type="button" onClick={submitSubAgentRequest} className="mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#7C3AED] to-[#A855F7] text-xs font-black text-white"><Send className="h-4 w-4" />إرسال طلب وكيل فرعي</button>
        </article>
        <article className="glass-panel rounded-lg p-5 lg:col-span-3">
          <span className="grid h-11 w-11 place-items-center rounded-lg bg-royal/12 text-royal dark:bg-pulse/15 dark:text-pulse">
            <Share2 className="h-5 w-5" />
          </span>
          <p className="mt-4 text-sm font-semibold text-slate-500 dark:text-[#8A94A7]">رمز الدعوة</p>
          <p className="mt-1 text-2xl font-black text-slate-950 dark:text-white">{inviteCode}</p>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <button
              type="button"
              onClick={() => copyText(referralLink, "تم نسخ لينك الإحالة")}
              className="interactive-ring flex min-h-14 items-center justify-between gap-3 rounded-xl border border-sky-100 bg-white px-4 text-right text-sm font-black text-slate-700 shadow-[0_8px_20px_rgba(14,165,233,0.08)] dark:border-white/10 dark:bg-[#0D1324] dark:text-[#C4C9D4]"
            >
              <span className="flex min-w-0 flex-col">
                <span>اضغط هنا لنسخ لينك الموقع مع رمز الإحالة</span>
                <span dir="ltr" className="mt-1 truncate text-xs font-semibold text-slate-500 dark:text-[#8A94A7]">
                  {referralLink}
                </span>
              </span>
              <Link2 className="h-5 w-5 shrink-0 text-[#8B5CF6]" />
            </button>

            <button
              type="button"
              onClick={() => copyText(inviteCode, "تم نسخ رمز الدعوة")}
              className="interactive-ring flex min-h-14 items-center justify-between gap-3 rounded-xl border border-[#C4B5FD]/55 bg-[#F5F3FF] px-4 text-right text-sm font-black text-[#7C3AED] shadow-[0_8px_20px_rgba(139,92,246,0.10)] dark:border-[#8B5CF6]/32 dark:bg-[#1A2335] dark:text-[#E9D5FF]"
            >
              <span className="flex min-w-0 flex-col">
                <span>اضغط هنا لنسخ الرمز لوحده</span>
                <span dir="ltr" className="mt-1 text-xs font-semibold">
                  {inviteCode}
                </span>
              </span>
              <Copy className="h-5 w-5 shrink-0" />
            </button>
          </div>
        </article>

        <article className="glass-panel rounded-lg p-5 lg:col-span-2">
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="grid h-11 w-11 place-items-center rounded-lg bg-royal/12 text-royal dark:bg-pulse/15 dark:text-pulse">
                <UserPlus className="h-5 w-5" />
              </span>
              <p className="mt-4 text-sm font-semibold text-slate-500 dark:text-[#8A94A7]">الوكلاء النشطون</p>
              <p className="mt-1 text-2xl font-black text-slate-950 dark:text-white">{activeAgents.length}</p>
            </div>
            <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-black text-emerald-600 dark:text-emerald-300">
              إحالات مكتملة
            </span>
          </div>

          <div className="mt-5 divide-y divide-slate-100 overflow-hidden rounded-lg border border-slate-100 dark:divide-white/10 dark:border-white/10">
            {activeAgents.map((agent) => (
              <div key={agent.id} className="flex items-center gap-3 bg-white px-3 py-3 dark:bg-[#0D1324]">
                <img
                  src={agent.avatar}
                  alt=""
                  className="h-12 w-12 shrink-0 rounded-full border border-[#C4B5FD]/45 object-cover dark:border-[#8B5CF6]/32"
                  style={{ objectPosition: "72% 27%" }}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-black text-slate-950 dark:text-white">{agent.name}</p>
                  <p className="mt-0.5 text-xs font-semibold text-slate-500 dark:text-[#8A94A7]">{agent.status}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-xs font-semibold text-slate-500 dark:text-[#8A94A7]">ربحك</p>
                  <p dir="ltr" className="mt-0.5 text-sm font-black text-emerald-600 dark:text-emerald-300">
                    {formatProfit(agent.profit)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="glass-panel rounded-lg p-5">
          <span className="grid h-11 w-11 place-items-center rounded-lg bg-royal/12 text-royal dark:bg-pulse/15 dark:text-pulse">
            <WalletCards className="h-5 w-5" />
          </span>
          <p className="mt-4 text-sm font-semibold text-slate-500 dark:text-[#8A94A7]">أرباح الإحالة</p>
          <p dir="ltr" className="mt-1 text-2xl font-black text-slate-950 dark:text-white">{formatProfit(totalProfit)}</p>
          <button
            type="button"
            onClick={withdrawToWallet}
            className="interactive-ring mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#A855F7] px-4 text-sm font-black text-white shadow-[0_14px_34px_rgba(139,92,246,0.30)] dark:from-[#8B5CF6] dark:to-[#A855F7] dark:shadow-[0_0_22px_rgba(139,92,246,0.28)]"
          >
            <WalletCards className="h-5 w-5" />
            سحب إلى المحفظة
          </button>
        </article>
      </section>
    </div>
  );
}
