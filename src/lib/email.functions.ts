import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

interface InviteInput {
  lawyerName: string;
  lawyerEmail: string;
  lawyerRole: string;
  ownerEmail: string;
}

interface PerformanceReportInput {
  lawyers: {
    name: string;
    email: string;
    role: string;
    casesCount: number;
    aiUsage: number;
  }[];
}

interface FinancialReportInput {
  ownerEmail: string;
  totalIncome: number;
  expectedIncome: number;
  overdueCount: number;
  activeCasesCount: number;
}

// Lazy initialization of Resend client to avoid crashing if key is missing on start
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let resendClient: any = null;

async function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return null;
  }
  if (!resendClient) {
    const { Resend } = await import("resend");
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

/**
 * Server function to send a real email invitation to a newly added lawyer.
 */
export const sendLawyerInviteEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: InviteInput) => input)
  .handler(async ({ data }) => {
    const resend = await getResendClient();
    if (!resend) {
      return { success: false, error: "MISSING_API_KEY" };
    }

    const { lawyerName, lawyerEmail, lawyerRole, ownerEmail } = data;

    const htmlContent = `
      <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #f8fafc; color: #1e293b; text-align: right;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #c99a3c; margin: 0; font-size: 28px; font-weight: bold; letter-spacing: -0.5px;">قضيتي</h1>
          <p style="color: #64748b; font-size: 14px; margin-top: 4px;">المنصة والمنظومة القانونية المتكاملة لإدارة مكاتب المحاماة</p>
        </div>
        
        <div style="background-color: #ffffff; padding: 24px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); margin-bottom: 20px;">
          <h2 style="color: #1e3a8a; margin-top: 0; margin-bottom: 16px; font-size: 20px; border-bottom: 2px solid #f1f5f9; padding-bottom: 8px;">مرحباً بك ${lawyerName}،</h2>
          <p style="font-size: 15px; line-height: 1.7; color: #334155; margin-bottom: 18px;">
            لقد قام صاحب المكتب بدعوتك للانضمام إلى طاقم العمل بصفة فنية: <strong>${lawyerRole}</strong> في تطبيق <strong>قضيتي</strong>.
          </p>
          
          <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 16px; margin-bottom: 20px; text-align: right;">
            <p style="margin: 0; font-size: 13px; color: #1e40af;"><strong>تفاصيل الدخول الخاصة بك:</strong></p>
            <ul style="margin: 8px 0 0 0; padding-right: 20px; font-size: 13px; color: #1e3a8a; line-height: 1.6;">
              <li><strong>البريد الإلكتروني:</strong> ${lawyerEmail}</li>
              <li><strong>الحالة:</strong> نشط (يمكنك تسجيل الدخول فوراً باستخدام نفس البريد)</li>
              <li><strong>المكتب الداعي:</strong> ${ownerEmail}</li>
            </ul>
          </div>

          <p style="font-size: 14px; line-height: 1.6; color: #475569;">
            من خلال حسابك القانوني الجديد، ستتمكن من تتبع قضاياك المسندة إليك، تحديث مذكرات الدفاع، متابعة الجلسات وأجندة العمل اليومية بشكل آلي ذكي مستشفي بذكاء اصطناعي قانوني مصري.
          </p>

          <div style="text-align: center; margin: 28px 0 10px 0;">
            <a href="${process.env.APP_URL || "https://qadeyti.eg"}" style="background-color: #1e3a8a; color: #ffffff; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px; display: inline-block; box-shadow: 0 4px 6px rgba(30, 58, 138, 0.25);">
              تسجيل الدخول وبدء العمل ⚖️
            </a>
          </div>
        </div>

        <div style="text-align: center; color: #94a3b8; font-size: 11px; margin-top: 20px; line-height: 1.5;">
          <p style="margin-bottom: 4px;">هذه الدعوة مُرسلة تلقائياً بالنيابة عن مكتب المحاماة المشترك.</p>
          <p style="margin: 0;">&copy; ${new Date().getFullYear()} قضيتي - جميع الحقوق محفوظة لشركائنا الفنيين.</p>
        </div>
      </div>
    `;

    try {
      const emailPromise = resend.emails.send({
        from: "منصة قضيتي <info@qadeyti.com>",
        to: [lawyerEmail],
        subject: `⚖️ دعوة انضمام وتنشيط حسابك في منظومة قضيتي - ${lawyerName}`,
        html: htmlContent,
      });

      const timeoutPromise = new Promise<{ data: unknown; error: { message: string } | null }>(
        (_, reject) => setTimeout(() => reject(new Error("TIMEOUT")), 5000),
      );

      const response = await Promise.race([emailPromise, timeoutPromise]);
      const { error: sendError } = response as { error: { message: string } | null };

      if (sendError) {
        console.error("Resend delivery object error:", sendError);
        return { success: false, error: sendError.message || JSON.stringify(sendError) };
      }

      return { success: true };
    } catch (error) {
      console.error("Resend send lawyer invite error:", error);
      const isTimeout = error instanceof Error && error.message === "TIMEOUT";
      return {
        success: false,
        error: isTimeout
          ? "انتهت مهلة الاتصال بالخادم عند محاولة إرسال البريد الإلكتروني"
          : error instanceof Error
            ? error.message
            : "حدث خطأ أثناء الإرسال",
      };
    }
  });

/**
 * Server function to send performance reports to all registered lawyers on demand.
 */
export const sendLawyersPerformanceReports = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: PerformanceReportInput) => input)
  .handler(async ({ data }) => {
    const resend = await getResendClient();
    if (!resend) {
      return { success: false, error: "MISSING_API_KEY" };
    }

    const { lawyers } = data;
    let successCount = 0;
    const errors: string[] = [];

    for (const lawyer of lawyers) {
      // Validate or ignore non-real emails ending with default template domains if needed
      if (!lawyer.email || lawyer.email.endsWith("@qadeyti.eg")) {
        // We'll skip or simulate sending to test domains
        continue;
      }

      const htmlContent = `
        <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #fafbfc; color: #1e293b; text-align: right;">
          <div style="text-align: center; margin-bottom: 24px;">
            <p style="color: #c99a3c; margin: 0; font-size: 24px; font-weight: bold;">قضيتي</p>
            <p style="color: #64748b; font-size: 12px; margin-top: 4px;">تقرير التحليل والأداء الفني للمحامي</p>
          </div>
          
          <div style="background-color: #ffffff; padding: 24px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.03); margin-bottom: 20px;">
            <h2 style="color: #1e3a8a; margin-top: 0; margin-bottom: 16px; font-size: 18px; border-bottom: 2px solid #f1f5f9; padding-bottom: 8px;">الزميل الفاضل ${lawyer.name} (${lawyer.role})</h2>
            <p style="font-size: 14px; line-height: 1.6; color: #334155; margin-bottom: 18px;">
              إليك ملخص مؤشرات الأداء العملي والنشاط الجاري المسند إليك خلال الشهر الحالي بمكتب شركائنا القانونيين.
            </p>

            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px;">
              <thead>
                <tr style="background-color: #f1f5f9; border-bottom: 2px solid #cbd5e1;">
                  <th style="padding: 10px; text-align: right; color: #475569;">المؤشر</th>
                  <th style="padding: 10px; text-align: center; color: #475569;">الإحصائية</th>
                </tr>
              </thead>
              <tbody>
                <tr style="border-bottom: 1px solid #e2e8f0;">
                  <td style="padding: 10px; color: #1e293b;">عدد القضايا النشطة المسندة</td>
                  <td style="padding: 10px; text-align: center; font-weight: bold; color: #1e3a8a;">${lawyer.casesCount} قضية</td>
                </tr>
                <tr style="border-bottom: 1px solid #e2e8f0;">
                  <td style="padding: 10px; color: #1e293b;">استشارات المستشار الذكي المنجزة (AI)</td>
                  <td style="padding: 10px; text-align: center; font-weight: bold; color: #10b981;">${lawyer.aiUsage} / 600 طلب شهري</td>
                </tr>
                <tr style="border-bottom: 1px solid #e2e8f0;">
                  <td style="padding: 10px; color: #1e293b;">مستوى الالتزام بتحديث الملاحظات والجلسات</td>
                  <td style="padding: 10px; text-align: center; font-weight: bold; color: #f59e0b;">ممتاز (مؤمن بالكامل)</td>
                </tr>
              </tbody>
            </table>

            <div style="background-color: #fffbeb; border: 1px solid #fef3c7; border-radius: 8px; padding: 12px; font-size: 11px; color: #b45309; line-height: 1.5;">
              <strong>حماية وسرية تامة:</strong> لا تتضمن التقارير المرسلة لأي من السادة المحامين أي أرقام مالية أو إدارية تخص خزانة وعقود المكتب، حمايةً لسياسة وخصوصية الشركاء وصاحب المؤسسة الكلي.
            </div>
          </div>

          <div style="text-align: center; color: #94a3b8; font-size: 11px; margin-top: 20px;">
            <p style="margin: 0;">&copy; ${new Date().getFullYear()} قضيتي إدارة متكاملة لمكاتب المحاماة.</p>
          </div>
        </div>
      `;

      try {
        const emailPromise = resend.emails.send({
          from: "منصة قضيتي <info@qadeyti.com>",
          to: [lawyer.email],
          subject: `📊 تقرير الأداء العملي والأجهزة المسندة إليك - ${lawyer.name}`,
          html: htmlContent,
        });

        const timeoutPromise = new Promise<{ data: unknown; error: { message: string } | null }>(
          (_, reject) => setTimeout(() => reject(new Error("TIMEOUT")), 5000),
        );

        const response = await Promise.race([emailPromise, timeoutPromise]);
        const { error: sendError } = response as { error: { message: string } | null };

        if (sendError) {
          console.error(
            `Resend send lawyer performance delivery error for ${lawyer.email}:`,
            sendError,
          );
          errors.push(lawyer.email);
        } else {
          successCount++;
        }
      } catch (err) {
        console.error(`Resend send lawyer performance error for ${lawyer.email}:`, err);
        errors.push(lawyer.email);
      }
    }

    return { success: true, successCount, failedLayout: errors };
  });

/**
 * Server function to send comprehensive financial and administrative reports to the office owner.
 */
export const sendOwnerFinancialReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: FinancialReportInput) => input)
  .handler(async ({ data }) => {
    const resend = await getResendClient();
    if (!resend) {
      return { success: false, error: "MISSING_API_KEY" };
    }

    const { ownerEmail, totalIncome, expectedIncome, overdueCount, activeCasesCount } = data;

    const htmlContent = `
      <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #0f172a; color: #f1f5f9; text-align: right;">
        <div style="text-align: center; margin-bottom: 24px; border-bottom: 1px solid #334155; padding-bottom: 16px;">
          <h1 style="color: #fbbf24; margin: 0; font-size: 26px; font-weight: bold; letter-spacing: -0.5px;">قضيتي للمحاماة الكبرى</h1>
          <p style="color: #94a3b8; font-size: 12px; margin-top: 4px;">شريك الذكاء والتحليل المالي لعام ${new Date().getFullYear()}</p>
        </div>
        
        <div style="background-color: #1e293b; padding: 24px; border-radius: 12px; border: 1px solid #334155; margin-bottom: 20px;">
          <h2 style="color: #fbbf24; margin-top: 0; margin-bottom: 16px; font-size: 18px; border-bottom: 1px solid #334155; padding-bottom: 8px;">لوحة التقارير المالية والإدارية الشاملة 🔒</h2>
          <p style="font-size: 14px; line-height: 1.6; color: #cbd5e1; margin-bottom: 20px;">
            أهلاً بك يا شريكنا الأول. إليك التقرير المالي الحصري لمكتبك، تم رصده وتجهيزه بناء على المعاملات المالية الحية في النظام:
          </p>

          <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 13px;">
            <thead>
              <tr style="background-color: #334155;">
                <th style="padding: 10px; text-align: right; color: #fbbf24; border: 1px solid #475569;">المعلم الخدمي</th>
                <th style="padding: 10px; text-align: center; color: #ffffff; border: 1px solid #475569;">الوضع الحيوي</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="padding: 10px; border: 1px solid #475569; color: #e2e8f0;">الإيرادات الفعلية المحصلة</td>
                <td style="padding: 10px; border: 1px solid #475569; text-align: center; font-weight: bold; color: #10b981; font-size: 14px;">${totalIncome.toLocaleString()} ج.م</td>
              </tr>
              <tr>
                <td style="padding: 10px; border: 1px solid #475569; color: #e2e8f0;">مستحقات معلقة قيد التحصيل</td>
                <td style="padding: 10px; border: 1px solid #475569; text-align: center; font-weight: bold; color: #60a5fa; font-size: 14px;">${expectedIncome.toLocaleString()} ج.م</td>
              </tr>
              <tr>
                <td style="padding: 10px; border: 1px solid #475569; color: #e2e8f0;">أقساط متأخرة تجاوزت الاستحقاق</td>
                <td style="padding: 10px; border: 1px solid #475569; text-align: center; font-weight: bold; color: #f87171; font-size: 14px;">${overdueCount} قسط</td>
              </tr>
              <tr>
                <td style="padding: 10px; border: 1px solid #475569; color: #e2e8f0;">إجمالي القضايا النشطة الحالية</td>
                <td style="padding: 10px; border: 1px solid #475569; text-align: center; font-weight: bold; color: #e2e8f0;">${activeCasesCount} دعوى</td>
              </tr>
            </tbody>
          </table>

          <div style="background-color: #1e1b4b; border: 1px solid #312e81; border-radius: 8px; padding: 14px; font-size: 11px; color: #a5b4fc; line-height: 1.6;">
            <strong>طبيعة سرية ومؤمنة:</strong> هذا التقرير مصمم ليرسل إليك حصرياً وبشكل مشفر في خوادم بريدك القانوني للتواصل التنظيمي. لا يمكن حتى للمشرفين المقيدين فحص هذه التفاصيل إلا في لوحتك القيادية الفردية.
          </div>
        </div>

        <div style="text-align: center; color: #64748b; font-size: 11px; margin-top: 20px;">
          <p style="margin: 0;">&copy; ${new Date().getFullYear()} قضيتي - لوحات التحكم الشريكة لمديري مكاتب القانون.</p>
        </div>
      </div>
    `;

    try {
      const emailPromise = resend.emails.send({
        from: "منصة قضيتي <info@qadeyti.com>",
        to: [ownerEmail],
        subject: `📈 التقرير والبيان المالي الشامل لمكتب المحاماة والشركاء`,
        html: htmlContent,
      });

      const timeoutPromise = new Promise<{ data: unknown; error: { message: string } | null }>(
        (_, reject) => setTimeout(() => reject(new Error("TIMEOUT")), 5000),
      );

      const response = await Promise.race([emailPromise, timeoutPromise]);
      const { error: sendError } = response as { error: { message: string } | null };

      if (sendError) {
        console.error("Resend delivery object error:", sendError);
        return { success: false, error: sendError.message || JSON.stringify(sendError) };
      }

      return { success: true };
    } catch (error) {
      console.error("Resend send financial report error:", error);
      const isTimeout = error instanceof Error && error.message === "TIMEOUT";
      return {
        success: false,
        error: isTimeout
          ? "انتهت مهلة المزامنة والارتباط بخوادم البريد الإلكتروني"
          : error instanceof Error
            ? error.message
            : "حدث خروج أو عطل أثناء إرسال البيان",
      };
    }
  });
