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

export interface FirmLawyer {
  id: string;
  name: string;
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
    role: "محامٍ شريك",
    status: "active",
    casesCount: 20,
    aiUsage: 34,
    avatarLetter: "ن",
  },
  {
    id: "2",
    name: "أ. فاطمة الزهراء",
    role: "محامٍ استئناف",
    status: "active",
    casesCount: 15,
    aiUsage: 12,
    avatarLetter: "ف",
  },
  {
    id: "3",
    name: "أ. أحمد الشاذلي",
    role: "محامٍ تحت التمرين",
    status: "active",
    casesCount: 12,
    aiUsage: 8,
    avatarLetter: "أ",
  },
];

export function useTrial() {
  const { user } = useAuth();
  const [plan, setPlanState] = useState<QadeytiPlan>(() => {
    if (typeof window !== "undefined") {
      const storedPlan = localStorage.getItem("qadeyti_plan") as QadeytiPlan;
      if (storedPlan && PLAN_LIMITS[storedPlan]) {
        return storedPlan;
      }
      const isPremiumOld = localStorage.getItem("qadeyti_premium") === "true";
      if (isPremiumOld) return "pro";
    }
    return "free";
  });
  const [aiCount, setAiCount] = useState<number>(0);

  const [firmLawyers, setFirmLawyersState] = useState<FirmLawyer[]>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("qadeyti_firm_lawyers");
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
        const raw = localStorage.getItem(key);
        let usage = lawyer.aiUsage;
        if (raw) {
          try {
            const data = JSON.parse(raw);
            if (data.month !== currentMonth) {
              usage = 0;
              localStorage.setItem(key, JSON.stringify({ month: currentMonth, count: 0 }));
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
          localStorage.setItem(key, JSON.stringify({ month: currentMonth, count: defaultCount }));
          usage = defaultCount;
          changed = true;
        }

        return { ...lawyer, aiUsage: usage };
      });

      if (changed) {
        localStorage.setItem("qadeyti_firm_lawyers", JSON.stringify(synced));
      }
      return synced;
    }
    return DEFAULT_FIRM_LAWYERS;
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("qadeyti_firm_lawyers");
      if (!stored) {
        localStorage.setItem("qadeyti_firm_lawyers", JSON.stringify(DEFAULT_FIRM_LAWYERS));
      }
    }
  }, []);

  const addFirmLawyer = (name: string, role: string) => {
    const formattedName = name.startsWith("أ.") ? name : `أ. ${name}`;
    const newId = String(Date.now());
    const newLawyer: FirmLawyer = {
      id: newId,
      name: formattedName,
      role: role || "محامٍ مشارك",
      status: "active",
      casesCount: 0,
      aiUsage: 0,
      avatarLetter: name[0],
    };
    const next = [...firmLawyers, newLawyer];
    setFirmLawyersState(next);
    if (typeof window !== "undefined") {
      localStorage.setItem("qadeyti_firm_lawyers", JSON.stringify(next));
      const now = new Date();
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      localStorage.setItem(
        `ai_usage_lawyer_${newId}`,
        JSON.stringify({ month: currentMonth, count: 0 }),
      );
      window.dispatchEvent(new Event("storage"));
    }
  };

  const deleteFirmLawyer = (id: string) => {
    const next = firmLawyers.filter((l) => l.id !== id);
    setFirmLawyersState(next);
    if (typeof window !== "undefined") {
      localStorage.setItem("qadeyti_firm_lawyers", JSON.stringify(next));
      localStorage.removeItem(`ai_usage_lawyer_${id}`);
      window.dispatchEvent(new Event("storage"));
    }
  };

  const getLawyerAIUsage = (lawyerId: string): number => {
    if (typeof window === "undefined") return 0;
    const key = `ai_usage_lawyer_${lawyerId}`;
    const raw = localStorage.getItem(key);
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
    if (typeof window === "undefined") return;
    const key = `ai_usage_lawyer_${lawyerId}`;
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const currentCount = getLawyerAIUsage(lawyerId);
    const nextCount = currentCount + 1;
    localStorage.setItem(
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
    localStorage.setItem("qadeyti_firm_lawyers", JSON.stringify(updatedLawyers));
    window.dispatchEvent(new Event("storage"));
  };

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
