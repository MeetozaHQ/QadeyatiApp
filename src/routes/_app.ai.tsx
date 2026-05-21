import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  Send,
  Sparkles,
  Save,
  Loader2,
  FileText,
  Download,
  Copy,
  Printer,
  ShieldAlert,
} from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { chatWithAI, type ChatMessage } from "@/lib/ai.functions";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useTrial } from "@/hooks/use-trial";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  buildDocxBlob,
  buildFileName,
  detectDocType,
  downloadBlob,
  openPrintPdf,
} from "@/lib/ai-export";

interface AISearch {
  caseId?: string;
}

export const Route = createFileRoute("/_app/ai")({
  validateSearch: (s: Record<string, unknown>): AISearch => ({
    caseId: typeof s.caseId === "string" ? s.caseId : undefined,
  }),
  component: AIPage,
});

const TEMPLATES: Array<{ label: string; prompt: string }> = [
  { label: "تلخيص نص", prompt: "لخّص النص التالي قانونيًا في نقاط واضحة:\n\n" },
  {
    label: "النقاط الجوهرية",
    prompt:
      "استخرج من النص التالي: أهم التواريخ، الأطراف، المخاطر القانونية، والإجراءات المطلوبة:\n\n",
  },
  {
    label: "مذكرة دفاع",
    prompt: "اكتب مسودة مذكرة دفاع موجزة بالعربية لقضية بالموضوع التالي:\n\n",
  },
  { label: "طلب تأجيل", prompt: "اكتب مسودة طلب تأجيل جلسة بصياغة رسمية، بالسبب التالي:\n\n" },
  {
    label: "إنذار رسمي",
    prompt: "اكتب مسودة إنذار رسمي بصياغة قانونية مصرية، بالموضوع التالي:\n\n",
  },
  {
    label: "مذكرة استئناف",
    prompt: "اكتب مسودة مذكرة استئناف موجزة بالعربية، بالموضوع التالي:\n\n",
  },
];

function AIPage() {
  const { caseId } = Route.useSearch();
  const { user } = useAuth();
  const { isTrialExpired } = useTrial();
  const navigate = useNavigate();
  const callChat = useServerFn(chatWithAI);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [caseInfo, setCaseInfo] = useState<{
    title: string | null;
    case_number: string | null;
  } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (!caseId) {
      setCaseInfo(null);
      return;
    }
    (async () => {
      const { data } = await supabase
        .from("cases")
        .select("title,case_number")
        .eq("id", caseId)
        .maybeSingle();
      if (data) setCaseInfo({ title: data.title, case_number: data.case_number });
    })();
  }, [caseId]);

  const lastUserPrompt = (idx: number): string => {
    for (let i = idx - 1; i >= 0; i--) {
      if (messages[i].role === "user") return messages[i].content;
    }
    return "";
  };

  const buildMeta = (hint: string) => {
    const t = detectDocType(hint);
    return {
      typeKey: t.key,
      title: t.label,
      caseTitle: caseInfo?.title ?? null,
      caseNumber: caseInfo?.case_number ?? null,
    };
  };

  const send = async (text: string) => {
    const content = text.trim();
    if (!content || loading) return;
    if (isTrialExpired) {
      setError(
        "انتهت فترتكم التجريبية المجانية لـ قضيتي (٧ أيام). يرجى الاشتراك أو التنشيط مجانًا بالرمز الترويجي EGYPT بالشريط العلوي لمواصلة الاستفادة من مزايا المساعد الذكي.",
      );
      return;
    }
    setError(null);
    const next: ChatMessage[] = [...messages, { role: "user", content }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const { content: reply } = await callChat({
        data: { messages: next, caseId: caseId ?? null },
      });
      setMessages([...next, { role: "assistant", content: reply }]);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "حدث خطأ";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const saveAsNote = async (content: string) => {
    if (isTrialExpired) {
      toast.error("انتهت الفترة التجريبية. يرجى تفعيل الاشتراك.");
      return;
    }
    if (!caseId || !user) {
      toast.error("لحفظ كملاحظة افتح المساعد من داخل قضية.");
      return;
    }
    const { error } = await supabase.from("case_notes").insert({
      case_id: caseId,
      user_id: user.id,
      content: `[مساعد ذكي]\n${content}`,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("تم حفظ الملاحظة");
    navigate({ to: "/cases/$caseId", params: { caseId } });
  };

  const saveAsDocument = async (content: string, hint: string) => {
    if (isTrialExpired) {
      toast.error("انتهت الفترة التجريبية. يرجى تفعيل الاشتراك المميز لحفظ المستندات.");
      return;
    }
    if (!caseId || !user) {
      toast.error("لحفظ داخل القضية افتح المساعد من داخل قضية.");
      return;
    }
    try {
      const meta = buildMeta(hint);
      const fileName = buildFileName({
        typeKey: meta.typeKey,
        caseTitle: meta.caseTitle,
        caseNumber: meta.caseNumber,
        ext: "docx",
        withTimestamp: true,
      });
      const blob = await buildDocxBlob(content, meta);
      const path = `${user.id}/${caseId}/${Date.now()}-ai-draft.docx`;
      const contentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
      const { error: upErr } = await supabase.storage
        .from("case-attachments")
        .upload(path, blob, { contentType });
      if (upErr) {
        toast.error(upErr.message);
        return;
      }
      const { error: insErr } = await supabase.from("case_attachments").insert({
        case_id: caseId,
        user_id: user.id,
        file_name: fileName,
        file_url: path,
        file_type: contentType,
        file_size: blob.size,
        category: "مذكرات",
      });
      if (insErr) {
        await supabase.storage.from("case-attachments").remove([path]);
        toast.error(insErr.message);
        return;
      }
      toast.success("تم حفظ المسودة داخل القضية");
      navigate({ to: "/cases/$caseId", params: { caseId } });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "فشل الحفظ");
    }
  };

  const downloadDocx = async (content: string, hint: string) => {
    try {
      const meta = buildMeta(hint);
      const blob = await buildDocxBlob(content, meta);
      downloadBlob(
        blob,
        buildFileName({
          typeKey: meta.typeKey,
          caseTitle: meta.caseTitle,
          caseNumber: meta.caseNumber,
          ext: "docx",
          withTimestamp: true,
        }),
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "فشل التحميل");
    }
  };

  const exportPdf = (content: string, hint: string) => {
    openPrintPdf(content, buildMeta(hint));
  };

  const copyText = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      toast.success("تم نسخ النص");
    } catch {
      toast.error("تعذّر النسخ");
    }
  };

  return (
    <div className="-mx-4 -mt-4 flex h-[calc(100dvh-3.5rem-5rem)] flex-col">
      <div className="border-b border-border bg-background/80 px-4 py-3 backdrop-blur-md">
        <h1 className="flex items-center gap-2 font-display text-lg font-bold text-foreground">
          <Sparkles className="h-5 w-5 text-[var(--gold)]" /> المستشار الذكي
        </h1>
        {caseId && (
          <p className="mt-1 text-xs text-[var(--gold-soft)]">مرتبط بسياق القضية الحالية</p>
        )}
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 && (
          <div className="space-y-4">
            <p className="text-center text-sm text-muted-foreground">
              اختر قالبًا أو اكتب سؤالك القانوني.
            </p>
            <div className="grid grid-cols-2 gap-2">
              {TEMPLATES.map((t) => (
                <button
                  key={t.label}
                  onClick={() => setInput(t.prompt)}
                  className="rounded-xl border border-border bg-card p-3 text-right text-sm text-foreground transition-colors hover:border-[var(--gold)]/40"
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-3">
          {messages.map((m, i) => (
            <div
              key={i}
              className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}
            >
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap",
                  m.role === "user"
                    ? "bg-gradient-to-b from-[var(--gold-soft)] to-[var(--gold)] text-[color:var(--primary-foreground)]"
                    : "border border-border bg-card text-foreground",
                )}
              >
                {m.content}
                {m.role === "assistant" && (
                  <>
                    <p className="mt-3 border-t border-border/60 pt-2 text-[10px] text-muted-foreground">
                      هذا اقتراح مولد بالذكاء الاصطناعي ويجب مراجعته قانونيًا.
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <button
                        onClick={() => downloadDocx(m.content, lastUserPrompt(i))}
                        className="inline-flex items-center gap-1 rounded-lg border border-[var(--gold)]/40 bg-[var(--gold)]/10 px-2 py-1 text-[11px] text-[var(--gold-soft)] hover:bg-[var(--gold)]/20"
                      >
                        <Download className="h-3 w-3" /> تحميل DOCX
                      </button>
                      <button
                        onClick={() => exportPdf(m.content, lastUserPrompt(i))}
                        className="inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-[11px] text-foreground hover:bg-secondary"
                      >
                        <Printer className="h-3 w-3" /> تحويل إلى PDF
                      </button>
                      <button
                        onClick={() => copyText(m.content)}
                        className="inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-[11px] text-foreground hover:bg-secondary"
                      >
                        <Copy className="h-3 w-3" /> نسخ
                      </button>
                      {caseId && (
                        <>
                          <button
                            onClick={() => saveAsNote(m.content)}
                            className="inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-[11px] text-[var(--gold-soft)] hover:bg-secondary"
                          >
                            <Save className="h-3 w-3" /> حفظ كملاحظة
                          </button>
                          <button
                            onClick={() => saveAsDocument(m.content, lastUserPrompt(i))}
                            className="inline-flex items-center gap-1 rounded-lg border border-[var(--gold)]/40 bg-[var(--gold)]/10 px-2 py-1 text-[11px] text-[var(--gold-soft)] hover:bg-[var(--gold)]/20"
                          >
                            <FileText className="h-3 w-3" /> حفظ كمسودة قانونية
                          </button>
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="rounded-2xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
                <Loader2 className="inline h-4 w-4 animate-spin" /> يكتب…
              </div>
            </div>
          )}
          {error && (
            <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {error}
            </div>
          )}
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="border-t border-border bg-background/80 px-3 py-3 backdrop-blur-md"
      >
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
            placeholder="اكتب سؤالك القانوني…"
            rows={2}
            className="flex-1 resize-none rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground/60 focus:border-[var(--gold)]"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-b from-[var(--gold-soft)] to-[var(--gold)] text-[color:var(--primary-foreground)] shadow-gold disabled:opacity-50"
            aria-label="إرسال"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </form>
    </div>
  );
}
