import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { GoogleGenAI } from "@google/genai";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ChatInput {
  messages: ChatMessage[];
  caseId?: string | null;
}

const SYSTEM_PROMPT = `أنت مساعد قانوني ذكي للمحامين المصريين في تطبيق "قضيتي".
- أجب دائمًا بالعربية الفصحى بأسلوب مهني موجز ومنظم.
- استخدم النقاط والعناوين عند الحاجة.
- لا تدّعي اليقين القانوني المطلق؛ استخدم صياغات مثل "يُستحسن" و"يمكن".
- إذا طُلب صياغة مذكرة أو إنذار، قدّم مسودّة قابلة للتعديل.
- لا تختلق أرقام قضايا أو مواد قانونية إن لم تكن متأكدًا.`;

export const chatWithAI = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: ChatInput) => input)
  .handler(async ({ data, context }) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error(
        "لم يتم تهيئة مفتاح GEMINI_API_KEY في النظام الحسابي. يرجى إضافته في إعدادات المنصة أو في متغيرات البيئة.",
      );
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });

    let contextBlock = "";
    if (data.caseId) {
      const { supabase } = context;
      const { data: c } = await supabase
        .from("cases")
        .select(
          "title,case_number,case_type,court_name,client_name,opponent_name,description,status",
        )
        .eq("id", data.caseId)
        .maybeSingle();
      if (c) {
        const { data: notes } = await supabase
          .from("case_notes")
          .select("content")
          .eq("case_id", data.caseId)
          .order("created_at", { ascending: false })
          .limit(5);
        const { data: sessions } = await supabase
          .from("sessions")
          .select("session_date,notes")
          .eq("case_id", data.caseId)
          .order("session_date", { ascending: false })
          .limit(5);
        contextBlock =
          `\n\nسياق القضية الحالية:\n` +
          `- العنوان: ${c.title}\n` +
          `- النوع: ${c.case_type ?? "—"}\n` +
          `- المحكمة: ${c.court_name ?? "—"}\n` +
          `- الموكل: ${c.client_name ?? "—"}\n` +
          `- الخصم: ${c.opponent_name ?? "—"}\n` +
          `- الحالة: ${c.status}\n` +
          (c.description ? `- الوصف: ${c.description}\n` : "") +
          (sessions?.length
            ? `- آخر الجلسات:\n${sessions.map((s) => `  • ${s.session_date}${s.notes ? " — " + s.notes : ""}`).join("\n")}\n`
            : "") +
          (notes?.length
            ? `- آخر الملاحظات:\n${notes.map((n) => `  • ${n.content}`).join("\n")}`
            : "");
      }
    }

    const systemInstruction = SYSTEM_PROMPT + contextBlock;
    const contents = data.messages
      .filter((msg) => msg.role !== "system")
      .map((msg) => ({
        role: msg.role === "assistant" ? ("model" as const) : ("user" as const),
        parts: [{ text: msg.content }],
      }));

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents,
        config: {
          systemInstruction,
        },
      });
      const content = response.text || "";
      return { content };
    } catch (error) {
      console.error("Gemini API Error:", error);
      throw new Error(
        `تعذر الاتصال بالمستشار الذكي: ${error instanceof Error ? error.message : "حدث خطأ غير معروف"}`,
      );
    }
  });
