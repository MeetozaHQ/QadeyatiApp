import { useState, useEffect } from "react";

export type QadeytiPlan = "free" | "basic" | "pro" | "enterprise";

export interface PlanLimits {
  label: string;
  maxCases: number;
  maxAIChats: number;
}

export const PLAN_LIMITS: Record<QadeytiPlan, PlanLimits> = {
  free: {
    label: "الباقة المجانية (Free)",
    maxCases: 3,
    maxAIChats: 15,
  },
  basic: {
    label: "الباقة الفردية للـمُحامي (Basic)",
    maxCases: 50,
    maxAIChats: 100,
  },
  pro: {
    label: "باقة المحامي المحترف (Pro)",
    maxCases: 999999, // بلا حدود عملياً
    maxAIChats: 600,
  },
  enterprise: {
    label: "باقة المكاتب والشركات القانونية (Enterprise)",
    maxCases: 999999, // بلا حدود عملياً
    maxAIChats: 2000,
  },
};

export function useTrial() {
  const [isPremium, setIsPremium] = useState(true);
  const [plan, setPlanState] = useState<QadeytiPlan>("free");
  const [aiCount, setAiCount] = useState(0);

  // Default simulated trial days
  const daysRemaining = 5;
  const isTrialExpired = false;

  useEffect(() => {
    // Read current plan
    const storedPlan = localStorage.getItem("qadeyti_plan") as QadeytiPlan | null;
    if (storedPlan) {
      setPlanState(storedPlan);
      setIsPremium(storedPlan !== "free");
    } else {
      localStorage.setItem("qadeyti_plan", "free");
      setPlanState("free");
      setIsPremium(false);
    }

    // AI monthly tracking reset and counting check
    const today = new Date();
    const currentMonthKey = `${today.getFullYear()}-${today.getMonth() + 1}`;
    
    const storedMonth = localStorage.getItem("qadeyti_ai_month");
    if (storedMonth !== currentMonthKey) {
      localStorage.setItem("qadeyti_ai_month", currentMonthKey);
      localStorage.setItem("qadeyti_ai_count", "0");
      setAiCount(0);
    } else {
      const storedCount = localStorage.getItem("qadeyti_ai_count");
      setAiCount(storedCount ? parseInt(storedCount, 10) : 0);
    }

    const handleStorageChange = () => {
      const freshPlan = localStorage.getItem("qadeyti_plan") as QadeytiPlan | null;
      if (freshPlan) {
        setPlanState(freshPlan);
        setIsPremium(freshPlan !== "free");
      }
      const freshCount = localStorage.getItem("qadeyti_ai_count");
      setAiCount(freshCount ? parseInt(freshCount, 10) : 0);
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const setPlan = (newPlan: QadeytiPlan) => {
    localStorage.setItem("qadeyti_plan", newPlan);
    setPlanState(newPlan);
    setIsPremium(newPlan !== "free");
    
    // Dispatch standard event to sync components instantly
    window.dispatchEvent(new Event("storage"));
  };

  const togglePremium = (enabled: boolean) => {
    const nextPlan: QadeytiPlan = enabled ? "basic" : "free";
    setPlan(nextPlan);
  };

  const incrementAIChatUsage = () => {
    const nextCount = aiCount + 1;
    localStorage.setItem("qadeyti_ai_count", String(nextCount));
    setAiCount(nextCount);
    window.dispatchEvent(new Event("storage"));
  };

  const limits = PLAN_LIMITS[plan];

  return {
    isTrialExpired,
    daysRemaining,
    isPremium,
    plan,
    limits,
    aiCount,
    setPlan,
    togglePremium,
    incrementAIChatUsage,
  };
}