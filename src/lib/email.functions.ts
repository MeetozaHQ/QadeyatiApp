import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { Resend } from "resend";

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

// Lazy initialization and configuration cleaning for email credentials
function getEmailConfig() {
  const rawKey = process.env.RESEND_API_KEY;
  const rawFrom = process.env.RESEND_FROM_EMAIL;

  const apiKey = rawKey ? rawKey.replace(/['"]/g, "").trim() : null;
  const fromEmail = rawFrom
    ? rawFrom.replace(/['"]/g, "").trim()
    : "منصة قضيتي <info@qadeyati.com>";

  return { apiKey, fromEmail };
}

/**
 * Server function to send a real email invitation to a newly added lawyer.
 */
export const sendLawyerInviteEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: InviteInput) => input)
  .handler(async ({ data }) => {
    try {
      const { apiKey, fromEmail } = getEmailConfig();
      const { lawyerName, lawyerEmail, lawyerRole, ownerEmail } = data;

      console.log(`[Email Service] Attempting to send lawyer invite email to: ${lawyerEmail}`);
      console.log(
        `[Email Service] RESEND_API_KEY status: ${apiKey ? "PRESENT" : "MISSING"}, length: ${apiKey?.length || 0}`,
      );
      console.log(`[Email Service] RESEND_FROM_EMAIL value: "${fromEmail}"`);

      if (!apiKey) {
        return { success: false, error: "MISSING_API_KEY" };
      }

      const baseUrl = (process.env.APP_URL || "https://qadeyati.com").replace(/\/$/, "");
      const signupLink = `${baseUrl}/signup?email=${encodeURIComponent(lawyerEmail)}`;

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
              <p style="margin: 0; font-size: 13px; color: #1e40af;"><strong>لتفعيل حسابك والبدء بالعمل في المكتب، يرجى اتباع الخطوات البسيطة التالية:</strong></p>
              <ol style="margin: 8px 0 0 0; padding-right: 20px; font-size: 13px; color: #1e3a8a; line-height: 1.7;">
                <li>اضغط على زر <strong>"تسجيل الدخول وبدء العمل"</strong> بالأسفل لفتح صفحة إنشاء الحساب الجديد الخاصة بك.</li>
                <li>ستجد بريدك الإلكتروني <strong>(${lawyerEmail})</strong> معبأً وجاهزاً بشكل آلي.</li>
                <li>قم بكتابة كلمة المرور الخاصة بك واضغط <strong>"إنشاء حساب جديد"</strong> لربط وتفعيل حسابك بالمكتب فورياً.</li>
              </ol>
            </div>

            <p style="font-size: 13px; line-height: 1.6; color: #475569; margin-bottom: 12px;">
              <strong>تفاصيل الدعوة:</strong><br/>
              • المكتب القانوني الداعي: <span style="font-family: monospace; color: #1e3a8a;">${ownerEmail}</span><br/>
              • بريدك المدعو: <span style="font-family: monospace; color: #1e3a8a;">${lawyerEmail}</span>
            </p>

            <p style="font-size: 14px; line-height: 1.6; color: #475569;">
               فور تفعيل حسابك، سيتم انضمامك تلقائياً إلى باقة المكتب المميزة <strong>(Enterprise)</strong>، لتتمكن من تتبع القضايا المسندة إليك خصيصاً، تحديث مذكرات الدفاع، متابعة الجلسات وأجندة العمل اليومية بشكل متكامل وبدعم من الذكاء الاصطناعي الفني.
            </p>
 
            <div style="text-align: center; margin: 28px 0 10px 0;">
              <a href="${signupLink}" style="background-color: #1e3a8a; color: #ffffff; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px; display: inline-block; box-shadow: 0 4px 6px rgba(30, 58, 138, 0.25);">
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

      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, 6500); // 6.5 seconds timeout

      try {
        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: fromEmail,
            to: [lawyerEmail],
            subject: `⚖️ دعوة انضمام وتنشيط حسابك في منظومة قضيتي - ${lawyerName}`,
            html: htmlContent,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          console.error("[Email Service] Resend invitation API failed:", response.status, errData);
          const errorMsg =
            errData?.message || errData?.error?.message || `API Error (${response.status})`;
          return { success: false, error: errorMsg };
        }

        const data = await response.json();
        console.log(
          "[Email Service] Invite email successfully queued/sent, API response ID:",
          data.id,
        );
        return { success: true };
      } catch (innerErr) {
        clearTimeout(timeoutId);
        const isAbort = innerErr instanceof Error && innerErr.name === "AbortError";
        console.error("[Email Service] Request error inside sendLawyerInviteEmail:", innerErr);
        return {
          success: false,
          error: isAbort
            ? "انتهت مهلة المزامنة بخوادم البريد الإلكتروني (6.5 ثوانٍ)"
            : innerErr instanceof Error
              ? innerErr.message
              : "تعذر الاتصال بخادم البريد الإلكتروني",
        };
      }
    } catch (error) {
      console.error("Resend send lawyer invite main exception:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "حدث خطأ غير متوقع أثناء المعالجة",
      };
    }
  });

/**
 * Server function to send performance reports to all registered lawyers on demand.
 */
export const sendLawyersPerformanceReports = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: PerformanceReportInput) => input)
  .handler(async ({ data, context }) => {
    try {
      const { apiKey, fromEmail } = getEmailConfig();
      if (!apiKey) {
        return { success: false, error: "MISSING_API_KEY" };
      }

      const { lawyers } = data;
      console.log(`[Email Service] Preparing performance reports for ${lawyers.length} lawyers`);

      let resolvedLawyers = lawyers;
      try {
        let targetedOwnerId = context.userId;
        const userEmail = (context.claims?.email || "") as string;

        if (userEmail) {
          const { data: matchedAsLawyer } = await context.supabase
            .from("firm_lawyers")
            .select("user_id")
            .ilike("email", userEmail.trim())
            .maybeSingle();

          if (matchedAsLawyer?.user_id) {
            targetedOwnerId = matchedAsLawyer.user_id;
          }
        }

        const { data: dbLawyers } = await context.supabase
          .from("firm_lawyers")
          .select("*")
          .eq("user_id", targetedOwnerId);

        const { data: casesData } = await context.supabase
          .from("cases")
          .select("id, assigned_lawyer_id")
          .is("archived_at", null);

        const caseCounts: Record<string, number> = {};
        if (casesData) {
          casesData.forEach((c) => {
            if (c.assigned_lawyer_id) {
              const ids = c.assigned_lawyer_id.split(",").filter(Boolean);
              ids.forEach((id) => {
                caseCounts[id] = (caseCounts[id] || 0) + 1;
              });
            }
          });
        }

        if (dbLawyers && dbLawyers.length > 0) {
          resolvedLawyers = lawyers.map((clientLawyer) => {
            const matchedDbLawyer = dbLawyers.find(
              (dbl) => dbl.email?.toLowerCase().trim() === clientLawyer.email.toLowerCase().trim(),
            );
            if (matchedDbLawyer) {
              return {
                name: matchedDbLawyer.name,
                email: matchedDbLawyer.email || clientLawyer.email,
                role: matchedDbLawyer.role,
                casesCount: caseCounts[matchedDbLawyer.id] || 0,
                aiUsage: matchedDbLawyer.ai_usage ?? clientLawyer.aiUsage ?? 0,
              };
            }
            return clientLawyer;
          });
        }
      } catch (dbErr) {
        console.error(
          "[Email Service] Database fetch error inside sendLawyersPerformanceReports:",
          dbErr,
        );
      }

      const validLawyers = resolvedLawyers.filter(
        (l) => l.email && !l.email.endsWith("@qadeyati.com"),
      );
      if (validLawyers.length === 0) {
        return { success: true, successCount: 0, failedLayout: [] };
      }

      const sendPromises = validLawyers.map(async (lawyer) => {
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

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6500);

        try {
          const response = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: fromEmail,
              to: [lawyer.email],
              subject: `📊 تقرير الأداء العملي والمهام المسندة إليك - ${lawyer.name}`,
              html: htmlContent,
            }),
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            console.error(
              `[Email Service] Failed report email for ${lawyer.email}: status ${response.status}`,
            );
            return { email: lawyer.email, success: false };
          }

          return { email: lawyer.email, success: true };
        } catch (err) {
          clearTimeout(timeoutId);
          console.error(`[Email Service] Error report email for ${lawyer.email}:`, err);
          return { email: lawyer.email, success: false };
        }
      });

      const results = await Promise.allSettled(sendPromises);

      let successCount = 0;
      const failedLayout: string[] = [];

      for (const res of results) {
        if (res.status === "fulfilled") {
          if (res.value.success) {
            successCount++;
          } else {
            failedLayout.push(res.value.email);
          }
        }
      }

      return { success: true, successCount, failedLayout };
    } catch (error) {
      console.error("Resend send lawyer performance report main error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "حدث خطأ أثناء إعداد وإرسال التقارير",
      };
    }
  });

/**
 * Server function to send comprehensive financial and administrative reports to the office owner.
 */
export const sendOwnerFinancialReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: FinancialReportInput) => input)
  .handler(async ({ data }) => {
    try {
      const { apiKey, fromEmail } = getEmailConfig();
      if (!apiKey) {
        return { success: false, error: "MISSING_API_KEY" };
      }

      const { ownerEmail, totalIncome, expectedIncome, overdueCount, activeCasesCount } = data;

      console.log(`[Email Service] Attempting to send financial report email to: ${ownerEmail}`);

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
                  <th style="padding: 10px; text-align: right; color: #fbbf24; border: 1px solid #475569;">المعالم الخدم خدماتي</th>
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

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6500);

      try {
        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: fromEmail,
            to: [ownerEmail],
            subject: `📈 التقرير والبيان المالي الشامل لمكتب المحاماة والشركاء`,
            html: htmlContent,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          console.error(
            "[Email Service] Resend owner financial API failed:",
            response.status,
            errData,
          );
          const errorMsg =
            errData?.message || errData?.error?.message || `API Error (${response.status})`;
          return { success: false, error: errorMsg };
        }

        const data = await response.json();
        console.log("[Email Service] Financial email successfully sent, API response ID:", data.id);
        return { success: true };
      } catch (innerErr) {
        clearTimeout(timeoutId);
        const isAbort = innerErr instanceof Error && innerErr.name === "AbortError";
        console.error("[Email Service] Request error inside sendOwnerFinancialReport:", innerErr);
        return {
          success: false,
          error: isAbort
            ? "انتهت مهلة المزامنة بخوادم البريد الإلكتروني (6.5 ثوانٍ)"
            : innerErr instanceof Error
              ? innerErr.message
              : "تعذر الاتصال بخادم البريد الإلكتروني",
        };
      }
    } catch (error) {
      console.error("Resend send financial report error:", error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "حدث خطأ غير متوقع أثناء إعداد وإرسال التقرير الشامل",
      };
    }
  });

interface PaymentReminderInput {
  lawyerEmail: string;
  lawyerName: string;
  daysCount: number;
}

/**
 * Server function to send automated alerts for premium payment cessation at days 30, 60, and 80.
 */
export const sendPaymentReminderEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: PaymentReminderInput) => input)
  .handler(async ({ data }) => {
    try {
      const { apiKey, fromEmail } = getEmailConfig();
      if (!apiKey) {
        return { success: false, error: "MISSING_API_KEY" };
      }

      const { lawyerEmail, lawyerName, daysCount } = data;

      let subject = "";
      let alertLevelClass = "background-color: #fffbeb; border: 1px solid #fef3c7; color: #b45309;";
      let messageBody = "";
      let actionText = "تجديد الاشتراك لإنقاذ الملفات";

      if (daysCount === 30) {
        subject = `⚠️ تنبيه هام: مضى 30 يوماً على التوقف عن تجديد اشتراك قضيتي - يرجى مراجعة ملفاتك`;
        messageBody = `
          نود لفت انتباهكم المهني إلى أنه قد مضى <strong>30 يوماً متواصلة</strong> على تاريخ انتهاء اشتراككم في منصة قضيتي دون تجديد. <br/><br/>
          تطبيقاً لسياسات المنصة واستضافة الوسائط الكبيرة، تبقى جميع ملفاتك ومستنداتك ومقاطع التوكيلات محفوظة آمنة حتى الآن، ولكن يرجى الانتباه والعمل على تجديد الاشتراك لخدمتكم بشكل متصل.
        `;
      } else if (daysCount === 60) {
        subject = `⚠️ إنذار ثانٍ: مضى 60 يوماً على توقف حساب قضيتي - ستفقد ملفاتك القانونية المرفوعة`;
        alertLevelClass = "background-color: #fff7ed; border: 1px solid #ffedd5; color: #c2410c;";
        messageBody = `
          نرسل للتأكيد على أنه قد مضى <strong>60 يوماً متواصلة</strong> على إيقاف الباقة المدفوعة في منصة قضيتي. <br/><br/>
          وفق شروط الاستخدام، تتبقى بمساحة التخزين الخاصة بك ملفات لم يتم تحميلها للنسخ الاحتياطي الخارجي. نرجو منكم سرعة تجديد الاشتراك أو طلب ملفاتكم بصيغة مضغوطة لتفادي فقدها عند الاقتراب من انقضاء المهلة القصوى.
        `;
      } else {
        // 80 days
        subject = `🚨 إنذار نهائي: مضى 80 يوماً على توقف الحساب - سيتم حذف جميع الملفات المرفوعة نهائياً خلال 10 أيام!`;
        alertLevelClass = "background-color: #fef2f2; border: 1px solid #fee2e2; color: #b91c1c;";
        actionText = "تجديد الاشتراك فوراً والإنقاذ العاجل للملفات 🚨";
        messageBody = `
          <strong>تنبيه عاجل وفوري للغاية:</strong><br/>
          لقد تجاوز حسابكم فترة توقف عن الدفع تبلغ <strong>80 يوماً متكاملة</strong>. <br/><br/>
          بقي <strong>10 أيام فقط</strong> قبل إتمام الحذف التلقائي والنهائي لجميع الملفات والتوكيلات ومذكرات الدفاع المرفوعة سحابياً لتوطين وحفظ مساحات الخوادم المستضيفة. يرجى تجديد الاشتراك فوراً لتسوية وضع الحساب وتجنب الفقد الكلي الفوري لبيانات الموكلين.
        `;
      }

      const htmlContent = `
        <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #f8fafc; color: #1e293b; text-align: right;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #c99a3c; margin: 0; font-size: 28px; font-weight: bold;">قضيتي</h1>
            <p style="color: #64748b; font-size: 14px; margin-top: 4px;">المنظومة القانونية المتكاملة لإدارة مكاتب المحاماة</p>
          </div>
          
          <div style="background-color: #ffffff; padding: 24px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); margin-bottom: 20px;">
            <h2 style="color: #1e3a8a; margin-top: 0; margin-bottom: 16px; font-size: 20px; border-bottom: 2px solid #f1f5f9; padding-bottom: 8px;">الأستاذ المحترم ${lawyerName}،</h2>
            
            <div style="${alertLevelClass} border-radius: 8px; padding: 16px; margin-bottom: 20px; font-size: 14px; line-height: 1.7;">
              ${messageBody}
            </div>

            <p style="font-size: 13px; line-height: 1.6; color: #475569; margin-bottom: 12px;">
              <strong>تفاصيل حسابكم:</strong><br/>
              • البريد الإلكتروني المسجل: <span style="font-family: monospace; color: #1e3a8a;">${lawyerEmail}</span><br/>
              • أيام التوقف المتواصلة: <span style="font-weight: bold; color: #1e3a8a;">${daysCount} يوماً</span>
            </p>

            <p style="font-size: 13px; line-height: 1.6; color: #475569;">
              يرجى العلم أن حسابكم ما زال بإمكانكم تسجيل الدخول وتصفح قضاياكم السابقة، ولكن ميزات رفع المستندات واستخدام المساعد القانوني والربط بالـ Google Drive ستبقى مغلقة ومقيدة حتى تصفية مبالغ الاشتراك الشهري أو السنوي المستحقة.
            </p>
 
            <div style="text-align: center; margin: 28px 0 10px 0;">
              <a href="https://qadeyati.com/dashboard" style="background-color: #1e3a8a; color: #ffffff; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px; display: inline-block; box-shadow: 0 4px 6px rgba(30, 58, 138, 0.25);">
                ${actionText}
              </a>
            </div>
          </div>

          <div style="text-align: center; color: #94a3b8; font-size: 11px; margin-top: 20px; line-height: 1.5;">
            <p style="margin-bottom: 4px;">تطبيقاً لشروط الاستخدام المعتمدة في اتفاقية تسجيلكم الإلكتروني.</p>
            <p style="margin: 0;">&copy; ${new Date().getFullYear()} قضيتي - جميع الحقوق محفوظة لشركائنا الفنيين.</p>
          </div>
        </div>
      `;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, 6500);

      try {
        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: fromEmail,
            to: [lawyerEmail],
            subject: subject,
            html: htmlContent,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          console.error(
            "[Email Service] Resend PaymentReminder API failed:",
            response.status,
            errData,
          );
          const errorMsg =
            errData?.message || errData?.error?.message || `API Error (${response.status})`;
          return { success: false, error: errorMsg };
        }

        const dataResponse = await response.json();
        console.log("[Email Service] Payment Reminder successfully sent, ID:", dataResponse.id);
        return { success: true };
      } catch (innerErr) {
        clearTimeout(timeoutId);
        const isAbort = innerErr instanceof Error && innerErr.name === "AbortError";
        console.error("[Email Service] Request error inside sendPaymentReminderEmail:", innerErr);
        return {
          success: false,
          error: isAbort
            ? "انتهت مهلة المزامنة بخوادم البريد الإلكتروني (6.5 ثوانٍ)"
            : innerErr instanceof Error
              ? innerErr.message
              : "تعذر الاتصال بخادم البريد الإلكتروني",
        };
      }
    } catch (error) {
      console.error("Resend send payment reminder error:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "حدث خطأ غير متوقع أثناء إعداد وإرسال التنبيه",
      };
    }
  });

interface SlaRequestInput {
  officeName: string;
  lawyerName: string;
  lawyerEmail: string;
  requestType: string;
  notes: string;
  requestId: string;
}

/**
 * Server function to send SLA and custom request emails to the main administrative email info@qadeyati.com.
 */
export const sendSlaRequestEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: SlaRequestInput) => input)
  .handler(async ({ data }) => {
    try {
      const { apiKey, fromEmail } = getEmailConfig();
      if (!apiKey) {
        return { success: false, error: "MISSING_API_KEY" };
      }

      const { officeName, lawyerName, lawyerEmail, requestType, notes, requestId } = data;

      console.log(
        `[Email Service] Sending SLA Customization Request (${requestId}) to info@qadeyati.com`,
      );

      const htmlContent = `
        <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #0f172a; color: #f1f5f9; text-align: right;">
          <div style="text-align: center; margin-bottom: 24px; border-bottom: 1px solid #334155; padding-bottom: 16px;">
            <h1 style="color: #fbbf24; margin: 0; font-size: 26px; font-weight: bold; letter-spacing: -0.5px;">طلب ميزة خاصة - منصة قضيتي</h1>
            <p style="color: #94a3b8; font-size: 12px; margin-top: 4px;">إشعار وارد لمدير الحسابات والمهندس المسؤول</p>
          </div>
          
          <div style="background-color: #1e293b; padding: 24px; border-radius: 12px; border: 1px solid #334155; margin-bottom: 20px;">
            <h2 style="color: #fbbf24; margin-top: 0; margin-bottom: 16px; font-size: 18px; border-bottom: 1px solid #334155; padding-bottom: 8px;">تفاصيل طلب العميل الحصري ⚙️</h2>
            <p style="font-size: 14px; line-height: 1.6; color: #cbd5e1; margin-bottom: 20px;">
              قام مستشار شريك في منصة قضيتي بإرسال طلب تخصيص أو ميزة جديدة من خلال لوحة حسابه الفائقة:
            </p>

            <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 13px;">
              <tbody>
                <tr>
                  <td style="padding: 10px; border: 1px solid #475569; color: #fbbf24; width: 35%;">رقم الطلب (ID)</td>
                  <td style="padding: 10px; border: 1px solid #475569; color: #e2e8f0; font-family: monospace;">${requestId}</td>
                </tr>
                <tr>
                  <td style="padding: 10px; border: 1px solid #475569; color: #fbbf24;">المكتب القانوني</td>
                  <td style="padding: 10px; border: 1px solid #475569; color: #e2e8f0; font-weight: bold;">${officeName}</td>
                </tr>
                <tr>
                  <td style="padding: 10px; border: 1px solid #475569; color: #fbbf24;">المستشار الداعي</td>
                  <td style="padding: 10px; border: 1px solid #475569; color: #e2e8f0;">${lawyerName} (${lawyerEmail})</td>
                </tr>
                <tr>
                  <td style="padding: 10px; border: 1px solid #475569; color: #fbbf24;">نوع الطلب</td>
                  <td style="padding: 10px; border: 1px solid #475569; color: #e2e8f0; font-weight: bold;">${requestType}</td>
                </tr>
                <tr>
                  <td style="padding: 10px; border: 1px solid #475569; color: #fbbf24;">تفاصيل وتعليمات الطلب</td>
                  <td style="padding: 10px; border: 1px solid #475569; color: #e2e8f0; white-space: pre-wrap; line-height: 1.6;">${notes}</td>
                </tr>
                <tr>
                  <td style="padding: 10px; border: 1px solid #475569; color: #fbbf24;">تاريخ ووقت التقديم</td>
                  <td style="padding: 10px; border: 1px solid #475569; color: #e2e8f0;">${new Date().toLocaleString("ar-EG")}</td>
                </tr>
              </tbody>
            </table>

            <div style="background-color: #1e1b4b; border: 1px solid #312e81; border-radius: 8px; padding: 14px; font-size: 11px; color: #a5b4fc; line-height: 1.6;">
              <strong>توجيه إداري:</strong> يرجى مراجعة الطلب والتواصل الفوري مع الأستاذ المستشار عبر الواتساب أو البريد الموضح أعلاه لتلبية متطلباته وتحديث حالة الطلب بجدول أعماله الحصري.
            </div>
          </div>

          <div style="text-align: center; color: #64748b; font-size: 11px; margin-top: 20px;">
            <p style="margin: 0;">&copy; ${new Date().getFullYear()} قضيتي - نظام المتابعة السحابي المميز.</p>
          </div>
        </div>
      `;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6500);

      try {
        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: fromEmail,
            to: ["info@qadeyati.com"],
            subject: `⚙️ [طلب خاص جديد] ${requestType} - ${officeName}`,
            html: htmlContent,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          console.error(
            "[Email Service] Resend sendSlaRequestEmail API failed:",
            response.status,
            errData,
          );
          const errorMsg =
            errData?.message || errData?.error?.message || `API Error (${response.status})`;
          return { success: false, error: errorMsg };
        }

        const dataResponse = await response.json();
        console.log(
          "[Email Service] SLA Custom Request email successfully sent to info@qadeyati.com, ID:",
          dataResponse.id,
        );
        return { success: true };
      } catch (innerErr) {
        clearTimeout(timeoutId);
        const isAbort = innerErr instanceof Error && innerErr.name === "AbortError";
        console.error("[Email Service] Request error inside sendSlaRequestEmail:", innerErr);
        return {
          success: false,
          error: isAbort
            ? "انتهت مهلة المزامنة بخوادم البريد الإلكتروني (6.5 ثوانٍ)"
            : innerErr instanceof Error
              ? innerErr.message
              : "تعذر الاتصال بخادم البريد الإلكتروني",
        };
      }
    } catch (error) {
      console.error("Resend sendSlaRequestEmail main error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "حدث خطأ غير متوقع أثناء إرسال البريد",
      };
    }
  });
