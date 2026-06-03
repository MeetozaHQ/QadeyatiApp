import { useAuth } from "@/lib/auth-context";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export type QadeytiPlan = "free" | "basic" | "pro" | "enterprise";

export interface PlanLimits {
  label: string;
  maxCases: number;
  maxAIChats: number;
  hasGoogleDrive: boolean;
  googleDriveMode: "none" | "basic" | "full";
  hasFinancials: boolean;
  hasNotifications: boolean;
  hasDeepAIAnalysis: boolean;
  hasOwnerDashboard: boolean;
}

export const PLAN_LIMITS: Record<QadeytiPlan, PlanLimits> = {
  free: {
    label: "الباقة المجانية",
    maxCases: 2,
    maxAIChats: 5,
    hasGoogleDrive: false,
    googleDriveMode: "none",
    hasFinancials: false,
    hasNotifications: false,
    hasDeepAIAnalysis: false,
    hasOwnerDashboard: false,
  },
  basic: {
    label: "الباقة الفردية للـمُحامي",
    maxCases: 50,
    maxAIChats: 100,
    hasGoogleDrive: true,
    googleDriveMode: "basic",
    hasFinancials: true,
    hasNotifications: true,
    hasDeepAIAnalysis: false,
    hasOwnerDashboard: false,
  },
  pro: {
    label: "باقة المحامي المحترف",
    maxCases: Infinity,
    maxAIChats: 600,
    hasGoogleDrive: true,
    googleDriveMode: "full",
    hasFinancials: true,
    hasNotifications: true,
    hasDeepAIAnalysis: true,
    hasOwnerDashboard: false,
  },
  enterprise: {
    label: "باقة المكاتب والشركات القانونية",
    maxCases: Infinity,
    maxAIChats: 600,
    hasGoogleDrive: true,
    googleDriveMode: "full",
    hasFinancials: true,
    hasNotifications: true,
    hasDeepAIAnalysis: true,
    hasOwnerDashboard: true,
  },
};

export interface FirmLawyer {
  id: string;
  name: string;
  email: string;
  role: string;
  status: "active" | "offline";
  casesCount: number;
  docsCount: number;
  aiUsage: number;
  avatarLetter: string;
}

export const DEFAULT_FIRM_LAWYERS: FirmLawyer[] = [];

const safeStorage = {
  getItem: (key: string): string | null => {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        return window.localStorage.getItem(key);
      }
    } catch (e) {
      console.warn(`[SafeStorage] Failed to read ${key}:`, e);
    }
    return null;
  },
  setItem: (key: string, value: string): void => {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem(key, value);
      }
    } catch (e) {
      console.warn(`[SafeStorage] Failed to set ${key}:`, e);
    }
  },
  removeItem: (key: string): void => {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.removeItem(key);
      }
    } catch (e) {
      console.warn(`[SafeStorage] Failed to remove ${key}:`, e);
    }
  },
};

// In-Memory Global Subscription Hub to prevent any disappearing state lag across pages
let globalFirmLawyers: FirmLawyer[] | null = null;
const globalListeners = new Set<(lawyers: FirmLawyer[]) => void>();

function updateGlobalLawyers(next: FirmLawyer[]) {
  globalFirmLawyers = next;
  safeStorage.setItem("qadeyti_firm_lawyers", JSON.stringify(next));
  globalListeners.forEach((listener) => {
    try {
      listener(next);
    } catch (e) {
      console.error(e);
    }
  });
}

export function useTrial() {
  const { user } = useAuth();
  const [plan, setPlanState] = useState<QadeytiPlan>(() => {
    const storedPlan = safeStorage.getItem("qadeyti_plan") as QadeytiPlan;
    if (storedPlan && PLAN_LIMITS[storedPlan]) {
      return storedPlan;
    }
    const isPremiumOld = safeStorage.getItem("qadeyti_premium") === "true";
    if (isPremiumOld) return "pro";
    return "free";
  });
  const [aiCount, setAiCount] = useState<number>(0);

  const [isSubscriptionUnpaid, setIsSubscriptionUnpaidState] = useState<boolean>(() => {
    return safeStorage.getItem("qadeyti_subscription_unpaid") === "true";
  });

  // Impersonation Simulator State
  const [simulatedLawyerId, setSimulatedLawyerId] = useState<string>(() => {
    return safeStorage.getItem("qadeyti_simulated_lawyer_id") || "owner";
  });

  const [ownerId, setOwnerId] = useState<string>(() => {
    return user?.id || "owner";
  });

  const [firmLawyers, setFirmLawyersState] = useState<FirmLawyer[]>(() => {
    if (globalFirmLawyers) {
      return globalFirmLawyers;
    }
    const stored = safeStorage.getItem("qadeyti_firm_lawyers");
    let parsed: FirmLawyer[] = [];
    if (stored) {
      try {
        parsed = JSON.parse(stored);
      } catch {
        parsed = [...DEFAULT_FIRM_LAWYERS];
      }
    } else {
      parsed = [...DEFAULT_FIRM_LAWYERS];
    }

    // Sync monthly usage for each lawyer on initial load
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    let changed = false;

    const synced = parsed.map((lawyer) => {
      const key = `ai_usage_lawyer_${lawyer.id}`;
      const raw = safeStorage.getItem(key);
      let usage = lawyer.aiUsage;
      if (raw) {
        try {
          const data = JSON.parse(raw);
          if (data.month !== currentMonth) {
            usage = 0;
            safeStorage.setItem(key, JSON.stringify({ month: currentMonth, count: 0 }));
            changed = true;
          } else {
            if (usage !== data.count) {
              usage = data.count;
              changed = true;
            }
          }
        } catch {
          usage = 0;
        }
      } else {
        const defaultCount =
          lawyer.id === "1" ? 34 : lawyer.id === "2" ? 12 : lawyer.id === "3" ? 8 : 0;
        safeStorage.setItem(key, JSON.stringify({ month: currentMonth, count: defaultCount }));
        usage = defaultCount;
        changed = true;
      }

      // Maintain emails for defaults if they got deleted or lost
      let email = lawyer.email;
      if (!email) {
        if (lawyer.id === "1") email = "nour.ali@qadeyati.com";
        else if (lawyer.id === "2") email = "fatima.zahra@qadeyati.com";
        else if (lawyer.id === "3") email = "ahmed.shazly@qadeyati.com";
        else email = `${lawyer.id}@qadeyati.com`;
        changed = true;
      }

      return { ...lawyer, aiUsage: usage, email };
    });

    globalFirmLawyers = synced;
    if (changed) {
      safeStorage.setItem("qadeyti_firm_lawyers", JSON.stringify(synced));
    }
    return synced;
  });

  useEffect(() => {
    // Subscribe to global in-memory pub-sub registry changes - guarantees instant page synchronization
    const handleGlobalUpdate = (nextArray: FirmLawyer[]) => {
      setFirmLawyersState(nextArray);
    };
    globalListeners.add(handleGlobalUpdate);

    return () => {
      globalListeners.delete(handleGlobalUpdate);
    };
  }, []);

  // Load and sync lawyers from Supabase when user is logged in
  useEffect(() => {
    if (!user) return;

    let isSubscribed = true;

    const fetchAndSync = async () => {
      try {
        // Resolve the firm owner ID in case this authenticated user is an invited lawyer
        let targetedOwnerId = user.id;
        try {
          const { data: matchedAsLawyer } = await supabase
            .from("firm_lawyers")
            .select("user_id")
            .ilike("email", user.email.trim())
            .maybeSingle();

          if (matchedAsLawyer?.user_id) {
            targetedOwnerId = matchedAsLawyer.user_id;
          }
        } catch (authLookUpErr) {
          console.warn("Could not execute firm lawyers owner lookup:", authLookUpErr);
        }

        if (isSubscribed) {
          setOwnerId(targetedOwnerId);
        }

        const { data, error } = await supabase
          .from("firm_lawyers")
          .select("*")
          .eq("user_id", targetedOwnerId);

        if (error) {
          console.error("Supabase load errors for firm lawyers:", error);
          return;
        }

        if (data && data.length > 0) {
          // Fetch case list to count real assignments in real time!
          const { data: casesData } = await supabase
            .from("cases")
            .select("id, assigned_lawyer_id")
            .is("archived_at", null);

          // Fetch all case attachments to count documents per lawyer in real time!
          const { data: attachmentsData } = await supabase
            .from("case_attachments")
            .select("id, case_id");

          const caseCounts: Record<string, number> = {};
          const caseToLawyersMap = new Map<string, string[]>();
          if (casesData) {
            casesData.forEach((c) => {
              if (c.assigned_lawyer_id) {
                const ids = c.assigned_lawyer_id.split(",").filter(Boolean);
                caseToLawyersMap.set(c.id, ids);
                ids.forEach((id) => {
                  caseCounts[id] = (caseCounts[id] || 0) + 1;
                });
              }
            });
          }

          const docCounts: Record<string, number> = {};
          if (attachmentsData) {
            attachmentsData.forEach((att) => {
              const lawyerIds = caseToLawyersMap.get(att.case_id);
              if (lawyerIds) {
                lawyerIds.forEach((id) => {
                  docCounts[id] = (docCounts[id] || 0) + 1;
                });
              }
            });
          }

          const mapped: FirmLawyer[] = data.map((l) => ({
            id: l.id,
            name: l.name,
            email: l.email || "",
            role: l.role,
            status: l.status as "active" | "offline",
            casesCount: caseCounts[l.id] || 0,
            docsCount: docCounts[l.id] || 0,
            aiUsage: l.ai_usage,
            avatarLetter: l.avatar_letter || l.name.replace("أ.", "").trim()[0] || "م",
          }));

          if (isSubscribed) {
            setFirmLawyersState(mapped);
            updateGlobalLawyers(mapped);
          }
        } else {
          // Empty DB indicates no registered firm lawyers for this user
          if (isSubscribed) {
            setFirmLawyersState([]);
            updateGlobalLawyers([]);
          }
        }
      } catch (e) {
        console.error("Failed in fetchAndSync:", e);
      }
    };

    fetchAndSync();

    // Setup Supabase Real-time Channel Subscriptions with a unique channel name for instant synchronization across devices
    const uniqueChannelName = `firm_lawyers_and_cases_realtime_${Math.random().toString(36).substring(2, 9)}`;
    const channel = supabase
      .channel(uniqueChannelName)
      .on("postgres_changes", { event: "*", schema: "public", table: "firm_lawyers" }, () => {
        if (isSubscribed) {
          fetchAndSync();
        }
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "cases" }, () => {
        if (isSubscribed) {
          fetchAndSync();
        }
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "case_attachments" }, () => {
        if (isSubscribed) {
          fetchAndSync();
        }
      })
      .subscribe();

    return () => {
      isSubscribed = false;
      supabase.removeChannel(channel);
    };
  }, [user]);

  const addFirmLawyer = async (name: string, email: string, role: string) => {
    const formattedName = name.startsWith("أ.") ? name : `أ. ${name}`;
    const avatar = name.replace("أ.", "").trim()[0] || "م";
    const tempId = String(Date.now());
    const normalizedEmail = email ? email.trim().toLowerCase() : `${tempId}@qadeyati.com`;

    const newLawyer: FirmLawyer = {
      id: tempId,
      name: formattedName,
      email: normalizedEmail,
      role: role || "محامٍ مشارك",
      status: "active",
      casesCount: 0,
      docsCount: 0,
      aiUsage: 0,
      avatarLetter: avatar,
    };

    // Smooth optimistic UI update
    const next = [...firmLawyers, newLawyer];
    setFirmLawyersState(next);
    updateGlobalLawyers(next);

    if (user) {
      try {
        const { data, error } = await supabase
          .from("firm_lawyers")
          .insert({
            user_id: user.id,
            name: formattedName,
            email: normalizedEmail,
            role: role || "محامٍ مشارك",
            status: "active",
            avatar_letter: avatar,
            ai_usage: 0,
          })
          .select()
          .single();

        if (error) {
          console.error("Error adding lawyer to Supabase:", error);
          // Revert optimistic UI update
          const rollbacked = firmLawyers.filter((l) => l.id !== tempId);
          setFirmLawyersState(rollbacked);
          updateGlobalLawyers(rollbacked);
          throw new Error(`خطأ قاعدة البيانات: ${error.message || JSON.stringify(error)}`);
        } else if (data) {
          const realLawyer: FirmLawyer = {
            id: data.id,
            name: data.name,
            email: data.email || "",
            role: data.role,
            status: data.status as "active" | "offline",
            casesCount: 0,
            docsCount: 0,
            aiUsage: data.ai_usage,
            avatarLetter: data.avatar_letter || avatar,
          };
          const finalArray = next.map((l) => (l.id === tempId ? realLawyer : l));
          setFirmLawyersState(finalArray);
          updateGlobalLawyers(finalArray);
        }
      } catch (err) {
        console.error("Exception adding firm lawyer:", err);
        // Revert optimistic UI update if we haven't already
        const rollbacked = firmLawyers.filter((l) => l.id !== tempId);
        setFirmLawyersState(rollbacked);
        updateGlobalLawyers(rollbacked);
        throw err;
      }
    } else {
      const now = new Date();
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      safeStorage.setItem(
        `ai_usage_lawyer_${tempId}`,
        JSON.stringify({ month: currentMonth, count: 0 }),
      );
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("storage"));
      }
    }
  };

  const deleteFirmLawyer = async (id: string) => {
    const next = firmLawyers.filter((l) => l.id !== id);
    setFirmLawyersState(next);
    updateGlobalLawyers(next);
    safeStorage.removeItem(`ai_usage_lawyer_${id}`);

    if (simulatedLawyerId === id) {
      safeStorage.setItem("qadeyti_simulated_lawyer_id", "owner");
      setSimulatedLawyerId("owner");
    }

    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("storage"));
    }

    if (user) {
      try {
        const { error } = await supabase.from("firm_lawyers").delete().eq("id", id);

        if (error) {
          console.error("Failed to delete firm lawyer in Supabase:", error);
        }
      } catch (err) {
        console.error("Exception deleting firm lawyer:", err);
      }
    }
  };

  const getLawyerAIUsage = (lawyerId: string): number => {
    const dbLawyer = firmLawyers.find((l) => l.id === lawyerId);
    if (dbLawyer && user) {
      return dbLawyer.aiUsage;
    }

    const key = `ai_usage_lawyer_${lawyerId}`;
    const raw = safeStorage.getItem(key);
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    if (!raw) {
      if (lawyerId === "1") return 34;
      if (lawyerId === "2") return 12;
      if (lawyerId === "3") return 8;
      return 0;
    }
    try {
      const data = JSON.parse(raw);
      if (data.month === currentMonth) {
        return data.count || 0;
      }
    } catch {
      // Ignored
    }
    return 0;
  };

  const incrementLawyerAIUsage = async (lawyerId: string) => {
    const key = `ai_usage_lawyer_${lawyerId}`;
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const currentCount = getLawyerAIUsage(lawyerId);
    const nextCount = Math.min(600, currentCount + 1);
    safeStorage.setItem(
      key,
      JSON.stringify({
        month: currentMonth,
        count: nextCount,
      }),
    );

    const updatedLawyers = firmLawyers.map((l) => {
      if (l.id === lawyerId) {
        return { ...l, aiUsage: nextCount };
      }
      return l;
    });
    setFirmLawyersState(updatedLawyers);
    updateGlobalLawyers(updatedLawyers);

    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("storage"));
    }

    if (user) {
      try {
        const { error } = await supabase
          .from("firm_lawyers")
          .update({ ai_usage: nextCount })
          .eq("id", lawyerId);

        if (error) {
          console.error("Failed to increment lawyer AI usage in Supabase:", error);
        }
      } catch (err) {
        console.error("Exception incrementing lawyer AI usage:", err);
      }
    }
  };

  const getAIChatUsage = useCallback(
    (userId: string): number => {
      if (user) {
        const match = firmLawyers.find(
          (l) => l.email?.toLowerCase().trim() === user.email?.toLowerCase().trim(),
        );
        if (match) {
          return match.aiUsage;
        }
      }

      const key = `ai_usage_${userId}`;
      const raw = safeStorage.getItem(key);
      const now = new Date();
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

      if (!raw) return 0;
      try {
        const data = JSON.parse(raw);
        if (data.month === currentMonth) {
          return data.count || 0;
        }
      } catch (e) {
        console.error("Failed to parse AI usage", e);
      }
      return 0;
    },
    [user, firmLawyers],
  );

  useEffect(() => {
    const isFirmLawyer = firmLawyers.some(
      (l) => l.email?.toLowerCase().trim() === user?.email?.toLowerCase().trim(),
    );

    if (user?.email?.toLowerCase().trim() === "meetozacoin@gmail.com" || isFirmLawyer) {
      if (plan !== "enterprise") {
        setPlanState("enterprise");
        safeStorage.setItem("qadeyti_plan", "enterprise");
        safeStorage.setItem("qadeyti_premium", "true");
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("storage"));
        }
      }

      // Automatically impersonate the lawyer if they are signed in as a firm lawyer
      if (isFirmLawyer && user) {
        const matchingLawyer = firmLawyers.find(
          (l) => l.email?.toLowerCase().trim() === user.email?.toLowerCase().trim(),
        );
        if (matchingLawyer && simulatedLawyerId !== matchingLawyer.id) {
          setSimulatedLawyerId(matchingLawyer.id);
          safeStorage.setItem("qadeyti_simulated_lawyer_id", matchingLawyer.id);
        }
      } else if (user?.email?.toLowerCase().trim() === "meetozacoin@gmail.com") {
        // Owner can proceed with whatever is stored, default to owner
        const cur = safeStorage.getItem("qadeyti_simulated_lawyer_id") || "owner";
        if (simulatedLawyerId !== cur) {
          setSimulatedLawyerId(cur);
        }
      }
    } else {
      const fallbackPlan = safeStorage.getItem("qadeyti_fallback_plan") as QadeytiPlan;
      const userMetadataPlan = user?.user_metadata?.qadeyti_plan as QadeytiPlan;
      const localStoragePlan = safeStorage.getItem("qadeyti_plan") as QadeytiPlan;

      // Prioritize any paid plan found across all sources to avoid resetting to "free"
      let storedPlan: QadeytiPlan = "free";
      if (fallbackPlan && fallbackPlan !== "free") {
        storedPlan = fallbackPlan;
      } else if (userMetadataPlan && userMetadataPlan !== "free") {
        storedPlan = userMetadataPlan;
      } else if (localStoragePlan && localStoragePlan !== "free") {
        storedPlan = localStoragePlan;
      } else if (userMetadataPlan) {
        storedPlan = userMetadataPlan;
      } else if (fallbackPlan) {
        storedPlan = fallbackPlan;
      } else if (localStoragePlan) {
        storedPlan = localStoragePlan;
      }

      const isPremiumOld = safeStorage.getItem("qadeyti_premium") === "true";

      let nextPlan: QadeytiPlan = "free";
      if (storedPlan && PLAN_LIMITS[storedPlan]) {
        nextPlan = storedPlan;
      } else if (isPremiumOld) {
        nextPlan = "pro";
      }

      if (plan !== nextPlan) {
        setPlanState(nextPlan);
        safeStorage.setItem("qadeyti_plan", nextPlan);
        safeStorage.setItem("qadeyti_premium", nextPlan !== "free" ? "true" : "false");
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("storage"));
        }
      }

      // Sync unpaid status from user metadata if set
      const userMetadataUnpaid = user?.user_metadata?.qadeyti_subscription_unpaid;
      if (userMetadataUnpaid !== undefined) {
        const nextUnpaid = userMetadataUnpaid === true;
        if (isSubscriptionUnpaid !== nextUnpaid) {
          setIsSubscriptionUnpaidState(nextUnpaid);
          safeStorage.setItem("qadeyti_subscription_unpaid", nextUnpaid ? "true" : "false");
          if (typeof window !== "undefined") {
            window.dispatchEvent(new Event("storage"));
          }
        }
      }
    }

    if (user) {
      const currentUsage = getAIChatUsage(user.id);
      if (aiCount !== currentUsage) {
        setAiCount(currentUsage);
      }
    }

    const handleStorageChange = () => {
      const storedPlan = safeStorage.getItem("qadeyti_plan") as QadeytiPlan;
      if (storedPlan && PLAN_LIMITS[storedPlan]) {
        setPlanState((prev) => (prev !== storedPlan ? storedPlan : prev));
      }
      if (user) {
        const usage = getAIChatUsage(user.id);
        setAiCount((prev) => (prev !== usage ? usage : prev));
      }
      const unpaid = safeStorage.getItem("qadeyti_subscription_unpaid") === "true";
      setIsSubscriptionUnpaidState((prev) => (prev !== unpaid ? unpaid : prev));

      const storedLawyers = safeStorage.getItem("qadeyti_firm_lawyers");
      if (storedLawyers) {
        try {
          const parsed = JSON.parse(storedLawyers);
          // Only update if array serialized contents are actually different (to prevent infinite loop due to custom storage dispatches)
          setFirmLawyersState((prev) => {
            if (JSON.stringify(prev) === storedLawyers) {
              return prev;
            }
            return parsed;
          });
        } catch (e) {
          console.debug("Failed parsing stored lawyers", e);
        }
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("storage", handleStorageChange);
      return () => window.removeEventListener("storage", handleStorageChange);
    }
  }, [user, firmLawyers, plan, simulatedLawyerId, aiCount, getAIChatUsage]);

  const togglePremium = (val: boolean) => {
    const nextPlan = val ? "pro" : "free";
    setPlanState(nextPlan);
    safeStorage.setItem("qadeyti_plan", nextPlan);
    safeStorage.setItem("qadeyti_premium", val ? "true" : "false");
    if (user) {
      supabase.auth
        .updateUser({
          data: { qadeyti_plan: nextPlan },
        })
        .catch((err) => console.error("Error saving plan to user metadata:", err));
    }
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("storage"));
    }
  };

  const setPlan = (nextPlan: QadeytiPlan) => {
    setPlanState(nextPlan);
    safeStorage.setItem("qadeyti_plan", nextPlan);
    safeStorage.setItem("qadeyti_premium", nextPlan !== "free" ? "true" : "false");
    if (user) {
      supabase.auth
        .updateUser({
          data: { qadeyti_plan: nextPlan },
        })
        .catch((err) => console.error("Error saving plan to user metadata:", err));
    }
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("storage"));
    }
  };

  const setSubscriptionUnpaid = (unpaid: boolean) => {
    setIsSubscriptionUnpaidState(unpaid);
    safeStorage.setItem("qadeyti_subscription_unpaid", unpaid ? "true" : "false");
    if (user && supabase) {
      supabase.auth
        .updateUser({
          data: { qadeyti_subscription_unpaid: unpaid },
        })
        .catch((err) => console.error("Error saving unpaid to user metadata:", err));
    }
    const isPremiumOld = safeStorage.getItem("qadeyti_premium") === "true";
    if (unpaid) {
      // Keep state clean
    }
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("storage"));
    }
  };

  const incrementAIChatUsage = async () => {
    if (!user) return;

    const subLawyerMatch = firmLawyers.find(
      (l) => l.email?.toLowerCase().trim() === user.email?.toLowerCase().trim(),
    );

    if (subLawyerMatch) {
      await incrementLawyerAIUsage(subLawyerMatch.id);
    } else {
      const key = `ai_usage_${user.id}`;
      const now = new Date();
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      const currentCount = getAIChatUsage(user.id);
      const nextCount = currentCount + 1;

      safeStorage.setItem(
        key,
        JSON.stringify({
          month: currentMonth,
          count: nextCount,
        }),
      );
      setAiCount(nextCount);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("storage"));
      }
    }
  };

  const impersonateLawyer = (lawyerId: string) => {
    safeStorage.setItem("qadeyti_simulated_lawyer_id", lawyerId);
    setSimulatedLawyerId(lawyerId);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("storage"));
    }
  };

  const cancelImpersonation = () => {
    safeStorage.setItem("qadeyti_simulated_lawyer_id", "owner");
    setSimulatedLawyerId("owner");
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("storage"));
    }
  };

  // Synchronize impersonation changes if triggered elsewhere
  useEffect(() => {
    const handleStorageImpersonation = () => {
      const active = safeStorage.getItem("qadeyti_simulated_lawyer_id") || "owner";
      setSimulatedLawyerId(active);
    };
    if (typeof window !== "undefined") {
      window.addEventListener("storage", handleStorageImpersonation);
      return () => window.removeEventListener("storage", handleStorageImpersonation);
    }
  }, []);

  // Sync client subscription if there's a fallback database entry on the server
  useEffect(() => {
    if (!user?.email) return;

    let active = true;

    const queryFallbackActivation = async () => {
      try {
        const { checkActivationForUser } = await import("@/lib/activation-check.functions");
        const cleanedEmail = user.email ? user.email.toLowerCase().trim() : "";
        if (!cleanedEmail) return;

        // Skip fallback activation checking/downgrading for admin & firm lawyers to guarantee eternal enterprise access!
        const isFirmLawyer = firmLawyers.some(
          (l) => l.email?.toLowerCase().trim() === cleanedEmail,
        );
        if (cleanedEmail === "meetozacoin@gmail.com" || isFirmLawyer) {
          return;
        }

        const act = await checkActivationForUser({
          data: {
            email: cleanedEmail,
            userId: user.id,
          },
        });
        if (act && active) {
          safeStorage.setItem("qadeyti_fallback_plan", act.plan);
          const currentPlan = safeStorage.getItem("qadeyti_plan");
          const isUnpaid = safeStorage.getItem("qadeyti_subscription_unpaid") === "true";

          if (currentPlan !== act.plan || isUnpaid) {
            console.log(
              "[Fallback Sync] Updating local subscription state to matching plan:",
              act.plan,
            );
            setPlanState(act.plan as QadeytiPlan);
            setIsSubscriptionUnpaidState(false);

            safeStorage.setItem("qadeyti_plan", act.plan);
            safeStorage.setItem("qadeyti_premium", act.plan !== "free" ? "true" : "false");
            safeStorage.setItem("qadeyti_subscription_unpaid", "false");

            await supabase.auth.updateUser({
              data: {
                qadeyti_plan: act.plan,
                qadeyti_subscription_unpaid: false,
                qadeyti_subscription_expiry: act.expiryDate,
                qadeyti_subscription_activation: act.activationDate,
              },
            });

            if (typeof window !== "undefined") {
              window.dispatchEvent(new Event("storage"));
            }
          }
        } else if (!act && active) {
          safeStorage.removeItem("qadeyti_fallback_plan");

          // Never perform raw fallback downgrades if the user has a valid paid plan in their auth user_metadata.
          // This ensures that any admin-assigned or real Supabase subscription metadata takes absolute precedence!
          const userMetadataPlan = user?.user_metadata?.qadeyti_plan as QadeytiPlan;
          if (userMetadataPlan && userMetadataPlan !== "free") {
            const currentPlan = safeStorage.getItem("qadeyti_plan");
            if (currentPlan !== userMetadataPlan) {
              setPlanState(userMetadataPlan);
              safeStorage.setItem("qadeyti_plan", userMetadataPlan);
              safeStorage.setItem("qadeyti_premium", "true");
              if (typeof window !== "undefined") {
                window.dispatchEvent(new Event("storage"));
              }
            }
          } else {
            const currentPlan = safeStorage.getItem("qadeyti_plan");
            if (currentPlan && currentPlan !== "free") {
              setPlanState("free");
              safeStorage.setItem("qadeyti_plan", "free");
              safeStorage.setItem("qadeyti_premium", "false");
              if (typeof window !== "undefined") {
                window.dispatchEvent(new Event("storage"));
              }
            }
          }
        }
      } catch (err) {
        console.warn("Failed checking for fallback activation syncing:", err);
      }
    };

    queryFallbackActivation();

    return () => {
      active = false;
    };
  }, [user?.email, user?.id, firmLawyers]);

  if (!user) {
    return {
      isTrialActive: false,
      daysRemaining: 0,
      isTrialExpired: false,
      isPremium: plan !== "free",
      plan,
      limits: PLAN_LIMITS[plan] || PLAN_LIMITS["free"],
      isSubscriptionUnpaid,
      setSubscriptionUnpaid,
      aiCount: 0,
      firmLawyers,
      addFirmLawyer,
      deleteFirmLawyer,
      getLawyerAIUsage,
      incrementLawyerAIUsage,
      togglePremium,
      setPlan,
      incrementAIChatUsage,
      simulatedLawyerId: "owner",
      ownerId: "owner",
      impersonateLawyer: () => {},
      cancelImpersonation: () => {},
    };
  }

  const isPremium = plan !== "free";

  return {
    isTrialActive: false,
    daysRemaining: 0,
    isTrialExpired: false,
    isPremium,
    plan,
    limits: PLAN_LIMITS[plan] || PLAN_LIMITS["free"],
    isSubscriptionUnpaid,
    setSubscriptionUnpaid,
    aiCount,
    firmLawyers,
    addFirmLawyer,
    deleteFirmLawyer,
    getLawyerAIUsage,
    incrementLawyerAIUsage,
    togglePremium,
    setPlan,
    incrementAIChatUsage,
    simulatedLawyerId,
    ownerId,
    impersonateLawyer,
    cancelImpersonation,
  };
}
