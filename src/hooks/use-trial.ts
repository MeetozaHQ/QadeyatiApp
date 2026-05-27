import { useAuth } from "@/lib/auth-context";
import { useEffect, useState } from "react";

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
    maxCases: 3,
    maxAIChats: 15,
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
    maxAIChats: 2000,
    hasGoogleDrive: true,
    googleDriveMode: "full",
    hasFinancials: true,
    hasNotifications: true,
    hasDeepAIAnalysis: true,
    hasOwnerDashboard: true,
  },
};

export function useTrial() {
  const { user } = useAuth();
  const [plan, setPlanState] = useState<QadeytiPlan>("free");
  const [aiCount, setAiCount] = useState<number>(0);

  const getAIChatUsage = (userId: string): number => {
    if (typeof window === "undefined") return 0;
    const key = `ai_usage_${userId}`;
    const raw = localStorage.getItem(key);
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
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (user?.email === "meetozacoin@gmail.com" && !localStorage.getItem("qadeyti_plan_initialized_meetozacoin")) {
        setPlanState("enterprise");
        localStorage.setItem("qadeyti_plan", "enterprise");
        localStorage.setItem("qadeyti_premium", "true");
        localStorage.setItem("qadeyti_plan_initialized_meetozacoin", "true");
        window.dispatchEvent(new Event("storage"));
      } else {
        const storedPlan = localStorage.getItem("qadeyti_plan") as QadeytiPlan;
        const isPremiumOld = localStorage.getItem("qadeyti_premium") === "true";

        if (storedPlan && PLAN_LIMITS[storedPlan]) {
          setPlanState(storedPlan);
        } else if (isPremiumOld) {
          setPlanState("pro");
          localStorage.setItem("qadeyti_plan", "pro");
        } else {
          setPlanState("free");
          localStorage.setItem("qadeyti_plan", "free");
        }
      }
    }

    if (user) {
      setAiCount(getAIChatUsage(user.id));
    }

    const handleStorageChange = () => {
      const storedPlan = localStorage.getItem("qadeyti_plan") as QadeytiPlan;
      if (storedPlan && PLAN_LIMITS[storedPlan]) {
        setPlanState(storedPlan);
      }
      if (user) {
        setAiCount(getAIChatUsage(user.id));
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [user]);

  const togglePremium = (val: boolean) => {
    const nextPlan = val ? "pro" : "free";
    setPlanState(nextPlan);
    if (typeof window !== "undefined") {
      localStorage.setItem("qadeyti_plan", nextPlan);
      localStorage.setItem("qadeyti_premium", val ? "true" : "false");
      window.dispatchEvent(new Event("storage"));
    }
  };

  const setPlan = (nextPlan: QadeytiPlan) => {
    setPlanState(nextPlan);
    if (typeof window !== "undefined") {
      localStorage.setItem("qadeyti_plan", nextPlan);
      localStorage.setItem("qadeyti_premium", nextPlan !== "free" ? "true" : "false");
      window.dispatchEvent(new Event("storage"));
    }
  };

  const incrementAIChatUsage = () => {
    if (!user || typeof window === "undefined") return;
    const key = `ai_usage_${user.id}`;
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const currentCount = getAIChatUsage(user.id);
    const nextCount = currentCount + 1;

    localStorage.setItem(
      key,
      JSON.stringify({
        month: currentMonth,
        count: nextCount,
      }),
    );
    setAiCount(nextCount);
    // Dispatch standard storage event to update other instances
    window.dispatchEvent(new Event("storage"));
  };

  if (!user) {
    return {
      isTrialActive: false,
      daysRemaining: 0,
      isTrialExpired: false,
      isPremium: false,
      plan: "free" as QadeytiPlan,
      limits: PLAN_LIMITS["free"],
      aiCount: 0,
      togglePremium,
      setPlan,
      incrementAIChatUsage,
    };
  }

  const isPremium = plan !== "free";

  // Get registration date or default to now
  const createdDate = user.created_at ? new Date(user.created_at) : new Date();
  const now = new Date();
  const diffTime = now.getTime() - createdDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const daysRemaining = Math.max(0, 7 - diffDays);
  // Only free tier expires after trial (paid tiers stay active)
  const isTrialExpired = diffDays >= 7 && plan === "free";

  return {
    isTrialActive: !isTrialExpired,
    daysRemaining,
    isTrialExpired,
    isPremium,
    plan,
    limits: PLAN_LIMITS[plan] || PLAN_LIMITS["free"],
    aiCount,
    togglePremium,
    setPlan,
    incrementAIChatUsage,
  };
}
