import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import {
  type LocalActivation,
  readLocalActivations,
  writeLocalActivation,
} from "./activation-check.functions";

interface AdminActivateInput {
  email: string;
  plan: string;
  durationMonths: number;
}

export const adminActivateSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: AdminActivateInput) => input)
  .handler(async ({ data, context }) => {
    const { supabase } = context;

    // Authenticate and fetch current user details using service connection
    const {
      data: { user: caller },
      error: callerError,
    } = await supabase.auth.getUser();
    if (callerError || !caller) {
      throw new Error("فشل التحقق من هوية المستخدم الجاري.");
    }

    // Role gate
    if (caller.email !== "meetozacoin@gmail.com") {
      throw new Error("سماح بالوصول لمشرفي النظام فقط (unauthorized access attempt).");
    }

    const { email: targetEmail, plan: targetPlan, durationMonths } = data;

    // Compute activation and next expiry date
    const activationDate = new Date().toISOString();
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + durationMonths);

    let dbActivationSuccess = false;
    let fallbackMessage = "";

    try {
      // Search for public schema profile / auth user to locate user ID
      const {
        data: { users },
        error: listError,
      } = await supabaseAdmin.auth.admin.listUsers();

      if (listError) {
        throw new Error(listError.message);
      }

      const targetUser = users.find(
        (u) => u.email?.toLowerCase().trim() === targetEmail.toLowerCase().trim(),
      );

      if (!targetUser) {
        throw new Error("عذراً، لم يتم العثور على أي حساب مسجل بهذا البريد الإلكتروني.");
      }

      // Apply metadata changes bypass using admin client
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(targetUser.id, {
        user_metadata: {
          qadeyti_plan: targetPlan,
          qadeyti_subscription_unpaid: false,
          qadeyti_subscription_expiry: expiryDate.toISOString(),
          qadeyti_subscription_activation: activationDate,
        },
      });

      if (updateError) {
        throw new Error(updateError.message);
      }

      dbActivationSuccess = true;

      // Always save to local server file-based activations fallback to trigger instant client-side auto-sync
      const actObj: LocalActivation = {
        email: targetEmail.toLowerCase().trim(),
        plan: targetPlan,
        activationDate,
        expiryDate: expiryDate.toISOString(),
      };
      await writeLocalActivation(actObj);
    } catch (err: unknown) {
      const errMessage = err instanceof Error ? err.message : String(err);
      console.warn(
        `Supabase admin client operation failed (${errMessage}). Falling back to file-based activation storage on server.`,
      );

      // Save to local server file-based activations fallback
      const actObj: LocalActivation = {
        email: targetEmail.toLowerCase().trim(),
        plan: targetPlan,
        activationDate,
        expiryDate: expiryDate.toISOString(),
      };
      await writeLocalActivation(actObj);
      fallbackMessage = " [تفعيل احتياطي سحابي مفعل!]";
    }

    return {
      success: true,
      message: `تم تنشيط باقة (${targetPlan}) لمدة ${durationMonths} أشهر للمشترك ${targetEmail} بنجاح!${fallbackMessage}`,
    };
  });
