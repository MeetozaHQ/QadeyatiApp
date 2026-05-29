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
  aiUsage: number;
  avatarLetter: string;
}

export const DEFAULT_FIRM_LAWYERS: FirmLawyer[] = [
  {
    id: "1",
    name: "أ. نور الدين علي",
    email: "nour.ali@qadeyti.eg",
    role: "محامٍ شريك",
    status: "active",
    casesCount: 20,
    aiUsage: 34,
    avatarLetter: "ن",
  },
  {
    id: "2",
    name: "أ. فاطمة الزهراء",
    email: "fatima.zahra@qadeyti.eg",
    role: "محامٍ استئناف",
    status: "active",
    casesCount: 15,
    aiUsage: 12,
    avatarLetter: "ف",
  },
  {
    id: "3",
    name: "أ. أحمد الشاذلي",
    email: "ahmed.shazly@qadeyti.eg",
    role: "محامٍ تحت التمرين",
    status: "active",
    casesCount: 12,
    aiUsage: 8,
    avatarLetter: "أ",
  },
];

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

  // Impersonation Simulator State
  const [simulatedLawyerId, setSimulatedLawyerId] = useState<string>(() => {
    return safeStorage.getItem("qadeyti_simulated_lawyer_id") || "owner";
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
        if (lawyer.id === "1") email = "nour.ali@qadeyti.eg";
        else if (lawyer.id === "2") email = "fatima.zahra@qadeyti.eg";
        else if (lawyer.id === "3") email = "ahmed.shazly@qadeyti.eg";
        else email = `${lawyer.id}@qadeyti.eg`;
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
    const stored = safeStorage.getItem("qadeyti_firm_lawyers");
    if (!stored) {
      safeStorage.setItem("qadeyti_firm_lawyers", JSON.stringify(DEFAULT_FIRM_LAWYERS));
    }

    // Subscribe to global in-memory pub-sub registry changes - guarantees instant page synchronization
    const handleGlobalUpdate = (nextArray: FirmLawyer[]) => {
      setFirmLawyersState(nextArray);
    };
    globalListeners.add(handleGlobalUpdate);

    return () => {
      globalListeners.delete(handleGlobalUpdate);
    };
  }, []);

  const addFirmLawyer = (name: string, email: string, role: string) => {
    const formattedName = name.startsWith("أ.") ? name : `أ. ${name}`;
    const newId = String(Date.now());
    const newLawyer: FirmLawyer = {
      id: newId,
      name: formattedName,
      email: email || `${newId}@qadeyti.eg`,
      role: role || "محامٍ مشارك",
      status: "active",
      casesCount: 0,
      aiUsage: 0,
      avatarLetter: name.replace("أ.", "").trim()[0] || "م",
    };
    const next = [...firmLawyers, newLawyer];
    updateGlobalLawyers(next);
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    safeStorage.setItem(
      `ai_usage_lawyer_${newId}`,
      JSON.stringify({ month: currentMonth, count: 0 }),
    );
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("storage"));
    }
  };

  const deleteFirmLawyer = (id: string) => {
    const next = firmLawyers.filter((l) => l.id !== id);
    updateGlobalLawyers(next);
    safeStorage.setItem("qadeyti_firm_lawyers", JSON.stringify(next));
    safeStorage.removeItem(`ai_usage_lawyer_${id}`);
    if (simulatedLawyerId === id) {
      safeStorage.setItem("qadeyti_simulated_lawyer_id", "owner");
      setSimulatedLawyerId("owner");
    }
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("storage"));
    }
  };

  const getLawyerAIUsage = (lawyerId: string): number => {
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

  const incrementLawyerAIUsage = (lawyerId: string) => {
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
    safeStorage.setItem("qadeyti_firm_lawyers", JSON.stringify(updatedLawyers));
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("storage"));
    }
  };

  const getAIChatUsage = (userId: string): number => {
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
  };

  useEffect(() => {
    const isFirmLawyer = firmLawyers.some(
      (l) => l.email?.toLowerCase().trim() === user?.email?.toLowerCase().trim(),
    );

    if (user?.email === "meetozacoin@gmail.com" || isFirmLawyer) {
      setPlanState("enterprise");
      safeStorage.setItem("qadeyti_plan", "enterprise");
      safeStorage.setItem("qadeyti_premium", "true");
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("storage"));
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
      } else if (user?.email === "meetozacoin@gmail.com") {
        // Owner can proceed with whatever is stored, default to owner
        const cur = safeStorage.getItem("qadeyti_simulated_lawyer_id") || "owner";
        if (simulatedLawyerId !== cur) {
          setSimulatedLawyerId(cur);
        }
      }
    } else {
      const storedPlan = safeStorage.getItem("qadeyti_plan") as QadeytiPlan;
      const isPremiumOld = safeStorage.getItem("qadeyti_premium") === "true";

      if (storedPlan && PLAN_LIMITS[storedPlan]) {
        setPlanState(storedPlan);
      } else if (isPremiumOld) {
        setPlanState("pro");
        safeStorage.setItem("qadeyti_plan", "pro");
      } else {
        setPlanState("free");
        safeStorage.setItem("qadeyti_plan", "free");
      }
    }

    if (user) {
      setAiCount(getAIChatUsage(user.id));
    }

    const handleStorageChange = () => {
      const storedPlan = safeStorage.getItem("qadeyti_plan") as QadeytiPlan;
      if (storedPlan && PLAN_LIMITS[storedPlan]) {
        setPlanState(storedPlan);
      }
      if (user) {
        setAiCount(getAIChatUsage(user.id));
      }
      const storedLawyers = safeStorage.getItem("qadeyti_firm_lawyers");
      if (storedLawyers) {
        try {
          setFirmLawyersState(JSON.parse(storedLawyers));
        } catch (e) {
          console.debug(e);
        }
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("storage", handleStorageChange);
      return () => window.removeEventListener("storage", handleStorageChange);
    }
  }, [user, firmLawyers]);

  const togglePremium = (val: boolean) => {
    const nextPlan = val ? "pro" : "free";
    setPlanState(nextPlan);
    safeStorage.setItem("qadeyti_plan", nextPlan);
    safeStorage.setItem("qadeyti_premium", val ? "true" : "false");
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("storage"));
    }
  };

  const setPlan = (nextPlan: QadeytiPlan) => {
    setPlanState(nextPlan);
    safeStorage.setItem("qadeyti_plan", nextPlan);
    safeStorage.setItem("qadeyti_premium", nextPlan !== "free" ? "true" : "false");
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("storage"));
    }
  };

  const incrementAIChatUsage = () => {
    if (!user) return;
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

  if (!user) {
    return {
      isTrialActive: false,
      daysRemaining: 0,
      isTrialExpired: false,
      isPremium: plan !== "free",
      plan,
      limits: PLAN_LIMITS[plan] || PLAN_LIMITS["free"],
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
    impersonateLawyer,
    cancelImpersonation,
  };
}
