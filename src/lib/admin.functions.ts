import { createServerFn } from "@tanstack/react-start";
import { type User } from "@supabase/supabase-js";
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
      // Search for public schema profile / auth user to locate user ID page-by-page
      let targetUser = null;
      let page = 1;
      const perPage = 100;
      let hasMore = true;

      while (hasMore) {
        const { data: listData, error: listError } = await supabaseAdmin.auth.admin.listUsers({
          page,
          perPage,
        });

        if (listError) {
          throw new Error(listError.message);
        }

        if (!listData?.users || listData.users.length === 0) {
          break;
        }

        const match = listData.users.find(
          (u) => u.email?.toLowerCase().trim() === targetEmail.toLowerCase().trim(),
        );

        if (match) {
          targetUser = match;
          break;
        }

        page++;
        hasMore = listData.users.length === perPage;
      }

      let activatedUserId: string | null = null;

      if (!targetUser) {
        // If user doesn't exist, we will PRE-CREATE the user account in Supabase directly!
        console.log(`[Admin pre-activation] Pre-creating account in database for ${targetEmail}`);
        const tempPassword = "QadeytiPrePaidTempPW!" + Math.random().toString(36).substring(2, 7);
        const { data: createData, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email: targetEmail.toLowerCase().trim(),
          password: tempPassword,
          email_confirm: true, // Auto-confirm email so they don't get blocked
          user_metadata: {
            qadeyti_plan: targetPlan,
            qadeyti_subscription_unpaid: false,
            qadeyti_subscription_expiry: expiryDate.toISOString(),
            qadeyti_subscription_activation: activationDate,
            qadeyti_pre_activated: true, // Marked to be claimed during signup
          },
        });

        if (createError) {
          throw new Error(`تعذر إنشاء الحساب المسبق للتفعيل: ${createError.message}`);
        }
        fallbackMessage = " [تم إنشاء حساب مسبق الدفع وتفعيله!]";
        if (createData?.user) {
          activatedUserId = createData.user.id;
        }
      } else {
        // Apply metadata changes bypass using admin client for existing user
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
          targetUser.id,
          {
            user_metadata: {
              qadeyti_plan: targetPlan,
              qadeyti_subscription_unpaid: false,
              qadeyti_subscription_expiry: expiryDate.toISOString(),
              qadeyti_subscription_activation: activationDate,
              qadeyti_pre_activated: false, // Turn off pre-activated flag if it was ever active
            },
          },
        );

        if (updateError) {
          throw new Error(updateError.message);
        }
        activatedUserId = targetUser.id;
      }

      // Propagate the subscription details to active public.lawyer_profiles table (instantly visible on client dashboard!)
      if (activatedUserId) {
        try {
          const { data: profileCheck } = await supabaseAdmin
            .from("lawyer_profiles")
            .select("id")
            .eq("user_id", activatedUserId)
            .maybeSingle();

          if (profileCheck) {
            await supabaseAdmin
              .from("lawyer_profiles")
              .update({
                subscription_plan: targetPlan,
                subscription_unpaid: false,
                subscription_expiry: expiryDate.toISOString(),
                subscription_activation: activationDate,
                email: targetEmail.toLowerCase().trim(),
              })
              .eq("user_id", activatedUserId);
          } else {
            await supabaseAdmin.from("lawyer_profiles").insert({
              user_id: activatedUserId,
              slug: `lawyer-${activatedUserId.slice(0, 8)}`,
              full_name: targetEmail.split("@")[0],
              subscription_plan: targetPlan,
              subscription_unpaid: false,
              subscription_expiry: expiryDate.toISOString(),
              subscription_activation: activationDate,
              email: targetEmail.toLowerCase().trim(),
            });
          }
          console.log(
            `[Admin Profile Sync] Successfully synchronized subscription for user ID: ${activatedUserId}`,
          );
        } catch (profileErr) {
          console.warn(
            "[Admin Sync] Failed saving to lawyer_profiles table, continuing with auth metadata:",
            profileErr,
          );
        }
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

export const adminSearchUsers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { query: string }) => input)
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

    const { query } = data;
    const cleanQuery = query.toLowerCase().trim();

    // 1. Fetch lawyer profiles from database
    const { data: profiles, error: pError } = await supabaseAdmin
      .from("lawyer_profiles")
      .select(
        "user_id, email, full_name, subscription_plan, subscription_expiry, subscription_activation, whatsapp, created_at",
      )
      .order("created_at", { ascending: false });

    if (pError) {
      console.warn("Error fetching profiles:", pError);
    }

    // 2. Fetch auth users from Auth Admin API to match, since some users might not have profiles
    const allAuthUsers: User[] = [];
    try {
      let page = 1;
      const perPage = 100;
      let hasMore = true;

      while (hasMore) {
        const { data: listData, error: listError } = await supabaseAdmin.auth.admin.listUsers({
          page,
          perPage,
        });

        if (listError) {
          throw new Error(listError.message);
        }

        if (!listData?.users || listData.users.length === 0) {
          break;
        }

        allAuthUsers.push(...listData.users);
        page++;
        hasMore = listData.users.length === perPage && page <= 5; // Fetch up to 500 users
      }
    } catch (authErr) {
      console.warn("Error listing auth users:", authErr);
    }

    // Combine them!
    const unifiedAccountsMap = new Map<
      string,
      {
        userId: string;
        email: string;
        fullName: string;
        plan: string;
        expiry: string | null;
        activation: string | null;
        whatsapp: string | null;
        createdAt: string;
        source: "profile" | "auth" | "both";
      }
    >();

    // Populate with Auth Users
    for (const u of allAuthUsers) {
      const emailVal = u.email || "";
      const planVal = u.user_metadata?.qadeyti_plan || "free";
      const expiryVal = u.user_metadata?.qadeyti_subscription_expiry || null;
      const activationVal = u.user_metadata?.qadeyti_subscription_activation || null;

      unifiedAccountsMap.set(u.id, {
        userId: u.id,
        email: emailVal,
        fullName: u.user_metadata?.full_name || emailVal.split("@")[0] || "مستخدم جديد",
        plan: planVal,
        expiry: expiryVal,
        activation: activationVal,
        whatsapp: u.user_metadata?.whatsapp || null,
        createdAt: u.created_at || new Date().toISOString(),
        source: "auth",
      });
    }

    // Complement with profiles
    if (profiles) {
      for (const p of profiles) {
        const existing = unifiedAccountsMap.get(p.user_id);
        if (existing) {
          existing.email = p.email || existing.email || "";
          existing.fullName = p.full_name || existing.fullName;
          existing.plan = p.subscription_plan || existing.plan;
          existing.expiry = p.subscription_expiry || existing.expiry;
          existing.activation = p.subscription_activation || existing.activation;
          existing.whatsapp = p.whatsapp || existing.whatsapp;
          existing.createdAt = p.created_at || existing.createdAt;
          existing.source = "both";
        } else {
          unifiedAccountsMap.set(p.user_id, {
            userId: p.user_id,
            email: p.email || "",
            fullName: p.full_name || "محامي غير معروف",
            plan: p.subscription_plan || "free",
            expiry: p.subscription_expiry || null,
            activation: p.subscription_activation || null,
            whatsapp: p.whatsapp || null,
            createdAt: p.created_at || new Date().toISOString(),
            source: "profile",
          });
        }
      }
    }

    const allRecords = Array.from(unifiedAccountsMap.values());

    // Sort by created date descending (newest users first)
    allRecords.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Filter by query if query is provided
    let filteredRecords = allRecords;
    if (cleanQuery) {
      filteredRecords = allRecords.filter((rec) => {
        return (
          rec.email.toLowerCase().includes(cleanQuery) ||
          rec.fullName.toLowerCase().includes(cleanQuery) ||
          (rec.whatsapp && rec.whatsapp.toLowerCase().includes(cleanQuery)) ||
          rec.userId.toLowerCase().includes(cleanQuery)
        );
      });
    }

    return {
      success: true,
      users: filteredRecords,
    };
  });
