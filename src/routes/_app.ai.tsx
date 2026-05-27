import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Send, Sparkles, MessageSquare, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useTrial } from "@/hooks/use-trial";

export const Route = createFileRoute("/_app/ai")({
  component: AIPage,
});

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

function AIPage() {
  const { user } = useAuth();
  const { limits, aiCount, incrementAIChatUsage } = useTrial();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("ai_chats")
      .select("id,role,content,created_at")
      .order("created_at", { ascending: true })
      .then(({ data }) => setMessages((data as Message[]) ?? []));
  }, [user]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const limitReached = aiCount >= limits.maxAIChats;

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading || !user) return;

    if (limitReached) {
      setError(
        `لقد استهلكت كامل رصيدك للمحادثات لهذا الشهر الفعلي في خطتك الحالية (${limits.maxAIChats} استشارة). يرجى الترقية للحصول على رصيد إضافي.`
      );
      return;
    }

    const text = input.trim();
    setInput("");
    setError(null);
    setLoading(true);

    const tempUserMsg: Message = {
      id: Math.random().toString(),
      role: "user",
      content: text,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const { data, error: err } = await supabase.functions.invoke("legal-helper", {
        body: { prompt: text, userId: user.id },
      });

      if (err) throw err;

      // Save user message to database
      await supabase.from("ai_chats").insert({
        user_id: user.id,
        role: "user",
        content: text,
      });

      // Save assistant response to database
      await supabase.from("ai_chats").insert({
        user_id: user.id,
        role: "assistant",
        content: data.reply || "عذراً، لم أتمكن من معالجة الطلب.",
      });

      const tempAssistantMsg: Message = {
        id: Math.random().toString(),
        role: "assistant",
        content: data.reply || "",
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, tempAssistantMsg]);
      
      // Increment AI Chat Counter
      incrementAIChatUsage();
    } catch (e: any) {
      setError("حدث خطأ أثناء التواصل مع المستشار الذكي. برجاء إعادة المحاولة.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-140px)] flex-col gap-4" dir="rtl">
      {/* Dynamic usage progress header */}
      <div className="rounded-2xl border border-slate-800 bg-[#0C101A] p-4 text-right">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-lg bg-amber-500/10 text-[var(--gold)]">
              <Sparkles className="h-3 w-3 shrink-0" />
            </span>
            <span className="text-xs font-bold text-white">استهلاك المستشار الذكي الشهرى</span>
          </div>
          <span className="text-xs font-bold text-slate-400 font-mono">
            {aiCount} / {limits.maxAIChats} طلب
          </span>
        </div>
        <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
          <div
            className="bg-gradient-to-r from-[var(--gold-soft)] to-[var(--gold)] h-full transition-all duration-300"
            style={{ width: `${Math.min(100, (aiCount / limits.maxAIChats) * 100)}%` }}
          />
        </div>
        {limitReached && (
          <p className="text-[10px] text-red-400 mt-2 font-semibold">
            ✦ لقد وصلت للحد الأقصى المسموح به لباقتك الحالية. يرجى الترقية لتفعيل الاستشارات والطلبات اللانهائية.
          </p>
        )}
      </div>

      {/* Message list area */}
      <div className="flex-1 overflow-y-auto rounded-3xl border border-border bg-[#0C101A] p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center p-8">
            <div className="mb-4 rounded-full bg-amber-500/5 p-4 text-[var(--gold)]">
              <MessageSquare className="h-8 w-8" />
            </div>
            <h3 className="font-display text-base font-bold text-white">ابدأ محادثة المساعدة القانونية</h3>
            <p className="mt-2 text-xs text-slate-400 max-w-xs leading-relaxed">
              اسأل المستشار القانوني الذكي لصياغة مذكرات الدعوى، تلخيص العقود، أو إيجاد المفاصل التشريعية المناسبة لقضيتك.
            </p>
          </div>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              className={`flex flex-col max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed ${
                m.role === "user"
                  ? "mr-auto bg-[#1C2030] text-slate-100 rounded-br-none"
                  : "ml-auto bg-slate-900/60 text-slate-300 border border-slate-800 rounded-bl-none"
              }`}
            >
              <div className="flex items-center gap-1.5 mb-1.5 opacity-60 font-semibold font-mono text-[10px]">
                {m.role === "user" ? "أنت" : "المستشار الذكي"}
                <span>•</span>
                <span>
                  {new Date(m.created_at).toLocaleTimeString("ar-EG", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <p className="whitespace-pre-wrap">{m.content}</p>
            </div>
          ))
        )}
        <div ref={chatEndRef} />
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-2xl bg-red-500/10 border border-red-500/20 p-3.5 text-xs text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={send} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={limitReached ? "تجاوزت الباقة الحد الأقصى للمحادثات" : "اكتب سؤالك القانوني أو طلبك هنا..."}
          disabled={loading || limitReached}
          className="flex-1 rounded-2xl border border-slate-800 bg-[#0C101A] px-4 py-3.5 text-xs font-semibold text-white placeholder:text-slate-600 focus:border-[var(--gold)] focus:outline-none focus:ring-1 focus:ring-[var(--gold)] disabled:opacity-40"
        />
        <button
          type="submit"
          disabled={loading || !input.trim() || limitReached}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-b from-[var(--gold)] to-[var(--accent)] text-black hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-30 cursor-pointer"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}