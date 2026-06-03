import { createServerFn } from "@tanstack/react-start";

export interface LocalActivation {
  email: string;
  plan: string;
  activationDate: string;
  expiryDate: string;
}

// Browser-safe dynamic Node fs/path helper
export async function getFS() {
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

export const ACTIVATIONS_FILE_NAME = "supabase_activations_fallback.json";

export async function readLocalActivations(): Promise<LocalActivation[]> {
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

export async function writeLocalActivation(activation: LocalActivation): Promise<void> {
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

export const checkActivationForUser = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => {
    if (typeof input === "string") return input;
    if (input && typeof input === "object" && "data" in input) {
      const innerData = (input as { data?: unknown }).data;
      if (innerData && typeof innerData === "object" && "email" in innerData) {
        return String((innerData as { email?: unknown }).email || "");
      }
      return String(innerData || "");
    }
    return String(input || "");
  })
  .handler(async ({ data: email }) => {
    const emailStr = String(email || "")
      .toLowerCase()
      .trim();
    if (!emailStr) return null;

    // 1. Try checking the central database (Supabase Auth) first for real-time accuracy!
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const {
        data: { users },
        error: listError,
      } = await supabaseAdmin.auth.admin.listUsers();
      if (!listError && users) {
        const foundUser = users.find((u) => u.email?.toLowerCase().trim() === emailStr);
        if (foundUser && foundUser.user_metadata?.qadeyti_plan) {
          const expiryStr = foundUser.user_metadata.qadeyti_subscription_expiry;
          const hasExpired = expiryStr ? new Date(expiryStr) <= new Date() : false;
          if (!hasExpired) {
            return {
              email: emailStr,
              plan: foundUser.user_metadata.qadeyti_plan,
              activationDate:
                foundUser.user_metadata.qadeyti_subscription_activation || new Date().toISOString(),
              expiryDate:
                expiryStr || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            };
          }
        }
      }
    } catch (dbErr) {
      console.error("Failed querying Supabase Auth in checkActivationForUser:", dbErr);
    }

    // 2. Fallback to local server file-based activations backup
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

interface PreActivatedSignupInput {
  email: string;
  password?: string;
}

export const completePreActivatedSignup = createServerFn({ method: "POST" })
  .inputValidator((input: unknown): PreActivatedSignupInput => {
    if (input && typeof input === "object") {
      const obj = input as Record<string, unknown>;
      return {
        email: String(obj.email || ""),
        password: String(obj.password || ""),
      };
    }
    return { email: "" };
  })
  .handler(async ({ data }) => {
    const { email, password } = data;
    if (!email || !password) {
      return { success: false, reason: "البريد الإلكتروني أو كلمة المرور غير صالحة." };
    }

    const emailStr = email.toLowerCase().trim();

    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const {
        data: { users },
        error: listError,
      } = await supabaseAdmin.auth.admin.listUsers();

      if (listError) {
        throw new Error(listError.message);
      }

      const foundUser = users.find((u) => u.email?.toLowerCase().trim() === emailStr);

      // Check if user exists and is specially marked as pre_activated from Admin
      if (foundUser && foundUser.user_metadata?.qadeyti_pre_activated === true) {
        // Claim the account: update password and mark as claimed
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(foundUser.id, {
          password: password,
          user_metadata: {
            ...foundUser.user_metadata,
            qadeyti_pre_activated: false, // Mark it claimed
          },
        });

        if (updateError) {
          throw new Error(updateError.message);
        }

        console.log(
          `[Signup Sync] Pre-activated user ${emailStr} successfully claimed their paid account!`,
        );
        return { success: true };
      }
    } catch (err: unknown) {
      console.error("Failed executing completePreActivatedSignup server function:", err);
    }

    return { success: false, reason: "غير مسجل كحساب مسبق الدفع مسبقاً." };
  });
