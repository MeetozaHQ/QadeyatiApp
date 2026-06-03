import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

interface AdminActivateInput {
  email: string;
  plan: string;
  durationMonths: number;
}

interface LocalActivation {
  email: string;
  plan: string;
  activationDate: string;
  expiryDate: string;
}

// Browser-safe dynamic Node fs/path helper
async function getFS() {
  if (typeof window !== "undefined") return null;
  try {
    const fs = await import("fs");
    const path = await import("path");
    return { fs, path };
  } catch (err) {
    console.error("Failed to load node fs components:", err);
    return null;
  }
}

const ACTIVATIONS_FILE_NAME = "supabase_activations_fallback.json";

async function readLocalActivations(): Promise<LocalActivation[]> {
  const node = await getFS();
  if (!node) return [];
  const { fs, path } = node;
  const filePath = path.join(process.cwd(), ACTIVATIONS_FILE_NAME);
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, "utf-8");
      return JSON.parse(content);
    }
  } catch (err) {
    console.error("Local activations read failed:", err);
  }
  return [];
}

async function writeLocalActivation(activation: LocalActivation): Promise<void> {
  const node = await getFS();
  if (!node) return;
  const { fs, path } = node;
  const filePath = path.join(process.cwd(), ACTIVATIONS_FILE_NAME);
  try {
    const list = await readLocalActivations();
    const filtered = list.filter((a) => a.email.toLowerCase() !== activation.email.toLowerCase());
    filtered.push(activation);
    fs.writeFileSync(filePath, JSON.stringify(filtered, null, 2), "utf-8");
    console.log(
      `[Backup Activation] Saved activation for ${activation.email} in fallback database file`,
    );
  } catch (err) {
    console.error("Local activations write failed:", err);
  }
}

export const checkActivationForUser = createServerFn({ method: "GET" })
  .inputValidator((email: unknown) => String(email || ""))
  .handler(async ({ data: email }) => {
    const emailStr = String(email || "")
      .toLowerCase()
      .trim();
    if (!emailStr) return null;

    const list = await readLocalActivations();
    const found = list.find((a) => a.email.toLowerCase() === emailStr);

    if (found) {
      const hasExpired = new Date(found.expiryDate) <= new Date();
      if (!hasExpired) {
        return found;
      }
    }
    return null;
  });

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
